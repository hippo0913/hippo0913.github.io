#!/bin/bash
# 命令守卫：拦截危险 Bash 命令
# exit 0 = 放行，exit 2 = 阻断

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# 如果没有命令，直接放行
[ -z "$COMMAND" ] && exit 0

# 危险命令黑名单
# 格式：模式|说明
DANGEROUS_LIST="
rm -rf|递归强制删除
rm -fr|递归强制删除
git push --force|强制推送
git push -f|强制推送
git reset --hard|硬重置
git clean -fd|清理未跟踪文件
git clean -fx|清理忽略的文件
DROP TABLE|删除数据表
TRUNCATE TABLE|清空数据表
mkfs|格式化文件系统
dd if=.*of=/dev/|写入磁盘设备
chmod -R 777 /|全开权限
sudo su|切换root
"

while IFS='|' read -r pattern desc; do
  [ -z "$pattern" ] && continue

  # 使用更精确的匹配：命令开头或在 ; && || 之后
  if echo "$COMMAND" | grep -qE "(^|;|&&|\|\|)\s*${pattern}"; then
    jq -n \
      --arg cmd "$COMMAND" \
      --arg desc "$desc" \
      '{
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: ("危险命令被拦截: " + $desc + " — 如需执行请手动操作")
        }
      }'
    exit 2
  fi
done <<< "$DANGEROUS_LIST"

exit 0
