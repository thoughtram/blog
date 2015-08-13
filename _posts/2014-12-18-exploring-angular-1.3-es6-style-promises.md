---
layout:     post
title:      "Exploring Angular 1.3: ES6 Style Promises"
relatedLinks:
  -
    title: "Exploring Angular 1.3: One-time bindings"
    url: "http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html"
  -
    title: "Exploring Angular 1.3: ng-model-options"
    url: "http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html"
  -
    title: "Exploring Angular 1.3: Angular-hint"
    url: "http://blog.thoughtram.io/angularjs/2014/11/06/exploring-angular-1.3-angular-hint.html"
  -
    title: "Exploring Angular 1.3: Stateful Filters"
    url: "http://blog.thoughtram.io/angularjs/2014/11/19/exploring-angular-1.3-stateful-filters.html"
  -
    title: "Exploring Angular 1.3: Disabling Debug Info"
    url: "http://blog.thoughtram.io/angularjs/2014/12/22/exploring-angular-1.3-disabling-debug-info.html"
  -
    title: "Exploring Angular 1.3: Binding to Directive Controllers"
    url: "http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html"
  -
    title: "Exploring Angular 1.3: Validators Pipeline"
    url: "http://blog.thoughtram.io/angularjs/2015/01/11/exploring-angular-1.3-validators-pipeline.html"
  -
    title: "Exploring Angular 1.3: Go fast with $applyAsync"
    url: "http://blog.thoughtram.io/angularjs/2015/01/14/exploring-angular-1.3-speed-up-with-applyAsync.html"
  -
    title: "Exploring Angular 1.3: ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2014-12-18
update_date: 2015-08-13
summary:    With the release of version 1.3, Angular starts streamlining  its promise APIs with the ECMAScript 6 standard to use $q as a promise constructor. This article details what these additions mean to us.

isExploringAngular13Article: true

categories: 
  - angularjs

tags:
  - angular

author: pascal_precht
---

We mainly took a look at completely new features that come with the Angular 1.3 release until now. Things like [ngModelOptions](http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html), [Angular-hint](http://blog.thoughtram.io/angularjs/2014/11/06/exploring-angular-1.3-angular-hint.html) or [One-time Bindings](http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html) are not just minor improvements, but rather real extensions to the framework. However, there have not only been significant new features added to the release, but also a ton of bug fixes and nice little additions that we might have overlooked. One of them is the ES6 streamlined promise API and today we gonna take a look what it brings to the table.

## Asynchronous worlds with Promises

In order to understand what the new streamlined addition to the existing promise API means, we first have to make sure we're all on the same page and know what promises are and how they've been implemented in Angular before. We don't want to go in too much detail here though, since there are a ton of resources in the interwebs, but let's take a very quick look at promises and move on then.

In just one sentence, a promise is an object that is used for deferred and asynchronous computations. So what does that mean? Well, in JavaScript we can have asynchronous code execution with, for example, callbacks. And with these things we're able to execute some code once another execution that ran before is done without blocking the actual code execution context. We call this *asynchronous*.

Here's an example:

{% highlight js %}

onceDone(function () {
  // do something once `onceDone()` calls you
});

{% endhighlight %}

Here we have a function `onceDone()` that expects a function that is executed, once the `onceDone()` function is done with its work and it doesn't block the rest of the code that might be there.

Okay, that's clear. But where and how come promises into play? There's a scenario that JavaScript developers love to call "*callback hell*". Callback hell is something that we have, when we nest a lot of functions in JavaScript that are asynchronous and have callbacks to be executed. Just take a look at the following code snippet.


{% highlight js %}

onceDone(function (files) {
  files.forEach(function (filename, fileIndex) {
    filename.size(function (err, values) {
      values.width.forEach(function (value) {
        // ... and so on
      });
    });
  });
});

{% endhighlight %}

You get the idea right? While it is very common to have function calls that get a function callback, it can lead to very hard to get right code when we have to nest a lot of these. I recommend to head over to [callbackhell.com](http://callbackhell.com) to get a better picture, if things are still unclear.

We can get around this issue by defining named functions first, and pass just these as callbacks instead of using anonymous functions all the time, but it's still not a very handy way to handle asynchronous JavaScript. And this is where promises come in.

Promises are a software abstraction or proxies, that make working with asynchronous operations much more pleasant. Coming back to our `onceDone()` function example, here's what the code would look like if `onceDone()` used promises.

{% highlight js %}

var promise = onceDone();

promise.then(function () {
  // do something once `onceDone` calls you
});

{% endhighlight %}

Looks very similar right? But there's a huge difference. As you can see, `onceDone()` returns something that is a promise which we can treat as first-class objects. This promise holds the actual state of the asynchronous code that has been called, which can be `fulfilled`, `rejected` or `pending`. We can pass promises around and even aggregating them. That's a whole different way of handling our asynchronous code.

What we also see, is that the promise has a method `.then()`. This method expects two parameters which are functions of which one gets called when the asynchronous execution was fulfilled and the other one when it was rejected.

{% highlight js %}

var promise = functionThatReturnsAPromise();

promise.then(fulfilledHandler, rejectedHandler);

{% endhighlight %}

As I mentioned, we can aggregate them. `.then()` also returns a promise that resolves with the return value of the executed handler (`fulfilled` or `rejected`). That enables us to chain promises like this:


{% highlight js %}

var promise = functionThatReturnsAPromise();

promise
  .then(fulfilledHandler, rejectedHandler)
  .then(doSomethingElse)
  .then(doEvenMore)
  .then(doThis);

{% endhighlight %}

Compare this with our callback hell code snippet and you know why promises are so powerful. In fact, there's **a lot** more about promises to tell, but that's out of the scope of this article. If you want to read more about promises in general, I recommend reading [Domenic's article](https://blog.domenic.me/youre-missing-the-point-of-promises/) and the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) on promises. But let's get back to promises in Angular.

## Promises in Angular and `$q`

Angular comes with a promise implementation by default. It has a [$q](https://docs.angularjs.org/api/ng/service/$q) service that we can of course inject and use though-out our application. Angular's implementation is highly inspired by [Kris Kowal's Q library](https://github.com/kriskowal/q) which is an implementation of the [Promises/A spec](https://promisesaplus.com/).

It comes with a `Deferred API` which lets you get instances of deferred objects that hold a promise object. We can use the API of a deferred to either resolve or reject a promise depending on what our code should do. Here's a quick example:

{% highlight js %}

// `$q` is injected before

var deferred = $q.defer();

anAsyncFunction(function (success) {
  deferred.resolve(success);
}, function (error) {
  deferred.reject(error);
});

var promise = deferred.promise;

// and later

promise.then(function () {
  // do something when `anAsyncFunction` fulfilled
});

{% endhighlight %}

We have a function `anAsyncFunction()` which is asynchronous and we use the deferred API to get a promise out of it. One thing to notice here is that our function doesn't know anything about promises but we use the deferred API to get a promise back. The deferred API comes with a few more features that I don't want to detail here, but you can read about them in the [official docs](https://docs.angularjs.org/api/ng/service/$q#the-deferred-api).

Have you ever used Angular's `$http` service? Sure you did. And as we know, XMLHttpRequests are asynchronous too. Guess what `$http` service uses to expose its `.success()` and `.error()` APIs? Right. Promises. When making XHR calls with `$http` we're also using `$q` implicitly. It just adds some sugar APIs to the promise it returns:


{% highlight js %}

$http.get('some/restful/endpoint')
  .success(function (data) {
    // do something with `data`
  })
  .error(function (reason) {
    // oups, something went wrong
  });

{% endhighlight %}

In fact, we can use the promise native APIs to achieve the same:

{% highlight js %}

$http.get('some/restful/endpoint')
  .then(function (data) {
    // do something with `data`
  }, function (reason) {
    // oups, something went wrong
  });

{% endhighlight %}

Okay, so we now got a picture of promises in Angular. There's also a nice talk by the awesome [Dave](https://www.youtube.com/watch?v=33kl0iQByME) on promises at [ngEurope](http://ngeurope.org), I recommend checking that one out too. But what is it with the ES6 style promises that we've mentioned in the blog title?

## ES6 style Promises in Angular 1.3

Although it's nice to have the deferred API in Angular to deal with promises, it turns out that the ECMAScript standard defines a slight different API. Taking a look at the [MDN docs on Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise), we see that `Promise` is a constructor in ES6 that takes an `executor` function that has access to a `resolve` and a `reject` function to resolve and reject promises respectively.

Angular 1.3 streamlined its promise APIs **partly** with the ES6 standard. I say partly here, because not all methods are supported yet. However, what the team *has* streamlined is that `$q` can also be used as a constructor now.

So instead of doing creating a deferred like this:

{% highlight js %}

function myFunctionThatReturnsAPromise() {
  var deferred = $q.defer();

  anAsyncFunction(function (success) {
    deferred.resolve(success);
  }, function (error) {
    deferred.reject(error);
  });

  return deferred.promise;
}

myFunctionThatReturnsAPromise().then(yay, nay);

{% endhighlight %}

We can now use the promise constructor API and return it directly without creating a deferred object first:

{% highlight js %}

function myFunctionThatReturnsAPromise() {
  return $q(function (resolve, reject) {
    anAsyncFunction(function (success) {
      resolve(success);
    }, function (error) {
      reject(error);
    });
  });
}

{% endhighlight %}

Even if this is just an optical difference at a first glance, it's nice to know that we can safe the lines of code to create a deferred first. Also, the fact that the `$q` API is now closer to the actual spec makes the code more reusable in the future.

Now we might wonder, if we have to change all of our code where we've used `$q.defer()` to work with promises. The answer is no. As mentioned at the beginning of the article, this is a nice small addition (rather than a new feature or replacement) in the 1.3 release that doesn't break the code.
