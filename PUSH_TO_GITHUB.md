# 推送到 GitHub 指南

## 当前状态

- **分支**: `vk-5636-mvp`
- **远程仓库**: `https://github.com/TaoSeekAI/weaponagent.git`
- **提交数量**: 5 个提交
- **最新提交**: `feat: 添加 GitHub Actions CI/CD 流水线配置`

## 推送步骤

### 方法 1: 使用 HTTPS（推荐）

```bash
# 1. 配置 GitHub 用户信息（如果尚未配置）
git config --global user.name "您的 GitHub 用户名"
git config --global user.email "您的邮箱"

# 2. 推送代码
git push origin vk-5636-mvp

# 3. 输入您的 GitHub 用户名和个人访问令牌（PAT）
# Username: 您的 GitHub 用户名
# Password: 您的个人访问令牌（不是密码）
```

### 方法 2: 使用 SSH

```bash
# 1. 配置 SSH 远程地址
git remote set-url origin git@github.com:TaoSeekAI/weaponagent.git

# 2. 推送代码
git push origin vk-5636-mvp
```

### 方法 3: 使用 GitHub CLI

```bash
# 1. 安装 GitHub CLI
# macOS: brew install gh
# Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# 2. 认证
gh auth login

# 3. 推送代码
git push origin vk-5636-mvp
```

## 创建个人访问令牌 (PAT)

1. 访问 GitHub Settings: https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限:
   - ✅ repo (完整的仓库控制)
   - ✅ workflow (更新 GitHub Actions)
   - ✅ write:packages (发布包)
4. 生成令牌并保存

## 推送后的操作

### 1. 查看 CI/CD 运行状态

访问: https://github.com/TaoSeekAI/weaponagent/actions

### 2. 查看 Docker 镜像

镜像将发布到: https://github.com/TaoSeekAI/weaponagent/pkgs/container/weaponagent

### 3. 创建 Pull Request（可选）

```bash
# 使用 GitHub CLI
gh pr create --base main --head vk-5636-mvp --title "feat: 添加协作画布 MVP" --body "
## 功能概述
- 基于 tldraw 的无限画布
- 3D 模型查看器
- Web 终端
- 协作文档编辑器
- Docker 容器化部署
- GitHub Actions CI/CD

## 测试说明
- 本地测试通过
- Docker 构建成功
- CI/CD 配置完成
"

# 或访问网页创建
# https://github.com/TaoSeekAI/weaponagent/compare/main...vk-5636-mvp
```

## 提交历史

```
dc16795 feat: 添加 GitHub Actions CI/CD 流水线配置
6d28945 fix: 添加完整的 Docker 容器化部署方案
0cf4370 验证报告总结
6a1775c feat: 创建基于 tldraw 的协作画布 MVP
1b23913 xif
```

## 项目功能清单

✅ **已完成的功能**:
1. Monorepo 项目结构（pnpm workspace）
2. tldraw 无限画布集成
3. 三个核心嵌入组件（3D Viewer、Terminal、Doc Editor）
4. Node.js 后端服务（Express + Socket.IO）
5. Docker 容器化部署方案
6. GitHub Actions CI/CD 流水线
7. 多平台镜像构建支持
8. 自动依赖更新（Dependabot）

## 镜像使用说明

推送成功后，可以直接使用发布的镜像：

```bash
# 拉取最新镜像
docker pull ghcr.io/taoseekai/weaponagent:vk-5636-mvp

# 运行容器
docker run -d \
  --name vibe-kanban \
  -p 3000:3000 \
  -p 3001:3001 \
  -p 3002:3002 \
  ghcr.io/taoseekai/weaponagent:vk-5636-mvp
```

## 故障排查

### 认证失败

```bash
# 清除缓存的凭据
git config --global --unset credential.helper

# 重新配置凭据管理器
git config --global credential.helper store
```

### 推送被拒绝

```bash
# 强制推送（谨慎使用）
git push --force-with-lease origin vk-5636-mvp

# 或先拉取再推送
git pull origin vk-5636-mvp --rebase
git push origin vk-5636-mvp
```

## 联系信息

如需协助，请联系项目维护者或查看项目文档。