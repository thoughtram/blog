---
layout: post
title: Understanding Zones
date: 2016-01-22T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  Since version 2.x Angular takes advantage of a feature called Zones. Learn
  here what they are and how they work.
categories:
  - angular
tags:
  - angular2
topic: changedetection
author: pascal_precht
related_posts:
  - Testing Services with Http in Angular
  - Two-way Data Binding in Angular
  - Resolving route data in Angular
  - Angular Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

At NG-Conf 2014, [Brian](http://twitter.com/briantford) gave an excellent [talk on zones](https://www.youtube.com/watch?v=3IqtmUscE_U) and how they can change the way we deal with asynchronous code. If you haven't watched this talk yet, give it a shot, it's just ~15 minutes long. APIs might be different nowadays, but the semantics and underlying concepts are the same. In this article we'd like to dive a bit deeper into how zones work.

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## The problem to be solved

Let's recap really quick what zones are. As Brian stated in his talk, they are basically **an execution context** for asynchronous operations. They turn out to be really useful for things like error handling and profiling. But what exactly does that mean?

In order to understand the execution context part of it, we need to get a better picture of what the problem is that zones are trying to solve. Let's first take a look at the following JavaScript code.

{% highlight javascript %}
foo();
bar();
baz();

function foo() {...}
function bar() {...}
function baz() {...}
{% endhighlight %}

Nothing special going on here. We have three functions `foo`, `bar` and `baz` that are executed in sequence. Let's say we want to measure the execution time of this code. We could easily extend the snippet with some profiling bits like this:

{% highlight javascript %}
var start,
    time = 0;
    timer = performance ? performance.now : Date.now;

// start timer
start = timer();
foo();
bar();
baz();
// stop timer
time = timer() - start;
// log time in ms
console.log(Math.floor(time*100) / 100 + 'ms');
{% endhighlight %}

However, often we have asynchronous work todo. This can be an AJAX request to fetch some data from a remote server, or a maybe we just want to schedule some work for the next frame. Whatever this asynchronous work is, it happens, as the name claims, asynchronously. Which basically means, those operations won't be considered by our profiler. Take a look at this snippet:

{% highlight javascript %}
function doSomething() {
  console.log('Async task');
}

// start timer
start = timer();
foo();
setTimeout(doSomething, 2000);
bar();
baz();
// stop timer
time = timer() - start;
{% endhighlight %}

We extended the code sequence with another operation, but this time it's asynchronous. What effect does that have on our profiling? Well, we'll see that there's not such a big difference.

There is in fact one more operation, so it takes slightly longer to execute this code, however, the actual execution time of when the `setTimeout()` call returns is not part of the overall profiling. This is because asynchronous operations are added to the browser's **event queue**, which eventually gets cleaned up by the **event loop** once there's time for that.

If this is entirely new to you, you might want to watch this [great talk](https://www.youtube.com/watch?v=8aGhZQkoFbQ) on how the browser event loops works.

So how do we solve this issue? What we need are basically hooks that allow us to execute some profiling code whenever such an asynchronous task happens. Sure, we could probably create and start an individual timer for each asynchronous operation manually, but that would get quite messy as asynchronous operations are added to the code sequence.

**This is exactly where zones come into play**. Zones can perform an operation - such as starting or stopping a timer, or saving a stack trace - each time that code enters or exits a zone. They can override methods within our code, or even associate data with individual zones.

## Creating, forking and extending Zones

Zones are actually a language feature in Dart. However, since Dart also just compiles to JavaScript, we can implement the same functionality in JavaScript too. Brian (the guy I've mentioned earlier) has done exactly that. He created [zone.js](https://github.com/angular/zone.js) as a port of Zones to JavaScript, which is also a dependency of Angular. Before we take a look at how we can profile our code samples with Zones, let's first discuss how zones are created.

Once we've embedded zone.js into our website, we have access to the global `zone` object. `zone` comes with a method `run()` that takes a function which should be executed in that zone. In other words, if we'd like to run our code in a zone, we can already do it likes this:

{% highlight javascript %}
function main() {
  foo();
  setTimeout(doSomething, 2000);
  bar();
  baz();
}

zone.run(main);
{% endhighlight %}

Okay cool. But what's the point of this? Well... currently there's in fact no difference in the outcome, except that we had to write slightly more code. However, at this point, our code runs in a zone (another execution context) and as we learned earlier, Zones can perform an operation each time our code enters or exits a zone.

In order to set up these hooks, we need to **fork** the current zone. Forking a zone returns a new zone, which basically inherits from the "parent" zone. However, forking a zone also allows us to extend the returning zone's behaviour. We can fork a zone by calling `.fork()` on the `zone` object. Here's what that could look like:

{% highlight javascript %}
var myZone = zone.fork();

myZone.run(main);
{% endhighlight %}

This really just gives us a new zone with the same power of the original zone (which we haven't discussed just yet). Let's try out these hooks we've mentioned and extend our new zone. Hooks are defined using a `ZoneSpecification` that we can pass to `fork()`. We can take advantage of the following hooks:

- **onZoneCreated** - Runs when zone is forked
- **beforeTask** - Runs before a function called with `zone.run` is executed
- **afterTask** - Runs after a function in the zone runs
- **onError** - Runs when a function passed to `zone.run` will throw

Here's our code sample with an extended zone that logs before and after each task is executed:

{% highlight javascript %}
var myZoneSpec = {
  beforeTask: function () {
    console.log('Before task');
  },
  afterTask: function () {
    console.log('After task');
  }
};

var myZone = zone.fork(myZoneSpec);
myZone.run(main);

// Logs:
// Before task
// After task
// Before task
// Async task
// After task
{% endhighlight %}

Oh wait! What's that? Both hooks are executed twice? Why is that? Sure, we've learned that `zone.run` is obviously considered a "task" which is why the first two messages are logged. But it seems like the `setTimeout()` call is treated as a task too. How is that possible?

## Monkey-patched Hooks

It turns out that there are a few other hooks. In fact, those aren't just hooks, but monkey-patched methods on the global scope. As soon as we embed `zone.js` in our site, pretty much all methods that cause asynchronous operations are monkey-patched to run in a new zone.

For example, when we call `setTimeout()` we actually call `Zone.setTimeout()`, which in turn creates a new zone using `zone.fork()` in which the given handler is executed. And that's why our hooks are executed as well, because the forked zone in which the handler will be executed, simply inherits from the parent zone.

There are some other methods that `zone.js` overrides by default and provides us as hooks:

- `Zone.setInterval()`
- `Zone.alert()`
- `Zone.prompt()`
- `Zone.requestAnimationFrame()`
- `Zone.addEventListener()`
- `Zone.removeEventListener()`

We might wonder why methods like `alert()` and `prompt()` are patched as well. As mentioned earlier, those patched methods are hooks at the same time. We can change and extend them by forking a zone exactly the same way we did with `beforeTask` and `afterTask`. This turns out to be super powerful, because we can intercept calls to `alert()` and `prompt()` and change their behaviour when we write tests.

`zone.js` comes with a tiny DSL that allows you to augment zone hooks. The project's [readme](https://github.com/angular/zone.js#augmenting-a-zones-hook) is probably the best place to take a look at, if you're interested in this particular thing.

## Creating a Profiling Zone

Our original problem was that we couldn't capture the execution time of asynchronous tasks inside our code. Now with Zones and the provided APIs we've learned about, we have actually everything we need to create a zone that profiles the CPU time of our asynchronous tasks. Luckily, such an implementation of a profiling zone is already available as an example in the `zone.js` repository and you can find it [here](https://github.com/angular/zone.js/tree/master/example/profiling.html).

Here's what it looks like:

{% highlight javascript %}
var profilingZone = (function () {
  var time = 0,
      timer = performance ?
                  performance.now.bind(performance) :
                  Date.now.bind(Date);
  return {
    beforeTask: function () {
      this.start = timer();
    },
    afterTask: function () {
      time += timer() - this.start;
    },
    time: function () {
      return Math.floor(time*100) / 100 + 'ms';
    },
    reset: function () {
      time = 0;
    }
  };
}());
{% endhighlight %}

Pretty much the same code as the one we started off with at the beginning of this article, just wrapped in a zone specification. The example also adds a `.time()` and `.reset()` method to the zone, which can be invoked on the zone object like this:

{% highlight javascript %}
zone
  .fork(profilingZone)
  .fork({
    '+afterTask': function () {
      console.log('Took: ' + zone.time());
    }
  })
  .run(main);
{% endhighlight %}

The `+` syntax is a shorthand DSL that allows us to extend the parent zone's hook. Neat ha?

There's also a [LongStackTraceZone](https://github.com/angular/zone.js/tree/master/lib/zones/long-stack-trace.ts) we can take advantage of and even more [examples](https://github.com/angular/zone.js/tree/master/example/profiling.html). Make sure to check those out too!

Watch out for more articles as we're going to discuss very soon what role Zones play in the Angular framework. Find more useful and related links below.
