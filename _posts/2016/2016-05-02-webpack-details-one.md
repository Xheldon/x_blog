---
layout: post
title:  "Webpack 异步按需加载"
date:   2016-05-02 23:23:12 +0800
categories: [Framework]
---

webpack 想要实现异步加载, 即先加载主要模块, 用到某个模块或者多个模块(也即打包后的 chunk )的时候再发送请求加载.

这样做的目的当然是加快页面的初次加载速度, 但不可避免的会发送额外的请求, 这两个本身就是个鱼与熊掌不可兼得的事情, 这里说一下异步加载的细节.

实现主要是靠 `require.ensure([], callback)` 这个东西, 老实说我会注意到这个东西是因为在 `webpack.config.js` 的 `output` 字段有一个字段叫做 `chunkFilename`, 我这个打破沙锅的毛病就不得不想看看这个和 `filename` 字段有什么区别, 搜索了一下发现 `filename` (假设是 `bundle.js`) 是把页面需要的所有 `js` 打包, 最终生成的总的 `js` (当然多页面的时候可以提取公共模块, 这个不是本次的重点). 而 `chunkFilename` 是那些非入口点(`entry` 中列举的字段)的 `chunk` 文件打包生成的文件, 主要使用在按需异步加载模块的时候.

这些文件没有打包在 `bundle.js` 中, 而且只被部分(非全部的)模块依赖, 同时又需要异步加载, 因此就会通过使用 `require.ensure` 被打包到额外的 `js` 中, 而这些 `js`, 仍然是通过最终的 `bundle.js` 创建 `script` 标签, 然后被 `append` 到页面中的:

```js
// This file contains only the entry chunk.
// The chunk loading function for additional chunks
__webpack_require__.e = function requireEnsure(chunkId, callback) {
  // "0" is the signal for "already loaded"
  if(installedChunks[chunkId] === 0)
    return callback.call(null, __webpack_require__);

  // an array means "currently loading".
  if(installedChunks[chunkId] !== undefined) {
    installedChunks[chunkId].push(callback);
  } else {
    // start chunk loading
    installedChunks[chunkId] = [callback];
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;

    script.src = __webpack_require__.p + "" + ({}[chunkId]||chunkId) + ".js";
    head.appendChild(script);
  }
};
```

OK, 这些理解起来都很容易, 但是查看 [官方文档](http://webpack.github.io/docs/code-splitting.html#defining-a-split-point) 的时候, 发现了几个需要注意的细节.

## *`CommonJS`* 和 *`AMD`* `require` 时候的区别

`CommonJS` 是使用 `require.ensure([''], callback)` 来处理异步加载模块的, `AMD` 是和一般的 `AMD` 模块一样, 使用 `require` 一个数组依赖的形式处理的 `require([''], callback)`

但是 `CommonJS` 加载数组中模块的时候, 是只加载不执行, 除非是在 `callback` 中, 又 `require` 了一遍才执行:

```js
require(['./other/ensure.js','./other/ensure2.js'], function(){
  var ensure = require('./other/ensure.js');
  var ensure2 = require('./other/ensure2.js');

  module1();
  module2();
}, chunkFilename);
```

> The require.ensure method ensures that every dependency in dependencies can be synchronously required when calling the callback. An implementation of the require function is sent as a parameter to the callback.

而且这个 `callback` 的参数, 是一个实现了 `require` 接口的函数(没错的话应该只是一个 `require` 函数的引用);

这个 `chunkFilename` 会被 `output` 中的 `chunkFilename` 设置覆盖.

而 `AMD` 因为是正常一贯的依赖前置, 所以其会在 `require` 的时候就执行模块:

```js
require(['./other/ensure.js','./other/ensure2.js'], function(ensure, ensure2){
  ensure();
  ensure2();
});
```

OK, `AMD` 的例子不熟, 下面以 `CommonJS` 为例说明一些细节.

首先, 如果给 `require.ensure` 传递一个 `callback` , 则在回调函数中 `require` 来的模块也会被全部打包到最终异步加载的文件中.

## `chunk` 打包优化策略

1. 如果两个 `chunk` 包含相同的模块, 那么他们将合并成一个.
2. 如果一个模块在一个 `chunk` 的所有父级 `chunk` 都可用, 那么该模块将会在该 `chunk` 中被移除.
3. 如果一个 `chunk` 包含了另一个 `chunk` 的所有模块, 那么最终将打包包含更多 `module` 的这个 `chunk`, 这个规则对一个 `chunk` 包含其他 多个 `chunk` 的所有 `module` 同样适用.

其中第二条不好理解, 其实它所说的情况是, 在一个入口文件 `A.js` 中包含 `b` 模块, 而使用 `require.ensure` 打包生成了一个 `chunk.js` 文件中也包含这个 `b` 模块, 因为 `require.ensure` 是在 `A.js` 文件中调用的, 因此 `A.js` 算是这个 `chunk.js` 的父级 `chunk`, 那么最终打包生成的 `chunk.js` 中包含的 `b` 模块 内容将被移除. 而 `在所有父级 chunk 都可用` 指的是第一条所说的情况: 几个 `chunk` 包含相同的 `module`, 那么只会生成一个最终的 `bundle.js`, 但导致的可能是这个 `chunk` 存在多个父级 `chunk` (即 `entry` 对应的 `chunk` 文件).

验证一下:

入口文件 `app.js` 的代码:

```js

require('../other/if_be_remove.js')();
require.ensure(['../other/ensure.js'], function(){
	require('../other/ensure.js')();
}, 'love');

```


另一个入口文件 `app2.js` 的代码:

```js

require('../other/if_be_remove.js')();
require.ensure(['../other/ensure2.js'], function(){
	require('../other/ensure2.js')();
}, 'hate');

```

`ensure.js` 的代码:

```js

require('./if_be_remove.js')();
module.exports = function(){
	console.log('i\'m be ensure!');
}

```

`ensure2.js` 的代码:

```js

require('./if_be_remove.js')();
module.exports = function(){
	console.log('i\'m be ensure2!');
}

```

最后, 在子 `chunk` 和父级 `chunk` 都存在的 `if_be_remove.js` 的代码:

```js

module.exports = function(){
	console.log('im be removed!');
}

```

看下 `Chrome` 浏览器控制台中 `Network` 中加载的 `js` 的内容(这里使用 `[id].[name].js` 的命名方式)

`app.js` 页面:

![webpack-async](/static/img/2016/webpack-async-1.png "webpack-async")

`app2.js` 页面

![webpack-async](/static/img/2016/webpack-async-2.png "webpack-async")

可以看到, 因为 `if_be_remove.js` 在两个 `chunk` 中, 即 `1-love.js` 和 `3.hate.js` 被引用, 而同时又被这两个 `chunk` 的父级, 也即 `app.js` 和 `app2.js` 引用, 因此在这两个 `chunk` 中, 没有出现 `if_be_remove.js` 的代码.

## 补充: `chunk` 概念和定义

这里再补充一下, 所谓 `chunk`, 指的是一个或者几个 `module` 组成的一个独立的 `js` 文件, 而 `chunk` 分为以下几个类型:

1. `Entry Chunks`: `Entry Chunks`是我们最常见的`Chunks`类型, 包含了我们自己写的业务逻辑相关代码(大多数情况下是独有的代码, 即不会被提取到公共 `chunks` 中的代码), 一般会等到 `Initial Chunks` 加载完成才会执行(或者是遇到 `module` 编号为 `0` 的 module).
2. `Normal Chunks`: `Normal Chunks` 主要指代那些应用运行时动态加载的模块,`Webpack`会为我们创建类似于 `JSONP` 这样合适的加载器来进行动态加载.
3. `Initial Chunks`: `Initial Chunks` 本质上还是 `Normal Chunks`, 不过其会在应用初始化时完成加载, 往往这个类型的`Chunks`由`CommonsChunkPlugin`生成, 这个这个里面包含了全局的模块位置信息, `Entry chunks` 中的代码执行依赖这个 `chunk`, 因此应该优先加载这个 `js`.

在之前的举例中, 被打包成公共 `js` 供全部或者部分页面使用的的 `bundule.js` 是 `Initial Chunks`, 只在当前页面才会用到的` chunk` 如 `app.xxxxxx.js` 是 `Entry Chunks`, 通过 `require.ensure` 异步加载的 `chunk` 如 `3-hate` `1-love` 是 `Normal Chunks`.

