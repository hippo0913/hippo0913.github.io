---
title: 精读官方文档：Claude Code 设置
date: 2026-03-17 23:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 14
description: Claude Code 的设置系统支持用户级、项目级和企业级三层配置，通过 settings.json 文件管理权限、环境变量、Hooks、沙箱、归属等核心选项。
cover: https://picsum.photos/seed/claude-code-settings/1920/1080
source_url: https://code.claude.com/docs/zh-CN/settings
---

# 精读官方文档：Claude Code 设置

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 的设置系统是一套分层的配置机制，让你可以控制 Claude Code 的行为——从简单的界面主题到复杂的权限控制、Hooks（钩子）、沙箱隔离、归属信息等都能管理。

最关键的是理解"分层"这个概念：企业级配置优先级最高，往下是项目级、用户级。这样设计既保证了企业安全策略的强制执行，又允许个人和团队按需定制。

<!-- more -->

---

## 二、官方教程精读

### 2.1 配置作用域

Claude Code 使用**作用域系统**来确定配置应用的位置以及与谁共享：

| 作用域 | 位置 | 影响范围 | 与团队共享？ |
|--------|------|----------|--------------|
| **Managed** | 服务器管理、MDM/注册表或系统级 `managed-settings.json` | 机器上的所有用户 | 是（由 IT 部署） |
| **User** | `~/.claude/` 目录 | 你，跨所有项目 | 否 |
| **Project** | 存储库中的 `.claude/` | 此存储库上的所有协作者 | 是（提交到 git） |
| **Local** | `.claude/settings.local.json` | 你，仅在此存储库中 | 否（gitignored） |

**配置优先级（从高到低）：**

1. **Managed 设置**（最高）— 无法被任何内容覆盖
2. **命令行参数** — 临时会话覆盖
3. **Local** — 覆盖项目和用户设置
4. **Project** — 覆盖用户设置
5. **User**（最低）— 当没有其他内容指定时应用

> 💡 提示：`.claude/settings.local.json` 创建后，Claude Code 会自动将其加入 `.gitignore`。

### 2.2 JSON Schema 启用自动完成

在 `settings.json` 中添加 `$schema` 字段，可以在 VS Code、Cursor 等支持 JSON Schema 的编辑器中获得自动完成和内联验证：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(git diff:*)"],
    "ask": ["Bash(git push:*)"],
    "deny": ["WebFetch", "Read(./.env)"]
  }
}
```

这样编辑配置时，编辑器会自动提示可用字段、类型和示例值，避免拼写错误。

### 2.3 settings.json 可用配置项

以下是完整的配置项示例：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(git diff:*)"],
    "ask": ["Bash(git push:*)"],
    "deny": ["WebFetch", "Read(./.env)"]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1"
  },
  "hooks": {
    "PreToolUse": {
      "Bash": "echo 'Running command...'"
    }
  },
  "cleanupPeriodDays": 30,
  "attribution": {
    "commit": "🤖 Generated with Claude Code",
    "pr": ""
  },
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true
  },
  "model": "claude-sonnet-4-6",
  "companyAnnouncements": [
    "Welcome to Acme Corp! Review our code guidelines at docs.acme.com"
  ]
}
```

**核心配置项说明：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `$schema` | 启用编辑器自动完成的 JSON Schema | `"https://json.schemastore.org/claude-code-settings.json"` |
| `permissions` | 权限控制，包含 allow/ask/deny | 见下节详解 |
| `env` | 注入到每个会话的环境变量 | `{"FOO": "bar"}` |
| `hooks` | 工具执行前后的自定义命令 | 见 Hooks 文档 |
| `sandbox` | 沙箱配置，隔离 Bash 命令 | 见沙箱设置 |
| `attribution` | 自定义 git 提交和 PR 的归属信息 | 见归属设置 |
| `cleanupPeriodDays` | 聊天记录保留天数，设为 `0` 完全禁用持久化 | `30` |
| `model` | 覆盖默认使用的模型 | `"claude-sonnet-4-6"` |
| `availableModels` | 限制用户可选的模型列表 | `["sonnet", "haiku"]` |
| `effortLevel` | 持久化努力级别：`low`/`medium`/`high` | `"medium"` |
| `companyAnnouncements` | 启动时显示的企业公告（随机循环） | `["Welcome!"]` |
| `language` | 首选响应语言 | `"japanese"` |
| `disableAllHooks` | 禁用所有 Hooks | `false` |
| `autoUpdatesChannel` | 更新渠道：`stable` 或 `latest` | `"latest"` |
| `forceLoginMethod` | 强制登录方式：`claudeai` 或 `console` | `"claudeai"` |
| `respectGitignore` | `@` 文件选择器是否尊重 `.gitignore` | `true` |
| `voiceEnabled` | 启用推送说话语音听写 | `true` |
| `spinnerTipsEnabled` | 在微调器中显示提示 | `true` |

### 2.4 权限配置详解

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

**权限规则语法：**

| 规则 | 效果 |
|------|------|
| `Bash` | 匹配所有 Bash 命令 |
| `Bash(npm run:*)` | 匹配以 `npm run` 开头的命令 |
| `Read(./.env)` | 匹配读取 `.env` 文件 |
| `WebFetch(domain:example.com)` | 匹配对 example.com 的获取请求 |

> ⚠️ 注意：Bash 权限规则使用前缀匹配，不是正则。规则按顺序评估：先 deny，再 ask，最后 allow。第一个匹配的规则获胜。

### 2.5 Sandbox 沙箱配置

Sandbox（沙箱）将 Bash 命令与你的文件系统和网络隔离，提供额外的安全保护。

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git", "docker"],
    "filesystem": {
      "allowWrite": ["/tmp/build", "~/.kube"],
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

**Sandbox 配置选项：**

| 键 | 描述 | 默认值 |
|----|------|--------|
| `enabled` | 启用 Bash 沙箱（macOS、Linux、WSL2） | `false` |
| `failIfUnavailable` | 沙箱不可用时是否退出报错 | `false` |
| `autoAllowBashIfSandboxed` | 沙箱环境下自动批准 Bash 命令 | `true` |
| `excludedCommands` | 在沙箱外运行的命令 | `[]` |
| `allowUnsandboxedCommands` | 是否允许 `dangerouslyDisableSandbox` 参数 | `true` |
| `filesystem.allowWrite` | 沙箱命令可写入的额外路径 | `[]` |
| `filesystem.denyWrite` | 沙箱命令无法写入的路径 | `[]` |
| `filesystem.denyRead` | 沙箱命令无法读取的路径 | `[]` |
| `filesystem.allowRead` | 在 denyRead 区域内重新允许读取的路径 | `[]` |
| `network.allowedDomains` | 允许出站网络流量的域（支持通配符） | `[]` |
| `network.allowUnixSockets` | 可访问的 Unix socket 路径 | `[]` |
| `network.allowLocalBinding` | 允许绑定到 localhost 端口（仅 macOS） | `false` |

**路径前缀说明：**

| 前缀 | 含义 | 示例 |
|------|------|------|
| `/` | 从文件系统根目录的绝对路径 | `/tmp/build` |
| `~/` | 相对于主目录 | `~/.kube` |
| `./` 或无前缀 | 相对于项目根目录 | `./output` |

### 2.6 Attribution 归属设置

Claude Code 为 git 提交和拉取请求添加归属信息，可以自定义或禁用：

```json
{
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <[email protected]>",
    "pr": ""
  }
}
```

| 键 | 描述 |
|----|------|
| `commit` | git 提交的归属信息，空字符串隐藏提交归属 |
| `pr` | 拉取请求描述的归属，空字符串隐藏 PR 归属 |

**默认提交归属：**

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.6 <[email protected]>
```

> 💡 提示：`includeCoAuthoredBy` 已弃用，请改用 `attribution` 设置。

### 2.7 Managed 设置的多种交付方式

企业可以通过多种方式部署 Managed 设置，所有方式使用相同的 JSON 格式且无法被用户或项目设置覆盖：

**1. 服务器管理的设置**

通过 Claude.ai 管理员控制台从 Anthropic 的服务器交付。

**2. MDM/OS 级别策略**

通过 macOS 和 Windows 上的本机设备管理交付：

- **macOS**：`com.anthropic.claudecode` managed preferences 域（通过 Jamf、Kandji 等 MDM 工具部署）
- **Windows（管理员级）**：`HKLM\SOFTWARE\Policies\ClaudeCode` 注册表项，包含 JSON 的 `Settings` 值
- **Windows（用户级）**：`HKCU\SOFTWARE\Policies\ClaudeCode`（优先级较低）

**3. 基于文件的方式**

部署到系统目录的 `managed-settings.json`：

| 系统 | 路径 |
|------|------|
| macOS | `/Library/Application Support/ClaudeCode/` |
| Linux/WSL | `/etc/claude-code/` |
| Windows | `C:\Program Files\ClaudeCode\` |

**4. managed-settings.d 目录（片段合并）**

还支持在与 `managed-settings.json` 相同的系统目录中的 `managed-settings.d/` 放入目录，让不同团队可以部署独立的策略片段。

合并规则：
- `managed-settings.json` 首先作为基础
- 目录中所有 `*.json` 文件按字母顺序排序并合并在顶部
- 标量值：后面的文件覆盖前面的
- 数组：连接并去重
- 对象：深度合并
- 以 `.` 开头的隐藏文件被忽略

使用数字前缀控制合并顺序，例如 `10-telemetry.json` 和 `20-security.json`。

### 2.8 环境变量

Claude Code 支持通过环境变量控制行为，也可以在 `settings.json` 的 `env` 键下配置：

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

**常用环境变量列表：**

| 变量名 | 用途 |
|--------|------|
| `ANTHROPIC_API_KEY` | API 密钥（非交互式使用） |
| `CLAUDE_CODE_USE_BEDROCK` | 使用 Bedrock 后端 |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Vertex AI 后端 |
| `DISABLE_TELEMETRY` | 设为 `1` 禁用遥测 |
| `DISABLE_ERROR_REPORTING` | 设为 `1` 退出 Sentry 错误上报 |
| `BASH_DEFAULT_TIMEOUT_MS` | Bash 命令默认超时时间 |
| `MAX_MCP_OUTPUT_TOKENS` | MCP 工具响应最大 token 数 |
| `MCP_TIMEOUT` | MCP 服务器启动超时（毫秒） |
| `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL` | 跳过 IDE 扩展自动安装 |

### 2.9 命令行配置管理

使用 `/config` 命令或交互式 REPL 打开设置界面，也可以使用命令行：

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

### 2.10 敏感文件保护

使用 `deny` 规则防止 Claude Code 访问敏感文件：

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
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
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
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
  "attribution": {
    "commit": "🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>",
    "pr": ""
  }
}
```

**用户级配置 `~/.claude/settings.json`：**

```json
{
  "cleanupPeriodDays": 60,
  "env": {
    "DISABLE_TELEMETRY": "1"
  },
  "autoUpdatesChannel": "stable"
}
```

### 3.3 我的建议

1. **团队共享的配置放项目级**：权限规则、Hooks 配置这些应该团队成员一致
2. **个人偏好放用户级**：清理周期、主题这些个人设置不需要同步
3. **敏感操作用 `ask` 而非 `deny`**：比如 `git push`，我选择每次确认而不是完全禁止
4. **企业环境优先用托管配置**：确保安全策略不会被个人覆盖
5. **添加 `$schema` 字段**：编辑器自动提示能大大减少配置错误

---

## 四、常见问题

**Q: settings.json 和 settings.local.json 有什么区别？**

A: `settings.json` 会提交到 Git，团队共享；`settings.local.json` 会被 Git 忽略，用于个人实验性配置。两者合并时，local 会覆盖 shared 的同名配置。

**Q: 权限规则支持正则表达式吗？**

A: Bash 权限规则使用前缀匹配，不是正则。`Bash(git:*)` 匹配所有以 `git` 开头的命令。文件路径（Read/Write）支持 glob 模式，如 `Read(./secrets/**)`。

**Q: 如何查看当前生效的完整配置？**

A: 在 Claude Code 中运行 `/status` 可以看到哪些设置源处于活跃状态以及它们来自何处。如果设置文件包含错误，`/status` 会报告问题。

**Q: 企业托管配置放在哪里？**

A:
- macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`
- Linux/WSL: `/etc/claude-code/managed-settings.json`
- Windows: `C:\Program Files\ClaudeCode\managed-settings.json`

还可以使用 `managed-settings.d/` 目录部署多个配置片段。

**Q: 如何禁用 git 提交中的 Claude 署名？**

A: 使用 `attribution` 设置：

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```

---

## 五、小结

Claude Code 的设置系统通过五层优先级实现了"企业管控 + 团队协作 + 个人定制"的平衡。核心要点：

1. **理解作用域**：Managed > 命令行 > Local > Project > User
2. **善用 `$schema`**：启用编辑器自动完成，减少配置错误
3. **权限规则**：deny 先于 ask 先于 allow，第一个匹配的规则获胜
4. **沙箱隔离**：生产环境建议启用，为 Bash 命令提供额外保护
5. **归属设置**：可自定义 git 提交和 PR 的归属信息

下一篇将精读 **Hooks** 相关内容，教你如何在工具执行前后自动运行自定义脚本。

---

*本文精读自 [Claude Code 设置 - Claude Code 官方文档](https://code.claude.com/docs/zh-CN/settings)*

*最后更新：2026-03-27*
