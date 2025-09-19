'use client'

import { useEffect, useState } from 'react'
import { Editor } from '@tldraw/tldraw'
import { io, Socket } from 'socket.io-client'

export class SyncClient {
  private socket: Socket | null = null
  private editor: Editor | null = null
  private roomId: string

  constructor(roomId: string) {
    this.roomId = roomId
  }

  connect(editor: Editor) {
    this.editor = editor

    // Connect to sync server
    this.socket = io(process.env.NEXT_PUBLIC_SYNC_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      query: {
        roomId: this.roomId,
      },
    })

    this.socket.on('connect', () => {
      console.log('Connected to sync server')
      this.socket?.emit('join-room', this.roomId)
    })

    // Listen for remote changes
    this.socket.on('remote-changes', (changes: any) => {
      if (this.editor) {
        // Apply remote changes to the editor
        this.editor.store.mergeRemoteChanges(() => {
          // Apply changes
        })
      }
    })

    // Listen for presence updates
    this.socket.on('presence-update', (presence: any) => {
      if (this.editor) {
        // Update presence information
      }
    })

    // Send local changes
    this.editor.store.listen((changes) => {
      if (changes.source === 'user') {
        this.socket?.emit('local-changes', {
          roomId: this.roomId,
          changes: changes,
        })
      }
    })

    return this
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this.editor = null
  }
}

export function useSyncClient(roomId: string) {
  const [syncClient, setSyncClient] = useState<SyncClient | null>(null)

  useEffect(() => {
    const client = new SyncClient(roomId)
    setSyncClient(client)

    return () => {
      client.disconnect()
    }
  }, [roomId])

  return syncClient
}