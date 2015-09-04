---
layout:     post
title:      "Even better ES5 code for Angular 2"
relatedLinks:
  -
    title: "Writing Angular 2 Code in ES5"
    url: "http://blog.thoughtram.io/angular/2015/05/09/writing-angular-2-code-in-es5.html"
  -
    title: "The difference between annotations and decorators"
    url: "http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html"
  -
    title: "Dependency Injection in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html"
date:       2015-07-06
update_date_: 2015-07-06
summary:    "One of the biggest things to consider when it comes to using Angular 2, is the upgrade path from Angular 1. Angular 2 is entirely written in TypeScript but browsers today only support ES5 or some features of ES6. However, nobody prevents us from writing Angular 2 code in ES5. A couple of weeks ago we wrote about exactly that. This time, we take a look at a new, much better, syntax to write Angular 2 in ES5."

categories: 
  - angular

tags:
  - angular2

topic: upgrade

author: pascal_precht
---

{% include breaking-changes-hint.html %}

A couple of weeks ago we wrote about how to write [Angular 2 code in ES5](http://blog.thoughtram.io/angular/2015/05/09/writing-angular-2-code-in-es5.html) and took a closer look at what [annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) translate to. While it is nice that we can all write Angular 2 applications without the hassle of setting up a development environment for TypeScript, Babel or SystemJS, it turns out that the syntax is still quite wordy. Of course, this isn't really a big problem, because it is just the syntax after all. That's why the Angular team works hard on making even the ES5 experience much better. All improvements that land in the ES5 world shrink the gap between Angular 1 and Angular 2 syntax, in fact, upgrading will be rather boring.

In this article we're going to take a closer look at the ES5 syntax improvements and how they make upgrading even easier.

## Angular 2 in ES5 before syntactical improvements

In order to understand the syntactical improvements in ES5 when building Angular 2 applications, we have to understand what the code looked like before. Angular 2 uses annotations to add meta data to it's application code, which in TypeScript (or ES7) looks something like this:

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

ES5 doesn't have the concept of annotations or decorators. That's why the code above translates to something like this, if we'd write it in ES5:

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

If this is entirely new to you, you might want to read our article on [Angular 2 code in ES5](http://blog.thoughtram.io/angular/2015/05/09/writing-angular-2-code-in-es5.html) which gives a more detailed explanation of this code. This particular ES5 code totally does it's job, but as mentioned earlier, the syntax is quite wordy. We won't get around the fact that we have to assemble annotations for our components ourselves. However, this can easily be fixed since it's really just syntax after all.

Let's take a look at how this can be done better with the more improved syntax for ES5.

## Angular 2 in ES5 after syntactical improvements

Since `alpha.26`, Angular provides a nicer more readable syntax when it comes to writing a component in ES5. Instead of using `angular.ComponentAnnotation()` and `angular.ViewAnnotation()` directly, we can use chainable `Component()`, `View()` and `Class()` methods. With a bit of straight forward indentation, we can make our ES5 code look very similar to the ES7 or TypeScript versions.

Let's take our `HelloComponent` and refactor it with the better syntax:

{% highlight javascript %}
{% raw %}
var HelloComponent = ng.
  Component({
    selector: 'hello-cmp'
  })
  .View({
    template: 'Hello World!'
  })
  .Class({
    constructor: function () { 

    }
  });
{% endraw %}
{% endhighlight %}

As we can see, `Component()` and `View()` are pretty much the equivalent to `@Component` and `@View` decorators respectively. They take care of creating annotations on our component, while we pass `ComponentArgs` and `ViewArgs` to them accordingly. What about `Class()`? It's pretty obvious that `Class()` takes the constructor function of our component, but can it also extend other "classes" or consume prototype methods as we would like to create?

Yeap, all that is possible let's quickly go through all possible properties of Angular's `Class()` method.

**constructor**

Nothing special here. `constructor` is a constructor function which internally gets called with `Object.create()`.

**extends**

The `extends` property allows us to extend existing classes or components. Here's a small example that shows what that could look like:

{% highlight javascript %}
{% raw %}
var OtherComponent = ng
  .Component({
    selector: 'other-cmp'
  })
  .View({
    template: '<p>Other</p>'
  })
  .Class({
    constructor: function () {

    }
  })

var HelloComponent = ng.
  Component({
    selector: 'hello-cmp'
  })
  .View({
    template: 'Hello World!'
  })
  .Class({
    extends: OtherComponent,
    constructor: function () { 

    }
  });
{% endraw %}
{% endhighlight %}

**Prototype methods**

We can define methods on our class simply by adding a property to it that is a function. In fact, every applied property in `Class()` has to be either a function or an array.

{% highlight javascript %}
{% raw %}
  ...
  .Class({
    constructor: function () { 
      this.name = 'thoughtram';
    },
    getName: function () {
      return this.name;
    }
  });
{% endraw %}
{% endhighlight %}

That's pretty straight forward. But why do properties have to be arrays otherwise? Remember [dependency injection in Angular2](http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html)? We can inject services and factories using `@Inject` decorators, but as we know, there are no decorators nor annotations in ES5. That's where the array syntax comes in.

{% highlight javascript %}
{% raw %}
var HelloComponent = ng.
  Component({
    selector: 'hello-cmp',
    viewInjector: [Service]
  })
  .View({
    template: 'Hello World!'
  })
  .Class({
    constructor: [Service, function (service) { 
      ...
    },
  });
{% endraw %}
{% endhighlight %}

Click [here](http://plnkr.co/edit/WALbpvoMaFaHSZJNsHH2?p=preview) to see the new syntax in action.

## Conclusion

As we can see, the gap between Angular 1 and Angular 2 is not so big anymore. The ES5 syntax for Angular 2 applications is getting closer to the ES7 or TypeScript equivalent, which hopefully helps people to not be scared anymore. It's really just syntax.
