---
title: 精读官方文档：Claude Code 网页版
date: 2026-03-11 23:00:00
updated: 2026-03-31 23:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 20
description: Claude Code 网页版让你从浏览器直接驱动 AI 编码——在云 VM 中异步执行任务、并行处理多个 bug 修复、用 diff 视图审查更改。支持终端与网页会话切换。
cover: https://picsum.photos/seed/claude-claude-code-on-the-web/1920/1080
source_url: https://code.claude.com/docs/zh-CN/claude-code-on-the-web
---

# 精读官方文档：Claude Code 网页版

> hippo：不想开终端？想让 Claude 在云端跑代码？想并行处理多个任务？Claude Code 网页版就是答案——研究预览阶段，但已经很好用了。

---

## 一、这个功能是什么

Claude Code 网页版（claude.ai/code）让你从浏览器或手机启动编码任务，任务在 Anthropic 管理的云虚拟机中异步执行。你不需要开终端，不需要本地安装任何东西，甚至关了电脑任务还在跑。

目前处于**研究预览**阶段，Pro、Max、Team、Enterprise 用户可用。iOS 和 Android 的 Claude 移动应用也可以启动任务和监控进度。

**五大适合场景：**

| 场景 | 说明 |
|------|------|
| **回答问题** | 询问代码架构和功能实现方式 |
| **错误修复** | 明确定义、不需要频繁调整的任务 |
| **并行工作** | 同时处理多个 bug 修复，每个任务独立运行 |
| **远程仓库** | 处理没有本地检出的代码 |
| **后端更改** | Claude 先写测试，再写代码通过测试 |

<!-- more -->

---

## 二、官方教程精读

### 2.1 快速上手与工作原理

**5 步上手**：访问 claude.ai/code → 连接 GitHub 账户 → 在仓库中安装 Claude GitHub App → 选择默认环境 → 提交编码任务。完成后在 diff 视图中审查更改，通过评论迭代，满意了再创建 PR。

任务启动后经过 6 步流水线：**仓库克隆**（到 Anthropic 管理的 VM）→ **环境设置**（运行设置脚本）→ **网络配置**（按你的设置限制访问）→ **任务执行**（Claude 分析代码、改代码、跑测试）→ **完成通知** → **结果推送**（更改推送到分支）。

**Diff 视图**是网页版的亮点——Claude 更改文件时出现 `+12 -1` 指示器，点击即可逐文件审查、评论反馈、多轮迭代，不用创建草稿 PR 也不用切换到 GitHub。

### 2.2 终端与网页会话切换

这是网页版最核心的功能。会话切换是**单向的**：你可以用 `--remote` 从终端创建新的网页会话，用 `/teleport` 将网页会话拉回终端，但不能把现有的终端会话推送到网页。

**从终端到网页（--remote）：**

```bash
# 在云端启动新会话
claude --remote "Fix the authentication bug in src/auth/login.ts"
```

任务在云中异步运行，你继续干别的。用 `/tasks` 监控进度。

**并行运行多个任务**——每个命令创建独立的网页会话同时运行：

```bash
claude --remote "Fix the flaky test in auth.spec.ts"
claude --remote "Update the API documentation"
claude --remote "Refactor the logger to use structured output"
```

**高级技巧：先本地规划，再远程执行。**

```bash
# 第一步：本地进入计划模式
claude --permission-mode plan
# 第二步：满意后交给云端执行
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

**从网页到终端（/teleport）：** 网页会话即使关了电脑也在跑，想接手时拉回终端。四种方式：

```bash
# 方式一：Claude Code 内部（交互式选择）
/teleport    # 或简写 /tp

# 方式二：命令行交互式选择
claude --teleport

# 方式三：命令行直接恢复特定会话
claude --teleport <session-id>

# 方式四：/tasks 列表中按 t 传送
```

**传送的四个前提条件：**

| 要求 | 说明 |
|------|------|
| **干净的 git 状态** | 工作目录必须没有未提交的更改 |
| **正确的仓库** | 必须从同一仓库（不是 fork）运行 |
| **分支可用** | 网页会话中的分支必须已推送到远程 |
| **相同账户** | 必须认证到相同的 claude.ai 账户 |

### 2.3 云环境与网络配置

**默认镜像预装内容：**

| 类别 | 内容 |
|------|------|
| **语言** | Python 3.x、Node.js LTS、Ruby 3.1-3.3、Go、Rust、Java、PHP 8.4、C++ |
| **包管理器** | pip/poetry、npm/yarn/pnpm/bun、gem/bundler、cargo、Maven/Gradle |
| **数据库** | PostgreSQL 16、Redis 7.0 |
| **工具** | GCC、Clang、常见 linters 和测试框架 |

在云环境中用 `check-tools` 命令可以查看完整的预装工具和语言版本列表。

**三种网络访问级别：**

| 级别 | 说明 |
|------|------|
| **受限（默认）** | 仅允许白名单域名，覆盖 npm/PyPI/RubyGems/crates.io 等主流包管理器、AWS/GCP/Azure 等云平台、Docker/GHCR 等容器注册表，合计 200+ 域名 |
| **无互联网** | 完全禁用网络访问（但仍然可以连接 Anthropic API） |
| **完全** | 允许所有互联网访问 |

**设置脚本 vs SessionStart Hooks：**

这是配置云环境的两条路径，区别很重要：

| | 设置脚本 | SessionStart Hooks |
|---|---------|-------------------|
| **附加到** | 云环境配置 | 仓库的 `.claude/settings.json` |
| **配置位置** | 云环境 UI | 代码仓库中 |
| **运行时机** | Claude Code 启动**之前**，仅新会话 | Claude Code 启动**之后**，每个会话（包括恢复的） |
| **作用范围** | 仅云环境 | 本地和云都会触发 |

**设置脚本示例**（在 Claude Code 启动前运行）：

```bash
#!/bin/bash
# 安装 gh CLI —— 注意非关键命令加 || true
apt update && apt install -y gh
```

**SessionStart Hook 配置**（在 `.claude/settings.json` 中）：

```json
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

对应的安装脚本，用 `CLAUDE_CODE_REMOTE` 区分本地和远程，并检查依赖是否已存在：

```bash
#!/bin/bash
# scripts/install_pkgs.sh
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then exit 0; fi
if [ ! -d "node_modules" ]; then npm install; fi
if [ ! -d ".venv" ]; then pip install -r requirements.txt; fi
exit 0
```

**持久化环境变量（CLAUDE_ENV_FILE）：** 在 SessionStart hook 中向 `$CLAUDE_ENV_FILE` 写入 `KEY=value` 格式的行，后续所有 Bash 命令自动加载这些变量。

**依赖管理有四项限制：** ①Hooks 本地和远程都触发，用 `CLAUDE_CODE_REMOTE` 过滤；②"无互联网"模式下安装命令会失败；③远程出站流量经过安全代理，Bun 是已知的不兼容案例；④每次会话（包括恢复）都会运行，脚本要检查依赖是否已存在。

---

## 三、hippo 的实战经验

> hippo：以下是我实际使用中的踩坑经验：

### 3.1 并行任务的速率限制

`--remote` 可以并行跑多个任务，但它们共享你的速率限制。不是真正的"无限并行"——我试过同时开 5 个任务，后面的任务明显在排队。**建议**：2-3 个并行任务是甜蜜点。

### 3.2 设置脚本踩坑

两个关键教训：

**第一**，设置脚本中**任何命令失败都会阻止整个会话启动**。非关键命令必须加 `|| true`：

```bash
#!/bin/bash
apt update
apt install -y gh || true        # 即使安装失败也继续
npm install                       # 关键命令，不加 || true
```

**第二**，`CLAUDE_CODE_REMOTE` 这个变量非常关键。我一开始没加判断，结果每次在本地启动 Claude Code 也触发依赖安装。一定要在脚本开头检查 `if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then exit 0; fi`。

---

## 四、常见问题

**Q: 并行跑多个任务会不会更贵？**
A: 共享速率限制按比例消耗，不是线性收费。并行 3 个任务，每个分到三分之一的速率额度。

**Q: --remote 和 /teleport 有什么区别？**
A: 方向相反。`--remote` 创建新网页会话（终端→网页），`/teleport` 恢复已有会话（网页→终端）。只能拉不能推。

**Q: 网页版只支持 GitHub 吗？**
A: 目前是的，GitLab 等暂不支持。

**Q: 恢复会话时设置脚本会重新运行吗？**
A: 不会，设置脚本仅新建会话时运行。但 SessionStart Hooks 每次都运行——这也是两者的重要区别。

---

## 五、小结

**Claude Code 网页版 = 云端 VM 异步运行 + 终端网页无缝切换 + 并行多任务。** 适合明确的 bug 修复、文档更新、测试编写这类"放手让 Claude 干"的场景。

安全隔离要点：每个会话在独立 VM 中运行，敏感凭证不进入沙箱，GitHub 操作通过专用代理用作用域凭证处理，git push 仅限当前工作分支。

**下一篇**：[精读官方文档：远程控制](./remote-control)

---

*本文精读自 [Claude Code on the web](https://code.claude.com/docs/zh-CN/claude-code-on-the-web)*

*最后更新：2026-03-31*
