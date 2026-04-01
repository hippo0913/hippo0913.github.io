---
title: 精读官方文档：安装和设置 Claude Code
date: 2026-03-27 23:00:00
updated: 2026-03-31 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 4
description: Claude Code 的系统要求、多平台安装方式、自动更新配置、版本管理和卸载方法。
cover: https://picsum.photos/seed/claude-setup/1920/1080
source_url: https://code.claude.com/docs/zh-CN/setup
---

# 精读官方文档：安装和设置 Claude Code

> 💬 hippo：这是系列的第四篇。安装看起来简单，但这里有几个关键选择：用原生安装还是 npm？更新策略怎么配置？本文帮你做出正确的决定。

---

## 一、这个功能是什么

本页面是 Claude Code 的**安装说明书**，覆盖系统要求、安装、验证、更新、卸载的完整生命周期。重点只有一个：**用原生安装（Native Install），别用 npm**。原生安装更快、无依赖、支持后台自动更新。npm 方式已弃用。

<!-- more -->

---

## 二、官方教程精读

### 2.1 系统要求与安装方式

**系统要求一览：**

| 类型 | 要求 |
|------|------|
| 操作系统 | macOS 13.0+、Windows 10 1809+、Ubuntu 20.04+、Debian 10+、Alpine 3.19+ |
| 硬件 | 4 GB+ RAM |
| 网络 | 需要互联网连接（Anthropic 支持的国家/地区） |
| Shell | Bash、Zsh、PowerShell 或 CMD |

**原生安装（推荐）：**

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Windows CMD
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

原生安装把二进制文件放在 `~/.local/bin/claude`，不依赖 Node.js，启动速度比 npm 快 2-3 倍，且支持后台自动更新。安装脚本会自动检测平台架构（x86_64 或 arm64），下载对应的预编译二进制文件。

macOS 用户还可以用 Homebrew：`brew install --cask claude-code`；Windows 用户可以用 WinGet：`winget install Anthropic.ClaudeCode`。不过这两种方式不支持自动更新，需要手动 `claude update`。

**关于 npm 安装：** `npm install -g @anthropic-ai/claude-code` 曾经是唯一的安装方式，但现在已经弃用。npm 方式需要 Node.js 18+ 环境，启动时要加载整个 Node 运行时，所以明显更慢。如果你还在用 npm，建议尽快迁移（见第三章实战经验）。

**身份验证要求：** Claude Code 需要 Pro、Max、Teams、Enterprise 或 Console 账户。**免费账户不行。** 也支持通过 Amazon Bedrock、Google Vertex AI、Microsoft Foundry 等第三方 API 使用——适合企业用户或有 AWS/GCP 账号的开发者，按 API 调用量计费。

### 2.2 平台特殊配置

**Windows 用户有两条路：**

- **原生 Windows + Git Bash**：先装 [Git for Windows](https://gitforwindows.org/)，然后正常安装。如果 Claude Code 找不到 Git Bash，需要手动指定路径：

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

- **WSL2**：在 WSL2 里跑 Linux 版 Claude Code。优势是支持沙箱（一种隔离机制，限制程序能访问的系统资源），WSL1 不支持沙箱。

**Alpine / musl 发行版**需要额外处理。Alpine 用的是 musl libc（一个轻量级 C 标准库），不是主流的 glibc，所以需要手动补依赖：

```bash
apk add libgcc libstdc++ ripgrep
```

然后在 `settings.json` 中关闭内置 ripgrep：

```json
{
  "env": {
    "USE_BUILTIN_RIPGREP": "0"
  }
}
```

**验证安装是否成功：**

```bash
claude          # 启动交互式界面
claude doctor   # 详细检查安装和配置状态
```

`claude doctor` 会检查二进制完整性、Shell 配置、网络连通性、认证状态等，是排查问题的第一步。

### 2.3 更新与版本管理

原生安装默认开启后台自动更新——新版本在后台下载，下次启动时生效，当前会话不受影响。

**更新渠道配置：**

| 参数 | 值 | 说明 |
|------|------|------|
| `autoUpdatesChannel` | `"latest"`（默认） | 新功能立即获取 |
| `autoUpdatesChannel` | `"stable"` | 约延迟一周，跳过有重大回归的版本 |

切换到 stable 渠道：

```json
{
  "autoUpdatesChannel": "stable"
}
```

也可以在 Claude Code 里输入 `/config`，找到「自动更新渠道」选项配置。

**禁用自动更新**（适用于需要锁版本的环境）：

```json
{
  "env": {
    "DISABLE_AUTOUPDATER": "1"
  }
}
```

**手动更新和安装特定版本：**

```bash
claude update                                          # 手动更新到最新
curl -fsSL https://claude.ai/install.sh | bash -s stable   # 安装 stable 渠道版本
curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58   # 安装指定版本号
```

**卸载：**

```bash
# 原生安装卸载（macOS / Linux / WSL）
rm -f ~/.local/bin/claude && rm -rf ~/.local/share/claude

# Windows PowerShell
Remove-Item -Path "$env:USERPROFILE\.local\bin\claude.exe" -Force
Remove-Item -Path "$env:USERPROFILE\.local\share\claude" -Recurse -Force

# Homebrew 卸载
brew uninstall --cask claude-code

# WinGet 卸载
winget uninstall Anthropic.ClaudeCode

# 如果之前用过 npm，也要清掉
npm uninstall -g @anthropic-ai/claude-code
```

如果想彻底清理所有配置文件（包括对话历史、自定义 prompt、项目级设置），还要额外删除：

```bash
rm -rf ~/.claude ~/.claude.json   # 全局配置和对话历史
rm -rf .claude .mcp.json          # 项目级配置（在项目目录下执行）
```

**注意：** `~/.claude/` 目录里存了你的所有对话记录、自定义指令和权限配置。卸载前如果需要保留，先备份再删。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 从 npm 迁移到原生安装的坑

我最早用 `npm install -g @anthropic-ai/claude-code` 安装。后来切原生安装，跑了 `curl` 脚本，结果终端里输入 `claude` 还在调用旧的 npm 版本。原因是 npm 的全局 bin 路径（`/usr/local/bin` 或 nvm 管理的路径）在 PATH 中优先级高于 `~/.local/bin`。

解决步骤：

```bash
# 1. 先装原生版本
curl -fsSL https://claude.ai/install.sh | bash

# 2. 彻底卸载 npm 版本
npm uninstall -g @anthropic-ai/claude-code

# 3. 验证指向正确
which claude   # 应该输出 ~/.local/bin/claude
claude --version
```

另一个坑是卸载 npm 版本后，`node_modules` 里残留了旧版本的缓存目录，占了 200 多 MB。手动 `rm -rf ~/.npm/_npx/` 清理掉才干净。这里给一个完整的迁移检查清单：

```bash
# 完整迁移步骤
npm uninstall -g @anthropic-ai/claude-code  # 1. 卸 npm 版
rm -rf ~/.npm/_npx/                          # 2. 清 npm 缓存
curl -fsSL https://claude.ai/install.sh | bash  # 3. 装原生版
which claude   # 4. 确认路径是 ~/.local/bin/claude
claude --version  # 5. 确认版本号正确
```

### 3.2 stable vs latest 渠道的真实差异

我一开始用 `latest` 渠道，有一次更新后 `claude doctor` 报了一个 shell hook 相关的 warning，同时 `.claude/settings.json` 的格式也变了（新增了几个字段）。花了半小时排查才发现是 breaking change（不向后兼容的改动）。

切到 `stable` 渠道后，这种问题再没出现过。stable 大约延迟一周发布，已经帮社区用户过滤掉了有严重回归的版本。除非你需要某个刚发布的新功能，否则 stable 是更稳的选择。

我的建议是：个人开发用 `stable`，团队协作也用 `stable`（避免版本不一致导致的配置冲突）。只有当你需要测试某个最新修复的 bug 时，才临时切 `latest`。

### 3.3 我的推荐配置和 claude doctor 输出解读

我的 `~/.claude/settings.json`：

```json
{
  "autoUpdatesChannel": "stable"
}
```

就这一个配置项。保持简单，让自动更新在 stable 渠道上安静工作。

`claude doctor` 的关键输出项解读：

| 检查项 | 通过标志 | 失败怎么办 |
|--------|---------|-----------|
| Binary integrity | 显示版本号 | 重新跑安装脚本 |
| Shell integration | hook 已注册 | 运行 `claude init` |
| Network | API 连通 | 检查代理/VPN 设置 |
| Authentication | 登录状态有效 | 运行 `claude` 重新登录 |

---

## 四、常见问题

**Q: 原生安装和 npm 安装到底有什么区别？**

A: 原生安装是独立的二进制文件，不需要 Node.js，启动快 2-3 倍，支持后台自动更新。npm 安装已弃用，官方不再推荐。

**Q: 免费账户能用 Claude Code 吗？**

A: 不能。需要 Pro（每月 $20）或更高级别的账户。但如果你有 AWS 账号，可以通过 Amazon Bedrock 使用，按 API 调用计费。

**Q: Windows 该选 WSL2 还是原生 Git Bash？**

A: 如果你在 Windows 上做 Linux 开发，选 WSL2。原生 Windows + Git Bash 适合纯 Windows 开发环境。WSL2 的额外好处是支持沙箱。

**Q: 怎么回滚到旧版本？**

A: 用安装脚本指定版本号：`curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58`。回滚后建议设置 `"DISABLE_AUTOUPDATER": "1"` 防止自动更新覆盖。

---

## 五、小结

安装决策速查：

| 场景 | 推荐方案 |
|------|---------|
| macOS / Linux | 原生安装 + stable 渠道 |
| Windows（Linux 开发） | WSL2 + 原生安装 |
| Windows（纯 Windows 开发） | 原生安装 + Git for Windows |
| 需要锁版本 | 原生安装 + DISABLE_AUTOUPDATER |
| Docker / CI 环境 | 指定版本号安装 |

**核心心法**：原生安装、stable 渠道、有问题先跑 `claude doctor`。

**下一篇**：[精读官方文档：Claude Code 设置](/2026/03/27/ai-tools/official-docs/settings/)，深入学习配置文件和权限系统。

---

*本文精读自 [安装和设置](https://code.claude.com/docs/zh-CN/setup)*

*最后更新：2026-03-31*
