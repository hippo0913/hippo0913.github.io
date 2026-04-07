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

"帮我写一篇关于 Hooks 的文章"——我在终端里敲下这句话，15 分钟后文章自动上线。整个过程：大纲确认、正文撰写、构建验证、git push、GitHub Actions 部署，全由 Claude Code 完成。

这个博客有 30 多篇文章，我不手动创建文件，不手动跑 `hexo generate`，不手动 `git push`。Claude Code 加上一套 Skills 和 Hooks 配置，把写作流程压缩到了最短。

这篇文章从四个层次分享我的工作流：单篇文章怎么写、质量怎么保障、20 篇文章怎么批量重写、配置是怎么一步步演化出来的。每个层次都有你可以直接复制的配置。

<!-- more -->

---

## 技术栈概览

先看全貌，后面逐层展开：

| 层次 | 工具 | 作用 |
|------|------|------|
| 博客框架 | Hexo 7.3.0 + Butterfly 5.5.4 | Markdown 生成静态站点 |
| 部署 | GitHub Actions | git push 后自动构建上线 |
| 写作规范 | CLAUDE.md | 定义风格、标签规则、发布流程 |
| 自动化操作 | 4 个 Skills | 新建文章、新建系列、发布、文章重写 |
| 安全兜底 | 4 组 Hooks | 危险命令拦截、构建验证、截图校验、完成通知 |
| 批量处理 | Subagent 编排 | planner → executor → scorer 自动迭代 |
| 质量评估 | 评分配置 + 脚本 | 量化 30% + 质性 70%，低于 70 分自动重写 |

---

## 日常工作流：写一篇新文章

### 创建文章：一个 Skill 搞定骨架

我不用手动 `hexo new`，而是用自定义 Skill `/blog-new-post`。这个 Skill 的定义文件放在 `.claude/commands/blog-new-post.md`，核心逻辑只有四步：

1. 根据标题生成大纲，**等我确认后再继续**
2. 执行 `yarn hexo new "文章标题"` 创建文件
3. 按照 CLAUDE.md 的写作风格填写正文和 Front Matter
4. 本地 `hexo server` 验证后等我说"发布"

其中 Front Matter 模板是固定的，每篇文章必须包含：

```yaml
---
title: 文章标题
date: 2026-04-07 13:30:00
updated: 2026-04-07 13:30:00
tags:
  - 标签1
categories:
  - 分类名
description: 100字以内的文章摘要，会显示在首页卡片和SEO描述中
cover: https://picsum.photos/seed/关键词/1920/1080
---
```

`cover` 用 picsum.photos（一个随机图片服务），seed 传文章关键词的英文，保证每篇文章封面不同。这个模板写死在 CLAUDE.md 里，Claude 每次创建文章都会严格遵守。

### 写正文：大纲先行

我的习惯是先让 Claude 列大纲，确认后再写正文。不是不信任它，而是 2000 字写完发现方向偏了，改比重写还痛苦。实际操作就两句话：

```
帮我写一篇关于 XXX 的文章，先列大纲给我看。
```

确认大纲后：

```
按这个大纲写正文。按照 CLAUDE.md 的写作风格要求。
```

Claude 会参考 CLAUDE.md 里的风格规则：轻松语气、术语要解释、代码块标注语言、`<!-- more -->` 放在引言后面。不需要每次重复说明这些要求。

### 发布：一个命令上线

```bash
/blog-publish
```

这个 Skill 的执行流程也很清晰：

1. `git status` + `git diff --stat` 列出改动
2. `yarn hexo clean && yarn hexo generate` 本地构建验证
3. 确认后执行 `git add` → `git commit` → `git push`

推送后约 1 分钟，GitHub Actions 自动构建完成，文章上线。

**从想法到上线，整个流程 15-30 分钟**（取决于文章长度）。其中我只需要确认大纲和确认发布两步交互。

---

## 质量保障：Hooks 安全网

写作流程看起来简单，但有几个容易出事的地方。我的 Hooks 配置帮我挡住了大部分问题。先看完整的 Hooks 配置（来自 `.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "command": ".claude/hooks/block-dangerous.sh" }]
      },
      {
        "matcher": "Bash(git commit:*)",
        "hooks": [{ "command": "hexo clean && hexo generate 2>&1 | tail -5 || { echo '构建失败，禁止提交' >&2; exit 2; }" }]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "command": ".claude/hooks/protect-files.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [{ "command": ".claude/hooks/screenshot-hook.sh" }]
      }
    ],
    "Stop": [
      { "hooks": [{ "command": ".claude/hooks/notify.sh" }] },
      { "hooks": [{ "command": ".claude/hooks/feishu-notify.sh" }] }
    ]
  }
}
```

### Hook 1：危险命令拦截

有一次 Claude 想用 `rm -rf node_modules` 清理缓存。这个命令本身没问题，但我不想让 AI 在我的项目里随意执行递归删除。`block-dangerous.sh` 的核心逻辑是维护一个黑名单：

```bash
DANGEROUS_LIST="
rm -rf|递归强制删除
git push --force|强制推送
git reset --hard|硬重置
git clean -fd|清理未跟踪文件
DROP TABLE|删除数据表
mkfs|格式化文件系统
"

while IFS='|' read -r pattern desc; do
  if echo "$COMMAND" | grep -qE "(^|;|&&|\|\|)\s*${pattern}"; then
    echo "危险命令被拦截: $desc — 如需执行请手动操作"
    exit 2  # exit 2 = 阻断
  fi
done <<< "$DANGEROUS_LIST"
```

触发时，Claude 会收到"危险命令被拦截"的提示，自动换一个安全的方案。这个 Hook 至少帮我挡住了 3 次 `rm -rf` 和 1 次 `git reset --hard`。

### Hook 2：构建验证

每次 `git commit` 之前，Hook 自动跑 `hexo generate`。如果构建失败，提交被阻止。

实际踩过的坑：有篇文章的 Front Matter 里 `tags` 字段格式写错了（少了一个缩进），本地看不出来，推上去之后首页直接 404。加了构建验证后，类似的问题在提交前就会被拦住，至少避免了 5 次线上事故。

### Hook 3：文件保护

`protect-files.sh` 维护了一份受保护文件列表，阻止 Claude 修改 `.env`、`settings.json`、锁文件等敏感配置。有一次 Claude 想帮我"优化" `yarn.lock`，被这个 Hook 拦住了。

### Hook 4：截图校验 + 完成通知

修改文章后自动用 Puppeteer 截图，让我在提交前看到渲染效果。任务完成后发桌面通知和飞书通知——这样我可以让 Claude 在后台写文章，不用盯着终端看。

### Hooks 汇总

| Hook | 触发时机 | 拦截内容 | 实际拦截次数 |
|------|----------|----------|-------------|
| block-dangerous.sh | PreToolUse Bash | rm -rf、git push --force 等 | 3+ 次 |
| hexo generate | PreToolUse git commit | 构建失败的提交 | 5+ 次 |
| protect-files.sh | PreToolUse Edit/Write | .env、settings.json 等 | 2+ 次 |
| screenshot-hook.sh | PostToolUse Edit/Write | 无（纯校验） | 每次修改文章 |
| notify.sh | Stop（任务完成） | 无（纯通知） | 每次任务 |

---

## 批量操作：Subagent 重写 27 篇文章

博客最多的时候需要同时处理 27 篇官方文档的精读重写。纯手工一篇篇改至少要 2 天，我用 Subagent 方案 2 小时搞定。

### 编排逻辑

三层 Agent 协作，由 `/doc-rewrite` Skill 编排：

```
planner（规划器）→ executor（执行器）→ scorer（评分器）
```

1. **规划器**：读取文章 → 从官方文档 URL 抓取原文 → 制定写作计划
2. **执行器**：根据计划重写文章（每个 Subagent 只处理一篇，互不干扰）
3. **评分器**：量化打分（代码块数量、字数、配置示例等）+ 质性打分（LLM 评估内容深度、代码实用性）

低于 70 分的自动进入下一轮迭代，最多 3 次。进度文件记录每篇文章的状态和分数。

### 评分配置

评分标准定义在 `.claude/scoring/profiles/official-doc.yaml`：

```yaml
quantitative:
  weight: 0.3
  checks:
    - id: codeBlocks      # 代码块 >= 2 个，20 分
      threshold: 2
      score: 20
    - id: configExamples  # 配置示例 >= 1 个，15 分
      threshold: 1
      score: 15
    - id: tables          # 表格 >= 1 个，15 分
      threshold: 1
      score: 15
    - id: wordCount       # 中文字数 >= 1000，20 分
      threshold: 1000
      score: 20
    - id: platitudes      # 空话数量 <= 0，15 分
      patterns: ['实践出真知', '让我们一起.*吧']
      score: 15
qualitative:
  weight: 0.7
  dimensions:
    - id: contentDepth      # 内容实质度，25 分
    - id: codeUsability     # 代码实用性，25 分
    - id: personalExperience # 个人经验真实性，20 分
pass:
  threshold: 70
  maxIterations: 3
```

量化分占 30%，质性分占 70%。量化部分由脚本自动检查，质性部分由 LLM 按维度打分。两者加权后低于 70 分就自动重写。

### 实际数据

27 篇文章全部通过，平均分 88.6：

| 指标 | 数值 |
|------|------|
| 文章总数 | 27 篇 |
| 一次通过率 | 100%（27/27） |
| 平均分 | 88.6 |
| 最高分 | 93（cli-reference、common-workflows、claude-overview） |
| 最低分 | 78.3（claude-quickstart） |
| 平均耗时 | 约 4 分钟/篇 |
| 总耗时 | 约 2 小时（纯手工至少 2 天） |

---

## 配置演进路径

这些配置不是一步到位的。每个配置都是被真实问题驱动的：

| 阶段 | 触发事件 | 新增配置 | 解决的问题 |
|------|----------|----------|------------|
| 第 1 阶段：裸奔 | 开始写博客 | CLAUDE.md（10 行） | Claude 不知道写作风格和项目结构 |
| 第 2 阶段：自动化 | 写了 4 篇后烦了 | 3 个 Skill | 每次手动建文件、填模板、提交推送太重复 |
| 第 3 阶段：加护栏 | 推了 2 次构建失败的代码 | 3 组 Hooks | 构建失败上线 404、Claude 差点执行 rm -rf |
| 第 4 阶段：规模化 | 需要重写 20+ 篇文档 | Subagent 编排 + 评分系统 | 手工改太慢，质量不统一 |

关键原则：**不要一上来就搭全套**。先用最简单的 CLAUDE.md 开始，遇到问题时再加对应的自动化。第一阶段的 10 行配置就够写文章了，后面每个阶段都是因为"痛了"才加的。

---

## 你可以直接用的模式

不管你用的是 Hexo、Hugo 还是 Jekyll，核心模式都可以直接套用。

### 最小起步：CLAUDE.md

这是你唯一必须有的配置文件。最小模板：

```markdown
# CLAUDE.md

## 项目信息
- 框架：Hexo/Hugo/Jekyll（选你的）
- 部署：git push → 自动构建

## 写作规范
- 语气：轻松直接，像朋友讲解
- 代码块必须标注语言
- Front Matter 必须包含 title/date/tags/description

## 发布流程
git add source/_posts/具体文件
git commit -m "post: 文章标题"
git push
```

### Skill 结构

把重复操作定义成 Skill，放在 `.claude/commands/` 下，文件名就是命令名。核心结构就三部分：

```markdown
# Skill 名称

## 用法
/blog-xxx

## 执行流程
1. 第一步做什么
2. 第二步做什么
...

## 注意事项
- 边界条件
```

Skill 本质上就是一份结构化的 prompt，告诉 Claude 遇到这个命令时该按什么步骤执行。

### Hook 最小配置

最实用的一组 Hook 是"构建验证"——在 `git commit` 前自动检查：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git commit:*)",
        "hooks": [{
          "command": "cd $CLAUDE_PROJECT_DIR && your-build-command 2>&1 || { echo '构建失败'; exit 2; }"
        }]
      }
    ]
  }
}
```

把 `your-build-command` 换成你的构建命令（`hexo generate`、`hugo`、`jekyll build`），就完成了最基本的安全网。

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 8 篇。*
