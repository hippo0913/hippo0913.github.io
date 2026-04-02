---
title: 精读官方文档：Claude 如何记住你的项目
date: 2026-03-22 23:00:00
updated: 2026-03-31 15:30:00
tags: [Claude Code, 扩展定制]
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
| **加载时机** | 每个会话完整加载 | MEMORY.md 前 200 行每次会话加载，主题文件按需读取 |
| **典型用途** | 编码标准、工作流、项目架构 | 构建命令、调试见解、Claude 发现的偏好 |
| **subagent 支持** | 读取主进程的 CLAUDE.md | 可以维护自己的自动记忆 |

> 💬 hippo：简单说——**CLAUDE.md 是你告诉 Claude 该怎么做，自动记忆是 Claude 自己学到的东西**。两者都是"上下文"而非强制配置，CLAUDE.md 的内容是作为用户消息传递给 Claude 的，不是系统提示。

<!-- more -->

---

## 一、CLAUDE.md 文件详解

### 1.1 文件位置与加载机制

CLAUDE.md 可以放在多个位置，形成三层层级：

| 范围 | 位置 | 目的 | 用例 | 共享对象 |
|------|------|------|------|----------|
| **托管策略** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br>Linux/WSL: `/etc/claude-code/CLAUDE.md`<br>Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | 组织范围的 IT 管理指令 | 禁止使用特定工具、强制安全策略 | 组织中所有用户 |
| **项目指令** | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 项目架构、编码标准、常见工作流 | 代码风格、构建命令、测试约定 | 通过 git 共享给团队 |
| **用户指令** | `~/.claude/CLAUDE.md` | 所有项目的个人偏好 | 个人编码习惯、首选工作流 | 仅你（所有项目） |

Claude Code 从当前工作目录**向上遍历目录树**，加载沿途所有的 CLAUDE.md。子目录中的 CLAUDE.md 在 Claude 读取该目录时按需加载。

**HTML 注释的特殊行为**：块级 HTML 注释（`<!-- ... -->`）在注入 Claude 上下文之前会被剥离，但代码块内的注释会保留。这意味着你可以在 CLAUDE.md 中给人类维护者留笔记而不消耗 Claude 的上下文 token：

```markdown
<!-- 这是给人看的笔记，不会消耗 Claude 的上下文 token -->
<!-- 可以写维护提醒、TODO 等，比如：这个文件上次更新于 2026-03 -->

## 构建命令
- 开发：`npm run dev`
- 测试：`npm test`
```

#### 从其他目录加载（--add-dir 标志）

`--add-dir` 标志可以让 Claude 访问主工作目录外的其他目录，但默认不会加载这些目录中的 CLAUDE.md。要同时加载，需设置环境变量：

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

> 💬 hippo：HTML 注释剥离这个特性很实用。我在 CLAUDE.md 里用注释标注每个段落是什么时候加的、为什么加，方便自己维护，又不浪费 Claude 的上下文窗口。

### 1.2 编写有效指令与组织规则

CLAUDE.md 是**上下文**，不是强制配置。它作为用户消息传递给 Claude，Claude 会尽量遵循，但指令写得越具体简洁，遵循度越高。

**四个关键原则**：

| 原则 | 说明 | 示例 |
|------|------|------|
| **大小** | 每个文件控制在 200 行以内 | 太长会消耗上下文、降低遵守度 |
| **结构** | 用标题和列表分组 | 有组织的段落比密集文字更易遵循 |
| **具体性** | 写可验证的具体指令 | "用 2 空格缩进" 而不是 "正确格式化代码" |
| **一致性** | 消除冲突指令 | 两条矛盾规则会让 Claude 任意选择 |

#### @path 导入语法

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

导入特性：支持相对路径和绝对路径，最大递归深度 5 层，相对路径相对于包含文件解析。

#### .claude/rules/ 分主题管理

大型项目可以用规则目录分主题管理指令，并使用 `paths` frontmatter 将规则限定到特定文件路径：

```yaml
# .claude/rules/typescript.md
---
paths:
  - "src/**/*.{ts,tsx}"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---

# TypeScript 开发规则
- 所有公开函数必须有 JSDoc 注释
- 使用严格空值检查
```

**glob 模式匹配示例**：

| 模式 | 匹配内容 |
|------|----------|
| `**/*.ts` | 任意目录下的所有 TypeScript 文件 |
| `src/**/*` | `src/` 目录下的所有文件 |
| `*.{ts,tsx}` | 当前目录的 ts 和 tsx 文件（大括号扩展） |
| `src/**/*.{ts,tsx}` + `tests/**/*.test.ts` | 多模式组合，匹配多个目录 |

> 💬 hippo：paths 限定是减少上下文噪音的关键。比如你的项目前后端混合，TypeScript 规则只匹配 `src/**` 就不会在改 Python 文件时浪费上下文。

#### 用户级规则与符号链接

`~/.claude/rules/` 中的规则适用于你机器上的每个项目，在项目规则之前加载（项目规则优先级更高）。`.claude/rules/` 目录也支持符号链接，可以维护一组共享规则并链接到多个项目。

### 1.3 大型团队管理

在团队和企业场景中，需要理解"托管设置"和"托管 CLAUDE.md"的职责划分：

| 职责 | 托管设置（Managed Settings） | 托管 CLAUDE.md |
|------|---------------------------|----------------|
| **本质** | 技术强制限制 | 行为指导建议 |
| **典型用途** | 阻止特定工具、限制权限、强制代理 | 代码风格、工作流、架构规范 |
| **可否排除** | 由 IT 管理 | 不可排除（确保组织规范始终生效） |
| **配置方式** | 企业管理工具分发 | 系统级文件放置 |

> 💬 hippo：托管 CLAUDE.md 不可被 `claudeMdExcludes` 排除——这是有意设计的安全机制，确保组织的合规要求始终对 Claude 生效。

#### 排除无关的 CLAUDE.md

在 monorepo 中，可能需要排除其他团队的 CLAUDE.md。`claudeMdExcludes` 跨层合并，建议放在 `.claude/settings.local.json` 保持排除本地化（不会影响其他人的设置）：

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

---

## 二、自动记忆详解

### 2.1 工作原理与存储

自动记忆让 Claude **自己决定什么值得记**——构建命令、调试技巧、架构决策、你纠正过它的偏好。Claude 不会每个会话都保存记忆，只在它认为有值得记录的内容时才写入。

**存储结构**：

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # 索引文件，每次会话加载前 200 行
├── debugging.md       # 调试相关笔记
├── api-conventions.md # API 约定
└── patterns.md        # 发现的代码模式
```

几个关键点：

- **MEMORY.md 前 200 行**在每次对话开始时加载，主题文件按需读取
- `<project>` 路径基于 git 仓库，所以**同一仓库的所有 worktree 共享记忆**
- 自动记忆是**机器本地**的，不会通过 git 同步，换电脑后需要让 Claude 重新学习
- `autoMemoryDirectory` 不接受项目层设置（`.claude/settings.json`），这是安全设计，防止共享项目把记忆写入重定向到敏感位置

如果需要自定义记忆目录，只能在策略、本地或用户层配置：

```json
// ~/.claude/settings.local.json（本地设置）
{
  "autoMemoryEnabled": true,
  "autoMemoryDirectory": "~/my-custom-memory-dir"
}
```

> 💬 hippo：当你在界面看到 "Writing memory" 或 "Recalled memory" 时，就是 Claude 在更新或读取记忆文件。

### 2.2 配置参数与 /memory 命令

| 参数名 | 配置层级 | 默认值 | 说明 |
|--------|----------|--------|------|
| `autoMemoryEnabled` | 用户、本地、项目 | `true` | 是否启用自动记忆，也可用环境变量 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` 禁用 |
| `autoMemoryDirectory` | 策略、本地、用户 | `~/.claude/projects/<project>/memory/` | 自动记忆文件存储目录，**不接受项目层设置** |
| `claudeMdExcludes` | 策略、用户、项目、本地 | `[]` | 要排除的 CLAUDE.md 文件 glob 模式数组，跨层合并，托管策略不可排除 |

运行 `/memory` 命令可以：

- **列出已加载的 CLAUDE.md 和规则文件**——确认哪些文件生效了
- **开关自动记忆功能**——临时关闭或开启
- **打开记忆文件夹**——直接浏览和编辑记忆文件

**"让 Claude 记住" vs "添加到 CLAUDE.md"**：这是两个不同的操作。对 Claude 说"记住这个"会把内容写入自动记忆（Claude 自己的笔记），说"添加到 CLAUDE.md"会写入指令文件（你的规则）。前者 Claude 自己维护，后者是明确的指令。

> 💬 hippo：如果你想查看自动记忆保存了什么，直接运行 `/memory` 然后打开记忆文件夹浏览。我偶尔会去删掉 Claude 记错的、过时的条目，保持记忆质量。

---

## 三、故障排查与对比

### 3.1 常见问题速查

**Claude 不遵循我的 CLAUDE.md**

排查步骤：

1. 运行 `/memory` 确认文件被加载
2. 检查文件是否在正确位置（项目根目录或 `.claude/` 目录）
3. 让指令更具体——"用 2 空格缩进" 远比 "格式化代码很好" 有效
4. 检查是否有冲突指令，两条矛盾规则会让 Claude 任意选择

**不知道自动记忆保存了什么**

运行 `/memory`，然后选择打开记忆文件夹，直接浏览 MEMORY.md 和各主题文件。发现过时内容就手动删掉。

**CLAUDE.md 太大**

- 把详细内容移到独立文件，用 `@path` 导入
- 用 `.claude/rules/` 分主题管理，配合 `paths` frontmatter 限定范围
- 目标：每个文件 < 200 行

**`/compact` 后指令丢失**

CLAUDE.md 在 `/compact` 后会从磁盘重新加载，**完全在压缩中存活**。如果指令消失了，说明它只在对话中提过，没写进文件。解决方法：明确让 Claude "把它写到 CLAUDE.md"。

#### --append-system-prompt：系统提示级强制

如果你需要 Claude **强制**遵循某些指令（而非"尽量"遵循），可以使用 `--append-system-prompt` 标志。这会将内容直接追加到系统提示中，适合脚本和自动化场景：

```bash
# 在 CI 脚本中强制特定的代码风格
claude --append-system-prompt "所有生成的代码必须使用 4 空格缩进"

# 自动化任务中强制输出格式
claude --append-system-prompt "输出必须是 JSON 格式，不要包含 markdown"
```

**使用场景对比**：

| 方式 | 执行方式 | 遵循程度 | 适用场景 |
|------|----------|----------|----------|
| CLAUDE.md | 作为用户消息传递 | 尽量遵循 | 项目规范、编码标准、日常工作流 |
| `--append-system-prompt` | 追加到系统提示 | 更强制性 | CI/CD 脚本、自动化任务、必须遵守的约束 |

> 💬 hippo：`--append-system-prompt` 必须在**每次调用时传递**，所以更适合脚本和自动化场景，而不是日常交互使用。日常交互还是用 CLAUDE.md 更方便。

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
| 给人看的备注 | 用 HTML 注释写在 CLAUDE.md 中，不消耗 Claude 上下文 |
| 需要强制遵循 | 脚本中用 `--append-system-prompt` |

---

**CLAUDE.md 是你给 Claude 的"员工手册"，自动记忆是 Claude 自己的"工作笔记"**——两者配合使用，让 Claude 越用越懂你。

**下一篇**：[精读官方文档：使用 Skills 扩展 Claude](/2026/03/22/ai-tools/official-docs/skills/)，把常用工作流打包成可复用的命令。

---

*本文精读自 [Claude 如何记住你的项目](https://code.claude.com/docs/zh-CN/memory)*

*最后更新：2026-03-31*
