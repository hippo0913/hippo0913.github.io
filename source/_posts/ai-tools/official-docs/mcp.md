---
title: 精读官方文档：通过 MCP 将 Claude Code 连接到工具
date: 2026-03-21 12:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 13
description: 精读 Claude Code MCP 文档，了解如何连接外部工具、数据库、API 等数百个服务，将 AI 助手打造成你的技术中枢。
cover: https://picsum.photos/seed/claude-mcp/1920/1080
source_url: https://code.claude.com/docs/zh-CN/mcp

# 精读官方文档：通过 MCP 将 Claude Code 连接到工具
> 💬 hippo：这是《Claude Code 官方文档精读》系列的第十三篇。MCP（Model Context Protocol）可能是 Claude Code 最强大的扩展能力——它让 Claude 从"本地工具"变成"技术中枢"。
## 开篇：为什么 MCP 值得精读
我之前把 Claude Code 当成"聪明的代码编辑器"：
- 它能读懂我的项目
- 能帮我写代码、调试、重构
- 但一切都局限在我的本地代码库
直到我发现了 MCP，一切都不一样了。
**MCP 的核心价值**：
- 不再局限于本地文件——可以访问数据库、API、监控数据
- 不再需要手动操作——Claude 可以直接查询数据库、调用 API
- 不再是孤岛工作——把多个数据源连接到一个会话
> 💬 hippo：用通俗的话说——MCP 就像给 Claude 装了"网线"和"数据线"。
> 之前它只能在本地文件里"逛"，现在它可以连接到任何有 MCP 服务器的数据源。
<!-- more -->
## 核心概念：用大白话讲清楚
### 1. 什么是 MCP
**官方定义**：
Model Context Protocol (MCP) 是一个用于 AI 工具集成的开源标准。MCP 服务器为 Claude Code 提供对您的工具、数据库和 API 的访问权限。
> 💬 hippo：用类比解释——MCP 就像是 AI 工具界的 USB。
> 任何支持 MCP 的工具都可以通过"标准接口"插到 Claude Code 上，Claude 就能直接使用它。
>
> 就像你的鼠标、键盘、U盘都是 USB 设备，但都能插到电脑上使用。
### 2. 三种 MCP 传输方式
| 传输方式 | 适用场景 | 示例 |
|---------|---------|------|
| **HTTP** | 云服务、SaaS API | Notion、GitHub Copilot、Stripe |
| **SSE** | 需要实时推送的服务 | Asana、Slack |
| **Stdio** | 本地进程、自定义脚本 | 数据库工具、文件系统访问 |
> 💬 hippo：选择传输方式很简单：
> - 如果是云服务，用 HTTP
> - 如果需要本地系统访问，用 Stdio
> - SSE 比较少见，主要是一些特殊场景
### 3. MCP 配置的三个范围
| 范围 | 存储位置 | 适用场景 |
|------|----------|----------|
| **本地范围** | `~/.claude.json` | 个人服务器、敏感凭据 |
| **项目范围** | `.mcp.json` | 团队共享、项目特定工具 |
| **用户范围** | `~/.claude.json` | 跨项目使用的个人工具 |
**优先级**：本地 > 项目 > 用户
> 💬 hippo：这个设计很巧妙——个人配置可以覆盖团队配置。
> 比如团队用 GitHub，你想用自己的账号，配置本地范围即可。
## 实战指南：手把手教你用
### 场景 1：连接到 Notion（HTTP 服务器）
**问题背景**：
你想让 Claude 访问你的 Notion 数据库，进行信息查询和文档管理。
**解决步骤**：
1. **添加 Notion MCP 服务器**
   ```bash
   claude mcp add --transport http notion https://mcp.notion.com/mcp
   ```
2. **通过 OAuth 认证**
   /mcp
   # 选择 "notion"，点击"身份验证"
3. **测试连接**
   "在 Notion 中查找最近更新的任务"
> 💬 hippo：第一次使用时，Claude 会提示你完成 OAuth 流程。
> 成功后，Notion 的数据就像本地文件一样，Claude 可以直接查询。
**预期效果**：
Claude 可以直接读取、搜索、修改 Notion 中的内容。
### 场景 2：连接到 PostgreSQL 数据库（Stdio 服务器）
你想让 Claude 查询生产数据库的只读副本，用于数据分析和调试。
1. **安装数据库 MCP 服务器**
   claude mcp add --transport stdio db \
     -- npx -y @bytebase/dbhub \
     --dsn "postgresql://readonly:[email protected]:5432/analytics"
2. **自然查询数据库**
   "查询最近的 10 个用户的订单"
3. **分析数据**
   "分析过去 7 天的订单趋势"
> 💬 hippo：注意 `--dsn` 中的 `readonly` 前缀。
> 这确保 Claude 只能读取数据，不能修改——生产数据库的安全实践。
Claude 可以直接执行 SQL 查询、分析结果，而不需要你手动导出数据。
### 场景 3：项目级 MCP 配置（团队共享）
你的团队需要统一的 MCP 工具配置，确保每个成员都有相同的可用工具。
1. **创建 `.mcp.json` 文件**
   touch .mcp.json
2. **配置项目范围的 MCP 服务器**
   ```json
   {
     "mcpServers": {
       "github": {
         "type": "http",
         "url": "https://api.githubcopilot.com/mcp/"
       },
       "sentry": {
         "url": "https://mcp.sentry.dev/mcp"
       "db-analytics": {
         "command": "/path/to/db-server",
         "args": ["--config", "${DB_CONFIG}"],
         "env": {
           "DB_URL": "${ANALYTICS_DB_URL}"
         }
       }
     }
   }
3. **提交到版本控制**
   git add .mcp.json
   git commit -m "chore: add project MCP configuration"
   git push
> 💬 hippo：使用环境变量扩展的好处——团队可以共享配置，每个人只需设置自己的敏感值。
> 比如 `DB_URL` 在配置文件中引用，实际值在每个人的环境变量中。
团队成员拉取代码后，自动获得所有 MCP 工具配置。
### 场景 4：限制 MCP 工具输出
某个 MCP 服务器返回大量数据，占用了太多上下文。
1. **检查输出警告**
   # Claude 会显示类似警告：
   # "⚠️ MCP tool output exceeded 10,000 tokens"
2. **调整输出限制**
   export MAX_MCP_OUTPUT_TOKENS=50000
   claude
3. **或在 settings.json 中配置**
     "env": {
       "MAX_MCP_OUTPUT_TOKENS": "50000"
> 💬 hippo：默认限制是 25,000 tokens。
> 如果你经常遇到警告，可以适当调高，但注意不要设置得太大。
MCP 工具可以返回更多数据，不会触发警告或被截断。
## hippo 的踩坑实录
### 坑点 1：OAuth 回调失败
**表现**：
添加需要 OAuth 的 MCP 服务器后，点击"身份验证"一直失败。
**原因**：
某些服务器需要预先注册的回调端口，但 Claude Code 默认使用随机端口。
**解决**：
1. 使用 `--callback-port` 固定端口
   claude mcp add --transport http \
     --callback-port 8080 \
     my-server https://mcp.example.com/mcp
2. 或在服务器配置中指定 OAuth 元数据 URL
       "my-server": {
         "url": "https://mcp.example.com/mcp",
         "oauth": {
           "authServerMetadataUrl": "https://auth.example.com/.well-known/openid-configuration"
> 💬 hippo：这个问题我踩过，花了不少时间排查。
> 记住：如果看到"不兼容的身份验证服务器"错误，试试这两个方法。
### 坑点 2：项目范围 MCP 需要批准
在 `.mcp.json` 中配置了 MCP 服务器，但 Claude Code 提示批准。
出于安全考虑，Claude Code 会在首次使用项目范围的 MCP 服务器时要求批准。
1. **手动批准**：在提示中点击"允许"
2. **重置批准选择**（如果需要）
   claude mcp reset-project-choices
> 💬 hippo：这个设计是合理的——团队配置的服务器需要你明确同意。
> 但如果批准错了，可以用上面的命令重置。
### 坑点 3：环境变量未设置
在 `.mcp.json` 中使用了 `${VAR}` 语法，但配置解析失败。
环境变量未设置，且没有提供默认值。
1. **设置环境变量**
   export API_KEY=your-actual-key
   export DB_URL=postgresql://user:pass@localhost:5432/db
2. **或提供默认值**
       "api-server": {
         "url": "${API_BASE_URL:-https://api.example.com}/mcp"
> 💬 hippo：`${VAR:-default}` 语法很实用——提供备选值。
> 比如开发环境用默认 URL，生产环境用实际 URL。
### 坑点 4：MCP 工具太多导致上下文不足
配置了大量 MCP 服务器后，会话变得很慢或提示"上下文窗口已满"。
所有 MCP 工具描述都被预加载到上下文中，消耗大量 token。
1. **启用工具搜索**（默认已启用）
   # 自动模式：当工具超过 10% 上下文时启用
   ENABLE_TOOL_SEARCH=auto claude
   # 或调整阈值到 5%
   ENABLE_TOOL_SEARCH=auto:5 claude
2. **查看工具搜索状态**
   # 检查是否有"工具搜索已启用"提示
> 💬 hippo：工具搜索会动态加载工具，而不是预加载所有。
> 这样只把 Claude 实际需要的工具加载到上下文中。
### 最佳实践总结
1. **根据传输方式选择服务器**：HTTP 用于云服务，Stdio 用于本地
2. **团队配置用项目范围**：`.mcp.json` 提交到版本控制
3. **敏感值用环境变量**：`${VAR:-default}` 语法
4. **监控输出大小**：必要时调整 `MAX_MCP_OUTPUT_TOKENS`
5. **利用工具搜索**：避免上下文被过多工具定义占用
## 常见问题解答
**Q: MCP 和 Skills 有什么区别？**
A: Skills 是你编写的"使用说明书"，教 Claude 怎么做某事；MCP 是把外部工具"接入"到 Claude，让 Claude 能直接使用它们。Skills 是代码级别的指令，MCP 是工具级别的集成。
**Q: 什么时候用 HTTP，什么时候用 Stdio？**
A: 如果服务在云端（如 Notion、GitHub Copilot），用 HTTP；如果需要访问本地系统或执行本地脚本（如数据库、文件操作），用 Stdio。
**Q: 可以同时配置多个 MCP 服务器吗？**
A: 可以。你可以在本地、项目、用户三个范围内配置任意数量的服务器。Claude 会自动发现并列出所有可用工具。
**Q: 如何禁用某个 MCP 工具？**
A: 在权限设置中拒绝特定工具：
```json
{
  "permissions": {
    "deny": ["SomeMcpTool"]
  }
}
```
**Q: MCP 工具会产生安全风险吗？**
A: 取决于你连接的服务器。Claude Code 会提示你批准项目范围的 MCP 服务器，你也可以在 `/permissions` 中控制哪些 MCP 工具可以被调用。
## 延伸阅读
- 相关文档：[Skills 参考](https://code.claude.com/docs/zh-CN/skills)
- 参考资料：[Settings 参考](https://code.claude.com/docs/zh-CN/settings)
**上一篇**：[精读官方文档：创建自定义 subagents](/ai-tools/official-docs/sub-agents/)
**下一篇**：[精读官方文档：Claude Code 设置](/ai-tools/official-docs/settings/)
*本文精读自 [精读官方文档：通过 MCP 将 Claude Code 连接到工具 - Claude Code Docs](https://code.claude.com/docs/zh-CN/mcp)*
