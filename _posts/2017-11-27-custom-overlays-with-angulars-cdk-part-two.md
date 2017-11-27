---
layout: post
title: Custom Overlays with Angular's CDK - Part 2
imageUrl: /images/banner/custom_overlays_2.jpg
date: 2017-11-27T00:00:00.000Z
summary: >-
  In this follow-up post we demonstrate how to use Angular's CDK to build a custom overlay that looks and feels much like the Google Drive file preview overlay. We'll pick up from where we left off and implement keyboard support, image preloading and add animations in order to make our overlay more engaging.
categories:
  - angular
tags:
  - angular2
  - material
author: dominic_elm
related_posts:
related_videos:
---

In a [previous post](/angular/2017/11/20/custom-overlays-with-angulars-cdk.html) we have layed the foundation for our custom overlay. To recap, we wanted to build a Google Drive-like custom overlay that looks and feels much like the one built for [MachineLabs](https://machinelabs.ai/editor/rJQrQ5wjZ/1506415557004-HkTTQ5Dob?file=ml.yaml&tab=outputs&preview=-KuyslgjIn7kSpuc6pDZ). Let's have a look at a preview:

![overlay preview](/images/overlay_preview.gif)

In the first part of this series we learned how to use Angular's CDK to create our very first custom overlay. On top of that we made it configurable, implemented a "handle" to control (e.g. close) an opened overlay and made it possible to share data with the overlay component.

In this post, we'll pick up from where we left off and implement a few additional features that will take our overlay to the next level. More specifically, we'll implement keyboard support, image preloading and add animations in order to make our overlay more engaging and provide better feedback. In the end, we'll complete this post by adding a toolbar component to fully match Google Drive's look and feel.

Let's dive right into it!

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Adding keyboard support

Adding keyboard support is easy. All we need to do is to use the `@HostListener()` decorator. This decorator is a **function decorator** that accepts an **event name** as an argument. Let's use it inside our `FilePreviewOverlayComponent` to listen to `keydown` events on the HTML Document, so that we can close the overlay whenever the escape button was pressed.

Closing the dialog from within the overlay component is only possible because the `FilePreviewOverlayRef` is now available via the DI system. Remember that we created our own custom injector and defined custom injection tokens for the remote control and the data that we want to share with the component.

Let's have a look at the code:

{% highlight js %}
{% raw %}
import { ..., HostListener } from '@angular/core';

// Keycode for ESCAPE
const ESCAPE = 27;

@Component({...})
export class FilePreviewOverlayComponent {
...
// Listen on keydown events on a document level
@HostListener('document:keydown', ['$event']) private handleKeydown(event: KeyboardEvent) {
  if (event.keyCode === ESCAPE) {
    this.dialogRef.close();
  }
}

constructor(public dialogRef: FilePreviewOverlayRef, ...) { }
{% endraw %}
{% endhighlight %}

Using the host listener we decorate a class method that is called on every `keydown` event. The function itself gets the `KeyboardEvent` that we can use to check whether it's the **escape** key and only then call `close()` on the `dialogRef`.

That's it already for adding keyboard support. Go ahead and try it out. Open a file preview and then press the escape button.

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-6?embed=1&file=app/file-preview-overlay.component.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Preloading images

Instant app response is without any doubt the best, but there are cases when our apps won't be able to deliver the content immediately, e.g. slow internet connection or even latency issues. In those cases it's extremely important to provide users with feedback and indicate that progress is being made. It's crucial to let the user know what is happening in contrast to keep them guessing. One of the most common forms of such feedback is a progress indicator. It reduces the user's uncertainty, perception of time and offers a reason to wait.

Looking at our overlay, we are facing the exact same problems. When we click to preview an image, depending on the internet connection, the image is fetched by the browser and progressively rendered onto the screen. If the connection is really bad it may take a while. Also, it doesn't really look that nice if we display image data as it is received, resulting in a top-down filling in of the image.

To solve this, we can use a progress indicator. The good thing is we don't need to write one from scratch because Angular Material already provides a nice set of loading indicators, one of which is the `<mat-spinner>`. In order to use it, we need to add the `MatProgressSpinnerModule` from `@angular/material` to the imports of our application:

{% highlight js %}
{% raw %}
import { ..., MatProgressSpinnerModule } from '@angular/material';

@NgModule({
  imports: [
    ...,
    MatProgressSpinnerModule
  ],
  ...
})
export class AppModule { }
{% endraw %}
{% endhighlight %}

Note that the `<mat-spinner>` component is an alias for `<mat-progress-spinner mode="indeterminate">`. As we can see, the progress-spinner supports different modes, **determinate** and **indeterminate**.

The difference is that determinate progress indicators are used to indicate how long an operation will take, whereas indeterminate indicators request that the user needs to wait while something finishes. The latter is used when it’s not necessary to indicate how long it will take or to convey a discrete progress. This is perfect for preloading images because we have no idea how long it may take to fetch the image.

Ok, now that we have added the respective module to our imports we can go ahead and update the template of the `FilePreviewOverlayComponent` as well as the component class:

{% highlight js %}
{% raw %}
@Component({
  template: `
    <div class="overlay-content">
      <div class="spinner-wrapper" *ngIf="loading">
        <mat-spinner></mat-spinner>
      </div>

      <img (load)="onLoad($event)" [style.opacity]="loading ? 0 : 1" [src]="image.url">
    </div>
  `,
  ...
})
export class FilePreviewOverlayComponent {

  loading = false;

  ...

  onLoad(event: Event) {
    this.loading = false;
  }
}
{% endraw %}
{% endhighlight %}

First off, we introduce a new property `loading` and initialize it with a meaningful value, e.g. `false`. This will show our spinner until the image is loaded. Also note that we are using a property binding to set the `opacity` of the `<img>` element to 0 when it's loading and 1 when it's finished. If we didn't do this, we'd still see the image being rendered or filled in from top to bottom. This is just a temporary solution that we will replace with a proper solution using Angular's Animation DSL in just a moment. Last but not least, we define a success callback as a method on our class that is called when the image is loaded. The callback is hooked up in the template via an event binding. In this particular case we are listening for the `load` event and when fired, we call the `onLoad()` method.

One more thing to mention is that we needed to wrap the spinner in another element. The reason for this is that we want the spinner to be vertically and horizontally centered. To achieve this we would leverage the CSS `transform` property to apply a transformation to the spinner element. The problem is that the `<mat-spinner>` component is animated with CSS transforms meaning every transformation we set on the element is overridden. Therefore we use a container that wraps the spinner, so that we can savely apply transformation and center it on the screen.

Here's the image preloading in action. To better demonstrate the loading, you can throttle your connection in the "Network" tab of Chrome's DevTools.

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-7?embed=1&file=app/file-preview-overlay.component.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Animating the overlay

With animations we aim to guide users between views so they feel comfortable using the site, draw focused-attention to some parts of our application, increase spacial awareness, indicate if data is being loaded, and probably the most important point - **smoothly transition users between states**.

The problem with our overlay is that it still pops right into our faces. The backdrop is already animated for us, but having an animation only for the backdrop is not enough. We also want to add a little bit of motion to the overlay component, so that it's less surprising for the user.

If you are completely new to animations in Angular, please check out our post on the [Foundation Concepts](/angular/2016/09/16/angular-2-animation-important-concepts.html) or have a look at our [Web Animations Deep Dive with Angular](angular/2017/07/26/a-web-animations-deep-dive-with-angular.html).

Let's start off by importing the `BrowserAnimationsModule` into our application's `NgModule` like this:

{% highlight js %}
{% raw %}
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    ...,
    BrowserAnimationsModule
  ],
  ...
})
export class AppModule { }
{% endraw %}
{% endhighlight %}

With this in place, we can go ahead and define our animations with Angular's Animation DSL and add it to the component via the `animations` metadata property in the `@Component()` decorator:

{% highlight js %}
{% raw %}
// Reusable animation timings
const ANIMATION_TIMINGS = '400ms cubic-bezier(0.25, 0.8, 0.25, 1)';

@Component({
  ...
  animations: [
    trigger('fade', [
      state('fadeOut', style({ opacity: 0 })),
      state('fadeIn', style({ opacity: 1 })),
      transition('* => fadeIn', animate(ANIMATION_TIMINGS))
    ]),
    trigger('slideContent', [
      state('void', style({ transform: 'translate3d(0, 25%, 0) scale(0.9)', opacity: 0 })),
      state('enter', style({ transform: 'none', opacity: 1 })),
      state('leave', style({ transform: 'translate3d(0, 25%, 0)', opacity: 0 })),
      transition('* => *', animate(ANIMATION_TIMINGS)),
    ])
  ]
})
export class FilePreviewOverlayComponent {
  ...
}
{% endraw %}
{% endhighlight %}

As you can see we created two animations, one for fading in the image (`fade`) and the other one to slide up the content (`slideContent`). The fade animation will mostly be visible in combination with a spinner. Remember how we used the property binding to temporarily make the image invisible while loading? With the fade animation we can now replace our temporary solution with proper one that leverages the animation DSL.

Next, we define an `animationState` property that represents the current animation state, e.g. `void`, `enter` or `leave`. By default it's set to `enter` that will cause the content of the file preview to always slide up when it's opened.

{% highlight js %}
{% raw %}
@Component({...})
export class FilePreviewOverlayComponent {
  ...
  animationState: 'void' | 'enter' | 'leave' = 'enter';
}
{% endraw %}
{% endhighlight %}

Now we can connect the pieces and set it up in the template:

{% highlight js %}
{% raw %}
@Component({
  template: `
    <div class="overlay-content" [@slideContent]="animationState">
      <div class="spinner-wrapper" *ngIf="loading">
        <mat-spinner></mat-spinner>
      </div>

      <img [@fade]="loading ? 'fadeOut' : 'fadeIn'" (load)="onLoad($event)" [src]="image.url">
    </div>
  `,
  ...
})
export class FilePreviewOverlayComponent {
  ...
}
{% endraw %}
{% endhighlight %}

We can see that the entire content, including the spinner as well as the image, is wrapped in a container `div`. That's because we only want the content to slide up. Later we'll introduce a toolbar component which comes with its own set of animations. This also implies that it wouldn't make any sense to use a `@HostBinding()` and apply the animation to the host element.

Done! Here's a live demo with all the code above:

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-8?embed=1&file=app/file-preview-overlay.component.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

Animations guide our users and the overlay smoothly animates in. This is already much more engaging compared to what we had before but we can do even better. What about closing it? That's right, we also want it to animate out.

At the moment we simply call `this.overlayRef.dispose()` which will detach the portal from the host, eventually removing it from the DOM. With this straightforward approach there's no way we can execute animations before it is disposed.

What we can do instead is to leverage **animation callbacks** and introduce event streams that we can subscribe to. Angular provides animation callbacks that are fired when an animation is started and also when it is done.

Let's start with the animation callbacks and hook them in the template of our `FilePreviewOverlayComponent`:

{% highlight js %}
{% raw %}
@Component({
  template: `
    <div class="overlay-content"
      [@slideContent]="animationState"
      (@slideContent.start)="onAnimationStart($event)"
      (@slideContent.done)="onAnimationDone($event)">
      ...
    </div>
  `,
  ...
})
export class FilePreviewOverlayComponent {
  ...
}
{% endraw %}
{% endhighlight %}

The animation callbacks alone are not very useful, at least not for animating the overlay out. What's missing is an event bus that we can use to broadcast animation events. That's needed because when we close an overlay, we have to wait until the _leaving_ animation is done before we can dispose the overlay. We'll see in just a second how to use this but first let's define a new `EventEmitter` inside the overlay component class:

{% highlight js %}
{% raw %}
import { ..., EventEmitter } from '@angular/core';
...
@Component({...})
export class FilePreviewOverlayComponent {
  ...
  animationStateChanged = new EventEmitter<AnimationEvent>();
}
{% endraw %}
{% endhighlight %}

The `EventEmitter` is an abstraction around a the `Subject` type from RxJS.

Cool, now let's wire up the animation callbacks. To do this, we'll define the two missing methods `onAnimationStart()` and `onAnimationDone()`. Every time one of the animation callbacks is fired, we broadcast the animation event using `animationStateChanged`. Moreover, we need a way to start the `leave` animation once we close an overlay. Therefore we'll also add a method called `startExitAnimation()` that sets the `animationState` to `leave`. This will then trigger the corresponding animation.

{% highlight js %}
{% raw %}
@Component({...})
export class FilePreviewOverlayComponent {
  ...
  onAnimationStart(event: AnimationEvent) {
    this.animationStateChanged.emit(event);
  }

  onAnimationDone(event: AnimationEvent) {
    this.animationStateChanged.emit(event);
  }

  startExitAnimation() {
    this.animationState = 'leave';
  }
}
{% endraw %}
{% endhighlight %}

We know that we programatically close an overlay using the remote control aka `FilePreviewOverlayRef`. So far we have no access to the overlay component from within the `FilePreviewOverlayRef`. To fix this we define a property `componentInstance` on the remote control.

{% highlight js %}
{% raw %}
export class FilePreviewOverlayRef {
  ...
  componentInstance: FilePreviewOverlayComponent;
  ...
}
{% endraw %}
{% endhighlight %}

We simply set the `componentInstance` when an overlay is opened.

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {
  ...
  open(config: FilePreviewDialogConfig = {}) {
    ...
    // Instantiate remote control
    const dialogRef = new FilePreviewOverlayRef(overlayRef);

    const overlayComponent = this.attachDialogContainer(overlayRef, dialogConfig, dialogRef);

    // Pass the instance of the overlay component to the remote control
    dialogRef.componentInstance = overlayComponent;
    ...
  }
}
{% endraw %}
{% endhighlight %}

Now we can go ahead and introduce two event streams on the `FilePreviewOverlayRef`. The first one emits values **before** the overlay is closed and the other one **after** is was closed. For the streams we'll use the `Subject` type from RxJS and also expose public methods for each of the event streams.

{% highlight js %}
{% raw %}
export class FilePreviewOverlayRef {

  private _beforeClose = new Subject<void>();
  private _afterClosed = new Subject<void>();

  ...

  afterClosed(): Observable<void> {
    return this._afterClosed.asObservable();
  }

  beforeClose(): Observable<void> {
    return this._beforeClose.asObservable();
  }
}
{% endraw %}
{% endhighlight %}

From there we can use the component instance and subscribe to the animation events and act accordingly. This means that when an animation was started we detach the backdrop and call `next()` on `_beforeClose`. When an animation is finished we broadcast on `_afterClosed`. This also means we can dispose the overlay and remove it from the DOM.

{% highlight js %}
{% raw %}
import { filter, take } from 'rxjs/operators';
...
export class FilePreviewOverlayRef {
  ...
  close(): void {
    // Listen for animation 'start' events
    this.componentInstance.animationStateChanged.pipe(
      filter(event => event.phaseName === 'start'),
      take(1)
    ).subscribe(() => {
      this._beforeClose.next();
      this._beforeClose.complete();
      this.overlayRef.detachBackdrop();
    });

    // Listen for animation 'done' events
    this.componentInstance.animationStateChanged.pipe(
      filter(event => event.phaseName === 'done' && event.toState === 'leave'),
      take(1)
    ).subscribe(() => {
      this.overlayRef.dispose();
      this._afterClosed.next();
      this._afterClosed.complete();

      // Make sure to also clear the reference to the
      // component instance to avoid memory leaks
      this.componentInstance = null!;
    });

    // Start exit animation
    this.componentInstance.startExitAnimation();
  }
}
{% endraw %}
{% endhighlight %}

That's it. Here's a live demo:

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-9?embed=1&file=app/file-preview-overlay-ref.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Adding a toolbar component

To finish this up we will create a toolbar component, add animations and also make use of the events streams exposed by the remote control to animate the toolbar out **before** the overlay is closed.

{% highlight js %}
{% raw %}
@Component({
  selector: 'tm-file-preview-overlay-toolbar',
  templateUrl: './file-preview-overlay-toolbar.component.html',
  styleUrls: ['./file-preview-overlay-toolbar.component.scss'],
  animations: [
    trigger('slideDown', [
      state('void', style({ transform: 'translateY(-100%)' })),
      state('enter', style({ transform: 'translateY(0)' })),
      state('leave', style({ transform: 'translateY(-100%)' })),
      transition('* => *', animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)'))
    ])
  ]
})
export class FilePreviewOverlayToolbarComponent implements OnInit {

  // Apply animation to the host element
  @HostBinding('@slideDown') slideDown = 'enter';

  // Inject remote control
  constructor(private dialogRef: FilePreviewOverlayRef) { }

  ngOnInit() {
    // Animate toolbar out before overlay is closed
    this.dialogRef.beforeClose().subscribe(() => this.slideDown = 'leave');
  }
}
{% endraw %}
{% endhighlight %}

The template is very straightforward and leverages content projection to project content into the template of the toolbar component.

{% highlight html %}
{% raw %}
<!-- file-preview-overlay-toolbar.component.html -->
<div class="toolbar-wrapper">
  <ng-content></ng-content>
</div>
{% endraw %}
{% endhighlight %}

Finally we have to use the toolbar inside the template of the overlay component:

{% highlight js %}
{% raw %}
@Component({
  template: `
    <tm-file-preview-overlay-toolbar>
      <mat-icon>description</mat-icon>
      {{ image.name }}
    </tm-file-preview-overlay-toolbar>

    <div class="overlay-content"
      ...
    </div>
  `,
  ...
})
export class FilePreviewOverlayComponent {
  ...
}
{% endraw %}
{% endhighlight %}

That's pretty much! Let's have a look at our final solution:

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-10?embed=1&file=app/file-preview-overlay.component.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>