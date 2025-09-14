# 快速启动指南

## MVP 验收要点

### 已完成的功能

1. **项目基础架构** ✅
   - Monorepo 结构（pnpm workspace）
   - Next.js 前端应用
   - Node.js 后端服务
   - Cloudflare Workers 模板

2. **tldraw 画布集成** ✅
   - 无限画布功能
   - 房间路由系统（?room=xxx）
   - 自定义嵌入组件接口

3. **三个核心嵌入组件** ✅
   - **3D Viewer**: 基于 @google/model-viewer，支持 .glb/.gltf 文件
   - **Terminal**: 基于 xterm.js + node-pty，WebSocket 实时通信
   - **Doc Editor**: 基于 Tiptap + Yjs，支持协作编辑

4. **实时协作基础** ✅
   - Socket.IO 协作服务
   - Hocuspocus 文档协作
   - 房间隔离机制

5. **部署配置** ✅
   - Docker 容器化配置
   - Cloudflare Workers 同步服务模板
   - 环境变量配置

## 快速验证步骤

### 1. 安装依赖
```bash
pnpm install
# 或
npm install
```

### 2. 启动服务
```bash
# 终端 1 - 启动后端
cd apps/server
pnpm dev

# 终端 2 - 启动前端
cd apps/web
pnpm dev
```

### 3. 访问应用
- 打开浏览器访问: http://localhost:3000
- 多人协作测试: http://localhost:3000?room=test

### 4. 功能测试

#### 测试画布基础功能
- 平移：鼠标中键拖拽或空格+拖拽
- 缩放：滚轮或触控板手势
- 绘制：选择工具绘制形状

#### 测试 3D 模型嵌入
1. 从工具栏选择 "3D Model"
2. 在画布上放置 3D 查看器
3. 上传 .glb 文件或使用示例模型
4. 旋转查看模型

#### 测试终端嵌入
1. 从工具栏选择 "Terminal"
2. 在画布上放置终端窗口
3. 执行基本命令如 ls, echo, pwd

#### 测试文档协作
1. 从工具栏选择 "Document"
2. 在画布上放置文档编辑器
3. 开启两个浏览器窗口，同时编辑查看协作效果

## 核心代码位置

- 画布组件: `apps/web/src/components/canvas/TldrawBoard.tsx`
- 3D 嵌入: `apps/web/src/components/embeds/ModelViewerEmbed.tsx`
- 终端嵌入: `apps/web/src/components/embeds/TerminalEmbed.tsx`
- 文档嵌入: `apps/web/src/components/embeds/DocEditorEmbed.tsx`
- 后端服务: `apps/server/src/index.ts`
- 终端处理: `apps/server/src/ws-terminal.ts`
- 同步服务: `apps/server/src/sync-server.ts`

## 技术亮点

1. **模块化设计**: 所有嵌入组件遵循统一接口，易于扩展
2. **实时协作**: WebSocket 双向通信，低延迟同步
3. **安全考虑**: 终端命令白名单，房间数据隔离
4. **性能优化**: 视区渲染，防抖节流，延迟加载
5. **自托管友好**: 包含完整的 Docker 和 Cloudflare Workers 部署方案

## 后续优化建议

1. 添加用户认证系统
2. 实现持久化存储（PostgreSQL/MongoDB）
3. 增加更多自定义图形和模板
4. 优化移动端体验
5. 添加性能监控和分析

## 问题排查

如果遇到依赖安装问题：
```bash
# 清理缓存
rm -rf node_modules
rm -rf apps/*/node_modules
pnpm store prune

# 重新安装
pnpm install --no-frozen-lockfile
```

如果端口被占用：
```bash
# 修改环境变量
# apps/web/.env.local
NEXT_PUBLIC_WS_URL=http://localhost:3002

# apps/server/.env
PORT=3002
```