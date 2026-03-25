---
title: 精读官方文档：JetBrains IDEs
date: 2026-03-12 23:00:00
updated: 2026-03-25 16:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 19
description: Claude Code 可以与 JetBrains 系列 IDE（IntelliJ、PyCharm、WebStorm 等）深度集成，提供 Diff 查看、自动上下文共享、诊断信息同步等功能。本文详解安装配置和常见问题。
cover: https://picsum.photos/seed/claude-jetbrains/1920/1080
source_url: https://code.claude.com/docs/en/jetbrains
---

# 精读官方文档：JetBrains IDEs

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。如果你是 JetBrains 用户（IntelliJ、PyCharm、WebStorm 等），这篇能帮你把 Claude Code 无缝嵌入日常工作流。

---

## 一、这个功能是什么

Claude Code 是一个终端优先的 AI 编程助手。虽然你可以直接在任意终端里运行它，但如果配合 JetBrains IDE 使用官方插件，体验会大幅提升——代码变更可以直接在 IDE 的 Diff 查看器里预览，你选中的代码块会自动传给 Claude，IDE 里的报错信息也能实时同步。

简单说：**不用再在终端和 IDE 之间来回切换了**。

<!-- more -->

---

## 二、官方教程精读

### 2.1 支持的 IDE 列表

Claude Code 的 JetBrains 插件支持大多数 JetBrains 系 IDE：

| IDE | 说明 |
|-----|------|
| IntelliJ IDEA | Java/Kotlin 开发首选 |
| PyCharm | Python 开发 |
| Android Studio | Android 应用开发 |
| WebStorm | 前端/Node.js 开发 |
| PhpStorm | PHP 开发 |
| GoLand | Go 语言开发 |

### 2.2 核心功能

**1. 快速启动**

不用切到终端输入 `claude`，直接用快捷键呼出：

- **Mac**: `Cmd + Esc`
- **Windows/Linux**: `Ctrl + Esc`

也可以点击 IDE 界面上的 Claude Code 按钮启动。

**2. Diff 查看**

这是我最喜欢的功能。Claude 建议的代码修改不会在终端里以纯文本显示，而是直接弹出 IDE 原生的 Diff 查看器——左边是原代码，右边是建议修改，一目了然。

**3. 自动上下文共享**

当你选中一段代码后呼出 Claude，插件会自动把当前文件路径和选中范围传过去。你不需要手动输入 "我在看 `UserService.java` 的 50-75 行"。

**4. 文件引用快捷键**

想在对话中引用特定文件或代码行？用这个快捷键：

- **Mac**: `Cmd + Option + K`
- **Windows/Linux**: `Alt + Ctrl + K`

会自动插入类似 `@File#L1-99` 的引用格式。

**5. 诊断信息同步**

IDE 里的 lint 错误、语法报错、红色波浪线——这些诊断信息会自动共享给 Claude。你直接说"帮我修复这些 TypeScript 错误"就行，不用复制粘贴错误信息。

### 2.3 安装步骤

**前置条件**：必须先安装 Claude Code CLI。如果还没装，运行：

```bash
npm install -g @anthropic-ai/claude-code
```

**插件安装**：

1. 打开 JetBrains IDE
2. 进入 `Settings` → `Plugins` → `Marketplace`
3. 搜索 "Claude Code [Beta]"
4. 点击 Install，然后重启 IDE

### 2.4 使用方式

**方式一：从 IDE 内置终端启动（推荐）**

打开 IDE 的内置终端，进入项目根目录，运行：

```bash
claude
```

这样所有集成功能都会自动激活。

**方式二：从外部终端连接**

如果你在外部终端运行 `claude`，可以用 `/ide` 命令连接到正在运行的 JetBrains IDE：

```bash
claude
> /ide
```

**注意**：确保 Claude 运行的目录和 IDE 打开的项目根目录一致，否则 Claude 访问的文件可能和 IDE 不同步。

### 2.5 配置选项

**Claude Code 侧配置**

在 Claude Code 里设置 Diff 工具自动检测：

```bash
claude
> /config
# 将 diff tool 设置为 auto
```

**插件侧配置**

路径：`Settings` → `Tools` → `Claude Code [Beta]`

| 设置项 | 说明 |
|--------|------|
| Claude command | 自定义 Claude 命令路径，如 `/usr/local/bin/claude` 或 `npx @anthropic/claude` |
| Suppress notification for Claude command not found | 勾选后不再弹出"找不到 claude 命令"的通知 |
| Enable using Option+Enter for multi-line prompts | macOS 专用，启用后 Option+Enter 可在提示词中换行 |
| Enable automatic updates | 自动检查并安装插件更新 |

**ESC 键配置**

如果 ESC 键无法中断 Claude 的操作，需要调整终端设置：

1. 进入 `Settings` → `Tools` → `Terminal`
2. 二选一：
   - 取消勾选 "Move focus to the editor with Escape"
   - 或点击 "Configure terminal keybindings"，删除 "Switch focus to Editor" 快捷键

### 2.6 特殊场景配置

**远程开发（Remote Development）**

如果你用 JetBrains 的远程开发功能（比如 SSH 到服务器开发），**插件必须安装在远程主机上**，不是本地客户端。

安装路径：`Settings` → `Plugin (Host)`

**WSL 配置**

Windows Subsystem for Linux 环境可能需要额外配置：

- 终端配置调整
- 网络模式设置
- 防火墙规则更新

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

**问题一：插件装好了但功能不生效**

我在 PyCharm 里装了插件，但在外部终端运行 `claude` 时，Diff 查看和上下文共享都没生效。

**问题二：ESC 键被 IDE 劫持**

按 ESC 想中断 Claude 的输出，结果焦点直接跳回编辑器，Claude 还在继续跑。

**问题三：远程开发时插件找不到**

用 IntelliJ 的 SSH 远程开发功能，本地装了插件但远程环境里没有，导致功能完全不工作。

### 3.2 我的解决方案

**解决问题一**：必须从 IDE 的内置终端启动 Claude，而不是外部终端。或者用 `/ide` 命令手动连接。

**解决问题二**：按上面 2.5 节的方法，在 Terminal 设置里取消 ESC 的焦点切换行为。

**解决问题三**：远程开发时，在 IDE 里找 `Settings` → `Plugin (Host)`，在远程主机上安装插件。

### 3.3 我的建议

1. **养成用内置终端的习惯**：虽然外部终端也行，但内置终端 + 插件才是完整体验
2. **Diff 功能是核心价值**：如果发现代码变更只在终端显示，说明集成没生效，检查配置
3. **远程开发要特别注意**：本地装插件没用，必须在远程主机上装

---

## 四、常见问题

**Q: 点击 Claude 图标提示 "command not found"？**

A: 说明 Claude Code CLI 没装好或者不在 PATH 里。验证方法：

```bash
npm list -g @anthropic-ai/claude-code
```

如果显示已安装但还是找不到，在插件设置里手动配置 Claude 命令的完整路径。

**Q: IDE 没有被检测到？**

A: 按顺序排查：
1. 确认插件已安装且启用
2. 完全重启 IDE（有时需要重启多次）
3. 确认你是从内置终端运行 `claude`
4. WSL 用户参考官方 WSL 故障排除指南

**Q: 插件显示 Beta，稳定吗？**

A: 目前确实还是 Beta 版本，偶尔会有终端输出抖动、焦点抢占等问题。但核心功能（Diff 查看器集成、上下文共享）是稳定的，值得一用。

**Q: 安全方面有什么要注意的？**

A: 官方文档提醒，如果开启了 auto-edit 模式，Claude 可能修改 IDE 配置文件，这些文件可能在 IDE 启动时自动执行。建议：
- 使用手动确认模式审核修改
- 只对可信的提示词开启自动编辑
- 留意 Claude 有权限修改哪些文件

---

## 五、小结

JetBrains 插件让 Claude Code 从"终端工具"升级为"IDE 原生体验"。核心价值是 Diff 查看器集成和自动上下文共享——这两个功能能显著减少你在终端和编辑器之间的切换频率。

目前插件还在 Beta 阶段，偶尔有体验问题，但对于日常开发已经足够实用。

**下一篇**：[精读官方文档：VS Code](/2026/03/12/vscode/)

---

*本文精读自 [JetBrains IDEs - Claude Code Docs](https://code.claude.com/docs/en/jetbrains)*

*最后更新：2026-03-25*
