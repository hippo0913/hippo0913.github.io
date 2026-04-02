---
title: 精读官方文档：法律和合规
date: 2026-03-02 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 29
description: 精读 Claude Code 官方文档《法律和合规》，详解许可证条款、商业协议适用规则、医疗行业 BAA 合规条件，以及容易被忽略的身份验证和凭证使用限制。
cover: https://picsum.photos/seed/claude-legal-compliance/1920/1080
source_url: https://code.claude.com/docs/zh-CN/legal-and-compliance
---

# 精读官方文档：法律和合规

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。这篇内容偏"法务向"，看起来枯燥，但如果你在企业环境使用 Claude Code，这些信息可能直接影响你能否在项目中合法合规地使用它。尤其是身份验证和凭证的使用限制——这部分是开发者最容易踩坑的地方。

---

## 一、这个功能是什么

简单来说，这篇官方文档回答了一个核心问题：**在公司里用 Claude Code，法律上要注意什么？**

它涵盖四个领域：

1. **许可证条款**：Claude Code 用的是什么授权模式？不同计划用户适用不同条款
2. **商业协议**：通过不同渠道（直连 API、AWS Bedrock、Google Vertex）使用时，条款有什么区别？
3. **医疗合规**：医疗行业客户如何让 BAA（Business Associate Agreement，业务伙伴协议）覆盖 Claude Code？
4. **使用政策与安全**：身份验证有哪些限制？凭证能不能用在自建工具里？发现安全漏洞怎么报告？

<!-- more -->

---

## 二、官方教程精读

### 2.1 许可证与商业协议

Claude Code 不是开源软件。它的使用受两套条款约束，取决于你的账户类型：

| 用户类型 | 适用条款 | 获取方式 |
|---|---|---|
| Team、Enterprise、Claude API 用户 | [商业条款](https://www.anthropic.com/commercial-terms) | Anthropic Console 或企业签约 |
| Free、Pro、Max 用户 | [消费者服务条款](https://www.anthropic.com/consumer-terms) | claude.ai 或 Claude Code 登录 |

关键概念是 **1P（First Party）** 和 **3P（Third Party）** 的区别：

| 使用方式 | 术语 | 说明 |
|---|---|---|
| 直接使用 Anthropic API | 1P | 直连 Anthropic，适用 Anthropic 商业协议 |
| 通过 AWS Bedrock | 3P | AWS 作为中间层，适用你的 AWS 协议 |
| 通过 Google Vertex | 3P | Google 作为中间层，适用你的 GCP 协议 |

> 💬 hippo：注意，官方原文只提到了 AWS Bedrock 和 Google Vertex 两个 3P 渠道。如果你通过其他云服务商访问，需要单独确认条款适用情况。

**核心规则**：除非双方另有约定，你现有的商业协议会自动覆盖 Claude Code 的使用。这意味着你不需要为了使用 Claude Code 再签一份单独的协议。

### 2.2 医疗行业合规（BAA + ZDR）

对于医疗行业客户，这是一个关键的合规要点。

**BAA（Business Associate Agreement，业务伙伴协议）** 是 HIPAA（美国健康保险流通与责任法案）要求的文件，规定了医疗数据如何被第三方服务商处理。要让 BAA 覆盖 Claude Code，必须同时满足两个条件：

```yaml
# BAA 覆盖 Claude Code 的条件（官方原文翻译）
conditions:
  - 已签署 BAA: 与 Anthropic 签署了业务伙伴协议（Business Associate Agreement）
  - ZDR 已激活: Zero Data Retention（零数据保留）已启用
  # 注意：ZDR 按组织级别启用，每个组织必须单独开启

effect:
  - BAA 自动扩展覆盖 Claude Code
  - 覆盖通过 Claude Code 流转的 API 流量
```

**ZDR 是什么？** Zero Data Retention 是 Anthropic 提供的企业级功能，启用后 Anthropic 不会保留你的 API 请求数据用于模型训练。这是医疗、金融等敏感行业的常见合规要求。

**重要细节**：ZDR 是按组织级别（organization-level）启用的，不是按项目或按用户。如果你的组织有多个团队，只要组织层面开了 ZDR，所有团队都能受益。

### 2.3 使用政策：身份验证和凭证

> 💬 hippo：这是官方文档中**最容易忽略但违规风险最高**的部分。很多开发者会本能地把 Claude Code 的凭证复用到其他工具里，但这在条款层面是明确禁止的。

Claude Code 支持两种身份验证方式，适用场景和使用限制完全不同：

| 维度 | OAuth 令牌（Free/Pro/Max） | API 密钥 |
|---|---|---|
| 获取方式 | 通过 claude.ai 登录自动获取 | 通过 Claude Console 或云提供商创建 |
| 适用计划 | Free、Pro、Max 计划 | Team、Enterprise、API 计划 |
| **使用范围** | **仅限 Claude Code 和 Claude.ai** | 可用于构建产品和服务 |
| 能否用于 Agent SDK | 不能 | 可以 |
| 能否用于自建工具 | 不能 | 可以 |

**关键限制**：

1. **OAuth 令牌仅限 Claude Code 和 Claude.ai 使用**。你不能把 OAuth 令牌用在其他产品或工具中，包括 Anthropic 的 Agent SDK。这不是技术限制，而是条款层面的硬性规定。

2. **不允许第三方开发者用 Free/Pro/Max 凭证路由用户请求**。简单说，你不能做一个中间代理服务，让终端用户通过你的 Pro/Max 账号来使用 Claude。

3. **开发者构建产品应使用 API 密钥认证**。如果你要构建一个与 Claude 交互的产品，正确的做法是通过 API 密钥接入，而不是复用消费者的 OAuth 凭证。

4. **Anthropic 保留执行限制的权利**，可以在不事先通知的情况下对违规使用采取行动。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际在企业场景中使用 Claude Code 的一些观察和经验。

### 3.1 企业采购时确认 API 来源

我参与过一个项目，团队在采购评审时需要确认 Claude Code 的 API 走哪条线路。这个确认直接影响适用哪份商业协议——如果公司已经和 AWS 签了企业协议，那通过 Bedrock 用 Claude Code 就不需要再和 Anthropic 单独签协议。

**建议**：在采购流程中，先确认"API 来源是直连还是云服务商"，再确认适用的商业协议版本。这个信息通常需要技术团队和采购团队一起确认。

### 3.2 身份验证违规的真实风险

我见过一个场景：有人把 Pro 账号的 OAuth 令牌提取出来，集成到自建的自动化工具里，让整个团队共用这个令牌访问 Claude。这看起来"很聪明"，但实际上违反了消费者服务条款——OAuth 令牌仅限 Claude Code 和 Claude.ai 使用。

**后果**：Anthropic 有权在不事先通知的情况下封禁违规账号。对于 Pro/Max 用户，这意味着你会失去订阅权限和所有对话历史。

**正确做法**：团队使用应该走 Team/Enterprise 计划，用 API 密钥接入。个人账号就留在个人场景使用。

### 3.3 敏感行业部署前的检查清单

如果你在医疗或金融行业，部署 Claude Code 前需要逐项确认：

```markdown
## Claude Code 合规信息摘要（可发给公司合规团队）

**服务提供商**: Anthropic PBC
**授权模式**: 商业服务条款（非开源）
  - Team/Enterprise/API 用户 → Anthropic 商业条款
  - Free/Pro/Max 用户 → Anthropic 消费者服务条款
**数据保留**: 支持 Zero Data Retention（需企业账户，按组织启用）
**安全认证**: SOC 2 Type II 等（详见 trust.anthropic.com）
**漏洞报告**: HackerOne 漏洞赏金计划
**使用限制**:
  - OAuth 令牌仅限 Claude Code 和 Claude.ai 使用
  - 构建产品需使用 API 密钥认证
  - 不允许用用户 Pro/Max 凭证代为路由请求
```

---

## 四、常见问题

**Q: 我是个人开发者，需要关心这些吗？**

A: 使用条款仍然适用，但对你来说最重要的是 OAuth 令牌的使用限制。不要把你的登录凭证用在自建工具或其他项目中，即使技术上可行，也违反消费者服务条款。

**Q: ZDR 怎么启用？**

A: ZDR（Zero Data Retention）是企业级功能，需要联系 Anthropic 销售团队开通。它按组织级别启用，普通个人账户默认不提供。

**Q: 能把 Claude Code 的 OAuth 令牌用在自建工具里吗？**

A: 不能。OAuth 令牌仅限 Claude Code 和 Claude.ai 使用，用在其他工具（包括 Agent SDK）中是明确的条款违规。构建产品应该使用 API 密钥。

**Q: 通过 AWS Bedrock 或 Google Vertex 使用，数据还走 Anthropic 吗？**

A: 是的，Claude Code 的 API 请求最终还是会到 Anthropic 的服务。但商业条款以你和云服务商的协议为准，而不是直接和 Anthropic 签署的协议。

**Q: 发现安全漏洞怎么报告？**

A: 通过 Anthropic 的 [HackerOne](https://hackerone.com/anthropic) 页面提交。不要公开披露漏洞，这样可以走正规的漏洞赏金流程，还能拿到赏金。

---

## 五、小结

Claude Code 的法律和合规框架可以浓缩为三句话：两套条款对应两类用户，商业协议自动覆盖无需额外签约，医疗行业需要 BAA + ZDR 组合。但最容易被忽略的身份验证限制——OAuth 令牌只许在 Claude Code 和 Claude.ai 里用，别的地方一律不行——恰恰是违规风险最高的地方。

**系列导航**：返回 [Claude Code 官方文档精读系列索引](/2026/02/15/claude-code-series-index/)

---

*本文精读自 [法律和合规](https://code.claude.com/docs/zh-CN/legal-and-compliance)*

*最后更新：2026-03-31*
