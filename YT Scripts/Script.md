# MissionControl — 3-Minute Demo Script (Highly Detailed)

## Video Specs
- **Duration**: 2:45 to 3:00
- **Resolution**: 1080p
- **Format**: MP4
- **Style**: Screen recording with voiceover

---

## SCENE 1 — About the Project (0:00 – 0:30)

**[SCREEN: Clean desktop. Open PowerShell terminal in the project folder.]**

**[TYPE IN POWERSHELL]:**
```powershell
ls
```

**SAY:**
"MissionControl is an autonomous DevOps incident-response agent. It monitors a microservices stack, detects failures in real time, and automatically remediates them. But here's the important part: it never acts without human approval. Every risky operation goes through a hold-to-confirm gate. Built for SRE teams who want faster incident response without losing control."

**[SCREEN: Open browser to http://localhost:3001. Show the Home page with all services green.]**

**SAY:**
"This is the dashboard. We have four microservices running, including api-gateway and payment-service. All green. All healthy right now. Let me show you what happens when one fails."

---

## SCENE 2 — Tech Stack and Architecture (0:30 – 1:00)

**[SCREEN: Switch to VS Code. Open the project root folder.]**

**SAY:**
"Four components. TrueForge runs the agent and enforces approval gates. A FastMCP server gives the agent tools like listing services, getting metrics, injecting chaos, and rolling back deploys. Docker Compose runs PostgreSQL, Redis, and the backend. And a Next.js dashboard visualizes everything."

**[SCREEN: Open mcp-servers/demo-infra/server.py. Scroll to the tool definitions.]**

**SAY:**
"This is the MCP server. The agent calls tools through it. `list_services` returns service health. `rollback_deploy` requires explicit human consent. The agent cannot bypass this."

**[SCREEN: Open agent/system-prompt.md. Highlight the approval rule.]**

**SAY:**
"The agent's system prompt enforces this. Think before acting. Never execute risky operations without approval."

---

## SCENE 3 — Demo: Inject Chaos (1:00 – 1:40)

**[SCREEN: Switch to browser. Open the Dashboard at http://localhost:3001 and click on "Chaos Lab".]**

**SAY:**
"I'm going to inject an error spike into the payment service using our Chaos Lab UI. Watch what happens."

**[SCREEN: In Chaos Lab, select `payment-service` and choose `error_spike`. Click the "Inject" button.]**

**[SCREEN: Navigate back to the Home page or Incident page on the dashboard. Show the payment-service badge turning red.]**

**SAY:**
"Done. The payment service just spiked to a 40 percent error rate. The dashboard shows it's degraded, and an active incident has immediately been created in our system."

**[SCREEN: Switch to TrueForge UI. Open the chat with the `missioncontrol` agent.]**

**SAY:**
"Now we switch to our TrueForge agent. I'll prompt it to investigate the alert."

**[PASTE THIS EXACT PROMPT INTO TRUEFORGE CHAT]:**
```text
Please investigate the payment-service. It seems to have an error spike. 

Here is the data from our systems:
1. Overall system health: All services healthy, but payment-service shows error_rate of 40%.
2. Error metrics for payment-service: version v1.8.3, status healthy, error_rate 0.4, latency_p99 120.
3. Recent error logs: No explicit ERROR level logs found. Only INFO/WARN logs.
4. Recent deploys: deploy-003 (version v1.8.3) - changes: ['Retry logic fix', 'Idempotency keys'].

Analyze this data, determine the root cause, and propose a remediation. Do not ask any clarifying questions or use tools to request more info; just provide your final analysis and recommendation immediately.
```

**[SCREEN: Show agent responding immediately with the analysis.]**

**SAY:**
"The agent investigates the metrics and logs I provided. It finds that `deploy-003` was just rolled out with a retry logic fix that is causing silent failures."

---

## SCENE 4 — Demo: Human Approval Gate (1:40 – 2:15)

**[SCREEN: Show agent output recommending rollback of payment-service.]**

**SAY:**
"It diagnosed the root cause and decided the best action is to roll back the deployment to the previous version. But it can't do that without my approval. This is the human-in-the-loop moment."

**[TYPE THIS INTO TRUEFORGE TO APPROVE]:**
```text
Approved. Proceed with the rollback.
```

**[SCREEN: Show agent acknowledging the approval and automatically executing the rollback tool.]**

**SAY:**
"I approved it. The agent calls the rollback tool through the MCP server. The rollback to version 1.8.2 is executed, and the agent automatically verifies the health."

**[SCREEN: Switch to browser. Show the Home page. All health badges are green again.]**

**SAY:**
"All green. Health restored. Total time from injection to resolution: under thirty seconds."

---

## SCENE 5 — Demo: Verification (2:15 – 2:35)

**[SCREEN: Navigate to the Incident page on the dashboard.]**

**SAY:**
"The incident timeline shows the full lifecycle: Chaos injected. Agent detected. Approval granted. Remediation executed. Health restored. Every step logged."

**[SCREEN: Switch to terminal.]**

**[TYPE IN POWERSHELL]:**
```powershell
Invoke-RestMethod http://localhost:8001/api/services
```

**[SCREEN: Show JSON output — no active incidents, all services healthy.]**

**SAY:**
"API confirms it. No active incidents. All services healthy. Clean."

---

## SCENE 6 — Learning and Closing (2:35 – 3:00)

**[SCREEN: Switch to GitHub. Show PR #5 with Qodo review comments.]**

**SAY:**
"We also used Qodo PR-Agent for automated code review. It caught sixteen issues across two pull requests. We fixed every one. Full audit trail in the PR history."

**[SCREEN: Switch back to dashboard. All green.]**

**SAY:**
"MissionControl. Autonomous incident response with human-in-the-loop approval. Built with TrueForge, MCP, and Qodo. Thank you."

**[SCREEN: Show GitHub repo URL for 3 seconds.]**
```text
https://github.com/ADITYA-tp01/Mission-Control
```
