# WebSocket配置更新 - infiniteboardserver.zchtech.ai

## 更新时间
2025-09-24

## 更新内容
将所有localhost引用改为infiniteboardserver.zchtech.ai，解决WebSocket连接失败问题。

## 修改的文件

### 1. 前端环境变量 (apps/web/.env.local)
```env
NEXT_PUBLIC_WS_URL=http://infiniteboardserver.zchtech.ai:20100
NEXT_PUBLIC_SYNC_URL=http://infiniteboardserver.zchtech.ai:20100
NEXT_PUBLIC_COLLAB_WS_URL=ws://infiniteboardserver.zchtech.ai:20102
```

### 2. 后端环境变量 (apps/server/.env)
```env
PORT=20100
FRONTEND_URL=http://infiniteboardserver.zchtech.ai:20101
```

### 3. 同步客户端 (apps/web/src/lib/sync-client.ts)
```typescript
this.socket = io(process.env.NEXT_PUBLIC_SYNC_URL || 'http://infiniteboardserver.zchtech.ai:20100', {
  transports: ['websocket'],
  query: {
    roomId: this.roomId,
  },
})
```

### 4. 终端嵌入组件 (apps/web/src/components/embeds/TerminalEmbed.tsx)
```typescript
const socketConnection = io(process.env.NEXT_PUBLIC_WS_URL || 'http://infiniteboardserver.zchtech.ai:20100', {
  transports: ['websocket'],
})
```

### 5. 文档编辑器嵌入 (apps/web/src/components/embeds/DocEditorEmbed.tsx)
```typescript
const wsProvider = new WebsocketProvider(
  process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://infiniteboardserver.zchtech.ai:20102',
  `doc-${roomId}-${shape.id}`,
  ydoc
)
```

## 端口映射
- **前端**: 20101
- **后端API/WebSocket**: 20100
- **Hocuspocus协作服务**: 20102

## 访问地址
- **前端应用**: http://infiniteboardserver.zchtech.ai:20101
- **后端API**: http://infiniteboardserver.zchtech.ai:20100
- **健康检查**: http://infiniteboardserver.zchtech.ai:20100/health
- **WebSocket**: ws://infiniteboardserver.zchtech.ai:20100
- **协作服务**: ws://infiniteboardserver.zchtech.ai:20102

## 验证方法

### 1. 检查WebSocket连接
在浏览器开发者工具的Network标签中查看WebSocket连接：
- 应该看到连接到 `ws://infiniteboardserver.zchtech.ai:20100/socket.io/?roomId=xxx`
- 状态应该是 `101 Switching Protocols`

### 2. 测试实时协作
- 打开两个浏览器窗口访问相同房间URL
- 在一个窗口中绘制，另一个窗口应该实时看到

### 3. 测试健康检查
```bash
curl http://infiniteboardserver.zchtech.ai:20100/health
```

## 注意事项

1. **CORS配置**: 后端已配置允许来自infiniteboardserver.zchtech.ai:20101的请求
2. **防火墙**: 确保端口20100, 20101, 20102在服务器防火墙中开放
3. **域名解析**: infiniteboardserver.zchtech.ai需要正确解析到服务器IP
4. **SSL/TLS**: 如果需要HTTPS，需要额外配置SSL证书

## 故障排查

### WebSocket连接失败
1. 检查环境变量是否正确加载
2. 确认服务器端口是否开放
3. 查看浏览器控制台错误信息
4. 检查后端日志是否有连接请求

### CORS错误
1. 检查后端CORS配置
2. 确认FRONTEND_URL环境变量正确
3. 重启后端服务

### 连接超时
1. 检查网络连接
2. 确认域名解析正确
3. 测试直接使用IP地址连接

## 重启命令
```bash
# 停止服务
pkill -f "tsx watch"
pkill -f "next dev"

# 启动后端
cd apps/server
PORT=20100 pnpm dev &

# 启动前端
cd apps/web
PORT=20101 pnpm dev &
```