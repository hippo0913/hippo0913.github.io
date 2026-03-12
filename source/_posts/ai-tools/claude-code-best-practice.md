---
title: 如何用好 Claude Code：我的最优实践总结
date: 2026-03-12 19:48:00
updated: 2026-03-12 19:48:00
tags: [Claude Code, AI 工具]
categories: [AI 工具系列]
series: claude-code
series_index: 1
description: 结合官方最佳实践和真实踩坑经验，整理出的 Claude Code 使用方法。从心智模型到六大工具（CLAUDE.md/Skills/Hooks/Subagents/MCP/Plugins）的本质与决策树，附完整项目结构和 SOP。
cover: https://picsum.photos/seed/claude-code/1920/1080
---

# 如何用好 Claude Code：我的最优实践总结

> 本文是我在搭建个人博客过程中，和 Claude 反复讨论后整理出来的一套
> Claude Code 使用方法。结合了官方最佳实践和真实踩坑经验。
> 这不是一次写完的参考手册，而是伴随我个人实践持续更新的成长记录。

---

## 怎么读这篇文章

| 你的情况 | 重点阅读 |
|---------|---------|
| 刚开始用 Claude Code | 第一章 → 第五章，够用了 |
| 用了一段时间想深入 | 重点看第四章（Skills）、第五章（Hooks）|
| 想规划复杂项目 | 第六章 → 第八章 |
| 随时查"该用哪个工具" | 跳到第二章的决策树 |

---

## 一、先建立正确的心智模型

很多人第一次用 Claude Code，会把它当成"更聪明的代码补全工具"。
这个理解是错的，会让你用不好它。

**正确的理解是：Claude Code 是一个住在你终端里的 AI 协作者。**

它能做的不只是写代码，而是：
- 读懂你整个项目的结构和逻辑
- 自己写脚本、自己执行命令、自己看结果
- 出错了自己调试、自己修复
- 多个任务之间传递上下文、相互协作

所以你和它的关系，不是"我问它答"，而是**"你提需求，它来执行，你来把关"**。

---

## 二、六个工具的本质与决策树

Claude Code 提供了六种扩展机制。

**最关键的一条认知：**

> CLAUDE.md 和 Hooks 是**确定性的**——每次必然执行，没有例外。
> Skills 和 Agents 是**概率性的**——Claude 用自己的判断决定何时调用。
> 这个区别，决定了所有架构选择。

| 工具 | 本质 | 触发方式 | 确定性 |
|------|------|---------|--------|
| **CLAUDE.md** | 项目永久记忆 | 每次启动自动读取 | ✅ 确定 |
| **Skills** | 按需加载的专项手册 | 自动匹配 或 `/命令` | ⚡ 概率 |
| **Hooks** | 事件驱动的强制守卫 | 指定事件自动触发 | ✅ 确定 |
| **Subagents** | 独立上下文的专职工人 | 主 agent 派生 | ⚡ 概率 |
| **MCP** | 连接外部世界的插头 | 工具调用时 | ✅ 确定 |
| **Plugins** | 上述工具的打包分发格式 | 安装后生效 | - |

### 工具选择决策树

面对一个新需求，按这个顺序问自己：

```
这个需求需要 Claude 记住，每次 session 都生效？
    ├── 是 → 写进 CLAUDE.md
    └── 否 ↓

这是一条"必须执行"的强制规则（安全/质量门禁）？
    ├── 是 → 用 Hook（确定性保障）
    └── 否 ↓

这是一个重复执行的流程或操作手册？
    ├── 是，我来决定何时触发 → 手动触发的 Skill（/命令）
    ├── 是，Claude 判断场景自动触发 → 自动触发的 Skill
    └── 否 ↓

这个任务需要独立的上下文，或者要并行执行？
    ├── 是 → Subagent
    └── 否 → 直接在主 session 里做，不需要特殊工具

另外：需要访问外部服务（搜索/Notion/数据库）？→ MCP
     需要跨项目复用一套配置？→ Plugin
```

**快速记忆版：**
- 永久记忆 → CLAUDE.md
- 强制执行 → Hook
- 可复用流程 → Skill
- 隔离上下文 → Subagent
- 外部服务 → MCP

---

## 三、CLAUDE.md：项目永久记忆

Claude Code 每次启动都会读取项目根目录下的 `CLAUDE.md`，
这是你和它之间的**长期约定**，写一次，每次都生效。

### 三层内容

好的 CLAUDE.md 覆盖三层，缺任何一层都会让你在每次 session 开始时手动纠正 Claude：

**第一层：地图**（让 Claude 知道项目长什么样）
```
Hexo 博客，Butterfly 主题，部署在 GitHub Pages。
文章在 source/_posts/，主题配置在 _config.butterfly.yml。
```

**第二层：意图**（让 Claude 理解为什么这样设计）
```
所有主题修改必须写在 _config.butterfly.yml 里，
不能直接改 node_modules 里的主题文件，升级主题会覆盖。
```

**第三层：操作手册**（告诉 Claude 怎么做事）
```
本地预览：hexo clean && hexo server
发布：git push（触发 GitHub Actions，执行前必须告知我）
```

### 五个标准段落

```markdown
# 项目名 - Claude 指引

## Critical Rules（必须遵守）
- 所有主题修改写在 _config.butterfly.yml，不要动 node_modules
- git push 前必须等待我确认
- 一次只做一件事，完成并确认后再继续

## 项目概览
- 技术栈：Hexo + Butterfly 主题，部署在 GitHub Pages
- 关键目录：source/_posts/（文章），_config.butterfly.yml（主题配置）
- 数据流：本地写作 → hexo build → GitHub Actions → GitHub Pages

## 工作方式
- 本地预览：hexo clean && hexo server
- 发布：git push
- 新建文章：hexo new "标题"

## Claude 常犯的错误
- 错误：修改 node_modules 里的文件
  正确：所有配置改 _config.butterfly.yml
- 错误：假设文章已发布，直接去验证线上效果
  正确：先本地 hexo server 预览，确认后再 push

## 详细文档（按需读取）
- 写作规范：.claude/docs/writing-style.md（写文章时读取）
- Hexo 约定：.claude/docs/hexo-conventions.md（改配置时读取）
```

### 保持简短：200 行以内

研究发现，前沿 LLM 在 150-200 条指令后注意力开始均匀下降，
而 Claude Code 自己的系统提示已经占用了约 50 个指令槽。
你实际只有 100-150 个槽位可用。

**每一行 CLAUDE.md 都在和其他行竞争 Claude 的注意力。**

❌ 反模式：700 行的 CLAUDE.md，什么都写进去
✅ 正确做法：核心规则 ≤200 行，细节放 `.claude/docs/`，CLAUDE.md 里只写"什么时候去读那个文件"

### CLAUDE.md 怎么迭代

CLAUDE.md 不是一次写完的，而是随着你的使用不断演化的。

**加规则的时机：**
Claude 犯了同一类错误超过一次，就加进去。

**规则怎么写才有效：**

❌ 只写禁止，不给替代方案：
```
永远不要直接调用 generate()
```
这样写有问题——Claude 遇到必须调用的情况会卡住不知道怎么办。

✅ 禁止 + 替代方案：
```
不要直接调用 generate()，改用 generate_with_system()，
它会自动注入系统提示，签名相同，直接替换即可。
```

**什么时候把规则移到 Skill：**
如果一条规则只在特定场景下有效（比如"写文章时"），
就不适合放在 CLAUDE.md 里污染所有任务的上下文，移到对应的 Skill 里。

**怎么判断规则是否被遵守：**
观察 Claude 的执行过程，如果发现它没有按规则来，
先检查规则是否太模糊、是否被淹没在一堆其他规则里，
而不是直接加更多规则。有时候精简 CLAUDE.md 比添加更有效。

### CLAUDE.md 的三个层级

```
~/.claude/CLAUDE.md          ← 用户级：跨所有项目生效（个人偏好、工作风格）
项目根目录/CLAUDE.md          ← 项目级：当前项目生效（最常用）
src/CLAUDE.md                ← 子目录级：只在该目录生效（大型单体项目用）
```

项目级优先于用户级，子目录级优先于项目级。

---

## 四、Skills：按需加载的专项手册

Skills 是 Claude Code 中最容易用错的工具。
很多人上来就设计一堆 Skills，结果发现维护成本很高、实际效果一般。

**正确的使用姿势是：先用，遇到重复后再提炼。**

> 官方建议的工作流：先在没有 Skill 的情况下完成任务，
> 观察自己反复提供了什么上下文、反复纠正了什么错误，
> 然后再把这些经验提炼成 Skill。

### Skills 的两种触发模式

```yaml
# 手动触发：你输入 /publish 才执行
---
name: publish
description: 发布博客文章到 GitHub Pages
user_invocable: true
disable-model-invocation: true   # 关键！有副作用的操作禁止自动触发
---

# 自动触发：Claude 判断场景匹配时自动加载
---
name: front-matter-check
description: 当 Claude 写或编辑 source/_posts/ 下的 markdown 文件时，
             自动检查 Front Matter 格式和必填字段是否完整
user_invocable: false
---
```

**关于 `disable-model-invocation: true`：**
凡是有副作用的操作（发布、部署、推送代码、写数据库），
必须加这个字段。你不希望 Claude 自己判断"现在可以发布了"然后直接推上去。

### description 写法：精确是关键

description 同时服务于两个目的：向用户解释 Skill 做什么，以及告诉 Claude 何时自动触发。

❌ 模糊描述 → 什么文件都触发，包括 JSON、配置文件：
```
description: "检查内容质量"
```

✅ 精确描述 → 只在写博客文章时触发：
```
description: "当 Claude 写或编辑 source/_posts/ 下的 .md 文件时，
             自动检查 Front Matter 格式和必填字段"
```

❌ 模糊描述 → 任何代码改动都触发：
```
description: "运行测试"
```

✅ 精确描述 → 只在后端改动后触发：
```
description: "当 Claude 修改了 backend/ 目录下的文件后，
             运行单元测试并报告结果"
```

**规律：** 在 description 里指定目录、文件类型、触发动作，
Claude 的匹配会精准很多。

### SKILL.md 基本格式

```markdown
---
name: new-post
description: 创建新的博客文章。当用户说"写一篇文章"或"新建文章"时调用。
user_invocable: true
disable-model-invocation: false
---

# 新建文章

## 执行步骤
1. 询问文章标题和主题
2. 列出文章大纲，等待确认
3. 创建文件：`hexo new "标题"`
4. 按大纲写内容
5. 本地预览验证：`hexo server`
6. 等待用户确认后再提交

## Front Matter 模板
---
title: 文章标题
date: YYYY-MM-DD HH:mm:ss
tags: [标签1, 标签2]
categories: [分类]
description: 100字以内摘要
---

## 写作规范
（详细规范见 .claude/docs/writing-style.md）
```

### Skills 文件结构

```
.claude/skills/
  new-post/SKILL.md            # 写新文章（手动触发）
  publish/SKILL.md             # 发布（手动触发，禁止自动）
  front-matter-check/SKILL.md  # Front Matter 检查（自动触发）

~/.claude/skills/              # 全局 Skills，跨所有项目生效
  code-review/SKILL.md
```

---

## 五、Hooks：确定性的质量守卫

Hooks 是 Claude Code 里最容易被忽视、但最值得配置的功能。

**Skills 是建议，Claude 可能忽略。Hooks 是物理屏障，100% 执行。**

> 测试证明：把"永远不要执行 `rm -rf`"写在 CLAUDE.md 里，遵守率约 70%。
> 用 Hook 拦截，是 100%。对于安全规则，确定性胜过概率性。

### Hooks 的工作原理

Hooks 在 Claude Code 操作的关键时机触发，共 17 个事件：
- **PreToolUse**：工具执行前（可以阻断）
- **PostToolUse**：工具执行后（记录、通知）
- **Notification**：Claude 需要告知你时

脚本通过退出码通信：
- `exit 0`：正常，继续
- `exit 2`：**阻断**，Claude 收到原因后会尝试别的方式
- 其他：警告，继续但显示反馈

### Hook 还是 Skill？

| 场景 | 用 Hook | 用 Skill |
|------|---------|---------|
| 安全规则（不可绕过）| ✅ | ❌ |
| 提交前强制测试 | ✅ | ❌ |
| 写作规范检查 | ❌ | ✅ |
| 发布流程定义 | ❌ | ✅（但触发点可以用 Hook 辅助）|

### 值得配置的 Hook 1：危险命令拦截

`.claude/hooks/block-dangerous.sh`：
```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS_PATTERNS=(
  "rm -rf"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "git clean -fd"
  "DROP TABLE"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -q "$pattern"; then
    echo "BLOCKED: $COMMAND" >&2
    echo "该命令在危险列表中，已阻止执行。" >&2
    exit 2
  fi
done

exit 0
```

### 值得配置的 Hook 2：提交前强制测试

这个 Hook 解决了"后端 test 上下文过长"的问题：
测试流程的细节写在 Skill 里供参考，
但"提交前必须通过测试"这条强制要求，由 Hook 保障，不依赖 Claude 记得。

`.claude/settings.json`：
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
      },
      {
        "matcher": "Bash(git commit*)",
        "hooks": [{
          "type": "command",
          "command": "npm run test || { echo '测试未通过，禁止提交' >&2; exit 2; }"
        }]
      }
    ]
  }
}
```

**重要原则：** Hook 应该在 `git commit` 时检查（block-at-submit），
而不是在每次文件编辑时检查（block-at-write）。
让 Claude 把计划做完，在提交这个最终关卡统一验收，
而不是中途频繁打断它的思路。

---

## 六、Subagents：上下文隔离的专职工人

### 真正适合的场景

- 需要并行处理多个独立任务（互不依赖）
- 某个子任务需要大量搜索/读取，不想污染主 session 的上下文
- 需要用更快/更便宜的模型处理简单的探索性工作

### 一个重要的反直觉认知

很多人会给每种任务类型创建一个专用 subagent：
比如"PythonTests subagent"、"FrontendDev subagent"。

**这通常是错的，而且会让情况更糟。**

> 如果你创建了 PythonTests subagent，主 agent 就看不到测试相关的上下文了，
> 无法整体推理代码改动的影响。它被迫调用 subagent 才能知道如何验证自己写的代码。
> 你以为在分工，实际上在制造信息壁垒。

**更好的做法：**
- 测试流程写进 Skill，Claude 需要时读取
- 用内置的 `Task(...)` 工具让主 agent 自己决定何时派生子任务
- 不要替 Claude 做委托决策，让它自己来

### 什么时候才值得用自定义 Subagents？

- 任务完全独立，不需要主 agent 的上下文
  （比如：并行处理 30 个文档页面，每个页面的处理互不影响）
- 需要给子任务配置不同的工具权限
  （比如：只读权限的代码审查 agent）
- 任务规模足够大，值得专门配置

### Subagent 文件格式

```yaml
# .claude/agents/doc-processor/agent.md
---
name: doc-processor
description: 处理单个文档页面，转换为博客文章格式。
             当需要批量处理多个 URL 时由主 agent 调用。
tools: Read, Write, Bash
model: haiku     # 简单任务用便宜的模型
---

你是文档处理专员。给你一个 URL，你需要：
1. 获取页面内容
2. 转换为 Hexo 博客文章格式
3. 添加正确的 Front Matter
4. 保存到 source/_posts/claude-code-docs/ 目录
5. 返回：文件路径 + 文章标题 + 是否成功
```

---

## 七、MCP：连接外部世界

MCP（Model Context Protocol）是让 Claude Code 接入外部服务的标准接口。

### 什么时候才需要 MCP？

只有当你需要 Claude Code 访问外部系统时才接入。
大多数个人项目，内置工具（读写文件、执行命令、网络请求）已经够用。

| 需求 | 对应 MCP |
|------|---------|
| 实时网络搜索 | web search MCP |
| 读写 Notion | Notion MCP |
| 访问数据库 | 对应数据库 MCP |
| GitHub 操作 | GitHub MCP |

### 接入方式

```json
// .claude/settings.json
{
  "mcpServers": {
    "web-search": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-web-search"]
    }
  }
}
```

---

## 八、Plugins：跨项目复用的打包格式

Plugins 是把 Skills + Hooks + MCP 打包在一起，方便跨项目安装和分享的格式。

**什么时候才需要 Plugins？**
- 你有一套配置想在多个项目里复用
- 你想把自己的工作流分享给团队或社区

对于个人项目，暂时不需要考虑。先把 Skills 和 Hooks 用好。

---

## 九、任务管理：TASKS.md

### 描述粒度：只写目标，不写实现

❌ 错误示范（描述实现方式）：
```
用 Python requests 库抓取网页，解析 HTML，提取正文，保存为 md 文件
```

✅ 正确示范（描述目标 + 约束 + 验收）：
```
目标：把 Claude Code 官方文档所有页面转成博客文章
约束：每次只处理一个页面，进度要持久化保存，避免上下文过长
验收：每篇文章有正确的 Front Matter，hexo server 能正常预览
```

让 Claude Code 自己决定用什么语言、什么库、什么方式来实现。

### TASKS.md 格式

```markdown
# 任务列表

## Session: claude-code-docs
> 把 Claude Code 官方文档整理成博客系列文章

### Task 1: 获取所有文档页面 URL
- 状态: ✅ 完成
- 产出: state/session-claude-code-docs/task1-output.md
- 目标: 从官方文档索引页提取所有子页面的 URL 列表
- 验收: urls.txt 包含所有页面链接，格式正确

### Task 2: 逐页转换为博客文章
- 状态: 🔄 进行中
- 依赖: Task 1
- 目标: 每个 URL 对应生成一篇 Hexo 博客文章
- 约束: 每次只处理一个页面，进度持久化
- 回溯策略: guided
- 验收: 通过 /front-matter-check skill 验证

--- milestone: 文档抓取完成 → 更新系列大纲，等待确认 ---

### Task 3: 生成系列大纲文章
- 状态: ⏳ 待执行
- 依赖: Task 2
- 目标: 创建一篇索引文章，包含所有已发布文章的链接和简介
- 验收: 所有链接可以正常跳转

--- milestone: 全部完成 → 执行 /publish，等待确认 ---
```

### 任务完成的判定

- **普通任务**：Claude Code 自动验收后继续，不打断你
- **里程碑节点**：暂停，展示产出，等待你确认后才继续

### 任务状态标记

| 标记 | 含义 |
|------|------|
| `⏳ 待执行` | 还没开始 |
| `🔄 进行中` | Claude Code 正在执行 |
| `✅ 完成` | 执行成功 |
| `❌ 失败` | 执行失败，需要处理 |
| `⏸ 暂停` | 等待人工介入 |

---

## 十、状态管理：两层结构

```
state/
  session-项目名/
    manifest.json       ← 轻量：各任务状态、产出路径、关键参数
    task1-output.md     ← 重量：task1 完整输出，按需读取
    task2-output.md     ← task2 读取 task1-output.md 获取上下文
```

Claude Code 启动时只读 `manifest.json`（很小），
需要回溯排查时才去读具体的 `taskN-output.md`。

**manifest.json 示例：**
```json
{
  "session": "claude-code-docs",
  "tasks": {
    "task1": {
      "status": "completed",
      "output_file": "state/session-claude-code-docs/task1-output.md",
      "key_params": { "total_urls": 32, "urls_file": "scripts/urls.txt" }
    },
    "task2": {
      "status": "in_progress",
      "processed": 10,
      "total": 32
    }
  }
}
```

---

## 十一、自动回溯：让 Pipeline 自愈

### 三种回溯策略

```
回溯策略: full      # 全自动，无限回溯直到成功（简单独立任务）
回溯策略: guided    # 半自动，每次回溯前确认（推荐，复杂项目）
回溯策略: manual    # 手动，失败就停下来等你决定
```

### guided 模式的典型流程

```
前端（task3）运行，调用后端 API 失败
    ↓
Claude Code 分析错误
    ↓
报告："判断是后端字段类型问题（task2），
       打算修改 backend/models.py，是否继续？[y/n]"
    ↓
你确认
    ↓
task2 自动修复 → 重新测试通过 → task3 继续执行 → 成功
```

### 两条保护原则

- **最大回溯深度：2层**。超过 2 层说明根本原因不明，暂停等你介入
- **修复后漂移检测**：每次自动修复后，Claude Code 告知修改了哪些文件、理由是什么、是否影响其他任务

---

## 十二、日志系统：按 Session 组织

```
logs/
  sessions/
    session-claude-code-docs.md    ← 该系列所有任务的日志（含回溯记录）
    session-fullstack-project.md
  standalone/
    2026-03-11-fix-login-bug.md    ← 一次性独立任务
```

### 每个任务的日志结构

```markdown
## Task2: 后端 API 开发

### 📋 计划
- 基于 task1 的 schema，生成 CRUD 接口
- 步骤：读取 schema → 生成接口 → 写测试 → 验证

### ⚙️ 执行记录
- [10:23] 读取 task1-output.md ✅
- [10:25] 运行测试，3 个失败
- [10:26] 修复 bug：字段类型不匹配（int → string）
- [10:27] 测试全部通过 ✅

### ✅ 结果摘要
- 产出：backend/main.py, backend/test_api.py
- 传递给下个任务：API_BASE_URL=http://localhost:8000
```

---

## 十三、上下文管理：主动管理，不要等它满

### 该重启的信号

不要等到上下文爆满才处理，这些信号说明该重启了：

- Claude 开始重复已经做过的事，或者和之前的回答矛盾
- 你发现它忽略了 CLAUDE.md 里的规则
- `/context` 显示使用超过 **60-70%**（不要等到 90%+）
- 刚完成一个完整的功能模块，准备开始新的模块

### 三种重启策略

**`/compact`（尽量避免）**
自动压缩上下文，过程不透明，重要细节可能被丢弃。

**`/clear` + `/catchup`（简单重启）**
清空后让 Claude 读取 git 改动的所有文件，快速恢复上下文。
适合任务相对简单、改动集中在少数文件的情况。

**文档化后重启（复杂任务）**
让 Claude 把当前计划和进度写进一个 `.md` 文件，
`/clear` 后新 session 读这个文件继续。
这正是我们设计 TASKS.md + state/ 的原因——
`manifest.json` 就是轻量级的"进度文件"，
新 session 只需读 CLAUDE.md + TASKS.md + manifest.json 就能恢复全貌。

---

## 十四、完整的项目结构

```
项目根目录/
├── CLAUDE.md                        # ≤200行，核心规则 + 详细文档的索引
├── TASKS.md                         # 当前任务列表
│
├── .claude/
│   ├── settings.json                # Hooks 配置 + MCP 配置
│   ├── hooks/
│   │   └── block-dangerous.sh       # 危险命令拦截（确定性）
│   ├── skills/
│   │   ├── new-post/SKILL.md        # 写文章（手动触发）
│   │   ├── publish/SKILL.md         # 发布（手动触发，禁止自动）
│   │   └── front-matter-check/      # Front Matter 检查（自动触发）
│   │       SKILL.md
│   └── docs/                        # 渐进式披露的详细文档
│       ├── writing-style.md         # 写作风格（写文章时由 CLAUDE.md 引用）
│       └── hexo-conventions.md      # Hexo 约定（改配置时引用）
│
├── state/                           # 任务状态（两层结构）
│   └── session-xxx/
│       ├── manifest.json
│       └── task1-output.md
│
└── logs/                            # 执行日志（按 session 组织）
    ├── sessions/
    └── standalone/
```

---

## 十五、分阶段搭建：不要一步到位

**第一阶段：立刻搭建（今天就该有）**
- CLAUDE.md（精简到 200 行以内）
- `.claude/settings.json` + `block-dangerous.sh` Hook
- TASKS.md（按需创建任务）

**第二阶段：用了一段时间后（遇到重复才创建）**
- Skills（观察自己反复纠正 Claude 什么，再提炼）
- `.claude/docs/` 里的详细文档
- 提交前测试的 Hook

**第三阶段：项目变复杂后（真正需要再加）**
- Subagents（有并行任务需求时）
- MCP（需要访问外部服务时）
- Plugins（需要跨项目复用时）

---

## 十六、给自己的 SOP

**每次开始新任务：**

1. 检查 CLAUDE.md 是否需要更新
2. 在 TASKS.md 里写任务（目标 + 约束 + 验收 + 回溯策略）
3. 启动：`claude`，说"读取 TASKS.md，从第一个待执行任务开始"
4. 在里程碑节点把关，确认后继续
5. 任务完成后看日志，把 Claude 犯过的错记录进 CLAUDE.md

**每次 Claude 犯错后：**

1. 一次性错误 → 直接纠正
2. 重复错误 → 加进 CLAUDE.md 的"Claude 常犯的错误"段落（禁止 + 替代方案）
3. 同类任务的流程问题 → 提炼成 Skill

---

## 十七、常见误区

| 误区 | 正确做法 |
|------|---------|
| 给 Claude Code 写好脚本让它执行 | 只描述需求，让它自己决定怎么实现 |
| CLAUDE.md 越长越好 | ≤200 行，细节用 docs/ 做渐进式披露 |
| 一开始就设计好所有 Skills | 先用，遇到重复再提炼 |
| 安全规则写在 CLAUDE.md | 用 Hook 强制执行，不依赖 Claude 记得 |
| 完全不管，让它全自动跑完 | 设置里程碑，在关键节点把关 |
| 出错了重新开始 | 利用 state/ 和日志，从断点继续 |
| 给每种任务创建专用 Subagent | 用 Skill + 内置 Task 工具，让主 agent 自己决定如何委托 |
| 上下文满了才处理 | 看到信号就主动 /clear，用 manifest.json 保存进度 |
| 规则只写"不要做 X" | 同时给替代方案，否则 Claude 遇到必须做 X 时会卡住 |

---

*本文持续更新，记录我在实际使用中的新发现。*
*最后更新：2026-03-12*
