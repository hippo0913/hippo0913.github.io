---
title: 精读官方文档：CLI 参考
date: 2026-03-04 23:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 27
description: Claude Code 命令行工具完整参考，包含所有命令、参数标志的使用方法和实战示例。
cover: https://picsum.photos/seed/claude-cli-reference/1920/1080
source_url: https://code.claude.com/docs/zh-CN/cli-reference
---

# 精读官方文档：CLI 参考

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

CLI（Command Line Interface，命令行界面）是 Claude Code 的核心入口。无论你是启动交互式对话、执行单次查询、还是集成到自动化脚本中，都需要用到 CLI 命令。

简单说，CLI 参考就是 Claude Code 的"命令字典"——告诉你有哪些命令可用、每个参数怎么用、有哪些隐藏技巧。

<!-- more -->

---

## 二、官方教程精读

### 2.1 CLI 命令一览

官方提供了以下核心命令：

| 命令 | 说明 | 示例 |
|------|------|------|
| `claude` | 启动交互式会话 | `claude` |
| `claude "query"` | 带初始提示启动交互式会话 | `claude "explain this project"` |
| `claude -p "query"` | 通过 SDK 查询后退出 | `claude -p "explain this function"` |
| `cat file \| claude -p "query"` | 处理管道输入内容 | `cat logs.txt \| claude -p "explain"` |
| `claude -c` | 继续当前目录最近对话 | `claude -c` |
| `claude -c -p "query"` | SDK 模式继续对话 | `claude -c -p "Check for type errors"` |
| `claude -r "<session>" "query"` | 按 ID 或名称恢复会话 | `claude -r "auth-refactor" "Finish this PR"` |
| `claude update` | 更新到最新版本 | `claude update` |
| `claude auth login` | 登录 Anthropic 账户 | `claude auth login --console` |
| `claude auth logout` | 登出账户 | `claude auth logout` |
| `claude auth status` | 显示认证状态（JSON 格式） | `claude auth status` |
| `claude agents` | 列出所有已配置的 subagents | `claude agents` |
| `claude auto-mode defaults` | 打印内置 auto mode 分类器规则 | `claude auto-mode defaults > rules.json` |
| `claude mcp` | 配置 MCP 服务器 | 见 MCP 文档 |
| `claude plugin` | 管理 Claude Code plugins | `claude plugin install code-review@claude-code-marketplace` |
| `claude remote-control` | 启动远程控制服务器 | `claude remote-control --name "My Project"` |

**最常用的命令示例：**

```bash
# 直接启动交互模式
claude

# 带问题启动，直接进入正题
claude "帮我分析这个项目的架构"

# 非交互式查询，适合脚本调用
claude -p "列出所有 TypeScript 文件"

# 继续上次的对话
claude -c

# 按名称恢复特定会话
claude -r "auth-refactor" "继续完成这个功能"
```

### 2.2 身份验证命令（auth）

`claude auth` 系列命令用于管理账户认证：

```bash
# 登录账户
claude auth login

# 使用 Anthropic Console 登录（用于 API 计费）
claude auth login --console

# 预填充邮箱地址
claude auth login --email your@email.com

# 强制使用 SSO 认证
claude auth login --sso

# 查看认证状态（JSON 格式）
claude auth status

# 查看人类可读的认证状态
claude auth status --text

# 登出账户
claude auth logout
```

**auth status 退出码：**
- 退出码 0：已登录
- 退出码 1：未登录

### 2.3 Subagents 管理（agents）

```bash
# 列出所有已配置的 subagents，按来源分组
claude agents
```

这个命令会显示项目中配置的所有自定义代理（subagents），帮助你了解可用的专用代理。

### 2.4 Auto Mode 配置（auto-mode）

```bash
# 打印内置 auto mode 分类器规则（JSON 格式）
claude auto-mode defaults > rules.json

# 查看应用了设置的有效配置
claude auto-mode config
```

### 2.5 Plugin 管理（plugin）

```bash
# 安装插件
claude plugin install code-review@claude-code-marketplace

# 别名：也可以用 plugins
claude plugins list
```

详见 [plugin 参考](/ai-tools/official-docs/plugins)。

### 2.6 远程控制（remote-control）

```bash
# 启动远程控制服务器，从 Claude.ai 或 Claude 应用控制 Claude Code
claude remote-control --name "My Project"
```

这个命令在服务器模式下运行，无本地交互式会话。详见 [服务器模式标志](#27-服务器模式标志)。

---

## 三、CLI 参数标志（Flags）

### 3.1 常用标志一览

| 标志 | 说明 | 示例 |
|------|------|------|
| `--add-dir` | 添加额外的工作目录 | `claude --add-dir ../apps ../lib` |
| `--agent` | 指定代理（覆盖设置） | `claude --agent my-custom-agent` |
| `--agents` | 动态定义 subagents（JSON） | `claude --agents '{"reviewer":{"description":"Reviews code","prompt":"..."}}'` |
| `--allowedTools` | 预授权的工具列表 | `"Bash(git log *)" "Read"` |
| `--disallowedTools` | 禁用的工具列表 | `"Bash(git log *)" "Edit"` |
| `--print`, `-p` | 打印模式（非交互） | `claude -p "query"` |
| `--output-format` | 输出格式（text/json/stream-json） | `claude -p "query" --output-format json` |
| `--input-format` | 输入格式（text/stream-json） | `claude -p --input-format stream-json` |
| `--verbose` | 详细日志 | `claude --verbose` |
| `--max-turns` | 限制代理轮次 | `claude -p --max-turns 3 "query"` |
| `--model` | 指定模型 | `claude --model claude-sonnet-4-6` |
| `--permission-mode` | 指定权限模式 | `claude --permission-mode plan` |
| `--resume`, `-r` | 按 ID 或名称恢复会话 | `claude --resume auth-refactor` |
| `--continue`, `-c` | 加载当前目录最近对话 | `claude --continue` |
| `--name`, `-n` | 设置会话显示名称 | `claude -n "my-feature-work"` |
| `--dangerously-skip-permissions` | 跳过权限提示 | `claude --dangerously-skip-permissions` |
| `--bare` | 最小模式（快速脚本调用） | `claude --bare -p "query"` |
| `--effort` | 设置工作量级别 | `claude --effort high` |
| `--json-schema` | 获取 JSON Schema 验证输出 | `claude -p --json-schema '{"type":"object"...}'` |
| `--debug` | 启用调试模式 | `claude --debug "api,mcp"` |
| `--fork-session` | 恢复时创建新会话 ID | `claude --resume abc123 --fork-session` |
| `--max-budget-usd` | API 调用最大美元金额 | `claude -p --max-budget-usd 5.00 "query"` |

### 3.2 系统提示标志

Claude Code 提供四个标志用于自定义系统提示：

| 标志 | 行为 | 示例 |
|------|------|------|
| `--system-prompt` | 替换整个默认提示 | `claude --system-prompt "You are a Python expert"` |
| `--system-prompt-file` | 用文件内容替换 | `claude --system-prompt-file ./prompts/review.txt` |
| `--append-system-prompt` | 附加到默认提示 | `claude --append-system-prompt "Always use TypeScript"` |
| `--append-system-prompt-file` | 将文件内容附加到默认提示 | `claude --append-system-prompt-file ./style-rules.txt` |

**注意事项：**
- `--system-prompt` 和 `--system-prompt-file` 互斥
- 附加标志可以与替换标志组合
- 对于大多数用例，使用附加标志（保留 Claude Code 内置功能）

```bash
# 追加自定义规则
claude --append-system-prompt "Always use TypeScript"

# 从文件加载额外规则
claude --append-system-prompt-file ./extra-rules.txt
```

### 3.3 Bare Mode（最小模式）

`--bare` 标志用于快速脚本调用：

```bash
# 最小模式：跳过 hooks、skills、plugins、MCP、自动内存、CLAUDE.md
claude --bare -p "query"
```

**Bare mode 特点：**
- 跳过 hooks、skills、plugins、MCP 服务器的自动发现
- 跳过自动内存和 CLAUDE.md 加载
- Claude 只能访问 Bash、文件读取、文件编辑工具
- 启动更快，适合脚本化调用
- 设置环境变量 `CLAUDE_CODE_SIMPLE`

### 3.4 Effort 标志（工作量级别）

```bash
# 设置工作量级别（仅限 Opus 4.6）
claude --effort high
```

**可选值：**
- `low`：快速响应
- `medium`：平衡模式
- `high`：深度思考
- `max`：最大工作量（仅 Opus 4.6）

**注意：** effort 设置仅在会话范围内有效，不会持久化到设置。

### 3.5 JSON Schema 输出

```bash
# 获取符合 JSON Schema 的验证输出（仅打印模式）
claude -p --json-schema '{"type":"object","properties":{"name":{"type":"string"}}}' "query"
```

这个标志确保代理完成工作流后输出符合指定 JSON Schema 的验证 JSON。详见 [结构化输出](/ai-tools/official-docs/sdk#structured-output)。

### 3.6 Debug 模式

```bash
# 启用所有调试
claude --debug

# 按类别过滤
claude --debug "api,mcp"

# 排除特定类别
claude --debug "!statsig,!file"
```

### 3.7 Fork Session（分叉会话）

```bash
# 恢复时创建新会话 ID，而不是重用原始 ID
claude --resume abc123 --fork-session

# 与 --continue 一起使用
claude --continue --fork-session
```

### 3.8 预算控制

```bash
# 设置 API 调用最大金额（仅打印模式）
claude -p --max-budget-usd 5.00 "query"
```

达到预算上限后，API 调用会停止。

### 3.9 Chrome 集成

```bash
# 启用 Chrome 浏览器集成
claude --chrome

# 禁用 Chrome 集成
claude --no-chrome
```

详见 [Chrome 扩展](/ai-tools/official-docs/chrome)。

### 3.10 服务器模式标志

用于远程控制和网络会话：

| 标志 | 说明 | 示例 |
|------|------|------|
| `--remote-control`, `--rc` | 启用远程控制的交互式会话 | `claude --remote-control "My Project"` |
| `--remote` | 在 claude.ai 创建网络会话 | `claude --remote "Fix the login bug"` |
| `--teleport` | 在本地恢复网络会话 | `claude --teleport` |

```bash
# 启动远程控制服务器
claude remote-control --name "My Project"

# 启动交互式会话并启用远程控制
claude --remote-control "My Project"

# 创建网络会话
claude --remote "Fix the login bug"

# 在本地恢复网络会话
claude --teleport
```

---

## 四、打印模式（Print Mode）详解

`-p` / `--print` 模式是非交互式的核心，适合脚本集成：

```bash
# 基础用法
claude -p "解释这个函数的作用"

# JSON 输出，便于程序解析
claude -p "分析代码结构" --output-format json

# 流式 JSON 输出
claude -p "生成代码" --output-format stream-json

# 限制最大轮次，防止无限执行
claude -p --max-turns 5 "重构这个模块"

# 包含部分流事件
claude -p --output-format stream-json --include-partial-messages "query"
```

**输出格式说明：**

| 格式 | 用途 |
|------|------|
| `text` | 纯文本，适合终端显示 |
| `json` | 结构化 JSON，适合程序解析 |
| `stream-json` | 流式 JSON，适合实时处理 |

---

## 五、工具权限控制

`--allowedTools` 和 `--disallowedTools` 让你精细控制 Claude 能用什么工具：

```bash
# 预授权 git 相关操作，不再逐个确认
claude --allowedTools "Bash(git log *)" "Bash(git diff *)" "Read"

# 禁止编辑文件
claude --disallowedTools "Edit" "Write"
```

**工具名称格式：**
- 简单工具：`"Read"`、`"Bash"`
- 带模式匹配：`"Bash(git log *)"`（匹配所有 git log 开头的命令）

**与 --tools 的区别：**
- `--allowedTools`：预授权工具，无需提示权限
- `--tools`：限制可用工具范围（`""` 禁用所有，`"default"` 表示全部）

```bash
# 只允许使用 Bash、Edit、Read
claude --tools "Bash,Edit,Read"

# 禁用所有工具
claude --tools ""
```

---

## 六、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 6.1 我遇到的问题

在 CI/CD 管道中使用 Claude Code 时，我发现：

1. **交互式卡住**：脚本里直接用 `claude "query"` 会进入交互模式，导致 CI 超时
2. **权限弹窗**：每次执行都弹权限确认，自动化流程跑不起来
3. **输出难解析**：默认输出是人类可读的，脚本解析很麻烦

### 6.2 我的解决方案

针对这些问题，我总结了一套 CI 友好的命令模板：

```bash
# CI/CD 专用模板
claude -p \
  --output-format json \
  --max-turns 3 \
  --dangerously-skip-permissions \
  "检查代码质量并输出报告"
```

**参数解释：**
- `-p`：非交互模式，执行完就退出
- `--output-format json`：输出 JSON，便于 jq 解析
- `--max-turns 3`：最多 3 轮，防止跑飞
- `--dangerously-skip-permissions`：跳过权限（仅限可信环境）

### 6.3 我的建议

1. **开发时用 `--verbose`**：调试时加上这个参数，能看到完整的思考过程
2. **生产环境限制轮次**：`--max-turns` 是安全网，防止 AI 越跑越远
3. **谨慎跳过权限**：`--dangerously-skip-permissions` 真的很危险，只在隔离环境用
4. **使用 bare mode 加速脚本**：自动化场景用 `--bare` 跳过不必要的加载

---

## 七、常见问题

**Q: `claude -c` 和 `claude --continue` 有什么区别？**

A: 它们是等价的，都是继续当前目录最近的对话。

**Q: 如何在脚本中获取结构化输出？**

A: 使用 `--output-format json` 配合 `jq` 解析：

```bash
claude -p "分析代码" --output-format json | jq '.result'
```

**Q: `--dangerously-skip-permissions` 什么时候用？**

A: 只在完全隔离的环境（如 Docker 容器、CI runner）中使用。本地开发千万别用，误删文件没得救。

**Q: 如何查看当前会话 ID？**

A: 在交互模式下输入 `/session` 或查看 `~/.claude/sessions/` 目录。

**Q: 如何让会话名称更易识别？**

A: 使用 `--name` 或 `-n` 标志：

```bash
claude -n "feature-auth-work" "实现用户认证"
```

**Q: auth status 的退出码有什么用？**

A: 可以在脚本中判断登录状态：

```bash
if claude auth status; then
  echo "已登录"
else
  echo "未登录，请先执行 claude auth login"
fi
```

---

## 八、小结

CLI 是 Claude Code 的入口，掌握这些命令和参数能让你：
- 高效启动对话（带初始 prompt、命名会话）
- 集成到自动化脚本（`-p` 模式、`--bare` 模式）
- 精细控制权限（allowedTools/disallowedTools）
- 管理账户认证（auth 系列命令）
- 远程控制和网络会话（remote-control、remote、teleport）

**下一篇**：[MCP 配置](/ai-tools/official-docs/mcp) - 了解如何扩展 Claude Code 的能力边界。

---

*本文精读自 [CLI 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/cli-reference)*

*最后更新：2026-03-27*
