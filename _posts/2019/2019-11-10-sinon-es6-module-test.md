---
layout: post
title:  "使用 Sinon 测试 ES6 模块"
date:   2019-11-10 09:29:35 +0800
categories: [Javascript]
---

## 前言

最近一周在修补前人的测试, 使用到了 Sinon, 遇到了一些问题, 因此记录一下.

> 下面说的虽然只有 Sinon 的 `spy` 接口, 但是对于 stub 等接口也同样适用

> 测试用到了 `Mocha` `Sinon` `Chai` 库/框架, 这里不做介绍

## spy 一个`单独`导出的模块

有如下模块 foo.js, 导出一个 foo 函数

```js
export function foo {
    return 'foo';
}
```

有如下一个模块 bar.js, 导入这个 foo 函数

```js
import { foo } from './foo';
export  function bar {
    return 'bar' + foo();
}
```

有如下测试用例 bar.test.js

```js
import { bar } from './bar';
describe('ES6 导出模块测试-单独导出', () => {
    it('应该能够 spy bar', () => {
        const spy = sinon.spy(bar);
        const result = bar();
        
        expect(spy.called).to.equal.true; // 失败
    })
})
```

这里失败的原因是因为, bar.test.js 中导入的 bar 是一个包含一个函数的变量, 而 Sinon 只是在 spy 这个变量 bar, 并没有 spy bar 对应的函数, 下面的测试用例跟这个的情况一样:

```js
import { bar as baz } from './bar';
describe('ES6 导出模块测试-单独导出', () => {
    it('应该能够 spy bar', () => {
        const spy = sinon.spy(baz);
        const result = baz();
        
        expect(spy.called).to.equal.true; // 失败
    })
})
```

这种情况可以通过下面这一节的内容解决:

## spy 一个`全部`导出的模块

```js
import * as allBar from './bar';
describe('ES6 导出模块测试-全部导出', () => {
    it('应该能够 spy bar', () => {
        const spy = sinon.spy(allBar, 'bar');
        const result = allBar.bar();
        
        expect(spy.called).to.equal.true; // 成功
    })
})
```

那如何测试未导出的函数呢? 比如上面第一个测试用例中, 如何测试 foo 是否调用了? 

这里有两种方法, 第一个, 纯 ES6 的方式, 只能是将导入的 foo 函数在 bar 中再次导出(这样就违反了`测试未导出函数`的前提条件).

第二种方法, 即使用 babel plugin. 这个方法的实质是将 ES6 转换成 ES5 后进行测试. 插件名字叫做: babel-plugin-rewire 是一个 preset 类型的插件.

rewire 顾名思义就是重新缠绕一下, 也就是说, 该插件`可以将某个模块中导入的但是并未导出却在该模块中调用的函数进行重新导出以方便测试` 说起来有点绕口, 示例看一下(完整版):

有一个 foo.js:
```js
export function foo () {
    return 'foo';
}
```

有一个 bar.js, 导入了 foo.js, 但是并未将 foo 导出:
```js
import { foo } from './foo';
export default function bar () { // 注意此处 默认导出 export default 很重要, 原因下面说
    return 'bar' + foo();
}
```

测试文件 bar.test.js

```js
import bar from './bar'; // 这里叫 bar , 其实叫任何名字都可以, 因为是默认导出
describe('ES6 导出模块测试-默认导出', () => {
    it('应该能够 spy bar', () => {
        const spy = sinon.spy();
        bar.__Rewire__('foo', spy); // 注意这里的用法和 __Rewire__ 方法
        const result = bar();
        
        expect(spy.called).to.equal.true; // 成功
    })
})
```

如注释中所说, 默认导出很重要, 因为只能通过默认导出上的 `__Rewire__` 属性进行重新 `rewire`, 即无法像下面这样进行测试:

```js
import { bar }  from './bar'; // 假设 bar.js 中 bar 函数不是默认导出
describe('ES6 导出模块测试-默认导出', () => {
    it('应该能够 spy bar', () => {
        const spy = sinon.spy();
        bar.__Rewire__('foo', spy); // 这里会报 __Rewire__ 不是函数
        const result = bar();
        
        expect(spy.called).to.equal.true; // 失败
    })
})
```

即使是像前面所说的 `全部导出` 也无法实现:

```js
import * as allBar from './bar'; // 假设 bar.js 中 bar 函数不是默认导出
describe('ES6 导出模块测试-默认导出', () => {
    it('应该能够 spy bar', () => {
        const spy = sinon.spy();
        allBar.__Rewire__('foo', spy); // 这里不会报错, 但是测试不通过, 因为 allBar 上并没有 foo 方法(因为是在 bar 函数中调用的) 
        // 或者下面也不行会报 __Rewire__ 不是函数错误, 因为 __Rewire__ 并不重新 rewire 全部导出对象上的属性
        // allBar.bar.__Rewire__('foo', spy); 
        const result = bar();
        
        expect(spy.called).to.equal.true; // 失败
    })
})
```

如果想用 `全部导出` 的话来测试未导出函数的话, 被测试文件需要满足该函数在 `根作用域` 这个条件, 如:

```js
import { foo } from './foo';
export foo;
export function bar () {
    return 'bar' + foo();
}
```

则测试文件可以这么写:

```js
import * as allBar from './bar';
// 省略无关部分
const spy = sinon.spy();
allBar.__Rewire__('foo', spy); // 这么做就对了, foo 函数位于 allBar 的根作用域中
```

## 结束语

注意, 这里不光是函数测试, 也适用于默认导出为函数/类的 React 组件, 因为它们导出的本质相同, 都是函数或者对象. 测试 React 组件你可能会用到 `enzyme` 库.
