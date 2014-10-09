---
layout: post
title: "clog - A conventional changelog generator for the rest of us"
date: "2014-09-18"
summary: At thoughtram we teach people how to master Git. We also teach them how to maintain a semantic history. Introducing clog.

categories: announcements tools
author: christoph_burgdorf
---

At thoughtram we teach people how to master Git. We also teach them how to maintain a semantic history. That's a history where each commit groups a logical code change. Like a feature or a bugfix. You can go even further and follow a commit message convention to wrap up valuable meta data in the commit message. Once you follow a commit message convention, you can easily generate a nice changelog without any manual work.

Let's take a look at such a commit message.

{% highlight sh %}
feat(ngInclude): add template url parameter to events

The `src` (i.e. the url of the template to load) is now provided to the
`$includeContentRequested`, `$includeContentLoaded` and `$includeContentError`
events.

Closes #8453
Closes #8454

{% endhighlight %}

If you look closely, you might notice a pattern behind this commit message. Let's annotate it to make things more clear.

{% highlight sh %}

                      component        commit title
        commit type       /                /      
                \        |                |
                 feat(ngInclude): add template url parameter to events
            
        body ->  The 'src` (i.e. the url of the template to load) is now provided to the
                 `$includeContentRequested`, `$includeContentLoaded` and `$includeContentError`
                 events.

 referenced  ->  Closes #8453
 issues          Closes #8454

{% endhighlight %}

Notice how this commit message preserves valuable meta data among the plain message. Namely the `commit type` that can either be `feat`, `fix`, `docs`, `style`, `refactor`, `test` or `chore` to indicate the *type* of the change. What follows is the name of the *component* that was changed, wrapped in parenthesis. It also contains a short title and an optional body that must have a preceding blank line.

References to related issues may follow after another blank line.

That's probably not the one and only commit message convention but it's one that is battle tested in many high profile projects. It was invented by the smart folks at Google to be used for their [AngularJS](https://angularjs.org/) project. We recommend to check out this [guideline](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/mobilebasic) to get the full picture of the convention. Also if you like to see how the generated changelog actually looks like, take a look [here](https://github.com/angular/angular.js/blob/master/CHANGELOG.md).

Until know there's only been a Node.js based implementation for the [generator](https://github.com/ajoslin/conventional-changelog). In addition there is a [Grunt task](https://github.com/btford/grunt-conventional-changelog) to easily integrate it with the popular Grunt task runner.

That's all nice and simple but there's a problem: We are leaving out a big opportunity to make more developer follow this convention. What's about all the Java, C#, C++, Haskell, Rust or Go developers out there? They certainly won't install Node.js or even Grunt to generate their changelog. Having Node.js as a dependency is quite a big technical debt for something as simple as changelog generation.

## Hello clog!

We want changelog generation to be usable for everyone with the most minimal footprint possible. We wanted something that is aligned with the UNIX philosophy of having a small command line tool just like `cp` or `ls`. So what should we do? Write a command line tool in C? Well, almost! We've written a command line tool called [`clog`](https://github.com/thoughtram/clog) in [Rust](http://www.rust-lang.org/). Rust is a new language by Mozilla that enables you to write low level code in a high level language. Clog is more or less a straight port of the Node.js based [generator](https://github.com/ajoslin/conventional-changelog) by [Andy Joslin](https://twitter.com/andrewtjoslin).

clogs usage is quite simple. It follows the POSIX standard. Just invoke it with `clog --help` and you'll get this output.

{% highlight sh %}
Usage:
  clog [--repository=<link> --setversion=<version> --subtitle=<subtitle> 
        --from=<from> --to=<to> --from-latest-tag]
{% endhighlight %}

You can invoke `clog` without any parameter to generate a nice changelog for the entire history of your project. Provide the `--repository` parameter to set the URL of the github repository to make the changelog include links to the commits on github. 

Usually you don't want to regenerate the entire changelog but instead prepend only the changelog for every commit that happend between now and the previous version. In order to do that you can just run clog with the `--from-latest-tag` parameter. If you know that you want to generate the changelog for a specific range of commits you can just provide the `--from` and `--to` parameters (e.g. `--from=c667e1e` `--to=c7a1f1c`).

In order to also include a nice header you can provide a version and a subtitle as well (e.g. `--setversion=0.11.0` `--subtitle=lame-duck`).

Putting it all together, here is how clog generated clogs latest changelog, it's clogception!

`clog --repository=https://github.com/thoughtram/clog --from-latest-tag --setversion=0.2.0`

clog is a work in progress and there are some things missing (like exposing a C interface). That said, it's ready to be used if you don't mind the [missing features](https://github.com/thoughtram/clog/issues).

## How to get clog?

If you happen to use Rust for your project you can simply get clog via Rust's package manager Cargo. Otherwise you can also just grab the binary and put it somewhere on your machine. Given the small file size you may also directly put clog into your project folder so that everyone on the team has it and changelog generation can be made part of the build process.

[clog for Mac (binary)](/assets/clog) [(source)](https://github.com/thoughtram/clog)

Binaries for Windows will follow shortly. Since none of us uses Windows, we first need figure out how to properly set up the build chain there.
