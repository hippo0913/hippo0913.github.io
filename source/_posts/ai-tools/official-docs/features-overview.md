---
title: 精读官方文档：扩展 Claude Code
date: 2026-03-12 20:22:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 28
description: 精读 Claude Code 功能扩展概览，了解各种集成和扩展能力。
cover: https://picsum.photos/seed/claude-features/1920/1080
source_url: https://code.claude.com/docs/zh-CN/features-overview
---

# 精读官方文档：扩展 Claude Code

> 💬 hippo：这是 Claude Code 官方文档精读系列的一篇。

---

## 开篇：为什么需要扩展 Claude Code

Claude Code 本身已经很强了，它能推理代码、操作文件、执行命令、搜索网络。内置工具基本能满足大部分日常编程需求。

但就像瑞士军刀，基础功能好使，可总有些特殊场景需要定制。这时候就需要扩展能力了。

比如：
- 让 Claude 了解你项目的特殊约定
- 连接到你的内部服务
- 自动化一些重复的工作流
- 团队共享一些自定义技能

<!-- more -->

---

## 核心概念：扩展层是什么

Claude Code 的扩展系统就像一个插件生态，但更灵活。官方提供了多种扩展方式，插入到代理循环的不同部分：

### 七大扩展方式

1. **CLAUDE.md** - 给项目写"说明书"
   - 放在项目根目录的 markdown 文件
   - Claude 每次会话都会看到
   - 适合定义项目约定、命令规范

2. **Skills** - 可重用的技能包
   - 包含知识、工作流或说明的 markdown 文件
   - 用 `/skillname` 或 `/deploy` 调用
   - Claude 会自动识别并加载相关的 skills
   - 最灵活的扩展方式

3. **MCP (Model Context Protocol)** - 连接外部世界
   - 将 Claude 连接到外部服务和工具
   - 标准化的协议
   - 能让 Claude 访问数据库、API 等

4. **Subagents** - 独立的子代理
   - 在隔离的上下文中运行自己的循环
   - 处理完返回摘要
   - 适合需要独立思考的任务

5. **Agent Teams** - 团队协作模式
   - 协调多个独立会话
   - 共享任务 + 点对点消息传递
   - 适合复杂的多角色任务

6. **Hooks** - 确定性脚本
   - 完全在循环外运行
   - 比如文件变动触发某些操作
   - 不需要 AI 推理的自动化任务

7. **Plugins & Marketplaces** - 打包分发
   - 将上面的功能打包
   - 方便分享和安装
   - 类似 npm 或 VS Code 插件市场

> 💬 hippo：官方推荐初次使用从 **CLAUDE.md** 开始，根据需要再添加其他扩展。

---

## 实战指南：手把手教你用

### 场景一：给团队项目写 CLAUDE.md

**需求**：团队约定代码必须通过 ESLint，提交前要运行测试。

**操作步骤**：

```bash
# 1. 在项目根目录创建 CLAUDE.md
cat > CLAUDE.md << 'EOF'
# 项目约定

## 开发规范
- 所有代码必须通过 ESLint 检查
- 提交前必须运行测试：`npm test`
- 使用 Prettier 格式化代码

## 常用命令
- 开发服务器：`npm run dev`
- 构建：`npm run build`
- 测试：`npm test`
- 代码检查：`npm run lint`
- 格式化：`npm run format`

## Git 工作流
- 功能分支命名：`feature/功能描述`
- 提交信息格式：`类型: 简短描述`
EOF
```

**效果**：现在 Claude 会自动遵守这些约定，不会建议违反规范的代码。

### 场景二：创建一个可重用的 Skill

**需求**：团队经常需要创建 React 组件，希望有个标准模板。

**操作步骤**：

```bash
# 1. 创建 .claude/skills 目录
mkdir -p .claude/skills

# 2. 创建 React 组件模板 skill
cat > .claude/skills/react-component.md << 'EOF'
# React 组件模板

创建一个符合团队规范的 React 组件。

## 组件结构
```tsx
import React from 'react';

interface Props {
  // TODO: 定义 props
}

export const ComponentName: React.FC<Props> = (props: Props) => {
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
};

export default ComponentName;
```

## 注意事项
- 使用 TypeScript
- 使用函数组件 + Hooks
- 导出 props 类型接口
- 添加注释说明用法
```

# 3. 使用 skill
# 在对话中输入：
/react-component
```

**效果**：Claude 会按这个模板创建组件，保证代码风格一致。

---

## hippo 的踩坑实录

### 坑点一：CLAUDE.md 写得太长， Claude 不看了

**问题**：我一开始把整个项目文档都塞进 CLAUDE.md，几千字。结果 Claude 经常忽略关键约定。

**原因**：上下文有限制，太长的文件会被截断或者重点不突出。

**解决方案**：
- 只放最关键的约定（最多 200-300 字）
- 分成小节，用 Markdown 标题清晰分隔
- 按优先级排序，最重要的放前面
- 用代码块、列表等结构化格式

> 💬 hippo：CLAUDE.md 就像简历，要精炼。详细文档放 README，CLAUDE.md 只写"必读"。

### 坑点二：Skill 文件放错位置， Claude 找不到

**问题**：我把 skill 文件随便放在项目根目录，结果调用时 Claude 说找不到。

**原因**：Claude 只会在特定目录查找 skill 文件。

**解决方案**：
```bash
# 正确的目录结构
your-project/
├── .claude/
│   └── skills/
│       ├── react-component.md
│       ├── api-integration.md
│       └── testing-guide.md
├── CLAUDE.md
└── package.json
```

**注意事项**：
- 必须在 `.claude/skills/` 目录下
- 文件名要清晰，用短横线分隔单词
- 每个 skill 要有明确的标题

---

## 功能对比：怎么选扩展方式

### 相似功能怎么选？

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 项目级约定 | CLAUDE.md | 每次会话自动加载，一次配置到处生效 |
| 可复用技能 | Skills | 灵活调用，能自动识别 |
| 连接外部 API | MCP | 标准化协议，安全可控 |
| 需要独立思考 | Subagents | 隔离上下文，不影响主对话 |
| 自动化脚本 | Hooks | 不需要 AI，直接执行 |
| 团队分发 | Plugins | 打包分享，一键安装 |

### 功能分层理解

```
┌─────────────────────────────────────┐
│  Plugins & Marketplaces（分发层）     │  ← 打包、分享、安装
├─────────────────────────────────────┤
│  Skills, CLAUDE.md, Hooks（应用层）  │  ← 直接使用，灵活扩展
├─────────────────────────────────────┤
│  MCP, Subagents, Teams（集成层）     │  ← 连接外部，复杂协作
├─────────────────────────────────────┤
│  Claude Code 内核（核心层）           │  ← 内置工具，基础能力
└─────────────────────────────────────┘
```

> 💬 hippo：新手从上层（CLAUDE.md, Skills）开始，进阶再往下层（MCP, Subagents）深入。

---

## 上下文成本：扩展不是免费的

每个扩展都会占用上下文（context），就像内存一样有限。

### 按扩展的上下文成本

| 扩展方式 | 上下文成本 | 说明 |
|----------|------------|------|
| CLAUDE.md | 低 | 每次会话加载一次 |
| Skills | 中 | 按需加载，用完释放 |
| MCP | 中高 | 需要传输外部数据 |
| Subagents | 高 | 需要隔离上下文 |
| Hooks | 极低 | 不经过 AI |

### 了解功能如何加载

**自动加载**：
- CLAUDE.md：每次会话开始
- 相关 Skills：Claude 识别到需要时
- Hooks：特定事件触发

**手动加载**：
- `/skillname`：调用特定 skill
- `/deploy`：部署相关技能

**懒加载策略**：
```bash
# Claude 会根据对话内容智能判断
# 比如你说"创建 React 组件"，它会自动加载 react-component.md
# 但不会加载所有 skills
```

> 💬 hippo：不要把所有东西都塞进去，按需加载才是正道。

---

## 常见问题解答

**Q: 我应该先从哪个扩展开始？**

A: 从 CLAUDE.md 开始。它最简单，一次配置长期有效。等你熟悉了再考虑 Skills。

**Q: MCP 和普通的 API 调用有什么区别？**

A: MCP 是标准化协议，提供了安全性、权限控制、版本管理等能力。直接调 API 就像裸连，安全性和可控性差很多。

**Q: Skills 可以调用其他 Skills 吗？**

A: 可以！一个 skill 可以引用其他 skills，这样能构建更复杂的工作流。

**Q: Subagents 和普通的对话有什么区别？**

A: Subagents 在隔离的上下文中运行，有自己的记忆和推理过程，最后只返回摘要。适合需要"独立思考"的任务。

**Q: Hooks 和普通的 shell 脚本有什么区别？**

A: Hooks 与 Claude Code 生命周期深度集成，能感知文件变化、命令执行等事件。普通脚本就是手动运行。

**Q: 我写了扩展但不起作用，怎么排查？**

A:
1. 检查文件路径是否正确（`.claude/skills/` 等）
2. 看文件名是否有特殊字符
3. 尝试手动调用（`/skillname`）而不是等自动识别
4. 查看 Claude Code 日志

---

## 一句话总结

扩展系统让 Claude Code 从"通用助手"变成"定制专家"，CLAUDE.md 是入门首选，Skills 是进阶利器。

---

**上一篇**：[精读官方文档：Agent Teams](/2026/03/22/ai-tools/official-docs/agent-teams/)

**下一篇**：[精读官方文档：MCP 协议](/2026/03/23/ai-tools/official-docs/mcp/)

---

*本文精读自 [扩展 Claude Code](https://code.claude.com/docs/zh-CN/features-overview)*
