---
title: Claude Code 翻车现场：那些让我抓狂的时刻
date: 2026-04-07 10:30:00
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
series: claude-code-advanced
series_index: 1
description: 6 个 Claude Code 使用中的真实翻车场景，每个都附上原因分析、可复制的防范配置和救急命令。看完这篇，你可以少踩一半的坑。
cover: https://picsum.photos/seed/claude-code-pitfalls/1920/1080
---

# Claude Code 翻车现场：那些让我抓狂的时刻

用了几个月 Claude Code，我踩过 6 类典型翻车：删错文件、改错文件、密钥泄露、无限循环、批量任务崩盘、干错项目。每一类都不是个例，而是反复出现的模式。

这篇文章逐个还原场景，分析原因，给出**可以直接复制执行的防范配置**。目标：你看完后能把这些防护措施直接加到自己项目里，少踩一半的坑。

<!-- more -->

---

## 一、文件操作翻车：删错文件 + 干错项目

### 翻车 1：Claude 删了不该删的东西

让 Claude 清理项目中"没用的文件"，它执行了 `rm -rf` 删掉了一个配置目录。目录名包含 `deprecated`，Claude 的判断是"可以删"，但里面有一个我手动维护过的本地覆盖文件。

**救急**：还好之前 commit 过，一条命令捞回来：

```bash
# 恢复被误删的文件或目录
git restore path/to/deleted-file
# 或者恢复整个目录
git restore path/to/deprecated-config/
```

**预防**：用 PreToolUse Hook 拦截危险命令。在 `.claude/settings.json` 里配置：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "cat /dev/stdin | jq -r '.tool_input.command' | grep -P 'rm\\s+(-[a-zA-Z]*f[a-zA-Z]*\\s+|.*--recursive)' && echo 'BLOCKED: dangerous rm command detected' >&2 && exit 1; exit 0"
          }
        ]
      }
    ]
  }
}
```

这样 Claude 执行 `rm -rf` 时会被拦截，需要你确认才能继续。

同时在 CLAUDE.md 里加一条硬规则：

```yaml
# CLAUDE.md 中加入：
- 不可逆操作必须确认（删除、覆写不可恢复的内容）
```

### 翻车 6：在错误的项目目录里干活

同时开了两个终端，一个是博客项目，一个是工作项目。在错误的窗口启动 Claude，它乖乖地在工作项目里创建了博客相关的文件。

**预防**：在 CLAUDE.md 顶部写明项目名称，Claude 启动时会读取并反复提及：

```yaml
# CLAUDE.md 开头：
# 项目名称：小河马的博客（hippo0913.github.io）
# 本地路径：~/hippo/blog/hippo0913.github.io
```

另外，启动 Claude 前养成确认目录的习惯：

```bash
# 确认当前目录再启动 claude
pwd && ls package.json _config.yml 2>/dev/null && claude
```

---

## 二、会话管理翻车：上下文溢出 + 无限循环

### 翻车 2：上下文溢出导致"幽灵编辑"

长会话里让 Claude 改配置文件 A，它把改动写到了文件 B。会话已经几十轮，它"忘了"当前该处理哪个文件。

**怎么判断上下文快满了**：Claude Code 状态栏会显示上下文占用百分比。超过 70% 时，就该压缩或开新会话了。

**关键操作**：

```bash
# 上下文 50-70%：压缩，保留关键信息
/compact

# 上下文超过 70%：直接清空，开新会话
/clear
```

另一个实用的习惯：**在 prompt 里带完整文件路径**。对比例子：

```bash
# 容易出错：只说"改那个配置文件"
"把配置文件里的端口改成 8080"

# 不容易出错：带完整路径
"修改 /home/yy/hippo/blog/hippo0913.github.io/_config.yml，把 port 从 4000 改成 8080"
```

### 翻车 4：Claude 陷入无限循环

让 Claude 修复测试失败，它搜索 → 编辑 → 测试 → 失败 → 搜索 → 编辑另一个地方 → 测试 → 又失败……循环了 8 轮，每轮修不同的小问题，根因始终没碰。

**预防**：启动时设置轮次上限：

```bash
# 限制单次会话最多 10 轮工具调用
claude --max-turns 10 "修复 src/auth.test.ts 的测试失败"
```

同时在 prompt 里引导它先分析再动手：

```
修复 src/auth.test.ts 的测试失败。注意：
1. 先读测试文件和被测代码，分析失败根因
2. 如果连续 3 次修复后测试仍然失败，停下来输出你的分析，等我确认
3. 不要修症状，要修根因
```

---

## 三、安全翻车：密钥泄露

### 翻车 3：把密钥推到了 GitHub

让 Claude 写飞书通知脚本，它把 webhook 地址硬编码在代码里然后 `git push`。`.gitignore` 只拦了 `.env`，密钥写在 `.js` 文件里拦不住。

**反面 vs 正面对比**：

```javascript
// 错误：硬编码 webhook 地址
const FEISHU_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx";

// 正确：从环境变量读取
const FEISHU_WEBHOOK = process.env.FEISHU_WEBHOOK_URL;
if (!FEISHU_WEBHOOK) {
  console.error("缺少环境变量 FEISHU_WEBHOOK_URL");
  process.exit(1);
}
```

**CLAUDE.md 里的安全规则**，写清楚比指望 Claude 自己记得靠谱：

```yaml
## 安全规则
- 所有密钥、token、webhook URL 必须放在环境变量中，禁止硬编码
- 禁止将 .env、credentials.json 等文件加入 git
- 推送前必须检查 git diff，确认没有敏感信息
```

**推送前的检查命令**：

```bash
# 推送前检查最近的改动是否包含敏感信息
git --no-pager diff HEAD~1 | grep -iE '(api_key|secret|token|password|webhook)' && echo "WARNING: 可能包含敏感信息！" || echo "OK"
```

---

## 四、编排翻车：Subagent 批量任务

### 翻车 5：批量任务状态不一致

用 Subagent 并行处理 20 篇文章重写，部分 agent 因 API 速率限制（429 错误）失败，编排器没正确处理，导致一半旧版一半新版。

**预防方案一：进度文件**。用 JSON 记录每个子任务的状态：

```json
{
  "tasks": [
    {"file": "article-01.md", "status": "completed", "score": 85},
    {"file": "article-02.md", "status": "failed", "error": "429 rate limit", "retry_count": 0},
    {"file": "article-03.md", "status": "pending"}
  ],
  "updated_at": "2026-04-07T10:30:00Z"
}
```

**预防方案二：编排 prompt 里写清楚失败策略**：

```
执行批量文章重写。规则：
- 每批最多 3 篇，一批完成后再开始下一批
- 单篇失败：标记为 failed，继续处理下一篇，不要重试
- 整批失败（如 429）：等待 30 秒后重试一次，仍失败则中止
- 每篇完成后更新进度文件 .claude/progress.json
```

**预防方案三：分批执行**：

```bash
# 分批执行，每批 3 个，避免速率限制
for i in {1..7}; do
  claude --max-turns 15 "处理第 $i 批文章重写，参考 .claude/progress.json"
  sleep 60
done
```

---

## 五、总结：翻车防范速查表

| 翻车 | 根因 | 救急命令 | 预防配置 |
|------|------|----------|----------|
| 删错文件 | 理解不够深 | `git restore <path>` | PreToolUse Hook 拦截 `rm -rf` |
| 幽灵编辑 | 上下文溢出 | 手动修正错误文件 | `/compact` + prompt 带完整路径 |
| 密钥泄露 | 安全意识缺失 | 立即轮换密钥 + `git filter-branch` | 环境变量 + `git diff` 检查 |
| 无限循环 | 修症状不修根因 | `Esc` 打断 | `--max-turns 10` + prompt 引导分析 |
| 批量翻车 | 缺少错误处理 | 进度文件回滚 | 分批 3 篇 + JSON 进度文件 |
| 干错项目 | 工作目录搞混 | 删掉错误文件 | CLAUDE.md 写项目名 + `pwd` 确认 |

这些翻车的共同点：**不是 Claude 不行，是约束没到位**。下一篇讲怎么写好 CLAUDE.md 和 prompt，让 Claude Code 在你画的圈子里高效干活。

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 1 篇。*
