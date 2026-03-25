#!/bin/bash
# Claude Code 飞书通知 Hook
# 在 Stop 事件时触发，发送任务详情到飞书群

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# 从 transcript 中提取最后一条真正的用户消息
get_last_user_message() {
  if [ -f "$TRANSCRIPT_PATH" ]; then
    grep '"type":"user"' "$TRANSCRIPT_PATH" 2>/dev/null | \
      jq -c 'select(.message.content[0].tool_use_id == null) | select(.message.content[0].text | test("^<ide|system-reminder") | not)' 2>/dev/null | \
      tail -1 | \
      jq -r '.message.content[0].text' 2>/dev/null | \
      cut -c1-150
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
  LAST_MESSAGE="（会话内容）"
fi

TOOL_COUNT=$(get_tool_count)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/ac24e858-eecf-41b1-bbed-0fdce9029fad"

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
