---
name: incident-response
description: DevOps incident investigation and remediation workflow
---

# Incident Response Skill

When triggered by an alert, execute the following phases in order. Each phase must complete before moving to the next.

## Phase 1: Investigate
1. Call `get_service_health` to see overall system status
2. For the alerting service, call `get_error_metrics` to get detailed error rate and latency
3. Call `get_service_logs` with level="ERROR" to see recent errors (limit 30)
4. Call `get_recent_deploys` to see what changed recently (limit 10)

## Phase 2: Correlate
- Compare the timestamp of the error spike with recent deploy timestamps
- Check if the alerting service was recently deployed
- Look for configuration changes, dependency updates, or code changes in the deploy diffs
- Check if other services show similar symptoms (cascading failure)

## Phase 3: Diagnose
- State your hypothesis for the root cause
- Provide a confidence percentage (0-100%)
- If confidence < 70%, STOP and ask the human for guidance
- Explain your reasoning with evidence from the investigation

## Phase 4: Plan
Propose ONE remediation action:
- `rollback_deploy` - if a recent deploy caused the issue (requires approval)
- `restart_service` - if the service is in a bad state but no recent deploy (requires approval)
- `no_action` - if the issue is self-resolving or needs human investigation

For approval-required actions:
- Clearly state what will happen
- Explain why this is the right action
- Note that this is IRREVERSIBLE

## Phase 5: Execute (After Approval)
- Call the approved tool (`rollback_deploy` or `restart_service`)
- Wait for the result

## Phase 6: Verify
- Call `get_error_metrics` again for the affected service
- Call `get_service_health` to confirm overall system is healthy
- Confirm error rate returned to baseline (< 1%) and latency is normal

## Phase 7: Report
Generate a summary including:
- Incident timeline (from `get_incident_timeline`)
- Root cause and confidence
- Action taken
- Verification results
- Time to resolution
- Number of human approvals required

---

## Tool Reference

### Read-Only Tools (No Approval)
- `get_service_health()` - Overall system status
- `get_error_metrics(service)` - Detailed metrics for one service
- `get_recent_deploys(limit)` - Recent deployment history
- `get_service_logs(service, limit, level)` - Service logs
- `get_incident_timeline()` - Current incident events

### Write Tools (Require Approval)
- `rollback_deploy(service, deploy_id)` - Rollback to previous version
- `restart_service(service)` - Restart the service

### Demo-Only Tools (NEVER call these as the agent)
- `inject_chaos(service, chaos_type)` - Injects failures into the simulated infrastructure.
  This is exclusively a **human demo control** (dashboard / CLI). The agent must never call it:
  chaos exists to *create* the incidents you respond to — causing incidents is never your job.

---

## Decision Matrix

| Symptom Pattern | Likely Cause | Action |
|---|---|---|
| Error spike + recent deploy on same service | Bad deploy | rollback_deploy |
| Error spike + no recent deploy | Transient issue / dependency | restart_service |
| High latency + normal error rate | Resource exhaustion | restart_service |
| Multiple services affected | Shared dependency / infra | Ask human |
| Error spike after chaos injection | Demo scenario | rollback_deploy or restart_service |

---

## Example Flow

```
ALERT: payment-service error rate > 10%

1. INVESTIGATE
   - get_service_health() → payment-service: degraded, 12.3% errors
   - get_error_metrics("payment-service") → 12.3% errors, 2400ms p99
   - get_service_logs("payment-service", level="ERROR") → timeout errors
   - get_recent_deploys() → deploy-002 (payment-service v1.8.3) 2 hours ago

2. CORRELATE
   - Error spike started ~30 min after deploy-002
   - Deploy changes: "Retry logic fix, Idempotency keys"
   - Timeout errors match retry logic changes

3. DIAGNOSE
   - Root cause: deploy-002 introduced retry storm causing timeouts
   - Confidence: 94%

4. PLAN
   - Action: rollback_deploy("payment-service", "deploy-002")
   - Reason: Recent deploy directly correlates with symptom onset
   - Note: IRREVERSIBLE - will revert to v1.8.2

5. EXECUTE (after approval)
   - rollback_deploy("payment-service", "deploy-002") → success

6. VERIFY
   - get_error_metrics("payment-service") → 0.4% errors, 120ms p99 ✓

7. REPORT
   - Timeline: chaos injected → alert → investigation → rollback → verified
   - Resolution: 4 minutes, 1 approval, 7 tool calls
```