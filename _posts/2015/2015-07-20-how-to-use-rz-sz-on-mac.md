---
layout: post
title:  "在 OS X 下使用 sz/rz 命令进行文件的下载/上传"
date:   2015-07-20 08:12:45 +0800
categories: [Software]
---

`OS X` 自带的终端可以直接连接 `Linux` （相比之下, `Win` 的 `cmd` 就比较渣了）, 但是有个问题就是, 终端无法直接通过 `Zmodem` 来上传和下载文件, 这里就需要一款更强大的远程服务器连接工具: `iTerm` 的帮助了.

网上很多的教程, 但是有的是为了提高访问量随便粘贴的, 完全不负责任, 讲的也不仔细, 我也是连蒙带猜费了半天的劲儿才搞好的, 坑爹. 下面我尽量使用比较浅显的话来给大家讲解.

好了废话不多说, 咱们进入正题: 如何在 `Mac OS X` 下使用 `Zmodem` 中的 `rz/sz` 来上传和下载文件.

## 第一步: 下载 `iTerm2`

首先明确, 使用自带的终端是不行的, 我们需要下载一款比终端更强大的 `shell` 工具: [`iTerm2`](http://www.iterm2.cn/download)
  
下载下来是个 `zip` 的压缩包, 直接解压就得到了以 `.app` 为后缀名的可执行文件, 双击打开就是 `iTerm2` 的窗口了, 过程中有警告窗口的话同意即可（就相当于是 `Win` 下的绿色软件一样无需安装）

## 第二步: 使用 `iTerm2` 安装 `brew`

`brew` 是一个包管理程序, 使用它可以方便的安装各种软件, 而无需输入地址, 作用相当于 `AppStore` 一样, 具体介绍请参看官网. 安装 `brew` 很简单, 使用刚刚下载后解压打开的 `iTerm2`, 输入
```js
ruby -e "$(curl -fsSLhttps://raw.githubusercontent.com/Homebrew/install/master/install)"
```
即可.

注意看安装过程中的提示, 我在文字停止显示时就以为是安装好了, 于是开心的 `ls` 起来, 结果发现停止时是需要按下 `return` 来确认的, 按其他键就会退出安装, 过程需要按下两次 `return`, 最后显示:
```js
Downloading and installing Homebrew...
```
才开始下载和安装 `brew` 这点要记住.

成功会提示这个:
```js
Installation successful!
```


注意, 如果通过 `iTerm2` 的 `brew` 安装不上 `lrzsz`（包括各种情况的报错 ）, 请 [手动下载 `lrzsz`](https://ohse.de/uwe/releases/lrzsz-0.12.20.tar.gz), 这里是 [`lrzsz` 的官网](https://ohse.de/uwe/software/lrzsz.html)

需要将下载的 `zip` 压缩之后放到 `brew` 的缓存目录下: `/Library/Caches/Homebrew/`

## 第三步: 使用 `brew` 安装 `lrzsz`
在 `iTerm2` 中输入:
```js
brew install lrzsz
```
无需操作, 看到成功提示即可.

## 第四步: 配置 `iTerm2`

首先需要下载两个脚本文件, 放到 `/usr/local/bin` 目录下, 这里是 [下载地址](https://github.com/mmastrac/iterm2-zmodem), 点击 `Github` 页面的右下角的 `Download ZIP` 即可.

下载之后解压文件, `cd` 到这个解压的文件夹（名字是 `iterm2-zmodem-master`,要用 `root` 权限: `sudo -i` ）, 通过终端或者 `iTerm2` `copy` 文件到 `/usr/local/bin` 目录即可
命令为（假设当前已经 `cd` 到 `iterm2-zmodem-master` 文件夹）:
```js
cp iterm2-recv-zmodem.sh /usr/local/bin/iterm2-send-zmodem.sh（回车） 
cp iterm2-send-zmodem.sh /usr/local/bin/iterm2-send-zmodem.sh（回车）
```
之后在 `iTerm2` 的设置界面 `iTerm` `偏好设置-> Profiles -> Default -> Advanced -> Triggers` 的 `Edit `按钮
点击 `+` 号, 加上以下 `trigger` 信息(两行):
```js
第一行:
Regular expression: \*\*B0100    Action: Run Silent Coprocess    Parameters: /usr/local/bin/iterm2-send-zmodem.sh 
第二行:
Regular expression: \*\*B00000000000000    Action: Run Silent Coprocess    Parameters: /usr/local/bin/iterm2-recv-zmodem.sh
```
## 第五步: 尽情 `rz/sz` 吧！
之后 ssh 连接服务器, 连接成功之后试试输入 rz 就会弹出一个对话框让选择需要上传的文件, 大功告成！




