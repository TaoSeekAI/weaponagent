'use client'

import { useCallback, useState } from 'react'
import {
  Tldraw,
  Editor,
  createShapeId,
  TLUiOverrides,
  menuGroup,
  menuItem,
  toolbarItem,
} from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { useSyncClient } from '@/lib/sync-client'
import { ModelViewerShapeUtil } from '@/lib/shapes/ModelViewerShapeUtil'

interface TldrawBoardProps {
  roomId: string
}

// Custom shape utilities
const customShapeUtils = [ModelViewerShapeUtil]

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
      // Handle 3D model files
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const url = URL.createObjectURL(file)

        editor.createShape({
          id: createShapeId(),
          type: 'model-viewer',
          x: point.x - 200, // Center the shape
          y: point.y - 150,
          props: {
            url: url,
            w: 400,
            h: 300,
          },
        })
      }
      // Handle other files (images, etc.)
      else if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)

        editor.createShape({
          id: createShapeId(),
          type: 'image',
          x: point.x - 150,
          y: point.y - 150,
          props: {
            url: url,
            w: 300,
            h: 300,
          },
        })
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

    // Register external content handler for pasted/imported files
    editor.registerExternalContentHandler('files', async ({ files, point }) => {
      for (const file of files) {
        if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
          const url = URL.createObjectURL(file)

          editor.createShape({
            id: createShapeId(),
            type: 'model-viewer',
            x: point.x,
            y: point.y,
            props: {
              url: url,
              w: 400,
              h: 300,
            },
          })
        }
      }
    })
  }, [syncClient])

  // UI overrides to add 3D model button
  const uiOverrides: TLUiOverrides = {
    tools(editor, tools) {
      tools['model-viewer'] = {
        id: 'model-viewer',
        label: '3D Model',
        readonlyOk: false,
        icon: 'box-icon', // You can replace with custom icon
        onSelect: () => {
          // Open file picker
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.glb,.gltf'

          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const url = URL.createObjectURL(file)
              const center = editor.getViewportPageCenter()

              editor.createShape({
                id: createShapeId(),
                type: 'model-viewer',
                x: center.x - 200,
                y: center.y - 150,
                props: {
                  url: url,
                  w: 400,
                  h: 300,
                },
              })
            }
          }

          input.click()
        },
      }
      return tools
    },

    toolbar(editor, toolbar, { tools }) {
      // Add 3D model button to toolbar
      toolbar.splice(4, 0, toolbarItem(tools['model-viewer']))
      return toolbar
    },

    menu(editor, menu, { actions }) {
      // Add to menu
      const fileMenu = menu.find(item => item.id === 'menu' && item.children?.some(child => child.id === 'file'))
      if (fileMenu && fileMenu.type === 'group' && fileMenu.children) {
        fileMenu.children.push(
          menuGroup(
            '3d-models',
            menuItem({
              id: 'insert-3d-model',
              label: 'Insert 3D Model',
              readonlyOk: false,
              onSelect: () => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.glb,.gltf'

                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const url = URL.createObjectURL(file)
                    const center = editor.getViewportPageCenter()

                    editor.createShape({
                      id: createShapeId(),
                      type: 'model-viewer',
                      x: center.x - 200,
                      y: center.y - 150,
                      props: {
                        url: url,
                        w: 400,
                        h: 300,
                      },
                    })
                  }
                }

                input.click()
              },
            })
          )
        )
      }
      return menu
    },
  }

  return (
    <div
      className="fixed inset-0"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Tldraw
        shapeUtils={customShapeUtils}
        overrides={uiOverrides}
        onMount={handleMount}
        persistenceKey={`board-${roomId}`}
      />

      {/* Help text */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded shadow-lg text-xs max-w-xs">
        <p className="font-semibold mb-1">💡 Tips:</p>
        <ul className="space-y-1 text-gray-600">
          <li>• Drag and drop .glb/.gltf files to add 3D models</li>
          <li>• Use the 3D Model tool in toolbar</li>
          <li>• Resize and move models like any shape</li>
        </ul>
      </div>
    </div>
  )
}