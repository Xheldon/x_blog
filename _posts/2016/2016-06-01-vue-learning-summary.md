---
layout: post
title:  "Vue 学习总结"
date:   2016-06-01 21:22:21 +0800
categories: [Framework]
---

这篇文章从 [`Vue 2.0官方文档`](https://cn.vuejs.org/v2/guide/instance.html) 的"实例"一节开始, 研究一些 `Vue API` 的使用方法, 以及 `Vue` 实现一些功能的原理, 此外还有自己的使用感受, 以及站在自己浅薄的角度分析 `Vue` 为什么要这么设计的不敬之举, 如有得罪还请海涵, 刚接触 `Vue` 不久, 不当之处烦请指出, 先行谢过.

> 注意: 基础知识直接略过, 我只说我认为需要说的点.

## Vue 实例

每个 `Vue.js` 的应用都是通过构造函数创建一个 `Vue` 的根实例启动的, 意思就是, 每个页面的数据都应该只由这一个实例维护, 原始数据的来源都应该只由根实例来发出和接收统一管理, 根实例再通过 `props`, 分发数据, 或者 `events` 来监听数据. 子组件只需要 `watch/computed` 数据变化, 及时更新即可.

文档中说了一句话叫: `所有的 Vue.js 组件其实都是被扩展的 Vue 实例`, 这句话正确理解起来应该是, 你可以在组件上使用和实例一样的方法和钩子函数, 除了 `data` .

组件中的 `data`, 必须是一个函数, 因为组件会被复用, 所以必须每次调用组件都生成一份数据.

数据代理(proxy), 指的是 `Vue` 实例会代理其 `data` 对象中的所有属性, 而实例属性 `$data` 则表示 `data` 属性本身, 以区别被代理的 `data`.

意思是, 如果一个 `vm` 的 `data` 属性为 `{a: 'xheldon'}`, 那么 `vm.a` 即为 `'xheldon'`, 而 `vm.$data` 则为 `{a: 'xheldon'}`.

组件其实也是一个(被扩展的) `Vue` 实例, 下面是个简单的验证:

有一个 `list.vue` 组件(`template` 和 `style` 省略):

```js
import Vue from 'vue'
export default{
  data(){
    console.log(this instanceof Vue);//true
    return {}
  }
  name: 'com-list'
}
```

## props vs data

初始化组件的时候, `prop` 上的属性和 `data` 上的属性以及 `computed` 的方法, 都被绑定到 `Vue` 实例上了, 但是 `porps` 上的属性, 优先级比 `data` 同名属性要高,下面是验证:

```js
export default{
  data(){
    console.log('first:',this);//list 的实例
    return {
      a: 'a',//属性 a 代表的值挂在 data 上, 但是被下面的 prop 属性同名覆盖(查看上面控制台输出的内容即可)
      d: 'd'
    }
  },
  props: ['a'],//和 data 中的 a 属性同名, 因此来自父级的数据将 data 中的同名属性 a 上的数据覆盖.(注:父级是根组件, 挂载在一个实例上)
  name: 'com-list'
}
```

结果出现警告(不是报错, 不影响渲染):

```js
[Vue warn]: The data property "a" is already declared as a prop. Use prop default value instead.
```

![props VS data](/static/img/2016/propsVSdata.png "props VS data")

而 `computed` 返回的函数名和 `data` 上的属性名可以重复, 并且不会有任何提示, 但是同名覆盖了之后, 因为在初始化的时候, 从控制台可以看到 `_data` 后于 `_computedWatcher` 来设置这个重复属性的 `getter` 和 `setter`(不知道是不是这个原因, 先放在这个地方以待我深入研究之后再修改这篇文章), 因此导致了被覆盖. 相关原理可以 [看这篇介绍](https://juejin.im/entry/577639de165abd00547b0924)

它们都在初始化的时候绑定到了实例 `属性` 上, 同名的 `computed` 属性被覆盖了, 但是 `Vue devtool` 仍然正确显示了出来)

```js
export default{
  data(){
    console.log('first:',this);//list 的实例
    return {
      ab: 'a',//属性 a 代表的值挂在 data 上, 但是被下面的 prop 属性同名覆盖(查看上面控制台输出的内容即可)
    }
  },
  computed: {
    ab(){
      return 'computed a';//方法名跟 data 上的 a 属性同名, 因此console 出来的 this 不会出现它的值, 用花括号输出的时候也是输出的 data 上的同名属性
    },
    f(){
      return 'computed f'//方法名没有重复的, 因此 console 出来的 this 会有它的同名属性, 且值为 'computed f', 我们提供的 function 被作为该属性的 getter(计算属性默认只有 getter, 可以手动添加 setter)
    }
  },
  name: 'com-list'
}
```

![computed VS data](/static/img/2016/computedVSdata1.png "computed VS data")

`Vue devtool` 正确显示了出来:

![computed VS data](/static/img/2016/computedVSdata3.png "computed VS data")

如果 `computed` 上的方法名和 `data` 上的属性名不重复:

```js
export default{
  data(){
    console.log('first:',this);//list 的实例
    return {
      a: 'a',//属性 a 代表的值挂在 data 上, 但是被下面的 prop 属性同名覆盖(查看上面控制台输出的内容即可)
    }
  },
  computed: {
    ab(){
      return 'computed a';//方法名跟 data 上的 a 属性同名, 因此 console 出来的 this 不会出现它的值, 但 Vue devtool 控制台正确显示了出来, 用花括号输出的时候也是其返回值 computed a.
    },
    f(){
      return 'computed f'//方法名没有重复的, 因此 console 出来的 this 会有它的同名属性, 且值为 'computed f', 我们提供的 function 被作为该属性的 getter
    }
  },
  name: 'com-list'
}
```

![computed VS data](/static/img/2016/computedVSdata2.png "computed VS data")

此外, `methods` 和 `computed` 方法的区别除了后者有缓存而前者没有外(即后者除非其所依赖的响应式数据发生变化, 否则不会重新计算), 如果两者均是为了返回插值的话,则 `methods` 上的方法使用是 `functionName()`,
而 `computed` 上的方法引用是 `functionName`, 即前者需要执行函数, 后者不需要执行.

究其原因, 是因为 `computed` 属性上的我们写的方法, 被当做一个属性, 挂载到 `Vue` 实例上了, 而我们提供的函数, 被当做此方法的 `getter`.

而 `methods` 不同, 它就是一个函数, 因此无论是插值引用, 还是事件方法, 都需要使用()来调用.

这样的话, 当需要真正的函数------这里如果使用函数调用, 则 `computed` 需要返回一个函数不仅仅指是返回一个值, 而是需要传递参数------的时候, `metohds` 首当其冲.

下面是一个不同于官网的另一个版本的 `todo list`:

模板:
```html
<template>
  <div>
  <input type="text"
  @keyup.enter="addToList"
  v-model="todotext"
  />
  <ul>
  {% raw %}
    <li v-for="(value, key) in todolist">
    {{key}}:{{value}}<button @click="deletetodo(key)">X</button></li>
  {% endraw %}
  </ul>
  </div>
</template>
```

逻辑:

```js
export default{
  data(){
    return{
      todolist:[],
      todotext:''
    }
  },
  methods: {
    addToList(){
      this.todolist.push(this.todotext);
    },
    deletetodo(key){
      console.log(arguments);
      this.todolist.splice(key, 1);
    }
  }/*,
  computed:{
    deletetodo(key){//不接收参数
      console.log(arguments);
      this.todolist.splice(key, 1);
    }
  }*/
}
```

此例子中, 如果使用这种模板, 则需要传递一个参数, 以在点击 `button` 的时候删除当前 `li`, 因此这个情况必须使用 `methods`.

使用 `computed` 的时候, 不接受参数 [(因为是一个 `getter`)](http://whereswalden.com/2010/08/22/incompatible-es5-change-literal-getter-and-setter-functions-must-now-have-exactly-zero-or-one-arguments), 即使其返回一个 `function` :

```js
computed:{
  deletetodo(key){
    return function(){
      console.log(arguments);//控制台输出当前组件实例
      this.todolist.splice(key, 1);//报错
    }
  }
}
```


注意: 若两者存在同名函数, 那么 `computed` 上的函数优先级比 `methods` 高(处理 `getter` 和 `setter` 先后顺序的问题, 具体可查看源码), 这个情况无论是对插值还是事件绑定都适用, 以下是验证:

插值引用测试:

模板:

```html
{%raw%}
<div>{{a()}}</div>
{% endraw%}
```

```js
methods:{
  a(){
    return 'im from methods'
  }
},
computed:{
  a(){
    return function(){
      return 'im from computed'
    }
  }
}
```

输出函数 `im from computed`, 如果 `computed` 不返回函数, 插值引用只使用 `{%raw%}{{a}}{% endraw%}` 则显而易见更是输出 `computed` 的值, 验证此处略.

事件绑定的时候:

调用的时候使用 [内联处理器方法](https://cn.vuejs.org/v2/guide/events.html#内联处理器方法):
```html
{%raw%}
<div @click="a()">click me</div>
{% endraw%}
```
逻辑:
```js
methods:{
  a(){
    console.log('methods')
  }
},
computed:{
  a(){
    return function(){//computed 返回一个函数
      console.log('computed')
    }
  }
}
```

输出 `computed`

如果使用 [方法事件处理器](https://cn.vuejs.org/v2/guide/events.html#方法事件处理器), 结果一样:

```html
{%raw%}
<div @click="a">click me</div>//注意此处不带括号
{% endraw%}
```
逻辑:
```js
methods:{
  a(){
    console.log('methods')
  }
},
computed:{
  a(){
    return function(){//computed 返回一个函数
      console.log('computed')
    }
  }
}
```

输出 `computed`

注意事件绑定的时候, `computed` 都需要返回一个函数.

因此优先级的顺序是:

`porps > data > computed > methods`

我猜测在 `computed` 和 `methods` 中的 `this.xxx` 中的引用优先级也是相同的, 想搞明白的可以去验证下.

而且可以看到, 两种情况 `method` 都不用返回一个 `function` , 而两种情况 `computed` 都需要返回一个 `function` 而且都不接受参数(因为是 `getter`). 综上所述, 事件处理最好使用 `methods`, 而数据绑定/插值处理 最好使用 `computed`(因为有缓存).

此外, 对于 `method` 绑定事件的时候, 带()和不带()的效果是一样的, 都会执行其函数, 区别有以下几个:

1. `带()的叫内联语句`, 分两种情况, 原生事件和自定义事件. 两种情况都可以传参, 如果参数列表为空, 则默认参数 `arguments` 也为空, 即不存在默认参数; 如果是被一个原生事件如 `input/click` 触发的, 则可以传递一个特殊的 `$event` 参数作为原生 `event` 事件处理; 而如果是被一个自定义事件触发的, 其事件处理函数的参数仍然取决于实际传递给事件处理函数的值, 而且自定义函数不存在特殊的 `$event` 对象供使用. 由 `$emit` 触发自定义事件时传递的参数将被忽略.
2. `不带()叫方法事件`, 则分两种情况: 如果是原生事件, 则会传递原生 `event` 事件作为唯一的默认参数; 如果是自定义事件, 则传递的是 `$emit` 事件的时候除了事件名外的第二到最后一个任意数量的参数.

> talk is cheap, show me the code

上面说的是四个情况:

1.带()的原生事件
```js
<input type="text" @click="test1()">//模板里面传参为空
methods:{
  test1(){
    console.log(arguments);//则逻辑中的参数也为空;
  }
}
```
2.带()的自定义事件
```js
//子模板
<input type="text" @input="shuru($event)"/>
<div>{{xheldon}}</div>
//子逻辑:
name: 'child',
props:['xheldon'],
method:{
  shuru(e){
    this.$emit('haha', e.target.value,'其他参数');
  }
}
//父模板
<child :xheldon="blob" @haha="something()"></child>
//父逻辑:
methods:{
  something(){
    console.log('parent:',...arguments);//上面 something() 中传 xxx, 则输出 'parent:xxx', 即忽略了子组件 $emit 事件时候传递的参数.
    this.blob = arguments;
  }
}
```
3.不带()的原生事件
```js
<input type="text" @click="test1">
methods:{
  test1(){
    console.log(arguments);//结果: 输出原生的 MouseEvent 事件
  }
}
```

4.不带()的自定义事件
```js
//子模板
<input type="text" @input="shuru($event)"/>
<div>{{xheldon}}</div>
//子逻辑:
name: 'child',
props:['xheldon'],
method:{
  shuru(e){
    this.$emit('haha', e.target.value,'其他参数');
  }
}
//父模板
<child :xheldon="blob" @haha="something"></child>
//父逻辑:
methods:{
  something(){
    console.log('parent:',...arguments);//input 输入 xxx, 则输出 'parent: xxx 其他参数', 即与子组件 $emit 时候传递的参数相关.
    this.blob = arguments;
  }
}
```

## 指令和参数(属性)

基本用法:

```html
<div v-directive:propNamed.modifiers="value"></div>
```

其中, `directive` 叫做指令, `propName` 叫做指令的"参数", 实际上参数的具体表现就是 `html` 上的属性(`Vue` 内置了一些参数/属性, 如 `v-bind:click="method"`, 的 `click`, 如 `v-bind:href="/img/x.png"` 的 `href`, 前者不会出现在行内, 而后者因为是必须的因此会出现在行内属性. 而自己定义的参数/属性, 一定会出现在行内属性). 而 `value` 是个变量(虽然它写在双引号中)大多数情况下来自于父级模板.

`propName` 可以带个修饰符, 用来快捷操作一些行为如禁止默认事件 `.prevent` 等.

有些指令可以直接使用如 `v-if`, 有些必须加上参数: `v-bind:href/v-on:click`

注意, `value` 带不带双引号结果都是一样的, 即 `:propName="value"` 和 `:propName=value` 是一样的, 除特殊说明, 下列所有情况均适用.

如果 `value` 转换成布尔值后为 `false` 则 `propName` 被移除, 为 `true` 则该 `propName` 出现, 实际上, 它遵守以下规则(仅限自定义属性):

1.`null`, `undefined`, `false` 的直接量, `propName` 属性被移除.
2.`value` 为一个未定义的变量, 如 `:propName="wxd"` 则 `propName` 移除, 且出现警告:

```js
[Vue warn]: Property or method "s" is not defined on the instance but referenced during render. Make sure to declare reactive data properties in the data option.
```

3.如果 `value` 为一个数组, 因为数组为对象, 因此 `propName` 除了下面第二种情况外, 恒存在, 而 `value` 分以下情况:

  1. `:propName =[]`, `:propName ="[]"`, `:propName ="['']"` `value` 移除, 即只有属性没有值.

  2. `:propName =[""]`, 结构乱掉.

  3. `:propName =["",""]` 或者 `:propName ='["",""]'`, `value` 值为`","`

  4. 如果 `value` 为一个嵌套数组, 则其值被一维化后, 如果 `value` 包含及其递归子元素包含一个为 `undefined` 或者 `null` 直接量(不是写到字符串里面的), 则该处的值留空; 如果 `value` 包含及其递归子元素包含一个 `Object`, 则该处的值为 `[object Object]`

4.如果 `value` 为一个对象, 则 `propName` 保留, 值为 `[object Object]`

5.如果 `value` 为一个数字或者字符串, 如 `:propName = "'fff'"`, 则 `propName` 保留, `value `为字符串或数字值.

看了下源码, 也确实是这么个逻辑:

```js
function setAttr (el, key, value) {
  if (isBooleanAttr(key)) {
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, key);
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true');
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  }
}
```

这些规则仅限自定义属性, 如果是内置属性, 则又不同, 比如绑定 `class` 属性:

```js
v-bind:class="{active: isActive}"
```

则表示如果 `isActive` 值为是 `false` 或者是其他可以转换成布尔值 `false` 的值, 则 `active` 这个类名不应用, 反之, 则应用该类名(同 if 语句的真假判定一致).

## 过滤器

过滤器串联起来的话, 第一个过滤器的参数是初始值, 随后的过滤器第一个参数为上一个过滤器的返回值, 没有返回值则为 `undefined`.

模板:
```html
<div v-bind:prop="rawProp | filterOne | filterTwo">控制台查看 filter 函数的参数</div>
```
逻辑:
```js
export default {
  data(){
    return {
      rawProp: 'this is raw prop'
    }
  },
  filters: {
    filterOne(){
      console.log(arguments);
      return 'this param is pass to next filter'
    },
    filterTwo(){
      console.log(arguments);
    },
  },
  name: 'com-header',
}
```

除了第一个 `filter` ,后面的 `filter` 没有办法获取到初始值. 当然, 如果你想传参数, 办法有的是, 比如第一个 `filter` 返回一个数组等等.

## 列表渲染

`v-for` 中, 如果参数是两个, 则是和原生 `js` 中的 `forEach` 参数一致, 是 `value, key`, 而使用 `of` 操作符和使用 `in` 操作符的效果完全一样------虽然在原生 `js` 中并不是.

还有个需要注意的地方是, 组件使用 `v-for` 的时候, 父级是不能自动传递数据到组件的, 因为组件有自己的独立作用域. 因此你为了传递数据给子组件用, 需要使用 `props` 属性写的稍微麻烦一点:

```html
<my-component
  v-for="(item, index) in items"
  v-bind:item="item"
  v-bind:index="index">
</my-component>
```

另外, `v-for` 使用在对象上面的时候, 迭代值是对象的值, 而不是键, 这个和原生 `js` 不一样, 原生 `js` 的 `for in` 循环若要输出值, 需要你手动遍历 `obj['i']`, 而想要输出键需要写第二个参数`(value, key)`:

```js
obj:{
  first: 'xheldon',
  last: 'cao',
  age: '25'
}
<div v-for="(value, key) in obj">{% raw %}{{value}}-{{key}}{% endraw %}</div>// 输出 xheldon cao 25
```

注意, 原生 `js` 除非你手动实现了一个 `Symbol.iterator`, 否则是不能使用 `for of` 循环的, 但是 `Vue` 可以------虽然效果和 `for in` 完全一样.

列表渲染还有一个小 `tips` 叫就地复用原则, 什么意思呢? 还是拿上面说的 `tololist` 说, 如果没有给每个元素指定一个独一无二的 `key` 值, 就像这样:

```html
<li v-for="(value, key) in todolist">{%raw%}{{value.key}}:{{value.value}}{%endraw%}<button @click="deletetodo(key)">X</button></li>
```

那么每次点击这个叉叉删除当前 `li` 的时候, `Vue` 都会就地复用当前的元素, 直接移动数据到正确的位置, 而不是 `remove` 删除的 `dom` 元素, 避免 `reflow`, 下面是使用 `chrome` 的 `devtool` 工具显示的当点击叉叉删除元素的时候, 页面 `render` 的情况:

![没有key](/static/img/2016/nokey.png "没有key")

可以看到 `reflow` 的部分只有最下面那一点

而当加上 `key` 之后:

```html
<li v-for="(value, key) in todolist" :key="value.key">{% raw %}{{value.key}}:{{value.value}}{% endraw%}<button @click="deletetodo(key)">X</button></li>
```

再看点击叉叉之后浏览器的 `render` 的情况:

![有key](/static/img/2016/key.png "有key")

有人可能会有疑惑, 为什么这个地方需要自己手动实现一个 `value` 上的 `value.key`, 而不是使用 `Vue` 给的 `(value, key)` 中的 `key` 呢?:

```html
{% raw %}
<li v-for="(value, key) in todolist" :key="key">{{value.key}}:{{value.value}}<button @click="deletetodo(key)">X</button></li>
{% endraw %}
```

答案是, `Vue` 给的 `key`, 看起来是个 `key`, 但是还是跟当前数据是无关的, 因此当删除一个 `li` 的时候, `key` 仅仅只是重新算了一下, 并没有跟着删除的或者被删除的元素移除或者上移下移. 如果使用上面的写法, 效果和第一种没有 `key` 的是一样的, 仍然使用了就地复用策略, 变动的还是数据, 不变的还是 `dom` 结构, 因此你需要手动实现一个 `key`, 大致是这样的:

```js
data(){
  return{
    toolist:[],
    truekey: 0,//手动实现一个 key
    todotext: ''
  }
},
methods: {
  addTolist(){
    this.todolist.push({value:this.todotext, key: ++this.truekey});// 把 key 放到 data 上
  }
}
```

## 事件处理器

事件处理器可以串联, 但是有些元素本身不支持, 因此绑定了也没有意义, 如在 `div` 上绑定一个 `keyup` 事件:

```js
<div @keyup.alt="pressalt">div alt 按键测试</div>
```

因此一般是在 `div` 上冒泡处理事件, 然后在一个 `input` 上绑定一个 `alt+ctrl` 事件:

```js
<div @keyup.alt="presskey">div冒泡按键测试
  <input type="text">
</div>
```

我对此有个担心, 就是如果一个 `input` 使用了 `@keyup.space` 的监听, 但是中文输入法中空格一般是用来选中词语的, 那实际输出的是还未选中词语的拼音字母, 还是按下空格后, 候选列表的第一个词语呢?(貌似这个不是 `Vue` 的问题, 但是还是在这儿提出来了)

答案是, 大多数情况下, 结果是按下空格后的第一个词语, 但是如果一句话很长的话, 需要按两次 `space` 来输出一句话, 则第一次按的时候, 什么也不会输出, 是个空的, 第二次按下 `space` 才输出全部的词汇. 我这里是为了测试的极端情况, 因此基本可以认为按下空格后的第一个词语, 而不是空白, 或者拼音字母. 我使用的是搜狗 `mac` 输入法的单行候选词模式, 可以用上面的 `todolist` 来测试(略)

注: 官网文档讲 `v-model` 的时候会讲到 `IME`, 说的就是这个问题, 如果希望使用输入法的时候, `v-model` 也即时响应, 那么可以绑定 `input` 事件.

## 表单控件
`v-model` 一般用在 `input` 上面, 而模板中的 `input` 的 `value` 值会被忽略------ `v-model` 只认在 `js` 中的初始值, 并与之绑定, 因此如果你写了 `v-model`, 又写了 `value` 属性, 则后者虽然会出现在 `dom` 结构中, 但是 `js` 获取其值的时候会忽略掉它而取 `v-model` 绑定的值:

```html
<input type="text" value="我出现在 dom 结构的 value 属性中, 但是只能通过 getAttribute 获取到我, .value 并不能获取到, 伤心~">
```

```js
data(){
  return{
    todotext:'我是真正的初始值, js 获取的是我, 虽然我并不出现在 dom 中的 value 属性中~',
  }
}
```

二者的区别类似于 `jQuery` 中的, `.data` 和 `.attr` 的区别------写在行内的是 `attr('data','xxx')`的值, 查看 `dom` 结构看到的也是 `xxx` 的值, 但是 `js` 获取到的实际的值是通过 `js` 绑定的 `.data('yyy')` 的值------当然除非你使用 `attr` 读取 `dom` 结构.(注意, 实例化之后再修改 `attr` 的值, `js` 获取到的就是 `attr` 的值了, 这里的忽略初始值, 仅仅是忽略初始值而已, 举个例子就是初始化之后的 `v-model` 绑定了 `value` 之后, 手动修改 `dom` 结构的 `value` 值, 那 `v-model` 再获取该元素的 `value` 值就会使用修改后的 `attr` 属性值, 而不是 `data` 上面的值).

如果需求比较奇葩, 不想通过 `v-model` 获取 `input` 的值, 然后实时更新, 或者需要获取 `input` 的值处理后再更新, 同时不想使用 `v-model`, 可以试试 `$ref`(`e.target.value` 也是可以的):

模板:

```html
<input @input="input" ref="inputvalue" />
```

逻辑:

```js
data(){
  message: ''
},
methods:{
  input(){
    this.message = this.$refs.inputvalue.value;
  }
}
```

官网文档也说了, `v-model` 只是一个实现双向数据绑定的语法糖:

```html
<input v-bind:value="something" v-on:input="something = $event.target.value">
```

不过监听 `input` 事件, 导致的问题是使用输入法的时候, 在没按空格选中词语的时候, 也会触发输入的事件, 所以如果没有这个需求, 还是老老实实用 `v-model` 的好.

如果需要多个元素绑定相同的值并输出, 常见的需求是一组 `checkbox`, 这个时候需要使用数组:

```html
<input v-model="messages" type="checkbox" value="xheldon" />
<input v-model="messages" type="checkbox" value="xiaodan" />
<p>{{messages}}</p>
```

```js
data(){
  return{
    messages: []
  }
}
```

(目前我发现的)这种如此简洁的数组用法仅仅对多个 `checkbox` 类型的 `input` 有效------即几个元素绑定相同的 `v-model`, 但是这几个元素的状态却没有同步, 而是将对应的 `value` 放到数组中. 当然如果你强行说, 我用 `methods` 方法可以实现任意输入类型的元素完成类似效果------那当我没说.

单个的 `checkbox` `v-model` 绑定的是 `value` 值, 为 `true` 或者 `false`, 可以通过 `:true-value` 和 `:false-value` 来自定义选中时候的值和没有选中时候的值.

而多个单选框 `radio` 中的 `v-model` 起到了类似 `name` 的作用------即用来分组, 所以 `radio` 类型的 `input` 使用 `v-model` 的话就不用写 `name` 属性.

`select` 类型的如果没有给定每个 `option` 的 `value` 属性, 则绑定的是 `option` 中的值, 如果给了则就是 `value` 的属性值. `select` 类型的多选框 `v-model` 绑定的 `data` 必须是一个数组类型, 否则会给出警告(但不会报错, `Vue` 自动转换, 还是能正常运行):

```js
Vue warn]: <select multiple v-model="selectM"> expects an Array value for its binding, but got String
```

注意, 以上所有类型的 `v-model` 和 `value` 绑定时, 而 `value` 属性又动态 (`:value="xxx"`)绑定了 `data` 上的其他(`xxx`)属性, 则 `v-model` 对应的属性和 `:value` 对应的属性是同一个(严格相等).

## 组件

首先需要区分的是, 什么是 `DOM` 模板, 什么是字符串模板.

`HTML` 模板指的是普通的 `html` 中的元素, 这些元素会通过 `Vue` 实例的 `el` 选项进行绑定:
字符串模板部分:
```js
<div id="tpl">  实例挂载元素
  html 自有组件:
  <ul>
    <li></li>
    <li></li>
  </ul>
  自定义组件:
  <my-component></my-component>
</div>
```

字符串模板指的是:

1.`js` 中通过 `template` 注册的模板如:
```js
Vue.component('my-component', {
  template: '<span>{{message}}</span>',
  data(){
    message: 'hello, xheldon'
  }
});
```
或者:
```js
var Child = {
  template: '<div>'hello, xheldon'</div>'
}
new Vue({
  components: {
    'my-component': Child
  }
})
```
2.通过`<script type="text/x-tempalge"></script>`注册的模板(和 `Handlebar` 一样)

3.`.vue` 组件中的 `<template>` 标签内的内容.

因为 `Vue` 是在浏览器解析完毕之后才开始解析 `DOM` 模板的, 因此 `DOM` 模板在一些需要特定子元素的标签上不能使用组件. 如 `select` 标签下的子元素必须为 `option`, 因此用自定义标签 `com-option` 则不会识别, 因此可以增加一个 `is="component-name"` 属性, 表明该标签使用的模板名字即可.

## 字面量语法 VS 动态语法

这里需要注意个问题, 即在原生 `js` 中, 对象的属性是可以为数字的, 只是其会被当成是字符串(仅限 `ES5`, `ES6` 中对象属性可以为任意值, 不过和之后要说的不冲突). 但是在 `Vue` 中, `data` 属性上不能使用数字作为属性, 如果是字面量语法, 传递数字会被先 `toString` 处理, 而如果是动态语法, 则会直接当做是数字处理, 不会寻找 `data` 上绑定的属性值:

子组件模板:
```html
<div>{%raw%}{{dynamic}}{%endraw%}</div>
<button @click="alertProp"> 点我看上面 props 传参的类型</button>
```

子组件逻辑:
```js
props:['dynamic'],
methods:{
  alertProp(){
    alert(typeof this.dynamic)//上面说过了, props 属性也是绑定到 Vue 实例上的, 因此可以直接使用 this
  }
}
```

父组件-字面量语法:
```html
<com-child dynamic="11"></com-todolist>
```

父组件-动态语法:
```html
<com-child :dynamic="11"></com-todolist>
```

以上两种语法下父组件逻辑均为:
```js
data(){
  return {
    11:'属性-动态语法'
  }
}
```

结果是, 当使用父组件字面量语法毫无疑问点击 `button` 的时候传递给子组件的是 `1`, 而且文档也说了, 是字符串的 `1`, 因此 `alert` 出来的是 `string`; 而当父组件动态语法使用 `v-bind` 绑定了父组件 `data` 的 `1` 属性, 但是子组件并没有接收到 `1` 属性对应的 `属性-动态语法` 这个值, 而还是 `1` 这个值,  因此点击 `button` 时候 `alert` 出来的是 `number`.

结论: 最好不要使用数字作为 `data` 对象的属性.

注意: 如果传递给子组件属性的是一个数组或者对象, 在子组件中修改这个属性值, 则会反映到父组件上------这通常是不应该的, 因为俗话说得好: `props down, events up`(举例略), 最佳实践应该是使用父组件传递过来的引用类型的深拷贝------当然如果你就是需要子组件影响父组件的状态, 那我祝你好运.

`events up` 的时候, 如果子组件 `$emit` 的时候传递了除了事件名之外的其他参数, 则这些参数会被传递给父组件的事件监听函数:

子组件模板:
```js
<input type="text" @input="someEventHandlerForOriginalEventLikeClickOrInput($event)"/>
<span>{{data}}</span>
```
子组件逻辑:
```js
props:['data'],
methods:{
  someEventHandlerForOriginalEventLikeClickOrInput(e){
    this.$emit('eventPasstoParent', e.target.value, 'someOtherArgus');
  }
}
```
父级模板:
```html
<com-todolist :data="someParentData" @eventPasstoParent="someParentEventHandler"></com-todolist>
```
父级逻辑:
```js
someParentData: ''
methods:{
  someParentEventHandler(){
    this.someParentData = [...arguments];
  }
}
```

## 异步更新队列

有了 `Vue`, 就不再需要 `jQuery` 了, 框架的最大好处是避免了我们对相同操作的写出重复的代码. 双向数据绑定可以帮我们解决很多 `DOM` 操作问题, 但是有些情况下 `jQuery` 却更有优势, 比如操作 `DOM` 的时候, `jQuery` 会接收一个函数作为回调函数, 动画执行完成的时候触发. 而我们使用的双向数据绑定, 设置完数据之后, 如何知道 `DOM` 已经更新了呢? 答案和 `jQuery` 一样, 就是异步更新队列.

```js
var vm = new Vue({
  el: '#example',
  data: {
    message: '123'
  }
})
vm.message = 'new message' // 更改数据
vm.$el.textContent === 'new message' // false
Vue.nextTick(function () {
  vm.$el.textContent === 'new message' // true
})
```
这么写我个人是不推荐的, 因为我认为最好的逻辑是写到实例的属性/方法里面, 而不是写到实例的外面, 还好 `Vue` 给我们提供了实现方式:

```js
Vue.component('example', {
  template: '<span>{{ message }}</span>',
  data: function () {
    return {
      message: 'not updated'
    }
  },
  methods: {
    updateMessage: function () {
      this.message = 'updated'
      console.log(this.$el.textContent) // => '没有更新'
      this.$nextTick(function () {
        console.log(this.$el.textContent) // => '更新完成'
      })
    }
  }
})
```

## 动画

动画没什么好说的, 主要是 `JavaScript` 钩子函数中的两个钩子需要说下, 一个是 `enterCanceled` 和 `leaveCancelled`. `enterCancelled` 在 `v-if` 和 `v-show` 中使用, 均可能触发, 而触发时机, 是触发 `enter` 的事件之后, 在动画还没有执行完的过程中, 又需要执行其他动画的时候. 而 `leaveCancelled` 只用于 `v-show` 中, 在 `v-if` 中使用时无效的, 永远不会被触发, 其触发时机是在离开动画(即 `xxx-leave-active` 动画)播放未完成的时候, 又执行了其他动画的时候触发.

测试代码:

```html
<button type="button" @click="show=!show">点击我切换状态</button>
<transition name="go"
  @before-enter="beforeEnter"
  @enter="enter"
  @after-enter="afterEnter"
  @enter-cancelled="enterCancelled"
  @before-leave="beforeLeave"
  @leave="leave"
  @after-leave="afterLeave"
  @leave-cancelled="leaveCancelled"
>
此处使用 v-show, 修改成 v-if 的时候发现, leave-cancelled 不会触发.
<p v-show="show">
  点击展示我, 再点击一下隐藏我.
</p>
</transition>
```
逻辑:
```js
data(){
  return{
    show: true
  }
},
methods: {
  beforeEnter(){alert(1);},
  enter(){ alert(2);},
  afterEnter(){ alert(3);},
  enterCancelled(){ alert(4);},
  beforeLeave(){ alert(5);},
  leave(){alert(6);},
  afterLeave(){ alert(7);},
  leaveCancelled(){ alert(8);}
},
```
样式:
```css
.button-animate button{
  margin-left:20px;
  margin-top: 40px;
  transition: all 1s ease;
  position: absolute;
}
.go-enter-active {
  transition: all 5s ease;
}
.go-leave-active {
  transition: all 5s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.go-enter, .go-leave-active {
  transform: translateX(10px);
  opacity: 0;
}
```

钩子们的参数除了 `enter` 和 `leave` 是 `el` 元素本身(原生的 `Element` 类型元素), 和 `done` 回调函数外, 其他钩子的参数均为 `el` 元素本身.

元素的过渡, 最好给每个元素加个 `key`, 因为之前提到的就地复用策略, 可能在切换的时候直接替换数据, 没有动画效果.

在官方文档中完全没有说明的一点是, `Vue transition` 的动画类名 `css` 的写法是有顺序限制的, `v-enter` 和 `v-leave` 必须写在 `v-enter-active` 和 `v-leave-active` 的后面, 否则无效, 比如我想写一个点击按钮的淡入淡出效果, 点击按钮之后会有一个按钮从左向右淡入, 同时当前点击的按钮任从左往右淡出:
逻辑:
```js
data:{
  isShow: true
},
methods:{
  animakkey(){
    this.isShow = !this.isShow;
  }
}
```
结构:
```html
<div class="button-animate">
  <transition name="go">
    <button key="a" v-if="isShow" @click="animakkey">on</button>
    <button key="b" v-else @click="animakkey">off</button>
  </transition>
</div>
```
如果你的样式是这样的:
```css
.button-animate button{
  margin-left:20px;
  margin-top: 40px;
  transition: all 1s ease;
  position: absolute;
}
.go-enter{
  opacity: 0;
  transform: translateX(-25px);
}
.go-leave{
  opacity: 1;
  transform: translateX(25px);
}
.go-enter-active{
  opacity: 1;
  transform: translateX(0px);
}

.go-leave-active{
  opacity: 0;
  transform: translateX(50px);
}
```
会发现动画效果并不如意:

![animate](/static/img/2016/animateBad.gif "animate")

而如果把 `enter` 放到 `enter-active` 的后面:
```css
.button-animate button{
  margin-left:20px;
  margin-top: 40px;
  transition: all 1s ease;
  position: absolute;
}
.go-enter-active{
  opacity: 1;
  transform: translateX(0px);
}
.go-enter{
  opacity: 0;
  transform: translateX(-25px);
}
.go-leave-active{
  opacity: 0;
  transform: translateX(50px);
}
.go-leave{
  opacity: 1;
  transform: translateX(25px);
}
```
就完美了:

![animate](/static/img/2016/animateGood.gif "animate")

在对比了这四个 `css` 类名的可能顺序之后, 发现只要 `v-enter` 放到 `v-enter-active` 的后面就能实现效果, 其他类名随意.

`transition` 标签中不能放其他元素而只能是放需要动画的元素, 如果上述示例结构写成这个样子:

```html
<transition name="go">
<div class="button-animate">
  <button key="a" v-if="isShow" @click="animakkey">on</button>
  <button key="b" v-else @click="animakkey">off</button>
</div>
</transition>
```
则不会有任何动画效果, 而如果在正常 `css` 类名中使用一些 `css` 属性规定了元素的样式, 而在动画类名如 `v-enter` 中又使用了相同的属性, 则也不会生效, [文档](https://cn.vuejs.org/v2/guide/transitions.html#自定义过渡类名) 说"他们的优先级高于普通的类名", 实则不然(也不知道是我理解错误?欢迎指正), 还是上例, 样式中, 设置 `button` 的正常 `css` 属性:

```css
.button-animate button{
  margin-left:20px;
  margin-top: 40px;
  transition: all 1s ease;
  position: absolute;
  transform:translateX(50px);
}
.go-enter-active{
  opacity: 1;
  transform: translateX(0px);
}
.go-enter{
  opacity: 0;
  transform: translateX(-25px);
}
.go-leave-active{
  opacity: 0;
  transform: translateX(50px);
}
.go-leave{
  opacity: 1;
  transform: translateX(25px);
}
```
结果:

![animate](/static/img/2016/animateWithout.gif "animate")

可以看到, 只有 `opacity` 产生了动画, `transform` 没有动画!(同学们可以测试下是用 `animate.css` 的时候, 使用 `Animate.css` 中相同的属性来提前设置元素, 是否还有动画效果, 欢迎提 `issue`.)

`transition-group` 和 `transition` 有点不太一样, 从外观上说, `transition` 本身只是个包裹容器, 不参与任何的页面构成, 但是 `transition-group` 却会被 `Vue` 替换为一个标签, 默认是 `span` 标签, 也可以定制被替换成的标签名.

## `render` 函数

使用 `render` 函数可以代替写模板的作用, 其形参 `createElement` 一般被写成 `h`, 在组件或者标签内的各种绑定/属性等, 在 `createElement` 中都能找到对应的 `JavaScript` 写法, 如果找不到, 那就说明可以使用原生的写法, 比如 `.stop`, `.prevent` 等, 直接使用 `event.stopPropagation()` 和 `event.preventDefault()` 即可.

## 其他

混合(`mixin`), 就是指在写正常的组件过程中(也即在组件的生命周期中), 修改或者添加额外的功能.

部分`插件`就是根据上面的 `mixin` 写的, 除此之外的插件还有往 `Vue.prototype` 添加方法, 或者通过 `config` 添加一些全局的方法或者属性.

`路由`, 可以通过 `component` 的 `is` 属性来简单实现, 也可以直接写 `render` 函数根据不同路径渲染不同模板, 当然更复杂的需要第三方库了.

`状态管理`, 看示例是要加个 `wrap` 来记录每个状态改变的过程, 然后官方建议的最佳实践是即使你能直接复制给示例属性, 但是也最好通过函数来修改状态, 因为这让状态变得可追踪.

`单元测试`, 就是正常的单元测试, 没什么好说的.

## 服务端渲染(`Server Side Render`)

看了下思路, 基本上很简单, 就是首先在 `app.js` 中 `exports` 一个 `Vue` 实例, 然后新建一个页面模板文件 `index.html`(引入 `Vue.js` 和挂载 `Vue` 实例的方法 `$mount`, 官网同样也引入了 `app.js`, 是否需要待我验证下再说), 含有实例的挂载点(一个带有 `id` 属性的非空元素), 然后在服务端 `server.js` 都 `require` 过来, 用 `vue-server-renderer` 这个东西, 把 `app.js` 中 `exports` 出去的 `Vue` 实例渲染下, 再在返回给客户端的时候替换掉挂载点(一个带有 `id` 属性的非空元素, 因为 `app.js` 中的模板已经存在了)即可.

服务端渲染的结果就是, 会在上述的挂载点(一个带有 `id` 属性的非空元素)加一个 `server-rendered="true"` 的属性(通过右键查看页面源代码查看存在, 说明不是 `js` 动态添加的).

服务端也支持流式渲染, 首先需要把 `html` 以挂载点(一个带有 `id` 属性的非空元素,如 `<div id="app"></div>`)为分割点, `split` 一下, 分为 `ab` 两个部分, 而刚刚使用的 `vue-server-renderer` 的是把 `app.js` `renderToString` 了, 而为了支持流式渲染, 需要换个方法叫 `renderToStream`, 然后监听 `data` 事件, 附加到, `html` 的 `a` 部分的后面, `end` 事件之后, 再拼接上 `html` 的 `b` 部分, 最后再一并 `res.send` 出去.

## 后记

坐标帝都, `ping` `cn.vuejs.org`:

![ping](/static/img/2016/ping1.png "ping")

`ping` 我司`FQ` `VPS`:

![ping](/static/img/2016/ping2.png "ping")

`dig` 一下:

![dig](/static/img/2016/dig1.png "dig")

可以看到使用的是 `cloudflare` 的服务, 国际网站不好做呀, 呵呵.





















