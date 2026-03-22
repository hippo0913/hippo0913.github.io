---
title: 精读官方文档：Claude Code GitLab CI/CD
date: 2026-03-20 02:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 23
description: 精读 Claude Code GitLab CI/CD 文档，了解如何在 GitLab 流水线中使用 Claude Code。
cover: https://picsum.photos/seed/claude-gitlab/1920/1080
source_url: https://code.claude.com/docs/zh-CN/gitlab-ci-cd

# 精读官方文档：Claude Code GitLab CI/CD
> 💬 hippo：想在 GitLab 里用 AI 自动写代码、修bug？Claude Code + GitLab CI/CD 绝对是个神器组合。
## 开篇：为什么要在 CI/CD 里用 AI
想象一下这个场景：你在 GitLab 里提了个 Issue，描述了一个新功能的需求，然后...你就不用管了。几分钟后，一个完整的 MR（合并请求）就自动创建好了，里面包含代码实现和说明。
这听起来像科幻片？不，这就是 Claude Code + GitLab CI/CD 能做到的事情。
在这篇文章里，我会带你了解：
- 如何把 Claude Code 接入 GitLab 流水线
- 用什么方式触发 AI 工作（@claude 提及？自动触发？）
- 企业级环境怎么用（AWS Bedrock、Google Vertex AI）
- hippo 在实战中踩过的坑和解决方案
<!-- more -->
## 核心概念：Claude Code 在 GitLab 里是怎么工作的
### 事件驱动的 AI 工作流
简单来说，Claude Code 在 GitLab 里的工作流程是这样的：
1. **触发事件**：有人在 Issue、MR 或评论里 @claude（或者手动触发流水线）
2. **收集上下文**：GitLab 把相关的内容（代码、评论描述、分支信息）打包
3. **AI 处理**：Claude Code 在一个隔离的容器里运行，分析需求
4. **提交结果**：Claude 修改代码、创建分支、打开 MR 供你审查
### 三个关键特性
- **项目感知**：Claude 会读取你项目根目录的 `CLAUDE.md`，遵循你的编码规范
- **沙箱执行**：每个 AI 任务都在隔离容器里跑，安全可控
- **MR 机制**：所有代码修改都通过 MR 流动，你的分支保护规则和审批流程依然生效
### 支持的 AI 提供商
Claude Code 在 GitLab 里支持三种方式：
1. **Claude API**：最简单，用 Anthropic 的 SaaS 服务
2. **AWS Bedrock**：适合已经在用 AWS 的企业，通过 OIDC 无密钥认证
3. **Google Vertex AI**：GCP 原生，同样支持 Workload Identity Federation
## 实战指南：手把手教你用
### 场景一：快速上手 - 手动触发 Claude 作业
这个场景适合初次尝试，不需要配置 webhook，最简单。
#### 步骤 1：添加 API 密钥
进入 GitLab 项目：
- Settings → CI/CD → Variables
- 添加 `ANTHROPIC_API_KEY`（记得勾选 Mask 和 Protect）
#### 步骤 2：修改 `.gitlab-ci.yml`
```yaml
stages:
  - ai
claude:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'  # 手动触发
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'  # MR 事件触发
  variables:
    GIT_STRATEGY: fetch
  before_script:
    - apk update
    - apk add --no-cache git curl bash
    - curl -fsSL https://claude.ai/install.sh | bash
  script:
    - /bin/gitlab-mcp-server || true
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Review this MR and implement the requested changes'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
```
#### 步骤 3：测试运行
- CI/CD → Pipelines → Run pipeline
- 选择手动触发
- 等待作业完成，Claude 会在日志里输出它的分析结果
### 场景二：@claude 提及自动响应
这个场景更智能，你在评论里 @claude，它就会干活。
#### 前置条件
需要配置一个事件监听器（可以用你自己的服务，或者第三方工具），这个监听器会：
1. 监听 GitLab 的 Webhook（特别是 Comments 事件）
2. 检测到包含 `@claude` 的评论时，调用 GitLab 的 Pipeline Trigger API
3. 把评论内容通过 `AI_FLOW_INPUT` 变量传给 Claude
#### 常用命令示例
**在 Issue 里 @claude：**
@claude implement this feature based on the issue description
Claude 会：
- 分析 Issue 描述
- 阅读相关代码
- 在新分支实现功能
- 打开一个 MR
**在 MR 里 @claude：**
@claude suggest a concrete approach to cache the results of this API call
- 分析 MR 的代码变更
- 提出缓存方案
- 直接修改 MR 的代码
**快速修 bug：**
@claude fix the TypeError in the user dashboard component
- 定位错误位置
- 修复代码
- 更新分支或创建新 MR
## hippo 的踩坑实录
### 坑点 1：CI/CD 变量配置错误，作业一直失败
**问题现象**
Claude 作业运行到一半就报错，提示认证失败。
**原因分析**
我一开始犯了个低级错误：把 `ANTHROPIC_API_KEY` 设置成了普通变量，没有勾选 Mask。结果在日志里直接暴露了，而且因为某些字符的转义问题导致密钥无效。
**解决方案**
1. 删除旧的变量
2. 重新创建，勾选 Mask 和 Protect
3. 如果用企业级提供商（AWS Bedrock、Vertex AI），检查 OIDC 配置是否正确
> 💬 hippo：一定要用 Mask！不要让你的 API 密钥在 CI 日志里裸奔，这在生产环境是大忌。
### 坑点 2：权限不足，Claude 无法创建 MR
Claude 分析完了，日志里显示 "Changes made"，但就是没有 MR。
GitLab 的 `CI_JOB_TOKEN` 默认权限不够。在某些 GitLab 版本里，作业 token 只有有限的 API 权限。
有两个选择：
**方案 A：使用项目访问令牌**
1. Settings → Access Tokens
2. 创建 token，勾选 `api` 权限
3. 在 CI/CD Variables 里添加 `GITLAB_ACCESS_TOKEN`（记得 Mask）
**方案 B：启用 `read_repository` 和 `write_repository` 权限**
在 `.gitlab-ci.yml` 里添加：
  id_tokens:
    GITLAB_JOB_JWT:
      aud: https://gitlab.com
> 💬 hippo：方案 B 更安全（JWT 有过期时间），但需要你的 GitLab 版本支持。如果版本老，就用方案 A 吧。
## 常见问题解答
### Q: Claude 作业运行时间有限制吗？
A: 有的。GitLab Runner 有默认超时（通常是 1 小时），你也可以在作业里自己设置：
  timeout: 30m  # 30分钟超时
建议先设置一个合理的值，避免 AI 跑飞了浪费资源。
### Q: 能同时跑多个 Claude 作业吗？
A: 理论上可以，但要注意：
- 你的 GitLab Runner 配额够不够
- API 调用成本会成倍增加
- 并发修改同一个分支可能导致冲突
建议先串行测试，确认稳定后再考虑并发。
### Q: 企业环境用哪个提供商比较好？
A: 看你们的基础设施：
- **已经在用 AWS** → 用 Bedrock，OIDC 无密钥认证很方便
- **已经在用 GCP** → 用 Vertex AI，同样支持 WIF
- **没有云厂商绑定** → 用 Claude API，设置最简单
成本方面，三者差异不大，主要看你们的数据驻留要求。
### Q: Claude 会泄露我的代码吗？
A: 不会。Claude Code 的工作方式：
1. 所有代码修改都通过 MR 流动，有完整的审计轨迹
2. AI 在隔离容器里运行，网络和文件系统都有严格限制
3. 审查流程不变，你和团队依然可以审核每个 MR
如果你担心数据隐私，可以考虑用 AWS Bedrock 或 Vertex AI，这样数据在你的云基础设施内处理。
**上一篇**：[精读官方文档：Claude Code GitHub Actions](/ai-tools/official-docs/github-actions/)
**下一篇**：[精读官方文档：Slack 中的 Claude Code](/ai-tools/official-docs/slack/)
*本文精读自 [精读官方文档：Claude Code GitLab CI/CD - Claude Code Docs](https://code.claude.com/docs/zh-CN/gitlab-ci-cd)*
