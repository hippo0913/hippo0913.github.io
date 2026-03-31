# 文章重写编排器（自动迭代）

通过评分驱动的自迭代循环重写文章。

## 用法

```
/doc-rewrite                          # 重写下一篇待处理文章（默认 official-doc profile）
/doc-rewrite hooks.md                 # 重写指定文章
/doc-rewrite --profile official-doc all   # 使用指定 profile 重写所有待处理文章
/doc-rewrite status                   # 查看当前进度
```

## 参数

- 第一个参数: 文章名、`all`（全部）、`status`（查看进度）、或留空（下一篇）
- `--profile <name>`: 评分配置名，默认 `official-doc`

---

## 执行流程

### 第零步：加载配置

1. 读取 `.claude/scoring/profiles/{profile}.yaml` 获取评分标准
2. 如果是 `status` 命令，读取进度文件并展示，然后停止
3. 读取进度文件 `.claude/scoring/progress/{profile}.json`
4. 如果进度文件不存在，扫描 `source/_posts/ai-tools/official-docs/*.md` 初始化

### 第一步：确定目标文章

- **指定文章名**: 在 official-docs 目录下查找匹配的文件
- **all**: 处理所有 `status=pending` 的文章
- **留空**: 取第一篇 `status=pending` 的文章

### 第二步：迭代循环

对每篇文章，执行以下循环（最多 `pass.maxIterations` 次）：

#### 2.1 规划

调用 Planner Agent：
```
使用 Agent tool，subagent_type 为 "general-purpose"
prompt 中包含：
  - 文章路径
  - profile 名称
  - source_instruction（从 profile 读取）
  - 上轮反馈（如有）
Agent prompt 文件：.claude/agents/planner.md（替换 {{}} 模板变量）
```

#### 2.2 执行

调用 Executor Agent：
```
使用 Agent tool，subagent_type 为 "general-purpose"
prompt 中包含：
  - 文章路径
  - planner 输出的写作计划 JSON
Agent prompt 文件：.claude/agents/doc-writer.md（替换 {{writing_plan}}）
```

#### 2.3 量化评分

运行评分脚本：
```bash
node .claude/scoring/article-scorer.js --profile {profile} {file_path}
```
解析输出的 JSON 报告。

#### 2.4 质性评估

调用 Evaluator Agent：
```
使用 Agent tool，subagent_type 为 "general-purpose"
prompt 中包含：
  - 文章路径
  - 量化评分报告 JSON
  - 评估维度（从 profile.qualitative.dimensions 读取）
Agent prompt 文件：.claude/agents/evaluator.md（替换 {{}} 模板变量）
```

#### 2.5 合并评分

```
quantWeight = profile.quantitative.weight  (如 0.3)
qualWeight = profile.qualitative.weight    (如 0.7)
finalScore = round(quantTotal * quantWeight + qualTotal * qualWeight)
```

#### 2.6 判断

- **finalScore >= pass.threshold**: 通过！记录结果，继续下一篇
- **finalScore < pass.threshold**: 将评分报告和改进建议作为反馈，回到 2.1 重新规划
- **迭代次数 >= maxIterations**: 标记为 `failed`，输出"需人工介入"，继续下一篇

### 第三步：输出进度报告

每篇文章完成后，更新进度文件并显示：
```
📄 hooks.md — 第2次迭代 — 最终得分 78.5 ✅
   量化: 85 | 质性: 75
   改进: 无
```

或：
```
📄 features-overview.md — 第1次迭代 — 得分 62.0 ❌
   量化: 65 | 质性: 60
   问题: 代码块不足, 内容深度不够
   → 进入第2次迭代
```

### 第四步：全部完成

所有文章处理完毕后，输出总结：
```
✅ 完成: 25篇通过, 2篇需人工介入, 1篇跳过
📊 平均分: 82.5
📁 进度文件: .claude/scoring/progress/official-doc.json
```

---

## 进度文件格式

`.claude/scoring/progress/{profile}.json`:
```json
{
  "profile": "official-doc",
  "config": { "passThreshold": 70, "maxIterations": 3 },
  "lastUpdated": "2026-03-31T14:00:00Z",
  "summary": { "completed": 25, "failed": 2, "pending": 1 },
  "articles": [
    {
      "file": "source/_posts/ai-tools/official-docs/hooks.md",
      "status": "completed|pending|failed",
      "iterations": 2,
      "scores": [ { "iter": 1, "final": 62 }, { "iter": 2, "final": 78.5 } ],
      "finalScore": 78.5,
      "lastAttempt": "2026-03-31T14:00:00Z"
    }
  ]
}
```

---

## 注意事项

- 每次迭代都是独立的 Agent 调用，上下文不会累积
- 如果 Agent 返回的内容无法解析为 JSON，提取有用信息作为反馈继续
- 评分脚本失败时（如文件不存在），跳过该文章并标记
- 不要同时处理多篇文章，一篇完成后再处理下一篇
