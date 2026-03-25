---
title: 精读官方文档：常见工作流程
date: 2026-03-25 10:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 8
description: 掌握 Claude Code 的 12 种常见工作流程，包括理解新代码库、修复 Bug、重构代码、Plan Mode、Git Worktrees 并行开发、自定义斜杠命令等实战技巧。
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

### 2.3 Plan Mode：安全的代码分析模式

Plan Mode（计划模式）让 Claude 只读不写，适合：
- 需要改很多文件的复杂功能
- 想先彻底研究代码再动手
- 需要和 Claude 反复讨论方向

**启动 Plan Mode 的三种方式：**

```bash
# 方式 1：在会话中按 Shift+Tab 切换（按两次进入 Plan Mode）

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

### 2.4 Git Worktrees：并行开发隔离

Git Worktrees（工作树）允许你把同一个仓库的不同分支检出到不同目录，实现完全隔离的并行开发。

**创建和管理 Worktrees：**

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

**Worktrees 的优势：**

| 场景 | 传统方式 | Worktree 方式 |
|------|---------|---------------|
| 同时开发两个功能 | 频繁 stash/切换分支 | 两个目录独立工作 |
| Claude 长时间运行一个任务 | 阻塞你的其他工作 | Claude 在另一个目录跑 |
| 测试冲突的改动 | 担心互相影响 | 完全隔离 |

**注意事项：** 新 worktree 需要重新初始化开发环境（`npm install`、虚拟环境等）。

### 2.5 把 Claude 当 Unix 工具用

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

### 2.6 自定义斜杠命令

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

### 2.7 恢复之前的对话

Claude Code 会自动保存对话历史，可以随时恢复：

```bash
# 继续最近的对话
claude --continue

# 继续对话 + 指定提示（非交互模式）
claude --continue --print "Continue with my task"

# 显示对话选择器
claude --resume
```

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
# 另开一个终端
cd ~/projects
git worktree add myproject-hotfix -b hotfix-123
cd myproject-hotfix
npm install
claude
> fix the login timeout issue described in #123
```

两个 Claude 实例完全独立，互不干扰。

### 3.3 斜杠命令让团队协作更顺畅

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

### 3.4 管道操作的自动化妙用

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

Common Workflows 这篇文档覆盖了 Claude Code 的 12 种日常用法。掌握这些工作流程后，你会发现 Claude Code 不仅仅是一个问答工具，而是一个可以融入你整个开发流程的"AI 队友"。

最值得尝试的三个功能：
1. **Plan Mode**：复杂改动前先做计划，避免方向错误
2. **Git Worktrees**：并行开发不冲突
3. **自定义斜杠命令**：把常用操作封装成快捷方式

**下一篇**：[精读官方文档：Subagents 子代理](/2026/03/25/claude-code-subagents/) —— 让专门的 AI 做专门的事。

---

*本文精读自 [Common workflows - Anthropic](https://docs.anthropic.com/en/docs/claude-code/common-workflows)*

*最后更新：2026-03-25*
