---
layout: post
title: Routing in Angular 2 revisited
imageUrl: /images/banner/routing-in-angular-2-revisited.jpeg
date: 2016-06-14T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  Learn how to implement basic routing in your Angular 2 application using the
  latest and greatest APIs!
categories:
  - angular
tags:
  - angular2
  - routing
topic: routing
demos:
  - url: 'http://embed.plnkr.co/I9qFkO/'
    title: Simple Contacts App
videos:
  - url: 'http://casts.thoughtram.io/embedded/189603515'
  - url: 'http://casts.thoughtram.io/embedded/189613148'
  - url: 'http://casts.thoughtram.io/embedded/189618526'
author: pascal_precht
related_posts:
  - Futuristic Routing in Angular
  - Resolving route data in Angular 2
  - Protecting Routes using Guards in Angular 2
  - Routing in Angular 2
  - Testing Services with Http in Angular 2
  - Two-way Data Binding in Angular 2
related_videos:
  - '175218351'
  - '189618526'
  - '189613148'
  - '189603515'
  - '175255006'
  - '193524896'

---

A long time ago we've written about [routing in Angular 2](/angular/2015/06/16/routing-in-angular-2.html) and you've probably noticed that this article is deprecated due to many changes and rewrites that happened in the router module of Angular 2. Just recently, the Angular team announced yet another version of the new router, in which they considered all the gathered feedback from the community to make it finally sophisticated enough, so it'll fulfill our needs when we build applications with Angular 2.

In this article we want to take a first look at the new and better APIs, touching on the most common scenarios when it comes to routing. We're going to explore how to define routes, linking to other routes, as well as accessing route parameters. Let's jump right into it!

{% include demos-and-videos-buttons.html post=page %}

<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>


## Defining Routes

Let's say we want to build a contacts application (in fact, this is what we do in our [Angular 2 Master Class](http://thoughtram.io/angular2-master-class.html)). Our contacts application shows a list of contacts, which is our `ContactsListComponent` and when we click on a contact, we navigate to the `ContactsDetailComponent`, which gives us a detailed view of the selected contact.

A simplified version of `ContactsListComponent` could look something like this:

{% highlight js %}
{% raw %}
@Component({
  selector: 'contacts-list',
  template: `
    <h2>Contacts</h2>
    <ul>
      <li *ngFor="let contact of contacts | async">
        {{contact.name}}
      </li>
    </ul>
  `
})
export class ContactsListComponent {
  ...
}
{% endraw %}
{% endhighlight %}

Let's not worry about how `ContactsListComponent` gets hold of the contact data. We just assume it's there and we generate a list using `ngFor` in the template.

`ContactsDetailComponent` displays a single contact. Again, we don't want to worry too much about how this component is implemented yet, but a simplified version could look something like this:

{% highlight js %}
{% raw %}
@Component({
  selector: 'contacts-detail',
  template: `
    <h2>{{contact.name}}</h2>

    <address>
      <span>{{contact.street}}</span>
      <span>{{contact.zip}}</span>
      <span>{{contact.city}}</span>
      <span>{{contact.country}}</span>
    </address>
  `
})
export class ContactsDetailComponent {
  ...
}
{% endraw %}
{% endhighlight %}

Especially in `ContactsDetailComponent` there are a couple more things we need to consider when it comes to routing (e.g. how to link to that component, how to get access to URL parameters), but for now, the first thing we want to do is defining routes for our application.

Defining routes is easy. All we have to do is to create a collection of `Route` which simply follows an object structure that looks like this:

{% highlight js %}
{% raw %}
interface Route {
  path?: string;
  component?: Type|string;
  ...
}
{% endraw %}
{% endhighlight %}

As we can see, there are actually a couple more properties than just the three we show here. We'll get to them later but this is all we need for now.

Routes are best defined in a separate module to keep our application easy to test and also to make them easier to reuse. Let's define routes for our components in a new module (maybe `contacts.routes.ts`?) so we can add them to our application in the next step:

{% highlight js %}
{% raw %}
import { ContactsListComponent } from './contacts-list';
import { ContactsDetailComponent } from './contacts-detail';

export const ContactsAppRoutes = [
  { path: '', component: ContactsListComponent },
  { path: 'contacts/:id', component: ContactsDetailComponent }
];
{% endraw %}
{% endhighlight %}

Pretty straight forward right? You might notice that the `path` property on our first `Route` definition is empty. This simply tells the router that this component should be loaded into the view by default (this is especially useful when dealing with child routes). The second route has a placeholder in its path called `id`. This allows us to have some dynamic value in our path which can later be accessed in the component we route to. Think of a contact id in our case, so we can fetch the contact object we want to display the details for.

The next thing we need to do is to make these routes available to our application. In fact, we first need to make sure there's a router in our application at all. We do that by importing Angular `RouterModule` into our application module. But not only that, we also configure it with our routes using `RouterModule.forRoot()`.

{% highlight js %}
{% raw %}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ContactsListComponent } from './contacts-list';
import { ContactsDetailComponent } from './contacts-detail';
import { ContactsAppComponent } from './app.component';
import { ContactsAppRoutes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(ContactsAppRoutes)
  ],
  declarations: [
    ContactsAppComponent,
    ContactsListComponent,
    ContactsDetailComponent
  ],
  bootstrap: [ContactsAppComponent]
})
{% endraw %}
{% endhighlight %}

You might wonder where `ContactsAppComponent` comes from. Well, this is just the root component we use to bootstrap our application. In fact, it doesn't really know anything about our `ContactsListComponent` and `ContactsDetailComponent`. We're going to take a look at `ContactsAppComponent` in the next step though.

## Displaying loaded components

Okay cool, our application now knows about these routes. The next thing we want to do is to make sure that the component we route to, is also displayed in our application. We still need to tell Angular "Hey, here's where we want to display the thing that is loaded!".

For that, we take a look at `ContactsAppComponent`:

{% highlight js %}
{% raw %}
@Component({
  selector: 'contacts-app',
  template: `
    <h1>Contacts App</h1>

    <!-- here's where we want to load
      the detail and the list view -->
  `
})
export class ContactsAppComponent {
  ...
}
{% endraw %}
{% endhighlight %}

Nothing special going on there. However, we need to change that. In order to tell Angular where to load the component we route to, we need to use a directive called `RouterOutlet`. Since we've imported `RouterModule` into our application module, this directive is automatically available to us. Let's add a `<router-outlet>` tag to our component's template so that loaded components are displayed accordingly.

{% highlight js %}
{% raw %}
@Component({
  ...
  template: `
    <h1>Contacts App</h1>
    <router-outlet></router-outlet>
  `
})
export class ContactsAppComponent {
  ...
}
{% endraw %}
{% endhighlight %}

Bootstrapping that app now displays a list of contacts! Awesome! The next thing we want to do is to link to `ContactsDetailComponent` when someone clicks on a contact.

## Linking to other routes

With the new router, there are different ways to route to other components and routes. The most straight forward way is to simply use strings, that represent the path we want to route to. We can use a directive called `RouterLink` for that. For instance, if we want to route to `ContactsDetailComponent` and pass the contact id `3`, we can do that by simply writing:


{% highlight html %}
{% raw %}
<a routerLink="/contacts/3">Details</a>
{% endraw %}
{% endhighlight %}

This works perfectly fine. `RouterLink` takes care of generating an `href` attribute for us that the browser needs to make linking to other sites work. And since we've already imported `RouterModule`, we can simply go ahead and use that directive without further things to do.

While this is great we realise very quickly that this isn't the optimal way to handle links, especially if we have dynamic values that we can only represent as expressions in our template. Taking a look at our `ContactsListComponent` template, we see that we're iterating over a list of contacts:

{% highlight html %}
{% raw %}
<ul>
  <li *ngFor="let contact of contacts | async">
    {{contact.name}}
  </li>
</ul>
{% endraw %}
{% endhighlight %}

We need a way to evaluate something like `{% raw %}{{contact.id}}{% endraw %}` to generate a link in our template. Luckily, `RouterLink` supports not only strings, but also expressions! As soon as we want to use expressions to generate our links, we have to use an array literal syntax in `RouterLink`.

Here's how we could extend `ContactsListComponent` to link to `ContactsDetailComponent`:


{% highlight js %}
{% raw %}
@Component({
  selector: 'contacts-list',
  template: `
    <h2>Contacts</h2>
    <ul>
      <li *ngFor="let contact of contacts | async">
        <a [routerLink]="['/contacts', contact.id]">
          {{contact.name}}
        </a>
      </li>
    </ul>
  `
})
export class ContactsListComponent {
  ...
}
{% endraw %}
{% endhighlight %}

There are a couple of things to note here:

- We use the bracket-syntax for `RouterLink` to make expressions work (if this doesn't make sense to you, you might want to read out article on [Angular 2's Template Syntax Demystified](/angular/2015/08/11/angular-2-template-syntax-demystified-part-1.html)
- The expression takes an array where the first field is the segment that describes the path we want to route to and the second a dynamic value which ends up as route parameter 

Cool! We can now link to `ContactsDetailComponent`. However, this is only half of the story. We still need to teach `ContactsDetailComponent` how to access the route parameters so it can use them to load a contact object.

## Access Route Parameters

A component that we route to has access to something that Angular calls the `ActivatedRoute`. An `ActivatedRoute` is an object that contains information about route parameters, query parameters and URL fragments. `ContactsDetailComponent` needs exactly that to get the id of a contact. We can inject the `ActivatedRoute` into `ContactsDetailComponent`, by using Angular's DI like this:

{% highlight js %}
{% raw %}
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'contacts-detail',
  ...
})
export class ContactsDetailComponent {

  constructor(private route: ActivatedRoute) {

  }
}
{% endraw %}
{% endhighlight %}

`ActivatedRoute` comes with a `params` property which is an `Observable`. To access the contact id, all we have to do is to subscribe to the parameters `Observable` changes. Let's say we have a `ContactsService` that takes a number and returns an observable that emits a contact object. Here's what that could look like:


{% highlight js %}
{% raw %}
import { ActivatedRoute } from '@angular/router';
import { ContactsService } from '../contacts.service';

@Component({
  selector: 'contacts-detail',
  ...
})
export class ContactsDetailComponent {

  contact: Contact;

  constructor(
    private route: ActivatedRoute,
    private contactsService: ContactsService
  ) {

  }

  ngOnInit() {
    this.route.params
      .map(params => params['id'])
      .subscribe((id) => {
        this.contactsService
          .getContact(id)
          .subscribe(contact => this.contact = contact);
      });
  }
}
{% endraw %}
{% endhighlight %}

Oh, look what we have here! Notice that we're nesting two `subscribe()` calls? This is usually an indicator that we can refactor our code using `flatMap()`, or even better `switchMap()`, as we're calling an asynchronous API and want to deal with out-of-order responses.

Let's refactor our code:

{% highlight js %}
{% raw %}
ngOnInit() {
  this.route.params
    .map(params => params['id'])
    .switchMap(id => this.contactsService.getContact(id))
    .subscribe(contact => this.contact = contact);
}
{% endraw %}
{% endhighlight %}

Much better! But are observables really required to get hold of our `id` parameter?

## Using Router Snapshots

Sometimes we're not interested in future changes of a route parameter. All we need is this contact id and once we have it, we can provide the data we want to provide. In this case, an Observable can bit a bit of an overkill, which is why the router supports snapshots. A snapshot is simply a snapshot representation of the activated route. We can access the `id` parameter of the route using snapshots like this:

{% highlight js %}
{% raw %}
...
  ngOnInit() {

    this.contactsService
        .getContacts(this.route.snapshot.params['id'])
        .subscribe(contact => this.contact = contact);
  }
...
{% endraw %}
{% endhighlight %}

Check out the running example [right here](http://plnkr.co/edit/I9qFkO?p=preview)!


Of course, there's way more to cover when it comes to routing. We haven't talked about secondary routes or **guards** yet, but we'll do that in our upcoming articles. Hopefully this one gives you an idea of what to expect from the new router. For a more in-depth article on the underlying architecture, you might want to read Victor's [awesome blog](http://victorsavkin.com/post/145672529346/angular-router)!
