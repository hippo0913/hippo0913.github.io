---
title: 精读官方文档：快速开始
date: 2026-03-12 20:01:00
updated: 2026-03-22 14:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 3
description: 精读 Claude Code 快速开始文档，从零开始安装配置，跑通第一个真实任务。
cover: https://picsum.photos/seed/claude-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/quickstart
---

# 精读官方文档：快速开始

> 💬 hippo：这是《Claude Code 官方文档精读》系列的第 3 篇。快速开始是你装好 Claude Code 后第一个该读的页面——别急着让它帮你写大功能，先跑通 hello world 建立信心。

---

## 开篇：为什么需要快速开始

很多人装好工具后，要么直接跳进深水区（"帮我重构整个项目"），要么浅尝辄止（"写个 hello world"就没了）。

**快速开始的目的**：让你在 5-10 分钟内，跑通一个**真实但简单**的任务，建立对工具的直觉。

<!-- more -->

---

## 前置准备：你有什么

官方文档明确了开始前的三个要求：

### 1. 终端或命令提示符

- 如果你之前从未使用过终端，可以查看系统自带的终端应用
- Windows 用户：PowerShell、CMD 或 Git Bash
- macOS/Linux 用户：Terminal、iTerm 等

> 💬 hippo：如果你对终端不熟悉，不用担心。Claude Code 的核心使用只需要几个简单命令，用几次就熟了。

### 2. 要处理的代码项目

- 任何真实的项目都可以，建议先用你熟悉的小项目
- 项目不必太大，但要有一定复杂度，能展示 Claude 的能力

### 3. Claude 账户

**支持的账户类型**：

| 账户类型 | 适用场景 | 推荐度 |
|-----------|---------|--------|
| Claude Pro / Max | 个人日常使用 | ⭐⭐⭐⭐⭐ |
| Claude Console | API 开发者 | ⭐⭐⭐ |
| Claude Teams / Enterprise | 团队协作 | ⭐⭐⭐⭐⭐⭐ |
| Amazon Bedrock | 企业云集成 | ⭐⭐⭐ |
| Google Vertex AI | 企业云集成 | ⭐⭐⭐ |
| Microsoft Foundry | 企业云集成 | ⭐⭐⭐ |

> 💬 hippo：如果你只是个人使用，强烈推荐用 Pro 或 Max。一个账户搞定所有平台，计费透明，功能完整。

---

## 实战指南：8 步跑通第一个任务

### 步骤 1：安装 Claude Code

**推荐方式：官方原生安装脚本**

**macOS、Linux、WSL**：
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell**：
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD**：
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

> 💬 hippo：注意这里的关键参数。
> `-f` 表示跟随重定向（处理 301/302 跳转）
> `-sS` 表示在失败时静默输出，不显示进度条
> `-L` 表示支持 HTTPS
> `| bash` 表示下载后直接用 bash 执行
> Windows CMD 的两步命令：先下载脚本，再执行，最后删除脚本文件

**验证安装**：
```bash
claude --version
```
看到版本号说明安装成功。

> 💬 hippo：如果安装时报错，90% 是网络问题。检查你的代理设置，或者换个网络环境再试。

---

### 步骤 2：登录你的账户

**启动登录流程**：
```bash
claude login
```

这会打开浏览器让你完成 OAuth 认证。

> 💬 hippo：如果你在国内，这一步可能会卡住。确保你的代理能访问 `claude.ai`。
> 认证完成后，token 会保存在 `~/.claude/config.json`，后续请求都用这个 token，无需重复登录。

**切换账户**：
如果你需要切换到另一个账户：
```bash
claude login
```
会重新打开浏览器让你选择新的账户。

---

### 步骤 3：启动你的第一个会话

**进入项目并启动**：
```bash
cd /path/to/your/project
claude
```

你会看到 Claude Code 欢迎屏幕，包含：
- 会话信息（当前目录、分支等）
- 最近的对话
- 最新更新

**有用的命令**：
- `/help` - 显示所有可用命令
- `/resume` - 继续之前的对话
- `/clear` - 清除对话历史

---

### 步骤 4：提出你的第一个问题

让我们从了解你的代码库开始：

**示例 1：探索项目结构**
```
帮我看看这个项目的结构，有哪些主要目录和文件？
```

Claude 会读取你的文件，给出类似这样的回答：
```
这是一个 Node.js 项目，结构如下：

- src/ - 主源代码
- tests/ - 单元测试
- docs/ - 文档
- package.json - 依赖配置
- ...

需要我详细解释某个部分吗？
```

**示例 2：询问关于 Claude Code 自身**
```
我如何在 Claude Code 中创建自定义 skills？
```

```
Claude Code 能与 Docker 一起工作吗？
```

> 💬 hippo：第一个任务的目的不是"完成什么"，而是让你感受 Claude 如何理解你的代码库。
> 找个你熟悉的项目，这样你能判断它说的是否准确。

---

### 步骤 5：进行你的第一次代码更改

现在让我们让 Claude Code 进行一些实际的编码：

**示例：写个简单函数**
```
帮我写一个函数，计算数组中所有数字的平均值
```

Claude Code 会：
1. 找到合适的文件（比如创建新文件或修改现有文件）
2. 向你显示建议的更改
3. 请求你的批准
4. 进行编辑

> 💬 hippo：从小任务开始，建立对 Claude 能力的直觉。
> 不要一上来就"帮我写个完整的博客系统"——那会让你很难判断输出质量。

---

### 步骤 6：在 Claude Code 中使用 Git

Claude Code 使 Git 操作变得对话式：

**查看当前状态**：
```
git status
```

**提交更改**：
```bash
claude commit
```

Claude 会：
1. 分析当前更改
2. 生成提交信息
3. 请求你确认
4. 执行提交

**更复杂的 Git 操作**：
```
创建一个名为 feature/quickstart 的新分支
```

```
查看最近 5 个提交
```

```
撤销最近的更改
```

> 💬 hippo：这是我很喜欢的功能。
> 以前需要自己写 git commit 信息、自己记要改了哪些文件，现在直接让 Claude Code 处理，省心多了。

---

### 步骤 7：修复错误或添加功能

Claude 擅长调试和功能实现。

**修复现有问题**：
```
登录接口返回 500 错误，帮我调试一下
```

Claude Code 会：
1. 定位相关代码
2. 理解上下文
3. 实现解决方案
4. 如果可用，运行测试

**添加新功能**：
```
在用户资料页面添加手机号验证功能
```

> 💬 hippo：关键是"描述问题，不是描述解决方案"。
> 让 Claude 自己找代码、自己想方案，你只负责把关和确认。

---

### 步骤 8：尝试其他常见工作流

有多种方式可以与 Claude 一起工作：

**重构代码**：
```
重构身份验证模块以使用 async/await 而不是回调
```

**编写测试**：
```
为支付模块编写单元测试
```

**更新文档**：
```
更新 API 文档，说明新的限流策略
```

**代码审查**：
```
审查 PR #123，检查是否有安全问题
```

---

## 基本命令速查表

以下是日常使用中最重要的命令：

| 命令 | 功能 | 示例 |
|------|------|------|
| `claude` | 启动交互模式 | `claude` |
| `claude "task"` | 运行一次性任务 | `claude "fix build error"` |
| `claude -p "query"` | 运行一次性查询，然后退出 | `claude -p "explain this function"` |
| `claude -c` | 在当前目录中继续最近的对话 | `claude -c` |
| `claude -r` | 恢复之前的对话 | `claude -r` |
| `claude commit` | 创建 Git 提交 | `claude commit` |
| `/clear` | 清除对话历史 | `/clear` |
| `/help` | 显示可用命令 | `/help` |
| `exit` 或 Ctrl+C | 退出 Claude Code | `exit` |

> 💬 hippo：这几个命令用得最多，记下来能省很多时间。

---

## hippo 的踩坑实录

### 坑点 1：国内网络导致安装失败

**表现**：
```bash
curl -fsSL https://claude.ai/install.sh | bash
# 报错：Connection refused 或 timeout
```

**原因**：
网络问题，无法访问 `claude.ai` 域名。

**解决**：
1. 配置系统代理或使用 VPN
2. 换个时间段再试（某些时段网络较稳定）
3. 或者使用备用安装方式（如手动下载）

> 💬 hippo：如果你在国内，这是大概率会遇到的问题。
> 建议先配置好网络环境，确保能访问 `claude.ai`，否则后续所有功能都用不了。

### 坑点 2：Windows 用户用 WSL 时 Git 命令找不到

**表现**：
```bash
# 在 WSL 中
claude commit
# 报错：git: command not found
```

**原因**：
WSL 默认 PATH 中可能没有 Git。

**解决**：
在 WSL 中安装 Git：
```bash
sudo apt update
sudo apt install git
```

> 💬 hippo：Windows 环境的坑比较多，建议：
> - 优先用 WSL 2（支持更好）
> - 或者直接用 PowerShell 版本

### 坑点 3：登录后还是提示 "未认证"

**表现**：
```bash
claude
# 还是提示：Please login first
```

**原因**：
认证 token 没有正确保存，或配置文件权限有问题。

**解决**：
检查配置文件：
```bash
# 查看配置文件是否存在
cat ~/.claude/config.json

# 检查文件权限（应该是 600）
ls -la ~/.claude/config.json
```

> 💬 hippo：如果配置文件权限不对，可以手动修正：
```bash
chmod 600 ~/.claude/config.json
```

---

## 初学者专业提示

1. **从小任务开始**：不要一上来就让 AI 重构整个项目
2. **描述问题而非解决方案**：让 Claude 自己想方案，你只负责把关
3. **善用 `/help` 和 `/resume`**：这两个命令能帮你快速找到功能
4. **建立代码审查习惯**：在 AI 建议后，自己再看一遍，不要盲目接受

> 💬 hippo：最重要的建议——"先动手再查文档"。
>
> 工具类学习，先动手再查文档的效率远高于先读完再动手。
> 遇到问题再看相关章节，这样学习更有针对性。

---

## 常见问题解答

**Q: 安装脚本报错 "Connection refused"？**

A: 网络问题，换代理或改天再试。

**Q: 登录后还是提示 "未认证"？**

A: 检查 `~/.claude/config.json` 是否存在，权限是否正确（应该是 600）。

**Q: Claude 响应很慢？**

A: 可能是网络延迟或服务器负载。试试简单任务，如果持续慢，换时段再试。

**Q: 中文回答质量如何？**

A: Claude 的中文理解能力很强，但技术术语建议用英文提示词，避免翻译歧义。

**Q: 可以在团队项目中使用吗？**

A: 可以。每个成员用各自的账户登录，对话历史是独立的。

---

## 延伸阅读

- 相关文档：[如何工作](https://code.claude.com/docs/zh-CN/how-claude-code-works)
- 参考资料：[最佳实践](https://code.claude.com/docs/zh-CN/best-practices)

---

## 一句话总结

快速开始就是装好、登录、跑通一个小任务——别急，先建立直觉再玩大的。从 8 个步骤中掌握基础操作，然后用 `/help` 探索更多功能。

**下一篇**：[精读官方文档：设置 Claude Code](/2026/03/12/claude-setup/)

---

*本文精读自 [Claude Code 官方文档 - 快速开始](https://code.claude.com/docs/zh-CN/quickstart)*
