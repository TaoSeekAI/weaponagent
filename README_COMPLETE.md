# Vibe Kanban MVP - 完整部署文档

## 项目概述

基于tldraw的实时协作画布MVP系统，支持3D模型查看、Web终端、协作文档编辑等功能。

## 技术栈

### 前端
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- tldraw v2 (画布引擎)
- @tldraw/sync (实时同步)

### 后端
- Node.js + Express
- Socket.IO (WebSocket)
- Hocuspocus (Yjs服务器)
- node-pty (终端模拟)

## 部署方式

### 1. 本地开发部署

#### 端口配置
- 前端: 20101
- 后端: 20100
- Hocuspocus: 20102

#### 启动步骤
```bash
# 安装依赖
pnpm install

# 启动后端
cd apps/server
PORT=20100 pnpm dev

# 启动前端（新终端）
cd apps/web
PORT=20101 pnpm dev
```

#### 访问地址
- 前端: http://localhost:20101
- 后端健康检查: http://localhost:20100/health
- 协作房间: http://localhost:20101?room=test

### 2. Docker Compose 部署

#### 本地测试环境
```bash
# 使用简化配置
docker compose -f docker-compose.local.yml up --build

# 端口映射
- 20301 → 前端
- 20300 → 后端
- 20302 → 协作服务
```

#### 生产环境
```bash
# 分离服务模式
docker compose -f docker-compose.prod.yml up -d

# All-in-one模式
docker compose -f docker-compose.prod.yml --profile all-in-one up -d

# 端口映射
- 20101 → 前端
- 20100 → 后端
- 20102 → 协作服务
```

### 3. GitHub Actions CI/CD

#### 工作流配置
- **CI Pipeline**: 代码质量检查和测试
- **Docker Build**: 构建并推送到GitHub Container Registry

#### 触发条件
- Push到分支: main, master, develop, vk-*
- Pull Request
- 手动触发

#### 镜像地址
```bash
# 拉取最新镜像
docker pull ghcr.io/taoseekai/weaponagent:vk-5636-mvp
```

## 功能特性

### 核心功能
1. **无限画布** - 基于tldraw v2
2. **实时协作** - WebSocket + @tldraw/sync
3. **3D模型查看器** - @google/model-viewer
4. **Web终端** - xterm.js + node-pty
5. **协作文档** - Tiptap + Yjs

### 协作功能
- 基于房间的多用户协作
- 实时光标同步
- 协作状态同步
- URL参数控制房间: `?room=房间名`

## 文件结构

```
vibe-kanban/
├── apps/
│   ├── web/              # Next.js前端
│   └── server/           # Node.js后端
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.local.yml
│   └── docker-compose.prod.yml
├── .github/workflows/
│   ├── ci.yml           # CI测试流程
│   └── docker-build.yml # Docker构建流程
├── docs/
│   ├── DOCKER_COMPOSE_ADDITIONS.md
│   └── PROMPT_TEMPLATE_MVP_DEVELOPMENT.md
└── Dockerfile*          # 各种Docker配置
```

## 环境变量

### 前端环境变量 (.env.local)
```env
NEXT_PUBLIC_WS_URL=http://localhost:20100
NEXT_PUBLIC_SYNC_URL=http://localhost:20100
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:20102
```

### 后端环境变量 (.env)
```env
PORT=20100
FRONTEND_URL=http://localhost:20101
```

## 部署状态

### CI/CD 状态
- ✅ CI Pipeline: 通过
- ✅ Docker主镜像: 构建成功
- ✅ 镜像推送: ghcr.io成功

### 本地部署验证
- ✅ 前端服务: 运行正常 (20101端口)
- ✅ 后端服务: 运行正常 (20100端口)
- ✅ WebSocket: 连接正常
- ✅ 健康检查: 响应正常

## 故障排查

### 端口占用问题
```bash
# 检查端口占用
lsof -i :端口号

# 使用替代端口
PORT=新端口 pnpm dev
```

### Docker构建失败
```bash
# 清理缓存
docker system prune -a

# 重新构建
docker compose build --no-cache
```

### CI/CD失败
1. 检查GitHub Actions日志
2. 验证Docker配置
3. 确认包依赖版本

## 开发指南

### 添加新功能
1. 在`apps/web/src/components`添加组件
2. 在`apps/server/src`添加API端点
3. 更新Docker配置（如需要）
4. 提交并推送触发CI/CD

### 测试
```bash
# 运行测试
pnpm test

# 类型检查
pnpm tsc --noEmit
```

## 更新日志

### 2025-09-21
- 完成MVP核心功能开发
- 实现Docker容器化部署
- 配置GitHub Actions CI/CD
- 修复Alpine Linux依赖问题
- 优化端口配置避免冲突

### 已知问题
- 端口5010可能被其他服务占用，使用201xx系列端口
- Docker多平台构建耗时较长，简化为amd64单平台

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

- GitHub: https://github.com/TaoSeekAI/weaponagent
- Branch: vk-5636-mvp

## 快速开始

```bash
# 克隆项目
git clone -b vk-5636-mvp https://github.com/TaoSeekAI/weaponagent.git

# 安装依赖
cd weaponagent
pnpm install

# 启动服务
pnpm dev  # 在各个app目录下运行

# 或使用Docker
docker compose -f docker-compose.local.yml up
```

访问 http://localhost:20101 开始使用！