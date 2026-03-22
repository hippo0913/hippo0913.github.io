# 一键发布博客

## 用法
```
/blog-publish
```

## 执行流程

### 第一步：检查有哪些改动
```bash
git status
git diff --stat
```
列出所有待提交的文件，告知用户。

### 第二步：本地构建验证
```bash
yarn hexo clean && yarn hexo generate
```
检查是否有报错，如果有报错**立即停止并告知用户**，不要继续发布。

### 第三步：确认发布
告诉用户：
- 即将发布的文章列表
- 预计上线地址

**等待用户回复"确认"后再继续。**

### 第四步：推送
```bash
git add .
git commit -m "post: 发布内容摘要"
git push
```

### 第五步：告知结果
- 推送成功后，告知用户约1分钟后可访问 https://hippo0913.github.io 查看
- 如果推送失败，显示错误信息并给出解决建议
