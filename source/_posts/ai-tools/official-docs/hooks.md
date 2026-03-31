---
title: 精读官方文档：Hooks 参考
date: 2026-03-27 11:00:00
updated: 2026-03-31 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
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

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 处理程序类型：`command`、`http`、`prompt`、`agent` |
| `command` | string | 是（command 类型） | 要执行的 shell 命令 |
| `matcher` | string | 否 | 正则表达式，过滤何时触发。`"*"` 或空匹配所有 |
| `timeout` | number | 否 | 超时秒数。命令默认 600，提示默认 30，代理默认 60 |
| `async` | boolean | 否 | `true` 则后台运行不阻塞（仅 command 类型） |
| `statusMessage` | string | 否 | hook 运行时显示的自定义加载消息 |

**matcher 匹配规则：** matcher 是正则表达式字符串。`"Bash"` 精确匹配 Bash 工具，`"Edit|Write"` 匹配编辑或写入，`"mcp__.*"` 匹配所有 MCP 工具，`"*"` 或留空匹配一切。

用 `$CLAUDE_PROJECT_DIR` 环境变量引用项目根目录的脚本，这样不管工作目录怎么变，路径都不会出错。

### 2.2 Hook 事件详解

Claude Code 支持 20+ 种 Hook 事件，覆盖从会话启动到结束的完整生命周期。下面是最常用的事件：

| 事件 | 触发时机 | 需要 matcher | 可阻止 | 典型用途 |
|------|---------|-------------|--------|---------|
| `SessionStart` | 会话开始或恢复 | 否（可选：startup/resume） | 否 | 注入上下文、设置环境变量 |
| `PreToolUse` | 工具执行前 | 是（工具名） | 是 | 拦截危险命令、自动审批 |
| `PostToolUse` | 工具执行后 | 是（工具名） | 否（可反馈） | 运行测试、日志记录 |
| `Notification` | 需要用户注意时 | 否（可选：通知类型） | 否 | 发送桌面/飞书通知 |
| `Stop` | 主 agent 完成时 | 否 | 是 | 任务完成通知、质量检查 |
| `SubagentStop` | 子 agent 完成时 | 否（可选：代理类型） | 是 | 子任务完成检查 |
| `UserPromptSubmit` | 用户提交 prompt 前 | 否 | 是 | 注入上下文、过滤敏感词 |
| `PreCompact` | 压缩上下文前 | 否（可选：manual/auto） | 否 | 保存重要上下文 |
| `SessionEnd` | 会话结束时 | 否 | 否 | 清理、保存统计 |
| `PermissionRequest` | 权限对话框弹出时 | 是（工具名） | 是 | 自动批准/拒绝权限 |

不需要 matcher 的事件（如 Stop、SessionEnd）会在**每次出现时都触发**。如果你给它们加了 matcher，会被静默忽略。

### 2.3 Hook 输入：从 stdin 读取 JSON

所有命令 Hook 通过 **stdin 接收 JSON 数据**。你的脚本需要从 stdin 读取，然后用 `jq` 解析需要的字段。

通用字段包括：

| 字段 | 说明 |
|------|------|
| `session_id` | 当前会话标识符 |
| `transcript_path` | 对话 JSON 的路径 |
| `cwd` | 当前工作目录 |
| `hook_event_name` | 触发的事件名称 |

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

| Hook 事件 | 退出 2 效果 |
|-----------|------------|
| `PreToolUse` | **阻止工具调用**，不执行 |
| `UserPromptSubmit` | **阻止 prompt 处理**，从上下文删除 |
| `Stop` | **阻止停止**，Claude 继续工作 |
| `SubagentStop` | **阻止子 agent 停止** |
| `PermissionRequest` | **拒绝权限** |
| `PostToolUse` | 仅向 Claude 显示 stderr（工具已运行，无法阻止） |
| `Notification` | 仅向用户显示 stderr（通知已发送） |
| `SessionEnd` | 仅向用户显示 stderr（会话已结束） |

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

不同事件使用不同的决定字段。`PreToolUse` 用 `hookSpecificOutput.permissionDecision`（allow/deny/ask），`Stop` 用顶级 `decision: "block"`，`PostToolUse` 用顶级 `decision: "block"` + `reason`。

### 2.5 MCP 工具的 Hook 配置

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

Hooks 是 Claude Code 的确定性守卫机制——写在 CLAUDE.md 里的规则 Claude 可能忘记，但 Hook 是 100% 执行的。掌握 10+ 种事件类型、2 种输出方式（退出码和 JSON）、以及配置结构，你就拥有了让 Claude Code "聪明又安全" 的能力。

**下一篇**：[创建自定义 subagents](/2026/03/19/ai-tools/official-docs/sub-agents/) -- 如何创建独立上下文的子代理。

---

## 实战案例

[Claude Code Hooks 实战: 任务完成自动通知](/2026/03/25/ai-tools/claude-code-hooks-practice/) -- 用 Stop Hook 实现桌面通知和飞书通知，包含完整的踩坑记录。

---

*本文精读自 [Hooks 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/hooks)*

*最后更新：2026-03-31*
