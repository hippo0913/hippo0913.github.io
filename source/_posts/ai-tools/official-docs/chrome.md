---
title: 精读官方文档：在 Chrome 中使用 Claude Code（测试版）
date: 2026-03-25 10:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 18
description: Claude Code 可以直接操控你的 Chrome 浏览器，实现 Web 应用测试、表单自动填写、数据抓取等操作。本文精读官方文档，详解浏览器自动化功能的使用方法和常见问题。
cover: https://picsum.photos/seed/claude-chrome-browser/1920/1080
source_url: https://code.claude.com/docs/en/chrome
---

# 精读官方文档：在 Chrome 中使用 Claude Code（测试版）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 可以直接操控你的 Chrome 浏览器，这就像是给 Claude Code 装上了"眼睛"和"双手"——它能打开网页、点击按钮、填写表单、读取控制台日志，甚至还能录制操作过程生成 GIF。

核心价值在于：**你可以在一个对话里完成"写代码 → 浏览器测试 → 修复问题"的完整闭环**，不用在终端和浏览器之间来回切换。Claude 使用你已登录的浏览器会话，所以它能访问你需要登录的网站（如 Google Docs、Notion、公司内部系统）。

<!-- more -->

---

## 二、官方教程精读

### 2.1 功能能力一览

连接 Chrome 后，Claude Code 可以执行以下操作：

| 能力 | 说明 |
|------|------|
| 实时调试 | 读取控制台错误和 DOM 状态，直接修复问题代码 |
| 设计验证 | 根据 Figma 设计稿构建 UI，然后在浏览器中验证效果 |
| Web 应用测试 | 测试表单验证、检查视觉回归、验证用户流程 |
| 认证应用交互 | 操作 Google Docs、Gmail、Notion 等需要登录的应用 |
| 数据提取 | 从网页抓取结构化信息并保存到本地 |
| 任务自动化 | 自动填写表单、批量数据录入、跨站点工作流 |
| 会话录制 | 将浏览器操作录制成 GIF 用于文档或分享 |

### 2.2 环境要求

使用前需要满足以下条件：

| 要求 | 说明 |
|------|------|
| 浏览器 | Google Chrome 或 Microsoft Edge |
| Chrome 扩展 | Claude in Chrome 扩展版本 1.0.36 或更高 |
| Claude Code | 版本 2.0.73 或更高 |
| 订阅计划 | Anthropic 直接订阅（Pro、Max、Teams 或 Enterprise） |

**安装扩展：**

从 Chrome Web Store 安装 [Claude in Chrome 扩展](https://chromewebstore.google.com/detail/claude/)

### 2.3 基本使用方法

**CLI 中启用 Chrome 连接：**

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

**设置默认启用（避免每次传参）：**

```bash
# 在 Claude Code 会话中执行
/chrome
# 然后选择 "Enabled by default"
```

### 2.4 典型工作流示例

**示例一：测试本地 Web 应用**

```
我刚刚更新了登录表单的验证逻辑。请打开 localhost:3000，
尝试用无效数据提交表单，检查错误消息是否正确显示。
```

Claude 会导航到你的本地服务器，与表单交互，并报告观察结果。

**示例二：通过控制台日志调试**

```
打开仪表板页面，检查页面加载时控制台是否有错误。
```

Claude 会读取控制台消息，可以按特定模式或错误类型筛选。

**示例三：自动填写表单**

```
我有一个客户联系人的 CSV 文件 contacts.csv。
对于每一行数据，请访问 crm.example.com，点击"添加联系人"，
填写姓名、邮箱和电话字段。
```

Claude 会读取本地文件、导航 Web 界面、为每条记录录入数据。

**示例四：在 Google Docs 中起草内容**

```
根据最近的 Git 提交记录起草一份项目更新，并添加到我的 Google Doc：
docs.google.com/document/d/abc123
```

Claude 会打开文档、点击编辑器、输入内容。这同样适用于 Gmail、Notion、Sheets 等任何你已登录的 Web 应用。

**示例五：录制演示 GIF**

```
录制一个 GIF，展示完整的结账流程：从添加商品到购物车，
直到确认页面。
```

Claude 会录制交互过程并保存为 GIF 文件。

### 2.5 故障排除：常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| "Browser extension is not connected" | 原生消息主机无法连接扩展 | 重启 Chrome 和 Claude Code，然后运行 `/chrome` 重新连接 |
| "Extension not detected" | Chrome 扩展未安装或已禁用 | 在 `chrome://extensions` 中安装或启用扩展 |
| "No tab available" | Claude 在标签页准备好之前就尝试操作 | 让 Claude 创建新标签页后重试 |
| "Receiving end does not exist" | 扩展 Service Worker 进入空闲状态 | 运行 `/chrome` 选择 "Reconnect extension" |

### 2.6 原生消息主机配置文件位置

如果连接持续失败，检查以下配置文件是否存在：

**Chrome 浏览器：**

```bash
# macOS
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Linux
~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Windows
# 检查注册表项：
# HKCU\Software\Google\Chrome\NativeMessagingHosts\
```

**Edge 浏览器：**

```bash
# macOS
~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Linux
~/.config/microsoft-edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json

# Windows
# 检查注册表项：
# HKCU\Software\Microsoft\Edge\NativeMessagingHosts\
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

**问题一：首次启用时扩展检测不到**

第一次运行 `/chrome` 时，显示 "Extension not detected"。我确认扩展已安装且已启用，但就是连不上。

**问题二：长时间会话后连接中断**

有时候我用 Claude Code 写了半天代码，突然想让它打开浏览器测试一下，结果发现浏览器命令完全没反应。

**问题三：被 JavaScript 弹窗卡住**

Claude 在操作网页时遇到了 `alert()` 弹窗，然后整个流程就卡住了。

### 3.2 我的解决方案

**解决方案一：重启浏览器**

首次启用时，Claude Code 会在本地安装一个原生消息主机配置文件，但 Chrome 只在启动时读取这个文件。所以：

```bash
# 安装扩展后，一定要完全退出 Chrome 再重新打开
# macOS: Cmd+Q 完全退出
# Windows/Linux: Ctrl+Shift+Q 或从菜单退出
```

**解决方案二：定期重连**

Chrome 扩展的 Service Worker 会在长时间不活动后进入空闲状态，导致连接断开。解决方法：

```bash
# 在 Claude Code 会话中执行
/chrome
# 选择 "Reconnect extension"
```

我现在的习惯是：每次要用浏览器功能之前，先执行一次 `/chrome` 检查连接状态。

**解决方案三：手动处理弹窗**

JavaScript 的 `alert()`、`confirm()`、`prompt()` 弹窗会阻塞浏览器事件，Claude 无法操作。处理方式：

1. 手动关闭弹窗
2. 告诉 Claude "继续"

### 3.3 我的建议

1. **站点权限要提前配置**：在 Chrome 扩展设置中管理 Claude 可以访问哪些站点，避免每次都要授权。

2. **控制台日志要指定筛选条件**：不要让 Claude 返回所有控制台输出，日志可能非常冗长。应该指定要查找的模式或错误类型。

3. **复杂表单分步操作**：如果表单字段很多，建议让 Claude 一步一步来，而不是一次完成所有操作，这样出错更容易定位。

4. **录制 GIF 时注意时长**：太长的操作流程会导致 GIF 文件过大，建议分段录制。

---

## 四、常见问题

**Q: Claude 能操作我已登录的网站吗？**

A: 可以。Claude 使用你浏览器中已有的登录状态，所以它能访问 Google Docs、Gmail、Notion 等任何你已经登录的网站，无需额外的 API 配置。

**Q: Claude 遇到验证码会怎么办？**

A: Claude 会暂停操作并提示你手动处理。处理完成后告诉它继续即可。

**Q: Windows 上遇到 "EADDRINUSE" 错误怎么办？**

A: 这表示有其他进程占用了命名管道。解决方法：
1. 重启 Claude Code
2. 关闭其他可能使用 Chrome 的 Claude Code 会话

**Q: 浏览器操作是可见的吗？**

A: 是的，Claude 的浏览器操作会在可见的 Chrome 窗口中实时执行，你可以看到整个过程。

**Q: 如何查看 Claude Code 有哪些浏览器工具可用？**

A: 运行 `/mcp` 并选择 `claude-in-chrome`，可以查看完整的浏览器工具列表。

---

## 五、小结

Claude Code 的 Chrome 集成让你在一个对话中就能完成"编码 → 测试 → 修复"的完整流程，特别适合 Web 开发者。关键是确保扩展版本和 Claude Code 版本都满足要求，遇到连接问题时优先尝试重启浏览器或重新连接扩展。

**下一篇**：[精读官方文档：VS Code 扩展中的浏览器自动化](./vscode-browser)

---

*本文精读自 [Use Claude Code with Chrome (beta)](https://code.claude.com/docs/en/chrome)*

*最后更新：2026-03-25*
