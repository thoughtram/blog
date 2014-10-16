---
layout:     post
title:      Exploring Angular 1.3 - One-time bindings
date:       2014-10-14
summary:    The Angular team finally released version 1.3 of the great Angular framework. This is a blog series to explore everything you need to know about this release.

categories: 
  - angularjs

author: pascal_precht
---

The time has come. [Angular 1.3](http://angularjs.blogspot.de/2014/10/angularjs-130-superluminal-nudge.html) is finally out and it comes with tons of new features, bug fixes, improvements but also breaking changes. And because of all this new stuff happening there, we thought it would make sense to help making the adaption of this release easier for all of us, by exploring its main features and improvements and make a blog series out of it. This is the first post of "Exploring Angular 1.3" and it covers one of the most important features ever: **one-time binding**.

Wait! Isn't this Angular thing actually all about *two-way* binding? Well, yes it is and that's great. However, Angulars implementation of two-way binding requires the framework to keep an eye on all values that are two-way bound. This can lead to performance issues and one-time bindings are here to help. But before we explore one-time bindings, let's understand Angulars concepts of two-way binding and watchers first.

## Understanding watchers and two-way binding

In order to make two-way binding possible, Angular uses [$watch](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$watch) APIs to observe model mutations on the scope. What the scope actually is and where it comes from, depends on your application code. If you don't create a *child scope* by, for example, using the `ngController` directive to create an association between your DOM and your actual controller code, you're probably dealing with the [$rootScope](https://docs.angularjs.org/api/ng/service/$rootScope), which is (as the name says) the scope that acts as root scope for your application and created by Angular itself through the `ngApp` directive, unless you bootstrap your app manually.

However, at some point you always deal with a scope and that one is used to observe changes on it with the use of so called *watchers*. Watchers are registered through [directives](https://docs.angularjs.org/guide/directive) that are used in the DOM. So let's say we use the interpolation directive to reflect scope model values in the DOM:

{% highlight html %}
{% raw %}
<p>Hello {{name}}!</p>
{% endraw %}
{% endhighlight %}

This interpolation directive registers a watch for a property `name` on the corresponding scope (which in our case is `$rootScope`) in order to interpolate against it to display the value in the DOM.

Defining a property with exactly that identifier on our scope and assigning a value to it, makes it magically displaying it in the DOM without further actions:

{% highlight javascript %}
angular.module('myApp', [])
.run(function ($rootScope) {
  $rootScope.name = "Pascal";
}]);
{% endhighlight %}

Great! We just bound a model value to the view with an interpolation directive. If now something changes the value, the view gets updated automatically. Let's add a button that updates the value of `name` once it's clicked:

{% highlight html %}
{% raw %}
<button ng-click="name = 'Christoph'">Click me!</button>
{% endraw %}
{% endhighlight %}

Clicking the button assigns the string `Christoph` to `name` which triggers a [$digest](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$digest) cycle that automatically updates the DOM accordingly. In this particular case we're just updating the value one-way (top &rarr; down). However, when for example dealing with an `input` element that has an [ngModel](https://docs.angularjs.org/api/ng/directive/ngModel) directive applied, and a user changes its `value` property by typing something into it, the change is reflected back to the actual model.

This happens because when a `$digest` cycle is triggered, Angular processes all registered watchers on the current scope and its children and checks for model mutations and calls dedicated watch listeners until the model is stabilized and no more listeners are fired. Once the `$digest` loop finishes the execution, the browser re-renders the DOM and reflects the changes.

Here's a running example of the code described above:

<iframe src="http://embed.plnkr.co/MGz5NrK1HKOy62fyVtmU/preview"></iframe>

## The problem with too many watchers

Now that we have a picture of how the two-way binding mechanism in Angular actually works, we might wonder why there is a feature for one-time binding. 

Due to Angulars nature of using watchers for two-way binding, we might get some problems in terms of performance when having too many of them. As we learned, *watch expressions* are registered on the scope together with their callback listeners so Angular can process them during `$digest` cycles in order to update the view accordingly. That simply means, the more watchers are registered, the more Angular has to process.

Now imagine you have a lot of dynamic values in your view that have to be evaluated by Angular. Internationalization for example, is a very common use case where developers use Angulars two-way binding to localize their apps, even if the language isn't changeable during runtime, but set on initial page load. In that case every single string that is localized in the view and written to the scope, sets up a watch in order to get updated once something triggers the next `$digest`. This is a lot of overhead especially when your language actually doesn't change at runtime.

## One-time bindings to the rescue!

This is where one-time bindings come in. So what are one-time bindings? Let's just read what the [official docs](https://docs.angularjs.org/guide/expression#one-time-binding) say:

>One-time expressions will stop recalculating once they are stable, which happens after the first digest...

And this is exactly what the Angular world needs to tackle the problems mentioned above. So what does it look like when we want to use one-time binding? Angular 1.3 comes with a new syntax for interpolation directives and expressions in order to tell Angular that this particular interpolated value should be bound one-time.

Using this new syntax is as easy as starting an expression with `::`. So if we apply the one-time expression to our example above, we change this:

{% highlight html %}
{% raw %}
<p>Hello {{name}}!</p>
{% endraw %}
{% endhighlight %}

To this:

{% highlight html %}
{% raw %}
<p>Hello {{::name}}!</p>
{% endraw %}
{% endhighlight %}

This works for all kind of typical Angular expressions you're used to use throughout your app. Which means you can use them in `ng-repeat` expressions or even for directives that expose attributes that set up a two-way binding from the inside out. From the outside you're able to just feed them with a one-time expression:

{% highlight html %}
{% raw %}
<custom-directive two-way-attribute="::oneWayExpression"></custom-directive>
{% endraw %}
{% endhighlight %}


Okay, let's see it in action. We already updated the `name` to `::name` to ensure the one-time binding. The rest of the code just stays as it is to demonstrate that our one-time binding works. Remember the button we added to update the `name` to `Christoph`? Well, try it again:

<iframe src="http://embed.plnkr.co/WHHnp4KWKmd3O5twbzKV/preview"></iframe>

Perfect. `name` won't ever change again. `Pascal` is a much better name anyway, right?
