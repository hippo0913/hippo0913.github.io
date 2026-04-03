---
title: Claude Code CLI 实战速查手册
date: 2026-04-03 15:33:45
updated: 2026-04-03 15:33:45
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
series: claude-code
description: 按 8 大场景组织的 Claude Code CLI 命令速查，日常开发、脚本自动化、CI/CD 集成直接抄命令。基于 2.1.91 版本。
cover: https://picsum.photos/seed/claude-cli-cheatsheet/1920/1080
---

# Claude Code CLI 实战速查手册

> 💬 hippo：这篇是按场景组织的 CLI 命令速查手册。遇到具体需求，直接翻对应场景抄命令。想系统了解每个参数的原理，看 [精读官方文档：CLI 参考](/2026/03/04/ai-tools/official-docs/cli-reference/)。基于 Claude Code **2.1.91** 版本整理。

---

<!-- more -->

## 一、日常开发：五种启动方式

打开终端写代码，根据需求选启动方式：

```bash
# 1. 随便聊聊，探索代码
claude

# 2. 带着问题启动，直奔主题
claude "分析这个项目的认证模块"

# 3. 接着上次聊
claude -c

# 4. 恢复特定会话（需要之前用 -n 命名过）
claude -r "auth-refactor" "继续完成认证模块"

# 5. 快速提问就走
claude -p "这个函数干嘛的"
```

> **习惯建议**：给重要会话命名（`-n`），方便后续用 `-r` 恢复。例如 `claude -n "auth-refactor"`。

---

## 二、控制思考深度和模型选择

不同任务需要不同的"脑力投入"，简单问题用快模型省 token，复杂决策用强模型保质量。

```bash
# 简单查询，快速响应
claude -p --effort low "这个变量名合理吗"

# 日常开发（默认级别）
claude --effort medium

# 复杂重构，深度思考
claude --effort high "重构认证模块，确保向后兼容"

# 最强推理，用 Opus 开满
claude --model opus --effort max "分析这个微服务的拆分方案"
```

| effort 级别 | 适用场景 | 说明 |
|------------|---------|------|
| `low` | 快速问答、命名建议 | 快省 token |
| `medium` | 日常开发 | 默认值 |
| `high` | 重构、架构设计 | 深度思考 |
| `max` | 关键决策 | 仅 Opus 模型支持 |

---

## 三、权限控制：减少弹窗

本地开发被反复弹权限确认打断？按场景选策略。

```bash
# 预授权只读操作，日常开发基本不弹窗
claude --allowedTools "Bash(git log *)" "Bash(git diff *)" "Read" "Glob" "Grep"

# 只读审查模式，禁止编辑文件
claude --disallowedTools "Edit" "Write" "Bash(npm publish *)"

# Plan 模式 —— 只看不动，先出方案
claude --permission-mode plan

# 全自动（仅限 Docker/CI 等受控环境！）
claude --permission-mode bypassPermissions -p "批量重命名文件"
```

> **安全提醒**：`bypassPermissions` 会跳过所有安全确认，只在沙箱环境使用。

---

## 四、脚本集成：嵌入工具链

在 shell 脚本、Makefile、npm scripts 中调用 Claude，核心是用 `-p` 做非交互输出。

```bash
# 管道输入 + JSON 输出，方便 jq 解析
cat error.log | claude -p "分析根因" --output-format json | jq '.result'

# 限制轮次和预算，防止跑飞
claude -p --max-turns 3 --max-budget-usd 1.00 "review 这段代码"

# 结构化输出，用 JSON Schema 约束格式
claude -p --json-schema '{
  "type": "object",
  "properties": {
    "score": {"type": "number"},
    "issues": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["score", "issues"]
}' "给代码质量打分"

# bare 模式 —— 跳过 hooks/plugins/MCP，启动更快
claude --bare -p "生成 commit message"
```

| 输出格式 | 用途 | 说明 |
|---------|------|------|
| `text` | 终端显示 | 默认，人类可读 |
| `json` | 程序解析 | 完整结果，可 jq 提取 |
| `stream-json` | 实时流式 | 边生成边处理，适合长输出 |

---

## 五、CI/CD：完整命令模板

GitHub Actions、GitLab CI 里跑 Claude，核心要求：零交互、有兜底、可重试。

```bash
# CI 专用命令模板（直接抄）
claude -p \
  --output-format json \
  --max-turns 5 \
  --max-budget-usd 5.00 \
  --allowedTools "Bash(git log *)" "Bash(git diff *)" "Read" \
  --fallback-model sonnet \
  "检查代码质量，输出 JSON 报告"
```

逐行说明：
- `-p`：非交互，执行完退出
- `--output-format json`：结构化输出，CI 好解析
- `--max-turns 5`：最多 5 轮工具调用，防死循环
- `--max-budget-usd 5.00`：预算上限 5 美元，防跑飞
- `--allowedTools`：预授权只读工具，免弹确认
- `--fallback-model sonnet`：Opus 过载时自动降级到 Sonnet

**前置检查**：

```bash
# 确认登录状态（退出码 0 = 已登录）
claude auth status

# 健康检查
claude doctor

# CI 环境注入 MCP 配置（严格模式，只加载指定配置）
claude -p --mcp-config ./ci-mcp.json --strict-mcp-config "query"
```

---

## 六、并行开发：Worktree

同时处理多个任务（功能开发 + 紧急修复），需要互不干扰的隔离环境。

```bash
# 开一个隔离 worktree 做新功能
claude --worktree feature-auth

# 另开一个修 bug
claude --worktree hotfix-123

# 不指定名称，自动生成
claude --worktree

# 加额外目录上下文（比如共享库）
claude --worktree feature-auth --add-dir ../shared-libs
```

> **注意**：worktree 是独立目录，项目依赖需要重新安装。

---

## 七、自定义行为：系统提示和 MCP

让 Claude 按特定风格工作，或连接外部工具。

```bash
# 追加编码规范（推荐，保留内置能力）
claude --append-system-prompt "Always use TypeScript strict mode"

# 从文件加载团队规范
claude --append-system-prompt-file ./team-conventions.md

# 指定 MCP 配置文件
claude --mcp-config ./mcp-servers.json

# 严格模式：只用指定的 MCP，忽略其他配置
claude --mcp-config ./mcp.json --strict-mcp-config "query"

# 加载本地插件测试
claude --plugin-dir ./my-plugin
```

> **追加 vs 替换**：`--append-system-prompt` 保留 Claude Code 内置能力，推荐。`--system-prompt` 会替换整个系统提示，慎用。

---

## 八、调试排障

命令不工作、输出不对、需要看内部细节。

```bash
# 看完整思考过程
claude --verbose

# 调试模式，看底层 API 通信（可按类别过滤）
claude --debug -p "test"
claude --debug "api,hooks" -p "test"

# 调试日志写入文件
claude --debug-file ./claude-debug.log -p "test"

# 健康检查（检查自动更新、MCP 服务器等）
claude doctor

# 查看认证状态
claude auth status
```

| 命令 | 看什么 |
|------|--------|
| `--verbose` | Claude 的完整思考和工具调用过程 |
| `--debug` | 底层 API 请求/响应、hooks 触发 |
| `claude doctor` | 自动更新器、MCP 服务器健康状态 |
| `claude auth status` | 登录状态和认证方式 |

---

## 小结

一张表速查全部场景：

| 场景 | 核心命令 |
|------|---------|
| 日常开发 | `claude` / `claude -c` / `claude -p` |
| 控制深度 | `--effort` / `--model` |
| 权限控制 | `--allowedTools` / `--permission-mode` |
| 脚本集成 | `-p` + `--output-format json` |
| CI/CD | 模板命令 + `--fallback-model` |
| 并行开发 | `--worktree` |
| 自定义行为 | `--append-system-prompt` / `--mcp-config` |
| 调试排障 | `--verbose` / `--debug` / `claude doctor` |

参数原理和完整列表，参见 [精读官方文档：CLI 参考](/2026/03/04/ai-tools/official-docs/cli-reference/)。

---

*基于 Claude Code 2.1.91 版本整理。*
