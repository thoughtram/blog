---
layout: post
title: Three things you didn't know about the AsyncPipe
imageUrl: /images/banner/three-things-about-the-async-pipe.jpg
date: 2017-02-27T00:00:00.000Z
summary: >-
  This article explains three lesser known features of the AsyncPipe that help
  us to write better async code.
categories:
  - angular
tags:
  - angular2
  - observables
  - rx
  - asyncpipe
author: christoph_burgdorf
related_posts:
  - Taming snakes with reactive streams
  - 'Exploring Rx Operators: flatMap'
  - Taking advantage of Observables in Angular 2 - Part 2
  - Taking advantage of Observables in Angular
  - Advanced caching with RxJS
  - Cold vs Hot Observables
related_videos:
  - '181311615'
  - '181311609'
  - '181311613'
  - '181311611'
  - '181311614'
  - '181311616'

---


You sure heard about Angular's `AsyncPipe` haven't you? It's this handy little pipe that we can use from within our templates so that we don't have to deal with unwrapping data from Observables or Promises imperatively. Turns out the `AsyncPipe` is full of little wonders that may not be obvious at first sight. In this article we like to shed some light on the inner workings of this useful little tool.


<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Subscribing to long-lived Observables

Often when we think about the `AsyncPipe`, we only think about values that resolve from some http call. We issue an http call, get an `Observable<Response>` back, apply some transformations (e.g. `map(...).filter(...)`) and finally expose an Observable to the template of our component. Here is what that typically looks like.

{% highlight js %}
{% raw %}
...
@Component({
  ...
  template: `
    <md-list>
      <a md-list-item
        *ngFor="let contact of contacts | async"
        title="View {{contact.name}} details">
        <img md-list-avatar [src]="contact.image" alt="Picture of {{contact.name}}">
        <h3 md-line>{{contact.name}}</h3>
      </a>
    </md-list>`,
})
export class ContactsListComponent implements OnInit {

  contacts: Observable<Array<Contact>>;

  constructor(private contactsService: ContactsService) {}

  ngOnInit () {
    this.contacts = this.contactsService.getContacts();
  }
}
{% endraw %}
{% endhighlight %}

In the described scenario our Observable is what we like to refer to as short-lived. The Observable emits exactly one value - an array of contacts in this case - and completes right after that. That's the typical scenario when working with http and it's basically the only scenario when working with Promises.

However, we can totally have Observables that emit multiple values. Think about working with websockets for instance. We may have an array that builds up over time! Let's simulate an Observable that emits an array of numbers. But instead of emitting just a single array once, it will emit an array every time a new item was added. To not let the array grow infinitely we will limit it to the last five items.

{% highlight js %}
{% raw %}
...
@Component({
  selector: 'my-app',
  template: `
    <ul>
      <li *ngFor="let item of items | async">{{item}}</li>
    </ul>`
})
export class AppComponent {
  items = Observable.interval(100)
                    .scan((acc, cur)=>[cur, ...acc].slice(0, 5), []);             
}
{% endraw %}
{% endhighlight %}

{% include plunk.html url="http://embed.plnkr.co/qG9tOINwYPL0gKf2Pxqd/" %}

Notice how our list is kept nicely in sync without further ado thanks to the `AsyncPipe`!

## Keeping track of references

Let's back of and refactor above code to what it would look like without the help of the `AsyncPipe`. But while we're at it, let's introduce a button to restart generating numbers and pick a random background color for the elements each time we regenerate the sequence.

{% highlight js %}
{% raw %}
...
@Component({
  selector: 'my-app',
  template: `
    <button (click)="newSeq()">New random sequence</button>
    <ul>
      <li [style.background-color]="item.color"
          *ngFor="let item of items">{{item.num}}</li>
    </ul>`
})
export class AppComponent {
  items = [];

  constructor () {
    this.newSeq();
  }

  newSeq() {

    // generate a random color
    let color = '#' + Math.random().toString(16).slice(-6);

    Observable.interval(1000)
          .scan((acc, num)=>[{num, color }, ...acc].slice(0, 5), [])
          .subscribe(items => this.items = items);
  }
}
{% endraw %}
{% endhighlight %}

{% include plunk.html url="http://embed.plnkr.co/sxYyq3m4PfnLfyeGW1Gx/" %}


Click on the button and play with the demo. Notice something? The color flips back and forth between more and more different colors with every click of the button. That's because in this case the Observable is what we like to refer to as long-lived. And furthermore, every time we click the button we are creating one more of these long-lived Observables without cleaning up the previous.

Let's refactor the code to track subscriptions and tear down our long-lived Observable every time that we create a new one.

{% highlight js %}
{% raw %}
...
export class AppComponent {
  ...
  subscription: Subscription;

  newSeq() {

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // generate a random color
    let color = '#' + Math.random().toString(16).slice(-6);

    this.subscription = Observable.interval(1000)
          .scan((acc, num)=>[{num, color }, ...acc].slice(0, 5), [])
          .subscribe(items => this.items = items);
  }
}
{% endraw %}
{% endhighlight %}

{% include plunk.html url="http://embed.plnkr.co/kRDcQJEJkiBErNGdKKNl/" %}

Every time we subscribe to our Observable we save the subscription in an instance member of our component. Then, when we run `newSeq` again we check if there's a subscription that we need to call `unsubscribe` on. That's why we don't see our list flipping between different colors anymore no matter how often we click the button.

Now meet the `AsyncPipe` again. Let's change the `ngFor` again to apply the `AsyncPipe` and get rid of all the manual bookkeeping. 

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-app',
  template: `
    <button (click)="newSeq()">New random sequence</button>
    <ul>
      <li [style.background-color]="item.color"
          *ngFor="let item of items | async">{{item.num}}</li>
    </ul>`
})
export class AppComponent {
  items: Observable<any>;

  constructor () {
    this.newSeq();
  }

  newSeq() {

    // generate a random color
    let color = '#' + Math.random().toString(16).slice(-6);

    this.items = Observable.interval(1000)
                           .scan((acc, num)=>[{num, color }, ...acc].slice(0, 5), []);
  }
}
{% endraw %}
{% endhighlight %}

{% include plunk.html url="http://embed.plnkr.co/Oga2810Sq4FJLA3klU7o/" %}

I'm sure you've heard that the `AsyncPipe` unsubscribes from Observables as soon as the component gets destroyed. But did you also know it unsubscribes as soon as the reference of the expression changes? That's right, as soon as we assign a new Observable to `this.items` the `AsyncPipe` will automatically unsubscribe from the previous bound Observable! Not only does this make our code nice and clean, it's protecting us from *very* subtle memory leaks.

## Marking things for check

Alright. We have one last nifty `AsyncPipe` feature for you! If you've read our article about [Angular's change detection](/angular/2016/02/22/angular-2-change-detection-explained.html) you sure know that you can speed up Angular's blazingly fast change detection even further using the `OnPush` strategy. Let's refactor our example and introduce a `SeqComponent` to display the sequences while our root component will manage the data and pass it on via an input binding.

Let's start creating the `SeqComponent` which is pretty straight forward.

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-seq',
  template: `
    <ul>
      <li [style.background-color]="item.color" 
          *ngFor="let item of items">{{item.num}}</li>
    </ul>`
})
export class SeqComponent {
  @Input()
  items: Array<any>;
}
{% endraw %}
{% endhighlight %}

Notice the `@Input()`decorator for `items` which means the component will receive those from the outside via a property binding.
Our root component maintains an array `seqs` and pushes new long-lived Observables into it with the click of a button. It uses an `*ngFor` to pass each of these Observables on to a new `SeqComponent` instance. Also notice that we are using the `AsyncPipe` in our property binding expression (`[items]="seq | async"`) to pass on the plain array instead of the Observable since that's what the `SeqComponent` expects.

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-app',
  template: `
    <button (click)="newSeq()">New random sequence</button>
    <ul>
      <my-seq *ngFor="let seq of seqs" [items]="seq | async"></my-seq>
    </ul>`
})
export class AppComponent {
  seqs = [];
  
  constructor () {
    this.newSeq();
  }
  
  newSeq() {
    
    // generate a random color
    let color = '#' + Math.random().toString(16).slice(-6);
    
    this.seqs.push(Observable.interval(1000)
                           .scan((acc, num)=>[{num, color }, ...acc].slice(0, 5), []));
  }
}
{% endraw %}
{% endhighlight %}

So far, we haven't made any changes to the underlying change detection strategy. If you click the button a couple of times, notice how we get multiple lists that update independently at a different timing.

{% include plunk.html url="http://embed.plnkr.co/aFqRxUXaokBTxqluKZTy/" %}

However, in terms of change detection, it means that all components are checked each time *any* of the Observables fire. That's a waste of resources. We can do better by setting the change detection for our `SeqComponent` to `OnPush` which means it will only check it's bindings if the inputs - the array in our case - changes.

{% highlight js %}
{% raw %}
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'my-seq',
  ...
})
{% endraw %}
{% endhighlight %}

That works and seems to be an easy quick win. But here comes the thing: It only works because our Observable creates an entirely new array each time it emits a new value. And even though that's actually not too bad and in fact beneficial in most scenarios, let's consider we use a different implementation which *mutates* the existing array rather than recreating it every time.

{% highlight js %}
{% raw %}
Observable.interval(1000)
          .scan((acc, num)=>{
            acc.splice(0, 0, {num, color});
            if (acc.length > 5) {
              acc.pop()
            }
            return acc;
          }, [])
{% endraw %}
{% endhighlight %}

If we try that out `OnPush` doesn't seem to work anymore because the reference of `items` simply won't change anymore. In fact, when we try that out we see each list doesn't grow beyond its first element.

{% include plunk.html url="http://embed.plnkr.co/FTfazxpTsya8n7cEkcDO/" %}

Meet the `AsyncPipe` again! Let's change our `SeqComponent` so that it takes an Observable instead of an array as its input.

{% highlight js %}
{% raw %}
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'my-seq',
  template: `
    <ul>
      <li [style.background-color]="item.color" 
          *ngFor="let item of items | async">{{item.num}}</li>
    </ul>`
})
export class SeqComponent {
  @Input()
  items: Observable<Array<any>>;
}
{% endraw %}
{% endhighlight %}

Also note that it now applies the `AsyncPipe` in its template since it's not dealing with a plain array anymore. Our `AppComponent` needs to be changed as well to **not** apply the `AsyncPipe` in the property binding anymore.


{% highlight js %}
{% raw %}
<ul>
  <my-seq *ngFor="let seq of seqs" [items]="seq"></my-seq>
</ul>
{% endraw %}
{% endhighlight %}

{% include plunk.html url="http://embed.plnkr.co/HUgTj5qzAYcbNaHYWawu/" %}

Voila! That seems to work!

Let's recap, our array instance doesn't change nor does the instance of our Observable ever change. So why would `OnPush` work in this case? The reason can be found in the source code of the `AsyncPipe` itself

{% highlight js %}
{% raw %}
private _updateLatestValue(async: any, value: Object): void {
  if (async === this._obj) {
    this._latestValue = value;
    this._ref.markForCheck();
  }
}
{% endraw %}
{% endhighlight %}

The `AsyncPipe` marks the `ChangeDetectorRef` of our component to be checked, effectively telling the change detection that there may be a change in this component. If you like to get a more detailed understanding of how that works we recommend reading our [in-depth change detection article](/angular/2016/02/22/angular-2-change-detection-explained.html).

## Conclusion

We use to look at the `AsyncPipe` as a nifty little tool to save a couple of lines of code in our components. In practice though, it hides a lot of complexity from us that comes with managing async tasks. It's pure gold.
