---
title: 精读官方文档：在 Chrome 中使用 Claude Code（测试版）
date: 2026-03-25 10:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 18
description: Claude Code 可以直接操控你的 Chrome 浏览器，实现 Web 应用测试、表单自动填写、数据抓取等操作。本文精读官方文档，详解浏览器自动化功能的使用方法和常见问题。
cover: https://picsum.photos/seed/claude-chrome-browser/1920/1080
source_url: https://code.claude.com/docs/zh-CN/chrome
---

# 精读官方文档：在 Chrome 中使用 Claude Code（测试版）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 与 **Claude in Chrome 浏览器扩展程序**集成，为您提供从 CLI 或 VS Code 扩展程序进行浏览器自动化的功能。核心价值在于：**你可以在一个对话里完成"写代码 → 浏览器测试 → 修复问题"的完整闭环**，不用在终端和浏览器之间来回切换。

Claude 使用你已登录的浏览器会话，所以它能访问你需要登录的网站（如 Google Docs、Notion、公司内部系统）。浏览器操作在实时可见的 Chrome 窗口中运行。当 Claude 遇到登录页面或验证码（CAPTCHA）时，它会暂停并要求您手动处理。

<!-- more -->

---

## 二、功能能力一览

连接 Chrome 后，您可以在单个工作流中链接浏览器操作和编码任务：

| 能力 | 说明 |
|------|------|
| 实时调试 | 直接读取控制台错误和 DOM 状态，然后修复导致这些错误的代码 |
| 设计验证 | 从 Figma 模型构建 UI，然后在浏览器中打开它以验证它是否匹配 |
| Web 应用测试 | 测试表单验证、检查视觉回归或验证用户流程 |
| 已认证的 Web 应用 | 与 Google Docs、Gmail、Notion 或您已登录的任何应用交互，无需 API 连接器 |
| 数据提取 | 从网页中提取结构化信息并将其保存到本地 |
| 任务自动化 | 自动化重复的浏览器任务，如数据输入、表单填充或多站点工作流 |
| 会话录制 | 将浏览器交互录制为 GIF，以记录或分享发生的情况 |

---

## 三、前置条件

在使用 Claude Code 与 Chrome 之前，您需要：

| 要求 | 说明 |
|------|------|
| 浏览器 | Google Chrome 浏览器 |
| Chrome 扩展 | **Claude in Chrome 扩展程序**版本 1.0.36 或更高版本 |
| Claude Code | 版本 2.0.73 或更高版本 |
| 订阅计划 | 直接 Anthropic 计划（Pro、Max、Team 或 Enterprise） |

**安装扩展：**

从 Chrome Web Store 安装 [Claude in Chrome 扩展](https://chromewebstore.google.com/detail/claude/)

---

## 四、在 CLI 中开始

随时运行 `/chrome` 以检查连接状态、管理权限或重新连接扩展程序。

### 4.1 启用 Chrome 连接

```bash
# 方式一：启动时指定参数
claude --chrome

# 方式二：在会话中使用斜杠命令
/chrome
```

运行 `/chrome` 后会显示以下选项：
- 查看连接状态
- 管理站点权限
- 重新连接扩展
- 设置默认启用

### 4.2 默认启用 Chrome

为了避免每个会话都传递 `--chrome`，运行 `/chrome` 并选择"**默认启用**"。

### 4.3 管理网站权限

网站级权限从 Chrome 扩展程序继承。在 Chrome 扩展程序设置中管理权限，以控制 Claude 可以浏览、点击和输入的网站。

---

## 五、VS Code 中的浏览器自动化

在 VS Code 扩展程序中，只要安装了 Chrome 扩展程序，Chrome 就可用。**无需额外标志**。这比 CLI 更方便，不需要传递 `--chrome` 参数。

---

## 六、示例工作流

这些示例展示了将浏览器操作与编码任务结合的常见方式。运行 `/mcp` 并选择 `claude-in-chrome` 以查看可用浏览器工具的完整列表。

### 6.1 测试本地网络应用

在开发网络应用时，要求 Claude 验证您的更改是否正常工作：

```
I just updated the login form validation. Can you open localhost:3000,
try submitting the form with invalid data, and check if the error
messages appear correctly?
```

Claude 导航到您的本地服务器、与表单交互并报告其观察到的内容。

### 6.2 使用控制台日志进行调试

Claude 可以读取控制台输出以帮助诊断问题。**告诉 Claude 要查找的模式**，而不是要求所有控制台输出，因为日志可能很冗长：

```
Open the dashboard page and check the console for any errors when
the page loads.
```

Claude 读取控制台消息，可以过滤特定模式或错误类型。

### 6.3 自动填充表单

加快重复数据输入任务的速度：

```
I have a spreadsheet of customer contacts in contacts.csv. For each row,
go to the CRM at crm.example.com, click "Add Contact", and fill in the
name, email, and phone fields.
```

Claude 读取您的本地文件、导航网络界面并为每条记录输入数据。

### 6.4 在 Google Docs 中起草内容

使用 Claude 直接在您的文档中写入，无需 API 设置：

```
Draft a project update based on the recent commits and add it to my
Google Doc at docs.google.com/document/d/abc123
```

Claude 打开文档、点击编辑器并输入内容。这适用于您已登录的任何网络应用：Gmail、Notion、Sheets 等。

### 6.5 从网页中提取数据

从网站中提取结构化信息：

```
Go to the product listings page and extract the name, price, and
availability for each item. Save the results as a CSV file.
```

Claude 导航到页面、读取内容并将数据编译成结构化格式。

### 6.6 运行多站点工作流

协调多个网站之间的任务：

```
Check my calendar for meetings tomorrow, then for each meeting with
an external attendee, look up their company website and add a note
about what they do.
```

Claude 跨标签页工作以收集信息并完成工作流。

### 6.7 录制演示 GIF

创建浏览器交互的可共享录制：

```
Record a GIF showing how to complete the checkout flow, from adding
an item to the cart through to the confirmation page.
```

Claude 录制交互序列并将其保存为 GIF 文件。

---

## 七、故障排除

### 7.1 未检测到扩展程序

如果 Claude Code 显示"**未检测到 Chrome 扩展程序**"：

1. 验证 Chrome 扩展程序已安装并在 `chrome://extensions` 中启用
2. 通过运行 `claude --version` 验证 Claude Code 是最新的
3. 检查 Chrome 是否正在运行
4. 运行 `/chrome` 并选择"重新连接扩展程序"以重新建立连接
5. 如果问题仍然存在，请重新启动 Claude Code 和 Chrome

> **重要**：第一次启用 Chrome 集成时，Claude Code 会安装本机消息传递主机配置文件。Chrome 在启动时读取此文件，因此如果扩展程序在您的第一次尝试中未被检测到，**请重新启动 Chrome** 以获取新配置。

### 7.2 检查本机消息传递主机配置文件

如果连接仍然失败，请验证主机配置文件是否存在于：

**Chrome 浏览器：**

```bash
# macOS
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Linux
~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Windows
# 检查 Windows 注册表中的：
# HKCU\Software\Google\Chrome\NativeMessagingHosts\
```

**Edge 浏览器：**

```bash
# macOS
~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Linux
~/.config/microsoft-edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Windows
# 检查 Windows 注册表中的：
# HKCU\Software\Microsoft\Edge\NativeMessagingHosts\
```

### 7.3 浏览器无响应

如果 Claude 的浏览器命令停止工作：

1. **检查是否有模态对话框**（alert、confirm、prompt）阻止页面。JavaScript 对话框阻止浏览器事件并防止 Claude 接收命令。手动关闭对话框，然后告诉 Claude 继续。
2. 要求 Claude 创建新标签页并重试
3. 通过在 `chrome://extensions` 中禁用并重新启用来重新启动 Chrome 扩展程序

### 7.4 长会话期间连接断开

Chrome 扩展程序的 service worker 在扩展会话期间可能会进入空闲状态，这会破坏连接。如果浏览器工具在一段时间不活动后停止工作，请运行 `/chrome` 并选择"**重新连接扩展程序**"。

### 7.5 Windows 特定问题

在 Windows 上，您可能会遇到：

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 命名管道冲突 (EADDRINUSE) | 另一个进程正在使用相同的命名管道 | 重新启动 Claude Code。关闭任何可能使用 Chrome 的其他 Claude Code 会话 |
| 本机消息传递主机错误 | 本机消息传递主机在启动时崩溃 | 尝试重新安装 Claude Code 以重新生成主机配置 |

### 7.6 常见错误消息

这些是最常见的错误及其解决方法：

| 错误 | 原因 | 修复 |
|------|------|------|
| "浏览器扩展程序未连接" | 本机消息传递主机无法到达扩展程序 | 重新启动 Chrome 和 Claude Code，然后运行 `/chrome` 以重新连接 |
| "未检测到扩展程序" | Chrome 扩展程序未安装或已禁用 | 在 `chrome://extensions` 中安装或启用扩展程序 |
| "没有可用的标签页" | Claude 在标签页准备好之前尝试操作 | 要求 Claude 创建新标签页并重试 |
| "接收端不存在" | 扩展程序 service worker 进入空闲状态 | 运行 `/chrome` 并选择"重新连接扩展程序" |

---

## 八、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 8.1 首次启用时扩展检测不到

第一次运行 `/chrome` 时，显示 "Extension not detected"。我确认扩展已安装且已启用，但就是连不上。

**解决方案**：安装扩展后，**一定要完全退出 Chrome 再重新打开**。macOS 用 Cmd+Q 完全退出，Windows/Linux 用 Ctrl+Shift+Q 或从菜单退出。

### 8.2 长时间会话后连接中断

有时候我用 Claude Code 写了半天代码，突然想让它打开浏览器测试一下，结果发现浏览器命令完全没反应。

**解决方案**：Chrome 扩展的 Service Worker 会在长时间不活动后进入空闲状态，导致连接断开。每次要用浏览器功能之前，先执行 `/chrome` 检查连接状态。

### 8.3 被 JavaScript 弹窗卡住

Claude 在操作网页时遇到了 `alert()` 弹窗，然后整个流程就卡住了。

**解决方案**：JavaScript 的 `alert()`、`confirm()`、`prompt()` 弹窗会阻塞浏览器事件，Claude 无法操作。手动关闭弹窗，然后告诉 Claude "继续"。

### 8.4 使用建议

1. **站点权限要提前配置**：在 Chrome 扩展设置中管理 Claude 可以访问哪些站点，避免每次都要授权。
2. **控制台日志要指定筛选条件**：不要让 Claude 返回所有控制台输出，日志可能非常冗长。应该指定要查找的模式或错误类型。
3. **复杂表单分步操作**：如果表单字段很多，建议让 Claude 一步一步来，而不是一次完成所有操作。
4. **录制 GIF 时注意时长**：太长的操作流程会导致 GIF 文件过大，建议分段录制。

---

## 九、常见问题

**Q: Claude 能操作我已登录的网站吗？**

A: 可以。Claude 使用你浏览器中已有的登录状态，所以它能访问 Google Docs、Gmail、Notion 等任何你已经登录的网站，无需额外的 API 配置。

**Q: Claude 遇到验证码会怎么办？**

A: Claude 会暂停操作并提示你手动处理。处理完成后告诉它继续即可。

**Q: 浏览器操作是可见的吗？**

A: 是的，Claude 的浏览器操作会在可见的 Chrome 窗口中实时执行，你可以看到整个过程。

**Q: 如何查看 Claude Code 有哪些浏览器工具可用？**

A: 运行 `/mcp` 并选择 `claude-in-chrome`，可以查看完整的浏览器工具列表。

---

## 十、小结

Claude Code 的 Chrome 集成让你在一个对话中就能完成"编码 → 测试 → 修复"的完整流程，特别适合 Web 开发者。关键是确保扩展版本和 Claude Code 版本都满足要求，遇到连接问题时优先尝试重启浏览器或重新连接扩展。

**下一篇**：[精读官方文档：VS Code 扩展](/2026/03/19/ai-tools/official-docs/vs-code/)

---

## 另请参阅

- [在 VS Code 中使用 Claude Code](https://code.claude.com/docs/zh-CN/vscode) - VS Code 扩展程序中的浏览器自动化
- [CLI 参考](https://code.claude.com/docs/zh-CN/cli-reference) - 命令行标志，包括 `--chrome`
- [常见工作流](https://code.claude.com/docs/zh-CN/common-workflows) - 更多使用 Claude Code 的方式
- [数据和隐私](https://code.claude.com/docs/zh-CN/data-and-privacy) - Claude Code 如何处理您的数据
- [Claude in Chrome 入门](https://support.anthropic.com/zh-CN/articles/claude-in-chrome) - Chrome 扩展程序的完整文档，包括快捷键、计划和权限

---

*本文精读自 [在 Chrome 中使用 Claude Code（测试版）](https://code.claude.com/docs/zh-CN/chrome)*

*最后更新：2026-03-27*
