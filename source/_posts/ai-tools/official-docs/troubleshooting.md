---
title: 精读官方文档：故障排除
date: 2026-03-05 23:00:00
updated: 2026-03-27 12:00:00
tags: [Claude Code, AI 工具, 官方文档精读]
categories: [AI 工具系列]
series: claude-code
series_index: 26
description: 安装失败、命令找不到、TLS 错误、权限问题……本文汇总 Claude Code 常见故障的诊断方法和解决方案，附带完整命令示例。
cover: https://picsum.photos/seed/claude-troubleshooting/1920/1080
source_url: https://code.claude.com/docs/zh-CN/troubleshooting
---

# 精读官方文档：故障排除

> 💬 hippo：用 Claude Code 难免会遇到问题。这篇文章是我的"急救手册"——遇到报错先来这里查。

---

## 一、安装问题速查表

看到报错先查这张表，90% 的安装问题都能快速解决：

| 您看到的内容 | 解决方案 |
|-------------|---------|
| `command not found: claude` 或 `'claude' is not recognized` | 修复 PATH（见下文） |
| `syntax error near unexpected token '<'` | 安装脚本返回 HTML，使用替代安装方法 |
| `curl: (56) Failure writing output to destination` | 先下载脚本再运行，或用 Homebrew/WinGet |
| Linux 上安装期间 `Killed` | 添加交换空间（内存不足） |
| `TLS connect error` 或 `SSL/TLS secure channel` | 更新 CA 证书 |
| `Failed to fetch version` | 检查网络和代理设置 |
| `irm is not recognized` 或 `&& is not valid` | 使用正确的 shell 命令 |
| `Claude Code on Windows requires git-bash` | 安装 Git Bash |
| `Error loading shared library` | 系统安装了错误的二进制变体 |
| Linux 上的 `Illegal instruction` | 架构不匹配 |
| macOS 上的 `dyld: cannot load` | 二进制不兼容，更新 macOS |
| `App unavailable in region` | Claude Code 在您的国家/地区不可用 |
| `unable to get local issuer certificate` | 配置企业 CA 证书 |
| `OAuth error` 或 `403 Forbidden` | 修复身份验证 |

### 快速诊断命令

遇到问题时，先用这些命令快速定位：

```bash
# 1. 检查 Claude Code 是否安装成功
claude --version

# 2. 运行内置诊断工具
/doctor

# 3. 检查网络连通性
curl -sI https://storage.googleapis.com

# 4. 检查 PATH 配置
echo $PATH | tr ':' '\n' | grep -E "(local/bin|\.claude)"

# 5. 查看当前配置文件
cat ~/.claude/settings.json
```

> 💡 **小技巧**：如果网络有问题，可以先测试 `ping 8.8.8.8` 排除是否完全断网。如果 ping 通但 curl 不行，多半是 DNS 或代理配置问题。另外，`/doctor` 命令能自动检测大部分常见配置问题。

<!-- more -->

---

## 二、常见安装问题详解

### 2.1 安装脚本返回 HTML 而不是 shell 脚本

**错误表现**：

```bash
# Bash 中
bash: line 1: syntax error near unexpected token `<'
bash: line 1: `<!DOCTYPE html>'

# PowerShell 中
Invoke-Expression: Missing argument in parameter list.
```

**原因**：安装 URL 返回了 HTML 页面而不是安装脚本。

**解决方案**：

1. **使用替代安装方法**：

```bash
# macOS 或 Linux（Homebrew）
brew install --cask claude-code

# Windows（WinGet）
winget install Anthropic.ClaudeCode
```

2. 几分钟后重试（问题通常是临时的）

### 2.2 安装后 `command not found: claude`

**错误表现**：

| 平台 | 错误消息 |
|------|---------|
| macOS | `zsh: command not found: claude` |
| Linux | `bash: claude: command not found` |
| Windows CMD | `'claude' is not recognized as an internal or external command` |
| PowerShell | `claude : The term 'claude' is not recognized` |

**原因**：安装目录不在 PATH 中。

**解决方案 - macOS/Linux**：

```bash
# 检查目录是否在 PATH 中
echo $PATH | tr ':' '\n' | grep local/bin

# 如果没有输出，添加到 shell 配置

# Zsh（macOS 默认）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Bash（Linux 默认）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**解决方案 - Windows PowerShell**：

```powershell
# 检查目录是否在 PATH 中
$env:PATH -split ';' | Select-String 'local\\bin'

# 如果没有输出，添加到用户 PATH
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
[Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')

# 重启终端使更改生效
```

### 2.3 TLS 或 SSL 连接错误

**错误表现**：

```bash
curl: (35) TLS connect error
schannel: next InitializeSecurityContext failed
Could not establish trust relationship for the SSL/TLS secure channel
```

**解决方案**：

1. **更新系统 CA 证书**：

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install ca-certificates

# macOS（Homebrew）
brew install ca-certificates
```

2. **Windows 上启用 TLS 1.2**：

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
irm https://claude.ai/install.ps1 | iex
```

3. **企业代理环境**：

```bash
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem
```

### 2.4 低内存 Linux 服务器上安装被杀死

**错误表现**：

```bash
Setting up Claude Code...
Installing Claude Code native build latest...
bash: line 142: 34803 Killed    "$binary_path" install
```

**原因**：Linux OOM 杀手终止进程（Claude Code 需要至少 4 GB RAM）。

**解决方案 - 添加交换空间**：

```bash
# 创建 2 GB 交换文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 重试安装
curl -fsSL https://claude.ai/install.sh | bash
```

### 2.5 Docker 中安装挂起

**问题描述**：在 Docker 容器中安装 Claude Code 时，以 root 身份安装到 `/` 可能导致挂起。

**原因**：从 `/` 运行时，安装程序扫描整个文件系统，导致过度的内存使用。

**解决方案**：

1. **在运行安装程序前设置工作目录**：

```dockerfile
WORKDIR /tmp
RUN curl -fsSL https://claude.ai/install.sh | bash
```

2. **增加 Docker 内存限制**（如果使用 Docker Desktop）：

```bash
docker build --memory=4g .
```

### 2.6 Windows：需要 Git Bash

**错误表现**：

```
Claude Code on Windows requires git-bash
```

**解决方案**：

1. 安装 [Git for Windows](https://git-scm.com/downloads/win)，安装时选择 "Add to PATH"

2. 如果已安装但找不到，在 `settings.json` 中配置路径：

```json
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

如果 Git 安装在其他位置，通过在 PowerShell 中运行 `where.exe git` 找到路径，并使用该目录中的 `bin\bash.exe` 路径。

### 2.7 Linux：musl/glibc 二进制不匹配

**错误表现**：

```bash
Error loading shared library libstdc++.so.6: No such file or directory
```

**原因**：安装程序可能为系统下载了错误的二进制变体（musl vs glibc）。

**解决方案**：

1. **检查系统使用的 libc**：

```bash
ldd /bin/ls
# 如果显示 linux-vdso.so 或对 /lib/x86_64-linux-gnu/ 的引用，是 glibc
# 如果显示 musl，是 musl
```

2. **如果实际在 musl 上（Alpine Linux）**，安装所需的包：

```bash
apk add libgcc libstdc++ ripgrep
```

### 2.8 Linux 上的 `Illegal instruction`

**错误表现**：

```bash
bash: line 142: 2238232 Illegal instruction    "$binary_path" install
```

**原因**：下载的二进制文件与 CPU 架构不匹配（如 ARM 服务器接收了 x86 二进制）。

**解决方案**：

1. **验证架构**：

```bash
uname -m
# x86_64 表示 64 位 Intel/AMD
# aarch64 表示 ARM64
```

2. **尝试替代安装方法**：

```bash
brew install --cask claude-code
```

### 2.9 macOS 上的 `dyld: cannot load`

**错误表现**：

```bash
dyld: cannot load 'claude-2.1.42-darwin-x64' (load command 0x80000034 is unknown)
Abort trap: 6
```

**原因**：二进制文件与 macOS 版本或硬件不兼容。

**解决方案**：

1. 检查 macOS 版本（Claude Code 需要 macOS 13.0 或更高）
2. 更新 macOS
3. 使用 Homebrew 作为替代：

```bash
brew install --cask claude-code
```

---

## 三、WSL 相关问题

### 3.1 WSL 中的安装问题

**OS/平台检测问题**：如果在安装期间收到错误，WSL 可能使用 Windows npm。

**解决方案**：

```bash
# 方法 1：安装前设置
npm config set os linux
npm install -g @anthropic-ai/claude-code --force --no-os-check

# 方法 2：不要使用 sudo
```

**Node 未找到错误**：如果运行 `claude` 时看到 `exec: node: not found`，WSL 环境可能使用 Windows 安装的 Node.js。

**检查方法**：

```bash
which npm
which node
# 应该指向以 /usr/ 开头的 Linux 路径，而不是 /mnt/c/
```

**修复**：通过 Linux 发行版的包管理器或 nvm 安装 Node。

### 3.2 nvm 版本冲突

**问题描述**：如果在 WSL 和 Windows 中都安装了 nvm，在 WSL 中切换 Node 版本时可能会遇到版本冲突。这是因为 WSL 默认导入 Windows PATH，导致 Windows nvm/npm 优先。

**识别问题**：

```bash
which npm
which node
# 如果指向 Windows 路径（以 /mnt/c/ 开头），则使用 Windows 版本
```

**主要解决方案：确保 nvm 正确加载**

将以下内容添加到 shell 配置文件（`~/.bashrc`、`~/.zshrc` 等）：

```bash
# 如果存在，加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

**替代方案：调整 PATH 顺序**

```bash
export PATH="$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"
```

### 3.3 WSL2 Sandbox 设置

Sandboxing 在 WSL2 上受支持，但需要安装额外的包。

**错误**：`Sandbox requires socat and bubblewrap`

**解决方案**：

```bash
# Ubuntu/Debian
sudo apt-get install bubblewrap socat

# Fedora
sudo dnf install bubblewrap socat
```

**重要**：WSL1 不支持 sandboxing。如果看到 `Sandboxing requires WSL2`，需要升级到 WSL2 或在不使用 sandboxing 的情况下运行 Claude Code。

### 3.4 WSL2 中 OAuth 登录失败

如果 WSL 无法打开 Windows 浏览器，设置 `BROWSER` 环境变量：

```bash
export BROWSER="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
claude
```

或按 `c` 复制 URL 到 Windows 浏览器。

---

## 四、网络和代理问题

### 4.1 检查网络连接

安装程序从 `storage.googleapis.com` 下载：

```bash
curl -sI https://storage.googleapis.com
```

如果失败，可能原因：
- 企业防火墙阻止 Google Cloud Storage
- 区域网络限制
- TLS/SSL 问题

### 4.2 配置代理

在企业代理后面，安装前设置环境变量：

```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
curl -fsSL https://claude.ai/install.sh | bash
```

### 4.3 无法访问下载服务器

**错误**：`Failed to fetch version from storage.googleapis.com`

**解决方案**：

```bash
# 测试连接
curl -sI https://storage.googleapis.com

# 如果被阻止，使用替代安装
# macOS/Linux
brew install --cask claude-code

# Windows
winget install Anthropic.ClaudeCode
```

---

## 五、权限和身份验证问题

### 5.1 重复的权限提示

每次都批准相同命令很烦人？使用 `/permissions` 允许特定工具自动运行：

```bash
/permissions
# 然后选择要允许的命令
```

### 5.2 身份验证问题

**通用解决方案**：

```bash
# 1. 完全注销
/logout

# 2. 关闭 Claude Code

# 3. 重新启动并登录
claude
```

如果浏览器不自动打开，按 `c` 复制 OAuth URL 到剪贴板。

### 5.3 OAuth 错误：无效代码

**错误**：`OAuth error: Invalid code. Please make sure the full code was copied`

**解决方案**：
- 按 Enter 重试，快速完成登录
- 按 `c` 复制完整 URL
- 远程会话时手动复制 URL 到本地浏览器

### 5.4 登录后 403 Forbidden

**错误**：`API Error: 403 {"error":{"type":"forbidden","message":"Request not allowed"}}`

**排查**：

| 用户类型 | 检查项 |
|---------|--------|
| Claude Pro/Max 用户 | 在 claude.ai/settings 验证订阅是否有效 |
| Console 用户 | 确认账户已分配 "Claude Code" 或 "Developer" 角色 |
| 代理后面 | 企业代理可能干扰 API 请求 |

### 5.5 "未登录"或令牌已过期

如果 Claude Code 在会话后提示再次登录，OAuth 令牌可能已过期。

**解决方案**：

```bash
/login
```

如果经常发生，检查系统时钟是否准确（令牌验证依赖正确的时间戳）。

---

## 六、配置文件位置

了解配置文件位置，方便排查问题：

| 文件 | 目的 |
|------|------|
| `~/.claude/settings.json` | 用户设置（权限、hooks、模型覆盖） |
| `.claude/settings.json` | 项目设置（检入源代码控制） |
| `.claude/settings.local.json` | 本地项目设置（未提交） |
| `~/.claude.json` | 全局状态（主题、OAuth、MCP 服务器） |
| `.mcp.json` | 项目 MCP 服务器（检入源代码控制） |
| `managed-mcp.json` | 托管 MCP 服务器 |
| 托管设置 | 服务器管理、MDM/OS 级别策略 |

> **Windows 用户**：`~` 指用户主目录，如 `C:\Users\YourName`

### 6.1 重置配置

```bash
# 重置所有用户设置和状态
rm ~/.claude.json
rm -rf ~/.claude/

# 重置项目特定设置
rm -rf .claude/
rm .mcp.json
```

---

## 七、性能和稳定性问题

### 7.1 高 CPU 或内存使用

**解决方案**：

1. 定期使用 `/compact` 减少上下文大小
2. 在主要任务之间关闭并重启 Claude Code
3. 将大型构建目录添加到 `.gitignore`

### 7.2 命令挂起或冻结

1. 按 `Ctrl+C` 尝试取消当前操作
2. 如果无响应，关闭终端重新启动

### 7.3 搜索功能不工作

安装系统 `ripgrep`：

```bash
# macOS
brew install ripgrep

# Windows
winget install BurntSushi.ripgrep.MSVC

# Ubuntu/Debian
sudo apt install ripgrep

# Alpine Linux
apk add ripgrep

# Arch Linux
pacman -S ripgrep
```

然后设置环境变量：

```bash
export USE_BUILTIN_RIPGREP=0
```

### 7.4 WSL 上的搜索速度缓慢

**原因**：跨文件系统工作时的磁盘读取性能损失。

**解决方案**：

1. **提交更具体的搜索**：指定目录或文件类型
2. **将项目移到 Linux 文件系统**：确保项目位于 `/home/` 而不是 `/mnt/c/`
3. **改用本机 Windows**：考虑在 Windows 上本机运行 Claude Code

---

## 八、IDE 集成问题

### 8.1 JetBrains IDE 在 WSL2 上未被检测到

**错误**：`No available IDEs detected`

**解决方案 1：配置 Windows 防火墙**（推荐）

```powershell
# 1. 找到 WSL2 IP 地址
wsl hostname -I
# 示例输出：172.21.123.45

# 2. 以管理员身份创建防火墙规则
New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow -RemoteAddress 172.21.0.0/16 -LocalAddress 172.21.0.0/16
```

根据 WSL2 子网调整 IP 范围，然后重启 IDE 和 Claude Code。

**解决方案 2：切换到镜像网络**

在 Windows 用户目录创建 `.wslconfig`：

```ini
[wsl2]
networkingMode=mirrored
```

然后重启 WSL：

```powershell
wsl --shutdown
```

### 8.2 JetBrains 终端中 Escape 键不起作用

如果 `Esc` 键不能按预期中断代理，可能是快捷键冲突。

**解决方案**：

1. 转到 Settings → Tools → Terminal
2. 要么：
   - 取消选中 "Move focus to the editor with Escape"
   - 或单击 "Configure terminal keybindings" 并删除 "Switch focus to Editor" 快捷键
3. 应用更改

### 8.3 报告 Windows IDE 集成问题

如果遇到 IDE 集成问题，请提供以下信息：

| 信息项 | 示例 |
|--------|------|
| 环境类型 | 本机 Windows (Git Bash) 或 WSL1/WSL2 |
| WSL 网络模式（如适用） | NAT 或镜像 |
| IDE 名称和版本 | IntelliJ IDEA 2024.1 |
| Claude Code 扩展版本 | 1.0.0 |
| Shell 类型 | Bash、Zsh、PowerShell 等 |

---

## 九、Markdown 格式问题

Claude Code 有时生成 markdown 文件，代码围栏上缺少语言标签。

### 9.1 代码块中缺少语言标签

**问题**：生成的代码块没有语言标签：

```
```
function example() {
  return "hello";
}
```

**解决方案**：

1. **要求 Claude 添加语言标签**："Add appropriate language tags to all code blocks in this markdown file."
2. **使用后处理 hooks**：设置自动格式化 hooks 检测和添加缺失的语言标签
3. **手动验证**：生成后检查代码块格式

### 9.2 不一致的间距和格式

**解决方案**：

1. **请求格式更正**："Fix spacing and formatting issues in this markdown file."
2. **使用格式化工具**：设置 hooks 运行 `prettier` 或自定义格式化脚本
3. **指定格式化首选项**：在提示或项目内存文件中包含格式化要求

### 9.3 减少 markdown 格式问题

- **在请求中明确**：要求 "properly formatted markdown with language-tagged code blocks"
- **使用项目约定**：在 `CLAUDE.md` 中记录首选的 markdown 风格
- **设置验证 hooks**：使用后处理 hooks 自动验证和修复常见格式问题

---

## 十、获取更多帮助

如果以上都解决不了：

1. **使用 `/bug` 命令**直接向 Anthropic 报告问题

2. **检查 GitHub 仓库**了解已知问题

3. **运行 `/doctor` 诊断**：
   - 安装类型、版本和搜索功能
   - 自动更新状态和可用版本
   - 无效的设置文件（格式错误的 JSON、不正确的类型）
   - MCP 服务器配置错误
   - 快捷键配置问题
   - 上下文使用警告（大型 CLAUDE.md 文件、高 MCP 令牌使用）
   - 插件和代理加载错误

4. **直接问 Claude**——Claude 可以内置访问其文档

---

## 一句话总结

**遇到问题先查速查表，90% 的问题是网络、PATH、权限三类；解决不了就运行 `/doctor` 或用 `/bug` 报告。**

**下一篇**：[精读官方文档：发布说明](./release-notes)

---

*本文精读自 [故障排除](https://code.claude.com/docs/zh-CN/troubleshooting)*

*最后更新：2026-03-27*
