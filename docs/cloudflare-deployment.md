# Cloudflare Deployment Configuration

## Overview
This application is deployed using Cloudflare tunnels to expose local services to the internet without requiring Nginx or other reverse proxy configurations.

## Architecture

### Domain Mapping
- **Frontend**: `infiniteboard.zchtech.ai` → `127.0.0.1:20101`
- **Backend**: `infiniteboardserver.zchtech.ai` → `127.0.0.1:20100`

### Services
1. **Frontend (Next.js)**
   - Local Port: 20101
   - Public URL: https://infiniteboard.zchtech.ai
   - Features: Tldraw canvas, 3D model viewer, terminal embed, document editor

2. **Backend (Node.js/Express)**
   - Local Port: 20100
   - Public URL: https://infiniteboardserver.zchtech.ai
   - Features: WebSocket server, Terminal PTY, Sync server, Hocuspocus collaboration

3. **Hocuspocus (Yjs Server)**
   - Local Port: 20102
   - Accessed via backend WebSocket proxy

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_WS_URL=https://infiniteboardserver.zchtech.ai
NEXT_PUBLIC_SYNC_URL=https://infiniteboardserver.zchtech.ai
NEXT_PUBLIC_COLLAB_WS_URL=wss://infiniteboardserver.zchtech.ai
```

### Backend (.env)
```env
PORT=20100
FRONTEND_URL=https://infiniteboard.zchtech.ai
```

## WebSocket Connections
All WebSocket connections are automatically upgraded by Cloudflare:
- HTTP → HTTPS
- WS → WSS

The backend handles the following WebSocket namespaces:
- `/` - Main Socket.IO connection
- `/terminal` - Terminal PTY sessions
- `/sync` - Tldraw real-time sync
- `/collab` - Document collaboration

## Running Services

### Development Mode
```bash
# Frontend (port 20101)
cd apps/web
npm run dev

# Backend (port 20100)
cd apps/server
PORT=20100 npm run dev
```

### Production Mode
```bash
# Using Docker Compose
docker-compose up -d

# Or using PM2
pm2 start ecosystem.config.js
```

## Testing Connectivity

### Test Backend Health
```bash
curl https://infiniteboardserver.zchtech.ai/health
```

### Test WebSocket Connection
Open browser console at https://infiniteboard.zchtech.ai and check:
- Network tab for WebSocket connections
- Console for connection logs

## Features

### 3D Model Support
- Drag and drop GLB/GLTF files onto canvas
- Press Ctrl+3 to upload models
- Models are embedded using iframe with @google/model-viewer

### Terminal Embed
- Real-time terminal sessions via WebSocket
- Each terminal has unique session ID
- PTY backend for full terminal emulation

### Collaborative Documents
- Real-time collaboration using Yjs
- WebSocket provider for synchronization
- User cursors and presence awareness

## Troubleshooting

### WebSocket Connection Issues
1. Check backend is running on port 20100
2. Verify Cloudflare tunnel is active
3. Check browser console for CORS errors
4. Ensure environment variables are set correctly

### Port Conflicts
If ports are in use:
```bash
# Check what's using the port
lsof -i :20100
lsof -i :20101

# Kill specific process (if needed)
kill -9 <PID>
```

### CORS Configuration
Backend is configured to accept connections from:
- https://infiniteboard.zchtech.ai
- http://infiniteboard.zchtech.ai
- http://localhost:20101
- http://localhost:3000

## Security Considerations
- All traffic is encrypted via Cloudflare SSL
- WebSocket connections use WSS protocol
- CORS is configured for specific origins only
- No direct exposure of local services

## Monitoring
- Backend health endpoint: `/health`
- WebSocket status events in browser console
- Cloudflare dashboard for tunnel metrics