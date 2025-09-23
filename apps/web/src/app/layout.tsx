import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Vibe Kanban - Collaborative Canvas',
  description: 'Real-time collaborative infinite canvas with 3D viewer, terminal, and document editor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}