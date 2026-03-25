---
title: 精读官方文档：Hooks 参考
date: 2026-03-20 23:00:00
updated: 2026-03-25 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 11
description: Hooks 是 Claude Code 的"守门员"，在工具执行前后自动触发。这篇精读涵盖 10 种 Hook 事件、JSON 输入输出格式、退出码机制，以及如何用 Hooks 实现危险命令拦截和自动测试验证。
cover: https://picsum.photos/seed/claude-hooks/1920/1080
source_url: https://docs.anthropic.com/en/docs/claude-code/hooks
---

# 精读官方文档：Hooks 参考

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。Hooks 是我最喜欢的功能之一——它让 Claude Code 从"听话的助手"变成"有边界的协作者"。

---

## 一、Hooks 是什么

**一句话：Hooks 是 Claude Code 的自动守门员。**

当 Claude 执行某个操作时（比如运行命令、修改文件），Hooks 可以：
- **在操作前检查**：允许、阻止、或询问用户
- **在操作后处理**：记录日志、触发通知、自动验证

这和 Skills 不同——Skills 是"建议"，Claude 可能忽略；Hooks 是"强制执行"，100% 触发。

<!-- more -->

---

## 二、配置位置与基本结构

### 2.1 配置文件层级

Hooks 可以配置在多个层级，优先级从高到低：

| 文件 | 作用域 | 说明 |
|------|--------|------|
| `.claude/settings.local.json` | 本地项目 | 不提交到 git，适合个人配置 |
| `.claude/settings.json` | 项目级 | 提交到 git，团队共享 |
| `~/.claude/settings.json` | 用户级 | 所有项目生效 |
| 企业策略 | 企业级 | 由管理员统一配置 |

### 2.2 基本配置结构

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/script.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write(source/_posts/**)",
        "hooks": [
          {
            "type": "command",
            "command": "node verify.js"
          }
        ]
      }
    ]
  }
}
```

### 2.3 Matcher 匹配规则

`matcher` 决定 Hook 在哪些工具上触发：

| Matcher 格式 | 匹配范围 | 示例 |
|-------------|---------|------|
| 精确匹配 | 单个工具 | `Write` 只匹配 Write 工具 |
| 正则表达式 | 多个工具 | `Edit|Write` 匹配 Edit 或 Write |
| 通配符 | 所有工具 | `*` 或空字符串 `""` |
| 带参数 | 特定文件 | `Write(source/_posts/**)` |

```json
// 示例：匹配所有 Bash 命令
"matcher": "Bash"

// 示例：匹配 git 相关命令
"matcher": "Bash(git*)"

// 示例：匹配所有文件写入
"matcher": "Write|Edit"
```

---

## 三、10 种 Hook 事件详解

### 3.1 PreToolUse（工具执行前）

**触发时机**：Claude 创建好工具参数后，执行前。

**常见 Matcher**：
- `Bash` - Shell 命令
- `Write` / `Edit` - 文件操作
- `Glob` / `Grep` - 搜索操作
- `WebFetch` / `WebSearch` - 网络操作

**用途**：验证、拦截、记录。

### 3.2 PostToolUse（工具执行后）

**触发时机**：工具执行完成后。

**用途**：自动测试、日志记录、通知触发。

### 3.3 UserPromptSubmit（用户提交时）

**触发时机**：用户发送消息后，Claude 处理前。

**用途**：
- 添加额外上下文
- 验证用户输入
- 阻止敏感操作

### 3.4 Notification（通知时）

**触发时机**：Claude Code 发送通知时，包括：
1. Claude 需要用户授权工具
2. 用户输入空闲超过 60 秒

### 3.5 Stop / SubagentStop（停止时）

**触发时机**：Claude 完成响应时（Stop）或子代理完成时（SubagentStop）。

**用途**：阻止 Claude 过早结束，让它继续工作。

### 3.6 PreCompact（压缩前）

**触发时机**：执行 `/compact` 或自动压缩时。

**Matcher**：`manual`（手动）或 `auto`（自动）。

### 3.7 SessionStart / SessionEnd（会话生命周期）

**触发时机**：
- `SessionStart`：新会话开始或恢复时
- `SessionEnd`：会话结束时（退出、清除、登出）

**用途**：
- SessionStart：加载项目上下文、读取 issue 列表
- SessionEnd：清理任务、保存状态

---

## 四、Hook 输入：JSON 数据格式

每个 Hook 通过 `stdin` 接收 JSON 数据，包含会话信息和事件特定数据。

### 4.1 PreToolUse 输入示例

```json
{
  "event": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf node_modules"
  },
  "session_id": "abc123"
}
```

### 4.2 PostToolUse 输入示例

```json
{
  "event": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.md",
    "content": "..."
  },
  "tool_response": {
    "success": true
  }
}
```

### 4.3 UserPromptSubmit 输入示例

```json
{
  "event": "UserPromptSubmit",
  "prompt": "删除所有测试文件"
}
```

---

## 五、Hook 输出：退出码与 JSON 控制

### 5.1 简单模式：退出码

| 退出码 | 含义 | 行为 |
|--------|------|------|
| 0 | 成功 | 继续执行，stdout 显示给用户 |
| 2 | 阻断 | stderr 返回给 Claude，让它调整 |
| 其他 | 警告 | 继续执行，但显示 stderr |

**退出码 2 的行为差异**：

| Hook 事件 | 阻断行为 |
|-----------|---------|
| `PreToolUse` | 阻止工具执行，stderr 给 Claude |
| `PostToolUse` | 工具已执行，stderr 给 Claude |
| `UserPromptSubmit` | 阻止消息处理，清空输入 |
| `Stop` | 阻止停止，stderr 给 Claude |

### 5.2 高级模式：JSON 输出

Hook 可以返回 JSON 获得更精细的控制：

```json
{
  "decision": "deny",
  "reason": "该命令包含危险操作 rm -rf",
  "permissionDecisionReason": "已阻止删除操作"
}
```

#### PreToolUse 决策选项

| decision | 效果 |
|----------|------|
| `allow` | 绕过权限系统，直接执行 |
| `deny` | 阻止执行，reason 给 Claude |
| `ask` | 弹窗让用户确认 |

#### PostToolUse 决策选项

| decision | 效果 |
|----------|------|
| `block` | 自动提示 Claude，让它处理 |
| `undefined` | 什么都不做 |

---

## 六、实战示例

### 6.1 危险命令拦截

**场景**：阻止 Claude 执行 `rm -rf`、`git push --force` 等危险命令。

**脚本 `block-dangerous.sh`**：

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS_PATTERNS=(
  "rm -rf"
  "git push --force"
  "git push -f"
  "git reset --hard"
  "git clean -fd"
  "DROP TABLE"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -q "$pattern"; then
    echo "BLOCKED: $COMMAND" >&2
    echo "该命令在危险列表中，已阻止执行。" >&2
    exit 2
  fi
done

exit 0
```

**配置**：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-dangerous.sh"
          }
        ]
      }
    ]
  }
}
```

### 6.2 提交前自动测试

**场景**：每次 `git commit` 前自动运行测试，测试失败则禁止提交。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git commit*)",
        "hooks": [
          {
            "type": "command",
            "command": "npm test || { echo '测试未通过，禁止提交' >&2; exit 2; }"
          }
        ]
      }
    ]
  }
}
```

### 6.3 UserPromptSubmit 添加上下文

**场景**：用户提到"bug"时，自动加载最近的 issue 列表。

```bash
#!/bin/bash
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt')

if echo "$PROMPT" | grep -qi "bug"; then
  ISSUES=$(gh issue list --limit 5 2>/dev/null || echo "无法获取 issues")
  echo "{\"hookSpecificOutput\": {\"additionalContext\": \"最近的 issues:\\n$ISSUES\"}}"
else
  echo "{}"
fi
```

### 6.4 文章发布后截图验证

**场景**：修改博客文章后，自动截图验证页面显示。

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(source/_posts/**)",
        "hooks": [
          {
            "type": "command",
            "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/screenshot-verify.js \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

### 6.5 任务结束时发送通知

**场景**：Claude 完成任务后，自动发送桌面通知或飞书通知，这样你不用一直盯着屏幕。

#### 桌面通知（macOS/Linux）

```bash
#!/bin/bash
# .claude/hooks/notify.sh

INPUT=$(cat)
REASON=$(echo "$INPUT" | jq -r '.reason // "unknown"')

# macOS
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"Claude Code 任务结束 (原因: $REASON)\" with title \"Claude Code\""
fi

# Linux (notify-send)
if command -v notify-send &> /dev/null; then
  notify-send "Claude Code" "任务结束 (原因: $REASON)"
fi
```

#### 飞书通知

```bash
#!/bin/bash
# .claude/hooks/feishu-notify.sh

WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/你的webhook地址"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "msg_type": "text",
    "content": {
      "text": "✅ Claude Code 任务已完成"
    }
  }'
```

#### 配置

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

> 💡 **提示**：`Stop` 事件在 Claude 完成响应时触发。如果想捕获会话结束，用 `SessionEnd`，但注意它只有 1.5 秒超时。

---

## 七、MCP 工具的 Hook 配置

MCP 工具的命名格式是 `mcp__<server>__<tool>`，例如：
- `mcp__memory__create_entities`
- `mcp__github__search_repositories`

**配置示例**：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__filesystem__*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '文件系统 MCP 被调用' >> /tmp/mcp.log"
          }
        ]
      }
    ]
  }
}
```

---

## 八、安全注意事项

> ⚠️ **官方警告**：Hooks 会自动执行任意 shell 命令，请务必理解你在配置什么。

### 8.1 安全最佳实践

1. **验证和清理输入** - 不要盲目信任 stdin 数据
2. **始终引用变量** - 用 `"$VAR"` 而不是 `$VAR`
3. **阻止路径遍历** - 检查文件路径中的 `..`
4. **使用绝对路径** - 用 `$CLAUDE_PROJECT_DIR` 定位项目脚本
5. **跳过敏感文件** - 避免 `.env`、`.git/`、密钥文件

### 8.2 配置安全机制

Claude Code 不会立即加载运行中的 Hook 修改：
1. 启动时捕获 Hook 配置快照
2. 会话期间使用快照版本
3. 外部修改会触发警告
4. 需要在 `/hooks` 菜单中确认才生效

---

## 九、调试技巧

### 9.1 基本排查

1. **检查配置**：运行 `/hooks` 查看注册情况
2. **验证语法**：确保 JSON 格式正确
3. **手动测试**：先单独运行脚本
4. **检查权限**：脚本需要可执行权限
5. **查看日志**：使用 `claude --debug`

### 9.2 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| Hook 未触发 | matcher 写错 | 检查大小写，工具名区分大小写 |
| 脚本找不到 | 路径问题 | 使用 `$CLAUDE_PROJECT_DIR` 或绝对路径 |
| JSON 解析失败 | 引号未转义 | 用 `\"` 转义 JSON 字符串中的引号 |
| 超时 | 脚本执行太慢 | 添加 `timeout` 参数或优化脚本 |

### 9.3 Debug 模式

```bash
claude --debug
```

可以看到：
- 哪个 Hook 正在运行
- 执行的命令是什么
- 成功/失败状态
- 输出或错误信息

---

## 十、hippo 的实战心得

> 💬 hippo：以下是我配置 Hooks 过程中的体会：

### 10.1 为什么我喜欢 Hooks

把安全规则写在 CLAUDE.md 里，Claude 可能忘记；但用 Hook 拦截，是 100% 执行的。

举个例子：我想阻止 `rm -rf`。
- 写在 CLAUDE.md：遵守率约 70%（Claude 可能"忘记"）
- 用 Hook 拦截：100%（物理屏障）

**对于安全规则，确定性胜过概率性。**

### 10.2 Hook vs Skill 的选择

| 场景 | 用 Hook | 用 Skill |
|------|---------|---------|
| 安全规则（不可绕过）| ✅ | ❌ |
| 提交前强制测试 | ✅ | ❌ |
| 写作规范检查 | ❌ | ✅ |
| 发布流程定义 | ❌ | ✅（触发点可以用 Hook）|

### 10.3 一个重要原则

**Block-at-submit，not block-at-write。**

让 Claude 把计划做完，在 `git commit` 这个最终关卡统一验收，而不是每次文件编辑都打断它。

---

## 十一、常见问题

**Q: Hook 脚本放在哪里？**

A: 推荐放在 `.claude/hooks/` 目录下，用 `$CLAUDE_PROJECT_DIR/.claude/hooks/xxx.sh` 引用。

**Q: 多个 Hook 会按什么顺序执行？**

A: 所有匹配的 Hook **并行执行**，相同命令会自动去重。

**Q: Hook 执行超时怎么办？**

A: 默认 60 秒超时，可以在配置中添加 `timeout` 参数：

```json
{
  "type": "command",
  "command": "long-running-script.sh",
  "timeout": 120
}
```

**Q: 如何测试 Hook 是否正常工作？**

A: 用 `claude --debug` 启动，查看 Hook 执行日志。

---

## 小结

Hooks 是 Claude Code 的"守门员"，在关键时机自动触发，强制执行你定义的规则。掌握 Hooks，你就能让 Claude Code 在"聪明"的同时保持"安全"。

**下一篇**：[创建自定义 subagents](/2026/03/19/ai-tools/official-docs/sub-agents/) — 如何创建独立上下文的子代理。

---

## 实战案例

📖 [Claude Code Hooks 实战：任务完成自动通知](/2026/03/25/ai-tools/claude-code-hooks-practice/) — 用 Stop Hook 实现桌面通知和飞书通知，包含完整的踩坑记录。

---

*本文精读自 [Hooks reference - Anthropic](https://docs.anthropic.com/en/docs/claude-code/hooks)*

*最后更新：2026-03-25*
