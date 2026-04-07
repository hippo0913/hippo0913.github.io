---
title: Claude Code 写博客的完整工作流：我就是这么管理 30+ 篇文章的
date: 2026-04-07 13:30:00
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
series: claude-code-advanced
series_index: 8
description: 从写一篇文章到管理整个博客，30+ 篇文章、Skills、Hooks、自动部署——这是我用 Claude Code 管理博客的完整工作流。
cover: https://picsum.photos/seed/blog-workflow-claude/1920/1080
---

# Claude Code 写博客的完整工作流：我就是这么管理 30+ 篇文章的

这个博客就是我用 Claude Code 管理的"项目"。30 多篇文章、自动部署、自定义 Skills、Hooks 安全网——整个工作流从写文章到上线，几乎全靠 Claude Code 完成。

这篇把我的完整工作流分享出来，从日常写作到批量操作，你可以直接拿来用。

<!-- more -->

---

## 基础设施

在聊工作流之前，先了解一下这个博客的技术栈：

- **框架**：Hexo 7.3.0 + Butterfly 5.5.4 主题
- **部署**：git push → GitHub Actions 自动构建 → GitHub Pages
- **Claude Code 配置**：
  - `CLAUDE.md`：写作风格、标签规范、发布流程
  - 4 个 Skills：新建文章、新建系列、发布、文章重写
  - 3 个 Hooks：危险命令拦截、构建验证、截图校验

这些配置不是一开始就有的，是随着使用逐渐积累的。下面的工作流也是。

---

## 日常工作流：写一篇新文章

### Step 1：创建文章骨架

```bash
/blog-new-post 文章标题
```

这是一个自定义 Skill，它会：

- 在 `source/_posts/` 下创建 Markdown 文件
- 自动生成标准的 Front Matter（title、date、tags、categories、description、cover）
- 用 picsum.photos 生成唯一封面图

### Step 2：给大纲确认

我不会直接让 Claude 写全文。先让它列出大纲，我确认后再写。

> 帮我写一篇关于 XXX 的文章，先列大纲给我看。

这一步花 1 分钟，但能避免写完 2000 字后发现方向偏了。

### Step 3：写正文

大纲确认后：

> 按这个大纲写正文。按照 CLAUDE.md 的写作风格要求。

Claude 会参考 CLAUDE.md 里的风格指南（轻松语气、术语要解释、代码块标注语言等）。不需要每次重复说明。

### Step 4：发布

```bash
/blog-publish
```

另一个 Skill，自动执行：

1. `hexo generate` 检查构建
2. `git add source/_posts/具体文件`
3. `git commit -m "post: 文章标题"`
4. `git push`

推送后约 1 分钟，文章自动上线。

**整个流程**：从想法到上线，大约 15-30 分钟（取决于文章长度）。

---

## 质量保障：Hooks 的作用

写文章看起来简单，但有几个容易出错的地方。我的 Hooks 帮我挡住了大部分：

### Hook 1：危险命令拦截

Claude 不会在我的博客项目里执行 `rm -rf`、`git push --force` 这类命令。即使它想执行，PreToolUse Hook 会拦截。

### Hook 2：构建验证

每次 `git commit` 之前，Hook 会自动跑 `hexo generate`。如果构建失败（比如 Markdown 语法错误、Front Matter 缺字段），提交会被阻止。

这个 Hook 帮我避免了至少 5 次"推上去发现页面 404"的尴尬。

### Hook 3：截图校验

每次用 Edit 或 Write 修改文章后，Hook 会自动用 Puppeteer 截图，让我在提交前看到文章的实际渲染效果。

### Hook 4：完成通知

任务完成后（Stop Hook），自动发桌面通知和飞书通知。这样我可以让 Claude 在后台写文章，不用盯着终端看。

---

## 批量操作：Subagent 重写 20 篇文章

博客最多的时候需要同时处理 20 篇官方文档的重写。纯手工一篇篇改不现实，我用了 Subagent 方案：

```
planner（规划器）→ executor（执行器）→ scorer（评分器）
```

1. **规划器**读取所有文章，为每篇生成重写计划
2. **执行器**根据计划重写每篇文章（每个 Subagent 只处理一篇）
3. **评分器**对结果打分，低于阈值的重新迭代

这个方案的细节在之前的 [Subagent 实战文章](/2026/03/26/ai-tools/claude-code-subagent-practice/) 里有详细记录。

**关键设计**：

- 每个 Subagent 有独立上下文，不会互相干扰
- 进度文件记录每篇文章的状态（完成/失败/需重写）
- 最大迭代 3 次，避免无限循环

---

## 配置演进：从简单到复杂

我的 Claude Code 配置不是一步到位的，而是经历了几个阶段：

### 阶段 1：只有 CLAUDE.md

最开始的 CLAUDE.md 只有 10 行：项目信息 + 基本写作风格。够用了。

### 阶段 2：加了 Skills

写了三四篇文章后，发现每次都要手动创建文件、填 Front Matter、提交推送。于是写了 3 个 Skill 把这些操作自动化。

### 阶段 3：加了 Hooks

经历了几次"推了构建失败的代码"和"Claude 差点执行危险命令"后，加了对应的 Hooks。

### 阶段 4：加了 Subagent 编排

批量重写 20 篇文章的需求出现后，搭建了 planner → executor → scorer 的编排系统。

**这个演进路径的关键**：不要一上来就搭全套。先用最简单的配置开始，遇到问题时再加对应的自动化。每个配置都是被真实需求驱动的，不是为了"看起来专业"。

---

## 实际数据

用 Claude Code 管理这个博客以来的数据：

- **文章总数**：30+ 篇
- **平均写作时间**：普通文章 15-30 分钟（不含内容创作，仅指从草稿到发布的技术流程）
- **构建失败被 Hook 拦截**：5+ 次
- **危险操作被拦截**：3+ 次
- **批量重写**：20 篇文章，2 小时完成（纯手工至少 2 天）

---

## 你可以复用的模式

不管你用的是 Hexo、Hugo 还是 Jekyll，这个工作流的核心模式都可以复用：

1. **CLAUDE.md 定义规范**——写作风格、文件结构、发布流程
2. **Skills 自动化重复操作**——创建、发布、批量处理
3. **Hooks 兜底**——构建检查、危险操作拦截
4. **Subagent 处理批量任务**——独立上下文、进度追踪、自动迭代

从 CLAUDE.md 开始，其他按需加。这不是一个需要一次性搭好的系统。

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 8 篇。*
