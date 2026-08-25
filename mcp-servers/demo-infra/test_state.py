"""Tests for the demo-infra simulated state.

Run:  python -m pytest mcp-servers/demo-infra/test_state.py
      (or) python test_state.py
"""

from state import InfraState, BASELINE_ERROR_RATE


def make_state() -> InfraState:
    return InfraState()


def test_baseline_is_healthy():
    s = make_state()
    health = {h["name"]: h for h in s.get_service_health()}
    assert all(h["status"] == "healthy" for h in health.values())
    assert abs(health["payment-service"]["error_rate"] - BASELINE_ERROR_RATE) < 0.01


def test_chaos_error_spike_degrades_and_alerts():
    s = make_state()
    result = s.inject_chaos("payment-service", "error_spike")
    assert result["status"] == "success"
    svc = s.get_service("payment-service")
    assert svc.status == "degraded"
    assert svc.error_rate > 10
    alerts = s.get_alerts()
    assert len(alerts) == 1 and alerts[0].severity == "warning" and not alerts[0].acknowledged
    assert any("Chaos injected" in e.description for e in s.get_incident_timeline())


def test_rollback_restores_health():
    s = make_state()
    s.inject_chaos("payment-service", "error_spike")
    # deploy-003 is the bad payment-service deploy; rollback reverts to v1.8.2
    result = s.rollback_deploy("payment-service", "deploy-003")
    assert result["status"] == "success"
    assert "v1.8.2" in result["message"]
    svc = s.get_service("payment-service")
    assert svc.status == "healthy"
    assert abs(svc.error_rate - BASELINE_ERROR_RATE) < 0.01
    assert s.chaos_active is False
    metrics = s.get_metrics_history("payment-service")
    assert metrics[-1].status == "healthy"


def test_restart_clears_outage():
    s = make_state()
    s.inject_chaos("api-gateway", "outage")
    assert s.get_service("api-gateway").status == "down"
    assert s.restart_service("api-gateway")["status"] == "success"
    assert s.get_service("api-gateway").status == "healthy"


def test_cascading_failure_hits_dependencies():
    s = make_state()
    result = s.inject_chaos("api-gateway", "cascading_failure")
    affected = set(result["affected_services"])
    assert "payment-service" in affected and "user-service" in affected
    statuses = {h["name"]: h["status"] for h in s.get_service_health()}
    assert statuses["api-gateway"] == "down"
    assert statuses["payment-service"] == "degraded"


def test_rollback_validation():
    s = make_state()
    assert s.rollback_deploy("nope", "deploy-003")["status"] == "error"
    assert s.rollback_deploy("payment-service", "deploy-999")["status"] == "error"


def test_rollback_rejects_foreign_deploy():
    s = make_state()
    # deploy-003 belongs to payment-service; rolling back api-gateway with it must fail
    result = s.rollback_deploy("api-gateway", "deploy-003")
    assert result["status"] == "error"
    assert "belongs to" in result["message"]
    # and it must not have mutated anything
    assert s.get_service("api-gateway").version == "v2.1.0"


def test_acknowledge_alert():
    s = make_state()
    s.inject_chaos("user-service", "latency_spike")
    alert_id = s.get_alerts()[0].id
    assert s.acknowledge_alert(alert_id) is True
    assert s.acknowledge_alert(alert_id) is False  # second ack reports no change
    assert s.get_alerts(include_acknowledged=False) == []


def test_reset_demo():
    s = make_state()
    s.inject_chaos("payment-service", "error_spike")
    s.attach_agent_session("payment-service", "sess-123")
    assert s.reset_demo()["status"] == "success"
    assert s.get_alerts() == [] and s.agent_sessions == {}
    assert all(h["status"] == "healthy" for h in s.get_service_health())


def test_reset_restores_versions_and_logs():
    s = make_state()
    s.inject_chaos("payment-service", "error_spike")
    s.rollback_deploy("payment-service", "deploy-003")
    assert s.get_service("payment-service").version == "v1.8.2"  # rolled back
    assert s.reset_demo()["status"] == "success"
    # version restored to the seeded baseline
    assert s.get_service("payment-service").version == "v1.8.3"
    # incident log artifacts are gone after reset
    error_logs = [l for l in s.get_service_logs("payment-service", limit=500, level="ERROR")]
    assert error_logs == []


def test_cascade_recovery_restores_all_affected():
    s = make_state()
    result = s.inject_chaos("api-gateway", "cascading_failure")
    affected = set(result["affected_services"])
    assert s.restart_service("api-gateway")["status"] == "success"
    statuses = {h["name"]: h for h in s.get_service_health()}
    for name in affected:
        assert statuses[name]["status"] == "healthy", f"{name} left degraded after root restart"
        assert abs(statuses[name]["error_rate"] - BASELINE_ERROR_RATE) < 0.01
    assert s.chaos_active is False


def test_metric_sampler_appends():
    s = make_state()
    before = len(s.get_metrics_history("api-gateway"))
    s.record_metric_sample()
    assert len(s.get_metrics_history("api-gateway")) == before + 1


def test_limit_param_validator():
    from http_api import BadRequest, _int_param

    assert _int_param({"limit": "25"}, "limit", 60, 500) == 25
    assert _int_param({}, "limit", 60, 500) == 60
    for bad in ("abc", "0", "-5", "9999"):
        try:
            _int_param({"limit": bad}, "limit", 60, 500)
            raise AssertionError(f"expected BadRequest for {bad}")
        except BadRequest:
            pass


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"PASS {t.__name__}")
        except AssertionError as exc:
            failed += 1
            print(f"FAIL {t.__name__}: {exc}")
    raise SystemExit(1 if failed else 0)
