---
title: 用 Claude Code 从零搭建一个 Go 后端项目
date: 2026-04-07 12:00:00
tags:
  - Claude Code
  - 实战案例
categories:
  - AI 工具系列
series: claude-code-advanced
series_index: 7
description: 完整的项目搭建实录：从写 CLAUDE.md 到 API 端点上线，每个环节 Claude Code 帮了什么、我在哪里需要介入。
cover: https://picsum.photos/seed/go-backend-claude/1920/1080
---

# 用 Claude Code 从零搭建一个 Go 后端项目

前面几篇讲了踩坑经验和心法，这篇来一个完整的项目实战。

我用 Claude Code 搭建了一个 IoT 云平台的 Go 后端，包含数据模型、CRUD API、中间件、WebSocket 通信。这篇文章记录整个过程：哪些环节 Claude 帮了大忙，哪些地方我需要自己上手。

<!-- more -->

---

## 第 0 步：写 CLAUDE.md

开始写任何代码之前，我先让 Claude 帮我生成了一份 CLAUDE.md 初稿，然后手动调整。

```markdown
# 项目信息
- 语言: Go 1.22
- 框架: Gin
- 数据库: PostgreSQL (GORM)
- 项目结构: 按 handler / service / repository / model 分层

# 代码规范
- 错误处理: 使用 internal/errors 包的自定义错误类型
- 日志: 使用 internal/logger，不直接用 fmt.Println
- 命名: Go 标准命名规范，handler 用 XxxHandler，service 用 XxxService

# 注意事项
- 所有 API 必须经过 auth 中间件
- 数据库操作通过 repository 层，handler 不直接调 GORM
- 配置项从环境变量读取，不硬编码
```

这个 CLAUDE.md 花了我 10 分钟写，但帮 Claude 省了无数次的"这个用什么框架？"、"错误怎么处理？"之类的猜测。

**我的经验**：CLAUDE.md 越具体，Claude 的输出质量越高。泛泛的"写好代码"没用，具体的"所有 API 经过 auth 中间件"才有效。

---

## 第 1 步：项目骨架

**我的 prompt**：

> 初始化一个 Go 后端项目，使用 Gin 框架。按 handler / service / repository / model 分层。创建 main.go 入口和基本的目录结构。

**Claude 做了什么**：

- 创建了 `cmd/server/main.go` 作为入口
- 按分层创建了 `internal/handler`、`internal/service`、`internal/repository`、`internal/model` 目录
- 写了基础的 `Makefile`（build、run、test）
- 初始化了 `go.mod`

**我做了什么**：

- 调整了入口文件路径（我习惯放在项目根目录）
- 补充了 `.env.example` 文件

**耗时**：5 分钟（纯手写至少 30 分钟）

---

## 第 2 步：数据模型和数据库

**我的 prompt**：

> 定义以下数据模型：Device（设备，包含 name、type、status 字段）、SensorData（传感器数据，包含 device_id、temperature、humidity、timestamp）。用 GORM 的标准写法，参考 CLAUDE.md 里的分层结构。

**Claude 做了什么**：

- 在 `internal/model` 下写了两个结构体
- 自动加了 `gorm.Model`（ID、CreatedAt、UpdatedAt、DeletedAt）
- 给外键字段加了合适的 GORM tag
- 写了 `AutoMigrate` 的数据库初始化代码

**我需要调整的地方**：

- Claude 给 Device 的 status 用了 `string` 类型，我改成自定义枚举更合适
- SensorData 的 timestamp 字段跟 `gorm.Model` 的 CreatedAt 重复了，去掉了一个

**耗时**：10 分钟（含调整）

---

## 第 3 步：CRUD API

**我的 prompt**：

> 给 Device 模型实现完整的 CRUD API。要求：
> 1. 遵循 handler / service / repository 分层
> 2. 使用 Gin 的路由组，加 auth 中间件（先用占位中间件）
> 3. 错误返回用统一格式 `{ "code": 40001, "message": "xxx" }`
> 4. 写单元测试，mock repository 层

**Claude 做了什么**：

- `repository/device.go`：CRUD 数据库操作
- `service/device.go`：业务逻辑层（参数校验、调用 repository）
- `handler/device.go`：HTTP handler，路由绑定、请求解析、响应格式化
- `handler/device_test.go`：单元测试，mock 了 repository 层
- 路由注册代码

这一步 Claude 生成了大约 400 行代码，结构清晰、分层合理。我只改了两处：

- 一个分页参数的默认值从 0 改成了 1（页码不应该从 0 开始）
- 补充了一个缺少的边界检查

**耗时**：15 分钟（纯手写至少 2 小时）

---

## 第 4 步：中间件

**我的 prompt**：

> 写两个中间件：
> 1. auth 中间件：从 Header 提取 Bearer token，验证 JWT，把用户信息注入 context
> 2. 日志中间件：记录每个请求的方法、路径、耗时、状态码
> 参考已有代码风格。

**Claude 做了什么**：

- auth 中间件完整实现（token 解析、过期检查、用户信息注入）
- 日志中间件用了项目已有的 `internal/logger`
- 都符合 Gin 的中间件接口

**我做的调整**：

- auth 中间件的密钥获取方式改成从配置文件读，不硬编码
- 补充了 token 过期后的错误码（用项目统一的错误码体系）

---

## 第 5 步：集成和联调

这一步 Claude 帮不了太多，因为需要实际运行服务和数据库。

**我做的**：

- 启动 PostgreSQL（Docker）
- 跑 `make test` 确认测试全过
- 用 curl 测试各 API 端点
- 把发现的问题（一个 JSON tag 拼写错误、一个空指针边界情况）反馈给 Claude 修

---

## 时间对比

| 环节 | 纯手写估时 | 用 Claude Code | 节省 |
|------|-----------|---------------|------|
| 项目骨架 | 30 min | 5 min | 83% |
| 数据模型 | 20 min | 10 min | 50% |
| CRUD API | 2 h | 15 min | 87% |
| 中间件 | 1 h | 10 min | 83% |
| 集成联调 | 1 h | 30 min | 50% |
| **总计** | **~5 h** | **~1 h 10 min** | **~76%** |

最大的提效在 CRUD API——这类有固定模式的代码，Claude 几乎可以一次性写对。

---

## 什么环节 Claude 帮不上忙

诚实地说，这些环节我基本自己来：

- **数据库选型和架构设计**：Claude 能给建议，但最终决策需要你根据业务特点判断
- **业务规则的边界情况**：比如"设备离线超过 30 分钟算异常"这种阈值，它不知道你的业务
- **部署和运维配置**：Docker compose、Nginx 配置等环境相关的东西，需要你自己验证
- **代码审查中的架构问题**：它能发现语法 bug，但"这个服务层承担了太多职责"这种判断还得靠人

---

## 关键经验

1. **CLAUDE.md 是最重要的投入**。10 分钟写好它，后续每个环节都能节省时间。
2. **分层架构最适合 Claude**。因为每层的职责清晰，prompt 也好写——"给 model 层加一个 X"、"在 handler 里处理 Y"。
3. **先让 Claude 写，再审查调整**，比完全自己写快很多。关键是审查时关注业务逻辑和边界情况。
4. **集成和联调环节 Claude 帮忙有限**，这是你需要自己投入时间的地方。

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 7 篇。*
