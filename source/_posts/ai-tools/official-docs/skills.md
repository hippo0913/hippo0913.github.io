---
title: 精读官方文档：Agent Skills（技能扩展）
date: 2026-03-21 23:00:00
updated: 2026-03-25 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 10
description: Skills 是 Claude Code 的模块化能力扩展机制。本文详细讲解如何创建、配置和分享 Skill，包含 SKILL.md 编写规范、allowed-tools 权限控制、多文件 Skill 组织等核心内容。
cover: https://picsum.photos/seed/claude-skills/1920/1080
source_url: https://code.claude.com/docs/zh-CN/skills
---

# 精读官方文档：Agent Skills（技能扩展）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、这个功能是什么

Skills（技能）是 Claude Code 的模块化能力扩展机制。简单说，就是把你的专业知识打包成一个文件夹，让 Claude 在需要时自动读取并执行。

**与 Slash 命令的区别：**

| 特性 | Skills | Slash 命令 |
|------|--------|-----------|
| 触发方式 | Claude 自动判断（模型调用） | 用户手动输入 `/command` |
| 适用场景 | 复杂流程、需要判断时机 | 明确操作、用户主动触发 |
| 共享方式 | Git 提交即可共享 | 需要配置文件 |

比如你经常需要处理 PDF，可以创建一个 `pdf-processing` Skill，当你提到 "PDF" 相关需求时，Claude 会自动加载这个 Skill 的指令。

<!-- more -->

---

## 二、官方教程精读

### 2.1 Skill 的存储位置

Skills 分为三类，存储位置不同：

| 类型 | 存储路径 | 用途 |
|------|----------|------|
| Personal Skills | `~/.claude/skills/skill-name/` | 个人工作流、实验性 Skill |
| Project Skills | `.claude/skills/skill-name/` | 团队协作、项目专属 |
| Plugin Skills | 插件内置 | 安装插件自动获得 |

**创建 Skill 目录：**

```bash
# 创建个人 Skill
mkdir -p ~/.claude/skills/my-skill-name

# 创建项目 Skill（在项目根目录执行）
mkdir -p .claude/skills/my-skill-name
```

Project Skills 会随 Git 提交自动分享给团队成员。

### 2.2 编写 SKILL.md

每个 Skill 必须包含一个 `SKILL.md` 文件，结构如下：

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Provide clear, step-by-step guidance for Claude.

## Examples
Show concrete examples of using this Skill.
```

**Front Matter 字段要求：**

| 字段 | 要求 | 说明 |
|------|------|------|
| `name` | 小写字母、数字、连字符，最多 64 字符 | Skill 唯一标识 |
| `description` | 最多 1024 字符 | **关键！** Claude 通过此判断何时使用 |
| `allowed-tools` | 可选，工具名列表 | 限制 Skill 可用的工具 |

**description 写法对比：**

```yaml
# ❌ 太模糊，Claude 难以判断
description: Helps with documents

# ✅ 具体，包含触发关键词
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

### 2.3 使用 allowed-tools 限制权限

通过 `allowed-tools` 可以限制 Skill 激活时 Claude 可用的工具：

```markdown
---
name: safe-file-reader
description: Read files without making changes. Use when you need read-only file access.
allowed-tools: Read, Grep, Glob
---

# Safe File Reader

This Skill provides read-only file access.

## Instructions
1. Use Read to view file contents
2. Use Grep to search within files
3. Use Glob to find files by pattern
```

适用场景：
- 只读 Skill（不应修改文件）
- 限定功能范围（比如只做数据分析，不写文件）
- 安全敏感流程（限制危险操作）

### 2.4 多文件 Skill 组织

复杂 Skill 可以包含多个文件：

```
pdf-processing/
├── SKILL.md          # 必须，入口文件
├── FORMS.md          # 可选，表单填写详细说明
├── REFERENCE.md      # 可选，API 参考
└── scripts/
    ├── fill_form.py  # 可选，辅助脚本
    └── validate.py   # 可选，验证脚本
```

在 `SKILL.md` 中引用其他文件：

```markdown
---
name: pdf-processing
description: Extract text, fill forms, merge PDFs. Use when working with PDF files.
---

# PDF Processing

## Quick start

Extract text:
```python
import pdfplumber
with pdfplumber.open("doc.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

For form filling, see [FORMS.md](FORMS.md).
For detailed API reference, see [REFERENCE.md](REFERENCE.md).

## Requirements

```bash
pip install pypdf pdfplumber
```
```

Claude 采用**渐进式加载**：只有需要时才读取额外文件，避免上下文膨胀。

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际使用中的踩坑经验：

### 3.1 我遇到的问题

创建了 Skill 但 Claude 从不使用。明明 description 写了功能，问相关问题却不触发。

### 3.2 我的解决方案

**问题根源：description 不够具体。** Claude 需要从 description 中匹配用户问题中的关键词。

修改前：
```yaml
description: Helps with git commits
```

修改后：
```yaml
description: Generate standardized commit messages from git diffs. Use when writing commit messages, reviewing staged changes, or the user mentions "commit", "提交", or "commit message".
```

**关键改进：**
1. 明确功能范围（generate commit messages）
2. 列出触发场景（writing, reviewing）
3. 包含用户可能说的关键词（commit, 提交）

### 3.3 我的建议

1. **description 要包含同义词**：用户可能说 "PDF"、"pdf文件"、"document"，都要考虑到
2. **先测试再推广**：个人 Skill 调试好了再转成项目 Skill
3. **保持单一职责**：一个 Skill 只做一件事，比如 "commit message" 和 "code review" 应该分开

---

## 四、常见问题

**Q: 如何查看当前可用的 Skills？**

A: 直接问 Claude：
```
What Skills are available?
```
或者用命令行查看：
```bash
# 个人 Skills
ls ~/.claude/skills/

# 项目 Skills
ls .claude/skills/
```

**Q: Skill 没有被触发怎么办？**

A: 检查以下项目：

| 检查项 | 命令 |
|--------|------|
| 文件路径是否正确 | `ls ~/.claude/skills/my-skill/SKILL.md` |
| YAML 语法是否有效 | `cat SKILL.md \| head -n 10` |
| description 是否具体 | 是否包含触发关键词 |

**Q: 多个 Skills 冲突怎么处理？**

A: 在 description 中使用不同的触发词：

```yaml
# Skill 1
description: Analyze sales data in Excel files. Use for sales reports, pipeline analysis.

# Skill 2
description: Analyze log files and system metrics. Use for performance monitoring, debugging.
```

---

## 五、小结

Skills 是 Claude Code 的核心扩展机制，通过 `SKILL.md` 文件定义能力，支持多文件组织和权限控制。关键在于写好 `description`，让 Claude 能准确判断何时使用。

**下一篇**：[MCP（Model Context Protocol）](/2026/03/21/official-docs-mcp/) — 了解如何让 Claude 连接外部工具和数据源。

---

*本文精读自 [Agent Skills - Claude Code Docs](https://docs.anthropic.com/zh-CN/docs/claude-code/skills)*

*最后更新：2026-03-25*
