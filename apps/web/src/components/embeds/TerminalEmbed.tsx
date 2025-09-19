'use client'

import { useEffect, useRef, useState } from 'react'
import { TLEmbedShape } from '@tldraw/tldraw'
import { io, Socket } from 'socket.io-client'

interface TerminalEmbedProps {
  shape: TLEmbedShape
  roomId?: string
}

export function TerminalEmbed({ shape, roomId = 'default' }: TerminalEmbedProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [terminal, setTerminal] = useState<any>(null)
  const [sessionId] = useState(() => `terminal-${shape.id}`)

  useEffect(() => {
    if (!terminalRef.current) return

    // Dynamically import xterm
    Promise.all([
      import('xterm'),
      import('xterm-addon-fit'),
      import('xterm/css/xterm.css'),
    ]).then(([{ Terminal }, { FitAddon }]) => {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
        },
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      term.open(terminalRef.current!)
      fitAddon.fit()

      // Connect to backend
      const socketConnection = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
        transports: ['websocket'],
      })

      socketConnection.on('connect', () => {
        socketConnection.emit('terminal:create', {
          sessionId,
          roomId,
        })
      })

      socketConnection.on('terminal:output', (data: string) => {
        term.write(data)
      })

      term.onData((data: string) => {
        socketConnection.emit('terminal:input', {
          sessionId,
          data,
        })
      })

      setTerminal(term)
      setSocket(socketConnection)

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit()
        socketConnection.emit('terminal:resize', {
          sessionId,
          cols: term.cols,
          rows: term.rows,
        })
      })
      resizeObserver.observe(terminalRef.current!)

      return () => {
        resizeObserver.disconnect()
        term.dispose()
        socketConnection.disconnect()
      }
    })
  }, [sessionId, roomId])

  return (
    <div className="relative w-full h-full bg-black">
      <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white px-3 py-1 text-xs">
        Terminal - Session: {sessionId.slice(0, 8)}
      </div>
      <div
        ref={terminalRef}
        className="absolute top-6 left-0 right-0 bottom-0"
      />
    </div>
  )
}