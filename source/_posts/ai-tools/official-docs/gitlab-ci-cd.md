---
title: 精读官方文档：Claude Code GitLab CI/CD
date: 2026-03-08 23:00:00
updated: 2026-03-25 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 23
description: 在 GitLab CI/CD 中集成 Claude Code，实现 Issue 自动转 MR、代码自动修复、评论驱动的开发工作流。支持 Claude API、AWS Bedrock、Google Vertex AI 三种后端。
cover: https://picsum.photos/seed/claude-gitlab-ci-cd/1920/1080
source_url: https://code.claude.com/docs/zh-CN/gitlab-ci-cd
---

# 精读官方文档：Claude Code GitLab CI/CD

> 💬 hippo：想象一下——在 Issue 里 @claude，它会自动分析需求、写代码、开 MR。这不是科幻，这是 GitLab CI/CD + Claude Code 的真实能力。

---

## 一、这个功能是什么

Claude Code 可以集成到 GitLab CI/CD 中，让你通过简单的 `@claude` 提及来驱动 AI 完成编码任务：

| 能力 | 说明 |
|------|------|
| **即时 MR 创建** | 描述你的需求，Claude 会生成完整的 MR |
| **自动化实现** | 用一条命令或提及将 Issue 转化为可工作的代码 |
| **项目感知** | Claude 遵循 `CLAUDE.md` 指南和现有代码模式 |
| **简单设置** | 向 `.gitlab-ci.yml` 添加一个作业和一个掩码变量 |
| **企业就绪** | 支持 Claude API、AWS Bedrock 或 Google Vertex AI |
| **默认安全** | 在你的 GitLab runners 中运行，遵循分支保护规则 |

<!-- more -->

---

## 二、工作原理

Claude Code 使用 GitLab CI/CD 在隔离的作业中运行 AI 任务：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  触发事件        │ ──► │  CI/CD 作业     │ ──► │  结果提交        │
│  @claude 评论    │     │  Claude Code    │     │  MR / 分支更新   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**执行流程**：

1. **事件驱动**：GitLab 监听触发器（如在 Issue、MR 或审查线程中提及 `@claude`）
2. **上下文收集**：作业从线程和仓库收集上下文，构建提示
3. **沙箱执行**：在容器中运行 Claude Code，遵循严格的网络和文件系统规则
4. **结果提交**：所有更改通过 MR 提交，审查者可以看到差异

---

## 三、快速设置（5 分钟上手）

### 3.1 添加掩码 CI/CD 变量

1. 转到 **Settings** → **CI/CD** → **Variables**
2. 添加 `ANTHROPIC_API_KEY`（掩码，根据需要保护）

### 3.2 向 `.gitlab-ci.yml` 添加作业

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
    # 可选：如果提供了 GitLab MCP 服务器
    - /bin/gitlab-mcp-server || true
    # 使用 AI_FLOW_* 变量（通过 web/API 触发器传入）
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Review this MR and implement the requested changes'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
```

添加后，通过 **CI/CD** → **Pipelines** 手动运行测试，或从 MR 触发。

---

## 四、典型用例

### 4.1 将 Issue 转化为 MR

在 Issue 评论中：

```
@claude implement this feature based on the issue description
```

Claude 会：
- 分析 Issue 和代码库
- 在分支中编写更改
- 打开 MR 供审查

### 4.2 获取实现帮助

在 MR 讨论中：

```
@claude suggest a concrete approach to cache the results of this API call
```

Claude 会提议更改，添加适当的缓存代码，并更新 MR。

### 4.3 快速修复 Bug

在 Issue 或 MR 评论中：

```
@claude fix the TypeError in the user dashboard component
```

Claude 会定位错误、实现修复、更新分支或打开新 MR。

---

## 五、企业部署：AWS Bedrock 和 Google Vertex AI

企业环境可以选择在云基础设施上完全运行 Claude Code。

### 5.1 AWS Bedrock 配置

**前置条件**：

| 要求 | 说明 |
|------|------|
| AWS 账户 | 启用 Amazon Bedrock 并请求 Claude 模型访问 |
| OIDC 配置 | GitLab 配置为 AWS IAM OIDC 身份提供商 |
| IAM 角色 | 具有 Bedrock 权限和信任策略 |

**必需的 CI/CD 变量**：

- `AWS_ROLE_TO_ASSUME`：角色 ARN
- `AWS_REGION`：Bedrock 区域（如 `us-west-2`）

**作业示例**：

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
    # 交换 GitLab OIDC 令牌获取 AWS 凭证
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

### 5.2 Google Vertex AI 配置

**前置条件**：

| 要求 | 说明 |
|------|------|
| GCP 项目 | 启用 Vertex AI API、IAM Credentials API、STS API |
| WIF 配置 | Workload Identity Federation 信任 GitLab OIDC |
| 服务账户 | 仅具有 Vertex AI 角色 |

**必需的 CI/CD 变量**：

- `GCP_WORKLOAD_IDENTITY_PROVIDER`：完整提供商资源名称
- `GCP_SERVICE_ACCOUNT`：服务账户邮箱
- `CLOUD_ML_REGION`：Vertex 区域（如 `us-east5`）

**作业示例**：

```yaml
claude-vertex:
  stage: ai
  image: gcr.io/google.com/cloudsdktool/google-cloud-cli:slim
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
  before_script:
    - apt-get update && apt-get install -y git && apt-get clean
    - curl -fsSL https://claude.ai/install.sh | bash
    # 通过 WIF 向 Google Cloud 认证
    - >
      gcloud auth login --cred-file=<(cat <<EOF
      {
        "type": "external_account",
        "audience": "${GCP_WORKLOAD_IDENTITY_PROVIDER}",
        "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
        "service_account_impersonation_url": "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT}:generateAccessToken",
        "token_url": "https://sts.googleapis.com/v1/token"
      }
      EOF
      )
  script:
    - /bin/gitlab-mcp-server || true
    - >
      CLOUD_ML_REGION="${CLOUD_ML_REGION:-us-east5}"
      claude
      -p "${AI_FLOW_INPUT:-'Review and update code as requested'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
  variables:
    CLOUD_ML_REGION: "us-east5"
```

---

## 六、常用参数和变量

| 参数/变量 | 说明 |
|----------|------|
| `prompt` / `-p` | 内联提供说明 |
| `prompt_file` | 通过文件提供说明 |
| `max_turns` | 限制来回迭代次数 |
| `timeout_minutes` | 限制总执行时间 |
| `ANTHROPIC_API_KEY` | Claude API 所需（不用于 Bedrock/Vertex） |
| `AWS_REGION` | Bedrock 区域 |
| `CLOUD_ML_REGION` | Vertex AI 区域 |

---

## 七、安全最佳实践

### 7.1 永远不要将 API 密钥提交到仓库

始终使用 GitLab CI/CD 变量：

- 将 `ANTHROPIC_API_KEY` 添加为**掩码**变量
- 如需保护，勾选 **Protected** 选项
- 尽可能使用 OIDC（无长期密钥）

### 7.2 限制作业权限

```yaml
claude:
  # 限制网络出口
  tags:
    - restricted-network
  # 设置合理的超时
  timeout: 30m
  # 使用特定的 runner
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
      when: manual
```

### 7.3 像审查任何贡献者一样审查 Claude 的 MR

- 所有更改都通过 MR 流动
- 分支保护和批准规则仍然适用
- Claude Code 使用工作区范围的权限限制写入

---

## 八、故障排除

### 8.1 Claude 不响应 @claude 命令

**检查清单**：

- [ ] 管道是否被触发（手动、MR 事件或 webhook）
- [ ] CI/CD 变量（`ANTHROPIC_API_KEY` 或云提供商设置）是否存在且未掩码
- [ ] 评论是否包含 `@claude`（不是 `/claude`）
- [ ] 提及触发器是否已配置

### 8.2 作业无法写入评论或打开 MR

**检查清单**：

- [ ] `CI_JOB_TOKEN` 对项目是否有足够权限
- [ ] 是否使用了具有 `api` 范围的项目访问令牌
- [ ] `mcp__gitlab` 工具是否在 `--allowedTools` 中启用
- [ ] 作业是否在 MR 上下文中运行或有足够的 `AI_FLOW_*` 变量

### 8.3 身份验证错误

| 提供商 | 排查步骤 |
|--------|---------|
| Claude API | 确认 `ANTHROPIC_API_KEY` 有效且未过期 |
| AWS Bedrock | 验证 OIDC 配置、角色模拟、密钥名称；确认区域和模型可用性 |
| Google Vertex | 验证 WIF 配置、服务账户权限；确认区域和模型可用性 |

---

## 九、CLAUDE.md 配置建议

在仓库根目录创建 `CLAUDE.md` 文件，定义：

- 编码标准和风格指南
- 审查标准
- 项目特定规则和约定
- 安全要求

Claude 在运行时会读取此文件并遵循你的约定。

---

## 一句话总结

**GitLab CI/CD + Claude Code = 在 Issue 里 @claude，AI 自动分析、写代码、开 MR——企业级安全，三种云后端可选。**

**下一篇**：[精读官方文档：GitHub Actions 集成](./github-actions)

---

*本文精读自 [Claude Code GitLab CI/CD](https://code.claude.com/docs/zh-CN/gitlab-ci-cd)*

*最后更新：2026-03-25*
