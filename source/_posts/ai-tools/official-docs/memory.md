---
title: 精读官方文档：Claude 如何记住你的项目
date: 2026-03-22 23:00:00
updated: 2026-03-27 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 9
description: Claude Code 有两套记忆系统：CLAUDE.md（你写的指令）和自动记忆（Claude 自己记的笔记）。理解它们的区别和用法，能让 Claude 跨会话保持对你的项目和偏好的理解。
cover: https://picsum.photos/seed/claude-memory/1920/1080
source_url: https://code.claude.com/docs/zh-CN/memory
---

# 精读官方文档：Claude 如何记住你的项目

> 💬 hippo：每个 Claude Code 会话都从"零记忆"开始。想要 Claude 记住你的项目规范、编码习惯、常用命令？这篇文章讲的就是怎么让它"有记忆"。

---

## 核心概念：两套记忆系统

Claude Code 提供两套互补的记忆机制：

| 特性 | CLAUDE.md 文件 | 自动记忆 |
|------|---------------|----------|
| **谁编写** | 你 | Claude |
| **包含内容** | 指令和规则 | 学习和模式 |
| **作用范围** | 项目、用户或组织 | 每个工作树 |
| **加载时机** | 每个会话完整加载 | 每个会话加载前 200 行 |
| **典型用途** | 编码标准、工作流、项目架构 | 构建命令、调试见解、Claude 发现的偏好 |

> 💬 hippo：简单说——**CLAUDE.md 是你告诉 Claude 该怎么做，自动记忆是 Claude 自己学到的东西**。

<!-- more -->

---

## 一、CLAUDE.md 文件详解

### 1.1 文件位置与作用范围

CLAUDE.md 可以放在多个位置，位置越具体优先级越高：

| 范围 | 位置 | 目的 | 共享对象 |
|------|------|------|----------|
| **托管策略** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br>Linux/WSL: `/etc/claude-code/CLAUDE.md`<br>Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | 组织范围的 IT 管理指令 | 组织中所有用户 |
| **项目指令** | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 项目架构、编码标准、常见工作流 | 通过 git 共享给团队 |
| **用户指令** | `~/.claude/CLAUDE.md` | 所有项目的个人偏好 | 仅你（所有项目） |

> 💬 hippo：我主要用项目级 `./CLAUDE.md`，记录构建命令、目录结构、代码规范。这样换了电脑、或者队友拉代码后，Claude 都能立刻"懂"这个项目。

### 1.2 与 AGENTS.md 互操作

如果你的仓库已经为其他 AI 编程助手（如 Cursor、Windsurf）配置了 `AGENTS.md`，可以用 `@` 语法导入，实现一份配置多工具共用：

```markdown
@AGENTS.md

## Claude Code 特定指令

对 `src/billing/` 下的修改使用 plan mode。
```

> 💬 hippo：Claude Code 读取 `CLAUDE.md` 而非 `AGENTS.md`。用导入语法可以让两个工具读取相同指令，避免重复维护。

### 1.3 CLAUDE.md 如何被加载

Claude Code 从当前工作目录**向上遍历目录树**，加载沿途所有的 CLAUDE.md：

```
foo/bar/           ← 你在这里运行 claude
├── CLAUDE.md      ✅ 会被加载
└── foo/
    ├── CLAUDE.md  ✅ 会被加载
    └── bar/
        └── CLAUDE.md  ✅ 会被加载
```

子目录中的 CLAUDE.md 在 Claude 读取该目录时按需加载。

#### 从其他目录加载（--add-dir 标志）

`--add-dir` 标志可以让 Claude 访问主工作目录外的其他目录，但默认不会加载这些目录中的 CLAUDE.md 文件。

要同时加载额外目录的 CLAUDE.md，需要设置环境变量：

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

> 💬 hippo：这在需要引用共享配置仓库时很有用，比如公司的通用代码规范。

### 1.4 编写有效指令的原则

CLAUDE.md 是**上下文**，不是强制配置。Claude 会尽量遵循，但指令写得越好，遵循效果越好。

**四个关键原则**：

| 原则 | 说明 | 示例 |
|------|------|------|
| **大小** | 每个文件控制在 200 行以内 | 太长会消耗上下文、降低遵守度 |
| **结构** | 用标题和列表分组 | 有组织的段落比密集文字更易遵循 |
| **具体性** | 写可验证的具体指令 | "用 2 空格缩进" 而不是 "正确格式化代码" |
| **一致性** | 消除冲突指令 | 两条矛盾规则会让 Claude 任意选择 |

```markdown
# 好的 CLAUDE.md 示例

## 构建命令
- 开发：`npm run dev`
- 测试：`npm test`（提交前必须通过）
- 构建：`npm run build`

## 代码规范
- 使用 2 空格缩进
- API 处理器放在 `src/api/handlers/`
- 所有公开函数必须有 JSDoc 注释

## 常见工作流
- 新功能：先写测试，再实现
- 修复 bug：先复现，再加测试用例
```

### 1.5 导入其他文件

CLAUDE.md 支持 `@path` 语法导入外部文件：

```markdown
# 项目概述
参见 @README.md 了解项目背景
参见 @package.json 了解可用命令

# 详细规范
- Git 工作流：@docs/git-workflow.md
- API 设计：@docs/api-design.md

# 个人偏好（不提交到 git）
- @~/.claude/my-preferences.md
```

**导入特性**：
- 支持相对路径和绝对路径
- 最大递归深度 5 层
- 导入文件在启动时展开加载

### 1.6 使用 `.claude/rules/` 组织规则

大型项目可以用规则目录分主题管理指令：

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # 主项目指令
│   └── rules/
│       ├── code-style.md   # 代码样式
│       ├── testing.md      # 测试约定
│       └── security.md     # 安全要求
```

**规则可以限定到特定文件路径**，使用 YAML frontmatter：

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/lib/**/*.ts"
---

# API 开发规则

- 所有 API 端点必须包含输入验证
- 使用标准错误响应格式
- 必须添加 OpenAPI 文档注释
```

**glob 模式示例**：

| 模式 | 匹配内容 |
|------|----------|
| `**/*.ts` | 任意目录下的所有 TypeScript 文件 |
| `src/**/*` | `src/` 目录下的所有文件 |
| `*.{ts,tsx}` | 当前目录的 ts 和 tsx 文件 |
| `src/components/*.tsx` | 特定目录下的 React 组件 |

#### 使用符号链接跨项目共享规则

`.claude/rules/` 目录支持符号链接，可以维护一组共享规则并链接到多个项目：

```bash
# 链接整个共享规则目录
ln -s ~/shared-claude-rules .claude/rules/shared

# 链接单个规则文件
ln -s ~/company-standards/security.md .claude/rules/security.md
```

> 💬 hippo：循环符号链接会被检测并优雅处理，不用担心无限循环。

#### 用户级规则

`~/.claude/rules/` 中的规则适用于你机器上的每个项目：

```
~/.claude/rules/
├── preferences.md    # 个人编码偏好
└── workflows.md      # 首选工作流
```

用户级规则在项目规则之前加载，项目规则优先级更高。

### 1.7 排除无关的 CLAUDE.md

在 monorepo 中，可能需要排除其他团队的 CLAUDE.md。在 `.claude/settings.local.json` 中配置：

```json
{
  "claudeMdExcludes": [
    "**/other-team/CLAUDE.md",
    "/home/user/monorepo/legacy/.claude/rules/**"
  ]
}
```

> 💬 hippo：托管策略级 CLAUDE.md（IT 管理的）不能被排除，确保组织规范始终生效。

---

## 二、自动记忆

### 2.1 什么是自动记忆

自动记忆让 Claude **自己记笔记**——构建命令、调试技巧、架构决策、你纠正过它的偏好。Claude 决定什么值得记，你不需要手动操作。

**默认开启**。可以通过以下方式禁用：

```json
// .claude/settings.json
{
  "autoMemoryEnabled": false
}
```

或环境变量：`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`

### 2.2 存储位置

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # 索引文件，每次会话加载前 200 行
├── debugging.md       # 调试相关笔记
├── api-conventions.md # API 约定
└── patterns.md        # 发现的代码模式
```

`<project>` 路径基于 git 仓库，所以同一仓库的所有 worktree 共享记忆。

### 2.3 工作原理

- **MEMORY.md 前 200 行**在每次对话开始时加载
- **主题文件**（如 `debugging.md`）按需读取
- Claude 在工作中自动读写这些文件

> 💬 hippo：当你在界面看到 "Writing memory" 或 "Recalled memory" 时，就是 Claude 在更新或读取记忆文件。

### 2.4 查看和编辑记忆

运行 `/memory` 命令可以：
- 列出所有加载的 CLAUDE.md 和规则文件
- 开关自动记忆功能
- 打开记忆文件夹浏览/编辑

---

## 三、常见问题排查

### 3.1 Claude 不遵循我的 CLAUDE.md

**排查步骤**：

1. 运行 `/memory` 确认文件被加载
2. 检查文件是否在正确位置
3. 让指令更具体（"用 2 空格缩进" > "格式化代码很好"）
4. 检查是否有冲突指令

> 💬 hippo：CLAUDE.md 是上下文，不是系统指令。Claude 会尽量遵循，但不保证 100% 执行。需要强制行为的场景用 `--append-system-prompt`。

### 3.2 CLAUDE.md 太大了

**解决方案**：
- 把详细内容移到独立文件，用 `@path` 导入
- 用 `.claude/rules/` 分主题管理
- 目标：每个文件 < 200 行

### 3.3 `/compact` 后指令丢失

CLAUDE.md 在 `/compact` 后会从磁盘重新加载。如果指令消失了，说明它只在对话中提过，没写进文件。

**解决**：明确让 Claude "把它写到 CLAUDE.md"。

---

## 四、最佳实践总结

| 场景 | 推荐做法 |
|------|----------|
| 新项目 | 先创建 `CLAUDE.md`，写明构建命令和目录结构 |
| 团队协作 | 把项目规范写进 `./CLAUDE.md`，通过 git 共享 |
| 个人偏好 | 放 `~/.claude/CLAUDE.md`，所有项目通用 |
| 大型项目 | 用 `.claude/rules/` 分主题管理，配合 `paths` 限定范围 |
| Monorepo | 用 `claudeMdExcludes` 排除无关团队的文件 |
| 调试问题 | 运行 `/memory` 检查哪些文件被加载 |

---

## 一句话总结

**CLAUDE.md 是你给 Claude 的"员工手册"，自动记忆是 Claude 自己的"工作笔记"**——两者配合使用，让 Claude 越用越懂你。

**下一篇**：[精读官方文档：使用 Skills 扩展 Claude](/2026/03/22/ai-tools/official-docs/skills/)，把常用工作流打包成可复用的命令。

---

*本文精读自 [Claude 如何记住你的项目](https://code.claude.com/docs/zh-CN/memory)*
