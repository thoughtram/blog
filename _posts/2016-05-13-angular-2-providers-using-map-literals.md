---
layout: post
title: Angular Providers using Map Literals
date: 2016-05-13T00:00:00.000Z
update_date: 2016-12-18T00:00:00.000Z
imageUrl: /images/banner/angular-2-providers-using-map-literals.png
summary: >-
  Angular has a shorter syntax for creating providers. In this article we're
  going to take a look at how to create them using map literals.
categories:
  - angular
tags:
  - angular2
  - di
topic: di
author: pascal_precht
related_posts:
  - How to prevent name collisions in Angular providers
  - A web animations deep dive with Angular
  - Custom themes with Angular Material
  - Angular Master Class - Redux and ngrx
  - Three things you didn't know about the AsyncPipe
  - Using Zones in Angular for better performance
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

ng-conf happened just one week ago and there were many announcements about all things Angular. While this is good, sometimes these big announcements cause smaller features to remain unseen, because nobody really talks about them. That's why we want to discuss providers using Map literals in this article, which is basically a new way of defining providers that landed just recently in the code base.

## Provider recap

So what is it all about? Well, if you've read our articles on [Dependency Injection in Angular](/angular/2015/05/18/dependency-injection-in-angular-2.html), you know that an injector needs something called a provider, that knows how to create an object of a certain type, or for a specific token.

In other words, if we ask for a service dependency in one of our components like this:

{% highlight js %}
{% raw %}
import { Component } from '@angular/core';
import { MyService } from './my-service.service';

@Component({
  selector: 'my-component',
  template: '{{myService.sayHello()}}'
})
class MyComponent {

  constructor(private myService: MyService) {}
}
{% endraw %}
{% endhighlight %}

We would run into an error, because even though, we import `MyService` and use that type to annotate our constructor parameter, there's nothing that tells Angular (or the injector) what to do, when someone asks for something of that type. Of course, Angular could simply automagically call `new` on the given type and that's it, but then there's no way to replace the actual dependency with an object of a different type, or maybe even the way we want to construct a dependency (class vs. factory vs. value).

That's why Angular has the concept of providers, which basically act as a sort of recipe that describe how an object of a certain type is created.

{% highlight js %}
{% raw %}
import { Component } from '@angular/core';
import { MyService } from './my-service.service';
@Component({
  selector: 'my-component',
  template: '{{myService.sayHello()}}',
  providers: [MyService] // creates a provider for MyService
})
class MyComponent {

  constructor(private myService: MyService) {}
}
{% endraw %}
{% endhighlight %}

You might know that adding a provider as shown above is actually a shorthand syntax for developer ergonomics. The same logic can be expressed with this more verbose syntax:

{% highlight js %}
{% raw %}
import { provide } from '@angular/core';

@Component({
  ...
  providers: [
    provide(MyService, { useClass: MyService })
  ]
})
class MyComponent {
  ...
}
{% endraw %}
{% endhighlight %}

This enables us to create objects of different types, or even use completely different ways of constructing objects like using a factory function, or simply injecting a value.

{% highlight js %}
{% raw %}
// creates instance of MyOtherService
provide(MyService, { useClass: MyOtherService })

// uses a factory function to create a dependency
provide(MyService, { useFactory: () => return { foo: 'bar' } })

// injects a simple value
provide(MyService, { useValue: true })
{% endraw %}
{% endhighlight %}

This is already pretty cool and powerful, because we can control what gets injected where in our application, without changing the application code itself.

## Providers using Map Literals

As mentioned earlier, there's a little change that makes the more verbose syntax a bit more ergonomic again. We can now define providers using Map literals. A Map literal, in TypeScript (or JavaScript) is really just an object hash. So instead of using the `provide()` function (which we need to import first), to create a provider, we can configure our providers using simple object structures.

Here's one of our earlier snippets, but this time we use Map literals:

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-component',
  template: '{{myService.sayHello()}}',
  providers: [
    { provide: MyService, useClass: MyOtherService }
  ]
})
class MyComponent {

  constructor(private myService: MyService) {}
}
{% endraw %}
{% endhighlight %}

Keep in mind that this is not a breaking change that has been introduced. It's an additional syntax we can take advantage of. If you're into saving key strokes, you might want to prefer Map literals over `provide()`.
