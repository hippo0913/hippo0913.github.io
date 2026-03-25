---
title: 精读官方文档：法律和合规
date: 2026-03-02 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 29
description: 精读 Claude Code 官方文档《法律和合规》，详解许可证条款、商业协议适用规则、医疗行业 BAA 合规条件、安全漏洞报告流程等核心内容。
cover: https://picsum.photos/seed/claude-legal-compliance/1920/1080
source_url: https://code.claude.com/docs/zh-CN/legal-and-compliance
---

# 精读官方文档：法律和合规

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。这篇的内容偏"法务向"，看起来枯燥，但如果你在企业环境使用 Claude Code，这些信息可能直接影响你能否在项目中合法合规地使用它。

---

## 一、这个功能是什么

简单来说，这篇官方文档回答了一个问题：**我在公司里用 Claude Code，法律上要注意什么？**

它涵盖四个核心领域：

1. **许可证**：Claude Code 用的是什么授权模式？
2. **商业协议**：通过不同渠道（直连、AWS Bedrock、Google Vertex）使用时，条款有什么区别？
3. **医疗合规**：医疗行业客户如何让 BAA（Business Associate Agreement，业务伙伴协议）覆盖 Claude Code？
4. **安全与信任**：发现安全漏洞去哪报告？

<!-- more -->

---

## 二、官方教程精读

### 2.1 许可证条款

Claude Code 采用 Anthropic 的商业服务条款（Commercial Terms of Service），而不是开源许可证。这意味着：

- 你不能自由分发、修改源码
- 使用受 Anthropic 服务条款约束
- 企业用户需要遵守相应的商业协议

### 2.2 商业协议适用规则

无论你是通过哪种方式使用 Claude API，Claude Code 的使用都受你现有商业协议管辖：

| 使用方式 | 术语 | 说明 |
|---------|------|------|
| 直接使用 Anthropic API | 1P（First Party） | 直接连 Anthropic，条款以 Anthropic 商业协议为准 |
| 通过 AWS Bedrock | 3P（Third Party） | AWS 作为中间层，你的 AWS 协议适用 |
| 通过 Google Vertex | 3P（Third Party） | Google 作为中间层，你的 GCP 协议适用 |

**关键点**：除非双方另有约定，否则你现有的商业协议会自动覆盖 Claude Code 的使用。这避免了"又要签一份新协议"的麻烦。

### 2.3 医疗行业合规（BAA）

对于医疗行业客户，这是一个重要的合规点：

**BAA（Business Associate Agreement，业务伙伴协议）** 是 HIPAA（美国健康保险流通与责任法案）要求的文件，用于规定医疗数据如何被第三方服务商处理。

要让 BAA 覆盖 Claude Code，需要满足两个条件：

```yaml
# BAA 覆盖 Claude Code 的前置条件
conditions:
  - 已签署 BAA: 与 Anthropic 签署了业务伙伴协议
  - ZDR 已启用: Zero Data Retention（零数据保留）功能已激活

effect:
  - BAA 自动扩展到 Claude Code
  - 覆盖通过 Claude Code 流转的 API 流量
```

**ZDR 是什么？** Zero Data Retention 是 Anthropic 提供的企业级功能，启用后 Anthropic 不会保留你的 API 请求数据用于模型训练。这是医疗、金融等敏感行业的常见合规要求。

### 2.4 安全与信任

官方提供了两个重要资源：

| 资源 | 用途 | 链接 |
|------|------|------|
| Anthropic Trust Center | 了解 Anthropic 的安全合规认证 | [trust.anthropic.com](https://trust.anthropic.com) |
| Transparency Hub | 透明度报告和政策信息 | Anthropic 官网相关页面 |

**安全漏洞报告**：Anthropic 通过 HackerOne 管理安全漏洞赏金计划。如果你发现 Claude Code 的安全漏洞，应通过 HackerOne 提交报告，而不是公开披露。

```bash
# 安全漏洞报告流程
1. 访问 Anthropic 的 HackerOne 页面
2. 按照模板提交漏洞详情
3. 等待 Anthropic 安全团队响应
4. 在修复前不要公开披露
```

---

## 三、hippo 的实战经验

> 💬 hippo：这篇文档内容偏法务，我没什么"踩坑"可分享，但有一些企业使用的实际观察：

### 3.1 企业采购时的注意事项

如果你在需要走企业采购流程的公司，以下几点值得提前确认：

1. **确认你的 API 来源**：是通过 Anthropic 直连还是云服务商？这决定了适用哪份商业协议
2. **敏感行业（医疗/金融）**：提前确认 BAA 签署状态和 ZDR 是否启用
3. **安全审计**：如果公司有安全审计要求，Anthropic Trust Center 提供了 SOC 2 等认证信息

### 3.2 实际配置示例

如果你需要向公司合规团队说明 Claude Code 的使用，可以整理以下信息：

```markdown
## Claude Code 合规信息摘要

**服务提供商**: Anthropic PBC
**授权模式**: 商业服务条款（非开源）
**数据保留**: 支持 Zero Data Retention（需企业账户）
**安全认证**: SOC 2 Type II（详见 Trust Center）
**漏洞报告**: HackerOne 漏洞赏金计划
**适用协议**:
  - 直连用户: Anthropic Commercial Terms
  - AWS Bedrock 用户: AWS 服务条款
  - Google Vertex 用户: GCP 服务条款
```

### 3.3 我的建议

- **个人开发者**：这篇文档对你影响不大，正常使用即可
- **企业用户**：建议把官方文档链接发给法务或合规团队，让他们确认是否需要额外审批
- **敏感行业**：务必在启用 Claude Code 前确认 BAA 和 ZDR 状态

---

## 四、常见问题

**Q: 我是个人开发者，需要关心这些吗？**

A: 通常不需要。个人使用遵守 Anthropic 的商业服务条款即可，没有额外的合规要求。但如果你处理的代码涉及敏感数据（如医疗信息），还是要留意数据保留政策。

**Q: ZDR 怎么启用？**

A: ZDR（Zero Data Retention）是企业级功能，需要联系 Anthropic 销售团队开通。普通个人账户默认不启用。

**Q: 通过 AWS Bedrock 用 Claude Code，数据还走 Anthropic 吗？**

A: 是的，Claude Code 的 API 请求最终还是会到 Anthropic。但商业条款以你和 AWS 的协议为准，而非直接和 Anthropic 签署的协议。

**Q: 发现安全漏洞能直接发邮件给 Anthropic 吗？**

A: 官方推荐通过 HackerOne 提交，这样可以走正规的漏洞赏金流程。直接发邮件可能处理效率较低，也拿不到赏金。

---

## 五、小结

Claude Code 的法律和合规框架相对简洁：采用商业许可证，通过不同渠道使用时适用相应商业协议，医疗行业需要 BAA + ZDR 组合才能合规使用。如果你在企业环境部署，建议提前确认公司合规要求。

**系列导航**：返回 [Claude Code 官方文档精读系列索引](/2026/02/15/claude-code-series-index/)

---

*本文精读自 [Legal and compliance - Anthropic](https://docs.anthropic.com/zh-CN/docs/claude-code/legal-and-compliance)*

*最后更新：2026-03-25*
