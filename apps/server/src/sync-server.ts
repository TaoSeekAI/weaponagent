import { Server, Socket } from 'socket.io'

interface Room {
  id: string
  participants: Map<string, Socket>
  state: any
}

const rooms = new Map<string, Room>()

export function setupSyncHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`Sync client connected: ${socket.id}`)

    const roomId = socket.handshake.query.roomId as string || 'default'

    socket.on('join-room', (requestedRoomId: string) => {
      const finalRoomId = requestedRoomId || roomId

      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room)
        }
      })

      // Join new room
      socket.join(finalRoomId)

      // Get or create room
      if (!rooms.has(finalRoomId)) {
        rooms.set(finalRoomId, {
          id: finalRoomId,
          participants: new Map(),
          state: {},
        })
      }

      const room = rooms.get(finalRoomId)!
      room.participants.set(socket.id, socket)

      // Send current state to new participant
      socket.emit('room-state', room.state)

      // Notify others of new participant
      socket.to(finalRoomId).emit('user-joined', {
        userId: socket.id,
        timestamp: Date.now(),
      })

      console.log(`Client ${socket.id} joined room ${finalRoomId}`)
    })

    socket.on('local-changes', ({ roomId, changes }) => {
      // Broadcast changes to other participants in the room
      socket.to(roomId).emit('remote-changes', changes)

      // Update room state (simplified)
      const room = rooms.get(roomId)
      if (room) {
        room.state = { ...room.state, ...changes }
      }
    })

    socket.on('presence-update', ({ roomId, presence }) => {
      // Broadcast presence update to room
      socket.to(roomId).emit('presence-update', {
        userId: socket.id,
        ...presence,
      })
    })

    socket.on('disconnect', () => {
      // Remove from all rooms
      rooms.forEach((room, roomId) => {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id)

          // Notify others of departure
          socket.to(roomId).emit('user-left', {
            userId: socket.id,
            timestamp: Date.now(),
          })

          // Clean up empty rooms
          if (room.participants.size === 0) {
            rooms.delete(roomId)
          }
        }
      })

      console.log(`Sync client disconnected: ${socket.id}`)
    })
  })
}