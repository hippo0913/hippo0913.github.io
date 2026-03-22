---
title: 精读官方文档：JetBrains IDEs
date: 2026-03-20 06:00:00
updated: 2026-03-22 15:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 19
description: 精读 Claude Code JetBrains 集成文档，了解在 JetBrains 全家桶中使用 Claude Code 的方法。
cover: https://picsum.photos/seed/claude-jetbrains/1920/1080
source_url: https://code.claude.com/docs/zh-CN/jetbrains

# 精读官方文档：JetBrains IDEs
> 💬 hippo：如果你和 hippo 一样，日常工作离不开 IntelliJ IDEA、PyCharm 或 WebStorm 这些 JetBrains 全家桶，那你一定要看看这篇文档。把 Claude Code 直接集成到 IDE 里，开发效率直接起飞！
## 开篇：为什么要在 JetBrains IDE 中使用 Claude Code
说实话，hippo 一开始也不觉得在 IDE 里用 Claude Code 有多香。直到有一天，我在 PyCharm 里写代码，需要改一个函数，然后还要跑到终端里输入命令，看 Claude 给我的建议，再手动改代码——这么一套流程下来，光切换窗口就浪费了不少时间。
后来我发现了 JetBrains IDE 集成插件，从此开发体验彻底改变了：
- **一键启动**：按个快捷键就能打开 Claude Code，不用切换到终端
- **差异查看**：代码改了什么，IDE 里直接看差异，比终端里清楚多了
- **自动上下文**：你在 IDE 里选中的代码、打开的文件，Claude 自动就知道
- **错误诊断**：代码报错了？IDE 的错误信息自动发给 Claude，不用你复制粘贴
这篇文档就是教你如何把这个强大的插件配置到你的 JetBrains IDE 中。
<!-- more -->
## 核心概念：这个插件到底做了什么
### 支持的 IDE
Claude Code 的 JetBrains 插件支持大部分 JetBrains 家族产品：
- **IntelliJ IDEA** - Java 开发神器
- **PyCharm** - Python 开发神器
- **Android Studio** - Android 应用开发
- **WebStorm** - 前端开发神器
- **PhpStorm** - PHP 开发神器
- **GoLand** - Go 语言开发
> 💬 hippo：基本上只要你是用 JetBrains 的 IDE，都能用这个插件。官方还在持续支持更多 IDE。
### 关键功能
这个插件的核心价值在于这几个功能：
**1. 快速启动**
- Mac：`Cmd+Esc`
- Windows/Linux：`Ctrl+Esc`
- 或者直接点 IDE 里的 Claude Code 按钮
**2. 差异查看器集成**
这是 hippo 最喜欢的功能。以前 Claude 改完代码，我需要在终端里看那些纯文本的 diff（代码差异），现在直接在 IDE 的差异查看器里看，颜色、语法高亮一目了然。
**3. 选择上下文自动共享**
你在 IDE 里选中一段代码，或者打开某个文件标签页，Claude 会自动知道这些是当前上下文。不用再手动告诉 Claude "看这个文件"了。
**4. 文件引用快捷键**
- Mac：`Cmd+Option+K`
- Linux/Windows：`Alt+Ctrl+K`
- 作用：快速插入文件引用，比如 `@File#L1-99` 表示引用文件的第1到99行
**5. 诊断错误自动共享**
代码里有 lint 错误、语法错误？IDE 的诊断信息会自动发给 Claude，让它帮你分析问题。
## 实战指南：手把手教你用
### 场景一：在 PyCharm 中重构函数
假设你在 PyCharm 里写了一个函数，想让 Claude 帮你优化它。
**步骤如下：**
1. 打开 PyCharm，打开你的项目
2. 从 PyCharm 的集成终端运行 `claude`
3. 在代码编辑器中选中要优化的函数
4. 按 `Cmd+Esc`（Mac）或 `Ctrl+Esc`（Windows/Linux）打开 Claude Code
5. 输入提示词："帮我优化这个函数的性能"
6. Claude 会给出修改建议，直接在 IDE 的差异查看器中显示
7. 在差异查看器中检查改动，确认后应用
> 💬 hippo：这个流程的关键点是第三步——选中函数。插件会自动把选中的内容作为上下文发给 Claude，不用你手动指定文件和行号。
### 场景二：在 IntelliJ IDEA 中调试错误
你在写 Java 代码时遇到了编译错误，想让 Claude 帮你分析。
1. 在 IntelliJ IDEA 中打开项目
2. 代码中出现红色波浪线错误
3. 打开集成终端，运行 `claude`
4. 按 `Cmd+Esc` 或 `Ctrl+Esc` 打开 Claude Code
5. 直接问 Claude："我有个编译错误，帮我看看怎么解决"
6. IDE 的诊断信息会自动发给 Claude
7. Claude 分析后给出解决方案
8. 按照建议修改代码，错误消失
> 💬 hippo：这里最神奇的是第五步，你不需要复制粘贴错误信息，插件自动帮你把 IDE 的诊断发给 Claude。
### 场景三：从外部终端连接到 IDE
有时候你不在 IDE 里，而是在外部终端工作，但还想享受 IDE 集成的功能。
1. 确保你的 IDE 已经打开并加载了项目
2. 在外部终端中，cd 到项目根目录
3. 运行 `claude`
4. 输入 `/ide` 命令
5. Claude Code 会连接到你的 JetBrains IDE
6. 现在所有集成功能都可以使用了
> 💬 hippo：这个命令 `/ide` 是个小技巧，很多人不知道。它让你在 IDE 外也能享受集成功能。
## hippo 的踩坑实录
### 坑点一：插件安装了但用不了
> 💬 hippo：第一次装插件的时候，我遇到了这个问题——插件安装了，但怎么点都没反应。
**问题表现：**
- 插件列表里有 Claude Code
- 但点击图标没反应，或者提示"命令未找到"
**解决方案：**
1. 先检查 Claude Code 是否真的安装了
   ```bash
   npm list -g @anthropic-ai/claude-code
   ```
   如果报错，说明 Claude Code 没装，先装 Claude Code
2. 检查插件的命令路径配置
   - 打开 IDE 设置：`Settings → Tools → Claude Code [Beta]`
   - 在"Claude 命令"字段里填入正确的命令路径
   - 比如：`claude`、`/usr/local/bin/claude` 或 `npx @anthropic/claude`
3. 完全重启 IDE（不是关闭，而是完全退出再打开）
> 💬 hippo：第三个步骤最重要！很多时候重启一次就解决了。
### 坑点二：ESC 键不起作用
> 💬 hippo：这个坑让我很无语——在 JetBrains 终端里按 ESC 键想中断 Claude Code 操作，结果焦点跑到了编辑器里。
- 在 Claude Code 提示时按 ESC
- 光标跑到了编辑器里
- Claude Code 的操作还在继续
1. 打开 IDE 设置：`Settings → Tools → Terminal`
2. 找到"使用 Escape 将焦点移动到编辑器"选项
3. 取消选中这个选项
4. 或者点击"配置终端快捷键"，删除"切换焦点到编辑器"快捷键
5. 应用更改
> 💬 hippo：这个设置冲突是 JetBrains 的默认行为，和 Claude Code 有关，改了就好了。
### 坑点三：远程开发时插件不工作
> 💬 hippo：我有个项目是部署在远程服务器上的，想用 JetBrains 的远程开发功能，结果插件一直连不上。
- 在本地 IDE 里远程连接到服务器
- 在远程项目的集成终端运行 `claude`
- IDE 检测不到插件
1. 关键点：**插件必须安装在远程主机上，而不是本地**
2. 登录到远程服务器
3. 在远程 IDE 中安装 Claude Code 插件
4. 在远程主机上安装 Claude Code CLI
5. 重启远程 IDE
> 💬 hippo：这个坑很容易踩，因为直觉上你会觉得插件在本地装就行了，但其实要装在远程。
### 坑点四：WSL 环境下各种问题
> 💬 hippo：如果你是 WSL 用户（Windows 子系统），恭喜你，你可能会遇到更多坑。
- IDE 检测不到 Claude Code
- 连接时出现网络错误
- 防火墙阻止连接
1. 检查终端配置是否正确
2. 调整网络模式（WSL 1 和 WSL 2 的网络配置不同）
3. 更新防火墙设置，允许 WSL 访问
4. 在插件设置中使用 WSL 特定的命令格式
> 💬 hippo：WSL 的配置比较复杂，建议参考官方的 WSL 故障排除指南。
## 配置详解
### Claude Code 设置
1. 运行 `claude`
2. 输入 `/config` 命令
3. 将差异工具设置为 `auto`，这样 Claude Code 会自动检测并使用 IDE 的差异查看器
### 插件设置
打开 `Settings → Tools → Claude Code [Beta]`，有这些配置项：
**常规设置：**
- **Claude 命令**：指定运行 Claude 的命令，比如 `claude` 或 `/usr/local/bin/claude`
- **抑制"命令未找到"通知**：不想看到提示就开启
- **启用 Option+Enter 多行提示**（仅 macOS）：让 Option+Enter 在提示中输入新行（需要重启终端）
- **启用自动更新**：自动检查并安装插件更新（重启时生效）
> 💬 hippo：我建议把"启用自动更新"打开，这样插件会保持最新状态。
## 安全考虑
这里有个重要的安全提示要特别说明：
当 Claude Code 在 JetBrains IDE 中以自动编辑模式运行时，它可能能够修改 IDE 的配置文件，这些文件可能会被 IDE 自动执行。这会带来一定的安全风险。
**安全建议：**
1. **使用手动批准模式**：对编辑操作使用手动批准，而不是自动编辑
2. **小心提示词**：只在你信任的提示下使用 Claude Code
3. **了解权限范围**：清楚 Claude Code 有权限修改哪些文件
> 💬 hippo：这个安全提示很重要，特别是在处理敏感项目时。
## 常见问题解答
**Q: 插件不工作怎么办？**
A: 按这个顺序排查：
1. 确保从项目根目录运行 Claude Code
2. 检查插件在 IDE 设置中是否已启用
3. 完全重启 IDE（可能需要重启多次）
4. 如果是远程开发，确保插件装在远程主机上
**Q: IDE 检测不到怎么办？**
A: 同样按顺序检查：
1. 验证插件已安装并启用
2. 完全重启 IDE
3. 确认是从集成终端运行 Claude Code
4. 如果是 WSL 用户，参考 WSL 故障排除指南
**Q: 支持哪些 JetBrains IDE？**
A: 目前支持：IntelliJ IDEA、PyCharm、Android Studio、WebStorm、PhpStorm、GoLand，还有其他大部分 JetBrains IDE。
**Q: 可以在多个 IDE 中同时使用吗？**
A: 可以，每个 IDE 安装插件后都可以独立使用 Claude Code。
**Q: 插件是免费还是收费的？**
A: Claude Code 插件本身是免费的，但使用 Claude Code 需要相应的 Anthropic 账户和使用配额。
## 一句话总结
JetBrains IDE 插件让 Claude Code 和你熟悉的开发环境无缝集成，通过差异查看、上下文共享、错误诊断等功能，大幅提升开发效率。
**上一篇**：[精读官方文档：在 Chrome 中使用 Claude Code（测试版）](/ai-tools/official-docs/chrome/)
**下一篇**：[精读官方文档：Claude Code 网页版](/ai-tools/official-docs/claude-code-on-the-web/)
*本文精读自 [精读官方文档：JetBrains IDEs - Claude Code Docs](https://code.claude.com/docs/zh-CN/jetbrains)*
