---
layout: post
title:  "Vue 实现路由的三种方式"
date:   2016-06-12 12:43:45 +0800
categories: [Framework]
---

Vue 学习总结基本告一个段落, 接下来会补充一些其他的碎片知识, 今天说下 Vue Router 的三种实现方式.

[查看项目完整代码](https://github.com/Xheldon/Framework/tree/master/VueSPA) (本项目含有其他 Vue 测试代码如 Vue Plugin 等)

## 通过 render 函数

基本思路是, render 根据地址栏的路径渲染组件内容, 配合 HTML5 的 history.pushState 的使用, 以及 popstate 事件的监听, 可以实现直接访问地址/浏览器返回前进/点击链接跳转的路由功能.

优点: 

1. 可以将不存在的地址转到 404.vue 页面.

缺点: 

1. 不支持 HTML5 的 hostory.pushState API 的浏览器无法 Polyfill. 
2. render 函数的渲染无法缓存起来.

注意: 如果使用动画过渡效果 transition, 则根元素存在于 default.vue 中, 注意代码中和下面的区别.

可查看 [具体代码](https://github.com/Xheldon/Framework/tree/master/VueSPA/app/NoRouter)

## 通过 component 的 is 属性

其实原理和上面的一样, 只是把 render 函数换成了component.

component 组件有个 is 属性, 用来指示该 component 加载哪一个模板, 该属性可以自己通过逻辑, 来根据地址栏地址动态设置.

优点:

1. component 可以加上 keep-alive 属性来缓存起来, 比上面的 render 函数高效.

缺点: 

1. 不支持 HTML5 的 hostory.pushState API 的浏览器无法 Polyfill. 
2. 无法渲染不存在的路由地址(如404等, 因此可以看到该 Demo 下没有像上面一样的 404.vue)

注意: 如果使用动画过渡效果 transition, 则根元素存在于 tpl.html 中, 注意代码中和上面的区别.

可查看 [具体代码](https://github.com/Xheldon/Framework/tree/master/VueSPA/app/NoRouterWithIs)

## 通过 VueRouter 插件

VueRouter 是官方插件, 完美实现了各种需求.

优点: 

1. 该有的功能都有.

缺点:

1. 为了 Polyfill pushState, 在路径后面加了个 # 来实现路由功能, 实则不是真正的路由, 只是更改 hash 值.

可查看 [具体代码](https://github.com/Xheldon/Framework/tree/master/VueSPA/app/Router)
























