---
title: 精读官方文档：Claude Code 最佳实践
date: 2026-03-24 23:00:00
updated: 2026-03-25 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 7
description: Claude Code 最佳实践官方文档精读，涵盖 Context 窗口管理、验证工作流、环境配置、提示词技巧，以及如何避免常见失败模式。
cover: https://picsum.photos/seed/claude-best-practices/1920/1080
source_url: https://code.claude.com/docs/en/best-practices
---

# 精读官方文档：Claude Code 最佳实践

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。最佳实践不是"必读"，而是"速查手册"——先通读一遍，遇到问题时回来查。

---

## 一、最佳实践的核心约束

Claude Code 是一个**代理式编码环境**（Agentic Coding Environment）。与等待回答问题的聊天机器人不同，Claude Code 可以读取文件、运行命令、进行修改，并在你观看、重定向或离开的情况下**自主解决问题**。

这意味着你的工作方式需要改变：与其自己编写代码再让 Claude 审查，不如描述你想要什么，让 Claude 自己探索、规划和实现。

但有一个核心约束贯穿所有最佳实践：

**Context Window（上下文窗口）填充得很快，随着填充，性能会下降。**

Context Window 保存你的整个对话，包括：
- 每条消息
- Claude 读取的每个文件
- 每个命令输出

一次调试会话或代码库探索可能会消耗数万个 token。当 Context 快满时，Claude 可能会开始"遗忘"早期指令或犯更多错误。

<!-- more -->

---

## 二、让 Claude 能够验证自己的工作

### 2.1 为什么要提供验证标准

当 Claude 能够验证自己的工作时（运行测试、比较截图、验证输出），它的表现会显著提升。

没有明确的成功标准，Claude 可能产出看起来正确但实际不工作的东西。你成为唯一的反馈循环，每个错误都需要你的关注。

### 2.2 提示词改进对照表

| 策略 | 改进前 | 改进后 |
|------|--------|--------|
| **提供验证标准** | "实现一个验证邮箱地址的函数" | "编写 validateEmail 函数。测试用例：test@example.com 返回 true，invalid 返回 false，test@.com 返回 false。实现后运行测试" |
| **视觉验证 UI** | "让仪表盘看起来更好" | "[粘贴设计稿截图] 实现这个设计。完成后截图并与原始设计对比，列出差异并修复" |
| **解决根本原因** | "构建失败了" | "构建失败，错误：[粘贴错误信息]。修复并验证构建成功。解决根本原因，不要只是抑制错误" |

### 2.3 验证方式选择

| 验证方式 | 适用场景 | 示例 |
|---------|---------|------|
| 测试套件 | 功能开发、Bug 修复 | `npm test`、`pytest` |
| Linter | 代码规范 | `eslint`、`prettier --check` |
| 类型检查 | 类型语言 | `tsc --noEmit` |
| 截图对比 | UI 开发 | Chrome 扩展自动对比 |
| Shell 命令 | 通用验证 | `grep`、`diff`、`curl` |

**建议**：投资使你的验证非常可靠。好的验证是 Claude 高效工作的基础。

---

## 三、先探索，再规划，最后编码

### 3.1 推荐工作流

让 Claude 直接跳到编码可能会产生解决错误问题的代码。官方推荐四个阶段：

| 阶段 | 动作 | 说明 |
|------|------|------|
| 1. 探索 | Claude 先了解代码库 | 读取相关文件，理解现有模式 |
| 2. 规划 | 制定实现方案 | 用 Plan Mode 将规划与执行分离 |
| 3. 执行 | 开始编写代码 | 按计划实施 |
| 4. 验证 | 运行测试验证 | 确保改动正确 |

### 3.2 使用 Plan Mode

Plan Mode（规划模式）将探索与执行分开。在 Plan Mode 下，Claude 只分析、规划，不执行任何修改操作。

**使用方式**：

```bash
# 在提示词中要求先规划
"先用 Plan Mode 分析这个问题，制定修复方案，等我确认后再执行"
```

**适用场景**：
- 复杂功能开发
- 跨多个文件的重构
- 不熟悉的代码库

---

## 四、在提示中提供具体的上下文

Claude 可以推断意图，但它不会读心术。引用特定文件、提及约束、指向示例模式。

### 4.1 提示词改进对照表

| 策略 | 改进前 | 改进后 |
|------|--------|--------|
| **限定任务范围** | "为 foo.py 添加测试" | "为 foo.py 编写测试，覆盖用户已注销的边界情况。避免使用 mock" |
| **指向来源** | "为什么 ExecutionFactory 的 API 这么奇怪" | "查看 ExecutionFactory 的 git 历史并总结其 API 是如何形成的" |
| **参考现有模式** | "添加日历小部件" | "查看主页上现有小部件的实现方式。HotDogWidget.php 是个好例子。按照该模式实现日历小部件，让用户选择月份并翻页选择年份" |
| **描述症状** | "修复登录错误" | "用户报告会话超时后登录失败。检查 src/auth/ 中的身份验证流程，特别是 token 刷新。编写失败的测试来重现问题，然后修复" |

### 4.2 提供丰富内容的方式

| 方式 | 说明 | 示例 |
|------|------|------|
| `@` 引用文件 | 让 Claude 读取指定文件 | `@src/auth/login.py` |
| 直接粘贴图像 | 复制/粘贴或拖放到提示中 | 设计稿截图 |
| 提供 URL | 文档和 API 参考 | 使用 `/permissions` 允许常用域名 |
| 管道数据 | 直接发送文件内容 | `cat error.log \| claude` |
| 让 Claude 自己获取 | 使用 Bash、MCP 工具读取 | "使用 Bash 命令获取 xxx" |

**模糊提示的用途**：当你想看看 Claude 如何解释问题时，模糊提示如"你会改进这个文件的什么？"可以挖掘你没想到的问题。

---

## 五、配置你的环境

一些设置步骤可以让 Claude Code 在所有会话中更高效。

### 5.1 编写有效的 CLAUDE.md

CLAUDE.md 是一个特殊文件，Claude 在每次对话开始时读取。它提供 Claude 无法从代码中推断的持久上下文。

**配置示例**：

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
| Claude 无法猜测的 Bash 命令 | Claude 可以通过读取代码弄清楚的东西 |
| 与默认值不同的代码风格 | 标准语言约定 |
| 测试指令和首选测试运行器 | 详细的 API 文档（改为链接） |
| 存储库礼仪（分支命名、PR 约定） | 经常变化的信息 |
| 特定于项目的架构决策 | 长解释或教程 |
| 开发者环境怪癖（必需的环境变量） | 文件逐个描述代码库 |

**关键原则**：保持简洁。对于每一行，问自己："删除这个会导致 Claude 犯错吗？"如果不会，删除它。臃肿的 CLAUDE.md 会导致 Claude 忽略你的实际指令！

### 5.2 CLAUDE.md 文件导入

使用 `@path/to/import` 语法导入其他文件：

```markdown
See @README.md for project overview and @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

### 5.3 CLAUDE.md 放置位置

| 位置 | 作用域 | 说明 |
|------|--------|------|
| `~/.claude/CLAUDE.md` | 用户级 | 适用于所有 Claude 会话 |
| `./CLAUDE.md` | 项目级 | 提交到 git，团队共享 |
| 父目录 | Monorepo | `root/CLAUDE.md` 和 `root/foo/CLAUDE.md` 都会加载 |
| 子目录 | 按需加载 | 处理该目录文件时才加载 |

### 5.4 配置权限

默认情况下，Claude Code 请求可能修改系统的操作权限。有三种方式减少中断：

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| Auto mode | 分类器模型审查命令，只阻止有风险的 | 信任任务方向，不想每步确认 |
| 权限允许列表 | 允许已知安全的特定工具 | `npm run lint`、`git commit` |
| 沙箱 | 操作系统级隔离，限制文件系统和网络 | 高风险环境 |

### 5.5 安装 CLI 工具

CLI 工具是与外部服务交互的最 context 高效的方式：

```bash
# 如果使用 GitHub
brew install gh  # Claude 知道如何使用 gh 创建 issue、PR、读取评论
```

Claude 也善于学习它不知道的 CLI 工具：

```
Use 'foo-cli-tool --help' to learn about foo tool, then use it to solve A, B, C.
```

### 5.6 创建 Skills

Skills 扩展 Claude 的知识，按需加载不占用每次对话的 context：

**目录结构**：

```
.claude/skills/api-conventions/SKILL.md
```

**SKILL.md 示例**：

```markdown
---
name: api-conventions
description: REST API design conventions for our services
---
# API Conventions
- Use kebab-case for URL paths
- Use camelCase for JSON properties
- Always include pagination for list endpoints
- Version APIs in the URL path (/v1/, /v2/)
```

### 5.7 创建 Subagents

Subagents 在自己的 context 中运行，适合读取大量文件或需要专门关注而不污染主对话的任务：

**配置文件** `.claude/agents/security-reviewer.md`：

```markdown
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

**使用方式**：明确告诉 Claude 使用 subagent：

```
Use a subagent to review this code for security issues.
```

---

## 六、有效沟通

### 6.1 提出代码库问题

当加入新代码库时，直接提问：

- 日志如何工作？
- 如何创建新的 API 端点？
- `foo.rs` 第 134 行的 `async move { ... }` 做什么？
- `CustomerOnboardingFlowImpl` 处理哪些边界情况？
- 为什么这段代码在第 333 行调用 `foo()` 而不是 `bar()`？

**无需特殊提示，直接提问即可。**这是高效的入职工作流。

### 6.2 让 Claude 采访你

Claude 会问你可能没考虑过的问题：

```markdown
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.

Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs.
Don't ask obvious questions, dig into the hard parts I might not have considered.

Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```

规范完成后，**启动新会话来执行**——新会话有干净的 context，完全专注于实现。

---

## 七、管理你的会话

### 7.1 尽早且经常改正方向

| 操作 | 说明 |
|------|------|
| `Esc` | 中途停止 Claude，Context 保留，可重定向 |
| `Esc + Esc` 或 `/rewind` | 打开 rewind 菜单，恢复之前的对话和代码状态 |
| `"撤销那个"` | 让 Claude 恢复其更改 |
| `/clear` | 在不相关任务之间重置 context |

**关键原则**：如果在同一问题上改正 Claude 超过两次，context 已充满失败的方法。运行 `/clear`，用包含学到东西的更具体提示重新开始。

**干净会话 + 更好提示 > 长会话 + 累积改正**

### 7.2 积极管理 Context

Claude Code 在接近 context 限制时自动压缩对话历史：

| 操作 | 说明 |
|------|------|
| `/clear` | 任务间完全重置 context window |
| 自动压缩 | Claude 总结最重要的内容（代码模式、文件状态、关键决策）|
| `/compact <instructions>` | 更多控制，如 `/compact Focus on the API changes` |
| `Esc + Esc` → 选择消息 → Summarize from here | 压缩部分对话，保持早期 context 完整 |
| `/btw` | 快速问题，答案不进入对话历史 |

**自定义压缩行为**：在 CLAUDE.md 中添加：

```markdown
When compacting, always preserve the full list of modified files and any test commands
```

### 7.3 使用 Subagents 进行调查

当 Claude 研究代码库时，它会读取大量文件，所有这些都消耗你的 context。Subagents 在单独的 context windows 中运行并报告摘要：

```
Use subagents to investigate how our authentication system handles token
refresh, and whether we have any existing OAuth utilities I should reuse.
```

### 7.4 恢复对话

Claude Code 在本地保存对话：

```bash
claude --continue    # 恢复最近的对话
claude --resume      # 从最近对话中选择
```

使用 `/rename` 给会话命名，如 `"oauth-migration"` 或 `"debugging-memory-leak"`，方便后续查找。

---

## 八、自动化和扩展

### 8.1 运行非交互模式

```bash
# 一次性查询
claude -p "Explain what this project does"

# 结构化输出用于脚本
claude -p "List all API endpoints" --output-format json

# 流式输出用于实时处理
claude -p "Analyze this log file" --output-format stream-json
```

### 8.2 运行多个 Claude 会话

| 方式 | 说明 |
|------|------|
| 桌面应用 | 可视化管理多个本地会话，每个会话有独立 worktree |
| Web 版 | 在 Anthropic 安全云基础设施的隔离 VM 上运行 |
| Agent teams | 多个会话的自动协调，共享任务、消息和团队主管 |

### 8.3 Writer/Reviewer 模式

新鲜 context 改进代码审查，因为 Claude 不会偏向它刚刚编写的代码：

| 会话 A (Writer) | 会话 B (Reviewer) |
|----------------|-------------------|
| "为 API 端点实现速率限制器" | |
| | "审查 @src/middleware/rateLimiter.ts 的实现。查找边界情况、竞态条件" |
| "这是审查反馈：[会话 B 输出]。解决这些问题。" | |

### 8.4 Auto Mode 自主运行

```bash
claude --permission-mode auto -p "fix all lint errors"
```

分类器模型审查命令，阻止范围升级、未知基础设施操作，让常规工作自动进行。

---

## 九、避免常见失败模式

| 失败模式 | 表现 | 修复方案 |
|---------|------|---------|
| **厨房水槽会话** | 从一个任务开始，问不相关的事，再回到第一个任务，context 充满无关信息 | 在不相关任务之间 `/clear` |
| **反复改正** | Claude 做错，改正，仍错，再改正，context 被失败方法污染 | 两次改正失败后 `/clear`，写更好的初始提示 |
| **过度指定的 CLAUDE.md** | CLAUDE.md 太长，Claude 忽略一半规则 | 无情删减，如果 Claude 已正确做某事，删除该指令 |
| **信任-验证差距** | Claude 产生看起来合理的实现，但不处理边界情况 | 始终提供验证（测试、脚本、截图）|
| **无限探索** | 要求"调查"某些东西不限范围，Claude 读取数百个文件 | 狭窄限定调查范围或使用 subagents |

---

## 十、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 10.1 我遇到的问题

**问题 1：让 Claude "优化整个项目的性能"**

结果它改了一堆不该改的地方，有些优化甚至引入了新 bug。

**问题 2：反复在同一会话中改正**

Claude 犯错 → 我改正 → 它又犯错 → 我再改正 → context 全是错误记录 → Claude 越来越混乱。

### 10.2 我的解决方案

**解决方案 1：一次只优化一个函数**

```
只优化 src/utils/debounce.ts 中的 debounce 函数。
优化成功的标准：执行时间减少 50% 以上，且现有测试全部通过。
```

**解决方案 2：两次改正后立即清空 context**

```
如果 Claude 在同一问题上失败两次，我立刻：
1. /clear 清空会话
2. 写一个包含学到东西的新提示
3. 在新会话中重新开始
```

### 10.3 我最常用的技巧

| 技巧 | 说明 |
|------|------|
| **"先说计划"** | 让它先讲怎么做，我再确认。避免大量返工 |
| **"扮演审查者"** | 让它审查自己的代码，经常能发现第一遍没注意到的问题 |
| **"为什么"** | 问它为什么这么写，帮我看懂它的思路 |
| **使用 Subagent** | 大规模代码调查用 subagent，不污染主会话 context |

---

## 十一、常见问题

**Q: CLAUDE.md 写多长合适？**

A: 越短越好。删除任何 Claude 已经能正确执行的规则。一般控制在 50-100 行以内。

**Q: 什么时候用 Plan Mode？**

A: 复杂功能开发、跨多文件重构、不熟悉的代码库。简单任务（改个 typo、加个 console.log）不需要。

**Q: Subagent 什么时候用？**

A: 需要读取大量文件的调查任务，如"分析整个认证系统"或"查找所有使用这个 API 的地方"。

**Q: Context 多久会满？**

A: 取决于你的使用模式。一般：
- 简单对话：1-2 小时
- 代码库探索：30 分钟
- 大量文件读取：更快

---

## 小结

最佳实践的核心是理解 Context Window 是最重要的资源。围绕这个约束，你需要：
1. **提供验证**：让 Claude 能自己验证工作
2. **分阶段工作**：探索 → 规划 → 编码 → 验证
3. **提供具体上下文**：引用文件、描述症状、指向模式
4. **积极管理会话**：频繁 `/clear`，使用 subagents
5. **配置好环境**：CLAUDE.md、CLI 工具、权限

**下一篇**：[精读官方文档：常见工作流程](/2026/03/23/ai-tools/official-docs/common-workflows/)，调试、测试、PR 的分步配方。

---

*本文精读自 [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)*

*最后更新：2026-03-25*
