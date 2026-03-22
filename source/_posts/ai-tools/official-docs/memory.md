---
title: 精读官方文档：Claude 如何记住你的项目
date: 2026-03-12 20:09:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 9
description: 精读 Claude Code 记忆文档，了解 CLAUDE.md 项目配置、自动记忆机制、.claude/rules/ 规则系统等核心功能。
cover: https://picsum.photos/seed/claude-memory/1920/1080
source_url: https://code.claude.com/docs/zh-CN/memory
---

# 精读官方文档：Claude 如何记住你的项目

> 💬 hippo：这是《Claude Code 官方文档精读》系列的第九篇。记忆功能是 Claude Code 最容易被低估的能力之一——用好它，Claude 就像真正"懂"你的项目一样。

---

## 开篇：为什么记忆很重要

我见过两种极端：
1. **完全不配置**——每次对话都要解释一遍项目结构
2. **过度配置**——CLAUDE.md 写到 700 行，Claude 直接忽略后半部分

**正确的姿势**：理解两个记忆系统，按需配置，让 Claude 自然积累知识。

Claude Code 有两个互补的记忆系统：

| 系统 | 谁创建 | 何时加载 | 适用场景 |
|------|---------|----------|---------|
| **CLAUDE.md** | 你编写 | 每次对话开始 | 项目规则、架构决策、编码标准 |
| **自动记忆** | Claude 自己写 | 每次对话（前 200 行） | 调试笔记、架构笔记、偏好 |

> 💬 hippo：记住这个区别——CLAUDE.md 是"指令"，自动记忆是"笔记"。
> 指令告诉 Claude **怎么做**，笔记记录 Claude **学到了什么**。

<!-- more -->

---

## 核心概念：用大白话讲清楚

### 1. CLAUDE.md - 项目级指令

**官方定义**：
CLAUDE.md 是 markdown 文件，为项目、你的个人工作流或整个组织提供持久指令。Claude 在每个会话开始时读取它们。

> 💬 hippo：用通俗的话说——CLAUDE.md 就是项目的"使用说明书"。
> 就像新员工入职时给你一本手册，告诉他怎么做事。

### CLAUDE.md 的加载优先级

Claude Code 按以下优先级加载 CLAUDE.md：

```
1. ~/.claude/CLAUDE.md              # 用户级（所有项目）
2. ~/.claude/rules/*.md              # 用户级规则
3. ./CLAUDE.md 或 ./.claude/CLAUDE.md  # 项目级
4. ./.claude/rules/*.md               # 项目级规则
5. ./CLAUDE.md                       # 工作目录级
6. 子目录中的 CLAUDE.md            # 按需加载
```

> 💬 hippo：越具体的位置优先级越高。项目级规则会覆盖用户级。

### 2. 自动记忆 - Claude 的笔记本

**官方定义**：
自动记忆让 Claude 在您不编写任何内容的情况下跨会话积累知识。Claude 在工作时为自己保存笔记。

> 💬 hippo：就像你工作时有个"笔记本"，Claude 随手记录它学到的东西。
> 比如它发现这个项目有个特殊构建命令，就写进自动记忆。

### 自动记忆的存储位置

每个项目在 `~/.claude/projects/<project>/memory/` 获得自己的记忆目录：

```
~/.claude/projects/
└── my-project/
    └── memory/
        ├── MEMORY.md          # 索引文件（前 200 行）
        ├── debugging.md       # 调试笔记
        ├── api-conventions.md # API 设计决策
        └── ...              # Claude 创建的其他笔记
```

> 💬 hippo：记忆是项目本地的，不是全局的。
> 同一个 git 仓库的所有工作树共享同一个记忆目录。

---

## 实战指南：手把手教你用

### 场景 1：创建项目级 CLAUDE.md

**问题背景**：
你的项目有特殊的构建流程、测试要求，每次 Claude 都要问一遍。

**解决步骤**：

1. **创建 CLAUDE.md 文件**
   ```bash
   cd your-project
   touch CLAUDE.md
   ```

2. **编写核心规则**
   ```markdown
   # 项目名 - Claude 指南

   ## 构建和测试
   - 构建：`yarn build`
   - 测试：`yarn test`
   - 提交前必须测试通过

   ## 代码规范
   - 使用 2 空格缩进
   - 单引号优先于双引号
   - 每个文件不超过 300 行

   ## 关键目录
   - src/ - 源代码
   - tests/ - 测试文件
   - docs/ - 文档
   ```

3. **保持简洁（建议 200 行以内）**

> 💬 hippo：CLAUDE.md 每次对话都完整加载，太长会被"忽略"。
> 我的经验是——200 行以内，重点突出，细节可以放 .claude/rules/ 或自动记忆。

**预期效果**：
Claude 每次对话开始时就知道构建、测试和代码规范。

### 场景 2：使用 .claude/rules/ 组织复杂项目

**问题背景**：
项目越来越大，单一 CLAUDE.md 文件难以维护。

**解决步骤**：

1. **创建规则目录**
   ```bash
   mkdir -p .claude/rules
   ```

2. **按主题拆分规则文件**
   ```bash
   # API 规则
   .claude/rules/api-design.md
   .claude/rules/security.md
   .claude/rules/testing.md

   # 前端规则
   .claude/rules/frontend/code-style.md
   .claude/rules/frontend/testing.md
   ```

3. **使用 paths 字段限定范围**
   ```markdown
   ---
   paths:
     - "src/api/**/*.ts"
   ---

   # API 开发规则
   - 所有 API 端点必须包括输入验证
   - 使用标准错误响应格式
   - 包括 OpenAPI 文档注释
   ```

> 💬 hippo：有 paths 的规则只在匹配文件时加载，不是每次都加载。
> 这样可以避免"噪音"，减少不必要的上下文。

**预期效果**：
Claude 处理不同类型文件时，只加载相关的规则，上下文更精准。

### 场景 3：启用和管理自动记忆

**问题背景**：
你想让 Claude 自动记住调试过程中发现的知识。

**解决步骤**：

1. **启用自动记忆**
   在会话中输入：
   ```
   /memory
   ```
   或在项目设置中启用：
   ```json
   {
     "autoMemoryEnabled": true
   }
   ```

2. **查看和管理记忆**
   - 运行 `/memory` 查看所有记忆文件
   - 点击文件名在编辑器中打开
   - 删除不需要的笔记

3. **手动添加笔记**
   在会话中告诉 Claude：
   ```
   记住这个：项目使用 pnpm 而不是 npm
   ```

   Claude 会将这条记录保存到自动记忆中。

**预期效果**：
Claude 会自动积累项目知识，下次遇到类似问题时能直接调用。

---

## hippo 的踩坑实录

### 坑点 1：CLAUDE.md 太长导致不被遵守

**表现**：
写了 500 行的 CLAUDE.md，但后面的规则经常被忽略。

**原因**：
CLAUDE.md 完整加载，但消耗太多 context token，Claude 会选择性忽略。

**解决**：
1. 保持 CLAUDE.md 在 200 行以内
2. 详细内容拆分到 .claude/rules/ 或自动记忆
3. 只保留"必须遵守"的核心规则

> 💬 hippo：记住——CLAUDE.md 是"上下文"，不是"文档"。
> 如果你想记录知识，放自动记忆；如果你想放规则，用 .claude/rules/。

### 坑点 2：项目级 CLAUDE.md 被用户级覆盖

**表现**：
在项目根目录创建了 CLAUDE.md，但用户级配置还在生效。

**原因**：
加载优先级：用户级 > 项目级

**解决**：
1. 项目配置放在 `./.claude/CLAUDE.md`
2. 或使用 `claudeMdExcludes` 排除用户级配置
3. 明确区分：用户级是个人偏好，项目级是团队标准

> 💬 hippo：这个设计很合理——个人偏好不应该影响团队标准。
> 但要理解优先级，避免预期之外的覆盖。

### 坑点 3：自动记忆不知道保存了什么

**表现**：
Claude 记了一堆东西，但不知道具体内容。

**原因**：
没有查看和管理自动记忆的习惯。

**解决**：
```bash
# 查看记忆
/memory

# 打开记忆文件夹
open ~/.claude/projects/your-project/memory
```

定期查看和清理不需要的笔记。

### 最佳实践总结

1. **CLAUDE.md：指令，不超过 200 行**
2. **.claude/rules/：按主题组织，使用 paths 限定**
3. **自动记忆：知识积累，定期查看和清理**
4. **项目级配置：放在 .claude/ 而不是根目录，避免覆盖**

---

## 常见问题解答

**Q: CLAUDE.md 和自动记忆的区别是什么？**

A: CLAUDE.md 是你写的"指令"，告诉 Claude 怎么做；自动记忆是 Claude 自己写的"笔记"，记录它学到的东西。指令每次都加载，笔记根据相关性加载。

**Q: 什么时候用 CLAUDE.md，什么时候用自动记忆？**

A: CLAUDE.md 适用于"规则"（编码标准、工作流、架构决策）；自动记忆适用于"知识"（调试笔记、API 惯例、代码风格偏好）。

**Q: 可以禁用自动记忆吗？**

A: 可以。运行 `/memory` 切换开关，或在项目中设置 `autoMemoryEnabled: false`。也可以通过环境变量 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` 全局禁用。

**Q: 不同项目会共享自动记忆吗？**

A: 会。同一个 git 仓库的所有工作树和子目录共享一个自动记忆目录。不同 git 仓库有独立记忆。

---

## 延伸阅读

- 相关文档：[Skills 参考](https://code.claude.com/docs/zh-CN/skills)
- 参考资料：[Settings 参考](https://code.claude.com/docs/zh-CN/settings)

---

## 一句话总结

Claude Code 的记忆系统包含两层：CLAUDE.md 提供指令，自动记忆积累知识。理解加载优先级、控制长度、按主题组织，能让 Claude 真正"懂"你的项目。

**下一篇**：[使用 skills 扩展 Claude](/2026/03/12/ai-tools/official-docs/skills/)

---

*本文精读自 [Claude 如何记住您的项目](https://code.claude.com/docs/zh-CN/memory)*
