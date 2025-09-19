import { Server, Socket } from 'socket.io'
import * as pty from 'node-pty'
import os from 'os'

interface TerminalSession {
  pty: pty.IPty
  socket: Socket
  roomId: string
  userId?: string
}

const terminals = new Map<string, TerminalSession>()

// Command whitelist for security
const ALLOWED_COMMANDS = [
  'ls', 'pwd', 'echo', 'cat', 'grep', 'find', 'head', 'tail',
  'wc', 'sort', 'uniq', 'date', 'whoami', 'env', 'node', 'npm',
  'python', 'python3', 'pip', 'git', 'curl', 'wget'
]

export function setupTerminalHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`Terminal client connected: ${socket.id}`)

    socket.on('terminal:create', ({ sessionId, roomId }) => {
      if (terminals.has(sessionId)) {
        // Reconnect to existing session
        const session = terminals.get(sessionId)!
        session.socket = socket

        socket.emit('terminal:output', '\r\n=== Reconnected to session ===\r\n')
        return
      }

      // Create new terminal session
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
      })

      const session: TerminalSession = {
        pty: ptyProcess,
        socket,
        roomId,
      }

      terminals.set(sessionId, session)

      // Output handler
      ptyProcess.onData((data) => {
        socket.emit('terminal:output', data)
      })

      ptyProcess.onExit(() => {
        socket.emit('terminal:output', '\r\n=== Session ended ===\r\n')
        terminals.delete(sessionId)
      })

      // Welcome message
      ptyProcess.write('echo "Welcome to Vibe Kanban Terminal"\r')
      ptyProcess.write('echo "Session ID: ' + sessionId.slice(0, 8) + '"\r')
      ptyProcess.write('clear\r')
    })

    socket.on('terminal:input', ({ sessionId, data }) => {
      const session = terminals.get(sessionId)
      if (!session) {
        socket.emit('terminal:output', '\r\nSession not found. Please refresh.\r\n')
        return
      }

      // Basic command filtering (optional, can be disabled)
      const command = data.trim().split(' ')[0]
      if (command && !isCommandAllowed(command)) {
        socket.emit('terminal:output', `\r\nCommand '${command}' is not allowed.\r\n`)
        return
      }

      session.pty.write(data)
    })

    socket.on('terminal:resize', ({ sessionId, cols, rows }) => {
      const session = terminals.get(sessionId)
      if (session) {
        session.pty.resize(cols, rows)
      }
    })

    socket.on('disconnect', () => {
      // Don't destroy terminal on disconnect (allow reconnection)
      console.log(`Terminal client disconnected: ${socket.id}`)
    })
  })
}

function isCommandAllowed(command: string): boolean {
  // Skip the check if in development mode
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Check against whitelist
  return ALLOWED_COMMANDS.some(allowed =>
    command === allowed || command.startsWith(allowed + ' ')
  )
}