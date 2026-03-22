---
title: 精读官方文档：使用 Claude Code Desktop
date: 2026-03-12 16:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 15
description: 精读 Claude Code Desktop 文档，了解桌面应用的功能和使用方法。
cover: https://picsum.photos/seed/claude-desktop/1920/1080
source_url: https://code.claude.com/docs/zh-CN/desktop
---

# 精读官方文档：使用 Claude Code Desktop

> 💬 hippo：这是 Claude Code 官方文档精读系列的第15篇。如果你已经在用 CLI 版本，这篇会告诉你桌面版有什么不同；如果你刚开始，桌面版是个不错的起点。

---

## 开篇：什么是 Claude Code Desktop

Claude Code Desktop 是 Claude 桌面应用中的 Code 选项卡，让你可以通过图形界面（而不是终端）来使用 Claude Code。

比起 CLI 版本，Desktop 增加了一些很实用的功能：
- 可视化 diff 审查，支持内联注释
- 实时应用预览，可以启动开发服务器
- GitHub PR 监控，支持自动修复和合并
- 并行会话，自动用 Git worktree 隔离
- 计划任务，按定时计划自动运行 Claude
- 连接器，支持 GitHub、Slack、Linear 等工具集成

简单说：CLI 版本像是用命令行跟 Claude 交流，Desktop 版本像是用聊天窗口跟他交流，还加了图形化工具。

---

<!-- more -->

## 核心概念：用大白话讲清楚

### 1. 会话是什么？

每次打开一个新的 Code 选项卡窗口，就是一个"会话"。每个会话：
- 有自己的上下文和更改记录
- 独立跟踪文件修改
- 可以用不同的权限模式运行

💬 hippo：可以把会话理解成 Claude 的一个"工作实例"。如果你同时在处理两个不同的任务，就开两个会话，互不干扰。

### 2. 环境是什么？

启动会话前，你要选"环境"，就是 Claude 运行在哪里：

| 环境 | 说明 | 适合场景 |
|------|------|----------|
| **Local** | 在你的机器上运行 | 日常开发、调试 |
| **Remote** | 在 Anthropic 的云端运行 | 长时间运行的任务、大重构 |
| **SSH** | 在你连接的远程机器上运行 | 操作云服务器、开发容器 |

### 3. 权限模式是什么？

权限模式控制 Claude 能做多大的自主权：
- **询问权限**：Claude 改任何文件或运行命令前都要问你
- **自动接受编辑**：文件改好自动接受，但运行命令前还问
- **Plan Mode**：Claude 只分析代码、写计划，不动文件
- **绕过权限**：Claude 想干啥就干啥（仅在沙箱环境用）

---

## 实战指南：手把手教你用

### 场景一：用 Desktop 开发一个新功能

#### 1. 启动会话

打开 Claude Desktop，点击 Code 选项卡：

```bash
# 选择配置
环境：Local（本地）
项目文件夹：选择你的项目目录
模型：Sonnet（默认，速度快）
权限模式：询问权限（新手推荐）
```

#### 2. 给 Claude 下任务

在提示框里输入你的需求：

```
帮我在首页加一个"关于我们"的链接，点击后跳转到 /about 页面
```

按 Enter 发送。

#### 3. 审查 Claude 的更改

Claude 修改文件后，你会看到 diff 视图：
- 左侧：文件列表
- 右侧：每个文件的改动（绿色是新增，红色是删除）

点击 `+12 -1` 这样的指示器可以看到详细改动。

💬 hippo：第一次用建议选"询问权限"，这样你能看清 Claude 做了什么，养成好习惯。

#### 4. 预览效果

如果项目是 Web 应用，Claude 会自动启动开发服务器。你可以在内置浏览器里预览效果。

```bash
# 预览面板功能：
- 直接在浏览器里交互
- 看着 Claude 自动验证改动（截图、检查 DOM）
- 启动/停止服务器
- 保存登录状态（Persist sessions）
```

#### 5. 提交代码

检查无误后，让 Claude 提交：

```
提交这些更改，commit 信息写 "feat: 添加关于我们链接"
```

### 场景二：用并行会话处理多个任务

假设你同时要：
1. 修复一个 bug
2. 重构一段代码
3. 更新文档

#### 1. 开启并行会话

点击侧边栏的 `+ New session` 创建新会话。

每个会话自动用 Git worktree 隔离，互不影响：

```bash
# Worktree 存储位置
<project-root>/.claude/worktrees/
```

#### 2. 在不同会话里工作

**会话 1**：修复 bug
```
修复登录页面的样式问题
```

**会话 2**：重构代码
```
把 user-service 里的重复代码提取成一个工具函数
```

**会话 3**：更新文档
```
根据刚才的重构，更新 README.md 的 API 说明
```

#### 3. 合并工作

每个会话完成自己的任务后，分别提交：

```bash
# 会话 1
git add . && git commit -m "fix: 修复登录页面样式"

# 会话 2
git add . && git commit -m "refactor: 提取用户工具函数"

# 会话 3
git add . && git commit -m "docs: 更新 API 文档"
```

然后回到主分支合并这三个 commit。

---

## hippo 的踩坑实录

### 坑点一：远程会话找不到本地分支

**问题描述**：用 Remote 环境开了个会话，Claude 创建了一个新分支。等我回到本地想继续工作时，git 报错说分支不存在。

**原因**：远程会话在云端创建的分支，还没同步到本地。

**解决方法**：

```bash
# 先获取远程分支
git fetch origin <branch-name>

# 然后切换过去
git checkout <branch-name>
```

💬 hippo：现在我会定期同步远程分支，或者直接在远程会话里完成整个任务，避免来回切换。

### 坑点二：预览服务器端口冲突

**问题描述**：Claude 尝试启动开发服务器时报错说端口被占用，任务卡住了。

**原因**：端口 3000 已经被其他进程用了。

**解决方法**：

在 `.claude/launch.json` 里配置端口处理策略：

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "web",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000,
      "autoPort": true  // 关键：自动找空闲端口
    }
  ]
}
```

或者让 Claude 自己换端口：

```
启动开发服务器，如果 3000 端口被占用就换一个
```

### 坑点三：计划任务在电脑睡眠时错过执行

**问题描述**：设置了每天早上 9 点运行的代码审查任务，但有好几天都没触发。

**原因**：那几天电脑睡眠了，Desktop 不会唤醒电脑执行任务。

**解决方法**：

```bash
# 方案 1：在设置里启用 "Keep computer awake"
设置 → Desktop app → General → Keep computer awake

# 方案 2：接受错过的事实，用追赶机制
Desktop 会在唤醒后执行一次最近错过的任务（最多 7 天内）
```

💬 hippo：后来我在任务提示里加了时间检查：

```
审查今天的提交。如果已经是下午 5 点后，跳过审查，只发个摘要
```

这样即使任务延迟执行，也不会做不合适的事情。

---

## 常见问题解答

**Q: Desktop 和 CLI 哪个更好用？**

A: 看场景：
- **Desktop**：适合交互式开发，有图形界面，容易上手
- **CLI**：适合脚本化、自动化、集成到工作流

两个用相同的底层引擎，配置文件共享，可以同时用。

**Q: 远程会话需要额外付费吗？**

A: 不用。远程会话使用计入你的订阅计划限制，没有单独的计算费用。

**Q: 怎么把 CLI 会话转移到 Desktop？**

A: 在 CLI 里输入 `/desktop`，Claude 会保存会话并在 Desktop 里打开它。

**Q: Windows 上用 Code 选项卡需要 Git 吗？**

A: 需要。Windows 上启动本地会话必须安装 Git for Windows。

**Q: Desktop 支持插件吗？**

A: 支持。点击提示框旁的 `+` 按钮 → Plugins 可以安装和管理插件。不过远程会话不支持插件。

---

## 一句话总结

Claude Code Desktop 把 CLI 的强大功能和图形界面的易用性结合在一起，适合大多数日常开发场景，新手上手快，老鸟也能提高效率。

---

**上一篇**：[精读官方文档：使用 Claude Code](/2026/03/12/ai-tools/official-docs/getting-started/)

**下一篇**：[精读官方文档：配置 Claude Code](/2026/03/12/ai-tools/official-docs/configuration/)

---

*本文精读自 [使用 Claude Code Desktop](https://code.claude.com/docs/zh-CN/desktop)*
