---
title: 精读官方文档：CLI 参考
date: 2026-03-19 21:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 27
description: 精读 Claude Code CLI 参考文档，了解所有命令行选项和使用方法。
cover: https://picsum.photos/seed/claude-cli/1920/1080
source_url: https://code.claude.com/docs/zh-CN/cli-reference

# 精读官方文档：CLI 参考
> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。CLI（Command Line Interface，命令行界面）是 Claude Code 的核心交互方式，掌握这些命令和参数能让你的开发效率起飞。
## 开篇：为什么读这篇文档
刚开始用 Claude Code 时，我只知道简单的 `claude` 命令，直到有一次需要在 CI/CD 流程中集成 AI 代码审查，才发现原来 CLI 有这么多强大的功能。
这篇文档的价值在于：
- **提升效率**：掌握快速启动、会话恢复等技巧，省去重复操作时间
- **自动化集成**：了解管道（pipe）和 SDK 模式，方便和现有工作流结合
- **灵活配置**：通过各种参数定制 Claude 的行为，适应不同开发场景
<!-- more -->
## 核心概念：用大白话讲清楚
### CLI 的两种使用模式
官方文档把 CLI 使用分为两种主要模式：
#### 1. 交互式模式
```bash
claude                    # 启动一个对话
claude "帮我重构这个函数"  # 带初始提示启动
```
这种模式就像和朋友聊天，你可以持续对话，适合需要多轮沟通的复杂任务。
#### 2. 打印模式
claude -p "解释这个函数"  # 查询完直接退出，返回结果
cat log.txt | claude -p "分析错误"  # 处理管道内容
这种模式就像问一个问题得到答案就结束，适合脚本化、自动化场景。
> 💬 hippo：我经常用打印模式来做代码审查的自动化，比如在 Git 提交前让 Claude 快速检查一下代码质量。
## 实战指南：手把手教你用
### 场景一：开发中的快速问答
你正在开发一个功能，遇到一个问题需要快速解决：
# 启动会话时直接带入问题
claude "我的 React 组件渲染时总是报错，帮我看看"
# 或者先启动会话，再提问
claude
> 我的 React 组件渲染时报错
如果中间有事出去了，回来后可以用：
claude -c  # 继续上次的对话
> 💬 hippo：这个 `-c` 参数简直是我的救命稻草。有时候开会被打断，回来后一个命令就能回到上下文，不用重新描述问题。
### 场景二：自动化代码审查
在 `.git/hooks/pre-commit` 中加入自动审查：
#!/bin/bash
# 检查即将提交的代码
git diff --cached | claude -p "检查这段代码的质量和潜在问题" > /tmp/claude_review.txt
if grep -q "error\|warning" /tmp/claude_review.txt; then
  cat /tmp/claude_review.txt
  echo "发现潜在问题，请确认后再提交"
  exit 1
fi
或者更高级的，使用结构化输出：
claude -p "审查代码，按JSON格式返回问题列表" --output-format json --json-schema '{
  "type": "object",
  "properties": {
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": {"type": "string"},
          "message": {"type": "string"}
        }
      }
    }
  }
}'
> 💬 hippo：这种 JSON Schema 的方式特别适合 CI/CD 集成，可以解析结果做更精确的判断，比如根据严重程度决定是否阻断构建。
## hippo 的踩坑实录
### 坑点 1：管道内容的编码问题
**问题描述**：我第一次用管道时发现中文字符变成乱码了。
cat 中文文件.md | claude -p "总结内容"
# 输出：乱码乱码乱码...
**解决方案**：确保文件编码为 UTF-8，或者显式指定编码：
iconv -f GBK -t UTF-8 中文文件.md | claude -p "总结内容"
> 💬 hippo：后来我养成了习惯，所有涉及中文的文件都统一用 UTF-8 编码，省去了很多麻烦。
### 坑点 2：权限提示在自动化脚本中卡住
**问题描述**：在 CI/CD 脚本中使用时，遇到权限提示就卡住了，脚本一直在等待输入。
# 脚本执行到这里就卡住
claude -p "检查代码" --permission-mode plan
**解决方案**：使用 `--dangerously-skip-permissions` 跳过权限检查，或者用 `--allowedTools` 限制可用工具：
# 方案1：跳过权限检查（谨慎使用）
claude -p "检查代码" --dangerously-skip-permissions
# 方案2：只允许必要的工具
claude -p "检查代码" --allowedTools "Bash(git diff *) Read Grep"
> 💬 hippo：方案 2 更安全，因为它明确限制了 Claude 能做什么，而不是完全放弃权限控制。在 CI 环境中我更倾向这种方式。
## 常见问题解答
**Q: `-p` 和 `-c` 有什么区别？**
A: `-p`（print）是打印模式，执行完就退出；`-c`（continue）是继续模式，加载上次对话后进入交互模式。可以组合使用：`claude -c -p "检查类型错误"`
**Q: 怎么知道会话的 ID 或名称？**
A: 用 `claude -r` 会显示一个交互式选择器，列出所有历史会话。每个会话都有 ID 和名称，恢复时可以任选其一。
**Q: `--system-prompt` 和 `--append-system-prompt` 用哪个？**
A: 如果你想完全控制 Claude 的行为，用 `--system-prompt`；如果只是想在默认行为基础上加一些规则，用 `--append-system-prompt` 更安全，不会破坏 Claude Code 的内置功能。
**Q: MCP（Model Context Protocol）是什么？**
A: MCP 是一种让 Claude 连接外部工具和服务的标准协议。`claude mcp` 命令用来配置这些外部工具，比如数据库、API 等。简单说就是给 Claude 装插件。
**Q: worktree 和普通工作区有什么区别？**
A: worktree 是 Git 的一种特性，让你可以在同一个仓库的不同分支上同时工作。用 `claude -w feature-xyz` 会自动创建一个隔离的工作区，不会影响主分支的文件。
**上一篇**：[精读官方文档：故障排除](/ai-tools/official-docs/troubleshooting/)
**下一篇**：[精读官方文档：扩展 Claude Code](/ai-tools/official-docs/features-overview/)
*本文精读自 [精读官方文档：CLI 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/cli-reference)*
