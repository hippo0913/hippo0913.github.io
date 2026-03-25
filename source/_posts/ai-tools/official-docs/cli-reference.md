---
title: 精读官方文档：CLI 参考
date: 2026-03-04 23:00:00
updated: 2026-03-25 10:00:00
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

官方提供了 9 个核心命令：

| 命令 | 说明 | 示例 |
|------|------|------|
| `claude` | 启动交互式 REPL | `claude` |
| `claude "query"` | 带初始提示启动 REPL | `claude "explain this project"` |
| `claude -p "query"` | SDK 模式查询后退出 | `claude -p "explain this function"` |
| `cat file \| claude -p "query"` | 处理管道输入的内容 | `cat logs.txt \| claude -p "explain"` |
| `claude -c` | 继续最近一次对话 | `claude -c` |
| `claude -c -p "query"` | SDK 模式继续对话 | `claude -c -p "Check for type errors"` |
| `claude -r "<session-id>" "query"` | 按 ID 恢复会话 | `claude -r "abc123" "Finish this PR"` |
| `claude update` | 更新到最新版本 | `claude update` |
| `claude mcp` | 配置 MCP 服务器 | 见 MCP 文档 |

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
```

### 2.2 CLI 参数标志（Flags）

参数标志用于自定义 Claude Code 的行为。官方提供了丰富的选项：

| 标志 | 说明 | 示例 |
|------|------|------|
| `--add-dir` | 添加额外的工作目录 | `claude --add-dir ../apps ../lib` |
| `--allowedTools` | 预授权的工具列表 | `"Bash(git log:*)" "Read"` |
| `--disallowedTools` | 禁用的工具列表 | `"Bash(git log:*)" "Edit"` |
| `--print`, `-p` | 打印模式（非交互） | `claude -p "query"` |
| `--append-system-prompt` | 追加系统提示（仅 `-p` 模式） | `claude --append-system-prompt "用中文回答"` |
| `--output-format` | 输出格式（text/json/stream-json） | `claude -p "query" --output-format json` |
| `--input-format` | 输入格式（text/stream-json） | `claude -p --input-format stream-json` |
| `--verbose` | 详细日志，显示完整轮次输出 | `claude --verbose` |
| `--max-turns` | 限制代理轮次（非交互模式） | `claude -p --max-turns 3 "query"` |
| `--model` | 指定模型（sonnet/opus 或全名） | `claude --model claude-sonnet-4-20250514` |
| `--permission-mode` | 指定权限模式 | `claude --permission-mode plan` |
| `--permission-prompt-tool` | 权限提示的 MCP 工具 | `claude -p --permission-prompt-tool mcp_auth_tool` |
| `--resume` | 按 ID 恢复会话 | `claude --resume abc123 "query"` |
| `--continue` | 加载当前目录最近对话 | `claude --continue` |
| `--dangerously-skip-permissions` | 跳过权限提示（谨慎使用） | `claude --dangerously-skip-permissions` |

### 2.3 打印模式（Print Mode）详解

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
```

**输出格式说明：**

| 格式 | 用途 |
|------|------|
| `text` | 纯文本，适合终端显示 |
| `json` | 结构化 JSON，适合程序解析 |
| `stream-json` | 流式 JSON，适合实时处理 |

### 2.4 工具权限控制

`--allowedTools` 和 `--disallowedTools` 让你精细控制 Claude 能用什么工具：

```bash
# 预授权 git 相关操作，不再逐个确认
claude --allowedTools "Bash(git log:*)" "Bash(git diff:*)" "Read"

# 禁止编辑文件
claude --disallowedTools "Edit" "Write"
```

**工具名称格式：**
- 简单工具：`"Read"`、`"Bash"`
- 带模式匹配：`"Bash(git log:*)"`（匹配所有 git log 开头的命令）

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

在 CI/CD 管道中使用 Claude Code 时，我发现：

1. **交互式卡住**：脚本里直接用 `claude "query"` 会进入交互模式，导致 CI 超时
2. **权限弹窗**：每次执行都弹权限确认，自动化流程跑不起来
3. **输出难解析**：默认输出是人类可读的，脚本解析很麻烦

### 3.2 我的解决方案

针对这些问题，我总结了一套 CI 友用的命令模板：

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

### 3.3 我的建议

1. **开发时用 `--verbose`**：调试时加上这个参数，能看到完整的思考过程
2. **生产环境限制轮次**：`--max-turns` 是安全网，防止 AI 越跑越远
3. **谨慎跳过权限**：`--dangerously-skip-permissions` 真的很危险，只在隔离环境用

---

## 四、常见问题

**Q: `claude -c` 和 `claude --continue` 有什么区别？**

A: `-c` 是继续最近对话（可能在其他目录），`--continue` 是加载当前目录的最近对话。建议在固定项目目录用 `--continue`。

**Q: 如何在脚本中获取结构化输出？**

A: 使用 `--output-format json` 配合 `jq` 解析：

```bash
claude -p "分析代码" --output-format json | jq '.result'
```

**Q: `--dangerously-skip-permissions` 什么时候用？**

A: 只在完全隔离的环境（如 Docker 容器、CI runner）中使用。本地开发千万别用，误删文件没得救。

**Q: 如何查看当前会话 ID？**

A: 在交互模式下输入 `/session` 或查看 `~/.claude/sessions/` 目录。

---

## 五、小结

CLI 是 Claude Code 的入口，掌握这些命令和参数能让你：
- 高效启动对话（带初始 prompt）
- 集成到自动化脚本（`-p` 模式）
- 精细控制权限（allowedTools/disallowedTools）

**下一篇**：[MCP 配置](/ai-tools/official-docs/mcp) - 了解如何扩展 Claude Code 的能力边界。

---

*本文精读自 [CLI reference - Anthropic](https://docs.anthropic.com/zh-CN/docs/claude-code/cli-reference)*

*最后更新：2026-03-25*
