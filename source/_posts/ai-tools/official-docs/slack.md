---
title: 精读官方文档：Slack 中的 Claude Code
date: 2026-03-07 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 24
description: 在 Slack 里直接 @Claude 让它帮你写代码、修 bug、创建 PR。本文详解 Claude Code Slack 集成的工作原理、配置步骤和最佳实践。
cover: https://picsum.photos/seed/claude-slack/1920/1080
source_url: https://code.claude.com/docs/zh-CN/slack
---

# 精读官方文档：Slack 中的 Claude Code

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

想象一下：你在 Slack 频道里和同事讨论一个 bug，聊着聊着发现需要改代码。传统流程是打开 IDE、找到文件、改代码、提交 PR——至少十几分钟。

现在，你只需要在 Slack 里 `@Claude 帮我在 user.ts 里加个 email 字段`，Claude 会自动识别这是个编码任务，在 claude.ai/code 上创建一个 Code Session，帮你完成代码修改，完成后 @你 并给你一个"创建 PR"的按钮。

这就是 **Claude Code in Slack**：把 Claude Code 的编码能力嵌入到你的 Slack 工作流里，不用切换工具就能派活给 AI。

<!-- more -->

---

## 二、官方教程精读

### 2.1 核心工作流程

整个流程可以概括为 6 个步骤：

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 你在 Slack @Claude 派活                                      │
│     ↓                                                           │
│  2. Claude 分析意图，判断是不是编码任务                            │
│     ↓                                                           │
│  3. 是编码任务 → 在 claude.ai/code 创建 Session                   │
│     ↓                                                           │
│  4. Claude 在 Session 里干活，Slack 收到进度更新                   │
│     ↓                                                           │
│  5. 干完了，@你 + 给你操作按钮                                    │
│     ↓                                                           │
│  6. 你点"View Session"看详情，或点"Create PR"直接提               │
└─────────────────────────────────────────────────────────────────┘
```

**关键点**：Slack 只是"派活入口"和"通知面板"，真正的代码工作在 claude.ai/code 的 Web 端完成。

### 2.2 前置条件

不是所有人都能用，需要满足以下条件：

| 要求 | 说明 |
|------|------|
| Claude 套餐 | Pro、Max、Teams 或 Enterprise（需要有 Claude Code 权限） |
| Web 端访问 | 必须启用 claude.ai/code 的访问权限 |
| GitHub 账号 | 已连接到 Claude Code，且至少授权了一个仓库 |
| Slack 认证 | Slack 账号已关联到 Claude 账号 |

> 💬 hippo：如果你的组织用的是 Enterprise 套餐，还需要确认管理员给你开了 Claude Code 权限（premium seats）。

### 2.3 上下文收集机制

Claude 会从 Slack 对话里抓取上下文，帮你更好地完成任务：

**从 Thread（线程）里收集**：你在某个线程里 @Claude，它会读取整个线程的对话历史。

```slack
👤 同事A: 这个 API 返回 500 了
👤 同事B: 看起来是 user_id 为空导致的
👤 你: @Claude 帮我在 api/handler.go 加个 user_id 校验
```

Claude 会理解"500 错误"、"user_id 为空"这些上下文，在代码里加合适的校验逻辑。

**从 Channel（频道）里收集**：直接在频道里 @Claude（不是线程），它会看最近的频道消息找相关上下文。

### 2.4 仓库选择逻辑

Claude 会根据对话内容自动选择仓库。如果多个仓库都匹配，它会弹个下拉框让你选。

你也可以显式指定：

```slack
@Claude 在 hippo0913/blog 仓库里，帮我修复 footer 组件的样式问题
```

### 2.5 用户权限与访问控制

**用户级别**：

| 权限项 | 说明 |
|--------|------|
| Session 归属 | 每个 Session 跑在你自己的 Claude 账号下 |
| 用量限制 | 消耗的是你个人套餐的额度 |
| 仓库访问 | 只能访问你自己连接的仓库 |
| 历史记录 | Session 会出现在你 claude.ai/code 的历史里 |

**工作区级别**：

Slack 工作区管理员控制是否安装 Claude App。安装后，还需要**显式邀请 Claude 进入频道**：

```slack
/invite @Claude
```

这个设计很关键：管理员可以通过"允许 Claude 进入哪些频道"来控制谁能用这个功能。

### 2.6 当前限制

| 限制项 | 说明 |
|--------|------|
| 仅支持 GitHub | 暂不支持 GitLab、Bitbucket 等 |
| 单 PR 限制 | 每个 Session 只能创建一个 PR |
| 额度限制 | 使用你个人套餐的 rate limit |
| Web 端依赖 | 没有 Web 端权限的人只能收到普通聊天回复 |

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

**问题 1：Claude 总是选错仓库**

我有多个前端项目，命名类似（`web-app`、`web-admin`、`web-mobile`），在 Slack 里说"改一下 web 项目"，Claude 经常选错。

**问题 2：Thread 太长导致上下文丢失**

有个 bug 讨论线程有 50+ 条消息，@Claude 时它似乎只读了前面一部分，解决方案完全不对。

**问题 3：想看代码改动但只能看到摘要**

Slack 里只显示"我完成了 xxx"，看不到具体改了哪些文件。

### 3.2 我的解决方案

**解决仓库选择问题**：在请求里加仓库全名。

```slack
# ❌ 容易选错
@Claude 改一下 web 项目的登录页

# ✅ 明确指定
@Claude 在 myorg/web-admin 仓库，改登录页的验证逻辑
```

**解决上下文丢失问题**：关键信息放在 @Claude 的那条消息里，不要指望它从历史消息里找。

```slack
# ❌ 依赖历史上下文
@Claude 帮我修一下那个 bug

# ✅ 在请求里带上关键信息
@Claude 帮我修 user.service.ts 里的空指针 bug，问题出在
getUserById 没处理 id 为 null 的情况，应该返回 404 而不是抛异常
```

**解决看不到改动的问题**：养成习惯，收到完成通知后点"View Session"看完整 diff。

### 3.3 我的建议

1. **把 Slack 当派活工具，Web 端当审查工具**：Slack 里下任务，Web 端看代码、改代码、继续对话。

2. **短任务用 Slack，长任务用 Web**：改一行配置、加个字段——适合 Slack。重构模块、写新功能——直接去 Web 端。

3. **定义"完成标准"**：告诉 Claude 你期望的交付物。

```slack
# ❌ 模糊
@Claude 加个日志

# ✅ 明确
@Claude 在 auth.ts 的 login 函数加日志，记录用户名、登录时间、
IP 地址，用 winston 的 info 级别，完成后不要创建 PR
```

---

## 四、常见问题

**Q: Session 没启动，只收到普通聊天回复怎么办？**

A: 三个检查步骤：
1. 去 Claude App Home 确认账号已连接
2. 确认你有 claude.ai/code 的访问权限
3. 确认至少连接了一个 GitHub 仓库

如果都 OK，点击消息下方的"Retry as Code"按钮强制以编码任务重试。

**Q: 仓库没显示在下拉列表里怎么办？**

A: 先去 claude.ai/code 连接该仓库。如果已连接还是不显示，尝试重新授权 GitHub。

**Q: 如何让团队成员也能看到我的 Session?**

A: Teams 和 Enterprise 套餐下，从 Slack 创建的 Session 会自动对组织可见。在 claude.ai/code 的共享设置里可以调整。

**Q: 任务执行中我想取消怎么办?**

A: 点击"View Session"进入 Web 端，在 Session 里发送"停止"或直接关闭页面。

**Q: 能同时跑多个任务吗?**

A: 可以。每个 @Claude 请求会创建独立的 Session，互不影响。但要注意你的套餐并发限制。

---

## 五、小结

Claude Code in Slack 的核心价值是**降低编码任务的启动门槛**——在讨论 bug 的地方直接派活，不用切工具、不用开 IDE。

记住三个要点：
1. **明确指定仓库和文件**，避免选错
2. **在请求里带够上下文**，不要依赖历史消息
3. **用 Web 端审查改动**，Slack 只看摘要

**下一篇**：[精读官方文档：IDE 集成](/2026/03/07/ide-integration/)——在 VS Code / JetBrains 里直接用 Claude Code。

---

*本文精读自 [Claude Code in Slack](https://docs.anthropic.com/zh-CN/docs/claude-code/slack)*

*最后更新：2026-03-25*
