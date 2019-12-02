---
layout: post
title:  "我对 CORS 的探究"
date:   2016-07-07 20:56:45 +0800
categories: [Web]
---

## 本文由来

看网上某篇 `CORS` 资料的时候, 被一句话迷惑了: '注意, 设置了 `withCredentials = true` 之后, 携带的 `cookie` 是目标域的 `cookie`', 我十分不解: 当前域假设为 `a.com` 发送 `xhr` 到 `b.com`, 当然是把源域 `a.com` 的 `cookie`, 发送给 `b.com` 来处理啊, 怎么会携带的是目标域(这里我理解为 `b.com`)的 `cookie` 呢? 因此我开始了探究(先说结论: 我查看的资料的说法确实是正确的, 携带的确实是目标域 `b.com` 的 `cookie`).

## 小目标-1: 简单请求下让 `a.com` 发送 `ajax` 到 `b.com`

什么是简单请求请自行谷歌/SO. 这里注意一个基本事实, `cookie` 是跟随着 `域名` 的, 而不是跟随着 `IP地址`, 我在本地起了一个简单的能处理 `cookie` 的 `express` 服务, 同时在我的 `VPS` 上也起了一个相同的服务, 然后通过修改 `hosts` 来实现不同的域名:

```js
// 修改 hosts 如下
// 本机 ip
172.16.26.57 www.a.com
// VPS ip
45.78.41.32 www.b.com
```

首先是在 `VPS` 服务器上启动一个 `express` 服务, 不设置任何东西, 只是简单的返回 `header`, 端口起在 `9091`:

```js
var express = require('express');
var app = express();

app.get('/', function(req, res, next){
  res.send(req.headers);
});

app.listen(9091);
```

`a.com` 的 `Server` 端基本一样, 只是加了个静态页为了发送 `ajax`, 端口起在 `9090`:

```js
var express = require('express');
var app = express();
var path = require('path');
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(9090);
```

`index.html` 内容:

```html
<!DOCTYPE html>
<html>
<head>
  <title>a.com</title>
</head>
<body>
<button id="button">点我发请求, 打开控制台查看信息</button>
<script type="text/javascript">
var button = document.getElementById('button');

function xhrSend(e){
  e.preventDefault();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://www.b.com:9091', true);
  xhr.send();
}

button.addEventListener('click', xhrSend);
</script>
</body>
</html>
```

因为服务端没有设置 `Access-Control-Allow-Origin`, 因此报错:

![VPSServerError](/static/img/2016/VPSServerError.png "VPSServerError")

接下来在 `b.com` 的服务端加上允许来自 `a.com` 的 `ajax`(需要精确到端口):

```js
app.get('/', function(req, res, next){
  res.set({
    'Access-Control-Allow-Origin': 'http://www.a.com:9090'
  });
  res.send(req.headers);
});
```

再次发起请求:

![VPSServerError1](/static/img/2016/VPSServerError1.png "VPSServerError1")

![VPSServerError1.1](/static/img/2016/VPSServerError1.1.png "VPSServerError1.1")

控制台没有报错, 而且状态码为 `200` 说明 `b.com` 已经允许来自 `a.com:9090` 的请求.

## 小目标-2: 本地服务接收前端的 `cookie`

接下来我们先在本地测试下 `a.com` 后端能否获取到来自前端的 `cookie`:

测试方法很简单, 随便加点 `cookie` 在 `js` 中即可:

```js
document.cookie = 'domain=a.com;';
document.cookie = 'name=xheldon';
document.cookie = 'lover=xiaodan';
```

![LocalServer1](/static/img/2016/LocalServer1.png "LocalServer1")

在本地控制台的 `Application` 选项卡可以看到已经有了 `cookie`, 再看看后端输出:

![LocalServer2](/static/img/2016/LocalServer2.png "LocalServer2")

OK 没毛病, 访问 `www.a.com:9090` 的时候确实带上了 `cookie`, 意料之中.

## 小目标-3: 把 `a.com` 的 `cookie` 发送到 `b.com`

这个时候 `a.com` 的页面是有 `cookie` 的, 因此我们再次点击按钮, 看 `ajax` 请求能否把 `cookie` 传递给 `b.com`:

![VPSServerError1.2](/static/img/2016/VPSServerError1.2.png "VPSServerError1.2")

和没有加 `cookie` 一样, 并没有获取到来自 `a.com` 的 `cookie`, 这当然是因为安全限制, 也是意料之中.

## 额外定一个小目标: 非简单请求

此处插播一个关于简单请求的测试, 在 `xhr` 中新增一个 `header`, 之后再发请求:

```js
function xhrSend(e){
  e.preventDefault();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://www.b.com:9091', true);
  xhr.setRequestHeader('xiaodan', 'xheldon');
    xhr.send();
  }
```

因为这次是在加了 `Access-Control-Allow-Origin` 之后的操作, 因此这次浏览器报了个不一样的错误:

![VPSServerError2.1](/static/img/2016/VPSServerError2.1.png "VPSServerError2.1")

注意到还是因为 `Access-Control-Allow-Origin` 的错误, 但是这次是因为前端设置了一个自定义的 `header`, 因此是一个非简单请求, 对于非简单请求会先发一个预检请求(`prelight`), 请求类型是 `OPTIONS`, 可以查看 [这篇文章](http://harttle.com/2016/12/30/cors-preflight.html) 了解更多. 预检请求目的是嘘寒问暖 `b.com` 的服务器, 是否接受这个 `xiaodan` 的 `header`, 后端在返回的 `header` `Access-Control-Alow-Headers` 中, 没有这个叫做 `xiaodan` 的值, 因此报错.

那接下来我们把 `b.com` 返回的内容加上 相应的 `header`:

```js
app.get('/', function(req, res, next){
  console.log(req.headers);
  res.set({
    'Access-Control-Allow-Origin': 'http://www.a.com:9090',
    'Access-Control-Allow-Headers': 'xiaodan'
  });
  res.send(req.headers);
});
```

再次发起请求看看:

![VPSServerError2.1](/static/img/2016/VPSServerError2.1.png "VPSServerError2.1")

居然是一样的报错结果, 虽然响应了 `200`, 但是服务端没有返回相应的 `Access-Control-Allow-Headers`, 返回结果被浏览器拒绝了(注意不是被服务器拒绝, 服务器是返回了 `200` 的).

排查了一下发现, 问题出在这个非简单请求上面, 我把 `b.com` 函数稍微修改下:

```js
app.use(function(req, res, next){
  res.set({
    'Access-Control-Allow-Origin': 'http://www.a.com:9090',
    'Access-Control-Allow-Headers': 'xiaodan'
  });
  next();
});

app.get('/', function(req, res, next){
  console.log(req.headers);
  res.send(req.headers);
});
```

服务端:

![VPSServerError2.2](/static/img/2016/VPSServerError2.2.png "VPSServerError2.2")

客户端:

![VPSServerError2.3](/static/img/2016/VPSServerError2.3.png "VPSServerError2.3")

分析原因在于(待求证, 回头翻翻 `HTTP` 权威指南再说), 非简单请求的 `prelight` 请求, 不会发起实际请求, 而是先发送一个预检请求, 来测试服务器是否支持某个非简单 `header` 字段, 也就是说, 带有非简单头部的请求不会走到 `app.get('/')` 里面. 同时可以在 `b.com` 的服务器看到, 因为 `console.log(req.headers)` 是写在 `app.get('/')` 里面的, 刚刚的请求 `b.com` 服务器并没有输出任何东西, 因此也印证了这一点. `这一设计旨在确保服务器对 CORS 标准知情，以保护不支持 CORS 的旧服务器`.

## 小目标-4: 把 `a.com`  域下的 `cookie` 发送到 `b.com`

OK, 插播结束, 我们来测试下在客户端, 也即 `a.com` 下发起的 `xhr` 请求的页面设置 `withCredentials = true` (只列出 `xhrSend` 部分)能否将 `a.com` 的 `cookie` 发送到 `b.com`(这里简单请求和非简单请求是一样的结果, 为了方便查看差异我把 `xhr` 设置的 `header` 去掉了):

```js
// 设置允许 cookie
function xhrSend(e){
  e.preventDefault();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://www.b.com/', true);
  xhr.withCredentials = true;
  xhr.send();
}
```

![VPSServerError2.4](/static/img/2016/VPSServerError2.4.png "VPSServerError2.4")

这次错误提醒变化, 变成服务端没有设置 `Access-Control-Allow-Credentials` 为 `true` 了, 这个 `header` 是来设置允许请求携带 `cookie` 的, 因此设置一下:

```js
app.use(function(req,res, next){
  res.set({
    'Access-Control-Allow-Origin':'http://www.a.com:9090',
    'Access-Control-Allow-Headers': 'xiaodan',
    'Access-Control-Allow-Credentials': true
  });
  next();
});

app.get('/', function(req, res, next){
  console.log(req.headers);
  res.send(req.headers);
});
```

![VPSServerError2.5](/static/img/2016/VPSServerError2.5.png "VPSServerError2.5")

仍然没有, 看下 `Chrome` 的 `cookie`:

![VPSServerError2.6](/static/img/2016/VPSServerError2.6.png "VPSServerError2.6")

确实是设置了 `cookie` 啊, 什么情况? 不服, 想着 `req.headers` 是 `express` 格式化之后的, 看看原始 `headers` `rawHeaders`:

![VPSServerError2.7](/static/img/2016/VPSServerError2.7.png "VPSServerError2.7")

还是没看到, `cookie` 被狗吃了吗?

> 都没有, 她说将来会找到, 时间,时间会给我答案 ------我的滑板鞋

OK, 找不到问题的时候就吃个冰淇淋吧. 下楼买了个香菜味的雀巢冰激凌(吃不起哈根达斯), 然后在上楼的时候灵光一闪, 好像我们这个属于是第三方 `cookie`, 会不会是我禁止浏览器追踪导致的呢? 于是吃完冰激凌我在 `chrome` 的设置中, 把 `随浏览流量一起发送"不跟踪"请求` 的钩钩给去掉了:

![VPSServerError2.8](/static/img/2016/VPSServerError2.8.png "VPSServerError2.8")

对了, 这次我把 `req.headers` 放到了 `app.use` 里面以防万一(其实不会有什么万一)：

```js
app.use(function(req,res, next){
  console.log(req.headers);
  res.set({
    'Access-Control-Allow-Origin':'http://www.a.com:9090',
    'Access-Control-Allow-Headers': 'xiaodan',
    'Access-Control-Allow-Credentials': true
  });
  next();
});

app.get('/', function(req, res, next){
  res.send(req.headers);
});
```

再次点击按钮发送请求, 然后查看 `chrome` 控制台和 `b.com` 的服务器输出:

因为有非简单头部, 因此和之前一样, 显示的是两个请求:

![VPSServerError2.9](/static/img/2016/VPSServerError2.9.png "VPSServerError2.9")

![VPSServerError2.9.1](/static/img/2016/VPSServerError2.9.1.png "VPSServerError2.9.1")

服务器也没有接收到, 说明和这个 `Chrome` 设置无关, 因此为了控制变量 `不跟踪` 和之前一样, 我把它又钩上了, 服务器端(只放了 `GET` 请求):

![VPSServerError2.9.2](/static/img/2016/VPSServerError2.9.2.png "VPSServerError2.9.2")

还是没有 `Cookie` 字段, 为什么呢?

我又想起了文章开头的那句话: '注意, 设置了 `withCredentials = true` 之后, 携带的 `cookie` 是目标域的 `cookie`'. 难道我在 `a.com` 点击按钮发送请求到 `b.com`, 发送的是 `b.com` 设置的 `cookie` 吗?

于是我先把 `b.com` 服务器上也新建一个 `index.html`, 里面随便加点 `cookie`:

`b.com` 的服务器代码:

```js
var express = require('express');
var app = express();
var path = require('path');
app.use(function(req,res, next){
console.log(req.headers);
res.set({
  'Access-Control-Allow-Origin':'http://www.a.com:9090',
  'Access-Control-Allow-Headers': 'xiaodan',
  'Access-Control-Allow-Credentials': true
});
next();
});

app.get('/', function(req, res, next){
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(9091);
```

b.com 的 index.html 代码:

```html
<!DOCTYPE html>
<html>
<head>
  <title>a.com</title>
</head>
<body>
<div>open Application inspector to check whether the cookie is be setting</div>
<script type="text/javascript">
    document.cookie = 'yes=you_cant_believe_i_from_b.com'
    document.cookie = 'from=this_is_from_b.com'
</script>
</body>
</html>
```

OK, 我们首先访问 `b.com`:

![VPSServerError4](/static/img/2016/VPSServerError4.png "VPSServerError4")

没毛病, 正常返回网页, 正常设置 `cookie`, 接下来我们在 `a.com` 下, 点击按钮发送请求:

![VPSServerError4.1](/static/img/2016/VPSServerError4.1.png "VPSServerError4.1")

可以看到在 `a.com` 发起的 `ajax` 请求, 带上了 `b.com` 的 `cookie`.

文章开始的那句话得到了证实.

## 小目标-5: `a.com` 的 `JavaScript` 获取 `b.com` 的 `cookie`:

既然能在 `a.com` 发送 `b.com` 的 `cookie`, 那么前端能不能获取到 `b.com` 的 `cookie` 呢?

看了下文档, `ajax` 有 `getAllResponseHeaders()` 和 `getResponseHeader()`两个接口, 服务端有 `Access-Control-Expose-Header`, 于是我测试了下(我就是要分开输出, 怎样?).

先从简单的来, 首先是调用 `xhr` 的 `getAllResponseHeaders()` 接口:

```js
// 设置允许 cookie
function xhrSend(e){
  e.preventDefault();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://www.b.com/', true);
  xhr.withCredentials = true;
  xhr.onreadystatechange = function(){
    if(this.status === 200){
      console.log('AllRes:', this.getAllResponseHeaders())
    }
  };
  xhr.send();
}
```

![LocalServer3](/static/img/2016/LocalServer3.png "LocalServer3")

发现并没有出现 `header` 的 `Cookie` 字段, 意料之中, 想着万一 `getAllResponseHeaders()` 遍历 `header` 的没有 `Cookie` 是因为其被设置成 `enumerable: false` 了呢? 于是我又尝试了 `getResponseHeader()`:

```js
// 设置允许 cookie
function xhrSend(e){
  e.preventDefault();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://www.b.com/', true);
  xhr.withCredentials = true;
  xhr.onreadystatechange = function(){
    if(this.status === 200){
      console.log('Res:', this.getResponseHeader('Cookie'))
    }
  };
  xhr.send();
}
```

![LocalServer3.1](/static/img/2016/LocalServer3.1.png "LocalServer3.1")

还是意料之中, 因为服务端没有设置暴露出来的 `header` 内容, 于是我在 `b.com` 设置了 `Access-Control-Expose-Header`:

```js
res.set({
  'Access-Control-Allow-Origin':'http://www.a.com:9090',
  'Access-Control-Allow-Headers': 'xiaodan',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Expose-Headers': 'Cookie'
});
```

然后重新执行 `getResponseHeader('Cookie')` 和 `getAllResponseHeaders()`

![LocalServer3.2](/static/img/2016/LocalServer3.2.png "LocalServer3.2")

没有错误了, 但是还是无法获取到 `b.com` 的 `cookie`, 即使 `b.com` 服务端都同意了也不行.

查找资料得知, 这个 `Access-Control-Expose-Header` 只能设置为自定义的 `header` 来被前端获得. 但是这个没什么意义啊, 因为这个自定义的 `header` 就是我前端设置的, 唯一的作用就是 后端修改/新建自定义的 `header` 之后, 前端来获取. 下面我在后端设置一个 `header`, 让前端来获取:

`b.com` 的 `server`:

```js
res.set({
  'Access-Control-Allow-Origin':'http://www.a.com:9090',
  'Access-Control-Allow-Headers': 'xiaodan',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Expose-Headers': 'Xheldon',
  'Xheldon': 'MyNameIsXheldon'
});
```

`a.com` 的 `index.html`:

```js
xhr.onreadystatechange = function(){
  if(this.status === 200){
    console.log('Res:', this.getResponseHeader('Xheldon'));
    console.log('AllRes:', this.getAllResponseHeaders());
  }
};
```

![LocalServer3.3](/static/img/2016/LocalServer3.3.png "LocalServer3.3")

就是这样.

所以这个小目标是实现不了了, 但是 `SO` 社区给出了一些解决办法, 比如 使用第三方服务/后端做转发 等, 毕竟规定是死的, 人是活的, 就像 `jsonp` 一样, 是吧.

## 联想

有人说培训几个月零基础就可以精通某种语言, 我觉得是天方夜谭. 因为在没有计算机基础知识的情况下, 在搞不清二进制/编译原理/计算机原理/操作系统原理/网络基础/通讯协议的是什么概念的情况下能写出代码, 只能说明你照葫芦画瓢的学习能力强, 你知道这么写是这么个效, 但是你不知道为什么这么写就会出现这么个效果.

因此在跟计算机打交道的时候, 知识面是越广越好, 知识深度是越深越好. 这不, 我在了解 CORS 的时候, 想起了之前接触过的 AUTH.

有个叫 `AUTH2.0` 的东西, 那它跟 `CORS` 有什么关系呢? 没啥关系, 不过下面是我的对比:


`CORS`, 可以让访问过 `B` 站的用户, 从 `A` 站发起请求的时候, 携带 `B` 站的 `cookie`. 步骤是:

1. 用户访问过 `B` 站.
2. 用户访问 `A` 站, 在 `A` 站发起请求到 `B` 站.
3. `B` 站验证来自 `A` 站的请求中的来自 `B` 站的 `cookie`, 没毛病, 返回 `B` 站的数据.

`AUTH`, 可以让用户在 `A` 网站访问 `B` 网站的资源. 前提是需要用户授权, 步骤是:

1. 在 `A` 网站发起请求.
2. 步骤1跳转到 `B` 站, 确认授权, 再跳转回 `A` 网站.
3. 此时 `A` 网站拿到 `tooken(令牌)` 就能访问用户在 `B` 网站的资源了.

有木有很像?

`CORS` 的第一步对应 `AUTH` 的第二步. `AUTH` 的第二步相当于 `CORS` 的第一步的可以认为是在 `B` 网站的服务端加上了 `Access-Control-Allow-Credentials`, 这样就代表完成授权.

可以认为 `CORS` 携带 `cookie` 是简化版的 `AUTH`.

以下摘自 `RFC 6749`

![AUTH](/static/img/2016/AUTH.png "AUTH")



## 后记

为什么说, 第三方广告 `cookie` 会泄露隐私呢? 这是因为广告放在一个 `A` 网站上, 广告主就知道这个广告投放到了 `A` 网站(通过广告投放的 `id/key` 之类的 `identity` 来标识 和付费), 于是广告主在这个广告上设置一个 `cookie`, 这个广告来自广告 `B` 的域名, 因此设置的 `cookie` 当然是来自 `B` 的 `cookie`, 每次 `A` 网站加载这个广告的时候, 肯定是要执行一段 `js` 的, 在这个 `js` 中, 设置了允许 `A` 站发送 `cookie`, 而同时 `B` 站也允许来自 `A` 站的 `cookie` 携带 `B` 站的 `cookie` 发送过来, 因此就什么都知道了.

`Google AD Impl:

![googleWithCredientials](/static/img/2016/googleWithCredentials.png "googleWithCredientials")

![googleWithCredientials2](/static/img/2016/googleWithCredentials2.png "googleWithCredientials2")

## 注意

1. 上述修改涉及到服务端的修改, 均需要重启服务. 因为在 `VPS` 上重启服务不太方便, 而且时间久了连接会断开, 因此最好的办法是在 `VPS` 上放置文章中的 `a.com` (主要用来修改 `index.html` 的), 而在本地放置文章中的 `b.com` 的内容(主要用来修改 `index.js` 的).

2. 远程链接保持不断开, 最简单的办法是将其后台(前提是保持链接, 不然断开链接之后, 请求过来进行 `I/O` 操作, 仍然会被断开). 可以运行 `node index.js &`, 或者在已经运行 `node index.js` 的时候按 `ctrl+z`, 将其冻结在后台, 然后执行 `bg` 命令将最近一个后台的任务激活. `jobs` 命令可以查看在当前任务列表. 如果退出了当前 `session`, 之后重新连接的话, 任务仍然在运行, 但是 `jobs` 已经看不到该任务了, 因此需要 `ps -A` 列出所有进程, 然后 `kill ID` 终止 `node` 所在的那个进程, 重新运行即可.

3. 完成小目标期间出错的时候我怀疑是没有把自定义字段设置为以 `X-` 开头才报错的, 看了下标准发现并没有以 `X-` 的规定, 维基和SO 上只是推荐自定义 `Header` 以 `X-` 开头而已.

4. 设置了 `withCredentials = true` 之后, 服务端的 `Access-Control-Allow-Origin` 就不能再设置为 `wildcard` `*` 了



















