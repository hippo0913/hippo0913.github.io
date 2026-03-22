---
title: 精读官方文档：Desktop 快速开始
date: 2026-03-19 09:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 16
description: 精读 Claude Code Desktop 快速开始文档，了解 Desktop 版本的安装和基本使用。
cover: https://picsum.photos/seed/claude-desktop-quickstart/1920/1080
source_url: https://code.claude.com/docs/zh-CN/desktop-quickstart

# 精读官方文档：Desktop 快速开始
> 💬 hippo：这是 Claude Code 官方文档精读系列的第 16 篇。本篇介绍如何快速上手 Claude Code Desktop 桌面应用。
## 开篇：为什么用 Desktop 版
Claude Code 有多个版本：CLI（命令行）、VS Code 扩展、Chrome 扩展，还有今天要讲的 Desktop 桌面应用。
Desktop 版的特点是：
**有图形界面，但不依赖终端** —— 不用记命令，不用敲终端，点点鼠标就能用。但它不是简单的"网页版"，而是完整包含了 Claude Code 的所有功能。
**三个选项卡，不同场景**：
- Chat：普通对话，类似 claude.ai 网页版
- Cowork：后台自主代理，可以在云虚拟机里独立跑任务
- Code：交互式编码助手，直接操作你的本地文件
本篇重点讲 **Code** 选项卡 —— 这是大多数开发者最常用的场景。
<!-- more -->
## 核心概念：用大白话讲清楚
### 1. 什么是 Desktop 版？
Desktop 版是一个独立的应用程序，安装后可以在电脑桌面上打开。它包含了 Claude Code 的所有功能，但用图形界面展示，比命令行更直观。
类比一下：
- CLI 版本 = 就像用记事本写代码，功能强大但不方便
- Desktop 版本 = 就像用 VS Code，功能同样强大，但有菜单、按钮、可视化界面
### 2. 不需要额外装什么
**重要**：Desktop 版自带 Claude Code 引擎，你**不需要**单独安装 Node.js 或 CLI。
如果你想用 `claude` 命令在终端里用，才需要单独安装 CLI 版本。
### 3. Code 选项卡的核心能力
打开 Code 选项卡后，Claude 能直接访问你的项目文件。你可以：
- 选择一个项目文件夹
- 告诉 Claude 要做什么
- 实时审查和批准每一个修改
这就像是给 IDE 装了个"智能助手"，它会：
- 看懂你的代码结构
- 找到相关文件并修改
- 用差异视图（diff）展示修改内容
- 等你批准后再真正改动文件
## 实战指南：手把手教你用
### 场景一：第一次创建编辑任务
> 💬 hippo：第一次用 Desktop 时，建议找个小项目试试，别一上来就改几百个文件的大项目。
**步骤：**
1. 打开 Desktop 应用
2. 切换到 **Code** 选项卡
3. 点击"选择项目"，选一个本地项目文件夹
4. 在提示框输入你的需求，例如：
   ```
   给这个项目添加一个 README.md 文件，说明项目用途和安装步骤
5. 按 Enter，Claude 开始工作
**Claude 的流程：**
- 先分析项目结构，判断这是什么类型的项目
- 搜索现有文件，看有没有 README
- 根据 package.json、requirements.txt 等文件生成内容
- 创建或更新 README.md 文件
**你的操作：**
- 等待 Claude 完成分析和修改
- 看到文件旁边出现 `+12 -1` 这样的指示器
- 点击它打开差异视图
- 逐行检查修改内容
- 满意就点击"批准"，有问题就加评论让 Claude 修改
### 场景二：调试一个 Bug
> 💬 hippo：这是我最常用的场景 —— 出 Bug 了先扔给 Claude，它能快速定位问题。
**假设场景：** 你的 React 应用页面渲染时报错："TypeError: Cannot read properties of undefined"
**操作流程：**
1. 在提示框中输入：
   运行应用时遇到错误："Cannot read properties of undefined"，帮我找出问题所在
2. Claude 会：
   - 搜索项目中的代码文件
   - 分析报错堆栈信息
   - 找到可能的问题代码
   - 解释为什么会出现这个错误
   - 提供修复方案
3. **关键技巧**：提供更多上下文
   你可以这样输入：
   @src/components/UserList.tsx 运行时遇到错误，帮我调试
   错误信息：Cannot read properties of undefined
   复现步骤：
   1. 打开 /users 页面
   2. 等待数据加载完成
   3. 点击用户列表中的任意一行
   注意：
   - `@src/components/UserList.tsx` 让 Claude 关注这个文件
   - 提供详细的复现步骤帮助 Claude 定位问题
4. **审查修改**：
   - Claude 可能会修改 UserList.tsx 文件
   - 打开差异视图，检查每一处修改
   - 如果修改逻辑不对，直接在差异视图上写评论，Claude 会根据你的反馈调整
## hippo 的踩坑实录
> 💬 hippo：以下是我实际使用 Desktop 时踩过的坑，希望能帮你省点时间。
### 坑点一：不知道怎么中断 Claude
**问题描述：** Claude 改文件改错了方向，但我不知道怎么让它停下来，只能等它改完再手动改回来。
**原因：** 没有注意到界面上的"停止"按钮，也不知道可以随时输入更正。
**解决方法：**
Claude Desktop 有两种中断方式：
**方式 1：点击停止按钮**
- 在 Claude 正在运行时，提示框旁边会出现一个"停止"按钮
- 点击它，Claude 会立即停止当前操作
**方式 2：输入更正**
- 不需要等 Claude 完成
- 直接在提示框输入你的更正，按 Enter
- Claude 会停止当前操作，根据你的输入调整方向
> 💬 hippo 的经验：我常用方式 2。比如 Claude 在修改一个函数，我意识到方向错了，就输入"等等，其实应该用 async/await"，Claude 会立即停止并按我的思路重新来。
### 坑点二：没有充分利用上下文
**问题描述：** Claude 修改的代码不符合项目风格，改了好几次都不对。
**原因：** 我没有告诉 Claude 项目的代码规范，它只能猜测。
**方法 1：用 `@filename` 引入关键文件**
```
@tsconfig.json
@package.json
给 utils.ts 添加一个 debounce 函数
这样 Claude 会根据你的 TypeScript 配置和项目依赖生成符合项目风格的代码。
**方法 2：直接拖拽文件**
- 把项目中的类似代码文件直接拖到提示框
- Claude 会分析这些文件的代码风格，模仿编写
**方法 3：使用项目级配置**
在项目根目录创建 `CLAUDE.md` 文件：
```markdown
# 项目编码规范
- 使用 TypeScript
- 优先使用函数式编程
- 文件名用 kebab-case
- 组件用 PascalCase
这样 Claude 在修改任何文件时都会参考这些规范。
> 💬 hippo 的经验：我的 `CLAUDE.md` 里写了：
> - "所有异步函数必须用 async/await，不要用 Promise.then"
> - "错误处理必须用 try-catch，不要让 unhandled promise rejection"
>
> 设置后，Claude 生成的代码就很少踩这些坑了。
### 坑点三：不知道怎么用 diff 视图
**问题描述：** Claude 修改了文件，但我不敢直接点"批准"，因为不知道它到底改了什么。
**原因：** 我没注意到差异视图的存在，也不知道怎么用。
**打开差异视图：**
- 文件修改后，文件名旁边会出现类似 `+12 -1` 的指示器
- 点击它，会打开差异视图
**差异视图的功能：**
1. **红色行**：被删除的代码
2. **绿色行**：新增的代码
3. **黄色行**：修改的代码
**操作技巧：**
**逐个文件审查：**
- 左侧显示修改的文件列表
- 逐一点击检查每个文件
- 确认无误后再批量批准
**添加评论：**
- 在差异视图的某行代码上点击
- 添加你的评论，比如"这里应该用 map 而不是 forEach"
- Claude 会读取你的评论并修改代码
**让 Claude 自己审查：**
- 点击 "Review code" 按钮
- Claude 会评估差异，留下内联建议
- 你可以采纳或忽略这些建议
> 💬 hippo 的经验：我养成习惯，每次看到 `+12 -1` 都会点开看看。特别是删除代码的部分，一定要确认 Claude 没有误删重要逻辑。
## 常见问题解答
### Q: Desktop 和 CLI 用同一个账号吗？
A: 是的。Desktop 和 CLI 都使用你的 Anthropic 账号，同一个订阅计划的限制（比如每月的消息数）是共享的。
### Q: Desktop 会把我的代码上传到云端吗？
A: Code 选项卡**不会**。Code 选项卡完全在本地运行，你的代码不会离开你的电脑。
但 Cowork 选项卡会在云虚拟机中运行，相关代码会上传到云端环境。
### Q: 可以同时用 Desktop 和 CLI 吗？
A: 可以，而且官方推荐这种用法。
- 你可以在 Desktop 里开始一个会话
- 需要去终端执行命令时，切换到 CLI
- 两者共享配置文件（CLAUDE.md、skills、MCP servers 等）
### Q: Desktop 支持哪些操作系统？
A: 支持 macOS、Windows 和 Linux。但 Linux 版本可能需要手动安装依赖。
### Q: 免费版能用 Desktop 吗？
A: 能。Desktop 应用本身免费，但使用 Claude Code 的核心功能需要有 Anthropic 账号。
### Q: 怎么更新 Desktop 应用？
A: Desktop 会自动检查更新。你也可以在菜单里手动检查"检查更新"。
更新时不会删除你的配置和会话历史。
### Q: 能在多台电脑上用同一个账号吗？
A: 能。你可以在多台电脑上安装 Desktop，用同一个 Anthropic 账号登录。
但会话历史是本地存储的，不会在不同电脑间同步。
## 一句话总结
Claude Code Desktop 把 CLI 的强大功能装进了图形界面，新手容易上手，老鸟也能提高效率 —— 特别适合需要频繁审查代码、调试问题的场景。
**上一篇**：[精读官方文档：使用 Claude Code Desktop](/ai-tools/official-docs/desktop/)
**下一篇**：[精读官方文档：在 VS Code 中使用 Claude Code](/ai-tools/official-docs/vs-code/)
*本文精读自 [精读官方文档：Desktop 快速开始 - Claude Code Docs](https://code.claude.com/docs/zh-CN/desktop-quickstart)*
