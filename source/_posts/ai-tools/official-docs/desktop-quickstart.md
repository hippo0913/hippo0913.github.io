---
title: 精读官方文档：Desktop 快速开始
date: 2026-03-15 23:00:00
updated: 2026-03-27 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 16
description: Claude Code Desktop 版本提供了图形化界面，支持可视化 diff 预览、实时应用预览、PR 监控自动合并、并行会话等功能，本文精读官方快速开始指南并补充实战经验。
cover: https://picsum.photos/seed/claude-desktop-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/desktop-quickstart
---

# 精读官方文档：Desktop 快速开始

> hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code Desktop 是 Anthropic 推出的桌面应用版本，让你无需终端也能使用 Claude Code。它提供了图形化界面，包括：

- **可视化差异审查**：修改代码后可以逐文件查看差异，支持行内评论
- **实时应用预览**：内置开发服务器，Claude 可以直接看到运行效果
- **PR 监控与自动合并**：监控 CI 检查结果，自动修复失败或合并
- **并行会话**：多个任务同时进行，每个在独立的 Git worktree 中
- **计划任务**：设置每天自动运行代码审查等任务
- **远程运行能力**：将任务发送到云端，关闭应用后继续执行

简单说，就是「命令行版 Claude Code 的图形界面增强版」。

<!-- more -->

---

## 二、官方教程精读

### 2.1 Desktop 应用的三个标签页

Desktop 应用包含三个标签页：

| 标签页 | 功能说明 | 适用场景 | 文件访问权限 |
|--------|----------|----------|--------------|
| **Chat** | 普通对话，无文件访问权限 | 类似 claude.ai 的日常问答 | 无 |
| **Cowork** | 后台自主 Agent，在云端 VM 运行 | 长时间任务，可关闭应用后继续 | 独立云端环境 |
| **Code** | 交互式编码助手，直接访问本地文件 | 代码修改、重构、调试 | 本地项目文件 |

> 本文档重点介绍 **Code** 标签页。Chat 和 Cowork 在 Claude Desktop 支持文档中单独说明。

### 2.2 安装方式

Desktop 应用内置了 Claude Code，**不需要单独安装 Node.js 或 CLI**。

如果你想同时拥有终端和图形界面，可以安装 CLI 版本：

```bash
# macOS/Linux - 使用 npm 安装
npm install -g @anthropic-ai/claude-code

# macOS - 使用 Homebrew
brew install claude-code
```

```powershell
# Windows - 使用 npm 安装
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
| AI 自审 | 点击 Review code | 让 Claude 自己评估差异并留下内联建议 |
| 权限模式 | 切换 Ask/Auto accept/Plan 模式 | 控制审批粒度 |
| 插件扩展 | 点击 + -> Plugins | 安装 MCP 服务器、Skills 等 |
| 应用预览 | 点击 Preview 下拉菜单 | 运行开发服务器，Claude 可以看到界面 |
| PR 监控 | 打开 PR 后自动监控 | CI 失败时自动修复，通过后自动合并 |
| 定时任务 | 设置 scheduled tasks | 每日代码审查、每周依赖检查等 |
| 并行会话 | 侧边栏打开新会话 | 同时处理多个任务，各自独立 worktree |

### 2.5 权限模式详解

权限模式决定了 Claude 操作时需要你审批的程度：

| 模式 | 设置键 | 行为 | 推荐场景 |
|------|--------|------|----------|
| **Ask permissions** | `default` | 每次编辑或运行命令前都需要你批准 | 新用户、重要项目 |
| **Auto accept edits** | `acceptEdits` | 自动接受文件编辑，但运行终端命令前仍需询问 | 快速迭代开发 |
| **Plan Mode** | `plan` | 只分析代码并创建计划，不修改文件或运行命令 | 大型重构前规划 |
| **Auto** | `auto` | 后台安全检查验证一致性，减少权限提示 | Team 计划用户 |
| **Bypass permissions** | `bypassPermissions` | 无任何权限提示 | 仅在沙箱或虚拟机中使用 |

> 远程会话（Cowork）支持"自动接受编辑"和 Plan Mode，"询问权限"不可用。

### 2.6 预览您的应用

点击 **Preview** 下拉菜单可以直接在桌面中运行开发服务器。这个功能非常强大：

**Claude 可以做的事情：**

- 启动开发服务器并打开嵌入式浏览器验证更改
- 查看正在运行的应用界面
- 测试 API 端点、查看服务器日志
- 拍摄屏幕截图、检查 DOM、点击元素、填充表单
- 自动迭代发现的问题

**配置预览服务器：**

Claude 会自动检测开发服务器设置，配置存储在 `.claude/launch.json`：

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "web",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000,
      "autoPort": true
    }
  ]
}
```

**launch.json 配置字段说明：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 服务器的唯一标识符 |
| `runtimeExecutable` | string | 是 | 要运行的命令，如 `npm`、`yarn`、`node` |
| `runtimeArgs` | string[] | 是 | 传递给命令的参数，如 `["run", "dev"]` |
| `port` | number | 否 | 服务器监听端口，默认 3000 |
| `cwd` | string | 否 | 相对于项目根目录的工作目录 |
| `autoPort` | boolean | 否 | 端口冲突时自动查找空闲端口，默认 true |

**Monorepo 多服务器示例：**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "apps/web",
      "port": 3000,
      "autoPort": true
    },
    {
      "name": "api",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start"],
      "cwd": "server",
      "port": 8080,
      "autoPort": false
    }
  ]
}
```

### 2.7 监控拉取请求状态

打开 PR 后，CI 状态栏会出现在会话中。Claude Code 使用 GitHub CLI 轮询检查结果。

**两大核心功能：**

| 功能 | 触发条件 | 说明 |
|------|----------|------|
| **Auto-fix** | CI 检查失败 | Claude 自动读取失败输出并迭代修复 |
| **Auto-merge** | 所有检查通过 | 自动合并 PR（使用压缩合并方式） |

**使用方法：**

1. 在 CI 状态栏中找到 **Auto-fix** 和 **Auto-merge** 切换开关
2. 启用后，Claude 会自动处理 CI 流程
3. CI 完成时会收到桌面通知

> Auto-merge 需要在你的 GitHub 仓库设置中启用 "Allow auto-merge" 才能工作

### 2.8 CLI 与 Desktop 功能对比

官方提供了完整的功能对照表，方便 CLI 用户了解 Desktop 的等效操作：

| 功能 | CLI 方式 | Desktop 方式 |
|------|----------|--------------|
| 启动会话 | `claude` | 打开应用 → Code 标签 |
| 指定目录 | `claude /path/to/project` | 选择项目文件夹 |
| 自动接受编辑 | `claude --auto` | 权限模式选择 Auto accept edits |
| Plan 模式 | `claude --plan` | 权限模式选择 Plan |
| 添加文件 | 命令行参数或 `@file` | 输入框 `@filename` 或拖拽 |
| 使用 Skills | `/skill-name` | 输入 `/` 或点击 + → Slash commands |
| 查看差异 | 终端 diff 输出 | 可视化差异视图 |
| 后台任务 | 无 | Cowork 标签页 |

**Desktop 暂不支持的功能：**

- `--print` 标志（非交互模式输出）
- `--output-format json`（JSON 格式输出）
- `--resume`（恢复上次会话）

---

## 三、hippo 的实战经验

> hippo：以下是我实际使用 Desktop 版本的踩坑经验：

### 3.1 我遇到的问题

刚开始用 Desktop 版本时，我以为它只是 CLI 的「套壳」，结果发现有些功能用起来不太一样：

1. **快捷键冲突**：Desktop 的某些快捷键和 IDE 冲突（比如 Cmd+K 在 VS Code 是删除行）
2. **并行会话的 worktree 理解成本**：一开始没搞懂为什么开了两个窗口代码不一样
3. **预览功能配置**：Preview 需要正确配置 dev server 命令才能工作

### 3.2 我的解决方案

**配置 Preview 的 dev server（替代方案）：**

如果你的项目结构特殊，可以用 `settings.json` 配置预览：

```json
{
  "preview": {
    "command": "yarn dev",
    "port": 4000,
    "readyPattern": "Hexo is running"
  }
}
```

这个配置告诉 Desktop：
- 运行 `yarn dev` 启动开发服务器
- 监听 4000 端口
- 当看到包含 `Hexo is running` 的输出时认为服务已就绪

**并行会话的正确理解：**

```bash
# Desktop 会在 .claude/worktrees/ 下创建独立的 worktree
# 每个会话有自己的分支，互不干扰

# 查看当前 worktree 列表
git worktree list

# 输出示例：
# /home/yy/project/.claude/worktrees/abc123  abc123-feature
# /home/yy/project/.claude/worktrees/def456  def456-bugfix
```

**worktree 的好处是**：你可以同时开发两个功能，互不干扰。但要注意：
- 每个 worktree 会占用额外的磁盘空间
- 完成任务后记得清理不需要的 worktree

**CLI 到 Desktop 会话迁移：**

在终端中运行 `/desktop` 命令可以将 CLI 会话移动到 Desktop：

```bash
# 在 CLI 中运行，会保存当前会话并在 Desktop 中打开
/desktop
```

> 此命令仅在 macOS 和 Windows 上可用。迁移后 CLI 会话会自动退出。

### 3.3 我的建议

1. **CLI 和 Desktop 可以同时使用**：它们共享配置（CLAUDE.md、MCP servers、hooks、skills、settings）
2. **重要操作先用 Plan 模式**：大改动前让 Claude 先出方案，确认后再执行
3. **利用中断功能**：Claude 走偏时直接打断，不用等它跑完
4. **用 Preview 验证前端改动**：让 Claude 自己看效果比描述问题更高效

---

## 四、常见问题

**Q: Desktop 和 CLI 能同时用吗？**

A: 可以。它们运行相同的引擎，共享所有配置。你可以同时打开两个，在同一个项目上工作。

**Q: 为什么我的 Preview 不工作？**

A: 检查以下几点：
1. 项目的 dev server 命令是否正确（`npm run dev` / `yarn dev`）
2. 端口是否被占用
3. `readyPattern` 是否匹配你的 dev server 输出格式
4. 是否在正确的目录下

**Q: Cowork 和 Code 有什么区别？**

A: Cowork 是云端运行的自主 Agent，你关闭应用后它继续工作；Code 是本地的交互式助手，需要你实时审批每个操作。

**Q: 如何从 CLI 迁移到 Desktop？**

A: 不需要迁移。Desktop 和 CLI 共享配置，你的设置会自动转移：

**共享配置文件列表：**

| 配置文件 | 位置 | 说明 |
|---------|------|------|
| `CLAUDE.md` | 项目根目录 | 项目级上下文和规则，两者共用 |
| `~/.claude.json` | 用户目录 | 全局 MCP 服务器配置 |
| `.mcp.json` | 项目根目录 | 项目级 MCP 服务器配置 |
| `~/.claude/settings.json` | 用户目录 | 全局设置（权限规则、允许的工具等） |
| `.claude/settings.json` | 项目目录 | 项目级设置 |
| `~/.claude/skills/` | 用户目录 | 全局 skills 目录 |
| `.claude/skills/` | 项目目录 | 项目级 skills 目录 |

**Q: 并行会话会互相影响吗？**

A: 不会。每个并行会话都在独立的 Git worktree 中运行，代码完全隔离。但它们共享同一个远程仓库，所以推送到远程时要注意分支管理。

---

## 五、小结

Claude Code Desktop 把命令行版本的强大功能包装成了友好的图形界面，特别适合：
- 不习惯终端操作的开发者
- 需要可视化 diff 审查代码的场景
- 想要并行处理多个任务的情况
- 需要监控 PR 状态并自动处理的团队

如果你已经熟悉 CLI 版本，Desktop 可以无缝切换，配置完全共享。两个版本可以同时使用，各有优势：
- **CLI**：适合快速命令、脚本集成、CI/CD 环境
- **Desktop**：适合可视化审查、并行开发、PR 管理

**下一篇**：[精读官方文档：权限模式详解](/2026/03/15/claude-code-permissions/) - 深入了解三种权限模式的使用场景。

---

*本文精读自 [开始使用桌面应用](https://code.claude.com/docs/zh-CN/desktop-quickstart)*

*最后更新：2026-03-27*
