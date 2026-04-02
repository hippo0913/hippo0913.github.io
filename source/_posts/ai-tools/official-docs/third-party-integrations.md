---
title: 精读官方文档：企业部署概述
date: 2026-03-06 23:00:00
updated: 2026-03-31 14:30:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 25
description: Claude Code 支持多种企业级部署方式：Teams/Enterprise 订阅、AWS Bedrock、Google Vertex AI、Microsoft Foundry 直连，配合企业代理和 LLM Gateway。本文详解各方案选型、配置方法与排错经验。
cover: https://picsum.photos/seed/claude-enterprise-deploy/1920/1080
source_url: https://code.claude.com/docs/zh-CN/third-party-integrations
---

# 精读官方文档：企业部署概述

> hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

如果你的公司对网络安全或合规性有要求，直接让 Claude Code 连 Anthropic API 可能行不通。Claude Code 提供了四条部署路线：

1. **Teams/Enterprise 订阅**：Anthropic 官方的团队方案，开箱即用，Teams 每座 $150（Premium 档），Enterprise 在此基础上增加 SSO（单点登录）、域名捕获、基于角色的权限和托管策略
2. **云提供商直连**：通过 AWS Bedrock、Google Vertex AI 或 Microsoft Foundry 调用 Claude，复用现有的云账单和 IAM（身份与访问管理）体系
3. **企业代理**：用 `HTTPS_PROXY` 把所有流量导到公司代理服务器，满足安全审计要求
4. **LLM 网关**：在 Claude Code 和模型提供商之间加一层网关，统一管理认证、限流和日志

这四条路线不是互斥的——云提供商直连可以同时配合企业代理或 LLM 网关使用。关键是搞清楚自己的需求，选对组合。

<!-- more -->

---

## 二、官方教程精读

### 2.1 五种部署方案对比

官方推荐大多数组织直接使用 **Claude for Teams** 或 **Claude for Enterprise**。但如果你的公司已经是 AWS/GCP/Azure 重度用户，走 Bedrock/Vertex/Foundry 能省不少事。下表把五种方案拉通对比：

| 维度 | Claude for Teams | Claude for Enterprise | Anthropic Console | Amazon Bedrock | Google Vertex AI | Microsoft Foundry |
|------|---|---|---|---|---|---|
| 适合场景 | 小团队快速启动 | 大企业合规审计 | 个人开发者 | AWS 原生部署 | GCP 原生部署 | Azure 原生部署 |
| 计费方式 | $150/座(Premium) | 联系销售 | 按量付费 | AWS 按量付费 | GCP 按量付费 | Azure 按量付费 |
| 认证方式 | SSO/邮箱 | SSO/邮箱 | API Key | AWS 凭证 | GCP 凭证 | API Key/Entra ID |
| 成本追踪 | 使用仪表板 | 使用仪表板 | 使用仪表板 | AWS Cost Explorer | GCP Billing | Azure Cost Management |
| 网页版 Claude | 包含 | 包含 | 不包含 | 不包含 | 不包含 | 不包含 |
| 企业功能 | 团队管理、用量监控 | SSO、托管策略、合规 API | 无 | IAM、CloudTrail | IAM、Cloud Audit | RBAC、Azure Monitor |

选型的核心逻辑：**有云基础设施的走云提供商，没有的走 Teams/Enterprise**。如果你需要 SSO、托管权限这类 Enterprise 独有功能，那 Enterprise 是唯一选择——Bedrock 和 Vertex AI 目前不提供这些。

### 2.2 企业代理与 LLM 网关配置

企业代理和 LLM 网关是两个不同层面的中间层：

- **企业代理**（`HTTPS_PROXY`）：在网络层路由流量，所有出站请求都经过代理服务器。用于安全监控、合规审计、网络策略执行
- **LLM 网关**（`ANTHROPIC_*_BASE_URL`）：在应用层做认证和路由，Claude Code 把请求发到网关，网关再转发给模型提供商。用于集中用量追踪、自定义限流、统一认证管理

二者可以组合使用——流量先过企业代理，再过 LLM 网关。

**Bedrock 配置示例：**

```bash
# 方案一：Bedrock + 企业代理
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
export HTTPS_PROXY='https://proxy.example.com:8080'

# 方案二：Bedrock + LLM 网关
export CLAUDE_CODE_USE_BEDROCK=1
export ANTHROPIC_BEDROCK_BASE_URL='https://your-llm-gateway.com/bedrock'
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1  # 网关处理认证时跳过本地 AWS 认证
```

**Vertex AI 配置示例：**

```bash
# Vertex AI + 企业代理
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5
export ANTHROPIC_VERTEX_PROJECT_ID=your-project-id
export HTTPS_PROXY='https://proxy.example.com:8080'
```

**Foundry 配置示例：**

```bash
# Foundry + 企业代理
export CLAUDE_CODE_USE_FOUNDRY=1
export ANTHROPIC_FOUNDRY_RESOURCE=your-resource
export ANTHROPIC_FOUNDRY_API_KEY=your-api-key  # 或省略改用 Entra ID
export HTTPS_PROXY='https://proxy.example.com:8080'
```

注意 `CLAUDE_CODE_SKIP_*_AUTH` 这组变量只在 LLM 网关场景下使用——当网关负责处理云提供商的认证时，设置它让 Claude Code 跳过本地认证步骤。

**环境变量速查表：**

| 变量名 | 说明 | 适用场景 |
|------|------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 设为 `1` 启用 Bedrock | AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 设为 `1` 启用 Vertex AI | Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | 设为 `1` 启用 Foundry | Azure Foundry |
| `HTTPS_PROXY` | 企业 HTTP/HTTPS 代理地址 | 所有方案通用 |
| `ANTHROPIC_BEDROCK_BASE_URL` | Bedrock LLM 网关地址 | Bedrock + Gateway |
| `ANTHROPIC_VERTEX_BASE_URL` | Vertex AI LLM 网关地址 | Vertex + Gateway |
| `ANTHROPIC_FOUNDRY_BASE_URL` | Foundry LLM 网关地址 | Foundry + Gateway |
| `ANTHROPIC_FOUNDRY_RESOURCE` | Azure Foundry 资源名 | Foundry 必填 |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry API 密钥（可省略改用 Entra ID） | Foundry |
| `CLAUDE_CODE_SKIP_*_AUTH` | 跳过云提供商认证 | Gateway 场景 |
| `ANTHROPIC_DEFAULT_*_MODEL` | 固定 Opus/Sonnet/Haiku 模型版本 ID | 云提供商部署 |
| `AWS_REGION` | AWS 区域 | Bedrock 必填 |
| `CLOUD_ML_REGION` | GCP 区域 | Vertex 必填 |
| `ANTHROPIC_VERTEX_PROJECT_ID` | GCP 项目 ID | Vertex 必填 |

### 2.3 模型版本固定与安全策略

通过 Bedrock/Vertex/Foundry 部署时，**强烈建议固定模型版本**。不固定的话，Claude Code 的模型别名（如 `sonnet`）会解析为最新版本——当 Anthropic 发布新模型但你的云账户还没启用时，会直接报错。

```bash
# 固定模型版本（防止新模型发布导致问题）
export ANTHROPIC_DEFAULT_OPUS_MODEL=your-opus-model-id
export ANTHROPIC_DEFAULT_SONNET_MODEL=your-sonnet-model-id
export ANTHROPIC_DEFAULT_HAIKU_MODEL=your-haiku-model-id
```

这些值应该填云提供商的模型 ID（Bedrock 用 Inference Profile ARN，Vertex 用模型端点 ID），而不是 Anthropic API 的模型名。

**Enterprise 托管权限（Managed Permissions）** 是 Enterprise 计划的独有功能。安全团队可以在管理后台定义 Claude Code 允许和不允许做的事情——比如禁止执行特定命令、限制文件访问范围——这些规则下发后，本地配置无法覆盖。如果你的公司有严格的安全审计要求，这个功能非常关键。

**MCP 集成建议**：官方推荐由中央团队统一配置 MCP（Model Context Protocol，一种让 AI 连接外部工具的标准协议）服务器，把 `.mcp.json` 检入代码库，这样团队成员 clone 仓库后就能直接使用，不需要各自配置。

---

## 三、hippo 的实战经验

> hippo：以下是我实际使用中的踩坑经验：

### 3.1 公司网络下的代理证书问题

我之前在公司网络环境下使用 Claude Code + Bedrock，遇到了 Node.js 报 SSL 证书错误。原因是公司代理使用自签名 CA 证书，Node.js 默认不信任。

解决方案是设置企业 CA 证书包路径：

```bash
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca-bundle.pem
```

这个变量要加到 `.bashrc` 或 `.zshrc` 里持久化，否则每次开终端都要重新 export。

### 3.2 Bedrock 区域模型不可用

在非美国区域使用 Bedrock 时，某些模型可能没有开通。排查步骤：

1. 先在 Claude Code 里运行 `/status`，查看当前生效的认证、代理、URL 配置
2. 开启调试日志看完整请求：`export ANTHROPIC_LOG=debug`
3. 检查目标区域是否有该模型的推理配置文件：`aws bedrock list-inference-profiles --region your-region`
4. 如果没有，切换到支持的区域（通常 `us-east-1` 或 `us-west-2` 可用性最好）

### 3.3 部署选型决策

选型其实就三个问题：

- **有没有云基础设施？** 有 AWS/GCP/Azure 就走对应的 Bedrock/Vertex/Foundry，复用现有账单和 IAM，省去额外的审批流程
- **需不需要企业代理？** 公司要求所有出站流量过代理的，加 `HTTPS_PROXY`；没这个要求的别多此一举
- **要不要集中管理？** 多团队共用、需要统一限流和用量追踪的，上 LLM 网关；小团队没必要

---

## 四、常见问题

**Q: 如何选择部署方案？**

A: 按团队规模和合规需求分层：
- 5 人以下小团队 → Claude for Teams，开箱即用
- 有 SSO/合规要求的中大型组织 → Claude for Enterprise
- 已有 AWS/GCP/Azure 基础设施 → 走对应云提供商，复用 IAM 和成本管理
- 需要集中用量追踪和限流 → 在云提供商基础上加 LLM 网关

**Q: 遇到 "on-demand throughput isn't supported" 怎么办？**

A: Bedrock 的 on-demand 模式不是所有区域和模型都支持。两个解决方法：
- 用 Inference Profile ID 替代直接的模型 ARN
- 切换到支持 on-demand 的区域（如 `us-east-1`）

**Q: 网络白名单需要放行哪些域名？**

如果你的公司在网络出口有白名单策略，Claude Code 需要访问以下域名：

| 域名 | 用途 |
|------|------|
| `api.anthropic.com` | Claude API 端点（直连场景） |
| `statsig.anthropic.com` | 遥测和功能开关上报 |
| `sentry.io` | 错误报告 |

如果走 Bedrock/Vertex/Foundry，还需要放行对应云提供商的 API 域名。

---

## 五、小结

Claude Code 的企业部署方案本质上是三种能力的组合：**模型来源**（Teams/Enterprise/Bedrock/Vertex/Foundry）、**网络层**（直连/企业代理）、**应用层**（直连/LLM 网关）。理解了自己在认证、合规、成本管理上的需求，选型就是排列组合的事。

别忘了固定模型版本——这是云提供商部署最容易踩的坑。

**下一篇**：[精读官方文档：Amazon Bedrock 配置详解](/2026/03/06/amazon-bedrock/)

---

*本文精读自 [企业部署概览 - Claude Code Docs](https://code.claude.com/docs/zh-CN/third-party-integrations)*

*最后更新：2026-03-31*
