"""Simulated infrastructure state for the demo-infra MCP server.

A single in-memory model of four services with deploys, logs, alerts,
an incident timeline and rolling metrics history. All accessors are
thread-safe because both the MCP server (streamable-http) and the REST
sidecar run inside one process.
"""

import random
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


BASELINE_ERROR_RATE = 0.4
BASELINE_LATENCY = 120
MAX_METRIC_POINTS = 240
MAX_LOGS = 600
MAX_ALERTS = 50

CHAOS_PROFILES = {
    "error_spike": {"error_rate": 12.3, "latency_p99": 2400, "status": "degraded"},
    "latency_spike": {"error_rate": 2.1, "latency_p99": 8500, "status": "degraded"},
    "outage": {"error_rate": 98.0, "latency_p99": 30000, "status": "down"},
    "cascading_failure": {"error_rate": 15.0, "latency_p99": 5000, "status": "down"},
}

SERVICE_DEPENDENCIES = {
    "api-gateway": ["payment-service", "user-service", "notification-service"],
    "payment-service": ["user-service"],
    "user-service": [],
    "notification-service": [],
}


@dataclass
class Service:
    name: str
    version: str
    status: str = "healthy"
    error_rate: float = BASELINE_ERROR_RATE
    latency_p99: int = BASELINE_LATENCY
    requests_per_minute: int = 1200
    last_deploy: Optional[str] = None


@dataclass
class Deploy:
    id: str
    service: str
    version: str
    timestamp: str
    changes: List[str]
    author: str


@dataclass
class LogEntry:
    timestamp: str
    service: str
    level: str
    message: str


@dataclass
class IncidentEvent:
    timestamp: str
    type: str
    description: str
    actor: str  # "agent" | "human" | "system"


@dataclass
class Alert:
    id: str
    service: str
    severity: str  # "critical" | "warning" | "info"
    message: str
    timestamp: str
    acknowledged: bool = False


@dataclass
class MetricPoint:
    timestamp: str
    error_rate: float
    latency_p99: int
    status: str


class InfraState:
    """Manages simulated infrastructure state."""

    def __init__(self):
        self.lock = threading.RLock()
        self.services = {
            "api-gateway": Service("api-gateway", "v2.1.0", requests_per_minute=1200),
            "payment-service": Service("payment-service", "v1.8.3", requests_per_minute=800),
            "user-service": Service("user-service", "v3.0.1", requests_per_minute=1500),
            "notification-service": Service("notification-service", "v1.2.0", requests_per_minute=300),
        }
        self.deploys: List[Deploy] = [
            Deploy("deploy-001", "api-gateway", "v2.1.0", "2026-08-20T10:00:00Z",
                   ["Rate limiting improvements", "Circuit breaker config"], "alice"),
            Deploy("deploy-002", "payment-service", "v1.8.2", "2026-08-21T09:00:00Z",
                   ["Timeout tuning", "Connection pool sizing"], "bob"),
            Deploy("deploy-003", "payment-service", "v1.8.3", "2026-08-22T14:30:00Z",
                   ["Retry logic fix", "Idempotency keys"], "bob"),
            Deploy("deploy-004", "user-service", "v3.0.1", "2026-08-22T09:15:00Z",
                   ["Profile caching", "Session TTL fix"], "carol"),
            Deploy("deploy-005", "notification-service", "v1.2.0", "2026-08-22T16:45:00Z",
                   ["Webhook retry", "Template engine update"], "dave"),
        ]
        self.logs: List[LogEntry] = []
        self.incident_timeline: List[IncidentEvent] = []
        self.alerts: List[Alert] = []
        self.metrics_history: Dict[str, List[MetricPoint]] = {}
        self.agent_sessions: Dict[str, str] = {}  # service -> TrueForge session id
        self.chaos_active: bool = False
        self.chaos_service: Optional[str] = None
        self.chaos_type: Optional[str] = None
        self.chaos_affected: List[str] = []  # all services degraded by the active chaos event
        self._alert_counter = 0
        self._initial_versions: Dict[str, str] = {
            name: svc.version for name, svc in self.services.items()
        }

        self._generate_initial_logs()
        for name in self.services:
            self.metrics_history[name] = [
                MetricPoint(_now(), BASELINE_ERROR_RATE, BASELINE_LATENCY, "healthy")
                for _ in range(10)
            ]

    # ------------------------------------------------------------
    # Baseline data
    # ------------------------------------------------------------

    def _generate_initial_logs(self) -> None:
        messages = [
            "Request processed successfully",
            "Cache hit ratio 0.92",
            "Database query completed in 12ms",
            "Health check passed",
            "Metrics exported to collector",
        ]
        levels = ["INFO", "INFO", "INFO", "DEBUG", "WARN"]
        base = datetime(2026, 8, 23, 0, 0, 0, tzinfo=timezone.utc)
        for i in range(120):
            svc = random.choice(list(self.services.keys()))
            self.logs.append(LogEntry(
                timestamp=base.isoformat().replace("+00:00", "Z"),
                service=svc,
                level=random.choice(levels),
                message=random.choice(messages),
            ))

    # ------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------

    def get_service(self, name: str) -> Optional[Service]:
        with self.lock:
            return self.services.get(name)

    def get_all_services(self) -> List[Service]:
        with self.lock:
            return list(self.services.values())

    def get_service_health(self) -> List[Dict]:
        with self.lock:
            return [
                {
                    "name": s.name,
                    "version": s.version,
                    "status": s.status,
                    "error_rate": round(s.error_rate, 2),
                    "latency_p99": s.latency_p99,
                    "requests_per_minute": s.requests_per_minute,
                }
                for s in self.services.values()
            ]

    def get_error_metrics(self, service: str) -> Dict:
        with self.lock:
            svc = self.services.get(service)
            if not svc:
                return {"error": f"Unknown service: {service}"}
            return {
                "service": svc.name,
                "version": svc.version,
                "status": svc.status,
                "error_rate": round(svc.error_rate, 2),
                "latency_p99": svc.latency_p99,
                "requests_per_minute": svc.requests_per_minute,
                "chaos_active": self.chaos_active and self.chaos_service == service,
            }

    def get_recent_deploys(self, limit: int = 5) -> List[Deploy]:
        with self.lock:
            return self.deploys[-limit:]

    def get_service_logs(self, service: str, limit: int = 50, level: Optional[str] = None) -> List[LogEntry]:
        with self.lock:
            filtered = [log for log in self.logs if log.service == service]
            if level:
                filtered = [log for log in filtered if log.level == level.upper()]
            return filtered[-limit:]

    def get_incident_timeline(self) -> List[IncidentEvent]:
        with self.lock:
            return list(self.incident_timeline)

    def get_alerts(self, include_acknowledged: bool = True) -> List[Alert]:
        with self.lock:
            alerts = list(self.alerts)
        if include_acknowledged:
            return alerts
        return [a for a in alerts if not a.acknowledged]

    def get_metrics_history(self, service: str, limit: int = 60) -> List[MetricPoint]:
        with self.lock:
            history = self.metrics_history.get(service, [])
            return history[-limit:]

    def record_metric_sample(self) -> None:
        """Called periodically by the sampler thread."""
        with self.lock:
            for svc in self.services.values():
                jitter_e = svc.error_rate + random.uniform(-0.05, 0.05)
                jitter_l = svc.latency_p99 + random.randint(-8, 8)
                point = MetricPoint(
                    _now(),
                    max(0.0, round(jitter_e, 2)),
                    max(1, jitter_l),
                    svc.status,
                )
                self.metrics_history.setdefault(svc.name, []).append(point)
                if len(self.metrics_history[svc.name]) > MAX_METRIC_POINTS:
                    self.metrics_history[svc.name] = self.metrics_history[svc.name][-MAX_METRIC_POINTS:]

    # ------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------

    def add_log(self, log: LogEntry) -> None:
        with self.lock:
            self.logs.append(log)
            if len(self.logs) > MAX_LOGS:
                self.logs = self.logs[-MAX_LOGS:]

    def add_incident_event(self, actor: str, description: str, type_: str = "incident") -> None:
        with self.lock:
            self.incident_timeline.append(
                IncidentEvent(timestamp=_now(), type=type_, description=description, actor=actor)
            )

    def add_alert(self, service: str, severity: str, message: str) -> Alert:
        with self.lock:
            self._alert_counter += 1
            alert = Alert(
                id=f"alert-{self._alert_counter:04d}",
                service=service,
                severity=severity,
                message=message,
                timestamp=_now(),
            )
            self.alerts.append(alert)
            if len(self.alerts) > MAX_ALERTS:
                self.alerts = self.alerts[-MAX_ALERTS:]
            return alert

    def acknowledge_alert(self, alert_id: str) -> bool:
        with self.lock:
            for alert in self.alerts:
                if alert.id == alert_id:
                    if alert.acknowledged:
                        return False
                    alert.acknowledged = True
                    return True
            return False

    def attach_agent_session(self, service: str, session_id: str) -> None:
        with self.lock:
            self.agent_sessions[service] = session_id
        self.add_incident_event("system", f"Agent session {session_id} attached to {service} incident")

    def inject_chaos(self, service: str, chaos_type: str = "error_spike") -> Dict:
        with self.lock:
            # If chaos is already active, restore the previous origin
            # before applying the new event so it isn't orphaned.
            if self.chaos_active and self.chaos_service:
                for name in self.chaos_affected or [self.chaos_service]:
                    svc = self.services.get(name)
                    if svc:
                        svc.error_rate = BASELINE_ERROR_RATE
                        svc.latency_p99 = BASELINE_LATENCY
                        svc.status = "healthy"
                self.add_log(LogEntry(
                    timestamp=_now(),
                    service=self.chaos_service,
                    level="INFO",
                    message="Prior chaos cleared before new injection",
                ))

            profile = CHAOS_PROFILES.get(chaos_type)
            svc = self.services.get(service)
            if not profile or not svc:
                return {"status": "error", "message": f"Unknown service or chaos_type: {service}, {chaos_type}"}

            affected = [service]
            if chaos_type == "cascading_failure":
                affected.extend(SERVICE_DEPENDENCIES.get(service, []))

            for name in affected:
                target = self.services[name]
                p = dict(profile)
                if name != service:
                    p["error_rate"] = round(p["error_rate"] / 3, 2)
                    p["latency_p99"] = int(p["latency_p99"] * 0.6)
                    p["status"] = "degraded"
                target.error_rate = p["error_rate"]
                target.latency_p99 = p["latency_p99"]
                target.status = p["status"]
                for _ in range(15):
                    self.add_log(LogEntry(
                        timestamp=_now(),
                        service=name,
                        level="ERROR",
                        message=f"[{chaos_type}] request failed: upstream timeout / connection reset",
                    ))

            self.chaos_active = True
            self.chaos_service = service
            self.chaos_type = chaos_type
            self.chaos_affected = list(affected)

            severity = "critical" if profile["status"] == "down" else "warning"
            alert = self.add_alert(
                service,
                severity,
                f"{service}: {chaos_type.replace('_', ' ')} detected "
                f"(error rate {profile['error_rate']}%, p99 {profile['latency_p99']}ms)",
            )
            self.add_incident_event("system", f"Chaos injected: {chaos_type} on {service}")
            self.add_incident_event("system", f"Alert fired: {alert.id} ({severity})")
            self.record_metric_sample()

        return {
            "status": "success",
            "message": f"Injected {chaos_type} into {service}",
            "service": service,
            "chaos_type": chaos_type,
            "affected_services": affected,
            "alert": {
                "id": alert.id,
                "severity": alert.severity,
                "message": alert.message,
            },
        }

    def _clear_chaos_and_recover_dependents(self, root: str) -> List[str]:
        """End the active chaos event, restoring every service the event
        degraded (cascades hit dependencies; they must recover too).
        Must be called with the lock held and only when `root` is the
        chaos origin. Returns the list of restored services."""
        restored = []
        for name in self.chaos_affected or [root]:
            svc = self.services.get(name)
            if not svc:
                continue
            svc.error_rate = BASELINE_ERROR_RATE
            svc.latency_p99 = BASELINE_LATENCY
            svc.status = "healthy"
            if name != root:
                for _ in range(5):
                    self.add_log(LogEntry(
                        timestamp=_now(), service=name, level="INFO",
                        message="Recovery: upstream service restored, traffic resuming",
                    ))
                self.add_alert(name, "info", f"{name}: recovered after {root} remediation")
                restored.append(name)
        self.chaos_active = False
        self.chaos_service = None
        self.chaos_type = None
        self.chaos_affected = []
        return restored

    def rollback_deploy(self, service: str, deploy_id: str) -> Dict:
        with self.lock:
            svc = self.services.get(service)
            if not svc:
                return {"status": "error", "message": f"Unknown service: {service}"}

            deploy_idx = next((i for i, d in enumerate(self.deploys) if d.id == deploy_id), None)
            if deploy_idx is None:
                return {"status": "error", "message": f"Unknown deploy_id: {deploy_id}"}

            target = self.deploys[deploy_idx]
            if target.service != service:
                return {
                    "status": "error",
                    "message": f"Deploy {deploy_id} belongs to {target.service}, not {service}",
                }

            previous = next(
                (d for d in reversed(self.deploys[:deploy_idx]) if d.service == service), None
            )
            if previous is None:
                return {"status": "error", "message": f"No earlier deploy found for {service}"}

            rolled_back_to = previous.version

            svc.version = rolled_back_to
            svc.error_rate = BASELINE_ERROR_RATE
            svc.latency_p99 = BASELINE_LATENCY
            svc.status = "healthy"

            was_chaos = self.chaos_active
            if self.chaos_service == service:
                self._clear_chaos_and_recover_dependents(service)

            for _ in range(10):
                self.add_log(LogEntry(
                    timestamp=_now(), service=service, level="INFO",
                    message="Recovery: request processed successfully after rollback",
                ))

            self.add_alert(service, "info", f"{service}: rollback to {rolled_back_to} completed")
            self.add_incident_event("human" if not was_chaos else "agent",
                                    f"Rolled back {service} to {rolled_back_to} (from {deploy_id})")
            self.record_metric_sample()

        return {"status": "success", "message": f"Rolled back {service} to {rolled_back_to}", "version": rolled_back_to}

    def restart_service(self, service: str) -> Dict:
        with self.lock:
            svc = self.services.get(service)
            if not svc:
                return {"status": "error", "message": f"Unknown service: {service}"}

            svc.error_rate = BASELINE_ERROR_RATE
            svc.latency_p99 = BASELINE_LATENCY
            svc.status = "healthy"

            if self.chaos_service == service:
                self._clear_chaos_and_recover_dependents(service)

            for _ in range(10):
                self.add_log(LogEntry(
                    timestamp=_now(), service=service, level="INFO",
                    message="Recovery: service restarted, request processed successfully",
                ))

            self.add_alert(service, "info", f"{service}: restarted, health restored")
            self.add_incident_event("human", f"Restarted {service}")
            self.record_metric_sample()

        return {"status": "success", "message": f"Restarted {service}"}

    def reset_demo(self) -> Dict:
        with self.lock:
            for svc in self.services.values():
                svc.version = self._initial_versions[svc.name]
                svc.error_rate = BASELINE_ERROR_RATE
                svc.latency_p99 = BASELINE_LATENCY
                svc.status = "healthy"
            self.chaos_active = False
            self.chaos_service = None
            self.chaos_type = None
            self.chaos_affected = []
            self.alerts = []
            self.incident_timeline = []
            self.agent_sessions = {}
            self._alert_counter = 0
            # Regenerate the baseline log buffer so incident artifacts
            # (chaos ERROR spam, recovery INFO lines) don't leak across demos.
            self.logs = []
            self._generate_initial_logs()
            for name in self.services:
                self.metrics_history[name] = [
                    MetricPoint(_now(), BASELINE_ERROR_RATE, BASELINE_LATENCY, "healthy")
                    for _ in range(10)
                ]
        return {"status": "success", "message": "Demo state reset to baseline"}


_state = InfraState()


def get_state() -> InfraState:
    return _state
