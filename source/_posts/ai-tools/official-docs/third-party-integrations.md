---
title: 精读官方文档：企业部署概述
date: 2026-03-06 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 25
description: Claude Code 支持多种企业级部署方式：直连 Anthropic API、通过 AWS Bedrock 或 Google Vertex AI 调用、配合企业代理和 LLM Gateway。本文详解各方案的配置方法和选型建议。
cover: https://picsum.photos/seed/claude-enterprise-deploy/1920/1080
source_url: https://code.claude.com/docs/zh-CN/third-party-integrations
---

# 精读官方文档：企业部署概述

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

如果你的公司对网络安全、合规性有严格要求，直接让 Claude Code 连接 Anthropic API 可能行不通。好消息是，Claude Code 支持多种企业级部署方案：

1. **云服务商直连**：通过 AWS Bedrock 或 Google Vertex AI 调用 Claude 模型
2. **企业代理**：让所有流量走公司统一的代理服务器
3. **LLM Gateway**：在 Claude Code 和模型提供商之间加一层网关，统一管理认证、计费、日志

这篇文章帮你搞清楚：有哪些选择、各有什么优缺点、具体怎么配置。

<!-- more -->

---

## 二、官方教程精读

### 2.1 云服务商对比

Claude Code 支持三个主要的模型提供商，官方给出了对比表：

| 特性 | Anthropic 直连 | Amazon Bedrock | Google Vertex AI |
|------|---------------|----------------|------------------|
| 服务区域 | 支持的国家/地区 | 多个 AWS 区域 | 多个 GCP 区域 |
| Prompt 缓存 | 默认启用 | 默认启用 | 需联系 Google 开启 |
| 认证方式 | API Key | AWS 凭证 (IAM) | GCP 凭证 (OAuth/服务账号) |
| 费用追踪 | Dashboard | AWS Cost Explorer | GCP Billing |
| 企业特性 | Teams、用量监控 | IAM 策略、CloudTrail | IAM 角色、Cloud Audit Logs |

> 💬 hippo：如果你的公司已经是 AWS 或 GCP 的重度用户，走 Bedrock 或 Vertex AI 能复用现有的账单体系、权限管理，省不少事。

### 2.2 配置 Amazon Bedrock

如果选择 AWS Bedrock，按以下步骤配置：

**第一步：在 AWS 控制台开启模型访问**

1. 登录 Amazon Bedrock 控制台
2. 左侧导航栏找到 **Model access**
3. 申请所需的 Claude 模型访问权限（如 Claude Sonnet 4）
4. 等待审批（大多数区域是秒批的）

**第二步：配置 AWS 凭证**

Claude Code 使用 AWS SDK 的默认凭证链，推荐三种配置方式：

```bash
# 方式一：AWS CLI 配置（推荐）
aws configure
# 按提示输入 Access Key ID、Secret Access Key、默认区域

# 方式二：环境变量（Access Key 方式）
export AWS_ACCESS_KEY_ID=你的AccessKeyID
export AWS_SECRET_ACCESS_KEY=你的SecretAccessKey
export AWS_REGION=us-east-1

# 方式三：环境变量（SSO Profile 方式）
export AWS_PROFILE=你的SSO配置名
export AWS_REGION=us-east-1
```

**第三步：启用 Bedrock**

```bash
# 设置环境变量启用 Bedrock
export CLAUDE_CODE_USE_BEDROCK=1
```

**第四步：模型配置（可选）**

Claude Code 在 Bedrock 上默认使用以下模型：

| 模型类型 | 默认值 |
|---------|--------|
| 主模型 | `us.anthropic.claude-3-7-sonnet-20250219-v1:0` |
| 小模型/快速模型 | `us.anthropic.claude-3-5-haiku-20241022-v1:0` |

如需自定义模型，可通过环境变量设置：

```bash
export ANTHROPIC_MODEL=us.anthropic.claude-3-7-sonnet-20250219-v1:0
export ANTHROPIC_SMALL_FAST_MODEL=us.anthropic.claude-3-5-haiku-20241022-v1:0
```

### 2.3 配置 LLM Gateway

LLM Gateway（大模型网关）是在 Claude Code 和模型提供商之间的中间层，提供以下能力：

- **统一认证**：一个入口管理所有 API Key
- **用量追踪**：按团队、项目统计使用量
- **成本控制**：设置预算上限、速率限制
- **审计日志**：记录所有模型调用，满足合规要求
- **模型路由**：动态切换模型，无需改代码

官方推荐使用 **LiteLLM** 作为 Gateway。配置方法如下：

**统一端点配置（推荐）：**

```bash
# 指向 LiteLLM 的 Anthropic 格式端点
export ANTHROPIC_BASE_URL=https://your-litellm-server.com

# 认证方式一：静态 API Key
export ANTHROPIC_AUTH_TOKEN=your-gateway-token

# 认证方式二：动态 API Key（支持轮换）
# 在 ~/.claude/settings.json 中配置
```

```json
// ~/.claude/settings.json 示例
{
  "apiKeyHelper": "/path/to/get-token.sh",
  "tokenRefreshInterval": 3600000
}
```

```bash
#!/bin/bash
# get-token.sh - 获取动态 Token 的脚本
# 可以从内部认证服务获取临时凭证
curl -s http://internal-auth-service/token
```

**关键环境变量说明：**

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_BASE_URL` | Gateway 的服务地址 |
| `ANTHROPIC_AUTH_TOKEN` | 会同时用于 `Authorization` 和 `Proxy-Authorization` 请求头 |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | 设为 `1` 跳过 Bedrock 认证（由 Gateway 处理） |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH` | 设为 `1` 跳过 Vertex AI 认证（由 Gateway 处理） |

### 2.4 配置企业代理

如果公司要求所有网络请求走代理，Claude Code 支持标准的 HTTP/HTTPS 代理环境变量：

```bash
# 基本代理配置
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# 代理需要认证时
export HTTPS_PROXY=http://username:password@proxy.company.com:8080
```

**SSL 证书问题：**

如果代理使用自签名证书，可能会遇到证书错误。解决方法是设置正确的证书包路径：

```bash
# Node.js 使用的证书包路径
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca-bundle.pem

# 或使用环境变量指定
export SSL_CERT_FILE=/path/to/corporate-ca-bundle.pem
```

**网络访问白名单：**

Claude Code 需要访问以下域名，确保在防火墙规则中放行：

| 域名 | 用途 |
|------|------|
| `api.anthropic.com` | Claude API 端点 |
| `statsig.anthropic.com` | 遥测和指标上报 |
| `sentry.io` | 错误报告 |

### 2.5 组合配置示例

官方支持灵活的组合配置：

**Bedrock + 企业代理：**

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export HTTPS_PROXY=http://proxy.company.com:8080
```

**Bedrock + LLM Gateway：**

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export ANTHROPIC_BASE_URL=https://gateway.company.com/bedrock
export ANTHROPIC_AUTH_TOKEN=your-token
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
```

**Vertex AI + 企业代理：**

```bash
export CLAUDE_CODE_USE_VERTEX=1
export HTTPS_PROXY=http://proxy.company.com:8080
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

我之前尝试在公司网络使用 Claude Code，遇到了几个坑：

1. **区域问题**：在非美国区域使用 Bedrock，部分模型不可用
2. **代理证书**：公司代理使用自签名证书，导致 Node.js 请求失败
3. **凭证优先级**：同时配置了多个认证方式，不知道哪个生效

### 3.2 我的解决方案

**问题一：用 `/status` 命令排查**

```bash
# 在 Claude Code 中运行斜杠命令
claude /status
```

这个命令会显示当前生效的认证、代理、URL 设置，非常实用。

**问题二：开启调试日志**

```bash
export ANTHROPIC_LOG=debug
```

设置后可以看到完整的请求日志，帮助定位问题。

**问题三：认证优先级**

根据官方文档，`apiKeyHelper` 的优先级低于 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_API_KEY`。如果你的配置没生效，检查是否有其他环境变量覆盖了。

### 3.3 我的建议

1. **先用 `/status` 命令**：改动配置后，第一时间用 `/status` 确认生效
2. **逐个排查**：同时配置代理 + Gateway 容易出问题，建议先单独测试每个组件
3. **检查区域**：Bedrock 不同区域模型可用性不同，遇到 "on-demand throughput isn't supported" 错误时，尝试切换区域或使用 Inference Profile

---

## 四、常见问题

**Q: 如何选择部署方案？**

A: 官方给出了选型建议：
- **直连**：最简单，适合已有 AWS/GCP 基础设施、需要原生监控合规的团队
- **企业代理**：适合已有代理要求、需要流量监控合规的团队
- **LLM Gateway**：适合需要跨团队用量追踪、动态切换模型、统一认证管理的团队

**Q: 遇到区域不可用怎么办？**

A: 运行以下命令检查模型可用性：
```bash
aws bedrock list-inference-profiles --region your-region
```
或切换到支持的区域：
```bash
export AWS_REGION=us-east-1
```

**Q: 提示 "on-demand throughput isn't supported" 怎么解决？**

A: 将模型指定为 Inference Profile ID 而不是直接的模型 ARN。

---

## 五、小结

Claude Code 的企业部署方案相当灵活：可以直连 Anthropic、走 AWS Bedrock 或 Google Vertex AI，还能配合企业代理和 LLM Gateway 使用。核心是理解自己的需求（认证、合规、成本管理），然后选择对应的组合方案。

**下一篇**：[精读官方文档：Amazon Bedrock 配置详解](/2026/03/06/amazon-bedrock/)

---

*本文精读自 [Enterprise deployment overview - Anthropic](https://docs.anthropic.com/zh-CN/docs/claude-code/third-party-integrations)*

*最后更新：2026-03-25*
