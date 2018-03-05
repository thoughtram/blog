---
layout: post
title: Advanced caching with RxJS
imageUrl: /images/banner/advanced_caching.jpg
date: 2018-03-05T00:00:00.000Z
summary: >-
  When building web applications, performance should always be a top priority. One very efficient way to optimize the performance of our applications and improve the experience of our site is to use caching mechanisms. In this post we'll develop an advanced caching mechanism with RxJS and the tools provided by Angular to cache application data.
categories:
  - angular
tags:
  - angular2
  - rx
author: dominic_elm
related_posts:
  - Taming snakes with reactive streams
  - 'Exploring Rx Operators: flatMap'
  - Angular Master Class - Redux and ngrx
  - Three things you didn't know about the AsyncPipe
  - Cold vs Hot Observables
  - 'Exploring Rx Operators: map'
related_videos:
  - '181311615'
  - '181311609'
  - '181311613'
  - '181311611'
  - '181311614'
  - '181311616'

---

When building web applications, performance should always be a top priority. There are many things we can do to speed up our Angular applications like tree-shaking, AoT (ahead-of-time compilation), lazy loading modules or caching. To get an overview of practices that will help you boost the performance of your Angular applications, we highly recommend you to check out the [Angular Performance Checklist](https://github.com/mgechev/angular-performance-checklist#lazy-loading-of-resources) by [Minko Gechev](https://twitter.com/mgechev). In this post we focus on **caching**.

In fact, caching is one of the most efficient ways to improve the experience of our site, especially when our users are on bandwidth restricted devices or slow networks.

There are several ways to cache data or assets. Static assets are most commenly cached with the standard browser cache or Service Workers. While Service Workers can also cache API requests, they are typically more useful for caching resources like images, HTML, JS or CSS files. To cache application _data_ we usually use custom mechanisms.

No matter what mechanism we use, a cache generally **improves the responsiveness** of our application, **decreases network costs** and has the advantage that **content becomes available during network interruptions**. In other words, when the content is cached closer to the consumer, say on the client side, requests don't cause additional network activity and cached data can be retrieved much faster because we save on an entire network round trip.

In this post we'll develop an advanced caching mechanism with RxJS and the tools provided by Angular.

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Motivation

Every now and then there's this question popping up how to cache data in an Angular application that makes excessive use of Observables. Most people have a good understanding on how to cache data with Promises but feel overwhelmed when it comes to functional reactive programming, due to its complexity (large API), fundamental shift in mindset (from imperative to declarative) and the multitude of concepts. Hence, it can be hard to actually translate an existing caching mechanism based on Promises to Observables, especially if you want that mechanism to be a little bit more advanced.

In an Angular application, we typically perform HTTP requests through the `HttpClient` that comes with the `HttpClientModule`. All of its APIs are Observabled-based meaning that methods like `get`, `post`, `put` or `delete` return an Observable. Because Observables are lazy by nature the request is only made when we call `subscribe`. However, calling `subscribe` multiple times on the same Observable will cause the source Observable to be re-created over and over again and, hence, perform a request on each subscription. We call this **cold** Observables.

If you are completely new to this, we have written an article on [Cold vs Hot Observables](/angular/2016/06/16/cold-vs-hot-observables.html).

This behavior can make it tricky to implement a caching mechanism with Observables. Simple approaches often require a fair amount of boilerplate and we probably end up bypassing RxJS, which works, but is not the recommended way if we want to harness the power of Observables. Literally speaking, we don't wanna drive a Ferrari with a scooter engine, right?

## The Requirements

Before we dive into code, let's start to define the requirements for our advanced caching mechanism.

We want to build an application called **World of Jokes**. It's a simple app that randomly shows jokes for a given category. To keep it simple and focused, there's only one category.

This app has three components: `AppComponent`, `DashboardComponent` and `JokeListComponent`.

The `AppComponent` is our entry point and renders a toolbar as well as a `<router-outlet>` that is filled based on the current router state.

The `DashboardComponent` simply shows a list of categories. From here, we can navigate to the `JokeListComponent` which then renders a list of jokes onto the screen.

The jokes themselves are fetched from a server using Angular's `HttpClient` service. To keep the component's responsibility focused and separate the concerns, we want to create a `JokeService` that takes care of requesting the data. The component can then simply inject the service and access the data through its public APIs.

All of the above is just our application's architecture and there's no caching involved yet.

When navigating from the dashboard to the list view, we prefer to request the data from a cache rather than requesting it from the server every time. The underlying data of this cache would update itself every 10 seconds.

Of course, polling for new data every 10 seconds isn't a solid strategy for a production app where we would rather use a more sophisticated approach to update the cache (e.g. web socket push updates). But we'll try to keep things simple here to focus on the caching aspect.

In any case we'd receive some sort of update notification. For our application we want the data in the UI (`JokeListComponent`) to not automatically update when the cache updates but rather waits for the user to enforce the UI update. Why? Imagine a user may be reading one of the jokes and then all of a sudden it's gone because the data is updated automatically. That would be super annoying and a bad user experience. Therefore, our users receive notifications whenever new data is available.

To make it even more fun, we want the user to be able to force the cache to update. This is different from solely updating the UI because forcing an update means to freshly request the data from the server, update the cache and then also update the UI accordingly.

Let's summarize what we want to build:

- Our app has two components where navigating from component A to B should prefer requesting B's data from a cache rather than requesting it from the server every time
- Cache is updated every 10 seconds
- Data in the UI is not automatically updated and requires the user to enforce an update
- User can force an update that will cause a request to actually update the cache and the UI

Here's a preview of what we are going to build:

![app preview](/images/cache_app_preview.gif)

## Implementing a basic cache

Let's start simple and work our way up to the final and fully-fledged solution.

The first step is to create a new service.

Next, we'll add two interfaces, one that describes the shape of a `Joke` and the other is used to **strongly type** the response of our HTTP request. This makes TypeScript happy but most importantly more convenient and obvious to work with.

{% highlight js %}
{% raw %}
export interface Joke {
  id: number;
  joke: string;
  categories: Array<string>;
}

export interface JokeResponse {
  type: string;
  value: Array<Joke>;
}
{% endraw %}
{% endhighlight %}

Now let's implement the `JokeService`. We don't want to reveal the implementation detail of whether the data was served from cache or freshly requested from the server, hence we simply expose a property `jokes` returning an Observable that captures a list of jokes.

In order to perform HTTP requests, we need to make sure to inject the `HttpClient` service in the **constructor** of our service.

Here's the shell for the `JokeService`:

{% highlight js %}
{% raw %}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class JokeService {

  constructor(private http: HttpClient) { }

  get jokes() {
    ...
  }
}
{% endraw %}
{% endhighlight %}

Next, we implement a _private_ method `requestJokes()` which uses the `HttpClient` to perform a _GET_ request to retrieve a list of jokes.

{% highlight js %}
{% raw %}
import { map } from 'rxjs/operators';

@Injectable()
export class JokeService {

  constructor(private http: HttpClient) { }

  get jokes() {
    ...
  }

  private requestJokes() {
    return this.http.get<JokeResponse>(API_ENDPOINT).pipe(
      map(response => response.value)
    );
  }
}
{% endraw %}
{% endhighlight %}

With that in place, we have everything we need to implement the `jokes` getter method.

One naive approach would be to simply return `this.requestJokes()`, but that doesn't do the trick. We know from the beginning that all methods exposed by the `HttpClient`, for instance `get`, return **cold** Observables. This means that the whole data stream is re-emitted for each subscriber causing an overhead of HTTP requests. After all, the idea behind a cache is to speed up the load time of our application and limit the amount of network requests to a minimum.

Instead we want to make our stream **hot**. Not only that, but every new subscriber should receive the latest cached value. It turns out that there's a very convenient operator called `shareReplay`. This operator returns an Observable that shares a **single** subscription to the underlying source, which is the Observable returned from `this.requestJokes()`.

In addition, `shareReplay` accepts an optional parameter `bufferSize` that is really handy in our case. The `bufferSize` determines the maximum element count of the replay buffer, that is the number of elements that are cached and replayed for every subscriber. For our scenario we only want to replay the most recent value and, hence, set the `bufferSize` to one (1).

Let's look at the code and use what we have just learned:

{% highlight js %}
{% raw %}
import { Observable } from 'rxjs/Observable';
import { shareReplay, map } from 'rxjs/operators';

const API_ENDPOINT = 'https://api.icndb.com/jokes/random/5?limitTo=[nerdy]';
const CACHE_SIZE = 1;

@Injectable()
export class JokeService {
  private cache$: Observable<Array<Joke>>;

  constructor(private http: HttpClient) { }

  get jokes() {
    if (!this.cache$) {
      this.cache$ = this.requestJokes().pipe(
        shareReplay(CACHE_SIZE)
      );
    }

    return this.cache$;
  }

  private requestJokes() {
    return this.http.get<JokeResponse>(API_ENDPOINT).pipe(
      map(response => response.value)
    );
  }
}
{% endraw %}
{% endhighlight %}

Ok, we already talked about most of what we see above. But wait, what's about the private `cache$` property and `if` statement inside the getter? The answer to this is quite simple. If we returned `this.requestJokes().pipe(shareReplay(CACHE_SIZE))` directly then every subscriber creates a **new** cache instance. However, we want to share a single instance across all subscribers. Therefore, we keep the instance in a private property `cache$` and initialize it as soon as the getter was called the first time. All subsequent consumers will receive the shared instance without re-creating the cache every time.

Let's look at a more visual representation of what we've just implemented:

<img src="/images/cache_sequence_diagram.png" width="100%" alt="sequence diagram for our simple cache mechanism">

Above we can see a **sequence diagram** that depicts the objects involved in our scenario, that is requesting a list of jokes, and the sequences of messages exchanged between the objects. Let's break it down to understand what's going on here.

We start out on the dashboard from where we navigate to the list component.

After the component was initialized and Angular calls the `ngOnInit` life cycle hook, we request the list of jokes by calling the getter function `jokes` exposed by the `JokeService`. Since this is the first time we ask for the data, the cache itself is empty and not yet initialized, meaning `JokeService.cache$` is `undefined`. Internally we call `requestJokes()`. This will give us an Observable that emits the data from the server. At the same time we apply the `shareReplay` operator to get the desired behavior.

The `shareReplay` operator automatically creates a `ReplaySubject` between the original source and all future subscribers. As soon as the number of subscribers goes from zero to one it will connect the Subject to the underlying source Observable and broadcast all its values. All future subscribers will be connected to that in-between Subject, so that effectively there's just one subscription to the underlying cold Observable. This is called **multicasting** and defines the foundation for our simple cache.

Once the data comes back from the server it will be cached.

Note that the `Cache` is a standalone object in the sequence diagram and is supposed to illustrate the `ReplaySubject` that is created in between the consumer (subscribers) and the underlying source (HTTP request).

The next time we request the data for the list component, our cache will replay the most recent value and send that to the consumer. There's no additional HTTP call involved.

Simple, right?

To rip this really apart, let's take this one step further and look at how the cache works on an Observable level. For this we use a **marble diagram** to visualize how the stream actually works:

<img src="/images/cache_share_replay.png" width="100%" alt="marble diagram for our cache">

The marble diagram makes it really clear that there's only **one subscription** to the underlying Observable and all consumers simply subscribe to the shared Observable, that is the `ReplaySubject`. We can also see that only the first subscriber triggers the HTTP call and all others get the latest value replayed.

Finally, let's look at the `JokeListComponent` and how we can display the data. The first step is to inject the `JokeService`. After that, inside `ngOnInit` we initialize a property `jokes$` with the value returned by the getter function that is exposed by our service. This will return an Observable of type `Array<Joke>` and this is exactly what we want.

{% highlight js %}
{% raw %}
@Component({
  ...
})
export class JokeListComponent implements OnInit {
  jokes$: Observable<Array<Joke>>;

  constructor(private jokeService: JokeService) { }

  ngOnInit() {
    this.jokes$ = this.jokeService.jokes;
  }

  ...
}
{% endraw %}
{% endhighlight %}

Note that we are not imperatively subscribing to `jokes$`. Instead we use the `async` pipe in the template because it turns out that this pipe is full of little wonders. Curious? Check out this article that unravels [three things you didn't know about the AsyncPipe](/angular/2017/02/27/three-things-you-didnt-know-about-the-async-pipe.html).

{% highlight html %}
{% raw %}
<mat-card *ngFor="let joke of jokes$ | async">...</mat-card>
{% endraw %}
{% endhighlight %}

Cool! Here's our simple cache in action. To verify if the request is only made once, open up Chrome's DevTools, click on the _Network_ tab and then select _XHR_. Start out on the dashboard, go to the list view and then navigate back and forth.

<iframe style="height: 500px" src="https://stackblitz.com/edit/advanced-caching-with-rxjs-step-1?ctl=1&embed=1&file=app/joke.service.ts&view=preview" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Automatic updates

So far we have built a simple caching mechanism in a few lines of code. In fact, most of the heavy lifting is done by the `shareReplay` operator which takes care of caching and replaying the most recent value(s).

This works perfectly fine but the data is never actually updated in the background. What if the data is likely to change every few minutes? We certainly don't want to force the user to reload the entire page just to get the latest data from the server.

Wouldn't it be cool if our cache is updated every 10 seconds in the background? Totally! As a user we don't have to reload the page and if the data has changed the UI will update accordingly. Again, in a real-world application we would most probably not even use polling but instead have the server **push** notifications. For our little demo app a _refresh interval_ of 10 seconds is just fine.

The implementation is fairly easy. In a nutshell, we want to create an Observable that emits a sequence of values spaced by a given time interval, or simply said, we want to produce a value every _X_ milliseconds. For that we have several options.

The first option is to use `interval`. This operator takes an optional parameter `period` that defines the time between each emission. Consider the following example:

{% highlight js %}
{% raw %}
import { interval } from 'rxjs/observable/interval';

interval(10000).subscribe(console.log);
{% endraw %}
{% endhighlight %}

Here we set up an Observable that emits an infinite sequence of integers where each value is emitted every 10 seconds. That also means that the first value is somewhat delayed by the given interval. To better demonstrate the behavior, let's take a look at the marble diagram for `interval`.

<img src="/images/interval_operator.png" width="100%" alt="interval operator">

Yep, as expected. The first value is "delayed" and this is not what we want. Why? Because if we come from the dashboard and navigate to the list component to read some funny jokes, we'd have to wait for 10 seconds before the data is requested from the server and rendered onto the screen.

We could fix this by introducing another operator called `startWith(value)` which would emit the given `value` first, as an initial value. But we can do better!

What if I told you that there's an operator that emits a sequence of values after a given duration (initial delay) and then after each period (regular interval)? Meet `timer`.

Visualization time!

<img src="/images/timer_operator.png" width="100%" alt="timer operator">

Cool, but does that really solve our problem? Yep it does. If we set the initial delay to **zero (0)** and set the period to **10 seconds**, we end up with the same behavior as if we used `interval(10000).pipe(startWith(0))` but only with a single operator.

Let's take that and plug it into our exisiting caching mechanism.

We have to set up a **timer** and for every _tick_ we want to make an HTTP request to fetch new data from the server. That is, for every tick we need to **switchMap** to an Observable that, on subscription, fetches a new list of jokes. Using `switchMap` has the positive side effect that we avoid race conditions. That's due to the nature of this operator because it will unsubscribe from the previously projected Observable and only emit values from the most recently projected Observable.

The rest of our cache remains untouched, meaning that our stream is still multicasted and all subscribers share one underlying source.

Again, the nature of `shareReplay` will broadcast new values to exisiting subscribers and replay the most recent value to new subscribers.

<img src="/images/timer_cache.png" width="100%" alt="timer based cache">

As we can see in the marble diagram, the timer emits a value every 10 seconds. For every value we switch to an inner Observable that fetches our data. Because we are using `switchMap`, we avoid race conditions and therefore the consumer only receives the value `1` and `3`. The value from the second inner Observable is "skipped" because we are already unsubscribed when the value arrives.

Let's apply our learnings and update the `JokeService` accordingly.

{% highlight js %}
{% raw %}
import { timer } from 'rxjs/observable/timer';
import { switchMap, shareReplay } from 'rxjs/operators';

const REFRESH_INTERVAL = 10000;

@Injectable()
export class JokeService {
  private cache$: Observable<Array<Joke>>;

  constructor(private http: HttpClient) { }

  get jokes() {
    if (!this.cache$) {
      // Set up timer that ticks every X milliseconds
      const timer$ = timer(0, REFRESH_INTERVAL);

      // For each tick make an http request to fetch new data
      this.cache$ = timer$.pipe(
        switchMap(_ => this.requestJokes()),
        shareReplay(CACHE_SIZE)
      );
    }

    return this.cache$;
  }

  ...
}
{% endraw %}
{% endhighlight %}

Awesome! Wanna try it out yourself? Go ahead and play with the following live demo. From the dashboard, go to the list component and then watch the magic happening. Give it a few seconds so that you can see the update in action. Remember, the cache is refreshed every **10 seconds**, but feel free to fiddle with the `REFRESH_INTERVAL`.

<iframe style="height: 500px" src="https://stackblitz.com/edit/advanced-caching-with-rxjs-step-2?ctl=1&embed=1&file=app/joke.service.ts&view=preview" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Sending update notifications

Let's recap for a moment what we have built so far.

When we request data from our `JokeService` we always prefer to request that data from a cache rather than requesting it from the server every time. The underlying data of this cache is refreshed every 10 seconds and when this happens, the data is propagated to the component causing the UI to update automatically.

That's unfortunate. Imagine we're a user that is reading one of the jokes and all of the sudden it's gone because the UI is updated automatically. That's super annoying and a bad user experience.

Therefore, our users should rather receive **notifications** when there's new data available. In other words, we want the user to enforce the UI update.

It turns out that we don't have to touch our service in order to implement this. The logic is quite simple. After all, our service should not worry about sending notifications and the view should be in charge when and how to update the data on the screen.

First, we have to get an **initial value** to show something to the user, because otherwise the screen will be blank until the cache was updated the first time. We'll see why in just a moment. Setting up a stream for the inital value is as easy as calling the getter function. Additionally, since we are only interested in the very first value we can use the `take` operator.

To make this logic reusable we create a helper methode `getDataOnce()`.

{% highlight js %}
{% raw %}
import { take } from 'rxjs/operators';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  ...
  ngOnInit() {
    const initialJokes$ = this.getDataOnce();
    ...
  }

  getDataOnce() {
    return this.jokeService.jokes.pipe(take(1));
  }
  ...
}
{% endraw %}
{% endhighlight %}

From our requirements we know that we only want to update the UI when the user really enforces an update rather than reflecting the change automatically. How does the user enforce an update you ask? This happens when we click on a button in the UI that says "Update". This button is shown together with the notification. For now, let's not worry about the notification and instead focus on the logic that updates the UI when we click that button.

To make this work, we need a way to create an Observable from DOM events, specifically from button clicks. There are several ways but a very common way is to use a `Subject` as a **bridge** between the template and the view logic that lives in the component class. In a nutshell, a Subject is a type that implements both `Observer` and `Observable` types. Observables define the data flow and produce the data while Observers can subscribe to Observables and receive the data.

The good thing about the Subject here is that we can simply use an event binding in the template and then call `next` when the event is triggered. This will cause the specified value to be broadcasted to all Observers that are listening for values. Note that we can also omit the value if the Subject is of type `void`. In fact, this is true for our case.

Let's go ahead and instantiate a new Subject.

{% highlight js %}
{% raw %}
import { Subject } from 'rxjs/Subject';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  update$ = new Subject<void>();
  ...
}
{% endraw %}
{% endhighlight %}

Now we can go ahead and wire this up in the template.

{% highlight html %}
{% raw %}
<div class="notification">
  <span>There's new data available. Click to reload the data.</span>
  <button mat-raised-button color="accent" (click)="update$.next()">
    <div class="flex-row">
      <mat-icon>cached</mat-icon>
      UPDATE
    </div>
  </button>
</div>
{% endraw %}
{% endhighlight %}

See how we use the **event binding** syntax to capture the click event on the `<button>`? When we click on the button we simply propagate a _ghost_ value causing all active Observers to be notified. We call it ghost value because we are not actually passing in any value, or at least a value of type `void`.

Another way would be to use the `@ViewChild()` decorator in combination with the `fromEvent` operator from RxJS. However, this requires us to "mess" with the DOM and query an HTML element from the view. With a Subject we are actually just bridging the two sides and don't really touch the DOM at all except the event binding we are adding to the button.

Alright, with the view being setup we can now switch to the logic that takes care of updating the UI.

So what does it mean to update the UI? Well, the cache is updated in the background automatically and we want to render the most recent value from the cache when we click on that button, right? This means that our **source** stream in this case is the Subject. Every time a value is broadcasted on `update$` we want to **map** this value to an Observable that gives us the latest cached value. In other words, we are dealing with a so-called **Higher Order Observable**, an Observable that emits Observables.

From before we should know that there's `switchMap` that solves exactly this problem. This time we'll use `mergeMap` instead. This operator behaves very similar to `switchMap` with the difference that it does not unsubscribe from the previously projected inner Observable and simply merges the inner emissions in the output Observable.

In fact, when requesting the most recent value from the cache, the HTTP request is already done and the cache was successfully updated. Therefore, we don't really face the problem of race-conditions here. Though it seems to be asynchronous, it's actually somewhat **synchronous** because the value will be emitted in the same _tick_.

{% highlight js %}
{% raw %}
import { Subject } from 'rxjs/Subject';
import { mergeMap } from 'rxjs/operators';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  update$ = new Subject<void>();
  ...

  ngOnInit() {
    ...
    const updates$ = this.update$.pipe(
      mergeMap(() => this.getDataOnce())
    );
    ...
  }
  ...
}
{% endraw %}
{% endhighlight %}

Sweet! For every "update" we request the latest value from the cache using our helper method we implemented earlier.

From here, it's only a small step to come up with the stream for the jokes that are rendered onto the screen. All we have to do is to merge the initial list of jokes with our `update$` stream.

{% highlight js %}
{% raw %}
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { merge } from 'rxjs/observable/merge';
import { mergeMap } from 'rxjs/operators';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  jokes$: Observable<Array<Joke>>;
  update$ = new Subject<void>();
  ...

  ngOnInit() {
    const initialJokes$ = this.getDataOnce();

    const updates$ = this.update$.pipe(
      mergeMap(() => this.getDataOnce())
    );

    this.jokes$ = merge(initialJokes$, updates$);
    ...
  }
  ...
}
{% endraw %}
{% endhighlight %}

It's important that we use our helper method `getDataOnce()` to map each update event to the latest cached value. If we recall, it uses `take(1)` internally which will take the first value and then **complete** the stream. This is crucial because otherwise we'd end up with an on-going stream or live connection to the cache. In this case we would basically break our logic of enforcing a UI update only by clicking the "Update" button.

Also, because the underlying cache is multicasted, it's totally safe to always re-subscribe to the cache to get the latest value.

Before we continue with the notification stream, let's stop for a moment and visualize what we just implemented as a marble diagram.

<img src="/images/jokes.png" width="100%" alt="jokes">

As we can see in the diagram above, `initialJokes$` is crucial because otherwise we'd only see something on the screen when we click "Update". While the data is already updated in the background every 10 seconds, there's no way we can press this button. That's because the button is part of the notification and we never really show it to the user.

Let's fill this gap and implement the missing functionality to complete the puzzle.

For that, we have to create an Observable that is responsible for showing or hiding the notification. Essentially, we need a stream that either emits `true` or `false`. We want the value to be `true` when there's an update, and `false` when the user clicks on the "Update" button.

In addition we want to **skip** the first (initial) value emitted by our cache because it's not really a refresh.

If we think in terms of streams, we can break this up into multiple streams and **merge** them together to turn them into a single Observable. The final stream then has the desired behavior to show or hide notifications.

Enough theory! Here's the code:

{% highlight js %}
{% raw %}
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { skip, mapTo } from 'rxjs/operators';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  showNotification$: Observable<boolean>;
  update$ = new Subject<void>();
  ...

  ngOnInit() {
    ...
    const initialNotifications$ = this.jokeService.jokes.pipe(skip(1));
    const show$ = initialNotifications$.pipe(mapTo(true));
    const hide$ = this.update$.pipe(mapTo(false));
    this.showNotification$ = merge(show$, hide$);
  }
  ...
}
{% endraw %}
{% endhighlight %}

Here, we listen for all values emitted by our cache but skip the first because it's not a **refresh**. For every new value on `initialNotifications$` we map it to `true` to show the notification. Once we click the "Update" button in the notification, a value is produced on `update$` and we can simply map it to `false` causing the notification to disappear.

Let's use `showNotification$` inside the template of the `JokeListComponent` to toggle a class that either shows or hides the notification.

{% highlight html %}
{% raw %}
<div class="notification" [class.visible]="showNotification$ | async">
  ...
</div>
{% endraw %}
{% endhighlight %}

Yay! We are getting really close to the final solution. But before we continue, let's try it out and play around with the live demo. Take your time and go through the code step by step again.

<iframe style="height: 500px" src="https://stackblitz.com/edit/advanced-caching-with-rxjs-step-3?ctl=1&embed=1&file=app/joke.service.ts&view=preview" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Fetching new data on demand

Awesome! We have come a long way and already implemented a few very cool features for our cache. To finish up this article and take our cache to a whole new level, there's one thing left for us to do. As a user we want to be able to **force** an update at any point in time.

It's not really that complicated but we have to touch both the component and the service to make this work.

Let's start with our service. What we need is a public facing API that will force the cache to reload the data. Technically speaking, we'll **complete** the current cache and set it to `null`. This means that the next time we request the data from our service we will set up a new cache, fetch the data and store this for future subscribers. It's not a big deal to create a new cache every time we enforce an update because it will be completed and eventually garbage collected. In fact, this has the positive side effect that we also **reset** the timer which is absolutely desired. Let's say we have waited 9 seconds and now click "Fetch new Jokes". We expect the data to be refreshed, but we don't to see a notification popping up 1 second later. Instead we want to restart the timer so that when we enforce an update it another 10 seconds to trigger the **automatic update**.

Another reason for the destroying the cache is that it's much less complex compared to a mechanism that keeps the cache running all the time. If that's the case then the cache needs to be aware of whether a reload was enforced or not.

Let's create a Subject that we use to tell the cache to complete. We'll leverage `takeUntil` and pluck it into our `cache$` stream. In addition, we implement a public facing API that, internally, sets the cache to `null` and also broadcasts an event on our Subject.

{% highlight js %}
{% raw %}
import { Subject } from 'rxjs/Subject';
import { timer } from 'rxjs/observable/timer';
import { switchMap, shareReplay, map, takeUntil } from 'rxjs/operators';

const REFRESH_INTERVAL = 10000;

@Injectable()
export class JokeService {
  private reload$ = new Subject<void>();
  ...

  get jokes() {
    if (!this.cache$) {
      const timer$ = timer(0, REFRESH_INTERVAL);

      this.cache$ = timer$.pipe(
        switchMap(() => this.requestJokes()),
        takeUntil(this.reload$),
        shareReplay(CACHE_SIZE)
      );
    }

    return this.cache$;
  }

  forceReload() {
    // Calling next will complete the current cache instance
    this.reload$.next();

    // Setting the cache to null will create a new cache the
    // next time 'jokes' is called
    this.cache$ = null;
  }

  ...
}
{% endraw %}
{% endhighlight %}

This alone doesn't do much, so let's go ahead and use that in our `JokeListComponent`. For this we'll implement a function `forceReload()` that is called whenever we click on the button that says "Fetch new Jokes". Also, we need to create a Subject that is used as an event bus for updating the UI as well as showing the notifications. We'll see in a moment where this comes into play.

{% highlight js %}
{% raw %}
import { Subject } from 'rxjs/Subject';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  forceReload$ = new Subject<void>();
  ...

  forceReload() {
    this.jokeService.forceReload();
    this.forceReload$.next();
  }
  ...
}
{% endraw %}
{% endhighlight %}

With this in place we can wire up the button in the template of the `JokeListComponent` to force the cache to reload the data. All we have to do is listen for the `click` event using Angular's event binding syntax and call `forceReload()`.

{% highlight html %}
{% raw %}
<button class="reload-button" (click)="forceReload()" mat-raised-button color="accent">
  <div class="flex-row">
    <mat-icon>cached</mat-icon>
    FETCH NEW JOKES
  </div>
</button>
{% endraw %}
{% endhighlight %}

This already works, but only if we go back to the dashboard and then again to the list view. This is of course not what we want. We want the UI to update **immediately** when we force the cache to reload the data.

Remeber that we have implemented a stream `updates$` that, when we click on "Update", requests the latest data from our cache? It turns out that we need exactly the same behavior, so we can go ahead and extend this stream. This means we have to **merge** both `update$` and `forceReload$`, because those two streams are the sources for updating the UI.

{% highlight js %}
{% raw %}
import { Subject } from 'rxjs/Subject';
import { merge } from 'rxjs/observable/merge';
import { mergeMap } from 'rxjs/operators';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  update$ = new Subject<void>();
  forceReload$ = new Subject<void>();
  ...

  ngOnInit() {
    ...
    const updates$ = merge(this.update$, this.forceReload$).pipe(
      mergeMap(() => this.getDataOnce())
    );
    ...
  }
  ...
}
{% endraw %}
{% endhighlight %}

That was easy, wasn't it? Yea but we are not done. In fact, we just "broke" our notifications. It all works just fine until we click "Fetch new Jokes". The data is updated on the screen as well as in our cache, but when we wait 10 seconds there's no notification popping up. The problem here is that forcing an update will complete the cache instance, meaning we no longer receive values in the component. The notification stream (`initialNotifications$`) is basically dead. That's unfortunate, so how can we fix this?

Quite easy! We listen for events on `forceReload$` and for every value we switch to a new notification stream. Important here is that we **unsubscribe** from the **previous** stream. Does that ring a bell? Sounds a lot like we need `switchMap` here, doesn't it?

Let's get our hands dirty and implement this!

{% highlight js %}
{% raw %}
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { merge } from 'rxjs/observable/merge';
import { take, switchMap, mergeMap, skip, mapTo } from 'rxjs/operators';

@Component({
  ...
})
export class JokeListComponent implements OnInit {
  showNotification$: Observable<boolean>;
  update$ = new Subject<void>();
  forceReload$ = new Subject<void>();
  ...

  ngOnInit() {
    ...
    const reload$ = this.forceReload$.pipe(switchMap(() => this.getNotifications()));
    const initialNotifications$ = this.getNotifications();
    const show$ = merge(initialNotifications$, reload$).pipe(mapTo(true));
    const hide$ = this.update$.pipe(mapTo(false));
    this.showNotification$ = merge(show$, hide$);
  }

  getNotifications() {
    return this.jokeService.jokes.pipe(skip(1));
  }
  ...
}
{% endraw %}
{% endhighlight %}

That's it. Whenever `forceReload$` emits a value we unsubscribe from the previous Observable and switch to a new _notification_ stream. Note that there's a piece of code that we needed twice, that is `this.jokeService.jokes.pipe(skip(1))`. Instead of repeating ourselves, we created a function `getNotifications()` that simply returns a stream of jokes but **skips** the first value. Finally, we merge both `initialNotifications$` and `reload$` together into one stream called `show$`. This stream is responsible for showing the notification on the screen. There's also no need to unsubscribe from `initialNotifications$` because this stream completes before the cache is re-created on the next subscription. The rest stays the same.

Puh, we did it. Let's take a moment and look at a more visual representation of what we just implemented.

<img src="/images/notification_cache.png" width="100%" alt="notification system">

As we can see in the marble diagrams, `initialNotifications$` is very important for showing notifications. If we were missing this particular stream then we would only see a notification when we force the cache to update. That said, when we request new data on demand, we have to constantly switch to a new notification stream because the previous (old) Observable will complete and no longer emit values.

That's it! We've made it and implemented a sophisticated caching mechanism using RxJS and the tools provided by Angular. To recap, our service exposes a stream that gives us a list of jokes. The underlying HTTP request is periodically triggered every 10 seconds to update the cache. To improve the user experience, we show a notification so that the user has to enforce an update of the UI. On top of that, we have implemented a way for the user to request new data on demand.

Awesome! Here's the final solution. Take a few minutes to review the code once again. Try out different scenarios to see if everything works as expected.

<iframe style="height: 500px" src="https://stackblitz.com/edit/advanced-caching-with-rxjs-step-4?ctl=1&embed=1&file=app/joke.service.ts&view=preview" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Outlook

If you want some homework or brain food for later, here are some thoughts for improvements:

- Add error handling
- Refactor the logic from the component into a service to make it reusable

## Special Thanks

Special thanks to [Kwinten Pisman](https://twitter.com/KwintenP) for helping me with the code. Also, I'd like to thank [Ben Lesh](https://twitter.com/BenLesh) and [Brian Troncone](https://twitter.com/BTroncone) for giving me valuable feedback and pointing out a few improvements. In addition, big thanks to [Christoph Burgdorf](https://twitter.com/cburgdorf) for reviewing my article as well as the code.