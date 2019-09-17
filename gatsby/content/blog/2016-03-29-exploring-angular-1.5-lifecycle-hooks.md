---
layout: post
title: 'Exploring Angular 1.5: Lifecycle Hooks'
relatedLinks:
  - title: Exploring Angular 1.3
    url: 'http://blog.thoughtram.io/exploring-angular-1.3'
  - title: Angular 1.5 components
    url: 'https://docs.angularjs.org/guide/component'
  - title: Angualr 2 Lifecycle Hooks
    url: 'https://angular.io/docs/ts/latest/guide/lifecycle-hooks.html'
date: 2016-03-29T00:00:00.000Z
update_date: 2016-03-29T00:00:00.000Z
summary: >-
  Angular 1.5 is finally out! This article discusses the new lifecycle hooks in
  Angular.
isExploringAngular15Article: true
categories:
  - angularjs
tags:
  - angular
author: pascal_precht
related_posts:
  - "The How and Why on using dynamic Angular components inside your custom\_widgets"
  - Sponsoring AngularConnect. Again.
  - ngMessageFormat - Angular's unheard feature
  - Multiple Transclusion and named Slots
  - Service vs Factory - Once and for all
  - Taking Angular Master Class to the next level
related_videos:
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'
  - '189613148'
  - '189603515'

---

Angular 1.5 has been finally released and it's more powerful than ever before! Many new features have been added and tons of fixes landed in the latest bigger release. If you're following our articles, you know that we love to give an overview of the latest and greatest in the Angular world. Last year we blogged about the 1.3 release in our article series [Exploring Angular 1.3](http://blog.thoughtram.io/exploring-angular-1.3). With this article we're going to start a new series called, guess what, "Exploring Angular 1.5", and the first topic we're going to explore is the new feature of **Lifecycle Hooks**. Let's get started right away!

## Lifecycle Hooks

Lifecycle hooks in Angular landed first in the Angular 2 alpha release and they are more or less inspired by the [Custom Elements lifecycle callbacks](http://webcomponents.org/articles/introduction-to-custom-elements/#lifecycle-callbacks). By inspired we mean that they are not exactly the same. They're not only named differently and do different things, there are also more. An Angular 2 component comes with lifecycle hooks like `ngOnInit()`, `ngOnDestroy()`, `ngOnChanges()` and many more. We get a very detailed overview of these in the [official docs](https://angular.io/docs/ts/latest/guide/lifecycle-hooks.html).

However, this article is on Angular 1.5. Since Angular 1 is evolving in a way to keep the gap to Angular 2 as small as possible, some lifecycle callbacks have been backported to the current "best Angular yet". Let's take a look at them one by one.

**Note: The Angular lifecycle-hooks were introduced in version 1.5.3.**

## `$onInit()`

This lifecycle hook will be executed when all controllers on an element have been constructed and after their bindings are initialized. This hook is meant to be used for any kind of initialization work of a controller. To get a better idea of how this behaves, let's take a look at some code.


```js
var mod = angular.module('app', []);

function MyCmpController() {
  this.name = 'Pascal';
}

mod.component('myCmp', {
  template: '<h1>{{$ctrl.name}}</h1>',
  controller: MyCmpController
});
```

We start off with an [Angular 1.5 component](https://docs.angularjs.org/guide/component) `myCmp`. A component has a controller and a template, and in our example, our component simply has a `name` property that we interpolate. `$ctrl` is the default `controllerAs` namespace, which is super nice because we don't have to set it up.

We can now move the initialization work into the `$onInit` lifecycle hook, by defining the hook on the controller instance:

```js
function MyCmpController() {
  this.$onInit = function () {
    this.name = 'My Component';
  };
}
```

Okay great. But uhm... what's the big deal? Well, while the resulting output will be the same, we now have the nice side effect that this component doesn't do any initialization work when its constructor is called. Imagine we'd need to do some http requests during initialization of this component or controller. We'd need to take care of mocking these requests whenever we construct such a component. Now we have a better place for these kind of things.

**Intercomponent Communication**

Another nice thing about `$onInit`, is that we can access controllers of parent components on our own component's controller, as those are exposed to it for intercomponent communication. This means it's not even necessary anymore to have a `link()` function to access other directive controllers.

For example, if we'd build a `<tabs>` component and a `<tab>` component, where the latter needs access to the `TabsController` to register itself on it, we can simply ask for it using the `require` property an call it directly via the controller instance.

```js
mod.component('myTab', {
  ...
  require: {
    tabsCtrl: '^myTabs'
  },
  controller: function () {
    this.$onInit = function () {
      this.tabsCtrl.addTab(this);
    };
  }
});
```

So after all, this aligns perfectly with what we've predicted a long time ago in our article on [binding to directive controllers](/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html).

## `$onChanges()`

This hook allows us to react to changes of one-way bindings of a component. One-way bindings have also been introduced in Angular 1.5 and align a bit more with Angular 2's uni-directional data flow. Let's say we make the `name` property of our `myCmp` configurable from the outside world using a one-way binding:

```js
mod.component('myCmp', {
  template: '<h1>{{$ctrl.name}}</h1>',
  bindings: {
    name: '<'
  },
  controller: MyCmpController
});
```

We can now bind an expression to the component's `name` property like this:

```html
<my-cmp name="someExpression"></my-cmp>
```

Let's say we want to prepend the name with "Howdy" when the name is "Pascal" and otherwise simply greet with "Hello". We can do that using the `$onChanges()` lifecycle hook. It gets called with an object that holds the changes of all one-way bindings with the `currentValue` and the `previousValue`.

```js
function MyCmpController() {
  this.$onChanges = function (changesObj) {
    if (changesObj.name) {
      var prefix;
      (changesObj.name.currentValue === 'Pascal') ?
        prefix = 'Howdy ' : prefix = 'Hello ';
      this.name = prefix + this.name;
    }
  };
}
```

Neat stuff!

## `$onDestroy()`

`$onDestroy()` is a hook that is called when its containing scope is destroyed. We can use this hook to release external resources, watches and event handlers.

For example, if we'd manually set up a `click` handler (instead of using `ng-click`), we need unregister the event handler when the component is destroyed, otherwise it'll keep hanging around and leaks memory.


```js
function MyCmpController($element) {

  var clickHandler = function () {
    // do something
  };

  this.$onInit = function () {
    $element.on('click', clickHandler);
  };

  this.$onDestroy = function () {
    $element.off('click', clickHandler);
  };
}
```

## `$postLink()`

There has been a lot of discussion around the fact that `bindToController` pushes us into the direction not to use `compile()` and `link()` anymore, and rather stick to simply `controller()` because it does the same job almost all the time, because it seemed unclear what to do when DOM manipulation needs to be done.

Well, it turns out there has always been the local injectable `$element`, which is basically a reference to the DOM element on which our directive is applied. This reference can and could be used to do DOM manipulation, even in the controller.

This still gave some Angular users a weird feeling because there's this one rule to not do DOM manipulations in the controller. This rule still applies, unless we're talking about directive controllers. And a component controller **is** a directive controller.

In Angular 1.5 it gets even better, because there's a lifecycle hook called `$postLink()`, which not only can be the place where we do all of the DOM manipulation, but it's also the hook where we know that all child directives have been compiled and linked.

We'll see if there are going to be more lifecycle hooks that Angular 1.5 can take advantage of. We clearly can't simply backport all of Angular 2's lifecycle hooks, because the compilation process is not exactly the same, so some lifecycle hooks don't really make sense in an Angular 1 world.
