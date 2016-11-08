---
layout: post
title: Resolving route data in Angular 2
imageUrl: /images/banner/resolving-route-data-in-angular-2.jpg
date: 2016-10-10T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  We often want to make sure that certain data is available before a component
  is instantiated via routing. In this article you'll learn how to resolve route
  data.
categories:
  - angular
tags:
  - angular2
  - routing
topic: routing
author: pascal_precht
demos:
  - url: 'http://embed.plnkr.co/QRoowb/'
    title: Retreiving delayed route data
  - url: 'http://embed.plnkr.co/Od0Bv2/'
    title: Route resolver function
  - url: 'http://embed.plnkr.co/u2qR9J/'
    title: Route resolver class
related_posts:
  - Futuristic Routing in Angular
  - Protecting Routes using Guards in Angular 2
  - Routing in Angular 2 revisited
  - Routing in Angular 2
  - Two-way Data Binding in Angular 2
  - Angular 2 Animations - Foundation Concepts

---

Not long ago, we wrote about [Navigation Guards](/angular/2016/07/18/guards-in-angular-2.html) and how they let us control the navigation flow of our application's users. Guards like `CanActivate`, `CanDeactivate` and `CanLoad` are great when it comes to taking the decision if a user is allowed to activate a certain route, leaving a certain route, or even asynchronously loading a route.

However, one thing that these guards don't allow us to do, is to ensure that certain data is loaded before a route is actually activated. For example, in a contacts application where we're able to click on a contact to view a contact's details, the contact data should've been loaded before the component we're routing to is instantiated, otherwise we might end up with a UI that already renders its view and a few moments later, the actual data arrives (of course, there are many ways to get around this). **Route resolvers** allow us to do exactly that and in this article we're going to explore how they work!

{% include demos-and-videos-buttons.html post=page %}

<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Understanding the problem

Let's just stick with the scenario of a contacts application. We have a route for a contacts list, and a route for contacts details. Here's what the route configuration might look like:


{% highlight js %}
{% raw %}
import { Routes } from '@angular/router';
import { ContactsListComponent } from './contacts-list';
import { ContactsDetailComponent } from './contacts-detail';

export const AppRoutes: Routes = [
  { path: '', component: ContactsListComponent },
  { path: 'contact/:id', component: ContactsDetailComponent }
];
{% endraw %}
{% endhighlight %}

And of course, we use that configuration to configure the router for our application:

{% highlight js %}
{% raw %}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppRoutes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(AppRoutes)
  ],
  ...
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

Nothing special going on here. However, if this is all new to you, you might want to read our [article on routing](/angular/2016/06/14/routing-in-angular-2-revisited.html).

Let's take a look at the `ContactsDetailComponent`. This component is responsible of displaying contact data, so it somehow has to get access to a contact object, that matches the `id` provided in the route URL (hence the `:id` parameter in the route configuration). In our article on routing in Angular 2, we've learned that we can easily [access route parameters](/angular/2016/06/14/routing-in-angular-2-revisited.html#access-route-parameters) using the `ActivatedRoute` like this:

{% highlight js %}
{% raw %}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContactsService } from '../contacts.service';
import { Contact } from '../interfaces/contact';

@Component({
  selector: 'contacts-detail',
  template: '...'
})
export class ContactsDetailComponent implements OnInit {

  contact: Contact;

  constructor(
    private contactsService: ContactsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    let id = this.route.snapshot.params['id'];
    this.contactsService.getContact(id)
        .subscribe(contact => this.contact = contact);
  }
}
{% endraw %}
{% endhighlight %}

Okay, cool. So the only thing `ContactsDetailComponent` does, is to fetch a contact object by the given id and assign that object to its local `contact` property, which then allows us to interpolate expressions like `{%raw%}{{contact.name}}{%endraw%}` in the template of the component.

Let's take a look at the component's template:


{% highlight html %}
{% raw %}
<h2>{{contact?.name}}</h2>

<dl>
  <dt>Phone</dt>
  <dd>{{contact?.phone}}</dd>
  <dt>Website</dt>
  <dd>{{contact?.website}}</dd>
</dl>
{% endraw %}
{% endhighlight %}

Notice that we've attached Angular's Safe Navigation Operator to all of our expressions that rely on `contact`. The reason for that is, that `contact` will be undefined at the time this component is initialized, since we're fetching the data asynchronously. The Safe Navigation Operator ensures that Angular won't throw any errors when we're trying to read from an object that is `null` or `undefined`.

In order to demonstrate this issue, let's assume `ContactsService#getContact()` takes 3 seconds until it emits a contact object. In fact, we can easily fake that delay right away like this:

{% highlight js %}
{% raw %}
import { Injectable } from '@angular/core';

@Injectable()
export class ContactsService {

  getContact(id) {
    return Observable.of({
      id: id,
      name: 'Pascal Precht',
      website: 'http://thoughtram.io',
    }).delay(3000);
  }
}
{% endraw %}
{% endhighlight %}

Take a look at the demo and notice how the UI flickers until the data arrives.

<iframe src="http://embed.plnkr.co/QRoowb/"></iframe>

Depending on our template, adding Safe Navigation Operators everywhere can be quite tiring as well. In addition to that, some constructs don't support that operator, like `NgModel` and `RouterLink` directives. Let's take a look at how we can solve this using route resolvers.

## Defining resolvers

As mentioned ealier, route resolvers allow us to provide the needed data for a route, before the route is activated. There are different ways to create a resolver and we'll start with the easiest: a function. A resolver is a function that returns either `Observable<any>`, `Promise<any>` or just data. This is great, because our `ContactsService#getContact()` method returns an `Observable<Contact>`.

Resolvers need to be registered via providers. Our article on [Dependency Injection in Angular 2](/angular/2015/05/18/dependency-injection-in-angular-2.html) explains nicely how to make functions available via DI.

Here's a resolver function that resolves with a static contact object:

{% highlight js %}
{% raw %}
@NgModule({
  ...
  providers: [
    ContactsService,
    {
      provide: 'contact',
      useValue: () => {
        return {
          id: 1,
          name: 'Some Contact',
          website: 'http://some.website.com'
        };
      }
  ]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

Let's ignore for a second that we don't always want to return he same contact object when this resolver is used. The point here is that we can register a simple resolver function using Angular's dependency injection. Now, how do we attach this resolver to a route configuration? That's pretty straight forward. All we have to do is add a `resolve` property to a route configuration, which is an object where each key points to a resolver.

Here's how we add our resolver function to our route configuration:

{% highlight js %}
{% raw %}
export const AppRoutes: Routes = [
  ...
  { 
    path: 'contact/:id',
    component: ContactsDetailComponent,
    resolve: {
      contact: 'contact'
    }
  }
];
{% endraw %}
{% endhighlight %}

That's it? Yes! `'contact'` is the provider token we refer to when attaching resolvers to route configurations. Of course, this can also be an [OpaqueToken](/angular/2016/05/23/opaque-tokens-in-angular-2.html), or a class (as discussed later).

Now, the next thing we need to do is to change the way `ContactsDetailComponent` gets hold of the contact object. Everything that is resolved via route resolvers is exposed on an `ActivatedRoute`'s `data` property. In other words, for now we can get rid of the `ContactsService` dependency like this:

{% highlight js %}
{% raw %}
@Component()
export class ContactsDetailComponent implements OnInit {

  contact;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.contact = this.route.snapshot.data['contact'];
  }
}
{% endraw %}
{% endhighlight %}

Here's the code in action:

<iframe src="http://embed.plnkr.co/Od0Bv2/"></iframe>

In fact, when defining a resolver as a function, we get access to the `ActivatedRouteSnapshot`, as well as the `RouterStateSnapshot` like this:

{% highlight js %}
{% raw %}
@NgModule({
  ...
  providers: [
    ContactsService,
    {
      provide: 'contact',
      useValue: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        ...
      }
  ]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

This is useful in many scenarios where we need access to things like router parameters, which we actually do. However, we also need a `ContactsService` instance, which we **don't** get injected here. So how do we create resolver that need dependency injection?

## Resolvers with dependencies

As we know, dependency injection works on class constructors, so what we need is a class. We can create resolvers as classes as well! The only thing we need to do, is to implement the `Resolve` interface, which ensures that our resolver class has a `resolve()` method. This `resolve()` method is pretty much the same function we have currently registered via DI.

Here's what our contact resolver could look like as a class implementation:

{% highlight js %}
{% raw %}
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { ContactsService } from './contacts.service';

@Injectable()
export class ContactResolve implements Resolve<Contact> {

  constructor(private contactsService: ContactsService) {}

  resolve(route: ActivatedRouteSnapshot) {
    return this.contactsService.getContact(route.params['id']);
  }
}
{% endraw %}
{% endhighlight %}

As soon as our resolver is a class, our provider configuration becomes simpler as well, because the class can be used as provider token!

{% highlight js %}
{% raw %}
@NgModule({
  ...
  providers: [
    ContactsService,
    ContactResolve
  ]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

And of course, we use the same token to configure the resolver on our routes:

{% highlight js %}
{% raw %}
export const AppRoutes: Routes = [
  ...
  { 
    path: 'contact/:id',
    component: ContactsDetailComponent,
    resolve: {
      contact: ContactResolve
    }
  }
];
{% endraw %}
{% endhighlight %}

Angular is smart enough to detect if a resolver is a function, or a class and if it's a class, it'll call `resolve()` on it. Check out the demo below to see this code in action and note how Angular delays the component instantiation until the data has arrived.

<iframe src="http://embed.plnkr.co/u2qR9J/"></iframe>

Hopefully this gave you a better idea of how route resolvers in Angular 2 work!
