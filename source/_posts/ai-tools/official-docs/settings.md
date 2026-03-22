---
title: 精读官方文档：Claude Code 设置
date: 2026-03-12 20:20:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 14
description: 精读 Claude Code Settings 文档，了解完整配置选项和最佳实践。
cover: https://picsum.photos/seed/claude-settings/1920/1080
source_url: https://code.claude.com/docs/zh-CN/settings
---

# 精读官方文档：Claude Code 设置

> 💬 hippo：这是我的第一篇配置系统深度分析文章，读完这篇你就会彻底搞懂 Claude Code 的配置体系。

---

## 开篇：为什么要搞懂配置系统

Claude Code 的设置系统就像你的私人助理的"工作手册"——告诉它该怎么做、不能做什么、用什么工具、说哪种语言。

你可能会问："直接用不就行了吗，为什么要学配置？"

💬 hippo 的真实经历：刚开始我确实这么想，结果踩了好几个坑——误删了关键文件、让 AI 胡乱执行危险命令、团队成员的配置互相冲突……后来认真啃完这篇文档才发现，配置系统才是让 Claude Code "聪明"又"安全"的关键。

这篇文章会帮你：

- 理解 4 层配置作用域（User、Project、Local、Managed）
- 掌握权限控制的完整语法
- 学会用环境变量灵活调整行为
- 避免常见的配置陷阱

---

<!-- more -->

## 核心概念：配置就像分层蛋糕

Claude Code 使用**作用域系统**（Scope System）来管理配置，理解这个概念后，一切就清晰了。

### 4 种配置作用域

| 作用域 | 位置 | 影响谁 | 能共享吗 |
|---|---|---|---|
| **Managed** | 系统级/服务器推送 | 机器上所有用户 | ✅（IT 部署） |
| **User** | `~/.claude/` | 你个人，所有项目 | ❌ |
| **Project** | 项目 `.claude/` | 这个项目的所有人 | ✅（提交 git） |
| **Local** | `.claude/settings.local.json` | 你个人，仅此项目 | ❌（gitignore） |

### 配置优先级（重要！）

当多个作用域冲突时，优先级是：

1. **Managed**（最高，无法覆盖）
2. **命令行参数**（临时）
3. **Local**
4. **Project**
5. **User**（最低）

举例：如果你在 User 设置中允许 `npm run *`，但 Project 设置拒绝，最终会拒绝。

### 各功能的位置速查

| 功能 | User | Project | Local |
|---|---|---|---|
| Settings | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| Subagents | `~/.claude/agents/` | `.claude/agents/` | — |
| MCP Servers | `~/.claude.json` | `.mcp.json` | `~/.claude.json`（项目级） |
| Plugins | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| CLAUDE.md | `~/.claude/CLAUDE.md` | `CLAUDE.md` 或 `.claude/CLAUDE.md` | — |

---

## 实战指南：手把手配置

### 场景 1：设置项目级权限控制

假设你在做一个支付系统项目，需要严格限制 AI 能做什么：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run test)",
      "Bash(npm run lint)",
      "Read(~/.zshrc)"
    ],
    "deny": [
      "Bash(curl *)",
      "Bash(rm *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)"
    ]
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

把这个文件保存到 `.claude/settings.json`，整个团队都会继承这些规则。

### 场景 2：个人偏好设置

你可以在 User 层面设置全局偏好：

```bash
# 编辑 ~/.claude/settings.json
cat > ~/.claude/settings.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "language": "chinese",
  "model": "claude-sonnet-4-6",
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <[email protected]>",
    "pr": ""
  }
}
EOF
```

这些设置会应用到所有项目中。

---

## 权限规则语法详解

### 基本格式

权限规则遵循两种格式：

1. **简单格式**：`Tool`（匹配该工具的所有使用）
2. **指定格式**：`Tool(specifier)`（匹配特定模式的工具使用）

### 常见规则示例

| 规则 | 效果 |
|---|---|
| `Bash` | 匹配所有 Bash 命令 |
| `Bash(npm run *)` | 匹配 `npm run` 开头的命令 |
| `Bash(git diff)` | 只匹配 `git diff` 命令 |
| `Read(./.env)` | 匹配读取 `.env` 文件 |
| `Read(./secrets/**)` | 匹配读取 `secrets/` 目录下所有文件 |
| `WebFetch(domain:example.com)` | 匹配对 example.com 的网络请求 |

### 规则评估顺序

按以下顺序评估，**第一个匹配的规则生效**：

1. **deny** 规则（拒绝）
2. **ask** 规则（询问）
3. **allow** 规则（允许）

举例：

```json
{
  "permissions": {
    "deny": ["Bash(rm *)"],
    "allow": ["Bash(npm run *)"]
  }
}
```

这样配置后，`rm` 命令会被拒绝，但 `npm run test` 会被允许。

---

## 沙箱设置（高级）

沙箱将 Bash 命令与你的文件系统和网络隔离，提供额外的安全层。

### 沙箱配置示例

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git", "docker"],
    "filesystem": {
      "allowWrite": ["//tmp/build", "~/.kube"],
      "denyRead": ["~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "allowUnixSockets": ["/var/run/docker.sock"],
      "allowLocalBinding": true
    }
  }
}
```

### 路径前缀说明

| 前缀 | 含义 | 示例 |
|---|---|---|
| `//` | 文件系统根目录绝对路径 | `//tmp/build` → `/tmp/build` |
| `~/` | 相对于主目录 | `~/.kube` → `$HOME/.kube` |
| `/` | 相对于设置文件目录 | `/build` → `$SETTINGS_DIR/build` |
| `./` | 相对路径（沙箱运行时解析） | `./output` |

---

## 💬 hippo 的踩坑实录

### 坑点 1：权限规则顺序搞错，误删文件

**问题**：我以为 `allow` 会覆盖 `deny`，结果配置成了这样：

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)"],
    "deny": ["Bash(rm *)"]
  }
}
```

Claude 还是能执行 `rm -rf node_modules`！为什么？

**原因**：规则按顺序评估，而 `allow` 在前面，`Bash(npm run rm -rf node_modules)` 先匹配到了 `Bash(npm run *)`，后面的 `deny` 根本没机会执行。

**解决方案**：永远把 `deny` 规则放在最前面：

```json
{
  "permissions": {
    "deny": ["Bash(rm *)", "Bash(curl *)"],
    "allow": ["Bash(npm run *)"]
  }
}
```

---

### 坑点 2：混淆 Project 和 Local 作用域

**问题**：我设置了 `.claude/settings.json` 来测试新的 MCP server，结果同事拉代码后报错。

**原因**：`.claude/settings.json` 是项目级的，会提交到 git 并影响所有协作者。

**解决方案**：

- **团队共享配置** → 用 `.claude/settings.json`
- **个人测试配置** → 用 `.claude/settings.local.json`

Claude Code 会自动把 `settings.local.json` 添加到 `.gitignore`。

---

### 坑点 3：环境变量不持久

**问题**：我想让 Claude 在所有 Bash 命令中使用特定的 Python 环境，试了：

```bash
export PYTHON_ENV=/my/custom/path
claude
```

但后续命令中 `echo $PYTHON_ENV` 输出为空。

**原因**：每个 Bash 命令在独立的 shell 中运行，环境变量不跨命令持久。

**解决方案**：用 `CLAUDE_ENV_FILE` 环境变量

```bash
export CLAUDE_ENV_FILE=~/.claude-env.sh
echo 'export PYTHON_ENV=/my/custom/path' > ~/.claude-env.sh
claude
```

这样每个 Bash 命令执行前都会加载这个环境文件。

---

## 常见问题解答

**Q: `settings.json` 和 `.claude.json` 有什么区别？**

A: `settings.json` 是官方配置机制（权限、环境变量、工具行为），`.claude.json` 包含用户偏好（主题、通知、OAuth 会话）和 MCP server 配置。一般来说，你只需要编辑 `settings.json`。

**Q: 如何禁用 git 提交中的 AI 署名？**

A: 在 `settings.json` 中设置：

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```

空字符串表示不显示。

**Q: 可以在不同的项目使用不同的模型吗？**

A: 可以！在项目的 `.claude/settings.json` 中设置：

```json
{
  "model": "claude-opus-4-6"
}
```

这会覆盖你的全局 User 设置。

**Q: 如何查看当前哪些设置在生效？**

A: 在 Claude Code 中运行 `/status` 命令，它会显示每个配置层的来源和内容。

**Q: `CLAUDE.md` 和 `settings.json` 的区别是什么？**

A: `CLAUDE.md` 是"内存文件"，告诉 Claude 你的项目上下文和指令；`settings.json` 是"配置文件"，控制 Claude 的行为（权限、环境、工具）。两者配合使用效果最好。

---

## 一句话总结

Claude Code 的配置系统通过 4 层作用域、灵活的权限规则和丰富的环境变量，让你能精确控制 AI 助手的行为，既安全又高效。

**上一篇**：[精读官方文档：通过 MCP 将 Claude Code 连接到工具](/2026/03/12/claude-code-mcp/)

**下一篇**：[精读官方文档：使用 Claude Code Desktop](/2026/03/12/claude-code-desktop/)

---

*本文精读自 [Claude Code 设置](https://code.claude.com/docs/zh-CN/settings)*
