---
layout:     post
title:      "Writing Angular 2 code in ES5"
relatedLinks:
  -
    title: "The difference between decorators and annotations"
    url: "http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html"
  -
    title: "Builing a zippy component in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html"
  -
    title: "Even better ES5 code for Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/07/06/even-better-es5-code-for-angular-2.html"
  -
    title: "Angular ES5 Demo"
    url: "http://plnkr.co/edit/XmZkHzl407z93R5Kf0pv?p=preview"
date:       2015-05-09
update_date: 2015-07-06
summary:    "Angular 2 is written in TypeScript to take advantage of language features like types and meta data annotations through decorators. While this is great for tooling, a lot of people don't like the syntax of decorators and maybe even ES6 classes. This article discusses how to write an Angular 2 application in ES5."

categories: 
- angular

tags:
- angular2

topic: upgrade

author: pascal_precht
---

{% include breaking-changes-hint.html %}

It's no news anymore that Angular 2 is written in TypeScript in order to take advantage of language features like types and meta data annotations through decorators. Taking a first look at Angular 2 examples that are written in TypeScript, can feel a bit unfamiliar and unclear to developers that don't have experience with that language. Even constructs like classes that ECMAScript 6 brings to the table can be scary enough to keep developers from learning Angular 2.

That's why developers with more experience will tell us that we don't have to write TypeScript or just ES6 if we don't want to. We can just stick with ES5. Cool, fine. But how do we do that? In one of our last articles we've explored the [difference between annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) and to what they translate to in ES5.

In this article, we will use that information, to actually write Angular 2 code in ES5 with the latest version released at the time of writing.

## Getting started with Angular 2 in ES5

If you've read our article on [building a zippy component](http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) in Angular 2, you might know that nowadays, there's quite a bit of work to do, in order to get started if you want to write your application in ES6/TypeScript and take advantage of it's module system.

In ES5 we don't have a module system yet. So ideally, we should be able to just take a JavaScript file from somewhere, that has all the Angular 2 code in it, so we can embed it in our website. **Luckily exactly that is possible since alpha.22**. We don't have to care about transpiling, concatenating, deciding on a module system (AMD, Common, System, ...), or anything else. We can just fetch a bundled file from `code.angularjs.org` that comes with the ready-to-use code.

{% highlight html %}
{% raw %}
<script src="http://code.angularjs.org/2.0.0-alpha.22/angular2.sfx.dev.js"></script>
{% endraw %}
{% endhighlight %}

Boom. That's it.

Now the next question comes up: How can we access and use given annotations and/or decorators? Usually, in ES6, we would import them from the framework but now there's no way for us to import them.

Well, it turns out that the bundled version exposes an `angular` object on the current global scope or reuses an existing one, which has all annotations added to it. In our [last article](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) we've learned that annotations are just classes, which in the end are just functions. And those functions are called as constructor functions to add meta data to our components. That means, all we have to do is to call those annotation constructors manually and assign them to our component's `annotations` property.

Let's start off with a simple component that has a template:

{% highlight javascript %}
{% raw %}
var HelloComponent = function () {

};

HelloComponent.annotations = [
  new angular.ComponentAnnotation({
    selector: 'hello-cmp'
  }),
  new angular.ViewAnnotation({
    template: 'Hello World!'
  })
];
{% endraw %}
{% endhighlight %}

That's it. We have a constructor function that has a component annotation and a view annotation. The TypeScript equivalent would look something like this:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'hello-cmp'
})
@View({
  template: 'Hello World!'
})
class HelloComponent {

}
{% endraw %}
{% endhighlight %}

You might wonder, why we use `ComponentAnnotation` and `ViewAnnotation` instead of `Component` and `View`. Well, if you've read our article on the [difference between annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) it's very easy to understand. Since `alpha.22` we have support for decorators **and** annotations. The Traceur transpiler implements annotations, but Babel and TypeScript support ES7 decorators.

In order to make the Angular code work with all those transpilers, it comes with both, annotation implementations and decorator implementations. Which means in fact, we could import and use `@ComponentAnnotation` and `@ViewAnnotation` in our ES6/TypeScript example as well, if we would transpile it with Traceur.

So long story short: `@ComponentAnnotation` and `@ViewAnnotation` are really the annotations. `@Component` and `@View` are the decorators that use the annotations internally.

We need to use the annotations, because we're writing in a language that doesn't have decorators support yet.

## Bootstrapping an Angular 2 app in ES5

When we come to the point that we want to bootstrap our application, we need to define a single entry component and call it with the `bootstrap()` function from the framework. This function is also exposed on the `angular` object in the ES5 bundle, so we can call it directly from there. If we put our application script in the `<head>` of our document, we need to make sure that all of the DOM is loaded before we bootstrap our component. Adding an event listener for the `DOMContentLoaded` event and call `bootstrap` once triggered, will help here.

{% highlight javascript %}
{% raw %}
document.addEventListener('DOMContentLoaded', function () {
  angular.bootstrap(HelloComponent);
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

Great we've just bootstrapped our Angular 2 application written in ES5! Was it that hard?

## Injecting services in ES5

Let's say we want to add a `GreetingService` to our component. The `@Component` annotation takes a property `viewInjector` to define injectable types for this particular component. This is easy to add. First we build the service. A service in Angular 2 is just a class, which translates to just a function, which is also just an object in JavaScript.

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
  new angular.ComponentAnnotation({
    selector: 'hello-cmp',
    viewInjector: [GreetingService]
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
HelloComponent.parameters = [[GreetingService]];
{% endraw %}
{% endhighlight %}

If you wonder why we define a nested array, this is because one constructor parameter can have more than one associated annotation.

Cool, so it turns out that writing Angular 2 code is actually not weird at all. In addition to that, it kind of gets clear that writing Angular code in ES5 requires more typing. But again, in the end it's up to the application author which language or transpiler to use.

There's even a [better syntax](http://blog.thoughtram.io/angular/2015/07/06/even-better-es5-code-for-angular-2.html), that makes writing and reading Angular 2 code a breeze.

You can find a running example of that Angular 2 app in ES5 right [here](http://plnkr.co/edit/XmZkHzl407z93R5Kf0pv?p=preview).
