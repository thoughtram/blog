---
layout: post
title: Using ES2015 with Angular today
date: 2015-01-23T00:00:00.000Z
update_date: 2016-12-16T00:00:00.000Z
summary: >-
  One of the most exciting upcoming changes for Angular version 2.0.0 is that
  it's entirely written in ES2015 - the next version of JavaScript. There's no
  need to wait until Angular version 2.0.0 though. You can start writing your
  Angular apps with ES20152015 today - even with Angular 1.x. In this post we
  are going to look at two very exciting ES2015 features and how they can play a
  role in the context of an Angular application. Modules and Inheritance.
categories:
  - angularjs
  - es6
tags:
  - angular
  - es2015
author: christoph_burgdorf
related_posts:
  - "The How and Why on using dynamic Angular components inside your custom\_widgets"
  - 'Exploring Angular 1.5: Lifecycle Hooks'
  - Sponsoring AngularConnect. Again.
  - ngMessageFormat - Angular's unheard feature
  - Multiple Transclusion and named Slots
  - Service vs Factory - Once and for all
related_videos:
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'
  - '189613148'
  - '189603515'

---

One of the most exciting upcoming changes for Angular 2.0 is that it's entirely written in ES2015 - the next version of JavaScript. There's no need to wait until Angular 2.0 though. You can start writing your Angular apps with ES2015 today - even with Angular 1.x.

In this post we are going to look at two very exciting ES2015 features and how they can play a role in the context of an Angular application: **Modules** and **Inheritance**.

## Modules

Modules are one of the most exciting features of ES2015. They enable us to decouple our code easier than ever before. The concept isn't all that new as most programming languages have some kind of module system. Using JavaScript, your best bet so far was to use one of the community projects such as [requirejs](http://requirejs.org/). With ES2015 a proper module standard is coming right into your browser, natively. With modules code can be structured to explicitly import all dependencies that are used in a file. Before a module can imported it first needs to be exported as a module.

```
function MainController () {
  
}

export { MainController }
```

Once a module has been exported it can easily be imported from another file.

```
import { MainController } from './path/to/MainController';
```

## Inheritance

First things first: Inheritance is one of the most over abused software patterns of all times. If you aren't family with the difference of [Is-A and Has-A](http://en.wikipedia.org/wiki/Is-a) relationships, please take a moment and read it up. Similary, if you aren't aware that you should favor [composition over inheritance](http://en.wikipedia.org/wiki/Composition_over_inheritance), please take a moment to read the linked article.

Most programmers that are coming from traditional languages such as Java or C# have been using inheritance for many years. In fact, it has been possible to use inheritance with JavaScript for years, too. Using it without further abstractions has been very clunky though. There is a huge number of libraries and frameworks that invent some kind of it's own DSL to make inheritance more approachable with JavaScript.

With ES2015 we don't need to rely on such non standard abstractions anymore. ES2015 defines a few new keywords and syntax additions that allow for easier inheritance. What's important to know is that it's really only sugar on top of the good old prototypal inheritance model that we've been using for years.

To use inheritance we need to make use of the new `class` keyword.

```
class Vehicle {

    constructor (name) {
        this._name = name;
    }

    get name () {
        return this._name;
    }
}
export { Vehicle }
```

In the example above we construct a simple `Vehicle` class which isn't different from a simple constructor function in ES5. Where the new class syntax really shines is when you want to inherit from another constructor function. Let's write a `Car` class that inherits from `Vehicle`.

```
import { Vehicle } from './Vehicle';

class Car extends Vehicle {

    move () {
        console.log(this.name + ' is spinning wheels...')
    }
}
export { Car }
```

Seen that? We import `Vehicle` as a module and extend it by using the new `extends` keyword. We could have done the same with ES5 but it's much more boilerplate code. Let's forget about the nice module seperation for a moment and put both `Vehicle` and `Car` into one file for the ES5 version.

```
//Vehicle
function Vehicle (name) {
    this._name = name;
}

Object.defineProperty(Vehicle.prototype, 'name', {
    get: function () { return this._name; },
    set: function (value) { this._name = value }
});


// Car
function Car (name) {
    Vehicle.call(this, name);
}

Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

Car.prototype.move = function () {
    console.log(this.name + ' is spinning wheels...');
}
```

Oh wow, things really got a lot easier with ES2015, no?

Now that we know what modules and inheritance mean in the context of ES2015, let's take a look at how we can actually use it with Angular today.

## Angular and ES modules

Let's first look at ES2015 modules in the context of Angular 1.x. 

```
class MainController {

    constructor(searchService) {
        this.searchService = searchService;
    }

    search () {
        this.searchService
            .fetch(this.searchTerm)
            .then(response => {
                this.items = response.data.items;
            });
    }
}
export { MainController }
```

Notice something? There's no Angular in our controller definition at all. It's plain old JavaScript code that happens to be in control of something.

The spirit of Angular has always been to stay out of the way of the developer as much as possibles. It embraces simple POJOs instead of special Angular object types. With ES2015 modules it's even easier to excell on that idea. You can write your controller as a simple constructor function and have it exported as an ES2015 module.

At some point though, we need to make Angular aware of the controller. Otherwise it just won't play any role in our Angular application.

```
import { MainController } from './MainController';
import { SearchService } from './SearchService';

angular
    .module('app', [])
    .controller('mainController', MainController)
    .service('searchService', SearchService);
```

We simply import the `MainController` in our `app.js` file that we use to bootstrap our application. In order to register it as a controller, we pass it on to Angular's `controller()` method.

## Angular and ES2015 inheritance

The good news is, you already know how to use it! We've already seen how easy inheritance becomes with ES2015 in our earlier example. Let's create a `PageController` and a `ProductPageController` whereas the `PageController` simply defines a `title()` function that should be available in all controllers that derive from `PageController`. All it does is that it prepends the string `Title: ` to the instance variable `_title`.

```
class PageController {

    constructor(title) {
        this._title = title;
    }

    title () {
        return 'Title: ' + this._title;
    }
}
export { PageController }
```

While it's possible to just set `_title` to a string from within the constructor of our `ProductPageController` we are aiming for the cleaner way and instead pass it to the constructor of our `PageController` by calling `super('ES2015 inheritance with Angular');`

```
import { PageController } from './PageController';

class ProductPageController extends PageController {

    constructor() {
        super('ES2015 inheritance with Angular');
    }
}

export { ProductPageController }
```

That's probably not the most exciting example in the world but it works! All there's left to do is to angularize the `ProductPageController`. 

```
import { ProductPageController } from './ProductPageController';

angular
    .module('app', [])
    .controller('ProductPageController', ProductPageController);
```

Please note that we don't have to do the same with the `PageController` as long as it's not *explicitly* used as an Angular controller. In our case, it's only used *implicitly* by the `ProductPageController`.

**Edit:** Evgeniy [asked on G+](https://plus.google.com/+PascalPrecht/posts/Jre92W8GnJQ):

>"how can be 'title' argument in constructor of next controller be legit? It doesn't look like the name of service".﻿

*The parameters in our constructor **do** work together with Angulars DI. In fact, the constructor is not different from a traditional constructor function. But how can `title` be legit then? The reason for that to work is that the `title` parameter is only used by the `PageController` which isn't registered with `myModule.controller(fn)`. The `PageController` is only used implicitly by the `ProductPageController`.*

Easy isn't it? Can we use that for services, too? Yes, we can but there's a small gotcha. It doesn't work with services that are defined using the `myModule.factory(fn)` API but only for those that are defined using `myModule.service(fn)`. That's because services that are defined using the `myModule.service(fn)` API are instantiated with the `new` operator under the hood whereas the others are not. For inheritance to work it's important that our constructor function is instantiated with `new` though.

There's one more gotcha [pointed out by Evgeniy](https://plus.google.com/+PascalPrecht/posts/Jre92W8GnJQ): When we use ES2015 classes we lose the ability to use explicit dependency annotation with the inline array notation.

In order to preserve dependency annotations for minification, we need to use the `$inject` property notation now:

`MainController.$inject = ['SearchService'];`

## Getting started with our boilerplate

There are plenty of different ways to get started with ES2015 today. The sheer amount of different ways to approach it can be very confusing. At thoughtram we created a [boilerplate](https://github.com/thoughtram/es6-babel-browserify-boilerplate) that makes it quite easy to get rolling. It uses the popular [babel transpiler](https://babeljs.io/) to convert ES2015 to ES5 code that works in all current major browsers. The boilerplate also uses [browserify](http://browserify.org/) to concat and minify all ES2015 modules into a single file.
