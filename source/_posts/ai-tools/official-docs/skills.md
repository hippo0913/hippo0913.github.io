---
title: 精读官方文档：Agent Skills（技能扩展）
date: 2026-03-21 23:00:00
updated: 2026-03-31 12:00:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 10
description: Skills 是 Claude Code 的模块化能力扩展机制，通过 SKILL.md 文件定义，Claude 自动识别或用户手动调用。本文详解创建流程、Frontmatter 配置、参数传递、动态上下文注入和 Subagent 隔离运行。
cover: https://picsum.photos/seed/claude-skills/1920/1080
source_url: https://code.claude.com/docs/zh-CN/skills
---

# 精读官方文档：Agent Skills（技能扩展）

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 一、Skills 是什么

Skills（技能）是 Claude Code 的模块化能力扩展机制。核心思路很简单：你写一个 `SKILL.md` 文件，把特定领域的知识或操作步骤打包进去，Claude 在相关场景下会自动读取并应用，你也可以通过 `/skill-name` 手动触发。

几个关键点：

- **SKILL.md 驱动**：每个 Skill 的核心就是一个 Markdown 文件，Claude 把它加入工具箱，需要时自动加载
- **自定义命令已合并**：旧版的自定义命令（`.claude/commands/`）已经合并到 Skills 中，旧文件继续工作，但 Skills 提供更丰富的功能——支持多文件组织、调用控制、自动发现
- **开放标准**：Skills 遵循 Agent Skills 开放标准，意味着同一套 Skill 文件可以在多个兼容的 AI 工具中使用，不限于 Claude Code

<!-- more -->

---

## 二、官方教程精读

### 2.1 捆绑 Skills 与存储位置

Claude Code 自带 5 个捆绑 Skills，每个会话都可用。它们是基于提示的（prompt-based），可以为 Claude 提供详细的操作剧本：

| Skill | 用途 | 示例 |
|-------|------|------|
| `/batch` | 并行编排大规模更改，分解为独立单元并各自生成 PR | `/batch migrate src/ from Solid to React` |
| `/claude-api` | 加载 Claude API 参考资料（Python、TS、Java、Go 等） | 导入 `anthropic` 包时自动激活 |
| `/debug` | 启用调试日志并排查问题 | `/debug connection timeout` |
| `/loop` | 按间隔重复运行提示 | `/loop 5m check if the deploy finished` |
| `/simplify` | 审查最近更改的文件，查找代码质量问题 | `/simplify focus on memory efficiency` |

**存储位置与优先级**

Skills 按存储位置分为四个级别，高优先级覆盖低优先级：

| 级别 | 路径 | 适用范围 |
|------|------|---------|
| 企业 | 托管设置配置 | 组织内所有用户 |
| 个人 | `~/.claude/skills/<skill-name>/SKILL.md` | 你的所有项目 |
| 项目 | `.claude/skills/<skill-name>/SKILL.md` | 仅此项目 |
| 插件 | `<plugin>/skills/<skill-name>/SKILL.md` | 启用插件的位置 |

插件 Skills 使用 `plugin-name:skill-name` 命名空间，不会和其他级别的同名 Skill 冲突。

**Monorepo 自动发现**

在 Monorepo 中，Claude Code 会从嵌套的 `.claude/skills/` 目录自动发现 Skills：

```
my-monorepo/
├── .claude/skills/           # 根目录 skills
├── packages/
│   ├── frontend/
│   │   └── .claude/skills/   # frontend 专属 skills
│   └── backend/
│       └── .claude/skills/   # backend 专属 skills
```

编辑 `packages/frontend/` 中的文件时，Claude 会同时加载根目录和 frontend 目录下的 Skills。通过 `--add-dir` 添加的目录中的 Skills 也会自动加载，支持实时更改检测——修改了 Skill 文件，不需要重启 Claude Code。

### 2.2 创建 Skill 与 Frontmatter 配置

**创建流程三步走：**

```bash
# 第一步：创建 Skill 目录
mkdir -p .claude/skills/my-skill

# 第二步：编写 SKILL.md（frontmatter + markdown 内容）
# 第三步：测试（自动调用或 /my-skill 手动触发）
```

一个完整的 Skill 示例——部署到生产环境：

```markdown
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:

1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

这个例子中 `disable-model-invocation: true` 确保 Claude 不会自动触发部署——只有你手动输入 `/deploy` 时才会执行，防止误操作。

**Frontmatter 完整字段说明：**

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | 否 | 显示名称，小写字母数字连字符，最多 64 字符，省略则用目录名 |
| `description` | 推荐 | 功能和使用时机描述，Claude 据此决定何时自动加载，务必填写 |
| `argument-hint` | 否 | 自动完成提示，如 `[issue-number]` 或 `[filename] [format]` |
| `disable-model-invocation` | 否 | `true` = 阻止 Claude 自动调用，仅手动 `/skill-name` 触发 |
| `user-invocable` | 否 | `false` = 从 `/` 菜单隐藏，用于背景知识类 Skill |
| `allowed-tools` | 否 | Skill 活动时免授权的工具列表，支持通配符如 `Bash(gh *)` |
| `model` | 否 | Skill 活动时使用的模型 |
| `effort` | 否 | 工作量级别：`low`/`medium`/`high`/`max`，覆盖会话级别 |
| `context` | 否 | 设为 `fork` 在分叉的 subagent 隔离上下文中运行 |
| `agent` | 否 | `context: fork` 时的 subagent 类型：`Explore`/`Plan`/`general-purpose`/自定义 |
| `hooks` | 否 | 限定于此 Skill 生命周期的 hooks 配置 |

**调用控制矩阵**

两个关键 frontmatter 字段组合出三种调用模式：

| 配置 | 用户可调用 | Claude 可调用 | 典型场景 |
|------|----------|-------------|---------|
| （默认） | 是 | 是 | 通用工具，自动和手动都可用 |
| `disable-model-invocation: true` | 是 | 否 | 危险操作如部署、删除 |
| `user-invocable: false` | 否 | 是 | 背景知识、编码规范 |

**内容类型选择**

Skill 内容分两类：**参考内容**——编码规范、API 约定等知识，内联运行，Claude 直接融入当前对话；**任务内容**——部署、代码生成等分步操作，通常配合 `context: fork` 在隔离环境执行，避免污染主对话上下文。

### 2.3 参数传递与动态上下文注入

**字符串替换变量**

| 变量 | 描述 |
|------|------|
| `$ARGUMENTS` | 调用时传递的全部参数 |
| `$ARGUMENTS[N]` 或 `$N` | 按索引访问特定参数，如 `$0`（第一个）、`$1`（第二个） |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID，用于生成唯一标识 |
| `${CLAUDE_SKILL_DIR}` | Skill 所在目录路径，用于引用捆绑的脚本和文件 |

运行 `/migrate-component SearchBar React Vue` 时：`$0` → `SearchBar`，`$1` → `React`，`$2` → `Vue`。

**动态上下文注入**

`!`command` ` 语法是 Skills 的杀手级特性。它在 Claude 接收到内容**之前**执行 shell 命令，用输出结果替换占位符，实现实时数据获取：

```markdown
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request, focusing on:
1. What changed and why
2. Potential risks or issues
3. Suggested improvements
```

执行流程：每个 `!`command` ` 立即执行 → 输出替换 Skill 内容中的占位符 → Claude 接收到包含真实 PR 数据的完整提示。搭配 `context: fork` 和 `agent: Explore`，整个分析在隔离的只读 subagent 中完成。

**Skills 与 Subagents 协作对比**

| 维度 | Skills | Subagents |
|------|--------|-----------|
| 定义方式 | `SKILL.md` + frontmatter | `.claude/agents/` 目录下的 `.md` 文件 |
| 调用方式 | 自动加载或 `/name` 手动触发 | 通过 `context: fork` + `agent` 字段引用 |
| 上下文 | 默认内联，也可 `fork` 隔离 | 始终在隔离上下文中运行 |
| 适用场景 | 知识注入 + 任务编排 | 复杂的独立任务执行 |
| 权限控制 | `allowed-tools` 字段 | Agent 定义中指定 |

两者可以嵌套协作：Skill 通过 `context: fork` + `agent` 字段调用 Subagent，Subagent 中又可以加载对应的 Skills。

**权限控制**

在 `/permissions` 中可以精确控制哪些 Skills 允许运行：

```yaml
# 禁用所有 Skills
Skill

# 只允许特定 Skills
Skill(commit)
Skill(review-pr *)

# 拒绝特定 Skills
Skill(deploy *)
```

`Skill(name)` 精确匹配，`Skill(name *)` 带参数的前缀匹配。如果 Skill 触发过多或描述加载超出预算，可以调大字符限制：

```bash
export SLASH_COMMAND_TOOL_CHAR_BUDGET=20000
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际项目中的使用经验：

### 3.1 项目级 Skills 的组织实践

在我的博客项目中，`.claude/skills/` 下放了多个 Skill：`doc-writer`（文档重写执行器）、`evaluator`（文章评分器）、`planner`（写作规划器）。实际使用中我体会到存储位置选择的重要性——这些 Skill 放在项目级别（`.claude/skills/`）而非个人级别（`~/.claude/skills/`），因为它们和项目结构强绑定。团队协作时其他人也能直接使用。

### 3.2 context:fork 隔离执行

评分系统中的 evaluator Skill 使用了 `context: fork` + 自定义 agent，在隔离环境中运行评分逻辑。这样评分过程中的大量文件读取和中间计算不会污染主对话上下文，主对话保持干净，只接收最终的评分结果和建议。没有用 `context: fork` 之前，评分一轮下来主对话的 token 消耗暴增，加上隔离后这个问题彻底解决。

### 3.3 用 allowed-tools 锁定权限

doc-writer Skill 配置了 `allowed-tools: Bash(gh *)` 来限制工具权限，确保 Skill 只能执行 git 相关操作，不会意外修改评分配置或其他项目文件。这比在 `/permissions` 中全局配置更精细——只在这个 Skill 活动期间授权，Skill 结束后权限自动回收。

---

## 四、常见问题

**Q: Skill 没有被自动触发怎么办？**

检查 `description` 字段是否包含用户会自然说出的关键词。运行 `What skills are available?` 确认 Skill 被识别。也可以尝试重新表述请求，让措辞更接近 description 的内容。如果确实需要手动控制，加上 `disable-model-invocation: true`，直接用 `/skill-name` 调用。

**Q: Skills 和旧的 `.claude/commands/` 是什么关系？**

自定义命令已合并到 Skills 中。旧的 `.claude/commands/` 文件继续工作，但 Skills 提供更多功能：多文件组织、frontmatter 调用控制、自动发现。新项目建议直接用 Skills。

**Q: Claude 看不到我的所有 Skills？**

Skill 描述加载到上下文中的字符预算是动态的（上下文窗口的 2%，回退 16,000 字符）。运行 `/context` 检查是否有 Skills 被排除的警告。可以通过环境变量覆盖限制：`export SLASH_COMMAND_TOOL_CHAR_BUDGET=20000`。

---

## 五、小结

Skills 是 Claude Code 最核心的扩展机制，掌握三个关键点就够用了：

1. **SKILL.md + frontmatter**：一个文件定义知识和行为，frontmatter 控制调用方式和权限
2. **动态注入 `!`command` `**：发送前执行 shell 命令获取实时数据，让 Skill 不再是静态文本
3. **`context: fork` 隔离**：复杂任务在 subagent 中执行，保护主对话上下文干净

建议从简单的参考内容类 Skill 开始（比如团队编码规范），熟练后再做任务类的 Skill（比如自动化部署）。 Skills 写得好不好，关键看 `description` 写得够不够精确——它直接决定了 Claude 什么时候自动加载你的 Skill。

**下一篇**：[MCP（Model Context Protocol）](/2026/03/21/official-docs-mcp/) — 了解如何让 Claude 连接外部工具和数据源。

---

*本文精读自 [Agent Skills - Claude Code Docs](https://code.claude.com/docs/zh-CN/skills)*

*最后更新：2026-03-31*
