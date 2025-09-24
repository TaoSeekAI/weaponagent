# 502 错误排查详细日志

## 问题描述
- 初始问题：访问 https://infiniteboard.zchtech.ai 返回 Cloudflare 524 错误（Gateway Timeout）
- 后续问题：修复后变成 502 错误（Bad Gateway）

## 排查步骤与日志

### 1. 检查服务运行状态
```bash
# 检查端口监听
$ netstat -tuln | grep -E "20100|20101"
# 初始无输出 - 服务未运行

# 检查进程
$ ps aux | grep -E "node.*20100|node.*20101"
# 无相关进程
```

### 2. 重启服务
```bash
# 启动后端（端口 20100）
$ cd /var/tmp/vibe-kanban/worktrees/vk-5636-mvp/apps/server
$ PORT=20100 npm run dev
> Server running on port 20100
> - HTTP/WebSocket: http://localhost:20100
> - Hocuspocus: ws://localhost:20102

# 启动前端（端口 20101）
$ cd /var/tmp/vibe-kanban/worktrees/vk-5636-mvp/apps/web
$ npm run start
> Next.js 14.0.4
> - Local: http://localhost:20101
> ✓ Ready in 325ms
```

### 3. 验证端口绑定
```bash
$ ss -tln | grep -E "20100|20101"
LISTEN 0  511  *:20100  *:*
LISTEN 0  511  *:20101  *:*
```
✅ 服务正确绑定到所有接口

### 4. 本地连接测试
```bash
# 测试前端
$ curl -v http://127.0.0.1:20101
< HTTP/1.1 200 OK
< X-Powered-By: Next.js
< Content-Type: text/html; charset=utf-8

# 测试后端
$ curl -v http://127.0.0.1:20100/health
< HTTP/1.1 200 OK
< Content-Type: application/json
{"status":"ok","timestamp":"2025-09-24T06:45:12.000Z"}
```
✅ 本地服务响应正常

### 5. Cloudflare 隧道配置验证
```yaml
# /etc/cloudflared/config.yml
- hostname: infiniteboard.zchtech.ai
  service: http://127.0.0.1:20101

- hostname: infiniteboardserver.zchtech.ai
  service: http://127.0.0.1:20100
```
✅ 配置正确

### 6. Cloudflare 隧道日志分析
```
Sep 24 14:39:33 ERR Unable to reach the origin service.
dial tcp 127.0.0.1:20101: connect: connection refused
```
- 问题时间点：服务曾经停止
- 重启后问题解决

### 7. 最终验证
```bash
# 通过 Cloudflare 访问前端
$ curl -I https://infiniteboard.zchtech.ai
HTTP/2 200
x-powered-by: Next.js
cf-ray: 984052495d8caf25-NRT

# 通过 Cloudflare 访问后端
$ curl https://infiniteboardserver.zchtech.ai/health
{"status":"ok","timestamp":"2025-09-24T06:45:58.396Z"}
```
✅ 两个服务都正常工作

## 问题根因分析

### 524 错误原因
1. Next.js 开发服务器编译时挂起
2. Google Fonts 无法下载导致超时
3. 存在未使用的组件有 TypeScript 错误

### 502 错误原因
1. 服务进程已停止
2. 端口未监听
3. Cloudflare 无法连接到本地服务

## 解决方案

### 代码修复
1. 移除 Google Fonts 依赖
2. 删除未使用的组件文件
3. 修复 TypeScript 错误

### 服务配置
1. 使用生产模式运行前端（`npm run start`）
2. 确保服务监听所有接口（*:20100, *:20101）
3. 保持服务持续运行

## 监控建议

### 服务健康检查脚本
```bash
#!/bin/bash
# 检查前端
curl -f http://localhost:20101 > /dev/null 2>&1 || {
  echo "Frontend down, restarting..."
  cd /var/tmp/vibe-kanban/worktrees/vk-5636-mvp/apps/web
  npm run start &
}

# 检查后端
curl -f http://localhost:20100/health > /dev/null 2>&1 || {
  echo "Backend down, restarting..."
  cd /var/tmp/vibe-kanban/worktrees/vk-5636-mvp/apps/server
  PORT=20100 npm run dev &
}
```

### 使用 PM2 持久化运行
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 保存配置
pm2 save

# 设置开机启动
pm2 startup
```

## 总结
- ✅ 前端服务：https://infiniteboard.zchtech.ai （正常）
- ✅ 后端服务：https://infiniteboardserver.zchtech.ai （正常）
- ✅ WebSocket 连接：通过 Cloudflare WSS 协议（正常）

问题已完全解决，服务运行正常。