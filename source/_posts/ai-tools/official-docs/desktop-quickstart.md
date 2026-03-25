---
title: 精读官方文档：Desktop 快速开始
date: 2026-03-15 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 16
description: Claude Code Desktop 版本提供了图形化界面，支持可视化 diff 预览、实时应用预览、PR 监控自动合并、并行会话等功能，本文精读官方快速开始指南。
cover: https://picsum.photos/seed/claude-desktop-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/desktop-quickstart
---

# 精读官方文档：Desktop 快速开始

> hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code Desktop 是 Anthropic 推出的桌面应用版本，让你无需终端也能使用 Claude Code。它提供了图形化界面，包括：

- **可视化 diff 预览**：修改代码后可以逐文件查看差异
- **实时应用预览**：内置开发服务器，Claude 可以直接看到运行效果
- **PR 监控与自动合并**：监控 CI 检查结果，自动修复失败或合并
- **并行会话**：多个任务同时进行，每个在独立的 Git worktree 中
- **定时任务**：设置每天自动运行代码审查等任务

简单说，就是「命令行版 Claude Code 的图形界面增强版」。

<!-- more -->

---

## 二、官方教程精读

### 2.1 Desktop 应用的三个标签页

Desktop 应用包含三个标签页：

| 标签页 | 功能说明 | 适用场景 |
|--------|----------|----------|
| Chat | 普通对话，无文件访问权限 | 类似 claude.ai 的日常问答 |
| Cowork | 后台自主 Agent，在云端 VM 运行 | 长时间任务，可关闭应用后继续 |
| Code | 交互式编码助手，直接访问本地文件 | 代码修改、重构、调试 |

> 本文档重点介绍 **Code** 标签页。Chat 和 Cowork 在 Claude Desktop 支持文档中单独说明。

### 2.2 安装方式

Desktop 应用内置了 Claude Code，**不需要单独安装 Node.js 或 CLI**。

如果你想在终端中使用 `claude` 命令，需要单独安装 CLI 版本。

**安装命令（macOS/Linux）：**

```bash
# 使用 npm 安装 CLI
npm install -g @anthropic-ai/claude-code

# 或使用 Homebrew（macOS）
brew install claude-code
```

**Windows 用户：**

```powershell
# 使用 npm 安装
npm install -g @anthropic-ai/claude-code
```

### 2.3 启动第一个会话

1. 打开 Desktop 应用，选择 **Code** 标签页
2. 选择一个项目文件夹
3. 在输入框中给 Claude 一个任务

就这么简单，Claude 会开始工作并等待你的审批。

### 2.4 核心功能一览

官方文档列出了多个实用功能，我用表格整理如下：

| 功能 | 触发方式 | 说明 |
|------|----------|------|
| 中断和纠正 | 点击停止按钮或直接输入修正 | 不用等 Claude 完成，随时介入 |
| 添加上下文 | 输入 `@filename` 或拖拽文件 | 让 Claude 看到更多相关代码 |
| 使用 Skills | 输入 `/` 或点击 + -> Slash commands | 调用可复用的命令模板 |
| 代码审查 | 点击 `+12 -1` 指示器 | 逐文件查看 diff，添加行内评论 |
| 权限模式 | 切换 Ask/Auto accept/Plan 模式 | 控制审批粒度 |
| 插件扩展 | 点击 + -> Plugins | 安装 MCP 服务器、Skills 等 |
| 应用预览 | 点击 Preview 下拉菜单 | 运行开发服务器，Claude 可以看到界面 |
| PR 监控 | 打开 PR 后自动监控 | CI 失败时自动修复，通过后自动合并 |
| 定时任务 | 设置 scheduled tasks | 每日代码审查、每周依赖检查等 |

### 2.5 权限模式详解

权限模式决定了 Claude 操作时需要你审批的程度：

```yaml
# 三种权限模式对比
权限模式:
  Ask permissions:  # 默认模式
    说明: 每次编辑都需要你批准
    适用: 新项目、重要代码库

  Auto accept edits:
    说明: 自动接受文件编辑
    适用: 快速迭代、实验性代码

  Plan mode:
    说明: 只规划不修改文件
    适用: 大型重构前的方案设计
```

---

## 三、hippo 的实战经验

> hippo：以下是我实际使用 Desktop 版本的踩坑经验：

### 3.1 我遇到的问题

刚开始用 Desktop 版本时，我以为它只是 CLI 的「套壳」，结果发现有些功能用起来不太一样：

1. **快捷键冲突**：Desktop 的某些快捷键和 IDE 冲突
2. **并行会话的 worktree 理解成本**：一开始没搞懂为什么开了两个窗口代码不一样
3. **预览功能配置**：Preview 需要正确配置 dev server 命令

### 3.2 我的解决方案

**配置 Preview 的 dev server：**

在你的项目根目录创建或编辑 `.claude/settings.json`：

```json
{
  "preview": {
    "command": "npm run dev",
    "port": 3000,
    "readyPattern": "Local:.*http://localhost:"
  }
}
```

这个配置告诉 Desktop：
- 运行 `npm run dev` 启动开发服务器
- 监听 3000 端口
- 当看到包含 `Local:.*http://localhost:` 的输出时认为服务已就绪

**并行会话的正确用法：**

```bash
# Desktop 会在 .claude/worktrees/ 下创建独立的 worktree
# 每个会话有自己的分支，互不干扰

# 查看当前 worktree 列表
git worktree list

# 输出示例：
# /home/yy/project/.claude/worktrees/abc123  abc123-feature
```

### 3.3 我的建议

1. **CLI 和 Desktop 可以同时使用**：它们共享配置（CLAUDE.md、MCP servers、hooks、skills）
2. **重要操作先用 Plan 模式**：大改动前让 Claude 先出方案，确认后再执行
3. **利用中断功能**：Claude 走偏时直接打断，不用等它跑完

---

## 四、常见问题

**Q: Desktop 和 CLI 能同时用吗？**

A: 可以。它们运行相同的引擎，共享所有配置（CLAUDE.md、MCP、hooks、skills、settings）。你可以同时打开两个，在同一个项目上工作。

**Q: 为什么我的 Preview 不工作？**

A: 检查以下几点：
1. 项目的 dev server 命令是否正确（`npm run dev` / `yarn dev`）
2. 端口是否被占用
3. `readyPattern` 是否匹配你的 dev server 输出格式

**Q: Cowork 和 Code 有什么区别？**

A: Cowork 是云端运行的自主 Agent，你关闭应用后它继续工作；Code 是本地的交互式助手，需要你实时审批每个操作。

**Q: 如何从 CLI 迁移到 Desktop？**

A: 不需要迁移。Desktop 会自动读取你现有的 `CLAUDE.md`、`.claude/settings.json` 等配置文件。直接打开项目即可。

---

## 五、小结

Claude Code Desktop 把命令行版本的强大功能包装成了友好的图形界面，特别适合：
- 不习惯终端操作的开发者
- 需要可视化 diff 审查代码的场景
- 想要并行处理多个任务的情况

如果你已经熟悉 CLI 版本，Desktop 可以无缝切换，配置完全共享。

**下一篇**：[精读官方文档：权限模式详解](/2026/03/15/claude-code-permissions/) - 深入了解三种权限模式的使用场景。

---

*本文精读自 [Get started with the desktop app](https://docs.anthropic.com/en/docs/claude-code/desktop-quickstart)*

*最后更新：2026-03-25*
