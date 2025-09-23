# 最终部署配置 - infiniteboardserver.zchtech.ai

## 配置说明
前端通过域名访问，后端服务保持在localhost

## 架构设计

```
用户浏览器 → http://infiniteboardserver.zchtech.ai (Nginx:80)
                    ↓
            [Nginx反向代理]
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
前端:20101    后端API:20100   协作服务:20102
(Next.js)     (Express)      (Hocuspocus)
    ↓               ↓               ↓
    └───────────────┼───────────────┘
                    ↓
            WebSocket连接到localhost
```

## 服务配置

### 前端服务 (Next.js)
- **本地端口**: 20101
- **访问地址**: http://infiniteboardserver.zchtech.ai
- **WebSocket连接**: localhost:20100

### 后端服务 (Express + Socket.IO)
- **本地端口**: 20100
- **CORS允许**: infiniteboardserver.zchtech.ai
- **WebSocket路径**: /socket.io/

### 协作服务 (Hocuspocus)
- **本地端口**: 20102
- **WebSocket路径**: /collab

## 环境变量配置

### apps/web/.env.local (开发环境)
```env
NEXT_PUBLIC_WS_URL=http://localhost:20100
NEXT_PUBLIC_SYNC_URL=http://localhost:20100
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:20102
```

### apps/web/.env.production (生产环境/通过域名访问)
```env
NEXT_PUBLIC_WS_URL=http://infiniteboardserver.zchtech.ai/api
NEXT_PUBLIC_SYNC_URL=http://infiniteboardserver.zchtech.ai
NEXT_PUBLIC_COLLAB_WS_URL=ws://infiniteboardserver.zchtech.ai/collab
```

### apps/server/.env
```env
PORT=20100
FRONTEND_URL=http://infiniteboardserver.zchtech.ai
```

## Nginx配置 (nginx.conf)

```nginx
server {
    listen 80;
    server_name infiniteboardserver.zchtech.ai;

    # 前端代理
    location / {
        proxy_pass http://127.0.0.1:20101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://127.0.0.1:20100/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Socket.IO WebSocket代理
    location /socket.io/ {
        proxy_pass http://127.0.0.1:20100/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Hocuspocus协作服务代理
    location /collab {
        proxy_pass http://127.0.0.1:20102;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 启动命令

### 启动后端
```bash
cd apps/server
PORT=20100 FRONTEND_URL=http://infiniteboardserver.zchtech.ai pnpm dev
```

### 启动前端
```bash
cd apps/web
PORT=20101 pnpm dev
```

### 安装Nginx配置
```bash
# 复制配置文件到Nginx
sudo cp nginx.conf /etc/nginx/sites-available/infiniteboardserver
sudo ln -s /etc/nginx/sites-available/infiniteboardserver /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 测试验证

### 1. 本地访问测试
```bash
# 前端
curl http://localhost:20101/

# 后端健康检查
curl http://localhost:20100/health
```

### 2. 域名访问测试
```bash
# 通过域名访问前端
curl http://infiniteboardserver.zchtech.ai/

# 通过域名访问API
curl http://infiniteboardserver.zchtech.ai/api/health
```

### 3. WebSocket连接测试
在浏览器开发者工具中检查：
- 连接地址: `ws://localhost:20100/socket.io/`
- 状态: 101 Switching Protocols

## 访问方式

### 本地开发
- 前端: http://localhost:20101
- 后端: http://localhost:20100

### 生产访问（通过域名）
- 主页面: http://infiniteboardserver.zchtech.ai
- 协作房间: http://infiniteboardserver.zchtech.ai?room=test

## 功能特性

✅ **3D模型支持**
- 拖放.glb/.gltf文件
- 使用Ctrl+3快捷键
- 点击"Add 3D Model"按钮

✅ **实时协作**
- 多用户同步
- 光标共享
- 实时画布更新

✅ **嵌入组件**
- Web终端
- 文档编辑器
- 3D模型查看器

## 常见问题

### WebSocket连接失败
- 确认后端服务运行在20100端口
- 检查防火墙设置
- 验证CORS配置

### 页面无法访问
- 检查Nginx服务状态
- 确认域名解析
- 验证端口监听

### 3D模型无法加载
- 检查文件格式(.glb/.gltf)
- 验证文件大小(<10MB)
- 查看浏览器控制台错误

## 维护命令

### 查看服务状态
```bash
# 查看端口占用
lsof -i :20100
lsof -i :20101

# 查看进程
ps aux | grep -E "pnpm dev|next dev|tsx watch"
```

### 重启服务
```bash
# 停止所有服务
pkill -f "tsx watch"
pkill -f "next dev"

# 重新启动
./start-services.sh
```

## 总结
配置完成后，用户可以通过 http://infiniteboardserver.zchtech.ai 访问应用，所有WebSocket连接会自动路由到本地后端服务。