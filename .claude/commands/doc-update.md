# 文章更新编排器（PEE 模式）

基于官方文档最新版本，对现有博客文章执行针对性更新。每次更新由三个独立 Agent 完成（Plan → Execute → Evaluate），上下文不累积。

## 用法

```
/doc-update                              # 更新下一篇待处理文章
/doc-update hooks.md                     # 更新指定文章
/doc-update all                          # 更新所有待处理文章
/doc-update status                       # 查看当前进度
```

## 参数

- 第一个参数: 文章名、`all`（全部）、`status`（查看进度）、或留空（下一篇）

---

## 执行流程

### 第零步：加载配置

1. 读取评分配置 `.claude/scoring/profiles/official-doc.yaml`
2. 如果是 `status` 命令，读取进度文件并展示，然后停止
3. 读取进度文件 `.claude/scoring/progress/doc-update.json`
4. 如果进度文件不存在，初始化空进度文件

### 第一步：确定目标文章

- **指定文章名**: 在 `source/_posts/ai-tools/official-docs/` 目录下查找匹配的文件
- **all**: 处理所有 `status=pending` 的文章
- **留空**: 取第一篇 `status=pending` 的文章

### 第二步：PEE 循环

对每篇文章，执行以下循环（最多 2 次迭代）：

#### 2.1 Plan（规划 + 差异分析）

调用 Update Planner Agent：
```
使用 Agent tool，subagent_type 为 "general-purpose"
prompt 中包含：
  - 文章路径
  - 上轮反馈（如有）
Agent prompt 文件：.claude/agents/update-planner.md
```

Planner 负责：
1. 读取博客文章，提取 `source_url`
2. WebFetch 获取官方文档最新内容
3. 对比章节结构、关键内容、代码示例
4. 输出结构化的变更计划 JSON（包含具体的 patches 列表）

#### 2.2 Execute（执行更新）

调用 Update Executor Agent：
```
使用 Agent tool，subagent_type 为 "general-purpose"
prompt 中包含：
  - 文章路径
  - Planner 输出的完整变更计划 JSON
Agent prompt 文件：.claude/agents/update-executor.md
```

Executor 负责：
1. 读取博客文章
2. 理解变更计划
3. 使用 **Edit** 工具逐一应用每个 patch（不是重写整篇）
4. 更新 front matter 的 `updated` 字段
5. 更新文末"最后更新"日期
6. 输出变更摘要

**关键：Executor 使用 Edit 而非 Write，只改需要改的部分。**

#### 2.3 Evaluate（验证更新）

调用 Evaluator Agent（复用现有 evaluator）：
```
使用 Agent tool，subagent_type 为 "general-purpose"
prompt 中包含：
  - 文章路径
  - 变更计划（用于核对是否全部应用）
  - 量化评分报告（先运行评分脚本获取）
Agent prompt 文件：.claude/agents/update-evaluator.md
```

Evaluator 负责：
1. 核对变更计划中的每项是否已正确应用
2. 检查更新是否引入了新问题（格式错误、链接失效等）
3. 输出验证结果

#### 2.4 量化评分

运行评分脚本确认无回退：
```bash
node .claude/scoring/article-scorer.js --profile official-doc {file_path}
```

#### 2.5 判断

- **所有 patch 已应用且评分未回退**: 通过！继续下一篇
- **有未应用的 patch 或评分回退**: 将反馈传回 2.1，重新规划
- **迭代次数 >= 2**: 标记为 `needs-manual`，继续下一篇

### 第三步：输出进度报告

每篇文章完成后，更新进度文件并显示：
```
📄 hooks.md — 第1次迭代 — 5个变更已应用 ✅
   新增: agent hooks 事件类型、Elicitation 机制
   修改: hooks 配置示例
   评分: 85（无回退）
```

### 第四步：全部完成

所有文章处理完毕后，输出总结：
```
✅ 完成: 6篇更新成功, 1篇需人工介入, 1篇无变化跳过
📁 进度文件: .claude/scoring/progress/doc-update.json
```

---

## 进度文件格式

`.claude/scoring/progress/doc-update.json`:
```json
{
  "type": "doc-update",
  "lastUpdated": "2026-04-07T14:00:00Z",
  "summary": { "completed": 0, "needsManual": 0, "pending": 8, "skipped": 0 },
  "articles": [
    {
      "file": "source/_posts/ai-tools/official-docs/hooks.md",
      "status": "pending|completed|needs-manual|skipped",
      "changeLevel": "major|minor|none",
      "iterations": 0,
      "patchesApplied": 0,
      "patchesTotal": 0,
      "lastAttempt": null
    }
  ]
}
```

---

## 注意事项

- 每次迭代都是独立的 Agent 调用，**上下文不会累积**（这是 PEE 的核心）
- Executor **必须使用 Edit**，不使用 Write，避免丢失已有内容
- 如果 Planner 判断文章无需更新（changeLevel=none），直接标记 skipped
- 不要同时处理多篇文章，一篇完成后再处理下一篇
- 更新完成后自动 commit + push（遵循 CLAUDE.md 的发布流程）
