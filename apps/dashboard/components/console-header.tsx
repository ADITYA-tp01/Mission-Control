'use client'

import Link from 'next/link'
import { Radar, FlaskConical, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InfraSnapshot } from '@/lib/use-infra'
import { systemHealth } from '@/lib/status'

/**
 * Shared console header. The ambient radar glow reflects system health:
 * green when nominal, amber/red as services degrade.
 */
export function ConsoleHeader({ snapshot }: { snapshot: InfraSnapshot }) {
  const health = systemHealth(snapshot.services)
  const connected = snapshot.connected
  const now =
    typeof window !== 'undefined' && snapshot.services.length > 0
      ? new Date().toLocaleTimeString('en-US', { hour12: false })
      : '--:--:--'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-16 h-16 opacity-25"
        style={{
          background: `radial-gradient(ellipse 42% 100% at 50% 0%, ${health.glowColor}, transparent 70%)`,
        }}
      />
      <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href="/" className="group flex items-center gap-3">
          {/* Radar mark */}
          <span className="relative flex h-8 w-8 items-center justify-center">
            <Radar
              className="h-6 w-6 transition-colors"
              style={{ color: health.glowColor }}
            />
            <span
              className={cn(
                'absolute h-8 w-8 rounded-full border',
                health.level !== 'healthy' && 'animate-ping-ring',
              )}
              style={{ borderColor: health.glowColor }}
            />
          </span>
          <span>
            <span className="block font-display text-sm font-bold tracking-[0.18em] text-foreground">
              MISSION<span className="text-primary">CONTROL</span>
            </span>
            <span className="block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Autonomous incident response · TrueForge runtime
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/chaos"
            className="flex items-center gap-1.5 rounded-md border border-warn/30 bg-warn/5 px-3 py-1.5 text-xs font-medium text-warn transition-colors hover:bg-warn/15"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chaos Lab</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
            <span className={cn('num', health.level === 'healthy' ? 'text-ok' : 'text-warn')}>
              {health.level === 'healthy' ? 'ALL SYSTEMS NOMINAL' : `${health.level.toUpperCase()}`}
            </span>
            <span className="text-border">│</span>
            <span className="num tabular-nums text-muted-foreground">{now}</span>
            <span className="text-border">│</span>
            <span
              className={cn(
                'flex items-center gap-1.5',
                connected ? 'text-ok' : 'text-bad animate-blink',
              )}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              MCP {connected ? 'LINKED' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
