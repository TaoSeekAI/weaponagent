'use client'

import { useEffect, useState, useRef } from 'react'
import { Editor, TLRecord, TLShapeId } from '@tldraw/tldraw'

interface EditTrace {
  id: string
  userId: string
  userName: string
  action: 'create' | 'update' | 'delete'
  shapeId: string
  timestamp: number
  color: string
}

interface EditingTracesProps {
  editor: Editor | null
  userId: string
  userName: string
}

export function EditingTraces({ editor, userId, userName }: EditingTracesProps) {
  const [traces, setTraces] = useState<EditTrace[]>([])
  const [showTraces, setShowTraces] = useState(true)
  const tracesRef = useRef<Map<string, EditTrace>>(new Map())

  // Generate user color based on userId
  const getUserColor = (id: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#6C5CE7', '#FD79A8', '#FDCB6E'
    ]
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  useEffect(() => {
    if (!editor) return

    const userColor = getUserColor(userId)

    // Listen to store changes
    const handleChange = (changes: any) => {
      const now = Date.now()

      Object.entries(changes.added).forEach(([id, record]: [string, any]) => {
        if (record.typeName === 'shape') {
          const trace: EditTrace = {
            id: `${userId}-${id}-${now}`,
            userId,
            userName,
            action: 'create',
            shapeId: id,
            timestamp: now,
            color: userColor
          }
          tracesRef.current.set(trace.id, trace)
          setTraces(Array.from(tracesRef.current.values()))

          // Add visual indicator
          addVisualIndicator(trace)
        }
      })

      Object.entries(changes.updated).forEach(([id, records]: [string, any]) => {
        const [oldRecord, newRecord] = records as [any, any]
        if (newRecord?.typeName === 'shape') {
          const trace: EditTrace = {
            id: `${userId}-${id}-${now}`,
            userId,
            userName,
            action: 'update',
            shapeId: id,
            timestamp: now,
            color: userColor
          }
          tracesRef.current.set(trace.id, trace)
          setTraces(Array.from(tracesRef.current.values()))

          // Add visual indicator
          addVisualIndicator(trace)
        }
      })

      Object.entries(changes.removed).forEach(([id, record]: [string, any]) => {
        if (record.typeName === 'shape') {
          const trace: EditTrace = {
            id: `${userId}-${id}-${now}`,
            userId,
            userName,
            action: 'delete',
            shapeId: id,
            timestamp: now,
            color: userColor
          }
          tracesRef.current.set(trace.id, trace)
          setTraces(Array.from(tracesRef.current.values()))
        }
      })
    }

    const addVisualIndicator = (trace: EditTrace) => {
      const shape = editor.getShape(trace.shapeId as TLShapeId)
      if (!shape) return

      const bounds = editor.getShapeGeometry(shape).bounds
      const pagePoint = editor.getShapePageTransform(shape).point()

      // Create a temporary highlight effect
      const indicatorId = createShapeId()
      editor.createShape({
        id: indicatorId,
        type: 'geo',
        x: pagePoint.x - 5,
        y: pagePoint.y - 5,
        props: {
          w: bounds.width + 10,
          h: bounds.height + 10,
          geo: 'rectangle',
          color: 'violet',
          fill: 'none',
          dash: 'draw',
          size: 's',
          opacity: 0.5,
        },
      })

      // Remove indicator after 2 seconds
      setTimeout(() => {
        editor.deleteShape(indicatorId)
      }, 2000)
    }

    // Clean old traces (older than 5 minutes)
    const cleanupInterval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      tracesRef.current.forEach((trace, id) => {
        if (trace.timestamp < fiveMinutesAgo) {
          tracesRef.current.delete(id)
        }
      })
      setTraces(Array.from(tracesRef.current.values()))
    }, 60000)

    // Subscribe to store changes
    const unsubscribe = editor.store.listen(handleChange, { source: 'user', scope: 'document' })

    return () => {
      unsubscribe()
      clearInterval(cleanupInterval)
    }
  }, [editor, userId, userName])

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (!showTraces || traces.length === 0) return null

  return (
    <div className="absolute top-20 right-4 w-80 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-700">Edit History</h3>
        <button
          onClick={() => setShowTraces(!showTraces)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showTraces ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="space-y-2">
        {traces
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20)
          .map(trace => (
            <div
              key={trace.id}
              className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: trace.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {trace.userName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {trace.action === 'create' && 'created'}
                    {trace.action === 'update' && 'edited'}
                    {trace.action === 'delete' && 'deleted'}
                  </span>
                  <span className="text-xs text-gray-400">
                    a shape
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {getTimeAgo(trace.timestamp)}
                </div>
              </div>
            </div>
          ))}
      </div>

      {traces.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-4">
          No recent edits
        </div>
      )}
    </div>
  )
}

function createShapeId(): TLShapeId {
  return `shape:${Math.random().toString(36).substr(2, 9)}` as TLShapeId
}