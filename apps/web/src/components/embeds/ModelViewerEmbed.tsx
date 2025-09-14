'use client'

import { useEffect, useRef, useState } from 'react'
import { TLEmbedShape } from '@tldraw/tldraw'

interface ModelViewerEmbedProps {
  shape: TLEmbedShape
  onChangeUrl?: (url: string) => void
}

// Declare model-viewer as a JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          poster?: string
          alt?: string
          'camera-controls'?: boolean
          'auto-rotate'?: boolean
          ar?: boolean
          'ar-modes'?: string
          exposure?: number
          'shadow-intensity'?: number
          'shadow-softness'?: number
        },
        HTMLElement
      >
    }
  }
}

export function ModelViewerEmbed({ shape, onChangeUrl }: ModelViewerEmbedProps) {
  const [modelUrl, setModelUrl] = useState(
    shape.props.url || '/models/sample.glb'
  )
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamically import model-viewer
    import('@google/model-viewer').then(() => {
      setIsLoading(false)
    })
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
      onChangeUrl?.(url)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p>Loading 3D viewer...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-50">
      <model-viewer
        src={modelUrl}
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        exposure={1}
        shadow-intensity={1}
        shadow-softness={0.5}
        style={{ width: '100%', height: '100%' }}
      />

      <div className="absolute top-2 right-2 bg-white p-2 rounded shadow">
        <label className="cursor-pointer text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
          Upload Model
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}