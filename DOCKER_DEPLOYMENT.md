# Docker 部署指南

## 概述
本项目提供完整的 Docker 容器化部署方案，确保环境隔离和一致性。

## 快速开始

### 方式一：使用部署脚本（推荐）

```bash
# 赋予执行权限
chmod +x deploy.sh

# 构建并运行生产环境
./deploy.sh build

# 或运行开发环境
./deploy.sh dev

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs

# 停止服务
./deploy.sh stop
```

### 方式二：使用 Docker Compose

#### 前提条件
- Docker 20.10+
- Docker Compose 2.0+

#### 启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 清理所有数据
docker compose down -v
```

### 方式三：手动 Docker 命令

```bash
# 构建镜像
docker build -t vibe-kanban:latest .

# 运行容器
docker run -d \
  --name vibe-kanban \
  -p 3000:3000 \
  -p 3001:3001 \
  -p 3002:3002 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  vibe-kanban:latest

# 查看日志
docker logs -f vibe-kanban

# 停止容器
docker stop vibe-kanban
docker rm vibe-kanban
```

## 配置文件说明

### 1. Dockerfile
主要的多阶段构建文件，包含前端和后端的构建和运行环境。

```dockerfile
# 特性：
- 使用 Alpine Linux 减小镜像体积
- 多阶段构建优化层缓存
- 包含所有必要的构建工具
- 自动启动前后端服务
```

### 2. docker-compose.yml
生产环境的编排配置：

```yaml
services:
  app:
    # 单容器运行前后端
    ports:
      - "3000:3000"  # 前端
      - "3001:3001"  # 后端 API
      - "3002:3002"  # WebSocket
    environment:
      # 所有必要的环境变量
    volumes:
      - ./data:/app/data  # 数据持久化
    healthcheck:
      # 健康检查配置
```

### 3. docker-compose.dev.yml
开发环境配置，支持热重载：

```yaml
services:
  dev:
    # 挂载源代码
    volumes:
      - .:/app
    # 开发模式命令
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | production | 运行环境 |
| PORT | 3001 | 后端端口 |
| FRONTEND_URL | http://localhost:3000 | 前端地址 |
| NEXT_PUBLIC_WS_URL | http://localhost:3001 | WebSocket 地址 |
| NEXT_PUBLIC_SYNC_URL | http://localhost:3001 | 同步服务地址 |
| NEXT_PUBLIC_COLLAB_WS_URL | ws://localhost:3002 | 协作 WebSocket |

## 端口映射

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | 前端 | Next.js 应用 |
| 3001 | 后端 API | Express 服务器 |
| 3002 | WebSocket | 协作服务 |

## 数据持久化

数据存储在 `./data` 目录，包括：
- 画布数据
- 用户会话
- 上传的文件

## 健康检查

容器包含健康检查，自动监控服务状态：

```bash
# 检查健康状态
docker inspect vibe-kanban --format='{{.State.Health.Status}}'

# 查看健康检查日志
docker inspect vibe-kanban --format='{{json .State.Health.Log}}' | jq
```

## 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker logs vibe-kanban --tail 100

# 检查端口占用
netstat -tulpn | grep -E "3000|3001|3002"

# 清理并重建
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### 2. 权限问题

```bash
# 如果遇到 Docker 权限问题
sudo usermod -aG docker $USER
# 然后重新登录

# 或使用 sudo
sudo docker compose up -d
```

### 3. 构建失败

```bash
# 清理 Docker 缓存
docker system prune -a

# 查看构建详情
docker compose build --progress=plain

# 使用开发模式
./deploy.sh dev
```

### 4. 网络问题

```bash
# 检查 Docker 网络
docker network ls
docker network inspect vibe-kanban-network

# 重建网络
docker compose down
docker network prune
docker compose up -d
```

## 性能优化

### 1. 镜像优化
- 使用 Alpine Linux 基础镜像
- 多阶段构建减少最终镜像大小
- 合理利用层缓存

### 2. 资源限制

```yaml
# 在 docker-compose.yml 中添加资源限制
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. 日志管理

```yaml
# 限制日志大小
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 生产部署建议

### 1. 使用 Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml vibe-kanban

# 扩展服务
docker service scale vibe-kanban_app=3
```

### 2. 使用 Kubernetes

```yaml
# 创建 Kubernetes 部署文件
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-kanban
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vibe-kanban
  template:
    metadata:
      labels:
        app: vibe-kanban
    spec:
      containers:
      - name: app
        image: vibe-kanban:latest
        ports:
        - containerPort: 3000
        - containerPort: 3001
        - containerPort: 3002
```

### 3. 使用反向代理

```nginx
# Nginx 配置示例
upstream frontend {
    server localhost:3000;
}

upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 备份和恢复

### 备份数据

```bash
# 备份数据卷
docker run --rm \
  -v vibe-kanban_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data
```

### 恢复数据

```bash
# 恢复数据卷
docker run --rm \
  -v vibe-kanban_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup-20250914.tar.gz -C /
```

## 监控

### 使用 Docker Stats

```bash
# 实时监控资源使用
docker stats vibe-kanban

# 使用 Prometheus + Grafana
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

## 安全建议

1. **不要在生产环境使用默认密钥**
2. **启用 HTTPS/TLS**
3. **限制容器权限**
4. **定期更新基础镜像**
5. **扫描镜像漏洞**

```bash
# 扫描镜像安全漏洞
docker scan vibe-kanban:latest
```

## 总结

本 Docker 部署方案提供了：
- ✅ 完整的容器化支持
- ✅ 环境隔离
- ✅ 简单的部署流程
- ✅ 健康检查和监控
- ✅ 数据持久化
- ✅ 可扩展架构

通过 Docker 部署，您可以确保应用在任何环境中都能一致运行。