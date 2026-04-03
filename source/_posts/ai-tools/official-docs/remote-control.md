---
title: 精读官方文档：Remote Control 远程控制
date: 2026-03-10 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 21
description: Remote Control 让你用手机或浏览器继续电脑上正在跑的 Claude Code 会话。会话仍在本地执行，远程设备只是一个「遥控器」。
cover: https://picsum.photos/seed/claude-remote-control/1920/1080
source_url: https://code.claude.com/docs/zh-CN/remote-control
---

# 精读官方文档：Remote Control 远程控制

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

想象一下：你在电脑上用 Claude Code 写代码，写到一半想躺沙发上休息。这时候掏出手机打开 Claude App，就能继续刚才的对话——这就是 Remote Control（远程控制）。

**核心原理**：Claude Code 会话始终在你的本地电脑上运行，手机或浏览器只是一个远程窗口。这意味着本地的文件系统、MCP 服务器（一种让 AI 连接外部工具的标准协议）、项目配置全部可用，跟坐在电脑前操作没有区别。

Remote Control 的三大优势：
- **完整环境可用**：本地文件、工具链、MCP 配置，一个不少
- **多端实时同步**：终端、浏览器、手机三端消息同步
- **断线自动重连**：电脑休眠或网络抖动后恢复上线自动续接

**和 Claude Code 网页版的区别**：两者都用 claude.ai/code 界面，但本质不同。Remote Control 在你的本地电脑执行，保留完整环境；网页版跑在 Anthropic 云端，需要从 GitHub 克隆代码，MCP 和项目配置需要重新设置。

<!-- more -->

---

## 二、官方教程精读

### 2.1 使用前的准备工作

开始之前，确保你的环境满足以下条件：

| 要求 | 说明 |
|------|------|
| 订阅类型 | Pro、Max、Team、Enterprise 可用。**API Key 不支持** |
| 认证方式 | 必须用 claude.ai 账号登录，运行 `claude` 后执行 `/login` |
| 工作区信任 | 至少在项目目录运行过一次 `claude`，接受信任对话框 |
| Team/Enterprise | 管理员需在后台开启 Remote Control 开关 |

### 2.2 三种启动方式

**方式一：服务器模式（推荐用于长期运行）**

在项目目录下运行 `claude remote-control`，进程会保持运行等待远程连接，终端会显示会话 URL，按空格键可以显示二维码。

```bash
# 服务器模式：进程保持运行等待远程连接
claude remote-control

# 自定义会话名称
claude remote-control --name "My Project"

# 使用 worktree 隔离并发会话
claude remote-control --spawn worktree
```

服务器模式参数说明：

| 参数 | 说明 |
|------|------|
| `--name` | 自定义会话标题，显示在 claude.ai/code 的会话列表中 |
| `--spawn` | 并发会话创建模式：`same-dir`（默认，共享目录）或 `worktree`（独立 git worktree） |
| `--capacity` | 最大并发会话数，默认 32 |
| `--verbose` | 显示详细连接和会话日志 |
| `--sandbox` / `--no-sandbox` | 启用/禁用沙箱隔离，默认关闭 |

**方式二：交互式会话 + 远程控制**

启动一个正常的交互式会话，同时开启远程控制。你可以在终端里正常对话，也能从手机或浏览器接入。

```bash
# 交互式会话 + 远程控制
claude --remote-control
# 或指定名称
claude --remote-control "My Project"
# 简写
claude --rc
```

**方式三：从现有会话开启**

已经在 Claude Code 会话中了，想临时开启远程控制，直接输入命令即可，会继承当前对话历史。

```bash
# 从现有会话中开启远程控制
/remote-control
# 简写
/rc
# 指定名称
/remote-control My Project
```

### 2.3 连接、安全与故障排除

**三种连接方式**：

1. **URL 直连**：终端显示的会话 URL，在任意浏览器打开
2. **扫描二维码**：手机扫码直接跳转到 Claude App
3. **会话列表查找**：在 claude.ai/code 或 Claude App 中按名称查找，在线的远程会话会显示电脑图标和绿点

还没有安装 Claude App？在 Claude Code 中运行 `/mobile` 即可显示下载二维码。

**网络与安全**：Remote Control 采用出站连接模式——本地 Claude Code 只发起 HTTPS 出站请求，不开放任何入站端口。所有流量通过 TLS 加密传输，使用多个短期凭证相互隔离，每个凭证仅用于单一用途，独立过期。

**全局启用**：如果希望每次交互式会话都自动注册远程控制，运行 `/config`，找到「Enable Remote Control for all sessions」设为 `true`。

**Remote Control vs Claude Code 网页版**：

| 对比项 | Remote Control | Claude Code 网页版 |
|--------|----------------|-------------------|
| 执行位置 | 你的本地电脑 | Anthropic 云端服务器 |
| 文件系统 | 本地完整可用 | 需要从 GitHub 克隆 |
| MCP 服务器 | 本地配置可用 | 云端需重新配置 |
| 工具和项目配置 | 全部继承 | 需要重新设置 |
| 适用场景 | 继续本地工作进行中的任务 | 无需本地环境的快速任务 |

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 DISABLE_TELEMETRY 踩坑

第一次用 Remote Control 时，直接报了「Remote Control is not yet enabled for your account」。折腾了半天才发现是因为我之前设置了 `DISABLE_TELEMETRY` 环境变量。这个变量会阻止 Claude Code 与 Anthropic 服务器通信，导致远程控制功能无法注册。

```bash
# 检查是否有这些环境变量
env | grep -E "CLAUDE_CODE_DISABLE|DISABLE_TELEMETRY|CLAUDE_CODE_USE_BEDROCK"

# 取消设置后重试
unset DISABLE_TELEMETRY
unset CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC

# 使用 verbose 模式调试
claude remote-control --verbose
```

### 3.2 组织策略禁用的排查

Team 或 Enterprise 用户如果看到「disabled by your organization's policy」，按顺序排查：

1. 运行 `/status` 确认登录方式和订阅类型
2. 确认不是用 API Key 认证（Remote Control 必须用 claude.ai OAuth）
3. 联系管理员在 `claude.ai/admin-settings/claude-code` 开启 Remote Control 开关

如果管理员看到开关是灰色的，说明组织配置了数据保留或合规策略，与 Remote Control 不兼容，需要联系 Anthropic 支持。

### 3.3 服务器模式 vs 交互模式的选择

- **长期任务用服务器模式**：`claude remote-control` 进程独立运行，更稳定，配合 `--spawn worktree` 多人协作时避免文件冲突
- **边用边控用交互模式**：`claude --rc` 可以同时本地输入和远程操控，灵活但终端不能关

两个实际限制要注意：终端关闭会话就结束；网络断开超过约 10 分钟会话超时。

---

## 四、常见问题

**Q: Remote Control 支持 API Key 认证吗？**

A: 不支持。必须使用 claude.ai 账号登录（OAuth）。如果设置了 `ANTHROPIC_API_KEY` 环境变量，需要先取消设置。

**Q: 可以同时开多个远程会话吗？**

A: 交互模式每个 Claude Code 实例只支持一个远程会话。需要多个并发会话时，用服务器模式配合 `--spawn` 参数。

**Q: 电脑休眠后会话会断吗？**

A: 恢复上线会自动重连。但网络中断超过约 10 分钟会话会超时退出，需要重新启动。

**Q: Remote Control 和 Dispatch 有什么区别？**

A: Dispatch 是从手机发消息触发新任务，Remote Control 是直接操控正在运行的会话。简单说：Dispatch 是「派发任务」，Remote Control 是「远程驾驶」。

---

## 五、选择正确的方法

Claude Code 提供了多种在离开终端时继续工作的方式，按需选择：

| 方式 | 触发方式 | Claude 运行位置 | 设置复杂度 | 适用场景 |
|------|----------|-----------------|------------|----------|
| **Dispatch** | 从 Claude 手机应用发送任务消息 | 你的电脑（Desktop） | 需要配对手机应用和 Desktop | 离开时委托任务，设置最简单 |
| **Remote Control** | 从 claude.ai/code 或 Claude 手机应用驱动正在运行的会话 | 你的电脑（CLI 或 VS Code） | 运行 `claude remote-control` | 从其他设备操控进行中的工作 |
| **Channels** | 从 Telegram、Discord 等聊天应用或自己的服务器推送事件 | 你的电脑（CLI） | 安装 channel 插件或自己开发 | 响应外部事件如 CI 失败或聊天消息 |
| **Slack** | 在团队频道中 @Claude | Anthropic 云端 | 安装 Slack 应用并启用 Claude Code on the web | 从团队聊天进行 PR 和代码审查 |
| **Scheduled tasks** | 设置定时计划 | CLI、Desktop 或云端 | 选择频率 | 日常自动化如每日代码审查 |

**快速选择指南**：
- 想从手机继续当前会话 → Remote Control
- 想离开时派发新任务 → Dispatch
- 想响应外部事件（如 CI 失败）→ Channels
- 想在 Slack 里用 → Slack 集成
- 想定时自动执行 → Scheduled tasks

---

## 六、小结

Remote Control 让你用手机或浏览器「遥控」本地 Claude Code 会话，会话始终在本地执行，完整保留你的文件系统、MCP 配置和项目设置。推荐服务器模式用于长期任务，交互模式用于边用边控。

**系列导航**：返回 [Claude Code 官方文档精读系列索引](/2026/03/12/ai-tools/claude-code-series-index/)

---

*本文精读自 [使用 Remote Control 从任何设备继续本地会话](https://code.claude.com/docs/zh-CN/remote-control)*

*最后更新：2026-03-31*
