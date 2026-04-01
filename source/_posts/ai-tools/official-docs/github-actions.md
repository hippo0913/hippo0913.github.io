---
title: 精读官方文档：Claude Code GitHub Actions
date: 2026-03-09 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 22
description: Claude Code GitHub Actions 让你在 PR 和 Issue 里用 @claude 触发 AI 自动写代码、修 Bug、创建 PR。本文精读官方文档，详解 v1 配置、参数迁移、企业部署和踩坑经验。
cover: https://picsum.photos/seed/claude-github-actions/1920/1080
source_url: https://code.claude.com/docs/zh-CN/github-actions
---

# 精读官方文档：Claude Code GitHub Actions

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code GitHub Actions 是一个官方 Action，让你在 PR 或 Issue 评论区里用 `@claude` 提及来召唤 AI 帮你干活。它能做的事情包括：自动创建 PR、把 Issue 转成代码、修复 Bug、审查代码质量。

和 GitHub 自带的 Code Review 不同，这个 Action 需要 `@claude` 手动触发，不会自动在你的每个 PR 上留言。Claude 会读取仓库根目录的 `CLAUDE.md` 来理解你的项目规范，所以它输出的代码风格是你定的，不是随机发挥。

代码运行在 GitHub 的服务器上，不经过第三方，企业也可以接 AWS Bedrock 或 Google Vertex AI 来控制数据驻留和计费。

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装与设置

最简单的方式是在 Claude Code 终端里执行斜杠命令（Skills，即内置的快捷指令）：

```bash
/install-github-app
```

它会引导你完成 App 安装和 API Key 配置。如果自动安装失败，手动三步走：

1. 访问 https://github.com/apps/claude 安装 GitHub App
2. 在仓库 Settings → Secrets and variables → Actions 里添加 `ANTHROPIC_API_KEY`
3. 创建 workflow 文件：

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

注意 `permissions` 必须显式声明写权限。GitHub App 也需要 Contents、Issues、Pull requests 三项读写权限，否则 Claude 无法推送代码和创建 PR。

### 2.2 Action 参数详解与 v1 迁移

v1 版本（GA）大幅简化了配置：`prompt` 统一了旧版的 `direct_prompt` 和 `override_prompt`，`claude_args` 统一了 `max_turns`、`model`、`custom_instructions` 等一票参数，`mode` 参数直接删除改为自动检测。

**Beta → v1 迁移映射：**

| 旧参数 | v1 参数 | 说明 |
|---|---|---|
| `mode` | 删除 | 自动检测，无需配置 |
| `direct_prompt` | `prompt` | 参数名变了 |
| `override_prompt` | `prompt` + GitHub 变量 | 合并到 prompt |
| `custom_instructions` | `claude_args: --append-system-prompt` | 移入 claude_args |
| `max_turns` | `claude_args: --max-turns` | 移入 claude_args |
| `model` | `claude_args: --model` | 移入 claude_args |
| `allowed_tools` | `claude_args: --allowedTools` | 移入 claude_args |
| `disallowed_tools` | `claude_args: --disallowedTools` | 移入 claude_args |
| `claude_env` | `settings` | JSON 格式配置 |

**Action 完整参数表：**

| 参数 | 说明 | 必填 |
|---|---|---|
| `anthropic_api_key` | Anthropic API 密钥 | 是（Bedrock/Vertex 除外） |
| `prompt` | 给 Claude 的指令，纯文本或斜杠命令 | 否（评论场景可省略） |
| `claude_args` | 传递给 Claude Code CLI 的参数字符串 | 否 |
| `github_token` | GitHub API 令牌，默认 GITHUB_TOKEN | 否 |
| `trigger_phrase` | 触发短语，默认 `@claude` | 否 |
| `use_bedrock` | 使用 AWS Bedrock | 否 |
| `use_vertex` | 使用 Google Vertex AI | 否 |
| `settings` | JSON 格式设置（替代旧版 claude_env） | 否 |

`claude_args` 里最常用的几个 CLI 参数：

```yaml
claude_args: |
  --max-turns 10
  --model claude-sonnet-4-6
  --append-system-prompt "Follow our coding standards"
  --allowedTools Read,Write,Edit,Bash,Glob,Grep
  --debug
```

`prompt` 参数还支持斜杠命令（Skills），比如 `prompt: "/review"` 就能触发 Claude Code 内置的代码审查技能。除了在 prompt 里指定指令，你也可以在仓库的 `CLAUDE.md` 中定义项目级规范，这是自定义 Claude 行为的首要方式。workflow 级别的临时指令用 `prompt`，项目级的持久规范用 `CLAUDE.md`，两者叠加生效。

### 2.3 典型使用场景

**代码审查工作流**——PR 打开或更新时自动 Review：

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
          prompt: "Review this pull request for code quality and security"
          claude_args: "--max-turns 5"
```

**定时任务**——用 cron 触发日报或周报：

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

**评论区常用命令：**

- `@claude implement this feature` —— 让 Claude 实现功能
- `@claude fix the failing test` —— 修复问题
- `@claude how should I handle error cases?` —— 提问咨询

本质上，`prompt` + `claude_args` 的组合能覆盖你想要的任何工作流。官方在 [examples 目录](https://github.com/anthropics/claude-code-action/tree/main/examples) 里提供了更多模板。

### 2.4 企业部署：Bedrock 与 Vertex AI

企业可以用 AWS Bedrock 或 Google Vertex AI 替代 Anthropic API，通过 OIDC（OpenID Connect，一种身份联合认证协议）认证，不需要 API Key。两者的关键配置差异：

**AWS Bedrock**——需要先配置 AWS 凭证：

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/ClaudeCodeRole
    aws-region: us-east-1

- name: Run Claude Code
  uses: anthropics/claude-code-action@v1
  with:
    use_bedrock: true
```

**Google Vertex AI**——需要先认证到 GCP：

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/NUMBER/locations/global/workloadIdentityPools/POOL/providers/PROVIDER'
    service_account: 'claude-code@PROJECT_ID.iam.gserviceaccount.com'

- name: Run Claude Code
  uses: anthropics/claude-code-action@v1
  with:
    use_vertex: true
```

两者的共同点：都需要在 `permissions` 里加 `id-token: write` 来启用 OIDC，都不需要 `anthropic_api_key`。

---

## 三、实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验。

**CI 不触发 Claude 的提交**：这是最常见的坑。默认的 `GITHUB_TOKEN` 触发的事件不会再次触发 workflow，所以 Claude 的 push 不会跑你的 CI。解决方案是使用 GitHub App 生成的 token，而不是默认的 `GITHUB_TOKEN`。

**CLAUDE.md 是关键**：我强烈建议在仓库根目录放一份 `CLAUDE.md`，定义代码风格、审查标准、项目规则。Claude 会严格遵循里面的规范，没有这个文件 Claude 就只能靠猜。`prompt` 适合临时指令，`CLAUDE.md` 适合持久规范，两者叠加生效。

**成本控制三板斧**：

```yaml
# 1. 限制迭代轮数
claude_args: "--max-turns 5"

# 2. 设置 workflow 超时
jobs:
  claude:
    timeout-minutes: 10

# 3. 并发控制，同一 PR 只跑一个 Claude 任务
concurrency:
  group: claude-${{ github.event.issue.number || github.event.pull_request.number }}
  cancel-in-progress: true
```

---

## 四、常见问题

**Q: Claude 不响应 @claude 命令？**

A: 按顺序排查：App 是否安装到仓库 → workflow 文件是否在 `.github/workflows/` 下 → `ANTHROPIC_API_KEY` 是否配置在 Secrets 里 → 确保写的是 `@claude` 不是 `/claude`。

**Q: Claude 的提交不触发我的 CI？**

A: 使用 GitHub App 或自定义 App 生成 token，不要用默认的 Actions 用户。同时在 workflow 的触发条件里确认包含了 `pull_request` 事件。

**Q: API 认证失败？**

A: 直连 Anthropic API 的话检查 Key 有效性和余额；用 Bedrock/Vertex 的话检查云服务凭证和 IAM 角色配置。

**Q: 成本由什么组成？**

A: 两部分：GitHub Actions 分钟数（运行器本身的开销）+ API Token 消耗（取决于任务复杂度和代码库大小）。控制 `--max-turns` 和设置超时是主要的省钱手段。

---

## 五、小结

核心流程就是：安装 App → 配置 Key → 写 workflow → `@claude` 触发。关键配置项：`CLAUDE.md` 定义项目规范，`--max-turns` 控制成本，企业用户用 Bedrock/Vertex 控制数据驻留。更多示例见官方 [examples 目录](https://github.com/anthropics/claude-code-action/tree/main/examples)。

---

*本文精读自 [Claude Code GitHub Actions - Claude Code Docs](https://code.claude.com/docs/zh-CN/github-actions)*

*最后更新：2026-03-31*
