---
title: 精读官方文档：Remote Control 远程控制
date: 2026-03-10 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
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

想象一下这个场景：你在电脑上用 Claude Code 写代码，写到一半想躺沙发上休息。这时候可以用手机打开 Claude App，继续刚才的对话——这就是 Remote Control（远程控制）。

**核心原理**：你的 Claude Code 会话始终在本地电脑上运行，手机或浏览器只是一个「远程控制端」。这跟 Claude Code 网页版完全不同——网页版是跑在云端服务器上的。

Remote Control 的三个核心优势：
- **完整环境可用**：本地文件系统、MCP 服务器、项目配置全部可用
- **多端同步**：终端、浏览器、手机三端消息实时同步
- **自动重连**：电脑休眠或网络断开后，恢复上线自动重连

<!-- more -->

---

## 二、官方教程精读

### 2.1 使用前的准备工作

在开始之前，确保你的环境满足以下条件：

| 要求 | 说明 |
|------|------|
| 订阅类型 | Pro、Max、Team、Enterprise 计划可用。**API Key 不支持** |
| 认证方式 | 必须用 claude.ai 账号登录，运行 `claude` 后执行 `/login` |
| 工作区信任 | 至少在项目目录运行过一次 `claude`，接受工作区信任对话框 |
| Team/Enterprise | 管理员需要在后台开启 Remote Control 开关 |

### 2.2 三种启动方式

**方式一：服务器模式（推荐用于长期运行）**

```bash
# 进入项目目录后运行
claude remote-control
```

终端会显示一个会话 URL，按空格键可以显示二维码方便手机扫码连接。

服务器模式支持以下参数：

| 参数 | 说明 |
|------|------|
| `--name "My Project"` | 自定义会话名称，显示在 claude.ai/code 的会话列表中 |
| `--spawn <mode>` | 并发会话创建模式。`same-dir`（默认）共享目录，`worktree` 为每个会话创建独立 git worktree |
| `--capacity <N>` | 最大并发会话数，默认 32 |
| `--verbose` | 显示详细连接和会话日志 |
| `--sandbox` / `--no-sandbox` | 启用/禁用沙箱隔离，默认关闭 |

**方式二：交互式会话 + 远程控制**

```bash
# 启动交互式会话，同时开启远程控制
claude --remote-control

# 或指定会话名称
claude --remote-control "My Project"

# 简写形式
claude --rc
```

这种方式下，你可以在终端里正常对话，同时也能从手机或浏览器接入。

**方式三：从现有会话开启**

如果已经在 Claude Code 会话中，直接输入命令：

```bash
# 开启远程控制
/remote-control

# 或简写
/rc

# 指定会话名称
/remote-control My Project
```

### 2.3 从其他设备连接

会话启动后，有三种连接方式：

1. **直接访问 URL**：终端显示的会话 URL，在任意浏览器打开即可
2. **扫描二维码**：手机扫码直接跳转到 Claude App
3. **会话列表查找**：在 claude.ai/code 或 Claude App 中按名称查找，在线的远程会话会显示电脑图标和绿点

**会话名称的优先级**：
1. 你通过 `--name` 或命令参数指定的名称
2. `/rename` 设置的标题
3. 已有对话中最后一条有意义的消息
4. 你发送的第一条提示词

### 2.4 全局启用远程控制

如果希望每次交互式会话都自动开启远程控制：

```bash
# 在 Claude Code 中运行
/config
# 找到 "Enable Remote Control for all sessions" 设为 true
```

设为 `false` 可以关闭此行为。

### 2.5 Remote Control vs Claude Code 网页版

两者都用 claude.ai/code 界面，但本质完全不同：

| 对比项 | Remote Control | Claude Code 网页版 |
|--------|----------------|-------------------|
| 执行位置 | 你的本地电脑 | Anthropic 云端服务器 |
| 文件系统 | 本地完整可用 | 需要从 GitHub 克隆 |
| MCP 服务器 | 本地配置可用 | 云端需重新配置 |
| 工具和项目配置 | 全部继承 | 需要重新设置 |
| 适用场景 | 继续本地工作进行中任务 | 无需本地环境的快速任务 |

---

## 三、连接与安全机制

### 3.1 网络连接原理

Remote Control 采用**出站连接**模式：

- 本地 Claude Code 只发起 HTTPS 出站请求，**不开放任何入站端口**
- 启动时向 Anthropic API 注册，然后轮询等待指令
- 远程设备连接后，服务器通过流式连接在 Web/移动端和本地会话之间路由消息

### 3.2 安全设计

所有流量通过 TLS 加密传输（与普通 Claude Code 会话相同）。连接使用多个短期凭证，每个凭证：
- 仅用于单一用途
- 独立过期时间
- 相互隔离

---

## 四、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 4.1 我遇到的问题

第一次用 Remote Control 时，我遇到了「Remote Control is not yet enabled for your account」的错误。折腾了半天才发现是因为我之前设置了 `DISABLE_TELEMETRY` 环境变量。

### 4.2 我的解决方案

**问题一：账户未启用错误**

```bash
# 检查是否有这些环境变量
env | grep -E "CLAUDE_CODE_DISABLE|DISABLE_TELEMETRY|CLAUDE_CODE_USE_BEDROCK"

# 如果有，临时取消设置
unset DISABLE_TELEMETRY
unset CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC

# 然后重新登录
claude
> /logout
> /login
```

**问题二：组织策略禁用**

如果你是 Team 或 Enterprise 用户，看到「disabled by your organization's policy」：
1. 先运行 `/status` 确认登录方式和订阅类型
2. 确认不是用 API Key 认证（Remote Control 必须用 claude.ai OAuth）
3. 联系管理员在 claude.ai/admin-settings/claude-code 开启 Remote Control 开关

**问题三：凭证获取失败**

```bash
# 使用 verbose 模式查看详细错误
claude remote-control --verbose
```

常见原因：
- 未登录：执行 `/login`
- 网络问题：检查防火墙是否阻止了 443 端口的出站 HTTPS 请求
- 订阅过期：确认订阅状态

### 4.3 我的建议

1. **服务器模式更适合长时间任务**：如果要让 Claude 跑一个耗时任务然后离开，用 `claude remote-control` 比 `claude --rc` 更稳定

2. **注意终端不要关闭**：Remote Control 依赖本地进程，关闭终端会话就结束了

3. **网络中断有 10 分钟容错**：如果网络断开超过约 10 分钟，会话会超时退出，需要重新启动

---

## 五、常见问题

**Q: Remote Control 支持 API Key 认证吗？**

A: 不支持。必须使用 claude.ai 账号登录。如果设置了 `ANTHROPIC_API_KEY` 环境变量，需要先取消设置。

**Q: 可以同时开多个远程会话吗？**

A: 交互模式下每个 Claude Code 实例只支持一个远程会话。如果需要多个并发会话，使用服务器模式配合 `--spawn` 参数。

**Q: 电脑休眠后会话会断吗？**

A: 电脑休眠或网络断开后，恢复上线会自动重连。但如果网络中断超过约 10 分钟，会话会超时。

**Q: Remote Control 和 Dispatch 有什么区别？**

A: Dispatch 是从手机发消息触发任务，Remote Control 是直接操控正在运行的会话。简单说：Dispatch 是「派发任务」，Remote Control 是「远程驾驶」。

---

## 六、小结

Remote Control 让你用手机或浏览器「遥控」本地 Claude Code 会话，会话始终在本地执行，完整保留你的文件系统、MCP 配置和项目设置。三种启动方式中，服务器模式适合长期运行，交互模式适合边用边控。

**下一篇**：[精读官方文档：Channels 消息通道](/ai-tools/official-docs/channels/)

---

*本文精读自 [Continue local sessions from any device with Remote Control](https://docs.anthropic.com/en/docs/claude-code/remote-control)*

*最后更新：2026-03-25*
