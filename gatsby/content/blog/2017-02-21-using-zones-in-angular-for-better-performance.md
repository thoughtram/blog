---
layout: post
title: Using Zones in Angular for better performance
imageUrl: ../assets/images/banner/using-zones-in-angular-for-better-performance.jpg
date: 2017-02-21T00:00:00.000Z
summary: >-
  In this article we'll take a look at how to use Zone APIs to improve our app's
  performance!
categories:
  - angular
tags:
  - angular2
  - performance
  - zones
author: pascal_precht
related_posts:
  - Go fast with $applyAsync in Angular 1.3
  - Disabling Debug Info in Angular 1.3
  - Making your Angular apps fast
  - RxJS Master Class and courseware updates
  - Advanced caching with RxJS
  - Custom Overlays with Angular's CDK - Part 2
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

In our latest article, we talked about [how to make our Angular apps fast](/angular/2017/02/02/making-your-angular-app-fast.html) by exploring Angular's `ChangeDetectionStrategy` APIs as well as tricks on how to detach change detectors and many more. While we were covering many different options to improve the demo application's performance, we certainly haven't talked about **all** possible options.

That's why [Jordi Collell](https://twitter.com/galigan) pointed out that another option would be to take advantage of [Zone APIs](/angular/2016/02/01/zones-in-angular-2.html), to execute our code outside the Angular zone, which will prevent Angular from running unnecessary change detection tasks. He even put time and energy into creating a demo plunk that shows how to do exactly that.

**We want to say thank you for his contribution** and think that the solution he came up with deserves its own article. So in this article we're going to explore his plunk and explain how Jordi used Zones to make our demo application perform at almost 60 fps.

## Seeing it in action

Before we jump right into the code, let's first take a look at the demo plunk with the running application. As a quick recap: The idea was to render 10.000 draggable SVG boxes. Rendering 10.000 boxes is not a super sophisticated task, however, the challenge lies in making the dragging experience as smooth as possible. In other words, we aim for 60 fps (frames per second), which can be indeed challenging, considering that Angular re-renders all 10.000 boxes by default when an event has fired (that we bound to).

Even though the difference is rather subtle, the optimized version performs much better in terms of JavaScript execution per frame. We'll take a look at some numbers later, but let's quickly recap Zones and then dive into the code and discuss how Jordi used Angular's `NgZone` APIs to achieve this performance first.

## The idea of Zones

Before we can use Zone APIs and specifically the ones from Angular's `NgZone`, we need to get an understanding of what Zones actually are and how they are useful in the Angular world. We won't go into too much detail here as we've already written two articles on this topic:

- **[Understanding Zones](/angular/2016/01/22/understanding-zones.html)** - Discusses the concept of Zones in general and how they can be used to e.g. profile asynchronous code execution
- **[Zones in Angular](/angular/2016/02/01/zones-in-angular-2.html)** - Explores how the underlying Zone APIs are used in Angular to create a custom `NgZone`, which enables consumers and Angular itself to run code inside or outside Angular's Zone

If you haven't read these articles yet, we definitely recommend you to do so as they give a very solid understanding of what Zones are and what they do. The bottom line is, however, Zones wrap asynchronous browser APIs, and notify a consumer when an asynchronous task has started or ended. Angular takes advantage of these APIs to get notified when any asynchronous task is done. This includes things like `XHR` calls, `setTimeout()` and pretty much all user events like `click`, `submit`, `mousedown`, ... etc.

Once notified, Angular knows that it has to perform change detection because any of the asynchronous operations might have changed the application state. This, for instance, is always the case when we use Angular's `Http` service to fetch data from a remote server. The following snippet shows how such a call can change application state:

```js
@Component(...)
export class AppComponent {

  data: any; // initial application state

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.fetchDataFromRemoteService().subscribe(data => {
      this.data = data // application state has changed, change detection needs to run now
    });
  }
}
```

The nice thing about this is that we as developers don't have to care about notifying Angular to perform change detection, because Zones will do it for us as Angular subscribes to them under the hood.

Okay, now that we touched on that, let's take a look at how they can be used to make our demo app fast.

## Running outside Angular's Zone

We know that change detection is performed whenever an asynchronous event happened and an event handler was bound to that event. This is exactly the reason why our initial demo performs rather jankee. Let's look at `AppComponent`'s template:

```js
@Component({
  ...
  template: `
    <svg (mousedown)="mouseDown($event)"
         (mouseup)="mouseUp($event)"
         (mousemove)="mouseMove($event)">

      <svg:g box *ngFor="let box of boxes" [box]="box">
      </svg:g>

    </svg>
  `
})
class AppComponent {
  ...
}
```

Three (3) event handlers are bound to the outer SVG element. When any of these events fire and their handlers have been executed then change detection is performed. In fact, this means that Angular will run change detection, even when we just move the mouse over the boxes without actually dragging a single box!

This is where taking advantage of `NgZone` APIs comes in handy. `NgZone` enables us to explicitly run certain code **outside** Angular's Zone, preventing Angular to run any change detection. So basically, handlers will still be executed, but since they won't run inside Angular's Zone, Angular won't get notified that a task is done and therefore no change detection will be performed. We only want to run change detection once we release the box we are dragging.

Okay, how do we achieve this? In our article on [Zones in Angular](/angular/2016/02/01/zones-in-angular-2.html#running-code-outside-angulars-zone), we already discussed how to run code outside Angular's Zone using `NgZone.runOutsideAngular()`. All we have to do is to make sure that the `mouseMove()` event handler is only attached and executed outside Angular's zone. In addition to that, we know we want to attach that event handler only if a box is being selected for dragging. In other words, we need to change our `mouseDown()` event handler to imperatively add that event listener to the document.

Here's what that looks like:

```js
import { Component, NgZone } from '@angular/core';

@Component(...)
export class AppComponent {
  ...
  element: HTMLElement;

  constructor(private zone: NgZone) {}

  mouseDown(event) {
    ...
    this.element = event.target;

    this.zone.runOutsideAngular(() => {
      window.document.addEventListener('mousemove', this.mouseMove.bind(this));
    });
  }

  mouseMove(event) {
    event.preventDefault();
    this.element.setAttribute('x', event.clientX + this.clientX + 'px');
    this.element.setAttribute('y', event.clientX + this.clientY + 'px');
  }
}
```

We inject `NgZone` and call `runOutsideAngular()` inside our `mouseDown()` event handler, in which we attach an event handler for the `mousemove` event. This ensures that the `mousemove` event handler is really only attached to the document when a box is being selected. In addition, we save a reference to the underlying DOM element of the clicked box so we can update its `x` and `y` attributes in the `mouseMove()` method. We're working with the DOM element instead of a box object with bindings for `x` and `y`, because bindings won't be change detected since we're running the code outside Angular's Zone. In other words, we **do** update the DOM, so we can see the box is moving, but we aren't actually updating the box model (yet).

Also, notice that we removed the `mouseMove()` binding from our component's template. We could remove the `mouseUp()` handler as well and attach it imperatively, just like we did with the `mouseMove()` handler. However, it won't add any value performance-wise, so we decided to keep it in the template for simplicity's sake:

```html
<svg (mousedown)="mouseDown($event)"
      (mouseup)="mouseUp($event)">

  <svg:g box *ngFor="let box of boxes" [box]="box">
  </svg:g>

</svg>
```

In the next step, we want to make sure that, whenever we release a box (`mouseUp`), we update the box model, plus, we want to perform change detection so that the model is in sync with the view again. The cool thing about `NgZone` is not only that it allows us to run code outside Angular's Zone, it also comes with APIs to run code **inside** the Angular Zone, which ultimately will cause Angular to perform change detection again. All we have to do is to call `NgZone.run()` and give it the code that should be executed.

Here's the our updated `mouseUp()` event handler:

```js
@Component(...)
export class AppComponent {
  ...
  mouseUp(event) {
    // Run this code inside Angular's Zone and perform change detection
    this.zone.run(() => {
      this.updateBox(this.currentId, event.clientX + this.offsetX, event.clientY + this.offsetY);
      this.currentId = null;
    });

    window.document.removeEventListener('mousemove', this.mouseMove);
  }
}
```

Also notice that we're removing the event listener for the `mousemove` event **on every mouseUp**. Otherwise, the event handler would still be executed on every mouse move. In other words, the box would keep moving even after the finger was lifted, essentially taking the *drop* part out of *drag and drop*. In addition to that, we would pile up event handlers, which could not only cause weird side effects but also blows up our runtime memory.

## Measuring the performance

Alright, now that we know how Jordi implemented this version of our demo application, let's take a look at some numbers! The following numbers have been recorded using the exact same techniques on the exact same machine as in our [previous article on performance](/angular/2017/02/02/making-your-angular-app-fast.html).

![](../assets/images/dnd-perf-profile-5.png)

- 1st Profile, Event (mousemove): **~0.45ms, ~0.50ms (fastest, slowest)**
- 2nd Profile, Event (mousemove): **~0.39ms, ~0.52ms (fastest, slowest)**
- 3rd Profile, Event (mousemove): **~0.38ms, ~0.45ms (fastest, slowest)**

## Conclusion

Using Zones is a great way to escape Angular's change detection, without detaching change detectors and making the application code too complex. In fact, it turns out that Zones APIs are super easy to use, especially `NgZone`'s APIs to run code outside or inside Angular. Based on the numbers, we can even say that this version is about as fast as the fastest solution we came up with in our previous article. Considering that the developer experience is much better when using Zones APIs, since they are easier to use than manually detaching and re-attaching change detector references, it's definitely the most "beautiful" performance improvement we have so far.

However, we shouldn't forget that this solution also comes with a couple (probably fixable) downsides. For example, we're relying on DOM APIs and the global `window` object, which is something we should always try to avoid. If we wanted to use this code with on the server-side then direct access of the window variable would be problematic. We will discus these server-side specific issues in a future article. For the sake of this demo, this isn't a big deal though.

Again, a huge shout-out goes to [Jordi Collell](https://twitter.com/galigan) who not only made us adding this option, but also taking the time to actually implement a first version of this demo!
