# Vibe Kanban - Collaborative Canvas MVP

基于 tldraw 的实时协作无限画布应用，支持 3D 模型查看、Web 终端、协作文档编辑等功能。

## 功能特性

- **无限画布**: 基于 tldraw v2，支持平移、缩放、选择、分层、对齐、撤销重做
- **多人实时协作**: 实时同步画布操作，显示在线用户和光标
- **自定义嵌入组件**:
  - 3D 模型查看器 (支持 .glb/.gltf 文件，可选 AR)
  - Web 终端 (基于 xterm.js)
  - 协作文档编辑器 (基于 Tiptap + Yjs)
- **房间系统**: 通过 URL 参数 `?room=xxx` 加入不同协作房间
- **自托管支持**: 包含 Cloudflare Workers 同步服务模板

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **画布**: tldraw v2 + @tldraw/sync
- **3D**: @google/model-viewer
- **终端**: xterm.js + node-pty
- **文档**: Tiptap + Yjs + Hocuspocus
- **后端**: Node.js + Express + Socket.IO
- **部署**: Docker + Cloudflare Workers (可选)

## 快速开始

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 本地开发

```bash
# 启动所有服务
pnpm dev

# 或分别启动
cd apps/web && pnpm dev    # 前端 http://localhost:3000
cd apps/server && pnpm dev  # 后端 http://localhost:3001
```

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 项目结构

```
apps/
  web/                    # Next.js 前端应用
    src/
      app/                # Next.js App Router
      components/
        canvas/           # tldraw 画布组件
        embeds/           # 自定义嵌入组件
        ui/               # UI 组件
      lib/                # 工具库
      styles/             # 样式文件
    public/models/        # 3D 模型示例文件

  server/                 # Node.js 后端服务
    src/
      index.ts            # 主服务器
      ws-terminal.ts      # 终端 WebSocket 处理
      sync-server.ts      # tldraw 同步服务

  sync-cloudflare/        # Cloudflare Workers 同步服务
    src/index.ts          # Durable Objects 实现
    wrangler.toml         # Cloudflare 配置
```

## 环境变量配置

### 前端 (apps/web/.env.local)

```env
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_SYNC_URL=http://localhost:3001
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:3002
```

### 后端 (apps/server/.env)

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 使用指南

### 1. 加入协作房间

访问 `http://localhost:3000?room=my-room` 即可加入名为 `my-room` 的协作房间。多个用户使用相同的房间 ID 即可实时协作。

### 2. 添加 3D 模型

1. 点击画布工具栏的 "3D Model" 按钮
2. 在画布上创建 3D 查看器
3. 点击 "Upload Model" 上传 .glb 或 .gltf 文件
4. 可以旋转、缩放查看模型

### 3. 使用 Web 终端

1. 点击画布工具栏的 "Terminal" 按钮
2. 在画布上创建终端窗口
3. 可以执行常用的命令（开发模式下无限制）

### 4. 协作文档编辑

1. 点击画布工具栏的 "Document" 按钮
2. 在画布上创建文档编辑器
3. 多人可以同时编辑，实时看到对方的光标和选区

## 部署指南

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### Cloudflare Workers 部署

1. 安装 Wrangler CLI:
```bash
npm install -g wrangler
```

2. 登录 Cloudflare:
```bash
wrangler login
```

3. 创建 R2 存储桶:
```bash
wrangler r2 bucket create vibe-kanban-storage
```

4. 部署 Workers:
```bash
cd apps/sync-cloudflare
wrangler deploy
```

5. 更新前端环境变量指向 Workers URL

## 性能优化

- 画布使用视区渲染，仅渲染可见区域
- WebSocket 连接使用防抖和节流
- 3D 模型延迟加载
- 文档编辑器使用增量同步

## 安全考虑

- 终端默认使用命令白名单（生产环境）
- WebSocket 连接支持认证（占位）
- 房间隔离，数据不会跨房间泄露

## 已知问题

- Safari 浏览器下 3D 模型 AR 功能可能不稳定
- 大文件上传可能导致内存占用增加
- 终端会话在服务器重启后会丢失

## 开发路线图

- [ ] 用户认证和权限管理
- [ ] 持久化存储 (PostgreSQL/MongoDB)
- [ ] 文件管理系统
- [ ] 更多自定义图形和模板
- [ ] 移动端适配
- [ ] 性能监控和分析

## 参考资源

- [tldraw 文档](https://tldraw.dev)
- [model-viewer 文档](https://modelviewer.dev)
- [xterm.js 文档](https://xtermjs.org)
- [Tiptap 文档](https://tiptap.dev)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers)

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！