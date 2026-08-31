# MissionControl — Autonomous DevOps Incident Response Agent

> **Hackathon submission** — WeMakeDevs "The Agent Harness" (Double-O track, TrueFoundry sponsor)

Give your infrastructure an agent. Keep the kill switch.

---

## Overview

MissionControl is an autonomous DevOps agent that monitors simulated production infrastructure, detects anomalies, and executes remediation — **with a human in the loop for irreversible actions**.

- **Agent runtime**: TrueForge (streamable-HTTP MCP)
- **Simulated infra**: 4 microservices (api-gateway, payment-service, user-service, notification-service) with metrics, logs, deploys, and programmable chaos
- **Human-in-the-loop**: Rollback/restart require explicit approval via the dashboard's hold-to-confirm UI
- **Observability**: Live service health, error rates, latency, logs, alerts, and incident timeline

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TrueForge Agent Runtime                          │
│  ┌─────────────────────┐      ┌─────────────────────┐                       │
│  │   Streamable-HTTP   │      │    Approval Gates   │                       │
│  │   MCP Server (8000) │      │  rollback / restart │                       │
│  └──────────┬───────────┘      └──────────┬──────────┘                       │
└─────────────┼───────────────────────────────┼────────────────────────────────┘
              │                               │
              │ MCP Tools                     │ Human approval
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Demo Infra REST Sidecar (8001)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Chaos API   │  │ Remediate   │  │ Health/Logs │  │ Alerts/TL   │        │
│  │ /api/chaos  │  │ /api/remed. │  │ /api/svc*   │  │ /api/alerts │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ State (thread-safe)
                                 ▼
                    ┌─────────────────────────────┐
                    │    Simulated Infra State    │
                    │  4 services + deploys +     │
                    │  metrics history + alerts   │
                    └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js Dashboard (3001)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Overview    │  │ Chaos Lab   │  │ Incident    │  │ Agent Chat  │        │
│  │ /           │  │ /chaos      │  │ /incident/:id│  │ embedded    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (One Command)

```bash
# Clone
git clone https://github.com/ADITYA-tp01/Mission-Control
cd Mission-Control

# Windows (one click)
.\start.ps1

# Linux / macOS
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**What `start.ps1` does:**
1. Checks Docker is running (tells you to start Docker Desktop if not)
2. Builds and starts all containers (Postgres, Redis, MCP server)
3. Waits for MCP server health
4. Installs dashboard deps and starts it on `http://localhost:3001`

**To stop everything:**
```powershell
.\stop.ps1
```

---

## Demo Flow

1. **Open the dashboard** → `http://localhost:3001`
2. **Chaos Lab** → pick a service + chaos type → **Inject**
3. **Hold-to-confirm** → human operator approves the chaos injection
4. **Incident page** opens → agent investigates, proposes remediation
4. **Rollback / Restart** → hold-to-confirm again → human approves
5. **Watch metrics** → service recovers to `healthy`

### CLI Chaos Trigger (for automation/CI)

```bash
python scripts/trigger_incident.py payment-service error_spike
python scripts/trigger_incident.py api-gateway outage "gateway down"
```

---

## TrueForge Agent Setup

1. Start TrueForge: `npx @truefoundry/trueforge` (in a separate terminal)
2. Open `http://localhost:8790`
3. **Configure Model Provider**: 
   - **For OpenAI**: Go to Settings, select OpenAI, and paste your `OPENAI_API_KEY`. Leave Base URL as default.
   - **For Groq / Open-source models**: First, run `python groq_proxy.py` in a separate terminal. Then in TrueForge Settings, select your provider, set the **Base URL** to `http://localhost:8080/v1` (or `http://172.19.48.1:8080/v1` if using WSL), enter your Groq API key, and specify the model ID.
4. **Add MCP server** → URL: `http://localhost:8000/mcp` (name: `demo-infra`)
5. **Create agent** named `missioncontrol`:
   - **System prompt**: `agent/system-prompt.md`
   - **Skill**: `agent/skills/incident-response/SKILL.md`
   - **Approval required** for: `rollback_deploy`, `restart_service`
6. Start the agent → it will auto-respond to incidents triggered from the dashboard

---

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET | All service health + chaos status |
| `/api/services/{name}/metrics` | GET | Error rate / latency history |
| `/api/chaos` | POST | Inject chaos `{service, chaos_type}` |
| `/api/remediate` | POST | Rollback/restart `{action, service, deploy_id?}` |
| `/api/reset` | POST | Full demo reset |
| `/api/alerts` | GET | Active alerts |
| `/api/alerts/{id}/ack` | POST | Acknowledge alert |
| `/api/logs` | GET | Service logs (filter by level) |
| `/api/timeline` | GET | Incident timeline |
| `/api/deploys` | GET | Recent deployments |
| `/api/sessions` | GET/POST | Agent sessions |

---

## Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *required* | OpenAI API key for TrueForge |
| `TRUEFORGE_URL` | `http://localhost:8790` | TrueForge UI URL |
| `NEXT_PUBLIC_TRUEFORGE_URL` | `http://localhost:8790` | Browser-side TrueForge URL |
| `MCP_ENDPOINT` | `http://localhost:8000/mcp` | MCP streamable-HTTP endpoint |
| `DEMO_INFRA_API_URL` | `http://localhost:8001` | REST sidecar URL |
| `DEMO_INFRA_TOKEN` | `local-demo-token` | Shared token for mutating POSTs |
| `AUTO_TRIGGER_AGENT` | `true` | Auto-trigger agent on chaos injection |

---

## Running the Tests

```bash
# Demo infra unit tests (16 tests)
cd mcp-servers/demo-infra
python test_state.py

# Dashboard
cd apps/dashboard
npm run lint
npm run build
```

---

## Security Notes

- **CORS**: Restricted to `localhost:8790/3001` only
- **Mutation auth**: All state-mutating POSTs require `Authorization: Bearer <DEMO_INFRA_TOKEN>`
- **Default token**: `local-demo-token` (override via `DEMO_INFRA_TOKEN` in `.env`)
- **MCP approval**: Agent tools `rollback_deploy` / `restart_service` require TrueForge human approval
- **REST sidecar**: Human operator path — gated by shared token + dashboard hold-to-confirm

---

## Project Structure

```
MissionControl/
├── start.ps1                         # One-click start (Windows)
├── stop.ps1                          # One-click stop (Windows)
├── .github/workflows/qodo.yml        # Qodo PR Agent review
├── scripts/
│   ├── setup.ps1 / setup.sh          # Detailed setup
│   ├── start-all.ps1                 # Advanced startup (WSL/TrueForge)
│   ├── stop-all.ps1                  # Clean shutdown
│   ├── trigger_incident.py           # CLI chaos injector
│   └── wsl/                          # WSL launcher scripts
├── mcp-servers/demo-infra/
│   ├── server.py                     # FastMCP server (port 8000)
│   ├── http_api.py                   # REST sidecar (port 8001)
│   ├── state.py                      # Thread-safe infra state
│   ├── test_state.py                 # 16 regression tests
│   ├── Dockerfile
│   └── requirements.txt
├── apps/dashboard/                   # Next.js 14 App Router
│   ├── app/                          # Pages + API routes
│   ├── components/                   # React components
│   └── lib/                          # Client libs
├── agent/
│   ├── system-prompt.md              # Agent instructions
│   └── skills/incident-response/     # Skill definition
├── docker-compose.yml                # Postgres + Redis + MCP sidecar
└── .env.example                      # Template
```

---

## License

MIT