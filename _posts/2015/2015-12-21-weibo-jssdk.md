---
layout: post
title:  "新浪微博JS SDK API的使用"
date:   2015-12-21 21:23:45 +0800
categories: [Javascript]
---

以前整个网站都是老大一个人怼起来的,各种bug和各种细节不完善.所以打算重构一下,侯哥搭好了`seajs`的开发框架,因此我只需要写前端逻辑即可.

注册和登陆部分是我写的,因此我打算增加个新浪微博和QQ登陆的功能,用户点击之后存储其id到数据库,当然这个需要修改数据库表字段,单独增加一个类似于`wb_id`的字段名来标示.

现在流行的做法有两种,一个是用新浪微博(或其他登录方式,下同)登陆之后,后台自动创建一个id作为本站唯一的标示,同一行的wb_id存储此用户的微博id,以后用任意账号登陆即可,第一次微博登陆之后用户只需要设置一下昵称(非必须,可直接使用微博昵称)和密码(必须,因为万一以后新浪微博倒闭了,用户没法儿登陆可不行);另一种方式是新浪微博登陆之后需要引导用户手动创建一个账号和密码,或者引导用户绑定到已经注册过的用户账号上去.

好了以上是业务逻辑,我会使用第一种方式实现,下面是具体的实现方法:如何使用新浪微博的JSSDK的API.
首先和网上大多数教程里面说的那样,需要了解OAuth2.0协议的原理,其实不了解也没关系,知道流程就行,OAuth2.0验证流程网上说的很多了,百度一大把,这里就不再赘述了.

注意:所有步骤的前提是,你已经取得了新浪微博开放平台的开发者权限,如果没有的话是无权调用API的,关于新浪微博开发者申请,请自行百度.申请完新浪微博开发者之后会到一个appid,这个是新浪识别谁调用了它的API的关键id,之后的步骤也会用到.

第一步:增加命名空间,引用jssdk文件.

增加命名空间:

```html
<html xmlns:wb=”http://open.weibo.com/wb”>
```
引用jssdk文件:
```html
<script src=”http://tjs.sjs.sinajs.cn/open/api/js/wb.js?appkey=YOUR APPKEYdebug=true” type=”text/javascript” charset=”utf-8″></script>
```

其中的`YOUR APPKEY`替换为你申请新浪微博开发者时它给你的`appid`, `debug=true`方便你调试,正式上线时可以把`&debug=true`这个给删掉.

第二步:使用API授权登录

这里有两种方式,一种是点击按钮之后直接在脚本里调用API的`WB2.login()`方法具体请看新浪API,

还一种是将用户引导到包含你appid和回调地址的地址中去(姑且叫它授权页),格式为:
```js
https://api.weibo.com/2/oauth2/authorize?client_id=YOUR APPKEY&response_type=token&display=js&transport=html5&referer=Your_CallBack_Address
```  

其中的`YOUR APPKEY`和`Your_CallBack_Address`替换为你自己的,注意`Your_CallBack_Address`记得加上`http://`
比如我的测试引导地址就是:
```js
https://api.weibo.com/2/oauth2/authorize?client_id=2177891434&response_type=token&display=js&transport=html5&referer=http://www.xheldon.com/gbtagsLogin.html
```
注意:貌似这个回调地址必须是以php/html/jsp等动态/非动态的带后缀名的格式,如果是首页的话比如`http://xheldon.com`是不行的,需要加上`http://xheldon.com/index.html`(因为我的后台是Node的)才行,这个我没有试过,有需要的同学请自行尝试.

第一种方法的表现形式是点击引导入口之后会直接弹出微博登陆授权页面的对话框,这个时候如果你用过的是`chrome`的话会发现在这个小窗口的地址栏左侧的地址有个小锁icon,代表这个地址是锁定的无法修改.
在弹出的小窗口输入微博登陆账号密码授权之后对话框消失,原来的页面刷新,第三方网站就可以操作你的账号.

第二种方法是不在脚本中使用`WB2.login()`,而是引导用户到刚才我说的那个包含appid和回调地址的地址中去,这个地址也是会让你输入账号密码,但是这个和第一种方式的区别是这个是会离开现有的页面跳转到这个授权页中去的,输入账号密码授权之后会回到你这个链接中写的回调地址中去.

以上两步的原理其实就是`OAuth2.0`协议认证的过程,只是JSSDK给你处理好了第一次请求返回的code和第二次请求返回的`access token`,因此你不需要按照官方API里面说的那样运用`basic`方式将`access token`放到`header`中使用post或者get方式等一系列你可能听不懂的名词,而只需要关注前端的逻辑,使用获得的json格式的数据即可.

还是刚才那个地址, [微博API入口级文档说明](http://open.weibo.com/wiki/Weibo-JS_V2).当然”入口级”这个名词 是我自创的,你知道了这五个的用法,以后的API就可以依葫芦画瓢了.

这几个API其中的`WB2.login()` 和`WB2.checklogin()`以及`WB2.logout`比较简单,是个人都能看懂,看不懂的按照我刚才说的那个`WB2.login()`方法往script标签里面一放就可以了,只是引导登陆之后你什么也没有做.

登陆之后想做点什么的话(这是废话,不做什么你让人家登陆干啥),比如获取登陆新浪微博登陆用户的id,获取它的粉丝数等等,都是通过这五个入口级API的最重要的一个API
即与微博API进行数据交互及采用Js方式调用内置微博组件的入口函数(官方是这么介绍的):`WB2.anyWhere(callback)`,

然后与数据交互的话需要使用`W.parseCMD(uri, callback, args, opts)`
其中W形参是`WB2.anyWhere(callback)`传进去的,如果想调用微博组件的话,可以使用`W.widget.hoverCard(…)`或者`W.widget.followButton(…);`等等.

注意,最最重要的一步,即是你和新浪的数据交互的一步:

一般`W.parseCMD`的用法是以下形式:
```js
W.parseCMD('/users/show.json', function(oResult, bStatus) {
  if(bStatus) {
  //to do something...
  }
  }, {
	screen_name : '姚晨'
  }, {
	method : 'get',
	cache_time : 30
  });
```
其中`W.parseCMD()`的第一个参数`/user/show.json`可以换成其他的接口如:`/statuses/user_timeline.json`就可以读取这个借口的信息了,具体有哪些接口,而接口又能返回哪些数据,新浪自己给了个 [微博API测试工具](http://open.weibo.com/tools/apitest.php) 注意:这个API测试工具的登陆界面有问题,请不要在这个页面登陆,而是先到微博首页登陆之后再在这个API测试工具的页面刷新即可.
那个`screen_name`不是必须的,但是`screen_name`所在的{}必须保留,即使它是空的.

下面的`method: get`是与后台交互时的参数,有时候的交互是需要使用`post`方式,`cache_time`看名字也知道什么意思吧?就不多说了.

差不多需要注意的就这么多.
