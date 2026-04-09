---
title: 精读官方文档：Claude Code 设置
date: 2026-03-17 23:00:00
updated: 2026-04-09 01:15:00
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

**每种作用域的典型场景：**

- **Managed**：企业安全策略、合规要求、IT 统一部署的配置
- **User**：个人偏好（主题、编辑器设置）、跨项目通用的工具和插件
- **Project**：团队共享设置（权限规则、Hooks、MCP 服务器）、团队标准化工具
- **Local**：个人对特定项目的覆盖、测试中的配置、机器相关设置

**作用域适用的功能一览：**

| 功能 | User 位置 | Project 位置 | Local 位置 |
|------|----------|-------------|------------|
| **Settings** | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| **Subagents** | `~/.claude/agents/` | `.claude/agents/` | 无 |
| **MCP 服务器** | `~/.claude.json` | `.mcp.json` | `~/.claude.json`（按项目） |
| **Plugins** | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| **CLAUDE.md** | `~/.claude/CLAUDE.md` | `CLAUDE.md` 或 `.claude/CLAUDE.md` | `CLAUDE.local.md` |

需要特别注意的是，`settings.json` 和 `~/.claude.json` 是两个独立的文件。前者管理运行时行为（权限、沙箱、Hooks 等），后者存储全局偏好：

| ~/.claude.json 配置键 | 说明 |
|---|---|
| `autoConnectIde` | 自动连接检测到的 IDE |
| `autoInstallIdeExtension` | 自动安装 IDE 扩展 |
| `editorMode` | 编辑器模式偏好 |
| `showTurnDuration` | 显示每轮对话耗时 |
| `terminalProgressBarEnabled` | 终端进度条 |
| `teammateMode` | Agent 团队成员显示模式：`auto`（tmux/iTerm2 分屏或 in-process）、`in-process`、`tmux` |

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
| `cleanupPeriodDays` | 会话保留天数，默认 30 天，最小 1 天，`0` 会触发验证错误 | `30` |
| `autoUpdatesChannel` | 更新渠道 | `"stable"` 或 `"latest"` |
| `disableAllHooks` | 禁用所有 Hooks | `false` |
| `companyAnnouncements` | 启动时显示的企业公告 | `["Welcome!"]` |
| `enabledPlugins` | 控制插件启用/禁用 | 见 2.4 节 |
| `worktree.symlinkDirectories` | worktree 中符号链接的目录 | `["node_modules"]` |
| `worktree.sparsePaths` | sparse-checkout 检出的目录 | `["src/core"]` |
| `autoMode` | 自定义自动模式分类器规则 | — |
| `fileSuggestion` | 自定义 `@` 文件自动完成命令 | — |
| `statusLine` | 自定义状态行配置 | — |
| `agent` | 以指定子 Agent 名义运行主线程 | `"code-reviewer"` |
| `apiKeyHelper` | 自定义认证脚本，输出作为 API Key | `/bin/generate_temp_api_key.sh` |
| `autoMemoryDirectory` | 自定义自动记忆存储目录（仅 policy/local/user） | `"~/my-memory-dir"` |
| `alwaysThinkingEnabled` | 默认启用扩展思考 | `true` |
| `channelsEnabled` | （Managed）允许 Team/Enterprise 用户使用 channels | `true` |
| `defaultShell` | 默认 shell，`"bash"` 或 `"powershell"` | `"powershell"` |
| `disableAutoMode` | 设为 `"disable"` 禁止自动模式 | `"disable"` |
| `disableDeepLinkRegistration` | 禁止注册 `claude-cli://` 协议处理器 | `"disable"` |
| `disableSkillShellExecution` | 禁用技能中的 shell 命令执行 | `true` |
| `enableAllProjectMcpServers` | 自动批准项目中所有 MCP 服务器 | `true` |
| `fastModePerSessionOptIn` | 快速模式不跨会话持久化 | `true` |
| `feedbackSurveyRate` | 质量调查出现概率（0-1） | `0.05` |
| `forceLoginMethod` | 限制登录方式（`claudeai` 或 `console`） | `"claudeai"` |
| `forceRemoteSettingsRefresh` | （Managed）启动时强制拉取远程设置 | `true` |
| `includeGitInstructions` | 在系统提示中包含 git 工作流指令 | `false` |
| `outputStyle` | 配置输出风格 | `"Explanatory"` |
| `plansDirectory` | 自定义计划文件存储目录 | `"./plans"` |
| `showThinkingSummaries` | 显示扩展思考摘要 | `true` |
| `voiceEnabled` | 启用语音听写 | `true` |

### 2.3 权限规则与 Sandbox 配置

权限是 `settings.json` 最核心的部分。规则格式为 `Tool` 或 `Tool(specifier)`，评估顺序是 **deny > ask > allow**，第一个匹配的规则获胜。

```json
{
  "permissions": {
    "allow": ["Bash(git status *)", "Bash(git diff *)", "Bash(git log *)"],
    "ask": ["Bash(git push *)", "Bash(rm *)"],
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

**权限相关额外配置：**

| 键 | 描述 | 示例 |
|---|---|---|
| `disableBypassPermissionsMode` | 设为 `"disable"` 禁用 `--dangerously-skip-permissions`，适合 Managed 设置 | `"disable"` |
| `skipDangerousModePermissionPrompt` | 跳过进入 bypass 模式的确认提示（项目级设置忽略此项） | `true` |

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
| `network.allowLocalBinding` | 允许绑定 localhost 端口（仅 macOS） | `false` |
| `network.allowAllUnixSockets` | 允许所有 Unix socket 连接 | `false` |
| `network.httpProxyPort` | 自定义 HTTP 代理端口 | `8080` |
| `network.socksProxyPort` | 自定义 SOCKS5 代理端口 | `8081` |
| `network.allowManagedDomainsOnly` | （Managed）仅使用 Managed 设置中的 allowedDomains | `true` |
| `failIfUnavailable` | 沙箱不可用时启动报错（而非降级运行） | `true` |
| `allowUnsandboxedCommands` | 设为 `false` 完全禁用沙箱逃逸 | `false` |
| `filesystem.denyWrite` | 禁止写入的路径 | `["/etc"]` |
| `filesystem.allowRead` | 在 denyRead 区域内重新允许读取 | `["."]` |
| `filesystem.allowManagedReadPathsOnly` | （Managed）仅使用 Managed 的 allowRead | `true` |
| `enableWeakerNestedSandbox` | 在无特权 Docker 中使用较弱沙箱（降低安全性） | `true` |
| `enableWeakerNetworkIsolation` | （macOS）允许系统 TLS 服务（降低安全性） | `true` |

路径前缀有三种：`/` 绝对路径、`~/` 主目录、`./` 或无前缀表示项目根目录。文件系统限制和权限规则两种机制会合并生效。

### 2.4 Managed 企业设置与插件系统

**Managed 设置有三种交付方式：**

| 方式 | 说明 |
|---|---|
| 服务器管理 | 通过 Claude.ai 管理员控制台，Anthropic 服务器直接交付 |
| MDM/OS 策略 | macOS plist（Jamf/Kandji）、Windows 注册表（`HKLM\SOFTWARE\Policies\ClaudeCode`，用户级 `HKCU\SOFTWARE\Policies\ClaudeCode`） |
| 基于文件 | 系统目录下的 `managed-settings.json`，支持 `managed-settings.d/` 片段合并 |

片段合并时，`managed-settings.json` 作为基础，`managed-settings.d/` 中所有 `*.json` 按字母顺序叠加上去——标量覆盖、数组连接去重、对象深度合并。以 `.` 开头的隐藏文件会被忽略。用数字前缀控制顺序，比如 `10-telemetry.json` 先于 `20-security.json`。除了 `managed-settings.json`，还支持 `managed-mcp.json` 用于托管 MCP 服务器配置。

**插件系统**通过 `enabledPlugins` 控制启用/禁用，`extraKnownMarketplaces` 注册额外市场：

```json
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true,
    "analyzer@security-plugins": false
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": "github",
      "repo": "acme-corp/claude-plugins"
    },
    "security-plugins": {
      "source": "git",
      "url": "https://git.example.com/security/plugins.git"
    }
  }
}
```

> ⚠️ 注意：`extraKnownMarketplaces` 格式已从数组改为对象格式。每个键是市场名称，值包含 `source` 字段。支持的 source 类型：`github`（用 `repo`）、`git`（用 `url`）、`directory`（本地开发）、`hostPattern`（正则匹配）、`settings`（内联声明）。

Managed 设置还可以通过 `strictKnownMarketplaces` 限制用户只能使用指定的市场（支持 github、git、url、npm、file、directory、hostPattern 七种 source 类型），配合 `allowManagedHooksOnly`、`allowedHttpHookUrls`、`httpHookAllowedEnvVars` 控制 Hook 的安全边界。

### 2.5 文件建议与子 Agent 配置

**文件建议**（File Suggestion）可以自定义 `@` 文件路径自动完成的逻辑，适合大型 monorepo 使用预构建索引：

```json
{
  "fileSuggestion": {
    "type": "command",
    "command": "~/.claude/file-suggestion.sh"
  }
}
```

脚本通过 stdin 接收 JSON（含 `query` 字段），通过 stdout 输出换行分隔的文件路径（最多 15 条）。

**子 Agent 配置**以 Markdown 文件存储在 agents 目录中，支持用户级和项目级：

- 用户级：`~/.claude/agents/` — 跨所有项目可用
- 项目级：`.claude/agents/` — 项目专属，可共享给团队

子 Agent 文件包含 YAML front matter 定制的系统提示和工具权限，详细用法参见子 Agent 文档。

### 2.6 命令行配置与归属设置

日常管理配置最方便的方式是命令行：

```bash
# 查看所有配置
claude config list

# 设置项目级配置
claude config set permissions.allow '["Bash(git *)"]'

# 设置全局配置（-g 标志）
claude config set -g theme dark

# 向列表追加值
claude config add permissions.allow "Bash(npm *)"
```

归属设置（Attribution）控制 git 提交和 PR 中的 Claude 署名信息。提交默认使用 git trailer 格式（如 `Co-Authored-By`），PR 描述为纯文本：

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
| `commit` | git 提交归属信息（支持 git trailer），空字符串隐藏 |
| `pr` | PR 描述归属信息（纯文本），空字符串隐藏 |

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

A: 不是。Bash 权限规则使用前缀匹配——`Bash(git *)` 匹配所有以 `git` 开头的命令。文件路径（Read/Write）支持 glob 模式，如 `Read(./secrets/**)`。

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

*最后更新：2026-04-09*
