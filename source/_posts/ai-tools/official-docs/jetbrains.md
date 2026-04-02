---
title: 精读官方文档：JetBrains IDEs
date: 2026-03-12 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 19
description: Claude Code 通过专用 JetBrains 插件实现 IDE 深度集成，提供交互式差异查看、选择上下文共享、诊断信息同步。本文详解安装配置、远程开发注意事项和安全风险。
cover: https://picsum.photos/seed/claude-jetbrains/1920/1080
source_url: https://code.claude.com/docs/zh-CN/jetbrains
---

# 精读官方文档：JetBrains IDEs

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。如果你用 JetBrains 系列 IDE 写代码，这篇能帮你把 Claude Code 变成 IDE 的一部分，而不是一个独立的外挂工具。

---

## 一、这个功能是什么

Claude Code 是终端优先的 AI 编程助手，但它和 JetBrains IDE 搭配使用时体验最好。官方提供了一个专用插件，让 Claude 的代码变更直接在 IDE 的 Diff 查看器（一种可视化对比工具，左边显示原代码、右边显示修改后的代码）里预览，你选中的代码和 IDE 里的报错信息也会自动共享给 Claude。

核心价值就一句话：**不用在终端和 IDE 之间来回切换**。

目前支持的 IDE 覆盖了 JetBrains 家族的主力产品：

| IDE | 适用场景 |
|-----|---------|
| IntelliJ IDEA | Java / Kotlin 开发 |
| PyCharm | Python 开发 |
| Android Studio | Android 应用开发 |
| WebStorm | 前端 / Node.js 开发 |
| PhpStorm | PHP 开发 |
| GoLand | Go 语言开发 |

> 所有 IDE 的插件配置入口一致：`Settings` → `Tools` → `Claude Code [Beta]`

<!-- more -->

---

## 二、官方教程精读

### 2.1 五大核心功能

插件激活后，你会获得以下能力：

| 功能 | 快捷键（Mac） | 快捷键（Win/Linux） | 说明 |
|------|--------------|-------------------|------|
| 快速启动 | `Cmd + Esc` | `Ctrl + Esc` | 从编辑器直接打开 Claude Code |
| 差异查看 | 自动触发 | 自动触发 | 代码变更在 IDE 原生 Diff 查看器中显示 |
| 选择上下文 | 自动触发 | 自动触发 | 当前选中代码 / 标签页自动共享给 Claude |
| 文件引用 | `Cmd + Option + K` | `Alt + Ctrl + K` | 插入 `@File#L1-99` 格式引用 |
| 诊断同步 | 自动触发 | 自动触发 | lint 错误、语法报错自动同步给 Claude |

其中 **差异查看** 是最值得关注的。没有插件时，Claude 建议的代码修改只会在终端里以纯文本展示，阅读体验很差。接入 IDE 后，变更会以标准的 Diff 视图呈现，接受或拒绝都很直观。

**选择上下文** 也省了不少事——选中一段代码后呼出 Claude，插件会自动把文件路径和选中范围传过去，不需要你手动说明"我在看 `UserService.java` 的第 50-75 行"。

### 2.2 安装与使用

**前置条件**：先装好 Claude Code CLI。

```bash
# 安装 Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

**插件安装**：在 IDE 中进入 `Settings` → `Plugins` → `Marketplace`，搜索 "Claude Code [Beta]"，点击 Install 后重启 IDE。

启动方式有两种，推荐第一种：

```bash
# 方式一：从 IDE 内置终端启动（推荐）
# 打开 IDE 的内置终端，确保在项目根目录，然后运行：
claude

# 方式二：从外部终端连接 IDE
claude
> /ide
```

方式一是首选，因为所有集成功能会自动激活。方式二需要额外执行 `/ide` 命令手动连接，而且必须确保 Claude 运行的目录和 IDE 打开的项目根目录一致。

### 2.3 配置与特殊场景

**Claude Code 侧配置**

要让 Diff 查看器生效，需要把 diff tool 设为 `auto`，这样 Claude 会自动检测 IDE 环境：

```bash
claude
> /config
# 将 diff tool 设置为 auto
```

**插件侧配置**

路径：`Settings` → `Tools` → `Claude Code [Beta]`

| 设置项 | 说明 | 平台限制 |
|--------|------|---------|
| Claude command | 自定义 Claude 命令路径，支持 `claude`、`/usr/local/bin/claude` 或 `npx @anthropic/claude` | 无 |
| Suppress notification for Claude command not found | 勾选后不再弹出"找不到 claude 命令"的通知 | 无 |
| Enable using Option+Enter for multi-line prompts | 启用后 Option+Enter 可在提示词中换行；如 Option 键被意外捕获则禁用（需重启终端） | 仅 macOS |
| Enable automatic updates | 自动检查并安装插件更新，重启时应用 | 无 |

**ESC 键冲突修复**

JetBrains 终端有个默认行为：按 ESC 会把焦点从终端切回编辑器。这在 Claude Code 里是个大问题——你想按 ESC 中断 Claude 的输出，结果焦点跑了，Claude 还在继续跑。

修复方法：

1. 进入 `Settings` → `Tools` → `Terminal`
2. 二选一：
   - 取消勾选 "Move focus to the editor with Escape"
   - 或点击 "Configure terminal keybindings"，删除 "Switch focus to Editor" 快捷键

**远程开发**

用 JetBrains 的远程开发功能（比如 SSH 到服务器写代码）时，**插件必须安装在远程主机上**，不是本地客户端。这是最常见的配置错误。

安装路径：`Settings` → `Plugin (Host)`

**WSL 环境**

Windows Subsystem for Linux 环境可能需要额外配置终端、网络模式和防火墙规则，详细步骤参考官方 [WSL 故障排除指南](https://code.claude.com/docs/zh-CN/wsl)。

**安全风险：auto-edit 模式**

官方文档明确提醒：开启 auto-edit 模式后，Claude 可能修改 IDE 配置文件，而这些文件会在 IDE 启动时自动执行。建议始终保持手动确认模式（manual approve），只对高度信任的提示词场景开启自动编辑。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 插件装好了但 Diff 查看不生效

第一次用的时候，我在 PyCharm 里装好插件，然后在外部终端（iTerm2）运行 `claude`。结果代码变更只在终端里以纯文本显示，Diff 查看器完全不弹出。

原因很简单：外部终端启动时 Claude 感知不到 IDE 环境。解决方法是改用 IDE 内置终端启动，或者每次启动后手动执行 `/ide` 连接。后来我养成了习惯——只要用 JetBrains，就在内置终端里跑 Claude。

### 3.2 ESC 键被 IDE 劫持

这个问题困扰了我一阵。在终端里按 ESC 想中断 Claude 的输出，结果焦点直接跳回编辑器，Claude 的输出还在继续刷屏。后来查到是 JetBrains Terminal 的默认快捷键冲突，按 2.3 节的方法取消 ESC 的焦点切换后解决。

### 3.3 远程开发时插件找不到

用 IntelliJ 的 SSH 远程开发连到服务器，本地装了插件但功能不工作。折腾了半天才发现：远程开发场景下插件要装在远程主机上，不是本地。在 `Settings` → `Plugin (Host)` 里安装后一切正常。这个坑官方文档写得很清楚，但第一次用很容易忽略。

### 3.4 auto-edit 的安全建议

我之前为了方便开启了 auto-edit 模式，后来发现 Claude 确实会修改 `.idea/` 目录下的配置文件。虽然没出过实际问题，但想想配置文件在 IDE 启动时自动执行，还是有点风险。现在的做法是：日常使用手动确认模式，只有批量重构这种需要大量操作的场景才临时开启 auto-edit，操作完立刻关掉。

---

## 四、常见问题

### 插件不工作 / IDE 未检测到

按以下顺序排查：

1. 确认从 IDE 内置终端运行 `claude`，并且当前目录是项目根目录
2. 检查插件在 IDE 设置中是否启用（`Settings` → `Plugins` → `Installed`）
3. 完全重启 IDE（有时需要重启两次才能生效）
4. 远程开发场景：确认插件安装在远程主机（`Settings` → `Plugin (Host)`）
5. WSL 用户：参考 [WSL 故障排除指南](https://code.claude.com/docs/zh-CN/wsl)

### 命令未找到

点击 Claude 图标时提示 "command not found"，说明 CLI 没装好或不在 PATH 中：

```bash
# 验证 CLI 是否已安装
npm list -g @anthropic-ai/claude-code
```

如果已安装但 IDE 还是找不到，在插件设置（`Settings` → `Tools` → `Claude Code [Beta]`）中手动配置 Claude 命令的完整路径，比如 `/usr/local/bin/claude`。WSL 用户需要使用对应的 WSL 命令格式。

---

## 五、小结

JetBrains 插件的核心价值是 **Diff 查看器集成** 和 **自动上下文共享**——这两个功能把 Claude Code 从"终端里的独立工具"变成了"IDE 的一部分"。目前插件还在 Beta 阶段，偶尔有终端输出抖动、焦点抢占等小问题，但核心功能稳定可用。

几点提醒：从内置终端启动是关键，ESC 键冲突记得修复，远程开发装对位置，auto-edit 模式谨慎使用。

**下一篇**：[精读官方文档：VS Code](/2026/03/12/vscode/)

---

*本文精读自 [JetBrains IDEs - Claude Code Docs](https://code.claude.com/docs/zh-CN/jetbrains)*

*最后更新：2026-03-31*
