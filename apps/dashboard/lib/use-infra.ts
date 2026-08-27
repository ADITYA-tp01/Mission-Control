'use client'

import { useEffect, useRef, useState } from 'react'

export interface InfraSnapshot {
  connected: boolean
  error?: string
  services: {
    name: string
    version: string
    status: 'healthy' | 'degraded' | 'down'
    error_rate: number
    latency_p99: number
    requests_per_minute: number
  }[]
  chaos: { active: boolean; service: string | null; type: string | null }
  alerts: {
    id: string
    service: string
    severity: 'critical' | 'warning' | 'info'
    message: string
    timestamp: string
    acknowledged: boolean
  }[]
  timeline: { timestamp: string; type: string; description: string; actor: 'agent' | 'human' | 'system' }[]
  deploys: {
    id: string
    service: string
    version: string
    timestamp: string
    changes: string[]
    author: string
  }[]
  sessions: Record<string, string>
}

const EMPTY: InfraSnapshot = {
  connected: false,
  services: [],
  chaos: { active: false, service: null, type: null },
  alerts: [],
  timeline: [],
  deploys: [],
  sessions: {},
}

export function useInfraSnapshot(intervalMs = 3000) {
  const [snapshot, setSnapshot] = useState<InfraSnapshot>(EMPTY)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/infra', { cache: 'no-store' })
        const data = (await res.json()) as InfraSnapshot
        if (!cancelled) {
          setSnapshot(data)
          setLastUpdate(new Date())
        }
      } catch {
        if (!cancelled) setSnapshot({ ...EMPTY })
      }
    }

    poll()
    timer.current = setInterval(poll, intervalMs)
    return () => {
      cancelled = true
      if (timer.current) clearInterval(timer.current)
    }
  }, [intervalMs])

  return { snapshot, lastUpdate }
}

export async function postAction(body: Record<string, unknown>): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch('/api/infra/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return { ok: res.ok, data }
  } catch (error) {
    return { ok: false, data: { error: String(error) } }
  }
}
