#!/bin/bash
# PostToolUse Hook: 截图验证
# stdin 接收完整的工具调用 JSON

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_FILE="$PROJECT_DIR/.claude-output/logs/screenshot-hook.log"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 记录日志
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Hook 触发 ==="
log "PROJECT_DIR: $PROJECT_DIR"

# 读取 stdin（PostToolUse 会传入完整的工具调用 JSON）
INPUT=$(cat)
log "stdin 长度: ${#INPUT}"
log "stdin 前 500 字符: ${INPUT:0:500}"

# 尝试多种方式提取 file_path
FILE_PATH=""

# 方式 1: 从 tool_input.file_path 提取
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
log "方式1 (tool_input.file_path): $FILE_PATH"

# 方式 2: 如果结果为空，尝试从 tool_result 提取
if [ -z "$FILE_PATH" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_result.file_path // empty' 2>/dev/null)
  log "方式2 (tool_result.file_path): $FILE_PATH"
fi

# 方式 3: 尝试从路径字段提取
if [ -z "$FILE_PATH" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.path // empty' 2>/dev/null)
  log "方式3 (.path): $FILE_PATH"
fi

# 方式 4: 直接在整个 JSON 中搜索 file_path
if [ -z "$FILE_PATH" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.. | objects | select(has("file_path")) | .file_path' 2>/dev/null | head -1)
  log "方式4 (递归搜索): $FILE_PATH"
fi

log "最终 FILE_PATH: $FILE_PATH"

# 检查是否需要截图
if [ -z "$FILE_PATH" ]; then
  log "未找到文件路径，跳过"
  exit 0
fi

# 匹配 source/_posts/ 或 _config*.yml
case "$FILE_PATH" in
  *source/_posts/*|*_config*.yml)
    log "匹配成功，执行截图"
    echo "📸 正在生成文章预览截图..."
    # 直接运行，让 node 的 stdout 直接输出到会话
    node "$PROJECT_DIR/.claude/hooks/screenshot-verify.js" "$FILE_PATH" 2>&1
    ;;
  *)
    log "文件路径不匹配，跳过"
    ;;
esac
