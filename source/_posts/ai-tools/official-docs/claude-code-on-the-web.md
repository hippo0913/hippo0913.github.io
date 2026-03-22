---
title: 精读官方文档：Claude Code 网页版
date: 2026-03-12 11:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 20
description: 精读 Claude Code 网页版文档，了解在浏览器中使用 Claude Code 的方法。
cover: https://picsum.photos/seed/claude-web/1920/1080
source_url: https://code.claude.com/docs/zh-CN/claude-code-on-the-web
---

# 精读官方文档：Claude Code 网页版

> 💬 hippo：本文档精读系列带你系统学习 Claude Code，避免踩坑，提升效率。

## 开篇：为什么需要网页版

想象一下，你的电脑正在跑一个耗时的构建任务，突然有个紧急的 bug 需要修复。这时候，Claude Code 网页版就派上用场了——它在云端运行，不占用你的本地资源，还能随时随地访问。

Claude Code 网页版目前处于研究预览阶段，让开发者可以在浏览器中直接使用 Claude Code 的强大功能。无论是回答代码问题、修复 bug，还是处理你没有本地克隆的仓库，网页版都能胜任。

更重要的是，你可以从终端启动远程任务，然后继续在本地工作；或者把网页版的会话传送回终端继续完善。这种灵活性让它成为你开发工具箱中的利器。

<!-- more -->

## 核心概念：用大白话讲清楚

### Claude Code 网页版是什么？

简单来说，Claude Code 网页版就是运行在云端的 Claude Code。你只需要一个浏览器和 Claude 账号，就能让 AI 在云端分析代码、修改文件、运行测试。

它最适合以下场景：

- **回答问题**：询问代码架构、功能实现方式
- **错误修复和日常任务**：那些定义明确、不需要频繁调整的任务
- **并行工作**：同时处理多个 bug 修复
- **远程仓库**：处理你没有本地克隆的代码
- **后端修改**：Claude Code 可以先写测试，再写代码通过测试

### 谁可以使用？

Claude Code 网页版目前对以下用户开放：

- Pro 用户
- Max 用户
- Team 用户
- Enterprise 用户（需要有高级席位或 Chat + Claude Code 席位）

### 工作原理是怎样的？

当你启动一个网页版任务时，背后发生了这些事：

1. **仓库克隆**：你的代码被克隆到 Anthropic 管理的虚拟机
2. **环境准备**：Claude 准备安全的云环境，运行你的设置脚本（如果配置了）
3. **网络配置**：根据你的设置配置网络访问权限
4. **任务执行**：Claude 分析代码、修改文件、运行测试、检查结果
5. **完成通知**：任务完成后你会收到通知
6. **创建 PR**：修改会被推送到一个分支，准备创建拉取请求

> 💡 小贴士：整个过程中，你的敏感凭证（如 git 密钥、签名密钥）永远不会进入沙箱，所有认证都通过安全代理处理。

## 实战指南：手把手教你用

### 场景一：从终端启动远程任务

你有一个耗时的 bug 需要修复，但又不想占用本地电脑的资源。这时可以用 `--remote` 标志：

```bash
claude --remote "Fix the authentication bug in src/auth/login.ts"
```

这会在 claude.ai 上创建一个新的网络会话，任务在云端运行，你可以继续在本地工作。

**进阶技巧：本地规划，远程执行**

对于复杂任务，可以先在 Plan Mode 中和 Claude 一起制定方案，然后发送到云端执行：

```bash
# 1. 进入规划模式，只读文件
claude --permission-mode plan

# 2. 对方案满意后，发送到云端执行
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

这样你可以控制策略，让 Claude 在云中自主执行。

**并行运行多个任务**

每个 `--remote` 命令都会创建独立的网络会话：

```bash
# 同时启动三个任务
claude --remote "Fix the flaky test in auth.spec.ts"
claude --remote "Update the API documentation"
claude --remote "Refactor the logger to use structured output"
```

用 `/tasks` 命令监控所有会话的进度。

### 场景二：审查 Diff 并创建 PR

当 Claude 修改文件时，会显示一个 diff 统计指示器（如 `+12 -1`，表示添加了 12 行、删除了 1 行）。点击它就能打开 diff 查看器：

左侧显示文件列表，右侧显示每个文件的详细修改。在 diff 视图中，你可以：

- 逐个文件审查修改
- 对特定修改添加评论，要求 Claude 调整
- 根据看到的内容继续与 Claude 迭代

这样你可以通过多轮反馈完善修改，而不需要创建草稿 PR 或切换到 GitHub。

### 场景三：网页和终端之间传送会话

会话传送是单向的：你只能把网页会话拉到终端，不能把终端会话推到网页。

**从网页传送到终端：**

```bash
# 方法 1：在 Claude Code 中使用命令
/teleport  # 或简写为 /tp

# 方法 2：在命令行使用
claude --teleport  # 交互式选择
claude --teleport <session-id>  # 直接恢复特定会话

# 方法 3：从 /tasks 命令
/tasks  # 然后按 t 键传送

# 方法 4：从网页界面
# 点击"在 CLI 中打开"按钮，复制命令粘贴到终端
```

传送会话时，Claude 会验证：

- 你的工作目录没有未提交的更改（有未提交的更改会提示你先 stash）
- 你在正确的仓库中（不能从 fork 传送）
- 网络会话的分支已被推送到远程
- 你使用的是相同的 Claude.ai 账户

> 💬 hippo 分享：我经常在手机上用 Claude App 查看云端任务的进度，发现问题后回到电脑用 `/teleport` 传送到终端继续处理，超级方便。

## hippo 的踩坑实录

### 坑点一：未提交的更改导致传送失败

**问题描述**：我尝试用 `/teleport` 传送一个网页会话到终端，但一直报错。

**原因分析**：传送要求工作目录必须是干净的 git 状态。我有几个文件的修改还没提交。

**解决方案**：

```bash
# 方法 1：提交更改
git add .
git commit -m "WIP: save progress"

# 方法 2：暂存更改
git stash

# 传送完成后，如果用了 stash
git stash pop
```

### 坑点二：设置脚本失败导致会话无法启动

**问题描述**：我配置了一个设置脚本安装依赖，但每次创建新会话都失败。

**原因分析**：设置脚本如果以非零值退出，会话就无法启动。我的脚本中有一个 `npm install` 在某些包不存在时会失败。

**解决方案**：

在设置脚本中对非关键命令添加 `|| true`：

```bash
#!/bin/bash
apt update && apt install -y gh
npm install || true  # 即使失败也不阻止会话启动
pip install -r requirements.txt || true
```

### 坑点三：默认镜像中没有需要的工具

**问题描述**：我需要在云环境中使用 `gh` CLI（GitHub 命令行工具），但默认镜像里没有。

**原因分析**：默认镜像包含常见工具，但不是所有工具都在里面。

**解决方案**：

在环境设置中添加设置脚本：

```bash
#!/bin/bash
apt update && apt install -y gh
```

设置脚本会在 Ubuntu 24.04 上以 root 身份运行，所以 `apt install` 可以正常工作。

> 💬 hippo 的建议：在添加设置脚本之前，先在云会话中运行 `check-tools` 命令，看看环境里已经有什么工具，避免重复安装。

## 常见问题解答

**Q: 网页版和终端版有什么区别？**

A: 网页版在云端运行，不占用你的本地资源，可以随时随地访问。终端版在你的机器上运行，性能更好，但需要你的电脑开机。两者可以配合使用，比如用终端启动远程任务，用网页查看进度。

**Q: 网页版安全吗？**

A: 很安全。每个会话都在隔离的虚拟机中运行，网络访问默认受限，敏感凭证通过安全代理处理，不会进入沙箱。

**Q: 可以共享会话给团队成员吗？**

A: 可以。Enterprise 和 Teams 账户可以设置"团队"可见性，让组织成员查看。Pro 和 Max 账户可以设置"公开"可见性，让任何登录 claude.ai 的用户查看。

**Q: 默认镜像里有哪些工具？**

A: 包含主流编程语言（Python、Node.js、Ruby、PHP、Java、Go、Rust、C++）、常见构建工具、包管理器（npm、yarn、pip、cargo 等），以及 PostgreSQL 和 Redis 数据库。

**Q: 如何查看云环境中安装了哪些工具？**

A: 让 Claude Code 运行 `check-tools` 命令，它会显示编程语言版本、可用包管理器和已安装的开发工具。

**Q: 网页版支持哪些代码托管平台？**

A: 目前只支持 GitHub。GitLab 和其他非 GitHub 仓库不能与云会话一起使用。

**Q: 运行远程任务会消耗更多额度吗？**

A: 网页版和你账户内所有其他 Claude 和 Claude Code 使用共享速率限制。并行运行多个任务会按比例消耗更多速率限制。

**Q: 可以在云环境中访问任意网站吗？**

A: 不行。网络访问默认受限，只允许访问预定义的域名列表（如 npm、PyPI、GitHub 等）。你可以在环境设置中配置自定义网络访问权限。

## 一句话总结

Claude Code 网页版是运行在云端的 AI 编程助手，让你随时随地处理代码任务，同时保持安全和高效。

**上一篇**：[精读官方文档：Claude Code 概览](/2026/03/11/ai-tools/official-docs/claude-code/)

**下一篇**：[精读官方文档：Claude Code 配置](/2026/03/13/ai-tools/official-docs/claude-code-configuration/)

---

*本文精读自 [Claude Code 网页版官方文档](https://code.claude.com/docs/zh-CN/claude-code-on-the-web)*
