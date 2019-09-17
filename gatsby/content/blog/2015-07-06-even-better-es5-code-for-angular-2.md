---
layout: post
title: Even better ES5 code for Angular
relatedLinks:
  - title: Exploring Angular 2 - Article Series
    url: /exploring-angular-2
  - title: Writing Angular 2 Code in ES5
    url: /angular/2015/05/09/writing-angular-2-code-in-es5.html
  - title: The difference between annotations and decorators
    url: /angular/2015/05/03/the-difference-between-annotations-and-decorators.html
  - title: Dependency Injection in Angular 2
    url: /angular/2015/05/18/dependency-injection-in-angular-2.html
date: 2015-07-06T00:00:00.000Z
update_date: 2016-12-16T00:00:00.000Z
summary: >-
  Nobody prevents us from writing Angular code in ES5. In this article we take a
  look at a new, much better, syntax to write Angular in ES5.
categories:
  - angular
tags:
  - angular2
topic: upgrade
author: pascal_precht
demos:
  - url: 'https://embed.plnkr.co/fdj1rQEnUGhpnFJY4ngY/'
    title: Hello World app in ES5 with syntactic sugar
related_posts:
  - RxJS Master Class and courseware updates
  - Advanced caching with RxJS
  - Custom Overlays with Angular's CDK - Part 2
  - Custom Overlays with Angular's CDK
  - Easy Dialogs with Angular Material
  - A web animations deep dive with Angular
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

A couple of weeks ago we wrote about how to write [Angular code in ES5](/angular/2015/05/09/writing-angular-2-code-in-es5.html) and took a closer look at what [annotations and decorators](/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) translate to. While it is nice that we can all write Angular applications without the hassle of setting up a development environment for TypeScript, Babel or SystemJS, it turns out that the syntax is still quite wordy. Of course, this isn't really a big problem, because it is just the syntax after all. That's why the Angular team works hard on making even the ES5 experience much better. All improvements that land in the ES5 world shrink the gap between Angular 1.x and Angular >= 2.x syntax, in fact, upgrading will be rather boring.

In this article we're going to take a closer look at the ES5 syntax improvements and how they make upgrading even easier.

{% include demos-and-videos-buttons.html post=page %}

## Angular in ES5 before syntactical improvements

In order to understand the syntactical improvements in ES5 when building Angular applications, we have to understand what the code looked like before. Angular uses decorators to add meta data to it's application code, which in TypeScript (or ES7) looks something like this:

```js
@Component({
  selector: 'hello-cmp',
  template: 'Hello World!'
})
class HelloComponent {

}
```

ES5 doesn't have the concept of annotations or decorators. That's why the code above translates to something like this, if we'd write it in ES5:

```js
var HelloComponent = function () {

};

HelloComponent.annotations = [
  new ng.core.Component({
    selector: 'hello-cmp',
    template: 'Hello World!'
  })
];
```

If this is entirely new to you, you might want to read our article on [Angular code in ES5](/angular/2015/05/09/writing-angular-2-code-in-es5.html) which gives a more detailed explanation of this code. This particular ES5 code totally does it's job, but as mentioned earlier, the syntax is quite wordy. We won't get around the fact that we have to assemble annotations for our components ourselves. However, this can easily be fixed since it's really just syntax after all.

Let's take a look at how this can be done better with the more improved syntax for ES5.

## Angular in ES5 after syntactical improvements

Angular comes with helper functions to create components and services right out of the box. Let's take our `HelloComponent` and refactor it with the better syntax:

```js
var HelloComponent = ng.core
  .Component({
    selector: 'hello-cmp',
    template: 'Hello World!'
  })
  .Class({
    constructor: function () { 

    }
  });
```

As we can see, `Component()` is pretty much the equivalent of `@Component` decorator. It takes care of creating annotations on our component, while we pass `ComponentArgs` to it accordingly. What about `Class()`? It's pretty obvious that `Class()` takes the constructor function of our component, but can it also extend other "classes" or consume prototype methods as we would like to create?

Yeap, all that is possible let's quickly go through all possible properties of Angular's `Class()` method.

**constructor**

Nothing special here. `constructor` is a constructor function which internally gets called with `Object.create()`.

**extends**

The `extends` property allows us to extend existing classes or components. Here's a small example that shows what that could look like:

```js
var OtherComponent = ng.core
  .Component({
    selector: 'other-cmp',
    template: '<p>Other</p>'
  })
  .Class({
    constructor: function () {

    }
  })

var HelloComponent = ng.
  Component({
    selector: 'hello-cmp',
    template: 'Hello World!'
  })
  .Class({
    extends: OtherComponent,
    constructor: function () { 

    }
  });
```

**Prototype methods**

We can define methods on our class simply by adding a property to it that is a function. In fact, every applied property in `Class()` has to be either a function or an array.

```js
  ...
  .Class({
    constructor: function () { 
      this.name = 'thoughtram';
    },
    getName: function () {
      return this.name;
    }
  });
```

That's pretty straight forward. But why do properties have to be arrays otherwise? Remember [dependency injection in Angular](/angular/2015/05/18/dependency-injection-in-angular-2.html)? We can inject services and factories using `@Inject` decorators, but as we know, there are no decorators nor annotations in ES5. That's where the array syntax comes in.

```js
var HelloComponent = ng.core
  Component({
    selector: 'hello-cmp',
    template: 'Hello World!',
    viewProviders: [Service]
  .Class({
    constructor: [Service, function (service) { 
      ...
    },
  });
```

## Conclusion

As we can see, the gap between Angular 1.x and Angular 2.x is not so big anymore. The ES5 syntax for Angular 2.x applications is getting closer to the ES2016 or TypeScript equivalent, which hopefully helps people to not be scared anymore. It's really just syntax.
