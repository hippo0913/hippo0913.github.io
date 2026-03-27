---
title: 精读官方文档：常见工作流程
date: 2026-03-25 10:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 8
description: 掌握 Claude Code 的 12 种常见工作流程，包括理解新代码库、修复 Bug、重构代码、Plan Mode、Git Worktrees 并行开发、Thinking Mode、自定义斜杠命令等实战技巧。
cover: https://picsum.photos/seed/claude-common-workflows/1920/1080
source_url: https://code.claude.com/docs/zh-CN/common-workflows
---

# 精读官方文档：常见工作流程

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。这篇文章内容非常丰富，我精选了最实用的几个工作流程来讲解。

---

## 一、这个功能是什么

Common Workflows（常见工作流程）是 Anthropic 官方整理的 Claude Code 使用指南，涵盖了从"理解陌生代码库"到"创建 Pull Request"的 12 种日常开发场景。

简单说，这篇文档告诉你：**在实际开发中，怎么把 Claude Code 用到极致**。不管你是刚接手一个老项目、要修一个棘手的 Bug、还是想做代码重构，这里都有具体的操作方法。

<!-- more -->

---

## 二、官方教程精读

### 2.1 理解新代码库

刚加入一个新项目时，最快的上手方式就是让 Claude Code 帮你"画地图"。

**操作步骤：**

```bash
# 1. 进入项目目录
cd /path/to/project

# 2. 启动 Claude Code
claude

# 3. 问一些全局性问题
> give me an overview of this codebase
> explain the main architecture patterns used here
> what are the key data models?
```

**查找特定功能的代码：**

```bash
> find the files that handle user authentication
> how do these authentication files work together?
> trace the login process from front-end to database
```

**官方建议的提问策略：**

| 策略 | 说明 |
|------|------|
| 从宽到窄 | 先问整体架构，再问具体模块 |
| 用项目术语 | 使用项目里的专有名词，比如 "RPC"、"Saga" 等 |
| 请求术语表 | 让 Claude 生成一份项目术语解释 |

### 2.2 修复 Bug

遇到报错时，直接把错误信息丢给 Claude Code：

```bash
# 1. 描述问题
> I'm seeing an error when I run npm test

# 2. 让 Claude 建议修复方案
> suggest a few ways to fix the @ts-ignore in user.ts

# 3. 执行修复
> update user.ts to add the null check you suggested
```

**实用的 Bug 描述技巧：**

- 告诉 Claude 复现命令和堆栈信息
- 说明问题是偶发还是必现
- 提供复现步骤

### 2.3 使用 Subagents（专门的子代理）

Subagents 是 Claude Code 的一项强大功能，可以让专门的 AI 子代理来处理特定任务，提高效率。

**使用场景：** 当你有多个独立任务需要并行处理，或者某个任务需要专门的知识领域时。

**启用方式：** 直接告诉 Claude "use subagents" 或 "使用子代理来处理这些任务"。

```bash
# 示例：让 Claude 使用 subagents 并行处理多个任务
> Use subagents to:
> 1. Analyze the authentication module
> 2. Review the database queries for performance
> 3. Check the API endpoints for security issues
```

**Subagent Worktrees：** Subagents 也可以使用 worktree 隔离来并行工作而不会冲突。告诉 Claude "use worktrees for your agents" 或在自定义 subagent 中通过在代理的 frontmatter 中添加 `isolation: worktree` 来配置。每个 subagent 获得自己的 worktree，当 subagent 完成而没有更改时自动清理。

### 2.4 Plan Mode：安全的代码分析模式

Plan Mode（计划模式）让 Claude 只读不写，适合：
- 需要改很多文件的复杂功能
- 想先彻底研究代码再动手
- 需要和 Claude 反复讨论方向

**启动 Plan Mode 的三种方式：**

```bash
# 方式 1：在会话中按 Shift+Tab 切换（按两次进入 Plan Mode）
# Normal Mode -> Shift+Tab -> Auto-Accept Mode -> Shift+Tab -> Plan Mode

# 方式 2：启动时直接指定
claude --permission-mode plan

# 方式 3：headless 模式下直接提问
claude --permission-mode plan -p "Analyze the authentication system and suggest improvements"
```

**Plan Mode 配置示例：**

```json
// .claude/settings.json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

这样每次启动都默认进入 Plan Mode。

**在 Plan Mode 中启动新会话：**

```bash
claude --permission-mode plan
```

然后在会话中提问，Claude 会分析代码并创建计划：

```bash
> I need to refactor our authentication system to use OAuth2. Create a detailed migration plan.
```

Claude 会分析当前实现并创建全面的计划，你可以通过后续问题进行细化：

```bash
> What about backward compatibility?
> How should we handle database migration?
```

### 2.5 Thinking Mode（扩展思考）

扩展思考默认启用，为 Claude 提供空间在响应前逐步推理复杂问题。此推理在详细模式中可见，你可以使用 `Ctrl+O` 切换。

**自适应推理：** Opus 4.6 和 Sonnet 4.6 支持自适应推理——不是固定的思考令牌预算，而是模型根据你的努力级别设置动态分配思考。

**适用场景：** 复杂的架构决策、具有挑战性的错误、多步骤实现规划和评估不同方法之间的权衡。

#### 配置 Thinking Mode

思考默认启用，但你可以调整或禁用它：

| 范围 | 如何配置 | 详细信息 |
|------|---------|---------|
| **努力级别** | 运行 `/effort`，在 `/model` 中调整，或设置 `CLAUDE_CODE_EFFORT_LEVEL` | 控制 Opus 4.6 和 Sonnet 4.6 的思考深度 |
| **`ultrathink` 关键字** | 在提示中的任何地方包含 "ultrathink" | 在 Opus 4.6 和 Sonnet 4.6 上为该轮设置努力为高。对于需要深度推理的一次性任务很有用 |
| **切换快捷键** | 按 `Option+T`（macOS）或 `Alt+T`（Windows/Linux） | 为当前会话切换思考开/关（所有模型） |
| **全局默认值** | 使用 `/config` 切换 Thinking Mode | 在所有项目中设置默认值。保存为 `~/.claude/settings.json` 中的 `alwaysThinkingEnabled` |
| **限制令牌预算** | 设置 `MAX_THINKING_TOKENS` 环境变量 | 将思考预算限制为特定数量的令牌（在 Opus 4.6 和 Sonnet 4.6 上被忽略，除非设置为 0） |

```bash
# 示例：限制思考令牌预算
export MAX_THINKING_TOKENS=10000
```

**查看思考过程：** 按 `Ctrl+O` 切换详细模式，查看显示为灰色斜体文本的内部推理。

**ultrathink 使用示例：**

```bash
> ultrathink analyze the security implications of this authentication refactor
```

只需在提示中包含 "ultrathink"，Claude 就会使用高努力级别进行深度推理。

### 2.6 Git Worktrees：并行开发隔离

Git Worktrees（工作树）允许你把同一个仓库的不同分支检出到不同目录，实现完全隔离的并行开发。

**使用 `--worktree` 标志自动创建：**

```bash
# 在名为 "feature-auth" 的 worktree 中启动 Claude
# 自动创建 .claude/worktrees/feature-auth/ 和新分支
claude --worktree feature-auth

# 在单独的 worktree 中启动另一个会话
claude --worktree bugfix-123

# 省略名称，Claude 自动生成随机名称如 "bright-running-fox"
claude --worktree
```

Worktrees 在 `<repo>/.claude/worktrees/<name>` 创建，并从默认远程分支分支。worktree 分支命名为 `worktree-<name>`。

**在会话中自动创建：** 你也可以在会话期间告诉 Claude "work in a worktree" 或 "start a worktree"，它会自动创建一个。

**手动创建和管理 Worktrees：**

```bash
# 创建新 worktree + 新分支
git worktree add ../project-feature-a -b feature-a

# 用已有分支创建 worktree
git worktree add ../project-bugfix bugfix-123

# 在各个 worktree 中独立运行 Claude Code
cd ../project-feature-a
claude

# 管理命令
git worktree list                    # 查看所有 worktrees
git worktree remove ../project-feature-a  # 删除 worktree
```

#### Worktree 清理机制

当退出 worktree 会话时，Claude 根据是否进行了更改来处理清理：

| 情况 | Claude 行为 |
|------|------------|
| **无更改** | worktree 及其分支自动删除 |
| **存在更改或提交** | Claude 提示你保留或删除。保留会保留目录和分支以便稍后返回；删除会丢弃所有未提交的更改和提交 |

#### Subagent Worktrees

Subagents 也可以使用 worktree 隔离来并行工作。告诉 Claude "use worktrees for your agents"，每个 subagent 获得自己的 worktree，当 subagent 完成而没有更改时自动清理。

**Worktrees 的优势：**

| 场景 | 传统方式 | Worktree 方式 |
|------|---------|---------------|
| 同时开发两个功能 | 频繁 stash/切换分支 | 两个目录独立工作 |
| Claude 长时间运行一个任务 | 阻塞你的其他工作 | Claude 在另一个目录跑 |
| 测试冲突的改动 | 担心互相影响 | 完全隔离 |

**注意事项：** 新 worktree 需要重新初始化开发环境（`npm install`、虚拟环境等）。

### 2.7 恢复之前的对话

Claude Code 会自动保存对话历史，可以随时恢复：

```bash
# 继续最近的对话
claude --continue

# 显示对话选择器
claude --resume

# 恢复链接到特定 PR 的会话
claude --from-pr 123
```

从活跃会话内，使用 `/resume` 切换到不同的对话。会话按项目目录存储，`/resume` 选择器显示来自同一 git 仓库的会话，包括 worktrees。

#### 命名你的会话

给会话起描述性名称以便稍后找到它们。这是在处理多个任务或功能时的最佳实践。

#### 使用会话选择器

`/resume` 命令（或 `claude --resume` 不带参数）打开交互式会话选择器：

**选择器中的键盘快捷键：**

| 快捷键 | 操作 |
|-------|------|
| `↑` / `↓` | 在会话之间导航 |
| `→` / `←` | 展开或折叠分组的会话 |
| `Enter` | 选择并恢复突出显示的会话 |
| `P` | 预览会话内容 |
| `R` | 重命名突出显示的会话 |
| `/` | 搜索以过滤会话 |
| `A` | 在当前目录和所有项目之间切换 |
| `B` | 过滤到来自当前 git 分支的会话 |
| `Esc` | 退出选择器或搜索模式 |

**会话组织：** 选择器显示带有有用元数据的会话——会话名称或初始提示、自上次活动以来经过的时间、消息计数、Git 分支（如果适用）。

分叉的会话（使用 `/rewind` 或 `--fork-session` 创建）在其根会话下分组，使查找相关对话更容易。

### 2.8 把 Claude 当 Unix 工具用

Claude Code 支持管道操作，可以集成到你的脚本里：

**作为 Linter 使用：**

```json
// package.json
{
  "scripts": {
    "lint:claude": "claude -p 'you are a linter. please look at the changes vs. main and report any issues related to typos. report the filename and line number on one line, and a description of the issue on the second line. do not return any other text.'"
  }
}
```

**管道操作：**

```bash
# 分析构建错误
cat build-error.txt | claude -p 'concisely explain the root cause of this build error' > output.txt

# 控制输出格式
cat data.txt | claude -p 'summarize this data' --output-format text > summary.txt
cat code.py | claude -p 'analyze this code for bugs' --output-format json > analysis.json
```

**输出格式参数：**

| 格式 | 说明 | 适用场景 |
|------|------|---------|
| `text` | 纯文本响应（默认） | 简单集成 |
| `json` | 完整对话 JSON（含成本、耗时） | 需要日志记录 |
| `stream-json` | 实时流式 JSON | 实时处理 |

### 2.9 自定义斜杠命令

你可以创建自己的 `/命令`，让常用操作一键执行。

**项目级命令（团队共享）：**

```bash
# 创建命令目录
mkdir -p .claude/commands

# 创建命令文件
echo "Analyze the performance of this code and suggest three specific optimizations:" > .claude/commands/optimize.md

# 使用
> /optimize
```

**带参数的命令（使用 $ARGUMENTS 占位符）：**

```bash
# 创建命令
cat > .claude/commands/fix-issue.md << 'EOF'
Find and fix issue #$ARGUMENTS. Follow these steps:
1. Understand the issue described in the ticket
2. Locate the relevant code in our codebase
3. Implement a solution that addresses the root cause
4. Add appropriate tests
5. Prepare a concise PR description
EOF

# 使用：/fix-issue 123
```

**个人命令（跨项目使用）：**

```bash
# 创建在 home 目录
mkdir -p ~/.claude/commands
echo "Review this code for security vulnerabilities, focusing on:" > ~/.claude/commands/security-review.md

# 使用
> /security-review
```

**命令类型对比：**

| 类型 | 存放位置 | 共享范围 | 标识 |
|------|---------|---------|------|
| 项目级 | `.claude/commands/` | 团队所有人 | 无 |
| 个人级 | `~/.claude/commands/` | 仅自己 | 显示 "(user)" |

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用这些工作流程的踩坑经验：

### 3.1 Plan Mode 的正确打开方式

我之前有个坏习惯：遇到复杂需求直接让 Claude 开干，结果改了一半发现方向错了，又要回滚。

**我的解决方案：** 现在所有涉及 3 个文件以上的改动，我都先用 Plan Mode：

```bash
claude --permission-mode plan
> I need to add a dark mode toggle. Analyze the current theming system and create an implementation plan.
```

Claude 会分析现有代码，给我一个详细的计划。我可以追问：

```bash
> What about the third-party chart library?
> How should we handle SSR?
```

确认方向正确后再退出 Plan Mode 开始实施。

### 3.2 Worktree 隔离开发的好处

有一次我在写一个新功能，突然收到紧急 Bug 修复需求。传统做法是 `git stash`，切分支，修 Bug，切回来，`git stash pop`。但很容易出冲突。

**我的做法：**

```bash
# 当前在新功能 worktree 里
# 另开一个终端，用 --worktree 标志快速创建隔离环境
claude --worktree hotfix-123
> fix the login timeout issue described in #123
```

两个 Claude 实例完全独立，互不干扰。退出时如果没有更改，worktree 会自动清理。

### 3.3 ultrathink 解决复杂问题

遇到特别棘手的架构决策时，我会用 ultrathink 关键字：

```bash
> ultrathink 帮我分析这个微服务拆分方案，考虑数据一致性、性能和运维复杂度
```

Claude 会进行更深入的推理，给出更全面的分析。

### 3.4 会话选择器快捷键

用 `/resume` 恢复会话时，键盘快捷键非常实用：

- 按 `/` 直接搜索关键词
- 按 `P` 预览会话内容再决定是否恢复
- 按 `B` 只看当前分支的会话

### 3.5 斜杠命令让团队协作更顺畅

我在项目里创建了几个实用命令：

```bash
# .claude/commands/review.md
Review my staged changes:
1. Check for potential bugs
2. Verify error handling
3. Suggest any improvements

# .claude/commands/test.md
Write tests for the file: $ARGUMENTS
Focus on edge cases and error conditions.
```

团队成员 clone 项目后就能直接用 `/review` 和 `/test auth.js`。

### 3.6 管道操作的自动化妙用

我在 CI 里加了一个自动检查：

```yaml
# .github/workflows/review.yml
- name: Claude Code Review
  run: |
    git diff origin/main...HEAD | claude -p '
      Review this diff for:
      1. Security vulnerabilities
      2. Logic errors
      3. Code style issues
      Output a brief summary.
    '
```

每次 PR 都会自动生成一个 Code Review 摘要。

---

## 四、常见问题

**Q: Plan Mode 和 Auto-Accept Mode 有什么区别？**

A: 三个模式的权限递进：
- **Plan Mode**：只读，不修改任何文件
- **Normal Mode**：修改前需要你确认
- **Auto-Accept Mode**：自动执行所有操作，不需要确认

**Q: Worktree 创建后，Git 钩子会触发吗？**

A: 会的。Worktree 共享 `.git` 目录，钩子对所有 worktree 都生效。但注意每个 worktree 的 `HEAD` 是独立的。

**Q: ultrathink 和普通思考有什么区别？**

A: ultrathink 是一个关键字，在提示中包含它会为该轮对话设置高努力级别，适合需要深度推理的一次性任务。普通思考使用默认努力级别。

**Q: 斜杠命令支持子目录吗？**

A: 支持。`.claude/commands/frontend/component.md` 会创建 `/component` 命令，描述里会显示 "(project:frontend)"。

**Q: `--continue` 和 `--resume` 有什么区别？**

A:
- `--continue`：直接恢复最近的对话，不问任何问题
- `--resume`：显示一个列表让你选择要恢复哪个对话

**Q: 管道模式下，输入有长度限制吗？**

A: 受终端和 shell 限制，但通常足够大。超长输入建议用文件路径让 Claude 自己读，而不是管道传递。

---

## 五、小结

Common Workflows 这篇文档覆盖了 Claude Code 的日常用法。掌握这些工作流程后，你会发现 Claude Code 不仅仅是一个问答工具，而是一个可以融入你整个开发流程的"AI 队友"。

最值得尝试的功能：
1. **Plan Mode**：复杂改动前先做计划，避免方向错误
2. **Thinking Mode**：用 ultrathink 解决复杂问题
3. **Git Worktrees**：并行开发不冲突，自动创建和清理
4. **自定义斜杠命令**：把常用操作封装成快捷方式

**下一篇**：[精读官方文档：Subagents 子代理](/2026/03/25/claude-code-subagents/) —— 让专门的 AI 做专门的事。

---

*本文精读自 [常见工作流程 - Claude Code Docs](https://code.claude.com/docs/zh-CN/common-workflows)*

*最后更新：2026-03-27*
