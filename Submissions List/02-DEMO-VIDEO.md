# 02 — Demo Video

## Video Specifications

| Field | Value |
|---|---|
| **Duration** | ~3 minutes (2:30–3:30 acceptable) |
| **Resolution** | 1080p minimum (1920x1080) |
| **Format** | MP4 (H.264) |
| **Host** | YouTube (unlisted) or Loom |
| **Submission** | Link in hackathon portal |

---

## Why This Video Matters

The judges need to see:
1. **Real tools executing in a sandbox** — not slides, not mockups, actual code running
2. **The human approval gate** — the hold-to-confirm button that proves humans stay in control
3. **End-to-end flow** — from chaos injection to automated remediation

---

## Pre-Recording Checklist

Before you hit record, make sure everything is running:

```bash
# Terminal 1: Verify containers are healthy
docker compose ps
# All 3 services should show "Up" and healthy

# Terminal 2: Verify dashboard is running
curl -s http://localhost:3001
# Should return HTML (HTTP 200)

# Terminal 3: Verify MCP server is healthy
curl -s http://localhost:8001/health
# Should return {"status": "healthy"}

# Terminal 4: Verify TrueForge is running
# Should show "Agent server started" in the terminal
```

**Also verify:**
- [ ] Browser is open to `http://localhost:3001`
- [ ] No error messages in any terminal
- [ ] Screen recording software is ready (OBS, QuickTime, or built-in)
- [ ] Microphone is on (if narrating)
- [ ] Desktop is clean (close unrelated tabs/apps)

---

## Recording Script — Scene by Scene

### Scene 1: Introduction (0:00 – 0:20)

**What to show:**
- Title screen or terminal with the repo name
- Quick verbal intro: "This is MissionControl, an autonomous DevOps incident-response agent built for The Agent Harness hackathon"

**What to say:**
> "MissionControl monitors a simulated microservices stack, detects chaos events, and automatically remediates them — with a human approval gate for risky operations. It uses TrueForge as the agent harness, an MCP server for tool execution, and a Next.js dashboard for visualization."

**Screen:**
- Show the GitHub repo page OR the terminal with `ls` output showing the project structure

---

### Scene 2: Setup (0:20 – 0:50)

**What to show:**
- Running the setup script
- Containers starting
- Dashboard building

**Commands to run on screen:**
```bash
# Clone (if not already cloned)
git clone https://github.com/ADITYA-tp01/Mission-Control.git
cd Mission-Control

# Setup (Windows)
.\scripts\setup.ps1

# OR (Linux/macOS)
./scripts/setup.sh
```

**What to say:**
> "Running the setup script checks prerequisites, starts PostgreSQL, Redis, and the demo-infra MCP server via Docker Compose, installs dashboard dependencies, and starts the Next.js dashboard on port 3001."

**Screen:**
- Show the setup script output scrolling
- Highlight the "MCP server healthy" message
- Show "Dashboard starting on http://localhost:3001"

---

### Scene 3: Dashboard Overview (0:50 – 1:10)

**What to show:**
- Open `http://localhost:3001` in the browser
- Navigate through the dashboard pages

**Pages to visit:**
1. **Home** (`/`) — Infrastructure health overview
   - Show service cards (PostgreSQL, Redis, demo-infra-mcp)
   - Point out the green health badges
2. **Chaos** (`/chaos`) — Chaos injection page
   - Show the service selector dropdown
   - Show the chaos type selector (cpu_spike, memory_leak, disk_fill, network_latency, process_crash)
   - Show the "Hold to Confirm" button (disabled until selections are made)
3. **Incident** (`/incident`) — Incident response page
   - Show that it's currently empty (no active incidents)

**What to say:**
> "The dashboard shows the current state of our infrastructure. All services are healthy. The Chaos page lets us inject failures, and the Incident page will show the agent's response."

---

### Scene 4: Inject Chaos (1:10 – 1:40)

**What to show:**
- Navigate to the Chaos page
- Select a service and chaos type
- Hold the confirmation button
- Watch the state change

**Steps:**
1. Go to `http://localhost:3001/chaos`
2. Select **Service**: `api-gateway`
3. Select **Chaos Type**: `cpu_spike`
4. Click and **hold** the "Confirm Injection" button for 2 seconds
5. Watch the dashboard update — service health turns red/orange

**What to say:**
> "I'm injecting a CPU spike into the api-gateway service. The hold-to-confirm button ensures this is intentional — you can't accidentally trigger chaos. The dashboard now shows the service is degraded."

**Screen:**
- Show the button being held (the fill animation)
- Show the health badge changing from green to red
- Show the incident count incrementing

---

### Scene 5: Agent Response (1:40 – 2:20)

**What to show:**
- The agent detecting the incident
- The agent deciding to remediate
- The human approval gate
- The remediation executing

**What happens automatically:**
- TrueForge agent polls the MCP server
- Agent detects the chaos event via `get_service_metrics`
- Agent decides to remediate (rollback or restart)
- Agent requests approval via the approval gate

**Steps:**
1. Switch to the TrueForge terminal — show the agent's reasoning
2. Show the agent calling `get_service_metrics("api-gateway")`
3. Show the agent deciding: "CPU is at 95%, recommending rollback"
4. Show the approval prompt in TrueForge
5. Approve the action
6. Switch back to the dashboard — show the incident resolving

**What to say:**
> "The agent detected the CPU spike, analyzed the metrics, and decided to roll back the deployment. It's asking for human approval before executing — this is the human-in-the-loop gate. I'm approving the rollback now."

**Screen:**
- TrueForge terminal showing agent reasoning
- Approval prompt
- Dashboard showing incident status changing from "Active" to "Remediating" to "Resolved"

---

### Scene 6: Verification (2:20 – 2:40)

**What to show:**
- Health restored to green
- Incident timeline showing the full lifecycle
- Metrics returning to normal

**Steps:**
1. Go to the Home page — show all services green again
2. Go to the Incident page — show the timeline:
   - Chaos injected at T+0
   - Agent detected at T+1
   - Approval granted at T+2
   - Remediation executed at T+3
   - Health restored at T+4
3. Optionally show the REST API response:
   ```bash
   curl -s http://localhost:8001/api/state | python -m json.tool
   ```

**What to say:**
> "The rollback completed successfully. All services are healthy again. The incident timeline shows the full lifecycle from detection to resolution."

---

### Scene 7: Closing (2:40 – 3:00)

**What to show:**
- Quick recap of the architecture (optional: show the README architecture diagram)
- Mention the key technologies

**What to say:**
> "MissionControl uses TrueForge as the agent harness, an MCP server with 5 tools for infrastructure management, a Next.js dashboard for visualization, and a human-in-the-loop approval gate for safety. All code is open source on GitHub. Thank you."

**Screen:**
- GitHub repo page OR architecture diagram from README

---

## Optional Enhancements

### If you want to show more depth:

**CLI incident trigger:**
```bash
# In a separate terminal
python scripts/trigger_incident.py api-gateway cpu_spike
```
Show the chaos being injected via CLI instead of the dashboard.

**MCP server tools:**
```bash
# Show the REST API directly
curl -s http://localhost:8001/api/state | python -m json.tool
curl -s -X POST http://localhost:8001/api/chaos/inject \
  -H "Authorization: Bearer local-demo-token" \
  -H "Content-Type: application/json" \
  -d '{"service": "api-gateway", "chaos_type": "cpu_spike"}'
```

**Unit tests:**
```bash
cd mcp-servers/demo-infra
python test_state.py
# Show 16/16 tests passing
```

---

## Post-Recording Checklist

After recording, verify:

- [ ] Video is under 3:30
- [ ] All text on screen is readable (not blurry)
- [ ] Audio is clear (if narrating)
- [ ] The hold-to-confirm button is clearly visible
- [ ] The agent's reasoning is visible in TrueForge terminal
- [ ] The health badges change color (green → red → green)
- [ ] No unrelated content (personal files, other tabs, notifications)

---

## Upload Checklist

- [ ] Upload to YouTube (unlisted) or Loom
- [ ] Copy the shareable link
- [ ] Paste the link in the hackathon submission portal
- [ ] Test the link in an incognito window to make sure it works
