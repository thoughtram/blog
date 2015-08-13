---
layout:     post
title:      "Exploring Angular 1.3: Stateful filters"
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
date:       2014-11-19
update_date: 2015-08-13
summary:    Even if we suppose the 1.3 release to be a feature release, it turns out it comes with a possible breaking change. It makes all filters stateless by default. In this article we're going to take a look what that means.

isExploringAngular13Article: true

categories: 
  - angularjs

tags:
  - angular

author: pascal_precht
---

Angular 1.3 comes with a lot of cool features and improvements. We already covered a couple of them. You can for example read about [one-time bindings](http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html), [ngModelOptions](http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html) or the newly introduced [Angular-hint](http://blog.thoughtram.io/angularjs/2014/11/06/exploring-angular-1.3-angular-hint.html) module that helps you out writing better Angular code.

However, it turns out that, even if the 1.3 release looks like a feature release, it comes with a change that might break your existing code. It handles all filters stateless by default and in this article we're going to take a look at what this means and how we can deal with that.

## The filter behaviour you know

I think I don't have to go into much detail when it comes to how to use filters in general. We apply them with a `|` symbol in our interpolation expressions and are able to pass additional parameters by chaining them with a `:` symbol.

For instance, in the following example, we use the `json` filter to convert a JavaScript object into a JSON string:

{% highlight html %}
{% raw %}
{{ jsonExpression | json }}
{% endraw %}
{% endhighlight %}

Expecting `jsonExpression` to look something like: `{'name':'value'}`, the filter would return a string that looks something like this:

{% highlight json %}
{
  "name": "value"
}
{% endhighlight %}

If we use a filter that can be configured with additional parameters, we can pass them to the filter by chaining them with a `:` symbol right in the expression. The following example uses the `currency` filter to format the given expression accordingly and uses an optional `symbol` parameter to change the default currency symbol for this particular use case.

{% highlight html %}
{% raw %}
{{ amount | currency:'€' }}
{% endraw %}
{% endhighlight %}

Okay, so this is pretty straight forward right? A filter takes an expression and uses it as input to manipulate the expressions value and returns (ideally) a string, so it can be used in our HTML right away.

We can go even further and build a custom filter that depends on another service to manipulate the given input. Let's assume we have a filter like this:

{% highlight javascript %}
angular.module('myApp', [])

.filter('customFilter', ['someService', function (someService) {
  return function customFilter(input) {
    // manipulate input with someService
    input += someService.getData(); 
    return input;
  };
}]);
{% endhighlight %}

In this example we have a filter that depends on `someService` and this particular service apparently comes with a method `getData()`, which is used to change the value of `input` that gets returned.

Again, this is pretty straight forward. Filters in Angular follow the same rules as other component types like services, factories etc, when it comes to dependency injection. So basically it's totally fine and valid to have dependencies in filter components. However, **filters that have dependencies are usually stateful**. And this is where the code might break.

But what does that mean? And why is it a problem at all? Well, let's take a look at what changed in Angular 1.3, so we get a better idea of what causes problems.

## Filters in 1.3

In order to make Angular faster, a lot of changes landed in the 1.3 release that come with performance improvements. One of them is how filters behave by default. We talked about what filters do and how we can use them, but we didn't talk about the fact, that they always came with a relatively big drawback. Each filter creates a new watcher. Having to many watchers registered can slow down our app, since the more watchers are registered, the more work has to be done during the `$digest` cycle. That's why we usually should avoid using too many filters.

However, there's a reason why [Igor Minar](http://twitter.com/IgorMinar) said that:

>"Angular 1.3 is the best Angular yet!"

In version 1.3, filters are much smarter. By default, they cache the evaluated value so they don't have to be re-evaluated all the time. Getting back to our simple `{% raw %}{{ jsonExpression | json}}{% endraw %}` example, the expression only gets re-evaluated when `jsonExpression` changes, which makes our code execution much faster.

To make it work like this, Angular assumes that, as long as the passed expression doesn't change, the result of the expression doesn't change either. It's **stateless**. And this is where our code might break. Think about what that means in cases where your filter depends on other services, like our `customFilter`. 

But to get a better picture, let's take a look at the `translate` filter that comes with the [angular-translate](http://angular-translate.github.io) module. It consumes translation ids to look them up in a registered translation table, using the `$translate` service and returns the dedicated translation. **It is stateful**.

Here's what it looks like:

{% highlight javascript %}
{% raw %}
{{ 'TRANSLATIONID' | translate }}
{% endraw %}
{% endhighlight %}

As we already discussed, Angular caches the value of this expression and won't re-evaluate it unless `'TRANSLATIONID'` changes. This is actually a problem, because `'TRANSLATIONID'` never changes. When the user changes the language, the given translation id again, is looked up by the filter in a translation table, but the expression stays the exact same.

So how do we tell Angular, that expressions that are stateful  *have* to be re-evaluated? It's easy. All we have to do is to add a `$stateful` property to our filter that flags it as stateful. Here we see our `customFilter` being flagged accordingly:

{% highlight javascript %}
angular.module('myApp', [])

.filter('customFilter', ['someService', function (someService) {
  function customFilter(input) {
    // manipulate input with someService
    input += someService.getData(); 
    return input;
  }

  customFilter.$stateful = true;

  return customFilter;
}]);
{% endhighlight %}

That's it. Setting the `$stateful` property to `true` does the trick (angular-translate's filter comes with that flag already). Keep in mind that it's in general recommended to avoid building stateful filters, because the execution of those can't be optimized by Angular. Better build stateless filters that get all needed information as parameters.

To sum it up, make sure to flag your stateful filters as stateful in order to make them work with Angular 1.3. Hopefully this article made clear why these changes are a requirement.
