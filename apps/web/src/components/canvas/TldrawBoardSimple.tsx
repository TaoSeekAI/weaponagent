'use client'

import { useCallback, useState, useEffect } from 'react'
import {
  Tldraw,
  Editor,
  createShapeId,
} from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useSyncClient } from '@/lib/sync-client'

interface TldrawBoardProps {
  roomId: string
}

export function TldrawBoard({ roomId }: TldrawBoardProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const syncClient = useSyncClient(roomId)

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!editor) return

    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const point = editor.screenToPage({
      x: e.clientX,
      y: e.clientY,
    })

    files.forEach(file => {
      // Handle 3D model files - create as embedded iframe
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file)

        // Store the URL and create an embed shape
        const embedUrl = `data:text/html,${encodeURIComponent(`
          <!DOCTYPE html>
          <html>
          <head>
            <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
            <style>
              body { margin: 0; padding: 0; }
              model-viewer { width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <model-viewer
              src="${url}"
              camera-controls
              auto-rotate
              ar
              style="width: 100%; height: 100%;">
            </model-viewer>
          </body>
          </html>
        `)}`

        editor.createShape({
          id: createShapeId(),
          type: 'embed',
          x: point.x - 200,
          y: point.y - 150,
          props: {
            url: embedUrl,
            w: 400,
            h: 300,
          },
        })

        // Also show notification
        showNotification('3D model added to canvas!')
      }
      // Handle images
      else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string

          editor.createShape({
            id: createShapeId(),
            type: 'image',
            x: point.x - 150,
            y: point.y - 150,
            props: {
              url: dataUrl,
              w: 300,
              h: 300,
            },
          })
        }
        reader.readAsDataURL(file)
      }
    })
  }, [editor])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)

    // Connect to sync server
    if (syncClient) {
      syncClient.connect(editor)
    }

    // Add 3D model button using the editor's built-in UI
    const originalCreateShape = editor.createShape.bind(editor)

    // Extend editor with custom method
    ;(editor as any).add3DModel = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.glb,.gltf'

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const url = URL.createObjectURL(file)
          const center = editor.getViewportPageCenter()

          const embedUrl = `data:text/html,${encodeURIComponent(`
            <!DOCTYPE html>
            <html>
            <head>
              <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
              <style>
                body { margin: 0; padding: 0; }
                model-viewer { width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <model-viewer
                src="${url}"
                camera-controls
                auto-rotate
                ar
                style="width: 100%; height: 100%;">
              </model-viewer>
            </body>
            </html>
          `)}`

          originalCreateShape({
            id: createShapeId(),
            type: 'embed',
            x: center.x - 200,
            y: center.y - 150,
            props: {
              url: embedUrl,
              w: 400,
              h: 300,
            },
          })
        }
      }

      input.click()
    }
  }, [syncClient])

  // Show notification helper
  const showNotification = (message: string) => {
    const notification = document.createElement('div')
    notification.textContent = message
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50'
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  // Add 3D Model button
  useEffect(() => {
    if (!editor) return

    // Add custom action to keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '3' && e.ctrlKey) {
        e.preventDefault()
        ;(editor as any).add3DModel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  return (
    <div
      className="fixed inset-0"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Tldraw
        onMount={handleMount}
        persistenceKey={`board-${roomId}`}
      />

      {/* Help overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded shadow-lg text-xs max-w-xs">
        <p className="font-semibold mb-2">💡 3D Model Support:</p>
        <ul className="space-y-1 text-gray-600">
          <li>• Drag and drop .glb/.gltf files directly onto canvas</li>
          <li>• Press Ctrl+3 to upload a 3D model</li>
          <li>• Models are interactive (rotate, zoom)</li>
          <li>• Resize and move like any other shape</li>
        </ul>
      </div>

      {/* Add 3D Model button */}
      {editor && (
        <button
          onClick={() => (editor as any).add3DModel?.()}
          className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          title="Add 3D Model (Ctrl+3)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
          Add 3D Model
        </button>
      )}
    </div>
  )
}