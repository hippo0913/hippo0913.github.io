---
title: 精读官方文档：企业部署概述
date: 2026-03-12 25:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 25
description: 精读 Claude Code 企业部署文档，了解如何将 Claude Code 集成到企业环境中，包括多云提供商、企业代理、LLM 网关等多种部署方案。
cover: https://picsum.photos/seed/claude-integrations/1920/1080
source_url: https://code.claude.com/docs/zh-CN/third-party-integrations
---

# 精读官方文档：企业部署概述

> 💬 hippo：这是《Claude Code 官方文档精读》系列的第二十五篇。如果你的公司要规模部署 Claude Code，这篇文档是必读的——它讲的是如何把个人工具变成企业级解决方案。

---

## 开篇：企业部署不是简单复制粘贴

个人用 Claude Code 很简单：安装、登录、开始用。

但企业级部署完全不同，你需要考虑：
- 如何在公司防火墙内使用？
- 如何统一管理多个团队的访问？
- 如何追踪成本和使用情况？
- 如何确保符合企业安全合规要求？

**这篇文档的价值**：
- 了解四种主流云提供商的集成方式（Anthropic、AWS、GCP、Azure）
- 掌握企业代理和 LLM 网关的配置方法
- 学习官方推荐的企业部署最佳实践

> 💬 hippo：用通俗的话说——个人用就像买台电脑，企业用就像建个机房。
> 个人只管自己怎么用，企业要管所有人怎么用、怎么计费、怎么安全。

<!-- more -->

---

## 核心概念：用大白话讲清楚

### 1. 四种云提供商对比

| 特性 | Anthropic | Amazon Bedrock | Google Vertex AI | Microsoft Foundry |
|------|-----------|----------------|------------------|-------------------|
| **区域** | 支持的国家 | 多个 AWS 区域 | 多个 GCP 区域 | 多个 Azure 区域 |
| **提示缓存** | 默认启用 | 默认启用 | 默认启用 | 默认启用 |
| **身份验证** | API 密钥 | API 密钥或 AWS 凭证 | GCP 凭证 | API 密钥或 Microsoft Entra ID |
| **成本跟踪** | 仪表板 | AWS Cost Explorer | GCP Billing | Azure Cost Management |
| **企业功能** | 团队、使用监控 | IAM 策略、CloudTrail | IAM 角色、Cloud Audit Logs | RBAC 策略、Azure Monitor |

> 💬 hippo：选择哪个提供商？
> - 已有 AWS 基础设施 → Bedrock（无缝集成）
> - 已有 GCP 基础设施 → Vertex AI（统一账单）
> - 已有 Azure 基础设施 → Foundry（集成 AD）
> - 都没有或需要最快接入 → Anthropic（最简单）

### 2. 三种企业部署模式

**直接提供商访问**
- 最简单的配置
- 直接连接到云提供商
- 适合小型团队或个人项目

**企业代理（Enterprise Proxy）**
- 通过公司 HTTP/HTTPS 代理路由流量
- 适合有严格网络管控的企业
- 所有 AI 请求都经过统一的网络路径

**LLM 网关（LLM Gateway）**
- 统一的 API 管理层
- 可以跨多个提供商动态切换
- 支持自定义速率限制、预算控制
- 适合大型企业，需要统一管理

> 💬 hippo：想象一下——
> - 直接访问就像你自己开车去上班
> - 企业代理就像公司安排班车统一接送
> - LLM 网关就像有个专门的车队调度系统

### 3. 关键环境变量

| 变量 | 用途 |
|------|------|
| `CLAUDE_CODE_USE_BEDROCK` | 启用 Amazon Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 启用 Google Vertex AI |
| `CLAUDE_CODE_USE_FOUNDRY` | 启用 Microsoft Foundry |
| `HTTPS_PROXY` | 配置企业代理 |
| `ANTHROPIC_BEDROCK_BASE_URL` | Bedrock 网关地址 |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH` | 跳过 Bedrock 认证（网关处理） |
| `ANTHROPIC_LOG=debug` | 启用调试日志 |

> 💬 hippo：`SKIP_AUTH` 系列变量很关键。
> 当你用 LLM 网关时，网关已经处理了认证，就不需要 Claude Code 再做一次了。

---

## 实战指南：手把手教你用

### 场景 1：AWS 原生部署（Bedrock）

**问题背景**：
你的公司主要使用 AWS 基础设施，希望 Claude Code 通过 Amazon Bedrock 访问 Claude 模型，实现统一的成本管理和安全控制。

**解决步骤**：

1. **启用 Bedrock**
   ```bash
   export CLAUDE_CODE_USE_BEDROCK=1
   export AWS_REGION=us-east-1
   ```

2. **配置 AWS 凭证**
   ```bash
   # 方式 1：使用现有的 AWS CLI 凭证
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key

   # 方式 2：使用 IAM 角色（推荐）
   # 配置 ~/.aws/config
   # [profile claude-code]
   # role_arn = arn:aws:iam::123456789012:role/ClaudeCodeRole
   # source_profile = default
   export AWS_PROFILE=claude-code
   ```

3. **验证配置**
   ```bash
   claude /status
   # 应该显示 "Bedrock: Enabled"
   ```

> 💬 hippo：推荐使用 IAM 角色而不是长期凭证。
> AWS IAM 角色可以临时获取权限，更安全。

**预期效果**：
- 所有 Claude Code 请求通过 AWS Bedrock
- 成本和用量在 AWS Cost Explorer 中可见
- 可以通过 IAM 策略精细控制访问权限

### 场景 2：通过企业代理部署（适用于有网络管控的公司）

**问题背景**：
你的公司有严格的网络安全策略，所有出站流量必须经过公司代理服务器。需要让 Claude Code 通过代理访问。

**解决步骤**：

1. **配置代理环境变量**
   ```bash
   export HTTPS_PROXY='https://proxy.company.com:8080'
   export HTTP_PROXY='http://proxy.company.com:8080'
   export NO_PROXY='localhost,127.0.0.1,.company.com'
   ```

2. **选择云提供商**
   ```bash
   # 以 AWS Bedrock 为例
   export CLAUDE_CODE_USE_BEDROCK=1
   export AWS_REGION=us-east-1
   ```

3. **测试连接**
   ```bash
   # 启用调试日志
   export ANTHROPIC_LOG=debug

   # 启动 Claude Code
   claude

   # 检查日志中是否有代理连接信息
   ```

> 💬 hippo：`NO_PROXY` 很重要！
> 如果不设置本地地址排除，Claude Code 可能尝试通过代理连接本地服务，导致失败。

**预期效果**：
- 所有 AI 请求通过公司代理
- 安全团队可以监控和审计 AI 流量
- 符合企业网络安全策略

### 场景 3：通过 LLM 网关部署（大型企业统一管理）

**问题背景**：
你的公司有多个团队使用不同的 AI 模型（Claude、GPT 等），需要通过统一的网关进行管理、计费和权限控制。

**解决步骤**：

1. **配置 LLM 网关**
   ```bash
   # 以 Bedrock 为例
   export CLAUDE_CODE_USE_BEDROCK=1

   # 指定网关地址
   export ANTHROPIC_BEDROCK_BASE_URL='https://llm-gateway.company.com/bedrock'

   # 跳过原生认证（网关会处理）
   export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
   ```

2. **在网关中配置 API 密钥或令牌**
   ```bash
   # 网关通常需要额外的认证头
   export ANTHROPIC_AUTH_TOKEN='your-gateway-api-key'
   ```

3. **验证网关连接**
   ```bash
   export ANTHROPIC_LOG=debug
   claude /status

   # 日志应该显示请求发送到网关地址
   ```

> 💬 hippo：LLM 网关是大型企业的"AI 控制台"。
> 它可以：
> - 在不同模型间切换（省钱）
> - 统一设置速率限制（防滥用）
> - 集中管理 API 密钥（更安全）
> - 按部门/项目计费（透明化）

**预期效果**：
- 所有团队的 AI 请求统一经过网关
- 可以动态切换模型（比如开发用便宜的模型，生产用高性能模型）
- 统一的计费和使用报告

### 场景 4：GCP 原生部署（Vertex AI）

**问题背景**：
你的公司使用 Google Cloud Platform，希望通过 Vertex AI 集成 Claude Code。

**解决步骤**：

1. **启用 Vertex AI**
   ```bash
   export CLAUDE_CODE_USE_VERTEX=1
   export CLOUD_ML_REGION=us-central1
   export ANTHROPIC_VERTEX_PROJECT_ID=your-project-id
   ```

2. **配置 GCP 认证**
   ```bash
   # 方式 1：使用服务账号密钥
   export GOOGLE_APPLICATION_CREDENTIALS='/path/to/service-account-key.json'

   # 方式 2：使用 gcloud 认证（推荐）
   gcloud auth application-default login
   ```

3. **验证配置**
   ```bash
   claude /status
   # 应该显示 "Vertex AI: Enabled"
   ```

> 💬 hippo：Vertex AI 的优势是能和 GCP 其他服务集成。
> 比如 BigQuery、Cloud Storage 等，可以在一个会话中调用。

**预期效果**：
- 成本和用量在 GCP Billing 中统一管理
- 可以通过 Cloud Audit Logs 审计 AI 使用
- 支持 IAM 角色精细权限控制

### 场景 5：Azure 原生部署（Microsoft Foundry）

**问题背景**：
你的公司使用 Microsoft Azure，希望通过 Azure Foundry 集成 Claude Code。

**解决步骤**：

1. **启用 Foundry**
   ```bash
   export CLAUDE_CODE_USE_FOUNDRY=1
   export ANTHROPIC_FOUNDRY_RESOURCE=your-resource-name
   ```

2. **配置认证**
   ```bash
   # 方式 1：使用 API 密钥
   export ANTHROPIC_FOUNDRY_API_KEY=your-api-key

   # 方式 2：使用 Microsoft Entra ID（推荐）
   # 不设置 API 密钥，Claude Code 会自动使用 Azure CLI 认证
   az login
   ```

3. **验证配置**
   ```bash
   claude /status
   # 应该显示 "Foundry: Enabled"
   ```

> 💬 hippo：如果公司已有 Azure AD，推荐用 Entra ID 认证。
> 这样可以复用现有的用户管理，不需要额外维护 API 密钥。

**预期效果**：
- 与 Azure AD 集成，统一用户管理
- 成本和用量在 Azure Cost Management 中可见
- 支持 RBAC 策略精细权限控制

---

## hippo 的踩坑实录

### 坑点 1：企业代理导致连接超时

**表现**：
配置了企业代理后，Claude Code 启动很慢，或者请求超时。

**原因**：
- 代理服务器不稳定或响应慢
- 代理需要额外的认证步骤
- `NO_PROXY` 配置不当，本地请求也被路由到代理

**解决**：
```bash
# 1. 测试代理连通性
curl -x https://proxy.company.com:8080 https://api.anthropic.com/v1/messages

# 2. 检查 NO_PROXY 设置
echo $NO_PROXY
# 应该包含: localhost,127.0.0.1

# 3. 如果代理需要认证，设置认证信息
export HTTPS_PROXY='https://username:password@proxy.company.com:8080'
```

> 💬 hippo：这个问题我踩过，原因是公司的代理有时候会挂。
> 最终的解决方案是：配置备用代理地址，当主代理不可用时自动切换。

### 坑点 2：LLM 网关认证失败

**表现**：
配置了 LLM 网关后，所有请求都返回 401 或 403 错误。

**原因**：
- 忘记设置 `CLAUDE_CODE_SKIP_*_AUTH`
- 网关的 API 密钥配置错误
- 认证头格式不匹配

**解决**：
```bash
# 1. 确认跳过原生认证
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
export CLAUDE_CODE_SKIP_VERTEX_AUTH=1
export CLAUDE_CODE_SKIP_FOUNDRY_AUTH=1

# 2. 设置网关认证令牌
export ANTHROPIC_AUTH_TOKEN='your-gateway-token'

# 3. 启用调试日志查看详细错误
export ANTHROPIC_LOG=debug
claude
```

> 💬 hippo：关键是要理解"双重认证"的概念。
> 网关和云提供商都有认证，如果都启用就会冲突。
> 用网关时，跳过提供商认证，只保留网关认证。

### 坑点 3：区域配置错误

**表现**：
配置了 Bedrock 或 Vertex AI 后，启动 Claude Code 时提示"区域不支持"或"找不到模型"。

**原因**：
- 选择了不支持的 AWS 或 GCP 区域
- 区域名称拼写错误

**解决**：
```bash
# AWS Bedrock 支持的区域（示例）
# us-east-1, us-west-2, eu-west-1, ap-southeast-1 等
export AWS_REGION=us-east-1

# Google Vertex AI 支持的区域
# us-central1, us-east1, europe-west1, asia-southeast1 等
export CLOUD_ML_REGION=us-central1

# Microsoft Foundry 支持的区域
# eastus, westus2, westeurope, southeastasia 等
export ANTHROPIC_FOUNDRY_RESOURCE='your-resource'

# 验证配置
claude /status
```

> 💬 hippo：不同云提供商的区域命名规则不同。
> AWS 用 `region-name`，GCP 用 `region-number`，Azure 用 `regionname`。
> 建议先去官方文档确认当前支持的完整区域列表。

### 坑点 4：环境变量在 Shell 会话间丢失

**表现**：
在一个终端窗口配置好的环境变量，换一个终端就失效了。

**原因**：
环境变量只在当前 Shell 会话中有效，关闭终端后就会丢失。

**解决**：
```bash
# 方法 1：写入 Shell 配置文件
echo 'export CLAUDE_CODE_USE_BEDROCK=1' >> ~/.zshrc
echo 'export AWS_REGION=us-east-1' >> ~/.zshrc
echo 'export HTTPS_PROXY=https://proxy.company.com:8080' >> ~/.zshrc
source ~/.zshrc

# 方法 2：创建专门的配置脚本
cat > ~/.claude-code-env.sh << 'EOF'
#!/bin/bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
export HTTPS_PROXY=https://proxy.company.com:8080
EOF

# 使用时 source
source ~/.claude-code-env.sh

# 方法 3：使用direnv（推荐，项目级别）
# 在项目根目录创建 .envrc
echo 'export CLAUDE_CODE_USE_BEDROCK=1' > .envrc
echo 'export AWS_REGION=us-east-1' >> .envrc
direnv allow
```

> 💬 hippo：推荐方法 3（direnv）。
> 进入项目目录时自动加载配置，离开时自动卸载，非常方便。

---

## 最佳实践总结

### 企业部署的关键原则

1. **从小规模试点开始**
   - 不要一开始就全公司推广
   - 选择一个技术团队试点
   - 收集反馈后再扩大规模

2. **统一配置管理**
   - 使用配置管理工具（Ansible、Chef、Puppet）
   - 避免手动配置每个开发环境
   - 版本控制所有配置文件

3. **监控和审计**
   - 配置使用情况监控
   - 定期审查访问权限
   - 设置成本告警

4. **文档和培训**
   - 编写企业级使用指南
   - 提供新员工培训
   - 建立内部支持渠道

### CLAUDE.md 的多级部署

官方推荐在多个级别部署 CLAUDE.md：

```bash
# 1. 组织级别（公司标准）
# 路径：/Library/Application Support/ClaudeCode/CLAUDE.md (macOS)
# 内容：公司通用的编码规范、安全策略等

# 2. 项目级别（团队标准）
# 路径：项目根目录/CLAUDE.md
# 内容：项目架构、构建命令、测试规范
# 这个文件应该提交到版本控制

# 3. 个人级别（个人偏好）
# 路径：~/.claude.md
# 内容：个人习惯、快捷别名等
```

> 💬 hippo：CLAUDE.md 的多级部署就像企业的规章制度。
> - 公司级别：全员遵守的通用规范
> - 部门级别：特定的业务规范
> - 个人级别：个人的工作习惯

### MCP 的集中管理

对于企业环境，建议由中央团队配置 MCP 服务器：

```json
// .mcp.json（项目级配置）
{
  "mcpServers": {
    "jira": {
      "type": "http",
      "url": "https://mcp.company.com/jira"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.company.com/sentry"
    },
    "internal-db": {
      "command": "/opt/mcp-servers/db-server",
      "args": ["--config", "${DB_CONFIG}"],
      "env": {
        "DB_URL": "${INTERNAL_DB_URL}"
      }
    }
  }
}
```

**提交到版本控制**：
```bash
git add .mcp.json
git commit -m "chore: add project MCP configuration"
git push
```

> 💬 hippo：这样所有团队成员拉取代码后，自动获得相同的 MCP 工具配置。
> 敏感值（如 DB_URL）通过环境变量提供，避免硬编码。

---

## 常见问题解答

**Q: 如何在多个云提供商之间切换？**

A: 通过环境变量动态切换：
```bash
# 今天用 AWS
export CLAUDE_CODE_USE_BEDROCK=1

# 明天用 GCP
unset CLAUDE_CODE_USE_BEDROCK
export CLAUDE_CODE_USE_VERTEX=1

# 后天用 Azure
unset CLAUDE_CODE_USE_VERTEX
export CLAUDE_CODE_USE_FOUNDRY=1
```

**Q: 企业代理和 LLM 网关可以同时使用吗？**

A: 可以，配置链路是：Claude Code → 代理 → LLM 网关 → 云提供商
```bash
export HTTPS_PROXY='https://proxy.company.com:8080'
export ANTHROPIC_BEDROCK_BASE_URL='https://llm-gateway.company.com/bedrock'
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
```

**Q: 如何追踪每个团队的使用成本？**

A: 有几种方法：
1. 使用不同的 API 密钥或账号
2. 在 LLM 网关中设置按项目/团队计费
3. 使用云提供商的成本标签（AWS tags、GCP labels）

**Q: 如何设置速率限制防止超支？**

A: 在 LLM 网关中配置：
- 每个用户的请求频率限制
- 每个项目的成本预算限制
- 超限时自动降级或阻止

**Q: 可以离线部署 Claude Code 吗？**

A: Claude Code 需要联网调用 AI API，不能完全离线。但可以通过：
- 配置内网 LLM 网关
- 使用自托管的兼容模型服务
- 在内网环境中管理和配置

**Q: 如何确保数据安全和企业合规？**

A: 建议措施：
- 使用企业级云提供商（Bedrock、Vertex AI、Foundry）
- 配置数据驻留策略（选择正确的区域）
- 启用日志审计（CloudTrail、Audit Logs）
- 定期安全审查和渗透测试

---

## 调试技巧

### 使用 /status 命令

```bash
claude /status
```

这个命令会显示：
- 当前启用的云提供商
- 代理配置状态
- URL 端点配置
- 认证状态

### 启用调试日志

```bash
export ANTHROPIC_LOG=debug
claude
```

日志会显示：
- 详细的 HTTP 请求和响应
- 代理连接信息
- 认证过程
- 错误原因

### 测试连接性

```bash
# 测试代理连接
curl -x https://proxy.company.com:8080 https://api.anthropic.com/v1/messages

# 测试网关连接
curl -H "Authorization: Bearer your-token" https://llm-gateway.company.com/health

# 测试云提供商 API
# AWS
aws bedrock list-foundation-models

# GCP
gcloud ai endpoints list --region=us-central1

# Azure
az cognitiveservices account list
```

---

## 延伸阅读

- 配置 Amazon Bedrock：[AWS Bedrock 部署](https://code.claude.com/docs/zh-CN/bedrock)
- 配置 Google Vertex AI：[GCP 部署](https://code.claude.com/docs/zh-CN/vertex)
- 配置 Microsoft Foundry：[Azure 部署](https://code.claude.com/docs/zh-CN/foundry)
- 配置企业网络：[企业网络配置](https://code.claude.com/docs/zh-CN/enterprise-network)
- 部署 LLM 网关：[LLM 网关部署](https://code.claude.com/docs/zh-CN/llm-gateway)
- 配置选项和环境变量：[Settings 参考](https://code.claude.com/docs/zh-CN/settings)

---

## 一句话总结

企业部署的核心是"统一管理"——通过选择合适的云提供商、配置企业代理或 LLM 网关、实施多级 CLAUDE.md 和集中式 MCP，将个人工具升级为企业级解决方案。

**上一篇**：[Slack 中的 Claude Code](/2026/03/12/ai-tools/official-docs/slack/)

**下一篇**：[故障排除](/2026/03/12/ai-tools/official-docs/troubleshooting/)

---

*本文精读自 [企业部署概述](https://code.claude.com/docs/zh-CN/third-party-integrations)*
