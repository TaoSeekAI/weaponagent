import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { setupTerminalHandlers } from './ws-terminal'
import { setupSyncHandlers } from './sync-server'
import { Hocuspocus } from '@hocuspocus/server'

const app = express()
const httpServer = createServer(app)

// CORS configuration
app.use(cors())
app.use(express.json())

// Socket.IO server for terminals and sync
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Setup handlers
setupTerminalHandlers(io)
setupSyncHandlers(io)

// Hocuspocus server for Tiptap collaboration
const hocuspocus = new Hocuspocus({
  port: 3002,
  onAuthenticate: async (data) => {
    // Simple auth placeholder
    return {
      user: {
        id: Math.random().toString(),
        name: `User-${Math.floor(Math.random() * 1000)}`,
      },
    }
  },
  onLoadDocument: async (data) => {
    // Load document from storage (placeholder)
    return null
  },
  onStoreDocument: async (data) => {
    // Store document (placeholder)
    console.log(`Storing document: ${data.documentName}`)
  },
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start servers
const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`- HTTP/WebSocket: http://localhost:${PORT}`)
  console.log(`- Hocuspocus: ws://localhost:3002`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  httpServer.close()
  hocuspocus.destroy()
  process.exit(0)
})