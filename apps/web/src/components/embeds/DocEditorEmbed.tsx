'use client'

import { useEffect, useState } from 'react'
import { TLEmbedShape } from '@tldraw/tldraw'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface DocEditorEmbedProps {
  shape: TLEmbedShape
  roomId?: string
}

export function DocEditorEmbed({ shape, roomId = 'default' }: DocEditorEmbedProps) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const ydoc = new Y.Doc()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: null,
        user: {
          name: `User-${Math.floor(Math.random() * 1000)}`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4',
      },
    },
  })

  useEffect(() => {
    if (!editor || !mounted) return

    const wsProvider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:3002',
      `doc-${roomId}-${shape.id}`,
      ydoc
    )

    wsProvider.on('status', (event: any) => {
      console.log('Collaboration status:', event.status)
    })

    setProvider(wsProvider)

    return () => {
      wsProvider.destroy()
    }
  }, [editor, mounted, roomId, shape.id, ydoc])

  useEffect(() => {
    if (!editor || !provider) return

    const collaborationCursor = editor.extensionManager.extensions.find(
      (ext) => ext.name === 'collaborationCursor'
    )

    if (collaborationCursor) {
      collaborationCursor.options.provider = provider
    }
  }, [editor, provider])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p>Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white overflow-auto">
      <div className="sticky top-0 bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium">Collaborative Document</span>
        <div className="flex items-center gap-2">
          {provider && (
            <span className="text-xs text-green-600">Connected</span>
          )}
        </div>
      </div>

      <div className="min-h-full">
        {editor && (
          <div
            className="ProseMirror"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const target = e.target as HTMLElement
              editor.commands.setContent(target.innerHTML)
            }}
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        )}
      </div>
    </div>
  )
}