---
layout: post
title:  "也谈浏览器 IME 相关事件"
date:   2019-09-11 23:19:00 +0800
categories: [Javascript]
---

## 引言

IME 全称是 Input Method Editor, 中文译为输入法, 它是为了解决有限的键盘字符和远超出键盘字符数的文字之间的矛盾而生的.
本篇文章只说浏览器对输入法事件的处理问题. 因为浏览器的事件机制对我来说一直是一个谜, 因此是时候彻底弄清楚它了!

### 历史原因

Safari 和 Chrome 的事件顺序是不一样的, 这是一个众所周知的事实, 因此先来分析下它们下面的几种情况, 以下测试针对 Safari 12.1.2 和 Chrome 76.0.3809.132 版本得出的结论.

### 输入一个英文字母 'a' 发生了什么

1. Chrome:
2. Safari:

### 输入一个中文 'a' 发生了什么

1. Chrome:
2. Safari:


### 输入一个中文 'a' 后, 按空格, 全程发生了什么

1. Chrome:
2. Safari:

事件顺序: input beforeinput keypress keydown keyup compositionend compositionstart compositionupdate input 的 inputType