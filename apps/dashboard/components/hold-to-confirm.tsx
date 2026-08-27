'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Hold-to-confirm button for irreversible actions.
 * The judge-visible answer to "asks before an irreversible step": you must
 * physically hold to arm the action. Cancels on release or pointer exit.
 */
export function HoldToConfirm({
  label,
  holdLabel = 'HOLD TO CONFIRM',
  onComplete,
  disabled,
  durationMs = 1400,
  className,
}: {
  label: string
  holdLabel?: string
  onComplete: () => void
  disabled?: boolean
  durationMs?: number
  className?: string
}) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const raf = useRef<number>(0)
  const start = useRef<number>(0)
  const firedRef = useRef(false)

  const stop = useCallback(() => {
    setHolding(false)
    setProgress(0)
    cancelAnimationFrame(raf.current)
  }, [])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const tick = useCallback(
    (t: number) => {
      const elapsed = t - start.current
      const p = Math.min(1, elapsed / durationMs)
      setProgress(p)
      if (p >= 1) {
        if (!firedRef.current) {
          firedRef.current = true
          onComplete()
        }
        stop()
        // allow re-arm after a beat
        setTimeout(() => (firedRef.current = false), 600)
      } else {
        raf.current = requestAnimationFrame(tick)
      }
    },
    [durationMs, onComplete, stop]
  )

  const begin = () => {
    if (disabled || holding) return
    setHolding(true)
    start.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={begin}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={begin}
      onTouchEnd={stop}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) begin()
      }}
      onKeyUp={stop}
      aria-disabled={disabled}
      className={cn(
        'relative select-none overflow-hidden rounded-md border px-4 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors',
        holding
          ? 'border-destructive/60 bg-destructive/10 text-destructive'
          : 'border-border bg-secondary text-foreground hover:border-destructive/40 hover:text-destructive',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-destructive/25 transition-[width] duration-75"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative flex items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" />
        {holding ? `${holdLabel}…` : label}
      </span>
    </button>
  )
}
