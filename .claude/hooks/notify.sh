#!/bin/bash
# Claude Code 桌面通知 Hook
# 在 Stop 事件时触发，提醒用户任务完成

INPUT=$(cat)
REASON=$(echo "$INPUT" | jq -r '.reason // "unknown"')

# macOS 通知
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"Claude Code 任务结束 (原因: $REASON)\" with title \"Claude Code\"" 2>/dev/null
fi

# Linux 通知 (notify-send)
if command -v notify-send &> /dev/null; then
  notify-send "Claude Code" "任务结束 (原因: $REASON)" 2>/dev/null
fi

exit 0
