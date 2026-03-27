---
title: 精读官方文档：在 VS Code 中使用 Claude Code
date: 2026-03-14 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 17
description: VS Code 扩展是 Claude Code 的图形化界面版本，支持 inline diffs、@-mentions 引用文件、Plan 模式审批计划、checkpoints 回滚代码等功能。
cover: https://picsum.photos/seed/claude-vs-code/1920/1080
source_url: https://code.claude.com/docs/zh-CN/vs-code
---

# 精读官方文档：在 VS Code 中使用 Claude Code

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 的 VS Code 扩展是一个原生图形界面，让你在 IDE 里直接使用 Claude Code 的全部能力。相比命令行版本，它的优势在于：

- **可视化 Diff**：代码改动直接在编辑器里以 diff 形式展示
- **Plan 模式**：Claude 会先写计划，你审批后再执行
- **多会话**：可以同时开多个对话窗口，并行处理不同任务
- **Checkpoints 回滚**：随时撤销到对话中的任意节点

简单说，如果你习惯了 VS Code 的开发体验，这个扩展能让你几乎不用切换到终端就能完成所有 AI 辅助编程工作。

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装与前提条件

**前提条件：**
- VS Code 1.98.0 或更高版本
- 一个 Anthropic 账号（首次打开扩展时会要求登录）

**安装方式：**

方式一：快捷键安装
```bash
# Mac: Cmd+Shift+X
# Windows/Linux: Ctrl+Shift+X
# 搜索 "Claude Code" 并点击 Install
```

方式二：直接点击官方链接
- [Install for VS Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)
- [Install for Cursor](https://marketplace.cursorapi.com/items?itemName=anthropic.claude-code)

### 2.2 提示框功能详解

安装完成后，VS Code 右侧会出现 Claude 面板。提示框支持以下核心功能：

**权限模式切换：**
点击提示框底部的模式指示器可以切换：
- **Normal 模式**：每次操作前询问确认
- **Plan 模式**：Claude 先描述要做什么，等你批准后再改代码
- **Auto-accept 模式**：Claude 直接修改，不询问

**命令菜单（输入 `/` 打开）：**
- `/compact` - 手动压缩上下文
- `/usage` - 查看用量统计
- `/model` - 切换模型
- `/mcp` - 管理 MCP 服务器
- `/plugins` - 管理插件

**多行输入：**
```bash
# Mac: Shift+Enter 换行不发送
# Windows/Linux: Shift+Enter 换行不发送
```

### 2.3 @-mentions 引用文件和文件夹

用 `@` 符号可以让 Claude 读取特定文件或目录的内容：

```markdown
> 解释 @auth 的逻辑（模糊匹配 auth.js, AuthService.ts 等）

> @src/components/ 里有什么（文件夹要加斜杠）

> @app.ts#5-10 这几行代码什么意思（指定行号范围）
```

**快捷键插入引用：**
```bash
# Mac: Option+K
# Windows/Linux: Alt+K
# 自动插入当前文件路径和选中行号
```

### 2.4 引用终端输出

使用 `@terminal:name` 格式引用终端输出，其中 `name` 是终端的标题：

```markdown
> @terminal:build 看看构建报了什么错
```

这样 Claude 能看到命令输出、错误信息或日志，无需复制粘贴。

### 2.5 恢复过去的对话

点击 Claude Code 面板顶部的下拉菜单访问对话历史：

- 按关键字搜索
- 按时间浏览（今天、昨天、过去 7 天等）
- 点击任意对话恢复完整消息历史

新会话会根据第一条消息生成 AI 标题。悬停在会话上可以：
- **重命名**：给它一个描述性标题
- **删除**：从列表中移除

### 2.6 键盘快捷键

| 命令 | 快捷键 | 说明 |
|------|--------|------|
| Focus Input | `Cmd+Esc` (Mac) / `Ctrl+Esc` (Win) | 在编辑器和 Claude 面板间切换焦点 |
| Open in New Tab | `Cmd+Shift+Esc` (Mac) / `Ctrl+Shift+Esc` (Win) | 在新标签页打开新对话 |
| New Conversation | `Cmd+N` (Mac) / `Ctrl+N` (Win) | 开始新对话（需要 Claude 面板聚焦） |
| Insert @-Mention | `Option+K` (Mac) / `Alt+K` (Win) | 插入当前文件和选区的引用（需要编辑器聚焦） |

### 2.7 VS Code 扩展配置项

打开 VS Code 设置（`Cmd+,` 或 `Ctrl+,`），进入 Extensions → Claude Code：

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `selectedModel` | `default` | 新对话使用的模型，可在对话中用 `/model` 临时切换 |
| `useTerminal` | `false` | 是否用终端模式替代图形面板 |
| `initialPermissionMode` | `default` | 新对话的权限模式：`default`/`plan`/`acceptEdits`/`auto`/`bypassPermissions` |
| `preferredLocation` | `panel` | Claude 打开位置：`sidebar`（右侧边栏）或 `panel`（新标签页） |
| `autosave` | `true` | Claude 读写文件前自动保存 |
| `useCtrlEnterToSend` | `false` | 用 Ctrl/Cmd+Enter 发送而非 Enter |
| `respectGitIgnore` | `true` | 搜索文件时排除 .gitignore 中的模式 |
| `disableLoginPrompt` | `false` | 跳过登录提示（用于第三方提供商配置） |

**配置示例（settings.json）：**

```json
{
  "claudeCode.selectedModel": "claude-sonnet-4-20250514",
  "claudeCode.initialPermissionMode": "plan",
  "claudeCode.preferredLocation": "sidebar",
  "claudeCode.autosave": true
}
```

### 2.8 Plugins 管理

VS Code 扩展内置了 Plugins 图形管理界面。在提示框输入 `/plugins` 打开。

**安装 Plugins：**

- **已安装的 plugins**：显示在顶部，可切换启用/禁用
- **可用的 plugins**：来自配置的 marketplaces，显示在下方
- 点击任意 plugin 的**安装**按钮

安装时选择范围：
- **为您安装**：所有项目可用（用户范围）
- **为此项目安装**：与协作者共享（项目范围）
- **本地安装**：仅自己可见，仅此仓库（本地范围）

**管理 Marketplaces：**

切换到 **Marketplaces** 选项卡：
- 输入 GitHub 仓库、URL 或本地路径添加新源
- 点击刷新图标更新 plugin 列表
- 点击垃圾桶图标删除 marketplace

### 2.9 Chrome 浏览器集成

将 Claude 连接到 Chrome 浏览器，可以在 VS Code 里：
- 测试 Web 应用
- 使用控制台日志调试
- 自动化浏览器工作流

**前提条件：** Claude in Chrome 扩展版本 1.0.36 或更高

**使用方式：**

```markdown
> @browser go to localhost:3000 and check the console for errors
```

Claude 会为新任务打开浏览器标签页，并共享你的登录状态，可以访问已登录的网站。

也可打开附件菜单选择特定浏览器工具，如打开新标签页或读取页面内容。

### 2.10 从外部工具打开 VS Code 标签页

扩展注册了 URI 处理程序：`vscode://anthropic.claude-code/open`

可以从 shell 别名、浏览器书签或脚本打开 Claude Code 标签页：

```bash
# macOS
open "vscode://anthropic.claude-code/open"

# Linux
xdg-open "vscode://anthropic.claude-code/open"

# Windows
start "vscode://anthropic.claude-code/open"
```

**支持的查询参数：**

| 参数 | 说明 |
|------|------|
| `prompt` | 预填充的文本（需 URL 编码），不自动提交 |
| `session` | 要恢复的会话 ID，会话需属于当前工作区 |

示例：预填充 "review my changes"

```bash
vscode://anthropic.claude-code/open?prompt=review%20my%20changes
```

### 2.11 Checkpoints 回滚功能

扩展支持 checkpoints，可以追踪 Claude 的文件修改并回滚。悬停在任意消息上会出现回滚按钮：

- **Fork conversation from here**：从此消息分叉出新对话，保留所有代码改动
- **Rewind code to here**：回退文件到此节点的状态，保留完整对话历史
- **Fork conversation and rewind code**：分叉对话并回退代码

### 2.12 CLI vs 扩展功能对比

| 功能 | CLI | VS Code 扩展 |
|------|-----|--------------|
| 命令和技能 | 全部 | 子集（输入 `/` 查看） |
| MCP 服务器配置 | 完整 | 部分（用 CLI 添加，用 `/mcp` 管理） |
| Checkpoints | 是 | 是 |
| `!` bash 快捷 | 是 | 否 |
| Tab 补全 | 是 | 否 |

如果需要 CLI 独有功能，可以在 VS Code 集成终端（`` Ctrl+` `` 或 `` Cmd+` ``）中运行 `claude`。

### 2.13 内置 IDE MCP 服务器

扩展运行时会启动一个本地 MCP 服务器，让 CLI 连接。这个服务器提供了两个工具：

| 工具名 | 功能 | 会写文件？ |
|--------|------|-----------|
| `mcp__ide__getDiagnostics` | 返回 VS Code Problems 面板中的错误和警告 | 否 |
| `mcp__ide__executeCode` | 在 Jupyter notebook 内核中执行 Python 代码 | 是 |

**安全设计：**
- 服务器绑定到 `127.0.0.1` 的随机高端口，外部无法访问
- 每次激活生成新的随机认证令牌
- 令牌存放在 `~/.claude/ide/` 下，权限为 `0600`

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

**问题一：找不到 Spark 图标**

安装完扩展后，我在编辑器右上角找不到 Claude 的 Spark 图标。一开始以为是安装失败了。

**原因**：Spark 图标需要**打开一个文件**才会出现在编辑器工具栏。只打开文件夹是不够的。

**问题二：Plan 模式下不知道怎么审批**

第一次用 Plan 模式时，Claude 写好了计划，但我不知道在哪里审批。

**原因**：VS Code 会自动把计划作为完整的 Markdown 文档打开，你可以在文档里添加行内注释给出反馈，然后批准执行。

### 3.2 我的解决方案

**针对图标不显示：**

1. 先打开任意代码文件
2. 如果还是没有，检查 VS Code 版本（需要 1.98.0+）
3. 尝试 "Developer: Reload Window" 命令
4. 如果还不行，点击状态栏右下角的 "✱ Claude Code"

**针对多任务并行：**

我习惯把 Claude 拖到右侧边栏（Secondary Sidebar），这样编码时 Claude 保持可见。然后用 `Cmd+Shift+Esc` 在新标签页打开第二个对话，处理不同的任务。

**推荐配置：**

```json
{
  "claudeCode.preferredLocation": "sidebar",
  "claudeCode.initialPermissionMode": "plan",
  "claudeCode.enableNewConversationShortcut": true
}
```

### 3.3 我的建议

1. **先用 Plan 模式**：刚开始用时建议把 `initialPermissionMode` 设为 `plan`，这样能清楚看到 Claude 要做什么再批准，避免误改代码。

2. **善用 @-mentions**：让 Claude 聚焦在特定文件或代码段，比让它"全局搜索"更高效。用 `Option+K` / `Alt+K` 快捷键快速插入引用。

3. **CLI 和扩展结合用**：有些高级功能（如完整的 MCP 配置）只能用 CLI。我一般在集成终端里跑 `claude mcp add` 命令，然后在扩展里用 `/mcp` 管理。

---

## 四、常见问题

**Q: Spark 图标不显示怎么办？**

A: 确保打开了一个文件（不只是文件夹），检查 VS Code 版本 >= 1.98.0，尝试重新加载窗口。或者直接点击状态栏右下角的 "✱ Claude Code"。

**Q: 扩展和 CLI 的对话历史互通吗？**

A: 是的，共享同一份历史。在终端运行 `claude --resume` 可以继续扩展中的对话。

**Q: 如何引用终端输出？**

A: 使用 `@terminal:name` 格式，其中 `name` 是终端的标题。这样 Claude 能看到命令输出、错误信息或日志。

**Q: 扩展能自动修改代码吗？**

A: 可以。把 `initialPermissionMode` 设为 `acceptEdits` 或 `auto`，Claude 就会直接修改代码而不询问。但建议先在沙箱环境测试。

**Q: 如何在扩展里配置 MCP？**

A: 用 CLI 添加：`claude mcp add --transport http github https://api.githubcopilot.com/mcp/`，然后在扩展里用 `/mcp` 管理已配置的服务器。

---

## 五、小结

VS Code 扩展让 Claude Code 的使用更直观：可视化 diff、Plan 模式审批、多会话并行、checkpoints 回滚，这些功能让 AI 辅助编程更可控也更安全。记住核心快捷键 `Cmd+Esc` 切换焦点、`Option+K` 插入文件引用，配合 `@-mentions` 精准给 Claude 提供上下文，效率会高很多。

**下一篇**：继续阅读 [Checkpoints 回滚功能精读](/2026/03/14/checkpoints/)。

---

*本文精读自 [在 VS Code 中使用 Claude Code](https://code.claude.com/docs/zh-CN/vs-code)*

*最后更新：2026-03-25*
