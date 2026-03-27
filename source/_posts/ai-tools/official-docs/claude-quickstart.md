---
title: 精读官方文档：快速开始
date: 2026-03-28 23:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
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

## 开始前的准备

官方文档列出了三个必要条件：

1. **打开的终端或命令提示符** - 如果你之前从未使用过终端，可以查看终端指南
2. **一个可以使用的代码项目** - 建议是你熟悉的小项目
3. **一个 Claude 账户** - 支持以下类型：
   - Claude Pro、Max、Teams 或 Enterprise（推荐）
   - Claude Console（具有预付费额度的 API 访问）
   - Amazon Bedrock、Google Vertex AI 或 Microsoft Foundry（企业云提供商）

---

## 第一步：安装

官方提供了多种安装方式：

### 方式一：原生安装（推荐）

**macOS / Linux / WSL：**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell：**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD：**

```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

> ⚠️ Windows 需要先安装 Git for Windows。

### 方式二：包管理器安装

**Homebrew（macOS）：**

```bash
brew install --cask claude-code
```

**WinGet（Windows）：**

```bash
winget install Anthropic.ClaudeCode
```

> 💬 hippo：推荐用原生安装方式，这是官方首推的方法。如果报错，99% 是网络问题，换个代理再试。

### 验证安装

```bash
claude --version
```

看到版本号就说明装好了。

---

## 第二步：登录账户

Claude Code 需要账户才能使用。当使用 `claude` 命令启动交互式会话时，需要完成登录。

### 支持的账户类型

| 账户类型 | 说明 |
| --- | --- |
| Claude Pro / Max / Teams / Enterprise | 推荐方式，最完整的功能支持 |
| Claude Console | 具有预付费额度的 API 访问，首次登录时会自动创建"Claude Code"工作区用于集中成本跟踪 |
| Amazon Bedrock | 企业云提供商，适合已有 AWS 基础设施的企业 |
| Google Vertex AI | 企业云提供商，适合已有 GCP 基础设施的企业 |
| Microsoft Foundry | 企业云提供商，适合已有 Azure 基础设施的企业 |

登录后，凭证将被存储，无需再次登录。如需切换账户，使用 `/login` 命令。

> 💬 hippo：如果你在国内，登录步骤可能会卡住。确保你的代理能访问 `claude.ai`。认证 token 会保存在 `~/.claude/config.json`。

---

## 第三步：启动第一个会话

在任何项目目录中打开终端并启动 Claude Code：

```bash
cd /path/to/your/project
claude
```

你会看到 Claude Code 欢迎屏幕，包含：
- 会话信息
- 最近的对话
- 最新更新

输入 `/help` 查看可用命令，或输入 `/resume` 继续之前的对话。

---

## 第四步：提出第一个问题

让我们从理解代码库开始。尝试以下命令：

```bash
"这个项目是做什么的？主要结构是什么？"
```

Claude 会读取你的项目，给出类似这样的回答：

```
这是一个 Node.js 项目，结构如下：

- src/ - 主源代码
- tests/ - 单元测试
- docs/ - 文档
- package.json - 依赖配置

需要我详细解释某个部分吗？
```

你也可以提出更具体的问题：

```bash
"解释一下 src/auth/ 目录下的认证逻辑"
```

甚至询问 Claude 关于其自身功能：

```bash
"我如何在 Claude Code 中创建自定义 skills？"
"Claude Code 可以与 Docker 一起工作吗？"
```

---

## 第五步：进行第一次代码更改

现在让 Claude Code 进行实际的编码。尝试一个简单的任务：

```bash
"帮我写一个函数，计算数组中所有数字的平均值"
```

Claude Code 将：

1. 找到适当的文件
2. 向你显示建议的更改
3. 请求你的批准
4. 进行编辑

---

## 第六步：在 Claude Code 中使用 Git

Claude Code 使 Git 操作变得对话式：

```bash
"创建一个 Git 提交"
```

你也可以提示更复杂的 Git 操作：

```bash
"创建一个名为 feature/quickstart 的新分支"
```

---

## 第七步：修复错误或添加功能

Claude 擅长调试和功能实现。用自然语言描述你想要的内容：

```bash
"添加一个用户登录功能"
```

或修复现有问题：

```bash
"修复测试失败的错误"
```

Claude Code 将：
- 定位相关代码
- 理解上下文
- 实现解决方案
- 如果可用，运行测试

---

## 其他常见工作流

官方文档还列出了多种工作方式：

### 重构代码

```bash
"重构身份验证模块以使用 async/await 而不是回调"
```

### 编写测试

```bash
"为 src/utils/ 目录下的工具函数编写单元测试"
```

### 更新文档

```bash
"更新 README.md，添加新功能的说明"
```

### 代码审查

```bash
"审查最近的 Git 变更，提出改进建议"
```

---

## 基本命令速查表

以下是日常使用中最重要的命令：

| 命令 | 功能 | 示例 |
| --- | --- | --- |
| `claude` | 启动交互模式 | `claude` |
| `claude "task"` | 运行一次性任务 | `claude "fix the build error"` |
| `claude -p "query"` | 运行一次性查询，然后退出 | `claude -p "explain this function"` |
| `claude -c` | 在当前目录中继续最近的对话 | `claude -c` |
| `claude -r` | 恢复之前的对话 | `claude -r` |
| `claude commit` | 创建 Git 提交 | `claude commit` |
| `/clear` | 清除对话历史 | `/clear` |
| `/help` | 显示可用命令 | `/help` |
| `exit` 或 Ctrl+C | 退出 Claude Code | `exit` |

> 💬 hippo：这个表格建议收藏。`claude -p` 特别适合快速查询，不用进入交互模式；`claude commit` 比手动写 commit message 方便很多。

---

## 初学者专业提示

官方文档给初学者几个重要建议：

1. **从小任务开始** - 不要一上来就让 AI 做复杂的事情，先建立直觉
2. **用熟悉的项目练习** - 这样你能快速判断输出是否准确
3. **善用 `/help`** - 遇到不确定的命令，直接问 Claude

更多技巧请参阅最佳实践和常见工作流文档。

---

## 接下来呢？

现在你已经学习了基础知识，可以探索更多高级功能：

- **[交互模式](/2026/03/27/ai-tools/official-docs/claude-interactive-mode/)** - 深入了解对话式编程
- **[常见工作流](/2026/03/27/ai-tools/official-docs/claude-workflows/)** - 学习更多实用场景
- **[CLI 参考](/2026/03/27/ai-tools/official-docs/claude-cli/)** - 查看完整命令列表
- **[最佳实践](/2026/03/27/ai-tools/official-docs/claude-best-practices/)** - 提高 Claude Code 使用效率

---

## 获取帮助

- **在 Claude Code 中**：输入 `/help` 或询问「我如何…」
- **文档**：浏览官方文档的其他指南
- **社区**：加入 Discord 获取提示和支持

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

### Q: 可以用企业云账户吗？
A: 可以。支持 Amazon Bedrock、Google Vertex AI 和 Microsoft Foundry。

---

## 一句话总结

快速开始就是装好、登录、跑通一个小任务——别急，先建立直觉再玩大的。

**下一篇**：[精读官方文档：设置 Claude Code](/2026/03/27/ai-tools/official-docs/claude-setup/)，了解配置文件和常用设置。

---

*本文精读自 [Claude Code 官方文档 - 快速开始](https://code.claude.com/docs/zh-CN/quickstart)*
