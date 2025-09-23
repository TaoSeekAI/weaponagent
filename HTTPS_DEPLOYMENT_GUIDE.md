# HTTPS部署指南 - infiniteboard.zchtech.ai

## 配置概览
前端通过HTTPS域名访问：https://infiniteboard.zchtech.ai/

## 架构
```
用户浏览器 → https://infiniteboard.zchtech.ai (Nginx:443 SSL)
                    ↓
            [Nginx SSL终止]
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
前端:20101    后端API:20100   协作:20102
(Next.js)     (Express)      (Hocuspocus)
```

## 已更新的配置

### 1. 后端CORS配置 (apps/server/src/index.ts)
```javascript
const corsOrigins = [
  'https://infiniteboard.zchtech.ai',
  'http://infiniteboard.zchtech.ai',
  'http://localhost:20101',
  'http://localhost:3000'
]
```

### 2. 环境变量

#### apps/server/.env
```env
PORT=20100
FRONTEND_URL=https://infiniteboard.zchtech.ai
```

#### apps/web/.env.production.https
```env
NEXT_PUBLIC_WS_URL=https://infiniteboard.zchtech.ai/api
NEXT_PUBLIC_SYNC_URL=https://infiniteboard.zchtech.ai
NEXT_PUBLIC_COLLAB_WS_URL=wss://infiniteboard.zchtech.ai/collab
```

### 3. Nginx HTTPS配置 (nginx-https.conf)
- SSL证书配置
- WebSocket升级头处理
- X-Forwarded-Proto设置为https

## 部署步骤

### 1. 安装SSL证书
```bash
# 使用Let's Encrypt获取免费证书
sudo certbot certonly --nginx -d infiniteboard.zchtech.ai
```

### 2. 应用Nginx配置
```bash
sudo cp nginx-https.conf /etc/nginx/sites-available/infiniteboard-ssl
sudo ln -s /etc/nginx/sites-available/infiniteboard-ssl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 启动服务
```bash
# 后端（已配置HTTPS CORS）
cd apps/server
PORT=20100 FRONTEND_URL=https://infiniteboard.zchtech.ai pnpm dev

# 前端
cd apps/web
PORT=20101 NODE_ENV=production pnpm dev
```

## WebSocket连接

### 浏览器中的WebSocket连接
- **开发环境**: `ws://localhost:20100/socket.io/`
- **生产环境(HTTPS)**: `wss://infiniteboard.zchtech.ai/socket.io/`

### 混合内容问题解决
HTTPS页面中的WebSocket必须使用WSS协议，Nginx会处理SSL终止并转发到本地HTTP服务。

## 测试检查列表

### 1. 基本访问
- [ ] https://infiniteboard.zchtech.ai 可访问
- [ ] HTTP自动重定向到HTTPS

### 2. WebSocket连接
- [ ] 浏览器控制台无混合内容警告
- [ ] Network标签显示WSS连接成功(101状态码)

### 3. 功能测试
- [ ] 3D模型拖放功能正常
- [ ] 实时协作同步工作
- [ ] 终端嵌入组件连接成功

## 故障排查

### 问题：WebSocket连接失败
**解决方案**：
1. 检查Nginx配置中的Upgrade头
2. 确认后端CORS包含https://infiniteboard.zchtech.ai
3. 验证WSS协议在生产环境使用

### 问题：混合内容错误
**解决方案**：
1. 确保所有资源使用HTTPS
2. 检查环境变量配置
3. 使用浏览器开发者工具Security标签检查

### 问题：CORS错误
**解决方案**：
1. 重启后端服务以加载新CORS配置
2. 检查FRONTEND_URL环境变量
3. 验证请求头中的Origin

## 当前状态

✅ **已完成**：
- CORS配置更新支持HTTPS
- Nginx SSL配置文件创建
- 环境变量配置更新
- WebSocket WSS支持

⚠️ **需要操作**：
- 安装SSL证书到服务器
- 应用Nginx配置
- 部署到生产服务器

## 访问方式

### 生产环境（HTTPS）
- 主页：https://infiniteboard.zchtech.ai
- API健康检查：https://infiniteboard.zchtech.ai/api/health
- 协作房间：https://infiniteboard.zchtech.ai?room=test

### 本地开发
- 前端：http://localhost:20101
- 后端：http://localhost:20100

## 总结
配置已更新支持HTTPS访问，需要在服务器上安装SSL证书并应用Nginx配置即可完成部署。