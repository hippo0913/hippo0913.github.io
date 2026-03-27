---
title: 精读官方文档：通过 MCP 将 Claude Code 连接到工具
date: 2026-03-18 23:00:00
updated: 2026-03-27 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 13
description: MCP（Model Context Protocol）是连接 Claude Code 与外部工具的开放标准协议。本文精读官方文档，详解三种传输方式、配置作用域、企业级管控等核心内容。
cover: https://picsum.photos/seed/claude-mcp-tools/1920/1080
source_url: https://code.claude.com/docs/zh-CN/mcp
---

# 精读官方文档：通过 MCP 将 Claude Code 连接到工具

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。MCP 是我最期待深挖的功能，它能让 Claude Code 从"代码助手"升级为"全能管家"。

---

## 一、这个功能是什么

**MCP（Model Context Protocol）** 是一个开源标准协议，用于连接 AI 应用与外部工具。简单说，它让 Claude Code 能直接调用你的数据库、API、监控系统、项目管理工具等。

为什么这很重要？想象一下：

- 让 Claude 直接读取 JIRA 任务，写完代码后自动创建 GitHub PR
- 让 Claude 查询 Sentry 错误日志，分析生产问题
- 让 Claude 连接 PostgreSQL，直接查询数据生成报告

这一切都不用复制粘贴，Claude Code 通过 MCP 直接与这些系统对话。

<!-- more -->

---

## 二、官方教程精读

### 2.1 安装 MCP 服务器的三种方式

Claude Code 支持三种传输方式连接 MCP 服务器：

#### 方式一：HTTP 服务器（推荐）

HTTP 是云服务的标准传输方式，适合连接 Notion、Stripe 这类在线服务：

```bash
# 基本语法
claude mcp add --transport http <名称> <URL>

# 实际示例：连接 Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 带 Bearer Token 认证的示例
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

#### 方式二：SSE 服务器

SSE（Server-Sent Events）适合需要服务器主动推送消息的场景：

```bash
# 基本语法
claude mcp add --transport sse <名称> <URL>

# 实际示例：连接 Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse

# 带认证头的示例
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

#### 方式三：Stdio 服务器（本地进程）

Stdio 服务器在你的本地机器上运行，适合需要直接访问系统资源的工具：

```bash
# 基本语法
claude mcp add --transport stdio <名称> <命令> [参数...]

# 实际示例：连接 Airtable
claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server
```

**三种传输方式对比：**

| 传输方式 | 适用场景 | 优点 | 缺点 |
|---------|---------|------|------|
| HTTP | 云服务、在线 API | 最广泛支持、配置简单 | 需要网络连接 |
| SSE | 需要实时推送的服务 | 服务器可主动推送 | 相对小众 |
| Stdio | 本地工具、数据库 | 直接访问系统资源 | 需要本地安装 |

### 2.2 配置作用域（Scope）

MCP 服务器可以配置在三个不同的作用域级别：

**配置作用域说明表：**

| 作用域 | 存储位置 | 可见范围 | 适用场景 |
|-------|---------|---------|---------|
| Local | `~/.claude.json`（项目路径下） | 仅当前项目，仅自己 | 个人实验配置、敏感凭证 |
| Project | 项目根目录 `.mcp.json` | 所有团队成员 | 团队共享工具、项目必需服务 |
| User | `~/.claude.json` | 本机所有项目 | 个人常用工具、跨项目服务 |

#### Local Scope（默认）

```bash
# 添加 Local 作用域服务器（默认行为）
claude mcp add --transport http stripe https://mcp.stripe.com

# 显式指定 Local 作用域
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
```

#### Project Scope（团队共享）

```bash
# 添加 Project 作用域服务器
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

这会在项目根目录创建或更新 `.mcp.json` 文件：

```json
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    }
  }
}
```

> ⚠️ 出于安全考虑，Claude Code 会在首次使用 Project 作用域服务器时提示确认。如需重置确认记录，使用 `claude mcp reset-project-choices`。

#### User Scope（跨项目）

```bash
# 添加 User 作用域服务器
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### 2.3 环境变量扩展

在 `.mcp.json` 中支持环境变量扩展，方便团队共享配置同时保持灵活性：

**支持的语法：**
- `${VAR}` - 扩展为环境变量 VAR 的值
- `${VAR:-default}` - 如果 VAR 未设置，使用默认值

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

**可使用环境变量的位置：**
- `command` - 服务器可执行文件路径
- `args` - 命令行参数
- `env` - 传递给服务器的环境变量
- `url` - HTTP 服务器地址
- `headers` - HTTP 认证头

### 2.4 动态工具更新

Claude Code 支持 MCP `list_changed` 通知，允许 MCP 服务器动态更新其可用工具、提示和资源，**无需断开并重新连接**。当 MCP 服务器发送 `list_changed` 通知时，Claude Code 会自动刷新来自该服务器的可用功能。

> 💡 这意味着如果你在使用 MCP 服务器时，服务器端新增了工具，你不需要重启会话就能立即使用新工具。

### 2.5 管理已安装的服务器

```bash
# 列出所有已配置的服务器
claude mcp list

# 查看特定服务器详情
claude mcp get github

# 删除服务器
claude mcp remove github

# 在 Claude Code 会话中检查服务器状态
/mcp
```

### 2.6 从 JSON 配置导入 MCP 服务器

如果你有现成的 MCP 服务器 JSON 配置，可以直接导入：

```bash
# 从 JSON 配置添加服务器
claude mcp add-json <名称> '<JSON配置>'
```

### 2.7 从 Claude Desktop 导入 MCP 服务器

如果你已在 Claude Desktop 中配置了 MCP 服务器，可以一键导入：

```bash
# 导入 Claude Desktop 的 MCP 配置
claude mcp add-from-claude-desktop
```

### 2.8 使用 Claude.ai 的 MCP 服务器

如果你用 Claude.ai 帐户登录 Claude Code，你在 Claude.ai 中添加的 MCP 服务器会自动在 Claude Code 中可用。

如需禁用此功能：

```bash
# 禁用 Claude.ai MCP 服务器
ENABLE_CLAUDEAI_MCP_SERVERS=false claude
```

### 2.9 实用场景示例

#### 示例一：用 Sentry 监控错误

```bash
# 1. 添加 Sentry MCP 服务器
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# 2. 使用 /mcp 进行 OAuth 认证
> /mcp

# 3. 在 Claude Code 中调试生产问题
> "过去 24 小时最常见的错误有哪些？"
> "显示错误 ID abc123 的堆栈跟踪"
> "是哪个部署引入了这些新错误？"
```

#### 示例二：连接 GitHub 做代码审查

```bash
# 1. 添加 GitHub MCP 服务器
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# 2. 认证
> /mcp
# 选择 GitHub 的 "Authenticate"

# 3. 现在可以让 Claude 操作 GitHub
> "审查 PR #456 并提出改进建议"
> "为我们刚发现的 bug 创建新 issue"
> "显示所有分配给我的开放 PR"
```

#### 示例三：查询 PostgreSQL 数据库

```bash
# 1. 添加数据库服务器（带连接字符串）
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:password@localhost:5432/analytics"

# 2. 自然语言查询数据库
> "本月总收入是多少？"
> "显示 orders 表的结构"
> "找出 90 天内未购买的客户"
```

### 2.10 使用频道推送消息

MCP 服务器可以直接将消息推送到你的会话中，让 Claude 对外部事件（如 CI 结果、监控警报或聊天消息）做出反应。

要启用此功能：
1. 服务器需声明 `claude/channel` 功能
2. 启动时使用 `--channels` 标志选择加入

> 💡 这让 Claude Code 变成"被动响应"模式——即使你不在，Claude 也能对 Telegram 消息、Discord 聊天或 webhook 事件做出反应。

### 2.11 OAuth 认证高级选项

许多云 MCP 服务器需要身份验证，Claude Code 支持 OAuth 2.0。

#### 固定 OAuth 回调端口

某些 MCP 服务器需要预先注册的重定向 URI。默认情况下，Claude Code 会选择随机端口。使用 `--callback-port` 固定端口：

```bash
# 使用固定回调端口（与预注册的重定向 URI 匹配）
claude mcp add --transport http \
  --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

#### 使用预配置的 OAuth 凭据

如果服务器不支持动态客户端注册（看到"不兼容的身份验证服务器：不支持动态客户端注册"错误），需要手动提供凭据：

```bash
# 使用预配置的 client-id
claude mcp add --transport http \
  --client-id <YOUR_CLIENT_ID> \
  --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

#### 覆盖 OAuth 元数据发现

如果服务器的标准 OAuth 元数据端点返回错误，但提供了工作的 OIDC 端点，可以在 `.mcp.json` 中设置 `authServerMetadataUrl`：

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

> ⚠️ URL 必须使用 `https://`，需要 Claude Code v2.1.64 或更高版本。

#### 使用动态标头进行自定义认证

如果 MCP 服务器使用 OAuth 以外的认证方案（如 Kerberos、短期令牌、内部 SSO），使用 `headersHelper` 在连接时动态生成请求标头：

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

也支持内联命令：

```json
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "echo '{\"Authorization\": \"Bearer '\"$(get-token)\"'\"}'"
    }
  }
}
```

**headersHelper 要求：**

| 要求 | 说明 |
|-----|------|
| 输出格式 | 必须输出字符串键值对的 JSON 对象 |
| 执行环境 | 在 shell 中运行，超时 10 秒 |
| 优先级 | 动态标头会覆盖同名的静态 `headers` |
| 执行时机 | 每次连接时运行（会话启动和重连时） |

> 💡 没有缓存机制，脚本需要自行处理令牌重用。

### 2.12 企业级 MCP 配置

对于需要集中管控的组织，IT 管理员可以部署 `managed-mcp.json` 配置文件：

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    },
    "company-internal": {
      "type": "stdio",
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp-config.json"],
      "env": {
        "COMPANY_API_URL": "https://internal.company.com"
      }
    }
  }
}
```

#### 使用 Allowlist 和 Denylist 限制服务器

在托管设置文件中配置 `allowedMcpServers` 和 `deniedMcpServers`：

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverName": "sentry" },
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem"] }
  ],
  "deniedMcpServers": [
    { "serverName": "dangerous-server" },
    { "serverCommand": ["npx", "-y", "unapproved-package"] }
  ]
}
```

**限制规则说明：**

| 规则类型 | 匹配方式 | 适用服务器 |
|---------|---------|-----------|
| `serverName` | 按配置的服务器名称匹配 | 所有类型 |
| `serverCommand` | 按命令和参数精确匹配 | 仅 Stdio 服务器 |
| `serverUrl` | 按 URL 模式匹配（支持 `*` 通配符） | 仅远程服务器（HTTP/SSE） |

> ⚠️ Denylist 优先级最高：即使服务器在 Allowlist 中，只要匹配 Denylist 就会被阻止。

### 2.13 MCP 资源引用

MCP 服务器可以公开资源，你可以使用 `@` 提及来引用，类似于引用本地文件的方式：

```
# 引用 MCP 服务器提供的资源
@server-name:resource-path

# 示例：引用 Notion 中的某个文档
@notion:database/abc123
```

> 💡 这让 MCP 资源像本地文件一样可以被 Claude 直接读取和分析。

### 2.14 MCP 工具搜索

当你配置了许多 MCP 服务器时，工具定义可能会消耗大量上下文窗口。**MCP 工具搜索**通过动态按需加载工具解决这个问题。

**工作原理：**

1. 当 MCP 工具描述超过 10% 的上下文窗口时，自动启用工具搜索
2. MCP 工具被延迟加载而不是预先载入
3. Claude 使用搜索工具在需要时发现相关工具
4. 只有实际需要的工具才会加载到上下文中

**配置工具搜索：**

使用 `ENABLE_TOOL_SEARCH` 环境变量控制：

| 值 | 行为 |
|---|------|
| （未设置） | 默认启用；当 `ANTHROPIC_BASE_URL` 指向非官方主机时禁用 |
| `true` | 始终启用 |
| `auto` | MCP 工具超过 10% 上下文时激活 |
| `auto:<N>` | 在自定义阈值激活（如 `auto:5` 表示 5%） |
| `false` | 禁用，所有 MCP 工具预先加载 |

```bash
# 使用 5% 阈值
ENABLE_TOOL_SEARCH=auto:5 claude

# 完全禁用
ENABLE_TOOL_SEARCH=false claude
```

> ⚠️ 需要 Sonnet 4+ 或 Opus 4+ 模型支持。Haiku 不支持工具搜索。

**给 MCP 服务器作者的建议：**

启用工具搜索时，`serverInstructions` 字段变得更重要。它帮助 Claude 了解何时搜索你的工具。应写清楚：
- 工具处理的任务类别
- Claude 应何时搜索你的工具
- 服务器提供的关键功能

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用 MCP 过程中的踩坑经验：

### 3.1 我遇到的问题

**问题一：敏感凭证如何安全共享？**

一开始我直接在 `.mcp.json` 里写死 API Key，结果不敢提交到 Git，团队成员各自配置又容易出错。

**问题二：MCP 服务器连接失败怎么排查？**

添加了几个服务器后，有时 `/mcp` 显示连接失败，但错误信息不够明确，不知道是网络问题还是配置问题。

### 3.2 我的解决方案

**解决方案一：使用环境变量扩展**

```bash
# 在 .zshrc 或 .bashrc 中设置环境变量
export NOTION_API_KEY="secret_xxx"
export SENTRY_AUTH_TOKEN="xxx"

# .mcp.json 使用变量引用
```

```json
{
  "mcpServers": {
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "headers": {
        "Authorization": "Bearer ${NOTION_API_KEY}"
      }
    }
  }
}
```

这样 `.mcp.json` 可以安全提交到 Git，每个人用自己的环境变量。

**解决方案二：分步排查连接问题**

```bash
# 1. 先用 curl 测试 HTTP 端点是否可达
curl -I https://mcp.notion.com/mcp

# 2. 检查服务器状态
claude mcp get <服务器名>

# 3. 查看 Claude Code 日志
# 日志位置：~/.claude/logs/
```

### 3.3 我的建议

1. **从 Project Scope 开始**：团队项目优先用 `.mcp.json`，方便新成员快速上手
2. **API Key 用环境变量**：永远不要在配置文件中硬编码敏感信息
3. **先测试再投入**：添加新服务器后先用简单命令测试，确认能用再写复杂 prompt

---

## 四、常见问题

**Q: HTTP、SSE、Stdio 三种方式怎么选？**

A: 简单原则：
- 云服务（Notion、GitHub、Sentry）选 HTTP
- 需要实时推送选 SSE
- 本地工具（数据库、文件系统）选 Stdio

**Q: `.mcp.json` 应该提交到 Git 吗？**

A: 应该，但要确保使用环境变量存储敏感信息。这样团队成员只需设置自己的环境变量就能使用相同配置。

**Q: MCP 工具输出太长怎么办？**

A: Claude Code 默认限制 MCP 输出为 25,000 tokens，超过 10,000 tokens 会警告。可通过环境变量调整：

```bash
export MAX_MCP_OUTPUT_TOKENS=50000
```

**Q: 如何把 Claude Code 本身作为 MCP 服务器供其他应用调用？**

A: 使用 `claude mcp serve` 命令，然后在 Claude Desktop 的配置中添加：

```json
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

---

## 五、小结

MCP 是 Claude Code 的"超能力扩展槽"，通过简单的配置就能让 Claude 连接数据库、API、监控系统等外部工具。核心要点：

1. **三种传输方式**：HTTP（云服务）、SSE（实时推送）、Stdio（本地进程）
2. **三个作用域**：Local（个人实验）、Project（团队共享）、User（跨项目）
3. **安全实践**：永远用环境变量存储敏感信息

---

*本文精读自 [通过 MCP 将 Claude Code 连接到工具](https://code.claude.com/docs/zh-CN/mcp)*

*最后更新：2026-03-27*
