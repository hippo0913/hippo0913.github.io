---
title: Claude Code Subagent 实战：并行重写 20 篇博客
date: 2026-03-25 16:30:00
updated: 2026-03-25 16:30:00
tags:
  - Claude Code
  - AI 工具
  - 实战案例
  - Subagent
categories:
  - AI 工具系列
series: claude-code
description: 用 Claude Code 的 Subagent 功能并行重写 20 篇博客文章，包含完整的配置代码、速率限制踩坑和效率对比分析。
cover: https://picsum.photos/seed/claude-subagent-practice/1920/1080
---

# Claude Code Subagent 实战：并行重写 20 篇博客

> 💬 hippo：这是我用 Subagent 并行处理博客重写任务的真实记录。从"串行一篇篇写"到"并行 20 篇同时写"，效率提升明显，但也踩了速率限制的坑。

---

## 一、背景：为什么要用 Subagent？

我有 27 篇 Claude Code 官方文档精读文章需要重写。原来的质量太差：
- 几乎都是模板化的空洞内容
- 缺少官方教程的代码示例、配置格式
- 只有套话，没有实质性的概念解释

**串行写的问题**：每写一篇，上下文就会膨胀。写到第 10 篇时，Claude 开始"遗忘"模板要求，质量下降。

**Subagent 的优势**：
- 每个 Subagent 有独立的上下文窗口
- 可以并行执行，不互相干扰
- 主线程只需等待结果

<!-- more -->

---

## 二、Subagent 配置

### 2.1 创建文章模板

在 `.claude/templates/doc-rewrite-template.md` 定义重写标准：

```markdown
# Claude Code 官方文档精读模板

## 文章结构

每篇文章必须包含以下部分：

### Front Matter

\`\`\`yaml
---
title: 精读官方文档：{主题名称}
date: {YYYY-MM-DD HH:mm:ss}
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: {序号}
description: {50-100字摘要，包含关键概念}
source_url: {官方文档原链接}
---
\`\`\`

## 验收标准

| 元素 | 要求 | 最低数量 |
|------|------|---------|
| 代码块 | 必须注明语言 | ≥2 个 |
| 配置示例 | JSON/YAML/Bash，可复制使用 | ≥1 个 |
| 表格 | 参数说明表，有表头 | ≥1 个 |
| 官方概念解释 | 不是套话，有具体内容 | 每节都有 |
| 个人经验 | 真实的踩坑或建议 | ≥1 条 |
| 字数 | 不含 Front Matter | ≥1000 字 |

## 禁止出现的空洞内容

❌ 以下内容视为不合格：
- "这个功能是 Claude Code 功能体系中的重要组成部分"
- "实践出真知，不如自己动手试一次"
- "场景驱动学习，遇到具体问题时再查文档"
```

### 2.2 创建 Subagent 定义

在 `.claude/agents/doc-writer.md` 定义 Agent 行为：

```markdown
# Claude Code 官方文档精读文章写作 Agent

你是一个专门负责重写 Claude Code 官方文档精读文章的 Agent。

## 任务目标

将低质量的官方文档精读文章重写为高质量、有实质内容的文章。

## 工作流程

1. **阅读模板**：先阅读 `.claude/templates/doc-rewrite-template.md`
2. **阅读原文**：阅读指定的现有文章
3. **获取官方文档**：使用 WebFetch 获取官方文档原文
4. **按模板写作**：按照模板结构重写文章
5. **自检验收**：检查代码块≥2、配置示例≥1、表格≥1

## 可用工具

- `Read` - 读取现有文章和模板
- `Write` - 写入重写后的文章
- `WebFetch` / `WebSearch` - 获取官方文档

## 输出格式

完成后输出简短总结：文章路径、代码块数量、配置示例数量、表格数量。
```

---

## 三、启动 Subagent 并行重写

### 3.1 启动单个 Subagent

使用 `Agent` 工具启动后台任务：

```
Agent "重写 sub-agents.md 文档"
Prompt:
你是一个文档重写 Agent。请按照以下步骤完成任务：

1. 阅读文章模板：`.claude/templates/doc-rewrite-template.md`
2. 阅读现有文章：`source/_posts/ai-tools/official-docs/sub-agents.md`
3. 获取官方文档原文：https://docs.anthropic.com/en/docs/claude-code/subagents
4. 按照模板结构重写文章

完成后输出简短总结。

Options:
- run_in_background: true  ← 关键：后台运行
- subagent_type: "general-purpose"
```

### 3.2 并行启动多个 Subagent

**关键**：在**单条消息**中同时调用多个 Agent，实现真正的并行：

```
┌─────────────────────────────────────────────────────┐
│              主线程（Main Thread）                    │
│                                                     │
│  Agent(sub-agents.md) ────┐                        │
│  Agent(skills.md) ────────┼──→ 后台并行执行         │
│  Agent(mcp.md) ───────────┤    （独立上下文窗口）   │
│  Agent(settings.md) ──────┤                        │
│  Agent(cli-reference.md) ─┘                        │
└─────────────────────────────────────────────────────┘
                        ↓
              等待通知，逐个收到完成结果
```

我一次性启动了 **23 个 Subagent**，每个负责重写一篇文章。

---

## 四、结果统计

### 4.1 成功情况

| 状态 | 数量 | 文章 |
|------|------|------|
| ✅ 成功完成 | **17 篇** | sub-agents, skills, mcp, cli-reference, settings, best-practices, desktop-quickstart, github-actions, claude-overview, vs-code, jetbrains, legal-and-compliance, slack, desktop, third-party-integrations, remote-control, chrome |
| ❌ 速率限制 | **10 篇** | troubleshooting, memory, common-workflows, gitlab-ci-cd, features-overview, ... |

### 4.2 单篇文章质量

以 `sub-agents.md` 为例：

| 指标 | 要求 | 实际 |
|------|------|------|
| 代码块 | ≥2 | **6 个**（YAML、Bash、CLI JSON）|
| 配置示例 | ≥1 | **3 个**（完整的 subagent 配置）|
| 表格 | ≥1 | **3 个**（文件位置、配置字段、内置对比）|
| 字数 | ≥1000 | **约 2000+ 字** |

---

## 五、踩坑记录

### 坑 1：API 速率限制

**问题**：同时启动 20+ 个 Subagent，触发了 API 速率限制（429 错误）。

```
API Error: 429 {"error":{"code":"1302","message":"您的账户已达到速率限制"}}
```

**原因**：每个 Subagent 都是独立的 API 调用，并行太多会触发限流。

**解决方案**：
1. 减少并行数量（建议每次 3-5 个）
2. 在批次之间增加间隔时间
3. 或者接受部分失败，后续重试

### 坑 2：Stop Hook 被每个 Subagent 触发

**问题**：配置了 Stop Hook 发送飞书通知，结果一次性收到 20+ 条通知。

**原因**：**每个 Subagent 完成时都会触发 Stop Hook**，它的 `transcript_path` 是子会话的记录。

**影响**：通知内容显示的是 "重写 xxx.md" 这种任务描述，而不是主会话的用户输入。

**解决方案**：
- 如果不想收到大量通知，可以在并行任务期间临时禁用 Stop Hook
- 或者接受这是正常行为

### 坑 3：无法"召回"已启动的 Subagent

**问题**：用户想停止所有 Subagent，但我无法主动取消后台运行的任务。

**原因**：Subagent 启动后就在后台独立运行，只能等待它自然完成。

**解决方案**：
1. 等待它们自然完成（失败的会很快结束）
2. 关闭当前会话（新会话中 Subagent 不会继续）

---

## 六、效率对比

| 方式 | 27 篇文章 | 说明 |
|------|----------|------|
| 串行（每篇 `/clear`） | ~27 次会话 | 每次都要重新读取模板，效率低 |
| Subagent 并行（5 个/批） | ~6 次会话 | 主线程只需等待，效率提升 4-5 倍 |
| Subagent 并行（20+ 个） | 1 次会话 | 但会触发速率限制，成功率下降 |

**最佳实践**：**每批 3-5 篇，批次间隔 2-3 分钟**，可以在不触发速率限制的情况下获得 3-5 倍效率提升。

---

## 七、完整代码

### 启动脚本（主线程）

```bash
# 创建配置文件
mkdir -p .claude/agents .claude/templates

# 启动并行 Subagent（建议 5 个一批）
# 注意：在单条消息中调用多个 Agent 工具
```

```json
// 示例：并行启动 5 个
[
  {"tool": "Agent", "description": "重写 article1.md", "prompt": "...", "run_in_background": true},
  {"tool": "Agent", "description": "重写 article2.md", "prompt": "...", "run_in_background": true},
  {"tool": "Agent", "description": "重写 article3.md", "prompt": "...", "run_in_background": true},
  {"tool": "Agent", "description": "重写 article4.md", "prompt": "...", "run_in_background": true},
  {"tool": "Agent", "description": "重写 article5.md", "prompt": "...", "run_in_background": true}
]
```

---

## 八、总结

**Subagent 适合的场景**：
- ✅ 批量处理相似任务（如重写多篇文章）
- ✅ 需要独立上下文避免干扰
- ✅ 任务可以完全独立执行

**Subagent 不适合的场景**：
- ❌ 任务之间有依赖关系
- ❌ 需要频繁交互确认的任务
- ❌ API 配额紧张时（会触发速率限制）

**核心收益**：用 1 次会话的等待时间，换取 3-5 倍的任务吞吐量。

---

## 相关文章

- [精读官方文档：Subagents 参考](/2026/03/19/ai-tools/official-docs/sub-agents/) - Subagent 的完整官方文档精读
- [Claude Code Hooks 实战](/2026/03/25/ai-tools/claude-code-hooks-practice/) - 任务完成通知的 Hook 配置

---

*最后更新：2026-03-25*
