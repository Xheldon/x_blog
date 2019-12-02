---
layout: post
title:  "[译] Promise 反面模式"
date:   2016-03-04 22:43:12 +0800
categories: [Translation]
---

最近在看`Promise`相关的东西，看到了这篇文章，觉得很不错，遂记录下来。

`Promises`本身是很简单的，前提是你得找得到头绪，下面是几个关于Promise的容易困惑的知识点来验证你是否真的掌握了`Promise`。其中的几个真的曾经让我抓狂过。

## 嵌套Promises

你有一捆的Promises互相嵌套着：

```js
loadSomething().then(function(something) {
  loadAnotherthing().then(function(another) {
    DoSomethingOnThem(something, another);
  });
});
```

你这么做的原因是你需要处理这两个Promises的结果，所以你不能链式调用他们因为`then()`方法只接受上一个`then()`返回的结果。（意思是这两个`Promise`是需要同时处理没有先后关系的，但是`then`却有个先后关系，如果前者`throw` `error`直接进入`catch`处理环节）

呵呵，其实你这么写的真正原因是你不知道`all()`方法：

解决这种丑陋写法的方案：

```js
q.all([loadSomething(), loadAnotherThing()])
  .spread(function(something, another) {
    DoSomethingOnThem(something, another);
  });
```

更简洁了。`q.all()`返回一个`promise`对象，并将这个结果结合成一个数组并传递给`resolve`方法供之后的`then`方法调用，`spread()`方法将会分割这个数组为几个数组长度的参数传递给其中的`DoSomethingOnThem`函数。

（注：`Promise.all()`接受一个数组作为参数,数组元素为`promise`,元素之前没有先后顺序,同时执行,最后传递给`then`方法的值为各个`promise`方法`return`值的数组。这里作者使用的是`node`中的一个模块`q`作为示例)

## 中断的链式调用
 
假设你有这样一段代码：

```js
function anAsyncCall() {
  var promise = doSomethingAsync();
  promise.then(function() {
    somethingComplicated();
  });
  return promise;
}
```

这段代码的问题是，出现在`somethingComplicated()`函数的`error`都不会被捕获。`Promises`意味着能够链式调用（不然还叫什么`then`，直接`done`就行了）每一个被调用的`then()`方法返回一个新的`promise`，这个新的`promise`是会被下一个`then()`方法继续调用的。正常来说，最后一个调用应该是`catch()`方法，出现在链式调用任何地方的任何`error`都会被它捕获并处理。

在上面的的代码中，链式调用在你返回第一个`promise`而不是返回一个`then`处理后的新的的`promise`给最后一个`then`调用的时候中断了（即`then`不改变原有的`promise`，它只处理它，然后返回一个新的`promise`）。
解决这个问题的方案：

```js
function anAsyncCall() {
  var promise = doSomethingAsync();
  return promise.then(function() {
    somethingComplicated()
  });
}
```

记住，总是返回最后一个`then()`的结果（以能够使用链式调用）。

## 混乱的集合

你有一组元素的数组，你想对这个数组的每个元素之执行一些异步操作。所以你发现你需要做一些涉及到递归调用的事情。

```js
function workMyCollection(arr) {
  var resultArr = [];
  function _recursive(idx) {
    if (idx >= resultArr.length) return resultArr;
    return doSomethingAsync(arr[idx]).then(function(res) {
      resultArr.push(res);
      return _recursive(idx + 1);
    });
  }
  return _recursive(0);
}
```

额。。这段代码不是很直观，问题的关键在与，当你不知道有多长的链式调用的时候，链式调用就变成一个意见痛苦的事情。除非你知道(`JavaScript ES5+`原生的数组方法)`map()`和`reduce()`

解决方案：
记住，`q.all`参数是一个由`promise`构成的数组，同时它会把结果放到一个数组中并传给`resolve`方法。我们可以简单的使用数组元素的map方法来对每个数组中的元素执行这个异步调用方法，像下面这样：

```js
function workMyCollection(arr) {
  return q.all(arr.map(function(item) {
    return doSomethingAsync(item);
  }));
}
```

不像开始那个并不是什么解决方案的递归调用，这段代码将同步调用数组中的每个元素传递给一个异步调用函数。明显在时间上更有效率一些。
如果你需要按顺序返回`promises`，你可以使用`reduce`：

```js
function workMyCollection(arr) {
  return arr.reduce(function(promise, item) {
    return promise.then(function(result) {
      return doSomethingAsyncWithResult(item, result);
    });
  }, q());
}
```

看起来不是很简单明了，但是确实比最开始的那个简洁多了。（Not quite as tidy, but certainly tidier.）

## 幽灵Promise

有一个确定的方法（意思是已经在开始执行Promise时就给出此方法，而不是在执行中由结果来确定的方法---译者注），有时候需要异步调用，有时候又不需要。因此你为了应对这两种情况只创建了一个promise仅仅是为了保持异步和非异步的情况下代码一致（以便于抽象和解耦---译者注），即使这种情况实际只可能出现其中一种。

```js
var promise;
if (asyncCallNeeded)
  promise = doSomethingAsync();
else
  promise = Q.resolve(42);
promise.then(function() {
  doSomethingCool();
});
```

以上这段代码在反面模式中并不算最糟糕的地方，但是却应该写的更清晰一些---用`Q()`来包裹`value`或`promise`。Q()方法即接受一个值也接受一个`promise`作为参数：

```js
Q(asyncCallNeeded ? doSomethingAsync() : 42)
  .then(
  function(value){
    doSomethingGood();
  })
  .catch(
    function(err) {
      handleTheError();
    });
```

备注：开始的时候我在这个情况下建议使用`Q.when()`，多亏了Kris Kowal同学在评论中的建议把我从错误中拯救出来。不要使用`Q.when()`，只使用`Q()`就够了，后者更清晰一些。

## 饥渴的错误处理函数
（小节标题意思是在`then`中同时设置`fulfilled`和`rejected`，以期能够使用`rejected`函数处理同样作为`then`函数参数的`fulfilled`中的错误，但是这是不可能的，`fulfilled`中的`error`只能传递给下一个`then()`而不能在当前被`rejected`函数处理，所以这小节的标题为『过度渴望』---它虽然渴望处理错误，但是错误永远不会传递给它让他处理---译者注）

`then()`方法接受两个参数，对`fulfilled`状态的操作函数和对`rejected`状态操作函数。你可能写过下面这种代码：

```js
somethingAsync.then(
  function() {
    return somethingElseAsync();
  },
  function(err) {
    handleMyError(err);
});
```

这么写的问题是，发生在`fulfilled`状态的的`error`不会传递给错误处理函数。
解决这个问的的方法是，确保错误处理函数在一个独立的then方法中：

```js
somethingAsync
  .then(function() {
    return somethingElseAsync();
  })
  .then(null,
    function(err) {
        handleMyError(err);
    });
```

或者使用`catch()`：

```js
somethingAsync
  .then(function() {
      return somethingElseAsync();
  })
  .catch(function(err) {
      handleMyError(err);
  });
```

这样可以确保任何发生在链式调用中的`error`都能得到处理。

## 被遗忘的Promise

你调用一个方法，返回一个`promise`，然而你忘记了这个`promise`，然后又创建了一个`promise`：

```js
var deferred = Q.defer();
doSomethingAsync().then(function(res) {
  res = manipulateMeInSomeWay(res);
  deferred.resolve(res);
}, function(err) {
  deferred.reject(err);
});

return deferred.promise;
```

这段代码真的是把`promsie`的简洁特性抛弃的一干二净---有太多无用的代码了。
解决方案是，仅仅返回`promise`即可：

```js
return doSomethingAsync().then(function(res) {
  return manipulateMeInSomeWay(res);
});
```

