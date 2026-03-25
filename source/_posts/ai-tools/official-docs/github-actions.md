---
title: 精读官方文档：Claude Code GitHub Actions
date: 2026-03-09 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 22
description: Claude Code GitHub Actions 让你在 PR 和 Issue 里用 @claude 触发 AI 自动写代码、修 Bug、创建 PR。本文精读官方文档，详解配置方法、参数说明和踩坑经验。
cover: https://picsum.photos/seed/claude-github-actions/1920/1080
source_url: https://docs.anthropic.com/en/docs/claude-code/github-actions
---

# 精读官方文档：Claude Code GitHub Actions

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code GitHub Actions 是一个 GitHub 集成工具，让你可以在任何 PR 或 Issue 的评论区里通过 `@claude` 提及来召唤 AI 帮你干活。

**它能做什么：**

- **自动创建 PR**：描述你要什么，Claude 直接生成完整的 PR
- **Issue 转代码**：把一个需求 Issue 变成可运行的代码
- **遵循你的规范**：Claude 会读取你仓库里的 `CLAUDE.md`，按你的代码风格来
- **安全可控**：代码运行在 GitHub 的服务器上，不会泄露到外部

简单说，就是在 GitHub 里多了个 AI 助手，你说需求，它写代码。

<!-- more -->

---

## 二、官方教程精读

### 2.1 快速安装

最简单的方式是在终端里运行 Claude Code，然后执行斜杠命令：

```bash
/install-github-app
```

这个命令会引导你完成：
1. 安装 Claude GitHub App 到你的仓库
2. 配置必要的 API Key 密钥

### 2.2 手动安装

如果自动安装失败，或者你想自己控制每一步，按下面三个步骤来：

**第一步：安装 GitHub App**

访问 https://github.com/apps/claude，把 Claude App 安装到你的仓库。

**第二步：添加 API Key 到 Secrets**

进入你的仓库 → Settings → Secrets and variables → Actions → New repository secret

- Name: `ANTHROPIC_API_KEY`
- Value: 你的 Anthropic API Key

**第三步：创建 Workflow 文件**

在仓库的 `.github/workflows/` 目录下创建 `claude.yml`：

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2.3 从 Beta 版升级

如果你之前用的是 `@beta` 版本，需要做以下改动：

**必须改的地方：**

| 旧参数 | 新参数 | 说明 |
|--------|--------|------|
| `mode: "tag"` 或 `mode: "agent"` | 删除 | 现在自动检测 |
| `direct_prompt` | `prompt` | 参数名变了 |
| `override_prompt` | `prompt` + GitHub 变量 | 合并了 |
| `custom_instructions` | `claude_args: --system-prompt` | 移到 claude_args |
| `max_turns` | `claude_args: --max-turns` | 移到 claude_args |
| `model` | `claude_args: --model` | 移到 claude_args |
| `allowed_tools` | `claude_args: --allowedTools` | 移到 claude_args |
| `disallowed_tools` | `claude_args: --disallowedTools` | 移到 claude_args |

**升级前（Beta 版）：**

```yaml
- uses: anthropics/claude-code-action@beta
  with:
    mode: "agent"
    direct_prompt: "Review this PR"
    max_turns: 5
    model: "claude-sonnet-4-20250514"
```

**升级后（v1 版）：**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Review this PR"
    claude_args: "--max-turns 5 --model claude-sonnet-4-20250514"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2.4 Action 参数详解

**完整参数表：**

| 参数 | 说明 | 是否必填 |
|------|------|----------|
| `prompt` | 给 Claude 的指令，可以是文本或斜杠命令 | 否* |
| `claude_args` | 传递给 Claude Code CLI 的参数 | 否 |
| `anthropic_api_key` | Anthropic API Key | 是** |
| `github_token` | GitHub Token，用于 API 访问 | 否 |
| `trigger_phrase` | 触发短语，默认是 `@claude` | 否 |
| `use_bedrock` | 使用 AWS Bedrock 而非 Anthropic API | 否 |
| `use_vertex` | 使用 Google Vertex AI 而非 Anthropic API | 否 |

\* `prompt` 在 Issue/PR 评论场景下可选，Claude 会自动响应触发短语
\*\* 如果使用 Bedrock 或 Vertex AI，则不需要此参数

**claude_args 常用参数：**

```yaml
claude_args: >
  --max-turns 10
  --model claude-sonnet-4-20250514
  --allowedTools Read,Write,Edit,Bash,Glob,Grep
  --debug
```

| 参数 | 说明 |
|------|------|
| `--max-turns` | 最大对话轮数，默认 10 |
| `--model` | 使用的模型 |
| `--mcp-config` | MCP 配置文件路径 |
| `--allowed-tools` | 允许使用的工具列表 |
| `--disallowed-tools` | 禁止使用的工具列表 |
| `--debug` | 开启调试输出 |

### 2.5 常见使用场景

**场景一：在 Issue 里让 Claude 实现功能**

```yaml
# .github/workflows/claude-issue.yml
name: Claude on Issue

on:
  issues:
    types: [opened, edited]

jobs:
  claude:
    if: contains(github.event.issue.body, '@claude implement')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: "Implement the feature described in this issue"
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**场景二：用斜杠命令**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "/review"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**场景三：自定义提示词**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: |
      Review this PR for:
      1. Security vulnerabilities
      2. Performance issues
      3. Code style consistency with CLAUDE.md
    claude_args: "--max-turns 3"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

我在配置 Claude Code GitHub Actions 时，遇到了几个坑：

1. **CI 不在 Claude 的提交上运行**：Claude 创建了 PR，但我的 CI workflow 没有触发
2. **权限不足**：Claude 无法推送代码到分支
3. **API 调用次数太多**：一个复杂任务消耗了大量 token

### 3.2 我的解决方案

**问题一的解决：**

确保使用 GitHub App 而不是默认的 `GITHUB_TOKEN`。在 workflow 里添加：

```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

**问题二的解决：**

检查 GitHub App 的权限设置，确保包含：
- Contents: Read and write
- Pull requests: Read and write
- Issues: Read and write

**问题三的解决：**

设置合理的 `--max-turns` 限制，避免无限循环：

```yaml
claude_args: "--max-turns 5"
```

### 3.3 我的建议

1. **一定要写 CLAUDE.md**：这是让 Claude 理解你项目规范的关键文件，没有它 Claude 就像无头苍蝇
2. **先用小任务测试**：不要上来就让 Claude 做复杂重构，先让它改个 typo 试试
3. **设置超时**：GitHub Actions 有默认超时，但建议在 workflow 级别也设置一个

```yaml
jobs:
  claude:
    timeout-minutes: 10
    runs-on: ubuntu-latest
```

4. **使用 concurrency 控制**：避免同一个 PR 上同时跑多个 Claude 任务

```yaml
concurrency:
  group: claude-${{ github.event.issue.number || github.event.pull_request.number }}
  cancel-in-progress: true
```

---

## 四、常见问题

**Q: Claude 不回复 @claude 命令？**

A: 检查以下几点：
1. GitHub App 是否正确安装
2. Workflow 文件是否在 `.github/workflows/` 目录下
3. `ANTHROPIC_API_KEY` 是否正确配置在 Secrets 里
4. 确保写的是 `@claude` 而不是 `/claude`

**Q: Claude 的提交不触发 CI？**

A: 使用 GitHub App 或自定义 App，不要用 Actions 默认用户。同时检查 workflow 的触发条件是否包含 `pull_request` 事件。

**Q: API 认证失败？**

A: 确认 API Key 有效且有足够余额。如果使用 Bedrock/Vertex，检查云服务凭证配置是否正确。

**Q: 成本怎么控制？**

A:
- 使用具体的 `@claude` 命令，避免模糊指令
- 设置 `--max-turns` 限制迭代次数
- 配置 workflow 超时
- 使用 GitHub 的 concurrency 控制并发

---

## 五、小结

Claude Code GitHub Actions 让你在 GitHub 里直接用 AI 写代码、修 Bug、创建 PR。核心配置就是安装 App、配置 API Key、写个 workflow 文件。记住写好 `CLAUDE.md` 让 AI 懂你的项目规范，控制好 `--max-turns` 避免 token 爆炸。

---

*本文精读自 [Claude Code GitHub Actions - Anthropic](https://docs.anthropic.com/en/docs/claude-code/github-actions)*

*最后更新：2026-03-25*
