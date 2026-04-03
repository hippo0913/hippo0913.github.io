---
title: 精读官方文档：扩展 Claude Code
date: 2026-03-03 23:00:00
updated: 2026-03-31 15:00:00
tags: [Claude Code, 入门]
categories: [AI 工具系列]
series: claude-code
series_index: 1
description: Claude Code 内置工具覆盖大多数编码任务，但你还可以通过 CLAUDE.md、Skills、Subagents、MCP、Hooks、Plugins 等扩展层来定制它。本文帮你理清 7 大扩展功能的作用、区别、优先级和上下文成本。
cover: https://picsum.photos/seed/claude-features-overview/1920/1080
source_url: https://docs.anthropic.com/en/docs/claude-code/features-overview
---

# 精读官方文档：扩展 Claude Code

> 💬 hippo：这是 Claude Code 官方文档精读系列的第一篇。先理解扩展功能的整体架构，才能知道什么时候该用什么工具。

---

## 一、这个功能是什么

Claude Code 的核心是一个能推理代码的 AI 模型，加上一套内置工具——文件读写、代码搜索、命令执行、网络访问。这套内置工具已经能覆盖绝大多数编码任务了。

本篇讲的是**扩展层**：你主动添加的自定义功能，用来告诉 Claude 更多项目知识、连接外部服务、自动化工作流。扩展层一共 7 大功能：CLAUDE.md、Skills、Subagents、Agent teams、MCP、Hooks、Plugins。理解它们各自的定位和适用场景，是高效使用 Claude Code 的关键。

<!-- more -->

---

## 二、官方教程精读

### 2.1 扩展功能概览

7 大功能分别作用于代理循环（Agent Loop，即 Claude 每次收到指令后的"思考-行动-观察"循环）的不同环节。下表一目了然：

| 功能 | 作用 | 何时使用 | 示例 |
|------|------|----------|------|
| **CLAUDE.md** | 每次对话自动加载的持久上下文 | 项目约定、"始终执行 X" 规则 | "用 pnpm 不用 npm，提交前跑测试" |
| **Skill** | Claude 可调用的说明、知识和工作流 | 可复用内容、参考文档、可重复任务 | `/deploy` 运行部署清单；API 文档 skill |
| **Subagent** | 在隔离上下文中执行，只返回摘要结果 | 上下文隔离、并行任务、专门工作者 | 读几十个文件但只返回关键发现 |
| **Agent teams** | 协调多个独立的 Claude Code 会话 | 并行研究、多角色审查、竞争假设调试 | 同时启动安全、性能、测试三个审查者 |
| **MCP** | 连接到外部服务（Model Context Protocol，一种让 AI 连接外部工具的标准协议） | 需要外部数据或操作 | 查数据库、发 Slack、控制浏览器 |
| **Hook** | 在事件上运行的确定性脚本（不涉及 LLM） | 可预测的自动化 | 每次文件编辑后自动跑 ESLint |
| **Plugin** | 打包层，将 skills/hooks/subagents/MCP 捆绑成可安装单元 | 跨仓库复用、分发给别人 | `/my-plugin:review` 命名空间化 |

> 💬 hippo：**Plugins** 是打包层。它把 skills、hooks、subagents 和 MCP servers 打包成一个可安装单元。Plugin skills 是带命名空间的（如 `/my-plugin:review`），所以多个 plugins 可以和平共存。如果你想把自己的配置方案分享给团队，或者发布到 marketplace 让其他人使用，Plugin 就是正确的选择。

### 2.2 相似功能对比

这 7 个功能中，有几组看起来很像，容易混淆。下面逐一拆解。

**Skill vs Subagent：**

| 方面 | Skill | Subagent |
|------|-------|----------|
| **本质** | 可复用的说明、知识或工作流 | 有自己上下文窗口的隔离工作者 |
| **关键优势** | 在不同上下文之间共享内容 | 上下文隔离，工作单独进行，仅返回摘要 |
| **最适合** | 参考材料、可调用的工作流（如 `/deploy`） | 读大量文件的任务、并行工作、专门工作者 |

Skills 可以是**参考型**（提供知识，如 API 风格指南）或**操作型**（触发动作，如 `/deploy`）。

当需要上下文隔离、或者主对话的上下文窗口快满时，就该用 Subagent。Subagent 可能读几十个文件、跑大量搜索，但主对话只收到一段摘要。

**两者可以结合**：Subagent 可以通过 `skills:` 字段预加载特定 skills；Skill 可以通过 `context: fork` 在隔离上下文中运行。

**CLAUDE.md vs Skill：**

| 方面 | CLAUDE.md | Skill |
|------|-----------|-------|
| **加载方式** | 每次会话自动加载 | 按需加载 |
| **能引入文件** | 能，用 `@path` 导入 | 能，用 `@path` 导入 |
| **能触发工作流** | 不能 | 能，用 `/<name>` |
| **最适合** | "每次都要遵守"的规则 | 参考材料、可触发的工作流 |

简单判断：如果 Claude 应该**始终知道**，放 CLAUDE.md；如果只是**偶尔需要**的参考或工作流，做 Skill。

**CLAUDE.md vs Rules vs Skills：**

三者都能存说明，但加载方式不同：

| 方面 | CLAUDE.md | `.claude/rules/` | Skill |
|------|-----------|-------------------|-------|
| **加载时机** | 每次会话 | 每次会话，或打开匹配文件时 | 按需，被调用或相关时 |
| **作用范围** | 整个项目 | 可以限定到文件路径 | 特定任务 |
| **最适合** | 核心约定和构建命令 | 语言或目录特定的指南 | 参考材料、可重复工作流 |

`.claude/rules/` 的杀手锏是 `paths` frontmatter，可以让规则只在特定目录或文件生效：

```yaml
---
description: Go 项目的测试规范
paths:
  - "**/*.go"
---
# Go 测试规范
- 测试文件放在同目录，命名为 `*_test.go`
- 运行 `go test ./...` 确保全部通过
- 表驱动测试优先
```

这样当 Claude 操作 `.go` 文件时才加载这条规则，避免了无谓的上下文消耗。

**Subagent vs Agent team：**

| 方面 | Subagent | Agent team |
|------|----------|------------|
| **上下文** | 自有上下文，结果返回给调用者 | 自有上下文，完全独立 |
| **通信** | 只向主代理报告结果 | 队友之间直接互发消息 |
| **协调** | 主代理管理所有工作 | 共享任务列表，自协调 |
| **最适合** | 只关心最终结果的聚焦任务 | 需要讨论和协作的复杂工作 |
| **Token 成本** | 较低：摘要返回主上下文 | 较高：每个队友是独立的 Claude 实例 |

**MCP vs Skill：**

| 方面 | MCP | Skill |
|------|-----|-------|
| **本质** | 连接外部服务的协议 | 知识、工作流和参考材料 |
| **提供** | 工具和数据访问 | 知识、工作流、参考材料 |
| **示例** | Slack 集成、数据库查询、浏览器控制 | 代码审查清单、部署工作流、API 风格指南 |

这两个不冲突，而是协同工作：**MCP 给 Claude 与外部系统交互的能力**，**Skill 给 Claude 如何有效使用这些工具的知识**。

### 2.3 功能分层与优先级

功能可以在多个级别定义：用户级（所有项目通用）、项目级（当前项目）、Plugin 级、托管策略级（企业统一管理）。当同一功能在不同级别都存在时，它们的合并行为不同：

| 功能 | 分层行为 | 优先级顺序（高 → 低） |
|------|----------|----------------------|
| **CLAUDE.md** | 累加：所有级别同时贡献内容 | 更具体的说明优先（子目录 > 项目根 > 用户级） |
| **Skills** | 按名称覆盖 | 托管 > 用户 > 项目 > Plugin |
| **Subagents** | 按名称覆盖 | 托管 > CLI 标志 > 项目 > 用户 > Plugin |
| **MCP 服务器** | 按名称覆盖 | 本地 > 项目 > 用户 |
| **Hooks** | 合并：所有注册的 hooks 都会触发 | 不覆盖，全部执行 |

CLAUDE.md 的累加行为意味着：工作目录及以上的文件在启动时加载，子目录的 CLAUDE.md 在你访问到那些文件时才加载。当说明冲突时，Claude 会自行判断，通常更具体的优先。

### 2.4 组合功能实战

真实场景中，你不会只用一种扩展，而是根据工作流组合使用：

| 模式 | 工作原理 | 示例 |
|------|----------|------|
| **Skill + MCP** | MCP 提供连接能力，Skill 教 Claude 怎么用好它 | MCP 连接数据库，Skill 记录数据表结构和查询模式 |
| **Skill + Subagent** | Skill 为并行工作生成多个 Subagent | `/audit` Skill 同时启动安全、性能、风格三个 Subagent |
| **CLAUDE.md + Skills** | CLAUDE.md 存核心规则，Skills 存按需加载的参考材料 | CLAUDE.md 说"遵循 API 规范"，Skill 包含完整 API 风格指南 |
| **Hook + MCP** | Hook 通过 MCP 触发外部操作 | 编辑后 Hook 在 Claude 改了关键文件时发 Slack 通知 |

### 2.5 上下文成本详解

你添加的每个功能都会消耗 Claude 的上下文窗口。太多内容不仅会撑满窗口，还会产生噪音让 Claude 效率降低——Skill 可能触发不正确，或者 Claude 忘记你的约定。

| 功能 | 何时加载 | 加载内容 | 上下文成本 |
|------|----------|----------|------------|
| **CLAUDE.md** | 会话开始 | 完整内容 | **每个请求都消耗** |
| **Skills** | 会话开始 + 使用时 | 启动时加载描述，使用时加载完整内容 | 低（每个请求只有描述） |
| **MCP 服务器** | 会话开始 | 工具名称；完整 JSON Schema 延迟到使用时才加载 | 低（工具搜索默认启用，消耗约 10%） |
| **Subagents** | 生成时 | 新鲜隔离的上下文，含系统提示、指定 Skills、CLAUDE.md、git 状态 | 与主会话完全隔离 |
| **Hooks** | 触发时 | 默认无（外部脚本运行） | **零**，除非 Hook 返回了额外输出 |

这里有几个值得注意的细节：

**MCP 的工具搜索机制**：默认启用，启动时只加载工具名称，完整的 JSON Schema（定义工具参数的结构）在 Claude 实际调用某个工具时才延迟加载。这意味着闲置的 MCP 工具消耗的上下文很少。但 MCP 连接可能在会话中途无声失败——如果服务器掉线，工具会无警告地消失。Claude 可能尝试调用一个已经不存在的工具然后报错。发现这种情况时，用 `/mcp` 命令检查连接状态。

**Skill 的零成本模式**：默认情况下，Skill 描述在会话开始时加载，好让 Claude 判断什么时候该用哪个 Skill。如果你有些 Skill 只想手动触发，可以在 frontmatter 中设置 `disable-model-invocation: true`：

```yaml
---
name: db-migration
description: 数据库迁移操作指南
disable-model-invocation: true
---
# 数据库迁移指南

## 步骤
1. 在 `migrations/` 目录创建迁移文件
2. 运行 `yarn db:migrate:up` 应用迁移
3. 验证迁移结果后提交
```

设置后，Claude 完全看不到这个 Skill，只有你用 `/db-migration` 手动调用时才加载，上下文成本降为零。

**Subagent 不继承主会话的 Skills**：Subagent 启动时获得的是全新的隔离上下文，它只包含你在 `skills:` 字段中显式指定的 Skills。主会话已经加载的 Skills 不会自动传递给 Subagent。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中踩过的坑和解决方案：

### 3.1 CLAUDE.md 膨胀问题

我的博客项目 CLAUDE.md 一开始只有 50 行，写着构建命令和代码规范。随着项目复杂度增加，不断往里加规则——截图验证流程、Hook 配置说明、系列文章规范——最后膨胀到 300+ 行。

后果是 Claude 开始**忽略部分规则**。不是不想遵守，是上下文太长，规则之间互相"稀释"了。有些规则它就是"看不见"了。

**我的解决方案**：把特定场景的规则拆分到 `.claude/rules/` 目录下，用 `paths` frontmatter 限定生效范围。比如截图验证的规则只在编辑 `_posts` 目录下的文件时才生效，Go 项目的测试规范只在操作 `.go` 文件时加载。CLAUDE.md 本身精简回 100 行以内，只保留最核心的项目约定。

### 3.2 MCP 连接断开

我在项目中配置了 Puppeteer 的 MCP 服务器用于截图验证。有一次会话中，Claude 报错说找不到截图工具。排查后发现是 MCP 服务器进程挂了，但 Claude 没有任何提示——它只是尝试调用一个不存在的工具然后报错。

**我的解决方案**：养成习惯，遇到 Claude 调用外部工具报错时，第一反应是运行 `/mcp` 检查服务器状态。后来我加了一个 Hook，在每次会话开始时自动检查 MCP 连接状态。

### 3.3 Skill 描述模糊导致加载错误

我创建了一个 Skill 用于博客文章发布前的自检清单，但 description 字段写得太笼统（"文章检查工具"）。结果 Claude 在处理代码提交时也误加载了这个 Skill，因为"检查"这个词太宽泛。

**我的解决方案**：优化 Skill 的 description 字段，写得更具体——"博客文章发布前的内容质量检查清单，仅在编辑 `_posts` 目录下的 Markdown 文件时使用"。精确的描述让 Claude 能更准确地判断何时该加载这个 Skill。

### 3.4 Subagent 不继承主会话 Skills

我有一个 `/doc-rewrite` Skill 用于文档重写工作流，里面定义了评分标准和写作规范。当我让 Claude 用 Subagent 并行处理多篇文章时，发现 Subagent 完全不知道这些规范——它根本看不到主会话里加载的 Skill。

**我的解决方案**：在生成 Subagent 时，显式在 `skills:` 字段中指定需要传递的 Skills：

```yaml
skills:
  - doc-rewrite
  - scoring-rules
```

### 3.5 我的选择策略

给新手的建议，按需添加，不要一口气全上：

1. **先从 CLAUDE.md 开始**：把项目最核心的约定写进去（包管理器、构建命令、目录结构）
2. **遇到重复任务时加 Skill**：经常要做的代码审查、部署流程，做成可调用的 Skill
3. **需要外部数据时加 MCP**：想让 Claude 查数据库、发 Slack、控制浏览器
4. **要自动化时加 Hook**：保存后自动 lint、提交前自动跑测试
5. **需要隔离或并行时用 Subagent**：大量文件搜索、多任务并行
6. **复杂协作用 Agent team**：多角色审查、竞争假设验证

---

## 四、常见问题

**Q: CLAUDE.md 和 Skill 都能存说明，用哪个？**

A: 看"是否每次都需要"。每次对话都要遵守的规则（构建命令、代码规范、目录结构），放 CLAUDE.md；偶尔用到的参考材料（API 文档、部署清单、审查流程），做 Skill。经验法则：CLAUDE.md 控制在 200 行以内，超了就拆到 `.claude/rules/` 或 Skills。

**Q: Subagent 和 Agent team 有什么区别？**

A: Subagent 是在当前会话内启动的"临时工"，干完活返回摘要就消失，由主代理统一管理。Agent team 是多个完全独立的 Claude Code 实例，它们之间可以直接通信、共享任务列表、自主协调。需要讨论和协作的复杂工作选 Agent team，只要结果的聚焦任务选 Subagent。

**Q: 上下文满了怎么办？**

A: 三步走：一查 CLAUDE.md 是否太长（超过 200 行就该拆分）；二查 MCP 服务器是否太多（每个服务器的工具定义都要占上下文）；三查 Skill 是否可以用 `disable-model-invocation: true` 隐藏不常用的。

**Q: Hook 会消耗上下文吗？**

A: 默认不会。Hook 作为外部脚本运行，零上下文消耗。只有当 Hook 返回了输出信息时，这些输出才会作为消息添加到对话中占用上下文。

**Q: 我的 rules 文件怎么只在特定目录生效？**

A: 在 `.claude/rules/` 下的 Markdown 文件中使用 `paths` frontmatter 指定匹配模式。比如 `paths: ["**/*.go"]` 只在操作 Go 文件时加载，`paths: ["src/components/**"]` 只在编辑 `src/components` 目录时生效。不写 `paths` 则每次会话都会加载。

**Q: 怎么知道 Skill 被正确加载了？**

A: 会话中输入 `/` 可以看到所有可用 Skill 的列表。如果 Skill 带有 `disable-model-invocation: true`，它不会出现在 Claude 的自动发现列表中，但你可以手动用 `/skill-name` 调用。如果调用时报错，检查文件名和 frontmatter 的 `name` 字段是否一致。

---

## 五、小结

| 功能 | 一句话 | 典型场景 |
|------|--------|----------|
| CLAUDE.md | 每次加载的"项目说明书" | 项目约定、构建命令 |
| Skill | 可调用的"知识包" | 参考文档、部署工作流 |
| Subagent | 隔离的"临时工" | 大规模搜索、并行任务 |
| Agent team | 协作的"团队" | 多角色审查、竞争假设验证 |
| MCP | 外部服务的"连接器" | 数据库、Slack、浏览器 |
| Hook | 事件触发的"自动化脚本" | 保存后 lint、提交前检查 |
| Plugin | 打包分发的"工具箱" | 跨仓库复用、marketplace 发布 |

**下一步**：[精读官方文档：Claude 如何记住你的项目](/2026/03/22/ai-tools/official-docs/memory/)，深入学习 CLAUDE.md 和项目记忆系统。

---

*本文精读自 [Extend Claude Code](https://docs.anthropic.com/en/docs/claude-code/features-overview)*

*最后更新：2026-03-31*
