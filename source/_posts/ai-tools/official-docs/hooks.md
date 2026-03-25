---
title: 精读官方文档：Hooks 参考
date: 2026-03-20 23:00:00
updated: 2026-03-28 10:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 11
description: Hooks 是 Claude Code 的"守门员"，在工具执行前后自动触发。这篇精读涵盖 22 种 Hook 事件、4 种 Hook 类型（command/prompt/agent/http）、JSON 输入输出格式，以及实战案例。
cover: https://picsum.photos/seed/claude-hooks/1920/1080
source_url: https://code.claude.com/docs/zh-CN/hooks
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

## 三、22 种 Hook 事件完整列表

官方文档定义了 22 种 Hook 事件，按用途分为以下几类：

### 3.1 工具执行类（4 个）

| 事件 | 触发时机 | 可否阻断 |
|------|---------|---------|
| `PreToolUse` | 工具执行前 | ✅ 可阻断 |
| `PostToolUse` | 工具执行成功后 | ✅ 可反馈 |
| `PostToolUseFailure` | 工具执行失败后 | ✅ 可反馈 |
| `PermissionRequest` | 权限弹窗出现时 | ✅ 可自动批准 |

### 3.2 子代理类（3 个）

| 事件 | 触发时机 | 说明 |
|------|---------|------|
| `SubagentStart` | 子代理启动时 | 匹配代理类型 |
| `SubagentStop` | 子代理完成时 | 与 Stop 独立 |
| `TeammateIdle` | 团队队友即将空闲时 | 多代理协作场景 |

### 3.3 会话生命周期类（5 个）

| 事件 | 触发时机 | Matcher |
|------|---------|---------|
| `SessionStart` | 会话开始或恢复时 | `startup`/`resume`/`clear`/`compact` |
| `SessionEnd` | 会话结束时 | `clear`/`logout`/`prompt_input_exit` |
| `InstructionsLoaded` | CLAUDE.md 或规则加载时 | 懒加载也会触发 |
| `ConfigChange` | 配置文件变更时 | `user_settings`/`project_settings`/`skills` |
| `TaskCompleted` | 任务标记为完成时 | 无 Matcher |

### 3.4 响应与停止类（4 个）

| 事件 | 触发时机 | 说明 |
|------|---------|------|
| `UserPromptSubmit` | 用户发送消息后 | 可注入上下文 |
| `Stop` | Claude 完成响应时 | 可阻止停止 |
| `StopFailure` | API 错误导致停止时 | 输出被忽略 |
| `Notification` | Claude Code 发送通知时 | `permission_prompt`/`idle_prompt` 等 |

### 3.5 上下文压缩类（2 个）

| 事件 | 触发时机 | Matcher |
|------|---------|---------|
| `PreCompact` | 上下文压缩前 | `manual`/`auto` |
| `PostCompact` | 压缩完成后 | `manual`/`auto` |

### 3.6 MCP 交互类（2 个）

| 事件 | 触发时机 | 说明 |
|------|---------|------|
| `Elicitation` | MCP 服务器请求用户输入时 | 可预处理 |
| `ElicitationResult` | 用户响应 MCP 输入后 | 可修改响应 |

### 3.7 Worktree 类（2 个）

| 事件 | 触发时机 | 说明 |
|------|---------|------|
| `WorktreeCreate` | 创建工作树时 | 可替换默认 git 行为 |
| `WorktreeRemove` | 删除工作树时 | 会话结束或子代理完成时 |

---

## 四、核心事件详解与实战

### 4.1 PreToolUse（工具执行前）

**触发时机**：Claude 创建好工具参数后，执行前。

**常见 Matcher**：
- `Bash` - Shell 命令
- `Write` / `Edit` - 文件操作
- `Glob` / `Grep` - 搜索操作
- `WebFetch` / `WebSearch` - 网络操作

**用途**：验证、拦截、记录。

### 4.2 PostToolUse（工具执行成功后）

**触发时机**：工具执行成功后。

**用途**：自动测试、日志记录、通知触发。

### 4.3 PostToolUseFailure（工具执行失败后）

**触发时机**：工具执行失败后。

**用途**：错误恢复、日志记录、自动重试建议。

**示例**：Bash 命令失败时记录日志

```json
{
  "hooks": {
    "PostToolUseFailure": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{tool: .tool_name, error: .tool_result.error}' >> ~/.claude/failed-commands.log"
          }
        ]
      }
    ]
  }
}
```

### 4.4 PermissionRequest（权限请求时）

**触发时机**：Claude Code 即将显示权限弹窗时。

**用途**：自动批准特定权限请求，跳过弹窗。

**重要**：需要返回 JSON 格式才能生效。

**示例**：自动批准 ExitPlanMode

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "echo '{\"hookSpecificOutput\": {\"hookEventName\": \"PermissionRequest\", \"decision\": {\"behavior\": \"allow\"}}}'"
          }
        ]
      }
    ]
  }
}
```

**决策选项**：

| behavior | 效果 |
|----------|------|
| `allow` | 自动批准，跳过弹窗 |
| `deny` | 自动拒绝 |
| `ask` | 正常显示弹窗（默认） |

**进阶**：批准后切换权限模式

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedPermissions": [
        { "type": "setMode", "mode": "acceptEdits", "destination": "session" }
      ]
    }
  }
}
```

> ⚠️ **安全警告**：`matcher: ""` 或 `".*"` 会自动批准所有权限请求，包括文件写入和 shell 命令，极其危险！

### 4.5 UserPromptSubmit（用户提交时）

**触发时机**：用户发送消息后，Claude 处理前。

**用途**：
- 添加额外上下文
- 验证用户输入
- 阻止敏感操作

### 4.6 Notification（通知时）

**触发时机**：Claude Code 发送通知时。

**Matcher 类型**：
- `permission_prompt` - 权限弹窗
- `idle_prompt` - 用户输入空闲
- `auth_success` - 认证成功
- `elicitation_dialog` - MCP 输入对话框

### 4.7 Stop / SubagentStop（停止时）

**触发时机**：
- `Stop`：Claude 完成响应时
- `SubagentStop`：子代理完成时

**用途**：阻止 Claude 过早结束，让它继续工作。

**防止无限循环**：检查 `stop_hook_active` 字段

```bash
#!/bin/bash
INPUT=$(cat)
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0  # 已触发过，允许停止
fi
# ... 你的逻辑
```

### 4.8 StopFailure（API 错误停止时）

**触发时机**：API 错误导致会话停止时。

**特点**：输出和退出码都会被忽略，仅用于日志记录。

```json
{
  "hooks": {
    "StopFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{error: .error, session_id: .session_id}' >> ~/.claude/api-errors.log"
          }
        ]
      }
    ]
  }
}
```

### 4.9 PreCompact / PostCompact（压缩前后）

**触发时机**：
- `PreCompact`：执行 `/compact` 或自动压缩前
- `PostCompact`：压缩完成后

**Matcher**：`manual`（手动）或 `auto`（自动）。

**用途**：压缩后重新注入关键上下文。

```json
{
  "hooks": {
    "PostCompact": [
      {
        "matcher": "auto",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: use Bun, not npm. Run bun test before committing.'"
          }
        ]
      }
    ]
  }
}
```

### 4.10 SessionStart / SessionEnd（会话生命周期）

**触发时机**：
- `SessionStart`：新会话开始、恢复、清除后、压缩后
- `SessionEnd`：会话结束时

**SessionStart Matcher**：`startup`/`resume`/`clear`/`compact`

**SessionEnd Matcher**：`clear`/`logout`/`prompt_input_exit`/`bypass_permissions_disabled`/`other`

**用途**：
- SessionStart：加载项目上下文、读取 issue 列表
- SessionEnd：清理任务、保存状态

### 4.11 ConfigChange（配置变更时）

**触发时机**：外部进程或编辑器修改配置文件时。

**Matcher**：`user_settings`/`project_settings`/`local_settings`/`policy_settings`/`skills`

**用途**：审计配置变更，阻止未授权修改。

```json
{
  "hooks": {
    "ConfigChange": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{timestamp: now | todate, source: .source, file: .file_path}' >> ~/claude-config-audit.log"
          }
        ]
      }
    ]
  }
}
```

### 4.12 WorktreeCreate / WorktreeRemove

**触发时机**：
- `WorktreeCreate`：创建工作树时
- `WorktreeRemove`：删除工作树时

**用途**：替换默认 git 行为，实现自定义隔离逻辑。

### 4.13 Elicitation / ElicitationResult（MCP 交互）

**触发时机**：
- `Elicitation`：MCP 服务器请求用户输入时
- `ElicitationResult`：用户响应后，发送回服务器前

**用途**：预处理 MCP 输入请求，修改用户响应。

---

## 五、四种 Hook 类型

Hooks 支持四种执行类型，从简单到复杂：

### 5.1 Command 类型（默认）

最常用的类型，执行 shell 命令：

```json
{
  "type": "command",
  "command": "/path/to/script.sh",
  "timeout": 60
}
```

**特点**：
- 通过 stdin 接收 JSON 输入
- 通过 stdout/stderr 和退出码返回结果
- 默认超时 60 秒

### 5.2 Prompt 类型（基于 LLM 判断）

对于需要判断而非确定性规则的场景，使用 `type: "prompt"`：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all tasks are complete. If not, respond with {\"ok\": false, \"reason\": \"what remains to be done\"}.",
            "model": "claude-haiku-4-5"
          }
        ]
      }
    ]
  }
}
```

**工作原理**：
- Claude 模型（默认 Haiku）评估条件
- 返回 JSON：`{"ok": true}` 继续或 `{"ok": false, "reason": "..."}` 阻断
- 阻断时 `reason` 会反馈给 Claude 作为下一条指令

**适用场景**：
- 判断任务是否真正完成
- 验证输出质量
- 需要语义理解的决策

### 5.3 Agent 类型（多轮验证）

当验证需要检查文件或运行命令时，使用 `type: "agent"`：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify that all unit tests pass. Run the test suite and check the results. $ARGUMENTS",
            "timeout": 120,
            "max_turns": 50
          }
        ]
      }
    ]
  }
}
```

**与 Prompt 类型的区别**：

| 特性 | Prompt 类型 | Agent 类型 |
|------|------------|------------|
| 工具访问 | ❌ 无 | ✅ 可读文件、运行命令 |
| 调用次数 | 单次 LLM 调用 | 最多 50 轮 |
| 默认超时 | 10 秒 | 60 秒 |
| 适用场景 | 纯文本判断 | 需要验证代码库状态 |

**示例**：提交前验证测试通过

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git commit*)",
        "hooks": [
          {
            "type": "agent",
            "prompt": "Run npm test and verify all tests pass. If any test fails, respond with {\"ok\": false, \"reason\": \"test failures\"}.",
            "timeout": 180
          }
        ]
      }
    ]
  }
}
```

### 5.4 HTTP 类型（远程处理）

将事件数据 POST 到 HTTP 端点：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:8080/hooks/tool-use",
            "headers": {
              "Authorization": "Bearer $MY_TOKEN"
            },
            "allowedEnvVars": ["MY_TOKEN"]
          }
        ]
      }
    ]
  }
}
```

**特点**：
- 端点接收与 command hook 相同的 JSON
- 响应体使用相同的 JSON 格式
- 2xx 响应 + `hookSpecificOutput` 可阻断操作

**适用场景**：
- 跨团队的共享审计服务
- 云函数处理
- 外部系统集成

**环境变量**：仅 `allowedEnvVars` 中的变量会被解析

---

## 六、Hook 输入：JSON 数据格式

每个 Hook 通过 `stdin` 接收 JSON 数据，包含会话信息和事件特定数据。

### 6.1 通用字段

所有 Hook 都包含：

```json
{
  "session_id": "abc123",           // 会话唯一 ID
  "cwd": "/Users/user/project",     // 当前工作目录
  "hook_event_name": "PreToolUse",  // 事件名称
  "transcript_path": "/path/to/transcript.jsonl"  // 会话记录路径
}
```

### 6.2 PreToolUse 输入示例

```json
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf node_modules"
  },
  "session_id": "abc123"
}
```

### 6.3 PostToolUse 输入示例

```json
{
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.md",
    "content": "..."
  },
  "tool_result": {
    "success": true
  },
  "session_id": "abc123"
}
```

### 6.4 UserPromptSubmit 输入示例

```json
{
  "hook_event_name": "UserPromptSubmit",
  "prompt": "删除所有测试文件",
  "session_id": "abc123"
}
```

### 6.5 Stop 输入示例

```json
{
  "hook_event_name": "Stop",
  "reason": "end_turn",
  "stop_hook_active": false,
  "session_id": "abc123"
}
```

> 💡 `stop_hook_active: true` 表示 Stop Hook 已触发过一次，避免无限循环。

---

## 七、Hook 输出：退出码与 JSON 控制

### 7.1 简单模式：退出码

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

### 7.2 高级模式：JSON 输出

Hook 可以返回 JSON 获得更精细的控制：

```json
{
  "decision": "deny",
  "reason": "该命令包含危险操作 rm -rf",
  "permissionDecisionReason": "已阻止删除操作"
}
```

#### 7.2.1 PreToolUse 决策选项

| decision | 效果 |
|----------|------|
| `allow` | 绕过权限系统，直接执行 |
| `deny` | 阻止执行，reason 给 Claude |
| `ask` | 弹窗让用户确认 |

#### 7.2.2 PostToolUse 决策选项

| decision | 效果 |
|----------|------|
| `block` | 自动提示 Claude，让它处理 |
| `undefined` | 什么都不做 |

### 7.3 结构化 JSON 输出格式

对于需要精细控制的场景，返回 JSON 而非使用退出码：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "使用 rg 而非 grep 以获得更好性能"
  }
}
```

**各事件支持的决策字段**：

| 事件 | 决策字段 | 可选值 |
|------|---------|--------|
| `PreToolUse` | `permissionDecision` | `allow`/`deny`/`ask` |
| `PostToolUse` | `decision` | `block` |
| `PermissionRequest` | `decision.behavior` | `allow`/`deny`/`ask` |
| `Stop` | `decision` | `block` |
| `UserPromptSubmit` | `additionalContext` | 字符串（注入上下文）|

---

## 八、实战示例

### 8.1 危险命令拦截

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

### 8.2 提交前自动测试

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

### 8.3 UserPromptSubmit 添加上下文

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

### 8.4 文章发布后截图验证

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

### 8.5 任务结束时发送通知

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

### 8.6 基于代理的测试验证

**场景**：使用 Agent 类型 Hook，在 Claude 声称任务完成时验证测试是否真正通过。

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify that all unit tests pass. Run 'npm test' and check the results. If any test fails, respond with {\"ok\": false, \"reason\": \"测试失败：列出失败的测试\"}. Otherwise respond with {\"ok\": true}.",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

**工作原理**：
1. Claude 完成响应后触发 Stop Hook
2. 子代理运行测试并检查结果
3. 如果测试失败，返回 `{"ok": false}` 阻止停止
4. `reason` 会作为下一条指令传给 Claude

### 8.7 基于提示的质量检查

**场景**：使用 Prompt 类型 Hook，让 LLM 判断 Claude 的回复是否完整。

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "检查 Claude 是否完成了用户请求的所有任务。如果有遗漏，返回 {\"ok\": false, \"reason\": \"还缺少什么\"}。否则返回 {\"ok\": true}。",
            "model": "claude-haiku-4-5"
          }
        ]
      }
    ]
  }
}
```

**适用场景**：
- 判断任务是否真正完成
- 验证输出质量
- 需要语义理解的决策

---

## 九、MCP 工具的 Hook 配置

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

## 十、安全注意事项

> ⚠️ **官方警告**：Hooks 会自动执行任意 shell 命令，请务必理解你在配置什么。

### 10.1 安全最佳实践

1. **验证和清理输入** - 不要盲目信任 stdin 数据
2. **始终引用变量** - 用 `"$VAR"` 而不是 `$VAR`
3. **阻止路径遍历** - 检查文件路径中的 `..`
4. **使用绝对路径** - 用 `$CLAUDE_PROJECT_DIR` 定位项目脚本
5. **跳过敏感文件** - 避免 `.env`、`.git/`、密钥文件

### 10.2 配置安全机制

Claude Code 不会立即加载运行中的 Hook 修改：
1. 启动时捕获 Hook 配置快照
2. 会话期间使用快照版本
3. 外部修改会触发警告
4. 需要在 `/hooks` 菜单中确认才生效

---

## 十一、调试技巧

### 11.1 基本排查

1. **检查配置**：运行 `/hooks` 查看注册情况
2. **验证语法**：确保 JSON 格式正确
3. **手动测试**：先单独运行脚本
4. **检查权限**：脚本需要可执行权限
5. **查看日志**：使用 `claude --debug`

### 11.2 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| Hook 未触发 | matcher 写错 | 检查大小写，工具名区分大小写 |
| 脚本找不到 | 路径问题 | 使用 `$CLAUDE_PROJECT_DIR` 或绝对路径 |
| JSON 解析失败 | 引号未转义 | 用 `\"` 转义 JSON 字符串中的引号 |
| 超时 | 脚本执行太慢 | 添加 `timeout` 参数或优化脚本 |

### 11.3 Debug 模式

```bash
claude --debug
```

可以看到：
- 哪个 Hook 正在运行
- 执行的命令是什么
- 成功/失败状态
- 输出或错误信息

---

## 十二、hippo 的实战心得

> 💬 hippo：以下是我配置 Hooks 过程中的体会：

### 12.1 为什么我喜欢 Hooks

把安全规则写在 CLAUDE.md 里，Claude 可能忘记；但用 Hook 拦截，是 100% 执行的。

举个例子：我想阻止 `rm -rf`。
- 写在 CLAUDE.md：遵守率约 70%（Claude 可能"忘记"）
- 用 Hook 拦截：100%（物理屏障）

**对于安全规则，确定性胜过概率性。**

### 12.2 Hook vs Skill 的选择

| 场景 | 用 Hook | 用 Skill |
|------|---------|---------|
| 安全规则（不可绕过）| ✅ | ❌ |
| 提交前强制测试 | ✅ | ❌ |
| 写作规范检查 | ❌ | ✅ |
| 发布流程定义 | ❌ | ✅（触发点可以用 Hook）|

### 12.3 一个重要原则

**Block-at-submit，not block-at-write。**

让 Claude 把计划做完，在 `git commit` 这个最终关卡统一验收，而不是每次文件编辑都打断它。

---

## 十三、常见问题

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

*最后更新：2026-03-28*
