import { NextRequest, NextResponse } from 'next/server'
import { getMetrics, getLogs } from '@/lib/demo-infra'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const service = params.get('service')
  if (!service) {
    return NextResponse.json({ error: 'Missing required param: service' }, { status: 400 })
  }
  const level = params.get('level') || undefined

  try {
    const [metrics, logs] = await Promise.all([
      getMetrics(service),
      getLogs(service, level, Number(params.get('logLimit') || 30)),
    ])
    return NextResponse.json({ connected: true, ...metrics, logs: logs.logs })
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: String(error), current: null, history: [], logs: [] },
      { status: 200 }
    )
  }
}
