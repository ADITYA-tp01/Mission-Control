import { NextRequest, NextResponse } from 'next/server'
import { injectChaos, remediate, acknowledgeAlert, resetDemo } from '@/lib/demo-infra'

export const dynamic = 'force-dynamic'

interface ActionBody {
  type?: 'chaos' | 'remediate' | 'ack' | 'reset'
  service?: string
  chaos_type?: string
  method?: 'rollback' | 'restart'
  deploy_id?: string
  alert_id?: string
}

export async function POST(request: NextRequest) {
  let body: ActionBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    switch (body.type) {
      case 'chaos': {
        if (!body.service) {
          return NextResponse.json({ error: 'service is required' }, { status: 400 })
        }
        const chaosType = body.chaos_type || 'error_spike'
        const result = await injectChaos(body.service, chaosType)
        void triggerAgent(request.nextUrl.origin, body.service, chaosType)
        return NextResponse.json(result)
      }
      case 'remediate': {
        if (!body.service) {
          return NextResponse.json({ error: 'service is required' }, { status: 400 })
        }
        if (body.method === 'rollback' && !body.deploy_id) {
          return NextResponse.json(
            { error: 'deploy_id is required for rollback' },
            { status: 400 }
          )
        }
        const result = await remediate(body.method === 'rollback' ? 'rollback' : 'restart', body.service, body.deploy_id)
        return NextResponse.json(result)
      }
      case 'ack': {
        if (!body.alert_id) {
          return NextResponse.json({ error: 'alert_id is required' }, { status: 400 })
        }
        return NextResponse.json(await acknowledgeAlert(body.alert_id))
      }
      case 'reset': {
        return NextResponse.json(await resetDemo())
      }
      default:
        return NextResponse.json(
          { error: "type must be one of 'chaos', 'remediate', 'ack', 'reset'" },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 })
  }
}

async function triggerAgent(origin: string, service: string, chaosType: string): Promise<void> {
  if (process.env.AUTO_TRIGGER_AGENT === 'false') return
  try {
    await fetch(`http://127.0.0.1:3001/api/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service,
        alert_type: chaosType,
        message: `${service} ${chaosType.replace('_', ' ')} detected by chaos panel`,
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    // Agent trigger is best-effort; the dashboard still shows the incident.
  }
}
