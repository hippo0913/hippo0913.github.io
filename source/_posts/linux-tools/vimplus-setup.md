---
title: Ubuntu vimplus 安装配置指南
date: 2026-04-01 15:30:00
updated: 2026-04-02 10:00:00
tags:
  - Vim
  - vimplus
  - Ubuntu
  - 环境配置
categories:
  - Linux 工具
description: 在 Ubuntu 上从零安装 vimplus，打造开箱即用的 Vim C/C++ 开发环境，包含依赖安装、插件配置、踩坑经验和验证清单。
cover: https://picsum.photos/seed/vimplus-setup/1920/1080
---

> hippo：想用 Vim 写 C/C++ 但不想一个一个配插件？vimplus 一键搞定。这篇记录完整的安装流程，照着跑就能得到一个趁手的开发环境。

---

## 一、这是什么东西

[vimplus](https://github.com/chxuan/vimplus) 是 chxuan 开发的一键 Vim C/C++ 开发环境配置方案。它预装了 NERDTree（文件树浏览器）、LeaderF（模糊搜索）、coc.nvim（代码智能补全）等插件，装完就能当轻量 IDE 用。

本文覆盖从安装依赖到最终验证的完整流程，同时记录了实际使用中遇到的坑和解决办法。

<!-- more -->

---

## 二、安装系统依赖

先把基础依赖装好。这些是 vimplus 及其插件运行必需的：

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

---

## 三、安装 Node.js、yarn、clangd、glow

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

## 四、安装 vimplus

### 4.1 运行一键安装脚本

```bash
git clone https://github.com/chxuan/vimplus.git ~/.vimplus
cd ~/.vimplus
./install.sh
```

安装脚本会自动完成以下操作：
- 在 `~/.vimplus` 目录下创建插件配置
- 建立 `~/.vimrc` 符号链接指向 `~/.vimplus/.vimrc`
- 生成 `.vimrc.custom.config` 和 `.vimrc.custom.plugins` 两个自定义配置文件

脚本执行完毕后，Vim 的插件管理框架就绑好了。接下来需要安装插件本体。

### 4.2 安装 Vim 插件

```bash
# 批量安装所有插件
vim -c "PlugInstall" -c "q" -c "q"
```

这条命令会打开 Vim，自动执行 `:PlugInstall` 安装 `.vimrc` 中声明的所有插件，安装完自动退出。

### 4.3 安装 Nerd Font

vimplus 使用 Nerd Font（打补丁的等宽字体，包含编程图标）。安装到用户字体目录：

```bash
# 安装 Nerd Font 到用户字体目录
mkdir -p ~/.local/share/fonts
cp ~/.vimplus/fonts/"Droid Sans Mono Nerd Font Complete.otf" ~/.local/share/fonts/
fc-cache -vf ~/.local/share/fonts
```

然后在终端的偏好设置里把字体改成 `Droid Sans Mono Nerd Font`，否则文件树和状态栏的图标会显示为方块。

---

## 五、配置 coc.nvim

[coc.nvim](https://github.com/neoclide/coc.nvim) 是 Vim 的 LSP 客户端（Language Server Protocol，一种让编辑器连接语言服务器的标准协议）。它配合 clangd 提供 C/C++ 的智能补全、跳转到定义、实时诊断等功能。

先创建 coc 的配置文件（如果安装脚本没有自动生成）：

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

## 六、踩坑经验

### 6.1 markdown-preview.nvim 报 yarn 错误

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

### 6.2 字体不生效

装完 Nerd Font 并在终端设置里选了字体，但图标还是方块？需要确认两件事：

1. `fc-cache -vf ~/.local/share/fonts` 执行过（刷新字体缓存）
2. **关闭终端并重新打开**（终端在启动时加载字体，中途改设置不会立即生效）

---

## 七、验证清单

安装完成后，打开一个 C/C++ 文件，逐项验证：

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

如果所有功能都正常，开发环境就配置完成了。

---

## 八、扩展其他语言

如果想支持更多语言，装对应的 coc 扩展即可：

| 扩展名 | 语言 | 安装命令 |
|---|---|---|
| coc-pyright | Python | `:CocInstall coc-pyright` |
| coc-json | JSON | `:CocInstall coc-json` |
| coc-html | HTML | `:CocInstall coc-html` |
| coc-css | CSS | `:CocInstall coc-css` |
| coc-sh | Bash | `:CocInstall coc-sh` |

---

## 九、备份与迁移

配置好之后，建议备份以下文件，方便以后在新机器上快速还原：

```bash
# 打包 vimplus 主目录
tar czf vimplus-backup.tar.gz -C ~ .vimplus

# 备份自定义配置和 coc 配置
cp ~/.vimrc.custom.config ~/vimplus-custom-config.backup
cp ~/.vimrc.custom.plugins ~/vimplus-custom-plugins.backup
cp ~/.vim/coc-settings.json ~/coc-settings.backup
```

还原时解压并恢复符号链接即可：

```bash
tar xzf vimplus-backup.tar.gz -C ~
rm -f ~/.vimrc && ln -s ~/.vimplus/.vimrc ~/.vimrc
cp ~/vimplus-custom-plugins.backup ~/.vimrc.custom.plugins
cp ~/vimplus-custom-config.backup ~/.vimrc.custom.config
mkdir -p ~/.vim
ln -sf ~/.vimplus/colors ~/.vim/colors
ln -sf ~/.vimplus/ftplugin ~/.vim/ftplugin
ln -sf ~/.vimplus/autoload ~/.vim/autoload
cp ~/coc-settings.backup ~/.vim/coc-settings.json
vim -c "PlugInstall" -c "q" -c "q"
```

---

*最后更新：2026-04-02*
