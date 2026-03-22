---
title: 精读官方文档：创建自定义 subagents
date: 2026-03-12 20:14:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 12
description: 精读 Claude Code Subagents 文档，了解如何创建和使用自定义子代理。
cover: https://picsum.photos/seed/claude-subagents/1920/1080
source_url: https://code.claude.com/docs/zh-CN/sub-agents
---

# 精读官方文档：创建自定义 subagents

> 💬 hippo：这是 Claude Code 官方文档精读系列的第十二篇。

---

## 开篇：为什么读这篇文档

Subagents（子代理）是 Claude Code 中一个很实用的功能——你可以把它理解为"专精型 AI 助手"。想象一下，你有一个精通代码审查的助手、一个擅长调试的助手、一个专门处理数据库查询的助手，每个都在自己的小天地里独立工作。

这有什么用呢？简单来说就是：**让专业的人做专业的事**。

我为什么要精读这篇文档？因为在实际使用中，我发现 subagents 能帮我解决几个痛点：
- **保留上下文**：代码探索不会把主对话的上下文占满
- **强制执行约束**：可以限制某些助手只能读不能写，避免误操作
- **跨项目重用**：配置好的助手可以在所有项目中使用
- **控制成本**：把简单任务交给更快的 Haiku 模型，省钱省时

---

<!-- more -->

## 核心概念：大白话讲清楚

### Subagents 是什么？

Subagents 就像是给你的 Claude Code 招聘了几个"分身专家"。每个分身：
- 有自己独立的上下文窗口
- 有专门的系统提示词
- 有特定的工具访问权限
- 有独立的权限设置

当 Claude 发现某个任务适合某个分身处理时，就会把任务委托给它，分身独立工作完成后把结果返回。

### 内置的 Subagents

Claude Code 自带了几个内置分身，用得最多的就是：

**Explore（探索者）**
- **模型**：Haiku（快速、便宜）
- **工具**：只读工具
- **用途**：搜索代码库、理解项目结构
- **何时使用**：当需要"看看代码但不要改"的时候

**Plan（规划者）**
- **模型**：继承主对话
- **工具**：只读工具
- **用途**：在制定计划前收集上下文
- **何时使用**：处于 plan mode 时

**General-purpose（全能者）**
- **模型**：继承主对话
- **工具**：所有工具
- **用途**：复杂的多步骤任务
- **何时使用**：需要既探索又修改的复杂操作

### Claude 如何决定用哪个分身？

关键在于 subagent 的 `description` 字段。你描述得越清晰，Claude 就越准确。

💡 **小技巧**：在描述里加上 "use proactively" 这样的短语，可以鼓励 Claude 更主动地使用这个分身。

---

## 实战指南：手把手教你用

### 场景一：创建代码审查分身

让我们用 `/agents` 命令创建一个代码审查专家：

```bash
# 在 Claude Code 中输入
/agents
```

然后按引导步骤来：
1. 选择"创建新 agent"
2. 输入名称：`code-reviewer`
3. 输入描述：`Expert code reviewer. Use proactively after code changes.`
4. 选择工具：Read、Grep、Glob、Bash
5. 输入系统提示词：
```
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

创建完成后，你可以直接说：
```
Use the code-reviewer subagent to review my recent changes
```

Claude 就会调用这个分身，专注地做代码审查，然后把摘要返回给你。

### 场景二：创建只读数据库分身

如果你需要一个能查询数据库但绝对不能修改的分身，可以这样配置：

创建文件 `.claude/agents/db-reader.md`：

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
```

然后创建验证脚本 `./scripts/validate-readonly-query.sh`：

```bash
#!/bin/bash
# 阻止 SQL 写入操作，只允许 SELECT 查询

# 从 stdin 读取 JSON 输入
INPUT=$(cat)

# 使用 jq 提取命令字段
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# 阻止写入操作（不区分大小写）
if echo "$COMMAND" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b' > /dev/null; then
  echo "Blocked: Write operations not allowed. Use SELECT queries only." >&2
  exit 2
fi

exit 0
```

别忘了给脚本添加执行权限：

```bash
chmod +x ./scripts/validate-readonly-query.sh
```

这样配置后，即使有人（或 AI）试图执行 `UPDATE` 或 `DELETE`，也会被自动拦截。

---

## hippo 的踩坑实录

### 坑点一：描述写得太模糊，Claude 不调用

> 💬 hippo：这个问题让我困惑了好几天。

我第一次创建代码审查分身时，description 写成了：
```yaml
description: Reviews code
```

结果写完代码后说"review my code"，Claude 根本不调用分身，直接自己在主对话里就开始改了。

**原因**：描述太简单，Claude 不知道什么时候该用这个分身。

**解决方案**：把描述写具体，加上触发条件：
```yaml
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
```

关键是加上"Proactively"（主动使用）和具体的使用场景。

### 坑点二：分身范围搞错，其他项目用不了

> 💬 hippo：这个坑很隐蔽，直到我在另一个项目里发现分身不见了。

我一开始把分身放在项目的 `.claude/agents/` 目录下，以为所有项目都能用。结果换了项目就找不到了。

**原因**：分身的存储位置决定了作用范围。

**解决方案**：根据需求选择合适的位置：

| 位置 | 范围 | 适用场景 |
| --- | --- | --- |
| `.claude/agents/` | 当前项目 | 特定于某个代码库的配置，适合团队共享 |
| `~/.claude/agents/` | 所有项目 | 个人通用配置，任何项目都能用 |

如果你想在所有项目里都用这个代码审查分身，就放在 `~/.claude/agents/` 下。

### 坑点三：后台任务权限不足，执行失败

> 💬 hippo：这个问题很搞心态，任务明明在跑，但就是报错。

我把一个分身放在后台运行，结果过一会儿看到任务失败了，提示缺少权限。

**原因**：后台任务需要预先批准所有权限，不能中途询问。

**解决方案**：
1. 启动后台任务时，Claude 会提前问你需要哪些权限，全部批准
2. 或者让 Claude 先在前台运行一次，了解需要什么权限
3. 如果后台任务失败了，可以说"resume the failed task in foreground"恢复到前台

---

## 常见问题解答

**Q: Subagents 和 Skills 有什么区别？**

A: 这是个好问题！简单来说：
- **Subagents**：有独立的上下文窗口，适合需要隔离大量输出的任务
- **Skills**：在主对话上下文中运行，适合可重用的工作流

如果你需要"跑在独立环境里的助手"，用 subagents；如果你需要"可调用的代码片段或知识库"，用 skills。

**Q: 如何让 Claude 更主动地使用某个分身？**

A: 在描述里加上明确的触发条件，比如：
```yaml
description: 主动审查代码质量、安全性和可维护性。代码修改完成后立即使用。
```

使用"主动"、"立即"这样的关键词，效果更好。

**Q: 分身能记住之前的对话吗？**

A: 默认情况下，每次调用都是新的实例。但你可以：
- 要求 Claude"continue the previous code review"来恢复之前的上下文
- 配置 `memory` 字段让分身跨对话积累知识

**Q: 能让一个分身调用另一个分身吗？**

A: 不能。Subagents 无法生成其他 subagents。如果你需要多级代理架构，需要用 Agent SDK 或其他方式。

**Q: 如何查看哪些分身可用？**

A: 在 Claude Code 中输入 `/agents`，会列出所有可用的分身，包括内置的、用户级、项目级和插件提供的。

---

## 一句话总结

Subagents 就像是给 Claude Code 招聘了专业分工的"分身专家"，用得好能大幅提升效率和安全性。

---

**上一篇**：[精读官方文档：使用 MCP 服务器](/ai-tools/official-docs/mcp-servers/)
**下一篇**：[精读官方文档：Agent SDK](/ai-tools/official-docs/agent-sdk/)

---

*本文精读自 [创建自定义 subagents - Claude Code Docs](https://code.claude.com/docs/zh-CN/sub-agents)*
