# CI/CD 配置文档

## 概述

本项目配置了完整的 GitHub Actions CI/CD 流水线，自动构建并发布 Docker 镜像到 GitHub Container Registry (ghcr.io)。

## 工作流程

### 1. 持续集成 (CI)

**文件**: `.github/workflows/ci.yml`

- **触发条件**: 所有分支的 push 和 PR
- **测试矩阵**: Node.js 18.x 和 20.x
- **执行步骤**:
  - 代码检出
  - 依赖安装（使用 pnpm 缓存）
  - 类型检查
  - 代码规范检查
  - 构建测试
  - Docker 镜像构建测试

### 2. Docker 镜像构建

**文件**: `.github/workflows/docker-build.yml`

- **触发条件**:
  - 推送到主要分支（main, master, develop, vk-*）
  - 创建标签（v*）
  - 手动触发

- **构建策略**:
  - 主镜像：包含前后端的单一镜像
  - 分离镜像：独立的前端和后端镜像
  - 多平台支持：linux/amd64, linux/arm64

- **镜像标签策略**:
  ```
  ghcr.io/[用户名]/[仓库名]:latest          # 主分支最新版
  ghcr.io/[用户名]/[仓库名]:v1.0.0         # 版本标签
  ghcr.io/[用户名]/[仓库名]:main-abc123    # 分支-commit
  ghcr.io/[用户名]/[仓库名]:pr-123         # PR 编号
  ```

### 3. 发布流程

**文件**: `.github/workflows/release.yml`

- **触发条件**: 创建版本标签（v*）或手动触发
- **发布内容**:
  - GitHub Release 创建
  - Docker 镜像发布（多平台）
  - 源码包上传
  - 自动生成变更日志

## GitHub Container Registry 配置

### 1. 启用 GitHub Packages

1. 进入仓库设置
2. 找到 "Packages" 部分
3. 确保 "Improved container support" 已启用

### 2. 设置权限

Repository Settings → Actions → General:
- **Actions permissions**: Allow all actions
- **Workflow permissions**: Read and write permissions

### 3. Package 可见性

默认情况下，包与仓库的可见性一致：
- Public 仓库 → Public 包
- Private 仓库 → Private 包

修改包可见性：
1. 进入 https://github.com/[用户名]?tab=packages
2. 选择包
3. Package settings → Visibility

## 使用发布的镜像

### 1. 拉取镜像

```bash
# 公开仓库（无需认证）
docker pull ghcr.io/[用户名]/vibe-kanban:latest

# 私有仓库（需要认证）
echo $GITHUB_TOKEN | docker login ghcr.io -u [用户名] --password-stdin
docker pull ghcr.io/[用户名]/vibe-kanban:latest
```

### 2. 使用 Docker Compose

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/[用户名]/vibe-kanban:latest
    ports:
      - "3000:3000"
      - "3001:3001"
      - "3002:3002"
    environment:
      - NODE_ENV=production
```

### 3. 使用个人访问令牌 (PAT)

创建 PAT 用于 CI/CD:

1. GitHub Settings → Developer settings → Personal access tokens
2. 创建新令牌，勾选权限:
   - `read:packages`
   - `write:packages`
   - `delete:packages`（可选）

3. 在 Docker 中使用:
```bash
echo $PAT | docker login ghcr.io -u USERNAME --password-stdin
```

## 手动触发构建

### 通过 GitHub UI

1. 进入 Actions 标签页
2. 选择 "Build and Push Docker Image"
3. 点击 "Run workflow"
4. 选择分支和输入标签（可选）
5. 点击 "Run workflow"

### 通过 GitHub CLI

```bash
# 安装 GitHub CLI
brew install gh  # macOS
# 或
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg

# 认证
gh auth login

# 触发工作流
gh workflow run docker-build.yml --ref main --field tag=custom-tag
```

## 版本发布流程

### 1. 创建版本标签

```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
```

### 2. 自动触发的操作

1. 创建 GitHub Release
2. 构建并推送 Docker 镜像:
   - `ghcr.io/[用户名]/vibe-kanban:v1.0.0`
   - `ghcr.io/[用户名]/vibe-kanban:latest`
   - `ghcr.io/[用户名]/vibe-kanban-frontend:v1.0.0`
   - `ghcr.io/[用户名]/vibe-kanban-backend:v1.0.0`
3. 生成并上传源码包
4. 创建发布摘要

## 安全扫描

### Trivy 漏洞扫描

工作流自动执行安全扫描：
- 扫描 Docker 镜像漏洞
- 结果上传到 GitHub Security 标签页
- 查看路径: Security → Code scanning alerts

### Dependabot 配置

自动更新依赖：
- npm 包每周检查
- Docker 基础镜像更新
- GitHub Actions 版本更新

## 监控和通知

### 查看构建状态

1. **仓库主页**: 查看最新构建状态徽章
2. **Actions 标签页**: 详细的构建历史和日志
3. **Pull Request**: 自动显示 CI 检查结果

### 添加状态徽章

在 README.md 中添加：

```markdown
![CI](https://github.com/[用户名]/vibe-kanban/workflows/CI%20Pipeline/badge.svg)
![Docker](https://github.com/[用户名]/vibe-kanban/workflows/Build%20and%20Push%20Docker%20Image/badge.svg)
![Release](https://github.com/[用户名]/vibe-kanban/workflows/Release/badge.svg)
```

### 配置通知

1. **邮件通知**: GitHub Settings → Notifications
2. **Slack 集成**:
   ```yaml
   - name: Slack Notification
     uses: 8398a7/action-slack@v3
     with:
       status: ${{ job.status }}
       webhook_url: ${{ secrets.SLACK_WEBHOOK }}
   ```

## 故障排查

### 常见问题

#### 1. 权限错误

```
Error: buildx failed with: ERROR: denied: permission_denied
```

**解决方案**:
- 检查 Actions 权限设置
- 确保 GITHUB_TOKEN 有 packages:write 权限

#### 2. 构建缓存问题

```bash
# 清理 GitHub Actions 缓存
gh extension install actions/gh-actions-cache
gh actions-cache list
gh actions-cache delete [cache-key]
```

#### 3. 多平台构建失败

**解决方案**:
- 确保使用 docker/setup-qemu-action
- 检查 Dockerfile 是否支持目标架构

### 查看详细日志

```bash
# 使用 GitHub CLI 查看日志
gh run list --workflow=docker-build.yml
gh run view [run-id]
gh run view [run-id] --log
```

## 最佳实践

### 1. 版本管理

- 使用语义化版本号（Semantic Versioning）
- 主版本: 不兼容的 API 修改
- 次版本: 向下兼容的功能性新增
- 修订版本: 向下兼容的问题修正

### 2. 分支策略

```
main/master     → latest 标签
develop         → develop 标签
release/v1.0    → v1.0-rc 标签
feature/*       → 不发布镜像
```

### 3. 镜像优化

- 使用多阶段构建减小镜像体积
- 定期更新基础镜像
- 扫描并修复安全漏洞
- 使用 .dockerignore 排除不必要文件

### 4. 密钥管理

- 使用 GitHub Secrets 存储敏感信息
- 定期轮换访问令牌
- 最小权限原则

## 集成其他服务

### 集成 Docker Hub

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

### 集成阿里云容器镜像服务

```yaml
- name: Login to Aliyun CR
  uses: docker/login-action@v3
  with:
    registry: registry.cn-hangzhou.aliyuncs.com
    username: ${{ secrets.ALIYUN_USERNAME }}
    password: ${{ secrets.ALIYUN_PASSWORD }}
```

## 总结

通过配置的 CI/CD 流水线，您可以：

1. ✅ 自动化测试和构建流程
2. ✅ 自动发布 Docker 镜像到 GitHub Packages
3. ✅ 支持多平台架构
4. ✅ 自动化版本发布
5. ✅ 安全漏洞扫描
6. ✅ 依赖自动更新

所有镜像都会发布到 `ghcr.io/[您的用户名]/vibe-kanban`，可以直接使用！