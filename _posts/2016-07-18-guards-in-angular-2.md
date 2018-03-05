---
layout: post
title: Protecting Routes using Guards in Angular
imageUrl: /images/banner/protecting-routes-using-guards-in-angular-2.jpg
date: 2016-07-18T00:00:00.000Z
update_date: 2016-12-18T00:00:00.000Z
summary: >-
  Angular's router enables protecting routes using guards and in this article
  we're going to discuss how to implement them.
categories:
  - angular
tags:
  - angular2
  - routing
videos:
  - url: 'http://casts.thoughtram.io/embedded/175218351'
    title: Guards in Angular 2
topic: routing
author: pascal_precht
related_posts:
  - Futuristic Routing in Angular
  - Resolving route data in Angular
  - Routing in Angular revisited
  - Routing in Angular
  - Advanced caching with RxJS
  - Custom Overlays with Angular's CDK - Part 2
related_videos:
  - '175218351'
  - '189618526'
  - '189613148'
  - '189603515'
  - '175255006'
  - '193524896'

---

In our last article, [Routing in Angular revisited](/angular/2016/06/14/routing-in-angular-2-revisited.html), we talked about the latest changes in the router APIs. While we covered how to set up basic routes, access parameters and link to other components, we haven't really talked about more sophisticated use cases like protecting routes.

Protecting routes is a very common task when building applications, as we want to prevent our users from accessing areas that they're not allowed to access, or, we might want to ask them for confirmation when leaving a certain area. Angular's router provides a feature called **Navigation Guards** that try to solve exactly that problem. In this article, we'd like to take a look at the different types of guards and how to implement them for actual use cases.

{% include demos-and-videos-buttons.html post=page %}

## Guard Types

There are four different guard types we can use to protect our routes:

- **CanActivate** - Decides if a route can be activated
- **CanActivateChild** - Decides if children routes of a route can be activated
- **CanDeactivate** - Decides if a route can be deactivated
- **CanLoad** - Decides if a module can be loaded lazily

Depending on what we want to do, we might need to implement one or the other guard. In some cases, we even need to implement all of them. Let's take a look at how to define guards.

## Defining Guards

Guards can be implemented in different ways, but after all it really boils down to a function that returns either `Observable<boolean>`, `Promise<boolean>` or `boolean`. In addition, guards are registered using providers, so they can be injected by Angular when needed.

### As Functions

To register a guard we need to define a token and the guard function. Here's what a super simple guard implementation could look like:

{% highlight js %}
{% raw %}
@NgModule({
  ...
  providers: [
    provide: 'CanAlwaysActivateGuard',
    useValue: () => {
      return true;
    }
  ],
  ...
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

As we can see, it's really just a provider with some made up token that resolves to a guard function that returns `true` (if `provider` doesn't mean anything to you, go and check out our article on [Dependency Injection in Angular](/angular/2015/05/18/dependency-injection-in-angular-2.html)). Since it's always returning `true`, this guard is not protecting anything, as it will always activate the route that uses it. However, this is really just to demonstrate a guard implementation. We also notice that we're using a string token, which works fine but what we really want is an [`OpaqueToken`](/angular/2016/05/23/opaque-tokens-in-angular-2.html) to not run into name collisions.

Once a guard is registered with a token, we can use it in our route configuration. The following route configuration has the `CanAlwaysActivateGuard` attached, which gets executed when routing to that specific route.


{% highlight js %}
{% raw %}
export const AppRoutes:RouterConfig = [
  { 
    path: '',
    component: SomeComponent,
    canActivate: ['CanAlwaysActivateGuard']
  }
];
{% endraw %}
{% endhighlight %}

As we can see, all we need to do is to define a list of guard tokens that should be called. This also implies that we can have multiple guards protecting a single route. Guards are executed in the order they are defined on the route.

### As Classes

Sometimes, a guard needs dependency injection capabilities. In these cases, it makes sense to define a guard as a class, because dependencies can then be simply injected. Let's say we want to protect a route and have the user authenticate first. We might want to inject an `AuthService` to determine if the user is authenticated or not. A class guard would be a perfect fit.

When creating a guard class, we implement either the `CanActivate`, `CanDeactivate`, or `CanActivateChild` interface, which requires us to have a method `canActivate()`, `canActivateChild()`, or `canDeactivate()` respectively. Those methods are pretty much the equivalent of a guard function in the previous scenario. The following snippet shows a simple `CanActivate` guard implementation using classes.


{% highlight js %}
{% raw %}
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class CanActivateViaAuthGuard implements CanActivate {

  constructor(private authService: AuthService) {}

  canActivate() {
    return this.authService.isLoggedIn();
  }
}
{% endraw %}
{% endhighlight %}

Pretty straight forward. An [injectable class](/angular/2015/09/17/resolve-service-dependencies-in-angular-2.html) with a `canActivate()` method that now has access to injected dependencies. Angular will call that method for us when a guard is implemented as a class. Just like the previous guard, this one needs to be registered as a provider:

{% highlight js %}
{% raw %}
@NgModule({
  ...
  providers: [
    AuthService,
    CanActivateViaAuthGuard
  ]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

And can then be used on a route:

{% highlight js %}
{% raw %}
{ 
  path: '',
  component: SomeComponent,
  canActivate: [
    'CanAlwaysActivateGuard',
    CanActivateViaAuthGuard
  ]
}
{% endraw %}
{% endhighlight %}

## Deactivating Routes

We've now seen how `CanActivate` can work in different scenarios, but as mentioned earlier, we have a few more guard interfaces we can take advantage of. `CanDeactivate` gives us a chance to decide if we really want to navigate **away** from a route. This can be very useful, if for example we want to prevent our users from losing unsaved changes when filling out a form and accidently clicking on a button to cancel the process.

The `CanDeactivate` guard also has access to the instance of the active component. With this we can take the user experience even to a higher level. Instead of asking an (unwanted) user confirmation every time, we can do this conditionally by checking if change were made. In the sample below the `CanDeactivateComponent` implements a methods `hasChanges()`. This returns a boolean value indicating if the components has detected any changes. This can be done by checking the dirty state of the form, keeping track of the previous model and compare it with the current one, ... What ever fits your needs. 

Implementing a `CanDeactivate` guard is very similar to implementing a `CanActivate` guard. All we have to do is to create again, either a function, or a class that implements the `CanDeactivate` interface.  We can implement a super simple safety net for our users like this:

{% highlight js %}
{% raw %}
import { CanDeactivate } from '@angular/router';
import { CanDeactivateComponent } from './app/can-deactivate';

export class ConfirmDeactivateGuard implements CanDeactivate<CanDeactivateComponent> {

  canDeactivate(target: CanDeactivateComponent) {
    if(target.hasChanges()){
        return window.confirm('Do you really want to cancel?');
    }
    return true;
  }
}
{% endraw %}
{% endhighlight %}

Even though, this is a very trivial implementation, there's one thing that we didn't see in the previous example. `CanDeactivate<T>` uses a generic, so we need to specify what component type we want to deactivate. Honestly, we're not sure if this is a bug or not. But other than that, it's very clear what's going on here. We implement a method `canDeactivate()`, that is called by Angular's router internally if needed. Last but not least, also this guard needs to be registered accordingly:

{% highlight js %}
{% raw %}
@NgModule({
  ...
  providers: [
    ...
    ConfirmDeactivateGuard
  ]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

## Conclusion

Guards are great. They enable us to protect certain routes or even protect the user from losing data. In addition, we can have multiple guards protecting a single route, which helps us implementing sophisticated use cases, where a chain of different checks is needed.

