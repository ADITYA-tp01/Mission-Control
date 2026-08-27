#!/usr/bin/env python3
"""MissionControl - Incident Trigger Script.

Injects chaos into the demo-infra MCP server and (optionally) triggers the
TrueForge agent via the dashboard webhook. Uses only the Python standard
library.

Usage:
    python scripts/trigger_incident.py payment-service error_spike
    python scripts/trigger_incident.py api-gateway outage "gateway is down"
"""

import json
import sys
import urllib.request

DASHBOARD_URL = "http://localhost:3001"
DEMO_INFRA_URL = "http://localhost:8001"

SERVICES = ["api-gateway", "payment-service", "user-service", "notification-service"]
CHAOS_TYPES = ["error_spike", "latency_spike", "outage", "cascading_failure"]


def _post(url: str, payload: dict, timeout: int = 15) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python trigger_incident.py <service> <chaos_type> [message]")
        print(f"Services: {', '.join(SERVICES)}")
        print(f"Chaos types: {', '.join(CHAOS_TYPES)}")
        sys.exit(1)

    service, chaos_type = sys.argv[1], sys.argv[2]
    if service not in SERVICES:
        print(f"Unknown service '{service}'. Allowed: {', '.join(SERVICES)}")
        sys.exit(1)
    if chaos_type not in CHAOS_TYPES:
        print(f"Unknown chaos_type '{chaos_type}'. Allowed: {', '.join(CHAOS_TYPES)}")
        sys.exit(1)
    message = sys.argv[3] if len(sys.argv) > 3 else f"{service} {chaos_type} detected"

    print(f"[1/2] Injecting {chaos_type} into {service} via demo-infra API...")
    try:
        result = _post(f"{DEMO_INFRA_URL}/api/chaos", {"service": service, "chaos_type": chaos_type})
        print(json.dumps(result, indent=2))
    except Exception as exc:
        print(f"Error injecting chaos (is demo-infra-mcp running on :8001?): {exc}")
        sys.exit(2)

    print("[2/2] Triggering agent investigation via dashboard webhook...")
    try:
        result = _post(f"{DASHBOARD_URL}/api/webhook", {
            "service": service,
            "alert_type": chaos_type,
            "message": message,
        })
        print(json.dumps(result, indent=2))
    except Exception as exc:
        print(f"Warning: could not reach dashboard webhook (is the dashboard running on :3001?): {exc}")


if __name__ == "__main__":
    main()
