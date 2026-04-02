---
title: 精读官方文档：Claude Code 设置
date: 2026-03-17 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 14
description: Claude Code 的设置系统通过五层优先级实现企业管控、团队协作和个人定制的平衡。本文精读配置作用域、权限规则、沙箱隔离、插件系统等核心机制。
cover: https://picsum.photos/seed/claude-code-settings/1920/1080
source_url: https://code.claude.com/docs/zh-CN/settings
---

# 精读官方文档：Claude Code 设置

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Claude Code 的设置系统是一套分层配置机制，控制从界面主题到权限沙箱的所有行为。核心是"作用域"概念：企业级配置优先级最高，往下依次是命令行参数、本地配置、项目配置、用户配置。更具体的作用域总是覆盖更宽泛的——这意味着企业安全策略不会被个人配置绕过，但团队和个人仍然可以按需定制。

这套系统涉及两个不同的配置文件：`settings.json` 管理权限、沙箱、Hooks 等运行时行为；`~/.claude.json` 是独立的全局偏好文件，存储编辑器模式、IDE 连接等个人设置。搞清楚这两个文件的分工，是掌握 Claude Code 设置的第一步。

<!-- more -->

---

## 二、官方教程精读

### 2.1 配置作用域与文件位置

Claude Code 使用四种作用域来确定配置的应用范围和共享策略：

| 作用域 | 位置 | 影响范围 | 与团队共享？ |
|--------|------|----------|--------------|
| **Managed** | 服务器管理、MDM/注册表或系统级 `managed-settings.json` | 机器上的所有用户 | 是（由 IT 部署） |
| **User** | `~/.claude/` 目录 | 你，跨所有项目 | 否 |
| **Project** | 存储库中的 `.claude/` | 此存储库的所有协作者 | 是（提交到 git） |
| **Local** | `.claude/settings.local.json` | 你，仅在此存储库中 | 否（自动 gitignore） |

**优先级从高到低：** Managed > 命令行参数 > Local > Project > User。Managed 设置无法被任何内容覆盖。

> 💡 提示：`.claude/settings.local.json` 创建后会自动加入 `.gitignore`，适合放个人实验性配置。

需要特别注意的是，`settings.json` 和 `~/.claude.json` 是两个独立的文件。前者管理运行时行为（权限、沙箱、Hooks 等），后者存储全局偏好：

| ~/.claude.json 配置键 | 说明 |
|---|---|
| `autoConnectIde` | 自动连接检测到的 IDE |
| `autoInstallIdeExtension` | 自动安装 IDE 扩展 |
| `editorMode` | 编辑器模式偏好 |
| `showTurnDuration` | 显示每轮对话耗时 |
| `terminalProgressBarEnabled` | 终端进度条 |

### 2.2 settings.json 核心配置项

一个完整的项目级 `settings.json` 示例：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm run test *)"],
    "deny": ["Bash(curl *)", "Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1"
  },
  "companyAnnouncements": ["Welcome to Acme Corp!"]
}
```

`$schema` 字段值得特别一提——加上它之后，VS Code、Cursor 等编辑器会自动提示可用字段、类型和示例值，配置写错的概率大幅降低。

**settings.json 可用配置项一览：**

| 键 | 描述 | 示例 |
|---|---|---|
| `permissions` | 权限控制，含 allow/ask/deny | 见 2.3 节 |
| `env` | 注入到每个会话的环境变量 | `{"FOO": "bar"}` |
| `sandbox` | 沙箱配置，隔离 Bash 命令 | 见 2.3 节 |
| `attribution` | git 提交和 PR 的归属信息 | `{"commit": "", "pr": ""}` |
| `hooks` | 工具执行前后的自定义命令 | 见 Hooks 文档 |
| `model` | 覆盖默认使用的模型 | `"claude-sonnet-4-6"` |
| `availableModels` | 限制用户可选的模型列表 | `["sonnet", "haiku"]` |
| `modelOverrides` | 模型 ID 到提供商特定 ID 的映射 | `{"sonnet": "bedrock-id"}` |
| `effortLevel` | 持久化努力级别 | `"low"` / `"medium"` / `"high"` |
| `language` | 首选响应语言 | `"japanese"` |
| `cleanupPeriodDays` | 会话保留天数，`0` 禁用持久化 | `30` |
| `autoUpdatesChannel` | 更新渠道 | `"stable"` 或 `"latest"` |
| `disableAllHooks` | 禁用所有 Hooks | `false` |
| `companyAnnouncements` | 启动时显示的企业公告 | `["Welcome!"]` |
| `enabledPlugins` | 控制插件启用/禁用 | 见 2.4 节 |
| `worktree.symlinkDirectories` | worktree 中符号链接的目录 | `["node_modules"]` |
| `worktree.sparsePaths` | sparse-checkout 检出的目录 | `["src/core"]` |
| `autoMode` | 自定义自动模式分类器规则 | — |
| `fileSuggestion` | 自定义 `@` 文件自动完成命令 | — |
| `statusLine` | 自定义状态行配置 | — |

### 2.3 权限规则与 Sandbox 配置

权限是 `settings.json` 最核心的部分。规则格式为 `Tool` 或 `Tool(specifier)`，评估顺序是 **deny > ask > allow**，第一个匹配的规则获胜。

```json
{
  "permissions": {
    "allow": ["Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)"],
    "ask": ["Bash(git push:*)", "Bash(rm:*)"],
    "deny": ["WebFetch", "Bash(curl *)", "Read(./.env)", "Read(./secrets/**)"],
    "additionalDirectories": ["../docs/"],
    "defaultMode": "acceptEdits"
  }
}
```

| 规则 | 效果 |
|---|---|
| `Bash` | 匹配所有 Bash 命令 |
| `Bash(npm run:*)` | 匹配以 `npm run` 开头的命令 |
| `Read(./.env)` | 匹配读取 `.env` 文件 |
| `WebFetch(domain:example.com)` | 匹配对 example.com 的请求 |

> ⚠️ Bash 权限规则使用前缀匹配，不是正则。文件路径（Read/Write）支持 glob 模式。

Sandbox（沙箱）将 Bash 命令与文件系统和网络隔离，提供额外的安全层：

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker"],
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

| 键 | 描述 | 默认值 |
|---|---|---|
| `enabled` | 启用 Bash 沙箱 | `false` |
| `autoAllowBashIfSandboxed` | 沙箱内自动批准 Bash 命令 | `true` |
| `excludedCommands` | 在沙箱外运行的命令 | `[]` |
| `filesystem.allowWrite` | 允许写入的额外路径 | `[]` |
| `filesystem.denyRead` | 禁止读取的路径 | `[]` |
| `network.allowedDomains` | 允许出站流量的域名（支持通配符） | `[]` |
| `network.allowLocalBinding` | 允许绑定 localhost 端口 | `false` |

路径前缀有三种：`/` 绝对路径、`~/` 主目录、`./` 或无前缀表示项目根目录。文件系统限制和权限规则两种机制会合并生效。

### 2.4 Managed 企业设置与插件系统

**Managed 设置有三种交付方式：**

| 方式 | 说明 |
|---|---|
| 服务器管理 | 通过 Claude.ai 管理员控制台，Anthropic 服务器直接交付 |
| MDM/OS 策略 | macOS plist（Jamf/Kandji）、Windows 注册表（`HKLM\SOFTWARE\Policies\ClaudeCode`） |
| 基于文件 | 系统目录下的 `managed-settings.json`，支持 `managed-settings.d/` 片段合并 |

片段合并时，`managed-settings.json` 作为基础，`managed-settings.d/` 中所有 `*.json` 按字母顺序叠加上去——标量覆盖、数组连接去重、对象深度合并。用数字前缀控制顺序，比如 `10-telemetry.json` 先于 `20-security.json`。

**插件系统**通过 `enabledPlugins` 控制启用/禁用，`extraKnownMarketplaces` 注册额外市场：

```json
{
  "enabledPlugins": {
    "my-plugin@my-team": true,
    "deprecated-plugin@other-team": false
  },
  "extraKnownMarketplaces": [
    {
      "name": "my-team",
      "type": "github",
      "owner": "my-org",
      "repo": "claude-plugins"
    }
  ]
}
```

Managed 设置还可以通过 `strictKnownMarketplaces` 限制用户只能使用指定的市场，配合 `allowManagedHooksOnly`、`allowedHttpHookUrls`、`httpHookAllowedEnvVars` 控制 Hook 的安全边界。

### 2.5 命令行配置与归属设置

日常管理配置最方便的方式是命令行：

```bash
# 查看所有配置
claude config list

# 设置项目级配置
claude config set permissions.allow '["Bash(git:*)"]'

# 设置全局配置（-g 标志）
claude config set -g theme dark

# 向列表追加值
claude config add permissions.allow "Bash(npm:*)"
```

归属设置（Attribution）控制 git 提交和 PR 中的 Claude 署名信息：

```json
{
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <noreply@anthropic.com>",
    "pr": ""
  }
}
```

| 键 | 描述 |
|---|---|
| `commit` | git 提交归属信息，空字符串隐藏 |
| `pr` | PR 描述归属信息，空字符串隐藏 |

> 💡 `includeCoAuthoredBy` 已弃用，请改用 `attribution`。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 配置分层的坑

刚开始用时，我把所有配置都写在 `~/.claude/settings.json` 里，结果换电脑后配置丢失、团队协作时权限规则不一致。后来我调整了策略：

- **项目级** `.claude/settings.json`：放团队共享的权限规则、Hooks 配置，提交到 Git
- **用户级** `~/.claude/settings.json`：放个人偏好如 `cleanupPeriodDays`、`autoUpdatesChannel`
- **敏感操作用 `ask` 而非 `deny`**：比如 `git push`，我选择每次确认而不是完全禁止——有些场景确实需要推送

### 3.2 $schema 的实际价值

加了一行 `"$schema": "https://json.schemastore.org/claude-code-settings.json"` 后，编辑器会自动补全所有可用字段。这东西看起来不起眼，但实际体验是——配置写错的概率从"经常"降到了"几乎没有"。Claude Code 的配置项有 50 多个，手动拼写很容易出错。

### 3.3 我的建议

1. **优先在项目级配置权限**：团队成员应该执行相同的规则，避免"你本地能跑但 CI 挂了"的情况
2. **善用 `claude config list` 验证**：改完配置后跑一下这个命令，确认生效了再继续
3. **用 `/status` 排查配置问题**：如果某个权限没生效，`/status` 会显示所有设置源和冲突情况

---

## 四、常见问题

**Q: settings.json 和 settings.local.json 有什么区别？**

A: `settings.json` 提交到 Git，团队共享；`settings.local.json` 被 Git 忽略，用于个人实验性配置。两者合并时，local 的同名配置会覆盖 shared 的。

**Q: 权限规则是正则匹配吗？**

A: 不是。Bash 权限规则使用前缀匹配——`Bash(git:*)` 匹配所有以 `git` 开头的命令。文件路径（Read/Write）支持 glob 模式，如 `Read(./secrets/**)`。

**Q: 如何查看当前生效的完整配置？**

A: 在 Claude Code 中运行 `/status`，可以看到所有活跃的设置源、它们来自哪个文件，以及是否存在冲突或错误。

**Q: 如何禁用 git 提交中的 Claude 署名？**

A: 将 `attribution.commit` 设为空字符串即可：

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

Claude Code 的设置系统通过五层优先级实现了"企业管控 + 团队协作 + 个人定制"的平衡。记住三个要点：

1. **作用域优先级**：Managed > 命令行 > Local > Project > User，更具体的总是赢
2. **善用 `$schema`**：一行配置换来编辑器自动完成，性价比极高
3. **权限评估顺序**：deny 先于 ask 先于 allow，第一个匹配的规则获胜

下一篇将精读 **Hooks** 相关内容，教你如何在工具执行前后自动运行自定义脚本。

---

*本文精读自 [Claude Code 设置 - Claude Code 官方文档](https://code.claude.com/docs/zh-CN/settings)*

*最后更新：2026-03-31*
