---
title: 打造你的 Claude Code 状态栏：一个 Shell 脚本的诞生
date: 2026-04-17 10:00:00
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
description: 用一个 Shell 脚本自定义 Claude Code 状态栏，实时显示模型、Git 状态、上下文用量、Token 速度等信息，附完整代码逐段解读。
cover: https://picsum.photos/seed/claude-statusline/1920/1080
---

# 打造你的 Claude Code 状态栏

用 Claude Code 开会话、写代码，一聊就是半小时一小时。但 Claude Code 默认的状态栏信息有限——模型名、上下文百分比，就这些。

如果你能实时看到当前 Git 分支有没有未提交的改动、Token 消耗速度多快、缓存命中率多少、API 等待占了多长时间……那对会话状态的感知会好很多。

Claude Code 支持自定义状态栏：写一个 Shell 脚本，放到 `~/.claude/statusline.sh`，它每 5 秒调用一次，把你的脚本输出显示在界面底部。

这篇文章分享我的完整状态栏脚本，逐段讲解实现思路。

<!-- more -->

---

## 最终效果

状态栏分两行：

```
[GLM-5.1] my-project (main) +2 ~3 📌1 | 5m 12s | +156 -23
⚡ ██████████████░░░░░░ 47% [200K] [正常] ⚡2.3k/m | 📦85% | ⏳12%
```

**第一行**：模型名 | 仓库名(分支) 暂存/修改数 Stash | 会话时长 | 代码增删行数

**第二行**：动态 emoji | RGB 渐变进度条 上下文占比 [容量] | 状态标签 | Token 速度 | 缓存命中率 | API 等待占比

---

## 安装与使用

先把脚本放到指定位置，然后改一行配置。

**第一步**：把下面的完整脚本保存到 `~/.claude/statusline.sh`，并赋予执行权限：

```bash
chmod +x ~/.claude/statusline.sh
```

**第二步**：在 `~/.claude/settings.json` 中添加 `statusLine` 配置：

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "refreshInterval": 5
  }
}
```

`refreshInterval` 是刷新间隔，单位秒，建议 5 秒。改完后重启 Claude Code 即可生效。

**依赖**：脚本用 `jq` 解析 JSON，没有的话装一下：

```bash
sudo apt install jq -y
```

---

## 完整代码逐段解读

以下是完整脚本，按功能分成 7 个部分讲解。

### 第一步：读取输入数据

```bash
input=$(cat)
```

Claude Code 会把当前会话的运行数据以 JSON 格式通过 stdin 传给你的脚本。数据包括模型名、上下文用量、Token 统计、Git 工作目录等。

### 第二步：一次提取所有字段

```bash
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
```

关键技巧：**用 `\x01`（SOH 控制字符）做分隔符**，一次 `jq` 调用提取 14 个字段。

为什么不用 tab？因为 bash 的 `read` 默认会把连续空白符合并，空字段会丢失，后续字段全部偏移。`\x01` 是不可见字符，不会出现在 JSON 值里，安全可靠。

14 个字段分别是：

| 字段 | 用途 |
|------|------|
| `model` | 显示模型名 |
| `session_id` | 缓存文件的 key |
| `session_name` | 会话名（`/rename` 设置时才显示） |
| `cwd` | Git 命令的工作目录 |
| `used` | 上下文占用百分比 |
| `ctx_size` | 上下文窗口总容量 |
| `input_tokens` / `output_tokens` | 计算 Token 消耗速度 |
| `cache_creation` / `cache_read` | 计算缓存命中率 |
| `duration_ms` / `api_duration_ms` | 会话时长、API 等待占比 |
| `lines_add` / `lines_del` | 代码增删行数 |

### 第三步：定义颜色

```bash
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
MAGENTA='\033[35m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
```

标准的 ANSI 转义码。进度条还会用到 Truecolor（24 位真彩色），后面会看到。

### 第四步：计算衍生指标

#### 缓存文件自动清理

```bash
[ $(( RANDOM % 100 )) -eq 0 ] && find /tmp -maxdepth 1 -name 'claude_statusline_*' -mtime +1 -delete 2>/dev/null
```

每次刷新有 1% 概率清理超过 24 小时的临时缓存文件。概率触发比每次都跑 `find` 开销小得多。

#### 会话时长格式化

```bash
if [ "$duration_ms" -gt 0 ]; then
    total_sec=$((duration_ms / 1000))
    hrs=$((total_sec / 3600))
    mins=$(( (total_sec % 3600) / 60 ))
    secs=$((total_sec % 60))
    if [ "$hrs" -gt 0 ]; then
        time_str="${hrs}h ${mins}m"
    else
        time_str="${mins}m ${secs}s"
    fi
else
    time_str="0m 0s"
fi
```

毫秒转可读格式，超过 1 小时省略秒数。

#### Token 消耗速度

```bash
total_tokens=$((input_tokens + output_tokens))
token_speed=0
if [ "$duration_ms" -gt 0 ]; then
    duration_sec=$((duration_ms / 1000))
    [ "$duration_sec" -gt 0 ] && token_speed=$(( total_tokens * 60 / duration_sec ))
fi
if [ "$token_speed" -ge 1000 ]; then
    speed_str="$((token_speed / 1000)).$(( (token_speed % 1000) / 100 ))k/m"
else
    speed_str="${token_speed}/m"
fi
```

每分钟消耗的 Token 数。超过 1000 显示为 `2.3k/m` 格式。

#### 缓存命中率（累加机制）

```bash
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
```

这里有个设计问题需要解释：Claude Code 传入的 `cache_read` 和 `cache_creation` 是**当前这一次 API 调用**的值，不是累计值。脚本用文件记录上一次的值，如果检测到变化（说明有新的 API 调用），就累加到总计里。这样多次刷新之间能算出整个会话的缓存命中率。

#### API 等待占比

```bash
if [ "$duration_ms" -gt 0 ]; then
    api_pct=$((api_duration_ms * 100 / duration_ms))
else
    api_pct=0
fi
```

API 等待时间占总时长的百分比。如果这个值很高（>60%），说明大部分时间都在等 API 返回，可能是网络问题或任务太重。

### 第五步：Git 信息（带缓存）

```bash
CACHE_FILE="/tmp/claude_statusline_git_${session_id}"
CACHE_TTL=5

if [ -f "$CACHE_FILE" ]; then
    cache_age=$(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0) ))
else
    cache_age=$((CACHE_TTL + 1))
fi

if [ "$cache_age" -gt "$CACHE_TTL" ]; then
    branch="" repo="" remote_url="" staged=0 modified=0 stash=0
    if [ -n "$cwd" ]; then
        branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
        repo=$(basename "$(git -C "$cwd" --no-optional-locks rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null)
        staged=$(git -C "$cwd" --no-optional-locks diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
        modified=$(git -C "$cwd" --no-optional-locks diff --numstat 2>/dev/null | wc -l | tr -d ' ')
        stash=$(git -C "$cwd" --no-optional-locks stash list 2>/dev/null | wc -l | tr -d ' ')
        remote_url=$(git -C "$cwd" --no-optional-locks remote get-url origin 2>/dev/null \
            | sed -E 's|git@([^:]+):(.+)\.git$|https://\1/\2|; s|\.git$||')
    fi
    printf '%s' "${branch}|${repo}|${remote_url}|${staged}|${modified}|${stash}" > "$CACHE_FILE" 2>/dev/null
else
    cache_line=$(cat "$CACHE_FILE" 2>/dev/null)
    branch=$(echo "$cache_line" | cut -d'|' -f1)
    repo=$(echo "$cache_line" | cut -d'|' -f2)
    remote_url=$(echo "$cache_line" | cut -d'|' -f3)
    staged=$(echo "$cache_line" | cut -d'|' -f4)
    modified=$(echo "$cache_line" | cut -d'|' -f5)
    stash=$(echo "$cache_line" | cut -d'|' -f6)
fi
```

Git 命令比较重，5 秒内复用缓存结果。用 `session_id` 做文件名后缀，不同会话互不干扰。

注意 `--no-optional-locks` 参数——状态栏脚本只是读取 Git 状态，不应该锁住索引，否则可能和正在运行的 `git add`/`git commit` 冲突。

`remote_url` 的 sed 转换把 SSH 格式（`git@github.com:user/repo.git`）转成 HTTPS 链接，用于后面的可点击链接。

### 第六步：RGB 渐变进度条

```bash
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
        if [ "$i" -lt "$filled" ); then
            bar="${bar}\033[38;2;${r};${g};${b}m█"
        else
            bar="${bar}\033[38;2;60;60;60m░"
        fi
    done
    bar="${bar}${RESET}"
```

进度条的核心是**颜色插值**：从绿色 `(0,200,80)` 经过黄色 `(220,200,0)` 到红色 `(220,40,20)`，20 个色块平滑过渡。

用 `\033[38;2;R;G;Bm` 是终端的 Truecolor 转义码——绝大多数现代终端（iTerm2、Windows Terminal、VS Code 内置终端）都支持。实心块 `█` 表示已用，空心块 `░` 表示剩余。

动态 emoji 和百分比颜色根据上下文占用分级：

| 上下文占比 | emoji | 含义 |
|-----------|-------|------|
| < 20% | 🟢 | 正常，资源充裕 |
| 20-59% | ⚡ | 工作中 |
| 60-79% | 🔥 | 偏高，建议压缩 |
| ≥ 80% | 🚨 | 危险，必须压缩 |

### 第七步：拼接输出

第一行拼模型、Git、时长、代码变更：

```bash
line1="${BOLD}[${model}]${RESET}"

# 仓库名（有远程 URL 则生成可点击链接）
if [ -n "$repo" ]; then
    if [ -n "$remote_url" ]; then
        repo_part=$(printf '\e]8;;%s\a%s\e]8;;\a' "$remote_url" "$repo")
        line1="${line1} ${BOLD}${repo_part}${RESET}"
    else
        line1="${line1} ${BOLD}${repo}${RESET}"
    fi
fi
```

可点击链接用了 **OSC 8 协议**（`\e]8;;URL\aTEXT\e]8;;\a`），在支持的终端里 Ctrl+Click 可以直接打开仓库页面。

最后用 `printf '%b\n'` 输出，`%b` 会解释转义序列：

```bash
printf '%b\n' "$line1"
printf '%b\n' "$line2"
```

---

## 小结

这个状态栏脚本把 Claude Code 运行时的关键信息浓缩到两行：

- **会话状态**：模型、时长、Git 状态、代码变更——知道"我在哪、做了什么"
- **资源感知**：上下文用量、Token 速度、缓存命中率——知道"还能撑多久"
- **性能监控**：API 等待占比——知道"慢在哪"

脚本本身不复杂，但涉及几个值得记的技巧：`jq` 批量提取避免多次进程创建、`--no-optional-locks` 避免和 Git 操作冲突、OSC 8 生成可点击链接、概率性清理控制开销。

状态栏是观察 Claude Code 运行状态的一个窗口。拿到脚本后，你可以根据自己的需求调整显示内容——比如加上 MCP 服务器状态、当前使用的 Skills 名称等。Claude Code 传入的 JSON 数据很丰富，能玩的东西很多。

---

> 系列导航：[Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/)
