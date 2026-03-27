---
title: 精读官方文档：Claude Code GitHub Actions
date: 2026-03-09 23:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 22
description: Claude Code GitHub Actions 让你在 PR 和 Issue 里用 @claude 触发 AI 自动写代码、修 Bug、创建 PR。本文精读官方文档，详解配置方法、参数说明和踩坑经验。
cover: https://picsum.photos/seed/claude-github-actions/1920/1080
source_url: https://code.claude.com/docs/zh-CN/github-actions
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
| `custom_instructions` | `claude_args: --append-system-prompt` | 移到 claude_args |
| `max_turns` | `claude_args: --max-turns` | 移到 claude_args |
| `model` | `claude_args: --model` | 移到 claude_args |
| `allowed_tools` | `claude_args: --allowedTools` | 移到 claude_args |
| `disallowed_tools` | `claude_args: --disallowedTools` | 移到 claude_args |
| `claude_env` | `settings` | JSON 格式配置 |

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
| `settings` | JSON 格式的设置配置（替代旧版 `claude_env`） | 否 |
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
| `--mcp-config` | MCP 配置文件路径，用于动态加载 Model Context Protocol 服务器 |
| `--allowed-tools` | 允许使用的工具列表 |
| `--disallowed-tools` | 禁止使用的工具列表 |
| `--append-system-prompt` | 追加系统提示（不是替换） |
| `--debug` | 开启调试输出 |

**settings 参数（JSON 格式）：**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    settings: |
      {
        "env": {
          "MY_CUSTOM_VAR": "value"
        }
      }
```

> 💬 hippo：`settings` 参数是 v1 新增的，用于替代旧版的 `claude_env`，支持更复杂的 JSON 格式配置。

### 2.5 使用 AWS Bedrock 和 Google Vertex AI

对于企业环境，你可以将 Claude Code GitHub Actions 与自己的云基础设施配合使用。这种方法让你可以控制数据驻留和计费，同时保持相同的功能。

**Google Cloud Vertex AI 前置条件：**

1. 启用了 Vertex AI 的 Google Cloud 项目
2. 为 GitHub Actions 配置的工作负载身份联合（Workload Identity Federation）
3. 具有所需权限的服务账户
4. GitHub 应用（推荐）或使用默认 GITHUB_TOKEN

**AWS Bedrock 前置条件：**

1. 启用了 Amazon Bedrock 的 AWS 账户
2. 在 AWS 中配置的 GitHub OIDC 身份提供商
3. 具有 Bedrock 权限的 IAM 角色
4. GitHub 应用（推荐）或使用默认 GITHUB_TOKEN

**Vertex AI 配置示例：**

```yaml
name: Claude Code with Vertex AI

on:
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  id-token: write  # OIDC 认证必需

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID'
          service_account: 'claude-code@PROJECT_ID.iam.gserviceaccount.com'

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          use_vertex: true
          # 不需要 anthropic_api_key
```

**AWS Bedrock 配置示例：**

```yaml
name: Claude Code with Bedrock

on:
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  id-token: write  # OIDC 认证必需

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/ClaudeCodeRole
          aws-region: us-east-1

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          use_bedrock: true
          # 不需要 anthropic_api_key
```

### 2.6 自定义 GitHub App

对于需要品牌用户名或自定义身份验证流的组织，可以创建自己的 GitHub App：

**创建步骤：**

1. 访问 GitHub Settings → Developer settings → GitHub Apps → New GitHub App
2. 配置所需权限：
   - **Contents**: Read and write（用于修改仓库文件）
   - **Issues**: Read and write（用于响应 issue）
   - **Pull requests**: Read and write（用于创建 PR 和推送更改）
3. 创建后，记录 App ID 和 Private Key
4. 在 workflow 中使用 `actions/create-github-app-token` action 生成令牌

**配置示例：**

```yaml
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate GitHub App Token
        id: app-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}

      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2.7 常见使用场景

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

**场景二：用斜杠命令（Skills）**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "/review"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**场景三：代码审查工作流**

```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review this pull request for code quality, correctness, and security. Analyze the diff, then post your findings as review comments."
          claude_args: "--max-turns 5"
```

**场景四：定时任务（每日报告）**

```yaml
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
          claude_args: "--model opus"
```

**场景五：使用 MCP 配置**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_args: "--mcp-config /path/to/config.json"
```

> 💬 hippo：`--mcp-config` 参数用于动态加载 MCP（Model Context Protocol）服务器配置，让 Claude 可以连接外部工具和数据源。

### 2.8 官方示例目录

官方提供了完整的示例工作流文件，可以在 examples 目录中找到：

```
https://github.com/anthropics/claude-code-action/tree/main/examples
```

示例包括：
- `claude.yml` - 基础配置
- 各种触发场景的配置模板
- 企业部署示例

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

5. **控制成本**：
   - 使用具体的 `@claude` 命令来减少不必要的 API 调用
   - 在 `claude_args` 中配置适当的 `--max-turns` 以防止过度迭代
   - 设置工作流级别的超时以避免失控的作业
   - 考虑使用 GitHub 的并发控制来限制并行运行

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

A: 确认 API Key 有效且有足够余额。如果使用 Bedrock/Vertex，检查云服务凭证配置是否正确，以及密钥在工作流中是否正确命名。

**Q: 成本怎么控制？**

A:
- 使用具体的 `@claude` 命令，避免模糊指令
- 设置 `--max-turns` 限制迭代次数
- 配置 workflow 超时
- 使用 GitHub 的 concurrency 控制并发

**Q: CI 成本由哪些部分组成？**

A:
- **GitHub Actions 成本**：Claude Code 在 GitHub 托管的运行器上运行，会消耗 GitHub Actions 分钟数
- **API 成本**：每次 Claude 交互都会根据提示和响应的长度消耗 API 令牌，令牌使用量因任务复杂性和代码库大小而异

---

## 五、小结

Claude Code GitHub Actions 让你在 GitHub 里直接用 AI 写代码、修 Bug、创建 PR。核心配置就是安装 App、配置 API Key、写个 workflow 文件。记住写好 `CLAUDE.md` 让 AI 懂你的项目规范，控制好 `--max-turns` 避免 token 爆炸。企业用户可以使用 AWS Bedrock 或 Google Vertex AI 来控制数据驻留和计费。

---

*本文精读自 [Claude Code GitHub Actions - Claude Code Docs](https://code.claude.com/docs/zh-CN/github-actions)*

*最后更新：2026-03-27*
