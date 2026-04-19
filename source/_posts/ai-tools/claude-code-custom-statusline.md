---
title: 打造你的 Claude Code 状态栏：一个 Shell 脚本的诞生
date: 2026-04-17 10:00:00
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
series: claude-code-advanced
series_index: 9
description: 自定义 Claude Code 状态栏，实时显示 Git 状态、上下文用量、Token 速度、缓存命中率。完整脚本 + 逐段解读 + 踩坑记录。
cover: https://picsum.photos/seed/claude-statusline/1920/1080
---

# 打造你的 Claude Code 状态栏

用 Claude Code 开长会话，最怕两件事：一是上下文悄悄满了被自动压缩，丢了关键上下文；二是 Git 有未提交改动但忘了，Claude 直接基于脏状态干活。

默认状态栏只显示模型名和上下文百分比。看不到 Git 状态、看不到 Token 烧了多少、看不到缓存命中率——这些信息对长会话来说都是刚需。

Claude Code 支持自定义状态栏：写一个脚本，放到指定位置，它每 5 秒刷新一次。这篇文章分享我的完整实现，包括踩过的坑和关键设计决策。

<!-- more -->

---

## 最终效果

两行，信息密度拉满：

```
[GLM-5.1] my-project (main) +2 ~3 ?1 📌1 | 5m 12s | +156 -23
⚡ ██████████████░░░░░░ 47% [200K] [正常] ⚡2.3k/m | 📦85% | ⏳12%
```

| 行 | 内容 | 解决什么问题 |
|---|------|------------|
| 第一行 | 模型 · 仓库(分支) 暂存/修改/未跟踪 Stash · 时长 · diff 增删行数 | "我在哪、做了什么" |
| 第二行 | emoji · RGB 进度条 占比[容量] · 状态 · Token 速度 · 缓存命中 · API 等待 | "还能撑多久、慢在哪" |

---

## 安装

**第一步**：保存脚本到 `~/.claude/statusline.sh`，赋执行权限：

```bash
chmod +x ~/.claude/statusline.sh
```

**第二步**：在 `~/.claude/settings.json` 加一行配置：

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "refreshInterval": 5
  }
}
```

改完重启 Claude Code 生效。脚本依赖 `jq`（解析 JSON），没有的话 `sudo apt install jq -y`。

---

## 完整脚本

```bash
#!/bin/bash
# Claude Code 状态栏脚本
# 依赖：jq

# --- 读取 JSON，一次提取全部字段 ---
# 用 SOH(\x01) 做分隔符，不用 tab（bash read 会合并连续空白导致空字段丢失）
input=$(cat)
IFS=$'\001' read -r model session_id session_name cwd used ctx_size \
    input_tokens output_tokens cache_creation cache_read \
    duration_ms api_duration_ms lines_add lines_del <<< \
    "$(echo "$input" | jq -j '[
        .model.display_name // "未知",
        .session_id // "default",
        .session_name // "",
        .workspace.current_dir // .cwd // "",
        .context_window.used_percentage // "",
        .context_window.context_window_size // 0,
        .context_window.total_input_tokens // 0,
        .context_window.total_output_tokens // 0,
        .context_window.current_usage.cache_creation_input_tokens // 0,
        .context_window.current_usage.cache_read_input_tokens // 0,
        .cost.total_duration_ms // 0,
        .cost.total_api_duration_ms // 0,
        .cost.total_lines_added // 0,
        .cost.total_lines_removed // 0
    ] | join("\u0001")')"

# --- 颜色定义 ---
CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'
MAGENTA='\033[35m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

# --- 缓存文件自动清理（1% 概率触发，避免每次 find） ---
[ $(( RANDOM % 100 )) -eq 0 ] && find /tmp -maxdepth 1 -name 'claude_statusline_*' -mtime +1 -delete 2>/dev/null

# --- 会话时长 ---
if [ "$duration_ms" -gt 0 ]; then
    total_sec=$((duration_ms / 1000))
    hrs=$((total_sec / 3600)); mins=$(( (total_sec % 3600) / 60 )); secs=$((total_sec % 60))
    [ "$hrs" -gt 0 ] && time_str="${hrs}h ${mins}m" || time_str="${mins}m ${secs}s"
else
    time_str="0m 0s"
fi

# --- Token 速度 ---
total_tokens=$((input_tokens + output_tokens))
token_speed=0
[ "$duration_ms" -gt 0 ] && duration_sec=$((duration_ms / 1000))
[ "${duration_sec:-0}" -gt 0 ] && token_speed=$(( total_tokens * 60 / duration_sec ))
if [ "$token_speed" -ge 1000 ]; then
    speed_str="$((token_speed / 1000)).$(( (token_speed % 1000) / 100 ))k/m"
else
    speed_str="${token_speed}/m"
fi

# --- 缓存命中率（累加机制，跨整个会话） ---
CACHE_ACC_FILE="/tmp/claude_statusline_cache_${session_id}"
if [ -f "$CACHE_ACC_FILE" ]; then
    IFS='|' read -r acc_read acc_creation last_read last_creation < "$CACHE_ACC_FILE"
else
    acc_read=0; acc_creation=0; last_read=0; last_creation=0
fi
if [ "$cache_read" != "$last_read" ] || [ "$cache_creation" != "$last_creation" ]; then
    acc_read=$((acc_read + cache_read))
    acc_creation=$((acc_creation + cache_creation))
    printf '%s|%s|%s|%s' "$acc_read" "$acc_read" "$cache_read" "$cache_creation" > "$CACHE_ACC_FILE"
fi
cache_total=$((acc_read + acc_creation))
[ "$cache_total" -gt 0 ] && cache_hit=$((acc_read * 100 / cache_total)) || cache_hit=-1

# --- API 等待占比 ---
[ "$duration_ms" -gt 0 ] && api_pct=$((api_duration_ms * 100 / duration_ms)) || api_pct=0

# --- 上下文容量标签 ---
if [ "$ctx_size" -ge 1000000 ]; then ctx_label="1M"
elif [ "$ctx_size" -ge 1000 ]; then ctx_label="$((ctx_size / 1000))K"
else ctx_label=""; fi

# --- Git 信息（5 秒缓存） ---
CACHE_FILE="/tmp/claude_statusline_git_${session_id}"
CACHE_TTL=5
if [ -f "$CACHE_FILE" ]; then
    cache_age=$(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0) ))
else
    cache_age=$((CACHE_TTL + 1))
fi
if [ "$cache_age" -gt "$CACHE_TTL" ]; then
    branch="" repo="" remote_url="" staged=0 modified=0 stash=0 diff_add=0 diff_del=0 untracked=0
    if [ -n "$cwd" ]; then
        branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
        repo=$(basename "$(git -C "$cwd" --no-optional-locks rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null)
        staged=$(git -C "$cwd" --no-optional-locks diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
        modified=$(git -C "$cwd" --no-optional-locks diff --numstat 2>/dev/null | wc -l | tr -d ' ')
        stash=$(git -C "$cwd" --no-optional-locks stash list 2>/dev/null | wc -l | tr -d ' ')
        untracked=$(git -C "$cwd" --no-optional-locks ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
        remote_url=$(git -C "$cwd" --no-optional-locks remote get-url origin 2>/dev/null \
            | sed -E 's|git@([^:]+):(.+)\.git$|https://\1/\2|; s|\.git$||')
        # git diff 累计增删行数（暂存 + 未暂存）
        diff_add=$( ( git -C "$cwd" --no-optional-locks diff --cached --numstat 2>/dev/null; git -C "$cwd" --no-optional-locks diff --numstat 2>/dev/null ) | awk '{s+=$1} END {print s+0}')
        diff_del=$( ( git -C "$cwd" --no-optional-locks diff --cached --numstat 2>/dev/null; git -C "$cwd" --no-optional-locks diff --numstat 2>/dev/null ) | awk '{s+=$2} END {print s+0}')
    fi
    printf '%s' "${branch}|${repo}|${remote_url}|${staged}|${modified}|${stash}|${diff_add}|${diff_del}|${untracked}" > "$CACHE_FILE" 2>/dev/null
else
    cache_line=$(cat "$CACHE_FILE" 2>/dev/null)
    branch=$(echo "$cache_line" | cut -d'|' -f1)
    repo=$(echo "$cache_line" | cut -d'|' -f2)
    remote_url=$(echo "$cache_line" | cut -d'|' -f3)
    staged=$(echo "$cache_line" | cut -d'|' -f4)
    modified=$(echo "$cache_line" | cut -d'|' -f5)
    stash=$(echo "$cache_line" | cut -d'|' -f6)
    diff_add=$(echo "$cache_line" | cut -d'|' -f7)
    diff_del=$(echo "$cache_line" | cut -d'|' -f8)
    untracked=$(echo "$cache_line" | cut -d'|' -f9)
fi

# --- 第一行：模型 + Git + 时长 + 代码变更 ---
line1="${BOLD}[${model}]${RESET}"
if [ -n "$repo" ]; then
    if [ -n "$remote_url" ]; then
        repo_part=$(printf '\e]8;;%s\a%s\e]8;;\a' "$remote_url" "$repo")
        line1="${line1} ${BOLD}${repo_part}${RESET}"
    else
        line1="${line1} ${BOLD}${repo}${RESET}"
    fi
fi
[ -n "$branch" ] && line1="${line1} ${CYAN}(${branch})${RESET}"
git_status=""
[ "${staged:-0}" -gt 0 ] && git_status="${GREEN}+${staged}${RESET}"
[ "${modified:-0}" -gt 0 ] && git_status="${git_status}${git_status:+ }${YELLOW}~${modified}${RESET}"
[ "${untracked:-0}" -gt 0 ] && git_status="${git_status}${git_status:+ }${MAGENTA}?${untracked}${RESET}"
[ -n "$git_status" ] && line1="${line1} ${git_status}"
[ "${stash:-0}" -gt 0 ] && line1="${line1} ${YELLOW}📌${stash}${RESET}"
line1="${line1} ${DIM}|${RESET}"
[ -n "$session_name" ] && line1="${line1} ${MAGENTA}${session_name}${RESET} ${DIM}|${RESET}"
line1="${line1} ${time_str} ${DIM}|${RESET}"
line1="${line1} ${GREEN}+${diff_add}${RESET} ${RED}-${diff_del}${RESET}"

# --- 第二行：进度条 + 指标 + 警告 ---
BAR_WIDTH=20
if [ -n "$used" ]; then
    used_int=$(printf '%.0f' "$used")
    filled=$(( (used_int * BAR_WIDTH + 50) / 100 ))
    bar=""
    for (( i=0; i<BAR_WIDTH; i++ )); do
        pos=$(( i * 100 / (BAR_WIDTH - 1) ))
        if [ "$pos" -le 50 ]; then
            r=$(( 220 * pos / 50 )); g=200; b=$(( 80 - 80 * pos / 50 ))
        else
            adj=$(( pos - 50 )); r=220; g=$(( 200 - 160 * adj / 50 )); b=$(( 20 * adj / 50 ))
        fi
        if [ "$i" -lt "$filled" ]; then
            bar="${bar}\033[38;2;${r};${g};${b}m█"
        else
            bar="${bar}\033[38;2;60;60;60m░"
        fi
    done
    bar="${bar}${RESET}"

    if [ "$used_int" -ge 84 ]; then emoji="🚨"
    elif [ "$used_int" -ge 60 ]; then emoji="🔥"
    elif [ "$used_int" -ge 20 ]; then emoji="⚡"
    else emoji="🟢"; fi

    if [ "$used_int" -ge 84 ]; then pct_color="$RED"
    elif [ "$used_int" -ge 60 ]; then pct_color="$YELLOW"
    else pct_color="$GREEN"; fi

    [ -n "$ctx_label" ] && size_part=" ${DIM}[${ctx_label}]${RESET}" || size_part=""
    [ "$token_speed" -gt 0 ] && speed_part=" ${DIM}|${RESET} ⚡${speed_str}" || speed_part=""

    if [ "$cache_hit" -ge 0 ]; then
        if [ "$cache_hit" -ge 80 ]; then cache_color="$GREEN"
        elif [ "$cache_hit" -ge 50 ]; then cache_color="$YELLOW"
        else cache_color="$RED"; fi
        cache_part=" ${DIM}|${RESET} 📦${cache_color}${cache_hit}%${RESET}"
    else cache_part=""; fi

    if [ "$api_pct" -ge 60 ]; then api_part=" ${DIM}|${RESET} ⏳${RED}${api_pct}%${RESET}"
    elif [ "$api_pct" -ge 30 ]; then api_part=" ${DIM}|${RESET} ⏳${YELLOW}${api_pct}%${RESET}"
    else api_part=" ${DIM}|${RESET} ⏳${GREEN}${api_pct}%${RESET}"; fi

    if [ "$used_int" -ge 84 ]; then
        warn="${RED}[危险 → 立即 /compact 保留当前任务进度和关键决策]${RESET}"
    elif [ "$used_int" -ge 75 ]; then
        warn="${YELLOW}[较高 → /compact 保留当前任务进度和关键决策]${RESET}"
    elif [ "$used_int" -ge 60 ]; then
        warn="${YELLOW}[偏高 → /compact 保留当前任务进度和关键决策]${RESET}"
    else
        warn="${GREEN}[正常]${RESET}"
    fi

    line2="${emoji} ${bar} ${pct_color}${used_int}%${RESET}${size_part} ${warn}${speed_part}${cache_part}${api_part}"
else
    line2="🟢 \033[38;2;60;60;60m░░░░░░░░░░░░░░░░░░░░${RESET} --% ${GREEN}[正常]${RESET}"
fi

printf '%b\n' "$line1"
printf '%b\n' "$line2"
```

---

## 设计决策与踩坑

### jq 调用：15 次变 1 次

最初我用 15 个 `jq -r` 逐个提取字段——每 5 秒刷新一次就要启动 15 个进程，在状态栏这种高频调用的场景下延迟很明显。

改用 `join("\u0001")` 一次提取所有字段，用 SOH（`\x01`）做分隔符。为什么不用 tab？bash 的 `read` 默认把连续空白符合并，遇到空字段会丢，后面的变量全部偏移。`\x01` 是不可见控制字符，不会出现在 JSON 值里。

### Git 锁冲突：`--no-optional-locks`

这个参数是我踩了坑才加的。没有它的时候，状态栏每 5 秒跑一次 `git diff`，恰好在 `git add` 或 `git commit` 的瞬间触发，两个进程抢锁，导致 Claude Code 的 git 操作偶尔报错 "index.lock file exists"。

`--no-optional-locks` 告诉 git："我只是看看，不写任何东西，别锁索引。"状态栏本来就只读，加上这个参数后冲突再没出现过。

### 缓存命中率：不是你看到的那样

Claude Code 传入的 `cache_read_input_tokens` 和 `cache_creation_input_tokens` 是**当前一次 API 调用**的数据，不是会话累计值。如果直接用当次数据算命中率，每 5 秒刷新一次，结果会跳动得毫无参考价值。

我的方案：用临时文件记录上一次的值，检测到变化（说明有新的 API 调用）就累加，这样算出的是整个会话的累计命中率。

### 可点击链接：OSC 8 协议

仓库名能 Ctrl+Click 直接跳转到 GitHub，用的是终端的 OSC 8 超链接协议：

```bash
printf '\e]8;;https://github.com/user/repo\auser/repo\e]8;;\a'
```

格式是 `\e]8;;URL\aTEXT\e]8;;\a`。iTerm2、Windows Terminal、VS Code 内置终端都支持。如果终端不支持，就只显示文字、没有链接，不影响正常使用。

### 临时文件清理

Git 缓存和缓存命中率累加都往 `/tmp` 写文件，时间一长会堆积。每次刷新都跑 `find /tmp -delete` 不划算，所以用概率触发：`RANDOM % 100` 只有 1% 的概率执行清理，开销几乎为零，但长时间跑下来临时文件不会无限增长。

---

## 小结

| 信息 | 作用 | 信号 |
|------|------|------|
| Git 暂存/修改/未跟踪/Stash | 工作区状态 | 有未提交改动或新文件时注意 |
| 上下文进度条 | 资源余量 | >60% 建议 compact，>84% 必须 compact |
| Token 速度 | 消耗速率 | 突然飙升可能是在做重复操作 |
| 缓存命中率 | 提示词缓存效率 | <50% 说明缓存没命中，成本偏高 |
| API 等待占比 | 性能瓶颈 | >60% 说明大部分时间在等 API |

拿到脚本后可以按自己需求改——比如加上 MCP 服务器状态、当前 Skill 名称。Claude Code 传入的 JSON 数据很丰富，`echo "$input" | jq .` 看一眼就知道有哪些字段可用。

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 9 篇。*
