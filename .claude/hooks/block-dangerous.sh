#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS_PATTERNS=(
  "rm -rf"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "git clean -fd"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -q "$pattern"; then
    echo "BLOCKED: $COMMAND" >&2
    echo "该命令在危险列表中，已阻止执行。" >&2
    exit 2
  fi
done

exit 0