"""Lightweight REST API sidecar for the demo-infra MCP server.

The TrueForge agent talks to the MCP tools over streamable-http (port 8000).
The Next.js dashboard needs plain JSON endpoints to render live state, so
this module serves those on port 8001 without adding any dependencies.

Run: python http_api.py  (started automatically by server.py)
"""

import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Tuple
from urllib.parse import urlparse, parse_qs

from state import get_state

HOST = "0.0.0.0"
PORT = 8001

SERVICE_RE = re.compile(r"^/api/services/([^/]+)/metrics$")
ALERT_ACK_RE = re.compile(r"^/api/alerts/([^/]+)/ack$")


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
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
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
            metrics = state.get_error_metrics(service)
            history = state.get_metrics_history(service, limit=int(query.get("limit", 60)))
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
                for d in state.get_recent_deploys(limit=int(query.get("limit", 10)))
            ]})
            return

        if path == "/api/logs":
            service = query.get("service", "")
            logs = state.get_service_logs(
                service,
                limit=int(query.get("limit", 50)),
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

        if path == "/api/chaos":
            result = state.inject_chaos(
                body.get("service", ""), body.get("chaos_type", "error_spike")
            )
            self._send(200 if result.get("status") == "success" else 400, result)
            return

        if path == "/api/remediate":
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
