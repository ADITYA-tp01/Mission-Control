# MissionControl — Master Plan

> **Hackathon:** WeMakeDevs — The Agent Harness (Aug 24–30, 2026)
>
> **Target:** Double-O Track — NVIDIA DGX Spark ($5,000)
>
> **Backup Target:** Best UI Track — iPad
>
> **Project:** MissionControl — Autonomous DevOps Incident Response Agent
>
> **Tagline:** *Give your infrastructure an agent. Keep the kill switch.*

---

## 1. HACKATHON RULES (Verified from wemakedevs.org/hackathons/trueforge/rules)

| # | Rule | Detail |
|---|---|---|
| 1 | **Coding window** | Aug 24 08:00 London → Aug 30 20:00 London |
| 2 | **Teams** | Solo or up to 4. Each person on one team only |
| 3 | **Must run on TrueForge** | Judges must see harness doing real work, not a thin wrapper |
| 4 | **Open source** | Public repo, judges must be able to read AND run the code |
| 5 | **Demo video** | ~3 minutes showing the agent working |
| 6 | **Write-up** | Short explanation of what agent does + how it uses TrueForge |
| 7 | **No secrets in repo** | No private keys, personal data, or login-protected info |
| 8 | **Only tools you own** | Only interact with tools/data/accounts you have permission for |
| 9 | **AI disclosure required** | AI assistants allowed, but usage MUST be disclosed |
| 10 | **No pure AI-gen** | Entirely AI-generated projects without human contribution may be rejected. Must be able to explain your code |
| 11 | **Pre-planning OK** | Diagrams, notes, architecture discussion allowed before Aug 24. Coding/design must wait |
| 12 | **Libraries OK** | Frameworks, open-source libs, public APIs, templates all allowed |
| 13 | **Q Branch requires Qodo** | Must install Qodo on repo, run PRs through it, address findings |
| 14 | **Blog post** | Link to blog post required if entering Field Report prize |
| 15 | **Code of Conduct** | Follow WeMakeDevs CoC. Plagiarism/harassment = disqualification |

### SF Live Day (Aug 29)
- Optional in-person day in San Francisco (separate Luma registration, limited space)
- SF attendees get **$50 in OpenAI credits**
- Online participants must use their **own API keys**

### Submission Checklist
- [ ] Public source-code repository
- [ ] README with clear setup steps
- [ ] Demo video (~3 min)
- [ ] Write-up: what agent does + how it uses TrueForge
- [ ] AI usage disclosure
- [ ] Blog post link (if entering Field Report)


### Five Prize Categories (can only win one judged track)

| Track | Prize | Key Criterion |
|---|---|---|
| **Double-O** (TrueFoundry) | NVIDIA DGX Spark ($5,000) | Best Use of TrueForge — MCP, sandbox, approvals, subagents, sessions. "The harness is doing the work, not sitting under a thin wrapper." |
| **Q Branch** (Qodo) | Mac Mini ($1,000) | Best Code Quality — Qodo on repo Day 1, PRs reviewed, review trail visible to judges |
| **Savile Row** (Best UI) | iPad **to every team member** | UI shows what agent is doing, what it's waiting on, what it did. Asks before irreversible step. Judged on demo video AND running project |
| **Field Report** (open) | Keychron Keyboard | Best blog post — write up what you built, what broke, screenshots + demo clip |
| **Radio Traffic** (open) | Swag (top 10) | Best social media post about the hackathon |

> Top projects also get a **job interview at TrueFoundry**.

**Strategy:** Optimize for Double-O (DGX Spark). Compete for Savile Row (iPad) as bonus via polished UI. Install Qodo on Day 1 for Q Branch eligibility. Write a blog post for Field Report.

---

## 2. TRUEFORGE — VERIFIED CAPABILITIES

> Source: [github.com/truefoundry/trueforge](https://github.com/truefoundry/trueforge) + [trueforge.dev](https://trueforge.dev)

### What TrueForge Actually Is

TrueForge is a **server** you run. It manages the agent execution loop, model calls, MCP tools, sandbox, approvals, context, and session state. It exposes:

1. **Chat UI** — Built-in web interface at `localhost:3000`
2. **HTTP API** — Programmatic access to the agent loop
3. **TypeScript SDK** — `@truefoundry/trueforge-sdk`
4. **Embeddable UI SDK** — `@truefoundry/trueforge-ui` (React 18+)

### How to Run (Verified from Docs)

```bash
# Local mode (SQLite, single process, dev only)
npx @truefoundry/trueforge

# Hosted mode (Postgres + Redis)
docker compose up
```

### Key Features We Must Use (from TrueForge README)

| Feature | What It Does | How We Use It |
|---|---|---|
| **MCP Tools** | Remote MCP servers with header auth / OAuth | Connect to our demo MCP servers |
| **Sandbox** | Isolated code/file execution via Daytona | Run investigation queries safely |
| **Human Checkpoints** | Tool approval + ask-user-questions + Generative UI | Approval gate before rollback |
| **Subagents** | Delegated subtasks | Parallel investigation |
| **Session Persistence** | State survives reconnects/restarts | Incident continuity |
| **Skills** | Git-backed SKILL.md instruction packs | Our incident response workflow |
| **Context Engineering** | Compaction, large-result offloading | Handle verbose log data |
| **Generative UI** | Custom UI components rendered in chat | Rich approval cards, timeline |
| **Create Agent** | UI/API to create reusable agent configs | Our MissionControl agent |

### Critical Architecture Insight

> TrueForge is NOT a Python library you import. It is a **standalone server** that manages the agent loop.
> You configure it via UI or API. You connect tools (MCP servers), models, and skills.
> Your custom logic lives in **MCP servers you build** and **Skills (SKILL.md files)**.

This changes everything about the architecture. We are NOT building a Python orchestrator. We are:
1. Running TrueForge server
2. Creating an agent (via UI/API) with incident response instructions
3. Building **custom MCP servers** that connect to our demo infrastructure
4. Writing a **SKILL.md** for the incident response workflow
5. Using the **TypeScript SDK** to trigger the agent programmatically
6. Building a **custom dashboard** with `@truefoundry/trueforge-ui`

---

## 3. CORRECTED ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│                    TRUEFORGE SERVER                       │
│  (npx @truefoundry/trueforge — manages everything)      │
│                                                          │
│  ┌─────────────┐ ┌──────────┐ ┌───────────────────────┐ │
│  │ Agent Config │ │ Session  │ │ Context / Compaction  │ │
│  │ (Model +    │ │ Manager  │ │ (Large result offload)│ │
│  │  System     │ │          │ │                       │ │
│  │  Prompt)    │ │          │ │                       │ │
│  └─────────────┘ └──────────┘ └───────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              MCP TOOL REGISTRY                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │    │
│  │  │demo-     │ │ github-  │ │ any other MCP    │  │    │
│  │  │infra-mcp │ │ mcp      │ │ server           │  │    │
│  │  │(WE BUILD)│ │          │ │                  │  │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │ Sandbox (Daytona)│  │ Human Checkpoints            │   │
│  │ Code execution   │  │ Tool approval / Generative UI│   │
│  └─────────────────┘  └──────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐     │
│  │ Subagent Delegation                              │     │
│  │ (Parallel investigation tasks)                   │     │
│  └─────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│ TrueForge       │          │ Custom Dashboard     │
│ Built-in Chat UI│          │ (@truefoundry/       │
│ (localhost:3000) │          │  trueforge-ui)       │
└─────────────────┘          └─────────────────────┘
         │
         ▼
┌────────────────────────┐
│ TypeScript SDK          │
│ (@truefoundry/          │
│  trueforge-sdk)         │
│                         │
│ Used by:                │
│ - Webhook receiver      │
│ - Alert → Agent trigger │
│ - Programmatic control  │
└────────────────────────┘
```

---

## 4. WHAT WE BUILD (Scoped for 7 Days)

### MUST HAVE (Won't ship without these)

| # | Component | What | TrueForge Feature |
|---|---|---|---|
| 1 | **MissionControl Agent** | Agent config in TrueForge with incident response system prompt + SKILL.md | Agent creation, Skills |
| 2 | **demo-infra-mcp** | Custom MCP server (Python/Node) simulating infrastructure: metrics, logs, deploys, chaos injection | MCP Tools |
| 3 | **Approval Gate** | Human checkpoint before rollback/restart actions | Human Checkpoints |
| 4 | **Sandbox Usage** | Agent writes + runs investigation scripts in sandbox | Sandbox (Daytona) |
| 5 | **Dashboard** | Custom Next.js app using `@truefoundry/trueforge-ui` | Embeddable UI SDK |
| 6 | **Alert Webhook** | Endpoint that triggers agent via SDK when alert fires | TypeScript SDK |
| 7 | **Demo Video** | 3-min recording of full incident loop | — |

### NICE TO HAVE (Only if time permits after Day 5)

| # | Component | TrueForge Feature |
|---|---|---|
| 8 | Subagent parallel investigation | Subagents |
| 9 | Generative UI for rich approval cards | Generative UI |
| 10 | Multiple chaos scenarios | — |
| 11 | Incident history / timeline view | Session persistence |
| 12 | Qodo PR reviews | Q Branch track |

### WILL NOT BUILD

- ❌ Custom Python orchestrator (TrueForge handles the loop)
- ❌ Auth / multi-tenant
- ❌ Real external service integrations (Grafana, PagerDuty)
- ❌ Multiple LLM providers
- ❌ Mobile app
- ❌ Kubernetes deployment

---

## 5. DEMO-INFRA-MCP — Our Custom MCP Server

This is **the most important thing we build**. It's the bridge between TrueForge and our simulated infrastructure.

### Tools It Exposes

```
get_service_health     → Returns health status of demo services
get_error_metrics      → Returns error rate, latency, request count
get_recent_deploys     → Returns last N deploys with diffs
get_service_logs       → Returns recent log entries (filterable)
inject_chaos           → Triggers a failure scenario
rollback_deploy        → Rolls back to previous version (REQUIRES APPROVAL)
restart_service        → Restarts a service (REQUIRES APPROVAL)
get_incident_timeline  → Returns current incident timeline
```

### Tool Risk Classification (enforced in MCP server config)

```
requiresApproval: false  → get_*, inject_chaos
requiresApproval: true   → rollback_deploy, restart_service
```

### Implementation

Single Python file using `mcp` package:

```python
# demo_infra_mcp.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("demo-infra")

# State
chaos_active = False
error_rate = 0.4

@mcp.tool()
def get_error_metrics(service: str) -> dict:
    """Get current error rate and latency for a service."""
    return {
        "service": service,
        "error_rate": 12.3 if chaos_active else 0.4,
        "latency_p99": 2400 if chaos_active else 120,
        "requests_per_minute": 1200
    }

@mcp.tool()
def rollback_deploy(service: str, deploy_id: str) -> dict:
    """Roll back a service to a previous deploy. IRREVERSIBLE."""
    global chaos_active, error_rate
    chaos_active = False
    error_rate = 0.4
    return {"status": "success", "message": f"Rolled back {service} to before {deploy_id}"}

# ... other tools
```

---

## 6. AGENT CONFIGURATION

### System Prompt (for TrueForge Agent)

```
You are MissionControl, an autonomous DevOps incident response agent.

When an alert is received, follow this protocol:

1. INVESTIGATE: Use get_error_metrics, get_service_logs, and get_recent_deploys
   to understand the current state.

2. CORRELATE: Compare the timeline of the error spike with recent deploys.
   Look for changes that could cause the observed symptoms.

3. DIAGNOSE: Identify the most likely root cause. State your confidence level.

4. PLAN: Propose a remediation action. If the action is irreversible
   (rollback, restart), it will require human approval.

5. EXECUTE: After approval, execute the remediation action.

6. VERIFY: After execution, check metrics again to confirm the fix worked.

7. REPORT: Summarize the incident with a timeline.

SAFETY RULES:
- Never skip investigation. Always gather data before proposing actions.
- Never execute irreversible actions without approval.
- If confidence is below 70%, ask the human for guidance instead.
- If an action fails, do NOT retry automatically. Report and ask for help.
```

### SKILL.md (Loaded On-Demand)

```markdown
---
name: incident-response
description: DevOps incident investigation and remediation workflow
---

# Incident Response Skill

When triggered by an alert, execute the following phases in order...
[Detailed workflow instructions that supplement the system prompt]
```

---

## 7. DASHBOARD (Custom UI)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| TrueForge Chat | `@truefoundry/trueforge-ui` (embedded) |
| Agent Control | `@truefoundry/trueforge-sdk` |

### Key Pages

| Page | Purpose |
|---|---|
| `/` | Dashboard — system status, active alerts, recent incidents |
| `/incident/[id]` | Live incident view — embedded TrueForge chat + timeline |
| `/chaos` | Demo control panel — inject chaos, view metrics |

### TrueForge UI Integration

```tsx
import { TrueForgeChat } from '@truefoundry/trueforge-ui';

export function IncidentView({ sessionId }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left: Live metrics and timeline */}
      <IncidentTimeline sessionId={sessionId} />

      {/* Right: TrueForge agent chat (embedded) */}
      <TrueForgeChat
        baseUrl="http://localhost:3000"
        sessionId={sessionId}
      />
    </div>
  );
}
```

---

## 8. DEMO SCRIPT (3 Minutes)

| Time | What Happens | What Judge Sees |
|---|---|---|
| 0:00–0:10 | **Hook** | "It's 2 AM. Your pager fires. What if the agent investigated before you woke up?" |
| 0:10–0:25 | **Dashboard** | MissionControl dashboard — green status, monitoring |
| 0:25–0:40 | **Chaos** | Click "Inject Chaos" → error rate spikes → alert fires |
| 0:40–1:15 | **Investigation** | Agent queries metrics, logs, deploys via MCP. Real tool calls visible in chat |
| 1:15–1:35 | **Root Cause** | Agent identifies deploy as cause, states 94% confidence |
| 1:35–2:00 | **Approval Gate** | "I want to rollback deploy X. Approve?" — PAUSE. Human clicks Approve |
| 2:00–2:15 | **Execute + Verify** | Rollback executes. Agent checks metrics. Error rate drops |
| 2:15–2:35 | **Report** | Auto-generated timeline. "4 min resolution, 1 human approval, 7 agent actions" |
| 2:35–2:50 | **Architecture** | Quick diagram: TrueForge = runtime. We built MCP server + dashboard + agent config |
| 2:50–3:00 | **Close** | "Incidents happen. MissionControl responds — with a safety harness." |

---

## 9. TRUEFORGE INTEGRATION PROOF (for Judges)

| What Judges Care About | How We Prove It |
|---|---|
| "Your agent runs on TrueForge" | Agent is created IN TrueForge, loop runs IN TrueForge |
| "Real tools via MCP" | Our custom MCP server connects real tool calls |
| "Sandbox execution" | Agent writes investigation scripts, runs in Daytona sandbox |
| "Human-in-the-loop" | Rollback pauses for approval — visible in demo |
| "Session persistence" | Show agent resuming after disconnect |
| "Not a thin wrapper" | TrueForge handles: model calls, tool routing, sandbox, approvals, context. We built: MCP server, dashboard, agent prompt, skill |

### 30-Second Judge Answer (Memorize)

> "TrueForge is our agent runtime. It manages the execution loop, routes tool calls to our custom MCP server, runs investigation code in a Daytona sandbox, and pauses for human approval before anything irreversible. We built the MCP server, the dashboard, and the agent configuration. Without TrueForge, none of this works."

---

## 10. PRE-HACKATHON (Aug 22–23 — TODAY)

> **Goal: Eliminate ALL unknowns before coding starts Aug 24.**

### Tonight (Aug 22)

- [ ] Install TrueForge: `npx @truefoundry/trueforge`
- [ ] Open UI at localhost:3000, explore
- [ ] Connect an LLM model (OpenAI key)
- [ ] Create a test agent, send a message, confirm it works
- [ ] Read: https://trueforge.dev/quickstart
- [ ] Read: https://trueforge.dev/key-features/overview
- [ ] Read: https://trueforge.dev/create-agent/overview

### Tomorrow (Aug 23)

- [ ] Build minimal `demo-infra-mcp` server (3 tools)
- [ ] Connect it to TrueForge as MCP server
- [ ] Verify agent can call your MCP tools
- [ ] Test human checkpoint (tool approval)
- [ ] Test sandbox code execution
- [ ] Install `@truefoundry/trueforge-ui` in a Next.js shell
- [ ] Confirm embedded chat component works
- [ ] Read SDK docs: https://trueforge.dev/api/quickstart

### End of Aug 23 — You Should Know

- [ ] How to create an agent (UI and API)
- [ ] How MCP servers connect
- [ ] How tool approval works
- [ ] How sandbox works (Daytona)
- [ ] How the SDK triggers conversations
- [ ] How the embeddable UI works
- [ ] What DOESN'T work as expected (document this!)

---

## 11. HACKATHON SCHEDULE (Aug 24–30)

### Day 1 (Aug 24) — Foundation

```
- New repo, install Qodo (Q Branch eligibility)
- TrueForge server setup (docker-compose for hosted mode)
- Create MissionControl agent config (system prompt + model)
- Build demo-infra-mcp server (all 8 tools)
- Connect MCP server to TrueForge
- SUCCESS: Agent can query simulated infrastructure via MCP
```

### Day 2 (Aug 25) — Agent Loop + Safety

```
- Write SKILL.md for incident response workflow
- Configure tool approval for rollback/restart
- Test full investigation flow: alert → investigate → diagnose
- Test approval gate: agent pauses for rollback approval
- Test sandbox: agent writes + runs investigation script
- SUCCESS: Full loop works with approval gate
```

### Day 3 (Aug 26) — Dashboard Foundation

```
- Next.js app with Tailwind + shadcn/ui
- Dashboard page (system status, alert feed)
- Incident detail page with embedded TrueForge chat
- Chaos injection panel
- Connect SDK to trigger agent from webhook
- SUCCESS: Dashboard shows live incident with embedded agent
```

### Day 4 (Aug 27) — Integration + Polish

```
- Wire chaos injection → alert → agent trigger → dashboard update
- Incident timeline component (auto-updates from agent messages)
- Metrics visualization (error rate chart)
- Test full end-to-end flow
- SUCCESS: One-click chaos → full incident resolution visible in dashboard
```

### Day 5 (Aug 28) — Nice-to-Haves + Hardening

```
- Subagent parallel investigation (if time)
- Generative UI for approval cards (if time)
- Multiple chaos scenarios (if time)
- Edge case handling, error states, loading states
- SUCCESS: System handles failures gracefully
```

### Day 6 (Aug 29) — UI Polish + Demo Prep

```
- Dashboard visual polish (animations, dark mode, responsive)
- Record demo attempts (practice 5+ times)
- Fix any bugs found during recording
- Write README (structure below)
- Screenshots for README
- SUCCESS: Demo works perfectly 3 times in a row
```

### Day 7 (Aug 30) — Freeze + Submit

```
NO NEW FEATURES.
- Final demo recording
- Final README polish
- Architecture diagram for README
- AI usage disclosure
- Submit before 20:00 London time
- SUCCESS: Submitted
```

---

## 12. README STRUCTURE

```markdown
# MissionControl
> Give your infrastructure an agent. Keep the kill switch.

## The Problem
## The Solution
## Demo Video
## How It Works (with diagram)
## TrueForge Integration
  ### What TrueForge Handles
  ### What We Built
  ### Why This Isn't a Wrapper
## Features
## Architecture
## Tech Stack
## Setup (judge can clone and run)
  ### Prerequisites
  ### Quick Start
## Safety & Control
## Screenshots
## Challenges & Learnings
## AI Usage Disclosure
## Team
```

---

## 13. PROJECT STRUCTURE

```
missioncontrol/
├── apps/
│   └── dashboard/           # Next.js + trueforge-ui
│       ├── app/
│       │   ├── page.tsx     # Dashboard
│       │   ├── incident/
│       │   └── chaos/
│       └── package.json
│
├── mcp-servers/
│   └── demo-infra/          # Our custom MCP server
│       ├── server.py        # FastMCP implementation
│       ├── state.py         # Simulated infrastructure state
│       └── scenarios.py     # Chaos scenarios
│
├── agent/
│   ├── system-prompt.md     # Agent system prompt
│   └── skills/
│       └── incident-response/
│           └── SKILL.md     # TrueForge skill
│
├── scripts/
│   └── setup.sh             # One-command setup
│
├── docker-compose.yml       # TrueForge + demo infra
├── README.md
└── .env.example
```

---

## 14. TECH STACK (Final)

| Layer | Technology | Why |
|---|---|---|
| Agent Runtime | TrueForge | Mandatory + handles the hard parts |
| LLM | OpenAI GPT-4o | Fast, reliable, good tool calling |
| MCP Server | Python + `mcp` package | Simple, fast to build |
| Dashboard | Next.js + TypeScript + Tailwind + shadcn/ui | Modern, polished |
| TrueForge Chat | `@truefoundry/trueforge-ui` | Embeddable agent chat |
| Agent Control | `@truefoundry/trueforge-sdk` | Programmatic trigger |
| Sandbox | Daytona (via TrueForge) | Built-in, no extra setup |

---

## 15. CONTINGENCY

| If This Fails | Do This Instead |
|---|---|
| Daytona sandbox unavailable | Skip sandbox demo, focus on MCP + approvals |
| Subagents don't work | Sequential investigation (still impressive) |
| Embedded UI SDK is buggy | Use TrueForge built-in UI, link to it from dashboard |
| MCP server connection issues | Debug using TrueForge logs, simplify to 3 tools |
| LLM rate limits during demo | Pre-cache responses, use cheaper model for rehearsal |
| Full loop too slow for demo | Pre-warm the agent, reduce investigation steps |

---

## 16. DECISION FILTER

For every feature request during the hackathon:

```
1. Does the demo work without it?    → YES → Cut it
2. Does it use a TrueForge feature?  → NO  → Deprioritize
3. Can it be built in < 2 hours?     → NO  → Cut it
4. Will a judge notice it?           → NO  → Cut it
```

---

## 17. WINNING CRITERIA ALIGNMENT

| Judging Criterion | Our Answer |
|---|---|
| **Harness doing real work** | TrueForge runs the agent loop, manages MCP, sandbox, approvals |
| **Real tools via MCP** | Our custom demo-infra-mcp server with 8 tools |
| **Safe execution** | Sandbox for investigation scripts, approval for actions |
| **Human-in-the-loop** | Visible approval gate — agent STOPS until human approves |
| **Repo quality** | Clean structure, clear README, judge can clone+run |
| **Demo** | Compelling 3-min story: alert → investigate → approve → resolve |
