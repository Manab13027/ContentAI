import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AGENTIZED CONTENT CREATION SYSTEM',
  description: 'Scrape → Validate → Write → Hook — fully automated',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
