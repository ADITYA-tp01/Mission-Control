"""Demo Infrastructure MCP Server for MissionControl.

Exposes simulated infrastructure tools to the TrueForge agent over
streamable-http (port 8000) and a plain JSON REST API for the dashboard
on port 8001 (see http_api.py).
"""

import json
import threading

from mcp.server.fastmcp import FastMCP

from state import get_state
from http_api import serve_forever as serve_rest_api


MCP_HOST = "0.0.0.0"
MCP_PORT = 8000

mcp = FastMCP(
    "demo-infra",
    host=MCP_HOST,
    port=MCP_PORT,
    instructions=(
        "Tools for investigating and remediating incidents on a simulated "
        "production system (api-gateway, payment-service, user-service, "
        "notification-service). Read tools need no approval; rollback_deploy "
        "and restart_service are irreversible and require human approval."
    ),
)


# ============================================================
# READ-ONLY TOOLS (no approval required)
# ============================================================

@mcp.tool()
def get_service_health() -> str:
    """Get health status of all demo services.

    Returns a summary of each service including status, version,
    error rate, and latency. Call this first when investigating.
    """
    state = get_state()
    health = state.get_service_health()
    return json.dumps(health, indent=2)


@mcp.tool()
def get_error_metrics(service: str) -> str:
    """Get current error rate and latency for a specific service.
    
    Args:
        service: Name of the service (e.g., "api-gateway", "payment-service",
                 "user-service", "notification-service")
    """
    state = get_state()
    metrics = state.get_error_metrics(service)
    return json.dumps(metrics, indent=2)


@mcp.tool()
def get_recent_deploys(limit: int = 5) -> str:
    """Get recent deployments with diffs.
    
    Args:
        limit: Maximum number of deploys to return (default 5)
    """
    state = get_state()
    deploys = state.get_recent_deploys(limit)
    result = []
    for d in deploys:
        result.append({
            "id": d.id,
            "service": d.service,
            "version": d.version,
            "timestamp": d.timestamp,
            "changes": d.changes,
            "author": d.author,
        })
    return json.dumps(result, indent=2)


@mcp.tool()
def get_service_logs(service: str, limit: int = 50, level: str = "") -> str:
    """Get recent log entries for a service.
    
    Args:
        service: Name of the service
        limit: Maximum number of log entries (default 50)
        level: Filter by log level (INFO, WARN, ERROR, DEBUG) - optional
    """
    state = get_state()
    logs = state.get_service_logs(service, limit, level if level else None)
    result = []
    for log in logs:
        result.append({
            "timestamp": log.timestamp,
            "service": log.service,
            "level": log.level,
            "message": log.message,
        })
    return json.dumps(result, indent=2)


@mcp.tool()
def inject_chaos(service: str, chaos_type: str = "error_spike") -> str:
    """Inject a failure scenario into a service. Fires an alert and adds
    incident timeline events.

    Args:
        service: Name of the service to affect
        chaos_type: One of "error_spike", "latency_spike", "outage",
                    "cascading_failure"
    """
    state = get_state()
    result = state.inject_chaos(service, chaos_type)
    return json.dumps(result, indent=2)


@mcp.tool()
def get_incident_timeline() -> str:
    """Get the current incident timeline."""
    state = get_state()
    timeline = state.get_incident_timeline()
    result = []
    for event in timeline:
        result.append({
            "timestamp": event.timestamp,
            "type": event.type,
            "description": event.description,
            "actor": event.actor,
        })
    return json.dumps(result, indent=2)


# ============================================================
# WRITING TOOLS (require approval)
# ============================================================

@mcp.tool()
def rollback_deploy(service: str, deploy_id: str) -> str:
    """Roll back a service to the version deployed before deploy_id. IRREVERSIBLE.

    THIS TOOL REQUIRES HUMAN APPROVAL. Ask the human to approve before calling.

    Args:
        service: Name of the service to rollback
        deploy_id: ID of the bad deploy to roll back from (e.g., "deploy-003")
    """
    state = get_state()
    result = state.rollback_deploy(service, deploy_id)
    return json.dumps(result, indent=2)


@mcp.tool()
def restart_service(service: str) -> str:
    """Restart a service. IRREVERSIBLE.

    THIS TOOL REQUIRES HUMAN APPROVAL. Ask the human to approve before calling.

    Args:
        service: Name of the service to restart
    """
    state = get_state()
    result = state.restart_service(service)
    return json.dumps(result, indent=2)


def _start_background_services() -> None:
    """Start the REST sidecar and the metrics sampler."""
    threading.Thread(target=serve_rest_api, name="rest-api", daemon=True).start()

    def sampler() -> None:
        import time

        while True:
            time.sleep(5)
            try:
                get_state().record_metric_sample()
            except Exception:
                pass

    threading.Thread(target=sampler, name="metrics-sampler", daemon=True).start()


if __name__ == "__main__":
    _start_background_services()
    print(f"demo-infra MCP server (streamable-http) on http://{MCP_HOST}:{MCP_PORT}/mcp")
    print(f"demo-infra REST API on http://{MCP_HOST}:8001")
    mcp.run(transport="streamable-http")