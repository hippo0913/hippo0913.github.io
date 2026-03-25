#!/bin/bash
# Claude Code 桌面通知 Hook
# 在 Stop 事件时触发，提醒用户任务完成

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
