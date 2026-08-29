import { NextRequest, NextResponse } from 'next/server'
import { TrueForge } from '@truefoundry/trueforge-sdk'
import { attachAgentSession } from '@/lib/demo-infra'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, alert_type, message, agent_name } = body

    if (!service || !alert_type) {
      return NextResponse.json(
        { error: 'Missing required fields: service, alert_type' },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.TRUEFORGE_URL ||
      process.env.NEXT_PUBLIC_TRUEFORGE_URL ||
      'http://localhost:8790'
    const token = process.env.TRUEFORGE_API_KEY

    const client = new TrueForge({
      baseUrl,
      ...(token ? { token } : {}),
    })

    // Create a session bound to the MissionControl agent
    const session = await client.sessions.create({
      agent: { name: agent_name || 'missioncontrol' },
    })
    const sessionId = session.data.id

    const alertMessage = `ALERT: ${message || `${service} ${alert_type} detected`}

Please investigate this incident following the incident response protocol:
1. Use get_service_health to see overall system status
2. Use get_error_metrics for ${service}
3. Use get_service_logs with level="ERROR" for ${service}
4. Use get_recent_deploys to check recent changes
5. Correlate findings and diagnose root cause with a confidence level
6. Propose ONE remediation action; if it is irreversible (rollback/restart) request human approval first
7. After approval, execute, then verify metrics recovered

The affected service is: ${service}
Alert type: ${alert_type}`

    await client.sessions.createTurn(sessionId, {
      input: [{ type: 'user.message', content: alertMessage }],
    })

    // Attach the agent session to the incident so the dashboard can link to it.
    void attachAgentSession(service, sessionId).catch(() => {})

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Incident investigation started',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to trigger incident response',
        hint: `Is TrueForge running at ${process.env.TRUEFORGE_URL || process.env.NEXT_PUBLIC_TRUEFORGE_URL || 'http://localhost:8790'} with an agent named "missioncontrol"?`,
        details: String(error),
      },
      { status: 502 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'MissionControl Webhook Endpoint',
    usage: 'POST { service, alert_type, message?, agent_name? }',
    example: {
      service: 'payment-service',
      alert_type: 'error_spike',
      message: 'payment-service error rate exceeded 10%',
      agent_name: 'missioncontrol',
    },
  })
}
