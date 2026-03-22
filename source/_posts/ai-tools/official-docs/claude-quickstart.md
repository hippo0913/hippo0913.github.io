---
title: 精读官方文档：快速开始
date: 2026-03-12 20:01:00
updated: 2026-03-12 20:01:00
tags: [Claude Code, AI 工具，官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 3
description: 精读 Claude Code 快速开始文档，从零开始安装配置，跑通第一个任务。
cover: https://picsum.photos/seed/claude-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/quickstart
---

# 精读官方文档：快速开始

> 💬 hippo：这是《Claude Code 官方文档精读》系列的第二篇。快速开始是你装好 Claude Code 后第一个该读的页面——别急着一上来就让 AI 帮你写大功能，先跑通 hello world 建立信心。

---

## 开篇：为什么需要快速开始

很多人装好工具后，要么直接跳进深水区（"帮我重构整个项目"），要么浅尝辄止（"写个 hello world"就没了）。

**快速开始的目的**：让你在 5-10 分钟内，跑通一个**真实但简单**的任务，建立对工具的直觉。

---

## 第一步：安装

官方推荐的安装方式非常简单：

### macOS / Linux / WSL

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

> 💬 hippo：这个脚本会帮你处理好 PATH 配置，装完后直接运行 `claude` 即可。如果报错，99% 是网络问题，换个代理再试。

### 验证安装

```bash
claude --version
```

看到版本号就说明装好了。

---

## 第二步：认证

安装完成后，需要登录你的 Claude 账户：

```bash
claude login
```

这会打开浏览器让你完成 OAuth 认证。

> 💬 hippo：如果你在国内，这一步可能会卡住。确保你的代理能访问 `claude.ai`。认证 token 会保存在 `~/.claude/config.json`，后续请求都用这个 token。

---

## 第三步：跑通第一个任务

官方文档建议从简单的项目开始。让我给你个真实的例子：

### 示例：让 Claude 帮你读代码

```bash
# 进入一个你熟悉的项目
cd ~/your-project

# 启动 Claude Code
claude

# 试试这个提示词：
"帮我看看这个项目的结构，有哪些主要目录和文件"
```

Claude 会读取你的项目，给出类似这样的回答：

```
这是一个 Node.js 项目，结构如下：

- src/ - 主源代码
- tests/ - 单元测试
- docs/ - 文档
- package.json - 依赖配置
- ...

需要我详细解释某个部分吗？
```

> 💬 hippo：第一个任务的目的不是"完成什么"，而是让你感受 Claude 如何理解你的代码库。找个你熟悉的项目，这样你能判断它说的是否准确。

---

## 第四步：尝试一个实际任务

跑通读代码后，试试让它帮你做点小事：

```bash
# 继续在当前项目，试试：
"帮我写一个函数，计算数组中所有数字的平均值"
```

或者更实际一点：

```bash
"在 src/utils/ 目录下创建一个新文件 string.js，包含三个工具函数：
1. capitalize(str) - 首字母大写
2. truncate(str, length) - 截断字符串
3. slugify(str) - 转为 URL 友好的 slug
"
```

> 💬 hippo：从小任务开始，建立对 Claude 能力的直觉。不要一上来就"帮我写个完整的博客系统"——那会让你很难判断输出质量。

---

## 原文精读：关键段落

### 关于安装要求

> 大多数界面需要 Claude 订阅或 Anthropic Console 账户。Terminal CLI 和 VS Code 也支持第三方提供商。

> 💬 hippo：如果你有企业账户或者想用第三方 API 服务（比如某些国内代理），CLI 和 VS Code 是支持的。但桌面应用和网页版必须用官方账户。

### 关于第一个项目

> 建议从一个你熟悉的小项目开始，这样你能快速判断 Claude 的输出是否准确。

> 💬 hippo：这正是我上面建议的——用熟悉的项目做测试，因为你知道正确答案是什么。

---

## 常见问题

### Q: 安装脚本报错 "Connection refused"
A: 网络问题，换代理或改天再试。

### Q: 登录后还是提示 "未认证"
A: 检查 `~/.claude/config.json` 是否存在，权限是否正确（应该是 600）。

### Q: Claude 响应很慢
A: 可能是网络延迟或服务器负载。试试简单任务，如果持续慢，换时段再试。

### Q: 中文回答质量如何？
A: Claude 的中文理解能力很强，但技术术语建议用英文提示词，避免翻译歧义。

---

## 一句话总结

快速开始就是装好、登录、跑通一个小任务——别急，先建立直觉再玩大的。

**下一篇**：[设置 Claude Code](/2026/03/12/ai-tools/official-docs/claude-setup/)，了解配置文件和常用设置。

---

*本文精读自 [Claude Code 官方文档 - 快速开始](https://code.claude.com/docs/zh-CN/quickstart)*
