---
layout: post
title: Dependency Injection in Angular 2
redirect_from:
  - /angular/2015/05/18/dependency-injection-in-/
date: 2015-05-18T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  Angular 2 implements a very powerful dependency injection system that makes
  reusing services easy and flexible. Learn how it works!
categories:
  - angular
tags:
  - angular2
topic: di
demos:
  - url: 'http://embed.plnkr.co/EiGotX/'
    title: Dependency Injection in Angular 2
videos:
  - url: 'http://casts.thoughtram.io/embedded/181222346'
  - url: 'http://casts.thoughtram.io/embedded/181222347'
  - url: 'http://casts.thoughtram.io/embedded/181222396'
  - url: 'http://casts.thoughtram.io/embedded/181222348'
  - url: 'http://casts.thoughtram.io/embedded/181222349'
author: pascal_precht
related_posts:
  - Testing Services with Http in Angular 2
  - Two-way Data Binding in Angular 2
  - Resolving route data in Angular 2
  - Angular 2 Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular 2
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---


Dependency injection has always been one of Angular's biggest features and selling points. It allows us to inject dependencies in different components across our applications, without needing to know, how those dependencies are created, or what dependencies they need themselves. However, it turns out that the current dependency injection system in Angular 1 has some problems that need to be solved in Angular 2, in order to build the next generation framework. In this article, we're going to explore the new dependency injection system for future generations.


{% include demos-and-videos-buttons.html post=page %}

Before we jump right into the new stuff, lets first understand what dependency injection is, and what the problems with the DI in Angular 1 are.

<div class="thtrm-tldr" markdown="1">

### TLDR;

An injector creates dependencies using providers. Providers are recipes that know how to create dependencies. Type annotations in TypeScript can be used to ask for dependencies and Every component has its own injector, resulting in an injector tree. The injector tree enables transient dependencies.

#### How to inject a service in Angular 2?

1. Create a provider either on your `@NgModule`, `@Component`, or `@Directive` using a type or a string as provider token.
2. Inject the service in the component's constructor where it's needed using that configured token.
</div>

<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Dependency Injection as a pattern

[Vojta Jina](http://twitter.com/vojtajina) gave a great talk on dependency injection at [ng-conf 2014](https://www.youtube.com/watch?v=_OGGsf1ZXMs). In this talk, he presented the story and ideas of the new DI system that will be developed for Angular 2. He also made very clear, that we can see DI as two things: As a design pattern and as a framework. Whereas the former explains the pattern that DI is all about, the latter can be a system that helps us out maintaining and assembling dependencies. I'd like to do the same in this article as it helps us understanding the concept first.

We start by taking a look at the following code and analysing the problems it introduces.

{% highlight js %}
class Car {
  constructor() {
    this.engine = new Engine();
    this.tires = Tires.getInstance();
    this.doors = app.get('doors');
  }
}
{% endhighlight %}

Nothing special here. We have a class `Car` that has a constructor in which we set up everything we need in order to construct a car object once needed. What's the problem with this code? Well, as you can see, the constructor not only assigns needed dependencies to internal properties, it also knows how those object are created. For example the engine object is created using the `Engine` constructor, `Tires` seems to be a singleton interface and the doors are requested via a global object that acts as a **service locator**.

This leads to code that is hard to maintain and even harder to test. Just imagine you'd like to test this class. How would you replace `Engine` with a `MockEngine` dependency in that code? When writing tests, we want to test different scenarios that our code is used in, hence each scenario needs its own configuration. If we want to write testable code, we need to write reusable code. Our code should work in any environment as long as all dependencies are satisfied. Which brings us to the conclusion that **testable code is reusable code** and vise versa.

So how can we write this code better and make it more testable? It's super easy and you probably already know what to do. We change our code to this:

{% highlight js %}
class Car {
  constructor(engine, tires, doors) {
    this.engine = engine;
    this.tires = tires;
    this.doors = doors;
  }
}
{% endhighlight %}

All we did is we moved the dependency creation out of the constructor and extended the constructor function to expect all needed dependencies. There are no concrete implementations anymore in this code, we literally moved the responsibility of creating those dependencies to a higher level. If we want to create a car object now, all we have to do is to pass all needed dependencies to the constructor:

{% highlight js %}
var car = new Car(
  new Engine(),
  new Tires(),
  new Doors()
);
{% endhighlight %}

How cool is that? The dependencies are now decoupled from our class, which allows us to pass in mocked dependencies in case we're writing tests:

{% highlight js %}
var car = new Car(
  new MockEngine(),
  new MockTires(),
  new MockDoors()
);
{% endhighlight %}

And guess what, **this is dependency injection**. To be a bit more specific, this particular pattern is also called **constructor injection**. There are two other injection patterns, setter injection and interface injection, but we won't cover them in this article.

Okay cool, now we use DI, but when comes a DI **system** into play? As mentioned before, we literally moved the responsibility of dependency creation to a higher level. And this is exactly what our new problem is. Who takes care of assembling all those dependencies for us? It's us.

{% highlight js %}
function main() {
  var engine = new Engine();
  var tires = new Tires();
  var doors = new Doors();
  var car = new Car(engine, tires, doors);

  car.drive();
}
{% endhighlight %}

We need to maintain a `main` function now. Doing that manually can be quite hairy, especially when the application gets bigger and bigger. Wouldn't it be nice if we could do something like this?

{% highlight js %}
function main() {
  var injector = new Injector(...)
  var car = injector.get(Car);

  car.drive();
}
{% endhighlight %}

## Dependency Injection as a framework

This is where dependency injection as a framework comes in. As we all know, Angular 1 has it's own DI system which allows us to annotate services and other components and let the injector find out, what dependencies need to be instantiated. For example, the following code shows how we can annotate our `Car` class in Angular 1:

{% highlight js %}
class Car {
  ...
}

Car.$inject = ['Engine', 'Tires', 'Doors'];
{% endhighlight %}

Then, we register our `Car` as a service and whenever we ask for it, we get a singleton instance of it without needing to care about creating needed dependencies for the car.

{% highlight js %}
var app = angular.module('myApp', []);

app.service('Car', Car);

app.service('OtherService', function (Car) { 
  // instance of Car available
});
{% endhighlight %}

This is all cool but it turns out, that the existing DI has some problem though:

- **Internal cache** - Dependencies are served as singletons. Whenever we ask for a service, it is created only once per application lifecycle. Creating factory machinery is quite hairy.
- **Namespace collision** - There can only be one token of a "type" in an application. If we have a car service, and there's a third-party extension that also introduces a service with the same name, we have a problem.
- **Built into the framework** - Angular 1's DI is baked right into the framework. There's no way for us to use it decoupled as a standalone system.

These problems need to be solved in order to take the DI of Angular to the next level.

## Dependency Injection in Angular 2

Before we take a look at actual code, let's first understand the concept behind the new DI in Angular 2. The following graphic illustrates required components in the new DI system:

<img alt="DI in Angular 2" src="/images/di-in-angular2-5.svg" style="margin-top: 3em;">

The DI in Angular 2 basically consists of three things:

- **Injector** - The injector object that exposes APIs to us to create instances of dependencies.
- **Provider** - A provider is like a recipe that tells the injector **how** to create an instance of a dependency. A provider takes a token and maps that to a factory function that creates an object.
- **Dependency** - A dependency is the **type** of which an object should be created.

Okay, now that we have an idea of what the concept looks like, lets see how this is translated to code. We stick with our `Car` class and it's dependencies. Here's how we can use Angular 2's DI to get an instance of `Car`:

{% highlight js %}
import { ReflectiveInjector } from '@angular/core';

var injector = ReflectiveInjector.resolveAndCreate([
  Car,
  Engine,
  Tires,
  Doors
]);
          
var car = injector.get(Car);
{% endhighlight %}

We import `ReflectiveInjector` from Angular 2 which is an injector implementation that exposes some static APIs to create injectors. `resolveAndCreate()` is basically a factory function that creates an injector and takes a list of providers. We'll explore how those classes are supposed to be providers in a second, but for now we focus on `injector.get()`. See how we ask for an instance of `Car` in the last line? How does our injector know, which dependencies need to be created in order to instantiate a car? A look at our `Car` class will explain...

{% highlight js %}
import { Inject } from 'angular2/core';

class Car {
  constructor(
    @Inject(Engine) engine,
    @Inject(Tires) tires,
    @Inject(Doors) doors
  ) {
    ...
  }
}
{% endhighlight %}

We import something called `Inject` from the framework and apply it as decorator to our constructor parameters. If you don't know what decorators are, you might want to read our articles on [the difference between decorators and annotations](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) and how to [write Angular 2 code in ES5](http://blog.thoughtram.io/angular/2015/05/09/writing-angular-2-code-in-es5.html).

The `Inject` decorator attaches meta data to our `Car` class, that is then consumed by the DI system afterwards. So basically what we're doing here, is that we tell the DI that the first constructor parameter should be an instance of type `Engine`, the second of type `Tires` and the third of type `Doors`. We can rewrite this code to TypeScript, which feels a bit more natural:

{% highlight js %}
class Car {
  constructor(engine: Engine, tires: Tires, doors: Doors) {
    ...
  }
}
{% endhighlight %}

Nice, our class declares it's own dependencies and the DI can read that information to instantiate whatever is needed to create an object of `Car`. But how does the injector know **how** to create such an object? This is where the providers come into play. Remember the `resolveAndCreate()` method in which we passed a list of classes?

{% highlight js %}
var injector = ReflectiveInjector.resolveAndCreate([
  Car,
  Engine,
  Tires,
  Doors
]);
{% endhighlight %}

Again, you might wonder how this list of classes is supposed to be a list of providers. Well, it turns out that this is actually a shorthand syntax. If we translate this to the longer, more verbose, syntax, things might become a bit more clear.

{% highlight js %}
var injector = RelfectiveInjector.resolveAndCreate([
  { provide: Car, useClass: Car },
  { provide: Engine, useClass: Engine },
  { provide: Tires, useClass: Tires },
  { provide: Doors, useClass: Doors }
]);
{% endhighlight %}

We have an object with a `provide` property, that maps a **token** to a configuration object. The token can either be a type or a string. If you read those providers now, it's much easier to understand what's happening. We provide an instance of type `Car` via the class `Car`,  type `Engine` via the class `Engine` and so on and so forth. This is the recipe mechanism we were talking about earlier. So with the providers we not only let the injector know which dependencies are used across the application, we also configure how objects of these dependencies are created.

Now the next question comes up: When do we want to use the longer instead of the shorthand syntax? There's no reason to write `{ provide: Foo, useClass: Foo}` if we could just stick with `Foo`, right? Yes, that's correct. That's why we started with the shorthand syntax in the first place. However, the longer syntax enables us to do something very very powerful. Take a look at the next code snippet.

{% highlight js %}
{ provide: Engine, useClass: OtherEngine }
{% endhighlight %}

Right. We can map a token to pretty much what ever we want. Here we're mapping the token `Engine` to the class `OtherEngine`. Which means, when we now ask for an object of type `Engine`, we get an instance of class `OtherEngine`.

This is super powerful, because this allows us not only to prevent name collisions, we can also create a type as interface and bind it to a concrete implementation. In addition to that, we can swap out the actual dependency for a token in a single place without touching any other code.

Angular 2's DI introduces a couple of other provider recipes which we explore in the next section.

## Other provider configurations

Sometimes, we don't want to get an instance of a class, but rather just a single value of something or a factory function where more configuration is needed. That's why the provider mechanism of Angular 2's DI comes with more than just one recipe. Lets take a quick look at them.

**Providing values**

We can provide a simple value using `useValue: value`

{% highlight js %}
{ provide: 'some value', useValue: 'Hello World' }
{% endhighlight %}

This comes in handy when we want to provide simple configuration values.

**Providing aliases**

We can map an alias token to another token like this:

{% highlight js %}
{ provide: Engine, useClass: Engine }
{ provide: V8, useExisting: Engine }
{% endhighlight %}

**Providing factories**

Yes, our beloved factories.

{% highlight js %}
{ 
  provide: Engine,
  useFactory: () => {
    if (IS_V8) {
      return new V8Engine();
    } else {
      return new V6Engine();
    }
  }
}
{% endhighlight %}

Of course, a factory might have its own dependencies. Passing dependencies to factories is as easy as adding a list of tokens to the factory:

{% highlight js %}
{
  provide: Engine,
  useFactory: (car, engine) => {

  },
  deps: [Car, Engine]
}
{% endhighlight %}


## Optional Dependencies

The `@Optional` decorator lets us declare dependencies as optional. This comes in handy if, for example, our application expects a third-party library, and in case it's not available, it can fallback.


{% highlight js %}
class Car {
  constructor(@Optional(jQuery) $) {
    if (!$) {
    // set up fallback
    }
  }
}
{% endhighlight %}

As you can see, Angular 2's DI solves pretty much all issues we have with Angular 1's DI. But there's still one thing we haven't talked about yet. Does the new DI still create singletons? The answer is yes.

## Transient Dependencies and Child Injectors

If we need a transient dependency, something that we want a new instance every time we ask for a dependency, we have two options:

**Factories** can return instances of classes. Those won't be singletons. Note that in the following code we're **creating** a factory.

{% highlight js %}
{ 
  provide: Engine,
  useFactory: () => {
    return () => {
      return new Engine();
    }
  }
}
{% endhighlight %}

We can create a **child injector** using `Injector.resolveAndCreateChild()`. A child injector introduces its own bindings and an instance of an object will be different from the parent injector's instance.

{% highlight js %}
var injector = ReflectiveInjector.resolveAndCreate([Engine]);
var childInjector = injector.resolveAndCreateChild([Engine]);

injector.get(Engine) !== childInjector.get(Engine);
{% endhighlight %}

Child injectors are even more interesting. It turns out that a child injector will look up a token binding on it's parent injector if no binding for the given token is registered on the child injector. The following graphic visualises what happens:

<img style="margin-bottom: 2em;" alt="Child injectors" src="/images/transient-dependencies-4.svg">

The graphic shows three injectors where two of them are child injectors. Each injector gets its own configuration of providers. Now, if we ask the second child injector for an instance of type `Car`, the car object will be created by that child injector. However, the engine will be created by the first child injector and the tires and doors will be created by the outer most parent injector. It kind of works like a prototype chain.

We can even configure the **visibility** of dependencies, and also until where a child injector should look things up. However, this will be covered in another [article](/angular/2015/08/20/host-and-visibility-in-angular-2-dependency-injection.html).

## How is it used in Angular 2 then?

Now that we've learned how the DI in Angular 2 works, you might wonder how it is used in the framework itself. Do we have to create injectors manually when we build Angular 2 components? Luckily, the Angular team spent a lot of energy and time to find a nice API that hides all the injector machinery when building components in Angular 2.

Lets take a look at the following simple Angular 2 component.

{% highlight js %}
@Component({
  selector: 'app',
  template: '<h1>Hello {{name}}!</h1>'
})
class App {
  name = 'World';
}
{% endhighlight %}

Nothing special here. If this is entirely new to you, you might want to read our article on [building a zippy](/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) component in Angular 2. Lets say we want to extend this component by using a `NameService` that is used in the component's constructor. Such a service could look something like this:

{% highlight js %}
class NameService {
  name = 'Pascal';;

  getName() {
    return this.name;
  }
}
{% endhighlight %}

Again, nothing special here. We just create a class. Now, to make it available in our application as an injectable, we need to pass some provider configurations to our application's injector. But how do we do that? We haven't even created one.

To boostrap an application, we define an `NgModule`. The `@NgModule()` decorator creates metadata that can include providers, just like this:

{% highlight js %}
@NgModule({
  imports: [BrowserModule],
  providers: [NameService],
  declarations: [App],
  bootstrap: [App]
})
export class AppModule {}
{% endhighlight %}

That's it. Now, to actually inject it, we just use the tools we've already learned about - `@Inject` decorators.

{% highlight js %}
class App {
  constructor(@Inject(NameService) NameService) {
    this.name = NameService.getName();
  }
}
{% endhighlight %}

Or, if we prefer TypeScript, we can just add type annotations to our constructor:

{% highlight js %}
class App {
  constructor(NameService: NameService) {
    this.name = NameService.getName();
  }
}
{% endhighlight %}

Awesome! All of a sudden, we don't have any Angular machinery at all anymore. But there's one last thing: What if we want a different binding configuration in a specific component?

Lets say we have `NameService` as application wide injectable for the type `NameService`, but one particular component should get a different one? This is where the `@Component` decorators' `providers` property comes in. It allows us to add providers to a specific component (and its child components).

{% highlight js %}
{% raw %}
@Component({
  selector: 'app',
  providers: [
    {provide: NameService, useValue: 'Thomas' }
  ],
  template: '<h1>Hello {{name}}!</h1>'
})
class App {
  ...
}
{% endraw %}
{% endhighlight %}

To make things clear: `providers` doesn't configure the instances that will be injected. It configures a child injector that is created for that component. As mentioned earlier, we can also configure the visibility of our bindings, to be even more specific which component can inject what. E.g. the `viewProviders` property allows to make dependencies only available to a component's view, but not its children. <s>We're going to cover that in another article.</s> Dependency injection host and visibility are covered in [this article](/angular/2015/08/20/host-and-visibility-in-angular-2-dependency-injection.html).

## Conclusion

The new dependency injection system in Angular solves all the problems that we have with the current DI in Angular 1. No name collisions anymore. It's an isolated component of the framework that can be used as standalone system, without Angular 2 itself.

I gave a talk about that topic at [JSConf Budapest 2015](http://jsconfbp.com), <s>you can find the slides <a href="http://pascalprecht.github.io/slides/dependency-injection-for-future-generations/">here</a></s>. An updated version of the slide deck is [here](http://pascalprecht.github.io/slides/di-in-angular-2/#/). I would like to thank [Merrick](http://twitter.com/iammerrick) for letting me use some ideas of his talk at ng-vegas, and [Vojta](http://twitter.com/vojtajina) who built the original version of the new dependency injection system for Angular 2.

Check out the demos below!
