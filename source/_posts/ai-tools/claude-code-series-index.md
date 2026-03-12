---
title: AI 工具系列：Claude Code 从入门到上手
date: 2026-03-12 19:48:00
updated: 2026-03-12 19:48:00
tags: [Claude Code, AI 工具]
categories: [AI 工具系列]
series: claude-code
series_index: 0
description: 这个系列记录我使用 Claude Code 搭建个人博客过程中的实践心得，包含官方文档精读和真实踩坑经验。适合想用 AI 提效的开发者阅读。
cover: https://picsum.photos/seed/ai-tools-claude/1920/1080
---

# AI 工具系列：Claude Code 从入门到上手

> 📌 这是系列大纲索引页，持续更新中。

---

## 为什么写这个系列

我在搭建个人博客（Hexo + Butterfly 主题）的过程中，深度使用了 Claude Code 来辅助开发。

从最初的"比代码补全聪明一点的工貝"，到后来让它：
- 读懂整个项目结构和逻辑
- 自己写脚本、执行命令、看结果
- 出错了自己调试、自己修复
- 在多个任务之间传递上下文、相互协作

这个过程里，我踩过不少坑，也总结出了一套行之有效的方法论。

**这个系列就是我这些实践的记录。**

---

## 这个系列适合谁

| 你 | 适合程度 |
|----|----------|
| 正在用或打算用 Claude Code | ⭐⭐⭐⭐⭐ 强烈推荐 |
| 用过但觉得"也就那样" | ⭐⭐⭐⭐ 建议重读 |
| 对 AI 辅助编程感兴趣 | ⭐⭐⭐⭐ 可以看看 |
| 完全新手，还没开始用 | ⭐⭐⭐⭐⭐ 从第一篇开始 |

---

## 文章目录

目前连载中，以下是已发布的文章：

### 核心篇

| # | 文章 | 简介 |
|---|------|------|
| 1 | [如何用好 Claude Code：我的最优实践总结](/2026/03/12/ai-tools/claude-code-best-practice/) | 结合官方最佳实践和真实踩坑经验，整理出的 Claude Code 使用方法。涵盖心智模型、六大工具的本质与决策树、完整项目结构和 SOP。 |

### 官方文档精读系列

| # | 文章 | 简介 |
|---|------|------|
| 2 | [Claude Code 概述](/2026/03/12/ai-tools/official-docs/claude-overview/) | 了解 Claude Code 的定位、核心功能和多平台使用方式。 |
| 3 | [快速开始](/2026/03/12/ai-tools/official-docs/claude-quickstart/) | 从零开始安装配置，跑通第一个任务。 |
| 4 | [设置 Claude Code](/2026/03/12/ai-tools/official-docs/claude-setup/) | 配置文件、模型选择、MCP 服务器等核心配置项。 |
| 5 | [Claude Code 如何工作](/2026/03/12/ai-tools/official-docs/how-claude-code-works/) | 理解 Claude Code 的底层工作原理。 |
| 6 | [Claude Code 最佳实践](/2026/03/12/ai-tools/official-docs/best-practices/) | 官方推荐的最佳实践和使用技巧。 |
| 7 | [常见工作流程](/2026/03/12/ai-tools/official-docs/common-workflows/) | 典型使用场景和工作流程示例。 |
| 8 | [Claude 如何记住你的项目](/2026/03/12/ai-tools/official-docs/memory/) | 项目记忆、CLAUDE.md 和上下文管理。 |
| 9 | [使用 skills 扩展 Claude](/2026/03/12/ai-tools/official-docs/skills/) | 创建和使用 Skills 扩展 Claude 的能力。 |
| 10 | [Hooks 参考](/2026/03/12/ai-tools/official-docs/hooks/) | Hooks 配置和安全性拦截。 |
| 11 | [创建自定义 subagents](/2026/03/12/ai-tools/official-docs/sub-agents/) | 如何创建和使用自定义子代理。 |
| 12 | [通过 MCP 将 Claude Code 连接到工具](/2026/03/12/ai-tools/official-docs/mcp/) | MCP 服务器配置和外部服务集成。 |
| 13 | [Claude Code 设置](/2026/03/12/ai-tools/official-docs/settings/) | 完整设置选项参考。 |
| 14 | [使用 Claude Code Desktop](/2026/03/12/ai-tools/official-docs/desktop/) | Desktop 应用使用指南。 |
| 15 | [Desktop 快速开始](/2026/03/12/ai-tools/official-docs/desktop-quickstart/) | Desktop 版本快速上手。 |
| 16 | [在 VS Code 中使用 Claude Code](/2026/03/12/ai-tools/official-docs/vs-code/) | VS Code 集成使用教程。 |
| 17 | [在 Chrome 中使用 Claude Code（测试版）](/2026/03/12/ai-tools/official-docs/chrome/) | Chrome 扩展使用指南。 |
| 18 | [JetBrains IDEs](/2026/03/12/ai-tools/official-docs/jetbrains/) | JetBrains 全家桶集成。 |
| 19 | [Claude Code 网页版](/2026/03/12/ai-tools/official-docs/claude-code-on-the-web/) | 浏览器版本使用指南。 |
| 20 | [使用远程控制从任何设备继续本地会话](/2026/03/12/ai-tools/official-docs/remote-control/) | 远程控制功能配置。 |
| 21 | [Claude Code GitHub Actions](/2026/03/12/ai-tools/official-docs/github-actions/) | GitHub Actions 集成。 |
| 22 | [Claude Code GitLab CI/CD](/2026/03/12/ai-tools/official-docs/gitlab-ci-cd/) | GitLab CI/CD 集成。 |
| 23 | [Slack 中的 Claude Code](/2026/03/12/ai-tools/official-docs/slack/) | Slack 集成使用。 |
| 24 | [企业部署概述](/2026/03/12/ai-tools/official-docs/third-party-integrations/) | 企业级部署方案。 |
| 25 | [故障排除](/2026/03/12/ai-tools/official-docs/troubleshooting/) | 常见问题和解决方案。 |
| 26 | [CLI 参考](/2026/03/12/ai-tools/official-docs/cli-reference/) | 命令行完整参考。 |
| 27 | [扩展 Claude Code](/2026/03/12/ai-tools/official-docs/features-overview/) | 功能扩展概览。 |
| 28 | [法律和合规](/2026/03/12/ai-tools/official-docs/legal-and-compliance/) | 法律条款和合规说明。 |

---

## 后续更新

- 实战案例分析（待更新）
- 高阶技巧与调优（待更新）

**持续更新中，敬请期待。**

---

*最后更新：2026-03-12*
