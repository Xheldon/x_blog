---
layout: post
title:  "Vue 响应式原理及实现"
date:   2016-08-02 15:12:54 +0800
categories: [Framework]
---

## 本文由来

研究了下 Vue 的响应式原理, 想记录下来, 顺便将 Vue 的响应式给实现一遍, 因此有了本文.

## 概述

`Vue` 响应式数据的初始化, 是在 `initState` 的 `initData` 中进行的, 通过 `observe` 函数观察 `vm` 对象的 `data` 属性, 然后设置 `getter` 和 `setter`属性;
因此起码需要三个函数: 设置属性 `getter` 和 `setter` 的观察者, 触发 `getter` 和 `setter` 的 `监听者`, 以及保存属性依赖的 `收集框`, 我分别命名为: `observe`, `watcher`, 和 `dep`

## 流程

首先是在 `observe` 中, 将 `data` 中的属性, 递归的加上 `getter` 和 `setter`; 之后, 在 `watcher` 其中的一个属性的时候, `watcher` 实例触发 `getter` 拦截器, 然后该属性的拦截器将 `watcher` 实例添加到该属性的闭包依赖收集器 `dep` 中, 同时将该闭包依赖收集器, 放入该 `watcher` 中;

之后, 当修改上述的属性的时候, 触发 `observe` 中定义的 `setter` 拦截器, 此时 `dep` 中的 `watcher` 将开始工作, 执行该 `watcher` 的回调;

## 注意事项

### 如何保证触发 `getter` 的时候, 依赖不重复收集?

`watcher` 触发 `getter` 的时候, 会把当前属性的依赖收集器添加到 `watcher` 的 Set 数组中, 进行对比, 如果重复则不再添加:

```js
addDep (dep) {
  var id = dep.id;
  if (!this.depIds.has(id)) { // 一次求值时候的去重
    this.deps.push(dep);
    dep.addSubs(this); // 再将 watcher 放到字段的 Dep 的实例 subs 中, 以供值变化的时候 执行 notity, 把 subs 中的 watcher 拉出来挨个执行一遍
  }
}
```

### 如何在触发 `setter` 的时候执行回调?

触发 `setter` 的时候, 会将该属性的中装有 `watcher` 的数组拉出来挨个执行一遍:

```js
// setter
set (newVal) {
  // 先触发一次依赖, 在 watcher 中 维护一个 depId 去重
  if (newVal === val) {
    console.log('值相等, 未变化, 呵呵');
    return;
  }
  val = newVal;
  dep.notity(); // 触发 值 watcher 的  update 操作
}
// dep.notity() 函数: 
notity () {
  this.subs.forEach((watcher) => {
    watcher.update();
  });
},
// watcher.update() 函数:
update () { // 触发值变化的时候, 执行该函数进行求值及更新操作
  var value = this.get();
  if (value !== this.value) {
    console.log(`恭喜你成功更新了该值, 当前 deps 为: ${this.deps}, depsId 为: ${this.depIds}, 旧值为: ${this.value}, 新值为: ${value}`);
    this.cb.call(this.data, this.key);
  } else {
    console.log('两次相同, 无需更改');
  }
}
```

## 具体代码:

```js
var wId = 0; // watcher 自增 id
var dId = 0; // dep 自增 id
/**
  @for 为了观察 data 上的属性变化
*/
function observe (data) {
  var propertys = Object.keys(data);
  var dep = new Dep(); // 闭包 Dep 外界不可访问, 实例的 subs 放着它的 watcher
  propertys.forEach((property) => {
    var val = data[property];
    Object.defineProperty(data, property, {
      get () {
        // 添加依赖到 该属性的 闭包 dep 中
        dep.depend();
        return val;
      },
      set (newVal) {
        // 先触发一次依赖, 在 watcher 中 维护一个 depId 去重
        if (newVal === val) {
          console.log('值相等, 未变化, 呵呵');
          return;
        }
        val = newVal;
        dep.notity(); // 触发 值 watcher 的  update 操作
      }
    });
  });
}

/**
  @for 收集 data 的 key 字段变化时候的响应, 并执行
*/
function Watcher (data, key, cb) {
  this.data = data;
  this.key = key;
  this.cb =cb;
  this.depIds = new Set();
  this.deps = [];
  this.value = this.get(); // 触发取值操作
}

Watcher.prototype = {
  update () { // 触发值变化的时候, 执行该函数进行求值及更新操作
    var value = this.get();
    if (value !== this.value) {
      console.log(`恭喜你成功更新了该值, 当前 deps 为: ${this.deps}, depsId 为: ${this.depIds}, 旧值为: ${this.value}, 新值为: ${value}`);
      this.cb.call(this.data, this.key);
    } else {
      console.log('两次相同, 无需更改');
    }
  },
  get () {
    var val;
    pushTarget(this); // 为了方便, 设置 Dep.target 为当前 watcher 实例, 用完即删
    val = this.data[this.key]; // 触发取值操作: 触发 observe 中的 getter => 触发 key 字段的 dep.depend() => 触发 watcher 的 addDep => 
    popTarget(); // 用完弹出 后进先出
    return val;
  },
  addDep (dep) {
    var id = dep.id;
    if (!this.depIds.has(id)) { // 一次求值时候的去重
      this.deps.push(dep);
      dep.addSubs(this); // 再将 watcher 放到字段的 Dep 的实例 subs 中, 以供值变化的时候 执行 notity, 把 subs 中的 watcher 拉出来挨个执行一遍
    }
  }
}

/**
  @for 收集 data 的 key 字段变化时候的响应, 并执行
*/
function Dep () {
  this.subs = [];
  this.id = wId++;
}
Dep.prototype = {
  depend () {
    Dep.target.addDep(this); // 触发 get 取值的时候, 将当前 dep 实例添加到 watcher 中
  },
  notity () {
    this.subs.forEach((watcher) => {
      watcher.update();
    });
  },
  addSubs (watcher) {
    this.subs.push(watcher);
  }
};

var targetList = [];
function pushTarget (watcher) {
  Dep.target = watcher;
  targetList.push(watcher);
}
function popTarget () {
  targetList.pop();
  Dep.target = targetList[targetList.length - 1];
}

// 执行 watcher
var a = {
  b: 'c'
};
observe(a);
// 这个 watcher 是用户自己写的 watch
new Watcher(a, 'b', function (data, key) {
  console.log('watcher 回调成功执行!');
});
```

## 代码执行顺序示意图:

![示意图](/static/img/2016/vue-reactive.png "效果示意")
