export interface Env {
  ROOMS: DurableObjectNamespace
  STORAGE: R2Bucket
  ENVIRONMENT: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const roomId = url.searchParams.get('room') || 'default'
      const roomIdHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(roomId)
      )
      const roomIdHex = Array.from(new Uint8Array(roomIdHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const id = env.ROOMS.idFromName(roomIdHex)
      const room = env.ROOMS.get(id)

      return room.fetch(request)
    }

    // Handle regular HTTP requests
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Vibe Kanban Sync Server (Cloudflare Workers)', {
      headers: { 'Content-Type': 'text/plain' },
    })
  },
}

export class RoomDurableObject {
  private state: DurableObjectState
  private env: Env
  private sessions: Map<WebSocket, { id: string; room: string }>
  private roomState: any

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.sessions = new Map()
    this.roomState = {}
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      const sessionId = crypto.randomUUID()
      const room = url.searchParams.get('room') || 'default'

      await this.handleSession(server, sessionId, room)

      return new Response(null, {
        status: 101,
        webSocket: client,
      })
    }

    return new Response('Not found', { status: 404 })
  }

  async handleSession(ws: WebSocket, sessionId: string, room: string) {
    ws.accept()

    this.sessions.set(ws, { id: sessionId, room })

    // Send current state to new client
    ws.send(JSON.stringify({
      type: 'sync',
      state: this.roomState,
    }))

    // Notify others of new participant
    this.broadcast(JSON.stringify({
      type: 'user-joined',
      userId: sessionId,
      timestamp: Date.now(),
    }), ws)

    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string)

        switch (message.type) {
          case 'changes':
            // Apply changes to room state
            this.roomState = { ...this.roomState, ...message.changes }

            // Store in R2
            await this.saveState()

            // Broadcast to others
            this.broadcast(JSON.stringify({
              type: 'remote-changes',
              changes: message.changes,
            }), ws)
            break

          case 'presence':
            // Broadcast presence update
            this.broadcast(JSON.stringify({
              type: 'presence-update',
              userId: sessionId,
              ...message.data,
            }), ws)
            break
        }
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    ws.addEventListener('close', () => {
      this.sessions.delete(ws)

      // Notify others of departure
      this.broadcast(JSON.stringify({
        type: 'user-left',
        userId: sessionId,
        timestamp: Date.now(),
      }))
    })
  }

  broadcast(message: string, exclude?: WebSocket) {
    this.sessions.forEach((session, ws) => {
      if (ws !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(message)
      }
    })
  }

  async saveState() {
    // Save to R2 (simplified)
    const key = `room-state-${Date.now()}.json`
    await this.env.STORAGE.put(key, JSON.stringify(this.roomState))
  }
}