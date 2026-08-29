# 03 — Project Write-Up

## MissionControl: Autonomous DevOps Incident-Response Agent

---

## What Is MissionControl?

MissionControl is an autonomous DevOps incident-response agent that monitors a simulated microservices stack, detects chaos events (failures), and automatically remediates them — with a mandatory human approval gate for risky operations.

It is built for **The Agent Harness** hackathon, using **TrueForge** as the agent runtime, **MCP (Model Context Protocol)** for tool execution, and a **Next.js dashboard** for real-time visualization.

---

## Why Does This Exist?

In real production environments, incident response is:
- **Slow** — humans must manually investigate, triage, and remediate
- **Error-prone** — sleep-deprived engineers make mistakes at 3 AM
- **Inconsistent** — different engineers follow different runbooks

MissionControl solves this by:
1. **Detecting** failures automatically via metric monitoring
2. **Triaging** severity using AI reasoning
3. **Remediating** with approved actions (rollback, restart)
4. **Verifying** that health is restored post-remediation
5. **Requiring human approval** for any destructive action

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TrueForge Agent                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  System Prompt (agent/system-prompt.md)         │    │
│  │  Skill (agent/skills/incident-response/SKILL.md)│    │
│  │  Model: GPT-4o-mini (via OpenAI API)            │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                    MCP Protocol                          │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  FastMCP Server (mcp-servers/demo-infra/server.py)│   │
│  │  Tools: list_services, get_service_metrics,     │    │
│  │         inject_chaos, rollback_deploy,          │    │
│  │         restart_service                         │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                    Shared State                          │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  InfraState (mcp-servers/demo-infra/state.py)   │    │
│  │  - Thread-safe (threading.Lock)                 │    │
│  │  - Services: PostgreSQL, Redis, demo-infra-mcp  │    │
│  │  - Chaos types: cpu_spike, memory_leak, etc.    │    │
│  │  - Remediation: rollback, restart (token-gated) │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                    REST API (port 8001)
                    Token: Bearer <DEMO_INFRA_TOKEN>
                          │
              ┌───────────┴───────────┐
              │                       │
    ┌─────────────────┐    ┌─────────────────┐
    │  Next.js Dashboard│   │  CLI Trigger     │
    │  (port 3001)     │   │  trigger_incident │
    │  - Home          │   │  .py             │
    │  - Chaos         │   │                  │
    │  - Incident      │   │                  │
    └─────────────────┘    └─────────────────┘
```

---

## How It Works — Step by Step

### 1. Infrastructure State

The agent monitors a simulated stack of three services:

| Service | Default Health | Simulated Role |
|---|---|---|
| PostgreSQL | Healthy | Primary database |
| Redis | Healthy | Cache layer |
| demo-infra-mcp | Healthy | Application server |

Each service has simulated metrics: CPU usage, memory usage, error rate, request latency. These metrics are sampled every 5 seconds and stored in a time-series buffer.

### 2. Chaos Injection

When chaos is injected (via dashboard or CLI), the target service's metrics degrade:
- `cpu_spike` → CPU jumps to 90-100%
- `memory_leak` → Memory grows over time
- `disk_fill` → Disk usage increases
- `network_latency` → Response latency spikes
- `process_crash` → Service becomes unhealthy

The system records the active incident, which blocks further chaos injection until resolved.

### 3. Agent Detection

The TrueForge agent continuously polls the MCP server:
1. Calls `list_services()` to check all service health statuses
2. Calls `get_service_metrics(service_name)` to inspect metrics
3. Uses GPT-4o-mini to reason about the metrics and decide on remediation

### 4. Human Approval Gate

For risky operations (`rollback_deploy`, `restart_service`), the agent:
1. Explains what it wants to do and why
2. Requests explicit human approval via TrueForge's approval mechanism
3. Only executes after the human confirms

On the dashboard, this is implemented as a **hold-to-confirm button** — the operator must click and hold for 2 seconds to prevent accidental triggering.

### 5. Remediation

Once approved, the agent executes the remediation:
- `rollback_deploy(service_name)` — Reverts the service to its previous version, restores health
- `restart_service(service_name)` — Restarts the service process

Both operations are atomic — they either complete fully or roll back.

### 6. Verification

After remediation, the agent:
1. Calls `get_service_metrics()` again to verify health is restored
2. Confirms the incident is resolved
3. Reports the outcome to the operator

---

## Technology Stack

### Agent Runtime: TrueForge

TrueForge is the agent harness that:
- Runs the AI agent (GPT-4o-mini)
- Manages MCP server connections
- Handles human-in-the-loop approval
- Provides the agent UI at `http://localhost:3000`

**How we use it:**
- Agent system prompt defines MissionControl's personality and rules
- Incident-response skill defines the detection → triage → remediation → verification workflow
- MCP server connection gives the agent 5 tools for infrastructure management
- Approval mechanism ensures humans approve risky operations

### Tool Execution: MCP (Model Context Protocol)

MCP is an open protocol for connecting AI agents to external tools. Our FastMCP server exposes 5 tools:

| Tool | Purpose | Requires Approval |
|---|---|---|
| `list_services()` | List all services with health status | No |
| `get_service_metrics(service)` | Get CPU/memory/error metrics | No |
| `inject_chaos(service, type)` | Inject a simulated failure | Yes (dashboard) |
| `rollback_deploy(service)` | Roll back a deployment | Yes (always) |
| `restart_service(service)` | Restart a service | Yes (always) |

The MCP server runs as a Docker container and communicates with TrueForge via the MCP protocol (stdio or SSE).

### Dashboard: Next.js + React + Tailwind

The dashboard provides real-time visualization:
- **Home page** — Service health overview with color-coded badges
- **Chaos page** — Inject chaos events with hold-to-confirm UI
- **Incident page** — View active incidents and remediation timeline

The dashboard calls the REST sidecar (`http_api.py`) for all state-mutating operations. Every POST request requires a Bearer token.

### Infrastructure: Docker Compose

Three containers boot together:
- `postgres` — PostgreSQL 16 Alpine
- `redis` — Redis 7 Alpine
- `demo-infra-mcp` — Python 3.12-slim with FastMCP + REST sidecar

---

## Key Design Decisions

### 1. Human-in-the-Loop Is Mandatory

The agent **cannot** execute `rollback_deploy` or `restart_service` without explicit human approval. This is enforced at multiple levels:
- **MCP server level** — The tool implementation checks for approval
- **REST sidecar level** — Token-gated endpoints
- **Dashboard level** — Hold-to-confirm button prevents accidental clicks

### 2. Token-Gated REST API

All state-mutating operations on the REST sidecar require a valid Bearer token:
```
Authorization: Bearer <DEMO_INFRA_TOKEN>
```
This prevents unauthorized access to chaos injection and remediation endpoints.

### 3. Validation Before Restoration

When invalid chaos is requested (e.g., unknown service or chaos type), the system rejects the request **before** restoring the previous incident state. This prevents a validation error from accidentally clearing an active incident.

### 4. Thread-Safe State

The `InfraState` class uses `threading.Lock` to ensure thread safety. This is critical because:
- The MCP server handles concurrent tool calls
- The REST sidecar handles concurrent HTTP requests
- Metrics sampling runs in a background thread

### 5. Repo-Supplied Launchers

WSL launchers (`scripts/wsl/start-trueforge.sh`, `scripts/wsl/start-litellm.sh`) are committed to the repo with relative paths. No personal home directories are hardcoded.

---

## How TrueForge Is Utilized

| TrueForge Feature | How MissionControl Uses It |
|---|---|
| Agent Runtime | Runs GPT-4o-mini with our system prompt and skill |
| MCP Server Connection | Connects to our FastMCP server at `http://localhost:8000/mcp` |
| Approval Mechanism | Requires human approval before `rollback_deploy` / `restart_service` |
| Agent UI | Provides `http://localhost:3000` for agent interaction |
| Skill System | Loads `incident-response/SKILL.md` for specialized behavior |
| System Prompt | Loads `agent/system-prompt.md` for personality and rules |

---

## Quick Reference

### Start Everything
```bash
# Windows
.\scripts\setup.ps1

# Linux/macOS
./scripts/setup.sh
```

### Inject Chaos via CLI
```bash
python scripts/trigger_incident.py api-gateway cpu_spike
```

### Run Tests
```bash
cd mcp-servers/demo-infra
python test_state.py
# 16/16 tests passing
```

### Stop Everything
```bash
# Windows
.\scripts\stop-all.ps1

# Linux/macOS
docker compose down
```
