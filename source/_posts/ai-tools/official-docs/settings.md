---
title: 精读官方文档：Claude Code 设置
date: 2026-03-17 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 14
description: Claude Code 的设置系统支持用户级、项目级和企业级三层配置，通过 settings.json 文件管理权限、环境变量、Hooks 等核心选项。
cover: https://picsum.photos/seed/claude-code-settings/1920/1080
source_url: https://code.claude.com/docs/zh-CN/settings
---

# 精读官方文档：Claude Code 设置

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 的设置系统是一套分层的配置机制，让你可以控制 Claude Code 的行为——从简单的界面主题到复杂的权限控制、Hooks（钩子）配置都能管理。

最关键的是理解"分层"这个概念：企业级配置优先级最高，往下是项目级、用户级。这样设计既保证了企业安全策略的强制执行，又允许个人和团队按需定制。

<!-- more -->

---

## 二、官方教程精读

### 2.1 设置文件的层级结构

Claude Code 通过 `settings.json` 文件管理配置，支持以下层级：

| 层级 | 文件路径 | 用途 |
|------|----------|------|
| 用户级 | `~/.claude/settings.json` | 全局生效，适用于所有项目 |
| 项目级（共享） | `.claude/settings.json` | 提交到 Git，团队共享 |
| 项目级（本地） | `.claude/settings.local.json` | 不提交，个人偏好配置 |
| 企业级 | `/etc/claude-code/managed-settings.json` | IT 统一管控，优先级最高 |

**配置优先级（从高到低）：**

1. 企业托管策略 (`managed-settings.json`) — 不可被覆盖
2. 命令行参数 — 临时覆盖
3. 本地项目设置 (`settings.local.json`)
4. 共享项目设置 (`settings.json`)
5. 用户设置 (`~/.claude/settings.json`)

> 💡 提示：`.claude/settings.local.json` 创建后，Claude Code 会自动将其加入 `.gitignore`。

### 2.2 settings.json 可用配置项

以下是最常用的配置项：

```json
{
  "permissions": {
    "allow": ["Bash(git diff:*)"],
    "ask": ["Bash(git push:*)"],
    "deny": ["WebFetch", "Read(./.env)"]
  },
  "env": {
    "FOO": "bar"
  },
  "hooks": {
    "PreToolUse": {
      "Bash": "echo 'Running command...'"
    }
  },
  "cleanupPeriodDays": 30,
  "includeCoAuthoredBy": true,
  "model": "claude-sonnet-4-20250514"
}
```

**核心配置项说明：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `permissions` | 权限控制，包含 allow/ask/deny | - |
| `env` | 注入到每个会话的环境变量 | `{}` |
| `hooks` | 工具执行前后的自定义命令 | - |
| `cleanupPeriodDays` | 聊天记录本地保留天数 | 30 |
| `includeCoAuthoredBy` | git 提交是否包含 Claude 署名 | true |
| `model` | 覆盖默认使用的模型 | - |
| `disableAllHooks` | 禁用所有 Hooks | false |

### 2.3 权限配置详解

权限配置是 `settings.json` 最重要的部分，控制 Claude Code 能执行哪些操作。

```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "ask": [
      "Bash(git push:*)",
      "Bash(rm:*)"
    ],
    "deny": [
      "WebFetch",
      "Bash(curl:*)",
      "Read(./.env)",
      "Read(./secrets/**)"
    ],
    "additionalDirectories": ["../docs/"],
    "defaultMode": "acceptEdits"
  }
}
```

**权限规则说明：**

| 字段 | 含义 | 示例 |
|------|------|------|
| `allow` | 直接允许，无需确认 | `Bash(git diff:*)` |
| `ask` | 执行前询问用户 | `Bash(git push:*)` |
| `deny` | 禁止执行，对敏感文件完全隐藏 | `Read(./.env)` |

> ⚠️ 注意：Bash 权限规则使用前缀匹配，不是正则。例如 `Bash(git:*)` 会匹配所有以 `git` 开头的命令。

### 2.4 环境变量

Claude Code 支持通过环境变量控制行为，常用的有：

```bash
# 使用 Bedrock 后端
export CLAUDE_CODE_USE_BEDROCK=1

# 使用 Vertex AI 后端
export CLAUDE_CODE_USE_VERTEX=1

# 禁用遥测
export DISABLE_TELEMETRY=1

# 禁用错误上报
export DISABLE_ERROR_REPORTING=1

# 设置 Bash 命令默认超时（毫秒）
export BASH_DEFAULT_TIMEOUT_MS=60000

# 设置代理
export HTTPS_PROXY=http://proxy.example.com:8080
```

**常用环境变量一览：**

| 变量名 | 用途 |
|--------|------|
| `ANTHROPIC_API_KEY` | API 密钥（非交互式使用） |
| `DISABLE_TELEMETRY` | 设为 `1` 禁用遥测 |
| `DISABLE_ERROR_REPORTING` | 设为 `1` 退出 Sentry 错误上报 |
| `BASH_DEFAULT_TIMEOUT_MS` | Bash 命令默认超时时间 |
| `MAX_MCP_OUTPUT_TOKENS` | MCP 工具响应最大 token 数 |
| `MCP_TIMEOUT` | MCP 服务器启动超时（毫秒） |

### 2.5 命令行配置管理

使用 `claude config` 命令管理配置：

```bash
# 查看所有配置
claude config list

# 查看单个配置
claude config get permissions

# 设置配置（项目级）
claude config set permissions.allow '["Bash(git:*)"]'

# 设置全局配置
claude config set -g theme dark

# 向列表类型追加值
claude config add permissions.allow "Bash(npm:*)"

# 从列表类型移除值
claude config remove permissions.allow "Bash(npm:*)"
```

### 2.6 敏感文件保护

使用 `deny` 规则防止 Claude Code 访问敏感文件：

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.local)",
      "Read(./secrets/**)",
      "Read(**/credentials.json)"
    ]
  }
}
```

这样配置后，匹配的文件对 Claude Code 完全不可见，避免意外泄露密钥等敏感信息。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

刚开始用时，我把所有配置都写在 `~/.claude/settings.json` 里，结果：

1. 换电脑后配置丢失
2. 团队协作时权限规则不一致
3. 敏感文件保护规则没有同步给团队

### 3.2 我的解决方案

现在我的配置策略是：

**项目级配置 `.claude/settings.json`（提交到 Git）：**

```json
{
  "permissions": {
    "allow": [
      "Bash(hexo:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(yarn:*)"
    ],
    "ask": [
      "Bash(git push:*)",
      "Bash(git commit:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Bash(rm -rf:*)"
    ]
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/notify.sh"
          }
        ]
      }
    ]
  },
  "includeCoAuthoredBy": true
}
```

**用户级配置 `~/.claude/settings.json`：**

```json
{
  "cleanupPeriodDays": 60,
  "env": {
    "DISABLE_TELEMETRY": "1"
  }
}
```

### 3.3 我的建议

1. **团队共享的配置放项目级**：权限规则、Hooks 配置这些应该团队成员一致
2. **个人偏好放用户级**：清理周期、主题这些个人设置不需要同步
3. **敏感操作用 `ask` 而非 `deny`**：比如 `git push`，我选择每次确认而不是完全禁止
4. **企业环境优先用托管配置**：确保安全策略不会被个人覆盖

---

## 四、常见问题

**Q: settings.json 和 settings.local.json 有什么区别？**

A: `settings.json` 会提交到 Git，团队共享；`settings.local.json` 会被 Git 忽略，用于个人实验性配置。两者合并时，local 会覆盖 shared 的同名配置。

**Q: 权限规则支持正则表达式吗？**

A: Bash 权限规则使用前缀匹配，不是正则。`Bash(git:*)` 匹配所有以 `git` 开头的命令。文件路径（Read/Write）支持 glob 模式，如 `Read(./secrets/**)`。

**Q: 如何查看当前生效的完整配置？**

A: 运行 `claude config list` 可以看到合并后的配置，帮助理解各层级的覆盖关系。

**Q: 企业托管配置放在哪里？**

A:
- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux: `/etc/claude-code/managed-settings.json`
- Windows: `C:\ProgramData\ClaudeCode\managed-settings.json`

---

## 五、小结

Claude Code 的设置系统通过五层优先级实现了"企业管控 + 团队协作 + 个人定制"的平衡。核心是理解 `settings.json` 的结构和权限规则的前缀匹配机制。

下一篇将精读 **Hooks** 相关内容，教你如何在工具执行前后自动运行自定义脚本。

---

*本文精读自 [Claude Code settings - Anthropic](https://docs.anthropic.com/en/docs/claude-code/settings)*

*最后更新：2026-03-25*
