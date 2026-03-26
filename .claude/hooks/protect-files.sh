#!/bin/bash
# 文件保护：阻止修改敏感文件
# exit 0 = 放行，exit 2 = 阻断

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.path // .tool_input.file_path // empty')

# 如果没有文件路径，直接放行
[ -z "$FILE" ] && exit 0

# 获取文件名（用于匹配）
BASENAME=$(basename "$FILE")

# 受保护的文件列表
# 每行格式：glob模式|说明
PROTECTED_LIST="
.env|环境变量文件
.env.local|本地环境变量
.env.*|环境变量文件
*.pem|SSL证书
*.key|私钥文件
id_rsa|SSH私钥
id_ed25519|SSH私钥
id_*.pub|SSH公钥
package-lock.json|NPM锁文件
yarn.lock|Yarn锁文件
pnpm-lock.yaml|PNPM锁文件
.claude/settings.json|Claude配置
.claude/settings.local.json|Claude本地配置
*.sqlite|SQLite数据库
*.db|数据库文件
"

# 检查文件路径或文件名是否匹配任一模式
while IFS='|' read -r pattern desc; do
  [ -z "$pattern" ] && continue

  # 使用 case 进行 glob 匹配（对路径）
  case "$FILE" in
    $pattern)
      jq -n \
        --arg file "$FILE" \
        --arg desc "$desc" \
        '{
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: ("受保护文件: " + $file + " (" + $desc + ")")
          }
        }'
      exit 2
      ;;
  esac

  # 对文件名也进行匹配
  case "$BASENAME" in
    $pattern)
      jq -n \
        --arg file "$FILE" \
        --arg desc "$desc" \
        '{
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: ("受保护文件: " + $file + " (" + $desc + ")")
          }
        }'
      exit 2
      ;;
  esac
done <<< "$PROTECTED_LIST"

exit 0
