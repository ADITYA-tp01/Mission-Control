import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MissionControl — Autonomous Incident Response',
  description:
    'Give your infrastructure an agent. Keep the kill switch. TrueForge-powered DevOps incident response with human approval gates.',
}

export const viewport: Viewport = {
  themeColor: '#0a0f1c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.variable} ${grotesk.variable} ${jetbrains.variable}`}
      >
        <div className="grid-backdrop" aria-hidden />
        <div className="scanlines" aria-hidden />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
