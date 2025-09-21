# Docker Compose 补充文件说明

## 补充文件列表

本次部署新增了以下Docker相关文件，以支持更灵活的容器化部署：

### 1. docker-compose.local.yml
**用途**: 本地开发测试用的简化版Docker Compose配置
**特点**:
- 单容器运行所有服务
- 端口映射: 20301(前端), 20300(后端), 20302(协作服务)
- 包含开发环境配置
- 数据卷挂载支持

### 2. docker-compose.prod.yml
**用途**: 生产环境Docker Compose配置
**特点**:
- 分离的前端和后端服务
- 支持服务间通信
- 健康检查配置
- 自动重启策略
- 可选的all-in-one配置模式

### 3. Dockerfile.frontend.prod
**用途**: 前端生产环境专用Dockerfile
**特点**:
- 多阶段构建优化镜像大小
- Next.js生产构建优化
- 非root用户运行
- 静态资源优化

### 4. Dockerfile.backend.prod
**用途**: 后端生产环境专用Dockerfile
**特点**:
- TypeScript编译构建
- node-pty依赖支持
- 生产环境优化
- 非root用户运行

## 文件创建过程

### 步骤1: 分析现有配置
- 检查原有docker-compose.yml
- 确认端口映射需求
- 评估服务依赖关系

### 步骤2: 创建生产环境配置
```bash
# 创建生产环境compose配置
docker-compose.prod.yml
- 分离前后端服务
- 配置网络通信
- 设置健康检查
```

### 步骤3: 创建本地测试配置
```bash
# 创建本地测试compose配置
docker-compose.local.yml
- 简化单容器配置
- 避免端口冲突(使用203xx系列)
- 开发环境变量设置
```

### 步骤4: 优化Dockerfile
```bash
# 创建专用Dockerfile
Dockerfile.frontend.prod - 前端优化构建
Dockerfile.backend.prod - 后端优化构建
```

## 使用方法

### 本地测试部署
```bash
# 使用本地配置启动
docker-compose -f docker-compose.local.yml up --build

# 访问服务
前端: http://localhost:20301
后端: http://localhost:20300
协作: ws://localhost:20302
```

### 生产环境部署
```bash
# 分离服务模式
docker-compose -f docker-compose.prod.yml up -d

# 或使用all-in-one模式
docker-compose -f docker-compose.prod.yml --profile all-in-one up -d
```

### 构建单个服务
```bash
# 构建前端
docker build -f Dockerfile.frontend.prod -t vibe-kanban-frontend .

# 构建后端
docker build -f Dockerfile.backend.prod -t vibe-kanban-backend .
```

## 环境变量配置

### 前端环境变量
```env
NEXT_PUBLIC_WS_URL=http://localhost:20100
NEXT_PUBLIC_SYNC_URL=http://localhost:20100
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:20102
```

### 后端环境变量
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
```

## 端口映射说明

### docker-compose.local.yml
- 20301 → 3000 (前端)
- 20300 → 3001 (后端)
- 20302 → 3002 (协作服务)

### docker-compose.prod.yml
- 20101 → 3000 (前端服务)
- 20100 → 3001 (后端服务)
- 20102 → 3002 (协作服务)
- 20201 → 3000 (all-in-one前端)
- 20200 → 3001 (all-in-one后端)
- 20202 → 3002 (all-in-one协作)

## 健康检查配置

所有服务都配置了健康检查：
- 检查间隔: 30秒
- 超时时间: 10秒
- 重试次数: 3次
- 检查端点: /health

## 数据持久化

使用本地卷进行数据持久化：
```yaml
volumes:
  data:
    driver: local
```

数据目录映射: `./data:/app/data`

## 网络配置

自定义桥接网络：
```yaml
networks:
  vibe-network:
    driver: bridge
    name: vibe-kanban-network
```

## 故障排查

### 端口占用
如果端口被占用，修改docker-compose文件中的端口映射

### 构建失败
1. 确保Docker和Docker Compose已安装
2. 检查网络连接（npm包下载）
3. 清理Docker缓存: `docker system prune -a`

### 服务无法连接
1. 检查网络配置
2. 确认环境变量设置正确
3. 查看容器日志: `docker-compose logs -f [service-name]`