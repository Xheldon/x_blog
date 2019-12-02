---
layout: post
title:  "环境配置/常用软件汇总"
date:   2016-07-08 20:33:34 +0800
categories: [Software]
---

每次拿到一个新电脑, 总是手忙脚乱的安装一堆的工具, 有时候还总是忘记装一些软件, 等到用到的时候才想起来下载, 而刚进入工作的时候上司交代的第一件事往往就是"刚来先熟悉一下环境, 配置一下自己的电脑". 因此这篇文章记录下我常用的软件, 以备不时之需.

`QQ/OneNote微信/网易云音乐`可以直接在 `Mac App` 的热门免费软件中下载.

1. `Shadowsocks` 放在百度网盘, 为了下一步下载 `Chrome` 

2. 迅雷 使用 `Safari` 自带的下载工具下载后面的软件, 巨慢.

3. `Chrome`

4. `Webstrom`  激活服务器: `http://idea.iteblog.com/key.php`

5. `Sublime3`

   1. 激活 `key`:
	```shell-session
       —– BEGIN LICENSE —–
		Nicolas Hennion
		Single User License
		EA7E-866075
		8A01AA83 1D668D24 4484AEBC 3B04512C
		827B0DE5 69E9B07A A39ACCC0 F95F5410
		729D5639 4C37CECB B2522FB3 8D37FDC1
		72899363 BBA441AC A5F47F08 6CD3B3FE
		CEFB3783 B2E1BA96 71AAF7B4 AFB61B1D
		0CC513E7 52FF2333 9F726D2C CDE53B4A
		810C0D4F E1F419A3 CDA0832B 8440565A
		35BF00F6 4CA9F869 ED10E245 469C233E
   		—— END LICENSE ——
	```
   2. 安装边栏增强工具 `SideBarEnhancements`

		command+shift+p 输入 install 回车, 之后重复按 command+shift+p 输入 SideBarEn 回车

   3. 安装 `Sublime` 插件 `Terminal`(在 `Sublime` 中打开 `Terminal`)
   		
		command+shift+p 输入 Terminal 回车.

   	> 设置 "terminal": "iTerm2-v3.sh" 使用 iTerm2 打开当前文件

6. `iTerm2`
	```shell-session
    ssh -p 端口 用户名@ip
	```
7. `Node`
    
8. `Oh My Zsh`
	```shell-session
	sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
	```
9. `git`
	```shell-session
	公钥配置: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
	配置用户: git config --global user.name "Xheldon"
	配置邮箱: git config --global user.email "c1006044256@gmail.com"
	```
10. `sougou` 输入法

11. `charles` 抓包工具, 下载补丁替换 charles.jar 即可破解.
    
12. `XCode` 一些东西依赖其 `cli`

13. 安装 `homebrew`
	```shell-session
	/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
	```
14. 本地配置 `Jeklly` 环境
	> `ruby` 需要2.1或更高版本.

    1. 安装 `rvm`(稍久, 机器会发热)
    	```shell-session
    	\curl -sSL https://get.rvm.io \| bash -s stable --ruby
    	```

    	> 之后关闭所有 `shell` 继续下面的步骤, 或者运行 `source /Users/Xheldon/.rvm/scripts/rvm` 之后再继续下面的步骤.

    2. 查看已知 `ruby` 版本
    	```shell-session
    	rvm list known
    	```
    3. 安装 `ruby2.2.0`
    	```shell-session
    	rvm install 2.2.0
    	```

    	> 期间需要 mkdir -p /tec/openssl 的权限, 因此需要输入密码.

    4. 更换 `gem source`:
    	```shell-session
    	gem sources -l //查看当前源
    	gem source --remote https://rubygems.org/ //移除当前源
    	gem source -a https://gems.ruby-china.org  //新增源
    	```
    5. 安装 `bundler`
    	```shell-session
    	gem install bundler
    	```
    6. 安装 `jekyll` 和其他依赖.

    	> cd 到项目根目录(假设你已经 `clone` 了 `jekyll` 博客)执行:

    	```shell-session
    	bundle install
    	```

    	> 完成后即可执行 `bundle exec jekyll serve` 查看本地起的 `jekyll`(如果提示找不到 bundle 命令, 重新执行第五六步即可)


## 其他

可能需要的操作:

1. 允许任何安装来源:
	```shell-session
    sudo spctl --master-disable
	```





