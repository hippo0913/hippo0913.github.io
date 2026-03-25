---
title: 精读官方文档：Claude Code 网页版
date: 2026-03-11 23:00:00
updated: 2026-03-25 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 20
description: Claude Code 网页版让你从浏览器直接驱动 AI 编码——在云 VM 中异步执行任务、并行处理多个 bug 修复、用 diff 视图审查更改。支持终端 ↔ 网页会话切换。
cover: https://picsum.photos/seed/claude-claude-code-on-the-web/1920/1080
source_url: https://code.claude.com/docs/zh-CN/claude-code-on-the-web
---

# 精读官方文档：Claude Code 网页版

> 💬 hippo：不想开终端？想让 Claude 在云端跑代码？想并行处理多个任务？Claude Code 网页版就是答案——研究预览阶段，但已经很好用了。

---

## 一、这个功能是什么

Claude Code 网页版让你从 Claude 应用（claude.ai/code）启动 Claude Code 任务，在 Anthropic 管理的云虚拟机中执行。

**适合的场景**：

| 场景 | 说明 |
|------|------|
| **回答问题** | 询问代码架构和功能实现方式 |
| **错误修复** | 明确定义、不需要频繁调整的任务 |
| **并行工作** | 同时处理多个错误修复 |
| **远程仓库** | 处理没有本地检出的代码 |
| **后端更改** | Claude 先写测试，再写代码通过测试 |

> 💬 hippo：也可以在 iOS 和 Android 的 Claude 移动应用中启动任务和监控进度。

<!-- more -->

---

## 二、谁可以使用

目前处于**研究预览**阶段，以下用户可用：

- **Pro 用户**
- **Max 用户**
- **Team 用户**
- **Enterprise 用户**（需要高级席位或 Chat + Claude Code 席位）

---

## 三、快速开始（5 步上手）

1. 访问 [claude.ai/code](https://claude.ai/code)
2. 连接你的 GitHub 账户
3. 在仓库中安装 Claude GitHub 应用
4. 选择默认环境
5. 提交编码任务
6. 在 diff 视图中审查更改，通过评论迭代，然后创建 PR

---

## 四、工作原理

当你启动一个网页任务时：

```
┌─────────────────┐
│  1. 仓库克隆     │  → 你的仓库克隆到 Anthropic 管理的 VM
└────────┬────────┘
         ↓
┌─────────────────┐
│  2. 环境设置     │  → 云环境准备，运行设置脚本（如有配置）
└────────┬────────┘
         ↓
┌─────────────────┐
│  3. 网络配置     │  → 根据设置配置互联网访问
└────────┬────────┘
         ↓
┌─────────────────┐
│  4. 任务执行     │  → Claude 分析代码、进行更改、运行测试
└────────┬────────┘
         ↓
┌─────────────────┐
│  5. 完成         │  → 收到通知，可以创建 PR
└────────┬────────┘
         ↓
┌─────────────────┐
│  6. 结果         │  → 更改推送到分支，准备创建 PR
└─────────────────┘
```

---

## 五、使用 Diff 视图审查更改

Diff 视图让你在创建 PR 之前看到 Claude 更改的确切内容。

**如何使用**：

1. 当 Claude 更改文件时，会出现 diff 统计指示器（如 `+12 -1`）
2. 点击指示器打开 diff 查看器
3. 左侧显示文件列表，右侧显示每个文件的更改

**在 diff 视图中可以**：

- 逐个文件审查更改
- 对特定更改进行评论请求修改
- 继续与 Claude 迭代直到满意

> 💬 hippo：这样你可以通过多轮反馈完善更改，而无需创建草稿 PR 或切换到 GitHub。

---

## 六、终端 ↔ 网页会话切换

网页会话即使关闭笔记本电脑后也会持续，可以从任何地方监控（包括移动应用）。

### 6.1 从终端到网页（`--remote`）

```bash
# 在云端启动新会话
claude --remote "Fix the authentication bug in src/auth/login.ts"
```

这会在 claude.ai 上创建一个新的网页会话，任务在云中运行，你继续在本地工作。

**监控进度**：

```bash
# 查看所有后台任务
/tasks
```

**高级技巧：先规划再执行**

```bash
# 第一步：本地进入计划模式
claude --permission-mode plan

# 第二步：满意后远程执行
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

**并行运行多个任务**：

```bash
claude --remote "Fix the flaky test in auth.spec.ts"
claude --remote "Update the API documentation"
claude --remote "Refactor the logger to use structured output"
```

每个命令创建独立的网页会话，同时运行。

### 6.2 从网页到终端（`/teleport`）

**方式一：使用 `/teleport` 命令**

```bash
/teleport
# 或简写
/tp
```

显示网页会话的交互式选择器。如果有未提交的更改，会提示先隐藏。

**方式二：从命令行**

```bash
# 交互式选择
claude --teleport

# 直接恢复特定会话
claude --teleport <session-id>
```

**方式三：从 `/tasks`**

```bash
/tasks
# 然后按 t 传送到某个会话
```

**方式四：从网页界面**

点击"在 CLI 中打开"，复制命令粘贴到终端。

### 6.3 传送要求

| 要求 | 详情 |
|------|------|
| **干净的 git 状态** | 工作目录必须没有未提交的更改 |
| **正确的仓库** | 必须从同一仓库（不是 fork）运行 |
| **分支可用** | 网页会话中的分支必须已推送到远程 |
| **相同账户** | 必须认证到相同的 Claude.ai 账户 |

---

## 七、云环境详解

### 7.1 默认镜像

通用镜像预装了常见工具链：

| 类别 | 内容 |
|------|------|
| **语言** | Python 3.x、Node.js LTS、Ruby 3.1-3.3、PHP 8.4、Go、Rust、Java、C++ |
| **包管理器** | pip/poetry、npm/yarn/pnpm/bun、gem/bundler、cargo、Maven/Gradle |
| **数据库** | PostgreSQL 16、Redis 7.0 |
| **工具** | GCC、Clang、常见 linters 和测试框架 |

**检查可用工具**：

```bash
check-tools
```

### 7.2 环境配置

**添加新环境**：选择当前环境 → "添加环境" → 指定名称、网络访问、环境变量、设置脚本

**从终端选择默认环境**：

```bash
/remote-env
```

**环境变量格式**（.env 格式）：

```bash
API_KEY=your_api_key
DEBUG=true
```

### 7.3 设置脚本

设置脚本是 Bash 脚本，在新云会话启动时运行（Claude Code 启动之前）。

**示例：安装 gh CLI**

```bash
#!/bin/bash
apt update && apt install -y gh
```

**注意**：
- 脚本在 Ubuntu 24.04 上以 root 身份运行
- 仅在创建新会话时运行（恢复会话跳过）
- 如果脚本以非零值退出，会话无法启动
- 非关键命令加 `|| true` 避免阻止会话

### 7.4 设置脚本 vs SessionStart Hooks

| | 设置脚本 | SessionStart Hooks |
|---|---------|-------------------|
| **附加到** | 云环境 | 你的仓库 |
| **配置在** | 云环境 UI | `.claude/settings.json` |
| **运行时机** | Claude Code 启动之前，仅新会话 | Claude Code 启动后，每个会话包括恢复的 |
| **作用范围** | 仅云环境 | 本地和云 |

**依赖管理示例（SessionStart Hook）**：

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/install_pkgs.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# scripts/install_pkgs.sh

# 仅在远程环境运行
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

npm install
pip install -r requirements.txt
exit 0
```

---

## 八、网络访问和安全

### 8.1 网络策略

**GitHub 代理**：
- 所有 GitHub 操作通过专用代理服务
- 使用作用域凭证进行身份验证
- 限制 git push 到当前工作分支

**安全代理**：
- 所有出站流量通过 HTTP/HTTPS 代理
- 提供恶意请求防护、速率限制、内容过滤

### 8.2 访问级别

| 级别 | 说明 |
|------|------|
| **受限（默认）** | 仅允许列表域可访问 |
| **无互联网** | 完全禁用网络访问（仍可与 Anthropic API 通信） |
| **完全** | 允许所有互联网访问 |

### 8.3 默认允许的域（部分）

| 类别 | 域名 |
|------|------|
| **Anthropic** | api.anthropic.com、claude.ai、code.claude.com |
| **版本控制** | github.com、gitlab.com、bitbucket.org |
| **包管理器** | npmjs.org、pypi.org、rubygems.org、crates.io |
| **云平台** | amazonaws.com、googleapis.com、azure.com |
| **容器注册表** | docker.io、gcr.io、ghcr.io |

---

## 九、共享会话

### 9.1 Enterprise / Teams 账户

| 可见性 | 说明 |
|--------|------|
| **私有** | 仅自己可见 |
| **团队** | 对 Claude.ai 组织其他成员可见 |

> 默认启用存储库访问验证，基于 GitHub 账户权限。

### 9.2 Max / Pro 账户

| 可见性 | 说明 |
|--------|------|
| **私有** | 仅自己可见 |
| **公开** | 对任何登录 claude.ai 的用户可见 |

> ⚠️ 公开会话可能包含私有仓库的代码和凭证。在设置中启用存储库访问验证。

---

## 十、限制

| 限制 | 说明 |
|------|------|
| **仓库认证** | 只能在认证到相同账户时从网页移动到本地 |
| **平台限制** | 仅支持 GitHub 仓库（不支持 GitLab 等） |
| **定价** | 网页版与其他 Claude 使用共享速率限制 |
| **并行成本** | 并行运行多个任务会按比例消耗更多速率限制 |

---

## 一句话总结

**Claude Code 网页版 = 在云端 VM 异步运行 AI 编码任务 + 终端 ↔ 网页无缝切换 + 并行处理多任务——适合需要"放手让 Claude 干"的场景。**

**下一篇**：[精读官方文档：远程控制](./remote-control)

---

*本文精读自 [Claude Code on the web](https://code.claude.com/docs/zh-CN/claude-code-on-the-web)*

*最后更新：2026-03-25*
