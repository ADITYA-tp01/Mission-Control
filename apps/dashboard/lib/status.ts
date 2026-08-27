'use client'

import { cn } from '@/lib/utils'

export type ServiceStatus = 'healthy' | 'degraded' | 'down'
export type Severity = 'critical' | 'warning' | 'info'
export type Actor = 'agent' | 'human' | 'system'

/* ── Service status ──────────────────────────────────────────────────── */

export const statusTextClass: Record<ServiceStatus, string> = {
  healthy: 'text-ok',
  degraded: 'text-warn',
  down: 'text-bad',
}

export const statusBgClass: Record<ServiceStatus, string> = {
  healthy: 'bg-ok/10 text-ok border-ok/25',
  degraded: 'bg-warn/10 text-warn border-warn/25',
  down: 'bg-bad/10 text-bad border-bad/30',
}

export const statusDotClass: Record<ServiceStatus, string> = {
  healthy: 'bg-ok',
  degraded: 'bg-warn',
  down: 'bg-bad',
}

export const statusLabel: Record<ServiceStatus, string> = {
  healthy: 'NOMINAL',
  degraded: 'DEGRADED',
  down: 'OFFLINE',
}

/** Ambient page glow color driven by overall system health. */
export function systemHealth(services: { status: ServiceStatus }[]): {
  level: ServiceStatus
  glowColor: string
} {
  if (services.some((s) => s.status === 'down'))
    return { level: 'down', glowColor: 'hsl(var(--bad))' }
  if (services.some((s) => s.status === 'degraded'))
    return { level: 'degraded', glowColor: 'hsl(var(--warn))' }
  return { level: 'healthy', glowColor: 'hsl(var(--ok))' }
}

export const severityClass: Record<Severity, string> = {
  critical: 'bg-bad/10 text-bad border-bad/30',
  warning: 'bg-warn/10 text-warn border-warn/25',
  info: 'bg-info/10 text-info border-info/25',
}

export const actorClass: Record<Actor, string> = {
  agent: 'text-primary',
  human: 'text-ok',
  system: 'text-muted-foreground',
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "api-gateway" → "API GATEWAY" (service names read better upper-cased here) */
export function serviceName(s: string): string {
  return s.replace(/-/g, ' ').toUpperCase()
}
