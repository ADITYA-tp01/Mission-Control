# MissionControl — 3-Minute Demo Script (Detailed)

## Video Specs
- Duration: 2:45 to 3:00
- Resolution: 1080p
- Format: MP4
- Style: Screen recording with voiceover

---

## SCENE 1 — About the Project (0:00 – 0:30)

**[SCREEN: Clean desktop. Open PowerShell terminal. Type `ls` to show project folder.]**

**SAY:**
"MissionControl is an autonomous DevOps incident-response agent. It monitors a microservices stack, detects failures in real time, and automatically remediates them. But here's the important part: it never acts without human approval. Every risky operation goes through a hold-to-confirm gate. Built for SRE teams who want faster incident response without losing control."

**[SCREEN: Open browser to http://localhost:3001. Show the Home page with all three services green.]**

**SAY:**
"This is the dashboard. Three services: PostgreSQL, Redis, and the application server. All green. All healthy right now. Let me show you what happens when one fails."

---

## SCENE 2 — Tech Stack and Architecture (0:30 – 1:00)

**[SCREEN: Switch to VS Code. Open the project root folder.]**

**SAY:**
"Four components. TrueForge runs the agent and enforces approval gates. A FastMCP server gives the agent five tools — list services, get metrics, inject chaos, rollback, and restart. Docker Compose boots PostgreSQL, Redis, and the application server. And a Next.js dashboard visualizes everything."

**[SCREEN: Open mcp-servers/demo-infra/server.py. Scroll to the tool definitions.]**

**SAY:**
"This is the MCP server. The agent calls tools through it. list_services returns all service health. get_service_metrics returns CPU, memory, and error rate. rollback_deploy and restart_service require explicit human consent. The agent cannot bypass this."

**[SCREEN: Open agent/system-prompt.md. Highlight the approval rule.]**

**SAY:**
"The agent's system prompt enforces this. Think before acting. Never execute risky operations without approval. Always verify after remediation."

---

## SCENE 3 — Demo: Inject Chaos (1:00 – 1:40)

**[SCREEN: Switch to PowerShell terminal.]**

**SAY:**
"I'm going to inject a CPU spike into the API gateway. Watch the dashboard."

**[TYPE]:**
```powershell
python scripts/trigger_incident.py api-gateway cpu_spike
```

**[SCREEN: Switch to browser. Show the Home page. The api-gateway health badge turns red.]**

**SAY:**
"Done. The API gateway just spiked to 95 percent CPU. The dashboard shows it red. An active incident has been created."

**[SCREEN: Switch to TrueForge terminal. Show the agent output.]**

**SAY:**
"Watch the agent. It's polling the MCP server every few seconds."

**[SCREEN: Show agent calling list_services, then get_service_metrics.]**

**SAY:**
"There. It called list_services, saw the API gateway is unhealthy. Then it called get_service_metrics to investigate. CPU at 95 percent, error rate climbing. It's reasoning about what to do."

**[SCREEN: Show agent output: "Recommending rollback of api-gateway to restore health."]**

**SAY:**
"It decided the best action is to roll back the deployment. But it can't do that without my approval."

---

## SCENE 4 — Demo: Human Approval Gate (1:40 – 2:15)

**[SCREEN: Show TrueForge approval prompt.]**

**SAY:**
"Here's the gate. The agent is asking: 'Roll back api-gateway to restore health. Approve or reject?' This is the human-in-the-loop moment. I click approve."

**[SCREEN: Show approval granted. Agent calling rollback_deploy through MCP.]**

**SAY:**
"Approved. The agent called rollback_deploy on the MCP server. The service is rolling back."

**[SCREEN: Wait 5 seconds. Show agent output: "Rollback complete. Verifying health."]**

**SAY:**
"Rollback complete. The agent is now verifying that health is restored."

**[SCREEN: Switch to browser. Show the Home page. All three health badges are green again.]**

**SAY:**
"All green. PostgreSQL, Redis, API gateway. Health restored. Total time from injection to resolution: under thirty seconds."

---

## SCENE 5 — Demo: Verification (2:15 – 2:35)

**[SCREEN: Navigate to the Incident page.]**

**SAY:**
"The incident timeline shows the full lifecycle."

**[SCREEN: Show timeline entries: chaos injected, agent detected, approval granted, remediation executed, health restored.]**

**SAY:**
"Chaos injected. Agent detected. Approval granted. Remediation executed. Health restored. Every step logged."

**[SCREEN: Switch to terminal.]**

**[TYPE]:**
```powershell
curl -s http://localhost:8001/api/state
```

**[SCREEN: Show JSON output — no active incidents, all services healthy.]**

**SAY:**
"API confirms it. No active incidents. All services healthy. Clean."

---

## SCENE 6 — Learning and Closing (2:35 – 3:00)

**[SCREEN: Switch to GitHub. Show PR #5 with Qodo review comments.]**

**SAY:**
"We also used Qodo PR-Agent for automated code review. It caught sixteen issues across two pull requests. Hardcoded personal paths, missing build context, unsafe process cleanup. We fixed every one. Two were false positives — dismissed with documented reasoning. Full audit trail in the PR history."

**[SCREEN: Switch back to dashboard. All green.]**

**SAY:**
"MissionControl. Autonomous incident response with human-in-the-loop approval. Built with TrueForge, MCP, and Qodo. Thank you."

**[SCREEN: Show GitHub repo URL for 3 seconds.]**
```
https://github.com/ADITYA-tp01/Mission-Control
```

---

## Timing Summary

| Scene | Duration | Content |
|---|---|---|
| 1 | 0:00 – 0:30 | About the project |
| 2 | 0:30 – 1:00 | Tech stack and architecture |
| 3 | 1:00 – 1:40 | Demo: inject chaos + agent detects |
| 4 | 1:40 – 2:15 | Demo: human approval gate + remediation |
| 5 | 2:15 – 2:35 | Demo: verification |
| 6 | 2:35 – 3:00 | Learning + closing |
| **Total** | **3:00** | |

## Commands Used

```powershell
# Setup (run before recording)
git clone https://github.com/ADITYA-tp01/Mission-Control.git
cd Mission-Control
.\scripts\setup.ps1

# Start TrueForge (separate terminal)
npx @truefoundry/trueforge

# Inject chaos
python scripts/trigger_incident.py api-gateway cpu_spike

# Verify state
curl -s http://localhost:8001/api/state
```

## Pre-Recording Checklist

- [ ] Docker Desktop running
- [ ] Node.js 18+ installed
- [ ] Python 3.10+ installed
- [ ] OpenAI API key in .env
- [ ] TrueForge configured with MCP server connected
- [ ] Browser open to localhost:3001
- [ ] PowerShell terminal ready
- [ ] Screen recording software running
- [ ] Desktop clean (no unrelated tabs)
- [ ] Microphone tested

## Post-Recording Checklist

- [ ] Video is under 3:00
- [ ] All text on screen is readable (not blurry)
- [ ] Audio is clear
- [ ] Health badge color change is visible (green to red to green)
- [ ] TrueForge approval prompt is visible
- [ ] Agent reasoning is visible in TrueForge terminal
- [ ] No personal info visible
