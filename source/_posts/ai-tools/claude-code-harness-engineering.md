---
title: Claude Code 的超能力引擎：深入理解 Agent Harness
date: 2026-03-31 10:00:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, Agent Harness, AI 编程, 上下文工程]
categories: [AI 工具系列]
series: claude-code
series_index: 9
description: 2026 年被称为"Agent Harness 元年"。Harness 是包裹在 AI 模型外面的脚手架，把一个只会聊天的 LLM 变成能持续可靠地完成复杂编码任务的工作系统。本文深入解读 Anthropic 官方的 Harness 设计哲学和实战案例。
cover: https://picsum.photos/seed/agent-harness-engineering/1920/1080
---

# Claude Code 的超能力引擎：深入理解 Agent Harness

如果你用过 Claude Code，你一定遇到过这种情况：模型明明很聪明，但在长任务中却频繁翻车——做到一半忘了目标、自己宣布"完成了"但其实没做完、改了 A 功能却把 B 功能搞坏了。

问题往往不在模型本身，而在包裹它的那层"脚手架"——**Harness**。

2026 年 3 月，Anthropic 连发两篇工程博客，社区 82K Star 的 ECC 项目也把定位从"配置包"改为"Agent Harness 性能优化系统"。整个行业正在形成共识：**Harness Engineering 是 Agentic Coding 的核心竞争力。**

这篇文章带你深入理解 Harness 是什么、由哪些组件构成、Anthropic 官方怎么用它让 Claude 独立跑完 6 小时的编码任务。

---

<!-- more -->

## 一句话定义

**Harness 就是包裹在 AI 模型外面的运行环境——它把一个只会聊天的 LLM，变成一个能持续、可靠地完成复杂编码任务的工作系统。**

核心公式：

```
编码智能体 = AI 模型 + Harness（脚手架/运行环境）
```

打个比方：LLM 像一个极其聪明但失忆的工程师，每次醒来都不知道之前做了什么。Harness 就是给他安排的工作台、项目管理工具、交接文档和检查清单——让他能持续干活而不翻车。

很多人会说"这不就是提示词工程吗？"不是。Harness 是**上下文工程（Context Engineering）**的子集。提示词工程解决的是"怎么和模型说话"，上下文工程解决的是"模型在什么环境下工作"——包括它能调用哪些工具、什么时候加载什么知识、如何验证自己的产出。

## Harness 的六大组件

一个完整的 Harness 由六个配置面组成：

| 组件 | 作用 | 你的项目中对应什么 |
|------|------|-------------------|
| **CLAUDE.md** | 项目级指令注入，每次启动自动读取 | 代码规范、目录结构、常用命令 |
| **MCP Servers** | 扩展 Agent 的工具能力 | Playwright（浏览器）、Linear（项目管理） |
| **Skills** | 可复用的知识模块，按需加载 | 前端设计技能、代码审查技能 |
| **Sub-agents** | 在独立上下文中执行子任务 | Explore Agent、Plan Agent |
| **Hooks** | 事件驱动的自动化流程 | 构建验证、代码格式化、通知 |
| **Back-pressure** | 让 Agent 能自我验证工作质量 | 单元测试、类型检查、覆盖率 |

理解这六个组件后，有两个关键思想需要刻在脑子里：

**1. 渐进式披露（Progressive Disclosure）**

不要一次性把所有知识塞进系统提示词。只在 Agent 需要时才加载它需要的知识。比如 Skills 的设计哲学就是——Agent 默认不知道这个技能存在，只有遇到相关任务时才激活并加载 `SKILL.md`。

**2. 上下文窗口是稀缺资源**

Chroma 的研究证实了：模型在长上下文下表现会下降。每个无关的工具描述、每个通过的测试用例输出，都是干扰。Anthropic 甚至专门发布了 MCP 工具搜索功能，来解决"连接太多 MCP 导致上下文爆炸"的问题。

## Anthropic 官方的 Harness 实战

Anthropic 的两篇工程博客展示了 Harness 的两个进化阶段。

### 阶段一：双 Agent 架构

第一个解决的问题是：如何让 Claude 跨越多个上下文窗口，持续完成一个完整应用？

答案是两个专职 Agent：

| 角色 | 职责 |
|------|------|
| **Initializer Agent** | 只在第一次运行，把需求分解为 200+ 个具体特性，创建项目结构和 `init.sh` |
| **Coding Agent** | 之后每次运行，读进度文件 → 选一个特性 → 实现它 → 写 git commit → 留进度笔记 |

特性列表用 JSON 而非 Markdown 存储，因为模型不太会乱改 JSON 文件：

```json
{
  "category": "functional",
  "description": "新建聊天按钮创建新的对话",
  "steps": [
    "导航到主界面",
    "点击"新建聊天"按钮",
    "验证新对话已创建",
    "检查聊天区域显示欢迎状态"
  ],
  "passes": false
}
```

每次 Coding Agent 上班的流程是：

```bash
# 1. 先搞清楚自己在哪
pwd

# 2. 读交接文档和 git 日志
cat claude-progress.txt
git log --oneline -20

# 3. 读特性列表，选一个没做的
cat feature_list.json

# 4. 启动开发服务器，验证基本功能没被搞坏
bash init.sh

# 5. 实现一个特性，测试通过后改 passes: false → true
```

这个看似简单的架构解决了三个核心问题：
- Agent 想一次做完所有事导致上下文爆了 → 强制一次只做一个特性
- 新 Session 不知道之前干了什么 → 进度文件 + git 日志做交接
- Agent 自己说"做完了"但其实没做完 → 特性列表 + 端到端测试强制验证

### 阶段二：GAN 启发的三智能体架构

第二个进化借鉴了生成对抗网络（GAN）的思路。核心洞察是：**让模型评价自己的工作，它会不自觉地放水。** 解决方案是把"干活"和"评价"交给不同的 Agent。

```
用户一句话需求
    ↓
Planner（规划器）→ 展开为完整产品规格
    ↓
Generator（生成器）→ 一个特性一个特性地实现
    ↓
Evaluator（评估器）→ 用 Playwright 实际操作应用，逐项打分
    ↓ 不通过则反馈给 Generator 迭代
```

实测数据非常说明问题。以"2D 复古游戏制作器"为例：

| 方案 | 耗时 | 成本 | 结果 |
|------|------|------|------|
| 单 Agent | 20 分钟 | $9 | 界面有了，但游戏核心功能完全坏了 |
| 三智能体 Harness | 6 小时 | $200 | 完整可用的应用，含 AI 辅助功能 |

再看一个更复杂的案例——浏览器内 DAW（数字音频工作站）：

| 阶段 | 耗时 | 成本 |
|------|------|------|
| 规划 | 4.7 分钟 | $0.46 |
| 构建（第1轮） | 2 小时 7 分 | $71.08 |
| QA（第1轮） | 8.8 分钟 | $3.24 |
| 构建（第2轮） | 1 小时 2 分 | $36.89 |
| QA（第2轮） | 6.8 分钟 | $3.09 |
| 构建+QA（第3轮） | 20.5 分钟 | $9.94 |
| **总计** | **3 小时 50 分** | **$124.70** |

QA Agent 能精准发现类似这样的 Bug：

> "矩形填充工具只拖了起点和终点的 tile，没有填充整个区域"
> "路由定义顺序导致 `reorder` 被误匹配为 frame_id，返回 422 错误"

这些是代码层面很难发现、但用户一用就会遇到的问题。

## 实战经验：什么有效，什么无效

HumanLayer 团队花了数月时间在真实企业级项目中验证 Harness 设计，总结出了几条血泪经验。

### 有效的做法

- **从简单开始**：Agent 真正失败了才加配置。不要预先设计"完美"的 Harness
- **子智能体用于上下文隔离，而非角色扮演**："前端工程师 Agent"不如"做特定任务的干净小窗口 Agent"
- **成功时静默，失败时才输出**：4000 行通过测试会淹没上下文，只显示错误信息
- **用 CLI 替代冗余的 MCP**：GitHub、Docker 这些，模型在训练数据里已经见过了，直接用 shell 命令比装 MCP 更高效
- **成本控制**：父会话用 Opus 做规划调度，子智能体用 Sonnet/Haiku 做执行

### 无效的做法

- **一次性设计"完美"配置**：Harness 是迭代的产物，不是设计出来的
- **安装几十个 MCP Server "以防万一"**：每个工具描述都吃上下文，不用的时候就是干扰
- **用 LLM 自动生成 CLAUDE.md**：ETH Zurich 的研究（138 个 agentfile 测试）证实，LLM 生成的指令文件反而降低 20%+ 性能
- **每次都跑完整测试套件**：太慢、太长、太吵。跑子集就够了

## 你已经在用 Harness 了

读完上面的内容，你可能觉得 Harness 是什么高深的概念。但实际上，如果你在用 Claude Code，你**已经搭建了一个 Harness**。

看看你的项目：
- `CLAUDE.md` 里的代码规范和命令列表 → 项目级指令注入
- `.claude/settings.json` 里的 Hooks → 自动化控制流
- 通知脚本（飞书、桌面通知）→ 集成
- 构建验证 Hook → Back-pressure 机制

Mitchell Hashimoto（HashiCorp 联合创始人）对 Harness Engineering 的定义很精辟：

> 每当你发现 Agent 犯了一个错，你就花时间设计一个方案，让它再也不会犯同样的错。

下次遇到 Claude Code 表现不如预期时，先别急着怪模型——**检查一下你的 Harness**。

## 总结

Anthropic 在文章最后说了一句很值得品味的话：

> "随着模型持续进步，有趣的 Harness 组合不会缩小。它会移动。而 AI 工程师的工作，就是不断找到下一个新的组合。"

这意味着：模型越强，你能通过 Harness 让它做的事情就越复杂。 Harness 不是模型不够强时的"拐杖"，而是释放模型潜力的"引擎"。

如果你刚接触 Claude Code，先把 `CLAUDE.md` 写好（保持简洁，60 行以内就够了），再加一两个解决实际痛点的 Hook——这就是一个不错的 Harness 起点。

---

## 相关文章

- [系列索引：Claude Code 从入门到上手](/2026/03/12/ai-tools/claude-code-series-index/)
- [如何用好 Claude Code：我的最优实践总结](/2026/03/12/ai-tools/claude-code-best-practice/)
- [Claude Code Hooks 实战：任务完成自动通知](/2026/03/25/ai-tools/claude-code-hooks-practice/)
- [Claude Code Subagent 实战：并行重写 20 篇博客](/2026/03/25/ai-tools/claude-code-subagent-practice/)
