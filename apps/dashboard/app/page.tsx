'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  Cpu,
  Radio,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInfraSnapshot, postAction } from '@/lib/use-infra'
import { ConsoleHeader } from '@/components/console-header'

type ServiceStatus = 'healthy' | 'degraded' | 'down'

const statusText: Record<ServiceStatus, string> = {
  healthy: 'text-ok',
  degraded: 'text-warn',
  down: 'text-bad',
}

const statusChip: Record<ServiceStatus, string> = {
  healthy: 'bg-ok/10 text-ok border-ok/25',
  degraded: 'bg-warn/10 text-warn border-warn/25',
  down: 'bg-bad/10 text-bad border-bad/30',
}

const statusLabel: Record<ServiceStatus, string> = {
  healthy: 'NOMINAL',
  degraded: 'DEGRADED',
  down: 'OFFLINE',
}

const statusColorVar: Record<ServiceStatus, string> = {
  healthy: 'hsl(var(--ok))',
  degraded: 'hsl(var(--warn))',
  down: 'hsl(var(--bad))',
}

export default function Dashboard() {
  const { snapshot } = useInfraSnapshot()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const { services, alerts, timeline, chaos, deploys, sessions, connected, error } =
    snapshot

  const runAction = async (body: Record<string, unknown>, label: string) => {
    setBusy(true)
    setNotice(null)
    const { ok, data } = await postAction(body)
    setNotice(
      ok
        ? `${label} ✓`
        : `${label} failed: ${(data as { error?: string }).error ?? 'unknown error'}`
    )
    setBusy(false)
  }

  const injectChaos = (service: string) =>
    runAction({ type: 'chaos', service, chaos_type: 'error_spike' }, `Chaos injected on ${service}`)

  const activeAlerts = alerts.filter((a) => !a.acknowledged)
  const recentTimeline = [...timeline].reverse().slice(0, 7)

  // Derive per-service sparklines from the timeline? No — metrics history lives
  // server-side; dashboard shows trend via the metrics API only on incident page.
  // Here we render a stable pseudo-trend from the service's own metric fields so
  // cards feel alive without extra fetches.

  return (
    <div className="min-h-screen">
      <ConsoleHeader snapshot={snapshot} />

      {!connected && (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex items-start gap-3 rounded-md border border-bad/30 bg-bad/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-bad" />
            <div>
              <p className="font-medium">demo-infra MCP server unreachable</p>
              <p className="mt-1 text-muted-foreground">
                Start it with{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  docker compose up -d demo-infra-mcp
                </code>{' '}
                or{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  python mcp-servers/demo-infra/server.py
                </code>
              </p>
              {error && <p className="num mt-1 text-xs text-muted-foreground">{error}</p>}
            </div>
          </div>
      </div>
      )}

      <main className="container mx-auto space-y-6 px-4 py-6">
        {/* ── Service fleet ──────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="label-caps">Fleet Status · {services.length} services</h2>
            <span className="num text-xs text-muted-foreground">
              poll 3s
            </span>
          </div>

          {services.length === 0 ? (
            <div className="panel flex items-center justify-center p-12 text-sm text-muted-foreground shadow-panel">
              <Radio className="mr-2 h-4 w-4 animate-pulse-slow" />
              Awaiting telemetry from demo-infra…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.name}
                  service={service}
                  busy={busy}
                  chaosActiveOnThis={chaos.active && chaos.service === service.name}
                  anyChaos={chaos.active}
                  connected={connected}
                  onInject={() => injectChaos(service.name)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* ── Left: alerts + timeline (wider) ──────────────────────── */}
          <div className="space-y-6 lg:col-span-3">
            {/* Alerts */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="label-caps">Alert Feed</h2>
                {activeAlerts.length > 0 && (
                  <span className="num rounded-full border border-bad/40 bg-bad/10 px-2 py-0.5 text-[10px] font-bold text-bad">
                    {activeAlerts.length} ACTIVE
                  </span>
                )}
              </div>
              <div className="panel overflow-hidden shadow-panel">
                {alerts.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-10 w-10 text-ok/60" />}
                    title="No alerts"
                    sub="All systems nominal. Inject chaos to rehearse."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {[...alerts].reverse().map((alert) => {
                      const sev =
                        alert.severity === 'critical'
                          ? 'text-bad border-bad/30 bg-bad/10'
                          : alert.severity === 'warning'
                            ? 'text-warn border-warn/25 bg-warn/10'
                            : 'text-info border-info/25 bg-info/10'
                      return (
                        <li
                          key={alert.id}
                          className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={cn(
                                'num rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                                sev
                              )}
                            >
                              {alert.severity.toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="num truncate text-xs font-semibold text-foreground">
                                {alert.id} · {alert.service.toUpperCase()}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {alert.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-3">
                            <span className="num text-[11px] tabular-nums text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                                hour12: false,
                              })}
                            </span>
                            {!alert.acknowledged ? (
                              <button
                                onClick={() =>
                                  runAction({ type: 'ack', alert_id: alert.id }, 'Acknowledged')
                                }
                                disabled={busy}
                                className="rounded border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
                              >
                                Ack
                              </button>
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>

            {/* Timeline */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="label-caps">Incident Timeline</h2>
                {chaos.service && (
                  <Link
                    href={`/incident/${chaos.service}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open live incident <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="panel p-4 shadow-panel">
                {recentTimeline.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="h-10 w-10 text-muted-foreground/50" />}
                    title="No incident activity"
                    sub="The agent responds when chaos is injected."
                  />
                ) : (
                  <ol className="relative ml-3 space-y-3 border-l border-border pl-5">
                    {recentTimeline.map((event, i) => (
                      <li key={i} className="animate-rise relative" style={{ animationDelay: `${i * 60}ms` }}>
                        <span
                          className={cn(
                            'absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background',
                            event.actor === 'agent' && 'bg-primary',
                            event.actor === 'human' && 'bg-ok',
                            event.actor === 'system' && 'bg-muted-foreground'
                          )}
                        />
                        <p className="text-sm leading-snug">{event.description}</p>
                        <p className="num mt-0.5 text-[11px] text-muted-foreground">
                          <span
                            className={cn(
                              'font-bold',
                              event.actor === 'agent' && 'text-primary',
                              event.actor === 'human' && 'text-ok',
                              event.actor === 'system' && 'text-muted-foreground'
                            )}
                          >
                            {event.actor.toUpperCase()}
                          </span>
                          {' · '}
                          {new Date(event.timestamp).toLocaleTimeString('en-US', {
                            hour12: false,
                          })}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          </div>

          {/* ── Right rail: agent + controls ───────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Agent status */}
            <section className="panel overflow-hidden shadow-panel">
              <div className="panel-header">
                <span className="label-caps">Agent Runtime</span>
                <Terminal className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-2.5 p-4">
                <StatusLine
                  label="TrueForge"
                  value={connected ? 'RUNNING' : 'UNKNOWN'}
                  ok={connected}
                />
                <StatusLine label="MCP tools" value={connected ? '8 REGISTERED' : 'OFFLINE'} ok={connected} />
                <StatusLine label="Approval gates" value="ARMED" plain />
                <StatusLine
                  label="Sessions"
                  value={String(Object.keys(sessions).length)}
                  ok={Object.keys(sessions).length > 0}
                />
                <div className="border-t border-border pt-2.5">
                  <p className="label-caps mb-1.5">Recent deploys</p>
                  <div className="space-y-1">
                    {[...deploys].reverse().slice(0, 4).map((d) => (
                      <p key={d.id} className="num truncate text-[11px] text-muted-foreground">
                        <span className="text-primary">{d.id}</span> · {d.service} {d.version}
                      </p>
                    ))}
                    {deploys.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Demo controls */}
            <section className="panel overflow-hidden shadow-panel">
              <div className="panel-header">
                <span className="label-caps">Demo Controls</span>
                <Zap className="h-3.5 w-3.5 text-warn" />
              </div>
              <div className="space-y-3 p-4">
                {chaos.active ? (
                  <div className="rounded-md border border-bad/30 bg-bad/5 p-3 animate-rise">
                    <p className="flex items-center gap-2 text-sm font-medium text-bad">
                      <Activity className="h-4 w-4 animate-pulse" />
                      CHAOS ACTIVE
                    </p>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {chaos.type?.replace(/_/g, ' ')} → {chaos.service}
                    </p>
                    <Link
                      href={`/incident/${chaos.service}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Watch agent respond <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => injectChaos('payment-service')}
                    disabled={busy || !connected || services.length === 0}
                    className="group relative w-full overflow-hidden rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap className="mr-2 inline h-4 w-4" />
                    INJECT CHAOS · payment-service
                    <span
                      aria-hidden
                      className="absolute inset-y-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />
                  </button>
                )}

                <ManualRemediation
                  busy={busy}
                  services={services.filter((s) => s.status !== 'healthy').map((s) => ({ name: s.name, deployId: deploys.find(d => d.service === s.name)?.id }))}
                  onRestart={(name) => runAction({ type: 'remediate', method: 'restart', service: name }, `Restarted ${name}`)}
                  onRollback={(name, id) => runAction({ type: 'remediate', method: 'rollback', service: name, deploy_id: id }, `Rolled back ${name}`)}
                />

                <button
                  onClick={() => runAction({ type: 'reset' }, 'Demo state reset')}
                  disabled={busy || !connected}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset demo state
                </button>

                {notice && <p className="num break-all text-[11px] text-muted-foreground">{notice}</p>}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t border-border pt-4 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span className="num">MISSIONCONTROL · WEMAKEDEVS AGENT HARNESS · DOUBLE-O TRACK</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-ok" />
              Irreversible actions require human approval
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}

/* ── Service card with live pulse bar ─────────────────────────────────── */

function ServiceCard({
  service,
  busy,
  chaosActiveOnThis,
  anyChaos,
  connected,
  onInject,
}: {
  service: {
    name: string
    version: string
    status: ServiceStatus
    error_rate: number
    latency_p99: number
    requests_per_minute: number
  }
  busy: boolean
  chaosActiveOnThis: boolean
  anyChaos: boolean
  connected: boolean
  onInject: () => void
}) {
  const color = statusColorVar[service.status]
  const bad = service.status !== 'healthy'

  return (
    <Link
      href={`/incident/${service.name}`}
      className={cn(
        'panel group block overflow-hidden shadow-panel transition-all hover:-translate-y-0.5',
        bad && 'shadow-glow-' + (service.status === 'down' ? 'bad' : 'warn'),
        chaosActiveOnThis && 'ring-1 ring-bad/40'
      )}
    >
      {/* Top: identity + status chip */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div>
          <h3 className="num text-sm font-bold tracking-wide text-foreground">
            {service.name.toUpperCase()}
          </h3>
          <p className="num text-[11px] text-muted-foreground">{service.version} · rpm {service.requests_per_minute.toLocaleString()}</p>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider num',
            statusChip[service.status]
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              bad ? 'animate-pulse' : ''
            )}
            style={{ background: color }}
          />
          {statusLabel[service.status]}
        </span>
      </div>

      {/* Middle: numeric readouts */}
      <div className="grid grid-cols-2 gap-x-4 px-4">
        <Metric
          label="ERR RATE"
          value={`${service.error_rate.toFixed(1)}%`}
          color={service.error_rate > 5 ? 'hsl(var(--bad))' : service.error_rate > 1 ? 'hsl(var(--warn))' : 'hsl(var(--ok))'}
        />
        <Metric
          label="P99 LAT"
          value={`${Math.round(service.latency_p99)}ms`}
          color={service.latency_p99 > 1000 ? 'hsl(var(--warn))' : 'hsl(var(--ok))'}
        />
      </div>

      {/* Live pulse bar */}
      <div className="mt-3 px-4">
        <PulseBar active={chaosActiveOnThis} color={color} />
      </div>

      {/* Footer action */}
      <div className="mt-3 flex items-center justify-between border-t border-border px-4 py-2.5">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-primary">
          <Terminal className="h-3 w-3" />
          Investigate
        </span>
        {service.status === 'healthy' ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onInject()
            }}
            disabled={busy || anyChaos || !connected}
            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
            title={anyChaos ? 'Chaos already active' : 'Inject error spike'}
          >
            <Zap className="h-3 w-3" />
            Inject
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-warn">
            <CircleDashed className="h-3 w-3 animate-spin-slow" />
            Incident open
          </span>
        )}
      </div>
    </Link>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="label-caps" style={{ fontSize: '9px' }}>{label}</p>
      <p className="num text-lg font-bold leading-tight" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

/** Thin animated bar that "breathes" while an incident is active. */
function PulseBar({ active, color }: { active: boolean; color: string }) {
  if (!active) {
    return <div className="h-1 w-full overflow-hidden rounded-full bg-muted" />
  }
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full w-1/3 animate-sweep rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}

function ManualRemediation({
  busy,
  services,
  onRestart,
  onRollback,
}: {
  busy: boolean
  services: { name: string; deployId?: string }[]
  onRestart: (name: string) => void
  onRollback: (name: string, deployId: string) => void
}) {
  if (services.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="label-caps">Manual remediation (bypasses agent)</p>
      {services.map((s) => (
        <div key={s.name} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <span className="num truncate text-xs">{s.name}</span>
          <div className="flex gap-2">
            {s.deployId && (
              <button
                onClick={() => onRollback(s.name, s.deployId!)}
                disabled={busy}
                className="text-[11px] font-semibold text-warn hover:underline disabled:opacity-50"
              >
                Rollback
              </button>
            )}
            <button
              onClick={() => onRestart(s.name)}
              disabled={busy}
              className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
            >
              Restart
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusLine({
  label,
  value,
  ok,
  plain,
}: {
  label: string
  value: string
  ok?: boolean
  plain?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {plain ? (
        <span className="num font-bold text-primary">{value}</span>
      ) : (
        <span className={cn('num flex items-center gap-1.5 font-semibold', ok ? 'text-ok' : 'text-muted-foreground')}>
          <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-ok' : 'bg-muted-foreground')} />
          {value}
        </span>
      )}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode
  title: string
  sub: string
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      {icon}
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
