---
title: 精读官方文档：Hooks 参考
date: 2026-03-27 11:00:00
updated: 2026-04-08 10:00:00
tags: [Claude Code, 扩展定制]
categories: [AI 工具系列]
series: claude-code
series_index: 11
description: Hooks 是 Claude Code 的守门员——在工具执行前后、会话启停等关键时刻自动触发你定义的 shell 命令，实现安全拦截、自动验证和通知推送。
cover: https://picsum.photos/seed/claude-code-hooks/1920/1080
source_url: https://code.claude.com/docs/zh-CN/hooks
---

# 精读官方文档：Hooks 参考

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。Hooks 是我用得最多、踩坑也最多的功能——因为它让你对 Claude Code 拥有了确定性的控制力。

---

## 一、这个功能是什么

Hooks 是 Claude Code 的**事件驱动自动守卫机制**。你可以把它理解成 Git Hooks 的"AI 版"——在 Claude Code 执行工具、提交 prompt、结束会话等关键节点，自动触发你预设的 shell 命令、HTTP 请求或 LLM 提示。

Hooks 和 Skills 的本质区别在于**确定性**：
- **Skills**（技能）是概率性的——Claude 自行判断是否使用，可能忘记
- **Hooks** 是确定性的——只要事件触发且匹配器命中，**100% 执行**，无法绕过

Hooks 能做的事情覆盖了整个 Claude Code 生命周期：
- **工具执行前拦截/放行**：阻止危险命令、自动审批权限
- **工具执行后记录/验证**：运行测试、截图验证、日志审计
- **会话生命周期回调**：启动时注入上下文、结束时发通知、压缩前保存状态

<!-- more -->

---

## 二、官方教程精读

### 2.1 配置位置与结构

Hooks 定义在 JSON 设置文件中。配置有三个嵌套层级：**选事件类型** -> **加匹配器过滤** -> **定义处理程序**。

**配置文件位置决定了作用范围：**

| 位置 | 范围 | 可共享 |
|------|------|--------|
| `~/.claude/settings.json` | 你的所有项目 | 否，仅本机 |
| `.claude/settings.json` | 单个项目 | 是，可提交到仓库 |
| `.claude/settings.local.json` | 单个项目 | 否，已被 gitignore |
| 托管策略设置 | 组织范围 | 是，管理员控制 |
| Plugin `hooks/hooks.json` | 启用插件时 | 是，与插件捆绑 |
| Skill 或代理 frontmatter | 组件活跃时 | 是，在组件文件中定义 |

一个完整的 settings.json hooks 配置示例：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-dangerous.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh"
          }
        ]
      }
    ]
  }
}
```

**配置参数说明：**

通用字段（所有 hook 类型都有）：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 处理程序类型：`command`、`http`、`prompt`、`agent` |
| `if` | string | 否 | 权限规则语法过滤，如 `"Bash(git *)"` 仅匹配 git 命令。仅工具事件有效 |
| `matcher` | string | 否 | 正则表达式，过滤何时触发。`"*"` 或空匹配所有 |
| `timeout` | number | 否 | 超时秒数。命令默认 600，提示默认 30，代理默认 60 |
| `statusMessage` | string | 否 | hook 运行时显示的自定义加载消息 |
| `once` | boolean | 否 | `true` 则每个会话只运行一次（仅 Skills） |

命令 hook 专有字段：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `command` | string | 是 | 要执行的 shell 命令 |
| `async` | boolean | 否 | `true` 则后台运行不阻塞 |
| `shell` | string | 否 | 指定 shell：`"bash"`（默认）或 `"powershell"` |

**matcher 匹配规则：** matcher 是正则表达式字符串。`"Bash"` 精确匹配 Bash 工具，`"Edit|Write"` 匹配编辑或写入，`"mcp__.*"` 匹配所有 MCP 工具，`"*"` 或留空匹配一切。

不同事件的 matcher 匹配目标不同：

| 事件类型 | matcher 匹配的内容 |
|---------|------------------|
| PreToolUse / PostToolUse / PostToolUseFailure | 工具名（如 `Bash`、`Edit`、`mcp__memory__create_entities`） |
| PermissionRequest / PermissionDenied | 工具名 |
| SubagentStart / SubagentStop | 代理类型名（如 `Explore`、自定义代理名） |
| Notification | 通知类型（如 `permission_prompt`、`idle_prompt`） |
| PreCompact / PostCompact | 触发方式（`manual` 或 `auto`） |
| SessionStart | 启动原因（`startup`、`resume`、`clear`、`compact`） |
| SessionEnd | 结束原因（`clear`、`resume`、`logout` 等） |
| ConfigChange | 配置源（`user_settings`、`project_settings` 等） |
| FileChanged | 文件名（如 `.envrc`） |
| StopFailure | 错误类型 |
| Stop / UserPromptSubmit / TaskCreated / TaskCompleted / TeammateIdle / WorktreeCreate / WorktreeRemove | 不支持 matcher |

用 `$CLAUDE_PROJECT_DIR` 环境变量引用项目根目录的脚本，这样不管工作目录怎么变，路径都不会出错。

### 2.2 Hook 事件详解

Claude Code 支持 **26 种 Hook 事件**，覆盖从会话启动到结束的完整生命周期。下面按生命周期顺序列出所有事件：

| 事件 | 触发时机 | matcher 过滤内容 | 可阻止 | 典型用途 |
|------|---------|-----------------|--------|---------|
| `SessionStart` | 会话开始或恢复 | startup/resume/clear/compact | 否 | 注入上下文、设置环境变量 |
| `InstructionsLoaded` | CLAUDE.md 或规则文件加载时 | session_start/nested_traversal 等 | 否 | 审计日志、合规追踪 |
| `UserPromptSubmit` | 用户提交 prompt 前 | 不支持 matcher | 是 | 注入上下文、过滤敏感词 |
| `PreToolUse` | 工具执行前 | 工具名 | 是 | 拦截危险命令、自动审批 |
| `PermissionRequest` | 权限对话框弹出时 | 工具名 | 是 | 自动批准/拒绝权限 |
| `PermissionDenied` | auto 模式拒绝工具时 | 工具名 | 否（可 retry） | 重试被拒的工具调用 |
| `PostToolUse` | 工具成功执行后 | 工具名 | 否（可反馈） | 运行测试、日志记录 |
| `PostToolUseFailure` | 工具执行失败后 | 工具名 | 否（可反馈） | 错误告警、纠正反馈 |
| `Notification` | 需要用户注意时 | permission_prompt/idle_prompt 等 | 否 | 发送桌面/飞书通知 |
| `SubagentStart` | 子 agent 启动时 | 代理类型名 | 否 | 注入上下文到子 agent |
| `SubagentStop` | 子 agent 完成时 | 代理类型名 | 是 | 子任务完成检查 |
| `TaskCreated` | TaskCreate 创建任务时 | 不支持 matcher | 是 | 强制命名规范 |
| `TaskCompleted` | 任务标记完成时 | 不支持 matcher | 是 | 强制通过测试才能关闭 |
| `Stop` | 主 agent 完成时 | 不支持 matcher | 是 | 任务完成通知、质量检查 |
| `StopFailure` | API 错误导致回合结束 | 错误类型 | 否（忽略输出） | 记录失败、发送告警 |
| `TeammateIdle` | agent 团队队友即将空闲 | 不支持 matcher | 是 | 强制质量门检查 |
| `ConfigChange` | 配置文件变更时 | user_settings/project_settings 等 | 是 | 审计设置变更 |
| `CwdChanged` | 工作目录切换时 | 不支持 matcher | 否 | 自动加载 direnv 环境 |
| `FileChanged` | 监视文件在磁盘变更时 | 文件名（如 .envrc） | 否 | 环境变量热重载 |
| `WorktreeCreate` | 创建 worktree 时 | 不支持 matcher | 是（路径返回） | 自定义 VCS 工作副本 |
| `WorktreeRemove` | 移除 worktree 时 | 不支持 matcher | 否 | 清理版本控制状态 |
| `PreCompact` | 压缩上下文前 | manual/auto | 否 | 保存重要上下文 |
| `PostCompact` | 压缩完成后 | manual/auto | 否 | 记录压缩摘要 |
| `Elicitation` | MCP 服务器请求用户输入时 | MCP 服务器名 | 是 | 自动响应 MCP 表单 |
| `ElicitationResult` | 用户响应 MCP 询问后 | MCP 服务器名 | 是 | 修改或阻止响应 |
| `SessionEnd` | 会话结束时 | clear/resume/logout 等 | 否 | 清理、保存统计 |

不需要 matcher 的事件（如 Stop、SessionEnd）会在**每次出现时都触发**。如果你给它们加了 matcher，会被静默忽略。

### 2.3 Hook 输入：从 stdin 读取 JSON

所有命令 Hook 通过 **stdin 接收 JSON 数据**。你的脚本需要从 stdin 读取，然后用 `jq` 解析需要的字段。

通用字段包括：

| 字段 | 说明 |
|------|------|
| `session_id` | 当前会话标识符 |
| `transcript_path` | 对话 JSON 的路径 |
| `cwd` | 当前工作目录 |
| `permission_mode` | 当前权限模式：`default`、`plan`、`acceptEdits`、`auto`、`dontAsk`、`bypassPermissions` |
| `hook_event_name` | 触发的事件名称 |
| `agent_id` | 子 agent 唯一标识（仅在子 agent 内触发时存在） |
| `agent_type` | 代理名称，如 `"Explore"` 或自定义代理名 |

不同事件还有各自的额外字段。以 `PreToolUse` 为例：

```bash
#!/bin/bash
# .claude/hooks/block-rm.sh
# 从 stdin 读取 JSON，提取要执行的命令
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -q 'rm -rf'; then
  # 输出到 stderr 的内容会作为错误消息反馈给 Claude
  echo "Blocked: rm -rf commands are not allowed" >&2
  exit 2  # 退出码 2 = 阻止
fi

exit 0  # 退出码 0 = 放行
```

这段脚本在每次执行 Bash 工具前被调用。stdin 的 JSON 大概长这样：

```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/build"
  }
}
```

`PostToolUse` 额外包含 `tool_response`（工具返回的结果），`Stop` 包含 `stop_hook_active`（防止死循环标志）和 `last_assistant_message`（Claude 最后的回复文本）。

### 2.4 两种输出方式：退出码与 JSON

Hook 的输出方式决定了你能多精细地控制 Claude Code 的行为。

**简单方式：退出码**

| 退出码 | 含义 | 效果 |
|--------|------|------|
| 0 | 成功 | 正常继续。stdout 如果是 JSON 则解析之 |
| 2 | 阻止 | stderr 反馈给 Claude。不同事件的阻止效果不同 |
| 其他 | 非阻塞错误 | stderr 在详细模式中显示，执行继续 |

退出码 2 在不同事件中的行为不同，这是必须搞清楚的：

| Hook 事件 | 可阻止？ | 退出 2 时发生什么 |
|-----------|---------|----------------|
| `PreToolUse` | 是 | 阻止工具调用 |
| `PermissionRequest` | 是 | 拒绝权限 |
| `UserPromptSubmit` | 是 | 阻止 prompt 并从上下文删除 |
| `Stop` | 是 | 阻止停止，Claude 继续工作 |
| `SubagentStop` | 是 | 阻止子 agent 停止 |
| `TeammateIdle` | 是 | 阻止队友空闲，继续工作 |
| `TaskCreated` | 是 | 回滚任务创建 |
| `TaskCompleted` | 是 | 阻止任务标记为完成 |
| `ConfigChange` | 是 | 阻止配置变更生效（policy_settings 除外） |
| `Elicitation` | 是 | 拒绝 MCP 询问 |
| `ElicitationResult` | 是 | 阻止响应（操作变为 decline） |
| `WorktreeCreate` | 是 | 任何非零退出导致创建失败 |
| `PostToolUse` | 否 | 向 Claude 显示 stderr |
| `PostToolUseFailure` | 否 | 向 Claude 显示 stderr |
| `PermissionDenied` | 否 | 退出码和 stderr 被忽略（用 JSON `retry: true` 重试） |
| `Notification` | 否 | 仅向用户显示 stderr |
| `SubagentStart` | 否 | 仅向用户显示 stderr |
| `SessionStart` | 否 | 仅向用户显示 stderr |
| `SessionEnd` | 否 | 仅向用户显示 stderr |
| `CwdChanged` / `FileChanged` | 否 | 仅向用户显示 stderr |
| `PreCompact` / `PostCompact` | 否 | 仅向用户显示 stderr |
| `StopFailure` | 否 | 输出和退出码被忽略 |
| `WorktreeRemove` | 否 | 失败仅在调试模式记录 |
| `InstructionsLoaded` | 否 | 退出码被忽略 |

**高级方式：JSON 输出**

退出 0 并将 JSON 打印到 stdout，可以获得更细粒度的控制：

```bash
#!/bin/bash
# 用 JSON 输出精细控制 PreToolUse
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -q 'rm -rf'; then
  # 输出 JSON，用 hookSpecificOutput 控制 PreToolUse 行为
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Destructive command blocked by hook"
    }
  }'
else
  exit 0  # 无输出 = 放行
fi
```

JSON 输出的通用字段：

| 字段 | 默认 | 说明 |
|------|------|------|
| `continue` | true | `false` 则 Claude 在 hook 后完全停止处理 |
| `stopReason` | 无 | `continue` 为 false 时向用户显示的消息 |
| `suppressOutput` | false | `true` 则从详细模式输出中隐藏 stdout |
| `systemMessage` | 无 | 向用户显示的警告消息 |

不同事件使用不同的决定字段。`PreToolUse` 用 `hookSpecificOutput.permissionDecision`（allow/deny/ask/defer），`Stop` 用顶级 `decision: "block"`，`PostToolUse` 用顶级 `decision: "block"` + `reason`。

**输出字符上限**：Hook 输出注入到上下文中（additionalContext、systemMessage 或纯 stdout）的上限为 **10,000 字符**。超过此限制的输出被保存到文件并替换为预览和文件路径。

### 2.5 if 字段：权限规则语法过滤

除了 `matcher` 按工具名过滤外，还可以用 `if` 字段做更精细的二次过滤。`if` 使用**权限规则语法**来匹配工具名称和参数：

- `"Bash(git *)"` 仅匹配 git 命令
- `"Edit(*.ts)"` 仅匹配 TypeScript 文件编辑
- `"Bash(rm *)"` 仅匹配 rm 开头的命令

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

`if` 仅在工具事件上有效（PreToolUse、PostToolUse、PostToolUseFailure、PermissionRequest、PermissionDenied），其他事件上设置了 `if` 的 hook 永远不会运行。

### 2.6 MCP 工具的 Hook 配置

MCP（一种让 AI 连接外部工具的标准协议）服务器的工具在 Hook 中被视为普通工具，命名格式是 `mcp__<server>__<tool>`。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__memory__.*",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Memory operation: '$(jq -r '.tool_name') >> ~/mcp-operations.log"
          }
        ]
      },
      {
        "matcher": "mcp__.*__write.*",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-mcp-write.sh"
          }
        ]
      }
    ]
  }
}
```

- `mcp__memory__.*` 匹配 Memory 服务器的所有工具
- `mcp__.*__write.*` 匹配任何服务器中包含 "write" 的工具
- 配置方式与内置工具完全一致，matcher 依然是正则表达式

### 2.7 Elicitation：MCP 服务器主动询问用户

当 MCP 服务器在工具执行中途需要用户输入时（比如填写表单、确认身份验证），Claude Code 默认弹出交互式对话框。通过 `Elicitation` 和 `ElicitationResult` 两个事件，你的 hook 可以**以编程方式自动响应**，完全跳过对话框。

- `Elicitation` 事件：MCP 服务器发起询问时触发，hook 可返回 `accept/decline/cancel`
- `ElicitationResult` 事件：用户响应后、结果发回 MCP 服务器前触发，hook 可修改或阻止响应

matcher 匹配 MCP 服务器名称。form 模式下 `requested_schema` 字段包含表单结构，URL 模式下提供 `url` 字段用于浏览器认证。

### 2.8 Skills 和代理中的 Hooks

除了在 settings.json 中定义 hooks，还可以**直接在 Skills 和 subagents 的 frontmatter 中定义 hooks**。这些 hooks 的作用范围限于组件的生命周期——组件活跃时运行，完成后自动清理。

对于 subagents，`Stop` hooks 会自动转换为 `SubagentStop`，因为这才是子代理完成时触发的事件。

```yaml
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

---

## 三、hippo 的实战经验

> 💬 hippo：以下是我实际在用的 Hook 配置和踩坑经验。

### 3.1 为什么我喜欢 Hooks

把安全规则写在 CLAUDE.md 里，Claude 可能忘记；但用 Hook 拦截，是 100% 执行的。

举个例子：我想阻止 `rm -rf`。
- 写在 CLAUDE.md：遵守率约 70%（Claude 可能"忘记"）
- 用 Hook 拦截：100%（物理屏障）

**对于安全规则，确定性胜过概率性。**

### 3.2 我实际在用的 Hook 配置

以下是我博客项目 `.claude/settings.json` 中的真实配置（已简化）：

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
      },
      {
        "matcher": "Bash(git commit:*)",
        "hooks": [
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR && hexo clean && hexo generate 2>&1 | tail -5 || { echo 'Hexo 构建失败，禁止提交' >&2; exit 2; }"
          }
        ]
      }
    ],
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
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/screenshot-hook.sh"
          }
        ]
      }
    ]
  }
}
```

解释一下每个 Hook 的作用：
- **PreToolUse Bash**：拦截 `rm -rf`、`git push --force` 等危险命令
- **PreToolUse git commit**：提交前自动运行 `hexo generate`，构建失败就阻止提交
- **Stop**：任务完成后发送桌面通知 + 飞书通知（两个 Hook 并行执行）
- **PostToolUse Write|Edit**：文件写入后自动截图验证博客渲染效果

**Hook vs Skill 的选择：**

| 场景 | 用 Hook | 用 Skill |
|------|---------|---------|
| 安全规则（不可绕过） | 是 | 否 |
| 提交前强制测试 | 是 | 否 |
| 写作规范检查 | 否 | 是 |
| 发布流程定义 | 否 | 是（触发点可以用 Hook） |

### 3.3 一个重要原则：Block-at-submit, not block-at-write

让 Claude 把计划做完，在 `git commit` 这个最终关卡统一验收，而不是每次文件编辑都打断它。

原因很简单：Claude 完成一个任务可能需要编辑 5-10 个文件，如果在每次 `Write` 或 `Edit` 后都跑完整构建验证，不仅慢，还会打断它的工作流。不如让 Claude 做完所有修改，到 `git commit` 时一次性验证。

---

## 四、常见问题

**Q: Hook 脚本放在哪里？**
A: 推荐放在 `.claude/hooks/` 目录下，用 `"$CLAUDE_PROJECT_DIR"/.claude/hooks/xxx.sh` 引用。注意路径加引号，防止有空格。

**Q: 多个 Hook 会按什么顺序执行？**
A: 所有匹配的 Hook **并行执行**，相同命令自动去重（按命令字符串去重）。

**Q: Hook 执行超时怎么办？**
A: 命令 Hook 默认 600 秒超时，可以在配置中指定更短的 `timeout`：

```json
{
  "type": "command",
  "command": "long-running-script.sh",
  "timeout": 120
}
```

超时后 Hook 会被取消，视为非阻塞错误，Claude 继续执行。

**Q: 如何调试 Hook？**
A: 用 `claude --debug` 启动，查看 Hook 执行日志（匹配了哪些 Hook、退出码、输出内容）。也可以用 `Ctrl+O` 切换详细模式查看实时进度。

**Q: 配置修改后不生效？**
A: Claude Code 启动时会快照配置。直接编辑 settings.json 后，通常会被文件监视器自动拾取。如果没有生效，在 Claude Code 中输入 `/hooks` 打开 Hook 浏览器确认配置状态。

---

## 五、安全注意事项

Hooks 执行任意 shell 命令，使用风险自担。官方文档给出了 5 条安全最佳实践：

1. **验证和清理输入**：永远不要盲目信任 stdin 的 JSON 数据
2. **始终引用 shell 变量**：用 `"$VAR"` 而不是 `$VAR`
3. **阻止路径遍历**：检查文件路径中是否包含 `..`
4. **使用绝对路径**：用 `"$CLAUDE_PROJECT_DIR"` 引用项目脚本
5. **跳过敏感文件**：避免在 Hook 中处理 `.env`、`.git/`、密钥等

临时禁用所有 Hook 可以在设置文件中加 `"disableAllHooks": true`。企业管理员可以用 `allowManagedHooksOnly` 阻止用户和项目级 Hook。

---

## 六、小结

Hooks 是 Claude Code 的确定性守卫机制——写在 CLAUDE.md 里的规则 Claude 可能忘记，但 Hook 是 100% 执行的。掌握 26 种事件类型、4 种 hook 类型（command/http/prompt/agent）、2 种输出方式（退出码和 JSON）、if 字段的二次过滤、以及配置结构，你就拥有了让 Claude Code "聪明又安全" 的能力。

**下一篇**：[创建自定义 subagents](/2026/03/19/ai-tools/official-docs/sub-agents/) -- 如何创建独立上下文的子代理。

---

## 实战案例

[Claude Code Hooks 实战: 任务完成自动通知](/2026/03/25/ai-tools/claude-code-hooks-practice/) -- 用 Stop Hook 实现桌面通知和飞书通知，包含完整的踩坑记录。

---

*本文精读自 [Hooks 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/hooks)*

*最后更新：2026-04-08*
