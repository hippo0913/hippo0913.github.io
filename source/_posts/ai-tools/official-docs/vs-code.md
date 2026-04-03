---
title: 精读官方文档：在 VS Code 中使用 Claude Code
date: 2026-03-14 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 17
description: VS Code 扩展是 Claude Code 的推荐图形界面，支持 inline diffs、@-mentions 引用文件、Plan 模式审批计划、checkpoints 回滚、内置 IDE MCP 服务器等功能。
cover: https://picsum.photos/seed/claude-vs-code/1920/1080
source_url: https://code.claude.com/docs/zh-CN/vs-code
---

# 精读官方文档：在 VS Code 中使用 Claude Code

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 的 VS Code 扩展是官方推荐的图形化使用方式。它把 Claude Code 的全部能力直接集成到 IDE 里，你不用切到终端就能完成 AI 辅助编程。

和命令行版本相比，扩展有几个核心优势：

- **内联 Diff（Inline Diffs）**：代码改动直接在编辑器里以 diff 形式展示，哪里改了一目了然
- **Plan 模式**：Claude 先写计划，你审批后再执行，改什么由你说了算
- **@-Mentions 精准引用**：用 `@` 引用文件、文件夹、终端输出，给 Claude 提供精确上下文
- **多会话并行**：同时开多个对话窗口，并行处理不同任务
- **Checkpoints 回滚**：随时撤销到对话中的任意节点，不怕改坏

扩展和 CLI 共享对话历史和 `~/.claude/settings.json` 配置，两者可以互相切换、互为补充。少数高级功能（如 `!` bash 快捷、Tab 补全）只在 CLI 中可用，日常使用扩展就够了。

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装与提示框操作

**前提条件：**

- VS Code 1.98.0 或更高版本
- 一个 Anthropic 账户（首次打开扩展时会要求登录）
- 支持 VS Code 和 Cursor 两种编辑器

**安装方式：**

```bash
# 方式一：扩展市场搜索安装
# Mac: Cmd+Shift+X → 搜索 "Claude Code"
# Windows/Linux: Ctrl+Shift+X → 搜索 "Claude Code"

# 方式二：直接点击链接
# VS Code: https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code
# Cursor: https://marketplace.cursorapi.com/items?itemName=anthropic.claude-code
```

安装完成后，VS Code 右侧出现 Claude 面板。提示框底部有一排功能入口：

**权限模式切换**（点击底部模式指示器）：

| 模式 | 行为 | 适用场景 |
|---|---|---|
| **Normal**（默认） | 每次文件操作前询问确认 | 敏感项目、初次使用 |
| **Plan** | Claude 先描述计划，你审批后再改代码 | 复杂任务、需要把控改动范围 |
| **Auto-accept** | Claude 直接修改代码，不询问 | 熟练用户、快速迭代 |
| **Bypass** | 在沙箱环境中跳过所有权限检查 | CI/CD 环境、安全容器内 |

> 注意：Auto-accept 和 Bypass 模式需要 Team 计划支持。在设置中开启 `allowDangerouslySkipPermissions` 后，模式选择器中才会出现这两个选项。

**提示框其他功能：**

- **命令菜单**：输入 `/` 打开，支持 `/compact`（压缩上下文）、`/usage`（用量统计）、`/model`（切换模型）、`/mcp`（管理 MCP 服务器）、`/plugins`（管理插件）等
- **上下文指示器**：显示当前对话引用了哪些文件和上下文
- **扩展思考（Extended Thinking）**：开启后 Claude 会展示更详细的推理过程
- **多行输入**：`Shift+Enter` 换行不发送，适合写长提示词

### 2.2 @-Mentions 引用与终端输出

`@` 符号是给 Claude 提供精确上下文的核心手段，支持多种引用方式：

```markdown
<!-- 模糊匹配文件名 -->
> 解释 @auth 的逻辑
<!-- 匹配 auth.js, AuthService.ts, authentication.py 等 -->

<!-- 引用整个文件夹（末尾加斜杠） -->
> @src/components/ 里有什么组件

<!-- 指定行号范围 -->
> @app.ts#5-10 这几行代码什么意思

<!-- 引用大型 PDF 并指定页码 -->
> @report.pdf#1-5 总结前 5 页内容

<!-- 引用终端输出 -->
> @terminal:build 看看构建报了什么错
```

**快捷操作：**

- `Option+K`（Mac）/ `Alt+K`（Windows）：自动插入当前文件路径和选中行号的引用
- `Shift+拖拽文件`：从资源管理器拖文件到提示框，添加为附件
- 点击引用旁边的**选择指示器**可以切换对 Claude 可见/隐藏

选中代码时，Claude 能自动看到编辑器中当前选中的内容，不需要手动引用。

### 2.3 自定义工作流与多会话

**面板位置灵活调整：**

Claude 面板不局限于右侧边栏，你可以把它拖拽到其他位置：

- **次级边栏**（右侧第二栏）：编码时 Claude 保持可见，推荐布局
- **主边栏**：和其他面板共享左侧
- **编辑器区域**：和代码标签页并排显示

拖拽方式和普通 VS Code 面板一样：抓住面板标题栏拖到目标区域即可。

**多对话并行：**

- `Cmd+Shift+Esc`（Mac）/ `Ctrl+Shift+Esc`（Windows）：在新标签页打开新对话
- `Cmd+N`（Mac）/ `Ctrl+N`（Windows）：开始新对话（需 Claude 面板聚焦，需开启 `enableNewConversationShortcut`）

**Spark 图标状态指示器：**

编辑器右上角的 Spark 图标会显示状态点：

- **蓝色点**：有权限请求待处理（Claude 等你确认）
- **橙色点**：后台任务已完成（Claude 在等你查看结果）

**从 Claude.ai 恢复远程会话：**

如果你在 Claude.ai 网页版有正在进行的对话（需 Claude.ai Subscription 登录），可以在扩展中恢复继续。点击面板顶部的下拉菜单，找到远程会话即可。

**终端模式：**

在设置中勾选 `useTerminal`，Claude 会在集成终端中以 CLI 模式运行，保留扩展的 UI 壳但使用终端交互。

### 2.4 配置项与 Plugins 管理

VS Code 扩展有两类配置：

1. **扩展设置**：在 VS Code `settings.json` 中，以 `claudeCode.` 为前缀
2. **Claude Code 设置**（`~/.claude/settings.json`）：扩展和 CLI 共享，用于允许的命令、环境变量、hooks 和 MCP 服务器

**扩展设置完整列表：**

| 设置项 | 默认值 | 说明 |
|---|---|---|
| `selectedModel` | `default` | 新对话使用的模型，可在对话中用 `/model` 临时切换 |
| `useTerminal` | `false` | 用终端模式替代图形面板 |
| `initialPermissionMode` | `default` | 新对话的权限模式：`default`/`plan`/`acceptEdits`/`auto`/`bypassPermissions` |
| `preferredLocation` | `panel` | Claude 打开位置：`sidebar`（右侧边栏）或 `panel`（新标签页） |
| `autosave` | `true` | Claude 读写文件前自动保存 |
| `useCtrlEnterToSend` | `false` | 用 Ctrl/Cmd+Enter 发送而非 Enter |
| `enableNewConversationShortcut` | `false` | 启用 `Cmd/Ctrl+N` 开始新对话 |
| `hideOnboarding` | `false` | 隐藏新手引导 |
| `respectGitIgnore` | `true` | 搜索文件时排除 .gitignore 中的文件 |
| `environmentVariables` | `{}` | 自定义环境变量，传递给 Claude 进程 |
| `disableLoginPrompt` | `false` | 跳过登录提示（用于第三方提供商配置） |
| `allowDangerouslySkipPermissions` | `false` | 在模式选择器中添加 Auto 和 Bypass 选项，需 Team 计划 |
| `claudeProcessWrapper` | - | 用于启动 Claude 进程的可执行文件路径（企业自定义部署用） |

**推荐配置示例（settings.json）：**

```json
{
  "claudeCode.selectedModel": "claude-sonnet-4-20250514",
  "claudeCode.initialPermissionMode": "plan",
  "claudeCode.preferredLocation": "sidebar",
  "claudeCode.autosave": true,
  "claudeCode.enableNewConversationShortcut": true
}
```

**Plugins 管理：**

在提示框输入 `/plugins` 打开图形管理界面。安装时可选择范围：

| 范围 | 说明 |
|---|---|
| 用户范围（为您安装） | 所有项目可用 |
| 项目范围（为此项目安装） | 与协作者共享 |
| 本地范围（本地安装） | 仅自己可见，仅此仓库 |

切换到 **Marketplaces** 选项卡可以添加自定义插件源：输入 GitHub 仓库、URL 或本地路径。

### 2.5 Git 集成与高级功能

**Git 集成：**

直接在对话中让 Claude 提交代码、创建 PR、跨分支工作。Claude 会自动检测当前 git 状态和分支。

**Worktree 并行任务：**

用 `--worktree`（`-w`）在隔离环境中启动 Claude，多个实例互不干扰：

```bash
# 在独立 worktree 中开发认证功能
claude --worktree feature-auth
# 或简写
claude -w feature-auth

# 终端 1：主分支修复 bug
claude

# 终端 2：新 worktree 开发支付功能
claude -w feature-payment
```

**Chrome 浏览器集成：**

安装 Claude in Chrome 扩展（1.0.36+）后，在对话中使用 `@browser` 引用浏览器：

```markdown
> @browser go to localhost:3000 and check the console for errors
```

Claude 会打开浏览器标签页，共享你的登录状态，可以访问已登录的网站进行测试。

**URI 处理程序：**

扩展注册了 `vscode://anthropic.claude-code/open` 协议，可以从外部工具打开 Claude Code 标签页：

```bash
# macOS
open "vscode://anthropic.claude-code/open"

# Linux
xdg-open "vscode://anthropic.claude-code/open"

# Windows
start "vscode://anthropic.claude-code/open"

# 带 prompt 参数（URL 编码）
vscode://anthropic.claude-code/open?prompt=review%20my%20changes

# 恢复指定会话
vscode://anthropic.claude-code/open?session=abc123
```

**内置 IDE MCP 服务器：**

扩展运行时自动启动一个本地 MCP 服务器，提供两个工具：

| 工具名 | 功能 | 会写文件 |
|---|---|---|
| `getDiagnostics` | 读取 VS Code Problems 面板中的错误和警告 | 否 |
| `executeCode` | 在 Jupyter notebook 内核中执行代码（每次需确认） | 是 |

安全设计细节：服务器绑定到 `127.0.0.1` 的随机高端口，外部无法访问；每次激活生成新的随机认证令牌；令牌文件权限为 `0600`，只有当前用户可读。

**CLI vs 扩展功能对比：**

| 功能 | CLI | VS Code 扩展 |
|---|---|---|
| 命令和技能 | 全部 | 子集（输入 `/` 查看） |
| MCP 服务器配置 | 完整 | 部分（用 CLI 添加，用 `/mcp` 管理） |
| Checkpoints | 支持 | 支持 |
| `!` bash 快捷 | 支持 | 不支持 |
| Tab 补全 | 支持 | 不支持 |
| 图形 Diff 查看 | 不支持 | 支持 |
| @-mentions 可视化 | 不支持 | 支持 |

**卸载清理：**

卸载扩展后，如果想彻底清理本地数据：

```bash
rm -rf ~/.vscode/globalStorage/anthropic.claude-code
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

**问题一：Spark 图标不显示**

安装完扩展后，编辑器右上角找不到 Claude 的 Spark 图标。一开始以为安装失败了。

**原因**：Spark 图标需要**打开一个文件**才会出现在编辑器工具栏。只打开文件夹不够，必须打开一个具体的代码文件。

**问题二：Plan 模式下不知道怎么审批**

第一次用 Plan 模式时，Claude 写好了计划，但我不知道在哪里点审批。

**原因**：VS Code 会自动把计划作为完整的 Markdown 文档打开，你可以在文档里添加行内注释给出反馈，然后点击批准执行。

### 3.2 我的解决方案

**Spark 图标完整排查路径（5 步）：**

1. 先打开一个代码文件（不只是文件夹）
2. 如果还是没有，检查 VS Code 版本 >= 1.98.0
3. 尝试 `Developer: Reload Window` 命令重新加载窗口
4. 检查是否有其他扩展冲突（暂时禁用其他 AI 扩展试试）
5. 确认工作区未被标记为"不受信任"（Restricted Mode），不受信任的工作区会限制扩展功能

**面板布局推荐：**

我习惯把 Claude 拖到次级边栏（右侧第二栏），编码时 Claude 保持可见。然后用 `Cmd+Shift+Esc` 在新标签页开第二个对话，一个写代码一个做 review，互不影响。

**权限模式选择策略：**

- **新手阶段**：用 Plan 模式，看清 Claude 要做什么再批准
- **熟练之后**：切到 Auto-accept，减少确认步骤
- **敏感项目**：用 Normal 模式，每一步都把控

**CLI 与扩展配合：**

有些高级功能只能用 CLI 完成。我的做法是：在集成终端里跑 `claude mcp add` 添加 MCP 服务器，然后在扩展里用 `/mcp` 查看和管理。

```bash
# 终端添加 MCP 服务器
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# 然后在扩展里 /mcp 查看
```

### 3.3 我的建议

1. **安全和隐私**：Auto 模式下 Claude 可以修改 `settings.json` 等配置文件。如果工作区处于受限模式（Restricted Mode），建议保持 Normal 或 Plan 模式，防止 Claude 修改敏感配置。

2. **善用 @-mentions 聚焦上下文**：让 Claude 聚焦在特定文件或代码段，比让它"全局搜索"更高效。用 `Option+K` / `Alt+K` 快捷键快速插入引用。

3. **利用对话历史搜索**：面板顶部下拉菜单支持按关键字搜索历史对话，比从头描述需求快得多。

---

## 四、常见问题

**Q: Spark 图标不显示怎么办？**

A: 按顺序排查：1) 打开一个文件；2) 检查 VS Code 版本 >= 1.98.0；3) 执行 `Developer: Reload Window`；4) 禁用可能冲突的其他 AI 扩展；5) 检查工作区是否处于不受信任状态。或者直接点击状态栏右下角的 "✱ Claude Code"。

**Q: Claude Code 不响应了怎么办？**

A: 三步排查：1) 检查网络连接，确保能访问 API；2) 开一个新对话试试；3) 在终端中运行 `claude` 看是否能正常工作。如果 CLI 正常但扩展不行，可能是扩展版本问题，尝试更新或重新安装。

**Q: 扩展和 CLI 的对话历史互通吗？**

A: 是的，共享同一份历史。在终端运行 `claude --resume` 可以继续扩展中的对话。反过来，扩展面板顶部的下拉菜单也能看到 CLI 创建的对话。

**Q: 扩展能自动修改代码吗？**

A: 可以。把 `initialPermissionMode` 设为 `acceptEdits` 或 `auto`，Claude 就会直接修改代码而不询问。但注意 auto 模式下 Claude 可以修改 `settings.json` 等配置文件，建议先在非敏感项目上测试。

**Q: 如何在扩展里配置 MCP？**

A: 用 CLI 添加：`claude mcp add --transport http github https://api.githubcopilot.com/mcp/`，然后在扩展里用 `/mcp` 查看和管理已配置的服务器。

**Q: 卸载扩展后数据还在吗？**

A: 扩展的本地存储在 `~/.vscode/globalStorage/anthropic.claude-code`，卸载不会自动删除。如果想彻底清理，手动删除该目录即可。

---

## 五、小结

VS Code 扩展是 Claude Code 的推荐使用方式：可视化 diff 让改动一目了然，Plan 模式让 AI 辅助编程更可控，@-mentions 让上下文传递更精准。记住几个核心快捷键：`Cmd+Esc` 切换焦点、`Option+K` 插入文件引用、`Cmd+Shift+Esc` 开新标签页。CLI 和扩展互为补充——高级功能用 CLI，日常编码用扩展。

**系列导航**：返回 [Claude Code 官方文档精读系列索引](/2026/03/12/ai-tools/claude-code-series-index/)

---

*本文精读自 [在 VS Code 中使用 Claude Code](https://code.claude.com/docs/zh-CN/vs-code)*

*最后更新：2026-03-31*
