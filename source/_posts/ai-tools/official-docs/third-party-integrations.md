---
title: 精读官方文档：企业部署概述
date: 2026-03-06 23:00:00
updated: 2026-03-27 14:30:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 25
description: Claude Code 支持多种企业级部署方式：直连 Anthropic API、通过 AWS Bedrock、Google Vertex AI 或 Microsoft Foundry 调用，配合企业代理和 LLM Gateway。本文详解各方案的配置方法和选型建议。
cover: https://picsum.photos/seed/claude-enterprise-deploy/1920/1080
source_url: https://code.claude.com/docs/zh-CN/third-party-integrations
---

# 精读官方文档：企业部署概述

> hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

如果你的公司对网络安全、合规性有严格要求，直接让 Claude Code 连接 Anthropic API 可能行不通。好消息是，Claude Code 支持多种企业级部署方案：

1. **Claude for Teams/Enterprise**：Anthropic 官方的团队订阅方案
2. **云服务商直连**：通过 AWS Bedrock、Google Vertex AI 或 Microsoft Foundry 调用 Claude 模型
3. **企业代理**：让所有流量走公司统一的代理服务器
4. **LLM Gateway**：在 Claude Code 和模型提供商之间加一层网关，统一管理认证、计费、日志

这篇文章帮你搞清楚：有哪些选择、各有什么优缺点、具体怎么配置。

<!-- more -->

---

## 二、官方教程精读

### 2.1 部署选项对比

官方推荐大多数组织使用 **Claude for Teams** 或 **Claude for Enterprise**，团队成员可以通过单一订阅访问 Claude Code 和网页版 Claude，具有集中计费和无需基础设施设置的优势。

| 功能 | Claude for Teams/Enterprise | Anthropic Console | Amazon Bedrock | Google Vertex AI | Microsoft Foundry |
|------|---------------------------|-------------------|----------------|------------------|-------------------|
| 最适合 | 大多数组织（推荐） | 个人开发者 | AWS 原生部署 | GCP 原生部署 | Azure 原生部署 |
| 计费 | Teams: $150/座位(Premium)；Enterprise: 联系销售 | 按使用量付费 | 通过 AWS 按使用量付费 | 通过 GCP 按使用量付费 | 通过 Azure 按使用量付费 |
| 地区 | 支持的国家/地区 | 支持的国家/地区 | 多个 AWS 区域 | 多个 GCP 区域 | 多个 Azure 区域 |
| Prompt 缓存 | 默认启用 | 默认启用 | 默认启用 | 默认启用 | 默认启用 |
| 身份验证 | Claude.ai SSO 或电子邮件 | API 密钥 | API 密钥或 AWS 凭证 | GCP 凭证 | API 密钥或 Microsoft Entra ID |
| 成本跟踪 | 使用情况仪表板 | 使用情况仪表板 | AWS Cost Explorer | GCP Billing | Azure Cost Management |
| 包括网页版 Claude | 是 | 否 | 否 | 否 | 否 |
| 企业功能 | 团队管理、SSO、使用情况监控 | 无 | IAM 策略、CloudTrail | IAM 角色、Cloud Audit Logs | RBAC 策略、Azure Monitor |

> hippo：如果你的公司已经是 AWS、GCP 或 Azure 的重度用户，走 Bedrock、Vertex AI 或 Foundry 能复用现有的账单体系、权限管理，省不少事。

### 2.2 配置代理和网关

大多数组织可以直接使用云提供商，无需额外配置。但如果你的组织有特定的网络或管理要求，可能需要配置企业代理或 LLM 网关：

- **企业代理**：通过 HTTP/HTTPS 代理路由流量。如果组织要求所有出站流量通过代理服务器以进行安全监控、合规性或网络策略执行，使用 `HTTPS_PROXY` 或 `HTTP_PROXY` 环境变量配置
- **LLM 网关**：位于 Claude Code 和云提供商之间的服务，用于处理身份验证和路由。如果需要跨团队的集中使用情况跟踪、自定义速率限制或预算、集中身份验证管理，使用 `ANTHROPIC_BASE_URL`、`ANTHROPIC_BEDROCK_BASE_URL` 或 `ANTHROPIC_VERTEX_BASE_URL` 环境变量配置

### 2.3 Amazon Bedrock 配置

**企业代理配置：**

```bash
# 启用 Bedrock
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1

# 配置企业代理
export HTTPS_PROXY='https://proxy.example.com:8080'
```

**LLM 网关配置：**

```bash
# 启用 Bedrock
export CLAUDE_CODE_USE_BEDROCK=1

# 配置 LLM 网关
export ANTHROPIC_BEDROCK_BASE_URL='https://your-llm-gateway.com/bedrock'
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1  # 如果网关处理 AWS 身份验证
```

### 2.4 Microsoft Foundry 配置

**企业代理配置：**

```bash
# 启用 Microsoft Foundry
export CLAUDE_CODE_USE_FOUNDRY=1
export ANTHROPIC_FOUNDRY_RESOURCE=your-resource
export ANTHROPIC_FOUNDRY_API_KEY=your-api-key  # 或省略以使用 Entra ID 身份验证

# 配置企业代理
export HTTPS_PROXY='https://proxy.example.com:8080'
```

**LLM 网关配置：**

```bash
# 启用 Microsoft Foundry
export CLAUDE_CODE_USE_FOUNDRY=1

# 配置 LLM 网关
export ANTHROPIC_FOUNDRY_BASE_URL='https://your-llm-gateway.com'
export CLAUDE_CODE_SKIP_FOUNDRY_AUTH=1  # 如果网关处理 Azure 身份验证
```

### 2.5 Google Vertex AI 配置

**企业代理配置：**

```bash
# 启用 Vertex
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5
export ANTHROPIC_VERTEX_PROJECT_ID=your-project-id

# 配置企业代理
export HTTPS_PROXY='https://proxy.example.com:8080'
```

**LLM 网关配置：**

```bash
# 启用 Vertex
export CLAUDE_CODE_USE_VERTEX=1

# 配置 LLM 网关
export ANTHROPIC_VERTEX_BASE_URL='https://your-llm-gateway.com/vertex'
export CLAUDE_CODE_SKIP_VERTEX_AUTH=1  # 如果网关处理 GCP 身份验证
```

### 2.6 环境变量汇总

| 变量名 | 说明 | 适用场景 |
|--------|------|---------|
| `CLAUDE_CODE_USE_BEDROCK` | 设为 `1` 启用 Bedrock | AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 设为 `1` 启用 Vertex AI | Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | 设为 `1` 启用 Microsoft Foundry | Azure Foundry |
| `HTTPS_PROXY` | 企业代理地址 | 所有方案 |
| `ANTHROPIC_BEDROCK_BASE_URL` | Bedrock 的 LLM 网关地址 | Bedrock + Gateway |
| `ANTHROPIC_VERTEX_BASE_URL` | Vertex AI 的 LLM 网关地址 | Vertex + Gateway |
| `ANTHROPIC_FOUNDRY_BASE_URL` | Foundry 的 LLM 网关地址 | Foundry + Gateway |
| `CLAUDE_CODE_SKIP_*_AUTH` | 跳过云提供商认证（由 Gateway 处理） | Gateway 场景 |

---

## 三、组织的最佳实践

### 3.1 投资文档和内存

官方强烈建议投资文档，以便 Claude Code 理解你的代码库。组织可以在多个级别部署 CLAUDE.md 文件：

- **组织范围**：部署到系统目录，如 `/Library/Application Support/ClaudeCode/CLAUDE.md`（macOS），用于公司范围的标准
- **存储库级别**：在存储库根目录中创建 `CLAUDE.md` 文件，包含项目架构、构建命令和贡献指南。将这些检入源代码控制，以便所有用户受益

### 3.2 简化部署

如果你有自定义开发环境，创建一种"一键"安装 Claude Code 的方式是在组织中增加采用率的关键。可以制作安装脚本或 Dev Container 配置，让新成员快速上手。

### 3.3 从引导式使用开始

鼓励新用户尝试使用 Claude Code 进行代码库问答，或在较小的错误修复或功能请求上使用。要求 Claude Code 制定计划，检查 Claude 的建议，如果偏离轨道则提供反馈。随着时间的推移，当用户更好地理解这种新范式时，他们将更有效地让 Claude Code 更自主地运行。

### 3.4 为云提供商固定模型版本

如果通过 Bedrock、Vertex AI 或 Foundry 部署，使用以下环境变量固定特定模型版本：

```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL=your-opus-model-id
export ANTHROPIC_DEFAULT_SONNET_MODEL=your-sonnet-model-id
export ANTHROPIC_DEFAULT_HAIKU_MODEL=your-haiku-model-id
```

如果不固定，Claude Code 别名会解析为最新版本，当 Anthropic 发布你的账户中尚未启用的新模型时，可能会破坏用户体验。

### 3.5 配置安全策略

安全团队可以配置**托管权限**，定义 Claude Code 允许和不允许做什么，这不能被本地配置覆盖。这是 Enterprise 计划的核心功能之一。

### 3.6 利用 MCP 进行集成

MCP（Model Context Protocol）是为 Claude Code 提供更多信息的好方法，例如连接到票证管理系统或错误日志。官方建议一个中央团队配置 MCP servers 并将 `.mcp.json` 配置检入代码库，以便所有用户受益。

---

## 四、hippo 的实战经验

> hippo：以下是我实际使用中的踩坑经验：

### 4.1 我遇到的问题

我之前尝试在公司网络使用 Claude Code，遇到了几个坑：

1. **区域问题**：在非美国区域使用 Bedrock，部分模型不可用
2. **代理证书**：公司代理使用自签名证书，导致 Node.js 请求失败
3. **凭证优先级**：同时配置了多个认证方式，不知道哪个生效

### 4.2 我的解决方案

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

**问题三：SSL 证书问题**

如果代理使用自签名证书，设置正确的证书包路径：

```bash
# Node.js 使用的证书包路径
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca-bundle.pem
```

### 4.3 区域与模型可用性排查

遇到区域不可用时，运行以下命令检查：

```bash
# Bedrock: 检查推理配置文件
aws bedrock list-inference-profiles --region your-region

# Bedrock: 切换到支持的区域
export AWS_REGION=us-east-1

# Vertex AI: 检查区域配置
gcloud ai models list --region=us-central1
```

---

## 五、常见问题

**Q: 如何选择部署方案？**

A: 官方推荐：
- **Claude for Teams**：最适合需要快速启动的小型团队
- **Claude for Enterprise**：最适合具有安全和合规性要求的大型组织
- **Bedrock/Vertex/Foundry**：适合已有 AWS/GCP/Azure 基础设施、需要原生监控合规的团队

**Q: 遇到 "on-demand throughput isn't supported" 怎么办？**

A: 将模型指定为 Inference Profile ID 而不是直接的模型 ARN，或切换到支持的区域。

**Q: 如何配置网络访问白名单？**

Claude Code 需要访问以下域名：

| 域名 | 用途 |
|------|------|
| `api.anthropic.com` | Claude API 端点 |
| `statsig.anthropic.com` | 遥测和指标上报 |
| `sentry.io` | 错误报告 |

---

## 六、小结

Claude Code 的企业部署方案相当灵活：可以使用官方的 Teams/Enterprise 计划，也可以直连 Anthropic API、走 AWS Bedrock、Google Vertex AI 或 Microsoft Foundry，还能配合企业代理和 LLM Gateway 使用。核心是理解自己的需求（认证、合规、成本管理），然后选择对应的组合方案。

官方特别强调：在 Anthropic，他们信任 Claude Code 在每个代码库中推动开发。希望你也能享受使用 Claude Code。

**下一篇**：[精读官方文档：Amazon Bedrock 配置详解](/2026/03/06/amazon-bedrock/)

---

*本文精读自 [企业部署概览 - Claude Code Docs](https://code.claude.com/docs/zh-CN/third-party-integrations)*

*最后更新：2026-03-27*
