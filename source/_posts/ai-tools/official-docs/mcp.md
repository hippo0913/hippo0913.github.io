---
title: 精读官方文档：通过 MCP 将 Claude Code 连接到工具
date: 2026-03-18 23:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 13
description: MCP（Model Context Protocol）是连接 Claude Code 与外部工具的开源标准协议。本文精读官方文档，详解三种传输方式、配置作用域、动态认证、工具搜索与企业级管控。
cover: https://picsum.photos/seed/claude-mcp-tools/1920/1080
source_url: https://code.claude.com/docs/zh-CN/mcp
---

# 精读官方文档：通过 MCP 将 Claude Code 连接到工具

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。MCP 是我最期待深挖的功能——它让 Claude Code 从"代码助手"升级为"全能管家"。

---

## 一、这个功能是什么

**MCP（Model Context Protocol，模型上下文协议）** 是一个开源标准协议，用于连接 AI 应用与外部工具。简单说，它让 Claude Code 能直接调用你的数据库、API、监控系统、项目管理工具等，不用复制粘贴，Claude 通过协议直接与这些系统对话。

想象一下这些场景：

- 让 Claude 读取 JIRA 任务，写完代码后自动创建 GitHub PR
- 让 Claude 查询 Sentry 错误日志，分析生产问题
- 让 Claude 连接 PostgreSQL，用自然语言查询数据生成报告
- 让 Claude 响应 Telegram 消息、Discord 聊天、webhook 事件——它不只是主动执行任务，还能被动响应外部事件

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装与管理 MCP 服务器

Claude Code 支持三种传输方式连接 MCP 服务器：

```bash
# HTTP 方式（推荐云服务，最广泛支持）
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 带 Bearer Token 认证
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"

# Stdio 方式（本地进程，直接访问系统资源）
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

**三种传输方式对比：**

| 传输方式 | 适用场景 | 优点 | 缺点 |
|---|---|---|---|
| HTTP | 云服务、在线 API（Notion、Stripe） | 最广泛支持，配置简单 | 需要网络连接 |
| SSE | 需要服务器主动推送的场景 | 服务器可实时推送 | 相对小众 |
| Stdio | 本地工具、数据库 | 直接访问系统资源，无需网络 | 需要本地安装依赖 |

**日常管理命令：**

```bash
claude mcp list              # 列出所有已配置的服务器
claude mcp get github        # 查看特定服务器详情
claude mcp remove github     # 删除服务器
claude mcp add-json <名称> '<JSON配置>'        # 从 JSON 配置导入
claude mcp add-from-claude-desktop             # 从 Claude Desktop 一键导入
```

在 Claude Code 会话内，用 `/mcp` 可以查看所有服务器的连接状态。

几个值得注意的特性：

- **动态工具更新**：服务器端新增工具后通过 `list_changed` 通知自动刷新，不需要断开重连
- **频道推送**：服务器声明 `claude/channel` 能力 + 启动时加 `--channels` 标志，Claude 就能被动响应外部事件（CI 结果、监控警报等）
- **Claude.ai 自动同步**：登录 Claude.ai 账户后，你在 Claude.ai 中添加的 MCP 服务器会自动可用，可用 `ENABLE_CLAUDEAI_MCP_SERVERS=false` 禁用

**插件 MCP 服务器**是官方新增的能力：插件可以捆绑自己的 MCP 服务器，启用插件时自动启动，无需手动配置。插件根目录的 `.mcp.json` 使用两个特殊环境变量——`${CLAUDE_PLUGIN_ROOT}`（插件安装路径）和 `${CLAUDE_PLUGIN_DATA}`（插件持久数据路径）：

```json
{
  "mcpServers": {
    "database-tools": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": { "DB_URL": "${DB_URL}" }
    }
  }
}
```

### 2.2 配置作用域与环境变量

MCP 服务器可以配置在三个不同的作用域：

| 作用域 | 存储位置 | 可见范围 | 适用场景 |
|---|---|---|---|
| Local（默认） | `~/.claude.json`（项目路径下） | 仅自己、仅当前项目 | 个人实验、敏感凭证 |
| Project | 项目根目录 `.mcp.json` | 所有团队成员 | 团队共享工具 |
| User | `~/.claude.json` | 本机所有项目 | 个人常用跨项目工具 |

```bash
# 添加不同作用域的服务器
claude mcp add --transport http stripe https://mcp.stripe.com              # 默认 Local
claude mcp add --transport http github --scope project https://api.githubcopilot.com/mcp/
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

Project scope 首次使用时会弹确认提示，防止恶意仓库悄悄注入 MCP 服务器。可以用 `claude mcp reset-project-choices` 重置确认记录。

**环境变量扩展**让 `.mcp.json` 安全提交到 Git——配置共享，凭证各管各的：

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

`${VAR}` 直接引用环境变量，`${VAR:-default}` 在变量未设置时使用默认值。这五个字段都支持：`command`、`args`、`env`、`url`、`headers`。

还有几个实用的引用机制：

- **MCP 资源引用**：`@server-name:resource-path`，像引用本地文件一样引用 MCP 服务器暴露的资源
- **MCP 提示作命令**：服务器公开的提示（Prompt）可以直接作为 Claude Code 的斜杠命令使用
- **Elicitation（引发请求）**：服务器在执行过程中可以中途请求用户输入，支持表单模式和 URL 模式，让交互式工作流成为可能

### 2.3 认证与高级功能

许多云 MCP 服务器需要身份验证，Claude Code 内置 OAuth 2.0 支持。三种常见场景：

```bash
# 固定回调端口（匹配预注册的重定向 URI）
claude mcp add --transport http --callback-port 8080 my-server https://mcp.example.com/mcp

# 预配置客户端 ID（服务器不支持动态客户端注册时）
claude mcp add --transport http --client-id <YOUR_CLIENT_ID> --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

如果标准 OAuth 元数据端点返回错误，可以在 `.mcp.json` 中覆盖发现端点（需 v2.1.64+，URL 必须用 `https://`）：

```json
{
  "mcpServers": {
    "my-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "authServerMetadataUrl": "https://auth.example.com/.well-known/openid-configuration"
      }
    }
  }
}
```

**headersHelper 动态认证**解决非 OAuth 场景（Kerberos、短期令牌、内部 SSO 等），每次连接时运行脚本生成请求标头：

```json
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "/opt/bin/get-mcp-auth-headers.sh"
    }
  }
}
```

也支持内联命令：`"headersHelper": "echo '{\"Authorization\": \"Bearer '\"$(get-token)\"'\"}'"`。

**headersHelper 要求：**

| 要求 | 说明 |
|---|---|
| 输出格式 | 必须输出字符串键值对的 JSON 对象 |
| 执行环境 | 在 shell 中运行，10 秒超时 |
| 优先级 | 动态标头覆盖同名的静态 `headers` |
| 执行时机 | 每次连接时运行（会话启动和重连） |

注意没有缓存机制，脚本需要自行处理令牌重用。

MCP 输出默认限制 25,000 tokens，超过 10,000 会警告。可以通过 `MAX_MCP_OUTPUT_TOKENS` 环境变量调整。另外，`claude mcp serve` 命令可以把 Claude Code 本身作为 MCP 服务器供其他应用调用。

### 2.4 工具搜索与企业管控

**工具搜索**解决多 MCP 服务器场景下的上下文溢出问题。当工具描述超过上下文窗口 10% 时，自动启用按需加载——只有实际需要的工具才会载入上下文。

**ENABLE_TOOL_SEARCH 配置值：**

| 值 | 行为 |
|---|---|
| （未设置） | 默认启用；`ANTHROPIC_BASE_URL` 指向非官方主机时禁用 |
| `true` | 始终启用 |
| `auto` | 工具超过 10% 上下文时激活 |
| `auto:5` | 在自定义阈值（5%）激活 |
| `false` | 禁用，所有工具预先加载 |

```bash
ENABLE_TOOL_SEARCH=auto:5 claude  # 自定义 5% 阈值
ENABLE_TOOL_SEARCH=false claude   # 完全禁用
```

工具搜索需要 Sonnet 4+ 或 Opus 4+ 模型，Haiku 不支持。

**企业管控**通过 `managed-mcp.json` 实现集中控制，部署到系统目录后用户无法修改：

| 系统 | 部署路径 |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/` |
| Linux/WSL | `/etc/claude-code/` |
| Windows | `C:\Program Files\ClaudeCode\` |

```json
{
  "mcpServers": {
    "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/" },
    "company-internal": {
      "type": "stdio",
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp-config.json"],
      "env": { "COMPANY_API_URL": "https://internal.company.com" }
    }
  }
}
```

配合 **Allowlist/Denylist** 做细粒度策略控制：

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem"] },
    { "serverUrl": "https://mcp.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "dangerous-server" },
    { "serverUrl": "https://*.untrusted.com/*" }
  ]
}
```

**限制规则类型：**

| 规则类型 | 匹配方式 | 适用服务器 |
|---|---|---|
| `serverName` | 按配置的服务器名称匹配 | 所有类型 |
| `serverCommand` | 按命令和参数精确匹配（顺序必须一致） | 仅 Stdio |
| `serverUrl` | 按 URL 通配符匹配 | 仅远程（HTTP/SSE） |

关键规则：命令匹配是精确匹配——参数顺序、个数必须完全一致；Denylist 优先级最高，Allowlist 中的服务器只要匹配 Denylist 就会被阻止。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用 MCP 过程中的经验：

### 场景一：团队项目用 Project scope + 环境变量

团队项目最推荐的做法是 `.mcp.json` 用环境变量，安全提交到 Git，每人设置自己的环境变量：

```bash
# 每人在 .zshrc 中设置
export NOTION_API_KEY="secret_xxx"
export SENTRY_AUTH_TOKEN="xxx"
```

```json
{
  "mcpServers": {
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "headers": { "Authorization": "Bearer ${NOTION_API_KEY}" }
    }
  }
}
```

新成员 clone 项目后只需设置环境变量就能直接用，零配置成本。

### 场景二：连接 PostgreSQL 做自然语言查询

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:password@localhost:5432/analytics"
```

添加后就可以用自然语言查数据：`"本月总收入是多少？"`、`"找出 90 天内未购买的客户"`。建议用只读账号，避免 Claude 意外修改数据。

### 场景三：headersHelper 配合内部 SSO

公司内部 MCP 服务器走 SSO 认证，token 每小时过期。用 headersHelper 写个脚本自动获取短期令牌，每次连接时运行，10 秒超时完全够用。注意脚本里要自己处理 token 缓存，否则每次都走一遍 SSO 流程会很慢。

### 场景四：工具搜索解决上下文溢出

项目里配了 8 个 MCP 服务器，工具描述撑爆了上下文窗口。设 `ENABLE_TOOL_SEARCH=auto:5` 把阈值降到 5%，按需加载后上下文占用明显下降。不过 Haiku 模型不支持这个功能，必须用 Sonnet 4+ 以上。

---

## 四、常见问题

**Q: HTTP、SSE、Stdio 三种方式怎么选？**

A: 云服务（Notion、GitHub、Sentry）选 HTTP，需要实时推送选 SSE，本地工具（数据库、文件系统）选 Stdio。不确定就选 HTTP，它支持最广泛。

**Q: MCP 服务器连接失败怎么排查？**

A: 三步走：先用 `curl -I <URL>` 测试端点是否可达，再 `claude mcp get <名称>` 查看配置详情，最后看 `~/.claude/logs/` 下的日志。

**Q: 如何把 Claude Code 本身作为 MCP 服务器？**

A: 运行 `claude mcp serve`，然后在调用方的配置中添加 stdio 类型指向 `claude mcp serve` 即可。

---

## 五、小结

MCP 是 Claude Code 的"超能力扩展槽"，通过标准协议连接外部工具。核心要点：三种传输方式选 HTTP 不会错、团队项目用 Project scope + 环境变量、企业管控靠 managed-mcp.json + Allowlist/Denylist。

---

*本文精读自 [通过 MCP 将 Claude Code 连接到工具](https://code.claude.com/docs/zh-CN/mcp)*

*最后更新：2026-03-31*
