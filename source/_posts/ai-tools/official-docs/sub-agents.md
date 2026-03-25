---
title: 精读官方文档：Subagents（子代理）
date: 2026-03-19 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 12
description: Subagents 是 Claude Code 的专用 AI 助手，可以独立处理特定任务。本文详解配置方法、内置子代理类型、以及如何创建自定义子代理来提升开发效率。
cover: https://picsum.photos/seed/claude-subagents/1920/1080
source_url: https://docs.anthropic.com/en/docs/claude-code/subagents
---

# 精读官方文档：Subagents（子代理）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

**Subagents（子代理）** 是 Claude Code 的专用 AI 助手，可以理解为一个"专家团队"。当你在主对话中遇到特定类型的任务时，Claude Code 可以把这个任务"外包"给专门的子代理去处理。

举个例子：你让 Claude Code 帮你审查代码，它会自动调用一个"代码审查专家"子代理，这个子代理有自己独立的上下文窗口（不会污染主对话），专注于审查代码这一件事，干完活后把结果汇报回来。

<!-- more -->

---

## 二、官方教程精读

### 2.1 Subagent 的核心特性

每个子代理具备以下特点：

- **专业分工**：有明确的职责范围和专业领域
- **独立上下文**：使用独立的上下文窗口，与主对话隔离
- **工具限制**：可以配置只允许使用特定工具
- **自定义提示词**：通过 system prompt 定义行为模式

### 2.2 配置文件位置

子代理存放在两个位置，优先级不同：

| 类型 | 位置 | 作用范围 | 优先级 |
|------|------|----------|--------|
| 项目子代理 | `.claude/agents/` | 当前项目 | 最高 |
| 用户子代理 | `~/.claude/agents/` | 所有项目 | 较低 |

当同名冲突时，项目级子代理优先于用户级子代理。

### 2.3 文件格式详解

每个子代理是一个带 YAML frontmatter 的 Markdown 文件：

```yaml
---
name: your-sub-agent-name
description: 描述何时应该调用这个子代理
tools: Read, Grep, Glob, Bash  # 可选，不填则继承所有工具
model: sonnet  # 可选，指定模型或 inherit
permissionMode: default  # 可选，权限模式
skills: skill1, skill2  # 可选，自动加载的技能
---

这里写子代理的 system prompt，可以多段落详细描述：
- 角色定义
- 工作流程
- 输出格式要求
- 注意事项
```

**配置字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 唯一标识符，小写字母和连字符 |
| `description` | 是 | 自然语言描述何时调用此子代理 |
| `tools` | 否 | 逗号分隔的工具列表，省略则继承所有工具 |
| `model` | 否 | 模型别名（sonnet/opus/haiku）或 inherit |
| `permissionMode` | 否 | 权限模式：default/acceptEdits/bypassPermissions/plan/ignore |
| `skills` | 否 | 逗号分隔的技能名称 |

### 2.4 CLI 方式动态定义

除了文件配置，还可以通过 CLI 参数动态创建：

```bash
claude --agents '{
  "code-reviewer": {
    "description": "专业代码审查，代码变更后主动调用",
    "prompt": "你是资深代码审查专家，关注代码质量、安全性和最佳实践。",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

**优先级规则**：CLI 定义的子代理优先级低于项目级，高于用户级。

### 2.5 内置子代理

Claude Code 自带三个内置子代理：

**General-purpose（通用子代理）**
- 模型：Sonnet
- 工具：全部
- 用途：复杂多步骤任务，既能搜索又能修改

**Explore（探索子代理）**
- 模型：Haiku（快速低延迟）
- 工具：只读（Glob、Grep、Read、只读 Bash）
- 用途：搜索和理解代码库，不修改文件

**Plan（规划子代理）**
- 模型：Sonnet
- 工具：Read、Glob、Grep、Bash
- 用途：Plan 模式下自动调用，用于研究和收集信息

### 2.6 官方示例：Code Reviewer

```yaml
---
name: code-reviewer
description: 代码审查专家，代码变更后主动调用审查质量、安全性和可维护性。
tools: Read, Grep, Glob, Bash
model: inherit
---

你是一位资深代码审查专家，确保代码质量和安全性。

收到调用后：
1. 运行 git diff 查看变更
2. 聚焦修改的文件
3. 立即开始审查

审查清单：
- 代码简洁可读
- 命名规范
- 无重复代码
- 错误处理完善
- 无暴露的密钥
- 输入验证到位
- 测试覆盖充分
- 性能考量到位

按优先级组织反馈：
- 严重问题（必须修复）
- 警告（应该修复）
- 建议（可以考虑改进）

提供具体的修复示例。
```

### 2.7 可恢复子代理

子代理支持跨会话恢复，适合长时间任务：

```bash
# 首次调用，返回 agentId
> 使用 code-analyzer 分析认证模块
[返回 agentId: "abc123"]

# 恢复之前的代理继续工作
> 恢复代理 abc123，继续分析授权逻辑
```

技术细节：
- 每次执行分配唯一 `agentId`
- 对话存储在 `agent-{agentId}.jsonl` 文件中
- 恢复时保留完整上下文

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

---

## 四、常见问题

**Q: 子代理和 MCP 有什么区别？**

A: MCP 是外部工具协议，扩展 Claude Code 能连接什么。子代理是内部任务分发机制，决定谁来干活。可以理解为：MCP 是"外设"，子代理是"团队成员"。

**Q: 子代理能调用另一个子代理吗？**

A: 不能。官方明确说明子代理不能再 spawn 其他子代理，防止无限嵌套。这也是为什么 Plan 子代理存在——在 Plan 模式下，主代理不能执行修改操作，所以需要 Plan 子代理来做研究。

**Q: 怎么查看当前有哪些子代理可用？**

A: 在 Claude Code 中输入 `/agents` 命令，可以查看、创建、编辑、删除所有子代理（包括内置的、用户的、项目的）。

**Q: 子代理会增加延迟吗？**

A: 会。每次调用子代理都需要初始化新的上下文，然后收集信息。但对于复杂任务，这点延迟换来的是主对话上下文的节省，总体是划算的。

---

## 五、小结

Subagents 是 Claude Code 的"专家分工"机制：通过独立上下文、限定工具、自定义提示词，让每个子代理专注于特定任务。用好它的关键是**单一职责 + 清晰的 description**。

下一篇精读：[Memory](/ai-tools/official-docs/memory/) —— 跨会话记忆机制。

---

*本文精读自 [Subagents - Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code/subagents)*

*最后更新：2026-03-25*
