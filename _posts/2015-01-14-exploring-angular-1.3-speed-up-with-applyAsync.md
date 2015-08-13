---
layout:     post
title:      "Exploring Angular 1.3: Go fast with $applyAsync"
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
    title: "Exploring Angular 1.3: ES6 Style Promises"
    url: "http://blog.thoughtram.io/angularjs/2014/12/18/exploring-angular-1.3-es6-style-promises.html"
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
    title: "Exploring Angular 1.3: ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2015-01-14
update_date: 2015-08-13
summary:    "In order to make data binding magically possible, Angular comes with something called $digest cycle. This cycle is kicked whenever a user interaction happens that Angular is aware of, or other asynchronous operations like XHR calls and timeouts return from their execution. Angular 1.3 comes with a nice little feature to share a running $digest cycle across multiple XHR calls. This articles details how to do that and how to gain a nice performance boost."

isExploringAngular13Article: true

categories: 
- angularjs

tags:
  - angular

author: pascal_precht
---

As already mentioned in our articles on [one-time bindings](http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html) and [disabling debug info](http://blog.thoughtram.io/angularjs/2014/12/22/exploring-angular-1.3-disabling-debug-info.html), one of the biggest goals of the 1.3 release was to improve Angular's overall performance. 

This article details yet another nice feature that makes your Angular applications in particular cases potentially faster: It lets you resolve multiple `$http` responses, that are received around the same time, in one `$digest` cycle with a new API added to the `$rootScope` called `$applyAsync`.

Let's talk about what that actually means and why you want to do that.

## Why and when we need the `$digest` cycle

We know that two-way data binding is one big selling point of Angular. Changes to our model in the imperative world of JavaScript seem to sync magically with the model values in the declarative world of HTML and vice versa, without us setting up any event listener and other things that are required to achieve that functionality.

In fact, two-way binding is just one kind of binding that Angular supports. We also have one-way bindings and even one-time bindings (since version 1.3) as mentioned earlier. In order to make data binding possible, Angular comes with this sort of event loop (the `$digest`) to update our application model and DOM, whenever it is needed.

But how does Angular know, when it has to trigger another `$digest` cycle? We don't want to go in too much detail here, since there are ton of resources out there that cover this topic very well, but let's clarify at least the most important facts. Some people think initially, that Angular has a kind of poll mechanism that checks every few milliseconds if something on the model changed so it can update the view accordingly. **This is not true**.

There are basically three possible cases when the state of an application can change and these are the only moments where `$digest` cycles are needed. The case are:

- **User Interaction through events** - The user clicks UI controls like buttons and in turn triggers something in our application that changes state.
- **XMLHttpRequests** - Also known as AJAX. Something in our app requests some data from a server and update model data accordingly.
- **Timeouts** - Asynchronous operations cause through timers that can possibly change the state of our application

Whenever one of the above things happens, Angular knows it needs to trigger a `$digest`. You might still wonder how that works, since you don't have to inform Angular about these interactions explicitly. This is because Angular intercepts all of these interactions already for you. 

That's why we have all these predefined directives like `ng-click` or even directives that override existing tags like `<input>`. The `$http` service that Angular brings to the table also makes sure that a `$digest` is triggered once a request returns. 

In addtion, this explains why you need to call `$scope.$apply()`, which in turn triggers a `$digest` internally, when you have third-party code that changes your application's state from the outside world.

Okay, so now we have a general picture of what the `$digest` is about and when it's needed and triggered and also how we can trigger it explicitly with `$scope.$apply`. But we haven't talked about when `$applyAsync` comes into play.

## Batching multiple `$http` responses into one `$digest`

As the name already says, `$applyAsync` has something to do with executing a `$scope.$apply` through an asynchronous operation. But what does that mean and when makes it actually sense?

We mentioned that one of the cases where a `$digest` is triggered, is when an XHR call using `$http` service returns from it's execution. This is nice because we don't have to worry about updating our model in the DOM once the model is updated. Here's a small snippet that details that scenario (note that we don't use `$scope` here since we assume that [controllerAs](http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html) syntax is used:

{% highlight js %}
app.controller('Ctrl', function ($http) {
  
  // Make XHR and update model accordingly
  $http.get('fetch/some/json/').then(function (response) {
    this.myModel = response.data;
  }.bind(this));
});
{% endhighlight %}

We have a controller that asks for `$http` service and uses it to make an XHR to some url and once the call resolves, we update `myModel` on our controller with the new data that we got from the server. There's nothing we need to do to update `myModel` in our DOM, since this call, once it resolves, triggers a `$digest` that takes care of the rest.

Now imagine we build an application where it's required to make **three** XHRs at bootstrap time. That means, three independent requests that all resolve independently after different periods of time, which in turn causes three `$digest` cycles that get triggered once each of the calls return. This can slow down our application. Wouldn't it be nice if we could collect the promises that return from the XHR calls that are made around the same time and resolve them at the next `$digest` cycle that happens? Yes! And this is exactly where `$applyAsync` comes into play.

Since Angular 1.3, `$rootScope` comes with a new method [$applyAsync](https://code.angularjs.org/1.3.8/docs/api/ng/type/$rootScope.Scope#$applyAsync) that lets us basically collect expressions. These expressions get immediately evaluated but resolved with the next tick (`$digest`). In order to make this work nice with requests that happen through `$http` calls, `$httpProvider` comes with a corresponding API that tells Angular that we actually want to use that feature.

All we need to do is to call the provider's [useApplyAsync](https://code.angularjs.org/1.3.8/docs/api/ng/provider/$httpProvider#useApplyAsync) method and Angular takes care of deferring the resolution of your XHR calls to the next tick. Here's what it looks like:

{% highlight js %}
app.config(function ($httpProvider) {
  $httpProvider.useApplyAsync(true);
});
{% endhighlight %}

That's it! If the application now receives multiple `$http` responses at around the same time, this is what happens (a bit simplified though):

- The call's promise is pushed into a queue
- An asynchronous `$apply` is scheduled in case there's no one scheduled yet, by telling the browser to execute `setTimeout()`
- Once timed out, the queue is flushed and the actual `$apply` is triggered

The `setTimeout()` is called with a `0` delay which causes an actual delay of around 10 milliseconds depending on the browser. That means, if our three asynchronous calls return at around the same time (somewhere inside that particular timeout delay), they get resolve with a single `$digest` cycle instead of three which speeds up our application.
