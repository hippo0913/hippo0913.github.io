---
title: 精读官方文档：Claude Code 最佳实践
date: 2026-03-24 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 7
description: Claude Code 最佳实践官方文档精读，围绕 Context Window 管理这条主线，覆盖验证驱动开发、环境配置（CLAUDE.md、Skills、Hooks、MCP、Plugins）、会话管理、非交互模式与并行会话，以及避免常见失败模式的实战经验。
cover: https://picsum.photos/seed/claude-best-practices/1920/1080
source_url: https://code.claude.com/docs/zh-CN/best-practices
---

# 精读官方文档：Claude Code 最佳实践

> hippo：这是 Claude Code 官方文档精读系列的一篇。最佳实践不是"必读"，而是"速查手册"——先通读一遍，遇到问题时回来查。

---

## 一、最佳实践的核心约束

Claude Code 是一个**代理式编码环境**（Agentic Coding Environment）。和聊天机器人不同，它能读文件、跑命令、改代码，在你看着或离开的情况下**自主解决问题**。这意味着你的角色从"写代码"变成了"描述想要什么，让 Claude 去做"。

但有一条约束贯穿所有最佳实践：

**Context Window（上下文窗口）是最重要的资源。对话、文件读取、命令输出全部消耗 token，满载后性能下降。**

Context Window 保存你的整个对话历史——每条消息、Claude 读过的每个文件、每个命令输出。一次代码库探索可能消耗数万 token。接近满载时，Claude 开始"遗忘"早期指令、犯更多错误。几乎所有最佳实践都可以归结为一句话：**高效利用 Context Window。**

<!-- more -->

---

## 二、让 Claude 能验证自己 + 先探索再编码

### 2.1 验证驱动开发

当 Claude 能**自行验证**工作（运行测试、截图对比、lint 检查），表现会显著提升。否则你就是唯一的反馈循环，每个错误都得你亲自指出。

| 策略 | 改进前 | 改进后 |
|------|--------|--------|
| **提供验证标准** | "实现一个验证邮箱的函数" | "编写 validateEmail 函数。测试：test@example.com 返回 true，invalid 返回 false。实现后运行测试" |
| **视觉验证 UI** | "让仪表盘更好看" | "[贴设计稿截图] 实现这个设计。完成后截图对比，列出差异并修复" |
| **解决根本原因** | "构建失败了" | "构建失败，错误：[贴报错]。修复并验证构建成功，解决根因不要只抑制错误" |

**验证方式选择**：

| 验证方式 | 适用场景 | 示例 |
|---------|---------|------|
| 测试套件 | 功能开发、Bug 修复 | `npm test`、`pytest` |
| Linter | 代码规范 | `eslint`、`prettier --check` |
| 类型检查 | 类型语言 | `tsc --noEmit` |
| 截图对比 | UI 开发 | 自动截图与设计稿对比 |
| Shell 命令 | 通用验证 | `grep`、`diff`、`curl` |

### 2.2 四阶段工作流

直接让 Claude 开写代码，容易产出"解决错问题"的代码。官方推荐四阶段：

| 阶段 | 动作 | 说明 |
|------|------|------|
| 1. 探索 | Claude 先了解代码库 | 读取相关文件，理解现有模式 |
| 2. 规划 | 制定实现方案 | 用 Plan Mode（`Shift+Tab`）把规划和执行分开 |
| 3. 执行 | 按计划编码 | 落地实现 |
| 4. 验证 | 运行测试验证 | 确保改动正确 |

> hippo：我最常用的技巧就是"先说计划"——让它先讲怎么做，我确认后再动手。避免大量返工。

---

## 三、提示词技巧与上下文提供

Claude 能推断意图，但不会读心术。引用特定文件、提及约束、指向现有模式，效果天差地别。

### 3.1 提示词改进对照表

| 策略 | 改进前 | 改进后 |
|------|--------|--------|
| **限定范围** | "为 foo.py 添加测试" | "为 foo.py 编写测试，覆盖用户已注销的边界情况，不用 mock" |
| **指向来源** | "为什么 API 这么奇怪" | "查看 ExecutionFactory 的 git 历史并总结其 API 如何形成" |
| **参考现有模式** | "添加日历小部件" | "看主页上 HotDogWidget.php 的实现方式，按该模式做日历小部件" |
| **描述症状** | "修复登录错误" | "会话超时后登录失败。检查 src/auth/ 的 token 刷新逻辑，先写失败测试再修复" |

### 3.2 提供丰富内容的方式

| 方式 | 说明 | 示例 |
|------|------|------|
| `@` 引用文件 | 让 Claude 读取指定文件 | `@src/auth/login.py` |
| 粘贴图片 | 设计稿、截图直接粘贴 | 复制/拖放到终端 |
| 提供 URL | 文档和 API 参考 | 用 `/permissions` 允许域名 |
| 管道数据 | 直接发送文件内容 | `cat error.log \| claude` |
| 让 Claude 自己获取 | 用 Bash、MCP 工具读取 | "用 Bash 获取 xxx" |

**模糊提示的妙用**：当你想看看 Claude 如何理解问题时，"你会改进这个文件的什么？"这类开放提问能帮你发现没想到的问题。

---

## 四、配置你的环境

一些设置能让 Claude Code 在**所有会话**中更高效。这是投资回报率最高的环节。

### 4.1 CLAUDE.md：持久上下文载体

CLAUDE.md 每次对话自动加载，是告诉 Claude "这个项目怎么运作"的核心工具。关键原则：**只放 Claude 无法推断的信息**。

```markdown
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
```

**应该包含 vs 不应包含**：

| 应该包含 | 不应包含 |
|---------|---------|
| Claude 猜不到的 Bash 命令 | 代码里能看出来的东西 |
| 与默认不同的代码风格 | 标准语言约定 |
| 测试指令和首选测试运行器 | 详细 API 文档（改为链接） |
| 分支命名、PR 约定等仓库礼仪 | 经常变化的信息 |
| 开发环境怪癖（必需的环境变量） | 逐文件描述代码库 |

> hippo：对 CLAUDE.md 的每一行，问自己"删掉它 Claude 会犯错吗？"不会就删。臃肿的 CLAUDE.md 会让 Claude 忽略你真正重要的指令。我之前往里塞了一整页项目说明，结果 Claude 反而更不听话了。

**放置位置与文件导入**：

| 位置 | 作用域 |
|------|--------|
| `~/.claude/CLAUDE.md` | 用户级，所有会话生效 |
| `./CLAUDE.md` | 项目级，提交到 git 团队共享 |
| 父目录 / 子目录 | Monorepo 支持，子目录按需加载 |

用 `@path/to/import` 语法引用其他文件：

```markdown
See @README.md for project overview and @package.json for available npm commands.
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

### 4.2 Skills：按需加载的知识模块

Skills 与 CLAUDE.md 互补——CLAUDE.md 每次都加载，Skills **按需加载**，不膨胀 context。适合"有时才需要"的领域知识或可复用工作流。

```markdown
# .claude/skills/fix-issue/SKILL.md
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Analyze and fix the GitHub issue: $ARGUMENTS.
1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes
5. Write and run tests to verify the fix
6. Create a descriptive commit message
7. Push and create a PR
```

| Skill Front Matter 字段 | 说明 |
|------------------------|------|
| `name` | Skill 名称 |
| `description` | 描述，Claude 根据此决定何时使用 |
| `disable-model-invocation` | 设为 true 防止模型自动调用 |

### 4.3 Subagents：独立的 Context 调查员

Subagents 在**独立 context window** 中运行，适合大规模代码调查，避免污染主对话。是最强大的 context 管理工具之一。

```markdown
# .claude/agents/security-reviewer.md
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---
You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling
Provide specific line references and suggested fixes.
```

| Subagent Front Matter 字段 | 说明 |
|--------------------------|------|
| `name` | Agent 名称 |
| `description` | 描述何时使用 |
| `tools` | 可用工具列表 |
| `model` | 指定模型（如 `opus`） |

### 4.4 Hooks、MCP 服务器、Plugins 与权限

**Hooks**（钩子）让你在特定事件发生时自动执行脚本，比如每次文件修改后自动截图验证。编辑 `.claude/settings.json` 配置，运行 `/hooks` 浏览已配置内容。

**MCP 服务器**（Model Context Protocol，一种让 AI 连接外部工具的标准协议）让 Claude 调用第三方 API、数据库等外部资源。

**Plugins** 提供预打包的能力扩展，开箱即用。

**权限三种模式**：

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| Auto mode | 分类器审查命令，只阻止有风险的 | 信任任务方向，减少确认 |
| 权限允许列表 | 白名单特定工具 | `npm run lint`、`git commit` |
| 沙箱 | 操作系统级隔离 | 高风险环境 |

**快速初始化**：运行 `/init` 可以让 Claude 自动分析项目并生成 CLAUDE.md 初稿，是新建项目的最佳起点。

### 4.5 CLI 工具

CLI 工具是与外部服务交互最 context 高效的方式：

```bash
# GitHub 集成
brew install gh  # Claude 知道如何用 gh 创建 issue、PR、读取评论

# 不熟悉的工具也可以让 Claude 自己学
# "Use 'foo-cli-tool --help' to learn about it, then use it to solve A, B, C."
```

---

## 五、会话管理与自动化扩展

### 5.1 积极管理 Context

| 操作 | 说明 |
|------|------|
| `/clear` | 任务间完全重置 context window |
| `/compact <指令>` | 控制压缩行为，如 `/compact Focus on the API changes` |
| `Esc` + `Esc` → Summarize from here | 压缩部分对话，保留早期 context |
| `/btw` | 快速问题，答案不进入对话历史——问完就走，不占 context |
| 自动压缩 | 接近限制时 Claude 自动总结重要内容 |

**核心原则**：如果在同一问题上纠正 Claude 超过两次，context 已充满失败方法。`/clear` 后用包含学到东西的新提示重新开始。

**自定义压缩行为**——在 CLAUDE.md 中加：

```markdown
When compacting, always preserve the full list of modified files and any test commands
```

### 5.2 Subagents 进行代码调查

当 Claude 研究代码库时会读取大量文件，全部消耗你的 context。让 Subagent 去做：

```
Use subagents to investigate how our authentication system handles token
refresh, and whether we have any existing OAuth utilities I should reuse.
```

Subagent 在独立 context 中完成调查，只返回摘要给你——主对话的 context 保持干净。

### 5.3 非交互模式与并行会话

```bash
# 一次性查询
cat error.log | claude -p "Explain these errors"

# 结构化输出用于脚本集成
claude -p "List all API endpoints" --output-format json

# 自动权限模式批量修复
claude --permission-mode auto -p "fix all lint errors"

# 恢复对话
claude --continue    # 恢复最近的对话
claude --resume      # 从最近对话中选择
```

**多会话并行策略**：

| 方式 | 说明 |
|------|------|
| 桌面应用 | 多个本地会话，每个有独立 worktree |
| Web 版 | 隔离 VM 上运行 |
| Writer/Reviewer | 一个会话写代码，另一个审查——新鲜 context 审查更客观 |
| Agent teams | 多会话自动协调，共享任务和团队主管 |

> hippo：我写博客文章时就用 Writer/Reviewer 模式——一个会话负责写作，另一个审查评分。审查会话没有"自己写的代码"的偏见，反馈更真实。

---

## 六、避免失败模式与 hippo 实战经验

### 6.1 五大失败模式

| 失败模式 | 表现 | 修复方案 |
|---------|------|---------|
| **厨房水槽会话** | 一个会话塞满不相关任务，context 充满噪音 | 不相关任务之间 `/clear` |
| **反复纠正** | 改正两次还在错，context 被失败方法污染 | 两次纠正失败后立即 `/clear`，写更好的初始提示 |
| **臃肿 CLAUDE.md** | 规则太多，Claude 忽略一半 | 无情删减，Claude 已正确做的事不用写 |
| **信任-验证差距** | 产出看起来对但边界情况不对 | 始终提供验证（测试、脚本、截图） |
| **无限探索** | "调查"不限范围，Claude 读取数百文件 | 狭窄限定调查范围，或用 Subagent |

### 6.2 hippo 的踩坑经验

> hippo：以下是真实踩坑，不是编的。

**踩坑 1：让 Claude "优化整个项目的性能"**

结果它改了一堆不该改的地方，有些优化反而引入新 bug。

正确做法——一次只优化一个函数：

```
只优化 src/utils/debounce.ts 中的 debounce 函数。
优化成功的标准：执行时间减少 50% 以上，且现有测试全部通过。
```

**踩坑 2：反复在同一会话中纠正**

Claude 犯错 -> 我纠正 -> 它又犯错 -> 我再纠正 -> context 全是错误记录 -> Claude 越来越混乱。

正确做法——两次纠正后立即 `/clear`，写一个包含学到东西的新提示重新开始。

**踩坑 3：CLAUDE.md 塞太多内容**

我往 CLAUDE.md 里写了两百多行项目说明，结果 Claude 反而更不听话了——因为它在长文中找不到重点。

正确做法——控制在 50-100 行以内，只保留 Claude 猜不到的信息。用 `@` 导入语法引用详细文档，不直接塞进去。

### 6.3 我最常用的技巧

| 技巧 | 说明 |
|------|------|
| "先说计划" | 让它先讲怎么做，我确认后再动手，避免大量返工 |
| "扮演审查者" | 让它审查自己的代码，经常能发现第一遍没注意到的问题 |
| "为什么这么写" | 问它思路，帮我看懂它的决策，也帮它反思 |
| Subagent 调查 | 大规模代码调查用 subagent，主会话 context 保持干净 |
| `/btw` 快问 | 不确定的小问题用 `/btw` 问，不污染对话历史 |

---

## 小结

最佳实践的核心是理解 **Context Window 是最重要的资源**。围绕这个约束：

1. **提供验证**：让 Claude 能自己验证工作，测试、lint、截图都行
2. **分阶段工作**：探索 -> 规划 -> 编码 -> 验证
3. **配置好环境**：CLAUDE.md 精简高效、Skills 按需加载、Hooks 自动化、Subagent 隔离调查
4. **积极管理会话**：频繁 `/clear`、用 `/compact` 和 `/btw` 控制 context 消耗
5. **避免失败模式**：厨房水槽会话、反复纠正、臃肿配置——认出它们，立即修正

---

**下一篇**：[精读官方文档：常见工作流程](/2026/03/23/ai-tools/official-docs/common-workflows/)，调试、测试、PR 的分步配方。

---

*本文精读自 [Best Practices for Claude Code](https://code.claude.com/docs/zh-CN/best-practices)*

*最后更新：2026-03-31*
