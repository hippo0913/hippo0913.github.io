---
title: 精读官方文档：常见工作流程
date: 2026-03-19 17:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 8
description: 精读 Claude Code 常见工作流程文档，涵盖理解代码库、修复错误、重构、Plan Mode、会话管理等实用场景。
cover: https://picsum.photos/seed/claude-common-workflows/1920/1080
source_url: https://code.claude.com/docs/zh-CN/common-workflows

# 精读官方文档：常见工作流程
> 💬 hippo：这是《Claude Code 官方文档精读》系列的第八篇。这篇文章收集了日常开发中最常遇到的工作流程和解决方案，是实战经验的精华。
## 开篇：为什么工作流程重要
我见过两种开发者：
1. **探索式**——遇到问题就问 Claude，看它能做什么
2. **流程式**——知道 Claude 能解决什么问题，按正确的工作流程调用它
两种方式都能用，但第二种效率高得多。
**常见工作流程的价值**：
- 不用每次都解释上下文——直接按流程来
- 避免重复踩坑——复用已验证的方案
- 提升协作效率——团队共享工作流程
> 💬 hippo：这篇文章要讲的不是"Claude 能做什么"（那是功能概览），而是"怎么做最有效"（这是工作流程）。
## 核心工作流程
### 1. 理解新的代码库
**场景**：刚加入一个新项目或需要快速了解陌生代码。
**推荐流程**：
```bash
# 第一步：获取快速概览
"给我这个项目的整体架构，包括关键目录和它们的用途"
# 第二步：理解关键模块
"解释 src/auth 模块的工作原理，包括认证流程和依赖关系"
# 第三步：定位相关代码
"找到处理用户登录的所有代码文件"
```
> 💬 hippo：理解陌生代码的核心是"由大及小"——先看整体架构，再深入具体模块。
> 不要一开始就让 Claude 解释每个文件，那样会迷失在细节中。
### 2. 高效修复错误
**场景**：遇到错误消息，需要找到并修复。
# 第一步：让 Claude 定位错误源
[粘贴错误堆栈]
"找到这个错误的根本原因"
# 第二步：阅读相关代码
"阅读 src/api/user.ts，解释可能导致错误的地方"
# 第三步：提出修复方案
"修复这个错误，确保不会破坏现有功能"
# 第四步：运行测试验证
"运行测试确保修复有效"
> 💬 hippo：修复错误的关键是"先定位再修复"。
> Claude 可以很好地从堆栈信息追踪到代码位置，然后阅读代码找到根本原因。
### 3. 使用 Plan Mode 进行安全分析
**场景**：需要在修改代码前先理解影响范围。
**什么是 Plan Mode**：
Plan Mode 让 Claude 只使用只读操作分析代码库，提出计划供你批准。任何需要编辑的操作都会暂停，等待你的确认。
**何时使用 Plan Mode**：
- 多步骤实现——需要修改多个文件
- 代码探索——想在修改前彻底研究
- 交互式开发——想与 Claude 迭代方向
**如何启用**：
# 方法 1：在会话中切换
# 按 Shift+Tab 循环切换权限模式
# Normal → Auto-Accept → Plan
# 方法 2：启动时就进入
claude --permission-mode plan
# 方法 3：设置默认模式
# 在 ~/.claude/settings.json 中：
{
  "permissions": {
    "defaultMode": "plan"
  }
}
**示例工作流程**：
"我需要将认证系统从 session-based 迁移到 JWT-based。创建详细的迁移计划。"
# Claude 会分析当前实现，列出步骤：
# 1. 实现签名/验证逻辑
# 2. 更新登录端点
# 3. 实现刷新令牌
# 4. 迁移中间件
# ...
# 你可以继续问：
"如何处理向后兼容？"
# Claude 会调整计划。完成后：
"批准这个计划"
> 💬 hippo：Plan Mode 的强大之处在于"先规划后执行"。
> 你可以和 Claude 迭代计划，确保方向正确后再让它动手改代码。
### 4. 使用专门的 Subagents
**场景**：特定任务需要专门的 AI 能力或工具。
**可用的 Subagents**：
| Subagent | 适用场景 | 特点 |
|-----------|----------|------|
| **Explore** | 深度搜索代码库 | 只读工具，专注探索 |
| **Plan** | 规划复杂任务 | 只读分析，交互式审批 |
| **Bash** | 执行命令 | 专注终端操作 |
| **general-purpose** | 通用任务 | 全功能，默认选择 |
**使用方式**：
# 方式 1：在 Plan Mode 中自动使用
# Plan Mode 会自动使用 Plan subagent
# 方式 2：在 Skills 中指定
# 在 SKILL.md 的 frontmatter 中：
# agent: Explore
**示例场景**：
# 让 Explore 搜索特定代码模式
"使用 Explore subagent 查找所有数据库查询模式，包括未参数化的查询"
# 让 Plan 规划重构
"使用 Plan subagent 分析这个模块的重构方案，包括风险评估"
# 让 Bash 执行部署脚本
"使用 Bash subagent 运行部署流程，包括环境检查和回滚准备"
> 💬 hippo：Subagents 让你把不同类型的任务交给专门的专家。
> 就像你不会让 UI 设计师写后端代码——每个 Subagent 都有自己的"专长"。
## 进阶工作流程
### 5. 恢复和管理会话
**场景**：处理多个任务或功能时，需要在不同会话间切换。
**命令概览**：
# 启动时恢复
claude --continue    # 继续最近的会话
claude --resume      # 打开会话选择器
claude --from-pr 123  # 恢复特定 PR 的会话
# 会话中切换
/resume             # 打开会话选择器
# 管理当前会话
/name my-session     # 命名会话以便识别
/rewind            # 创建分叉（用于保存状态）
**会话选择器快捷键**：
| 按键 | 操作 |
|------|------|
| `↑` / `↓` | 导航会话 |
| `→` / `←` | 展开/折叠分组 |
| `Enter` | 恢复选中的会话 |
| `P` | 预览会话内容 |
| `R` | 重命名会话 |
| `/` | 搜索过滤 |
| `A` | 切换项目视图 |
| `B` | 过滤当前分支 |
> 💬 hippo：我的习惯是给每个会话起描述性的名字，比如 "fix-auth-bug-ENG-452"。
> 这样即使有多个会话，也能快速找到需要的一个。
### 6. 使用 Git Worktrees 并行工作
**场景**：同时处理多个任务，需要独立的代码库副本。
**为什么需要 Worktrees**：
- 每个会话有独立的代码副本，避免更改冲突
- 可以在独立分支上工作，同时共享相同的 git 历史
**创建和使用**：
# 方法 1：启动时创建 Worktree
claude --worktree feature-auth
# 创建 .claude/worktrees/feature-auth/ 和新分支
# 方法 2：在会话中要求
"在 worktree 中实现这个功能"
# Claude 会自动创建并切换
# 方法 3：手动创建（更多控制）
git worktree add ../project-bugfix bugfix-123
cd ../project-bugfix && claude
# 完成时清理
git worktree list
git worktree remove ../project-bugfix
**Worktree 清理行为**：
| 完成状态 | Worktree 处理 |
|----------|---------------|
| 无更改 | 自动删除目录和分支 |
| 有更改或提交 | 提示保留或删除 |
> 💬 hippo：并行 Worktree 让你可以同时处理多个功能而不互相干扰。
> 比如一个 Worktree 实现 feature，另一个修复 bug，第三个调研新需求。
### 7. 使用 Thinking Mode 处理复杂问题
**场景**：架构决策、复杂错误、需要深度推理的任务。
**什么是 Thinking Mode**：
Thinking Mode 让 Claude 在响应前有更多空间进行内部推理。推理过程在详细模式中可见（按 `Ctrl+O` 切换）。
**配置方式**：
| 配置方式 | 命令 | 说明 |
|----------|------|------|
| **努力级别** | `/model` 或 `CLAUDE_CODE_EFFORT_LEVEL` | 控制 Opus 4.6 和 Sonnet 4.6 的思考深度：低/中/高 |
| **单次高努力** | 在提示中包含 `ultrathink` | 为当前轮设置高努力 |
| **切换开关** | `Option+T` (mac) 或 `Alt+T` (win/linux) | 切换思考开/关 |
| **全局默认** | `/config` | 设置所有项目的默认值 |
**使用建议**：
# 复杂架构决策（高努力）
"设计一个支持多租户的认证系统架构。ultrathink"
# 挑战性调试（高努力）
"这个错误只在生产环境出现，本地无法复现。ultrathink 找到可能原因。"
# 多步骤实现规划（高努力）
"规划将单体应用迁移到微服务的路径。ultrathink 考虑渐进式迁移策略。"
# 日常任务（低或中努力）
"解释这个函数的工作原理"
# 不需要 ultrathink，用默认努力级别即可
> 💬 hippo：Thinking Mode 不是"越多越好"——要在需要深度推理时用高努力，日常任务用默认即可。
> 这样既保证复杂问题的质量，又不会浪费日常任务的时间。
### 8. 集成到构建和脚本
**场景**：将 Claude Code 作为工具集成到你的开发流程。
**添加到 package.json**：
```json
  "scripts": {
    "lint:claude": "claude -p 'you are a linter. check recent changes vs main for typos, unused imports, and style issues. report in a concise format: filename:line - issue'",
    "review:code": "claude -p 'review the changes in this pull request. focus on correctness, readability, and potential bugs. be concise.'",
    "analyze:perf": "claude -p 'analyze performance bottlenecks in this codebase. use profile data if available.'"
# 代码审查
npm run lint:claude
# PR 审查
npm run review:code
# 性能分析
npm run analyze:perf
**管道处理**：
# 处理构建错误
cat build-error.txt | claude -p '解释这个构建错误的根本原因，给出修复建议' > error-analysis.txt
# 处理日志
cat server.log | claude -p '分析这些日志，找出异常模式和潜在问题' > log-analysis.md
# 批量处理文件
find . -name "*.test.ts" -exec claude -p '为 {} 写测试用例，覆盖边界情况' \;
> 💬 hippo：把 Claude 集成到脚本中，可以创建自动化的开发工具链。
> 比如每次提交前自动 lint，每次部署前自动审查。
## hippo 的踩坑实录
### 坑点 1：不理解代码库就急着改
**表现**：
让 Claude 修改代码，但因为理解偏差改错了地方。
**原因**：
跳过了"探索"阶段，直接进入了"修改"阶段。
**解决**：
1. 先用只读操作理解代码结构
2. 确认理解正确后再动手修改
3. 使用 Plan Mode 在修改前审查计划
> 💬 hippo：记住这个顺序——探索 → 理解 → 计划 → 修改 → 测试。
> 跳过任何一环都可能导致错误。
### 坑点 2：不命名会话导致混乱
多个会话都显示为初始提示，找不回需要的一个。
没有给会话起描述性的名字。
# 每次开始任务时命名
/name implement-user-auth
# 描述性命名格式：
# [任务类型]-[具体内容]-[相关标识]
# 例如：
# - feature-user-profile-ENG-123
# - fix-login-timeout-PROD-456
# - refactor-api-cache-v2
> 💬 hippo：好名字能让你快速识别会话内容，节省翻找时间。
### 坑点 3：滥用高努力模式
连简单问题都用 `ultrathink`，导致响应缓慢，浪费 token。
Thinking Mode 用错地方——高努力只用于需要深度推理的场景。
- 简单查询：用默认努力
- 代码解释：用默认努力
- 架构设计：用高努力 (`ultrathink`)
- 复杂调试：用高努力 (`ultrathink`)
> 💬 hippo：一个简单的判断——"这个问题需要推理 5 分钟吗？"
> 如果不需要，默认努力就够；如果需要，再用高努力。
### 坑点 4：Worktree 使用完不清理
多个未清理的 Worktree 占用大量磁盘空间。
退出会话时没有明确删除 Worktree。
# 定期检查 Worktrees
# 清理不需要的
git worktree remove ../project-feature-a
git worktree remove ../project-bugfix-123
# 或者在会话中让 Claude 清理
"清理所有不需要的 worktrees"
> 💬 hippo：Clean Up 是个好习惯，但记得先把有用的更改合并到主分支。
### 最佳实践总结
1. **新项目**：先探索架构，再深入模块
2. **修复错误**：定位 → 阅读 → 修复 → 测试
3. **复杂任务**：使用 Plan Mode 先规划
4. **并行工作**：用 Worktrees 隔离任务
5. **复杂推理**：适当使用 Thinking Mode 高努力
6. **会话管理**：命名会话，善用 resume
7. **工具集成**：把 Claude 集成到脚本和工作流
## 常见问题解答
**Q: Normal Mode、Auto-Accept Mode、Plan Mode 有什么区别？**
A: Normal Mode 需要你批准每次编辑；Auto-Accept Mode 自动接受所有编辑；Plan Mode 只用只读操作分析，不进行任何编辑。
**Q: 什么时候用哪个 subagent？**
A: Explore 用于代码搜索和理解，Plan 用于规划任务，Bash 用于终端操作，general-purpose 用于通用任务。
**Q: Thinking Mode 的努力级别怎么选？**
A: 简单任务用低/中，需要深度推理的复杂任务用高（`ultrathink`）。
**Q: Worktree 和 Git 分支有什么不同？**
A: Git 分支共享工作目录，Worktree 创建独立的工作目录。多个 Worktree 可以在多个分支上同时工作，不会互相干扰。
**Q: 可以让 Claude 在后台运行任务吗？**
A: 可以。某些 Skills 和 subagents 支持后台执行，使用 `run_in_background` 参数。
## 延伸阅读
- 相关文档：[Claude Code 如何工作](https://code.claude.com/docs/zh-CN/how-claude-code-works)
- 参考资料：[最佳实践](https://code.claude.com/docs/zh-CN/best-practices)
**上一篇**：[精读官方文档：Claude Code 最佳实践](/ai-tools/official-docs/best-practices/)
**下一篇**：[精读官方文档：Claude 如何记住你的项目](/ai-tools/official-docs/memory/)
*本文精读自 [精读官方文档：常见工作流程 - Claude Code Docs](https://code.claude.com/docs/zh-CN/common-workflows)*
