'use client'

import { useCallback, useState } from 'react'
import {
  Tldraw,
  Editor,
} from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useSyncClient } from '@/lib/sync-client'

interface TldrawBoardProps {
  roomId: string
}

export function TldrawBoard({ roomId }: TldrawBoardProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const syncClient = useSyncClient(roomId)

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)

    // Connect to sync server
    if (syncClient) {
      syncClient.connect(editor)
    }
  }, [syncClient])

  return (
    <div className="fixed inset-0">
      <Tldraw
        onMount={handleMount}
        persistenceKey={`board-${roomId}`}
      />
    </div>
  )
}