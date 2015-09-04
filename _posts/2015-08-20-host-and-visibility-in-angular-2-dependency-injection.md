---
layout:     post
title:      "Host and Visibility in Angular 2's Dependency Injection"
relatedLinks:
  -
    title: "Dependency Injection in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html"
  -
    title: "Angular 2 Bits: Unified Dependency Injection"
    url: "http://victorsavkin.com/post/102965317996/angular-2-bits-unified-dependency-injection"
  -
    title: "The difference between Annotations and Decorators"
    url: "http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html"
  -
    title: "View Encapsulation in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/06/29/shadow-dom-strategies-in-angular2.html"
date:       2015-08-20
update_date: 2015-08-20
summary:    "One of our articles discussed the concepts and ideas behind the dependency injection pattern, and also, how that pattern is implemented in the Angular 2 framework. We covered what injector bindings are and how those relate to actual dependency instances. Even though this article gave us a very good picture of what is going on, there's still one topic unexplored: Visibility."

categories: 
  - angular

tags:
  - angular2

topic: di

author: pascal_precht
---

In our article on [Dependency Injection in Angular 2](http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html) we explored what dependency injection actually is, and how it is implemented in the Angular 2 framework. If you haven't read that article yet, I highly recommend you doing so, since this article is based on it.

Even though we learned that Angular 2's new dependency injection is very flexible and solves pretty much all the problems we have with the dependency injection in AngularJS, there are still a couple of topics that we haven't discussed yet. One of them is how Angular treats the relationship between **host** and child injectors, and the other one is how the **visibility of dependencies** are handled. In this article we're going to explore exactly these two topics.

## Understanding host relationships

Host and visibility are both features in Angular 2's dependency injection system, that are very specific to Angular and throughout this article we'll learn why. For now just keep in mind that we probably don't need any of these features when using Angular 2's DI not in the context of Angular itself. However, once we understood the context and why this feature exist, we'll also take a look at how this is implemented under the hood, so we all know what's going on.

Let's start off by imagining the following scenario. We have three nested components that all do their own thing (because that's what components do in Angular 2):

{% highlight html %}
{% raw %}
<component-one>
  <component-two>
    <component-three></component-three>
  </component-two>
</component-one>
{% endraw %}
{% endhighlight %}

As we learned in our article on dependency injection in Angular 2, each component in Angular creates it's own injector. Which means the code above can be translated to something like this:

{% highlight sh %}
{% raw %}
injector (<component-one>)
      ^
      |
child injector (<component-two>)
      ^
      |
grand child injector (<component-three>)
{% endraw %}
{% endhighlight %}

The `^` symbol just signalises that a child injector is created from it's parent. To come back to our nice and cozy JavaScript world, we could also translate it to this:

{% highlight js %}
{% raw %}
var injector = Injector.resolveAndCreate();
var childInjector = injector.resolveAndCreateChild();
var grandChildInjector = childInjector.resolveAndCreateChild();
{% endraw %}
{% endhighlight %}

Of course, this code is very simplified and as we can see, there are also no bindings passed to any of the injectors. Usually, when injectors are created, there are bindings passed to them so we can ask for specific dependencies in our code. Let's add some actual bindings, to see how the relationships between the injectors affect dependency instantiation.

{% highlight js %}
{% raw %}
var injector = Injector.resolveAndCreate([
  bind(Car).toClass(Car),
  bind(Engine).toClass(Engine)
]);
var childInjector = injector.resolveAndCreateChild();
var grandChildInjector = childInjector.resolveAndCreateChild([
  bind(Car).toClass(Convertible)
]);
{% endraw %}
{% endhighlight %}

The injector tree allows us to define injector bindings for a specific component and it's children. With the code above, if we ask `grandChild` for a dependency of type `Car` we'll get back an instance of type `Convertible`, because it defines it's own binding for that type. However, if we ask for a dependency of type `Engine`, we simply get an instance of the class `Engine`, because `grandChild` will ask it's parent injector (recursively) until an injector has bindings defined for that type. If this is entirely new to you, all this has been covered in our last [article](http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html) on DI.

Okay, this sounds all very powerful but where does this host thing come into play? Let's get back to the original code with our three nested components. `<component-two>` and `<component-three>` are both children of `<component-one>`. However, we don't know yet what's inside of our components themselves. In Angular 2, a component always has a view. A component's view can be in a way [encapsulated](http://blog.thoughtram.io/angular/2015/06/29/shadow-dom-strategies-in-angular2.html), this is due to the fact that Angular 2 supports Shadow DOM.

For example, here's what the view of `<component-one>` could look like:

{% highlight html %}
{% raw %}
<h1>Component 1</h1>

<ng-content></ng-content>
{% endraw %}
{% endhighlight %}

As we can see, the view of a component is just yet another DOM tree. If we configure Angular 2 accordingly, this DOM tree can be Shadow DOM. That's also why we have an `<ng-content>` tag there. It's Angular's implementation of **content insertion points**, which is another Shadow DOM feature.

Even though we don't use Shadow DOM, a component still comes with it's own view that is kind of hidden behind the component itself. This is what makes every component in Angular a **host** of a view. In fact, when speaking just about Shadow DOM, we always need a host element to create a shadow dom for it.

**Okay, but how is that related to DI?**

That's a good question! We've now seen a couple of times that an injector is always looking up a dependency on it's parent injector in case it doesn't have bindings for the requested type. That parent injector does pretty much the same until we finally get our dependency. When we think in components, that means that a component's injector will lookup up a dependency even across boundaries.

To make things a bit more clear, let's say we have a component `<video-player>` which comes with the following view.

{% highlight html %}
{% raw %}
<video-screen></video-screen>
<video-controls>
  <play-button></play-button>
  <pause-button></pause-button>
</video-controls>
{% endraw %}
{% endhighlight %}

Our `<video-player>` component consists of a couple of other components. Let's say that the injector of `<video-player>` comes with bindings for a `PlayerService`:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'video-player',
  bindings: [
    PlayerService // shorthand for bind(PlayerService).toClass(PlayerService)
  ]
})
@View({ ... })
class VideoPlayer {
  ...
}
{% endraw %}
{% endhighlight %}

`PlayerService` is used by the component's view components (`<play-button>`, `<pause-button>`), to play and pause a video respectively. In order to get an instance of `PlayerService`, we'd need to inject it like this:

{% highlight javascript %}
{% raw %}
@Component({ ... })
@View({ ... })
class PlayButton {
  constructor(playerService: PlayerService) {

  }
}
{% endraw %}
{% endhighlight %}

Since we have bindings for `PlayerService` defined in `VideoPlayer`, it's injector will return an instance accordingly and everything works as expected, even if `<play-button>` doesn't know anything about these bindings. However, in case `VideoPlayer` wouldn't define these bindings, the lookup will go on and on (even outside the `<video-player>` component) until either some other component has such a binding, or an error is thrown.

This can be problematic. Just imagine someone uses our code with another `<awesome-player>` component instead, and it doesn't provide the binding. Our code could end up getting an instance of `PlayerService` that it actually shouldn't get. What we need is a way to somehow make sure, that we always get an instance of `PlayerService` provided by the host video component (wether it's `<video-player>`, `<awesome-player>` or anything else).

## Restricting dependency lookup

Luckily, this is covered by Angular 2's dependency injection system. If we need to ask for a dependency and want to make sure that the lookup ends with the current component's host, we can use the `@Host` decorator. Here's our `<play-button>` component rewritten with the lookup constraint:

{% highlight javascript %}
{% raw %}
@Component({ ... })
@View({ ... })
class PlayButton {
  constructor(@Host() playerService: PlayerService) {

  }
}
{% endraw %}
{% endhighlight %}

If you don't know what it's about with these decorators, you might want to read our article on [annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html). Now we ensured that `PlayerService` instance is always instatiated by our component's host, which is currently our `VideoPlayer` component.

## Dependency Visibility

Okay cool, we now know what `@Host` is and why we need it. But we didn't talk about the other thing that Angular 2's DI introduces yet - dependency visibility. So what is this visibility we're talking about here? Well, as we learned, we can use the `bindings` property in a `@Component` decorator to define bindings for it's injector. However, it turns out that there's another property `viewBindings` that basically allows us to do the same thing. What's the difference between those two then?

`viewBindings` allows us to define injector bindings that are only available for a component's view. Let's take a closer look at what that means by using our `<video-player>` component. Our `<video-player>` component has it's own view with it's own components. So usually, we would use that component just like this:

{% highlight html %}
{% raw %}
<video-player><video-player>
{% endraw %}
{% endhighlight %}

But let's imagine, we change the API and `<video-player>` expects a child element, that implements a video component (whatever that looks like). So we go ahead an build a `<custom-video>` component that does exactly that and we use it as a child of `<video-player>` so it can do it's job with it:

{% highlight html %}
{% raw %}
<video-player>
  <custom-video></custom-video>
</video-player>
{% endraw %}
{% endhighlight %}

Now `<video-player>` has a child element (with it's own injector) that it needs to work. Note that this child is part of the Light DOM rather than the video player component's Shadow DOM (emulation). Next, we realise that `<custom-video>` needs something of type `VideoService` in order to work correctly, so we inject it accordingly:

{% highlight javascript %}
{% raw %}
@Component({ ... })
@View({ ... })
class CustomVideo {
  constructor(videoService: VideoService) {

  }
}
{% endraw %}
{% endhighlight %}

We know that, if `<custom-video>` ask it's injector for a dependency, the injector will look up the dependency in it's injector tree if it doesn't have a binding for that type, until it gets the requested instance. This is quite cool, but now imagine that `<video-player>` has it's own binding for the type `VideoService`, because it needs a very specific instance for it's view, in order to work:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'video-player',
  bindings: [
    PlayerService,
    bind(VideoService).toClass(SpecificVideoService)
  ]
})
@View({ ... })
class VideoPlayer {
  ...
}
{% endraw %}
{% endhighlight %}

What now happens is, that `<custom-video>` would get an instance of `SpecificVideoService` but it actually needs an instance of `VideoService`. However, due to the lookup that happens in the injector tree, the binding defined in `<video-player>` is the next one that is available. How can we get around that? This is exactly where `viewBindings` come in. With `viewBindings` we can tell the DI system very specifically, which bindings are available to which child injectors (Light DOM or Shadow DOM).

To make our code work as expected, all we have to do is to make the `VideoService` binding of `<video-player>` explicitly available only for it's view:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'video-player',
  bindings: [
    PlayerService
  ],
  viewBindings: [
    bind(VideoService).toClass(SpecificVideoService)
  ]
})
@View({ ... })
class VideoPlayer {
  ...
}
{% endraw %}
{% endhighlight %}

Now, whenever a component of `<video-player>`'s view asks for something of type `VideoService`, it'll get an instance of `SpecificVideoService` as expected. Other child components from the outside world that ask for the same type however, won't see this binding and will continue with the lookup in the injector tree. Which means `<custom-video>` now gets an expected instance from another parent injector without even knowing that `<video-player>` actually introduces it's own binding.

**View bindings are also only available in components**, not in directives. That's simply because a directive doesn't have it's own view.

## Conclusion

Angular 2's DI is very powerful and doesn't only cover the common needs when it comes to a decent dependency injection system. It even implements specific use cases for injector trees that are used in conjunction with DOM trees, which could also be encapsulated. I hope this article made clear why we have `bindings`, `viewBindings` and `@Host`.
