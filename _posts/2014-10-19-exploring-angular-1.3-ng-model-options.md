---
layout:     post
title:      "Exploring Angular 1.3: ng-model-options"
relatedLinks:
  -
    title: "Exploring Angular 1.3: One-time bindings"
    url: "http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html"
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
    title: "Exploring Angular 1.3: Go fast with $applyAsync"
    url: "http://blog.thoughtram.io/angularjs/2015/01/14/exploring-angular-1.3-speed-up-with-applyAsync.html"
  -
    title: "Exploring Angular 1.3: ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2014-10-19
update_date: 2015-08-13
summary:    In this article we explore the brand new ngModelOptions directive that allows us to control how ngModel updates are done in our Angular applications.

isExploringAngular13Article: true

categories: 
  - angularjs

tags:
  - angular

author: pascal_precht
---

Hi again. This is the second article of "Exploring Angular 1.3". If you haven't read the [first one](/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html) you might want to check out that too. In this article, we cover another feature that turns out to be very useful in our daily development of Angular applications. Introducing the `ngModelOptions` directive.
We've written a few other articles on 1.3 already. Here's a list:

- [Exploring Angular 1.3 - One-time bindings](http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html)
- [Exploring Angular 1.3 - Angular-hint](http://blog.thoughtram.io/angularjs/2014/11/06/exploring-angular-1.3-angular-hint.html)



`ngModelOptions` allows us to control how `ngModel` updates are done. This includes things like updating the model only after certain events are triggered or a debouncing delay, so that the view value is reflected back to the model only after a timer expires. To get an idea of what that actually means, let's start with the probably simplest use case that sets up a two-way binding using an `input` element that has a `ngModel` directive applied:

{% highlight html %}
{% raw %}
<input type="text" ng-model="name">
<p>Hello {{name}}!</p>
{% endraw %}
{% endhighlight %}

Now, when typing something into the `input` element, the model gets updated accordingly and then reflected back to the view, which displays the value in our `p` element. Try it out yourself real quick.

<iframe src="http://embed.plnkr.co/dB0p5wysKLvjK7oKAA3b/preview"></iframe>

[Magic](http://weknowgifs.com/wp-content/uploads/2013/03/its-magic-shia-labeouf-gif.gif). If you're not familiar with what's going on here, I recommend heading over to the official docs and reading the chapter about the [concepts of Angular](https://docs.angularjs.org/guide/concepts).

The reason why the view is updated immediately, is that every time the `input` element fires an `input` event, Angulars `$digest` loop is executed until the model stabilizes. And that's nice because we don't have set up any event listeners and update the DOM manually to reflect model values in the view; Angular takes care of that.

However, that also means that, because of the `$digest` that happens to be triggered on every single keystroke,  Angular has to process all registered watchers on the scope whenever you type something into the `input` element. Depending on how many watchers are registered and of course how efficient the watcher callbacks are, this can be very expensive. So wouldn't it be great if we could somehow manage to trigger a `$digest` only after the user stopped typing for, let's say, 300 milliseconds? Or only when the user removes the focus of the `input` element?

Yes, and we can do so thanks to Angular 1.3 and the `ngModelOptions` directive.

## Updating `ngModel` with `updateOn`

`ngModelOptions` comes with a couple of options to control how `ngModel` updates are done. With the `updateOn` parameter, we can define which events our `input` should be bound to. For example, if we want our model to be updated only after the user removed the focus of our `input` element, we can simply do so by applying the `ngModelOptions` with the following configuration:

{% highlight html %}
{% raw %}
<input 
  type="text" 
  ng-model="name" 
  ng-model-options="{ updateOn: 'blur' }">
<p>Hello {{name}}!</p>
{% endraw %}
{% endhighlight %}

This tells Angular that instead of updating the model immediately after each keystroke, it should only update when the `input` fires an `onBlur` event. Here's an example to show what it looks like in action.

<iframe src="http://embed.plnkr.co/F5IGCe/preview"></iframe>

If we do want to update the model with the default events that belong to that control and add other events on top of that, we can use a special event called `default`. Adding more then just one event can be done with a space delimited list. The following code updates the model whenever a user types into the input, or removes the focus of it.

{% highlight html %}
{% raw %}
<input 
  type="text" 
  ng-model="name" 
  ng-model-options="{ updateOn: 'default blur' }">
<p>Hello {{name}}!</p>
{% endraw %}
{% endhighlight %}

Alright, now that we know how that works, let's take a look at how we can update the model after a timer expires.

## Delaying the model update with `debounce`

We can delay the model update with `ngModelOptions` in order to reduce the amount of `$digest` cycles that are going to be triggered when a user interacts with our model. But not only that this ensures fewer `$digest` cycles, it's also a powerful feature that can be used to implement a nice user experience when dealing with asynchronous code execution.

Just imagine an `input[type="search"]` element, where every time a user types into the field, the model gets updated and an asynchronous request is made to a server to get a response with search results depending on the given query. This works. However, we probably don't want to update the model on every keystroke but rather once the user has finished typing a meaningful search term. We can do exactly that with `ngModelOptions`' `debounce` parameter.

`debounce` defines an integer value which represents a model update delay in milliseconds. Which means, if we take the example mentioned above, that we want to update our model 300 milliseconds after the user stopped typing, we can do so by defining a debounce value of `300` like this:

{% highlight html %}
{% raw %}
<input 
  type="search" 
  ng-model="searchQuery" 
  ng-model-options="{ debounce: 300 }">
<p>Search results for: {{searchQuery}}</p>
{% endraw %}
{% endhighlight %}

Now, when typing into the `input` field, there's a slight delay until the model updates. You can try it out right here:

<iframe src="http://embed.plnkr.co/PNxIXX/preview"></iframe>

We can go even further and configure how the update delay should be done for certain events. Controlling the debounce delay for specific events can be done by defining an object literal instead of a primitive integer value, where keys represent the event name and values the debounce delay. A delay of `0` triggers an immediate model update.

The following code generates a model update delay of 300 milliseconds when the user types into our `input`, but an immediate update when removing the focus:

{% highlight html %}
{% raw %}
<input 
  type="search" 
  ng-model="searchQuery" 
  ng-model-options="{ updateOn: 'default blur', debounce: { 'default': 300, 'blur': 0 } }">
<p>Search results for: {{searchQuery}}</p>
{% endraw %}
{% endhighlight %}

Super powerful right? There are a few other options that are worth to checkout out. You can read about them in the [official docs](https://docs.angularjs.org/api/ng/directive/ngModelOptions).

## Synchronizing model and view with `$rollbackViewValue`

Due to the fact that we are able to control with `ngModelOptions` how and when model updates are done, the model and the view can get out of sync. For example, when we configure our `input` element to update the model only when it loses its focus, the moment when the user types into the field, the `input` value differs from the actual value in the model.

There might be situations, where you want to roll the view value back to what it was, before the change has been made. For such cases, Angular introduces a so called `$rollbackViewValue` method that can be invoked to synchronize the model and view. Basically what this method does is, it takes the value that is currently in the model and reflects it back to the view. In addition, it cancels all debounced changes.

To demonstrate this use case, we can setup a `form` that has an `input` element that updates the model when the user removes the focus. As long as the user didn't remove the focus of the `input` element, he can hit the `Esc` key to discard his changes and get the value of the model back. Try it out yourself:

<iframe src="http://embed.plnkr.co/KQbeSE/preview"></iframe>

So it turns out that `ngModelOptions` is a super powerful directive that helps us making our apps more intuitive. Go and check out the [docs](https://code.angularjs.org/1.3.0/docs/api/ng/directive/ngModelOptions) about the `allowInvalid` and `getterSetter` options, to see what else is possible!
