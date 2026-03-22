---
title: 精读官方文档：设置 Claude Code
date: 2026-03-18 21:00:00
updated: 2026-03-22 14:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 4
description: 精读 Claude Code 设置文档，了解配置文件、模型选择、MCP 服务器等核心配置项。
cover: https://picsum.photos/seed/claude-setup/1920/1080
source_url: https://code.claude.com/docs/zh-CN/setup

# 精读官方文档：设置 Claude Code
> 💬 hippo：这是系列的第三篇。设置文档看起来很枯燥，但这里是 Claude Code 最容易被误解的地方——很多人以为装好就能用，其实配置才是发挥威力的关键。
## 开篇：为什么设置很重要
我见过两种极端：
1. **完全不配置**——用默认设置跑，遇到不爽就放弃
2. **过度配置**——上来就把 CLAUDE.md 写到 700 行，把自己累死
**正确的姿势**：先理解核心配置项，再根据实际需求渐进式添加。
<!-- more -->
## 核心概念：配置文件结构
### 配置文件的优先级
Claude Code 的配置是分层的：
```
~/.claude/                    # 用户级配置（跨所有项目）
├── settings.json             # 全局设置
├── config.json               # 认证 token 等
└── skills/                   # 全局 Skills
项目根目录/
├── CLAUDE.md                 # 项目级指引（最常用）
├── .claude/
│   ├── settings.json         # 项目级设置
│   ├── hooks/                # Hooks 脚本
│   └── skills/               # 项目级 Skills
└── source/...                # 你的代码
> 💬 hippo：记住这个优先级：**项目级 > 用户级**。大多数时候你只需要关心项目级的 `CLAUDE.md` 和 `.claude/settings.json`。
### 配置文件的作用
| 配置文件 | 作用 | 使用频率 |
|-----------|------|---------|
| `CLAUDE.md` | 项目级记忆和指引 | ⭐⭐⭐⭐⭐⭐ |
| `.claude/settings.json` | 项目级设置（模型、Hooks 等） | ⭐⭐⭐⭐⭐ |
| `.claude/hooks/` | Hooks 脚本 | ⭐⭐⭐ |
| `~/.claude/settings.json` | 用户级全局设置 | ⭐⭐⭐ |
| `~/.claude/skills/` | 全局 Skills | ⭐⭐⭐ |
## 实战指南：配置你的 Claude Code
### 场景 1：选择合适的模型
**问题背景**：
Claude Code 支持多个模型，不同模型在速度、质量、成本上有所差异。
**可用的模型**：
- `claude-opus-4-6` - 最强，适合复杂推理任务
- `claude-sonnet-4-6` - 默认，速度和质量平衡
- `claude-haiku-4-5` - 最快最便宜，适合简单任务
**配置方式**（项目级）：
在 `.claude/settings.json` 中配置：
```json
{
  "model": {
    "default": "claude-sonnet-4-6"
  }
}
> 💬 hippo：默认用 Sonnet 就好。遇到特别复杂的任务（比如重构整个模块），可以临时切换到 Opus。
> 但要注意：Opus 的成本是 Sonnet 的 3-4 倍，不要一直用。
### 场景 2：配置 MCP 服务器
你希望 Claude Code 能访问外部服务，比如实时网页搜索、数据库查询等。
**什么是 MCP**：
MCP（Model Context Protocol）是连接外部服务的标准协议。
  "mcpServers": {
    "web-search": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-web-search"]
    }
> 💬 hippo：MCP 是连接外部服务的接口。最常用的是 Web Search，让 Claude 能查实时信息。
> 其他如 Notion、GitHub 也可以接入，让 Claude 能直接操作这些服务。
### 场景 3：配置 Hooks 提升安全性
你担心 Claude Code 可能执行危险操作（比如删除整个项目）。
**配置 Hooks**（项目级）：
在 `.claude/hooks/` 目录下创建脚本，然后在 `.claude/settings.json` 中引用。
**示例：拦截危险命令**：
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-dangerous.sh"
        }]
      }
    ]
**拦截脚本示例**：
```bash
# .claude/hooks/block-dangerous.sh
#!/bin/bash
# 检查命令中是否包含危险关键词
DANGEROUS_COMMANDS=("rm -rf" "rm -r /" "dd if=" "mkfs")
for cmd in "${DANGEROUS_COMMANDS[@]}"; do
  if [[ "$*" == *"$cmd"* ]]; then
    echo "❌ 阻止了危险命令: $*"
    exit 1
  fi
done
echo "✓ 命令安全检查通过"
> 💬 hippo：Hooks 是确定性执行的脚本，用于安全拦截、提交前测试等。
> 我强烈建议配置"危险命令拦截"，防止 `rm -rf` 这种操作。
## CLAUDE.md：项目记忆
这是最重要的配置文件，没有之一。
### 标准结构
```markdown
# 项目名 - Claude 指南
## Critical Rules（必须遵守）
- 所有主题修改写在 _config.butterfly.yml，不要动 node_modules
- git push 前必须等待我确认
- 一次只做一件事，完成并确认后再继续
## 项目概览
- 技术栈：Hexo + Butterfly 主题，部署在 GitHub Pages
- 关键目录：source/_posts/（文章），_config.butterfly.yml（主题配置）
## 工作方式
- 本地预览：hexo clean && hexo server
- 发布：git push
## Claude 常犯的错误
- 错误：修改 node_modules 里的文件
- 正确：所有配置改 _config.butterfly.yml
> 💬 hippo：CLAUDE.md 的核心就三层——地图（项目结构）、意图（为什么这样设计）、操作手册（怎么做事）。
> 保持 200 行以内，细节放 `.claude/docs/`。
### 最佳实践
1. **只写必要的信息**：CLAUDE.md 不是项目文档，是给 AI 看的指引
2. **保持简洁**：200 行以内，突出关键点
3. **分层组织**：用标题分隔不同类型的信息
4. **及时更新**：项目变化时同步更新
## hippo 的踩坑实录
### 坑点 1：配置不生效
**表现**：
在 `.claude/settings.json` 中配置了模型，但 Claude Code 还是使用默认模型。
**原因**：
配置文件格式错误，或者 JSON 语法有问题。
**解决**：
# 验证 JSON 格式
cat .claude/settings.json | python -m json.tool
# 或者用 jq
jq . .claude/settings.json
> 💬 hippo：JSON 格式非常严格，少个逗号、多个引号都会导致整个文件失效。
> 配置后最好验证一下 JSON 格式。
### 坑点 2：Hooks 脚本没有执行权限
配置了 Hooks，但脚本没有被调用。
脚本文件没有执行权限。
# 添加执行权限
chmod +x .claude/hooks/*.sh
# 验证权限
ls -la .claude/hooks/
> 💬 hippo：这是 Hooks 配置中最常见的坑。
> 建议在添加新 Hooks 后，立即测试是否能正常工作。
### 最佳实践总结
1. **先理解再配置**：不要盲目复制配置
2. **小步迭代**：每次只改一个配置项，验证后再继续
3. **保留默认值**：不需要的配置项就不要写，保持简单
4. **文档化你的配置**：在 `.claude/docs/` 中写清楚每个配置的作用
## 常见问题解答
**Q: 配置文件在哪里？**
A: 用户级在 `~/.claude/`，项目级在项目根的 `.claude/` 目录。
**Q: CLAUDE.md 会被提交到 Git 吗？**
A: 不会，`.claude/` 目录在 `.gitignore` 中。但如果你把它放在项目根目录，需要手动添加到 `.gitignore`。
**Q: 如何在不同项目中用不同的模型？**
A: 在每个项目的 `.claude/settings.json` 中配置，没有配置则使用全局默认值。
**Q: MCP 服务器配置了但没有用？**
A: 检查 MCP 服务器是否能正常运行，命令路径是否正确。可以先手动执行命令测试。
## 延伸阅读
- 相关文档：[如何工作](https://code.claude.com/docs/zh-CN/how-claude-code-works)
- 参考资料：[MCP 规范](https://modelcontextprotocol.io/)
**上一篇**：[精读官方文档：快速开始](/ai-tools/official-docs/claude-quickstart/)
**下一篇**：[精读官方文档：Claude Code 如何工作](/ai-tools/official-docs/how-claude-code-works/)
*本文精读自 [精读官方文档：设置 Claude Code - Claude Code Docs](https://code.claude.com/docs/zh-CN/setup)*
