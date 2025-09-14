'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Tldraw,
  Editor,
  TLUiOverrides,
  menuGroup,
  menuItem,
  toolbarItem,
} from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { ModelViewerEmbed } from '../embeds/ModelViewerEmbed'
import { TerminalEmbed } from '../embeds/TerminalEmbed'
import { DocEditorEmbed } from '../embeds/DocEditorEmbed'
import { useSyncClient } from '@/lib/sync-client'

interface TldrawBoardProps {
  roomId: string
}

export function TldrawBoard({ roomId }: TldrawBoardProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const syncClient = useSyncClient(roomId)

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor)

    // Register custom embeds
    const embedDefinitions = [
      {
        type: 'model-viewer',
        title: '3D Model',
        component: ModelViewerEmbed,
        icon: '🎨',
        doesResize: true,
      },
      {
        type: 'terminal',
        title: 'Terminal',
        component: TerminalEmbed,
        icon: '💻',
        doesResize: true,
      },
      {
        type: 'doc-editor',
        title: 'Document',
        component: DocEditorEmbed,
        icon: '📄',
        doesResize: true,
      },
    ]

    // Add custom tools to the UI
    const overrides: TLUiOverrides = {
      menu: (_editor, menu, { actions }) => {
        const toolsGroup = menuGroup(
          'embeds',
          menuItem({
            id: 'model-viewer',
            label: '3D Model',
            icon: 'box',
            onSelect: () => {
              // Create 3D model embed
              editor.createShape({
                type: 'embed',
                props: {
                  url: '',
                  w: 400,
                  h: 400,
                  embedType: 'model-viewer',
                },
              })
            },
          }),
          menuItem({
            id: 'terminal',
            label: 'Terminal',
            icon: 'code',
            onSelect: () => {
              // Create terminal embed
              editor.createShape({
                type: 'embed',
                props: {
                  url: '',
                  w: 600,
                  h: 400,
                  embedType: 'terminal',
                },
              })
            },
          }),
          menuItem({
            id: 'doc-editor',
            label: 'Document',
            icon: 'document',
            onSelect: () => {
              // Create document editor embed
              editor.createShape({
                type: 'embed',
                props: {
                  url: '',
                  w: 600,
                  h: 400,
                  embedType: 'doc-editor',
                },
              })
            },
          })
        )
        return [toolsGroup, ...menu]
      },
    }

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