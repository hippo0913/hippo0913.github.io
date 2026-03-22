---
title: 精读官方文档：法律和合规
date: 2026-03-12 20:26:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 29
description: 精读 Claude Code 法律和合规文档，了解使用条款、隐私政策和企业合规要求。
cover: https://picsum.photos/seed/claude-legal/1920/1080
source_url: https://code.claude.com/docs/zh-CN/legal-and-compliance
---

# 精读官方文档：法律和合规

> 💬 hippo：这是 Claude Code 官方文档精读系列的第 29 篇。

---

## 开篇：为什么读这篇文档

用 AI 工具时，我们经常只顾着"怎么用更快"，却很少想"能不能用"和"怎么用才合规"。但如果你在团队或企业环境中使用 Claude Code，这些问题就绕不过去了。

这篇文档虽然短，但它告诉了我们三件最重要的事：
- 不同用户类型遵守不同的条款
- 企业用户的现有协议可以直接延伸到 Claude Code
- 医疗行业有特殊的合规要求（BAA）

<!-- more -->

---

## 核心概念：用大白话讲清楚

### 两类条款，对号入座

首先得搞清楚你是哪类用户：

1. **商业用户**（Team、Enterprise、Claude API）
   - 适用条款：商业条款（Commercial Terms）
   - 场景：企业团队、通过 API 集成的应用

2. **个人用户**（Free、Pro、Max）
   - 适用条款：消费者条款（Consumer Terms）
   - 场景：个人开发者、自用项目

> 💬 hippo：别小看这个分类，这决定了你的数据如何被处理，以及出了问题找谁负责。如果你是自由接单，用个人账号做项目可能会踩雷——最好注册个商业账号。

### 现有协议自动延伸

这是个好消息：如果你已经是 Claude API 或通过 AWS Bedrock、Google Vertex 使用 Claude 的企业，不需要重新签合同。

- **直接用 Claude API**（1P，First Party）：现有商业协议直接适用
- **通过第三方用**（3P，Third Party）：还是原来的协议，除非双方另有约定

### BAA：医疗行业的特殊需求

BAA 是 Business Associate Agreement（业务关联协议）的缩写，简单说就是 HIPAA 合规合同。

如果你的工作涉及医疗数据（比如医院系统开发），需要：
1. 已经和 Anthropic 签署 BAA
2. 开启零数据保留（Zero Data Retention，ZDR）

满足这两个条件，BAA 会自动覆盖 Claude Code 的使用。

---

## 实战指南：手把手教你用

### 场景一：个人开发者搭建 CI/CD 助手

假设你是个自由开发者，想用 Claude Code 帮你自动写测试、优化代码。

**步骤 1：确认你的用户类型**
```bash
# 登录 Claude Code 后，检查你的账号类型
# 个人开发者通常属于 Free/Pro/Max → 用消费者条款
```

**步骤 2：数据安全检查**
> 💬 hippo：个人用户最需要注意的是**不要把敏感信息传给 AI**。比如 API Key、数据库密码、个人隐私数据等。

**步骤 3：合规清单**
- ✅ 只传公开代码
- ✅ 使用环境变量管理敏感信息
- ✅ 定期审查 AI 生成的代码

### 场景二：企业团队引入 Claude Code

假设你在一家 50 人的技术公司，想引入 Claude Code 提升开发效率。

**步骤 1：联系法务团队**
> 💬 hippo：这是第一步！很多公司已经有与 Anthropic 的协议，直接问法务："我们现有的协议是否覆盖 Claude Code？"

**步骤 2：确认协议范围**
```yaml
# 常见的企业协议类型
- Team 版本：适用于小团队
- Enterprise 版本：适用于中大型企业
- API 集成：如果你有自己的应用集成 Claude
```

**步骤 3：团队使用规范**
制定简单的团队规则，比如：
- 不得上传客户隐私数据
- 生成的代码必须 Code Review
- 敏感项目禁用 AI 辅助

**步骤 4：监控和审计**
定期检查：
- API 调用频率和成本
- 使用统计（Claude Code 后台查看）
- 异常行为检测

---

## hippo 的踩坑实录

### 坑一：用个人账号做企业项目

> 💬 hippo：这个坑我亲眼见过朋友踩过。

**情况**：朋友用 Free 账号帮客户开发电商网站，直接把客户数据库结构传给 Claude Code 优化。

**问题**：
1. 消费者条款不适用于商业项目
2. 客户数据可能被 Anthropic 用于训练模型
3. 一旦出问题，个人承担责任，公司/客户无法索赔

**解决方案**：
- 注册 Team 或 Enterprise 账号
- 或通过 API 集成，使用企业密钥
- 明确告知客户 AI 使用情况，获得书面同意

### 坑二：医疗项目未启用 ZDR

> 💬 hippo：这个坑更严重，直接导致项目叫停。

**情况**：某医疗初创公司用 Claude Code 开发电子病历系统，虽然签了 BAA，但忘记开启 ZDR。

**问题**：
- 患者数据默认被 Anthropic 保留用于模型改进
- 违反 HIPAA 合规要求
- 可能面临巨额罚款

**解决方案**：
```bash
# 在 Claude Code 配置中开启 ZDR
# 具体位置在 Claude Code 网页版的 Settings → Data Retention
# 选择 Zero Data Retention 选项
```

---

## 常见问题解答

**Q: 我用 AWS Bedrock 调用 Claude，算哪种用户？**

A: 你还是归 AWS Bedrock 的协议管理。但如果你想直接用 Claude Code（比如 VS Code 插件），那就要按 Claude 的用户类型来。

**Q: 团队里有人用 Free 账号有人用 Pro 账号，怎么统一管理？**

A: 推荐统一申请 Team 版本账号，这样：
- 享受统一的商业条款
- 集中管理使用权限
- 便于成本控制和审计

**Q: ZDR 开启后会影响 AI 性能吗？**

A: 理论上不会，因为你只是关闭了"数据保留"，不是关闭"学习"。但要注意某些功能可能受限（比如长期对话记忆）。

**Q: 发现代码里有 Bug，能找 Anthropic 赔偿吗？**

A: 通常不能。条款里会写明 AI 生成的内容需要人工审核。这也是为什么 Code Review 依然重要的原因。

**Q: 如果发现安全漏洞怎么报告？**

A: Anthropic 通过 HackerOne 管理安全项目。如果你是安全研究人员，可以通过 https://hackerone.com/anthropic 报告漏洞，还有奖励。

---

## 一句话总结

合规不是限制，而是保护——搞清楚条款，用好工具，安心开发。

---

**上一篇**：[精读官方文档：安全最佳实践](https://hippo0913.github.io/2026/03/12/ai-tools/official-docs/security-best-practices/)

**下一篇**：[精读官方文档：故障排除](https://hippo0913.github.io/2026/03/12/ai-tools/official-docs/troubleshooting/)

---

*本文精读自 [法律和合规 - Claude Code Docs](https://code.claude.com/docs/zh-CN/legal-and-compliance)*