'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Terminal, Shield } from 'lucide-react'

const TrueforgeUI = dynamic(() => import('@truefoundry/trueforge-ui').then((m) => m.TrueforgeUI), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
      Loading agent chat…
    </div>
  ),
})

export function AgentChat({ sessionId }: { sessionId?: string }) {
  const [error, setError] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_TRUEFORGE_URL || 'http://localhost:3000'
  const token = process.env.NEXT_PUBLIC_TRUEFORGE_TOKEN

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
        <Terminal className="w-12 h-12 mb-3 opacity-40" />
        <p className="font-medium text-foreground">Agent chat unavailable</p>
        <p className="text-xs mt-1 max-w-md">
          Could not reach TrueForge at <code className="px-1 py-0.5 bg-muted rounded">{baseUrl}</code>.
          Start it with <code className="px-1 py-0.5 bg-muted rounded">npx @truefoundry/trueforge</code>.
          You can still follow the investigation in the Timeline tab.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Shield className="w-3.5 h-3.5" />
          MissionControl Agent · TrueForge Runtime
        </span>
        {sessionId && <span className="font-mono">{sessionId.slice(0, 16)}…</span>}
      </div>
      <div className="flex-1 min-h-0">
        <TrueforgeUI
          server={{
            type: 'trueforge',
            baseUrl,
            ...(token ? { token } : {}),
          }}
          {...(sessionId ? { initialSessionId: sessionId } : {})}
          onError={(e: unknown) => setError(String(e))}
        />
      </div>
    </div>
  )
}
