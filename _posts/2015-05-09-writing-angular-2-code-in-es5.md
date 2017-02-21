---
layout: post
title: Writing Angular code in ES5
relatedLinks:
  - title: Exploring Angular 2 - Article Series
    url: /exploring-angular-2
  - title: The difference between decorators and annotations
    url: /angular/2015/05/03/the-difference-between-annotations-and-decorators.html
  - title: Builing a zippy component in Angular 2
    url: /angular/2015/03/27/building-a-zippy-component-in-angular-2.html
  - title: Even better ES5 code for Angular 2
    url: /angular/2015/07/06/even-better-es5-code-for-angular-2.html
  - title: Angular ES5 Demo
    url: 'http://plnkr.co/edit/XmZkHzl407z93R5Kf0pv?p=preview'
date: 2015-05-09T00:00:00.000Z
update_date: 2016-12-16T00:00:00.000Z
summary: >-
  Ever wondered what it's like to write Angular 2 in ES5? Check out this
  article!
categories:
  - angular
tags:
  - angular2
topic: upgrade
author: pascal_precht
demos:
  - url: 'http://plnkr.co/edit/BUYnsbW7WX6FTjlK7mUh?p=preview'
    title: Hello World app in ES5
  - url: 'https://plnkr.co/edit/l2kmT4w0uQMzuwHk4nc6?p=preview'
    title: Hello World app with service injection
related_posts:
  - Using Zones in Angular for better performance
  - Making your Angular apps fast
  - Testing Angular Directives with Custom Matchers
  - Testing Services with Http in Angular
  - Two-way Data Binding in Angular
  - Resolving route data in Angular
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

It's no news anymore that Angular 2.x was written in TypeScript in order to take advantage of language features like types and meta data annotations through decorators. Taking a first look at Angular examples that are written in TypeScript, can feel a bit unfamiliar and unclear to developers that don't have experience with that language. Even constructs like classes that ECMAScript 2015 brings to the table can be scary enough to keep developers from learning Angular.

That's why developers with more experience will tell us that we don't have to write TypeScript or just ES6 if we don't want to. We can just stick with ES5. Cool, fine. But how do we do that? In one of our last articles we've explored the [difference between annotations and decorators](/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) and to what they translate to in ES5.

In this article, we will use that information, to actually write Angular code in ES5 with the latest version released at the time of writing (2.x).

{% include demos-and-videos-buttons.html post=page %}

## Getting started with Angular in ES5

If you've read our article on [building a zippy component](/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) in Angular, you might know that nowadays, there's quite a bit of work to do, in order to get started if you want to write your application in ES6/TypeScript and take advantage of it's module system.

In ES5 we don't have a module system yet. So ideally, we should be able to just take a JavaScript file from somewhere, that has all the Angular code in it, so we can embed it in our website. We don't have to care about transpiling, concatenating, deciding on a module system (AMD, Common, System, ...), or anything else. We can just fetch a bundled file that comes with the ready-to-use code.

The easiest way to get hold of Angular ES5 bundles is npmcdn. Here's what we need to embed to get started with ES5 and Angular:

{% highlight html %}
{% raw %}
<script src="https://npmcdn.com/@angular/core@2.0.0-rc.5/bundles/core.umd.js"></script>
<script src="https://npmcdn.com/@angular/common@2.0.0-rc.5/bundles/common.umd.js"></script>
<script src="https://npmcdn.com/@angular/compiler@2.0.0-rc.5/bundles/compiler.umd.js"></script>
<script src="https://npmcdn.com/@angular/platform-browser@2.0.0-rc.5/bundles/platform-browser.umd.js"></script>
<script src="https://npmcdn.com/@angular/platform-browser-dynamic@2.0.0-rc.5/bundles/platform-browser-dynamic.umd.js"></script>
{% endraw %}
{% endhighlight %}

Whereas `@2.0.0-rc.5` is the version number we specify. So that part might change depending on what we want to do.

Now the next question comes up: How can we access and use given annotations and/or decorators? Usually, in ES2015, we would import them from the framework but now there's no way for us to import them.

Well, it turns out that the bundled version exposes an `ng.core` object on the current global scope or reuses an existing one, which has all annotations added to it. In our [last article](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) we've learned that annotations are just classes, which in the end are just functions. And those functions are called as constructor functions to add meta data to our components. That means, all we have to do is to call those annotation constructors manually and assign them to our component's `annotations` property.

Let's start off with a simple component that has a template:

{% highlight javascript %}
{% raw %}
var HelloComponent = function () {

};

HelloComponent.annotations = [
  new ng.core.Component({
    selector: 'hello-cmp',
    template: 'Hello World!'
  })
];
{% endraw %}
{% endhighlight %}

That's it. We have a constructor function that has a component annotation and a view annotation. The TypeScript equivalent would look something like this:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'hello-cmp',
  template: 'Hello World!'
})
class HelloComponent {

}
{% endraw %}
{% endhighlight %}

## Bootstrapping an Angular app in ES5

When we come to the point that we want to bootstrap our application, we need to define an `NgModule` that has everything attached to it that is needed to make our app run, and bootstrap it on a dedicated platform (e.g. browser, webworker or server).

Let's go ahead and create such a module first. `ng.core.NgModule` can be used to create the needed metadata on a constructor function. Just like with our `HelloComponent`, we create an `AppModule` function like this:

{% highlight javascript %}
{% raw %}
var AppModule = function () {

};
{% endraw %}
{% endhighlight %}

Next, we add `NgModule` annotations to it:

{% highlight javascript %}
{% raw %}
AppModule.annotations = [
  new ng.core.NgModule({
    imports: [ng.platformBrowser.BrowserModule],
    declarations: [HelloComponent],
    bootstrap: [HelloComponent]
  })
];
{% endraw %}
{% endhighlight %}

Similar to TypeScript world, we have to import the `BrowserModule` from the `ng.platformBrowser` package, so we can bootstrap our module in the browser environment. Next, we declare all directives and components that are used inside this module, which in our case, is only the `HelloComponent`. Last but not least, we tell Angular which component to bootstrap when the module is bootstrapped.

We need to make sure that all of the DOM is loaded before we bootstrap our module. Adding an event listener for the `DOMContentLoaded` event and call `bootstrap` once triggered, will help here. When the event is fired, we can call `platformBrowserDynamic().bootstrapModule(AppModule)` to bootstrap our app:

{% highlight javascript %}
{% raw %}
document.addEventListener('DOMContentLoaded', function () {
  ng.platformBrowserDynamic
    .platformBrowserDynamic().bootstrapModule(AppModule);
});
{% endraw %}
{% endhighlight %}

And of course, the corresponding application template looks like this:

{% highlight html %}
{% raw %}
<body>
  <hello-component></hello-component>
</body>
{% endraw %}
{% endhighlight %}

Great we've just bootstrapped our Angular application written in ES5! Was it that hard?

## Injecting services in ES5

Let's say we want to add a `GreetingService` to our component. The `@Component` annotation takes a property `viewProviders` to define injectable types for this particular component. This is easy to add. First we build the service. A service in Angular can be just a class, which translates to just a function, which is also just an object in JavaScript.

{% highlight javascript %}
{% raw %}
var GreetingService = function () {}

GreetingService.prototype.greeting = function () {
  return 'Hello';
};
{% endraw %}
{% endhighlight %}

Next we tell our component about it's injectable types:

{% highlight javascript %}
{% raw %}
HelloComponent.annotations = [
  new ng.Component({
    selector: 'hello-cmp',
    providers: [GreetingService]
  }),
  ...
];
{% endraw %}
{% endhighlight %}

This basically tells our component that it should return an instance of `GreetingService` when somebody asks for `GreetingService`. Nobody asked for it yet, so let's change that. First we need something we want to inject into our component's constructor:

{% highlight javascript %}
{% raw %}
var HelloComponent = function (greetingService) {
  this.greeting = greetingService.greeting();
};
{% endraw %}
{% endhighlight %}

To make our component explicitly ask for something that is a `GreetingService`, or in other words, to tell the injector that our `greetingService` parameter should be an instance of `GreetingService`, we need to add a parameter annotation accordingly:

{% highlight javascript %}
{% raw %}
HelloComponent.parameters = [[new ng.core.Inject(GreetingService)]];
{% endraw %}
{% endhighlight %}

If you wonder why we define a nested array, this is because one constructor parameter can have more than one associated annotation.

Cool, so it turns out that writing Angular code is actually not weird at all. In addition to that, it kind of gets clear that writing Angular code in ES5 requires more typing. But again, in the end it's up to the application author which language or transpiler to use.

There's even a [better syntax](http://blog.thoughtram.io/angular/2015/07/06/even-better-es5-code-for-angular-2.html), that makes writing and reading Angular code a breeze.

Check out the demos below!

