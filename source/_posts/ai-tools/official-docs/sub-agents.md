---
title: 精读官方文档：Subagents（子代理）
date: 2026-03-19 23:00:00
updated: 2026-04-09 01:45:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 12
description: Subagents 是在自己的 context window 中运行的专门 AI 助手，具有独立权限和特定工具访问。本文详解配置格式、工具控制、前后台运行模式、memory/skills/mcpServers 新特性，以及常见使用模式。
cover: https://picsum.photos/seed/claude-subagents/1920/1080
source_url: https://code.claude.com/docs/zh-CN/sub-agents
---

# 精读官方文档：Subagents（子代理）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

**Subagents（子代理）** 是在自己的 context window（上下文窗口）中独立运行的专门 AI 助手。你可以把它理解为一个"专家团队"——主对话是项目经理，subagent 是各领域的专家，接到任务后在自己的独立空间里干活，干完把结果摘要汇报回来。

关键特征：每个 subagent 有自己的系统提示、特定的工具访问权限和独立的权限控制。Claude 会根据你定义的 `description` 字段自动判断什么时候该把任务委托给哪个 subagent。

**为什么需要 subagent 而不是在主对话里做所有事？**

- **保留上下文**：探索代码库、跑测试这些操作会产生大量中间输出，放在独立 context window 里可以避免污染主对话
- **强制约束**：通过 `tools` 和 `disallowedTools` 限制它能用什么工具，比如代码审查者只给只读权限
- **跨项目重用**：放在 `~/.claude/agents/` 下的用户级 subagent 在所有项目生效
- **专门化行为**：为特定领域定制系统提示，比如数据科学家、数据库分析师
- **控制成本**：通过 `model` 字段把任务路由到更便宜的模型（如 Haiku）

**内置 subagent 一览：**

| 代理 | 模型 | 工具限制 | 用途 |
|------|------|----------|------|
| **Explore** | Haiku | 只读（拒绝 Write/Edit） | 快速只读探索代码库，彻底度有 quick/medium/very thorough 三档 |
| **Plan** | 继承父对话 | 只读（拒绝 Write/Edit） | Plan 模式下自动调用，收集规划所需的上下文 |
| **General-purpose** | 继承父对话 | 全部 | 处理复杂多步骤任务 |
| **statusline-setup** | Sonnet | 运行 `/statusline` 时 | 配置状态行 |
| **Claude Code Guide** | Haiku | 询问 Claude Code 功能时 | 回答关于 Claude Code 功能的问题 |

<!-- more -->

---

## 二、官方教程精读

### 2.1 快速入门：/agents 命令

官方新增了交互式管理命令 `/agents`，可以：

- 查看所有可用 subagent（内置、用户、项目、插件）
- 引导式创建新 subagent 或让 Claude 自动生成
- 编辑现有 subagent 的配置和工具访问
- 删除自定义 subagent
- 查看同名 subagent 的优先级覆盖情况

也可以用非交互命令 `claude agents` 在命令行列出所有 subagent，按来源分组并标注优先级覆盖情况。这是官方推荐的 subagent 创建和管理方式。

### 2.1 配置文件格式与工具控制

#### 文件格式

每个 subagent 是一个带 YAML frontmatter 的 Markdown 文件，frontmatter 定义配置，正文写系统提示：

```yaml
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
memory: project
---

You are a senior code reviewer ensuring high standards.
As you review code, update your agent memory with patterns,
conventions, and recurring issues you discover.
```

只有 `name` 和 `description` 是必填的，其余都是选填。文件放在哪里决定了作用范围和优先级：

| 位置 | 作用范围 | 优先级 | 说明 |
|------|----------|--------|------|
| Managed settings | 组织级 | 1（最高） | 由组织管理员通过 managed settings 部署 |
| CLI `--agents` 标志 | 当前会话 | 2 | JSON 格式，启动时传递 |
| 项目 `.claude/agents/` | 当前项目 | 3 | 建议纳入版本控制，团队共享 |
| 用户 `~/.claude/agents/` | 所有项目 | 4 | 个人配置，跨项目生效 |
| Plugin 的 `agents/` 目录 | 启用 plugin 的项目 | 5（最低） | 随 plugin 安装 |

#### 工具控制三种方式

subagent 的工具访问有三种控制手段，可以组合使用：

**1. `tools`（允许列表）**——只给需要的工具：

```yaml
---
name: safe-researcher
description: 只读研究代理
tools: Read, Grep, Glob, Bash
---
```

此配置只有 Read、Grep、Glob 和 Bash，无法编辑或写入文件。

**2. `disallowedTools`（拒绝列表）**——继承所有工具但排除少数几个：

```yaml
---
name: no-writes
description: 继承所有工具，除了文件写入
disallowedTools: Write, Edit
---
```

**3. PreToolUse hooks（条件规则）**——最精细的控制，根据条件动态决定：

```yaml
---
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

You are a database analyst with read-only access.
```

这里虽然给了 Bash 工具，但通过 hook 脚本验证每条命令只允许 SELECT 查询，比单纯限制工具粒度更细。

当 `tools` 和 `disallowedTools` 同时设置时，解析顺序是先应用 `disallowedTools` 删除，再从剩余池中解析 `tools`。

#### 高级配置字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 唯一标识符，小写字母和连字符 |
| `description` | 是 | Claude 何时应该委托的自然语言描述，建议用 "Use proactively" 明确触发时机 |
| `tools` | 否 | 允许列表；支持 `Agent(agent_type)` 语法限制可生成的子代理类型 |
| `disallowedTools` | 否 | 拒绝列表；与 tools 同时设置时先应用 disallowedTools 再解析 tools |
| `model` | 否 | 模型选择：sonnet/opus/haiku/完整模型 ID/inherit，默认 inherit |
| `memory` | 否 | 持久内存作用域：user/project/local，启用后自动加载 MEMORY.md 前 200 行 |
| `skills` | 否 | 启动时注入完整技能内容（subagent 不继承父对话技能，必须显式列出） |
| `mcpServers` | 否 | MCP 服务器列表，支持内联定义（限定 subagent）和字符串引用（共享父连接） |
| `permissionMode` | 否 | 权限模式：default/acceptEdits/auto/dontAsk/bypassPermissions/plan |
| `maxTurns` | 否 | subagent 停止前的最大代理轮数 |
| `effort` | 否 | 努力级别：low/medium/high/max（仅 Opus 4.6 支持 max） |
| `isolation` | 否 | 设为 worktree 在临时 git worktree 中运行，无修改则自动清理 |
| `background` | 否 | 设为 true 始终后台运行 |
| `initialPrompt` | 否 | 作为主会话代理（`--agent`）运行时自动提交的首个用户轮次 |
| `color` | 否 | 任务列表和转录中的显示颜色：red/blue/green/yellow/purple/orange/pink/cyan |
| `hooks` | 否 | 限定于此 subagent 的生命周期 hooks（PreToolUse/PostToolUse/Stop） |

**model 解析的 4 级优先级链**：`CLAUDE_CODE_SUBAGENT_MODEL` 环境变量 > 每次调用的 `model` 参数 > frontmatter 的 `model` 字段 > 主对话的模型。

**permissionMode 的优先级规则**：如果父级设置了 `bypassPermissions`，子代理不可覆盖；如果父级使用 `auto` 模式，subagent 继承 auto 模式且其 `permissionMode` 字段被忽略——分类器会以和父会话相同的 block/allow 规则评估 subagent 的工具调用。

**memory 三级作用域**：

| 级别 | 存储位置 | 特点 |
|------|----------|------|
| `user` | `~/.claude/agent-memory/<name>/` | 全局，所有项目共享 |
| `project` | `.claude/agent-memory/<name>/` | 可版本控制，团队共享 |
| `local` | `.claude/agent-memory-local/<name>/` | 不提交到 git，个人本地使用 |

启用 memory 后，subagent 自动获得 Read/Write/Edit 工具，并自动加载 MEMORY.md 前 200 行或 25KB（取先到者）作为上下文，附带指令要求在超出限制时整理 MEMORY.md。这让 subagent 可以在多次会话中积累知识。官方推荐默认使用 `project` 作用域，方便通过版本控制分享。

**mcpServers 两种形式**：

```yaml
# 内联定义：限定此 subagent，启动时连接，完成时断开
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]

# 字符串引用：共享父会话已有的 MCP 连接
mcpServers:
  - github
```

内联定义适合只需要特定 subagent 使用的 MCP 服务，避免消耗主对话的上下文；字符串引用则是共享父会话已经建立的连接。

### 2.2 调用方式、运行模式与常见模式

#### 三种调用方式

**1. 自然语言（Claude 决定是否委托）**：在提示中提及 subagent，Claude 根据 `description` 字段判断是否需要委托。

```
Use the test-runner subagent to fix failing tests
```

**2. @-mention（保证执行）**：输入 `@` 后从自动补全中选择 subagent，确保特定 subagent 运行。

```
@"code-reviewer (agent)" look at the auth changes
```

也可以手动输入：`@agent-<name>` 引用本地 subagent，`@agent-<plugin-name>:<agent-name>` 引用插件 subagent。插件的 subagent 在自动补全中显示为 `<plugin-name>:<agent-name>`。

**3. `--agent` 标志（会话范围替换）**：subagent 的系统提示完全替换默认 Claude Code 系统提示，整个会话都在该 subagent 的上下文中运行。

```bash
claude --agent code-reviewer
```

也可以在 `.claude/settings.json` 中设为默认：

```json
{
  "agent": "code-reviewer"
}
```

#### 前台 vs 后台

| 特性 | 前台 subagent | 后台 subagent |
|------|--------------|---------------|
| 运行方式 | 阻塞主对话直到完成 | 并发运行，不阻塞主对话 |
| 权限交互 | 权限提示和澄清问题传递给你 | 继承预批准权限，自动拒绝未预先批准的操作 |
| 澄清问题 | 可以和你交互 | 工具调用失败但 subagent 继续 |
| 触发方式 | 默认行为，或要求 "run in foreground" | 要求 "run in background"，或 frontmatter 设 `background: true` |
| 切换 | 运行中按 Ctrl+B 放到后台 | — |

禁用后台任务：

```bash
export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1
```

#### 常见模式

**1. 隔离高容量操作**：让测试运行器在独立上下文中运行测试，只返回摘要给主对话，避免大量测试输出污染主上下文。

**2. 并行研究**：同时启动多个 subagent 探索代码库的不同模块，各自独立工作，最后汇总结果。

**3. 链接 subagents**：一个 coordinator subagent 顺序调用多个专用 subagent 完成多步骤工作流：

```yaml
---
name: coordinator
description: Coordinates work across specialized agents
tools: Agent(worker, researcher), Read, Bash
---
```

这里的 `Agent(worker, researcher)` 语法限制了 coordinator 只能生成 `worker` 和 `researcher` 两种子代理。使用 `Agent` 不带括号则允许生成任何类型的子代理。如果 `tools` 中完全省略 `Agent`，则该代理不能生成任何子代理。注意：此限制只适用于通过 `claude --agent` 作为主线程运行的代理；subagent 本身不能再生成子代理，所以 `Agent(agent_type)` 在 subagent 定义中无效。

#### Hooks 配置

subagent 的 hooks 有两个层级：

**Frontmatter 内**（仅限此 subagent）：

| 事件 | 触发时机 |
|------|----------|
| `PreToolUse` | subagent 使用工具之前 |
| `PostToolUse` | subagent 使用工具之后 |
| `Stop` | subagent 完成时（自动转换为 SubagentStop） |

**settings.json 项目级**（全局）：

| 事件 | Matcher | 触发时机 |
|------|---------|----------|
| `SubagentStart` | Agent type name | 任意 subagent 开始执行时 |
| `SubagentStop` | Agent type name | 任意 subagent 完成时 |

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
    ]
  }
}
```

禁用特定 subagent，在 settings.json 中用 `permissions.deny` + `Agent(name)`，或通过 CLI 标志：

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

```bash
claude --disallowedTools "Agent(Explore)"
```

#### 与 Skills 和 /btw 的区别

| 机制 | 运行位置 | 工具访问 | 适用场景 |
|------|----------|----------|----------|
| **Subagent** | 独立 context window | 可限定 | 大量输出、工具限制、成本控制 |
| **Skills** | 主对话上下文中 | 继承主对话 | 可重用提示，在主上下文运行 |
| **/btw** | 查看已有上下文 | 无工具访问 | 快速查看已有内容，不做新操作 |

subagent 不继承父对话的 skills，必须在 frontmatter 中显式列出。

#### 可恢复 subagent

每次执行创建新实例和全新上下文。要继续已有的 subagent 工作而非重新开始，可以让 Claude 恢复它。恢复的 subagent 保留完整对话历史，从上次停止处继续。

subagent 完成后，Claude 获得 agent ID。通过 `SendMessage` 工具（需启用 `CLAUDE_CODE_SUBAGENT_MODEL` 环境变量和 agent teams）以 agent ID 作为 `to` 字段来恢复。已停止的 subagent 收到 `SendMessage` 时会在后台自动恢复，无需新的 `Agent` 调用。

转录（transcript）独立于主对话持久化：主对话压缩不影响 subagent；会话重启后可通过恢复同一会话继续；自动清理周期由 `cleanupPeriodDays` 设置控制（默认 30 天）。转录文件路径：`~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`。

自动压缩默认在约 95% 容量时触发。可通过 `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` 环境变量设更低百分比（如 `50`）提前触发。压缩事件记录在转录文件中，`preTokens` 字段显示压缩前的 token 用量。

### 2.3 官方示例精讲

#### 代码审查者：只读 + 结构化输出

```yaml
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
memory: project
---

You are a senior code reviewer ensuring high standards.
As you review code, update your agent memory with patterns,
conventions, and recurring issues you discover.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)
```

这个示例展示了几个要点：`tools` 只给了只读工具（Read/Grep/Glob/Bash），不含 Edit/Write，所以它只能看不能改；`memory: project` 让它在审查过程中逐步积累代码库的模式和约定；输出按 Critical/Warnings/Suggestions 三级分层，结构清晰。

#### 调试器：可修改 + 完整工作流

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

Focus on fixing the underlying issue, not the symptoms.
```

对比 code-reviewer，debugger 多了 `Edit` 工具——它需要修改代码来修复 bug。工作流也是完整的：诊断→定位→修复→验证。

#### 数据科学家：领域专用 + model 路由

```yaml
---
name: data-scientist
description: Data analysis expert for SQL queries, BigQuery operations, and data insights. Use proactively for data analysis tasks and queries.
tools: Bash, Read, Write
model: sonnet
---

You are a data scientist specializing in SQL and BigQuery analysis.

When invoked:
1. Understand the data analysis requirement
2. Write efficient SQL queries
3. Use BigQuery command line tools (bq) when appropriate
4. Analyze and summarize results
5. Present findings clearly
```

这里用 `model: sonnet` 把任务路由到 Sonnet 模型，适合数据分析这种不需要最强推理的场景来控制成本。官方更新后的描述更具体：聚焦 SQL 和 BigQuery 场景，强调查询效率和成本控制。

#### 数据库查询验证器：Hook 实现条件控制

```yaml
---
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

You are a database analyst with read-only access.
Execute SELECT queries to answer questions about the data.
```

验证脚本 `validate-readonly-query.sh`：

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b' > /dev/null; then
  echo "Blocked: Write operations not allowed. Use SELECT queries only." >&2
  exit 2
fi

exit 0
```

这个示例比单纯限制 tools 更强大：虽然给了 Bash 工具，但通过 PreToolUse hook 在每次调用前验证命令内容，只允许 SELECT 查询。这种条件控制是 `tools`/`disallowedTools` 做不到的——它们只能控制"能不能用 Bash"，而 hook 能控制"Bash 里能执行什么"。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 单一职责是第一原则

刚开始用 subagent 时，我写了几个"全能型"配置——既做代码审查又跑测试还写文档。结果 Claude 经常不知道什么时候该用哪个，调用时机混乱，输出质量也不稳定。

后来按单一职责拆分：`test-runner`（只跑测试）、`changelog-writer`（只更新变更日志）、`code-reviewer`（只做审查）。关键是在 `description` 里用 "Use proactively after code changes" 这样的措辞明确触发时机，让 Claude 判断更准确。

### memory 跨会话积累知识

给 code-reviewer 加上 `memory: project` 后，它会在每次审查时把代码库的模式、团队约定、常见问题写入 MEMORY.md。几次迭代下来，审查质量明显提高——因为它已经"记住"了项目特有的风格和反模式。

这个特性特别适合需要反复执行、且有领域知识积累价值的 subagent。如果是一次性任务，比如 changelog-writer，就不需要 memory。

### 选择策略：主对话 vs subagent vs Skill

| 场景 | 选择 | 原因 |
|------|------|------|
| 快速改个 bug | 主对话 | 需要频繁来回，共享上下文 |
| 跑完整测试套件 | subagent | 大量输出，只关心摘要 |
| 可复用的审查清单 | Skill | 在主上下文运行，共享工具和上下文 |
| 快速查看之前的讨论 | /btw | 无需工具，只是回顾已有内容 |

---

*本文精读自 [Subagents - Claude Code Docs](https://code.claude.com/docs/zh-CN/sub-agents)*

*最后更新：2026-04-09*
