---
title: 精读官方文档：设置 Claude Code
date: 2026-03-12 20:02:00
updated: 2026-03-12 20:02:00
tags: [Claude Code, AI 工具，官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 4
description: 精读 Claude Code 设置文档，了解配置文件、模型选择、MCP 服务器等核心配置项。
cover: https://picsum.photos/seed/claude-setup/1920/1080
source_url: https://code.claude.com/docs/zh-CN/setup
---

# 精读官方文档：设置 Claude Code

> 💬 hippo：这是系列的第三篇。设置文档看起来很枯燥，但这里是 Claude Code 最容易被误解的地方——很多人以为装好就能用，其实配置才是发挥威力的关键。

---

## 开篇：为什么设置很重要

我见过两种极端：
1. **完全不配置**——用默认设置跑，遇到不爽就放弃
2. **过度配置**——上来就把 CLAUDE.md 写到 700 行，把自己累死

**正确的姿势**：先理解核心配置项，再根据实际需求渐进式添加。

---

## 配置文件位置

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
```

> 💬 hippo：记住这个优先级：**项目级 > 用户级**。大多数时候你只需要关心项目级的 `CLAUDE.md` 和 `.claude/settings.json`。

---

## 核心配置项

### 1. 模型选择

```json
{
  "model": {
    "default": "claude-sonnet-4-6-20250929"
  }
}
```

可用模型：
- `claude-opus-4-6` - 最强，适合复杂任务
- `claude-sonnet-4-6` - 默认，速度和质量平衡
- `claude-haiku-4-5` - 最快最便宜，适合简单任务

> 💬 hippo：默认用 Sonnet 就好。遇到特别复杂的任务（比如重构整个模块），可以临时切换到 Opus。

### 2. MCP 服务器

```json
{
  "mcpServers": {
    "web-search": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-web-search"]
    }
  }
}
```

> 💬 hippo：MCP 是连接外部服务的接口。最常用的是 Web Search，让 Claude 能查实时信息。其他如 Notion、GitHub 也可以接入。

### 3. Hooks 配置

```json
{
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
  }
}
```

> 💬 hippo：Hooks 是确定性执行的脚本，用于安全拦截、提交前测试等。我强烈建议配置"危险命令拦截"，防止 `rm -rf` 这种操作。

---

## CLAUDE.md：项目记忆

这是最重要的配置文件，没有之一。

### 标准结构

```markdown
# 项目名 - Claude 指引

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
  正确：所有配置改 _config.butterfly.yml
```

> 💬 hippo：CLAUDE.md 的核心就三层——地图（项目结构）、意图（为什么这样设计）、操作手册（怎么做事）。保持 200 行以内，细节放 `.claude/docs/`。

---

## 原文精读：关键段落

### 关于配置优先级

> 项目级配置优先于用户级配置，子目录级配置优先于项目级配置。

> 💬 hippo：这意味着你可以在 `CLAUDE.md` 里写项目特定的规则，在 `~/.claude/CLAUDE.md` 里写个人偏好，两者不会冲突。

### 关于模型选择

> 默认模型是 Claude Sonnet 4.6，它在速度和质量之间取得平衡。Opus 4.6 适合复杂推理任务，Haiku 4.5 适合快速简单任务。

> 💬 hippo：大多数时候默认就好。如果你发现 Claude 在复杂任务上表现不佳，试试切换到 Opus——有时候不是它笨，是任务真的复杂。

---

## 我的建议配置清单

### 第一天（必须）
- [ ] 配置 `CLAUDE.md` 核心规则（≤200 行）
- [ ] 配置危险命令拦截 Hook

### 第一周（推荐）
- [ ] 配置提交前测试 Hook
- [ ] 配置 MCP（Web Search）
- [ ] 创建第一个 Skill（如发布流程）

### 第一个月（按需）
- [ ] 配置 Subagents（有并行任务需求时）
- [ ] 配置更多 MCP 服务器
- [ ] 创建 Plugins（跨项目复用）

---

## 一句话总结

设置不是填空题，而是渐进式配置——先搞定 CLAUDE.md 和危险拦截，再根据实际需求慢慢加。

**下一篇**：[Claude Code 如何工作](/2026/03/12/ai-tools/official-docs/claude-how-it-works/)，理解底层原理。

---

*本文精读自 [Claude Code 官方文档 - 设置](https://code.claude.com/docs/zh-CN/setup)*
