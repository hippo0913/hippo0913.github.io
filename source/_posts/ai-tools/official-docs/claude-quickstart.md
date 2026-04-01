---
title: 精读官方文档：快速开始
date: 2026-03-28 23:00:00
updated: 2026-03-31 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 3
description: 精读 Claude Code 快速开始文档：三种安装方式对比、五种账户类型选择、交互模式与一次性命令的区别，以及从安装到跑通第一个任务的最短路径。
cover: https://picsum.photos/seed/claude-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/quickstart
---

# 精读官方文档：快速开始

> 💬 hippo：这是《Claude Code 官方文档精读》系列的第二篇。快速开始是安装完成后第一个该看的页面——目标只有一个：5-10 分钟跑通一个真实任务，建立手感。

---

## 一、这个功能是什么

快速开始跟安装指南不是一回事。安装指南解决"能不能装上"，快速开始解决"装了之后怎么用"。它带你从安装、登录、提问、改代码，一路走到 Git 提交，是一条精心设计的最短路径。

为什么要重视这一页？因为很多人装好工具后，要么直接跳进深水区（"帮我重构整个项目"），结果翻车；要么只跑了 `claude` 看了两眼就关了，觉得"也就那样"。官方的 8 步流程就是帮你避开这两个极端。

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装与登录

**三种安装方式对比：**

| 方式 | 适用平台 | 推荐度 | 说明 |
|------|----------|--------|------|
| 原生安装 | macOS / Linux / WSL / Windows | 首推 | 官方首推，更新最快，一条命令搞定 |
| Homebrew | macOS | 可选 | `brew install --cask claude-code`，比原生版本晚几天 |
| WinGet | Windows | 可选 | `winget install Anthropic.ClaudeCode`，系统集成好 |

原生安装的命令：

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

装完验证一下：

```bash
claude --version
# 输出类似: claude version 1.x.x
```

> Windows 用户注意：Claude Code 依赖 Git，需要先装 [Git for Windows](https://git-scm.com/download/win)。

**五种账户类型：**

| 账户类型 | 适合谁 | 说明 |
|----------|--------|------|
| Pro / Max / Teams / Enterprise | 个人开发者、团队 | 推荐，功能最完整 |
| Console | 按量付费用户 | API 预付费额度，首次登录自动创建工作区 |
| Amazon Bedrock | 企业 AWS 用户 | 用已有 AWS 基础设施 |
| Google Vertex AI | 企业 GCP 用户 | 用已有 GCP 基础设施 |
| Microsoft Foundry | 企业 Azure 用户 | 用已有 Azure 基础设施 |

登录后凭证存储在 `~/.claude/config.json`，无需重复登录。切换账户用 `/login` 命令。

### 2.2 第一次对话与代码修改

进入项目目录，启动 Claude Code：

```bash
cd /path/to/your/project
claude
```

你会看到欢迎界面，包含会话信息和最近的对话记录。从这里开始，你面对的就是一个交互式对话环境。

**核心命令速查：**

| 命令 | 用途 | 典型场景 |
|------|------|----------|
| `claude` | 启动交互模式 | 日常开发，需要反复沟通 |
| `claude "task"` | 一次性任务，执行完自动退出 | `claude "fix the build error"` |
| `claude -p "query"` | print 模式，输出结果后退出 | 适合脚本和管道调用 |
| `claude -c` | 继续当前目录最近的对话 | 接着刚才的工作继续 |
| `claude -r` | 从历史对话列表中选择恢复 | 找回几天前的对话 |
| `claude commit` | 快捷创建 Git 提交 | 自动分析 diff 生成 commit message |

让 Claude 改代码的流程是：你用自然语言描述需求 → 它分析项目结构 → 展示建议的修改 → 你确认后它执行编辑。每一步都会征求你的同意，不会偷偷改你的代码。

### 2.3 Git 操作与工作流

Claude Code 最让我惊喜的功能之一是对话式 Git。你不需要记 `git add`、`git commit -m` 那套命令了：

```bash
"创建一个提交"           # 它自动分析 diff，生成 commit message
"创建分支 feature/xxx"   # 等价于 git checkout -b
"查看最近 5 次提交"      # 等价于 git log --oneline -5
"撤销上次提交"           # 等价于 git reset --soft HEAD~1
```

**常见工作流速查：**

| 场景 | 你说什么 | 它做什么 |
|------|----------|----------|
| 理解代码 | "这个函数是做什么的？" | 代码解释 + 调用关系分析 |
| 修 bug | "修复这个 TypeError" | 定位问题 + 生成修复代码 |
| 加功能 | "添加分页功能" | 设计方案 + 代码实现 |
| 重构 | "把回调改成 async/await" | 批量替换，保持功能不变 |
| 写测试 | "为 utils 目录写单元测试" | 生成测试文件，指定覆盖率 |
| 代码审查 | "审查最近的变更" | 检查风格、bug、性能、安全 |

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中踩过的坑和积累的经验。

### 3.1 国内安装踩坑

国内用户安装时最常见的问题是 `curl` 下载 `install.sh` 失败，报 `Connection refused` 或超时。根本原因是 `claude.ai` 域名在国内访问不稳定。

**解决方案（按推荐度排序）：**

1. **配置终端代理**：这是最稳的方式。如果你有代理工具，在终端里设置环境变量：

```bash
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
curl -fsSL https://claude.ai/install.sh | bash
```

2. **手动下载安装脚本**：在浏览器里打开 `https://claude.ai/install.sh`，保存为本地文件后执行：

```bash
bash ~/Downloads/install.sh
```

3. **权限问题**：如果报 `Permission denied`，macOS/Linux 用户不要盲目加 `sudo`。先检查安装目录是否有写权限，或者用 `sudo chown -R $(whoami) /usr/local/bin` 修正目录权限。

安装完成后，登录步骤也可能卡住。确认代理能访问 `claude.ai`，认证 token 会存在 `~/.claude/config.json`，文件权限应该是 600。

### 3.2 我的第一天使用心得

第一天我最推荐的练手任务不是"写个 hello world"，而是找一个你熟悉的小项目，让 Claude Code 做**代码审查**或**补测试**。这两个任务的好处是：你有能力判断输出质量，而且不会搞坏现有代码。

`claude -p` 在 CI 脚本里特别好用：

```bash
# 在 CI 中自动检查代码质量
claude -p "审查最近一次提交的代码质量，只输出问题列表"
```

`-p` 模式不进入交互界面，输出纯文本，可以和其他命令管道组合。

`claude commit` 是另一个惊喜。它会读 `git diff`，分析改了什么，然后生成符合 Conventional Commits 规范的提交信息，比如 `feat: 添加用户个人资料页面` 或 `fix: 修复登录超时问题`。比你手动写 commit message 规范多了。

### 3.3 给新手的建议

1. **从小任务开始**：让 Claude 改一个函数、修一个 lint 报错、加一段注释。别上来就让它"重构整个认证模块"。
2. **用熟悉的项目练手**：只有你熟悉项目，才能判断 Claude 的建议对不对。如果它改了一个你不认识的文件，你分不清是好是坏。
3. **善用 `/help`**：遇到不确定的功能，直接在交互模式里输入 `/help`，比查文档快。

---

## 四、常见问题

**Q: 安装脚本报错 `Connection refused` 怎么办？**
A: 网络问题。配置终端代理后重试，或者用浏览器手动下载安装脚本再本地执行。

**Q: 登录后提示"未认证"？**
A: 检查 `~/.claude/config.json` 是否存在，权限是否为 600。如果文件存在但仍然报错，用 `/login` 重新登录。

**Q: Claude 响应很慢？**
A: 可能是网络延迟或服务器负载高。先用简单任务（比如 `claude -p "1+1"`）测试基础响应速度，排除网络问题。

**Q: 中文回答质量如何？**
A: 中文理解能力强，但技术术语建议用英文提示词。比如"refactor the auth module"比"重构认证模块"得到的输出更准确。

**Q: 可以用企业云账户吗？**
A: 可以。支持 Amazon Bedrock、Google Vertex AI 和 Microsoft Foundry，在登录时选择对应方式即可。

---

## 五、小结

快速开始的核心就是：装好、登录、跑通一个小任务。别急着一上来就搞大功能，先用小任务建立对工具的直觉——这个投入会在后续省下大量时间。

**下一篇**：[精读官方文档：设置 Claude Code](/2026/03/27/ai-tools/official-docs/claude-setup/)，了解配置文件、环境变量和常用设置项，让 Claude Code 更贴合你的工作习惯。

---

*本文精读自 [Claude Code 官方文档 - 快速开始](https://code.claude.com/docs/zh-CN/quickstart)*

*最后更新：2026-03-31*
