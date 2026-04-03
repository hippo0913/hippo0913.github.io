---
title: 精读官方文档：Desktop 快速开始
date: 2026-03-15 23:00:00
updated: 2026-03-31 12:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 16
description: Claude Code Desktop 是命令行版本的图形界面增强版，支持可视化 diff 审查、嵌入式应用预览、PR 自动修复与合并、并行会话（Git worktree 隔离）和计划任务，本文精读官方快速开始指南并补充实战踩坑经验。
cover: https://picsum.photos/seed/claude-desktop-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/desktop-quickstart
---

# 精读官方文档：Desktop 快速开始

> hippo：这是 Claude Code 官方文档精读系列的一篇。这一篇讲 Desktop 应用——一个把 CLI 版本包装成图形界面的桌面客户端，适合不想在终端里看 diff 的人。

---

## 一、这个功能是什么

Claude Code Desktop 是 Anthropic 推出的桌面应用，内置了 Claude Code 引擎，不需要单独安装 Node.js 也能用。它和 CLI 版本共享所有配置（CLAUDE.md、MCP servers、hooks、skills、settings），可以同时运行，不是替代关系。

Desktop 在 CLI 基础上增加了几个图形化能力：可视化 diff 审查（逐文件看改了什么，还能加行内评论）、嵌入式应用预览（跑 dev server 让 Claude 直接看界面）、PR 状态监控（CI 失败自动修复、通过后自动合并）、并行会话（多个任务各自在独立 Git worktree 里跑）。一句话定位：CLI 的图形增强版，核心引擎完全一样。

<!-- more -->

---

## 二、官方教程精读

### 2.1 三标签页与安装

Desktop 应用有三个标签页，分工不同：

| 标签页 | 功能 | 适用场景 | 文件访问权限 |
|---|---|---|---|
| **Chat** | 纯对话，和 claude.ai 体验一致 | 日常问答、知识查询 | 无 |
| **Cowork** | 云端自主 Agent，在远程 VM 运行 | 长时间任务，关掉应用后继续跑 | 独立云端环境 |
| **Code** | 本地交互式编码助手 | 改代码、重构、调试 | 本地项目文件 |

本文重点讲 **Code** 标签页，这是 Claude Code 的核心使用场景。

**安装方式**：Desktop 应用内置了 Claude Code，下载安装即可。如果你也想在终端用 CLI，可以额外安装：

```bash
# macOS / Linux
npm install -g @anthropic-ai/claude-code

# macOS 也可以用 Homebrew
brew install claude-code
```

两个版本安装后会共享同一套配置，不需要额外设置。

### 2.2 核心功能速览

打开 Code 标签页、选一个项目文件夹，就可以开始对话了。以下是日常最常用的几个功能：

| 功能 | 触发方式 | 说明 |
|---|---|---|
| 中断纠正 | 点击停止按钮，直接输入修正 | 不用等 Claude 跑完，随时介入调整方向 |
| 添加上下文 | 输入框输入 `@filename` 或拖拽文件 | 让 Claude 看到更多相关代码 |
| Skills 复用 | 输入 `/` 或点击 + → Slash commands | 调用项目里预定义的命令模板 |
| diff 审查 | 点击 `+12 -1` 变更指示器 | 逐文件查看改了什么，支持行内评论和 AI 自审 |
| 权限模式 | 切换 Ask / Auto accept / Plan | 控制每次操作需要你审批的粒度 |

权限模式决定了 Claude 操作前需要你确认的程度：

| 模式 | 行为 | 推荐场景 |
|---|---|---|
| **Ask permissions** | 每次编辑和命令都要你批准 | 新用户、重要项目 |
| **Auto accept edits** | 自动接受文件编辑，命令仍需确认 | 快速迭代开发 |
| **Plan Mode** | 只分析出方案，不改代码不跑命令 | 大型重构前先规划 |
| **Auto** | 后台安全检查自动验证，减少弹窗 | Team 计划用户 |
| **Bypass permissions** | 无任何提示 | 仅限沙箱或虚拟机环境 |

> Cowork（远程会话）支持 Auto accept edits 和 Plan Mode，不支持 Ask permissions。

### 2.3 预览、PR 监控与并行会话

这三个是 Desktop 相对 CLI 的差异化功能，值得单独展开。

**Preview（应用预览）**

点击 Preview 下拉菜单，Desktop 会在内置浏览器里跑你的 dev server。Claude 可以直接看到应用界面、测试 API、检查日志、截图对比，不需要你手动描述「页面长什么样」。

Preview 的服务器配置放在 `.claude/launch.json`：

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

如果你是 monorepo 项目，可以配置多个服务器，用 `cwd` 字段指定子目录：

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

launch.json 的关键字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | 是 | 服务器的唯一标识符 |
| `runtimeExecutable` | 是 | 要运行的命令，如 `npm`、`yarn`、`node` |
| `runtimeArgs` | 是 | 传给命令的参数数组，如 `["run", "dev"]` |
| `port` | 否 | 监听端口，默认 3000 |
| `cwd` | 否 | 相对项目根目录的工作目录，monorepo 用 |
| `autoPort` | 否 | 端口冲突时自动找空闲端口，默认 true |

**PR 监控**

打开 PR 后，会话里会出现 CI 状态栏。Claude 用 GitHub CLI 轮询检查结果：

| 功能 | 触发条件 | 说明 |
|---|---|---|
| **Auto-fix** | CI 检查失败 | Claude 自动读错误日志并迭代修复 |
| **Auto-merge** | 所有检查通过 | 自动用压缩合并方式合入 PR |

启用方式：在 CI 状态栏里打开 Auto-fix 和 Auto-merge 的开关。注意 Auto-merge 需要在 GitHub 仓库设置里先开启 "Allow auto-merge"。

**并行会话**

侧边栏可以打开新的 Code 会话，每个会话在独立的 Git worktree 里运行，代码互不干扰。适合同时处理多个独立任务（比如一边改 bug 一边加新功能）。配合计划任务（scheduled tasks），还可以设置每天自动跑代码审查、每周检查依赖版本等。

### 2.4 CLI 与 Desktop 功能对照

Desktop 和 CLI 运行同一引擎，大部分操作都有等效方式：

| 功能 | CLI 方式 | Desktop 方式 |
|---|---|---|
| 启动会话 | `claude` | 打开应用 → Code 标签 |
| 指定目录 | `claude /path/to/project` | 选择项目文件夹 |
| 自动接受编辑 | `claude --auto` | 权限模式选 Auto accept edits |
| Plan 模式 | `claude --plan` | 权限模式选 Plan |
| 添加文件 | 命令行参数或 `@file` | 输入 `@filename` 或拖拽文件 |
| 使用 Skills | `/skill-name` | 输入 `/` 或点击 + → Slash commands |
| 查看差异 | 终端 diff 输出 | 可视化差异视图（逐文件 + 行内评论） |
| 后台任务 | 无 | Cowork 标签页 |

Desktop 暂不支持的功能：`--print`（非交互输出）、`--output-format json`（JSON 格式）、`--resume`（恢复上次会话）。这些是 CI/脚本场景的 CLI 专属能力。

---

## 三、hippo 的实战经验

> hippo：以下是我用 Desktop 版本的真实踩坑记录。

### 3.1 踩坑记录与解决方案

**Preview 配置踩坑**

我的博客项目用 Hexo 框架，启动命令是 `yarn dev` 而不是常见的 `npm run dev`。Desktop 自动检测不到正确的启动命令，Preview 一直不工作。后来发现可以用 `settings.json` 做替代配置：

```json
{
  "preview": {
    "command": "yarn dev",
    "port": 4000,
    "readyPattern": "Hexo is running"
  }
}
```

这个配置的含义：运行 `yarn dev`、监听 4000 端口、当终端输出包含 `Hexo is running` 时认为服务就绪。如果你的 launch.json 方式不生效，试试这个 settings.json 替代方案。

**并行会话的理解成本**

一开始开了两个并行会话，发现两边代码不一样，以为出 bug 了。其实是 Desktop 用 Git worktree 做隔离——每个会话在自己的 worktree 里工作：

```bash
# 查看当前 worktree 列表
git worktree list

# 输出示例：
# /home/yy/project                  abc123 [master]
# /home/yy/project/.claude/worktrees/xyz789  xyz789-feature
# /home/yy/project/.claude/worktrees/def456  def456-bugfix
```

每个 worktree 是完整的工作目录副本，改代码互不影响。但它们共享同一个远程仓库，推代码时要注意分支名别冲突。用完记得清理不用的 worktree，否则会占磁盘空间。

**CLI 到 Desktop 的会话迁移**

在终端里跑着跑着想切到 Desktop 看可视化 diff，可以在 CLI 里输入 `/desktop`，当前会话会迁移到 Desktop 打开。这个功能仅限 macOS 和 Windows。

### 3.2 实用建议

- **CLI + Desktop 同时开着**：配置完全共享，终端做快速命令，Desktop 做可视化审查，各取所长
- **大改动前切 Plan 模式**：让 Claude 先输出方案，确认没问题再切回 Ask 或 Auto accept 执行
- **发现方向偏了立刻打断**：不用等 Claude 跑完再改，点停止按钮直接输入修正指令，省 token 也省时间
- **用 Preview 验证前端改动**：让 Claude 自己启动 dev server 看效果，比你用文字描述「按钮偏左了」高效得多

---

## 四、常见问题

**Q: Desktop 和 CLI 能同时用吗？**

A: 可以。运行同一引擎，共享所有配置。你的 CLAUDE.md、MCP servers、hooks、skills 在两边都生效。甚至在同一个项目上同时开 CLI 和 Desktop 也没问题。

**Q: Preview 不工作怎么排查？**

A: 按这个清单逐项检查：
1. dev server 命令是否正确（`npm run dev` 还是 `yarn dev`？）
2. 端口是否被其他程序占用
3. 如果用 settings.json 配置，`readyPattern` 是否匹配你的 dev server 输出
4. 是否在正确的项目目录下打开的会话
5. 如果 launch.json 不生效，试试上一节的 settings.json 替代方案

**Q: Cowork 和 Code 有什么区别？**

A: Cowork 把任务发到云端 VM 运行，关掉应用后任务继续执行，适合长时间、不需要你实时干预的工作。Code 在本地运行，每个操作都需要你审批（除非开了 Auto accept），适合需要精细控制的编码任务。

**Q: 从 CLI 迁移到 Desktop 需要做什么？**

A: 不需要迁移。两边共享同一套配置文件：

| 配置文件 | 位置 | 说明 |
|---|---|---|
| `CLAUDE.md` | 项目根目录 | 项目级上下文和规则 |
| `~/.claude.json` | 用户目录 | 全局 MCP 服务器配置 |
| `.mcp.json` | 项目根目录 | 项目级 MCP 服务器配置 |
| `~/.claude/settings.json` | 用户目录 | 全局设置（权限规则、允许工具） |
| `.claude/settings.json` | 项目目录 | 项目级设置 |
| `.claude/skills/` | 项目目录 | 项目级 Skills |

**Q: 并行会话会互相影响吗？**

A: 不会。每个会话在独立的 Git worktree 里，代码完全隔离。但它们共享同一个远程仓库，推送到远程时要注意分支管理，避免互相覆盖。

---

## 五、小结

Desktop 是 CLI 的图形增强版——同样的引擎、同样的配置，多了可视化 diff、嵌入式预览、PR 监控和并行会话。如果你不习惯终端操作、需要直观地审查代码改动、或者想同时推进多个任务，Desktop 值得试试。已经在用 CLI 的用户也不用纠结选哪个，两个同时开着各取所长就行。

**下一篇**：[精读官方文档：Claude Code 设置](/2026/03/17/ai-tools/official-docs/settings/) - 深入了解配置文件、权限模式和使用场景。

---

*本文精读自 [开始使用桌面应用](https://code.claude.com/docs/zh-CN/desktop-quickstart)*

*最后更新：2026-03-31*
