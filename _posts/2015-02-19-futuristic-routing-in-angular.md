---
layout:     post
title:      "Futuristic Routing in Angular"
relatedLinks:
  -
    title: "Routing in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/06/16/routing-in-angular-2.html"
date:       2015-02-19
summary:    "A few months ago the Angular team announced that there's going to be a completely new router component in one of the future Angular releases. In fact, the new router is being implemented for Angular 2.0 and was planned to be back ported for the 1.3 release. Unfortunately, it turned out that it takes a bit more effort to make the same powerful router available for both development branches based on the same code base, so the team decided to postpone the back port of the new router to the next bigger 1.4 release. In this article we discuss the new router APIs and how it's going to change the way we implement component based routing in our Angular applications."

isExploringAngular13Article: false

categories: 
- angularjs

tags:
  - angular

author: pascal_precht
---

One of the latest announcements that counts as the most exciting ones, is that the Angular team implements a completely new router for the 2.0 release that is much more flexible and powerful than the original one. Especially, when it comes to more complex application structures. [Rob Eisenberg](http://twitter.com/EisenbergEffect), creator of the recently announced [aurelia](http://aurelia.io) framework, gave an introduction talk on the new router at last years [ngEurope](http://ng-europe.org) conference and showed us the main concepts that make this router so much better.

It got even better, when the team announced that they plan to back port the new router to the 1.x branch of the Angular framework and having it ready in time for the 1.3 release. Unfortunately it turned out, that it took a bit more effort to make the new router available for both projects, especially considering that both should share as much code as possible. <s>That's why the back port has been postponed to the next bigger 1.4 release, which is targeted to be ready in March, this year (yay!)</s> The router also didn't make it into the 1.4 release.

That's right, at the time of writing this article, the new router hasn't been released yet. However, since we're following the latest developments of all Angular 2.0 related projects actively on GitHub, we can't wait to share our thoughts on the new router with you. In this article we explore the new router and discuss it's concepts and features that we've all been waiting for!

## The Routing we know

Before we start off showing what the new router is going to look like, let's recap what kind of routing Angular comes with. The Angular source tries to be as modular as possible. Code components, that aren't necessary to get an Angular application running, but provide nice additional functionality that might be needed, are sliced into their own modules.

And so is the basic Angular router. It's implemented in the `ngRoute` module and can easily be installed through package managers like npm. Once installed, we can add it as module dependency to our application like so:

{% highlight js %}
var app = angular.module('myApp', ['ngRoute']);
{% endhighlight %}

In order to configure routes for our application, we use the `$routeProvider` that we can access in our app's config phase. `$routeProvider` comes with methods like `.when()` and `.otherwise()` to define which route maps to which controller and template. Here's a quick example:

{% highlight js %}
app.config(function ($routeProvider) {
  $routeProvider
    .when('/welcome', {
      template: 'welcome.html',
      controller: 'WelcomeController'
    })
    .otherwise('/welcome');
});
{% endhighlight %}

We can see very nicely that the route `/welcome` maps to the controller `WelcomeController` and the template `welcome.html`. In addition, if at runtime a route is given that is not covered by any `.when()` configuration, the app defaults to `/welcome` route, that's what `.otherwise()` is for.

If we have some additional dependencies that should be resolved before a route's controller is instantiated, we can do that with the `resolve` property, which is an object literal that maps each member to a promise that either resolves or rejects later at runtime. These resolved dependencies are available to be injected in the controller instance. In order to instantiate the route's controller, all specified promises need to resolve. If only one promise gets rejected, the route change is cancelled since the corresponding controller can't be instantiated.

Here's an example where a promise needs to be resolved first, before a controller can be instantiated:

{% highlight js %}
app.config(function ($routeProvider) {
  $routeProvider
    .when('/welcome', {
      template: 'welcome.html',
      controller: 'WelcomeController',
      resolve: {
        person: function (WelcomeService) {
          return WelcomeService.getPerson(); // returns a promise
        }
      }
    })
    .otherwise('/welcome');
});

app.controller('WelcomeController', function (person) {
  // do something with person
});
{% endhighlight %}

If you're not familiar with promises we've written an [article](http://blog.thoughtram.io/angularjs/2014/12/18/exploring-angular-1.3-es6-style-promises.html) that gives a brief introduction. Also, if this `resolve` property looks completely new to you we recommend reading the [official docs](https://docs.angularjs.org/api/ngRoute/provider/$routeProvider).

Let's take a quick look at our main template to see where our route templates are loaded and rendered.

{% highlight html %}
<div ng-view></div>
{% endhighlight %}

That's it. One single entry point where, depending on our route, a template is loaded and it's corresponding controller is instantiated. And here we already see the first weak points of Angular's built-in routing implementation. The basic routing we get so far is just a simple URL to controller/template mapping. There's no way to have sibling or nested components.

Since `ngRoute` lacks such advanced routing features, the community has built their own router component, that solves all these problems - [ui-router](http://github.com/angular-ui/ui-router).

But of course, the Angular team is listening. And that's why they implement a new more powerful router that is available for both, the `1.x` as well as the `2.x` branch.

## Introducing the new router

You might have seen that Christoph and I gave a talk on "[The Best Angular Yet!](http://thoughtram.io/the-best-angular-yet)" at Amsterdam's Angular conference [NG-NL](http://ng-nl.org). There we already gave a little sneak peak on what the new router will look like. At the time of writing this article and giving that presentation, the router was still in development, so things might have changed over time but we try to keep this article updated.

The new router will be quite different. One of it's main goals is that it works for both Angular `2.x` and Angular `>=1.4`. That means, both need to share as much code as possible, since Angular 2 is written in AtScript. There are a couple more differences but we are going to take a look at them step by step.

We can install the new router via npm by running the following shell command:

{% highlight sh %}
$ npm install angular-new-router
{% endhighlight %}

Once installed we can take a look at `node_modules/angular-new-router/dist/` and see that there are two versions of the router source - `router.es5.js` and `router.js`. The former one is an "angularfied" version of the router. So it's basically the router code in ECMAScript 5 plus some additional Angular 1 specific components like service provider and directives. The latter one is the compiled AtScript code as AMD module so it can be used in other applications as well.

Currently we are interested in the Angular 1 components, so what we need to do is to embed `router.es5.js` and add the new router module as dependency to our application like this:

{% highlight javascript %}
var app = angular.module('myApp', ['ngComponentRouter']);
{% endhighlight %}

Great! Next up: configuration. Here we're going to encouter the first big difference when using the new router. As we know, in Angular 1 we have this `.config()` phase where we have access to service providers in order to configure services that are used later at runtime. That's why we can use the `$routeProvider` of `ngRoute` to configure our routes.

However, it turned out that there are a lot of problems with having a separation between configuration and run phases, which is why there won't be such a thing in Angular 2. And so there isn't in the new router. Now you might wonder how we are able to configure our routes with the new router, if there's no provider that we can access during our application's `.config()`.

Well, let's take a look at some code.

{% highlight javascript %}
app.controller('AppController', function ($router) {
  $router.config([
    {
      path: '/',
      component: 'welcome'
    }
  ]);
});
{% endhighlight %}

Oh what's happening here? All we do is creating a new controller that asks for the `$router` service, which we use to configure itself. The configuration is pretty straight forward. We use `$router.config()` and pass it an array with configuration objects that each have a property `path` to set the route and a property `component` that sets the name of the component to be instantiated.

We're going to talk about what a component actually is in a second, but let's first take a look at our template. So let's assume we have an HTML document, this is what our application could look like:

{% highlight html %}
<body ng-app="myApp" ng-controller="AppController">
  <ng-outlet></ng-outlet>
</body>
{% endhighlight %}

Right, there's no `<ng-view>` anymore. Instead the new router comes with a directive called `<ng-outlet>` which can also be used as an attribute in case it's needed. An outlet basically is a "hole" where component templates are loaded into. So the above code in it's current state is pretty much the same as using `<ng-view>` with the old routing system.

But what gets loaded into our outlet you ask? Good question! This is where components come into play. When we configured the router, we said that the route `/` loads and instantiates the `welcome` component. But we haven't talked about what the `welcome` component actually is.

**A component** in Angular 1, when using the new router, **is a controller with a template and an optional router** for that component. So if we say we have a `welcome` component, we need to create a corresponding controller and template for it. In fact, the new router already comes with a default configuration to load and instantiate components. This configuration behaves as follows:

- Load the component template asynchronously from `components/[COMPONENT_NAME]/[COMPONENT_NAME].html`
- Instantiate `[COMPONENT_NAME]Controller`

Applying this to our configuration, it means that the router automatically tries to load `components/welcome/welcome.html` and instantiate `WelcomeController`.

If we're not okay with that configuration, we can simply override this default behaviour by using the `$componentMapperProvider` in our application configuration. It provides us with methods to configure the names of controllers to be instantiated as well as the paths from where to load component templates.

The following code forces the router to load `[COMPONENT_NAME].html` instead of `components/[COMPONENT_NAME]/[COMPONENT_NAME].html`:

{% highlight javascript %}
app.config(function ($componentMapperProvider) {
  $componentMapperProvider.setTemplateMapping(function (name) {
    // name == component name
    return name + '.html';
  });
});
{% endhighlight %}


Let's create `WelcomeController` (for simplicity reasons I define the controller directly on `app` rather than introducing a new module for that component, but you can do that of course).

{% highlight javascript %}
app.controller('WelcomeController', function () {

});
{% endhighlight %}

And here the corresponding template `welcome.html`:

{% highlight html %}
<h1>Welcome!</h1>
{% endhighlight %}

The component is now ready to be loaded and instantiated. Let's see the code in action:

<iframe src="http://embed.plnkr.co/uc2RuLRa1aYmRI2THRcO/preview"></iframe>

## Adding behaviour to components

Now we have a component with a controller that doesn't do anything. Adding behaviour to our component works the way we are used to it. We simply define methods and properties on a component's controller.

Just keep in mind that the new router enforces `controller as` syntax, which means we have to define our methods and properties on the controller itself instead of `$scope`. The controller is then exposed with the component name on the scope, which leads us to use `welcome` as controller reference in our template.

As an example let's add a property and method to our `WelcomeController`:

{% highlight javascript %}
app.controller('WelcomeController', function () {
  this.name = 'Pascal';

  this.changeName = function () {
    this.name = 'Christoph';
  };
});
{% endhighlight %}

In our component template, we can access the controller properties via the `welcome` identifier like this:

{% highlight html %}
{% raw %}
<h1>Welcome!</h1>
<p>Hello {{welcome.name}}</p>
<button ng-click="welcome.changeName()">Change Name!</button>
{% endraw %}
{% endhighlight %}

If you're not familiar with the `controller as` syntax. you might want to check out our article on [Binding to Directive Controllers](http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html). Here's our updated example as runnable app:

<iframe src="http://embed.plnkr.co/ie9d2F/preview"></iframe>

## Linking to other components

In order to have a very easy way to navigate from one component to another, the `ngComponentRouter` module comes with a `routerLink` directive that we can use to tell our application, where to navigate. Let's say we have another component `user`, we'd extend our application with a new configuration for that component.

{% highlight javascript %}
app.controller('AppController', function ($router) {
  $router.config([
    {
      path: '/',
      component: 'welcome'
    },
    {
      path: '/user',
      component: 'user'
    }
  ]);
});
{% endhighlight %}

And as we've learned, we also need a corresponding controller and template to actually assemble our component. Here's our `UserController`:

{% highlight javascript %}
app.controller('UserController', function () {

});
{% endhighlight %}

And here's the template `user.html`.

{% highlight html %}
{% raw %}
<h1>User</h1>
{% endraw %}
{% endhighlight %}

Now, in order to get there from our `welcome` component, all we have to do is to add an anchor tag to our `welcome` component template and us the `routerLink` directive accordingly.

{% highlight html %}
{% raw %}
<h1>Welcome!</h1>
<p>Hello {{welcome.name}}</p>
<button ng-click="welcome.changeName()">Change Name!</button>
<p><a ng-link="user">User View</a></p>
{% endraw %}
{% endhighlight %}

As you can see, we don't have to set an `href` attribute, since `routerLink` takes care of that. The directive itself takes a component name to navigate to once the link is clicked, which in our case is `user`. Again, here the running code:

<iframe src="http://embed.plnkr.co/dds8KE/preview"></iframe>

## Linking with dynamic parameters

Of course, just navigating to a component in some cases isn't enough. We might have routes that take some additional parameters in order to post process that data accordingly. Our `user` component doesn't do anything right now, but we might want to display some data of a certain user depending on a given user id.

Configuring a route that expects query parameters works pretty similar to what we already know when doing that with the original router. We can define placeholders in our route definition by using the `:` symbol followed by an identifer that is used to later expose the value of that placeholder in a dedicated `$routeParams` service.

To get a better idea, here's our updated route configuration that takes an additional user id parameter:

{% highlight javascript %}
app.controller('AppController', function ($router) {
  $router.config([
    {
      path: '/',
      component: 'welcome'
    },
    {
      path: '/user/:userId',
      component: 'user'
    }
  ]);
});
{% endhighlight %}

Simple right? As already mentioned, query parameter are exposed on the `$routeParams` service as simple hash. Which means, in order to access a given user id from that route, all we have to do is to inject `$routeParams` into our component's controller and ask for the paramters we're looking for.

{% highlight javascript %}
app.controller('UserController', function ($routeParams) {
  this.userId = $routeParams.userId;
});
{% endhighlight %}

Okay cool. But how do we **link** to a component that takes parameters? We've learned that `ngComponentRouter` comes with a `routerLink` directive that takes a component name. It turns out, we can set parameters, for a route we want to navigate to, with that directive too! All we need to do is to pass a hash literal to specify the values. Here's our updated `welcome` component template:

{% highlight html %}
{% raw %}
<h1>Welcome!</h1>
<p>Hello {{welcome.name}}</p>
<button ng-click="welcome.changeName()">Change Name!</button>
<p><a ng-link="user({ userId: 3 })">User View</a></p>
{% endraw %}
{% endhighlight %}

You can see it in action right here:

<iframe src="http://embed.plnkr.co/2C40t4/preview"></iframe>

## Sibling Components

What we've done so far is not a very complex scenario, nor does it show the advantage over Angular's basic routing with `ngRoute`. There are other scenarios where the power of the new router really shines. One of them is being able to have sibling components per route. Exactly, we're finally able to load more than one component at a time!

Imagine, when a user visits our app, we not only want to have a `welcome` component be loaded, we want to spin up another component for our navigation as well. So we end up with two components at the same time for one single route - `navigation` and `welcome`. We can configure our `$router` accordingly by specifying a `components` property which describes what components should be loaded for which outlet. Let's see how that works.

{% highlight javascript %}
app.controller('AppController', function ($router) {
  $router.config([
    {
      path: '/',
      components: {
        navigation: 'navigation',
        main: 'welcome'
      }
    }
  ]);
});
{% endhighlight %}

Here we see that we expect *two* outlets `navigation` and `main` and we say that we want to load the `navigation` and `welcome` component respectively. Of course, we now need a `NavigationController` and `navigation.html` to make this work. Here's a simple controller with an even simpler template:

{% highlight javascript %}
app.controller('NavigationController', function () {

});
{% endhighlight %}

{% highlight html %}
<h2>Navigation</h2>
<p>Yay, navigation goes here.</p>
{% endhighlight %}

Now we need to decide, *where* our components are actually rendered. We've learned that a component has outlets, in fact, a component can have multiple outlets. In our router configuration we said we have an outlet `navigation` and `main`. All we need to do is to use the `<ng-outlet>` directive multiple times and give them the names accordingly.

Here's our updated `index.html` that now introduces two outlets, one for each component specified in the router configuration:

{% highlight html %}
<body ng-app="myApp" ng-controller="AppController">
  <nav ng-outlet="navigation"></nav>

  <main ng-outlet="main"></main>
</body>
{% endhighlight %}

That's it! Running this code in the browser shows that now two sibling components are loaded for one route.

## So much more to talk about

Following the development on the new router and also actively contributing to it, there've been a couple of questions popping up that we haven't covered in this article yet. In fact, most of them aren't answered yet but you can follow them on GitHub since we've created issues accordingly. To give you an idea of what questions we are talking about, we've asked ourself for example if a [component can have it's own sub components and outlets](https://github.com/angular/router/issues/117) or [how to link to routes that have multiple outlets](https://github.com/angular/router/issues/118).

We also haven't talked about nested routing and or if there's a [`resolve` equivalent](https://github.com/angular/router/issues/100) in the new router, but once we have answers to all these questions, we either going to update this article or write separate ones that cover each topic isolated.

In the meantime check out the official [repository](http://github.com/angular/router) or take a look at the [online documentation](http://angular.github.io/router/). Don't forget to contribute, we always need your help!
