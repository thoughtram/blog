---
layout:     post
title:      "Routing in Angular 2 revisited"
imageUrl:   "/images/banner/routing-in-angular-2-revisited.jpeg"

date: 2016-06-14

summary: "Routing is hard. If you've followed the development of Angular 2 the last couple of months, especially the router, you've probably noticed that there were many different attempts to get it right. We now have a version 3 of the new component router and in this article we're going to explore its API."

categories:
  - angular

tags:
  - angular2

topic: routing

author: pascal_precht
---

A long time ago we've written about [routing in Angular 2](/angular/2015/06/16/routing-in-angular-2.html) and you've probably noticed that this article is deprecated due to many changes and rewrites that happened in the router module of Angular 2. Just recently, the Angular team announced yet another version of the new router, in which they considered all the gathered feedback from the community to make it finally sophisticated enough, so it'll fulfill our needs when we build applications with Angular 2.

In this article we want to take a first look at the new and better APIs, touching on the most common scenarios when it comes to routing. We're going to explore how to define routes, linking to other routes, as well as accessing route parameters. Let's jump right into it!

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
  index?: boolean;
  path?: string;
  component?: Type|string;
  ...
}
{% endraw %}
{% endhighlight %}

As we can see, there are actually a couple more properties than just the three we show here. We'll get to them later but this is all we need for now.

Routes are best defined in a separate module to make keep our application easy to test also also make them easier to reuse. Let's define routes for our components in a new module (maybe `contacts.routes.ts`?) so we can add them to our application in the next step:

{% highlight js %}
{% raw %}
import { ContactsListComponent } from './contacts-list';
import { ContactsDetailComponent } from './contacts-detail';

export ContactsAppRoutes = [
  { index: true, component: ContactsListComponent },
  { path: 'contacts/:id', component: ContactsDetailComponent }
];
{% endraw %}
{% endhighlight %}

Pretty straight forward right? You might notice that we use the `index` property on our first `Route` definition. This simply tells the router that this component should be loaded into the view by default (this is especially useful when dealing with child routes). The second route has a placeholder in its path called `id`. This allows us to have some dynamic value in our path which can later be accessed in the component we route to. Think of a contact id in our case, so we can fetch the contact object we want to display the details for.

The next thing we need to do is to make those routes available to our application. Angular takes advantage of its dependency injection system to make this work. The easiest way to make our routes available via DI is to import a function called `provideRouter(routes: RouteConfig)`, which creates providers for us.


{% highlight js %}
{% raw %}
import { bootstrap } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ContactsAppComponent } from './contacts.component';
import { ContactsAppRoutes } from './contacts.routes';

bootstrap(ContactsAppComponent, [
  provideRouter(ContactsAppRoutes)
]);
{% endraw %}
{% endhighlight %}

If you've read our articles on [Dependency Injection in Angular 2](/angular/2015/05/18/dependency-injection-in-angular-2.html) you know that `bootstrap()` takes a list of providers as second argument. That's all we do here.

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

Nothing special going on there. However, we need to change that. In order to tell Angular where to load the component we route to, we need to use a directive called `RouterOutlet`. There are different ways to get hold of it, but the easiest is probably to simply import the `ROUTER_DIRECTIVES`, which is simply a predefined list of directives we can add to a component's template like this:

{% highlight js %}
{% raw %}
import { ROUTER_DIRECTIVES } from '@angular/router';

@Component({
  ...
  directives: [ROUTER_DIRECTIVES]
})
export class ContactsAppComponent {
  ...
}
{% endraw %}
{% endhighlight %}

We can now use all the directives that are exposed in that collection. That includes the `RouterOutlet` directive. Let's add a `<router-outlet>` tag to our component's template so that loaded components are displayed accordingly.

{% highlight js %}
{% raw %}
@Component({
  ...
  template: `
    <h1>Contacts App</h1>
    <router-outlet></router-outlet>
  `
  directives: [ROUTER_DIRECTIVES]
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

This works perfectly fine. `RouterLink` takes care of generating an `href` attribute for us that the browser needs to make linking to other sites work. And since we've already added `ROUTER_DIRECTIVES` to our `ContactsAppComponent`, we can simply go ahead and use that directive without further things to do.

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

We need a way to evaluate something like `{{contact.id}}` to generate a link in our template. Luckily, `RouterLink` supports not only strings, but also expressions! As soon as we want to use expressions to generate our links, we have to use an array literal syntax in `RouterLink`.

Here's how we could extend `ContactsListComponent` to link to `ContactsDetailComponent`:


{% highlight js %}
{% raw %}
@Component({
  selector: 'contacts-list',
  template: `
    <h2>Contacts</h2>
    <ul>
      <li *ngFor="let contact of contacts | async">
        <a [routerLink]="['/contacts', { id: contact.id }]">
          {{contact.name}}
        </a>
      </li>
    </ul>
  `,
  directives: [ROUTER_DIRECTIVES]
})
export class ContactsListComponent {
  ...
}
{% endraw %}
{% endhighlight %}

There are a couple of things to note here:

- We use the bracket-syntax for `RouterLink` to make expressions work (if this doesn't make sense to you, you might want to read out article on [Angular 2's Template Syntax Demystified](http://localhost:4000/angular/2015/08/11/angular-2-template-syntax-demystified-part-1.html)
- The expression takes an array where the first field is the path we want to route to and the second a hash that fills the route parameters
- In order to use `RouterLink` in the template, we added `ROUTER_DIRECTIVES` to the component

Cool! We can now link to `ContactsDetailComponent`. However, this is only half of the story. We still need to teach `ContactsDetailComponent` how to access the route parameters so it can use them to load a contact object.

## Access Route Parameters

A component that we route to has access to something that Angular calls the `ActivatedRoute`. An `ActivcatedRoute` is an object that contains information about route parameters, query parameters and URL fragments. `ContactsDetailComponent` needs exactly that to get the id of a contact. We can inject the `ActivatedRoute` into `ContactsDetailComponent`, simply using Angular's DI like this:

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

`ActivatedRoute` comes with a `params` property which is an `Observable`. To access the contact id, all we have to do is to subscribe to the parameters `Observable` changes. Let's say we have a `ContactsService` that takes an `Observable<number|string>` and emits a contact object. Here's what that could look like:


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
    this.contactsService
        .getContact(this.route.params.map(params => params['id']))
        .subscribe(contact => this.contact = contact);
  }
}
{% endraw %}
{% endhighlight %}

Isn't that great? Since `this.route.params` is an `Observable` we can simply pass it to any API that takes an observable, making this component entirely stream based!

Of course, there's way more to cover when it comes to routing. We haven't talked about secondary routes or **guards** yet, but we'll do that in our upcoming articles. Hopefully this one gives you an idea of what to expect from the new router. For a more in-depth article on the underlying architecture, you might want to read Victor's [awesome blog](http://victorsavkin.com/post/145672529346/angular-router)!
