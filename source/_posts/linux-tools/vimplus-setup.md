---
title: Ubuntu 重装后 vimplus 一键还原指南
date: 2026-04-01 15:30:00
updated: 2026-04-01 15:30:00
tags:
  - Vim
  - vimplus
  - Ubuntu
  - 环境配置
categories:
  - Linux 工具
description: 重装 Ubuntu 后快速恢复 vimplus 开发环境，从备份还原到插件配置的完整流程，包含踩坑经验和验证清单。
cover: https://picsum.photos/seed/vimplus-setup/1920/1080
source_file: SETUP.md
---

> hippo：每次重装 Ubuntu 最头疼的就是重配 Vim 开发环境。vimplus 帮我省了大量时间，但重装后还原还是有些细节容易忘。这篇把完整流程记录下来，下次重装照着跑就行。

---

## 一、这是什么东西

[vimplus](https://github.com/chxuan/vimplus) 是 chxuan 开发的一键 Vim C/C++ 开发环境配置方案。它预装了 NERDTree（文件树浏览器）、LeaderF（模糊搜索）、coc.nvim（代码智能补全）等插件，装完就能当轻量 IDE 用。

为什么需要这篇？因为 vimplus 的官方安装脚本是一键搞定，但重装系统后的还原并不等于重新跑一遍安装脚本——你的自定义配置、插件偏好、coc 扩展都在之前的目录里。与其从头配，不如把备份好的环境直接搬回来。

<!-- more -->

---

## 二、准备工作

### 2.1 重装前备份

重装之前，先把这几个关键文件打包带走：

```bash
# 打包 vimplus 主目录（包含 .vimrc 和所有插件配置）
tar czf vimplus-backup.tar.gz -C ~ .vimplus

# 单独备份自定义配置（这些文件可能比 .vimplus 内的版本更新）
cp ~/.vimrc.custom.config ~/vimplus-custom-config.backup
cp ~/.vimrc.custom.plugins ~/vimplus-custom-plugins.backup

# 备份 coc.nvim 的语言服务器配置
cp ~/.vim/coc-settings.json ~/coc-settings.backup
```

为什么要单独备份 `.vimrc.custom.config` 和 `.vimrc.custom.plugins`？因为 vimplus 安装时会在 `.vimplus` 目录里放一份默认的 custom 文件，但你日常修改的是 `~/.vimrc.custom.config` 和 `~/.vimrc.custom.plugins`，它们的优先级更高，内容也可能比 `.vimplus` 内的版本更新。恢复时优先用独立备份的版本。

### 2.2 安装系统依赖

重装完系统，先把基础依赖装好。这些是 vimplus 及其插件运行必需的：

```bash
sudo apt update
sudo apt install -y \
    build-essential cmake python3-dev \
    fontconfig universal-ctags ack-grep \
    git vim terminator
```

各依赖的用途如下：

| 包名 | 用途 |
|---|---|
| build-essential | 编译工具链（gcc、make 等），部分 Vim 插件需要本地编译 |
| cmake | 构建系统，coc 等插件的依赖组件需要它 |
| python3-dev | Python 开发头文件，某些插件编译时需要 |
| fontconfig | 字体管理工具，安装 Nerd Font 后需用它刷新缓存 |
| universal-ctags | 代码符号索引引擎，tagbar 插件依赖它来生成函数/变量列表 |
| ack-grep | 代码搜索工具，LeaderF 等插件调用它进行项目级搜索 |
| git | 版本控制，vimplus 插件通过 git 管理 |
| vim | 编辑器本体 |
| terminator | 终端模拟器（可选，但推荐用来替代默认终端） |

### 2.3 安装 Node.js、yarn、clangd、glow

vimplus 的几个关键插件有额外的运行时依赖：

```bash
# 安装 Node.js v22 LTS（通过 NodeSource）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 yarn（markdown-preview.nvim 插件依赖它构建）
npm install -g yarn

# 安装 clangd（C/C++ 语言服务器，提供智能补全、跳转、诊断）
sudo apt install -y clangd

# 安装 glow（终端 Markdown 渲染器，,mp 和 ,mv 快捷键依赖）
sudo snap install glow
```

装完验证一下版本：

```bash
node --version    # 应该是 v22.x
yarn --version    # 1.x 或 4.x 均可
clangd --version  # 任意版本即可
glow --version    # 任意版本即可
```

---

## 三、分步还原

### 3.1 恢复 vimplus 目录并建立配置链接

先把备份的 `.vimplus` 解压到 home 目录，然后建立必要的符号链接：

```bash
# 解压备份到 home 目录
tar xzf vimplus-backup.tar.gz -C ~

# 建立 .vimrc 符号链接（vimplus 的配置通过符号链接管理）
rm -f ~/.vimrc
ln -s ~/.vimplus/.vimrc ~/.vimrc

# 恢复自定义配置（优先使用独立备份的版本）
rm -f ~/.vimrc.custom.plugins
cp ~/vimplus-custom-plugins.backup ~/.vimrc.custom.plugins
cp ~/vimplus-custom-config.backup ~/.vimrc.custom.config

# 建立 Vim 运行时目录的符号链接
mkdir -p ~/.vim
ln -sf ~/.vimplus/colors ~/.vim/colors
ln -sf ~/.vimplus/ftplugin ~/.vim/ftplugin
ln -sf ~/.vimplus/autoload ~/.vim/autoload

# 恢复 coc-settings.json
mkdir -p ~/.vim
cp ~/coc-settings.backup ~/.vim/coc-settings.json
```

这里解释一下几个链接的作用：

- `.vimrc → ~/.vimplus/.vimrc`：Vim 启动时读取的主配置，vimplus 通过这个符号链接加载它的预设配置
- `colors/ftplugin/autoload`：分别提供配色方案、文件类型插件、自动加载脚本，链接到 `.vimplus` 目录保证路径一致
- `.vimrc.custom.config` 和 `.vimrc.custom.plugins`：vimplus 的 `.vimrc` 会 source 这两个文件，你的个人配置都放这里，不会和上游冲突

### 3.2 安装字体和插件

vimplus 使用 Nerd Font（打补丁的等宽字体，包含编程图标）。把它安装到用户字体目录：

```bash
# 安装 Nerd Font 到用户字体目录
mkdir -p ~/.local/share/fonts
cp ~/.vimplus/fonts/"Droid Sans Mono Nerd Font Complete.otf" ~/.local/share/fonts/
fc-cache -vf ~/.local/share/fonts
```

然后在终端的偏好设置里把字体改成 `Droid Sans Mono Nerd Font`，否则文件树和状态栏的图标会显示为方块。

接下来安装所有 Vim 插件：

```bash
# 批量安装所有插件
vim -c "PlugInstall" -c "q" -c "q"
```

这条命令会打开 Vim，自动执行 `:PlugInstall` 安装 `.vimrc` 中声明的所有插件，安装完自动退出。

### 3.3 配置 coc.nvim

[coc.nvim](https://github.com/neoclide/coc.nvim) 是 Vim 的 LSP 客户端（Language Server Protocol，一种让编辑器连接语言服务器的标准协议）。它配合 clangd 提供 C/C++ 的智能补全、跳转到定义、实时诊断等功能。

先确认 `coc-settings.json` 已恢复。如果没有备份，创建一个最小配置：

```bash
cat > ~/.vim/coc-settings.json << 'EOF'
{
  "suggest.noselect": true,
  "coc.preferences.formatOnSave": false
}
EOF
```

然后在 Vim 里安装 coc-clangd 扩展：

```bash
# 打开任意文件，在 Vim 中执行
vim -c "CocInstall coc-clangd" -c "q" -c "q"
```

安装完成后，打开一个 C/C++ 文件验证 clangd 是否正常工作：

```bash
vim test.c
# 在 Vim 中输入 :CocInfo 查看 coc 状态
# 输入 :CocCommand clangd.workspace.diagnostic 检查 clangd 连接
```

---

## 四、踩坑经验

### 4.1 markdown-preview.nvim 报 yarn 错误

`PlugInstall` 安装 markdown-preview.nvim 时，大概率会报类似这样的错误：

```
yarn install v1.22.x
error An unexpected error occurred
```

原因是这个插件需要在安装后用 yarn 手动构建。解决方法：

```bash
# 手动进入插件目录执行 yarn install
cd ~/.vim/plugged/markdown-preview.nvim && yarn install && cd app && yarn install
```

构建完成后，用 `,mp` 快捷键（或在 Vim 中输入 `:MarkdownPreview`）就可以在浏览器里预览 Markdown 文件了。

### 4.2 自定义配置恢复顺序

前面提到 `.vimrc.custom.config` 要优先用独立备份。原因是 vimplus 的 `.vimplus` 目录里有一份默认的 `.vimrc.custom.config`，但你在日常使用中修改的版本在 `~/.vimrc.custom.config`。如果直接解压 `.vimplus` 然后忘记覆盖，就会丢失你的自定义配置（比如相对行号、鼠标支持、高亮当前列等设置）。

### 4.3 字体不生效

装完 Nerd Font 并在终端设置里选了字体，但图标还是方块？需要确认两件事：

1. `fc-cache -vf ~/.local/share/fonts` 执行过（刷新字体缓存）
2. **关闭终端并重新打开**（终端在启动时加载字体，中途改设置不会立即生效）

---

## 五、验证清单

还原完成后，打开一个 C/C++ 文件，逐项验证：

| 功能 | 快捷键/命令 | 预期结果 |
|---|---|---|
| 文件树 | `,n` | 左侧打开 NERDTree 文件浏览器 |
| 模糊搜索文件 | `,f` | 弹出 LeaderF 文件搜索窗口 |
| 代码补全 | 输入代码时自动触发 | 弹出补全菜单，显示函数/变量候选 |
| 跳转到定义 | `gd` | 光标跳转到函数/变量的定义位置 |
| 查看引用 | `gr` | 显示当前符号的所有引用位置 |
| 实时诊断 | 打开有问题的文件 | 有错误的位置显示红色波浪线 |
| Tagbar | `,t` | 右侧打开代码符号列表（函数、变量、宏） |
| Markdown 预览 | `,mp` | 浏览器打开 Markdown 实时预览 |
| 终端 Markdown | `,mv` | 终端内用 glow 渲染 Markdown |
| 多光标编辑 | `Ctrl+n` 选中 → `c` 修改 | 支持多光标同时编辑 |

如果所有功能都正常，恭喜，环境还原完成。

---

## 六、小结

重装后还原 vimplus 环境，核心就是三步：**备份还原 → 建立链接 → PlugInstall**。只要备份了 `.vimplus` 目录和三个自定义配置文件，重装后 10 分钟内就能恢复熟悉的开发环境。

如果想扩展其他语言支持，可以装更多 coc 扩展：

| 扩展名 | 语言 | 安装命令 |
|---|---|---|
| coc-pyright | Python | `:CocInstall coc-pyright` |
| coc-json | JSON | `:CocInstall coc-json` |
| coc-html | HTML | `:CocInstall coc-html` |
| coc-css | CSS | `:CocInstall coc-css` |
| coc-sh | Bash | `:CocInstall coc-sh` |

---

*最后更新：2026-04-01*
