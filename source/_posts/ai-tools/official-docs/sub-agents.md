---
title: 精读官方文档：Subagents（子代理）
date: 2026-03-19 23:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 12
description: Subagents 是 Claude Code 的专用 AI 助手，可以独立处理特定任务。本文详解配置方法、内置子代理类型、以及如何创建自定义子代理来提升开发效率。
cover: https://picsum.photos/seed/claude-subagents/1920/1080
source_url: https://code.claude.com/docs/zh-CN/sub-agents
---

# 精读官方文档：Subagents（子代理）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

**Subagents（子代理）** 是 Claude Code 的专用 AI 助手，可以理解为一个"专家团队"。当你在主对话中遇到特定类型的任务时，Claude Code 可以把这个任务"外包"给专门的子代理去处理。

举个例子：你让 Claude Code 帮你审查代码，它会自动调用一个"代码审查专家"子代理，这个子代理有自己独立的上下文窗口（不会污染主对话），专注于审查代码这一件事，干完活后把结果汇报回来。

**Subagents 的核心价值：**

- **保留上下文**：通过将探索和实现保持在主对话之外
- **强制执行约束**：通过限制 subagent 可以使用的工具
- **跨项目重用配置**：使用用户级 subagents
- **专门化行为**：为特定领域使用专注的系统提示
- **控制成本**：通过将任务路由到更快、更便宜的模型（如 Haiku）

<!-- more -->

---

## 二、官方教程精读

### 2.1 内置子代理完整列表

Claude Code 自带多个内置子代理，Claude 在适当时自动使用。每个都继承父对话的权限，并有额外的工具限制。

**主要内置子代理：**

| 代理 | 模型 | 工具 | 用途 |
|------|------|------|------|
| **Explore** | Haiku | 只读（拒绝 Write/Edit） | 快速的、只读代理，用于搜索和分析代码库 |
| **Plan** | 继承父对话 | 只读（拒绝 Write/Edit） | Plan 模式下自动调用，在呈现计划前收集上下文 |
| **General-purpose** | 继承父对话 | 全部 | 处理复杂多步骤任务，需要探索和操作 |

**其他辅助代理：**

| 代理 | 模型 | Claude 何时使用它 |
|------|------|-------------------|
| **Bash** | 继承 | 在单独的上下文中运行终端命令 |
| **statusline-setup** | Sonnet | 当你运行 `/statusline` 来配置状态行时 |
| **Claude Code Guide** | Haiku | 当你提出关于 Claude Code 功能的问题时 |

**Explore 子代理详解：**

- 彻底程度级别：`quick`（针对性查找）、`medium`（平衡探索）、`very thorough`（全面分析）
- 将探索结果保持在主对话上下文之外

**Plan 子代理特点：**

- 在 plan mode 期间自动使用
- 防止无限嵌套（subagents 无法生成其他 subagents）
- 收集规划所需的代码库研究信息

### 2.2 配置文件位置与优先级

子代理存放在不同位置，优先级如下：

| 类型 | 位置 | 作用范围 | 优先级 | 如何创建 |
|------|------|----------|--------|----------|
| CLI 标志 | `--agents` 参数 | 当前会话 | 1（最高） | 启动时传递 JSON |
| 项目子代理 | `.claude/agents/` | 当前项目 | 2 | 交互式或手动 |
| 用户子代理 | `~/.claude/agents/` | 所有项目 | 3 | 交互式或手动 |
| Plugin 子代理 | plugin 的 `agents/` 目录 | 启用 plugin 的位置 | 4（最低） | 与 plugins 一起安装 |

**项目子代理**（`.claude/agents/`）适合特定于代码库的配置，建议检入版本控制。

**用户子代理**（`~/.claude/agents/`）是在所有项目中可用的个人配置。

### 2.3 使用 /agents 命令管理子代理

`/agents` 命令提供了交互式界面来管理子代理：

```
/agents
```

功能包括：

- 查看所有可用的 subagents（内置、用户、项目和 plugin）
- 使用引导式设置或 Claude 生成创建新的 subagents
- 编辑现有 subagent 配置和工具访问
- 删除自定义 subagents
- 查看当存在重复时哪些 subagents 是活跃的

从命令行列出所有配置的 subagents（不启动交互式会话）：

```bash
claude agents
```

这显示按来源分组的代理，并指示哪些被更高优先级的定义覆盖。

### 2.4 文件格式详解

每个子代理是一个带 YAML frontmatter 的 Markdown 文件：

```yaml
---
name: your-sub-agent-name
description: 描述何时应该调用这个子代理
tools: Read, Grep, Glob, Bash  # 可选，不填则继承所有工具
disallowedTools: Write, Edit   # 可选，从继承列表中删除的工具
model: sonnet  # 可选，指定模型或 inherit
permissionMode: default  # 可选，权限模式
maxTurns: 10  # 可选，最大轮数
effort: medium  # 可选，努力级别
isolation: worktree  # 可选，隔离模式
---

这里写子代理的 system prompt，可以多段落详细描述：
- 角色定义
- 工作流程
- 输出格式要求
- 注意事项
```

**完整配置字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 唯一标识符，小写字母和连字符 |
| `description` | 是 | 自然语言描述何时调用此子代理 |
| `tools` | 否 | 允许列表，逗号分隔的工具，省略则继承所有工具 |
| `disallowedTools` | 否 | 拒绝列表，从继承或指定列表中删除的工具 |
| `model` | 否 | 模型别名（sonnet/opus/haiku）、完整模型 ID 或 inherit |
| `permissionMode` | 否 | 权限模式：default/acceptEdits/dontAsk/bypassPermissions/plan |
| `maxTurns` | 否 | subagent 停止前的最大代理轮数 |
| `effort` | 否 | 努力级别：low/medium/high/max（仅 Opus 4.6） |
| `isolation` | 否 | 设为 `worktree` 在临时 git worktree 中运行 |
| `background` | 否 | 设为 `true` 始终作为后台任务运行，默认 false |
| `skills` | 否 | 启动时加载到上下文中的技能 |
| `mcpServers` | 否 | 此 subagent 可用的 MCP 服务器 |
| `hooks` | 否 | 限定于此 subagent 的生命周期 hooks |
| `memory` | 否 | 持久内存范围：user/project/local |
| `initialPrompt` | 否 | 作为主会话代理运行时自动提交的初始提示 |

### 2.5 tools 与 disallowedTools 字段详解

**tools（允许列表）**：

```yaml
---
name: safe-researcher
description: 受限的研究代理
tools: Read, Grep, Glob, Bash
---
```

此配置只允许 Read、Grep、Glob 和 Bash。Subagent 无法编辑文件、写入文件或使用任何 MCP 工具。

**disallowedTools（拒绝列表）**：

```yaml
---
name: no-writes
description: 继承所有工具，除了文件写入
disallowedTools: Write, Edit
---
```

此配置继承主对话的所有工具，但删除 Write 和 Edit。Subagent 保留 Bash、MCP 工具和其他所有内容。

**两者同时设置时**：`disallowedTools` 先应用，然后 `tools` 针对剩余的池进行解析。同时列在两者中的工具被删除。

### 2.6 高级配置选项

#### maxTurns（最大轮数）

限制 subagent 的执行轮数，防止无限循环：

```yaml
---
name: quick-check
description: 快速检查代码
maxTurns: 5
---
```

#### effort（努力级别）

覆盖会话的努力级别：

```yaml
---
name: thorough-review
description: 深度代码审查
effort: high
---
```

可选值：`low`、`medium`、`high`、`max`（仅 Opus 4.6 支持 max）

#### isolation（隔离模式）

在临时 git worktree 中运行 subagent：

```yaml
---
name: safe-experiment
description: 安全实验代理
isolation: worktree
---
```

如果 subagent 不进行任何更改，worktree 会自动清理。

### 2.7 CLI 方式动态定义

通过 CLI 参数动态创建（仅当前会话有效）：

```bash
claude --agents '{
  "code-reviewer": {
    "description": "专业代码审查，代码变更后主动调用",
    "prompt": "你是资深代码审查专家，关注代码质量、安全性和最佳实践。",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "调试专家，处理错误和测试失败。",
    "prompt": "你是调试专家，分析错误、识别根因并提供修复。"
  }
}'
```

`--agents` 标志接受 JSON，支持所有 frontmatter 字段：`description`、`prompt`、`tools`、`disallowedTools`、`model`、`permissionMode`、`mcpServers`、`hooks`、`maxTurns`、`skills`、`initialPrompt`、`memory`、`effort`、`background` 和 `isolation`。

### 2.8 调用子代理的三种方式

#### 1. 自然语言调用

在提示中命名 subagent，Claude 决定是否委托：

```
Use the test-runner subagent to fix failing tests
Have the code-reviewer subagent look at my recent changes
```

#### 2. @-mention 调用（保证执行）

输入 `@` 并从类型提前中选择 subagent，确保特定 subagent 运行：

```
@"code-reviewer (agent)" look at the auth changes
```

手动输入格式：
- 本地 subagents：`@agent-<name>`
- Plugin subagents：`@agent-<plugin-name>:<agent-name>`

#### 3. --agent 标志（会话范围）

启动会话时使用指定 subagent 的配置作为主线程：

```bash
claude --agent code-reviewer
```

Subagent 的系统提示完全替换默认 Claude Code 系统提示。代理名称在启动标题中显示为 `@<name>`。

在 `.claude/settings.json` 中设为默认：

```json
{
  "agent": "code-reviewer"
}
```

对于 plugin 提供的 subagent，传递作用域名称：

```bash
claude --agent <plugin-name>:<agent-name>
```

### 2.9 前台与后台运行

Subagents 可以在前台（阻塞）或后台（并发）运行：

**前台 subagents**：
- 阻塞主对话直到完成
- 权限提示和澄清问题会传递给你

**后台 subagents**：
- 在你继续工作时并发运行
- 启动前提示所需工具权限
- 继承这些权限并自动拒绝未预先批准的内容
- 如果需要澄清问题，工具调用失败但 subagent 继续

**手动控制**：

- 要求 Claude "run this in the background"
- 按 **Ctrl+B** 将运行中的任务放在后台

**禁用后台任务**：

```bash
export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1
```

### 2.10 Hooks 配置示例

#### Subagent Frontmatter 中的 Hooks

```yaml
---
name: code-reviewer
description: 带自动 lint 的代码审查
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

**Subagent 支持的 Hook 事件：**

| Event | Matcher input | 何时触发 |
|-------|---------------|----------|
| `PreToolUse` | Tool name | 在 subagent 使用工具之前 |
| `PostToolUse` | Tool name | 在 subagent 使用工具之后 |
| `Stop` | (none) | 当 subagent 完成时（自动转换为 SubagentStop） |

#### 项目级 Subagent 事件 Hooks

在 `settings.json` 中配置：

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

**项目级 Hook 事件：**

| Event | Matcher input | 何时触发 |
|-------|---------------|----------|
| `SubagentStart` | Agent type name | 当 subagent 开始执行时 |
| `SubagentStop` | Agent type name | 当 subagent 完成时 |

### 2.11 官方示例

#### 代码审查者

```yaml
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include specific examples of how to fix issues.
```

#### 调试器

```yaml
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger specializing in root cause analysis.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify solution works

Debugging process:
- Analyze error messages and logs
- Check recent code changes
- Form and test hypotheses
- Add strategic debug logging
- Inspect variable states

For each issue, provide:
- Root cause explanation
- Evidence supporting the diagnosis
- Specific code fix
- Testing approach
- Prevention recommendations

Focus on fixing the underlying issue, not the symptoms.
```

#### 数据库查询验证器（带 Hook）

```yaml
---
name: db-reader
description: Execute read-only database queries. Use when analyzing data or generating reports.
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

You are a database analyst with read-only access. Execute SELECT queries to answer questions about the data.

When asked to analyze data:
1. Identify which tables contain the relevant data
2. Write efficient SELECT queries with appropriate filters
3. Present results clearly with context

You cannot modify data. If asked to INSERT, UPDATE, DELETE, or modify schema, explain that you only have read access.
```

验证脚本 `./scripts/validate-readonly-query.sh`：

```bash
#!/bin/bash
# Blocks SQL write operations, allows SELECT queries

# Read JSON input from stdin
INPUT=$(cat)

# Extract the command field from tool_input using jq
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block write operations (case-insensitive)
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|MERGE)\b' > /dev/null; then
  echo "Blocked: Write operations not allowed. Use SELECT queries only." >&2
  exit 2
fi

exit 0
```

使脚本可执行：

```bash
chmod +x ./scripts/validate-readonly-query.sh
```

### 2.12 可恢复子代理

子代理支持跨会话恢复，适合长时间任务：

```
# 首次调用，返回 agentId
> 使用 code-analyzer 分析认证模块
[返回 agentId: "abc123"]

# 恢复之前的代理继续工作
> 恢复代理 abc123，继续分析授权逻辑
```

**技术细节：**

- 每次执行分配唯一 `agentId`
- 对话存储在 `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`
- 恢复时保留完整上下文，包括所有工具调用、结果和推理
- 主对话压缩不影响 subagent 转录

**自动压缩：**

Subagents 支持自动压缩，默认在约 95% 容量时触发。设置更低百分比提前触发：

```bash
export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

刚开始用子代理时，我写了几个"全能型"子代理，既做代码审查又做测试运行还做 bug 调试。结果发现：

1. **调用时机不准**：Claude 不知道什么时候该用哪个
2. **结果质量不稳定**：提示词太泛，输出五花八门
3. **上下文浪费**：把所有工具都给它，结果加载了一堆不需要的 MCP 工具

### 3.2 我的解决方案

按"单一职责"原则重新拆分：

```yaml
# .claude/agents/test-runner.md
---
name: test-runner
description: 代码变更后主动运行相关测试并修复失败
tools: Read, Bash, Grep
---

你是测试自动化专家。看到代码变更时：
1. 识别相关的测试文件
2. 运行测试
3. 如果失败，分析原因并修复（保持原有测试意图）
```

```yaml
# .claude/agents/changelog-writer.md
---
name: changelog-writer
description: 功能完成后自动更新 CHANGELOG.md
tools: Read, Edit
---

你负责维护变更日志。功能完成后：
1. 查看最近的 git commit
2. 更新 CHANGELOG.md，按 Keep a Changelog 格式
3. 只记录用户可见的变更
```

### 3.3 我的建议

1. **description 决定调用频率**：写得太泛，Claude 会频繁调用；写得太窄，可能永远不会触发。建议用"主动/被动"明确触发条件，例如"Use proactively after code changes"。

2. **先用 Claude 生成**：官方建议让 Claude 先帮你写一个草稿，再迭代优化。我自己试过，确实比自己从零写效果好。

3. **项目级配置纳入版本控制**：团队共享子代理配置，大家一起迭代优化。

4. **善用 disallowedTools**：当你想继承大部分工具但排除少数几个时，用 `disallowedTools` 比 `tools` 更简洁。

5. **后台运行适合隔离任务**：运行测试、分析日志等产生大量输出的任务，用后台运行可以保持主对话干净。

---

## 四、常见问题

**Q: 子代理和 MCP 有什么区别？**

A: MCP 是外部工具协议，扩展 Claude Code 能连接什么。子代理是内部任务分发机制，决定谁来干活。可以理解为：MCP 是"外设"，子代理是"团队成员"。

**Q: 子代理能调用另一个子代理吗？**

A: 不能。官方明确说明子代理不能再 spawn 其他子代理，防止无限嵌套。这也是为什么 Plan 子代理存在——在 Plan 模式下，主代理不能执行修改操作，所以需要 Plan 子代理来做研究。

**Q: 怎么查看当前有哪些子代理可用？**

A: 在 Claude Code 中输入 `/agents` 命令，可以查看、创建、编辑、删除所有子代理（包括内置的、用户的、项目的）。或用 `claude agents` 命令行查看。

**Q: 子代理会增加延迟吗？**

A: 会。每次调用子代理都需要初始化新的上下文，然后收集信息。但对于复杂任务，这点延迟换来的是主对话上下文的节省，总体是划算的。

**Q: 什么时候用子代理，什么时候用主对话？**

**用主对话**：任务需要频繁来回或迭代细化、多阶段共享重要上下文、快速有针对性的更改、延迟重要。

**用子代理**：任务产生大量不需要的详细输出、想强制执行特定工具限制或权限、工作是自包含的可返回摘要。

**Q: 如何禁用特定子代理？**

A: 在 settings.json 中添加：

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

或用 CLI 标志：

```bash
claude --disallowedTools "Agent(Explore)"
```

---

## 五、小结

Subagents 是 Claude Code 的"专家分工"机制：通过独立上下文、限定工具、自定义提示词，让每个子代理专注于特定任务。用好它的关键是**单一职责 + 清晰的 description**。

核心配置要点：
- `tools` 控制允许列表，`disallowedTools` 控制拒绝列表
- `maxTurns`、`effort`、`isolation` 提供高级控制
- `/agents` 命令提供交互式管理
- `@-mention` 保证子代理执行，`--agent` 标志设置会话范围
- `Ctrl+B` 将任务放到后台

下一篇精读：[Memory](/ai-tools/official-docs/memory/) —— 跨会话记忆机制。

---

*本文精读自 [Subagents - Claude Code Docs](https://code.claude.com/docs/zh-CN/sub-agents)*

*最后更新：2026-03-27*
