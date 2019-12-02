---
layout: post
title:  "git 常用命令总结"
date:   2016-04-21 13:34:23 +0800
categories: [VCS]
---

经常使用git，但是一直没时间写，现在终于有时间了，所以总结一下常用命令。

新建一个分支并切换到这个分支：

```js
git checkout -b branch_name
```

切换分支:
```js
git checkout branch_name
```

删除一个分支(需要先`checkout`到另一个分支):

```js
git branch -d branch_name
```

注意，如果你在本地新建一个分支，而没有`git push`的话，执行下列命令删除一个分支会提示你

```js
error: The branch 'test' is not fully merged.
If you are sure you want to delete it, run 'git branch -D test'.
```

确定不要的话，按说明强制删除即可。

提交文件的流程是:

```js
git add ==> git commit ==> git push
```

`git add`常用的有三个参数:

1. `git add -A` 所有变动记录都增加到暂存区，不管是新增还是删除还是修改。
2. `git add .` 文件的增加记录，修改添加到暂存区，不包括删除的文件。
3. `git add -u` 文件的删除和修改记录添加到暂存区，不包括新增的文件。

人生没有后悔药，但是`git`有，如果不小心提交了错误的文件或者提交信息写错了，可以根据情况执行以下命令。

首先`git status` 查看版本状态，(我用`zsh`)红色文件表示未`git add`到暂存区，绿色文件表示已经`git add`到缓存区，等待`git commit`。

这个时候如果不想`git add`到缓存区的话，那就`git reset HEAD`全部将文件重新变为未`git add`的原始状态，如果只是不想`git add`某一个文件到缓存区的话, 需要指定文件名:

```js
git reset HEAD filename
```

有时候不但不想把修改过的文件`git add`到缓存区，而且想把这个文件所做的修改都忽略掉，也即回复到未修改的状态，那重新检出即可:

```js
git checkout -- filename
```

注意这里没有拼写错误,`checkout`和`filename`之间有左右存在一个空格的短横线。

`git add`之后就是`git commit`，可以跟一个参数`-m`来写下提交说明，这是个好习惯，而且是被强制的，如果没有`-m`参数，则会进入一个`vim`编辑状态，提示你加上信息:

```js
git commit -m '这是一个提交说明'
```

这个时候发现提交说明写错了，不想`commit`了（此时`HEAD`已经变了），两个方法：

一个是移除`commit`：（因为这个还没有`push`，只是`commit`到本地仓库）

首先`git log`，记下你误`commit`之前的一个`commit id`，是一个`hash(SHA)`，如：`73cf3bfc3419a85e959d7ecfcb917d9cdc24b3c9`或者直接是最近的一次`push`的`HEAD`也行：

```js
git reset 73cf3bfc3419a85e959d7ecfcb917d9cdc24b3c9
```

（这个时候不能像`git add`的时候使用`git reset HEAD`了因为`git commit`之后`HEAD`已经变了(即已经可以通过`git log`查看提交记录了)）

这里插一句`git reset`命令的三个参数:`--mixed`,`--soft`,`--hard`:

网上的教程一大堆，又是画图说明又是引用官方分支说明的，麻烦，我说的简单点。

> 简单的，举例子的方式简单点。 ---Xheldon

`git reset`默认是`mixed`参数，即执行`git reset xxxx`（xxx表示一个`SHA`或者未`commit`的时候是`HEAD`） 即是执行`git reset --mixed xxxx`, 他的作用是将文件恢复到你修改过文件之后没有执行任何`git`命令的状态(文件是红色状态)。

`--soft`参数是将文件仅仅是恢复到未commit的状态，其文件还是`git add`过的（还是绿的）。

`--hard`就比较强势了，它会将你的文件彻底恢复到你指定的提交记录的状态，不管你是`add`过还是`commit`过还是修改过文件，统统无视。注意，执行`git reset --hard xxx`具有一定的危险性，会将你当前的修改从本机删除。

`git reset --hard xxx`之后，文件已经从本机删除了，你所有的修改也已经被删除，但是想找回`hard`删除的文件修改记录怎么办呢？使用`git reflog`

你的每一步`commit`和`reset`操作，`git`都会生成一个记录，这个记录可以在通过`git reflog`找到，在每个记录之前有个短`hash`，复制这个短`hash`，重新执行一遍`git reset --hard short_hash`即可。

注意，执行`git commit`之后这个时候的`HEAD`已经变成你提交过的文件的更改状态，再执行`git reset --mixed HEAD`或者`git  reset --soft HEAD`无效（因为当前的`HEAD`就是你`commit`之后的那个点（即使你没有`push`）），如果想返回到`git add`之后，`git commit`之前的状态需要`git reset --soft commit_id`，如果返回到`git add`之前的状态，需要`git reset --mixed commit_id`， 或者直接`git reset commit_id`。 

`git commit`后悔药的另一牌子叫`--amend`，提交之后，后悔了，发现msg写错了，或者文件又修改了，不想再生成一条`commit`记录因为很丑而且显得你很菜，居然会犯这种提交信息写错的低级错误，那么运行：

```js
git commit --amend change_file_name_after_commit -m "新的msg"
```

即可。

后悔药吃过了，`git commit`之后确认无误就可以`git push`了。这个时候如果你当前分支所分出来的远程分支没有其他人提交更新的话，你就可以使用`fast forward` 模式，中文翻译成快进模式，直接合并进去。形象的查看合并情况可以使用：

```js
git log --graph --pretty=oneline
```

如果在你分出分支期间，还有其他人也提交了分支，如果没有冲突的话那也可以直接合并，需要你先`git pull`下来，再执行`git push`。
如果有冲突的话这个时候会提示你别人的修改和你的修改有什么冲突，这个就需要你手动解决，解决完之后就`git add`, `git commit`即可。

合并分支：

```js
git merge another_branch_name
```

这里的情况是`非fast forward`模式，即B从A分支上分出后，作为父分支的A分支又改变了，B分支这个时候也改了点东西，再想合并回A分支的时候，就出现了现在的情况以下情况：
注意，假设你在A分支上，需要`merge`的是B分支，则`merg`过来的B分支必须是`git push`过的，如果B分支只`git commit`的分只是不会被merge的。因为`git merge branch_name`的`branch_name`是从`branch_name`的远程`origin`来`merge`的，`commit`只修改了本地的`HEAD`，没有`push`就没有修改远程`origin`。
假设B分支已经`git push`了自己的改动到远程，而本地A也`git add`了自己的改动到本地仓库，则在A分支上执行`git merge B`的时候会出现(假设改动的是`config.js`):

```js
Updating 474cfbf..9c94d0c
error: Your local changes to the following files would be overwritten by merge:config.js
Please commit your changes or stash them before you merge.
Aborting
```

意思就是合并两个分支的时候出错中断。会让你先暂存你的当前分支的修改即`git stash`或者提交你的修改即`git commit`。 之后`git merge`之后，出现冲突再手动修改，重新提交。
OK，我们先`git commit`当前的修改，再次执行`git merge B`，这个时候出现（假设冲突文件是`config.js`）：

```js
Auto-merging config.js
CONFLICT (content): Merge conflict in config.js
Automatic merge failed; fix conflicts and then commit the result.
```

手动解决之后,再重新`git add`，`git commit`即可。

注意，如果你在一个分支上修改了文件，而在`checkout`到另一个分支的时候没有发生冲突，则不会有任何提示，文件改动依然存在，因此你可以将文件在一个分支上改动后，再提交到另一个分支上。而如果在一个分支上改动文件之后，再`checkout`其他分支出现冲突的话(比如其他分支`git pull`了，或者其他分支`git commit`了相同文件的相同修改):

```js
error: Your local changes to the following files would be overwritten by checkout:
	config.js
Please commit your changes or stash them before you switch branches.
Aborting
```

这个时候就需要你先`git stash`储藏（此`stash储藏`不是`git add暂存`，`stash`是先将文件放到一个特定的区域，等到切换完分支之后，再像一个补丁一样，应用这个`stash`到切换到的`checkout`分支，或者不应用`stash`，等切换的分上的事情做完之后，再切换回来的时候，再次应用这个`stash`，当然如果你一直不想应用你的`stash`也可以一直不应用，没有关系）.
这里说到了`git stash`，这个命令的使用场景是同时需要做两个分支的修改的时候，其中一个分支做到了一半，这个时候另一个分支也需要修改，你不可能把已经做一半的内容丢弃，又不能`commit`，因为这有可能在`checkout`过去的会造成`conflict`，因此你需要储藏`stash`：
先查看当前状态，`git status`：

```js
On branch optimize
Your branch is up-to-date with 'origin/optimize'.
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   config.js

no changes added to commit (use "git add" and/or "git commit -a")
```

储存一下,`git stash`:

```js
Saved working directory and index state WIP on optimize: 24bf0e1 test add
HEAD is now at 24bf0e1 这是一个提交
```

之后再`git status`看下:

```js
On branch optimize
Your branch is up-to-date with 'origin/optimize'.
nothing to commit, working tree clean 
```

这个时候可以放心的切换到其他分支，这里要说明的是，切换到其他分支的时候你也可以使用储藏的分支到当前分支（只要你不怕冲突），查看储藏列表,`git stash list`:

```js
stash@{0}: WIP on optimize: 24bf0e1 test add
```

这是刚刚`stash`起来的改动，可以使用`git stash apply`应用这个最近的改动，如果`stash`的改动有好几个，那就指定`stash`的名字:

```js
git stash apply stash@{0}
```

应用之后就会从储存区删除这个`stash`，如果不希望的删除的话就：

```js
git stash apply stash_name --index
```

之后再希望删除的话就：

```js
git stash drop stash_name
```

以上两个命令不带`stash_name`的话默认删除最近的一个`stash`。

暂时能想到的就这么多吧，如果不熟悉，还是用`Sourcetree`吧。

## 更新

`git revert/reset/rebase` 只看说明是搞不懂的, 需要你自己输入命令测试一下. 

我就喜欢为了干净整洁的提交历史而视同 `git rebase`, 但是这个命令很危险, 有一些使用场景需要注意. 而比 `git rebase` 更危险的是 `git reset`, 它会把当前项目重置到某一次提交. 而 `git revert` 就相对安全一些, 但是你想 `revert` 之前的某个提交最好需要保证你的缓存区是空的, 否则会遇到错误提示. 

当然, `git` 命令千千万(夸张), 有一些命令是针对一些特殊场景的, 在没遇到之前可能无法理解其中的一些用法, 这个很正常.

比如 `git reset commitId` 即是把 `HEAD` 移动到 `commitId` 所在的地方, 你可能一头雾水, 移动 `HEAD` 有什么用? 这个命令的目的是什么? 再比如 `git revert commitId` 是把 `commitId` 的提交给移除, 而不移动 `HEAD` 的指针. 

看代码(`d0b9def` 对应 `commit -m 'reset/revert test 3'` 这个提交, 当前 `HEAD` 在 `'reset/revert test 4'`上): 

`git revert d0b9def` 之后, 你的代码可能是这个样子的:

```js
reset/revert test 1
reset/revert test 2
<<<<<<< HEAD
reset/revert test 3
reset/revert test 4
=======
>>>>>>> parent of d0b9def... reset/revert test
```

在相同的 `HEAD` 上执行 `git reset d0b9def` 之后, 你的工作区可能是这个样子的:

```js
 reset/revert test 1
 reset/revert test 2
 reset/revert test 3
+reset/revert test 4
```

看出移动不移动 `HEAD` 的区别了吧? `revert` 一定会让你手动解决冲突, 因为其保留的是从你 `commitId` 之前的一个父 `commit` 到当前 `HEAD` 的除了 `d0b9def` 的所有变动. 而 `reset` 不会让你解决冲突, 而是默默的移动 `HEAD` 把自 `d0b9def` 以来所有的变动都显示为文件改动, 需要你手动 `git add/commit` 一下, 当然少不了 `push --force`.

因此, `revert` 被设计为撤销`公开`的提交的安全方式，`reset` 被设计为重设`本地`更改。因为两个命令的目的不同，它们的实现也不一样：重设完全地移除了一堆更改，而撤销保留了原来的更改，用一个新的提交来实现撤销。























