---
title: 精读官方文档：Hooks 参考
date: 2026-03-20 14:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 11
description: 精读 Claude Code Hooks 文档，了解如何配置和使用 Hooks 自动化工作流。
cover: https://picsum.photos/seed/claude-hooks/1920/1080
source_url: https://code.claude.com/docs/zh-CN/hooks

# 精读官方文档：Hooks 参考
> 💬 hippo：这篇文档我反复看了好几遍，因为 Hooks 是 Claude Code 中最强大的自动化功能，掌握了它，就像给你的 AI 助手装上了自动挡！
## 开篇：为什么要懂 Hooks？
Hooks 是用户定义的 shell 命令、HTTP 端点或 LLM 提示，在 Claude Code 生命周期中的特定点自动执行。
简单来说，Hooks 就像是给 Claude Code 设定的"自动触发器"。比如：
- 每次 Claude 要执行 `rm -rf` 命令前，先检查一下安全性
- 每次修改文件后，自动运行代码检查
- 在会话开始时，自动加载项目相关的环境变量
官方文档说得好："如果您是第一次设置 hooks，请改为从指南开始。"但作为一个已经踩过很多坑的人，我建议直接啃这份参考文档，里面全是干货。
<!-- more -->
## 核心概念：Hooks 是怎么工作的？
### Hook 生命周期
Claude Code 在会话期间的特定点触发 Hooks。官方文档列出了 18 个事件，我来给你挑几个最常用的：
| 事件 | 什么时候触发 | 有啥用 |
|------|------------|--------|
| `SessionStart` | 会话开始或恢复 | 加载开发上下文、设置环境变量 |
| `PreToolUse` | 工具调用执行前 | 阻止危险操作、修改工具输入 |
| `PostToolUse` | 工具成功执行后 | 运行测试、代码格式化 |
| `Stop` | Claude 完成响应时 | 质量检查、验证任务完成 |
### Hooks 的三要素
配置 Hooks 时有三个嵌套级别：
1. **事件选择**：选择要响应的事件，如 `PreToolUse` 或 `Stop`
2. **匹配器过滤**：添加匹配器组来过滤何时触发，比如"仅针对 Bash 工具"
3. **处理程序定义**：定义一个或多个 hook 处理程序在匹配时运行
> 💬 hippo：这三层结构像漏斗一样，一步步精确控制 Hooks 何时触发。
### Hooks 的四种类型
官方文档定义了四种 Hook 类型：
1. **命令 hooks**（`type: "command"`）：运行 shell 命令，最常用
2. **HTTP hooks**（`type: "http"`）：发送 HTTP POST 请求到外部服务
3. **提示 hooks**（`type: "prompt"`）：向 Claude 模型发送提示进行评估
4. **代理 hooks**（`type: "agent"`）：生成可以使用工具的 subagent 来验证条件
## 实战指南：手把手教你用 Hooks
### 场景一：阻止危险的删除命令
这是官方文档给出的经典例子，防止误操作。
**步骤 1：创建 Hook 脚本**
在项目目录下创建 `.claude/hooks/block-rm.sh`：
```bash
#!/bin/bash
# .claude/hooks/block-rm.sh
COMMAND=$(jq -r '.tool_input.command')
if echo "$COMMAND" | grep -q 'rm -rf'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Destructive command blocked by hook"
    }
  }'
else
  exit 0  # 允许命令执行
fi
```
**步骤 2：配置 Hooks**
在 `.claude/settings.json` 中添加：
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
**步骤 3：测试**
现在如果 Claude Code 想执行 `Bash "rm -rf /tmp/build"`，Hook 会拦截并阻止这个操作。
> 💬 hippo：这个配置我第一时间就用上了，因为真的担心 AI 手滑删文件！
### 场景二：文件修改后自动运行测试
这个场景适合开发中需要频繁测试的情况。
**步骤 1：创建异步测试脚本**
创建 `.claude/hooks/run-tests-async.sh`：
# run-tests-async.sh
# 从 stdin 读取 hook 输入
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
# 仅对源文件运行测试
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.js ]]; then
  exit 0
# 运行测试并通过 systemMessage 报告结果
RESULT=$(npm test 2>&1)
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "{\"systemMessage\": \"Tests passed after editing $FILE_PATH\"}"
  echo "{\"systemMessage\": \"Tests failed after editing $FILE_PATH: $RESULT\"}"
记得给脚本执行权限：`chmod +x .claude/hooks/run-tests-async.sh`
**步骤 2：配置异步 Hook**
    "PostToolUse": [
        "matcher": "Write|Edit",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/run-tests-async.sh",
            "async": true,
            "timeout": 300
**步骤 3：享受自动化**
现在每次你修改 TypeScript 或 JavaScript 文件，测试会在后台自动运行，Claude Code 继续工作，测试结果会在下一次对话时反馈给你。
> 💬 hippo：异步 Hook 真的太爽了，不会打断 Claude 的工作节奏，又能及时发现问题。
## hippo 的踩坑实录
### 坑点一：退出代码搞不清楚
一开始我以为退出代码 1 就是阻止，结果完全错了！
**问题**：我写了个 Hook，退出代码 1 想要阻止操作，结果没生效。
**原因**：官方文档说得很清楚：
- 退出代码 0：成功，Claude 会解析 stdout 的 JSON
- 退出代码 2：阻止错误，Claude 会显示 stderr 并阻止操作
- 其他代码：非阻止错误，执行继续
**解决方案**：把 `exit 1` 改成 `exit 2`：
# ❌ 错误写法
if [[ "$command" == rm* ]]; then
  echo "Blocked" >&2
  exit 1
# ✅ 正确写法
  exit 2
> 💬 hippo：这个坑我踩了好几次，后来专门做了个退出代码对照表贴在显示器旁边。
### 坑点二：匹配器语法搞错
我想匹配多个工具时，一开始写成了 `Bash,Edit`，结果只有第一个生效。
**问题**：想让 Hook 在 Bash 或 Edit 工具调用时触发，但只有 Bash 触发了。
**原因**：匹配器使用的是正则表达式，`Bash,Edit` 只匹配 `Bash,Edit` 这个完整字符串，不是匹配两个。
**解决方案**：使用 `|` 操作符进行正则或匹配：
// ❌ 错误写法
"matcher": "Bash,Edit"
// ✅ 正确写法
"matcher": "Bash|Edit"
> 💬 hippo：正则表达式的基础真的很重要，我专门花了个周末恶补了一下。
## 常见问题解答
**Q: Hook 配置修改后为什么不立即生效？**
A: 官方文档说得好："Claude Code 在启动时捕获 hooks 的快照，并在整个会话中使用它。"这意味着你需要重启会话才能让新配置生效。或者使用 `/hooks` 菜单来审查和应用更改。
**Q: 可以禁用单个 Hook 吗？**
A: 没办法。官方文档明确说："没有办法在保持 hook 在配置中的同时禁用单个 hook。"你只能禁用所有 hooks（`"disableAllHooks": true`）或删除特定 hook。
**Q: 异步 Hook 能阻止操作吗？**
A: 不能。异步 Hook 无法返回决定控制，因为它触发时操作已经完成了。异步 Hook 主要用于日志记录、测试运行等不影响主流程的场景。
**Q: Hooks 支持哪些事件？**
A: 官方文档列出了 18 个事件，但我建议重点关注这几个：
- `SessionStart`：初始化环境
- `PreToolUse`：安全检查
- `PostToolUse`：质量检查
- `Stop`：完成验证
**Q: 如何调试 Hooks？**
A: 使用 `claude --debug` 模式，可以看到详细的 Hook 执行信息。也可以使用 `Ctrl+O` 切换到详细模式查看 Hook 输出。
**上一篇**：[精读官方文档：使用 skills 扩展 Claude](/ai-tools/official-docs/skills/)
**下一篇**：[精读官方文档：创建自定义 subagents](/ai-tools/official-docs/sub-agents/)
*本文精读自 [精读官方文档：Hooks 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/hooks)*
