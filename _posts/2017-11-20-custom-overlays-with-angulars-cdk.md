---
layout: post
title: Custom Overlays with Angular's CDK
imageUrl: /images/banner/custom_overlays.jpg
date: 2017-11-20T00:00:00.000Z
summary: >-
  The Angular Material CDK provides us with tools to build awesome and
  high-quality Angular components without adopting the Material Design visual
  language. Its goal is to make our life as developers easier and extract common
  behaviors and patterns shared between multiple Angular Material components. In
  this post, we'll use the CDK to build a custom overlay that looks and feels
  much like the Google Drive file preview overlay.
categories:
  - angular
tags:
  - angular2
  - material
author: dominic_elm
related_posts:
  - Custom Overlays with Angular's CDK - Part 2
  - Easy Dialogs with Angular Material
  - Custom themes with Angular Material
  - A web animations deep dive with Angular
  - Angular Master Class - Redux and ngrx
  - Three things you didn't know about the AsyncPipe
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

You have probably heared of [Angular Material](https://material.angular.io/) haven't you? If you haven't, it's a library that provides you with high-quality Material Design components for Angular. Material Design itself is a visual design language that aims for consistency of user experience across all platforms and device sizes. That's cool but what if your company has its own opinions about styles and the overall look and feel of the UI? How do we get the best of Angular Material without adopting the Material Design visual language?

Tada 🎉! That's where Angular Material's Component Dev Kit (CDK for short) comes into play. The CDK provides us with tools to build awesome and high-quality Angular components without adopting the Material Design visual language. Its goal is to make our life as developers easier and extract common behaviors and patterns shared between multiple Angular Material components. For instance, the datepicker, snackbar, or tooltip have something in common; they need to dynamically open up some floating panel on the screen. But that's just the tip of the ice berg. There are many different packages for all sorts of things such as `a11y` that helps us improve the accessibility of our UI components. There's even a `layout` package with utilities to build responsive UIs that react to screen-size changes. For a more complete list, please check out the official [documentation](https://material.angular.io/cdk/categories/component-composition).

Over at [MachineLabs](https://www.machinelabs.ai), we thought it would be useful to provide a way to preview generated output files (mostly images), so users don’t have to download it every single time just to take a quick look. So we sat down to build a Google Drive like overlay with the CDK. This post is meant to share our knowledge with the community and to make you comfortable using the CDK for your own purposes.

In this post, we'll use the CDK to build a Google Drive-like custom overlay that looks and feels much like the one built for [MachineLabs](https://machinelabs.ai/editor/rJQrQ5wjZ/1506415557004-HkTTQ5Dob?file=ml.yaml&tab=outputs&preview=-KuyslgjIn7kSpuc6pDZ). Here's how it looks like:

![overlay preview](/images/overlay_preview.gif)

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## The building blocks

Let's start simple and work our way up to the final, fully-fledged solution which will have a very similar API as the `MatDialog` service provided by Angular Material. It's not important to know exactly how the `MatDialog` works but it's definitely helpful. If this is new to you, we recommend to check out our post on [Easy Dialogs with Angular Material](/angular/2017/11/13/easy-dialogs-with-angular-material.html).

Our solution will be a little less flexible but specifically made for showing a file preview inspired by Google Drive. That said, we'd like to have a nice toolbar at the top and the image being rendered in the middle of the screen.

In general, the `MatDialog` is great for showing content in a dialog box but as soon as we want a little bit of a custom look and feel, something that does not look like a white box with content inside, we would need to roll our own overlay. Luckily, we can use the `overlay` package from the CDK that has most of the core logic for opening floating panels already baked in. More on that in just a second.

Here are the core building blocks of our application:

<img src="/images/custom_overlays_architecture.png" width="100%" alt="application architecture">

As we can see, we have two components, one service and a class that represents a remote control to an opened overlay. The `AppComponent` is the root (or entry point) of our application. This component contains a toolbar and the list of files that we can preview. In addition, it has access to a `FilePreviewOverlayService` which provides us with the core logic for opening an overlay. At the same time it's an abstraction for some "heavy" lifting that should be implemented in a resuable manner. Don't be scared, it's not going to be super heavy and we'll break it down into comprehensible chunks. Last but not least, there's a `FilePreviewOverlayRef` which, as mentioned, is a _handle_ used to control (e.g. close) a particular overlay.

For the overlay we choose to render a component, so we can attach some logic and also add animations to our overlay to engage our users and make them happy. We call this component `FilePreviewOverlayComponent`.

That's about it. Now that we have the basic structure in place, we're ready to look at some code.

**Note that this post is the first part out of two in which we lay the foundation for our custom overlay. We'll build on top of this in the next part and add keyboard support, image preloading and animations.**

## Setup

Before we can start implementing the custom overlay we need to install the CDK. Simply run `npm install @angular/cdk` and we're all set!

## Our first overlay

From the `MatDialog` we know that when we open an overlay we must specify a component type that is then created dynamically at runtime. This means it is not created by using the component tags inside an HTML template. Also, we know that whenever a component is created at runtime, we **must add it to our application module's `entryComponents`**.

Let's do that and add the `FilePreviewOverlayComponent` to the array of `entryComponents`. In addition, we need to add the `OverlayModule` to the `imports` list of the root `AppModule`:

{% highlight js %}
{% raw %}
import { OverlayModule } from '@angular/cdk/overlay';
...

@NgModule({
  imports: [ ... ],
  declarations: [ ..., FilePreviewOverlayComponent ],
  bootstrap: [ AppComponent ],
  providers: [ ... ],
  entryComponents: [
    // Needs to be added here because otherwise we can't
    // dynamically render this component at runtime
    FilePreviewOverlayComponent
  ]
})
export class AppModule { }
{% endraw %}
{% endhighlight %}

From there, creating an overlay is easy. First, we inject the `Overlay` service. This service has a `create()` function that we need to call in order to create a `PortalHost` for our `FilePreviewOverlayComponent`. Finally we need to create a `ComponentPortal` from this component and attach it to the `PortalHost`. Wait, what? Let's give it a moment and look at some code before taking it apart:

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {

  // Inject overlay service
  constructor(private overlay: Overlay) { }

  open() {
    // Returns an OverlayRef (which is a PortalHost)
    const overlayRef = this.overlay.create();

    // Create ComponentPortal that can be attached to a PortalHost
    const filePreviewPortal = new ComponentPortal(FilePreviewOverlayComponent);

    // Attach ComponentPortal to PortalHost
    overlayRef.attach(filePreviewPortal);
  }
}
{% endraw %}
{% endhighlight %}

The first step is to create a `PortalHost`. We do that by calling `create()` on the `Overlay` service. This will return an `OverlayRef` instance which is basically a remote control for the overlay. One unique attribute of this `OverlayRef` is that it's a `PortalHost`, and once created, we can attach or detach `Portal`s. We can think of a `PortalHost` as a placeholder for a component or template. So in our scenario, we are creating a `ComponentPortal` that takes a component type as its fist argument. In order to actually display this component we need to attach the portal to the host.

> Ok, but where does the overlay get rendered?

Good question. There's an `OverlayContainer` service which creates a container `div` under the hood that gets appended to the `body` of the HTML Document. There are a few more wrapper elements created but our component eventually ends up in a `div` with a class of `cdk-overlay-pane`. Here's what the DOM structure looks like:

{% highlight html %}
{% raw %}
<div class="cdk-overlay-container">
  <div id="cdk-overlay-0" class="cdk-overlay-pane" dir="ltr">
    <!-- Component goes here -->
  </div>
</div>
{% endraw %}
{% endhighlight %}

Done. That's all we need to create our very first custom overlay using the CDK. Let's try it out and see what we got so far:

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-1?embed=1&file=app/file-preview-overlay.service.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

Our service only exposes **one** public method `open()` that will take care of creating a custom overlay. For now, the service is quite simple but it gets more complicated as we implement a more sophisticated and complete (functional-wise) overlay. Therefore it's a good idea to extract the common logic into a service to stay **DRY**. Imagine we would have the same logic defined in each component we want to show an overlay. No good, right?

Now that we have layed the foundation for our custom overlay, let's take it one step further and improve on what we have so far. Let's add a backdrop and specify a scroll and position strategy. Don't worry if it's unclear what scroll and position strategy is all about. We'll cover that in a second.

## Configuring the overlay

When creating an overlay, we can pass an optional configuration object to `create()` to set the desired options, e.g. whether it has backdrop, the position or scroll strategy, width, height and many more. Here's an example:

{% highlight js %}
{% raw %}
// Example configuration
overlay.create({
  width: '400px',
  height: '600px'
});
{% endraw %}
{% endhighlight %}

First of all, we allow the consumer of our API to override certain options. Therefore, we update the signature for `open()` to also take a configuration object. In addition, we define an interface that describes the shape of the configuration from a consumer perspective:

{% highlight js %}
{% raw %}
// Each property can be overridden by the consumer
interface FilePreviewDialogConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
}

@Injectable()
export class FilePreviewOverlayService {
  open(config: FilePreviewDialogConfig = {}) {
    ...
  }
}
{% endraw %}
{% endhighlight %}

Next, we define some initial values for the config, so that, by default, every overlay has a backdrop alongside a `backdropClass` and `panelClass`:

{% highlight js %}
{% raw %}
const DEFAULT_CONFIG: FilePreviewDialogConfig = {
  hasBackdrop: true,
  backdropClass: 'dark-backdrop',
  panelClass: 'tm-file-preview-dialog-panel'
}

@Injectable()
export class FilePreviewOverlayService {
  ...
}
{% endraw %}
{% endhighlight %}

With that in place, we can define a new method `getOverlayConfig()` which takes care of creating a new `OverlayConfig` for the custom overlay. Remember, it's better to break down the logic into smaller parts instead of implementing everything in one giant function. This ensures better maintainability but also readability of our code.

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {

  ...

  private getOverlayConfig(config: FilePreviewDialogConfig): OverlayConfig {
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    const overlayConfig = new OverlayConfig({
      hasBackdrop: config.hasBackdrop,
      backdropClass: config.backdropClass,
      panelClass: config.panelClass,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    });

    return overlayConfig;
  }
}
{% endraw %}
{% endhighlight %}

Our method is quite simple. It takes a `FilePreviewDialogConfig` and creates a new `OverlayConfig` with the values from the given configuration. However, there are two important things to mention. One is the `scrollStrategy` and the other one is the `positionStrategy`.

### Scroll strategy

The scroll strategy is a way of defining how our overlay should behave if the user scrolls while the overlay is open. There are several strategies available as part of the CDK, such as

- `NoopScrollStrategy`: does nothing
- `CloseScrollStrategy`: automatically closes the overlay when scrolling
- `BlockScrollStrategy`: blocks page scrolling
- `RepositionScrollStrategy`: will reposition the overlay element on scroll

For our file preview overlay, we are going to use the `BlockScrollStrategy` because we don't want the user to be scrolling in the background while the overlay is open.

The `scrollStrategy` takes a function that returns a scroll strategy. All strategies are provided by the `Overlay` service and can be accessed via the `scrollStrategies` property:

{% highlight js %}
{% raw %}
const overlayConfig = new OverlayConfig({
  ...
  // Other strategies are .noop(), .reposition(), or .close()
  scrollStrategy: this.overlay.scrollStrategies.block()
});
{% endraw %}
{% endhighlight %}

If we don't specify a strategy explicitly, all overlays will use the `NoopScrollStrategy`.

### Position strategy

The position strategy allows us to configure how our overlay is positioned on the screen. There are two position strategies available as part of the CDK:

- `GlobalPositionStrategy`: used for overlays that need to be positioned unrelated to other elements on the screen. This strategy is mostly used for modals or root-level notifications.
- `ConnectedPositionStrategy`: used for overlays that are positioned relative to other elements. This is commonly used for menus or tooltips.

We'll be using the `GlobalPositionStrategy` for our overlay because it's supposed to be positioned globally on screen, unrelated to other elements.

Similar to the `scrollStrategy` we can access all position strategies through the `Overlay` service like so:

{% highlight js %}
{% raw %}
const positionStrategy = this.overlay.position()
  .global()
  .centerHorizontally()
  .centerVertically();

const overlayConfig = new OverlayConfig({
  ...
  positionStrategy
});
{% endraw %}
{% endhighlight %}

With the configuration in place, we go ahead and define another method `createOverlay()` that hides the complexity of creating an overlay with a given configuration:

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {
  ...
  private createOverlay(config: FilePreviewDialogConfig) {
    // Returns an OverlayConfig
    const overlayConfig = this.getOverlayConfig(config);

    // Returns an OverlayRef
    return this.overlay.create(overlayConfig);
  }
}
{% endraw %}
{% endhighlight %}

We now refactor our `open()` method to generate a default config and utilize `createOverlay()`:

{% highlight js %}
{% raw %}
export class FilePreviewOverlayService {
  ...
  open(config: FilePreviewDialogConfig = {}) {
    // Override default configuration
    const dialogConfig = { ...DEFAULT_CONFIG, ...config };

    const overlayRef = this.createOverlay(dialogConfig);
    ...
  }
}
{% endraw %}
{% endhighlight %}

Here's what it looks like in action:

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-2?embed=1&file=app/file-preview-overlay.service.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

Our overlay looks much more like an overlay as we have imagined it in the beginning. The good thing is that most of the heavy lifting is taken care of by the CDK, such as dynamically creating a component, block page scrolling, or positioning.

So far, so good, but we are still missing some very fundamental functionality. We can open an overlay but what about closing it? This it not yet possible, so let's go ahead and add this feature.

## Closing overlays with a remote control

Just like we use remote controls to snap between television channels, we want a remote control to close our overlays. It will provide an API for modifying, closing, and listening to events on the overlay instance. Especially if we want to be able to close the dialog from within the overlay component, and optionally return a value to the consumer.

Our remote control will be a simple class that exposes only one public method - `close()`. For now we keep simple and extend it as we introduce more features. Here's what it looks like:

{% highlight js %}
{% raw %}
import { OverlayRef } from '@angular/cdk/overlay';

export class FilePreviewOverlayRef {

  constructor(private overlayRef: OverlayRef) { }

  close(): void {
    this.overlayRef.dispose();
  }
}
{% endraw %}
{% endhighlight %}

When implementing the remote control, the only thing we have to make sure is that we need access to the `OverlayRef`. It's a reference to the overlay (portal host) that allows us to detach the portal. Note that, there's no `@Injectable` decorator attached to the class which means that we can't leverage the DI system for this service. This, however, is no big deal because we will manually create an instance for every overlay and therefore we don't need to register a provider either. Theoretically, we could open multiple overlays stacked on top of each other where each overlay has its own remote control. The DI system creates singletons by default. That's not what we want in this case.

What's left to do is to update our `open()` method to create a remote control and return it to the consumer of our API:

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {
  ...
  open(config: FilePreviewDialogConfig = {}) {
    ...
    const overlayRef = this.createOverlay(dialogConfig);

    // Instantiate remote control
    const dialogRef = new FilePreviewOverlayRef(overlayRef);
    ...
    // Return remote control
    return dialogRef;
  }
{% endraw %}
{% endhighlight %}

Notice how we pass in the `overlayRef` when creating a new `FilePreviewOverlayRef`? That's how we get a hold of the `PortalHost` inside the remote. Instead of implementing a class that represents a reference to the open overlay, we could have returned the `OverlayRef` directly. However, it's not a good idea to expose lower-level APIs because users could mess with the overlay and detach the backdrop for instance. Also, we need a little bit more logic later on when we introduce animations. A remote control is a good way of limiting the access to the underlying APIs and expose only those that we want to be publicly available.

From a consumer perspective we now get a handle to the overlay that allows us to programatically close it at some point. Let's go ahead and update `AppComponent` accordingly:

{% highlight js %}
{% raw %}
@Component({...})
export class AppComponent  {
  ...
  showPreview() {
    // Returns a handle to the open overlay
    let dialogRef: FilePreviewOverlayRef = this.previewDialog.open();

    // Close overlay after 2 seconds
    setTimeout(() => {
      dialogRef.close();
    }, 2000);
  }
}
{% endraw %}
{% endhighlight %}

Here's our code in action. Remember, once we open an overlay it will automatically close after 2 seconds:

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-3?embed=1&file=app/file-preview-overlay.service.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

Awesome! We are making serious progress and it's not far until we reach the top of the mountain.

## Improving ergonomics

In the previous sections we have mainly improved the overlay under the hood and layed a foundation for upcoming features. In this section we want to focus on improving the overlay's ergonomics. This means that we want to be able to close the dialog when we click on the backdrop.

Turns out that the backdrop logic is extremely easy with the CDK. All we have to do is to subscribe to a stream that emits a value when the backdrop was clicked:

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {
  open(config: FilePreviewDialogConfig = {}) {
    ...
    // Subscribe to a stream that emits when the backdrop was clicked
    overlayRef.backdropClick().subscribe(_ => dialogRef.close());

    return dialogRef;
  }
}
{% endraw %}
{% endhighlight %}

That's it! Imagine how much work this would be without the CDK.

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-4?embed=1&file=app/file-preview-overlay.service.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

From here we could take it one step further and also close the overlay when a user naviagtes back in the browser history. For our application, however, this doesn't make much sense because we are not using the router and there's only one page that we render out to the screen. But feel free to give it a shot! Hint: use the `Location` service and subscribe to the browser's `popState` events.

## Sharing data with the overlay component

The goal of this post was to implement a **generic** file preview dialog rather than a static one. At the moment the overlay is quite static and there's no way we can share data with the overlay component. Sharing data means we want to be able to provide an image that will be available within the component. After all it's supposed to be a file preview. Therefore, we need to think about how we can **share** data with the component that is dynamically created.

Luckily, Angular has a hierarchical dependency injection system (DI for short) that we can leverage for our purpose. For more information on Angular's DI system, check out [this](/angular/2015/05/18/dependency-injection-in-angular-2) post.

In a nutshell, the DI system is flexible enough that we can reconfigure the injectors at any level of the component tree. That said, there is no such thing as _the injector_. An application may have multiple injectors and each component instance has its own injector. You hear the bells ring? Right, we can create our own **custom injector** and provide it with a list of **custom injection tokens**. It sounds more complicated than it actually is.

Turns out, the CDK already has a class `PortalInjector` that that we can use to provide custom injection tokens to components inside a portal. This is exactly what we need. Let's break ground and implement a function `createInjector()` that creates a new `PortalInjector` and defines a list of custom injection tokens.

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {
  ...
  private createInjector(config: FilePreviewDialogConfig, dialogRef: FilePreviewOverlayRef): PortalInjector {
    // Instantiate new WeakMap for our custom injection tokens
    const injectionTokens = new WeakMap();

    // Set custom injection tokens
    injectionTokens.set(FilePreviewOverlayRef, dialogRef);
    injectionTokens.set(FILE_PREVIEW_DIALOG_DATA, config.data);

    // Instantiate new PortalInjector
    return new PortalInjector(this.injector, injectionTokens);
  }
{% endraw %}
{% endhighlight %}

In the code above we create a new `WeakMap`, set our custom injection tokens that we want to be available (injectable) in the overlay component, and finally instantiate a new `PortalInjector`. The important part though is that we also specify a parent injector (first argument) which is mandatory. Also notice the second argument where we pass in our injection tokens.

There are two things that we are providing. The first token is the `FilePreviewDialogRef`. Having the remote control at hand, allows the overlay component to close itself. This is very useful because there will definitely be a close button somewhere. The second token is a custom `InjectionToken` that stores the data that we want to share with the component.

For the `InjectionToken` we create new file `file-preview-overlay.tokens` and instantiate a new `InjectionToken`:

{% highlight js %}
{% raw %}
import { InjectionToken } from '@angular/core';

import { Image } from './file-preview-overlay.service';

export const FILE_PREVIEW_DIALOG_DATA = new InjectionToken<Image>('FILE_PREVIEW_DIALOG_DATA');
{% endraw %}
{% endhighlight %}

Next, let's update our `FilePreviewDialogConfig` so that the user can specify an image that will be used by the overlay component:

{% highlight js %}
{% raw %}
interface Image {
  name: string;
  url: string;
}

interface FilePreviewDialogConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  data?: Image;
}

@Injectable()
export class FilePreviewOverlayService {
  ...
}
{% endraw %}
{% endhighlight %}

For better readability we'll also refactor our `open()` method and create a new `attachDialogContainer()` function that now takes care of creating the injector and component portal, as well as attaching the portal to the host.

{% highlight js %}
{% raw %}
@Injectable()
export class FilePreviewOverlayService {
  ...
  private attachDialogContainer(overlayRef: OverlayRef, config: FilePreviewDialogConfig, dialogRef: FilePreviewOverlayRef) {
    const injector = this.createInjector(config, dialogRef);

    const containerPortal = new ComponentPortal(FilePreviewOverlayComponent, null, injector);
    const containerRef: ComponentRef<FilePreviewOverlayComponent> = overlayRef.attach(containerPortal);

    return containerRef.instance;
  }
}
{% endraw %}
{% endhighlight %}

With that in place, we can now update our `FilePreviewOverlayComponent` and inject the tokens that we have defined on a component level with the help of a custom injector.

{% highlight js %}
{% raw %}
export class FilePreviewOverlayComponent {
  constructor(
    public dialogRef: FilePreviewOverlayRef,
    @Inject(FILE_PREVIEW_DIALOG_DATA) public image: any
  ) { }
}
{% endraw %}
{% endhighlight %}

We can now define data that will be passed to the overlay component and render an image onto the screen. Here's an example of how we can pass in data:

{% highlight js %}
{% raw %}
@Component({...})
export class AppComponent  {
  ...
  showPreview(file) {
    let dialogRef: FilePreviewOverlayRef = this.previewDialog.open({
      image: file
    });
  }
}
{% endraw %}
{% endhighlight %}

Finally with a little bit of styling we come much closer to what we're trying to achieve.

<iframe style="height: 500px" src="https://stackblitz.com/edit/custom-overlay-step-5?embed=1&file=app/file-preview-overlay.service.ts&ctl=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Where to go from here

This is it. Although creating custom overlays is something that's more or less tricky to do, this task becomes rather easy with UI libraries like Angular Material that provide us with a common set of tools to build awesome and high-quality Angular components. More specifically, by extracting common behaviors and patterns into a so called Component Dev Kit, it becomes extremely easy to build a custom overlay.

Where to go from here? As mentioned in the beginning, this was only part one and we haven't fully re-built the Google Drive-like file preview yet. In the [next post](/angular/2017/11/27/custom-overlays-with-angulars-cdk-part-two.html) we will build on top of this and implement keyboard support, image preloading and add animations in order to make our overlay more engaging.
