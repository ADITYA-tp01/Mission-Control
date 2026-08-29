"""Lightweight REST API sidecar for the demo-infra MCP server.

The TrueForge agent talks to the MCP tools over streamable-http (port 8000).
The Next.js dashboard needs plain JSON endpoints to render live state, so
this module serves those on port 8001 without adding any dependencies.

Run: python http_api.py  (started automatically by server.py)
"""

import hmac
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Tuple
from urllib.parse import urlparse, parse_qs

from state import get_state

# Loopback by default; must be 0.0.0.0 when running inside Docker
# so the published port is reachable from the host.
HOST = os.environ.get("DEMO_INFRA_HOST", "127.0.0.1")
PORT = 8001

# State-mutating POST endpoints require the shared token below. The default
# matches the dashboard and scripts so the local demo works out of the box;
# set DEMO_INFRA_TOKEN explicitly (compose/env) to secure a shared deployment.
DEFAULT_TOKEN = "local-demo-token"


def _authorized(headers: Any, client_addr: str) -> bool:
    """True when the request carries the shared mutation token."""
    expected = os.environ.get("DEMO_INFRA_TOKEN") or DEFAULT_TOKEN
    supplied = headers.get("Authorization", "")
    return hmac.compare_digest(supplied, f"Bearer {expected}")

SERVICE_RE = re.compile(r"^/api/services/([^/]+)/metrics$")
ALERT_ACK_RE = re.compile(r"^/api/alerts/([^/]+)/ack$")

# Browser traffic reaches this API only via the Next.js server-side proxy,
# so CORS is a convenience for local debugging, not an authorization layer.
CORS_ALLOWED_ORIGINS = {
    "http://localhost:8790",
    "http://localhost:3001",
    "http://127.0.0.1:8790",
    "http://127.0.0.1:3001",
}


class BadRequest(Exception):
    """Raised for malformed request parameters; mapped to HTTP 400."""


def _int_param(query: dict, key: str, default: int, maximum: int) -> int:
    raw = query.get(key, default)
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise BadRequest(f"'{key}' must be an integer, got: {raw!r}")
    if value < 1 or value > maximum:
        raise BadRequest(f"'{key}' must be between 1 and {maximum}, got: {value}")
    return value


def _body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", 0) or 0)
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    try:
        parsed = json.loads(raw.decode("utf-8"))
        return parsed if isinstance(parsed, dict) else {}
    except (ValueError, UnicodeDecodeError):
        return {}


def _json(payload: Any, status: int = 200) -> Tuple[int, bytes]:
    return status, json.dumps(payload, indent=2).encode("utf-8")


class DemoInfraAPIHandler(BaseHTTPRequestHandler):
    server_version = "DemoInfraAPI/1.0"

    def _send(self, status: int, payload: Any) -> None:
        code, body = _json(payload, status)
        origin = self.headers.get("Origin", "")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        if origin in CORS_ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: Any) -> None:
        pass  # keep container logs quiet

    # ------------------------------------------------------------
    # Routes
    # ------------------------------------------------------------

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send(204, {})

    def do_GET(self) -> None:  # noqa: N802
        try:
            self._handle_get()
        except BadRequest as exc:
            self._send(400, {"error": str(exc)})

    def _handle_get(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        state = get_state()

        if path in ("/", "/health"):
            self._send(200, {"status": "ok", "service": "demo-infra-api"})
            return

        if path == "/api/services":
            self._send(200, {"services": state.get_service_health(), "chaos": {
                "active": state.chaos_active,
                "service": state.chaos_service,
                "type": state.chaos_type,
            }})
            return

        match = SERVICE_RE.match(path)
        if match:
            service = match.group(1)
            if service not in state.services:
                self._send(404, {"error": f"Unknown service: {service}"})
                return
            metrics = state.get_error_metrics(service)
            history = state.get_metrics_history(
                service, limit=_int_param(query, "limit", 60, 500)
            )
            self._send(200, {
                "current": metrics,
                "history": [
                    {
                        "timestamp": p.timestamp,
                        "error_rate": p.error_rate,
                        "latency_p99": p.latency_p99,
                        "status": p.status,
                    }
                    for p in history
                ],
            })
            return

        if path == "/api/deploys":
            self._send(200, {"deploys": [
                {
                    "id": d.id, "service": d.service, "version": d.version,
                    "timestamp": d.timestamp, "changes": d.changes, "author": d.author,
                }
                for d in state.get_recent_deploys(limit=_int_param(query, "limit", 10, 100))
            ]})
            return

        if path == "/api/logs":
            service = query.get("service", "")
            logs = state.get_service_logs(
                service,
                limit=_int_param(query, "limit", 50, 500),
                level=query.get("level") or None,
            )
            self._send(200, {"logs": [
                {"timestamp": l.timestamp, "service": l.service, "level": l.level, "message": l.message}
                for l in logs
            ]})
            return

        if path == "/api/alerts":
            ack = query.get("acknowledged", "true").lower() != "false"
            self._send(200, {"alerts": [
                {"id": a.id, "service": a.service, "severity": a.severity,
                 "message": a.message, "timestamp": a.timestamp, "acknowledged": a.acknowledged}
                for a in state.get_alerts(include_acknowledged=ack)
            ]})
            return

        if path == "/api/timeline":
            self._send(200, {"timeline": [
                {"timestamp": e.timestamp, "type": e.type, "description": e.description, "actor": e.actor}
                for e in state.get_incident_timeline()
            ]})
            return

        if path == "/api/sessions":
            self._send(200, {"sessions": dict(state.agent_sessions)})
            return

        self._send(404, {"error": f"Not found: {path}"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path.rstrip("/")
        body = _body(self)
        state = get_state()

        if not _authorized(self.headers, self.client_address[0] if self.client_address else ""):
            self._send(401, {"status": "error",
                             "message": "unauthorized: send 'Authorization: Bearer <DEMO_INFRA_TOKEN>'"})
            return

        if path == "/api/chaos":
            result = state.inject_chaos(
                body.get("service", ""), body.get("chaos_type", "error_spike")
            )
            self._send(200 if result.get("status") == "success" else 400, result)
            return

        if path == "/api/remediate":
            # Intentional human bypass for demo scope: the dashboard's
            # hold-to-confirm control plays the "human operator" role here.
            # Approval semantics are enforced on the agent path (TrueForge
            # approval gates on the MCP tools), not on this endpoint.
            action = body.get("action")
            service = body.get("service", "")
            if action == "rollback":
                result = state.rollback_deploy(service, body.get("deploy_id", ""))
            elif action == "restart":
                result = state.restart_service(service)
            else:
                result = {"status": "error", "message": f"Unknown action: {action}"}
            self._send(200 if result.get("status") == "success" else 400, result)
            return

        match = ALERT_ACK_RE.match(path)
        if match:
            ok = state.acknowledge_alert(match.group(1))
            self._send(200 if ok else 404, {"status": "success" if ok else "error"})
            return

        if path == "/api/sessions":
            state.attach_agent_session(body.get("service", ""), body.get("session_id", ""))
            self._send(200, {"status": "success"})
            return

        if path == "/api/reset":
            self._send(200, state.reset_demo())
            return

        self._send(404, {"error": f"Not found: {path}"})


def serve_forever() -> None:
    server = ThreadingHTTPServer((HOST, PORT), DemoInfraAPIHandler)
    server.serve_forever()


if __name__ == "__main__":
    print(f"demo-infra REST API listening on http://{HOST}:{PORT}")
    serve_forever()
