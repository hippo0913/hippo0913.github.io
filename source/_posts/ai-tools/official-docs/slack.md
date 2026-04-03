---
title: 精读官方文档：Slack 中的 Claude Code
date: 2026-03-07 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 24
description: 在 Slack 里直接 @Claude 让它帮你写代码、修 bug、创建 PR。本文详解自动意图检测、双端协作架构、上下文收集机制和实战踩坑经验。
cover: https://picsum.photos/seed/claude-slack/1920/1080
source_url: https://code.claude.com/docs/zh-CN/slack
---

# 精读官方文档：Slack 中的 Claude Code

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

想象一下：你在 Slack 频道里和同事讨论一个 bug，聊着聊着发现需要改代码。传统流程是打开 IDE、找到文件、改代码、提交 PR——至少十几分钟。

现在，你只需要在 Slack 里 `@Claude 帮我在 user.ts 里加个 email 字段`，Claude 会自动分析你的消息，判断这是个编码任务，然后在 claude.ai/code 上创建一个 Code Session（独立的编码会话），帮你完成代码修改，完成后 @你 并给你操作按钮。

这就是 **Claude Code in Slack** 的核心定位——**Slack 是派活入口和通知面板，真正的代码工作在 claude.ai/code 的 Web 端完成**。两者分工明确：Slack 负责接收指令和推送结果，Web 端负责执行编码和展示完整 diff。

官方列出了 4 个典型用例：

| 用例 | 场景 |
|------|------|
| Bug 调查修复 | 在 bug 讨论线程里直接让 Claude 定位并修复问题 |
| 快速代码审查修改 | 审查 PR 时发现问题，直接让 Claude 改 |
| 协作调试 | 多人讨论中让 Claude 参与分析和写代码 |
| 并行任务执行 | 同时 @Claude 多次，创建多个独立 Session 并行处理 |

<!-- more -->

---

## 二、官方教程精读

### 2.1 核心工作流程与自动检测

整个流程分为 6 步：

```text
1. 你在 Slack @Claude 派活
   ↓
2. Claude 分析消息意图
   ↓
3. 判断为编码任务 → 在 claude.ai/code 创建 Session
   ↓
4. Claude 在 Session 里干活，Slack 收到进度更新
   ↓
5. 干完了，@你 + 给你操作按钮
   ↓
6. 你点按钮审查/建 PR，或去 Web 端继续对话
```

**自动检测机制**是这里的核心。当你 @Claude 时，它不是简单地把消息转发给 Web 端，而是先分析消息内容：

- **判断为编码任务**：比如"帮我在 auth.ts 加个日志"、"修复 login 函数的空指针 bug"——包含明确的文件名、函数名、代码操作关键词。Claude 会自动路由到 Web 端创建 Code Session。
- **判断为普通问题**：比如"Claude，Go 和 Rust 哪个更适合写 CLI？"——这是知识问答，Claude 会直接在 Slack 里以聊天助手身份回复。

**但自动检测不总是准确的。** 有时你想让 Claude 写代码，但它判断为普通聊天——这时候用 **Retry as Code** 按钮。点击后，Claude 会强制将这条消息重新作为编码任务处理，在 Web 端创建 Session。

```slack
# 自动检测为编码任务（包含文件名+操作动词）
@Claude 帮我在 api/handler.go 加个 user_id 校验，空值时返回 400

# 自动检测为聊天（纯知识问答）
@Claude Go 语言的 error handling 最佳实践是什么？

# 手动触发编码任务（意图模糊时）
@Claude 帮我处理一下刚才讨论的那个问题
→ Claude 以聊天回复了？点 "Retry as Code" 强制作为编码任务
```

> 💬 hippo：Retry as Code 是个很容易被忽略的按钮。如果你确信自己的需求是编码任务，但 Claude 只给了文字回复，别急着重新输入，先试试这个按钮。

### 2.2 前置条件与首次配置

不是所有人都能直接用。你需要满足以下 4 个前置条件：

| 要求 | 详情 |
|---|---|
| Claude 计划 | Pro、Max、Teams 或 Enterprise（需包含 Claude Code 高级席位） |
| Web 端 Claude Code | 必须已启用 claude.ai/code 的访问权限 |
| GitHub 账户连接 | 至少一个已认证的 GitHub 仓库连接到 Claude Code |
| Slack 认证 | Slack 账户通过 Claude App 链接到 Claude 账户 |

配置步骤如下：

**步骤 1：安装 Claude App**

让 Slack 工作区管理员在 Slack App Directory 搜索 "Claude" 并安装。

**步骤 2：连接账号（App Home）**

```bash
# 在 Slack 中操作
1. 左侧边栏 → Apps → Claude
2. 打开 Claude App Home 选项卡
3. 点击 "Connect Account" 按钮
4. 浏览器跳转到 claude.ai，登录并授权
5. 返回 Slack，确认显示 "Connected" 状态
```

> 💬 hippo：App Home 不仅是连接入口，还是后续故障排除的起点。遇到问题时，先来这里看连接状态。

**步骤 3：启用 Web 端并连接仓库**

访问 claude.ai/code，确认能正常打开。然后在 Settings → Repositories 里连接至少一个 GitHub 仓库。

**步骤 4：邀请 Claude 进入频道**

安装 App 不等于它能访问所有频道，需要显式邀请：

```slack
/invite @Claude
```

只有在 Claude 已加入的频道里，@Claude 才会触发 Code Session。

### 2.3 上下文收集与仓库选择

Claude 怎么理解你的需求？靠两种上下文收集机制。

**线程模式**：你在某个线程里 @Claude，它会读取整个线程的对话历史。这是推荐的使用方式——在线程里讨论问题、积累上下文，最后 @Claude 派活。

```slack
👤 同事A: 这个 API 返回 500 了，日志显示 user_id 为空
👤 同事B: 应该是 /api/user/:id 没做参数校验
👤 你: @Claude 帮我在 api/handler.go 加个 user_id 校验，
        空值时返回 400 而不是继续查库
```

Claude 会理解"500 错误"、"user_id 为空"、"参数校验"这些上下文，写出符合讨论意图的校验代码。

**频道模式**：直接在频道（非线程）里 @Claude，它会读取最近一段时间的频道消息找相关上下文。这种方式上下文精度不如线程模式，适合简单任务。

**仓库自动选择**：Claude 根据对话内容自动匹配仓库。如果多个仓库都匹配，会弹出下拉框让你选。你也可以显式指定仓库名避免选错：

```slack
@Claude 在 myorg/web-admin 仓库里，帮我在 auth.ts 的 login 函数加日志，
记录用户名、登录时间、IP 地址，用 winston 的 info 级别，完成后不要创建 PR
```

### 2.4 权限、按钮与双端访问对比

**用户级权限控制**：每个 Session 运行在你自己的 Claude 账户下，用量计入个人计划限制，只能访问个人连接的仓库，Session 历史出现在 claude.ai/code。管理员通过控制"允许 Claude 进入哪些频道"来管理使用范围。

**4 个操作按钮详解**：

| 按钮 | 功能 | 使用场景 |
|---|---|---|
| **View Session** | 在浏览器打开完整 Claude Code 会话 | 查看所有执行工作、完整 diff、继续会话或提其他请求 |
| **Create PR** | 直接从会话更改创建拉取请求 | 确认改动没问题，想快速提交时 |
| **Retry as Code** | 强制重试为编码任务 | Claude 最初作为聊天助手响应但你想要编码会话时 |
| **Change Repo** | 切换到不同仓库 | Claude 选错仓库时，显示已连接仓库下拉列表 |

**Slack 端 vs Web 端各自能做什么？** 这是理解整个集成的关键：

| 能力 | Slack 端 | Web 端（claude.ai/code） |
|------|----------|--------------------------|
| 发起编码任务 | 可以（@Claude） | 可以 |
| 查看执行进度 | 简要状态更新 | 完整实时过程 |
| 查看代码改动 | 摘要描述 | 完整 diff + 文件对比 |
| 继续对话 | 需跳转 | 直接继续 |
| 创建 PR | 点击按钮 | 完整 PR 配置 |
| 修改代码 | 不支持 | 直接编辑 |

> 💬 hippo：简单说，Slack 能做的只有"派活"和"点按钮"，要看具体改了什么代码，必须去 Web 端。

**当前限制**：

| 限制 | 说明 |
|------|------|
| 仅 GitHub | 目前只支持 GitHub 仓库，暂不支持 GitLab/Bitbucket |
| 一次一个 PR | 每个 Session 只能创建一个拉取请求 |
| 速率限制 | Session 使用个人 Claude 计划的速率限制 |
| 需要 Web 访问 | 没有 Web 端 Claude Code 权限的用户只会得到标准聊天响应 |

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 仓库选择踩坑

我有多个前端项目，命名类似（`web-app`、`web-admin`、`web-mobile`），在 Slack 里说"改一下 web 项目"，Claude 经常选错。

解决方案是**在请求中写全 org/repo-name**：

```slack
# ❌ 容易选错
@Claude 改一下 web 项目的登录页

# ✅ 明确指定
@Claude 在 myorg/web-admin 仓库，改登录页的验证逻辑
```

### 3.2 上下文丢失问题

有个 bug 讨论线程有 50+ 条消息，@Claude 时它似乎只读了前面一部分，写出来的修复方案完全不对。

解决方案是**关键信息写在请求里**，不要指望它从历史消息里找全：

```slack
# ❌ 依赖历史上下文
@Claude 帮我修一下那个 bug

# ✅ 在请求里带上关键信息
@Claude 帮我修 user.service.ts 里的空指针 bug，问题出在
getUserById 没处理 id 为 null 的情况，应该返回 404 而不是抛异常
```

### 3.3 我的建议

**1. 短任务用 Slack 派活 + Web 审查，长任务直接 Web 端**

改一行配置、加个字段——适合 Slack。重构模块、写新功能——直接去 Web 端。判断依据是：如果你的请求能在一条消息里写清楚，就用 Slack；需要多轮讨论才能定义清楚的需求，直接去 Web 端更高效。

**2. 定义完成标准**

告诉 Claude 你期望的交付物，而不是模糊的指令：

```slack
# ❌ 模糊
@Claude 加个日志

# ✅ 明确
@Claude 在 auth.ts 的 login 函数加日志，记录用户名、登录时间、
IP 地址，用 winston 的 info 级别，完成后不要创建 PR
```

**3. 养成 View Session 的习惯**

Slack 里只显示"我完成了 xxx"的摘要，看不到具体改了哪些文件。收到完成通知后，第一时间点 View Session 去看完整 diff，确认改动符合预期再建 PR。

---

## 四、常见问题与故障排除

### 4.1 Session 未启动

**症状**：@Claude 后只收到普通聊天回复，没有创建 Code Session。

| 问题 | 排查步骤 | 解决方案 |
|------|----------|----------|
| 连接断开 | 打开 Claude App Home 看状态 | 显示 "Connect Account" 则重新连接 |
| Web 端无权限 | 访问 claude.ai/code | 如果 403 或付费提示，检查套餐是否包含 Code 权限 |
| 仓库未连接 | claude.ai/code → Settings → Repositories | 确认至少有一个已连接仓库 |
| 意图检测误判 | 查看 Claude 的回复类型 | 点击 **Retry as Code** 强制以编码任务重试 |

### 4.2 认证错误

**症状**：提示认证失败、会话无法创建。

```bash
# 故障排除步骤
1. 打开 Slack → Apps → Claude → App Home
2. 点击 Disconnect 断开连接
3. 刷新页面
4. 点击 Connect Account 重新连接
5. 在浏览器确认登录正确的 Claude 账号
6. 如果仍失败，检查 claude.ai → Settings → Plan 确认套餐权限
```

> 💬 hippo：多账号用户容易踩坑——浏览器登录的是个人账号，但 Slack 关联的是工作账号。确保两边账号一致。

### 4.3 仓库未显示或选错

| 问题 | 解决方案 |
|------|----------|
| 仓库没在列表里 | 去 claude.ai/code 的 Settings → Repositories 连接该仓库 |
| 已连接但不显示 | 尝试断开并重新授权 GitHub 账户 |
| Claude 选错了仓库 | 点击 Change Repo 按钮手动选择 |
| 多次选错 | 在请求里显式指定仓库全名：`@Claude 在 org/repo-name 里...` |

### 4.4 其他常见问题

**Q: 能同时跑多个任务吗?**

A: 可以。每个 @Claude 请求会创建独立的 Session，互不影响。适合并行处理多个小修改。

**Q: 会话过期了怎么办?**

A: 过期的 Session 仍然可以在 claude.ai/code 的历史记录里找到，你可以查看之前的代码改动，也可以从 Web 端继续对话。

**Q: 团队成员能看到我的 Session 吗?**

A: Teams 和 Enterprise 套餐下，Session 会自动对组织可见。个人套餐下的 Session 是私有的。

---

## 五、小结

Claude Code in Slack 的核心价值是**降低编码任务的启动门槛**——在讨论 bug 的地方直接派活，不用切工具、不用开 IDE。

记住三个要点：
1. **明确指定仓库和文件**，避免 Claude 选错
2. **在请求里带够上下文**，不要依赖历史消息
3. **用 Web 端审查改动**，Slack 只看摘要和点按钮

**下一篇**：[精读官方文档：在 VS Code 中使用 Claude Code](/2026/03/14/ai-tools/official-docs/vs-code/)——在 VS Code 里直接用 Claude Code。

---

*本文精读自 [Claude Code in Slack 官方文档（中文版）](https://code.claude.com/docs/zh-CN/slack)*

*最后更新：2026-03-31*
