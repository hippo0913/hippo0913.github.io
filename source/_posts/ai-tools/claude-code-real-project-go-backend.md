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

我用 Claude Code 搭建了一个 IoT 云平台的 Go 后端，技术栈是 Go 1.22 + Gin + PostgreSQL + GORM，最终交付了数据模型、CRUD API、JWT 中间件、WebSocket 通信。这篇文章记录整个过程：每个步骤贴出真实代码，哪些地方踩了坑、怎么改的，以及哪些环节 Claude 帮不上忙。

<!-- more -->

---

## 第 0 步：写 CLAUDE.md

开始写任何代码之前，我先让 Claude 帮我生成了一份 CLAUDE.md 初稿，然后手动调整。

**反面 CLAUDE.md**（太笼统，Claude 会反复问你）：

```markdown
# 项目
Go 后端项目，代码写好一点。
```

**正面 CLAUDE.md**（具体、可执行）：

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

区别在于：泛泛的"写好代码"没用，具体的"所有 API 经过 auth 中间件"才能约束 Claude 的行为。这份 CLAUDE.md 花了我 10 分钟，但后续每一步都省了反复沟通的时间。

---

## 第 1 步：项目骨架

**我的 prompt**：

> 初始化一个 Go 后端项目，使用 Gin 框架。按 handler / service / repository / model 分层。创建 main.go 入口和基本的目录结构。

Claude 生成了完整的目录结构和配置文件：

```
l4_cloud/
├── cmd/server/main.go
├── internal/
│   ├── handler/
│   ├── service/
│   ├── repository/
│   ├── model/
│   ├── middleware/
│   └── errors/
├── config/
│   └── config.go
├── Makefile
├── go.mod
└── .env.example
```

Makefile 也一并生成：

```makefile
.PHONY: build run test clean

build:
	go build -o bin/server ./cmd/server

run:
	go run ./cmd/server

test:
	go test ./... -v

clean:
	rm -rf bin/
```

**我做的调整**：入口文件路径从 `cmd/server/main.go` 改成项目根目录（个人习惯），补了 `.env.example` 里缺少的数据库连接字符串。

**耗时**：5 分钟（纯手写至少 30 分钟）

---

## 第 2 步：数据模型

**我的 prompt**：

> 定义以下数据模型：Device（设备，包含 name、type、status 字段）、SensorData（传感器数据，包含 device_id、temperature、humidity、timestamp）。用 GORM 的标准写法，参考 CLAUDE.md 里的分层结构。

Claude 生成的 Device 模型：

```go
// internal/model/device.go
package model

import "gorm.io/gorm"

type Device struct {
    gorm.Model
    Name     string `json:"name" gorm:"not null"`
    Type     string `json:"type" gorm:"not null"`
    Status   string `json:"status" gorm:"default:'offline'"`
}

type DeviceStatus string

const (
    DeviceStatusOnline  DeviceStatus = "online"
    DeviceStatusOffline DeviceStatus = "offline"
    DeviceStatusAlarm   DeviceStatus = "alarm"
)
```

**踩坑 1：Status 字段类型**。Claude 一开始用 `string`，这没问题但不够安全。我改成自定义枚举类型 `DeviceStatus`，并在上层 service 做校验，防止写入任意字符串。

**踩坑 2：SensorData 的 timestamp 重复**。`gorm.Model` 自带 `CreatedAt`，而 SensorData 业务上需要一个独立的采集时间戳。Claude 自动加的 `Timestamp` 字段跟 `CreatedAt` 语义重叠，我去掉了 `Timestamp`，改用 `gorm.Model` 自带的时间：

```go
// internal/model/sensor_data.go
package model

import "gorm.io/gorm"

type SensorData struct {
    gorm.Model
    DeviceID    uint    `json:"device_id" gorm:"index;not null"`
    Temperature float64 `json:"temperature"`
    Humidity    float64 `json:"humidity"`
}
```

**耗时**：10 分钟（含调整）

---

## 第 3 步：CRUD API

**我的 prompt**：

> 给 Device 模型实现完整的 CRUD API。要求：
> 1. 遵循 handler / service / repository 分层
> 2. 使用 Gin 的路由组，加 auth 中间件（先用占位中间件）
> 3. 错误返回用统一格式 `{ "code": 40001, "message": "xxx" }`
> 4. 写单元测试，mock repository 层

这一步 Claude 生成了约 400 行代码，分层清晰。关键片段：

**Handler 层**（列表接口）：

```go
// internal/handler/device.go
func (h *DeviceHandler) List(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

    devices, total, err := h.service.List(page, pageSize)
    if err != nil {
        errors.Respond(c, errors.ErrInternal)
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "data":  devices,
        "total": total,
        "page":  page,
    })
}
```

**统一错误格式**：

```go
// internal/errors/errors.go
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func Respond(c *gin.Context, err *AppError) {
    c.JSON(http.StatusBadRequest, err)
}

var (
    ErrBadRequest = &AppError{Code: 40001, Message: "请求参数错误"}
    ErrNotFound   = &AppError{Code: 40401, Message: "资源不存在"}
    ErrInternal   = &AppError{Code: 50001, Message: "服务内部错误"}
)
```

**改动 1：分页默认值**。Claude 生成的 `page` 默认值是 `0`，但页码从 0 开始违反直觉，我改成了 `1`：

```go
// 改动前
page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
// 改动后
page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
```

**改动 2：边界检查**。原代码在 `page` 和 `pageSize` 传入负数时会直接透传到数据库查询，加了一行校验：

```go
if page < 1 {
    page = 1
}
if pageSize < 1 || pageSize > 100 {
    pageSize = 20
}
```

**测试代码**（mock repository）：

```go
// internal/handler/device_test.go
type mockRepo struct {
    devices []model.Device
}

func (m *mockRepo) List(page, pageSize int) ([]model.Device, int64, error) {
    start := (page - 1) * pageSize
    end := start + pageSize
    if end > len(m.devices) {
        end = len(m.devices)
    }
    return m.devices[start:end], int64(len(m.devices)), nil
}
```

**耗时**：15 分钟（纯手写至少 2 小时）

---

## 第 4 步：中间件

**我的 prompt**：

> 写两个中间件：
> 1. auth 中间件：从 Header 提取 Bearer token，验证 JWT，把用户信息注入 context
> 2. 日志中间件：记录每个请求的方法、路径、耗时、状态码
> 参考已有代码风格。

Claude 生成的 auth 中间件：

```go
// internal/middleware/auth.go
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "code":    40101,
                "message": "缺少认证信息",
            })
            return
        }

        tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
        claims, err := parseToken(tokenStr, jwtSecret)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "code":    40101,
                "message": "token 无效或已过期",
            })
            return
        }

        c.Set("userID", claims.UserID)
        c.Next()
    }
}
```

**踩坑：密钥硬编码**。Claude 最初把 `jwtSecret` 作为常量写在文件里。我改成从配置文件注入（函数参数），配置文件再从环境变量读取：

```go
// config/config.go
type Config struct {
    JWTSecret  string `env:"JWT_SECRET" required:"true"`
    DBHost     string `env:"DB_HOST" default:"localhost"`
    DBPort     string `env:"DB_PORT" default:"5432"`
    DBName     string `env:"DB_NAME" default:"l4_cloud"`
}
```

日志中间件没什么坑，Claude 直接用了项目已有的 `internal/logger`，输出格式统一：

```go
// internal/middleware/logger.go
func LoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        logger.Info("%s %s %d %v",
            c.Request.Method,
            c.Request.URL.Path,
            c.Writer.Status(),
            time.Since(start),
        )
    }
}
```

**耗时**：10 分钟

---

## 第 5 步：集成联调

这一步 Claude 帮忙有限，因为需要实际运行的服务和数据库。

**启动 PostgreSQL**：

```bash
docker run -d --name l4-postgres \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=l4_cloud \
  -p 5432:5432 \
  postgres:16
```

**跑测试**：

```bash
make test
# === RUN   TestListDevices
# --- PASS: TestListDevices (0.00s)
# === RUN   TestCreateDevice
# --- PASS: TestCreateDevice (0.00s)
# ok      l4_cloud/internal/handler   0.012s
```

**curl 测试**：

```bash
# 创建设备
curl -X POST http://localhost:8080/api/v1/devices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"sensor-01","type":"temperature"}'

# 查询设备列表
curl http://localhost:8080/api/v1/devices?page=1&page_size=10 \
  -H "Authorization: Bearer <token>"
```

**踩坑：JSON tag 拼写错误**。接口返回 `{"devie_id": 1}` 而不是 `device_id`。原因是 SensorData 结构体的 JSON tag 写成了 `` `json:"devie_id"` ``。这类 typo 人类肉眼容易漏，但 curl 跑一遍立刻暴露。

**踩坑：空指针边界**。查询单个设备时，如果 ID 不存在，repository 返回的 `nil` 在 handler 里没有检查就直接序列化了。补了一层判断：

```go
device, err := h.service.GetByID(id)
if err != nil {
    errors.Respond(c, errors.ErrNotFound)
    return
}
```

**耗时**：30 分钟

---

## 时间对比

| 环节 | 纯手写估时 | 用 Claude Code | 节省 |
|---|---|---|---|
| 项目骨架 | 30 min | 5 min | 83% |
| 数据模型 | 20 min | 10 min | 50% |
| CRUD API | 2 h | 15 min | 87% |
| 中间件 | 1 h | 10 min | 83% |
| 集成联调 | 1 h | 30 min | 50% |
| **总计** | **~5 h** | **~1 h 10 min** | **~76%** |

最大的提效在 CRUD API——这类有固定模式、分层清晰的代码，Claude 几乎可以一次性写对。数据模型和联调环节节省比例最低，因为需要你做业务判断和实际验证。

---

## 什么环节 Claude 帮不上忙

老实说，以下环节我基本自己来。我总结了一个简单的判断框架：

**Claude 能帮的**（模式明确、可从 CLAUDE.md 推断）：
- 有固定范式的代码（CRUD、中间件、配置加载）
- 项目骨架和目录结构
- 单元测试和 mock 代码
- 已知 bug 的修复（把错误信息贴给它就行）

**Claude 帮不上的**（需要业务上下文或环境验证）：

| 环节 | 为什么帮不上 | 你的对策 |
|---|---|---|
| 架构设计 | 选型依赖业务规模、团队能力、运维条件 | 自己做决策，让 Claude 帮你实现 |
| 业务阈值 | "离线多久算异常"它不知道 | 你定义规则，让 Claude 写判断逻辑 |
| 部署配置 | Docker compose、Nginx 配置需要实际环境验证 | 自己写和调试 |
| 代码架构审查 | "这个 service 承担了太多职责"属于主观判断 | 自己 review，Claude 发现不了 |

**简单判断标准**：如果你的决策需要知道"公司有多少设备"、"QPS 大概多少"、"团队谁负责什么"，那 Claude 帮不上。如果你的决策只需要知道"用什么框架"、"代码怎么分层"、"命名规范是什么"，那 CLAUDE.md 写好就够了。

---

## 关键经验

**1. CLAUDE.md 是最高回报的 10 分钟投入。** 写得越具体，后续每个环节的沟通成本越低。"代码写好一点"是废话，"handler 不直接调 GORM"才是有效指令。

**2. 分层架构天然适合 AI 辅助。** 每层职责清晰，prompt 也好写——"给 model 层加一个字段"、"在 handler 里处理分页"。如果项目是面条式代码，Claude 也无从下手。

**3. 审查重点放在业务逻辑，语法层面基本可以信任。** Claude 生成的代码语法错误极少，但业务边界（分页从 0 还是 1 开始、空指针怎么处理）需要你把关。养成"先让它写，再跑一遍 curl"的习惯。

---

*本文是 [Claude Code 实战进阶](/2026/04/07/ai-tools/claude-code-advanced-series-index/) 系列的第 7 篇。*
