---
title: 精读官方文档：安装和设置 Claude Code
date: 2026-03-27 23:00:00
updated: 2026-03-27 17:00:00
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

本页面涵盖 Claude Code 的**系统要求**、**特定平台安装**、**更新配置**和**卸载**。如果你从未使用过终端，建议先参阅终端指南。

<!-- more -->

---

## 二、官方教程精读

### 2.1 系统要求

Claude Code 在以下平台和配置上运行：

| 类型 | 要求 |
|------|------|
| **操作系统** | macOS 13.0+、Windows 10 1809+ / Server 2019+、Ubuntu 20.04+、Debian 10+、Alpine Linux 3.19+ |
| **硬件** | 4 GB+ RAM |
| **网络** | 需要互联网连接 |
| **Shell** | Bash、Zsh、PowerShell 或 CMD（Windows 需要 Git for Windows） |
| **位置** | Anthropic 支持的国家/地区 |

**其他依赖项：**

- **ripgrep**：通常包含在 Claude Code 中。如果搜索失败，请参阅搜索故障排除。

### 2.2 安装方式

官方推荐三种安装方式：

**方式一：原生安装（推荐）**

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Windows CMD
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

> ⚠️ Windows 需要先安装 [Git for Windows](https://gitforwindows.org/)。

**方式二：Homebrew（macOS）**

```bash
brew install --cask claude-code
```

**方式三：WinGet（Windows）**

```powershell
winget install Anthropic.ClaudeCode
```

> 💬 hippo：强烈建议使用**原生安装**。它更快、不需要依赖项、并且支持后台自动更新。npm 安装已弃用。

### 2.3 Windows 特殊设置

Windows 上的 Claude Code 需要 **Git for Windows** 或 **WSL**。你可以从 PowerShell、CMD 或 Git Bash 启动 `claude`。

**选项 1：原生 Windows + Git Bash**

安装 Git for Windows，然后从 PowerShell 或 CMD 运行安装命令。

如果 Claude Code 找不到 Git Bash，在 `settings.json` 中设置路径：

```json
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

**选项 2：WSL**

支持 WSL 1 和 WSL 2。WSL 2 支持沙箱以增强安全性，WSL 1 不支持沙箱。

### 2.4 Alpine Linux 设置

Alpine 和其他基于 musl 的发行版需要额外依赖：

```bash
apk add libgcc libstdc++ ripgrep
```

然后在 `settings.json` 中设置：

```json
{
  "env": {
    "USE_BUILTIN_RIPGREP": "0"
  }
}
```

### 2.5 验证安装

安装后，确认 Claude Code 正常工作：

```bash
claude
```

要更详细地检查安装和配置，运行：

```bash
claude doctor
```

### 2.6 身份验证

Claude Code 需要 Pro、Max、Teams、Enterprise 或 Console 账户。**免费的 Claude.ai 计划不包括 Claude Code 访问权限**。

你也可以通过第三方 API 提供商使用 Claude Code：
- Amazon Bedrock
- Google Vertex AI
- Microsoft Foundry

安装后，运行 `claude` 并按照浏览器提示登录。

### 2.7 更新 Claude Code

**自动更新：**

原生安装会在后台自动更新。更新在后台下载和安装，下次启动 Claude Code 时生效。

**配置发布渠道：**

使用 `autoUpdatesChannel` 设置控制更新行为：

| 渠道 | 说明 |
|------|------|
| `"latest"`（默认） | 新功能发布后立即接收 |
| `"stable"` | 使用约一周前的版本，跳过有重大回归的发布 |

配置方式：

```json
{
  "autoUpdatesChannel": "stable"
}
```

或通过 `/config` → **自动更新渠道** 配置。

**禁用自动更新：**

```json
{
  "env": {
    "DISABLE_AUTOUPDATER": "1"
  }
}
```

**手动更新：**

```bash
claude update
```

> 💬 hippo：Homebrew 和 WinGet 安装需要手动更新。原生安装才支持自动更新。

### 2.8 安装特定版本

原生安装程序支持指定版本或渠道：

**安装稳定版本：**

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash -s stable

# Windows PowerShell
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) stable
```

**安装特定版本号：**

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58

# Windows PowerShell
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) 1.0.58
```

### 2.9 从 npm 迁移

如果你之前使用 npm 安装，切换到原生安装：

```bash
# 安装原生二进制文件
curl -fsSL https://claude.ai/install.sh | bash

# 删除旧的 npm 安装
npm uninstall -g @anthropic-ai/claude-code
```

> 💬 hippo：npm 安装已弃用。原生安装更快、不需要依赖项、支持后台自动更新。

### 2.10 二进制完整性验证

你可以验证 Claude Code 二进制文件的完整性：

**SHA256 校验和：**

所有平台的校验和发布在：
```
https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases/{VERSION}/manifest.json
```

将 `{VERSION}` 替换为版本号，如 `2.0.30`。

**代码签名：**

| 平台 | 签名 |
|------|------|
| macOS | 由 "Anthropic PBC" 签名并经 Apple 公证 |
| Windows | 由 "Anthropic, PBC" 签名 |

### 2.11 卸载 Claude Code

**原生安装卸载：**

```bash
# macOS / Linux / WSL
rm -f ~/.local/bin/claude
rm -rf ~/.local/share/claude

# Windows PowerShell
Remove-Item -Path "$env:USERPROFILE\.local\bin\claude.exe" -Force
Remove-Item -Path "$env:USERPROFILE\.local\share\claude" -Recurse -Force
```

**Homebrew 卸载：**

```bash
brew uninstall --cask claude-code
```

**WinGet 卸载：**

```powershell
winget uninstall Anthropic.ClaudeCode
```

**npm 卸载：**

```bash
npm uninstall -g @anthropic-ai/claude-code
```

**删除配置文件：**

```bash
# macOS / Linux / WSL
rm -rf ~/.claude
rm ~/.claude.json

# 删除项目级设置（从项目目录运行）
rm -rf .claude
rm -f .mcp.json

# Windows PowerShell
Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force
Remove-Item -Path "$env:USERPROFILE\.claude.json" -Force
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的经验：

### 3.1 我的选择

1. **安装方式**：原生安装（`curl` 脚本），不用 npm
2. **更新策略**：`stable` 渠道，减少遇到 bug 的风险
3. **Windows**：用 WSL2，体验更好，还支持沙箱

### 3.2 我的配置

```json
// ~/.claude/settings.json
{
  "autoUpdatesChannel": "stable"
}
```

### 3.3 常见问题排查

**问题一：搜索功能不工作**

检查 ripgrep 是否安装。Alpine Linux 用户需要手动安装：

```bash
apk add libgcc libstdc++ ripgrep
```

然后在 `settings.json` 设置 `USE_BUILTIN_RIPGREP: "0"`。

**问题二：Windows 找不到 Git Bash**

在 `settings.json` 中显式设置路径：

```json
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

**问题三：登录失败**

确保你在 Anthropic 支持的国家/地区，且账户类型是 Pro/Max/Teams/Enterprise/Console 之一。

### 3.4 我的建议

1. **用原生安装**：比 npm 快，还自动更新
2. **用 stable 渠道**：除非你想尝鲜，否则稳定版更靠谱
3. **保留配置文件**：卸载前备份 `~/.claude/` 和 `~/.claude.json`

---

## 四、常见问题

**Q: 原生安装和 npm 安装有什么区别？**

A: 原生安装更快、不需要 Node.js 依赖、支持后台自动更新。npm 安装已弃用。

**Q: 自动更新会打断我工作吗？**

A: 不会。更新在后台下载，下次启动时生效。当前会话不受影响。

**Q: 如何查看当前版本？**

A: 运行 `claude --version` 或 `claude doctor`。

**Q: 免费账户能用吗？**

A: 不能。需要 Pro、Max、Teams、Enterprise 或 Console 账户。但可以通过第三方 API（Bedrock、Vertex、Foundry）使用。

**Q: WSL1 和 WSL2 哪个更好？**

A: WSL2，因为它支持沙箱功能，安全性更高。

---

## 五、小结

Claude Code 安装要点：

| 方面 | 建议 |
|------|------|
| 安装方式 | 原生安装（curl 脚本） |
| 更新策略 | stable 渠道 |
| Windows | WSL2（支持沙箱） |
| 验证安装 | `claude doctor` |

**核心心法**：用原生安装、配置稳定渠道、有问题跑 `claude doctor`。

**下一篇**：[精读官方文档：Claude Code 设置](/2026/03/27/ai-tools/official-docs/settings/)，深入学习配置文件和权限系统。

---

*本文精读自 [高级设置](https://code.claude.com/docs/zh-CN/setup)*

*最后更新：2026-03-27*
