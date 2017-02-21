---
layout: post
title: Taking advantage of Observables in Angular
imageUrl: /images/banner/taking-advantage-of-observables.png
date: 2016-01-06T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  Since version 2.x Angular favors Observables over Promises when it comes to
  async.  In this article we explore some practical advantages for server
  communication.
categories:
  - angular
tags:
  - angular2
  - rx
  - observables
topic: http
videos:
  - url: 'http://casts.thoughtram.io/embedded/181311616'
  - url: 'http://casts.thoughtram.io/embedded/181311614'
  - url: 'http://casts.thoughtram.io/embedded/181311611'
  - url: 'http://casts.thoughtram.io/embedded/181311613'
  - url: 'http://casts.thoughtram.io/embedded/181311609'
  - url: 'http://casts.thoughtram.io/embedded/181311615'
demos:
  - url: 'http://plnkr.co/edit/8ap1Lm?p=preview'
    title: Basic Wikipedia search using Angular 2
  - url: 'http://embed.plnkr.co/SIltBL/'
    title: Smart Wikipedia search using Angular 2
author: christoph_burgdorf
related_posts:
  - 'Exploring Rx Operators: flatMap'
  - Taking advantage of Observables in Angular 2 - Part 2
  - Cold vs Hot Observables
  - 'Exploring Rx Operators: map'
  - Using Zones in Angular for better performance
  - Making your Angular apps fast
related_videos:
  - '181311615'
  - '181311609'
  - '181311613'
  - '181311611'
  - '181311614'
  - '181311616'

---

Some people seem to be confused why Angular seems to favor the Observable abstraction over the Promise abstraction when it comes to dealing with async behavior.

There are pretty good resources about the difference between Observables and Promises already out there. I especially like to highlight this free [7 minutes video](https://egghead.io/lessons/rxjs-rxjs-observables-vs-promises) by [Ben Lesh](https://twitter.com/benlesh) on egghead.io. Technically there are a couple of obvious differences like the *disposability* and *lazyness* of Observables. In this article we like to focus on some practical advantages that Observables introduce for server communication.

{% include demos-and-videos-buttons.html post=page %}

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## The scenario

Consider you are building a search input mask that should instantly show you results as you type.

If you've ever build such a thing before you are probably aware of the challenges that come with that task.

**1. Don't hit the search endpoint on every key stroke**

Treat the search endpoint as if you pay for it on a per-request basis. No matter if it's your own hardware or not. We shouldn't be hammering
the search endpoint more often than needed. Basically we only want to hit it once the user has *stopped typing* instead of with every keystroke.

**2. Don't hit the search endpoint with the same query params for subsequent requests**

Consider you type *foo*, stop, type another *o*, followed by an immediate backspace and rest back at *foo*. That should be just one request with the term *foo* and not two even if we technically stopped twice after we had *foo*  in the search box.

**3. Deal with out-of-order responses**

When we have multiple requests in-flight at the same time we must account for cases where they come back in unexpected order. Consider we first typed
*computer*, stop, a request goes out, we type *car*, stop, a request goes out. Now we have two requests in-flight. Unfortunately the request that carries the results for *computer* comes back
after the request that carries the results for *car*. This may happen because they are served by different servers. If we don't deal with such cases properly we may end up showing results for *computer* whereas the search box reads *car*.

## Challenge accepted

We will use the free and open wikipedia API to write a little demo.

For simplicity our demo will simply consist of two files: `app.ts` and `wikipedia-service.ts`. In a real world scenario we would most likely split things further up though.

Let's start with a Promise-based implementation that doesn't handle any of the described edge cases.

This is what our `WikipediaService` looks like. Despite the fact that the Http/JsonP API still has some little unergonomic parts, there shouldn't be much of surprise here.

{% highlight js %}
{% raw %}
import { Injectable } from '@angular/core';
import { URLSearchParams, Jsonp } from '@angular/http';

@Injectable()
export class WikipediaService {
  constructor(private jsonp: Jsonp) {}

  search (term: string) {
    var search = new URLSearchParams()
    search.set('action', 'opensearch');
    search.set('search', term);
    search.set('format', 'json');
    return this.jsonp
                .get('http://en.wikipedia.org/w/api.php?callback=JSONP_CALLBACK', { search })
                .toPromise()
                .then((response) => response.json()[1]);
  }
}
{% endraw %}
{% endhighlight %}

Basically we are injecting the `Jsonp` service to make a `GET` request against the wikipedia API with a given search term. Notice that we call `toPromise` in order to get from an `Observable<Response>` to a `Promise<Response>`. With a little bit of `then`-chaining we eventually end up with a `Promise<Array<string>>` as the return type of our `search` method.

So far so good, let's take a look at the `app.ts` file that holds our `App` Component.

{% highlight js %}
{% raw %}
// check the plnkr for the full list of imports
import {...} from '...';

@Component({
  selector: 'my-app',
  template: `
    <div>
      <h2>Wikipedia Search</h2>
      <input #term type="text" (keyup)="search(term.value)">
      <ul>
        <li *ngFor="let item of items">{{item}}</li>
      </ul>
    </div>
  `
})
export class AppComponent {
  items: Array<string>;

  constructor(private wikipediaService: WikipediaService) {}

  search(term) {
    this.wikipediaService.search(term)
                         .then(items => this.items = items);
  }
}
{% endraw %}
{% endhighlight %}

Not much of a surprise here either. We inject our `WikipediaService` and expose it's functionality via a `search` method to the template. The template simply binds to `keyup` and calls `search(term.value)` leveraging Angular's awesome *template ref* feature.

We unwrap the result of the `Promise` that the `search` method of the `WikipediaService` returns and expose it as a simple Array of strings to the template so that we can have `*ngFor` loop through it and build up a list for us.

You can play with the demo and fiddle with the code through this plnkr.

{% include plunk.html url="http://embed.plnkr.co/Vp5ZmAAT68FqeKlBCp0Y/" %}

Unfortunately this implementation doesn't address any of the described edge cases that we would like to deal with. Let's refactor our code to make it match the expected behavior.

**Taming the user input**

Let's change our code to not hammer the endpoint with every keystroke but instead only send a request when the user stopped typing for 400 ms. This is where Observables really shine. The Reactive Extensions (Rx) offer a broad range of operators that let us alter the behavior of Observables and create new Observables with the desired semantics.

To unveil such super powers we first need to get an `Observable<string>` that carries the search term that the user types in. Instead of manually binding to the `keyup` event, we can take advantage of Angular's `formControl` directive. To use this directive, we first need to import the `ReactiveFormsModule` into our application module.

{% highlight js %}
{% raw %}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { JsonpModule } from '@angular/http';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [BrowserModule, JsonpModule, ReactiveFormsModule]
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

Once imported, we can use `formControl` from within our template and set it to the name `"term"`.

{% highlight js %}
{% raw %}
<input type="text" [formControl]="term"/>
{% endraw %}
{% endhighlight %}

In our component we create an instance of `FormControl` from `@angular/form` and expose it as a field under the name `term` on our component.

Behind the scenes `term` automatically exposes an `Observable<string>` as property `valueChanges` that we can subscribe to. Now that we have an `Observable<string>`, taming the user input is as easy as calling `debounceTime(400)` on our Observable. This will return a new `Observable<string>` that will only emit a new value when there haven't been coming new values for 400ms.

{% highlight js %}
{% raw %}
export class App {
  items: Array<string>;
  term = new FormControl();
  constructor(private wikipediaService: WikipediaService) {
    this.term.valueChanges
             .debounceTime(400)
             .subscribe(term => this.wikipediaService.search(term).then(items => this.items = items));
  }
}
{% endraw %}
{% endhighlight %}

**Don't hit me twice**

As we said, it would be a waste of resources to send out another request for a search term that our app already shows the results for. Fortunately Rx simplifies many operations that it nearly feels unnecessary to mention them. All we have to do to achieve the desired behavior is to call the `distinctUntilChanged` operator right after we called `debounceTime(400)`. Again, we will get back an `Observable<string>` but one that ignores values that are the same as the previous.

**Dealing with out-of-order responses**

Dealing with out of order responses can be a tricky task. Basically we need a way to express that we aren't interested anymore in results from previous in-flight requests as soon as we are sending out new requests. In other words: cancel out all previous request as soon as we start a new one. As I briefly mentioned in the beginning Observables are disposable which means we can unsubscribe from them.

This is where we want to change our `WikipediaService` to return an `Observable<Array<string>>` instead of an `Promise<Array<string>>`. That's as easy as dropping `toPromise` and using `map` instead of `then`.

{% highlight js %}
{% raw %}
search (term: string) {
  var search = new URLSearchParams()
  search.set('action', 'opensearch');
  search.set('search', term);
  search.set('format', 'json');
  return this.jsonp
              .get('http://en.wikipedia.org/w/api.php?callback=JSONP_CALLBACK', { search })
              .map((response) => response.json()[1]);
}
{% endraw %}
{% endhighlight %}

Now that our `WikipediaSerice` returns an Observable instead of a Promise we simply need to replace `then` with `subscribe` in our `App` component.

{% highlight js %}
{% raw %}
this.term.valueChanges
           .debounceTime(400)
           .distinctUntilChanged()
           .subscribe(term => this.wikipediaService.search(term).subscribe(items => this.items = items));
{% endraw %}
{% endhighlight %}

But now we have two `subscribe` calls. This is needlessly verbose and often a sign for unidiomatic usage.
The good news is, now that `search` returns an `Observable<Array<string>>` we can simply use `flatMap` to project our `Observable<string>` into the desired `Observable<Array<string>>` by composing the Observables.

{% highlight js %}
{% raw %}
this.term.valueChanges
         .debounceTime(400)
         .distinctUntilChanged()
         .flatMap(term => this.wikipediaService.search(term))
         .subscribe(items => this.items = items);
{% endraw %}
{% endhighlight %}

You may be wondering what `flatMap` does and why we can't use `map` here. The answer is quite simple. The `map` operator expects a function that takes a value `T` and returns a value `U`. For instance a function that takes in a `string` and returns a `Number`. Hence when you use `map` you get from an `Observable<T>` to an `Observable<U>`. However, our `search` method produces an `Observable<Array>` itself. So coming from an `Observable<string>` that we have right after `distinctUntilChanged`, map would take us to an `Observable<Observable<Array<string>>`. That's not quite what we want.

The `flatMap` operator on the other hand expects a function that takes a `T` and returns an `Observable<U>` and produces an `Observable<U>` for us.

**NOTE**: *That's not entirely true, but it helps as a simplification*.

That perfectly matches our case. We have an `Observable<string>`, then call `flatMap` with a function that takes a `string` and returns an `Observable<Array<string>>`.

So does this solve our out-of-order response issues? Unfortunately not. So, why am I bothering you with all this in the first place? Well, now that you understood `flatMap` just replace it with `switchMap` and you are done.

What?! You may be wondering if I'm kidding you but no I am not. That's the beautify of Rx with all it's useful operators. The `switchMap` operator is comparable to `flatMap` in a way. Both operators automatically subscribe to the Observable that the function produces and flatten the result for us. The difference is that the `switchMap` operator automatically unsubscribes from previous subscriptions as soon as the outer Observable emits new values.

## Putting some sugar on top

Now that we got the semantics right, there's one more little trick that we can use to save us some typing. Instead of manually subscribing to the Observable we can let Angular do the unwrapping for us right from within the template. All we have to do to accomplish that is to use the `AsyncPipe` in our template and expose the `Observable<Array<string>>` instead of `Array<string>`.

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-app',
  template: `
    <div>
      <h2>Wikipedia Search</h2>
      <input type="text" [formControl]="term"/>
      <ul>
        <li *ngFor="let item of items | async">{{item}}</li>
      </ul>
    </div>
  `
})
export class App {

  items: Observable<Array<string>>;
  term = new FormControl();

  constructor(private wikipediaService: WikipediaService) {
    this.items = this.term.valueChanges
                 .debounceTime(400)
                 .distinctUntilChanged()
                 .switchMap(term => this.wikipediaService.search(term));
  }
}
{% endraw %}
{% endhighlight %}

And voilà, we're done. Check out the demos below!
