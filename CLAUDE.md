# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 小河马的博客 · Claude Code Agent 指引

## 语言要求
始终用中文回复，包括代码注释之外的所有解释、分析和建议

## 项目信息

- **框架**: Hexo 7.3.0 + Butterfly 5.5.4 主题
- **博客地址**: https://hippo0913.github.io
- **本地路径**: ~/hippo/blog/hippo0913.github.io
- **部署方式**: git push → GitHub Actions 自动构建上线（约1分钟）

---

## 目录结构

```
hippo0913.github.io/
├── source/
│   ├── _posts/          # 所有博客文章（.md 文件）
│   ├── about/           # 关于页面
│   ├── tags/            # 标签页面
│   └── categories/      # 分类页面
├── _config.yml          # Hexo 主配置
├── _config.butterfly.yml # 主题配置
└── .github/workflows/   # 自动部署配置
```

---

## 文章 Front Matter 标准模板

每篇文章必须包含以下 Front Matter，缺一不可：

```yaml
---
title: 文章标题
date: YYYY-MM-DD HH:mm:ss
updated: YYYY-MM-DD HH:mm:ss
tags:
  - 标签1
  - 标签2
categories:
  - 分类名
description: 100字以内的文章摘要，会显示在首页卡片和SEO描述中
cover: https://picsum.photos/seed/关键词/1920/1080
---
```

> cover 图片使用 picsum.photos，seed 用文章关键词英文，保证每篇封面不同。

### 标签规范

- **每篇文章最多 2 个标签**，一般 1 个即可
- **不要随意新增标签**，优先复用已有标签
- **每个标签至少关联 3 篇文章**，否则是死链，无导航价值
- 分类管大类，标签管细化，不要让标签重复分类的职责
- 当前 AI 类标签：`入门`、`工具集成`、`扩展定制`、`实战案例`（统一搭配 `Claude Code`）
- 新增标签前先确认现有标签是否适用，确实需要新增时须用户确认

---

## 写作风格要求

- **受众**：有一定技术基础但不是专家，能看懂命令行
- **语气**：轻松、直接，像朋友讲解，不要太学术
- **专业术语**：出现时必须用括号或一句话解释，例如：`MCP（一种让AI连接外部工具的标准协议）`
- **结构**：引言（是什么/为什么要看）→ 正文（分小节，每节有标题）→ 总结或下一步
- **代码块**：必须注明语言，例如 ` ```bash ` 或 ` ```yaml `
- **摘要分割线**：在引言结束后、正文开始前插入 `<!-- more -->`
- **长度**：普通文章 800-1500 字，教程类 1500-2500 字

---

## 常用命令

```bash
# Hexo 命令
hexo new "文章标题"          # 新建文章
hexo new page "页面名"       # 新建页面
hexo clean                   # 清除缓存（修改配置后必须执行）
hexo server                  # 本地预览 http://localhost:4000
hexo generate                # 生成静态文件
hexo deploy                  # 部署

# yarn 命令（推荐）
yarn build                   # 等价于 hexo generate
yarn clean                   # 等价于 hexo clean
yarn server                  # 等价于 hexo server
```

## 环境要求

- **Node.js**: 20+（与 GitHub Actions 保持一致）
- **包管理器**: yarn（`package.json` 配置了 `packageManager` 字段）

## CI/CD 部署

GitHub Actions 配置在 `.github/workflows/pages.yml`：
- 推送 master 分支自动触发构建
- 使用 Node.js 20 环境
- 构建产物上传至 GitHub Pages
- 部署后约 1 分钟可访问 https://hippo0913.github.io

---

## 标准发布流程

每次写完文章，按以下顺序执行：

```bash
# 第一步：清除缓存并本地预览验证
hexo clean && hexo server
# 访问 http://localhost:4000 确认文章显示正常
# 确认无误后 Ctrl+C 停止服务器

# 第二步：提交并推送
git add .
git commit -m "post: 文章标题"
git push

# 约1分钟后访问 https://hippo0913.github.io 查看上线效果
```

---

## 系列文章规范

当写系列文章时：

1. 先创建或更新系列大纲文章（`source/_posts/系列名-index.md`）
2. 每篇文章 Front Matter 加入系列标签，例如 `series: claude-code`
3. 每篇文章末尾加上"系列导航"，链接到大纲页
4. 大纲页的文章链接格式：`/YYYY/MM/DD/文章slug/`

---

## Agent 行为准则

执行任务时请遵守：

1. **先理解再动手**：收到写作需求后，先列出文章大纲让我确认，再开始写正文
2. **不要假设**：不确定分类/标签时，直接问我
3. **本地验证**：写完文章后，主动运行 `hexo clean && hexo server` 检查是否有报错
4. **一次一件事**：不要同时创建多篇文章，完成一篇确认后再写下一篇
5. **发布前确认**：执行 `git push` 前，告诉我即将发布的内容，等我确认

---

## 当前系列规划

- 《Claude Code 入门到上手》系列（已完结）

---

## 项目进度

详见 [PROGRESS.md](PROGRESS.md)，每次完成重要功能后更新。
