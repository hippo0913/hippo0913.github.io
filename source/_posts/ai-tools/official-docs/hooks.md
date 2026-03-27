---

## 十三、hippo 的实战心得
> 💬 hippo：以下是我配置 Hooks 过程中的体会。

### 13.1 为什么我喜欢 Hooks
把安全规则写在 CLAUDE.md 里， Claude 可能忘记；但用 Hook 拦截，是 100% 执行的。
举个例子：我想阻止 `rm -rf`。
- 写在 CLAUDE.md：遵守率约 70%（Claude 可能"忘记"）
- 用 Hook 拦截： 100%（物理屏障）
**对于安全规则，确定性胜过概率性。**
### 13.2 Hook vs Skill 的选择
| 场景 | 用 Hook | 用 Skill |
|------|---------|---------|
| 安全规则（不可绕过）| ✅ | ❌ |
| 提交前强制测试 | ✅ | ❌ |
| 写作规范检查 | ❌ | ✅ |
| 发布流程定义 | ❌ | ✅（触发点可以用 Hook）|
### 13.3 一个重要原则
**Block-at-submit, not block-at-write.**
让 Claude 把计划做完，在 `git commit` 这个最终关卡统一验收，而不是每次文件编辑都打断它。
---

## 十四、常见问题
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
Hooks 是 Claude Code 的"守门员"，在关键时机自动触发，强制执行你定义的规则。掌握 Hooks, 你就能让 Claude Code 在"聪明"的同时保持"安全"。
**下一篇**：[创建自定义 subagents](/2026/03/19/ai-tools/official-docs/sub-agents/) — 如何创建独立上下文的子代理。
---
## 实战案例
📖 [Claude Code Hooks 实战:任务完成自动通知](/2026/03/25/ai-tools/claude-code-hooks-practice/) — 用 Stop Hook 实现桌面通知和飞书通知，包含完整的踩坑记录。
---
*本文精读自 [Hooks 参考 - Claude Code Docs](https://code.claude.com/docs/zh-CN/hooks)*
*最后更新：2026-03-27*
