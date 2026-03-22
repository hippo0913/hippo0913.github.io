---
title: 精读官方文档：Claude Code GitHub Actions
date: 2026-03-12 22:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 22
description: 精读 Claude Code GitHub Actions 文档，了解如何在 CI/CD 中使用 Claude Code。
cover: https://picsum.photos/seed/claude-github-actions/1920/1080
source_url: https://code.claude.com/docs/zh-CN/github-actions
---

# 精读官方文档：Claude Code GitHub Actions

> 💬 hippo：这是 Claude Code 官方文档精读系列的第 22 篇，讲的是如何把 Claude Code 集成到 GitHub Actions 里，让 AI 帮你自动化处理代码审查、功能实现和 bug 修复。

---

## 开篇：为什么要在 GitHub Actions 里用 Claude Code？

想象一下这个场景：你的项目里来了一个 PR（Pull Request，合并请求），需要人工审查代码质量、检查安全性、看看有没有潜在 bug。传统做法是什么？打开代码，一行行看，有时候眼睛看花了还漏掉问题。

GitHub Actions 里的 Claude Code 解决的就是这个问题——**让 AI 自动帮你处理这些重复性的开发任务**。

根据官方文档，它能帮你做五件事：
- **即时 PR 创建**：描述你需要什么，Claude 会创建一个包含所有必要更改的完整 PR
- **自动化代码实现**：通过单个命令将 issue 转换为可工作的代码
- **遵循你的标准**：Claude 尊重你的 `CLAUDE.md` 指南和现有代码模式
- **简单设置**：几分钟就能开始使用
- **默认安全**：你的代码保留在 GitHub 的运行器上

简单说，就是在你的 GitHub 工作流里加入一个 AI 助手，它能自动响应 `@claude` 命令，帮你干活。

---

<!-- more -->

---

## 核心概念：大白话讲 GitHub Actions 集成

### 什么是 GitHub Actions？

GitHub Actions 是 GitHub 提供的 CI/CD（持续集成/持续部署）工具，就是自动化的工作流。你可以配置一系列任务，当代码提交、创建 PR、或者定时触发时，自动执行这些任务。

比如典型的 CI/CD 流程：
1. 有人提交代码 → 自动运行测试
2. 测试通过 → 自动构建项目
3. 构建成功 → 自动部署到服务器

### Claude Code GitHub Action 是什么？

Claude Code GitHub Action 是一个**预封装的 GitHub Action**，让你能在 GitHub Actions 工作流中运行 Claude Code。

用通俗的话说：
- GitHub Actions = 自动化任务框架
- Claude Code Action = 在框架里运行的 AI 助手
- 你只需要写配置文件，告诉它什么时候触发、做什么事

### 工作原理（用通俗的话说）

1. **触发条件**：当有人发 PR、评论 issue、或者定时任务触发
2. **启动 Claude**：GitHub Actions 运行器启动 Claude Code
3. **执行任务**：Claude 分析代码、创建 PR、修复 bug 等
4. **返回结果**：结果以 PR、评论、或 issue 回复的形式展示

> 💬 hippo：想象一下，你的仓库里有个 AI 机器人，它在 GitHub 的服务器上运行。有人提 PR 时，它会自动审查代码；有人在 issue 里 @claude 说"帮我实现这个功能"，它会真的去写代码并提交 PR。

---

## 实战指南：手把手教你用

### 场景一：自动响应 @claude 命令

这是最基本的用法——在任何 issue 或 PR 评论里 @claude，Claude 会自动响应。

**第一步：快速设置（推荐）**

在终端里打开 Claude Code，运行：

```bash
claude
# 然后输入
/install-github-app
```

这个命令会引导你完成：
1. 安装 Claude GitHub 应用
2. 配置 API 密钥
3. 设置仓库权限

**第二步：手动设置（如果快速设置失败）**

1. **安装 Claude GitHub 应用**

访问 https://github.com/apps/claude，点击安装到你的仓库。

应用需要这些权限：
- **Contents**：读写（用于修改仓库文件）
- **Issues**：读写（用于响应 issue）
- **Pull requests**：读写（用于创建 PR 和推送更改）

2. **添加 API 密钥**

在 GitHub 仓库设置里：
- 进入 Settings → Secrets and variables → Actions
- 点击 New repository secret
- 名字填 `ANTHROPIC_API_KEY`
- 值填你的 Anthropic API 密钥

3. **创建工作流文件**

在项目根目录创建 `.github/workflows/claude.yml`：

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # 响应 @claude 提及的评论
```

**第三步：测试**

在 issue 或 PR 里发评论：

```
@claude 帮我分析这个 PR 里有没有安全问题
```

Claude 会自动分析并回复。

> 💬 hippo：快速设置命令 `/install-github-app` 真的很方便，它会把所有事情都帮你搞定。如果你遇到网络问题或者需要自定义配置，再用手动设置。

---

### 场景二：自动代码审查

配置一个工作流，每当有人提交 PR，Claude 自动审查代码质量。

**创建工作流文件** `.github/workflows/code-review.yml`：

```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review this pull request for code quality, correctness, and security. Analyze the diff, then post your findings as review comments."
          claude_args: "--max-turns 5"
```

**参数说明：**
- `prompt`：给 Claude 的指令，告诉它要做什么
- `claude_args: "--max-turns 5"`：限制对话轮数为 5，防止无限循环

**效果：**
- 有人提交 PR
- Claude 自动审查代码
- 审查意见以 review comments 的形式展示

> 💬 hippo：`--max-turns` 是个重要参数，它控制 Claude 能和你对话几次。设置得太小可能审查不充分，设置得太大可能浪费 API 额度。我一般用 5-10 次。

---

### 场景三：定时生成日报

配置一个定时任务，每天早上自动总结昨天的提交和开放的 issue。

**创建工作流文件** `.github/workflows/daily-report.yml`：

```yaml
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"  # 每天早上 9 点（UTC 时间）
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
          claude_args: "--model claude-sonnet-4-6"
```

**参数说明：**
- `cron: "0 9 * * *"`：定时表达式，这里是每天早上 9 点
- `--model claude-sonnet-4-6`：指定使用的模型

> 💬 hippo：cron 表达式需要一点时间适应。你可以用在线工具生成，比如 crontab.guru。注意 GitHub Actions 默认用 UTC 时间，要算时差。

---

### 场景四：自定义触发短语

默认情况下，Claude 响应 `@claude` 提及。你可以改成自己想要的短语。

**修改工作流文件**：

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    trigger_phrase: "@ai-bot"  # 改成 @ai-bot 触发
```

**效果：**
- 原来用 `@claude` 触发
- 现在用 `@ai-bot` 触发

> 💬 hippo：这个功能适合有多个机器人或者想自定义品牌的情况。不过我觉得 `@claude` 已经够直观了，一般不需要改。

---

## hippo 的踩坑实录

### 坑点一：从 Beta 版本升级时报错

**问题现象：**

我之前用的是 Beta 版本，升级到 v1.0 后工作流一直报错。

**原因分析：**

Beta 版本和 v1.0 的配置方式完全不同：
- Beta 用 `mode: "tag"` 或 `mode: "agent"`
- v1.0 自动检测模式，不需要 `mode` 参数
- Beta 用 `direct_prompt`
- v1.0 改成 `prompt`
- Beta 的 CLI 选项直接写在工作流里
- v1.0 需要全部放到 `claude_args` 里

**解决方案：**

按照官方的升级指南，逐项修改：

```yaml
# 旧版 Beta 配置
- uses: anthropics/claude-code-action@beta
  with:
    mode: "tag"
    direct_prompt: "Review this PR for security issues"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    custom_instructions: "Follow our coding standards"
    max_turns: "10"
    model: "claude-sonnet-4-6"

# 新版 v1.0 配置
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Review this PR for security issues"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_args: |
      --append-system-prompt "Follow our coding standards"
      --max-turns 10
      --model claude-sonnet-4-6
```

**主要变化对照表：**

| 旧 Beta 输入 | 新 v1.0 输入 |
| --- | --- |
| `mode` | 已删除（自动检测） |
| `direct_prompt` | `prompt` |
| `override_prompt` | `prompt` 带 GitHub 变量 |
| `custom_instructions` | `claude_args: --append-system-prompt` |
| `max_turns` | `claude_args: --max-turns` |
| `model` | `claude_args: --model` |
| `allowed_tools` | `claude_args: --allowedTools` |
| `disallowed_tools` | `claude_args: --disallowedTools` |

> 💬 hippo：升级的时候一定要仔细对照官方的迁移指南。我第一次升级时漏掉了 `claude_args` 的多行写法（用 `|` 符号），结果参数都没传过去。

---

### 坑点二：Claude 不响应 @claude 命令

**问题现象：**

我在 issue 里发 `@claude 帮我分析这个 PR`，但完全没有反应。

**原因分析：**

可能的原因有很多：
1. GitHub 应用没正确安装
2. 工作流文件有问题
3. API 密钥没配置
4. 触发条件不匹配
5. 评论用的是 `/claude` 而不是 `@claude`

**解决方案：**

按顺序排查：

```bash
# 1. 检查应用是否安装
# 访问 https://github.com/apps/claude
# 确认应用已安装到你的仓库

# 2. 检查工作流是否启用
# 在 GitHub 仓库的 Actions 标签页
# 看看 Claude Code 工作流是否在运行

# 3. 检查 API 密钥
# Settings → Secrets and variables → Actions
# 确认 ANTHROPIC_API_KEY 存在且值正确

# 4. 检查触发条件
# 确保工作流的 on 配置包含你触发的事件
# 比如 issue_comment 需要在 issue 里评论
# pull_request 需要创建 PR

# 5. 确认评论格式
# 必须用 @claude，不是 /claude
```

> 💬 hippo：最常见的问题是触发条件配错了。比如你想在 PR 评论里触发，但工作流只配置了 `issue_comment`，没有配置 `pull_request_review_comment`。我现在都把两个都配上。

---

### 坑点三：CI 不在 Claude 的提交上运行

**问题现象：**

Claude 创建了一个 PR，但 CI 检查没有自动运行。

**原因分析：**

1. 使用的是 Actions 用户而不是 GitHub 应用
2. 工作流触发器没包含必要的事件
3. 应用权限没有 CI 触发器

**解决方案：**

```yaml
# 确保使用 GitHub 应用
# 在仓库设置里，确认 "Claude" 应用已授权

# 检查工作流触发器
on:
  pull_request:
    types: [opened, synchronize, reopened]  # 包含 synchronize

# 检查应用权限
# GitHub 应用需要有 workflows 权限
# Settings → Apps → Claude → Edit permissions
```

> 💬 hippo：这个问题很隐蔽。Claude 提交的 PR 默认不会触发 CI，除非你配置了 `synchronize` 事件。我建议把 `opened`、`synchronize`、`reopened` 都加上，确保覆盖所有情况。

---

## 常见问题解答

### Q：这个功能免费吗？

A：Claude Code GitHub Action 本身是免费的，但运行时会产生两部分成本：
1. **GitHub Actions 分钟数**：GitHub Actions 的运行时长
2. **Anthropic API 费用**：每次 Claude 交互都消耗 token

具体费用看你的使用量和 GitHub 订阅计划。

### Q：可以在公司里用吗？

A：可以，而且官方支持企业级集成。如果公司有合规要求，可以用 AWS Bedrock 或 Google Vertex AI：
- **AWS Bedrock**：数据留在 AWS，用自己的 IAM 权限
- **Google Vertex AI**：数据留在 Google Cloud，用服务账号

需要提前配置好云基础设施和身份验证。

### Q：Claude 能访问我所有的代码吗？

A：Claude 只能访问它需要处理的代码。具体访问范围取决于：
1. 工作流的配置（checkout 了哪些代码）
2. 应用权限（只给了必要的权限）
3. API 密钥的作用范围

建议遵循最小权限原则，只给必要的权限。

### Q：如何控制成本？

A：官方推荐几个优化方法：
1. 设置 `--max-turns` 限制对话轮数
2. 设置工作流级别的超时时间
3. 使用 GitHub 的并发控制限制并行运行
4. 只在必要时触发（避免每个 PR 都自动审查）

### Q：Claude 会自动合并 PR 吗？

A：默认不会。Claude 只会创建 PR 或发表评论，不会自动合并。你需要自己审查 Claude 的建议，手动合并。

### Q：可以用在私有仓库吗？

A：可以。Claude Code GitHub Action 支持私有仓库，需要确保：
1. API 密钥有访问私有仓库的权限
2. GitHub 应用安装到了私有仓库

---

## 最佳实践

### CLAUDE.md 配置

在仓库根目录创建 `CLAUDE.md`，定义你的代码规范：

```markdown
# Claude Code 配置

## 代码风格
- 使用 2 空格缩进
- 函数名用驼峰命名
- 常量用全大写

## 审查标准
- 关注安全性（SQL 注入、XSS）
- 关注性能（避免 N+1 查询）
- 关注可读性（函数不超过 50 行）

## 项目规范
- 所有提交前必须通过测试
- 新功能需要写单元测试
```

Claude 会自动读取这个文件，按照你的规范干活。

### 安全注意事项

1. **永远不要把 API 密钥写死在工作流里**
   - 始终用 `${{ secrets.ANTHROPIC_API_KEY }}`
   - 在仓库设置里配置 Secrets

2. **限制应用权限**
   - 只给必要的权限
   - 定期审查权限设置

3. **审查 Claude 的建议**
   - 不要盲目合并 Claude 创建的 PR
   - 人工审查后再合并

### 性能优化

1. **使用 issue 模板**
   - 提供清晰的上下文
   - 减少 Claude 的理解时间

2. **保持 CLAUDE.md 简洁**
   - 只写关键的规范
   - 避免冗余信息

3. **配置合理的超时时间**
   - 防止工作流无限运行
   - 节省资源

---

## 一句话总结

Claude Code GitHub Actions 让 AI 成为你的 CI/CD 助手，自动处理代码审查、功能实现和 bug 修复，大幅提升开发效率。

---

## 系列导航

**上一篇**：[精读官方文档：在 Chrome 中使用 Claude Code（测试版）](/2026/03/12/ai-tools/official-docs/chrome/)

**下一篇**：[精读官方文档：Claude Code GitLab CI/CD](/2026/03/12/ai-tools/official-docs/gitlab-ci-cd/)

**系列大纲**：[Claude Code 官方文档精读系列索引](/2026/03/10/ai-tools/claude-code-official-docs-index/)

---

*本文精读自 [Claude Code GitHub Actions](https://code.claude.com/docs/zh-CN/github-actions)*
