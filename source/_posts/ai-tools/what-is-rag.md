---
title: 一文搞懂 RAG：让 AI 拥有"记忆外挂"的技术原理
date: 2026-04-07 14:00:00
tags:
  - 实战案例
categories:
  - AI 工具系列
description: RAG（检索增强生成）是让大模型在回答前先"查资料"的技术。本文参考 Anthropic 官方 Cookbook，用最通俗的方式讲清楚它的原理、实现和优化方法。
cover: https://picsum.photos/seed/rag-retrieval-augmented/1920/1080
source_url: https://platform.claude.com/cookbook/capabilities-retrieval-augmented-generation-guide
---

# 一文搞懂 RAG：让 AI 拥有"记忆外挂"的技术原理

> 💬 hippo：RAG 是 2024 年以来 AI 应用层最火的技术之一。它解决的核心问题很简单——让大模型回答问题时"有据可依"，而不是凭记忆瞎编。本文参考 Anthropic 官方 Cookbook 的 RAG 指南，带你从原理到实现一次搞懂。

---

## 一、为什么需要 RAG

大模型很强，但有三个硬伤：

1. **知识截止**：训练数据有截止日期，2024 年发生的事它不知道
2. **幻觉（Hallucination）**：不确定的时候会一本正经地编答案
3. **无法访问私有数据**：你公司的内部文档、数据库，它一个字都看不到

RAG（Retrieval-Augmented Generation，检索增强生成）就是来解决这三个问题的。思路很直觉：**不让模型靠记忆回答，而是先让它查资料，再基于资料回答**。

打个比方：大模型直接回答问题 = 闭卷考试；加了 RAG = 开卷考试。开卷不一定答得更好，但至少不会瞎编。

<!-- more -->

---

## 二、RAG 是怎么工作的

RAG 的工作流程分三步：**检索 → 增强 → 生成**。

```
用户提问
  ↓
[1. 检索 Retrieval]  把问题变成向量，在知识库中找最相关的内容
  ↓
[2. 增强 Augmented]  把找到的内容塞进 prompt，作为上下文
  ↓
[3. 生成 Generation]  大模型基于上下文生成回答
```

每一步涉及几个核心概念，逐一解释：

### 2.1 向量化（Embedding）

把一段文字变成一个数字数组（向量），捕捉它的语义。意思相近的文字，向量距离就近；意思不同的，向量距离就远。

比如"什么是机器学习"和"ML 是什么"这两句话意思差不多，它们的向量在高维空间中距离很近；而"什么是机器学习"和"今天中午吃什么"的向量距离就很远。

常用的 Embedding 模型有 OpenAI 的 `text-embedding-3-small`、Voyage AI 的 `voyage-3` 等。

### 2.2 向量数据库

存储和搜索向量的专用数据库。常见的有 Pinecone、Weaviate、Chroma、Milvus 等。它们的核心能力是**语义搜索**——不是关键词匹配，而是根据意思找最相关的内容。

### 2.3 分块（Chunking）

把长文档切成小段（通常几百到一千 token），每段单独向量化并存储。为什么？因为如果整篇文档作为一个检索单元，搜索精度会很低——用户问的是某个具体问题，你需要返回的是最相关的段落，而不是整篇文档。

> 💬 hippo：分块是 RAG 系统中最容易被忽视、但影响最大的环节。切得太大，检索不精确；切得太小，上下文丢失。没有万能的最优值，得根据文档类型和查询模式调。

---

## 三、一个最小 RAG 系统长什么样

参考 Anthropic Cookbook 的 Level 1 Basic RAG，用 Python + Anthropic SDK + Voyage AI 实现一个最小系统：

```python
import anthropic
import voyageai
import numpy as np

# 1. 准备知识库（一堆文档片段）
documents = [
    "RAG 是 Retrieval-Augmented Generation 的缩写。",
    "向量化（Embedding）把文字变成数字数组，捕捉语义。",
    "分块（Chunking）把长文档切成小段，便于精确检索。",
    # ... 更多文档片段
]

# 2. 向量化并存入知识库
vo = voyageai.Client()
doc_embeddings = vo.embed(documents, model="voyage-3").embeddings

# 3. 检索：把用户问题也向量化，找最相似的文档
def retrieve(query, top_k=2):
    query_embedding = vo.embed([query], model="voyage-3").embeddings[0]
    similarities = np.dot(doc_embeddings, query_embedding)  # 余弦相似度
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    return [documents[i] for i in top_indices]

# 4. 增强 + 生成：把检索结果塞进 prompt，让模型回答
client = anthropic.Anthropic()

def answer(query):
    contexts = retrieve(query)
    prompt = f"""基于以下参考资料回答问题。如果资料中没有答案，说"我不确定"。

参考资料：
{chr(10).join(f'- {c}' for c in contexts)}

问题：{query}"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text

# 试试看
print(answer("RAG 是什么？"))
```

三个关键步骤的对应关系：

| 步骤 | 代码位置 | 做了什么 |
|------|----------|----------|
| 检索 | `retrieve()` 函数 | 问题向量化 → 与知识库向量计算相似度 → 返回 top-k |
| 增强 | `answer()` 中拼接 prompt | 把检索到的文档片段塞进 prompt 作为上下文 |
| 生成 | `client.messages.create()` | Claude 基于上下文生成回答 |

> 💬 hippo：这个最小系统用 NumPy 手动计算相似度，生产环境请用向量数据库（Pinecone、Chroma 等）。但核心逻辑就是这样——**检索相关内容，塞进 prompt，让模型回答**。没有魔法。

---

## 四、RAG 的进阶优化

最小系统能跑，但效果往往不够好。Anthropic Cookbook 给出了一个清晰的优化阶梯：

### 4.1 基础 RAG → 摘要索引

**问题**：原始文档分块可能包含大量无关细节，检索到的片段不够精炼。

**解法**：给每个分块生成一段摘要，检索时用摘要做匹配。这样匹配精度更高，返回的内容更聚焦。

**效果**：Anthropic 的测试中，端到端准确率从 71% 提升到 81%。

### 4.2 重排序（Reranking）

**问题**：向量相似度搜索是"粗筛"，可能把不太相关的结果也捞回来。

**解法**：先广搜（取 top-20 甚至更多），再用 LLM 对候选结果重新排序，只保留最相关的 top-k。

```python
def rerank(query, candidates, top_k=3):
    """用 Claude 对候选结果重新排序"""
    prompt = f"""对以下文档片段按与问题的相关性排序。
问题：{query}
候选片段：
{chr(10).join(f'{i+1}. {c}' for i, c in enumerate(candidates))}
返回最相关的 {top_k} 个片段编号，用逗号分隔。只返回数字。"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=64,
        messages=[{"role": "user", "content": prompt}]
    )
    indices = [int(x.strip()) - 1 for x in response.content[0].text.split(",")]
    return [candidates[i] for i in indices[:top_k]]
```

### 4.3 Contextual Retrieval（Anthropic 官方推荐）

这是 Anthropic 2024 年提出的方法，核心思想是：**给每个分块加上下文**。

普通的分块是粗暴切割——一段文本被切出来后，它之前和之后的内容全丢了。Contextual Retrieval 在向量化之前，先用 LLM 给每个分块写一段"上下文说明"：

```python
def contextualize(chunk, full_document):
    """给分块加上下文"""
    prompt = f"""<document>
{full_document}
</document>

这是文档中的一个片段：
<chunk>
{chunk}
</chunk>

请用一两句话说明这个片段在整篇文档中的上下文。只返回上下文说明，不要其他内容。"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    context = response.content[0].text
    return f"{context}\n{chunk}"  # 上下文 + 原始分块
```

把 `上下文说明 + 原始分块` 一起向量化，检索精度大幅提升。Anthropic 的测试数据：**检索失败率降低 67%**。成本也很低——配合 prompt caching，每百万文档 token 只需 $1.02。

### 4.4 前沿方向

- **GraphRAG**：用知识图谱代替纯向量检索，擅长回答需要跨文档推理的问题
- **Agentic RAG**：让 AI Agent 自主决定"要不要检索、检索什么、检索够不够"，多轮迭代直到满意

> 💬 hippo：GraphRAG 和 Agentic RAG 还在快速演进中，暂不展开。对大多数场景，**Contextual Retrieval + Reranking** 已经是很强的组合了。

---

## 五、RAG 的适用场景和局限

### 什么时候该用 RAG

| 场景 | 说明 |
|------|------|
| 企业知识库问答 | 员工用自然语言查内部文档、制度、FAQ |
| 客服机器人 | 基于产品文档回答用户问题，而不是通用闲聊 |
| 法律/金融文档分析 | 在大量专业文件中检索相关条款 |
| 代码库问答 | "这个项目的认证逻辑是怎么实现的？" |

### 什么时候不该用 RAG

**Anthropic 官方建议**：如果你的知识库小于 20 万 token（约 15 万字），直接把全部内容塞进 prompt 比做 RAG 更好。Claude 的上下文窗口已经很大了，没必要为小数据集搞向量数据库。

### RAG 的局限

- **分块破坏上下文**：一刀切下去，前后文就断了（Contextual Retrieval 能缓解）
- **向量相似度 ≠ 语义理解**：有时意思相近但用词不同，向量检索找不到；有时用词相同但意思不同，反而匹配上了
- **构建和维护成本**：知识库更新了要重新向量化，分块策略要持续调优

---

## 六、总结

| 要点 | 一句话 |
|------|--------|
| RAG 是什么 | 让大模型回答问题前先"查资料"的技术 |
| 核心流程 | 检索（找相关内容）→ 增强（塞进 prompt）→ 生成（基于上下文回答） |
| 关键组件 | 分块、向量化、向量数据库、语义搜索 |
| 进阶优化 | 摘要索引、重排序、Contextual Retrieval |
| 何时不用 | 知识库 < 20 万 token 时，直接塞 prompt |

**推荐资源**：

- [Anthropic Cookbook: RAG Guide](https://platform.claude.com/cookbook/capabilities-retrieval-augmented-generation-guide) — 本文的主要参考，包含完整的实现代码和评测方法
- [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — Anthropic 官方提出的检索优化方法，降低 67% 检索失败率
