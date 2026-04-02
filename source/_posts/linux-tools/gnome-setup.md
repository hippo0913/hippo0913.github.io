---
title: Ubuntu 22.04 GNOME 桌面环境配置指南
date: 2026-04-02 16:00:00
updated: 2026-04-02 16:00:00
tags:
  - Ubuntu
  - 环境配置
categories:
  - Linux 工具
description: 基于 Ubuntu 22.04 / GNOME 42.9 / X11 的桌面环境配置指南，涵盖 GNOME 扩展推荐、主题外观、常用 gsettings 配置和踩坑经验。
cover: https://picsum.photos/seed/gnome-setup/1920/1080
---

> hippo：装完 Ubuntu 桌面不调教一下总觉得差点意思。这篇记录我配置 GNOME 桌面的完整流程，按顺序跑下来就能得到一个顺手又好看的桌面。

---

## 一、这是什么东西

GNOME 是 Ubuntu 的默认桌面环境，开箱可用但有些地方不够趁手：没有系统监控、窗口切换不好看、扩展管理全靠手动……

本文覆盖 GNOME 桌面环境的外观美化、扩展安装和常用配置，基于我的实际环境（Ubuntu 22.04 LTS / GNOME 42.9 / X11），照着做就能配出一套顺手的桌面。

<!-- more -->

---

## 二、确认系统信息

动手之前先看看当前环境，后面的步骤会用到这些信息：

```bash
# 系统版本
lsb_release -a

# GNOME 版本
gnome-shell --version

# 会话类型（X11 或 Wayland，影响部分扩展兼容性）
echo $XDG_SESSION_TYPE

# 已安装的扩展
gnome-extensions list
```

---

## 三、动画加速

通过环境变量加速窗口动画，不需要额外装扩展：

编辑 `/etc/environment`，添加一行：

```
GNOME_SHELL_ANIMATION_SPEED_FACTOR=0.75
```

修改后注销重新登录生效。为什么用 `/etc/environment`：GNOME Shell 由 GDM（显示管理器）启动，不走 shell 配置文件，而 `/etc/environment` 由 PAM 读取，对所有登录会话生效。

---

## 四、主题与外观

### 4.1 基础外观设置

```bash
# GTK 主题（Ubuntu 自带的蓝色变体）
gsettings set org.gnome.desktop.interface gtk-theme 'Yaru-blue'

# 图标主题
gsettings set org.gnome.desktop.interface icon-theme 'Yaru-blue'

# 暗色模式
gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'

# 窗口按钮布局（左上角：图标 + 最小化 + 最大化 + 关闭）
gsettings set org.gnome.desktop.wm.preferences button-layout 'icon:minimize,maximize,close'

# 顶栏显示星期几和秒
gsettings set org.gnome.desktop.interface clock-show-weekday true
gsettings set org.gnome.desktop.interface clock-show-seconds true
```

### 4.2 安装第三方主题

如果想用 Adw-gtk、Catppuccin 等第三方主题，需要先启用 User Themes 扩展（见下一节）。主题文件放在以下位置：

| 类型 | 路径 |
|------|------|
| GTK 主题 | `~/.themes/<主题名>/gtk-4.0/` |
| Shell 主题 | `~/.themes/<主题名>/gnome-shell/` |
| 图标主题 | `~/.icons/` |

应用第三方 Shell 主题：

```bash
gnome-extensions enable user-theme@gnome-shell-extensions.gcampax.github.com
gsettings set org.gnome.shell.extensions.user-theme name '主题名'
```

---

## 五、GNOME 扩展

### 5.1 安装方式

**方式一：浏览器安装（推荐）**

```bash
sudo apt install gnome-browser-connector
```

然后访问 https://extensions.gnome.org ，搜索扩展，切换开关即可安装。

**方式二：命令行手动安装**

```bash
# 下载扩展 zip
wget -O ext.zip "https://extensions.gnome.org/download-extension/UUID.shell-extension.zip?version_tag=TAG"

# 解压到本地扩展目录
mkdir -p ~/.local/share/gnome-shell/extensions/UUID
unzip ext.zip -d ~/.local/share/gnome-shell/extensions/UUID

# 重启 GNOME Shell（仅 X11 有效，Wayland 需注销重新登录）
killall -HUP gnome-shell

# 启用
gnome-extensions enable UUID
```

### 5.2 扩展管理常用命令

```bash
gnome-extensions list              # 列出所有已安装扩展
gnome-extensions list --enabled    # 只看已启用的
gnome-extensions info <UUID>       # 查看扩展详情
gnome-extensions enable <UUID>     # 启用
gnome-extensions disable <UUID>    # 禁用

# 卸载：直接删除目录
rm -rf ~/.local/share/gnome-shell/extensions/<UUID>     # 用户安装
sudo rm -rf /usr/share/gnome-shell/extensions/<UUID>    # 系统安装
```

### 5.3 推荐扩展清单

我在用的 14 个扩展：

| 扩展 | 用途 | 来源 |
|------|------|------|
| Applications Menu | 顶栏应用分类菜单 | 系统自带 |
| User Themes | 允许加载第三方 Shell 主题 | 系统自带 |
| Native Window Placement | Overview 中窗口紧凑排列 | 系统自带 |
| Ubuntu Dock | 左侧任务栏 | Ubuntu 默认 |
| Vitals | 系统监控（温度/CPU/内存） | 手动安装 |
| Coverflow Alt-Tab | Alt+Tab 3D 窗口切换效果 | 手动安装 |
| AppIndicator Support | 系统托盘图标支持 | 手动安装 |
| Logo Menu | 左上角发行版图标菜单 | 手动安装 |
| Lunar Calendar 农历 | 顶栏显示农历 | 手动安装 |
| Add to Desktop | 右键发送应用到桌面 | 手动安装 |
| Workspace indicator | 顶栏工作区指示器 | 手动安装 |
| Compiz windows effect | 窗口晃动效果 | 手动安装 |
| Compiz magic lamp | 最小化果冻效果 | 手动安装 |
| Lock screen background | 锁屏壁纸自定义 | 手动安装 |

---

## 六、常用 gsettings 配置

### 6.1 窗口管理

```bash
# 窗口吸附（拖到屏幕边缘自动半屏/最大化）
gsettings set org.gnome.mutter edge-tiling true

# 新窗口居中
gsettings set org.gnome.mutter center-new-windows true

# 固定为 1 个工作区（不常用多工作区的话建议关掉动态工作区）
gsettings set org.gnome.mutter dynamic-workspaces false
gsettings set org.gnome.desktop.wm.preferences num-workspaces 1
```

### 6.2 文件管理器（Nautilus）

```bash
# 显示隐藏文件
gsettings set org.gnome.nautilus.preferences show-hidden-files true

# 默认列表视图
gsettings set org.gnome.nautilus.preferences default-folder-viewer 'list-view'
```

### 6.3 自定义快捷键示例

```bash
# Ctrl+Alt+T 打开终端
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings \
  "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/']"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ name 'Terminal'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ command 'gnome-terminal'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ binding '<Control><Alt>t'
```

---

## 七、踩坑经验

### 7.1 GNOME Shell 内存占用过高

```bash
# 查看内存占用
ps aux | grep gnome-shell

# 扩展冲突排查：先全部禁用，再逐个启用
gnome-extensions list --enabled | while read ext; do gnome-extensions disable "$ext"; done
# 然后逐个启用，找到吃内存的那个
```

### 7.2 X11 vs Wayland

Ubuntu 22.04 默认 Wayland，但部分扩展（如 Compiz 效果类）在 X11 下兼容性更好。登录界面右下角齿轮可以切换：

- **X11**：`killall -HUP gnome-shell` 可重启 Shell，扩展兼容性好
- **Wayland**：更安全流畅，但部分扩展不兼容，Shell 崩溃需重新登录

如果用的是 Compiz 系扩展，建议切到 X11。

### 7.3 扩展安装后不生效

手动安装的扩展需要重启 GNOME Shell 才能识别：
- X11：`killall -HUP gnome-shell`
- Wayland：注销重新登录

---

## 八、配置备份

配好之后建议记录以下信息，方便以后在新环境快速还原：

```bash
# 导出当前启用的扩展列表
gnome-extensions list --enabled > ~/gnome-extensions.list

# 导出关键 gsettings（外观、窗口管理）
gsettings get org.gnome.desktop.interface gtk-theme > ~/gnome-settings.backup
gsettings get org.gnome.desktop.interface color-scheme >> ~/gnome-settings.backup
gsettings get org.gnome.desktop.wm.preferences button-layout >> ~/gnome-settings.backup
```

还原时按本文顺序重新执行即可：外观设置 → 安装扩展 → gsettings 配置。

---

*最后更新：2026-04-02*
