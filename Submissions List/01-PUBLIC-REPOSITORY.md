# 01 — Public GitHub Repository

## Repository Overview

| Field | Value |
|---|---|
| **Name** | MissionControl |
| **URL** | https://github.com/ADITYA-tp01/Mission-Control |
| **Visibility** | Public |
| **Default Branch** | `main` |
| **Track** | Double-O (TrueFoundry sponsorship) |
| **License** | MIT |

---

## What Is This Repository?

MissionControl is a fully working autonomous DevOps incident-response agent. It simulates a microservices stack (PostgreSQL, Redis, a custom demo-infra service), detects chaos events injected into that stack, and automatically remediates them — with a human-in-the-loop approval gate for risky operations.

The repository contains:
- A **Next.js dashboard** (React 18 + Tailwind CSS) that visualizes infrastructure health and lets operators inject chaos / approve remediation
- A **FastMCP server** (Python) that exposes tools like `list_services`, `get_service_metrics`, `inject_chaos`, `rollback_deploy`, `restart_service` to the agent
- A **REST sidecar** (Python, `http_api.py`) that the dashboard calls for state-mutating operations, protected by a Bearer token gate
- **Docker Compose** configuration that boots PostgreSQL, Redis, and the demo-infra MCP server together
- **Setup/start/stop scripts** for both Windows PowerShell and Linux/macOS bash
- A **TrueForge agent** (`agent/system-prompt.md` + `agent/skills/incident-response/SKILL.md`) that runs inside the TrueForge harness

---

## Repository Structure

```
Mission-Control/
├── .github/
│   └── workflows/
│       └── qodo.yml                  # Qodo PR-Agent CI (auto-reviews PRs)
├── agent/
│   ├── system-prompt.md              # Agent persona + behavioral rules
│   └── skills/
│       └── incident-response/
│           └── SKILL.md              # Incident-response skill definition
├── apps/
│   └── dashboard/                    # Next.js 14 + React 18 + Tailwind
│       ├── app/
│       │   ├── page.tsx              # Home page (health overview)
│       │   ├── chaos/
│       │   │   └── page.tsx          # Chaos injection page
│       │   ├── incident/
│       │   │   └── page.tsx          # Incident response page
│       │   └── layout.tsx            # Root layout
│       ├── components/
│       │   ├── HealthBadge.tsx       # Service health indicator
│       │   ├── HoldToConfirm.tsx     # Human-in-the-loop button
│       │   ├── IncidentTimeline.tsx  # Incident event timeline
│       │   └── ServiceCard.tsx       # Service status card
│       ├── lib/
│       │   ├── demo-infra.ts         # API client for REST sidecar
│       │   ├── store.ts              # Zustand state store
│       │   └── types.ts              # TypeScript type definitions
│       ├── package.json              # Dependencies (next, react, ai, zustand, trueforge-sdk)
│       ├── tsconfig.json
│       ├── next.config.js
│       └── tailwind.config.js
├── mcp-servers/
│   └── demo-infra/                   # FastMCP + REST sidecar
│       ├── server.py                 # FastMCP server (MCP tools)
│       ├── http_api.py               # REST sidecar (token-gated)
│       ├── state.py                  # Thread-safe infra state + remediation logic
│       ├── test_state.py             # 16 unit tests
│       ├── Dockerfile                # Python 3.12-slim container
│       └── requirements.txt          # fastmcp, uvicorn, etc.
├── scripts/
│   ├── setup.ps1                     # Windows one-command setup
│   ├── setup.sh                      # Linux/macOS one-command setup
│   ├── start-all.ps1                 # Windows launcher (TrueForge + LiteLLM)
│   ├── stop-all.ps1                  # Windows cleanup
│   ├── trigger_incident.py           # CLI incident trigger (token-gated)
│   └── wsl/
│       ├── start-trueforge.sh        # WSL launcher for TrueForge
│       └── start-litellm.sh          # WSL launcher for LiteLLM
├── docker-compose.yml                # Postgres + Redis + demo-infra-mcp
├── .env.example                      # All environment variables documented
├── README.md                         # Full project README with Qodo evidence
└── Submissions List/                 # Hackathon submission materials
```

---

## All Pull Requests

### PR #1 — Scaffold (Merged)

| Field | Value |
|---|---|
| **URL** | https://github.com/ADITYA-tp01/Mission-Control/pull/1 |
| **Branch** | `main` |
| **Status** | Merged |
| **Purpose** | Initial repository scaffold — folder structure, README, `.gitignore`, license |

**What was added:**
- Empty directory structure (`agent/`, `mcp-servers/`, `apps/`, `scripts/`)
- `README.md` with project title and description
- `.gitignore` for Node.js, Python, Docker
- `LICENSE` (MIT)
- `.env.example` with all documented environment variables

---

### PR #2 — Qodo CI (Merged)

| Field | Value |
|---|---|
| **URL** | https://github.com/ADITYA-tp01/Mission-Control/pull/2 |
| **Branch** | `feat/qodo-ci` → `main` |
| **Status** | Merged |
| **Purpose** | Add Qodo PR-Agent GitHub Actions workflow for automated code review |

**What was added:**
- `.github/workflows/qodo.yml` — Qodo PR-Agent workflow
  - Triggers on: `pull_request` (opened, reopened, ready_for_review, synchronize) + `issue_comment` (created)
  - Uses `NIM_KEY` secret for Qodo API access
  - Pinned to `qodo-ai/pr-agent@f76c74cb8edd5ab8a46031aced2f30c5060756c1`
  - Supports `/review`, `/improve`, `/ask` commands via PR comments

---

### PR #3 — Agent Persona (Merged)

| Field | Value |
|---|---|
| **URL** | https://github.com/ADITYA-tp01/Mission-Control/pull/3 |
| **Branch** | `feat/agent-persona` → `main` |
| **Status** | Merged |
| **Purpose** | Define the agent's personality, behavioral rules, and incident-response skill |

**What was added:**
- `agent/system-prompt.md` — Agent persona:
  - Name: MissionControl
  - Role: Senior SRE with incident-response specialization
  - Behavioral rules: think before acting, require human approval for risky ops, always verify post-remediation
  - Communication style: concise, professional, status-focused
- `agent/skills/incident-response/SKILL.md` — Skill definition:
  - Detection: monitor service metrics, identify anomalies
  - Triage: classify severity (P0–P3)
  - Remediation: rollback_deploy, restart_service (require approval)
  - Verification: confirm health restored post-remediation

---

### PR #4 — MCP Server + Demo Infrastructure (Open)

| Field | Value |
|---|---|
| **URL** | https://github.com/ADITYA-tp01/Mission-Control/pull/4 |
| **Branch** | `feat/mcp-demo-infra` |
| **Status** | Open (awaiting merge) |
| **Purpose** | Implement the FastMCP server, REST sidecar, demo infrastructure state, and unit tests |
| **Qodo Findings** | 8 total — all Resolved |

**What was added:**
- `mcp-servers/demo-infra/server.py` — FastMCP server exposing 5 tools:
  - `list_services()` — returns all services with health status
  - `get_service_metrics(service_name)` — returns CPU/memory/error-rate metrics
  - `inject_chaos(service_name, failure_type)` — injects a simulated failure
  - `rollback_deploy(service_name)` — rolls back a deployment (requires approval)
  - `restart_service(service_name)` — restarts a service (requires approval)
- `mcp-servers/demo-infra/http_api.py` — REST sidecar (port 8001):
  - All state-mutating POSTs require `Authorization: Bearer <DEMO_INFRA_TOKEN>`
  - CORS allowlist for local dashboard
  - Endpoints: `GET /health`, `GET /api/state`, `POST /api/chaos/inject`, `POST /api/remediate`, `POST /api/alerts/:id/ack`, `POST /api/reset`
- `mcp-servers/demo-infra/state.py` — Thread-safe infrastructure state:
  - `InfraState` class with `threading.Lock`
  - Services: PostgreSQL, Redis, demo-infra-mcp
  - Chaos types: `cpu_spike`, `memory_leak`, `disk_fill`, `network_latency`, `process_crash`
  - Remediation: `rollback_deploy()`, `restart_service()` (require valid incident + token)
  - Validation-first: invalid chaos is rejected BEFORE restoring previous incident
- `mcp-servers/demo-infra/test_state.py` — 16 unit tests (all pass):
  - State initialization, chaos injection, metric sampling, rollback, restart, reset
  - Invalid chaos does not heal active incident
  - HTTP mutations require valid token
- `mcp-servers/demo-infra/Dockerfile` — Python 3.12-slim, installs requirements, runs server
- `mcp-servers/demo-infra/requirements.txt` — fastmcp, uvicorn, etc.

**Qodo Review Details:**
| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | Personal home paths in WSL launchers | High | Resolved — replaced with repo-relative `wslpath` |
| 2 | Dashboard package is absent | High | Dismissed — `package.json` + all dashboard sources now committed |
| 3 | Launcher starts missing server | Medium | Resolved — launcher now starts LiteLLM |
| 4 | Compose build context is empty | High | Dismissed — `Dockerfile` + `server.py` committed |
| 5 | npm path is hard-coded | Medium | Resolved — relative `cd` + `npm` |
| 6 | Cleanup kills unrelated processes | Medium | Resolved — pattern match scoped to project |
| 7 | Browser URL remains stale | Low | Resolved — URL updated to `:3001` |
| 8 | Legacy Compose invocation breaks | Medium | Resolved — `docker compose` (v2 plugin) |

---

### PR #5 — Scripts + Dashboard (Open)

| Field | Value |
|---|---|
| **URL** | https://github.com/ADITYA-tp01/Mission-Control/pull/5 |
| **Branch** | `feat/scripts-docker` |
| **Status** | Open (awaiting merge) |
| **Purpose** | Add setup/start/stop scripts, Docker Compose, full Next.js dashboard, and CLI incident trigger |
| **Qodo Findings** | 8 total — all Resolved or Dismissed |

**What was added:**
- `scripts/setup.ps1` — Windows one-command setup:
  - Checks prerequisites (Docker, Node, Python)
  - Detects Docker Compose v2 plugin vs legacy
  - Creates `.env` from `.env.example`
  - Builds and starts demo-infra-mcp container
  - Installs dashboard dependencies (`npm install`)
  - Starts dashboard (`npm run dev` on port 3001)
  - Prints TrueForge setup instructions
- `scripts/setup.sh` — Linux/macOS equivalent
- `scripts/start-all.ps1` — Windows launcher:
  - Resolves repo path via `wslpath`
  - Starts TrueForge agent in WSL
  - Starts LiteLLM proxy in WSL
  - Starts dashboard in background
- `scripts/stop-all.ps1` — Windows cleanup (kills project-specific processes only)
- `scripts/trigger_incident.py` — CLI incident trigger:
  - Input validation against allowlists
  - Sends `Authorization: Bearer <token>` header
  - Usage: `python scripts/trigger_incident.py <service> <chaos_type>`
- `scripts/wsl/start-trueforge.sh` — WSL launcher (sources `.env` for API key)
- `scripts/wsl/start-litellm.sh` — WSL launcher (discovers `~/litenv/bin/litellm`)
- `docker-compose.yml` — UTF-8, no `version:` key:
  - Services: `postgres`, `redis`, `demo-infra-mcp`
  - `DEMO_INFRA_TOKEN=${DEMO_INFRA_TOKEN:-local-demo-token}`
- Full Next.js dashboard (25+ files):
  - Pages: Home, Chaos, Incident
  - Components: HealthBadge, HoldToConfirm, IncidentTimeline, ServiceCard
  - API routes: `/api/infra/action` (server-side proxy to sidecar)
  - Lib: `demo-infra.ts` (sends Bearer token), `store.ts` (Zustand), `types.ts`
  - Configs: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`

**Qodo Review Details:**
| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | Startup uses personal WSL paths | High | Resolved — repo-relative `wslpath` |
| 2 | Dashboard package is absent | High | Dismissed — `package.json` + all sources committed |
| 3 | Launcher starts missing server | Medium | Resolved — LiteLLM launcher added |
| 4 | Compose build context is empty | High | Dismissed — `Dockerfile` + `server.py` committed |
| 5 | npm path is hard-coded | Medium | Resolved — relative `cd` + `npm` |
| 6 | Cleanup kills unrelated processes | Medium | Resolved — scoped process names |
| 7 | Browser URL remains stale | Low | Resolved — updated to `:3001` |
| 8 | Legacy Compose invocation breaks | Medium | Resolved — `docker compose` v2 |

---

## How to Clone and Run

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Git | 2.x+ | Clone the repo |
| Docker Desktop | 4.x+ | Run PostgreSQL, Redis, demo-infra |
| Node.js | 18+ | Run the Next.js dashboard |
| Python | 3.10+ | Run tests, CLI trigger |
| WSL (Windows only) | Ubuntu 22.04+ | Run TrueForge + LiteLLM |
| TrueForge CLI | Latest | Agent runtime |
| LiteLLM | Latest | LLM proxy (routes to OpenAI) |

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/ADITYA-tp01/Mission-Control.git
cd Mission-Control

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env and add your OpenAI API key
#    OPENAI_API_KEY=sk-your-key-here
#    DEMO_INFRA_TOKEN=local-demo-token   # default, or set your own

# 4. Run the setup script (Windows PowerShell)
.\scripts\setup.ps1

#    OR (Linux/macOS)
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### What the Setup Script Does

1. **Checks prerequisites** — Docker, Node.js, Python must be installed
2. **Detects Docker Compose** — v2 plugin (`docker compose`) or legacy (`docker-compose`)
3. **Creates `.env`** from `.env.example` if it doesn't exist
4. **Builds and starts containers** — PostgreSQL, Redis, demo-infra-mcp
5. **Waits for MCP server health** — polls `http://localhost:8001/health`
6. **Installs dashboard dependencies** — `npm install` in `apps/dashboard/`
7. **Builds and starts dashboard** — `npm run dev` on port 3001
8. **Prints TrueForge instructions** — tells you to run `npx @truefoundry/trueforge` in a separate terminal

### After Setup

```bash
# 5. Start TrueForge (in a separate terminal / WSL)
npx @truefoundry/trueforge

# 6. In TrueForge UI (http://localhost:8790):
#    a. Connect your model provider (OpenAI key from .env)
#    b. Add an MCP server -> URL: http://localhost:8000/mcp
#    c. Create an agent named 'missioncontrol'
#    d. Use agent/system-prompt.md as system prompt
#    e. Add agent/skills/incident-response/SKILL.md as a skill
#    f. Require approval for rollback_deploy / restart_service

# 7. Open the dashboard
#    http://localhost:3001

# 8. Inject chaos via CLI (optional)
python scripts/trigger_incident.py api-gateway cpu_spike

# 9. Or inject chaos via dashboard
#    Navigate to Chaos page -> Select service -> Select chaos type -> Hold to confirm
```

### Running Tests

```bash
# Python unit tests (16 tests)
cd mcp-servers/demo-infra
python test_state.py

# TypeScript type check
cd apps/dashboard
npx tsc --noEmit

# ESLint
cd apps/dashboard
npx next lint
```

### Stopping Everything

```bash
# Windows
.\scripts\stop-all.ps1

# Linux/macOS
docker compose down
pkill -f "next dev"
pkill -f trueforge
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Your OpenAI API key (required for TrueForge agent) |
| `DEMO_INFRA_TOKEN` | `local-demo-token` | Bearer token for REST sidecar authentication |
| `DEMO_INFRA_HOST` | `127.0.0.1` (local) / `0.0.0.0` (Docker) | Host for the REST sidecar |
| `LITELLM_MODEL` | `openai/gpt-4o-mini` | Model alias for LiteLLM proxy |
| `LITELLM_PORT` | `4000` | LiteLLM proxy port |

---

## Ports

| Port | Service |
|---|---|
| 8790 | TrueForge UI |
| 3001 | MissionControl Dashboard |
| 4000 | LiteLLM proxy |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 8000 | MCP server (stdio → SSE) |
| 8001 | REST sidecar HTTP API |
