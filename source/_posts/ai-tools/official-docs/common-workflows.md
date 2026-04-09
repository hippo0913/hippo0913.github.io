---
title: 精读官方文档：常见工作流程
date: 2026-03-25 10:00:00
updated: 2026-04-09 01:30:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 8
description: 精读 Claude Code 官方文档「常见工作流程」，覆盖理解新代码库、Plan Mode、Thinking Mode、Git Worktrees 并行开发、自定义斜杠命令等 12 种日常开发场景的实战指南。
cover: https://picsum.photos/seed/claude-common-workflows/1920/1080
source_url: https://code.claude.com/docs/zh-CN/common-workflows
---

# 精读官方文档：常见工作流程

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。Common Workflows 是我翻得最多的一页文档——每次遇到"不知道怎么让 Claude 干这件事"的时候，答案基本都在这。

---

## 一、这个功能是什么

Common Workflows（常见工作流程）是 Anthropic 官方整理的 Claude Code 日常使用指南，覆盖了从"刚接手一个陌生项目"到"把 Claude 塞进 CI 管道"的 16 种开发场景。

说白了，这篇文档解决一个核心问题：**在实际开发中，怎么把 Claude Code 用出效率**。不是泛泛的"问它问题"，而是每种场景都有具体的提示词和操作步骤。

本文从 16 个场景中精选最值得深入讲的 5 个，其余的我会用表格快速带过。

<!-- more -->

---

## 二、官方教程精读

### 2.1 理解新代码库

刚加入一个新项目时，最快的上手方式是让 Claude 帮你"画地图"。官方推荐的提问策略是**从宽到窄**——先问整体架构，再问具体模块。

```bash
# 第一步：全局概览
claude
> give me an overview of this codebase
> explain the main architecture patterns used here

# 第二步：定位特定功能的代码
> find the files that handle user authentication
> how do these authentication files work together?
> trace the login process from front-end to database
```

官方还建议让 Claude 生成一份项目术语表，对于业务领域陌生的项目（比如金融、医疗）特别有用。

### 2.2 Plan Mode：先想清楚再动手

Plan Mode（计划模式）让 Claude 只读不写，先分析代码再制定方案。官方明确列出了三个适用场景：

- **多步骤实现**：需要改动很多文件的功能
- **代码探索**：动手之前想彻底研究清楚代码
- **交互式开发**：需要和 Claude 反复讨论方向

**启动方式有三种：**

```bash
# 方式 1：启动时直接指定
claude --permission-mode plan

# 方式 2：headless 模式（适合脚本）
claude --permission-mode plan -p "Analyze the auth system and suggest improvements"

# 方式 3：在会话中按 Shift+Tab 两次
# Normal Mode → Auto-Accept Mode → Plan Mode
```

**设为默认模式：**

```json
// .claude/settings.json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

Plan Mode 中 Claude 会用 `AskUserQuestion` 主动向你提问，确认需求后再出方案。这个设计比直接让它"写个方案"靠谱得多，因为它会先搞清楚你的真实意图。

**接受计划后自动命名**：当你接受一个计划时，Claude 会自动根据计划内容命名会话，名字显示在提示栏和会话选择器中。如果你已经用 `--name` 或 `/rename` 设过名字，接受计划不会覆盖它。

### 2.3 Thinking Mode：让 Claude 深度思考

扩展思考默认启用，Claude 在回答前会进行内部推理。按 `Ctrl+O` 切换详细模式可以看到灰色的思考过程。

**关键配置一览：**

| 范围 | 配置方式 | 说明 |
|---|---|---|
| 努力级别 | `/effort` 命令、`/model` 菜单或 `CLAUDE_CODE_EFFORT_LEVEL` 环境变量 | 控制 Opus 4.6 / Sonnet 4.6 的思考深度 |
| `ultrathink` 关键字 | 在提示中任意位置包含该词 | 为该轮设置最高努力级别，适合一次性深度任务 |
| 切换快捷键 | `Option+T`（macOS）/ `Alt+T`（Linux） | 切换当前会话的思考开关 |
| 全局默认值 | `/config` 菜单 | 保存到 `~/.claude/settings.json` 的 `alwaysThinkingEnabled` |
| 令牌预算上限 | `MAX_THINKING_TOKENS` 环境变量 | 限制思考 token 数，设为 0 可完全禁用 |

Opus 4.6 和 Sonnet 4.6 支持**自适应推理**——模型根据你的努力级别动态分配思考 token，不需要手动设上限。`MAX_THINKING_TOKENS` 对这两个模型仅在设为 `0`（完全禁用）或设置了 `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`（回退到固定预算）时生效。

**旧模型**使用固定 token 预算，从输出配额中分配，各模型上限不同。可通过 `MAX_THINKING_TOKENS` 限制或通过 `/config` 和快捷键完全禁用。

```bash
# ultrathink 使用示例——在提示中任意位置包含这个词即可
> ultrathink analyze the security implications of this authentication refactor
```

### 2.4 Git Worktrees：并行开发互不干扰

Worktrees（工作树）允许同一个仓库的不同分支检出到不同目录，每个 Claude 会话有独立的文件空间，改动不会冲突。

```bash
# 用 --worktree / -w 标志自动创建（推荐）
claude --worktree feature-auth    # 创建 .claude/worktrees/feature-auth/
claude -w bugfix-123              # -w 是 --worktree 的短标志
claude --worktree                 # 省略名称，自动生成随机名

# 手动创建（需要更多控制时）
git worktree add ../project-feature-a -b feature-a
git worktree add ../project-bugfix bugfix-123
cd ../project-feature-a && claude
```

**关于基准分支**：Worktree 从 `origin/HEAD` 指向的远程默认分支创建。`origin/HEAD` 是克隆时 Git 在本地 `.git` 中存储的引用，如果远程默认分支后来改了，本地仍指向旧的。同步方法：

```bash
git remote set-head origin -a    # 自动同步远程默认分支
```

**Worktree 清理机制：**

| 情况 | Claude 行为 |
|---|---|
| 无更改 | worktree 及其分支自动删除 |
| 有更改或提交 | 提示你选择保留还是删除 |
| 孤立 subagent worktree（崩溃/中断遗留） | 启动时自动清理，超过 `cleanupPeriodDays` 且无 tracked 文件修改和未推送提交的会被删除 |

用 `--worktree` 创建的 worktree 不会被自动清理。需要在 Claude 会话外手动清理时，使用 `git worktree list` 和 `git worktree remove` 命令。

**Subagent 也可以用 Worktree 隔离**：告诉 Claude "use worktrees for your agents"，或者在自定义 subagent 的 frontmatter 中加 `isolation: worktree`。每个 subagent 获得独立的 worktree，完成且无更改时自动清理。

非 Git 版本控制（SVN、Perforce、Mercurial）也支持——通过配置 `WorktreeCreate` 和 `WorktreeRemove` hooks 提供自定义逻辑。配置后这些 hook 会替换默认的 git 行为，`.worktreeinclude` 不再被处理。

如需并行会话间的自动协调（共享任务和消息），参见官方 Agent Teams 文档。

#### 自动复制 gitignored 文件到 Worktree

Worktree 是全新 checkout，不含 `.env` 等未追踪文件。在项目根目录创建 `.worktreeinclude` 文件，用 `.gitignore` 语法列出要复制的文件：

```
# .worktreeinclude
.env
.env.local
config/secrets.json
```

只有**同时被 gitignore 且匹配该文件模式**的文件才会被复制。适用于 `--worktree`、subagent worktree 和桌面端并行会话。

> **注意**：如果配置了 `WorktreeCreate` hook，hook 会替换默认行为，`.worktreeinclude` 不再生效，需在 hook 脚本中自行处理文件复制。

### 2.5 把 Claude 当 Unix 工具用

Claude Code 支持管道操作，可以集成到脚本和 CI 中。

```json
// package.json - 当 linter 用
{
  "scripts": {
    "lint:claude": "claude -p 'you are a linter. please look at the changes vs. main and report any issues related to typos. report the filename and line number on one line, and a description of the issue on the second line. do not return any other text.'"
  }
}
```

```bash
# 管道操作
cat build-error.txt | claude -p 'concisely explain the root cause' > output.txt
cat data.txt | claude -p 'summarize' --output-format text > summary.txt
```

### 2.6 其他工作流快速参考

官方文档还有这些场景，用表格快速过一遍：

### 2.7 定时任务

官方新增了定时任务（Scheduled Tasks）章节，提供四种方式让 Claude 自动执行重复任务：

| 方式 | 运行环境 | 适用场景 |
|---|---|---|
| 云端定时任务 | Anthropic 托管基础设施 | 关机也要跑的任务，在 claude.ai/code 配置 |
| 桌面端定时任务 | 本机，通过桌面应用 | 需要访问本地文件、工具或未提交变更 |
| GitHub Actions | CI 管道 | 绑定仓库事件或 cron 定时 |
| `/loop` | 当前 CLI 会话 | 会话内的快速轮询，退出即取消 |

选择原则：需要持久化选云端，需要本地文件选桌面，需要跟仓库集成选 Actions，临时用选 `/loop`。

> 💬 hippo：定时任务的详细用法我写了一篇专门的文章，参见 [精读官方文档：定时任务](/2026/03/28/ai-tools/official-docs/scheduled-tasks/)。



| 工作流 | 核心用法 | 一句话说明 |
|---|---|---|
| 修复 Bug | 把错误信息和复现步骤丢给 Claude | 描述越具体，修复越快 |
| 重构代码 | 指定目标模式和范围 | Claude 会匹配项目现有风格 |
| 编写测试 | 明确要验证的行为，让它补充边界用例 | 自动匹配现有测试框架 |
| 创建 PR | 直接说 "create a pr" 或用 `gh pr create` | 会话自动关联 PR |
| 处理文档 | 指定需要更新的文档范围 | 支持代码注释和外部文档 |
| 使用图像 | 直接粘贴截图让 Claude 分析 | 适合 UI 调试 |
| 引用文件 | 用 `@文件路径` 快速引入 | 不用等 Claude 自己去找 |
| 恢复对话 | `--continue` / `--resume` / `--from-pr <编号>` | `/resume` 支持搜索过滤、键盘快捷键和分支过滤 |
| 桌面通知 | 长任务完成后系统通知 | 用 `Notification` hook 实现 |
| 询问 Claude 功能 | 直接问 "can Claude Code create PRs?" | 内置文档，随问随答 |
| 定时任务 | 云端/桌面/GitHub Actions/`/loop` 四种方式 | 按需选：云端不怕关机，本地可访问文件 |

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用这些工作流的踩坑记录。

### 3.1 Plan Mode 避免方向性返工

之前遇到复杂需求直接让 Claude 开干，结果改了 8 个文件后发现方向不对，只好回滚。

**现在的做法**：涉及 3 个文件以上的改动，一律先开 Plan Mode。

```bash
claude --permission-mode plan
> I need to add a dark mode toggle. Analyze the current theming system and create a plan.
> What about the third-party chart library components?
```

Plan Mode 里把方向讨论清楚再退出实施。

### 3.2 Worktree 处理紧急插单

写新功能时突然来紧急 Bug？以前 `git stash` → 切分支 → 修 → 切回来 → `stash pop`，经常冲突。

**现在**：

```bash
# 另开终端，完全隔离
claude --worktree hotfix-123
> fix the login timeout issue described in ticket #123
```

两个 Claude 实例独立运行，互不干扰。

### 3.3 ultrathink 解决架构决策

遇到微服务拆分、数据库选型这类需要权衡多因素的决策时，在提示中加 `ultrathink`：

```bash
> ultrathink 帮我分析把用户系统从单体拆成独立服务的方案，考虑数据一致性、迁移成本和运维复杂度
```

Claude 会用最高努力级别推理，输出更全面的分析。比如做缓存选型时，它从读写性能、内存效率、高可用、运维成本四个维度对比 Redis Cluster 和 Memcached，比单独查资料快得多。

### 3.4 斜杠命令标准化团队流程

我在项目里创建了两个团队共享命令：

```bash
# .claude/commands/review.md
Review my staged changes:
1. Check for potential bugs
2. Verify error handling
3. Suggest improvements with specific code examples

# .claude/commands/test.md
Write tests for: $ARGUMENTS
Match the existing test patterns in this project.
Focus on edge cases and error conditions.
```

团队成员 clone 后直接 `/review` 和 `/test auth.js`，省去重复写提示词。

### 3.5 管道操作接入 CI

GitHub Actions 里加一个自动 Code Review 步骤：

```yaml
# .github/workflows/review.yml
- name: Claude Code Review
  run: |
    git diff origin/main...HEAD | claude -p '
      Review this diff for security, logic errors, and missing error handling.
      Output a brief summary with file:line references.
    ' --output-format text >> $GITHUB_STEP_SUMMARY
```

每次 PR 自动生成审查摘要。

---

## 四、常见问题

**Q: Plan Mode、Normal Mode、Auto-Accept Mode 有什么区别？**

A: 三个模式权限递进：

| 模式 | 文件读取 | 文件修改 | 适用场景 |
|---|---|---|---|
| Plan Mode | 可以 | 不可以 | 分析代码、制定方案 |
| Normal Mode | 可以 | 需确认 | 日常开发 |
| Auto-Accept Mode | 可以 | 自动执行 | 批量操作、CI 集成 |

用 `Shift+Tab` 在三个模式间循环切换。

**Q: Worktree 创建后需要重新安装依赖吗？**

A: 需要。Worktree 是独立目录，`node_modules` 等不共享，要重新 `npm install`。

**Q: `ultrathink` 和普通思考有什么区别？**

A: `ultrathink` 是关键字，提示中包含它就为该轮设置最高努力级别，Opus 4.6 / Sonnet 4.6 会分配更多思考 token。普通思考使用默认级别。

**Q: `--continue`、`--resume` 和 `--from-pr` 有什么区别？**

A: 三种恢复方式各有用途：

| 命令 | 行为 |
|---|---|
| `--continue` | 直接恢复最近的对话 |
| `--resume` | 打开交互式选择器，支持搜索（`/`）、预览（`P`）、重命名（`R`）、分支过滤（`B`） |
| `--from-pr <编号>` | 恢复关联到指定 PR 的会话 |

会话是按项目目录存储的。`/resume` 选择器显示同一 Git 仓库（含 worktree）的交互式会话。通过 `claude -p` 或 SDK 创建的会话不出现在选择器中，但可以用 `claude --resume <session-id>` 指定恢复。

**建议**：处理多任务时给会话起描述性名字（用 `--name` 或 `/rename`），方便后续找到。

**Q: 管道模式下输入有长度限制吗？**

A: 通常够用。超长输入建议把文件路径放在提示中让 Claude 自己读，不必管道传递全部内容。

---

## 五、小结

Common Workflows 是 Claude Code 使用频率最高的文档之一。17 种工作流覆盖了日常开发的绝大多数场景，其中最值得优先掌握的五个：

1. **Plan Mode**：复杂改动前先做计划，避免方向错误导致大面积返工
2. **Thinking Mode + ultrathink**：遇到架构决策和复杂 Bug 时让 Claude 深度推理
3. **Git Worktrees**：并行开发不冲突，支持自动创建和清理
4. **Unix 管道集成**：把 Claude 塞进 CI 脚本，实现自动审查
5. **定时任务**：四种方式按需选，从云端到会话内轮询全覆盖

**下一篇**：[精读官方文档：Subagents 子代理](/2026/03/19/ai-tools/official-docs/sub-agents/) —— 让专门的 AI 做专门的事。

---

*本文精读自 [常见工作流程 - Claude Code Docs](https://code.claude.com/docs/zh-CN/common-workflows)*

*最后更新：2026-04-09*
