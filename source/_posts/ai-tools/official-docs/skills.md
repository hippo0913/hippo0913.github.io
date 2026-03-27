---
title: 精读官方文档：Agent Skills（技能扩展）
date: 2026-03-21 23:00:00
updated: 2026-03-27 15:30:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 10
description: Skills 是 Claude Code 的模块化能力扩展机制。本文详细讲解如何创建、配置和分享 Skill，包含 SKILL.md 编写规范、参数传递、动态上下文注入、Subagent 运行等核心内容。
cover: https://picsum.photos/seed/claude-skills/1920/1080
source_url: https://code.claude.com/docs/zh-CN/skills
---

# 精读官方文档：Agent Skills（技能扩展）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Skills（技能）是 Claude Code 的模块化能力扩展机制。简单说，就是把你的专业知识打包成一个文件夹，让 Claude 在需要时自动读取并执行。

**核心特点：**

- 创建一个 `SKILL.md` 文件，Claude 会将其添加到工具包中
- Claude 在相关时自动使用，或通过 `/skill-name` 直接调用
- 与 Agent Skills 开放标准兼容，可跨多个 AI 工具使用

<!-- more -->

---

## 二、捆绑 Skills（内置）

捆绑 Skills 随 Claude Code 一起提供，在每个会话中都可用。与内置命令不同，捆绑 Skills 是基于提示的，可以为 Claude 提供详细的剧本。

| Skill | 用途 | 示例 |
|-------|------|------|
| `/batch <instruction>` | 并行编排大规模更改，分解为独立单元，每个生成 PR | `/batch migrate src/ from Solid to React` |
| `/claude-api` | 加载 Claude API 参考资料（Python、TS、Java、Go 等） | 自动激活当导入 `anthropic` 包 |
| `/debug [description]` | 启用调试日志并排查问题 | `/debug connection timeout` |
| `/loop [interval] <prompt>` | 按间隔重复运行提示 | `/loop 5m check if the deploy finished` |
| `/simplify [focus]` | 审查最近更改的文件，查找代码质量问题 | `/simplify focus on memory efficiency` |

---

## 三、Skill 的存储位置

Skills 按存储位置决定可见范围：

| 位置 | 路径 | 适用于 |
|------|------|--------|
| 企业 | 托管设置配置 | 组织内所有用户 |
| 个人 | `~/.claude/skills/<skill-name>/SKILL.md` | 你的所有项目 |
| 项目 | `.claude/skills/<skill-name>/SKILL.md` | 仅此项目 |
| 插件 | `<plugin>/skills/<skill-name>/SKILL.md` | 启用插件的位置 |

**优先级**：企业 > 个人 > 项目。插件 Skills 使用 `plugin-name:skill-name` 命名空间，不会冲突。

### 3.1 从嵌套目录自动发现（Monorepo 支持）

当你在子目录中处理文件时，Claude Code 会自动从嵌套的 `.claude/skills/` 目录发现 Skills：

```
my-monorepo/
├── .claude/skills/           # 根目录 skills
├── packages/
│   ├── frontend/
│   │   └── .claude/skills/   # frontend 专属 skills
│   └── backend/
│       └── .claude/skills/   # backend 专属 skills
```

如果你正在编辑 `packages/frontend/` 中的文件，Claude Code 也会在 `packages/frontend/.claude/skills/` 中查找 Skills。

---

## 四、创建你的第一个 Skill

### 4.1 创建 Skill 目录

```bash
# 创建个人 Skill
mkdir -p ~/.claude/skills/explain-code
```

### 4.2 编写 SKILL.md

每个 Skill 必须包含 `SKILL.md` 文件：

```markdown
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

### 4.3 测试 Skill

**方式一：让 Claude 自动调用**

```
How does this code work?
```

**方式二：直接调用**

```
/explain-code src/auth/login.ts
```

---

## 五、Frontmatter 配置详解

### 5.1 完整字段表

| 字段 | 必需 | 描述 |
|------|------|------|
| `name` | 否 | Skill 显示名称。仅小写字母、数字、连字符，最多 64 字符 |
| `description` | **推荐** | 功能描述，Claude 用它判断何时使用 |
| `argument-hint` | 否 | 自动完成提示，如 `[issue-number]` 或 `[filename] [format]` |
| `disable-model-invocation` | 否 | 设为 `true` 阻止 Claude 自动调用，只能手动触发 |
| `user-invocable` | 否 | 设为 `false` 从 `/` 菜单隐藏 |
| `allowed-tools` | 否 | Skill 活动时可用的工具（无需请求权限） |
| `model` | 否 | Skill 活动时使用的模型 |
| `effort` | 否 | 工作量级别：`low`、`medium`、`high`、`max`（仅 Opus 4.6） |
| `context` | 否 | 设为 `fork` 在分叉的 subagent 上下文中运行 |
| `agent` | 否 | `context: fork` 时使用的 subagent 类型 |
| `hooks` | 否 | 限定于此 Skill 生命周期的 hooks |

### 5.2 控制谁调用 Skill

两个关键字段控制调用权限：

| Frontmatter | 你可调用 | Claude 可调用 | 何时加载 |
|-------------|---------|--------------|---------|
| （默认） | 是 | 是 | 描述始终在上下文中，调用时加载完整 Skill |
| `disable-model-invocation: true` | 是 | 否 | 描述不在上下文中，你调用时加载 |
| `user-invocable: false` | 否 | 是 | 描述始终在上下文中，调用时加载 |

**示例：部署 Skill（只允许手动触发）**

```markdown
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:

1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

---

## 六、参数传递

### 6.1 字符串替换变量

| 变量 | 描述 |
|------|------|
| `$ARGUMENTS` | 调用时传递的所有参数 |
| `$ARGUMENTS[N]` | 按索引访问特定参数，如 `$ARGUMENTS[0]` |
| `$N` | 简写形式，如 `$0`（第一个）、`$1`（第二个） |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID |
| `${CLAUDE_SKILL_DIR}` | Skill 所在目录（用于引用捆绑的脚本/文件） |

### 6.2 示例：修复 GitHub Issue

```markdown
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

运行 `/fix-issue 123`，Claude 收到 "Fix GitHub issue 123 following our coding standards…"

### 6.3 示例：多参数迁移

```markdown
---
name: migrate-component
description: Migrate a component from one framework to another
---

Migrate the $0 component from $1 to $2.
Preserve all existing behavior and tests.
```

运行 `/migrate-component SearchBar React Vue`：
- `$0` → `SearchBar`
- `$1` → `React`
- `$2` → `Vue`

### 6.4 会话日志示例

```markdown
---
name: session-logger
description: Log activity for this session
---

Log the following to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

---

## 七、注入动态上下文

使用 `!`command` ` 语法在发送给 Claude 之前运行 shell 命令：

```markdown
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
Summarize this pull request...
```

**执行流程：**

1. 每个 `!`command` ` 立即执行（Claude 看到任何内容之前）
2. 输出替换 Skill 内容中的占位符
3. Claude 接收带有实际 PR 数据的完全呈现的提示

---

## 八、在 Subagent 中运行 Skills

### 8.1 使用 context: fork

当你想让 Skill 在隔离中运行时，添加 `context: fork`：

```markdown
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

**运行流程：**

1. 创建一个新的隔离上下文
2. Subagent 接收 Skill 内容作为提示
3. `agent` 字段确定执行环境（模型、工具、权限）
4. 结果被总结并返回到主对话

### 8.2 agent 字段选项

| 值 | 说明 |
|----|------|
| `Explore` | 只读工具，针对代码库探索优化 |
| `Plan` | 规划任务 |
| `general-purpose` | 通用（默认） |
| 自定义 | `.claude/agents/` 中的自定义 subagent |

---

## 九、限制工具访问

### 9.1 allowed-tools 字段完整语法

`allowed-tools` 字段支持多种格式：

```markdown
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---
```

**支持带参数的工具限制**：

```markdown
---
name: gh-pr-helper
description: Help with GitHub PR operations
allowed-tools: Read, Bash(gh pr *), Bash(git *)
---
```

上述配置只允许：
- 所有 `Read` 操作
- `gh pr` 开头的命令（如 `gh pr view`、`gh pr diff`）
- `git` 开头的命令

**常用 allowed-tools 组合**：

| 场景 | allowed-tools 配置 |
|------|-------------------|
| 只读模式 | `Read, Grep, Glob` |
| Git 操作 | `Read, Bash(git *), Bash(gh *)` |
| 安全审查 | `Read, Grep, Glob, Bash(npm audit *)` |
| 文档生成 | `Read, Write(*.md), Bash(markdown *)` |

### 9.2 权限控制语法

控制 Claude 可以调用哪些 Skills：

```yaml
# 在 /permissions 中添加规则

# 禁用所有 Skills
Skill

# 只允许特定 Skills
Skill(commit)
Skill(review-pr *)

# 拒绝特定 Skills
Skill(deploy *)
```

权限语法：`Skill(name)` 精确匹配，`Skill(name *)` 带参数的前缀匹配。

### 9.3 与 permissions 的交互

`allowed-tools` 和权限设置协同工作：

1. `allowed-tools` 定义 Skill 活动时**自动授权**的工具
2. 其他工具仍遵循 `/permissions` 中的基线批准行为
3. 内置命令如 `/compact`、`/init` 不能通过 Skill 工具获得

---

## 十、Skill 内容类型

根据调用方式，Skill 内容可以分为两类：

### 10.1 参考内容（Reference Content）

添加 Claude 应用于当前工作的知识，如约定、模式、风格指南：

```markdown
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

此类内容**内联运行**，Claude 可以将其与对话上下文一起使用。

### 10.2 任务内容（Task Content）

为 Claude 提供特定操作的分步说明，如部署、提交、代码生成：

```markdown
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

**关键配置**：
- 添加 `disable-model-invocation: true` 防止 Claude 自动触发
- 考虑使用 `context: fork` 在隔离环境中运行

---

## 十一、多文件 Skill 组织

复杂 Skill 可以包含多个文件：

```
my-skill/
├── SKILL.md (必需 - 概述和导航)
├── reference.md (详细 API 文档)
├── examples.md (使用示例)
└── scripts/
    └── helper.py (工具脚本)
```

在 `SKILL.md` 中引用支持文件：

```markdown
## Additional resources

- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

**建议**：将 `SKILL.md` 保持在 500 行以下，详细参考资料移到单独文件。

---

## 十二、生成视觉输出

Skills 可以捆绑并运行任何语言的脚本，为 Claude 提供单个提示中不可能的功能。一个强大的模式是生成视觉输出：在浏览器中打开的交互式 HTML 文件。

### 12.1 示例：代码库可视化器

创建一个交互式树视图，可以在其中展开和折叠目录、查看文件大小、按颜色识别文件类型。

```markdown
---
name: codebase-visualizer
description: Generate an interactive collapsible tree visualization of your codebase. Use when exploring a new repo, understanding project structure, or identifying large files.
allowed-tools: Bash(python *)
---

# Codebase Visualizer

Generate an interactive HTML tree view that shows your project's file structure with collapsible directories.

## Usage

Run the visualization script from your project root:

```bash
python ~/.claude/skills/codebase-visualizer/scripts/visualize.py .
```

This creates `codebase-map.html` in the current directory and opens it in your default browser.

## What the visualization shows

- **Collapsible directories**: Click folders to expand/collapse
- **File sizes**: Displayed next to each file
- **Colors**: Different colors for different file types
- **Directory totals**: Shows aggregate size of each folder
```

### 12.2 视觉输出的应用场景

| 场景 | 实现方式 |
|------|---------|
| 依赖关系图 | 使用脚本分析 import/require，生成 SVG 或 HTML |
| 测试覆盖率报告 | 解析 coverage 数据，生成交互式图表 |
| API 文档 | 扫描代码注释，生成可浏览的 HTML 文档 |
| 数据库架构可视化 | 读取 schema，生成 ER 图 |

---

## 十三、常见问题

### Q1: Skill 未触发

1. 检查描述是否包含用户会自然说的关键字
2. 验证 Skill 是否出现在 `What skills are available?` 中
3. 尝试重新表述请求以更接近描述
4. 如果是用户可调用的，使用 `/skill-name` 直接调用

### Q2: Skill 触发过于频繁

1. 使描述更具体
2. 添加 `disable-model-invocation: true` 只允许手动调用

### Q3: Claude 看不到我的所有 Skills

Skill 描述加载到上下文中的字符预算是动态的（上下文窗口的 2%，回退 16,000 字符）。

运行 `/context` 检查排除的 Skills 警告。要覆盖限制：

```bash
export SLASH_COMMAND_TOOL_CHAR_BUDGET=20000
```

---

## 十四、小结

Skills 是 Claude Code 的核心扩展机制，关键要点：

1. **存储位置**：个人、项目、插件、企业四个级别
2. **配置**：通过 Frontmatter 控制行为和权限
3. **参数**：支持 `$ARGUMENTS`、`$N`、会话变量
4. **动态上下文**：`!`command` ` 预处理获取实时数据
5. **Subagent**：`context: fork` + `agent` 在隔离中运行
6. **allowed-tools**：支持带参数的工具限制，如 `Bash(gh *)`
7. **内容类型**：参考内容 vs 任务内容，根据调用方式选择

**下一篇**：[MCP（Model Context Protocol）](/2026/03/21/official-docs-mcp/) — 了解如何让 Claude 连接外部工具和数据源。

---

*本文精读自 [Agent Skills - Claude Code Docs](https://code.claude.com/docs/zh-CN/skills)*

*最后更新：2026-03-27*
