'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronLeft,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInfraSnapshot, postAction } from '@/lib/use-infra'
import { ConsoleHeader } from '@/components/console-header'
import { HoldToConfirm } from '@/components/hold-to-confirm'

type ServiceStatus = 'healthy' | 'degraded' | 'down'

interface Scenario {
  id: string
  name: string
  description: string
  effects: { error_rate: number; latency_p99: number; status: ServiceStatus }
}

const SCENARIOS: Scenario[] = [
  {
    id: 'error_spike',
    name: 'Error Spike',
    description:
      'Bad deploy signature — retry storms, connection-pool exhaustion, circuit-breaker misconfiguration.',
    effects: { error_rate: 12.3, latency_p99: 2400, status: 'degraded' },
  },
  {
    id: 'latency_spike',
    name: 'Latency Spike',
    description:
      'DB slowdown, thread-pool starvation, downstream dependency degradation. Errors stay low.',
    effects: { error_rate: 2.1, latency_p99: 8500, status: 'degraded' },
  },
  {
    id: 'outage',
    name: 'Full Outage',
    description:
      'Network partition, OOM kill, infrastructure failure. Near-total request failure.',
    effects: { error_rate: 98.0, latency_p99: 30000, status: 'down' },
  },
  {
    id: 'cascading_failure',
    name: 'Cascading Failure',
    description:
      'Failure spreads to dependents. Primary fails hard; callers degrade in sequence.',
    effects: { error_rate: 15.0, latency_p99: 5000, status: 'down' },
  },
]

const accentFor = (s: Scenario) =>
  s.effects.status === 'down'
    ? { text: 'text-bad', border: 'border-bad/50', bg: 'bg-bad/5', chipBg: 'bg-bad/10', ring: 'ring-bad/30' }
    : { text: 'text-warn', border: 'border-warn/50', bg: 'bg-warn/5', chipBg: 'bg-warn/10', ring: 'ring-warn/30' }

export default function ChaosPage() {
  const { snapshot } = useInfraSnapshot()
  const [selectedService, setSelectedService] = useState('payment-service')
  const [selectedScenario, setSelectedScenario] = useState('error_spike')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const { connected, services, chaos } = snapshot

  const act = async (body: Record<string, unknown>, label: string) => {
    setBusy(true)
    setNotice(null)
    const { ok, data } = await postAction(body)
    setNotice(
      ok ? `${label} ✓` : `${label} failed: ${(data as { error?: string }).error ?? 'unknown'}`
    )
    setBusy(false)
  }

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario)!
  const accent = accentFor(scenario)
  const service = services.find((s) => s.name === selectedService)
  const chaosActiveOnSelected =
    chaos.active && chaos.service === selectedService

  return (
    <div className="min-h-screen">
      <ConsoleHeader snapshot={snapshot} />

      <main className="container mx-auto space-y-6 px-4 py-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <FlaskConical className="h-7 w-7 text-warn" />
            <div>
              <h1 className="font-display text-xl font-bold tracking-wide">CHAOS LAB</h1>
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                Fault injection · rehearsal environment
              </p>
            </div>
          </div>

          {(chaos.active || services.some((s) => s.status !== 'healthy')) && (
            <button
              onClick={() => act({ type: 'reset' }, 'All chaos resolved')}
              disabled={busy}
              className="flex items-center gap-2 rounded-md border border-ok/40 bg-ok/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ok transition-colors hover:bg-ok/20 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Resolve all · reset
            </button>
          )}
        </div>

        {!connected && (
          <div className="flex items-center gap-2 rounded-md border border-bad/30 bg-bad/5 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-bad" />
            demo-infra MCP server offline — start it with{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              docker compose up -d demo-infra-mcp
            </code>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Target selection */}
          <section className="panel overflow-hidden shadow-panel">
            <div className="panel-header">
              <span className="label-caps">Target service</span>
              <Bug className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {services.length === 0 && (
                <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  No services loaded.
                </p>
              )}
              {services.map((svc) => {
                const unhealthy = svc.status !== 'healthy'
                return (
                  <button
                    key={svc.name}
                    onClick={() => setSelectedService(svc.name)}
                    disabled={unhealthy}
                    className={cn(
                      'relative rounded-md border p-3 text-left transition-all',
                      unhealthy
                        ? 'cursor-not-allowed border-bad/30 bg-bad/5 opacity-80'
                        : selectedService === svc.name
                          ? 'border-primary/60 bg-primary/5 shadow-glow-cyan'
                          : 'border-border hover:border-primary/30 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="num truncate text-xs font-bold">{svc.name.toUpperCase()}</span>
                      <StatusDot status={svc.status} />
                    </div>
                    <p className="num mt-1 text-[11px] tabular-nums text-muted-foreground">
                      err {svc.error_rate.toFixed(1)}% · p99 {Math.round(svc.latency_p99)}ms
                    </p>
                    {unhealthy && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-bad">
                        <Zap className="h-2.5 w-2.5" /> INCIDENT ACTIVE
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              Services with an active incident are locked until resolved.
            </p>
          </section>

          {/* Scenario selection */}
          <section className="panel overflow-hidden shadow-panel">
            <div className="panel-header">
              <span className="label-caps">Fault profile</span>
              <Zap className="h-3.5 w-3.5 text-warn" />
            </div>
            <ul className="space-y-2 p-4">
              {SCENARIOS.map((scn) => {
                const a = accentFor(scn)
                const selected = selectedScenario === scn.id
                return (
                  <li key={scn.id}>
                    <button
                      onClick={() => setSelectedScenario(scn.id)}
                      className={cn(
                        'w-full rounded-md border p-3 text-left transition-all',
                        selected ? cn(a.border, a.bg, 'ring-1', a.ring) : 'border-border hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('num text-xs font-bold tracking-wide', selected && a.text)}>
                          {scn.name.toUpperCase()}
                        </span>
                        <span className="num flex gap-1.5 text-[10px]">
                          <span className={cn('rounded px-1.5 py-0.5', scn.effects.error_rate > 5 ? 'bg-bad/10 text-bad' : 'bg-warn/10 text-warn')}>
                            ERR {scn.effects.error_rate}%
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            P99 {scn.effects.latency_p99.toLocaleString()}MS
                          </span>
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{scn.description}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        {/* Injection control */}
        <section className="panel overflow-hidden shadow-panel">
          <div className="panel-header">
            <span className="label-caps">Injection control</span>
            <ShieldCheck className="h-3.5 w-3.5 text-ok" />
          </div>

          <div className="space-y-4 p-4">
            {chaosActiveOnSelected ? (
              <div className="animate-rise rounded-md border border-bad/30 bg-bad/5 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-bad">
                  <Activity className="h-4 w-4 animate-pulse" />
                  CHAOS ACTIVE ON {selectedService.toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The MissionControl agent is investigating. Follow the live response on the incident page.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/incident/${selectedService}`}
                    className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    Open incident console →
                  </Link>
                  <button
                    onClick={() => act({ type: 'remediate', method: 'restart', service: selectedService }, `Restarted ${selectedService}`)}
                    disabled={busy}
                    className="rounded-md border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Manual restart (bypass agent)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Predicted impact */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <ImpactCard
                    label="Projected error rate"
                    value={`${scenario.effects.error_rate.toFixed(1)}%`}
                    ratio={scenario.effects.error_rate / 100}
                    barColor="bg-bad"
                  />
                  <ImpactCard
                    label="Projected p99 latency"
                    value={`${scenario.effects.latency_p99.toLocaleString()}ms`}
                    ratio={scenario.effects.latency_p99 / 30000}
                    barColor="bg-warn"
                  />
                  <div className="rounded-md border border-border bg-background/50 p-3">
                    <p className="label-caps" style={{ fontSize: '9px' }}>Projected state</p>
                    <p className={cn('num mt-1 text-lg font-bold', accent.text)}>
                      {scenario.effects.status === 'down' ? 'OFFLINE' : 'DEGRADED'}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex flex-col items-start justify-between gap-3 rounded-md border p-4 sm:flex-row sm:items-center',
                    accent.border,
                    accent.bg
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Inject <span className={accent.text}>{scenario.name}</span> into{' '}
                      <span className="num">{selectedService.toUpperCase()}</span>?
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Fires an alert and auto-triggers the MissionControl agent via webhook.
                      Simulated only — no real services affected.
                    </p>
                  </div>
                  <HoldToConfirm
                    label={`Inject ${scenario.name}`}
                    holdLabel="HOLD TO INJECT"
                    onComplete={() =>
                      act(
                        { type: 'chaos', service: selectedService, chaos_type: selectedScenario },
                        `Injected ${scenario.name}`
                      )
                    }
                    disabled={!service || busy || !connected}
                    durationMs={1600}
                  />
                </div>

                {notice && <p className="num break-all text-[11px] text-muted-foreground">{notice}</p>}
              </>
            )}
          </div>
        </section>

        {/* Flow explainer */}
        <section className="panel overflow-hidden shadow-panel">
          <div className="panel-header">
            <span className="label-caps">What happens when you inject</span>
            <FlaskConical className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              { n: 1, title: 'Inject', body: 'inject_chaos degrades the simulated service and writes failure logs.' },
              { n: 2, title: 'Alert', body: 'An alert fires; the dashboard webhook opens a TrueForge session for the missioncontrol agent.' },
              { n: 3, title: 'Respond', body: 'The agent investigates via MCP tools, diagnoses, then requests human approval before any rollback.' },
            ].map((step) => (
              <div key={step.n} className="p-4">
                <p className="num mb-1 text-[11px] font-bold text-primary">STEP {step.n} — {step.title.toUpperCase()}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function StatusDot({ status }: { status: ServiceStatus }) {
  const color = status === 'healthy' ? 'bg-ok' : status === 'degraded' ? 'bg-warn animate-pulse' : 'bg-bad animate-pulse'
  return <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', color)} />
}

function ImpactCard({
  label,
  value,
  ratio,
  barColor,
}: {
  label: string
  value: string
  ratio: number
  barColor: string
}) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-3">
      <p className="label-caps" style={{ fontSize: '9px' }}>{label}</p>
      <p className="num mt-1 text-lg font-bold text-foreground">{value}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', barColor)}
          style={{ width: `${Math.min(Math.max(ratio, 0.03), 1) * 100}%` }}
        />
      </div>
    </div>
  )
}
