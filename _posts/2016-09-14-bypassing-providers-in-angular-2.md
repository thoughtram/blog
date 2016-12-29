---
layout: post
title: Bypassing Providers in Angular
imageUrl: /images/banner/bypassing-providers-in-angular-2.jpg
date: 2016-09-14T00:00:00.000Z
update_date: 2016-12-18T00:00:00.000Z
summary: >-
  Dependencies are provided from the nearest ancestor provider in the injector
  tree. This article shows how to bypass it.
categories:
  - angular
tags:
  - angular2
topic: di
demos:
  - url: 'http://embed.plnkr.co/k7FGlm/'
    title: Bypassing Providers
author: pascal_precht
related_posts:
  - Testing Angular Directives with Custom Matchers
  - Testing Services with Http in Angular
  - Two-way Data Binding in Angular
  - Resolving route data in Angular
  - Angular Animations - Foundation Concepts
  - Angular 2 is out - Get started here
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

We covered a lot of different things everything dependency injection in Angular. However, at our latest training, one of our students came up with a very interesting question: 

>> "Can I bypass a provider to get a dependency from another ancestor provider?"

This was then followed by a very interesting, collaborative discussion with the other students, as we all tried to come up with a solution - and it turned out, there **is** a solution. In this article we'd like to quickly demonstrate the problem and then show how we can use one of Angular's provider recipes to solve it in a very elegant way.

{% include demos-and-videos-buttons.html post=page %}

## Understanding the Problem

As discussed in other [articles](/angular/2015/05/18/dependency-injection-in-angular-2.html), dependencies in Angular are singletons inside their injector containers they belong to. If we need multiple dependency instances, we can take advantage of the injector tree, and provide different instances via different providers.

To illustrate what that means, let's take a look at the following figure:

<img src="/images/injector-tree.svg" alt="Injector Tree">

What we see here is a tree of components, which is usually what an application in Angular is composed of. We also see that every component comes with its own injector. This allows us to configure how and what is going to be created when we ask for dependencies, on a component level.

Let's say we have an application where we use a `DataService` to perform actions like fetching data, adding data and deleting data. To make this service injectable,  we need to create a provider for it first.

{% highlight js %}
{% raw %}
class DataService {} // this is usually imported from somewhere

@NgModule({
  ...
  providers: [DataService]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

Once we created the provider, we can ask for dependencies of that type in our components like this:

{% highlight js %}
{% raw %}
@Component()
export class SomeComponent {
  
  constructor(private contactService: DataService) {}
}
{% endraw %}
{% endhighlight %}

In fact, all components in our component tree will now get exactly the same instance, because their injectors will keep looking upwards in the tree for a provider, until they find one.

<img src="/images/injector-tree-2.svg" alt="Injector Tree with Provider">

We can get a different instance of the same service by adding another provider with the same configuration to the injector tree. Providers can be defined on components as well, to configure the corresponding injector.

{% highlight js %}
{% raw %}
@Component({
  ...
  providers: [DataService]
})
export class SomeOtherComponent {}
{% endraw %}
{% endhighlight %}

This will affect the dependency lookup in the sense that all children components and the `SomeOtherComponent` component itself will get the `DataService` instance from `SomeOtherComponent`'s injector, instead of the one configured in the `NgModule`.

<img src="/images/injector-tree-3.svg" alt="Injector Tree with multiple Providers">

As we can see, all components in the left part of the tree get their dependency instance from a different provider than the components in the right part of the tree. Okay cool, nothing new here, this has all been discussed in our guide on [DI in Angular](/angular/2015/05/18/dependency-injection-in-angular-2.html).

However, now we have a problem. What if we **want** to get a dependency instance of the root provider (or just another ancestor), essentially bypassing the nearest provider, even though our component is in the left part of the tree? To illustrate the problem, here another figure:

<img src="/images/injector-tree-4.svg" alt="Injector Tree with bypassed Provider">

With the current setup, both providers use the exact same token, so there's no way for us we can distinguish between the two different dependency instances.

Luckily, Angular comes with a couple more provider strategies (`useValue`, `useFactory`, ...), that define how dependencies are created. One of them is `useExisting`, and we'll now take a look at how it solves our problem.

## Creating alias tokens with `useExisting`

`useExisting` is a bit different than the other provider strategies. It's the only strategy that doesn't actually create an instance, but instead, **it points to another token** which in turn will create the instance.

To give an example, let's say we want to be able to not only use the `DataService` type as a token to ask for the dependency, but also the token `RootDataService`. We can easily do that with the following provider configuration (as always, we can do the same in `@Component` decorators):


{% highlight js %}
{% raw %}
class DataService {} // this is usually imported from somewhere
class RootDataService {} // alias token, also usually imported from somewhere

@NgModule({
  ...
  providers: [
    DataService,
    { provide: RootDataService, useExisting: DataService }
  ]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

What this does is, it tells Angular when someone asks for a dependency for the token `RootDataService`, inject the dependency instance that is created for the token `DataService`. Or in other words, we just created an alias that gives us the exact same instance that we get for the `DataService` token.

We can then go ahead and use the alias token to inject our service instance just like this:

{% highlight js %}
{% raw %}
@Component()
export class SomeComponent {
  
  constructor(private contactService: RootDataService) {}
}
{% endraw %}
{% endhighlight %}

Again, this is the exact same instance. Now, why is this helpful? Well... now that we have two different tokens to get the same instance, it's no longer a problem that another provider in the injector tree "shadows" the provider from our root injector. We can now ask for the dependency instance of `DataService` that is created at the very top of our tree, no matter where we are in the component tree, because the alias token still points to the original instance.

One more thing we could do is to get rid off the class definition `RootDataService`. We only created it so we can use it as a token, other than that, there's no use for it. Luckily, we can also use strings to create tokens, or even better, [we use OpaqueTokens](/angular/2016/05/23/opaque-tokens-in-angular-2.html).

To see things in action, check out the demos below!

