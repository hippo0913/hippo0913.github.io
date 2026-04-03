---
title: 精读官方文档：CLI 参考
date: 2026-03-04 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 27
description: Claude Code 命令行工具完整参考，涵盖所有命令、40+ 参数标志的用法，以及 CI/CD 集成、打印模式、工具权限控制的实战经验。
cover: https://picsum.photos/seed/claude-cli-reference/1920/1080
source_url: https://code.claude.com/docs/zh-CN/cli-reference
---

# 精读官方文档：CLI 参考

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

CLI（Command Line Interface，命令行界面）是 Claude Code 的核心入口。你启动对话、执行单次查询、集成到 CI/CD 脚本、管理账户认证，全靠它。

简单理解：CLI 参考就是 Claude Code 的"命令字典"。`claude` 回车进去聊天是它，`claude -p "query"` 在脚本里调它也是它，`claude auth login` 登录账户还是它。这篇精读把官方文档里的 16 个命令和 40+ 个参数标志梳理清楚，帮你快速找到需要的那条命令。

<!-- more -->

---

## 二、官方教程精读

### 2.1 核心命令一览

官方提供 16 个命令，覆盖会话管理、认证、插件、远程控制等场景：

| 命令 | 说明 | 示例 |
| --- | --- | --- |
| `claude` | 启动交互式会话 | `claude` |
| `claude "query"` | 带初始提示启动交互式会话 | `claude "explain this project"` |
| `claude -p "query"` | 非交互式查询，执行完退出 | `claude -p "explain this function"` |
| `cat file \| claude -p "query"` | 管道输入，处理文件内容 | `cat logs.txt \| claude -p "explain"` |
| `claude -c` | 继续当前目录最近的对话 | `claude -c` |
| `claude -r "<session>" "query"` | 按 ID 或名称恢复会话 | `claude -r "auth-refactor" "Finish"` |
| `claude update` | 更新到最新版本 | `claude update` |
| `claude auth login` | 登录账户（支持 `--console`、`--sso`、`--email`） | `claude auth login --console` |
| `claude auth logout` | 登出账户 | `claude auth logout` |
| `claude auth status` | 显示认证状态（JSON），已登录退出码 0，未登录退出码 1 | `claude auth status` |
| `claude agents` | 列出已配置的 subagents（子代理） | `claude agents` |
| `claude auto-mode defaults` | 打印内置 auto mode 分类器规则（JSON） | `claude auto-mode defaults > rules.json` |
| `claude mcp` | 配置 MCP 服务器 | 见 MCP 文档 |
| `claude plugin` | 管理插件（别名 `plugins`） | `claude plugin install xxx@marketplace` |
| `claude remote-control` | 启动远程控制服务器，从 claude.ai 控制 | `claude remote-control --name "My Project"` |

**最常用的五种启动方式：**

```bash
# 1. 直接交互
claude

# 2. 带问题启动，直奔主题
claude "帮我分析项目架构"

# 3. 非交互式，脚本用
claude -p "列出所有 TypeScript 文件"

# 4. 继续上次对话
claude -c

# 5. 按名称恢复特定会话
claude -r "auth-refactor" "继续完成认证模块"
```

### 2.2 打印模式（Print Mode）

`-p` / `--print` 是非交互式的核心标志，执行完直接退出，适合脚本和 CI/CD：

```bash
# 纯文本输出
claude -p "解释这个函数"

# JSON 输出，方便 jq 解析
claude -p "分析代码结构" --output-format json

# 流式 JSON，适合实时处理
claude -p "生成代码" --output-format stream-json

# 限制轮次防止跑飞
claude -p --max-turns 5 "重构这个模块"

# 设预算上限（美元）
claude -p --max-budget-usd 2.00 "review this code"
```

**输出格式对比：**

| 格式 | 用途 | 特点 |
| --- | --- | --- |
| `text` | 终端直接显示 | 人类可读 |
| `json` | 程序解析 | 结构化，可用 jq 提取 |
| `stream-json` | 实时流式处理 | 边生成边处理，适合长输出 |

### 2.3 系统提示标志

四个标志控制 Claude 的系统提示，分"替换"和"追加"两类：

| 标志 | 行为 |
| --- | --- |
| `--system-prompt` | 替换整个默认提示 |
| `--system-prompt-file` | 从文件加载，替换默认提示 |
| `--append-system-prompt` | 追加到默认提示末尾 |
| `--append-system-prompt-file` | 从文件加载追加内容 |

**关键规则：** `--system-prompt` 和 `--system-prompt-file` 互斥；追加标志可以和替换标志组合。大多数场景用追加就行，它保留 Claude Code 的内置能力。

```bash
# 追加自定义规则（推荐）
claude --append-system-prompt "Always use TypeScript strict mode"

# 从文件加载额外规则
claude --append-system-prompt-file ./coding-style.txt

# 完全替换（慎用，会丢掉内置功能）
claude --system-prompt "You are a Python expert"
```

### 2.4 工具权限控制

`--allowedTools` 和 `--disallowedTools` 精细控制 Claude 能用什么工具：

```bash
# 预授权 git 操作，免确认
claude --allowedTools "Bash(git log *)" "Bash(git diff *)" "Read"

# 禁止编辑文件（只读审查场景）
claude --disallowedTools "Edit" "Write"
```

工具名称支持模式匹配：`"Bash(git log *)"` 匹配所有 `git log` 开头的命令。

**与 `--tools` 的区别：**

| 标志 | 效果 |
| --- | --- |
| `--allowedTools` | 预授权工具，不弹确认，但工具仍然可用 |
| `--disallowedTools` | 从模型上下文中移除工具，完全不可用 |
| `--tools` | 限制可用工具范围，`""` 禁用所有，`"default"` 全部 |

### 2.5 新增实用标志

官方最近新增了一批实用标志，值得重点关注：

| 标志 | 说明 | 典型场景 |
| --- | --- | --- |
| `--from-pr <PR>` | 恢复关联某 GitHub PR 的会话 | PR review 时恢复上下文 |
| `--worktree`, `-w` | 在隔离的 git worktree 中启动 | 并行开发，不污染主分支 |
| `--fallback-model` | 默认模型过载时自动降级 | CI 中防止单点故障 |
| `--init` | 运行初始化 hooks 后进交互模式 | 项目首次配置 |
| `--init-only` | 只跑初始化 hooks 就退出 | CI 准备阶段 |
| `--maintenance` | 运行维护 hooks 后退出 | 定期清理任务 |
| `--session-id` | 指定会话 UUID | 精确控制会话追踪 |
| `--mcp-config` | 从 JSON 文件加载 MCP 配置 | CI 中注入 MCP 服务器 |
| `--strict-mcp-config` | 只用 `--mcp-config` 的 MCP，忽略其他配置 | 安全隔离环境 |
| `--enable-auto-mode` | 解锁 auto mode（需 Team 计划） | 自动执行复杂任务 |
| `--teammate-mode` | 设置 agent team 显示方式 | 多 agent 协作 |
| `--plugin-dir` | 从指定目录加载插件 | 测试本地开发的插件 |
| `--permission-prompt-tool` | 指定 MCP 工具处理权限提示 | 非交互模式的权限管理 |
| `--no-session-persistence` | 禁用会话持久化 | 敏感场景不留痕迹 |
| `--bare` | 最小模式，跳过 hooks/plugins/MCP/CLAUDE.md | 快速脚本调用 |
| `--effort` | 设置工作量级别：low/medium/high/max | 控制思考深度 |

**worktree 隔离开发示例：**

```bash
# 在隔离的 worktree 中启动，不影响当前工作区
claude -w feature-auth

# worktree 位于 <repo>/.claude/worktrees/feature-auth
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 CI/CD 中的三个坑

在 GitHub Actions 里集成 Claude Code 时，我踩过三个坑：

**坑一：交互式卡住。** 脚本里直接 `claude "query"` 会进入交互模式，CI 等不到返回，最终超时失败。

**坑二：权限弹窗。** 每次执行都弹权限确认，CI 里没人点确认，直接卡死。

**坑三：输出难解析。** 默认输出是人类可读的纯文本，脚本用 `grep` 解析既脆弱又容易断。

### 3.2 我的 CI 友好命令模板

针对上述问题，我总结了一套 CI 专用模板：

```bash
# CI/CD 专用模板
claude -p \
  --output-format json \
  --max-turns 3 \
  --max-budget-usd 5.00 \
  --allowedTools "Bash(git log *)" "Bash(git diff *)" "Read" \
  "检查代码质量，输出 JSON 报告"
```

逐行解释：
- `-p`：非交互模式，执行完退出，不会卡住
- `--output-format json`：JSON 输出，配合 `jq` 解析
- `--max-turns 3`：最多 3 轮，防止 AI 越跑越远浪费 token
- `--max-budget-usd 5.00`：预算上限 5 美元，兜底保护
- `--allowedTools`：预授权只读操作，跳过确认弹窗

**更严格的隔离场景用 bare mode：**

```bash
# bare mode：跳过 hooks、plugins、MCP，只保留基础工具
claude --bare -p --max-turns 1 "生成 commit message"
```

### 3.3 auth status 在脚本中的妙用

`claude auth status` 的退出码非常适合做前置检查：

```bash
#!/bin/bash
# CI 脚本开头检查登录状态
if ! claude auth status --text; then
  echo "ERROR: 未登录 Claude Code，请配置 API Key"
  exit 1
fi

# 登录正常，继续执行
claude -p "review this PR" --output-format json
```

### 3.4 我的建议

1. **`--dangerously-skip-permissions` 只在 Docker/CI 里用。** 本地开发千万别加，误删文件没得救。如果只是想减少弹窗，用 `--allowedTools` 预授权更安全
2. **`--bare` 加速脚本调用。** 自动化场景不需要 hooks、plugins、MCP，`--bare` 跳过这些加载，启动更快
3. **`--verbose` 是调试神器。** 开发阶段加上它，能看到完整的思考过程和工具调用细节
4. **`-n` 命名会话。** 养成命名习惯，`claude -n "feature-auth-work"`，之后 `claude -r "feature-auth-work"` 就能恢复

---

## 四、常见问题

**Q: `claude -c` 和 `claude --continue` 有什么区别？**
A: 没区别，`-c` 是 `--continue` 的短写法，都是加载当前目录最近的对话。

**Q: 脚本里怎么拿到结构化输出？**
A: 用 `--output-format json` 配合 `jq`：

```bash
claude -p "分析代码" --output-format json | jq '.result'
```

**Q: `--dangerously-skip-permissions` 和 `--allowedTools` 该用哪个？**
A: 优先用 `--allowedTools`。它只预授权你指定的工具，其他操作仍需确认。`--dangerously-skip-permissions` 跳过所有权限检查，只在完全隔离的环境（Docker 容器、CI runner）里用。

**Q: 如何在 CI 里注入 MCP 配置？**
A: 用 `--mcp-config` 指定 JSON 文件，配合 `--strict-mcp-config` 忽略其他 MCP 配置：

```bash
claude -p --mcp-config ./ci-mcp.json --strict-mcp-config "query"
```

**Q: 模型过载导致 CI 失败怎么办？**
A: 用 `--fallback-model` 设置降级模型：

```bash
claude -p --fallback-model sonnet "review this code"
```

**Q: `--effort` 标志有什么限制？**
A: `max` 级别仅限 Opus 4.6 模型使用。这个标志只在当前会话有效，不会持久化。

---

## 五、小结

CLI 是 Claude Code 的万能入口。掌握关键命令和标志后，你能：
- 高效管理会话（`-c` 继续、`-r` 恢复、`-n` 命名）
- 集成自动化脚本（`-p` 打印模式、`--bare` 最小模式、`--output-format json`）
- 精细控制权限（`--allowedTools` 预授权、`--disallowedTools` 禁用）
- 在 CI 中稳定运行（`--max-turns` 限轮次、`--max-budget-usd` 限预算、`--fallback-model` 降级）
- 隔离开发（`-w` worktree、`--strict-mcp-config`）

**下一篇**：[MCP 配置](/2026/03/18/ai-tools/official-docs/mcp/) - 了解如何通过 MCP 协议扩展 Claude Code 的能力边界。

---

*本文精读自 [CLI 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/cli-reference)*

*最后更新：2026-03-31*
