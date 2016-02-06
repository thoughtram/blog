---
layout:     post
title:      "Taking advantage of Observables in Angular 2 - Part 2"
relatedLinks:
  -
    title: "Taking advantage of Observables in Angular 2"
    url: "http://blog.thoughtram.io/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html"
  -
    title: "Exploring Angular 2 - Article Series"
    url: "http://blog.thoughtram.io/exploring-angular-2"

date:       2016-01-07
update_date: 2015-01-07
summary:    "This is a follow up article that demonstrates how Observables can influence our API design."

categories:
  - angular

tags:
  - angular2

topic: http
author: christoph_burgdorf
---

In a [previous post](http://blog.thoughtram.io/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html) we showed how to leverage Observables, and especially their strength of composability to ease complicated async tasks.

As a recap, we built a simple wikipedia search demo consisting of a `WikipediaService` to query a JSONP API.

{% highlight ts %}
import {Injectable} from 'angular2/core';
import {URLSearchParams, Jsonp} from 'angular2/http';

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
                .map((response) => response.json()[1]);
  }
}
{% endhighlight %}

We also built an `App` component that uses this service and applies some Rx gymnastics to tame the user input, prevent duplicate requests and deal with out-of-order responses.

{% highlight ts %}
@Component({
  selector: 'my-app',
  template: `
    <div>
      <h2>Wikipedia Search</h2>
      <input type="text" [ngFormControl]="term"/>
      <ul>
        <li *ngFor="#item of items | async">{{item}}</li>
      </ul>
    </div>
  `
})
export class App {
  items: Observable<Array<string>>;
  term = new Control();
  constructor(private wikipediaService: WikipediaService) {
    this.items = this.term.valueChanges
                 .debounceTime(400)
                 .distinctUntilChanged()
                 .switchMap(term => this.wikipediaService.search(term));
  }
}
{% endhighlight %}

Thinking ahead we can refactor our code even further and let our API design leverage from the power of Observables.

##Observables = Promises + Events (in a way!)

In a way Observables may be seen as the clever child of Events and Promises. Promises are first class objects that encapsulate the state of an asynchronous operation. But they are for singular operations only. A request is such an operation. You invoke a method, kicking off some async task and get a first class object that eventually will get you to the result of the operation (ignoring error handling for now).

Events on the other hand are for async operations that can continue to emit new values for an infinite duration. But Unfortunately they are traditionally not represented in a format that matches the criteria of a first class object. You can't just pass an event of clicks around that skips every third click for instance.

Well, with Observables you can. You get the power of first class objects but without the limitations of singularity.

In fact, in a modern .NET language such as F#, which embraces Observables all the way down, every `IEvent<T>` inherits from `IObservable<T>`. Angular also went down this path and made `EventEmiter<T>` implement `Observable<T>`.

## Smart service, dumb component

With that in mind: wouldn't it be actually nice if we could save the component from dealing with all these edge cases? What if we just make the debounce duration configureable but let the rest of the complexity be handled by our `WikipediaService`?

To let code speak we can transform our `WikipediaService` into this.

{% highlight ts %}
@Injectable()
export class WikipediaService {
  constructor(private jsonp: Jsonp) {}

  search(terms: Observable<string>, debounceDuration = 400) {
    return terms.debounceTime(debounceDuration)
                .distinctUntilChanged()
                .switchMap(term => this.rawSearch(term));
  }

  rawSearch (term: string) {
    var search = new URLSearchParams()
    search.set('action', 'opensearch');
    search.set('search', term);
    search.set('format', 'json');
    return this.jsonp
                .get('http://en.wikipedia.org/w/api.php?callback=JSONP_CALLBACK', { search })
                .map((response) => response.json()[1]);
  }
}
{% endhighlight %}

Notice that the service still exposes the previous api as `rawSearch` and builds a more clever `search` API on top of it.

This dramatically simplifies our `App` component.

{% highlight ts %}
@Component({
  selector: 'my-app',
  template: `
    <div>
      <h2>Wikipedia Search</h2>
      <input type="text" [ngFormControl]="term"/>
      <ul>
        <li *ngFor="#item of items | async">{{item}}</li>
      </ul>
    </div>
  `
})
export class App {
  items: Observable<Array<string>>;
  term = new Control();
  constructor(private wikipediaService: WikipediaService) {
    this.items = wikipediaService.search(this.term.valueChanges);
  }
}
{% endhighlight %}

See what happened? We just wire together event streams like lego blocks!

You can play around with the plnkr right here. Enjoy!

<iframe src="http://embed.plnkr.co/GNi2FVAofVEzSUQ8kEYY/"></iframe>
