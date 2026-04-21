---
title: 用 Hooks 保卫你的 Claude Code 工作流
date: 2026-04-21 10:00:00
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
series: claude-code-advanced
series_index: 10
description: 四个真实的 Claude Code Hooks 案例：Agent 滥用拦截、C++ 自动格式化、博客截图验证、hexo 构建检查。每个都有踩坑背景和完整代码。
cover: https://picsum.photos/seed/claude-hooks-guard/1920/1080
---

# 用 Hooks 保卫你的 Claude Code 工作流

Claude Code 的 Hooks 机制让你可以在工具调用的前后插入自定义逻辑。之前的文章讲过用 Stop Hook 做任务完成通知，这次讲四个更实用的场景：**拦截不合理的 Agent 调用、自动格式化代码、修改文章后自动截图验证、提交前检查构建**。

它们的共同点：都是踩了坑才加的。

<!-- more -->

---

## Hooks 机制速览

Hooks 在 `~/.claude/settings.json` 的 `hooks` 字段配置，支持三个触发时机：

| 时机 | 触发点 | 典型用途 |
|------|--------|---------|
| `PreToolUse` | 工具调用前 | 拦截、校验、预处理 |
| `PostToolUse` | 工具调用后 | 格式化、通知、验证 |
| `Stop` | 会话结束时 | 通知、收尾 |

每个 hook 是一个脚本，通过 stdin 接收 JSON 格式的工具调用信息，退出码 0 放行、2 拦截。

---

## 案例 1：拦截 Agent 滥用

**踩坑场景**：Claude Code 有时会用 Agent 子调用去做本来一个 Read 就能搞定的事——"帮我读一下那个文件"。一次 Agent 调用要启动新进程、加载上下文，耗时好几秒，而直接 Read 只要 0.1 秒。更糟的是 Explore agent，每次调用都要做大量代码搜索，对简单查找来说是杀鸡用牛刀。

**Hook 脚本** `~/.claude/hooks/pre_tool_use_agent_guard.py`：

```python
#!/usr/bin/env python3
"""
PreToolUse hook: 拦截 Agent 工具被用于本地工具可直接完成的简单操作。
"""

import json
import sys

hook_input = json.load(sys.stdin)
tool = hook_input.get("tool_name", "")

if tool != "Agent":
    sys.exit(0)

tool_input = hook_input.get("tool_input", {})
prompt = tool_input.get("prompt", "").lower()
subagent_type = tool_input.get("subagent_type", "")

# Explore agent 一律拦截：本地代码探索用 Glob/Grep/Read 直接完成
if subagent_type == "Explore":
    print(json.dumps({
        "decision": "block",
        "reason": (
            "Explore agent 被拦截：本地代码探索应直接使用 Glob/Grep/Read 工具，"
            "禁止通过子 Agent 中转（CLAUDE.md 规则）。"
        )
    }))
    sys.exit(2)

# 简单操作关键词（命中则拦截）
SIMPLE_PATTERNS = [
    "read the following", "read file", "return full content",
    "get the content", "fetch the file", "list files",
    "search for", "find files", "grep for",
    "读取以下", "读取文件", "列出文件",
    "搜索", "查找文件", "返回完整内容",
]

# 复杂操作关键词（命中则跳过拦截）
COMPLEX_PATTERNS = [
    "分析", "对比", "理解", "设计", "实现", "评估",
    "规划", "梳理", "报告",
    "analyze", "compare", "design", "implement", "evaluate", "report",
]

complex_matched = [p for p in COMPLEX_PATTERNS if p in prompt]
matched = [p for p in SIMPLE_PATTERNS if p in prompt]

if matched and not complex_matched:
    print(json.dumps({
        "decision": "block",
        "reason": (
            f"Agent 被拦截：匹配关键词「{matched[0]}」，"
            f"请直接用 Read/Glob/Grep 完成。"
        )
    }))
    sys.exit(2)

sys.exit(0)
```

**设计要点**：

- **Explore agent 一律拦截** — 简单粗暴但有效，本地代码探索不需要子进程
- **白名单机制** — "读取文件并分析架构"这种复杂任务命中 `分析` 关键词，不会被误拦
- **中英双语关键词** — 日常用中文下指令也不会漏

**配置**：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Agent",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/pre_tool_use_agent_guard.py"
          }
        ]
      }
    ]
  }
}
```

`matcher: "Agent"` 让这个 hook 只在调用 Agent 工具时触发，不影响其他工具。

---

## 案例 2：C++ 文件自动格式化

**踩坑场景**：让 Claude Code 写 C++ 代码，它生成的代码风格和项目不一致。每次都要手动跑 clang-format，或者提醒它"写完后格式化"。加个 PostToolUse hook，写完自动格式化，彻底不用管。

**Hook 脚本** `~/.claude/hooks/clang-format.sh`：

```bash
#!/bin/bash
# PostToolUse hook: C++ 文件修改后自动运行 clang-format

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# 没拿到路径就退出
[ -z "$FILE_PATH" ] && exit 0

# 只处理 C++ 文件
case "$FILE_PATH" in
    *.cpp|*.cc|*.cxx|*.c|*.h|*.hpp|*.hh)
        [ ! -f "$FILE_PATH" ] && exit 0
        clang-format -i "$FILE_PATH" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo '{"message": "已自动格式化：'"$FILE_PATH"'"}'
        fi
        ;;
esac

exit 0
```

**设计要点**：

- **通过环境变量 `CLAUDE_TOOL_INPUT` 获取工具输入** — PostToolUse 的文件路径在这里，不需要读 stdin
- **`clang-format -i` 直接原地修改** — 格式化结果静默生效，不阻塞工作流
- **格式化失败静默退出** — 不会因为 `.clang-format` 配置缺失而阻断正常操作

---

## 案例 3：博客文章截图验证

**踩坑场景**：让 Claude Code 修改博客文章，改完 push 上线才发现排版炸了——代码块溢出、图片没加载、表格太宽。如果能每次修改后自动截图看一眼，就能在推送前发现问题。

**Hook 脚本** `项目/.claude/hooks/screenshot-hook.sh`：

```bash
#!/bin/bash
# PostToolUse Hook: 文章/配置修改后自动截图验证

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
INPUT=$(cat)

# 提取 file_path（多种 fallback 方式）
FILE_PATH=""
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$FILE_PATH" ] && FILE_PATH=$(echo "$INPUT" | jq -r '.. | objects | select(has("file_path")) | .file_path' 2>/dev/null | head -1)

[ -z "$FILE_PATH" ] && exit 0

# 只匹配博客文章和配置文件
case "$FILE_PATH" in
  *source/_posts/*|*_config*.yml)
    echo "📸 正在生成预览截图..."
    node "$PROJECT_DIR/.claude/hooks/screenshot-verify.js" "$FILE_PATH" 2>&1
    ;;
esac
```

`screenshot-verify.js` 用 puppeteer 截图，自动检测并启动 hexo server。这个脚本比较长，核心流程：

1. 检查 `hexo server` 是否在运行（`curl localhost:4000`）
2. 没运行则 `hexo clean && hexo server` 启动
3. puppeteer 打开对应文章页面，全页截图
4. 截图保存到 `.claude-output/screenshots/`，路径输出到会话

**设计要点**：

- **路径匹配过滤** — 只对 `source/_posts/*` 和 `_config*.yml` 触发，改别的文件不会截图
- **hexo server 自动管理** — 没运行就启动，不重复启动
- **`.claude-output/` 加入 .gitignore** — 截图是临时验证产物，不入版本控制

---

## 案例 4：提交前 hexo 构建检查

**踩坑场景**：文章 Front Matter 的 YAML 格式写错了一个缩进，push 上去才发现 GitHub Actions 构建失败。加个 PreToolUse hook，`git commit` 前先跑一遍 `hexo generate`，构建不过就不让提交。

**Hook 脚本**：

```bash
#!/bin/bash
# PreToolUse hook: git commit 前检查 hexo 构建

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""' 2>/dev/null)

# 只拦截 git commit
echo "$COMMAND" | grep -q 'git commit' || exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# 跑 hexo generate 检查构建
cd "$PROJECT_DIR"
hexo generate > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo '{"decision": "block", "reason": "hexo generate 失败，请检查文章格式后再提交。"}'
    exit 2
fi

exit 0
```

**设计要点**：

- **只拦截 `git commit`** — `git add`、`git status` 等不受影响
- **构建失败直接 block** — 退出码 2 阻止提交，消息显示在会话里
- **hexo generate 输出静默** — 成功时不输出任何东西，不打扰正常流程

---

## 四个 Hook 的配置汇总

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Agent",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/pre_tool_use_agent_guard.py"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/pre-tool-use-bash-guard.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash 项目路径/.claude/hooks/screenshot-hook.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/clang-format.sh"
          }
        ]
      }
    ]
  }
}
```

| Hook | 时机 | matcher | 作用 |
|------|------|---------|------|
| Agent 拦截 | PreToolUse | `Agent` | 防止用 Agent 做本地工具能完成的事 |
| hexo 构建检查 | PreToolUse | `Bash` | `git commit` 前验证构建 |
| 截图验证 | PostToolUse | `Write\|Edit` | 文章修改后自动截图 |
| clang-format | PostToolUse | `Write\|Edit` | C++ 文件自动格式化 |

---

## 小结

Hooks 的核心价值：**把踩过的坑变成自动化的防线**。每个 hook 都对应一个真实的问题——Agent 滥用浪费时间、代码风格不一致、文章排版炸了、构建失败才发现。与其每次手动检查，不如让脚本自动做。

写 hook 时注意三点：

- **拦截要精确** — `matcher` 和路径匹配越精确，误拦越少
- **失败要静默** — hook 报错不应该阻断正常工作流（除非那就是它的目的）
- **反馈要清晰** — block 时告诉用户为什么拦、该怎么做

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 10 篇。*
