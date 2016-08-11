---
layout:     post
title:      "Zones in Angular 2"

relatedLinks:
  -
    title: "Exploring Angular 2 - Article Series"
    url: "http://blog.thoughtram.io/exploring-angular-2"
  -
    title: "Understanding Zones"
    url: "http://blog.thoughtram.io/angular/2016/01/22/understanding-zones.html"
  -
    title: "Taking advantage of Observables in Angular 2"
    url: "http://blog.thoughtram.io/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html"

demos:
  -
    url: http://embed.plnkr.co/gC7GjU/
    title: Zones in Angular 2

date: 2016-02-01
update_date: 2016-08-11

summary: "In our last article we've talked about what Zones are and how they change the way we deal with asynchronous code. In this article we're going to discuss what role they play in the Angular 2 platform, with the Angular 2 specific NgZone."

categories:
  - angular

tags:
  - angular2

topic: changedetection

author: pascal_precht
---

In [Understanding Zones](http://blog.thoughtram.io/angular/2016/01/22/understanding-zones.html), we explored the power of Zones by building a profiling zone that profiles asynchronous operations in our code. We learned that Zones are a sort of execution context that allows us to hook into our asynchronous tasks. If you haven't read that article, we highly recommend checking it out as this one is based on it. In this article we're going to take a closer look at what role Zones play in Angular 2.

{% include demos-and-videos-buttons.html post=page %}

## Zones are a perfect fit for Angular

It turns out that, the problem that Zones solve, plays very nicely with what Angular needs in order to perform change detection in our applications. Did you ever ask yourself when and why Angular performs change detection? What is it that tells Angular "Dude, a change probably occurred in my application. Can you please check?".

Before we dive into these questions, let's first think about what actually causes this change in our applications. Or rather, what **can** change state in our applications. Application state change is caused by three things:

- **Events** - User events like `click`, `change`, `input`, `submit`, ...
- **XMLHttpRequests** - E.g. when fetching data from a remote service
- **Timers** - `setTimeout()`, `setInterval()`, because JavaScript

It turns out that these three things have something in common. Can you name it? ... Correct! **They are all asynchronous**.

Why do you think is this important? Well ... because it turns out that these are the only cases when Angular is actually interested in updating the view. Let's say we have an Angular 2 component that executes a handler when a button is clicked:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'my-component',
  template: `
    <h3>We love {{name}}</h3>
    <button (click)="changeName()">Change name</button>
  `
})
class MyComponent {

  name:string = 'thoughtram';

  changeName() {
    this.name = 'Angular';
  }
}
{% endraw %}
{% endhighlight %}

If you're not familiar with the `(click)` syntax, you might want to read our article on [Angular 2's Template Syntax Demystified](http://blog.thoughtram.io/angular/2015/08/11/angular-2-template-syntax-demystified-part-1.html). The short version is, that this sets up an event handler for the `click` event on the `<button>` element.

When the component's button is clicked, `changeName()` is executed, which in turn will change the `name` property of the component. Since we want this change to be reflected in the DOM as well, Angular is going to update the view binding `{% raw %}{{name}}{% endraw %}` accordingly. Nice, that seems to magically work.

Another example would be to update the `name` property using `setTimeout()`. Note that we removed the button.

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'my-component',
  template: `
    <h3>We love {{name}}</h3>
  `
})
class MyComponent implements OnInit {

  name:string = 'thoughtram';

  ngOnInit() {
    setTimeout(() => {
      this.name = 'Angular';
    }, 1000);
  }
}
{% endraw %}
{% endhighlight %}

We don't have to do anything special to tell the framework that a change has happened. **No `ng-click`, no `$timeout`, `$scope.$apply()`**.

If you've read our article on [understanding Zones](http://blog.thoughtram.io/angular/2016/01/22/understanding-zones.html), you know that this works obviously because Angular takes advantage of Zones. Zones monkey-patches global asynchronous operations such as `setTimeout()` and `addEventListener()`, which is why Angular can easily find out, when to update the DOM.

In fact, the code that tells Angular to perform change detection whenever the VM turn is done, is as simple as this:

{% highlight javascript %}
ObservableWrapper.subscribe(this.zone.onTurnDone, () => {
  this.zone.run(() => {
    this.tick();
  });
});

tick() {
  // perform change detection
  this.changeDetectorRefs.forEach((detector) => {
    detector.detectChanges();
  });
}
{% endhighlight %}

Whenever Angular's zone emits an `onTurnDone` event, it runs a task that performs change detection for the entire application. If you're interested in how change detection in Angular 2 works, watch out, we're going to publish another article on that soon.

But wait, where does the `onTurnDone` event emitter come from? This is not part of the default `Zone` API, right? It turns out that Angular introduces its own zone called `NgZone`.

## NgZone in Angular 2

`NgZone` is basically a forked zone that extends its API and adds some additional functionality to its execution context. One of the things it adds to the API is the following set of custom events we can subscribe to, as they are observable streams:

- `onTurnStart()` - Notifies subscribers just before Angular's event turn starts. Emits an event once per browser task that is handled by Angular.
- `onTurnDone()` - Notifies subscribers immediately after Angular's zone is done processing the current turn and any micro tasks scheduled from that turn.
- `onEventDone()` - Notifies subscribers immediately after the final `onTurnDone()` callback before ending VM event. Useful for testing to validate application state.

If "Observables" and "Streams" are super new to you, you might want to read our article on [Taking advantage of Observables in Angular 2](http://blog.thoughtram.io/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html).

The main reason Angular adds its own event emitters instead of relying on `beforeTask` and `afterTask` callbacks, is that it has to keep track of timers and other micro tasks. It's also nice that Observables are used as an API to handle these events.

## Running code outside Angular's zone

Since `NgZone` is really just a fork of the global zone, Angular has full control over when to run something inside its zone to perform change detection and when not. Why is that useful? Well, it turns out that we don't always want Angular to magically perform change detection.

As mentioned a couple of times, Zones monkey-patches pretty much any global asynchronous operations by the browser. And since `NgZone` is just a fork of that zone which notifies the framework to perform change detection when an asynchronous operation has happened, it would also trigger change detection when things like `mousemove` events fire.

We probably don't want to perform change detection every time `mousemove` is fired as it would slow down our application and results in very bad user experience.

That's why `NgZone` comes with an API `runOutsideAngular()` which performs a given task in `NgZone`'s parent zone, which **does not** emit an `onTurnDone` event, hence no change detection is performed. To demonstrate this useful feature, let's take look at the following code:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'progress-bar',
  template: `
    <h3>Progress: {{progress}}</h3>
    <button (click)="processWithinAngularZone()">
      Process within Angular zone
    </button>
  `
})
class ProgressBar {

  progress: number = 0;

  constructor(private zone: NgZone) {}

  processWithinAngularZone() {
    this.progress = 0;
    this.increaseProgress(() => console.log('Done!'));
  }
}
{% endraw %}
{% endhighlight %}

Nothing special going on here. We have component that calls `processWithinAngularZone()` when the button in the template is clicked. However, that method calls `increaseProgress()`. Let's take a closer look at this one:

{% highlight javascript %}
{% raw %}
increaseProgress(doneCallback: () => void) {
  this.progress += 1;
  console.log(`Current progress: ${this.progress}%`);

  if (this.progress < 100) {
    window.setTimeout(() => {
      this.increaseProgress(doneCallback);
    }, 10);
  } else {
    doneCallback();
  }
}
{% endraw %}
{% endhighlight %}

`increaseProgress()` calls itself every 10 milliseconds until `progress` equals `100`. Once it's done, the given `doneCallback` will execute. Notice how we use `setTimeout()` to increase the progress.

Running this code in the browser, basically demonstrates what we already know. After each `setTimeout()` call, Angular performs change detection and updates the view, which allows us to see how `progress` is increased every 10 milliseconds. It gets more interesting when we run this code outside Angular's zone. Let's add a method that does exactly that.

{% highlight javascript %}
{% raw %}
processOutsideAngularZone() {
  this.progress = 0;
  this.zone.runOutsideAngular(() => {
    this.increaseProgress(() => {
      this.zone.run(() => {
        console.log('Outside Done!');
      });
    });
  });
}
{% endraw %}
{% endhighlight %}

`processOutsideAngularZone()` also calls `increaseProgress()` but this time using `runOutsideAngularZone()` which causes Angular not to be notified after each timeout. We access Angular's zone by injecting it into our component using the `NgZone` token.

The UI is not updated as `progress` increases. However, once `increaseProgress()` is done, we run another task inside Angular's zone again using `zone.run()` which in turn causes Angular to perform change detection which will update the view. In other words, instead of seeing `progress` increasing, all we see is the final value once it's done. Check out the running code in action below.

Zones have now also been proposed as a standard at TC39, maybe another reason to take a closer look at them.
