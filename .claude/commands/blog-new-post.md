# 新建博客文章

## 用法
```
/blog-new-post
```
然后告诉我文章标题和主题，我会引导你完成。

或者直接：
```
/blog-new-post 文章标题 | 分类 | 标签1,标签2 | 文章简介
```

## 执行流程

收到指令后，按以下步骤执行：

### 第一步：列出大纲
根据标题和主题，生成一份文章大纲，格式如下：
- 引言：要解决什么问题
- 正文各小节标题（3-5个）
- 总结方向

**等待用户确认大纲后，再继续。**

### 第二步：创建文章文件
```bash
yarn hexo new "文章标题"
```

### 第三步：写入文章内容
按照 CLAUDE.md 中的写作风格要求，填写完整内容：
- Front Matter（title/date/updated/tags/categories/description/cover）
- 正文（按确认的大纲展开）
- 在引言后插入 `<!-- more -->`
- 文章末尾加系列导航（如果是系列文章）

### 第四步：本地验证
```bash
yarn hexo clean && yarn hexo server
```
检查是否有报错，告知用户访问 http://localhost:4000 预览。

### 第五步：等待确认发布
告知用户文章内容摘要，**等用户说"发布"后**再执行：
```bash
git add .
git commit -m "post: 文章标题"
git push
```

## 注意事项
- cover 图片用 `https://picsum.photos/seed/英文关键词/1920/1080`
- 专业术语必须加括号解释
- 代码块必须注明语言类型
