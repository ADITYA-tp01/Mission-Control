const BASE_URL =
  process.env.DEMO_INFRA_API_URL || 'http://localhost:8001'

export interface ServiceHealth {
  name: string
  version: string
  status: 'healthy' | 'degraded' | 'down'
  error_rate: number
  latency_p99: number
  requests_per_minute: number
}

export interface Alert {
  id: string
  service: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  acknowledged: boolean
}

export interface TimelineEvent {
  timestamp: string
  type: string
  description: string
  actor: 'agent' | 'human' | 'system'
}

export interface Deploy {
  id: string
  service: string
  version: string
  timestamp: string
  changes: string[]
  author: string
}

export interface MetricPoint {
  timestamp: string
  error_rate: number
  latency_p99: number
  status: string
}

export interface InfraSnapshot {
  services: ServiceHealth[]
  chaos: { active: boolean; service: string | null; type: string | null }
  alerts: Alert[]
  timeline: TimelineEvent[]
  deploys: Deploy[]
  sessions: Record<string, string>
}

async function infraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = JSON.stringify(await res.json())
    } catch {
      /* ignore */
    }
    throw new Error(`demo-infra API ${res.status}: ${detail || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function getSnapshot(): Promise<InfraSnapshot> {
  return Promise.all([
    infraFetch<{ services: ServiceHealth[]; chaos: InfraSnapshot['chaos'] }>('/api/services'),
    infraFetch<{ alerts: Alert[] }>('/api/alerts'),
    infraFetch<{ timeline: TimelineEvent[] }>('/api/timeline'),
    infraFetch<{ deploys: Deploy[] }>('/api/deploys?limit=10'),
    infraFetch<{ sessions: Record<string, string> }>('/api/sessions'),
  ]).then(([services, alerts, timeline, deploys, sessions]) => ({
    services: services.services,
    chaos: services.chaos,
    alerts: alerts.alerts,
    timeline: timeline.timeline,
    deploys: deploys.deploys,
    sessions: sessions.sessions,
  }))
}

export function getMetrics(service: string): Promise<{
  current: ServiceHealth & { chaos_active?: boolean }
  history: MetricPoint[]
}> {
  return infraFetch(`/api/services/${encodeURIComponent(service)}/metrics?limit=60`)
}

export function getLogs(service: string, level?: string, limit = 50) {
  const params = new URLSearchParams({ service, limit: String(limit) })
  if (level) params.set('level', level)
  return infraFetch<{ logs: { timestamp: string; service: string; level: string; message: string }[] }>(
    `/api/logs?${params.toString()}`
  )
}

export function injectChaos(service: string, chaosType: string) {
  return infraFetch('/api/chaos', {
    method: 'POST',
    body: JSON.stringify({ service, chaos_type: chaosType }),
  })
}

export function remediate(action: 'rollback' | 'restart', service: string, deployId?: string) {
  return infraFetch<{ status: string; message: string }>('/api/remediate', {
    method: 'POST',
    body: JSON.stringify({ action, service, deploy_id: deployId }),
  })
}

export function acknowledgeAlert(alertId: string) {
  return infraFetch(`/api/alerts/${encodeURIComponent(alertId)}/ack`, { method: 'POST' })
}

export function resetDemo() {
  return infraFetch('/api/reset', { method: 'POST' })
}

export function attachAgentSession(service: string, sessionId: string) {
  return infraFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ service, session_id: sessionId }),
  })
}
