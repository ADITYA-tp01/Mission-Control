import { NextResponse } from 'next/server'
import { getSnapshot } from '@/lib/demo-infra'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snapshot = await getSnapshot()
    return NextResponse.json({ connected: true, ...snapshot })
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: `demo-infra MCP server unreachable (${String(error)})`,
        services: [],
        chaos: { active: false, service: null, type: null },
        alerts: [],
        timeline: [],
        deploys: [],
        sessions: {},
      },
      { status: 200 }
    )
  }
}
