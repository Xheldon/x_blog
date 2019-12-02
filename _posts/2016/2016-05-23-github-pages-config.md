---
layout: post
title:  "关于本博客域名优化配置的几点说明"
date:   2016-05-23 22:13:15 +0800
categories: [Web]
---

决定在 `GitHub Pages` 搞个静态博客的时候, 我就想要尽可能的加快打开速度, 因此使用了一些雕虫小技来加快打开速度, 提高用户体验.

## 优化

### 使用百度 CDN 服务和七牛静态资源托管

本博客使用了 `Bootstrap/jQuery/fontawsome` 这三个库/字体文件, 因为 `Bootstrap` 我根据实际情况, 自己修改了些许内容以更加配合排版, 因此没有使用第三方的 `CDN`, 而是放在了七牛的资源服务器上, `jQuery` 使用的则是百度的静态公共资源服务.

这里打个广告吧, 对于个人用户而言, 七牛在使用支付宝实名认证之后, 有 10G 的免费存储空间, 从实际效果看, 速度还是可以的, 我把域名 `img.xheldon.com CNAME` 到了七牛的资源服务器, 以供一些静态资源如上述的定制版 `Bootstrap` 和图片, 因此使用的时候只需要上传文件写好路径即可, 然后使用 `img.xheldon.com/path/filename.ext` 即可:

> 2019 年 9 月 3 日更新: 因为我的域名放到了 Godaddy 没有在国内备案(在国内怕被封), 而没有备案的域名七牛是无法解析的, 因此我只能将图片和文章放到一起了, 这就导致我写文章的时候尽量不用图片 -_-

说实话, 因为是静态博客, 所以请求带的 `Cookie` 不是很大, 因此将资源放到另一个二级域名的优化的作用不是很大, 不过聊胜于无.

### 将小资源直接放到页面中

我将一些小的 `css` 和 `js` 直接放到页面中, 如 `highlight.css` 和 `search.js`, 都通过 `style` 和 `script` 标签直接写到了页面中, 这样做的好处是很大的, 因为这两个文件小, 下载文件所需要的时间可以忽略不计, 如果使用外部引入的形式, 那么加载这两个文件的时间主要消耗在了 [`TTFB`](https://developers.google.com/web/tools/chrome-devtools/network-performance/reference#timing) (需FQ)上了:

![TTFB](/static/img/2016/TTFB.png "TTFB")

## 设置

因为年轻的时候没有见过世面, 于是直接将本站的 `A` 记录的 `www` 指向了 `Github Pages` 的 `IP 192.30.252.154/192.30.252.153`, 而把顶级域名 `@` 错误的使用 `CNAME` 指向了 `xheldon.github.io.`, 其实如果你没有 `MX` 指向 `@` 的话, 这样做是 `OK` 的, 但是因为我想在写简历的时候搞的酷一点, 使用自己博客的域名作为邮箱, 然后使用了 `QQ` 邮箱提供的域名邮箱服务, 因此在做 `MX` 解析的时候, 需要将顶级域名 `@`
指向腾讯的 `mxdomain.qq.com`, 这个时候就报错了, 阿里云提示说 `CNAME` 和 `MX` 不能都指向顶级域名 `@`, 具体原因可以[看这里](https://www.zhihu.com/question/21128056), 但是到现在博客已经迁移几个月了, 一些链接也已经被搜索引擎抓取过了, 现在再修改的话链接的话损失有点大.

我最开始的配置是这样的:

| 记录类型   | 主机记录| 记录值 |
|:------:|:------:|:------:|
| CNAME | @ | xheldon.github.io. |
| A | www | 192.30.252.154 |
| A | www | 192.30.252.153 |

因为使用腾讯域名邮箱, 所以需要做 `MX` 记录到 `@`, 而 `MX` 的 `@` 不能和 `CNAME` 的 `@` 共存, 于是我想到了隐形 `URL` 转发, 取消了 `CNAME` 指向 `@`, 增加了 `MX` 记录指向 `@` ,然后新增了隐性 `URL`:

| 记录类型 | 主机记录 | 记录值 |
| :------:| :------: | :------: |
| A | www | 192.30.252.154 |
| A | www | 192.30.252.153 |
| MX | @ | mxdomain.qq.com. |
| CNAME | qqmailhash | mail.qq.com. |
| 隐形URL | @ | http://www.xheldon.com |

同时将博客分支目录的 `CNAME` 文件从 `xheldon.com` 改成了 `www.xheldon.com` 然后发现从搜索引擎访问博客的话, 比如 `xheldon.com/about/`, 确实是跳转到了这个博客, 但是仅仅停留在首页! 也就是说, 之前被搜索引擎抓取的任何链接都只停留在首页 `www.xheldon.com` 这个地方, 这就意味着, 隐性转发的作用其实是对特定的地址做跳转, 并不会将地址后的路径自动加上去, 就比如我的情况, 隐形 `URL` 转发, 设置了从 `xheldon.com` 转发到 `www.xheldon.com` 之后, 所有的访问 `xheldon.com/xxxx` 的请求, 也都被转发到了 `www.xheldon.com`, 而不是期望的 `www.xheldon.com/xxxx`.

此时 `dig xheldon.com`:

```js
; <<>> DiG 9.8.3-P1 <<>> xheldon.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 20871
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;xheldon.com.			IN	A

;; ANSWER SECTION:
xheldon.com.		585	IN	A	42.156.141.13

;; Query time: 7 msec
;; SERVER: 172.168.200.110#53(172.168.200.110)
;; WHEN: Thu Mar 30 10:06:41 2017
;; MSG SIZE  rcvd: 45
```

发现顶级域名指向的是阿里云的一个 `IP`.

于是我想了下, 修改了一下 `A` 记录的 `@` , 将其直接指向 `GitHub Pages` 的 `IP` 地址, 而博客根目录的 `CNAME` 文件内容是修改后的 `www.xheldon.com`:

| 记录类型 | 主机记录 | 记录值 |
| :------:| :------: | :------: |
| A | @ | 192.30.252.154 |
| A | @ | 192.30.252.153 |
| MX | @ | mxdomain.qq.com |
| CNAME | qqmailhash | mail.qq.com. |
| CNAME | www | github.xheldon.com. |

之所以可以这么做, 是因为 `Github Pages` [自动匹配](https://help.github.com/articles/setting-up-an-apex-domain-and-www-subdomain/), 具体解释起来就是:

1. 如果 `CNAME` 文件内容是 `www.xheldon.com`, 而发现有来自 `xheldon.com` 的请求时候(需要配置顶级域名 `@` 的 `A` 记录指向 `GitHub Pages` 的 `IP` 实现), 就转发到 `www.xheldon.com`.
2. 如果 `CNAME` 文件内容是 `xheldon.com`, 而发现有来自 `www.xheldon.com` 的请求时候(需要配置 `www` 的二级域名 `A` 记录指向 `GitHub Pages` 的 `IP` 实现), 就转发到 `xheldon.com`.

这个时候 `dig www.xheldon.com` 发现:

```js
; <<>> DiG 9.8.3-P1 <<>> www.xheldon.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 56061
;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;www.xheldon.com.		IN	A

;; ANSWER SECTION:
www.xheldon.com.	600	IN	CNAME	xheldon.github.io.
xheldon.github.io.	3600	IN	CNAME	github.map.fastly.net.
github.map.fastly.net.  28  IN      A      151.101.100.133

;; Query time: 178 msec
;; SERVER: 172.168.200.110#53(172.168.200.110)
;; WHEN: Thu Mar 30 10:20:30 2017
;; MSG SIZE  rcvd: 115
```

`dig xheldon.com` 发现:

```js
; <<>> DiG 9.8.3-P1 <<>> xheldon.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 59875
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;xheldon.com.			IN	A

;; ANSWER SECTION:
xheldon.com.		600	IN	A	192.30.252.154
xheldon.com.		600	IN	A	192.30.252.153

;; Query time: 462 msec
;; SERVER: 172.168.200.110#53(172.168.200.110)
;; WHEN: Thu Mar 30 12:32:23 2017
;; MSG SIZE  rcvd: 61
```









