---
layout:     post
title:      "Exploring Angular 1.3: Binding to Directive Controllers"
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
    title: "Exploring Angular 1.3: Validators Pipeline"
    url: "http://blog.thoughtram.io/angularjs/2015/01/11/exploring-angular-1.3-validators-pipeline.html"
  -
    title: "Exploring Angular 1.3: Go fast with $applyAsync"
    url: "http://blog.thoughtram.io/angularjs/2015/01/14/exploring-angular-1.3-speed-up-with-applyAsync.html"
  -
    title: "Exploring Angular 1.3: ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2015-01-02
update_date: 2015-08-13
summary:    "When Angular introduced the controllerAs syntax, it became a best practice to use it in order to prevent nested scope properties to be shadowed in templates and also to avoid using the scopes $parent property, since relying on DOM structure makes our code less maintainable. However, using controllerAs in directives with isolated scope turned out to be a bit cumbersome and in this article we are going to take a look why and how the 1.3 release fixes that."

isExploringAngular13Article: true

categories: 
- angularjs

tags:
  - angular

author: pascal_precht
---

In version 1.2, Angular introduced a new `controllerAs` syntax that made scoping clearer and controllers smarter. In fact, it's a best practice to use `controllerAs` throughout our Angular apps in order to prevent some common problems that developers run into fairly often.

Even if it's nice that we are able to use that syntax in pretty much every case where a controller comes into play, it turned out that in version 1.2, there's a little quirk when using it with directives that have an isolated scope. But before we get to the actual problem, let's recap `controllerAs` in general first, to get an idea of what problems it solves and how to use it, so that we are all on the same page.

## `controllerAs` as Namespace

Who of us did not run into the problem that, when having nested scopes created by nested controllers, scope properties that have the same name as properties on the parent scope, shadow that value of the parent scope property due to JavaScript's prototypical inheritance model?

Or, when speaking in code, having two controllers like this:

{% highlight js %}

function ControllerOne($scope) {
  $scope.foo = 'Pascal';
}

function ControllerTwo($scope) {
  $scope.foo = 'Christoph';
}

app.controller('ControllerOne', ControllerOne);
app.controller('ControllerTwo', ControllerTwo);

{% endhighlight %}

And a DOM structure like this:

{% highlight html %}
{% raw %}
<div ng-controller="ControllerOne">
  {{foo}}
  <div ng-controller="ControllerTwo">
    {{foo}}
  </div>
</div>
{% endraw %}
{% endhighlight %}

The {% raw %} `{{foo}}` {% endraw %} expression in `ControllerTwo` scope will shadow the {% raw %} `{{foo}}` {% endraw %} expression in `ControllerOne` scope, which results in string `Christoph` being displayed in the inner scope and `Pascal` being displayed in the outer scope. 

We could always get around this problem by using a scope's `$parent` property to reference its parent scope when accessing scope properties like this:

{% highlight html %}
{% raw %}
<div ng-controller="ControllerOne">
  {{foo}}
  <div ng-controller="ControllerTwo">
    {{$parent.foo}}
  </div>
</div>
{% endraw %}
{% endhighlight %}

However, it turns out that using `$parent` is actually a bad practice, since we start coupling our expression code to the underlying DOM structure, which makes our code less maintainable. Just imagine you have not only two nested scopes, but four or five. That would bring you into `$parent.$parent.$parent.$parent` hell, right?

That's one of the reasons why you might have heard that we should **always** have a dot in our expressions that access scope properties. In other words, this could easily be fixed with doing the following:

{% highlight js %}
function ControllerOne($scope) {
  $scope.modelOne = {
    foo: 'Pascal'
  };
}

function ControllerTwo($scope) {
  $scope.modelTwo = {
    foo: 'Christoph'
  };
}
{% endhighlight %}

And in our template, we update our expressions accordingly:

{% highlight html %}
{% raw %}
<div ng-controller="ControllerOne">
  {{modelOne.foo}}
  <div ng-controller="ControllerTwo">
    {{modelOne.foo}}
  </div>
</div>
{% endraw %}
{% endhighlight %}

And here comes `controllerAs` into play. This syntax allows us to introduce a new namespace bound to our controller without the need to put scope properties in an additional object literal. In fact, we don't even need to request `$scope` in our controller anymore, since the scope is bound the controller's `this` reference when using `controllerAs`.

Let's see what that looks like in code. First we remove the `$scope` service and assign our values to `this`:

{% highlight js %}
function ControllerOne() {
  this.foo = 'Pascal';
}

function ControllerTwo() {
  this.foo = 'Christoph';
}
{% endhighlight %}

Next, we update `ngController` directive expression with the `controllerAs` syntax, and use the new namespaces in our scopes:

{% highlight html %}
{% raw %}
<div ng-controller="ControllerOne as ctrl1">
  {{ctrl1.foo}}
  <div ng-controller="ControllerTwo as ctrl2">
    {{ctrl2.foo}}
  </div>
</div>
{% endraw %}
{% endhighlight %}

It gets even better. We are able to use that syntax whenever a controller is used. For example if we configure an application state with Angular's `$routeProvider` we can use `controllerAs` there too, in order to make our template code more readable.

{% highlight js %}
$routeProvider.when('/', {
  templateUrl: 'stateTemplate.html',
  controllerAs: 'ctrl',
  controller: 'StateController'
});
{% endhighlight %}

And as you probably know, directives can also have controllers and yes, we can use `controllerAs` there too.

{% highlight js %}
{% raw %}

app.controller('SomeController', function () {
  this.foo = 'bar';
});

app.directive('someDirective', function () {
  return {
    restrict: 'A',
    controller: 'SomeController',
    controllerAs: 'ctrl',
    template: '{{ctrl.foo}}'
  };
});

{% endraw %}
{% endhighlight %}

Great. Now we know what the `controllerAs` syntax it is all about, but we haven't talked about the little drawback that it comes with in 1.2. Let's move on with that one.

## The problem with `controllerAs` in Directives

We said that, when using `controllerAs`, the controllers' scope is bound to the controllers' `this` object, so in other words - `this` represents our scope. But how does that work when building a directive with isolated scope? 

We know we can create an isolated scope by adding an object literal to our directive definition object that defines how each scope property is bound to our directive. To refresh our memory, here's what we can do:

{% highlight js %}
app.directive('someDirective', function () {
  return {
    scope: {
      oneWay: '@',
      twoWay: '=',
      expr: '&'
    }
  };
});
{% endhighlight %}

This is a directive with an isolated scope that defines how its scope properties are bound. Alright, let's say we have directive with an isolated scope, a controller and a template that uses the controller properties accordingly:

{% highlight js %}
{% raw %}
app.directive('someDirective', function () {
  return {
    scope: {},
    controller: function () {
      this.name = 'Pascal'
    },
    controllerAs: 'ctrl',
    template: '<div>{{ctrl.name}}</div>'
  };
});
{% endraw %}
{% endhighlight %}

Easy. That works and we knew that already. Now to the tricky part: what if `name` should be two-way bound?

{% highlight js %}
{% raw %}
app.directive('someDirective', function () {
  return {
    scope: {
      name: '='
    },
    // ...
  };
});
{% endraw %}
{% endhighlight %}

Changes to isolated scope properties from the outside world are not reflected back to the controllers' `this` object. What we need to do to make this work in 1.2, is to use the `$scope` service to re-assign our scope values explicitly, whenever a change happens on a particular property. And of course, we mustn't forget to bind our watch callback to the controllers' `this`:

{% highlight js %}
{% raw %}
app.directive('someDirective', function () {
  return {
    scope: {
      name: '='
    },
    controller: function ($scope) {
      this.name = 'Pascal';

      $scope.$watch('name', function (newValue) {
        this.name = newValue;
      }.bind(this));
    },
    // ...
  };
});
{% endraw %}
{% endhighlight %}

Here we go... the `$scope` service we initially got rid off is now back. If you now think this is crazy, especially when considering that this is just one scope property and in a real world directive you usually have more than one, then my friend, I agree with you. 

Luckily, this is no longer a problem in Angular 1.3!

## Binding to controllers with `bindToController`

Angular 1.3 introduces a new property to the directive definition object called `bindToController`, which does exactly what it says. When set to `true` in a directive with isolated scope that uses `controllerAs`, the component's properties are bound to the controller rather than to the scope.

That means, Angular makes sure that, when the controller is instantiated, the initial values of the isolated scope bindings are available on `this`, and future changes are also automatically available.

Let's apply `bindToController` to our directive and see how the code becomes cleaner.

{% highlight js %}
{% raw %}
app.directive('someDirective', function () {
  return {
    scope: {
      name: '='
    },
    controller: function () {
      this.name = 'Pascal';
    },
    controllerAs: 'ctrl',
    bindToController: true,
    template: '<div>{{ctrl.name}}</div>'
  };
});
{% endraw %}
{% endhighlight %}

As we can see, we don't need `$scope` anymore (yay!) and there's also no `link` nor `compile` function in this directive definition. At the same time we keep taking advantage of `controllerAs`.

## Improvements in 1.4

In version `1.4`, `bindToController` gets even more powerful. When having an isolated scope with properties to be bound to a controller, we always define those properties on the scope definition and `bindToController` is set to `true`. In `1.4` however, we can move all our property binding definitions to `bindToController` and make it an object literal.

Here's an example with a component directive that uses `bindToController`. Instead of defining the scope properties on `scope`, we declaratively define what properties are bound to the component's controller:

{% highlight js %}
{% raw %}
app.directive('someDirective', function () {
  return {
    scope: {},
    bindToController: {
      someObject: '=',
      someString: '@',
      someExpr: '&'
    }
    controller: function () {
      this.name = 'Pascal';
    },
    controllerAs: 'ctrl',
    template: '<div>{{ctrl.name}}</div>'
  };
});
{% endraw %}
{% endhighlight %}

In addition to that, `bindToController` is no longer exclusive to isolated scope directives! Whenever we build a directive that introduces a new scope, we can take advantage of `bindToController`. So the following code also works:

{% highlight js %}
{% raw %}
app.directive('someDirective', function () {
  return {
    scope: true
    bindToController: {
      someObject: '=',
      someString: '@',
      someExpr: '&'
    },
    ...
  };
});
{% endraw %}
{% endhighlight %}
