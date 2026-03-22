---
title: 精读官方文档：使用 skills 扩展 Claude
date: 2026-03-12 21:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 10
description: 精读 Claude Code Skills 文档，了解如何创建自定义命令、控制技能调用、使用 subagents 等高级功能。
cover: https://picsum.photos/seed/claude-skills/1920/1080
source_url: https://code.claude.com/docs/zh-CN/skills
---

# 精读官方文档：使用 skills 扩展 Claude

> 💬 hippo：这是《Claude Code 官方文档精读》系列的第十篇。Skills 是我使用频率最高的功能之一——它让 Claude 从"通用助手"变成了"定制专家"。

---

## 开篇：为什么这篇文档值得精读

在使用 Claude Code 的过程中，我经历了三个阶段：

1. **只用内置命令**——`/help`、`/compact` 这些，感觉像个增强版补全
2. **发现 Skills 系统**——能自己定义命令，突然打开了新世界
3. **深度自定义**——控制调用时机、限制工具访问、用 subagents 做隔离任务

如果你还在第一阶段，这篇文章会帮你直接跳到第三阶段。

**Skills 的核心价值**：
- 把重复的工作流变成一个命令（比如 `/commit`、`/deploy`）
- 让 Claude 在特定领域表现得像个专家（比如 `/explain-code`）
- 控制工具访问权限，保护你的代码库

> 💬 hippo：记住一个比喻——Skills 就像是给 Claude 装了"插件"。
> 每个插件教会 Claude 一个特定技能，用到的时候自动激活。

<!-- more -->

---

## 核心概念：用大白话讲清楚

### 1. 什么是 Skill

**官方定义**：
Skills 扩展了 Claude 能做的事情。创建一个 `SKILL.md` 文件，其中包含说明，Claude 会将其添加到其工具包中。

> 💬 hippo：通俗地说，Skill 就是一本"使用说明书"。
> 你告诉 Claude：遇到什么情况用什么方法，它就照着做。
>
> 比如：有个 `/explain-code` Skill，告诉 Claude "解释代码时用类比、画 ASCII 图、指出坑点"。
> 下次你问"这个函数怎么用？"，Claude 就会自动调用这个 Skill。

### 2. 捆绑 Skills（Built-in Skills）

Claude Code 自带几个强大的 Skills：

| Skill | 功能 | 使用场景 |
|-------|------|----------|
| `/simplify` | 代码审查和简化 | 功能开发完后清理代码 |
| `/batch <instruction>` | 并行大规模更改 | 重构、迁移框架 |
| `/debug [description]` | 调试当前会话 | Claude 没能解决问题时 |
| `/loop [interval] <prompt>` | 定期重复任务 | 轮询部署、监控 PR |
| `/claude-api` | 加载 API 文档 | 使用 Claude API 开发 |

> 💬 hippo：`/simplify` 是我最常用的捆绑 Skill。
> 每次写完功能跑一遍，它会并行生成三个审查代理（代码重用、质量、效率），汇总问题并修复。
> 就像找了三个专家同时看你的代码。

### 3. Skills 的位置和优先级

| 位置 | 路径 | 适用范围 |
|------|------|----------|
| 企业 | 托管设置 | 组织内所有用户 |
| 个人 | `~/.claude/skills/` | 你的所有项目 |
| 项目 | `.claude/skills/` | 仅此项目 |
| 插件 | `<plugin>/skills/` | 启用插件的位置 |

**优先级**：企业 > 个人 > 项目

> 💬 hippo：这个设计很合理——团队标准可以覆盖个人习惯。
> 但要注意，同一名称的 skill 会按优先级覆盖，不是合并。

---

## 实战指南：手把手教你用

### 场景 1：创建你的第一个 Skill（解释代码）

**问题背景**：
每次让 Claude 解释代码，解释得都很泛，没有直观的类比和图示。

**解决步骤**：

1. **创建 Skill 目录**
   ```bash
   mkdir -p ~/.claude/skills/explain-code
   ```

2. **编写 SKILL.md**
   ```yaml
   ---
   name: explain-code
   description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
   ---

   When explaining code, always include:

   1. **Start with an analogy**: Compare the code to something from everyday life
   2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
   3. **Walk through the code**: Explain step-by-step what happens
   4. **Highlight a gotcha**: What's a common mistake or misconception?

   Keep explanations conversational. For complex concepts, use multiple analogies.
   ```

3. **测试 Skill**
   ```bash
   # 让 Claude 自动调用
   "How does this code work?"

   # 或者直接调用
   "/explain-code src/auth/login.ts"
   ```

> 💬 hippo：注意 `description` 字段很重要——它告诉 Claude 什么时候自动加载这个 Skill。
> 写得越具体，触发越准确。

**预期效果**：
Claude 的解释会包含生活类比、ASCII 流程图、逐步讲解和常见陷阱提醒。

### 场景 2：创建只供手动调用的 Skill（部署）

**问题背景**：
你不想让 Claude 自动决定什么时候部署，只想手动触发。

**解决步骤**：

1. **创建部署 Skill**
   ```yaml
   ---
   name: deploy
   description: Deploy the application to production
   context: fork
   disable-model-invocation: true
   ---

   Deploy $ARGUMENTS to production:

   1. Run the test suite
   2. Build the application
   3. Push to the deployment target
   4. Verify the deployment succeeded
   ```

2. **手动调用**
   ```bash
   /deploy main
   ```

> 💬 hippo：`disable-model-invocation: true` 是关键。
   它告诉 Claude "这个 Skill 只能我手动调用，你别自己决定什么时候用"。
>
> `context: fork` 表示在隔离的 subagent 中运行——这样不会干扰你的主会话。

**预期效果**：
只有你输入 `/deploy` 时才会触发，Claude 不会因为看到代码准备好就自动部署。

### 场景 3：限制工具访问（只读模式）

**问题背景**：
想让 Claude 帮你分析代码库，但不希望它修改任何文件。

**解决步骤**：

1. **创建只读 Skill**
   ```yaml
   ---
   name: safe-reader
   description: Read files without making changes
   allowed-tools: Read, Grep, Glob
   ---

   You are in read-only mode. Explore the codebase, analyze code patterns,
   and provide insights, but do not modify any files.
   ```

2. **调用**
   ```bash
   /safe-reader
   "Analyze the architecture of this project"
   ```

> 💬 hippo：`allowed-tools` 是个很强大的功能。
> 它限定了 Skill 激活时 Claude 可以用哪些工具，不用每次都请求权限。
>
> 常用组合：
> - 只读：`Read, Grep, Glob`
> - 安全编辑：`Read, Edit, Bash(yarn build)`
> - 完全访问：不设置（默认）

**预期效果**：
Claude 可以读取、搜索文件，但无法编辑或执行可能修改代码的命令。

### 场景 4：传递参数给 Skill

**问题背景**：
想根据输入动态调整 Skill 的行为。

**解决步骤**：

1. **创建带参数的 Skill**
   ```yaml
   ---
   name: fix-issue
   description: Fix a GitHub issue
   disable-model-invocation: true
   ---

   Fix GitHub issue $ARGUMENTS following our coding standards.

   1. Read the issue description
   2. Understand the requirements
   3. Implement the fix
   4. Write tests
   5. Create a commit
   ```

2. **调用时传参**
   ```bash
   /fix-issue 123
   # Claude 收到："Fix GitHub issue 123 following our coding standards..."
   ```

3. **访问具体参数**
   ```yaml
   ---
   name: migrate-component
   description: Migrate a component from one framework to another
   ---

   Migrate the $0 component from $1 to $2.
   Preserve all existing behavior and tests.
   ```

   调用：
   ```bash
   /migrate-component SearchBar React Vue
   # $0 = SearchBar, $1 = React, $2 = Vue
   ```

> 💬 hippo：参数替换的几种方式：
> - `$ARGUMENTS`：所有参数
> - `$ARGUMENTS[0]`：第一个参数
> - `$0`、`$1`、`$2`：简写形式
> - `${CLAUDE_SESSION_ID}`：当前会话 ID
> - `${CLAUDE_SKILL_DIR}`：Skill 目录路径

**预期效果**：
Skill 根据传入的参数动态执行不同的任务。

### 场景 5：注入动态上下文（高级）

**问题背景**：
想让 Skill 在运行前执行命令，把结果注入到提示中。

**解决步骤**：

1. **创建使用 shell 命令的 Skill**
   ```yaml
   ---
   name: pr-summary
   description: Summarize changes in a pull request
   context: fork
   agent: Explore
   allowed-tools: Bash(gh *)
   ---

   ## Pull request context
   - PR diff: !`gh pr diff`
   - PR comments: !`gh pr view --comments`
   - Changed files: !`gh pr diff --name-only`

   ## Your task
   Summarize this pull request:
   1. What changes were made?
   2. Why were they made?
   3. Are there any concerns?
   ```

> 💬 hippo：`!`command`` 语法会在发送给 Claude 之前先执行命令。
> 命令输出会替换掉占位符，Claude 只看到最终结果。
>
> 这适合：
> - 获取实时数据（PR 状态、API 响应）
> - 生成报告（测试覆盖率、依赖分析）
> - 预处理输入（格式转换、过滤）

**预期效果**：
每次调用时，Skill 会先获取 PR 的实际数据，然后让 Claude 总结。

---

## hippo 的踩坑实录

### 坑点 1：Skill 描述写得不好，触发不准确

**表现**：
创建了 `/explain-code` Skill，但 Claude 经常不调用，或者在不该调用的时候调用。

**原因**：
`description` 太泛或太具体，Claude 不知道什么时候该用。

**解决**：
1. 在 `description` 中明确使用场景和关键词
2. 如果只想手动调用，设置 `disable-model-invocation: true`
3. 使用 `/skills` 查看所有可用 Skills，确认你的 Skill 被正确加载

> 💬 hippo：我一开始的 description 是 "Explains code" ——太泛了。
> 改成 "Explains code with visual diagrams and analogies. Use when the user asks 'how does this work?' or needs to understand code structure." ——好多了。

### 坑点 2：Skill 内容太长，不触发

**表现**：
写了个很详细的 Skill，结果 Claude 看不到。

**原因**：
当 Skills 太多或内容太长时，会超出上下文预算。

**解决**：
1. 把详细内容移到支持文件（`reference.md`、`examples.md`）
2. 在 `SKILL.md` 中只保留核心说明和导航
3. 使用 `/context` 检查是否有 Skills 被排除

> 💬 hippo：官方建议 `SKILL.md` 控制在 500 行以内。
> 详细参考资料放单独文件，需要时再加载。
>
> 目录结构示例：
> ```
> my-skill/
> ├── SKILL.md          # 核心说明（必需）
> ├── reference.md      # 详细文档（按需加载）
> ├── examples/         # 示例集合
> └── scripts/          # 可执行脚本
> ```

### 坑点 3：在 subagent 中运行 Skill，但没提供任务

**表现**：
设置了 `context: fork`，但 subagent 没有产出任何结果。

**原因**：
`context: fork` 只对有明确任务的 Skill 有意义。如果只是"使用这些 API 约定"这种指南，subagent 不知道要做什么。

**解决**：
1. Skill 必须包含明确的任务说明
2. 或者使用 `agent` 字段指定 subagent 类型

> 💬 hippo：这个坑我踩过。
> 一开始写了个 "API conventions" Skill，设置了 `context: fork`，结果 subagent 啥也没干。
>
> 正确做法：
> - 如果只是背景知识：不用 `context: fork`
> - 如果是执行任务：`context: fork` + 明确任务 + 可选的 `agent` 字段

### 坑点 4：允许列表和拒绝列表的优先级

**表现**：
配置了允许列表，但某个被允许的服务器还是被阻止了。

**原因**：
拒绝列表具有绝对优先级，即使服务器在允许列表上也会被阻止。

**解决**：
理解优先级：拒绝列表 > 允许列表。先检查拒绝列表，再检查允许列表。

> 💬 hippo：记住这个顺序——先检查"禁止"，再检查"允许"。
> 就像安检：先看是否携带违禁品（拒绝），再看是否有通行证（允许）。

### 最佳实践总结

1. **`description` 写清楚**——明确何时使用
2. **控制内容长度**——详细内容放支持文件
3. **`disable-model-invocation` 慎用**——只用于有副作用的操作
4. **`allowed-tools` 提升效率**——减少权限请求
5. **参数处理灵活**——用 `$ARGUMENTS` 或 `$0`、`$1`
6. **动态上下文强大**——`!`command`` 注入实时数据

---

## 常见问题解答

**Q: Skills 和旧的 commands 有什么区别？**

A: Skills 是 commands 的进化版，向后兼容。主要差异：
- Skills 支持目录结构（可以包含支持文件）
- Skills 有更多配置选项（`context`、`agent`、`hooks`）
- Skills 可以自动加载（基于 `description`）
- `.claude/commands/` 中的文件仍然有效，但 Skills 优先

**Q: 什么时候用 `context: fork`？**

A: 当你想要隔离执行时：
- 不想干扰主会话上下文
- 需要专门的 subagent 环境（比如 `Explore` 只读）
- 需要并行执行多个独立任务

**Q: `user-invocable: false` 和 `disable-model-invocation: true` 有什么区别？**

A: `user-invocable` 控制菜单可见性（你能不能在 `/` 菜单看到），`disable-model-invocation` 控制程序调用（Claude 能不能自动调用）。

| Frontmatter | 你可以调用 | Claude 可以调用 | 何时加载到上下文 |
|-------------|-----------|----------------|----------------|
| （默认） | 是 | 是 | 描述始终，调用时完整内容 |
| `disable-model-invocation: true` | 是 | 否 | 你调用时加载完整内容 |
| `user-invocable: false` | 否 | 是 | 描述始终，调用时完整内容 |

**Q: 如何限制 Claude 可以调用哪些 Skills？**

A: 三种方式：
1. 在 `/permissions` 中拒绝 `Skill` 工具（禁用所有）
2. 在 `/permissions` 中配置 `Skill(name)` 允许/拒绝特定 Skills
3. 在 Skill 的 frontmatter 中添加 `disable-model-invocation: true`

**Q: Skills 可以为不同的项目单独配置吗？**

A: 可以。`~/.claude/skills/` 适用于所有项目，`.claude/skills/` 仅适用于当前项目。优先级：项目 > 个人。

---

## 延伸阅读

- 相关文档：[Subagents](https://code.claude.com/docs/zh-CN/sub-agents)
- 参考资料：[Hooks 参考](https://code.claude.com/docs/zh-CN/hooks)
- 参考资料：[Permissions](https://code.claude.com/docs/zh-CN/settings#permissions)

---

## 一句话总结

Skills 让你把 Claude 定制成特定领域的专家，通过编写 `SKILL.md` 定义任务行为，控制调用时机和工具访问，配合 subagents 和动态上下文注入，实现强大的自动化工作流。

**上一篇**：[Claude 如何记住你的项目](/2026/03/12/ai-tools/official-docs/memory/)

**下一篇**：[Hooks 参考](/2026/03/12/ai-tools/official-docs/hooks/)

---

*本文精读自 [使用 skills 扩展 Claude](https://code.claude.com/docs/zh-CN/skills)*
