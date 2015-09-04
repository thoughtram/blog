---
layout:     post
title:      "Routing in Angular 2"
relatedLinks:
  -
    title: "Futuristic Routing in Angular"
    url: "http://blog.thoughtram.io/angularjs/2015/02/19/futuristic-routing-in-angular.html"
  -
    title: "Dependency Injection in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html"
date:       2015-06-16
update_date: 2015-06-16
summary:    "A couple of months ago, we've written an article about the new router in Angular, how it can be used and how it differs from the standard router. The article mainly covered the usage of using the new router in Angular 1 apps, and has been written at a time where the router was in a very early state. In this article we would like to explore how to use the new router in Angular 2."

categories: 
  - angular

tags:
  - angular2

topic: routing

author: pascal_precht
---

{% include breaking-changes-hint.html %}

If you're following our [articles on Angular](http://blog.thoughtram.io/categories/angular) you might know that, a couple of months ago, [we've written about the new router](http://blog.thoughtram.io/angularjs/2015/02/19/futuristic-routing-in-angular.html), how it can be used, and how it differs from the `ngRoute` standard router. Whereas we mostly touched on using the router in Angular 1 applications, this article discusses how it can be used in Angular 2 applications.

We won't talk about how to get started with Angular 2. We assume that we're all familiar with the installation process and how to bootstrap a small Angular 2 application. If this is entirely new to you, I recommend checking out our articles on [developing a zippy component](http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) or [developing a tabs component](http://blog.thoughtram.io/angular/2015/04/09/developing-a-tabs-component-in-angular-2.html) in Angular 2. Another great starting point is the [starter kit](http://github.com/angular-class/angular2-webpack-starter) by our friends over at [AngularClass](http://angularclass.com).

## Bootstrapping the router

In order to use the new router, we need to import all needed components from the Angular framework and bind them to our component's injector. Note that, even if in this article we're importing straight from Angular, this might change in the future, since the router source has only temporarily been moved to the core.

To avoid additional typing, and also to hide some boilerplate logic, the router module exports a variable `routerInjectables` which contains all injector bindings to get going. To give you an idea of what that looks like, here's a small snippet from the router's source:

{% highlight js %}
export var routerInjectables: List<any> = [
  RouteRegistry,
  Pipeline,
  BrowserLocation,
  Location,
  bind(Router).toFactory((registry, pipeline, location, appRoot) => {
    return new RootRouter(registry, pipeline, location, appRoot);
  },[
    RouteRegistry,
    Pipeline,
    Location,
    appComponentTypeToken
  ])
];
{% endhighlight %}


It's really just a collection of binding declarations. If you see those kind of bindings for the very first time, you might want to read our article on [dependency injection](http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html) in Angular 2. The short version is that each item in this collection describes how to create an object of a specific type when our application asks for an object of that type.

For example the following binding tells the injector to create an instance of `RootRouter` whenever someone asks for an object of type `Router`.

{% highlight js %}
bind(Router).toFactory((registry, pipeline, location, appRoot) => {
  return new RootRouter(registry, pipeline, location, appRoot);
},[
  RouteRegistry,
  Pipeline,
  Location,
  appComponentTypeToken
])
{% endhighlight %}

<i>The router exports a couple of other components that are needed thoughout our application, but we'll cover them later in this article.</i>

Alright, now that we know what `routerInjectables` are, we can import and use them when bootstrapping our application, to make the router components available in our component's dependency injector.

{% highlight js %}
import { bootstrap } from 'angular2/angular2';
import { routerInjectables } from 'angular2/router';

... // App is defined here

bootstrap(App, [routerInjectables]);
{% endhighlight %}

`bootstrap` takes a list of injector bindings as second argument. Those bindings are used when an injector is created. which means, passing `routerInjectables` here basically makes all the bindings application-wide available.

For now we want to implement basic routing with a couple of components. All we need to do is to create a component that has a template with a navigation, and some router specific template logic. Let's start small - here's what our `App` component could look like (without router logic):

{% highlight js %}
...
import { Component, View } from 'angular2/angular2';

@Component({
  selector: 'app'
})
@View({
  template: `
    <nav>
      <ul>
        <li>Start</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
    <main>
      // components go here
    </main>
  `
})
class App {

}
...

{% endhighlight %}

Pretty much an empty component with a template. We also take advantage of decorators, that's why we need to import `Component` and `View`. You can read more about decorators (and also annotations) in our article on [the difference between annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html). Annotations can be used in ES5 code as well. In case this is more interesting to you, [this article](http://blog.thoughtram.io/angular/2015/05/09/writing-angular-2-code-in-es5.html) shows you how.

## Configuring routes

According to our application's template, we seem to have a `Start`, an `About` and a `Contact` component. In order to be able to navigate to those components, we first need to configure the router in our application. As mentioned earlier, next to `routerInjectables`, there are other components that the router module exports. One of them is the `RouteConfig` class which can be used to decorate a component with routing capabilities.

`RouteConfig` takes a collection of route configurations. A route configuration is an object with a `path` and a `component`, so pretty much the same we have in Angular 1 too. Here's what the route configuration for our `Start` component could look like:

{% highlight js %}
...
import { Start } from './components/start';

@RouteConfig([
  { path: '/', component: Start }
])
class App {

}
{% endhighlight %}

Easy right? One small difference compared to the Angular 1 version we see here, is that a component is provided as a class (or constructor function in ES5) instead of a string that represents the name of a component.

That's why we need to import our `Start` component first. Let's take a quick look at what that component looks like:

{% highlight js %}
@Component({
  selector: 'start'
})
@View({
  template: '<h1>Start</h1>'
})
export class Start {

}
{% endhighlight %}

Nothing special here. Let's make sure that our loaded component is actually displayed when the router activates it.

## Displaying the component

In order to display the loaded component in our application, we need to specify the location in our application's template. If you've read our first article on the new router,  you know that there's a directive called `RouterOutlet` that lets us define a place in our template to display the loaded component.

Let's do that. All we need to do is to import the directive, extend our application's `@View` annotation configuration and use the directive in the template:

{% highlight js %}
...
import { RouterOutlet } from 'angular2/router';

@Component({
  selector: 'app'
})
@View({
  directives: [RouterOutlet],
  template: `
    <nav>
      <ul>
        <li>Start</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
class App {

}
...

{% endhighlight %}

**That's it**! Since our route configuration says that `/` is mapped to our `Start` component, we don't have to do anything special for now to activate that component - it is loaded by default.

## Linking to other components

Of course, setting up a single route that is displayed by default, isn't really what we're looking for. Our application can have multiple route configurations and we also want to be able to navigate to each of them. But how can we achieve this? In `ngRoute` we just use normal links with `href` attributes and the module is smart enough to intercept accordingly. In UI-Router, we have a directive `uiSref` that takes a state name or a relative path to navigate to. What does the new router provide?

Well, as you might know, the new router shares a code base for both, the Angular 1 and Angular 2 version. In our last article we explored the `router-link` directive, which allows us to navigate to components. **Guess what, we can use the same in Angular 2**!

In Angular 2, the `RouterLink` directive is exported by the router module. In order to use it, we need to import it first and declare it as directive dependency of our component's template, just like `RouterOutlet`.

{% highlight js %}
...
import { RouterOutlet, RouterLink } from 'angular2/router';

@Component({
  selector: 'app'
})
@View({
  directives: [RouterOutlet, RouterLink],
  ...
})
class App {

}
...

{% endhighlight %}

Awesome, now it can be used in the template. Let's extend our navigation with proper links that make use of `RouterLink`. The directive takes a component name and if the underlying DOM element is an anchor element, it generates a URL based on the component's route configuration, which is then added to it as part of the `href` attribute.


{% highlight html %}
<nav>
  <ul>
    <li><a router-link="start">Start</a></li>
    <li><a router-link="about">About</a></li>
    <li><a router-link="contact">Contact</a></li>
  </ul>
</nav>
{% endhighlight %}

You might wonder, how the directive knows that `"start"` should generate a URL for our `Start` component. In fact, it can't until we extend our router configuration. Next to `path` and `component` there's another configuration property `as` that allows us to expose a router configuration under a given name.

E.g. if we want to use `start` as an "alias" for the route configuration for the `Start` component, we simply have to add the configuration accordingly. While we are at it, we do the same for the other two components, and just assume that we've built them already:

{% highlight js %}
import { Start } from './components/start';
import { About } from './components/about';
import { Contact } from './components/contact';

...

@RouteConfig([
  { path: '/', component: Start, as: 'start'},
  { path: '/about', component: About, as: 'about'},
  { path: '/contact', component: Contact, as: 'contact'},
])
{% endhighlight %}

Now the router actually knows for what to generate URLs when using `RouterLink`. Cool, we can navigate to single components throughout our application, but what if we have components that use more than one `RouterOutlet`?

## Routes with sibling outlets

It's very common to have sibling outlets in a state (or component). In Angular 1, the UI-Router comes with a **very** powerful mechanism to support sibling states. Of course, such a feature is supported in the new component router too. At the time of writing this article, **this feature was still in development and didn't work yet**, but we can still take a look at what the APIs will look like.


Having a component with multiple outlets is easy. Let's say we have a dashboard component component that needs to load a navigation component and a statistics component. First we would of course setup a route config to be able to navigate to the dashboard component.

{% highlight js %}
import { Dashboard } from './components/dashboard';

@RouteConfig([
  { path: '/dashboard', component: Dashboard, as: 'dashboard'}
])
class App {

}
{% endhighlight %}

Alright, nothing new here. Let's jump over to the dashboard component. The dashboard defines two sibling outlets. In order to tell the router what to load into those siblings, we can give them names and reference them to components accordingly in our route configuration. Here' what the configuration of the dashboard component could look like:

{% highlight js %}
import { Navigation } from './components/navigation';
import { Statistics } from './components/statistics';

@RouteConfig([
  {
    path: '/dashboard',
    components: {
      navigation: Navigation,
      statistics: Statistics
    },
    as: 'dashboard'
  }
])
class Dashboard {

}
{% endhighlight %}

<p style="background: #F2AEAE; border-radius: 0.3em; margin-top: 1.4em; padding: 1em; border: #F56B6B 1px solid;"><strong>Attention</strong>: <br>
The <code>components</code> property has been removed as of <a href="https://github.com/angular/angular/issues/2329">#2329</a> but the feature will be reintroduced with a different mechanism.
</p>

Again, `Navigation` and `Statistics` are really just two components that don't even have to know that they are part of a route configuration. We can also see how the `as` property in the route configuration can be nicely used as an alias for component combinations.

## There's so much more coming

This article gives us just a little picture of how the new router can be used in Angular 2 compared to Angular 1. As you can see a lot of things are very similar, **which will surely help when migrating to Angular 2**. Of course, there are more things to cover, like how to deal with nested components and how to do dynamic routing using `Router`. Those things will be part of future articles.
