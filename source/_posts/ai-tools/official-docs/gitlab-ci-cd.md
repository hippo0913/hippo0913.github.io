---
title: 精读官方文档：Claude Code GitLab CI/CD
date: 2026-03-08 23:00:00
updated: 2026-03-31 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 23
description: 在 GitLab CI/CD 中集成 Claude Code，实现 Issue 自动转 MR、代码自动修复。支持 Claude API、AWS Bedrock、Google Vertex AI 三种后端，企业可按数据驻留需求选择。
cover: https://picsum.photos/seed/claude-gitlab-ci-cd/1920/1080
source_url: https://code.claude.com/docs/zh-CN/gitlab-ci-cd
---

# 精读官方文档：Claude Code GitLab CI/CD

> hippo：想象一下——在 Issue 里 `@claude`，它会自动分析需求、写代码、开 MR。这不是科幻，这是 GitLab CI/CD + Claude Code 的真实能力。

---

## 一、这个功能是什么

Claude Code 可以集成到 GitLab CI/CD 中，让你通过 `@claude` 提及来驱动 AI 完成编码任务。整个流程是：你在 Issue 或 MR 里 `@claude` 说需求 → GitLab 触发 CI 作业 → Claude Code 在隔离容器中分析代码、实现修改 → 自动创建 MR 提交结果。

核心价值一览：

| 能力 | 说明 |
|---|---|
| 即时 MR 创建 | 描述需求，Claude 直接生成完整 MR |
| 自动化实现 | 一条命令将 Issue 转化为可工作的代码 |
| 项目感知 | 读取仓库的 `CLAUDE.md`，遵循现有代码风格 |
| 企业就绪 | 三种云后端可选，适配不同数据驻留需求 |
| 默认安全 | 隔离容器执行，所有更改必须通过 MR 审查 |

<!-- more -->

---

## 二、官方教程精读

### 2.1 工作原理：三大核心机制

理解 Claude Code 在 GitLab CI 中怎么运转，关键是把握三个机制。

**事件驱动编排**——GitLab 监听你配置的触发器（手动触发、MR 事件、webhook），当检测到 `@claude` 提及时，作业从线程收集评论和上下文，从仓库获取代码，构建结构化提示发送给 Claude。

**提供商抽象**——Claude Code 支持三种 AI 后端：

| 提供商 | 认证方式 | 适用场景 |
|---|---|---|
| Claude API (SaaS) | API Key | 快速入门、个人和小团队 |
| AWS Bedrock | IAM + OIDC（一种无需静态密钥的身份验证方式） | AWS 用户、数据驻留合规 |
| Google Vertex AI | Workload Identity Federation（GCP 原生的无密钥认证） | GCP 环境、企业合规 |

**沙箱执行**——每次交互都在受限容器中运行，Claude Code 强制工作区范围的权限限制写入，所有更改必须通过 MR 流程才能合入主分支。

### 2.2 快速设置：5 分钟跑起来

**第一步**：在 GitLab 项目中添加 CI/CD 变量。Settings → CI/CD → Variables，添加 `ANTHROPIC_API_KEY`，务必勾选 **Mask variable**（掩码）和 **Protected**（受保护）。

**第二步**：在 `.gitlab-ci.yml` 中添加以下作业：

```yaml
stages:
  - ai

claude:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  variables:
    GIT_STRATEGY: fetch
  before_script:
    - apk update
    - apk add --no-cache git curl bash
    - curl -fsSL https://claude.ai/install.sh | bash
  script:
    - /bin/gitlab-mcp-server || true
    - echo "$AI_FLOW_INPUT for $AI_FLOW_CONTEXT on $AI_FLOW_EVENT"
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Review this MR and implement the requested changes'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
```

几个关键参数要理解：

| 参数 | 说明 |
|---|---|
| `-p` | 内联提示，`AI_FLOW_INPUT` 通过 webhook/API 传入用户指令 |
| `--permission-mode acceptEdits` | 允许 Claude 自动编辑文件，不询问确认 |
| `--allowedTools` | 工具白名单，`mcp__gitlab` 让 Claude 能操作 GitLab API |
| `--debug` | 输出详细日志，排查问题必备 |
| `AI_FLOW_INPUT` | webhook 传入的用户指令文本 |
| `AI_FLOW_CONTEXT` | 触发上下文（Issue/MR 编号等） |
| `AI_FLOW_EVENT` | 事件类型 |

`/bin/gitlab-mcp-server` 是 GitLab 提供的 MCP 服务器（一种让 AI 连接外部工具的标准协议），它让 Claude 具备操作 GitLab API 的能力——写评论、开 MR 都靠它。`|| true` 确保即使 MCP 服务器启动失败，后续脚本仍继续执行。

### 2.3 企业部署：AWS Bedrock 与 Google Vertex AI

企业环境可以完全在自己的云基础设施上运行 Claude Code，数据不经过 Anthropic。两种方案的共同特点是：**无静态密钥**，都通过 OIDC 信任链获取临时凭证。

**AWS Bedrock** 的核心流程是：GitLab CI 作业自带 JWT 令牌（`CI_JOB_JWT_V2`）→ 用这个令牌向 AWS STS 换取临时凭证 → 用临时凭证调用 Bedrock API。在 GitLab 中配置两个变量：`AWS_ROLE_TO_ASSUME`（IAM 角色 ARN）和 `AWS_REGION`（如 `us-west-2`）。

```yaml
claude-bedrock:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
  before_script:
    - apk add --no-cache bash curl jq git python3 py3-pip
    - pip install --no-cache-dir awscli
    - curl -fsSL https://claude.ai/install.sh | bash
    # 用 GitLab OIDC 令牌换 AWS 临时凭证
    - export AWS_WEB_IDENTITY_TOKEN_FILE="${CI_JOB_JWT_FILE:-/tmp/oidc_token}"
    - if [ -n "${CI_JOB_JWT_V2}" ]; then printf "%s" "$CI_JOB_JWT_V2" > "$AWS_WEB_IDENTITY_TOKEN_FILE"; fi
    - >
      aws sts assume-role-with-web-identity
      --role-arn "$AWS_ROLE_TO_ASSUME"
      --role-session-name "gitlab-claude-$(date +%s)"
      --web-identity-token "file://$AWS_WEB_IDENTITY_TOKEN_FILE"
      --duration-seconds 3600 > /tmp/aws_creds.json
    - export AWS_ACCESS_KEY_ID="$(jq -r .Credentials.AccessKeyId /tmp/aws_creds.json)"
    - export AWS_SECRET_ACCESS_KEY="$(jq -r .Credentials.SecretAccessKey /tmp/aws_creds.json)"
    - export AWS_SESSION_TOKEN="$(jq -r .Credentials.SessionToken /tmp/aws_creds.json)"
  script:
    - /bin/gitlab-mcp-server || true
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Implement the requested changes and open an MR'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
  variables:
    AWS_REGION: "us-west-2"
```

**Google Vertex AI** 使用 Workload Identity Federation（WIF）实现类似的无密钥认证。需要在 GCP 中配置 WIF Provider 信任 GitLab OIDC，然后通过服务账户模拟获取访问令牌。GitLab 中配置三个变量：`GCP_WORKLOAD_IDENTITY_PROVIDER`、`GCP_SERVICE_ACCOUNT` 和 `CLOUD_ML_REGION`。

三种后端的 CI/CD 变量对比：

| 变量 | Claude API | AWS Bedrock | Vertex AI |
|---|---|---|---|
| 认证变量 | `ANTHROPIC_API_KEY` | `AWS_ROLE_TO_ASSUME` | `GCP_WORKLOAD_IDENTITY_PROVIDER` |
| 区域变量 | — | `AWS_REGION` | `CLOUD_ML_REGION` |
| 额外变量 | — | — | `GCP_SERVICE_ACCOUNT` |
| 是否需要掩码 | 是（API Key） | 否（OIDC） | 否（WIF） |

---

## 三、典型用例与高级配置

### 3.1 三种典型用例

**Issue 转 MR**——在 Issue 评论中：

```text
@claude implement this feature based on the issue description
```

Claude 会分析 Issue 和代码库，在分支中编写更改，打开 MR 供审查。

**MR 讨论求助**——在 MR 讨论中：

```text
@claude suggest a concrete approach to cache the results of this API call
```

Claude 会提议方案、添加代码、更新 MR。

**快速修 Bug**——在 Issue 或 MR 评论中：

```text
@claude fix the TypeError in the user dashboard component
```

Claude 定位错误、实现修复、更新分支或开新 MR。

### 3.2 自定义行为与性能优化

**CLAUDE.md 是核心投入点**。在仓库根目录放一份 `CLAUDE.md`，写明编码标准、项目约定和安全要求，Claude 运行时会自动读取并遵循。

自定义提示有两种方式：`-p` 内联传简短指令，`--prompt-file` 用文件传复杂指令（比如安全审查清单）。对于需要控制成本的团队，关键参数是 `--max-turns`（限制 AI 迭代次数）和 `--timeout_minutes`（限制执行时间）：

```yaml
claude:
  stage: ai
  timeout: 30m
  script:
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Implement the requested changes'}"
      --permission-mode acceptEdits
      --max-turns 10
      --timeout-minutes 20
      --allowedTools "Bash Read Edit Write mcp__gitlab"
```

常用参数和变量汇总：

| 参数/变量 | 说明 |
|---|---|
| `-p` | 内联提示文本 |
| `--prompt-file` | 从文件读取提示 |
| `--max-turns` | 限制 Claude 内部迭代次数（控制成本） |
| `--timeout-minutes` | 限制总执行时间 |
| `GIT_STRATEGY` | Git 拉取策略，推荐 `fetch`（增量） |
| `GITLAB_ACCESS_TOKEN` | 可选，替代 `CI_JOB_TOKEN` 的项目访问令牌，需 `api` 范围 |

---

## 四、hippo 的实战经验

> hippo：以下是我实际使用中踩过的坑和总结的建议。

### 4.1 踩过的坑

**@claude 不响应**——最常见的三个原因：管道压根没触发（检查 `rules` 里的 `CI_PIPELINE_SOURCE` 是否匹配）、API Key 变量被掩码了（掩码和"受保护"不冲突，但确认变量确实存在）、写成了 `/claude` 而不是 `@claude`（`/` 是斜杠命令，`@` 才是提及触发）。

**作业无法写评论或开 MR**——`CI_JOB_TOKEN` 的默认权限可能不够。如果你发现 Claude 能跑但无法回写 GitLab，检查两点：`mcp__gitlab` 是否在 `--allowedTools` 中启用，以及是否需要配置 `GITLAB_ACCESS_TOKEN` 来替代默认的 job token。

**OIDC 认证报错**——AWS Bedrock 的 OIDC 信任策略里 `project_path` 如果写错了项目路径（比如忘了 group 前缀），`AssumeRoleWithWebIdentity` 会直接失败，报错信息却只说"not authorized"。建议先用 AWS CloudTrail 查看实际的 `sub` claim 值，再回去对信任策略。

### 4.2 我的使用建议

**先用 Claude API 验证流程，再切企业后端。** API Key 方式配置最简单，先把整个 `@claude` 触发 → CI 执行 → MR 创建的链路跑通，确认没有问题后，再花时间配 Bedrock 或 Vertex AI 的 OIDC。否则一旦出错，你分不清是 Claude Code 的问题还是 OIDC 配置的问题。

**CLAUDE.md 是投资回报率最高的配置。** 与其花时间调参数，不如把项目编码规范、测试要求、禁止操作写清楚。一份好的 `CLAUDE.md` 能让 Claude 的输出质量从"能用"变成"基本可以合入"。

**始终人工审查 MR。** Claude 写的代码能跑不等于写对了。特别是涉及数据库操作、权限判断、并发处理的代码，一定要逐行看。把它当成一个水平不错但偶尔犯低级错误的实习生。

---

## 五、安全与成本

**安全四原则**：不提交密钥到仓库（用 CI/CD 变量）、OIDC 优先（不存长期密钥）、限制作业权限（设 timeout、限制并发）、像审查人类贡献者一样审查 Claude 的 MR。

成本由两部分构成：GitLab Runner 的计算分钟数 + AI API 的 Token 消耗。控制成本的有效手段：

| 手段 | 说明 |
|---|---|
| `--max-turns` | 限制迭代次数，防止失控运行 |
| `--timeout-minutes` | 硬性时间上限 |
| 具体 `@claude` 指令 | 减少模糊需求带来的多余轮次 |
| 复杂任务拆小 Issue | 单次任务越小，Token 消耗越可控 |

不同场景的成本参考：

| 场景 | 预估 Token 消耗 | 说明 |
|---|---|---|
| 简单代码审查 | 5,000 - 15,000 | 读少量文件，生成评论 |
| Bug 修复 | 10,000 - 30,000 | 定位问题 + 生成修复 |
| 功能实现 | 30,000 - 100,000+ | 取决于代码库大小 |

---

## 六、小结

**GitLab CI/CD + Claude Code = 在 Issue 里 `@claude`，AI 自动分析、写代码、开 MR。** 三种云后端可选，OIDC 无静态密钥，MR 强制审查。先把基本流程跑通，写好 `CLAUDE.md`，然后逐步加码。

**下一篇**：[精读官方文档：GitHub Actions 集成](./github-actions)

---

*本文精读自 [Claude Code GitLab CI/CD 官方文档](https://code.claude.com/docs/zh-CN/gitlab-ci-cd)*

*最后更新：2026-03-31*
