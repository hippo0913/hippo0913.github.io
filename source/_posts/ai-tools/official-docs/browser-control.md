---
title: 精读官方文档：在 Chrome 中使用 Claude Code（测试版）
date: 2026-03-25 10:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 工具集成]
categories: [AI 工具系列]
series: claude-code
series_index: 18
description: Claude Code 通过 Chrome 扩展实现浏览器自动化，共享登录状态无需 API，操作实时可见。本文精读官方文档，详解启用方法、典型场景和故障排除。
cover: https://picsum.photos/seed/claude-chrome-browser/1920/1080
source_url: https://code.claude.com/docs/zh-CN/chrome
---

# 精读官方文档：在 Chrome 中使用 Claude Code（测试版）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 通过 **Claude in Chrome 浏览器扩展**与 Chrome 集成，让你直接操控浏览器——打开页面、填写表单、点击按钮、读取控制台日志，全都在 Claude Code 对话中完成。核心机制是 **Native Messaging Host**（一种让桌面应用与浏览器扩展通信的标准协议），Claude Code 装一个配置文件，Chrome 扩展就能找到它。

两个杀手级优势：第一，**共享浏览器已有的登录状态**，你登了 Google Docs、Gmail、Notion，Claude 直接就能操作，不需要配 API 密钥；第二，**所有操作在可见的 Chrome 窗口中实时执行**，你能亲眼看到它在干什么。遇到验证码或登录页，Claude 会暂停等你手动处理，不会乱来。

<!-- more -->

---

## 二、官方教程精读

### 2.1 前置条件与快速启动

先确认版本要求，不满足的话连扩展都检测不到：

| 要求 | 最低版本 |
|------|---------|
| Chrome 扩展（Claude in Chrome） | 1.0.36 |
| Claude Code | 2.0.73 |
| 订阅计划 | Pro / Max / Team / Enterprise（直接 Anthropic 计划） |

从 [Chrome Web Store](https://chromewebstore.google.com/detail/claude/) 安装扩展后，有两种方式启用连接：

```bash
# 方式一：启动时加参数
claude --chrome

# 方式二：在会话中随时连接
/chrome
# 选项：查看连接状态 | 管理站点权限 | 重新连接扩展 | 设置默认启用
```

如果不想每次都加 `--chrome`，运行 `/chrome` 选择"默认启用"即可。站点权限从 Chrome 扩展设置中继承，控制 Claude 可以浏览、点击和输入的网站范围——建议提前把常用站点配好。

### 2.2 三个最实用的场景

官方文档列了 7 个工作流，我挑出 3 个最有价值的，附上可直接使用的提示词模板。

**场景一：本地 Web 应用测试**

写完代码直接让 Claude 帮你验证，不用自己打开浏览器点来点去：

```
打开 localhost:3000，提交表单时不填任何数据，检查错误提示是否正确显示。
然后填入无效邮箱格式再提交一次，看验证是否生效。
```

Claude 会导航到本地服务器、操作表单、然后告诉你看到的结果。如果控制台有报错，它还能直接读日志帮你定位问题。

**场景二：控制台日志调试**

注意：**一定要告诉 Claude 查什么模式**，不要说"帮我看看控制台"，日志可能几千行。指定筛选条件才能拿到有用的信息：

```
打开 dashboard 页面，检查页面加载时控制台是否有与 "Auth" 相关的错误。
只关注红色的 error 级别日志，忽略 warning。
```

Claude 能读取控制台消息并按你指定的模式过滤，比你自己翻日志效率高得多。

**场景三：操作已登录的 Web 应用**

这是最让我惊喜的功能——直接在 Google Docs 里写内容、在 Notion 里更新文档，不需要任何 API 配置：

```
根据最近的 git commit 记录，写一份项目周报，然后添加到我的 Google Doc：
docs.google.com/document/d/abc123
```

Claude 打开文档、点击编辑区域、输入内容，全程你看着它操作。Gmail、Notion、Sheets 都可以，前提是你已经在浏览器里登录了。

### 2.3 VS Code 中的差异

在 VS Code 中使用更简单：**装好 Chrome 扩展就行，不需要 `--chrome` 参数**。VS Code 扩展会自动检测 Chrome 扩展并建立连接。想看有哪些浏览器工具可用，运行 `/mcp` 选择 `claude-in-chrome` 查看完整工具列表。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 连接问题排查

我遇到最多的问题就是连不上 Chrome，整理了一个排查流程：

1. **首次启用检测不到扩展**：Claude Code 首次连接时会安装 Native Messaging Host 配置文件，但 Chrome 只有启动时才读取这个配置。所以装完扩展后必须**完全退出 Chrome 再重新打开**（macOS 用 Cmd+Q，不是关窗口）。
2. **长会话后断连**：Chrome 扩展的 Service Worker（后台运行的服务脚本）长时间空闲会自动休眠。每次要用浏览器功能前，先跑 `/chrome` 检查状态，断连了就选"重新连接"。

检查 Native Messaging Host 配置文件是否存在：

```bash
# macOS
ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Linux
ls ~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json
```

文件不存在说明 Claude Code 安装过程有问题，重新运行一次 `claude --chrome` 即可生成。

### 3.2 JavaScript 弹窗卡死

Claude 操作页面时如果触发了 `alert()`、`confirm()` 或 `prompt()` 弹窗，整个流程会卡住——因为这三个方法是**同步阻塞的**，它们会暂停浏览器的事件循环，Claude 发出的操作指令全部无法送达。

解决办法：手动关掉弹窗，然后告诉 Claude "继续"。如果你的页面有很多弹窗，建议先在代码里临时注释掉，测完再恢复。

### 3.3 我的建议

1. **站点权限提前配**：在 Chrome 扩展设置里把常用站点加到允许列表，避免每次操作都要授权确认。
2. **控制台日志指定筛选条件**：别说"帮我看看控制台"，要说"只看 error 级别、包含 Auth 关键字的日志"。
3. **复杂表单分步操作**：字段多的表单，让 Claude 分步填写（先填基本信息，再填地址，最后填备注），一次完成容易出错。

---

## 四、故障排除速查表

| 错误消息 | 原因 | 修复方案 |
|------|------|---------|
| "浏览器扩展程序未连接" | Native Messaging Host 无法到达扩展 | 重启 Chrome 和 Claude Code，运行 `/chrome` 重新连接 |
| "未检测到扩展程序" | 扩展未安装/未启用，或首次启用未重启 Chrome | 在 `chrome://extensions` 确认启用；首次安装后重启 Chrome |
| "没有可用的标签页" | Claude 在标签页准备好之前就尝试操作 | 让 Claude 创建新标签页再重试 |
| "接收端不存在" | 扩展 Service Worker 进入空闲状态 | 运行 `/chrome` 选择"重新连接扩展" |
| 命名管道冲突 (EADDRINUSE) | Windows 上另一个进程占用管道（仅 Windows） | 重启 Claude Code，关闭其他使用 Chrome 的 Claude Code 会话 |
| Native Messaging Host 崩溃 | 主机配置损坏（仅 Windows） | 重新安装 Claude Code 重新生成主机配置 |

---

## 五、常见问题

**Q: 能操作我已登录的网站吗？**

A: 能。Claude 共享浏览器已有的登录状态，Google Docs、Gmail、Notion、公司内网，只要你在浏览器里登了就能操作。

**Q: 遇到验证码怎么办？**

A: Claude 会暂停操作等你手动处理验证码或登录页，处理完告诉它继续就行。

**Q: 操作是实时可见的吗？**

A: 是的，所有操作在你可见的 Chrome 窗口中实时执行，你能看到每一步。

**Q: 怎么查看有哪些浏览器工具？**

A: 运行 `/mcp` 选择 `claude-in-chrome`，能看到导航、点击、输入、截图、录制等完整工具列表。

---

## 六、小结

Chrome 集成让 Claude Code 从"终端里的编程助手"升级为"能看到屏幕的全栈助手"，Web 开发的"编码 → 测试 → 修复"闭环终于在一个对话里完成了。关键是确保版本达标、首次启用后重启 Chrome、长时间不用后记得重新连接。

**下一篇**：[精读官方文档：VS Code 扩展](/2026/03/19/ai-tools/official-docs/vs-code/)

---

*本文精读自 [在 Chrome 中使用 Claude Code（测试版）](https://code.claude.com/docs/zh-CN/chrome)*

*最后更新：2026-03-31*
