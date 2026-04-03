---
title: Claude Code Hooks 实战：任务完成自动通知
date: 2026-03-25 15:30:00
updated: 2026-03-25 15:30:00
tags: [Claude Code, 实战案例]
categories:
  - AI 工具系列
series: claude-code
description: 用 Claude Code Hooks 实现任务完成后的桌面通知和飞书通知，包含完整的配置代码和踩坑经验。
cover: https://picsum.photos/seed/claude-hooks-practice/1920/1080
---

# Claude Code Hooks 实战：任务完成自动通知

> 💬 hippo：这是我在配置 Claude Code Hooks 过程中的真实记录。从"能用"到"好用"，踩了不少坑，希望对你有帮助。

---

## 一、为什么需要这个功能？

你有没有这样的场景：

- 让 Claude Code 跑一个耗时任务（比如重写 28 篇博客文章）
- 然后你就去摸鱼了...
- 回来发现任务早就完成了，但你不知道

**如果能自动通知我，该多好？**

这就是 Hooks 的用武之地。

<!-- more -->

---

## 二、最终效果

### 桌面通知

![桌面通知效果](通知截图)

显示任务内容摘要和工具调用次数。

### 飞书通知

![飞书通知效果](飞书卡片截图)

卡片格式，包含：
- 完成时间
- 工具调用次数
- 任务内容摘要

---

## 三、实现步骤

### 3.1 创建通知脚本

**桌面通知脚本** `.claude/hooks/notify.sh`：

```bash
#!/bin/bash
# Claude Code 桌面通知 Hook

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# 从 transcript 中提取最后一条用户消息
get_last_user_message() {
  if [ -f "$TRANSCRIPT_PATH" ]; then
    grep '"type":"user"' "$TRANSCRIPT_PATH" 2>/dev/null | \
      jq -c 'select(.message.content[0].tool_use_id == null) | select(.message.content[0].text | test("^<ide|system-reminder") | not)' 2>/dev/null | \
      tail -1 | \
      jq -r '.message.content[0].text' 2>/dev/null | \
      cut -c1-80
  fi
}

# 统计工具使用次数
get_tool_count() {
  if [ -f "$TRANSCRIPT_PATH" ]; then
    grep -c '"type":"tool_use"' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

LAST_MESSAGE=$(get_last_user_message)
if [ -z "$LAST_MESSAGE" ] || [ "$LAST_MESSAGE" = "null" ]; then
  LAST_MESSAGE="任务完成"
fi

TOOL_COUNT=$(get_tool_count)

# macOS 通知
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"$LAST_MESSAGE\n工具调用: $TOOL_COUNT 次\" with title \"✅ Claude Code 完成\"" 2>/dev/null
fi

# Linux 通知 (notify-send)
if command -v notify-send &> /dev/null; then
  notify-send "✅ Claude Code 完成" "$LAST_MESSAGE\n工具调用: $TOOL_COUNT 次" 2>/dev/null
fi

exit 0
```

**飞书通知脚本** `.claude/hooks/feishu-notify.sh`：

```bash
#!/bin/bash
# Claude Code 飞书通知 Hook

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# 提取用户消息（同上，略）
# ...

WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/你的webhook地址"

curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "msg_type": "interactive",
    "card": {
      "config": {
        "wide_screen_mode": true
      },
      "header": {
        "title": {
          "tag": "plain_text",
          "content": "✅ Claude Code 任务完成"
        },
        "template": "green"
      },
      "elements": [
        {
          "tag": "div",
          "fields": [
            {
              "is_short": true,
              "text": {
                "tag": "lark_md",
                "content": "**时间**\n'"$TIMESTAMP"'"
              }
            },
            {
              "is_short": true,
              "text": {
                "tag": "lark_md",
                "content": "**工具调用**\n'"$TOOL_COUNT"' 次"
              }
            }
          ]
        },
        {
          "tag": "div",
          "text": {
            "tag": "lark_md",
            "content": "**任务内容**\n'"$LAST_MESSAGE"'"
          }
        }
      ]
    }
  }' > /dev/null 2>&1

exit 0
```

### 3.2 配置 Hook

在 `.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/feishu-notify.sh"
          }
        ]
      }
    ]
  }
}
```

### 3.3 获取飞书 Webhook 地址

1. 在飞书群组中，点击右上角「设置」→「群机器人」
2. 点击「添加机器人」→ 选择「自定义机器人」
3. 复制 Webhook 地址

---

## 四、踩坑记录

### 坑 1：Stop vs SessionEnd

一开始我用了 `SessionEnd`，结果：
- 通知只在会话结束时触发（退出、/clear）
- 而不是每次任务完成时触发

**正确做法**：用 `Stop` 事件，它会在 Claude 完成响应时触发。

| 事件 | 触发时机 | 用途 |
|------|---------|------|
| `Stop` | Claude 完成响应 | ✅ 任务完成通知 |
| `SessionEnd` | 会话结束 | 清理任务（超时只有 1.5s）|

### 坑 2：Stop 事件没有 reason 字段

官方文档里 `SessionEnd` 有 `reason` 字段，但 `Stop` 没有。

我一开始试图从 `Stop` 事件读取 `reason`，结果一直是 `unknown`。

**正确做法**：`Stop` 事件的输入格式是：

```json
{
  "event": "Stop",
  "session_id": "xxx",
  "transcript_path": "/path/to/transcript.jsonl",
  "stop_hook_active": false
}
```

要从 `transcript_path` 提取任务内容，而不是读取 `reason`。

### 坑 3：transcript 里的用户消息不只是用户输入

transcript 文件里 `type: "user"` 的记录包括：
- 真正的用户输入
- 工具返回结果（`tool_result`）
- IDE 自动消息（如 `<ide_opened_file>`）

**正确做法**：过滤掉非真实用户输入：

```bash
grep '"type":"user"' "$TRANSCRIPT_PATH" | \
  jq -c 'select(.message.content[0].tool_use_id == null) | select(.message.content[0].text | test("^<ide|system-reminder") | not)'
```

### 坑 4：飞书消息格式

飞书机器人支持两种消息格式：
- `text`：纯文本，简单但丑
- `interactive`：卡片格式，好看但结构复杂

我一开始的卡片格式写错了，消息发不出去。后来发现 `elements` 里的 `fields` 需要用数组格式。

**正确格式**：

```json
{
  "msg_type": "interactive",
  "card": {
    "header": { ... },
    "elements": [
      {
        "tag": "div",
        "fields": [
          { "is_short": true, "text": { "tag": "lark_md", "content": "..." } }
        ]
      }
    ]
  }
}
```

### 坑 5：Hook 配置修改后需要重启会话

这是官方的安全机制：
- 会话启动时捕获 Hook 配置快照
- 期间使用快照版本
- 外部修改不会立即生效

**正确做法**：修改 Hook 配置后，重启会话或运行 `/hooks` 确认。

---

## 五、调试技巧

### 手动测试脚本

```bash
# 模拟 Stop 事件输入
echo '{"event": "Stop", "transcript_path": "/path/to/transcript.jsonl"}' | \
  bash .claude/hooks/notify.sh
```

### 检查飞书 Webhook

```bash
curl -X POST "https://open.feishu.cn/open-apis/bot/v2/hook/你的地址" \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"text","content":{"text":"测试消息"}}'
```

返回 `{"StatusCode":0}` 表示成功。

---

## 六、总结

通过这次实战，我深刻体会到：

1. **Hooks 是强制的**：写在 CLAUDE.md 里的规则 Claude 可能"忘记"，但 Hook 是 100% 执行的
2. **官方文档要精读**：Stop 和 SessionEnd 的区别、输入格式，都在文档里写得清清楚楚
3. **调试要耐心**：transcript 格式复杂，需要逐步验证每一步的输出

---

## 相关文章

- [精读官方文档：Hooks 参考](/2026/03/27/ai-tools/official-docs/hooks/) - 完整的 Hooks 官方文档精读
- [Claude Code 最佳实践](/2026/03/12/ai-tools/claude-code-best-practice/) - 我的原创实践经验

---

*最后更新：2026-03-25*
