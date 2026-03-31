---
title: 精读官方文档：Scheduled Tasks - 按计划运行提示词
date: 2026-03-27 14:40:00
updated: 2026-03-31 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 22
description: 深入理解 Claude Code 的 Scheduled Tasks 功能，掌握 /loop 循环执行、一次性提醒、cron 调度工具的使用方法，以及抖动机制和过期策略等实战细节。
cover: https://picsum.photos/seed/scheduled-tasks-cron/1920/1080
source_url: https://docs.anthropic.com/en/docs/claude-code/scheduled-tasks
---

# 精读官方文档：Scheduled Tasks - 按计划运行提示词

> hippo：Claude Code 里藏着一个"定时炸弹"——不是真的炸弹，而是一个轻量级的 cron 定时任务系统。你可以让 Claude 每隔几分钟帮你检查部署状态，或者在下午三点提醒你提交代码。本篇精读自 [官方文档：Run prompts on a schedule](https://docs.anthropic.com/en/docs/claude-code/scheduled-tasks)。

---

## 一、这个功能是什么

Scheduled Tasks 就是 Claude Code 内置的定时任务功能。如果你用过 Linux 的 crontab，理解起来毫无压力——本质上是一样的东西：按照设定的时间间隔，自动执行一段提示词。

几个典型的使用场景：

- **轮询部署状态**：代码推上去了，不想干等，让 Claude 每 5 分钟帮你看看 GitHub Actions 跑完没
- **监督 PR**：让 Claude 定期检查某个 PR 的 review 状态
- **检查长时间构建**：跑一个耗时的编译任务，让 Claude 帮你盯着
- **设置一次性提醒**：下午 3 点有个会议，让 Claude 提前提醒你

**关键限制：任务是会话范围的**。也就是说，任务活在当前 Claude Code 进程里，你退出终端，任务就没了。这和传统的 crontab 不一样——crontab 是系统级的，重启还在；GitHub Actions 的 schedule 触发器也是持久化的。Scheduled Tasks 是轻量级、会话内的临时调度，定位更像是"我在干活的时候，顺便让 Claude 帮我盯着点"。

官方文档还提供了一张对比表，把 Cloud Scheduled Tasks、Desktop Scheduled Tasks 和 `/loop` 三种方式做了横向比较，核心区别在于：Cloud 不需要你的电脑开着，Desktop 需要电脑但不需要会话，`/loop` 需要会话在线。

<!-- more -->

---

## 二、官方教程精读

### 2.1 使用 /loop 计划重复提示词

`/loop` 是最快的创建重复任务的方式。输入一个可选的间隔和一个提示词，Claude 就会在后台创建一个 cron 作业，同时你的会话照常使用。

**三种写法：**

```bash
# 写法一：前导间隔——间隔放在最前面
/loop 5m check if the deployment finished and tell me what happened

# 写法二：尾部 every 子句——间隔放在最后面
/loop check the build every 2 hours

# 写法三：省略间隔——默认每 10 分钟执行一次
/loop check the build status
```

Claude 会解析间隔，转换成 cron 表达式，然后确认执行频率和任务 ID。

**间隔语法对照表：**

| 形式 | 示例 | 解析结果 |
| --- | --- | --- |
| 前导令牌 | `/loop 30m check the build` | 每 30 分钟 |
| 尾部 `every` 子句 | `/loop check the build every 2 hours` | 每 2 小时 |
| 无间隔 | `/loop check the build` | 默认每 10 分钟 |

支持的单位：`s`（秒）、`m`（分钟）、`h`（小时）、`d`（天）。秒数会向上取整到最近的分钟，因为 cron 的最小粒度是一分钟。如果间隔不能整除单位（比如 `7m` 或 `90m`），Claude 会取最近的整数间隔并告诉你它选了什么。

**循环执行其他命令或技能：**

```bash
# 每 20 分钟自动 review 一次指定 PR
/loop 20m /review-pr 1234
```

每次触发时，Claude 会像你手动输入 `/review-pr 1234` 一样执行它。这对于重复执行已经打包好的工作流特别方便。

### 2.2 设置一次性提醒

一次性提醒不用 `/loop`，直接用自然语言描述就行。Claude 会创建一个单次触发的任务，运行后自动删除。

```bash
# 写法一：指定具体时间
remind me at 3pm to push the release branch

# 写法二：指定相对时间
in 45 minutes, check whether the integration tests passed
```

Claude 会用 cron 表达式把触发时间固定到具体的分钟和小时，然后告诉你什么时候会触发。不用自己写 cron 表达式——说人话就行。

### 2.3 管理计划任务（CronCreate / CronList / CronDelete）

管理任务也很简单，直接用自然语言：

```bash
# 查看当前所有计划任务
what scheduled tasks do I have?

# 取消某个任务（用描述性语言就行）
cancel the deploy check job
```

底层 Claude 使用三个工具来管理任务。你也可以直接调用这些工具：

```bash
# 直接用 CronCreate 创建一个任务，精确控制 cron 表达式
# 每天早上 9:07 检查 CI 状态
CronCreate with cron: "7 9 * * *" prompt: "check CI status" recurring: true
```

**三个 cron 工具对照表：**

| 工具 | 用途 | 关键参数 |
| --- | --- | --- |
| `CronCreate` | 创建新任务 | 5 字段 cron 表达式、提示词、是否重复 |
| `CronList` | 列出所有任务 | 无参数，返回任务 ID、计划、提示词 |
| `CronDelete` | 取消任务 | 8 字符任务 ID |

每个任务都有一个 **8 字符的 ID**，传递给 `CronDelete` 用来取消任务。单个会话最多可以同时保存 **50 个** 计划任务。

### 2.4 调度机制详解：抖动、时区与过期

这部分是理解 Scheduled Tasks 行为的关键。

**时区：** 所有时间使用你的本地时区（Local Timezone），不是 UTC。`0 9 * * *` 意味着你所在时区的早上 9 点。

**抖动机制（Jitter）：** 为了避免所有 Claude Code 会话在同一时刻冲击 API，调度器会添加一个确定性偏移。偏移从任务 ID 派生，同一任务的偏移始终相同。

**抖动行为对照表：**

| 任务类型 | 抖动规则 | 实际影响示例 |
| --- | --- | --- |
| 重复任务 | 最多延迟周期的 10%，上限 15 分钟 | 每小时的任务可能在 `:00` 到 `:06` 之间任意时刻触发 |
| 一次性任务（整点/半点） | 最多提前 90 秒 | 设为 3:00 的提醒可能在 2:58:30 就触发 |
| 一次性任务（非整点非半点） | 不适用抖动 | 设为 3:07 的提醒精确在 3:07 触发 |

如果你需要精确时间，选一个不是 `:00` 或 `:30` 的分钟数就行了，比如 `3 9 * * *` 而不是 `0 9 * * *`。

**三天过期：** 重复任务在创建后 3 天自动过期，过期时最后触发一次然后自我删除。这是为了防止"忘了的循环"无限运行。如果需要更长时间的任务，在过期前取消并重新创建，或者使用 Cloud/Desktop Scheduled Tasks。

### 2.5 Cron 表达式参考

`CronCreate` 接受标准 5 字段 cron 表达式：`minute hour day-of-month month day-of-week`。

所有字段支持通配符（`*`）、单值（`5`）、步长（`*/15`）、范围（`1-5`）和逗号列表（`1,15,30`）。

**Cron 表达式速查表：**

| 表达式 | 含义 |
| --- | --- |
| `*/5 * * * *` | 每 5 分钟 |
| `0 * * * *` | 每小时整点 |
| `7 * * * *` | 每小时的第 7 分钟 |
| `0 9 * * *` | 每天本地时间 9:00 |
| `0 9 * * 1-5` | 工作日本地时间 9:00 |
| `30 14 15 3 *` | 3 月 15 日本地时间 14:30 |

星期字段中，`0` 或 `7` 表示周日，`6` 表示周六。

**不支持的语法：** `L`（最后一天）、`W`（最近工作日）、`?`（不指定）、名称别名（`MON`、`JAN`）这些扩展语法全部不支持。只支持标准的 5 字段数字表达式。

**一个容易踩的坑：** 当月份日期和星期同时受限时（比如 `0 9 15 * 1`，意思是"每月 15 号或者每周一"），只要任一字段匹配就算匹配。这是 vixie-cron 的标准语义，不是 bug。

### 2.6 禁用与限制

**禁用方式：**

```bash
# 完全禁用 cron 调度器
export CLAUDE_CODE_DISABLE_CRON=1
```

设置后，cron 工具和 `/loop` 都不可用，已存在的任务也不再触发。

**三个固有限制：**

1. **只在运行且空闲时触发**：关闭终端或让会话退出，所有任务就没了
2. **不追赶错过的触发**：如果 Claude 在忙长任务时错过了一个触发时间，它会在空闲后补触发一次，而不是每个错过的间隔都触发一次
3. **不跨重启持久化**：重启 Claude Code 会清除所有会话范围的任务

如果你需要无人值守运行，应该转用 Cloud Scheduled Tasks、GitHub Actions 的 `schedule` 触发器，或者 Desktop Scheduled Tasks。

---

## 三、hippo 的实战经验

> hippo：以下是我实际使用 Scheduled Tasks 时的真实经历，踩过的坑和总结的经验。

### 场景一：轮询 GitHub Actions 构建状态

推代码到 master 之后，我习惯用 `/loop` 帮我盯着构建：

```bash
/loop 5m check the latest GitHub Actions run on master and tell me if it succeeded or failed
```

这样我可以继续写代码，Claude 每 5 分钟帮我查一次。构建成功或失败时 Claude 会告诉我。构建完成后我手动取消这个任务就行。

### 场景二：会议前提醒提交代码

下午有个会议，需要提前把代码推上去：

```bash
remind me 15 minutes before 3pm to commit and push my current changes
```

这种一次性提醒很方便，说完就不用记着了。

### 踩坑一：触发延迟让我困惑了好一阵

有一次我设了每 1 分钟检查一次任务，但发现 Claude 有时好几分钟后才响应。后来才理解了——调度器是以低优先级排队的，如果你正在让 Claude 做别的事情（比如让它分析代码），定时任务会等到当前回合结束才触发。这不是 bug，是设计如此。如果你的任务频率很高（比如每分钟），而 Claude 经常在处理复杂请求，实际上触发间隔会远大于你设的值。

### 踩坑二：周五设的任务，周一没了

我周五下午设了一个每天检查的任务，想让它持续跑一周。结果周一回来发现任务已经不在了——重复任务 3 天自动过期。这之后我的做法是：长期任务用 GitHub Actions 的 schedule 触发器，短期轮询才用 `/loop`。

---

## 四、常见问题

**Q: /loop 设的任务重启 Claude Code 后还在吗？**
A: 不在。所有任务都是会话范围的，退出或重启就全部消失。需要持久化调度请使用 GitHub Actions 或 Cloud Scheduled Tasks。

**Q: 我需要精确时间触发，怎么避免抖动？**
A: 避开整点（`:00`）和半点（`:30`）。用 `3 9 * * *` 代替 `0 9 * * *`，这样一次性抖动规则就不适用了。重复任务仍然会有最多 10% 周期的延迟，但偏移是固定的——同一个任务每次延迟都一样。

**Q: 一次能设多少个任务？**
A: 最多 50 个。对于正常使用场景来说完全够用。

**Q: 支持 cron 的 `L`（月末最后一天）和 `W`（最近工作日）语法吗？**
A: 不支持。只支持标准 5 字段数字 cron 表达式，包括通配符、单值、步长、范围和逗号列表。`L`、`W`、`?`、`MON`、`JAN` 等扩展语法全部不支持。

**Q: 重复任务的"错过不追赶"是什么意思？**
A: 假设你设了每 5 分钟检查一次，但 Claude 在处理一个耗时 20 分钟的请求。期间本该触发 4 次，但 Claude 只会在空闲后补触发一次，而不是连续触发 4 次。

---

## 五、小结

Scheduled Tasks 是 Claude Code 会话内的轻量定时任务系统——用 `/loop` 做重复轮询，用自然语言做一次性提醒，用 `CronCreate/CronList/CronDelete` 精细管理。记住三个关键点：任务是会话范围的（退出即消失）、重复任务 3 天自动过期、避开整点可以绕过抖动。需要无人值守的持久调度，请用 GitHub Actions 或 Cloud Scheduled Tasks。

---

*本文精读自 [Run prompts on a schedule](https://docs.anthropic.com/en/docs/claude-code/scheduled-tasks)*

*最后更新：2026-03-31*
