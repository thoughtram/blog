---
layout: post
title: Understanding @Injectable in Angular 2
date: 2015-09-17T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  We might run into unexpected behaviour when injecting service dependencies.
  This article details how to do it right.
categories:
  - angular
tags:
  - angular2
topic: di
videos:
  - url: 'http://casts.thoughtram.io/embedded/181222350'
author: pascal_precht
related_posts:
  - Two-way Data Binding in Angular 2
  - Resolving route data in Angular 2
  - Angular 2 Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular 2
  - Custom Form Controls in Angular 2

---

If you're following our articles on [Dependency Injection in Angular 2](/angular/2015/05/18/dependency-injection-in-angular-2.html), you know how the DI system in Angular works. It takes advantage of metadata on our code, added through annotations, to get all the information it needs so it can resolve dependencies for us.

Angular 2 applications can basically be written in any language, as long as it compiles to JavaScript in some way. When writing our application in TypeScript, we use decorators to add metadata to our code. Sometimes, we can even omit some decorators and simply rely on type annotations. However, it turns out that, when it comes to DI, we might run into unexpected behaviour when injecting dependencies into services.

This article discusses what this unexpected problem is, why it exists and how it can be solved.

{% include demos-and-videos-buttons.html post=page %}

<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Injecting Service Dependencies

Let's say we have a simple Angular 2 component which has a `DataService` dependency. It could look something like this:

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-app',
  template: `
    <ul>
      <li *ngFor="let item of items">{{item.name}}</li>
    </ul>
  `
})
class AppComponent {
  items:Array<any>;
  constructor(dataService: DataService) {
    this.items = dataService.getItems();
  }
}
{% endraw %}
{% endhighlight %}

`DataService` on the other hand is a simple class (because that's what a service in Angular 2 is), that provides a method to return some items.

{% highlight js %}
{% raw %}
class DataService {
  items:Array<any>;

  constructor() {
    this.items = [
      { name: 'Christoph Burgdorf' },
      { name: 'Pascal Precht' },
      { name: 'thoughtram' }
    ];
  }

  getItems() {
    return this.items;
  }
}
{% endraw %}
{% endhighlight %}

Of course, in order to actually be able to ask for something of type `DataService`, we have to add a provider for our injector. We can do that by adding a provider to  our component.

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-app',
  template: `
    <ul>
      <li *ngFor="let item of items">{{item.name}}</li>
    </ul>
  `,
  providers: [DataService]
})
...
{% endraw %}
{% endhighlight %}

Until now there's nothing new here. If this *is* new to you, you might want to read our article on [Dependency Injection in Angular 2](/angular/2015/05/18/dependency-injection-in-angular-2.html) first.

So where is the problem? Well, the problem occurs as soon as we try to inject a dependency into our service. We could for example use `Http` in our `DataService` to fetch our data from a remote server. Let's quickly do that. First, we need  to import Angular's `HttpModule` into our application module.

{% highlight js %}
{% raw %}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

@NgModule({
  imports: [BrowserModule, HttpModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

Angular's http module comes with all the providers we need to hook up some http action in our service. Next, we need to inject an instance of `Http` in our service to actually use it.

{% highlight js %}
{% raw %}
import { Http } from '@angular/http';

class DataService {
  items:Array<any>;

  constructor(http:Http) {
    ...
  }
  ...
}
{% endraw %}
{% endhighlight %}

**Boom**. This thing is going to explode. As soon as we run this code in the browser, we'll get the following error:

```
Cannot resolve all parameters for DataService(?). Make sure they all have valid type or annotations.
```

It basically says that it can't resolve the `Http` dependency of `DataService` because Angular doesn't know the type and therefore, no provider that can be used to resolve the dependency. Uhm.. wait what? Didn't we put the type in the constructor?

Yea, we did. Unfortunately it turns out this is not enough. However, obviously it **does** work when we inject `DataService` in our `AppComponent`. So what's the problem here? Let's take a step back and recap real quick where the metadata, that Angular's DI need, comes from.

In our article on [the difference between decorators and annotations](/angular/2015/05/03/the-difference-between-annotations-and-decorators.html) we learned that decorators simply add metadata to our code. If we take our `AppComponent`, once decorated and transpiled, it looks something like this (simplified):

{% highlight js %}
{% raw %}
function AppComponent(myService) {
  ...
}

AppComponent = __decorate([
  Component({...}),
  __metadata('design:paramtypes', [DataService])
], AppComponent);
{% endraw %}
{% endhighlight %}

We can clearly see that `AppComponent` is decorated with `Component`, and some additional metadata for `paramtypes`. The `paramtypes` metadata is the one that is needed by Angular's DI to figure out, for what type it has to return an instance.

This looks good. Let's take a look at the transpiled `DataService` and see what's going on there (also simplified).

{% highlight js %}
{% raw %}
DataService = (function () {
  function DataService(http) {
    ...
  }
  return DataService;
})();
{% endraw %}
{% endhighlight %}

Oops. Apparently we don't have any metadata at all here. Why is that?

TypeScript generates metadata when the `emitDecoratorMetadata` option is set. However, that doesn't mean that it generates metadata blindly for each and every class or method of our code. TypeScript only generates metadata for a class, method, property or method/constructor parameter when a decorator is actually attached to that particular code. Otherwise, a huge amount of unused metadata code would be generated, which not only affects file size, but it'd also have an impact on our application runtime.

That's also why the metadata is generated for `AppComponent`, but not for `DataService`. Our `AppComponent` **does** have decorators, otherwhise it's not a component.

## Enforcing Metadata Generation

So how can we enforce TypeScript to emit metadata for us accordingly? One thing we could do, is to use DI decorators provided by the framework. As we learned in our other articles on DI, the `@Inject` decorator is used to ask for a dependency of a certain type. 

We could change our `DataService` to something like this:

{% highlight js %}
{% raw %}
import { Inject } from '@angular/core';
import { Http } from '@angular/http';

class DataService {
  items:Array<any>;

  constructor(@Inject(Http) http:Http) {
    ...
  }
  ...
}
{% endraw %}
{% endhighlight %}

**Problem solved**. In fact, this is exactly what `@Inject` is for when not transpiling with TypeScript. If we take a look at the transpiled code now, we see that all the needed metadata is generated (yeap simplified).

{% highlight js %}
{% raw %}
function DataService(http) {
}
DataService = __decorate([
  __param(0, angular2_1.Inject(Http)), 
  __metadata('design:paramtypes', [Http])
], DataService);
{% endraw %}
{% endhighlight %}

However, now we have this Angular machinery in our code and unfortunately, we won't entirely get rid of it. We can do a little bit better though. Remember that we said metadata is generated, if decorators are attached to our code?

We can basically put **any** decorator on our code, as long as it's either attached to the class declaration, or to the constructor parameter. In other words, we could remove `@Inject` again and use something else that we put on the class, because that will cause TypeScript to emit metadata for the constructor parameters too.

Of course, putting just anything that is a decorator on a class doesn't sound really appropiate. Luckily, Angular comes with yet another decorator we can use. `@Injectable` is normally used for Dart metadata generation. It doesn't have any special meaning in TypeScript-land, however, it turns out to be a perfect fit for our use case. We don't have to build a new one ourselves, and the name also kind of makes sense.

All we have to do is to import it and put it on our `DataService` like this:

{% highlight js %}
{% raw %}
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
class DataService {
  items:Array<any>;

  constructor(http:Http) {
    ...
  }
  ...
}
{% endraw %}
{% endhighlight %}

Again, this will just enforce TypeScript to emit the needed metadata, the decorator itself doesn't have any special meaning here. This seems to be currently the best option we have to solve the illustrated problem.
