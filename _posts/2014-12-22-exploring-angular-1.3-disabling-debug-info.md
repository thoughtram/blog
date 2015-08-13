---
layout:     post
title:      "Exploring Angular 1.3: Disabling Debug Info"
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
date:       2014-12-22
update_date: 2015-08-13
summary:    "Shadowed by all the bigger features that version 1.3 comes with, smaller features like disabling debug info for production code, do not really get the attention they deserve. This article details how to give your app a performance boost in production environments with just a single line of code."

isExploringAngular13Article: true

categories: 
  - angularjs

tags:
  - angular

author: pascal_precht
---

Angular has some cool new features that improve our production code. And since these are a bit shadowed by all the other bigger features that come with 1.3, we're going to take a look at one of them: **Disabling Debug Info**.

Sure, disabling debug info doesn't really sound super special and in fact, it really isn't. However, it turns out that it can have a huge impact on our applications performance, so it's definitely worth a mention in our blog series on exploring Angular 1.3. 

So, what is the debug info we're talking about anyway?

## Debug Info in Angular

When using certain directives, Angular attaches some additional debug information to the elements they are applied to. For example, when we use the interpolation directive to evaluate an expression in our template, Angular adds an additional `ng-binding` class to the directive's, or directive's parent element.

For example, if we have a scope property like this:

{% highlight js %}
app.controller('AppController', ['$scope', function ($scope) {
  $scope.name = 'Pascal';
}]);
{% endhighlight %}

And an expression in our HTML code like this:

{% highlight html %}
{% raw %}
<p>Hello {{name}}!</p>
{% endraw %}
{% endhighlight %}

What we get, once compiled, is this:

{% highlight html %}
{% raw %}
<p class="ng-binding">Hello Pascal!</p>
{% endraw %}
{% endhighlight %}

The same happens when using `ng-bind` or `ng-bind-html` directives. The former is an equivalent to the interpolation directive, in form of an attribute to prevent flash of uncompiled content flickering. The latter lets us evaluate expressions that have HTML code as value while the HTML itself is interpreted by the browser (use of `$sce.trustAsHtml()` required here). 

To make things a bit more clear, here's our example as `ng-bind` version:

{% highlight html %}
{% raw %}
<p>Hello <span ng-bind="name"></span>!</p>
{% endraw %}
{% endhighlight %}

Which would end up in a DOM that looks like this:

{% highlight html %}
{% raw %}
<p>Hello <span class="ng-binding" ng-bind="name">Pascal</span>!</p>
{% endraw %}
{% endhighlight %}

Angular has some more cases where additional debug information is attached to an element. When Angular's compiler creates a new scope, it adds either `ng-scope` or `ng-isolated-scope` classes to the element, depending on what kind of scope is created. So for example, having a directive like this:

{% highlight js %}
app.directive('myComponent', function () {
  return {
    scope: {},
    template: 'This is a component with isolated scope.'
  };
});
{% endhighlight %}

Which is used like this:

{% highlight html %}
<my-component></my-component>
{% endhighlight %}

Creates this compiled DOM:

{% highlight html %}
<my-component class="ng-isolated-scope">
  This is a component with isolated scope.
</my-component>
{% endhighlight %}

As we can see, the compiler adds an `ng-isolated-scope` class to that element, because it has an isolated scope. But that's not all. What also happens is, that the actual scope is added to the DOM element as well. Wait... the scope object itself? Hey that means we can access it imperatively in JavaScript, right? Yes!

Depending on what type of scope is created, the corresponding element gets either a `.scope()` or `.isolateScope()` method, that we can call to access the scope object for debugging purposes. Just notice that with `element` we refer to `angular.element()`.

Running the following code in a browser console would display the components scope object:

{% highlight js %}
angular
  .element(document.querySelector('my-component'))
  .isolateScope();
{% endhighlight %}

Now we may wonder why these classes and element properties are added by the compiler. It turns out that tools like [Protractor](http://angular.github.io/protractor/#/) and the [Angular Batarang](https://chrome.google.com/webstore/detail/angularjs-batarang/ighdmehidhipcmcojjgiloacoafjmpfk?hl=en) need all this information to actually run. Batarang for example displays scope data in the developer tools.

## Disabling debug info for production

Having Angular providing all this information in our application is super useful when it comes to debugging. Tools like Protractor and Batarang can rely on that data and make debugging even easier. However, additional properties and classes that are added to the DOM also come with a performance cost depending on how much is stored on the scope and DOM operations are expensive anyway.

What we need is a way to actually turn off this behaviour when an application is deployed to production, because we usually don't need this information there. Luckily Angular has exactly that switch since version 1.3. In order to turn off this default behaviour, all we have to do is to call the `.debugInfoEnabled()` method on the `$compileProvider` during our application's configuration phase (since this is the only place where we have access to providers).


{% highlight js %}
app.config(['$compileProvider', function ($compileProvider) {
  // disable debug info
  $compileProvider.debugInfoEnabled(false);
}]);
{% endhighlight %}

Yay, just one line of code and our production application runs faster! But what if we **do** want to have this debug information in our application because something's wrong in our production environment and we need to debug?

Angular got us covered. The global `angular` object comes with a new `.reloadWithDebugInfo()` method, which does exactly what it says. It reloads the browser with debug information to make your life easier again. And since the `angular` object is global, we can just call it directly from the browsers console. Neat ha?
