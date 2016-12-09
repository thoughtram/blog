---
layout: post
title: Going back in time to split older commits
date: '2014-08-18'
summary: >-
  Rebasing in Git allows you to go back in time to split older commits. In this
  article we'll explore how to do exactly that!
redirect_from:
  - /posts/going-back-in-time-to-split-older-commits/
categories: git
tags:
  - git
author: christoph_burgdorf
related_posts:
  - Understanding branches in Git
  - The anatomy of a Git commit
  - Git Ninja Class in Amsterdam
  - Git Ninja Class comes to Istanbul
  - Tickets are on sale now!
  - Announcing our first workshop
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

Imagine you are working on that radical new feature. It's going to be brilliant
but it takes a while. You've been working on that for a couple of days now, maybe weeks.

Your feature branch is already six commits ahead of master. You've been a good developer and crafted
meaningful semantical commits. But there's the thing: you are slowly realizing that this beast will
still take some more time before it's really ready to be merged back into master. 

{% highlight ruby %}
    m1-m2-m3-m4 (master)
         \ 
          f1-f2-f3-f4-f5-f6(feature)
{% endhighlight %}

What you also realize is that some parts are actually less coupled to the new feature. They could land in master earlier. Unfortunately the part that you want to port back into master earlier is in a commit somewhere in the middle of your six commits. Even worse, it also contains a change that relies on a previous commits of your feature branch. One could argue that you should have made that two commits in the first place, but then nobody is perfect.

{% highlight ruby %}
    m1-m2-m3-m4 (master)
         \ 
          f1-f2-f3-f4-f5-f6(feature)
                 ^
                 |
            mixed commit
{% endhighlight %}

At the time that you crafted the commit, you didn't foresee that you might come into a situation where you want to gradually bring the feature into master. Heck! You wouldn't have guessed that this whole thing could take us so long.

What you need is a way to go back in history, open up the commit and split it into two commits so that you can seperate out all the things that are safe to be ported back into master by now.

Speaking in terms of a graph, we want to have it like this.

{% highlight ruby %}
    m1-m2-m3-m4 (master)
         \ 
          f1-f2-f3a-f3b-f4-f5-f6(feature)
{% endhighlight %}

With the work splitted into two commits, we could just `cherry-pick` the precious bits into master.

Turns out, git comes with a powerful command `git rebase -i` which lets us do exactly that. It lets us change the history. Changing the history can be problematic and as a rule of thumb should be avoided as soon as the history is shared with others. In our case though, we are just changing history of our local feature branch. Nobody will get hurt. Promised!

Ok, let's take a closer look at what exactly happened in commit `f3`. Turns out we modified two files: `userService.js` and `wishlistService.js`. Let's say that the changes to `userService.js` could go straight back into master wheras the changes to `wishlistService.js` could not. Because `wishlistService.js` does not even exist in master. It was introduced in commit `f1`.

*Pro Tip: even if the changes would have been in* **one** *file, git could handle that. We keep things simple for this blog post though.*

We've set up a [public demo repository](https://github.com/thoughtram/interactive-rebase-demo) that we will use for this exercise. To make it easier to follow, each commit message is prefixed with the pseudo SHAs used in the graphs above. What follows is the branch graph as printed by git before we start to split the commit `f3`.

![git log before the split](/css/images/lg_before_split.png)

Now the first thing we want to do is to checkout our feature branch with `git checkout feature`. To get started with the rebase we run `git rebase -i master`.

Now what follows is that git opens a temporary file in the configured editor (defaults to Vim).

![git rebase first screen](/css/images/rebase_first_screen.png)

This file is meant to provide you some options for the rebase and it comes with a little cheat sheet (the blue text). For each commit we could choose between the actions `pick`, `reword`, `edit`, `squash`, `fixup` and `exec`. Each action can also be referred to by its short form `p`, `r`, `e`, `s`, `f` and `e`. It's out of the scope of this article to describe each and every option so let's focus on our specific task.

We want to choose the `edit` option for our `f3` commit hence we change the contents to look like that.

![git rebase first screen 2](/css/images/rebase_first_screen2.png)

Now we save the file (in Vim `<ESC>` followed by `:wq`, followed by `<RETURN>`). The next thing we notice is that git stops the rebase at the commit for which we choose the `edit` option.

![git rebase second screen](/css/images/rebase_second_screen.png)

What this means is that git started to apply `f1`, `f2` and `f3` as if it was a regular rebase but then stopped **after** applying `f3`. In fact, we can prove that if we just look at the log at the point where we stopped.

![git rebase stopped](/css/images/rebase_stopped_lg.png)

To split our commit `f3` into two commits, all we have to do at this point is to reset gits pointer to the previous commit (`f2`) while keeping the working directory the same as it is right now. This is exactly what the `mixed` mode of `git reset` does. Since `mixed` is the default mode of `git reset` we can just write `git reset head~1`. Let's do that and also run `git status` right after it to see what happend.

![git reset status](/css/images/rebase_reset_status.png)

The `git status` tells us that both our `userService.js` and our `wishlistService.js` are modified. If we run `git diff` we can see that those are exactly the changes of our `f3` commit.

![git rebase diff](/css/images/rebase_git_diff.png)

If we look at the log again at this point we see that the `f3` is gone though.

![git reset lg](/css/images/rebase_reset_lg.png)

We are now at the point that we have the changes of our previous `f3` commit ready to be commited wheras the original `f3` commit itself is gone. Keep in mind though that we are still in the middle of a rebase. Our `f4`, `f5` and `f6` commits are not lost, they'll be back in a moment.

Let's make two new commits: Let's start with the commit for the changes made to the `userService.js` which are fine to get picked into master. Run `git add userService.js` followed by `git commit -m "f3a: add updateUser method"`.

Great! Let's create another commit for the changes made to `wishlistService.js`. Run `git add wishlistService.js` followed by `git commit -m "f3b: add addItems method"`.

Let's take a look at the log again.

![git log after the split](/css/images/rebase_after_split_lg.png)

This is exactly what we wanted except our commits `f4`, `f5` and `f6` are still missing. This is because we are still in the middle of the interactive rebase and we need to tell git to continue with the rebase. This is done with the command `git rebase --continue`.

Let's check out the log again.

![git rebase success](/css/images/rebase_success.png)

And that's it. We now have the history we wanted. The previous `f3` commit is now splitted into two commits `f3a` and `f3b`. The only thing left to do is to `cherry-pick` the `f3a` commit over to the `master` branch.

To finish the last step we first switch to the `master` branch. We do this with `git checkout master`. Now we can pick the `f3a` commit with the `cherry-pick` command. We can refer to the commit by its SHA key which is `bd47ee1` in this case.

![git cherry-üick](/css/images/rebase_cherry-pick.png)

We now have the `f3a` commit sitting on top of latest master. Exactly what we wanted!  
![git final history](/css/images/rebase_final_history.png)

Given the length of the post this may seem like a lot of effort but it's really only a matter of seconds for an advanced git user.

The described technique is also part of our [Git Ninja Class](http://thoughtram.io/#git-ninja-class-hanover) workshop. If you like to sharpen your git skills you might be interested to join one of our upcoming workshops in [Hannover](http://thoughtram.io/#git-ninja-class-hanover) or [Istanbul](http://webbox.io/workshops/git-ninja/) in September.
