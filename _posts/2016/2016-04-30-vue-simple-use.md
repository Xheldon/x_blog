---
layout: post
title:  "Vue + Webpack 组件式开发(练习环境)初体验"
date:   2016-04-30 05:12:12 +0800
categories: [Framework]
---

## 前言
研究了下别人的 `vue` 多页面框架, 都是直接复制 `package.json` 文件,然后在本地 `npm install` 一下即可, 或者使用官网 `vue-cli` 工具生成一个项目, 觉得这样虽然看的懂, 但是记不住, 因此有必要从零开始搭建一个使用 `.vue` 作为组件的项目练习一下, 因此有了这个项目.

既然使用了 `.vue` 组件, 就不能像之前使用 `jQuery` 一样把 `vue.js` 引入页面中, 而是使用配套的 `webpack` + `babel` + 各种 `loader` 工具编译 `.vue` 文件, 再打包生成 `html`.

## FBI warning

*`切记`* : 因为是最基本的初体验, 所以一些正式开发中必装的 `loader` 和 `plugin` 就没有装, 因为只是想按照官方教程手动敲出来加深印象, 特别是进阶教程中比较麻烦的父子组件传参, 作用域插槽, 递归组件以及 `slot` 等. 因此这个配置不可能作为正式开发的参照配置, 只可作为了解 `vue` 组件工作原理的练手项目.

## 配置说明

以下配置的详细说明在后面可以找到, 不想看的话直接复制下面的 `package.json` 即可, 但是为了加深印象还是建议手动敲一遍.

废话不多说, 开始.

首先, 既然是 `webpack+vue`, 那相应的安装包少不了, 这里我们使用 `vue@2.2.4` 和 `webpack@1.12.2`:

```js
npm install webpack@1.12.2 vue@2.2.4 --save-dev
```

然后是 `babel` 和相应的 `loader`, 这里我们使用 `es2015` 这个配置, 用最新的就好:

```js
npm install babel bebel-core babel-loader babel-preset-es2015 --save-dev
```

然后是 `webpack` 的必装 `loader`, `css-loader` 用来处理 `css` 中 `url()` 的资源, `style-loader` 用来将 `require` 的 `css` 抽出放到 `style` 标签中, 然后加到页面 `head` 部分. `html-webpack-plugin` 用来将入口文件 `js` 变成 `html`, 入口文件中的各种资源由各种 `loader` 处理后插入到它生成的 `html` 中, `extract-text-webpack-plugin` 用来将被 `js` 通过 `style` 标签 `append` 到 `head` 中的样式抽出到单独的 `.css` 文件中:

```js
npm install css-loader style-loader html-webpack-plugin extract-text-webpack-plugin@1.0.1 --save-dev
```

然后是 `vue` 相关的东西, 因为一个 `.vue` 里面有至少有三个标签 `template/style/script`, 因此需要三个 `loader` 来处理, 再加上一个总的 `vue-loader`, 就是四个 `loader` ,这里:

`vue-html-loader` 是 `webpack` 的官方 `html-loader` 的 `fork`, 作者放到这里只是为了能在 `webpack.config.js` 中的 `module.export.vue` 对象上使用 `html` 选项来单独配置 `vue` 的 相关 `html`(本项目安装 `vue-loader` 即可, 这里只是顺带安装说明一下);

`vue-style-loader` 用来处理 `.vue` 文件中 `style` 中的内容, 是 `webpack` 的官方 `style-loader` 的 `fork`(本项目安装 `vue-loader` 即可, 这里只是顺带安装说明一下);

`vue-template-compiler` 用来处理 `.vue` 文件中 `template` 中的内容, 除非是用它编译后的文件做其他事情才需要单独配置(即写 `build tools`, 否则这个不是必须的, 因为 `vue-loader` 已经默认使用它了)(本项目安装 vue-loader 即可, 这里只是顺带安装说明一下);

`vue-loader` 用来处理 `.vue` 后缀的内容, 在遇到相关的内容时, 会调用上述三个相关的 `loader` 来处理.

```js
npm install vue-html-loader vue-loader vue-style-loader vue-template-compiler --save-dev
```

最后就是开发用的 `webpack-dev-server`, 这里我们安装 `1.12.1` 版本:

```js
npm install webpack-dev-server --save-dev
```

下面是总的 `package.json` 配置文件, 而具体的每个 `package.json` 字段的含义, 可以查看 [这个网站](http://json.is/).

```js
{
  "name": "vue-components",
  "version": "0.0.1",
  "description": "vue components test",
  "main": "app/app.js",
  "scripts": {
    "dev": "webpack-dev-server --hot",
    "build": "webpack"
  },
  "keywords": [
    "vue",
    "components"
  ],
  "author": "xheldon",
  "license": "MIT",
  "dependencies": {
    "vue": "^2.2.4"
  },
  "devDependencies": {
    "babel": "^6.23.0",
    "babel-core": "^6.24.0",
    "babel-loader": "^6.4.1",
    "babel-preset-es2015": "^6.24.0",
    "css-loader": "^0.27.3",
    "extract-text-webpack-plugin": "^1.0.1",
    "html-webpack-plugin": "^2.28.0",
    "style-loader": "^0.16.0",
    "vue-html-loader": "^1.2.4",
    "vue-loader": "^11.3.1",
    "vue-style-loader": "^2.0.4",
    "vue-template-compiler": "^2.2.4",
    "webpack": "^1.12.2",
    "webpack-dev-server": "^1.12.1"
  }
}
```

## 项目说明

Ok, 依赖安装完了, 接下来看下 `webpack` 配置, 因为是想尽快测试 `vue` 官方文档的组件部分, 所以一切从简了:
```js
var path = require('path');
var webpack = require('webpack');
var HtmlwebpackPlugin = require('html-webpack-plugin');

// 常用配置,项目较小不抽出了
var ROOT_PATH = path.resolve(__dirname);//根路径
var APP_PATH = path.resolve(ROOT_PATH, 'app');//开发路径
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');//输出路径
var  ExtractTextPlugin= require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(APP_PATH, 'app.js')
  },
  output: {
    path: BUILD_PATH,
    filename: 'bundle.js'//因为只有一个入口文件, 因此直接写死了
  },
  resolve: {
    alias: {
      //注意, 这里导入的是/node_module/vue/dist/vue.js, 跟 vue-router.js 的不同
      vue: 'vue/dist/vue.js'
    }
  },
  //开启 dev source map
  devtool: 'eval-source-map',
  //开启 dev server
  devServer: {
    historyApiFallback: true,
    hot: true,//HMR
    inline: true,
    progress: true
  },
  module: {
    loaders:[
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('css-loader')
      },
      {
        test: /\.js$/,
        loader: 'babel',
        include: ROOT_PATH,
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'vue-html'
      }
    ]
  },
  vue:{
    loaders: {
      css: ExtractTextPlugin.extract('css-loader')    }
  },
  plugins:[
    new HtmlwebpackPlugin({
      title: 'Vue component test',
      filename: 'this_is_final_filename_address_you_visit_in_browser.html',//生成的最终文件名
      template: 'app/this_is_main_page_which_you_put_components_into.html',//放置组件的地方, 一般是一个 body 下一个孤零零的 app 标签即可.
      inject: true
    })
  ]
};
```

关于这个配置, 有点东西需要说一下.

从上往下, 首先是 `alias` , 使用过 [`vue-router`](https://github.com/vuejs/vue-router/) 的人可能不需要这个配置, 但是使用 `.vue` 组件的项目必须这个配置,因为需要指定使用的 `vue` 的 `js` 类型, 看下本项目下 `node_module/vue/dist/` 文件夹下的文件, 有 `vue.js` 和 `vue.common.js` 两种, 其中 `vue` 编译 `template` 组件的时候是需要一个 `compiler.js` 的, 目的是把 `template` 中的 `html` 内容编译成 `render` 函数:

编译前:

```html
<div id="app">
  Hello {{who}}
</div>
<script>
  new Vue({
    el: '#app',
    data: {who: 'Vue'}
  })
</script>```

编译后:

```js
<div id="app"></div>
<script>
  new Vue({
    el: '#app',
    render: function () {
      with (this) {
        __h__('div',
          {staticAttrs:{"id":"app"}},
          [("\n  Hello "+__toString__(who)+"\n")],
          ''
        )
      }
    },
    data: {who: 'Vue'}
  })
</script>
```

而 `vue` 使用 `compiler` 编译 `template` 后的 `js` 在运行的时候发现有 `render` 函数的话就直接执行 `render`, `template` 字段下的内容会被忽略. 而执行编译后的 `render` 的任务,是由 `vue.common.js` 完成的.因此:

```js
vue.js = vue.common.js + compiler.js
```

所以, 如果你使用的是 `vue-router`, 它的 `package.json` 中的 `main` 字段是指向 `node_module/dist/vue.common.js` 的, 如果你直接复制这个到你的项目下, 运行的时候会提示你类似于 `vue.common.js` 的 `runtime` 错误之类的信息.

其次需要说的是这个 `css-loader` 和 `style-loader` 以及 `vue-style-loader`, 有了 `style-loader` 为何还要个 `vue-style-loader` 呢? 看了下 `vue-style-loader` 的说明, 明白了其仅仅是一个 `style-loader` 的 `fork`, 但是为了单独处理 `.vue` 文件, 同时为了让用户配置 `vue` 更清晰, 将其加到了 `webpack@1.x` 的配置文件中的 `vue` 字段中. 可以通过将 `extract-text-webpack-plugin` 插件的配置从:

```js
vue:{
  loaders: {
    css: ExtractTextPlugin.extract('vue-style-loader','css-loader')
  }
}
```

改成:

```js
vue:{
  loaders: {
    css: ExtractTextPlugin.extract('style-loader','css-loader')
  }
}
```

发现编译后的结果一样证实.

而默认情况下, `vue-loader` 是自动使用 `vue-style-loader` 的, 所以如果你不在 `.vue` 文件中 `@import` 任何 `css` , 那么你不需要手动把 `vue-loader-style` 放到 `vue.loaders` 字段中. `vue-loader` 会自动处理 `.vue` 文件中的 `style` 标签中的内容, 并将其放到 `style` 标签中插入页面. 而如果你需要在 `.vue` 文件中的 `style` 标签内 `@import css` 文件, 那么你就需要在 `module.exports.vue` 单独配置.可以通过把 `vue` 字段的 `vue-style-loader` 去掉来测试:

```js
module: {
  loaders:[
    {
      test: /\.vue$/,
      loader: 'vue'
    }
  ]
},
vue:{
  // loaders: {
  //   css: 'vue-style-loader!css-loader'
  // }
}
```

此外, 入口文件 `js` 中的 `require('xxx.css')` 是默认的 `module.exports.module.loader` 处理的, 这点可以通过在默认 `loader` 中使用 `extract` 插件, 而在 `module.exports.vue` 中不使用 `extract` 插件证实, 因为从结果可以发现, 入口文件中的 `css` 被提取了, 但是 `.vue` 中的 `@import` 来的 `css` 没有被提取.

而如果你需要 将入口文件中 `require` 来的 `css` 文件单独提取出来, 那么你就需要在 `module.exports.module.loader` 设置 `extract-text-webpack-plugin` 了.

注意: `vue-style-loader` 放在 `module.exports.vue.loaders` 字段中是为了能提取出 `.vue` 文件中的 `style` 标签内容到一个单独的 `.css` 文件 `link` 在页面中, 把 `style-loader` 和 `css-loader` 放在默认的 `module.exports.module.loaders` 中, 对处理 `vue` 中的 `style` 标签内容无效------------起码在 `Vue 1.x` 版本和 `webpack 1.x` 版本无效, `webpack 2.x` 版本移除了第三方的字段, 限制在 `module.export` 中随意添加字段.

最后, `css-loader` 和 `style-loader` 总是写在一起的, 因为 `css-loader` 的作用是 `resolve css` 文件中的 `@import` 和 属性值 `url()` 中的依赖关系, 单独写其实是没什么用的. `style-loader` 才是处理 `css`, 并将其打包到 `js` 中, 最后以 `<style>` 标签的形式插入到 `head` (插入位置可配置)中的 `loader`.

最后讲讲 `extract-text-webpack-plugin`, 其接受三个参数:

第一个参数是可选参数, 传入一个 `loader`, 当 `css` 样式没有被抽取的时候可以使用该 `loader`.
第二个参数则是用于编译解析的 `css` 文件 `loader`, 很明显这个是必须传入的, 就像上述例子的 `css-loader`.
第三个参数是一些额外的备选项, 貌似目前只有传入 `publicPath`, 用于当前 `loader` 的路径.

那什么时候需要传入第一个参数呢,那就得明白什么时候样式不会被抽取出来.
了解过 `code splitting` 的同学便会知道,我们有些代码在加载页面的时候不会被使用时, 使用 `code splitting`, 可以实现将这部分不会使用的代码分离出去, 独立成一个单独的文件,实现按需加载.

那么如果在这些分离出去的代码中如果有使用 `require` 引入样式文件, 那么使用 `ExtractTextPlugin` 这部分样式代码是不会被抽取出来的.
这部分不会抽取出来的代码, 可以使用 `loader` 做一些处理, 这就是 `ExtractTextPlugin.extract` 第一个参数的作用.

OK, 聊完了配置文件, 再说说这个项目是怎么工作的.

一图胜千言, 上图, 首先是代码界面:

![项目结构](/static/img/2016/vue-test.png "项目结构")

(若图片显示较小请在右键在新标签页单独查看)

看箭头所示就明白啦, 首先一个页面是至少有一个组件的, 这个我直接就一个页面一个组件来写了, 没有 `import` 其他的组件.

因此, 一个页面下是至少三个文件的, `.vue` 文件, `.js` 入口文件, 和 `.html`, 组件插入的文件.

`html` 中写一个组件 `app` 的名字, 入口文件实例化一个 `vue`, 然后使用 `app` 这个组件, 同时这个叫做 `app` 组件的模板来自 `index.vue`, 组件对应的 `css` 和 `js` 以及 `mvvm` 的特色:数据绑定也写在 `index.vue` 里面.

有同学会疑惑, 入口文件 `js` 是怎么找到同目录的 `html` 文件的呢? 其实这个在 `webpack.config.js` 配置文件就已经写好了:

```js
plugins:[
  new HtmlwebpackPlugin({
    title: 'Vue component test',
    filename: 'this_is_final_filename_address_you_visit_in_browser.html',//生成的最终文件名
    template: 'app/this_is_main_page_which_you_put_components_into.html',//放置组件的地方, 一般是一个 body 下一个孤零零的 app 标签即可.
    inject: true
  })
]
```

这个 `html` 生成的插件告诉 `js` 入口文件, 所需要的模板来自 `app` 下的 `xxx.html`, 而最后打包的 `bundle.js` 也是 `inject` 这个里面, 再生成最终的页面.

还有同学会问, 在入口 `js` 文件中, `vue` 实例化的时候用到的 `components.App` 到底是在编译过程就找到了 `this_is_main_page_which_you_put_components_into.html` 文件中的 `<app>` 组件引用, 还是在 `runtime` 的时候, 从最终打包的 `bundle.js` 中运行, 然后寻找 `this_is_final_filename_address_you_visit_in_browser.html` 页面中的 `<app>` 标签呢? 答案是后者, 因为刚才说的 `HtmlwebpackPlugin` 插件只负责生成 `html` 和注入打包后的 `bundle.js`, 而 `vue` 被打包进了 `bundle.js` 之后实例化 `vue` 时候才会寻找 `<app>` 标签.

这么一看, 和直接在 `script` 标签中引用 `vue.js` 文件再渲染的效果是一样的, 只是 `webpack` 这种开发方式帮我们分离了组件, 使开发过程的代码/组件结构更清晰, 而且直接引用 `vue.js` 是前端 `runtime render`, 一个是 `compiler render` 之后直接执行, 后者效率更高.

之后是效果页面:

![页面效果图](/static/img/2016/page-detail.png "页面效果图")
(若图片显示较小请在右键在新标签页单独查看)

看图就明白什么意思啦.

还有不明白的请看文档.

暂时聊这么多, 关于 `vue` 和 `webpack` 的 `注意事项/细节/设计思想` 还有很多要说的, 回聊~

