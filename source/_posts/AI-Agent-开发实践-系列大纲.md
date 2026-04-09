---
title: AI Agent 开发实践 · 系列大纲
date: 2026-04-09 12:07:02
updated: 2026-04-09 12:07:02
tags:
  - AI Agent
categories:
  - AI 工具系列
description: 从 Anthropic 官方和社区精选文章中提炼 AI Agent 开发的核心模式——Context Engineering、Skill 设计、多 Agent 编排，每篇读完后写成博客。
cover: https://picsum.photos/seed/ai-agent-dev/1920/1080
series: ai-agent-dev
series_index: 0
---

# AI Agent 开发实践 · 系列大纲

> 本页是「AI Agent 开发实践」系列的导航大纲，书签收藏本页，随时跳转到你需要的文章。

## 系列简介

AI Agent 正在从"能用"走向"好用"。这个系列从 Anthropic 官方工程博客、Claude API 文档和社区精选文章出发，提炼 AI Agent 开发的核心模式——Context Engineering（上下文工程）、Skill 设计、工具接口、多 Agent 编排。每篇精读一篇优质文章，提炼要点，加上自己的理解和实践。

适合有一定 AI 工具使用经验、想深入理解 Agent 设计模式的开发者。

<!-- more -->

## 文章目录

| # | 文章 | 简介 | 状态 |
|---|------|------|------|
| 01 | [Agentic 编码最佳实践](#) | Anthropic 官方的 AI 辅助编码原则——委托而非指挥、给验证依据、先探索再实现 | 🚧 计划中 |
| 02 | [Context Engineering 实战指南](#) | 上下文工程策略：分层记忆、压缩时机、Tool Result Clearing 等优化手段 | 🚧 计划中 |
| 03 | [AI Agent 设计模式全景](#) | 单 Agent 到多 Agent 的设计演进——PEE、Parallel Teams、Swarm 等模式对比 | 🚧 计划中 |
| 04 | [Claude Skill 设计模式](#) | Skill 从简单到复杂的演进路径——提示词技巧、工具组合、测试方法 | 🚧 计划中 |
| 05 | [给 AI Agent 写好工具接口](#) | 工具描述怎么写、参数怎么设计、错误怎么处理——让模型更好用你的工具 | 🚧 计划中 |
| 06 | [多 Agent 编排模式对比](#) | Parallel/Swarm/PEE/Orchestra 等编排模式的适用场景和权衡 | 🚧 计划中 |
| 07 | [MCP 与 RAG 实践](#) | RAG 检索增强生成 + MCP 协议的 token 优化与代码执行机制 | 🚧 计划中 |
| 08 | [Agent SDK 快速上手](#) | 用 Anthropic Agent SDK 构建自定义 Agent——从单工具到多步骤编排 | 🚧 计划中 |

## 阅读来源

本系列精读的原始文章：

- [Best Practices for Agentic Coding](https://www.anthropic.com/engineering) — Anthropic Engineering
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Anthropic Engineering
- [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents) — Anthropic Research
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Claude API Docs
- [Writing Effective Tools for AI Agents](https://www.anthropic.com/engineering/writing-tools-for-agents) — Anthropic Engineering
- [The Code Agent Orchestra](https://addyosmani.com/blog/code-agent-orchestra/) — Addy Osmani
- [RAG Cookbook](https://platform.claude.com/cookbook/capabilities-retrieval-augmented-generation-guide) — Claude Cookbook
- [How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic Engineering
- [The Complete Guide to Building Skills for Claude (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) — Anthropic
- [Context Engineering Cookbook](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools) — Claude Cookbook
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) — Anthropic Engineering
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Claude API Docs
- [Agent Design Lessons from Claude Code](https://jannesklaas.github.io/ai/2025/07/20/claude-code-agent-design.html) — Jannes Klaas

## 更新日志

- 2026-04-09：系列创建
