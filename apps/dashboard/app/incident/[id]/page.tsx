'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Cpu,
  GitCommitHorizontal,
  RotateCcw,
  Search,
  ShieldCheck,
  Siren,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInfraSnapshot, postAction } from '@/lib/use-infra'
import { ConsoleHeader } from '@/components/console-header'
import { AgentChat } from '@/components/agent-chat'
import { HoldToConfirm } from '@/components/hold-to-confirm'

interface MetricPoint {
  timestamp: string
  error_rate: number
  latency_p99: number
  status: string
}

interface LogEntryView {
  timestamp: string
  service: string
  level: string
  message: string
}

type ServiceStatus = 'healthy' | 'degraded' | 'down'

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

/** The agent protocol stages (mirrors SKILL.md phases). */
const STAGES = [
  { key: 'investigate', label: 'Investigate', icon: Search },
  { key: 'correlate', label: 'Correlate', icon: GitCommitHorizontal },
  { key: 'diagnose', label: 'Diagnose', icon: Cpu },
  { key: 'plan', label: 'Plan', icon: ShieldCheck },
  { key: 'execute', label: 'Execute', icon: Zap },
  { key: 'verify', label: 'Verify', icon: CheckCircle2 },
  { key: 'report', label: 'Report', icon: Terminal },
] as const

export default function IncidentPage() {
  const params = useParams()
  const serviceNameParam = (params.id as string) || ''
  const { snapshot } = useInfraSnapshot()

  const [metricsData, setMetricsData] = useState<{
    current: { error_rate: number; latency_p99: number; status: string; version?: string } | null
    history: MetricPoint[]
    logs: LogEntryView[]
  }>({ current: null, history: [], logs: [] })
  const [activeTab, setActiveTab] = useState<'timeline' | 'metrics' | 'agent'>('timeline')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmRollback, setConfirmRollback] = useState(false)

  // Poll live metrics/logs for this service
  useEffect(() => {
    if (!serviceNameParam) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(
          `/api/infra/metrics?service=${encodeURIComponent(serviceNameParam)}`,
          { cache: 'no-store' }
        )
        const data = await res.json()
        if (!cancelled)
          setMetricsData({
            current: data.current,
            history: data.history || [],
            logs: data.logs || [],
          })
      } catch {
        /* keep last good data */
      }
    }

    load()
    const t = setInterval(load, 3000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [serviceNameParam])

  const service = snapshot.services.find((s) => s.name === serviceNameParam)
  const timeline = useMemo(() => [...snapshot.timeline].reverse(), [snapshot.timeline])
  const sessionId = snapshot.sessions[serviceNameParam]
  const serviceDeploys = snapshot.deploys.filter((d) => d.service === serviceNameParam).reverse()
  const badDeploy = serviceDeploys[0]

  const act = async (body: Record<string, unknown>, label: string) => {
    setBusy(true)
    setNotice(null)
    const { ok, data } = await postAction(body)
    setNotice(
      ok ? `${label} ✓` : `${label} failed: ${(data as { error?: string }).error ?? 'unknown'}`
    )
    setBusy(false)
  }

  const triggerInvestigation = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceNameParam,
          alert_type:
            metricsData.current && metricsData.current.error_rate > 5
              ? 'error_spike'
              : 'manual_check',
          message: `Manual investigation requested for ${serviceNameParam}`,
        }),
      })
      const data = await res.json()
      setNotice(res.ok ? `Agent session started: ${data.sessionId}` : `Trigger failed: ${data.error}`)
    } catch (e) {
      setNotice(`Trigger failed: ${String(e)}`)
    }
    setBusy(false)
  }

  const currentStatus: ServiceStatus =
    (service?.status ?? (metricsData.current?.status as ServiceStatus)) || 'healthy'
  const errorRate = service?.error_rate ?? metricsData.current?.error_rate ?? 0
  const latency = service?.latency_p99 ?? metricsData.current?.latency_p99 ?? 0
  const version = service?.version ?? metricsData.current?.version ?? ''
  const color = statusColorVar[currentStatus]
  const incidentActive = currentStatus !== 'healthy'

  return (
    <div className="min-h-screen">
      <ConsoleHeader snapshot={snapshot} />

      <main className="container mx-auto space-y-5 px-4 py-5">
        {/* ── Incident header strip ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="num text-xl font-bold tracking-wide text-foreground">
                INCIDENT · {serviceNameParam.toUpperCase().replace(/-/g, ' ')}
              </h1>
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Live investigation &amp; remediation console
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Readout label="STATUS" value={statusLabel[currentStatus]} color={color} pulse={incidentActive} />
            <Readout
              label="ERR RATE"
              value={`${Number(errorRate).toFixed(1)}%`}
              color={errorRate > 5 ? 'hsl(var(--bad))' : errorRate > 1 ? 'hsl(var(--warn))' : 'hsl(var(--ok))'}
            />
            <Readout
              label="P99 LATENCY"
              value={`${Math.round(latency)}ms`}
              color={latency > 1000 ? 'hsl(var(--warn))' : 'hsl(var(--ok))'}
            />
            <Readout label="VERSION" value={version || '—'} color="hsl(var(--muted-foreground))" />
          </div>
        </div>

        {/* ── Agent stage strip ──────────────────────────────────────── */}
        <section className="panel overflow-hidden shadow-panel" aria-label="Agent protocol progress">
          <div className="panel-header">
            <span className="label-caps">Agent Protocol</span>
            <span className="num text-[10px] text-muted-foreground">
              {incidentActive ? 'ENGAGED' : 'STANDBY'}
            </span>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border md:grid-cols-7">
            {STAGES.map((stage, i) => {
              const active = incidentActive && i <= 2 // investigate/correlate/diagnose while degraded
              const done = !incidentActive && snapshot.services.length > 0
              return (
                <div
                  key={stage.key}
                  className={cn(
                    'relative flex flex-col items-center gap-1 px-2 py-3',
                    active && 'bg-primary/5',
                    done && 'opacity-70'
                  )}
                >
                  <stage.icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'animate-pulse text-primary' : done ? 'text-ok/70' : 'text-muted-foreground/50'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[9px] font-semibold uppercase tracking-wider',
                      active ? 'text-primary' : done ? 'text-ok/80' : 'text-muted-foreground/60'
                    )}
                  >
                    {stage.label}
                  </span>
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-px animate-pulse bg-primary" />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Main grid: left tabs / right agent pane ───────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-3">
            {/* Tabs panel */}
            <section className="panel overflow-hidden shadow-panel">
              <div className="border-b border-border px-2 pt-2">
                <nav className="flex gap-1" role="tablist">
                  {[
                    { id: 'timeline', label: 'Timeline', icon: Clock },
                    { id: 'metrics', label: 'Metrics', icon: Activity },
                    { id: 'agent', label: 'Agent Chat', icon: Terminal },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-t-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                        activeTab === tab.id
                          ? 'border-x border-t border-border bg-card text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4">
                {activeTab === 'timeline' && (
                  <div className="max-h-[520px] space-y-0 overflow-y-auto">
                    {timeline.length === 0 ? (
                      <EmptyBlock icon={<Clock className="h-10 w-10 opacity-40" />} text="No timeline events yet." />
                    ) : (
                      <ol className="relative ml-3 border-l border-border pl-5">
                        {timeline.map((event, index) => (
                          <li key={index} className="relative pb-4">
                            <span
                              className={cn(
                                'absolute -left-[26.5px] top-1 h-3 w-3 rounded-full border-2 border-background',
                                event.actor === 'agent' && 'bg-primary',
                                event.actor === 'human' && 'bg-ok',
                                event.actor === 'system' && 'bg-muted-foreground'
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <ActorChip actor={event.actor} />
                              <span className="num text-[11px] tabular-nums text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm leading-snug">{event.description}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="space-y-6">
                    <MetricChart
                      title="Error rate (%)"
                      color="#f87171"
                      points={metricsData.history.map((m) => ({ time: m.timestamp, value: m.error_rate }))}
                      baseline={0.4}
                      unit="%"
                    />
                    <MetricChart
                      title="Latency p99 (ms)"
                      color="#fbbf24"
                      points={metricsData.history.map((m) => ({ time: m.timestamp, value: m.latency_p99 }))}
                      baseline={120}
                      unit="ms"
                    />
                    <LogsPanel logs={metricsData.logs} />
                  </div>
                )}

                {activeTab === 'agent' && (
                  <div className="h-[600px] overflow-hidden rounded-md border border-border">
                    <AgentChat sessionId={sessionId} />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column — persistent agent + actions */}
          <div className="space-y-5 lg:col-span-2">
            {/* Approval card */}
            <section className="panel overflow-hidden shadow-panel">
              <div className="panel-header">
                <span className="label-caps">Human Control</span>
                <ShieldCheck className="h-3.5 w-3.5 text-ok" />
              </div>
              <div className="space-y-3 p-4">
                <button
                  onClick={triggerInvestigation}
                  disabled={busy}
                  className="w-full rounded-md border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  <Search className="mr-2 inline h-4 w-4" />
                  Run investigation
                </button>

                <HoldToConfirm
                  label={`Rollback from ${badDeploy?.id ?? 'n/a'}`}
                  onComplete={() => {
                    if (!badDeploy) return
                    act(
                      {
                        type: 'remediate',
                        method: 'rollback',
                        service: serviceNameParam,
                        deploy_id: badDeploy.id,
                      },
                      `Rolled back ${serviceNameParam}`
                    )
                  }}
                  disabled={busy || !badDeploy}
                  className="w-full"
                />
                {!badDeploy && (
                  <p className="text-[11px] text-muted-foreground">No deploys found for rollback.</p>
                )}
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Rollback is irreversible. Holding confirms you are the human in the loop — the same
                  gate the agent must pass through the TrueForge approval checkpoint.
                </p>

                {notice && <p className="num break-all text-[11px] text-muted-foreground">{notice}</p>}
              </div>
            </section>

            {/* Recent deploys for this service */}
            <section className="panel overflow-hidden shadow-panel">
              <div className="panel-header">
                <span className="label-caps">Deploy history</span>
                <GitCommitHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <ul className="divide-y divide-border">
                {serviceDeploys.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-muted-foreground">No deploys recorded.</li>
                )}
                {serviceDeploys.map((d, i) => (
                  <li key={d.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="num text-xs font-bold text-primary">{d.id}</span>
                      <span className="num text-[10px] text-muted-foreground">
                        {new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="num mt-0.5 text-[11px] text-muted-foreground">
                      {d.version} · by {d.author}
                      {i === 0 && serviceDeploys.length > 1 && (
                        <span className="ml-1.5 rounded bg-warn/10 px-1 py-0.5 text-[9px] font-bold text-warn">
                          LATEST
                        </span>
                      )}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {d.changes.map((c) => (
                        <li key={c} className="text-[11px] text-muted-foreground">· {c}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

function Readout({
  label,
  value,
  color,
  pulse,
}: {
  label: string
  value: string
  color: string
  pulse?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-1.5">
      <p className="label-caps" style={{ fontSize: '9px' }}>{label}</p>
      <p
        className={cn('num text-sm font-bold', pulse && 'animate-pulse')}
        style={{ color }}
      >
        {value}
      </p>
    </div>
  )
}

function ActorChip({ actor }: { actor: 'agent' | 'human' | 'system' }) {
  const map = {
    agent: { cls: 'bg-primary/10 text-primary border-primary/25', Icon: Cpu },
    human: { cls: 'bg-ok/10 text-ok border-ok/25', Icon: ShieldCheck },
    system: { cls: 'bg-muted text-muted-foreground border-border', Icon: Siren },
  }[actor]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
        map.cls
      )}
    >
      <map.Icon className="h-2.5 w-2.5" />
      {actor}
    </span>
  )
}

function MetricChart({
  title,
  points,
  color,
  baseline,
  unit,
}: {
  title: string
  points: { time: string; value: number }[]
  color: string
  baseline?: number
  unit?: string
}) {
  const values = points.map((p) => p.value)
  const max = Math.max(...values, baseline ?? 0, 0.0001)
  const min = Math.min(...values, baseline ?? 0, 0)
  const range = max - min || max || 1
  const W = 400
  const H = 140
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * (W - 20) + 10
  const y = (v: number) => H - 12 - ((v - min) / range) * (H - 24)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(p.value)}`).join(' ')

  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="label-caps">{title}</p>
        <p className="num text-xs" style={{ color }}>
          {points.length > 0
            ? `${points[points.length - 1].value.toFixed(1)}${unit}`
            : '—'}
        </p>
      </div>
      {points.length < 2 ? (
        <div className="flex h-[140px] items-center justify-center text-xs text-muted-foreground">
          Collecting metric samples…
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[140px] w-full">
          {/* baseline reference */}
          {baseline != null && baseline >= min && baseline <= max && (
            <>
              <line
                x1={10}
                x2={W - 10}
                y1={y(baseline)}
                y2={y(baseline)}
                stroke="hsl(var(--ok))"
                strokeDasharray="4 4"
                strokeWidth={1}
                opacity={0.5}
              />
              <text x={12} y={y(baseline) - 4} fontSize={9} fill="hsl(var(--ok))" opacity={0.8}>
                baseline {baseline}
                {unit}
              </text>
            </>
          )}
          <line
            x1={10}
            x2={W - 10}
            y1={y(min)}
            y2={y(min)}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
          <path d={`${line} L ${x(points.length - 1)},${H - 12} L ${x(0)},${H - 12} Z`} fill={color} opacity={0.08} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          {points.map((p, i) =>
            i === points.length - 1 ? null : null
          )}
          <circle
            cx={x(points.length - 1)}
            cy={y(points[points.length - 1].value)}
            r={3}
            fill={color}
            style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
          />
        </svg>
      )}
    </div>
  )
}

function LogsPanel({ logs }: { logs: LogEntryView[] }) {
  return (
    <div>
      <p className="label-caps mb-2">Recent logs ({logs.length})</p>
      <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border bg-background/60 font-mono text-[11px]">
        {[...logs].reverse().map((log, i) => (
          <div key={i} className="flex gap-3 px-3 py-1.5">
            <span className="whitespace-nowrap tabular-nums text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span
              className={cn(
                'w-12 flex-shrink-0 font-bold',
                log.level === 'ERROR' && 'text-bad',
                log.level === 'WARN' && 'text-warn',
                log.level !== 'ERROR' && log.level !== 'WARN' && 'text-ok'
              )}
            >
              {log.level}
            </span>
            <span className="break-all text-foreground/90">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="px-3 py-6 text-center text-muted-foreground">No logs available.</div>
        )}
      </div>
    </div>
  )
}

function EmptyBlock({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
      {icon}
      <p className="mt-3 text-sm">{text}</p>
    </div>
  )
}
