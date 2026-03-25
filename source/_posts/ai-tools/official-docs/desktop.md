---
title: 精读官方文档：Claude Code VS Code 扩展
date: 2026-03-16 23:00:00
updated: 2026-03-25 16:15:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 15
description: Claude Code 的 VS Code 扩展让你无需离开编辑器就能使用 AI 编程助手。本文详解安装配置、核心功能和实战技巧。
cover: https://picsum.photos/seed/claude-vscode/1920/1080
source_url: https://code.claude.com/docs/zh-CN/desktop
---

# 精读官方文档：Claude Code VS Code 扩展

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code VS Code 扩展是 Anthropic 官方推出的 IDE 集成方案，让你在 VS Code 里直接使用 Claude Code 的全部能力。

简单说，你不用在终端和编辑器之间来回切换了。Claude 会：
- **读取你的代码**：自动感知当前文件和选中的代码
- **修改代码**：直接在编辑器里展示修改建议（Inline Diff）
- **运行命令**：可以执行终端命令（需要你确认）

这比纯终端版本更直观，特别适合喜欢图形界面的开发者。

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装要求

| 项目 | 最低要求 |
|------|---------|
| VS Code 版本 | 1.98.0 或更高 |
| 订阅 | Claude Pro、Max、Team 或 Enterprise |
| 操作系统 | macOS、Linux、Windows（需 WSL） |

**安装步骤：**

1. 打开 VS Code，按 `Ctrl+Shift+X`（Windows/Linux）或 `Cmd+Shift+X`（Mac）打开扩展面板
2. 搜索 "Claude Code"
3. 找到 **Anthropic** 发布的官方扩展（有蓝色认证标志），点击 Install

```bash
# 或者用命令行安装
code --install-extension anthropic.claude-code
```

安装完成后，VS Code 侧边栏会出现 Claude 图标。

### 2.2 认证登录

首次使用需要登录 Claude 账号：

1. 点击侧边栏的 Claude 图标
2. 点击 "Sign in with Anthropic"
3. 浏览器会打开授权页面，完成登录后自动返回 VS Code

**认证方式说明：**

| 认证方式 | 适用场景 |
|---------|---------|
| Console 账号 | Pro/Max/Team/Enterprise 订阅用户 |
| API Key | 企业自定义部署（需配置 `ANTHROPIC_API_KEY` 环境变量） |

### 2.3 核心功能

#### Inline Diff（行内差异显示）

Claude 修改代码时，会在编辑器里直接显示修改前后的对比：

```
┌─────────────────────────────────┐
│ - const data = fetch(url);      │  ← 红色：删除的代码
│ + const data = await fetch(url);│  ← 绿色：新增的代码
└─────────────────────────────────┘
   [Accept] [Reject] [Edit]
```

你可以选择接受、拒绝或手动编辑每处改动。

#### @-mentions（上下文引用）

在对话里用 `@` 符号引入代码上下文：

```
@src/utils.ts 帮我重构这个文件的错误处理逻辑
```

支持的引用类型：
- `@文件名` - 引入整个文件
- `@文件夹/` - 引入文件夹内容
- `@#符号名` - 引入特定函数或类

#### Plan Review（计划审核）

对于复杂任务，Claude 会先展示执行计划，等你确认后再动手：

```markdown
## 执行计划

1. 分析现有的认证流程
2. 设计新的 token 刷新机制
3. 更新 auth.ts 文件
4. 添加单元测试

是否继续？[Yes] [No] [Modify]
```

### 2.4 Terminal 模式切换

如果你更喜欢终端风格的交互，可以切换回 Terminal 模式：

**方法一：VS Code 设置**
```json
// settings.json
{
  "claude-code.useTerminal": true
}
```

**方法二：命令面板**
1. 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac）
2. 搜索 "Claude Code: Use Terminal"
3. 选择切换

### 2.5 键盘快捷键

| 快捷键 | 功能 |
|-------|------|
| `Cmd+Escape`（Mac）/ `Ctrl+Escape`（Win） | 打开 Claude Code 面板 |
| `Cmd+Shift+Escape` | 清除当前对话，开始新对话 |
| `Escape` | 关闭面板 |

**自定义快捷键：**

在 Claude Code 里运行 `/keybindings` 命令，会创建配置文件：

```json
// ~/.claude/keybindings.json
{
  "openPanel": "cmd+shift+c",
  "newChat": "cmd+shift+n",
  "closePanel": "escape"
}
```

### 2.6 高级功能

部分高级功能需要在命令行配置后才能在 VS Code 扩展里使用：

| 功能 | 说明 |
|------|------|
| MCP（Model Context Protocol） | 连接外部工具和服务 |
| Subagents | 创建专门的子代理处理特定任务 |
| 自定义 Slash Commands | `/review`、`/test` 等自定义命令 |

```bash
# 在终端配置 MCP
claude mcp add my-server -- npx -y @my/mcp-server

# 配置后 VS Code 扩展自动可用
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

**问题 1：Windows 上扩展无法正常工作**

在 Windows 原生环境下安装后，扩展一直显示 "Connecting..."，无法连接到 Claude 服务。

**问题 2：Inline Diff 不显示**

有时候 Claude 修改代码，差异显示在侧边面板里而不是编辑器里，很难看清楚改动位置。

**问题 3：终端模式下快捷键冲突**

使用 Terminal 模式时，`Shift+Enter` 发送消息和 VS Code 默认行为冲突。

### 3.2 我的解决方案

**Windows 解决方案：**

```bash
# 安装 WSL（Windows Subsystem for Linux）
wsl --install

# 在 WSL 里安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 在 WSL 里使用 VS Code Remote
code .
```

然后在 WSL 环境里安装 Claude Code 扩展，一切正常。

**Inline Diff 配置：**

```json
// settings.json
{
  "claude-code.diff.preferredView": "editor",
  "claude-code.diff.autoShow": true
}
```

**快捷键配置：**

在 VS Code 的 `keybindings.json` 里添加：

```json
[
  {
    "key": "shift+enter",
    "command": "claude-code.sendMessage",
    "when": "claude-code.terminalFocus"
  }
]
```

### 3.3 我的建议

1. **先在终端版本熟悉 Claude Code**：VS Code 扩展是终端版本的封装，了解基础命令（如 `/help`、`/config`）能帮你更好地使用扩展

2. **大项目用 @-mentions**：几十个文件的项目，直接 `@` 引入比让 Claude 自己搜索更准确

3. **复杂改动先看 Plan**：让 Claude 先出计划，避免它改错方向浪费 token

4. **善用 `.claude/settings.json`**：把常用权限配置好，减少确认次数

```json
// .claude/settings.json 示例
{
  "permissions": {
    "allow": ["Read", "Edit", "Write", "Bash"],
    "deny": []
  }
}
```

---

## 四、常见问题

**Q: VS Code 扩展和终端版本有什么区别？**

A: 核心能力一样，主要区别是交互方式：
- 终端版本：命令行界面，纯文本交互
- VS Code 扩展：图形界面，Inline Diff，编辑器集成

功能上，部分高级配置（如 MCP、Subagents）仍需通过命令行设置。

**Q: 用 Pro 订阅会产生额外费用吗？**

A: 不会。VS Code 扩展使用的是你订阅的额度，没有额外 API 费用。但要注意使用量，复杂任务消耗的 token 会更多。

**Q: 为什么 Claude 有时候不直接改代码，而是输出代码块让我自己复制？**

A: 这通常发生在 Claude 不确定改动是否正确时。你可以明确说"直接修改文件"让它动手。另外，检查 `.claude/settings.json` 里是否有 `Edit` 或 `Write` 的权限。

**Q: 如何在多个项目间切换？**

A: 每个工作区（Workspace）有独立的对话历史。打开不同文件夹时，Claude Code 会自动加载对应的上下文。

---

## 五、小结

Claude Code VS Code 扩展让 AI 编程助手真正融入开发流程。核心要点：
- 安装要求：VS Code 1.98.0+，Claude Pro 及以上订阅
- 杀手功能：Inline Diff、@-mentions、Plan Review
- Windows 用户：需要 WSL 环境
- 高级配置：通过命令行设置 MCP 和 Subagents

**下一篇**：[Desktop 快速开始](/2026/03/15/ai-tools/official-docs/desktop-quickstart/) - 体验桌面应用的快速上手流程。

---

*本文精读自 [Use Claude Code in VS Code](https://code.claude.com/docs/en/vs-code)*

*最后更新：2026-03-25*
