'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const TldrawBoard = dynamic(
  () => import('@/components/canvas/TldrawBoard').then(mod => ({ default: mod.TldrawBoard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <p>Loading canvas...</p>
      </div>
    )
  }
)

function CanvasPage() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get('room') || 'default'

  return <TldrawBoard roomId={roomId} />
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    }>
      <CanvasPage />
    </Suspense>
  )
}