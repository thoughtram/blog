---
layout: post
title: A web animations deep dive with Angular
imageUrl: /images/banner/angular-animations.jpg
date: 2017-07-26T00:00:00.000Z
summary: >-
  Angular comes with a built-in animation system that lets us create powerful
  animations based on the Web Animations API. In this article we'll look at two
  differet approaches, namely imperative and declarative animations.
categories:
  - angular
tags:
  - angular2
  - animations
  - motion
  - imperative
  - declarative
author: dominic_elm
related_posts:
  - Custom Overlays with Angular's CDK - Part 2
  - Custom Overlays with Angular's CDK
  - Easy Dialogs with Angular Material
  - Custom themes with Angular Material
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

Motion is an important aspect when building modern web applications. In fact, it's important for all kinds of software products that involve user interfaces and interactions. Good user interfaces with well-designed animations help users understand the flow between two states. Imagine we are on a simple website that only has one button. We click that button and without any motion a box appears. Isn't that boring? Also, we as a user might think that the box appeared because of our action. However, it could have been the result of something else like an http call in the background. In addition, animations can be used to make the user interface more snappy and responsive. They also explain changes in the arrangement of elements on the screen as some user actions may change the UI.

This could easily drift off into a whole new discussion about user experience and why motion matters. The bottom line is that motion not only makes a site more usable but also more fun. They tell stories, add a perceptible time dimension and improve the overall user experience of applications.

In this article we'll briefly look at different ways to approach motion in modern web applications, specifically imperative and declarative animations. We'll cover the basics of CSS and JavaScript animations before diving diving into a sophisticated animation in the context of an Angular application.

Let's start with a deeper breath of how animations in the web generally work.

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Understanding state transitions

With animations we aim to guide users between views so they feel comfortable using the site, draw attention to some parts of application, increase spacial awareness, indicate if data is being loaded, and probably the most important point - **smoothly transition users between states**. All this could be achieved by using CSS (declarative) or JavaScript (mostly imperative) to animate certain elements within your page.

What's a transition you may ask. Very good question! The [Oxford Dictionary](https://en.oxforddictionaries.com/definition/transition) defines a transition as follows:

> The process or a period of changing from one state or condition to another.

Applied to animations, a transition is the visualization of some state changing over time. A **state** could be a person sitting at the airport waiting for his plane to be boarded. It's a condition something or someone is in at a specific point in time. A button on website could have 4 different states - `idle`, `hover`, `focus` and `pressed`, where the latter is a combination of `focus` and `active`. We could use a finite state machine or simply state transition system to visualize how it works:

![button state machine](/images/button_state_machine.gif)

The point is, a "system" or some element on the page can have multiple states. Instead of simply going from state A to B, we'd like to interpolate the values in between. Therefore, we can listen for _state changes_ and act accordingly using animated transitions from one state to another.

## What can we use to animate our UI?

Nowadays, with modern browsers in mind, we have many technologies at hand to animate our UI including CSS3 or JavaScript. The power of CSS animations (transitions or keyframes) is that they allow animating most HTML elements without using JavaScript. CSS animations are also quite fast and allow hardware acceleration. However, there are some limitations to this approach. For instance, you can't animate an element along a certain path, use physics-based motion or animate the scroll position with CSS alone. While CSS animations are pretty good for simple transitions between states (e.g. hover-effects), JavaScript-based animations provide far more flexibility.

As a matter of fact, we can take advantage of the same hardware acceleration in JavaSript too. It's as easy as setting a CSS property with a 3D characteristic, such as `translate3d()` or `matrix3d()`. This will push the particular element onto another layer which is then processed by the GPU. The GPU itself is highly optimized for moving pixels making it much for effective for animations compared to the CPU. For more information, check out this great article by Paul Lewis and Paul Irish on [high performance animations](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/).

CSS animations do not require any 3rd party libraries. However, there are some tools that make your life much easier, for example libraries that provide pre-defined keyframe animations like [Animate.css](https://github.com/daneden/animate.css).

Looking at JavaScript, we can either use vanilla JavaScript or jQuery to animate our UI. Maintaining vanilla JavaScript animations and manually setting up elements on the stage could be quite a hassle. That's one reason why many of us switched to jQuery at some point. jQuery makes it easy to query an element on the page. Then, in order to add motion, all we do is to call `.animate()` and specify the properties (e.g. opacity or transform) we'd like to animate. Here is how we'd move a `div` to the right by `200px` animating its `left` property:

{% highlight js %}
{% raw %}
$("button").click(function(){
  $("div").animate({
    left: '200px'
  }, 'slow');
});
{% endraw %}
{% endhighlight %}

While this works, it's better to stick with either the `transform` or `opacity` property as those are the only things a browser can animate cheaply. Note that we use the string `slow` to specify the duration of the animation. It is an equivalent for supplying a duration of `600` milliseconds.

Turns out there is another cool kid on the block called [GreenSock](https://greensock.com/), a high-performance HTML5 animation library for the modern web. It allows us to define simple animations as well as complex timeline compositions, drag and drop features or even smoothly morph any SVG shape into any other shape. According to GreenSock, GSAP performs 20 times faster than jQuery. If you'd like to see this in action, there is a [speed comparison](https://greensock.com/js/speed.html) to stress test the performance of various common JavaScript libraries including jQuery, GSAP or Web Animations.

Let's create the same animation as before, but this time using GSAP. More specifically we'll use [TweenLite](https://greensock.com/tweenlite), a lightweight animation tool that serves as the foundation of GSAP.

{% highlight js %}
{% raw %}
var button = document.querySelector('button');

button.addEventListener('click', () => {
  TweenLite.to('div', 0.6, {
    left: 200
  });
});
{% endraw %}
{% endhighlight %}

> Note that the code above requires a plugin called [CSSPlugin](https://greensock.com/CSSPlugin). This plugin allows us to animate almost any CSS property.

When working with frontend frameworks like Angular it could be a whole new story as some of them handle animations differently.

That doesn't mean it's not using some of the core concepts under the hood. They often come with their own animation system. Take Angular's animation system for example, that is built on top of the Web Animations API (WAAPI). It's fairly new and currently being implemented in Chrome and Firefox. It's goal is to unite CSS, JS and SVG. More specifically, it aims to provide the power of CSS performance, add the benefits and flexibility of JS and SVG as well as leave the fundamental work to the browser without the need for additional dependencies.

If you want to learn more about the Web Animation API, check out [this](http://danielcwilson.com/blog/2015/07/animations-intro/) series of posts which goes a lot more into detail while covering advanced features like running multiple animations in parallel or in sequence, animating elements along a motion path or controlling animations using the `AnimationPlayer`.

Here is a snippet showing the WAAPI in action:

{% highlight js %}
{% raw %}
var button = document.querySelector('button');

var wrapper = document.querySelector('div');
wrapper.style.position = 'relative';

button.addEventListener('click', () => {
  wrapper.animate([
    { left: getComputedStyle(elem).left },
    { left: '200px' }
  ], { duration: 600, /* and more like easing, delay etc. */ });
});
{% endraw %}
{% endhighlight %}

Remember, the WAAPI is still a work in progress and things like additive animations are not fully supported yet. That's why we use `getComputedStyle()` to calculate the very first `KeyframeEffect`. A `KeyframeEffect` is used to specify the values for the properties we'd like to animate. Each effect represents one keyframe and the values are basically interpolated over time. In other words, the array is a collection of keyframes. Here is an equivalent CSS keyframe animation:

{% highlight css %}
{% raw %}
@keyframes moveToRight {
  from {
    left: 0px;
  }
  to {
    left: 200px;
  }
}

div {
  position: relative;
  animation: moveToRight 600ms forwards;
}
{% endraw %}
{% endhighlight %}

Similar to the WAAPI, we also need to set the initial value when animating the `left` property. This is not needed if we were translating the element on the X-axis to another location via its `transform` property. With CSS keyframe animations we normally define when the change will happen with either percentage values or the keywords `from` and `to`, which are the same as `0%` and `100%`.

We do this with the WAAPI by defining an `offset` for each set of property values (keyframe). Keyframes without any offset will have offsets computed, e.g. the first keyframe has an offset of `0`, the last will be `1`.

So far, we have seen a little bit of CSS and JavaScript animations and how to leverage them to animate parts of our application. In the next section we'll look at at a specific case study implementing a real-world user profile animation. The goal is to implement the exact same animation both imperatively and declaratively using GSAP and Angular's built-in animation system. Yes, there's going to be a lot of Angular!

## Case study: An animated modal-based user profile

Enough about theory! Let's build a simple modal-based user profile and apply animations to improve the user experience and draw focused-attention to the dialog.

Here's a preview of what we are going to build:

![animation preview](/images/animation_preview.gif)

Our application is going to be very simple and mainly consists of two components:

- DashboardComponent
- ProfileDetailsComponent

The `DashboardComponent` is the entry point (root component) of our application. It contains almost no logic and merely represents a wrapper composing the `ProfileDetailsComponent`.

Inside the `DashboardComponent` we initialize the data for the user profile and toggle the visibility of the dialog. An `ngIf` will then show and hide the template. This is important for our animation because we use it as a trigger.

Here is the template of the `DashboardComponent`:

{% highlight html %}
{% raw %}
<div>
  <header>
    <span class="title">Dashboard</span>
    <div class="image-container" (click)="toggleProfileDetails()" data-tooltip="Profile" >
      <img class="profile-button" src="..." />
    </div>
  </header>

  <profile-details [user]="user" *ngIf="showProfileDetails"></profile-details>
</div>
{% endraw %}
{% endhighlight %}

So far so good. Let's look at the template of `ProfileDetailsComponent`:

{% highlight html %}
{% raw %}
<div class="wrapper">
  <header>
    <div class="profile-image-wrapper">
      <div class="profile-image-border"></div>
      <img class="profile-image" src="..." />
    </div>
    <div class="profile-header-content">
      <span class="username">{{ user.name }}</span>
      <span class="username-title">{{ user.title }}</span>
    </div>
  </header>
  <main>
    <ul class="stats">
      <li class="stats-item">
        <span class="stats-icon icon-eye"></span>
        <span>{{ user.views }}</span>
      </li>
      <li class="stats-item">
        <span class="stats-icon icon-location"></span>
        <span>{{ user.location }}</span>
      </li>
      <li class="stats-item">
        <span class="stats-icon icon-heart"></span>
        <span>{{ user.hearts }}</span>
      </li>
    </ul>
  </main>
</div>
{% endraw %}
{% endhighlight %}

To achieve the desired animation we need to set some initial CSS properties to enable 3D-space for the children elements inside `ProfileDetailsComponent`. We do that by setting the `perspective` on the `host` element. CSS host selectors are a great way to apply styles without introducing an additional wrapper element.

Nonetheless, for our animation we still need a wrapper element because the `perspective` property doesn't affect how the host element is rendered; it simply enables 3D-space for children elements.

{% highlight css %}
{% raw %}
:host {
  perspective: 500px;
  ...
}

.wrapper {
  transform-origin: top center;
  ...
}
{% endraw %}
{% endhighlight %}

Again, the perspective only affects **children** elements and only those that are transformed in a three-dimensional space, e.g. rotation about X-axis or translation along Z-axis. The value for the perspective determines the strength of the 3D-effect. In other words, it describes the distance between the object and the viewer. Therefore, if the value is very small the effect will be quite impressive as we are extremely close to the object. On the other hand, if the value is high the distance between the object and the viewer will be large and therefore the animation looks rather subtle. That said, we need to set the `perspective` property in order to achieve 3D-effects.

In addition, we have to specify a point of origin for our upcoming transformation. By default the point of origin is exactly the center of any element. The rest is just simple styling for the dialog.

Alright. Now that we got this in place, let's implement our animation imperatively using GreenSocks's timeline feature.

### Imperative implementation using GreenSock

In order to achieve this animation with GSAP we need to use its timeline feature. Make sure to either use [TweenMax](https://greensock.com/tweenmax) or add [TimelineLite](https://greensock.com/timelinelite) separately to your project.

A timeline is basically a container where we place tweens over the course of time. Tweening is the process of generating intermediate frames between two states. With GSAP's timeline we can easily build sequences of animations and animate an element `.to()` or `.from()` a certain state. In addition, we get a lot of control over our animations. As such, we can stop, pause, resume, or even reverse them. Here is a simple example:

{% highlight js %}
{% raw %}
window.onload = function () {
  var timeline = new TimelineLite();

  var h1 = document.getElementById('first');

  timeline
    .add('start')
    .from(h1, 0.7, { opacity: 0, ease: Power2.easeIn }, 'start')
    .from(h1, 1, { x: 200, ease: Bounce.easeOut }, 'start')
    .to('#second', 0.3, { backgroundColor: '#ffeb3b' })
    .to('#third', 0.3, { x: 200, repeat: 1, yoyo: true }, '-=0.3')
    .play();

  var button = document.getElementsByTagName('button');

  button[0].addEventListener('click', function() {
    timeline.restart();
  });
}
{% endraw %}
{% endhighlight %}

Check out the demo and try it out!

{% include plunk.html url="https://embed.plnkr.co/KOg0LSVLU1JIH8QAVu49/preview" %}

With `TimelineLite` we have complete control over where tweens are placed on the timeline and they can overlap as much as we want. Notice how we use `.add()` to add a label to the timeline. We can use labels to start multiple animations at the same time. For instance, we use this mechanism to run two animations in parallel. The `h1` will fade and translate in at the same time. Both animations could easily be combined in a single animation, but they have different easing functions. It solely demonstrates how to use labels.

Let's see how we can do that in our Angular application. First off, we get all the elements using Angular's built-in `@ViewChild()` and `@ViewChildren()` decorators. We leverage those to query specific elements within the view of a component.

`@ViewChild()` returns an `ElementRef`, whereas `@ViewChildren()` returns a `QueryList`. Essentially it's an object that stores a list of elements and implements the `iterable` interface. This makes it possible to be used in combination with `ngFor`. The cool thing is that it's based on Observables. This means we can subscribe to changes and get notified whenever an element is added, removed, or moved.

For more information check out Minko's [blog post](http://blog.mgechev.com/2016/01/23/angular2-viewchildren-contentchildren-difference-viewproviders/) about the difference between **view children** and **content children** in Angular.

Here's how we use it in our Angular application to grab the elements we need:

{% highlight js %}
{% raw %}
@ViewChild('wrapper') wrapper: ElementRef;
@ViewChild('main') main: ElementRef;
...
{% endraw %}
{% endhighlight %}

The decorator takes either a type or a template reference variable. In most cases, such template reference variable is a reference to a DOM element inside a component's template. The following snippet shows how we'd get a reference to the `wrapper` element:

{% highlight html %}
{% raw %}
<div class="wrapper" #wrapper>
...
</div>
{% endraw %}
{% endhighlight %}

See the `#wrapper`? That's how we declare a local template reference for that specific element. We do this for all the elements we need for the animation. With that in place, we can instantiate our timeline.

Usually we use `ngOnInit` to implement our initialization logic. However, this is a little bit too early in a component's lifecycle because we have to wait for the component to be fully initialized in order to use the DOM elements we collected. There's a lifecycle hook called `ngAfterViewInit` which is the perfect moment in a component's initialization process in which we have everything we need to set up the timeline.

{% highlight js %}
{% raw %}
ngAfterViewInit() {
  this.timeline = new TimelineLite();
  ...
}
{% endraw %}
{% endhighlight %}

Cool! But before we can construct the timeline for our profile animation there's one thing left to do. We need to apply an initial transformation to the `wrapper` element via CSS in order to achieve the fancy 3D-effect:

{% highlight css %}
{% raw %}
.wrapper {
  transform: rotateX(-90deg) translateY(150px) translateZ(50px);
  ...
}
{% endraw %}
{% endhighlight %}

We can now apply the concepts we learned to build the timeline:

{% highlight js %}
{% raw %}
this.timeline
  .add('start')
  .from(this.wrapper.nativeElement, .15, { opacity: 0 }, 'start')
  .to(this.wrapper.nativeElement, .3, { rotationX: 0, y: 0, z: 0,  ease: Power3.easeIn}, 'start')
  .add('image', '-=0.1')
  .add('main', '-=0.15')
  .add('icons', '-=0.1')
  .add('text', '-=0.05')
  .from(this.profileImageBorder.nativeElement, .3, { scale: 0 }, 'image')
  .from(this.profileImage.nativeElement, .3, { scale: 0, delay: .05 }, 'image')
  .from(this.main.nativeElement, .4, { y: '100%' }, 'main')
  .staggerFrom([this.username.nativeElement, this.title.nativeElement], .3, { opacity: 0, left: 50 }, 0.1, 'image')
  .staggerFrom(this.statsIcons, .3, { opacity: 0, top: 10 }, 0.1, 'icons')
  .staggerFrom(this.statsTexts, .3, { opacity: 0 }, 0.1, 'text')
  .play();
{% endraw %}
{% endhighlight %}

Woah! This looks pretty overwhelming at first glance. But all we have to do is to orchestrate our animation using GreenSock's timeline API. With the help of labels we can run multiple animations in parallel and precisely control the timing of certain animations.

One thing we haven't talked about so far is `.staggerFrom()`. A stagger is an animation that contains a delay between each successive animation.

The whole animation can be illustrated as follows:

<img src="/images/animation_timeline.png" width="80%" alt="animation timeline" />

Here's the full-fledge solution. Take a look and fiddle with it.

<iframe style="height: 600px" src="https://embed.plnkr.co/RMtC6RqBAzrFmmOiJu4i?show=preview&deferRun&sidebar" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

### Declarative implementation using Angular Animations

In the previous section we have seen how to implement the profile animation with GreenSock in an imperative way. There are some drawbacks to that solution. First, it's quite some boilerplate and work to collect all the elements and manually set up the timeline. That said, an animation platform like GSAP requires the DOM to be ready. A framework can make much more assumptions about the instructions (animation data) and the environment (app and browser) before animating things. Second, it can be very beneficial if there's a framework backing the animation engine, like with Angular. GSAP and other animation libraries cannot easily handle DOM insertions or removals because they do not own the DOM transactions. Angular on the other hand has full control over the DOM.

If you are completely new to animations with Angular, check out [this](/2016-09-16-angular-2-animation-important-concepts.md) post by Thomas Burleson. It covers the fundamentals and shows an example of a more complex fade animation.

Alright, let's refactor our profile animation using the latest animation features introduced with Angular 4.2. To get started, we first have to import the `BrowserAnimationsModule` from `@angular/platform-browser/animations` and add it to the `imports` of our application:

{% highlight js %}
{% raw %}
@NgModule({
  imports: [
    BrowserAnimationsModule
    ...
  ],
  ...
})
export class DashboardModule {}
{% endraw %}
{% endhighlight %}

Remember, animations in Angular are based on the WAAPI and work in browsers that support it including Chrome and Firefox. However, currently Internet Explorer and Safari do not. In this case a [polyfill](https://github.com/web-animations/web-animations-js) is required to achieve similar results. Once animations are properly imported and enabled, we can go ahead and start defining the profile animation.

To quickly recap, animations are declared with the animations metadata property within the `@Component()` decorator. Each animation is defined by a `trigger` which takes a name and a list of `state` and `transition` entries. Angular's animation engine works basically like a state machine. That's right. This should sound familiar. We have seen it in the beginning of this post, remember? The first argument of `transition` allows you to specify a direction from one state to another, also known as **state-change-expression**. Here are some common values:

- `* => *` captures a state change between any states
- `void => *` captures the entering of elements
- `* => void` captures the leaving of elements

The last two are so common that they have their own aliases:

- `:enter` for `void => *`
- `:leave` for `* => void`

Angular 4.2 introduces several new animation features and extends Angular's animation DSL. Here's a quick overview of what's new:

- **query()** can be used to find one or more elements within the element that's being animated
- **stagger()** animates a bunch of elements with a delay in between each animation
- **group()** specifies a list of animations that are run in parallel
- **sequence()** specifies a list of animations that are run one at a time
- **animation()** can be used to create reusable animations with input parameters
- **useAnimation()** invokes reusable animations created with `animation()`
- **animateChild()** will invoke child animations which are normally blocked

Neat! Let's use that to re-implement our profile animation with Angular's animation DSL. In order to demonstrate most of the above animation helpers, especially `animateChild()`, we need to refactor our application a bit.

First of all, we create a new component called `ProfileStatsComponent` which now contains the `ul` that was previously part of the `DashboardComponent`. The template of the `DashboardComponent` now looks like this:

{% highlight html %}
{% raw %}
<div class="wrapper">
  <header>
    <div class="profile-image-wrapper">
      <div class="profile-image-border"></div>
      <img class="profile-image" src="https://api.adorable.io/avatars/90/me@you.com.png" />
    </div>
    <div class="profile-header-content">
      <span class="username">{{ user.name }}</span>
        <span class="username-title">{{ user.title }}</span>
    </div>
  </header>
  <main>
    <profile-stats [user]="user"></profile-stats>
  </main>
</div>
{% endraw %}
{% endhighlight %}

The dashboard now composes the `ProfileStatsComponent` which will later define its own animation. For now, let's focus on the profile animation and talk about child animations in a minute.

Here's how we define our `profileAnimation`:

{% highlight js %}
{% raw %}
animations: [
  trigger('profileAnimation', [
    transition(':enter', group([
      ...
    ]))
  ])
]
{% endraw %}
{% endhighlight %}

Within our `profileAnimation` we define one `transition` and on `:enter` (when the dialog enters the DOM) we run several animations in parallel. Next, we use `query()` to grab the DOM elements we need for our animation and set some initial styles using the `styles` helper:

{% highlight js %}
{% raw %}
animations: [
  trigger('profileAnimation', [
    transition(':enter', group([
      query('.wrapper', style({ opacity: 0, transform: 'rotateX(-90deg) translateY(150px) translateZ(50px)' })),
      query('.profile-image-border, .profile-image', style({ transform: 'scale(0)' })),
      query('.username, .username-title', style({ opacity: 0, transform: 'translateX(50px)' })),
      query('main', style({ transform: 'translateY(100%)' }))
    ]))
  ])
]
{% endraw %}
{% endhighlight %}

Remember how we collected the DOM elements using `@ViewChild()` and `@ViewChildren()`? We don't need to do that anymore. Plus, we can get rid of all the local template references because that is now handled by `query()`. Quite powerful, huh?

Before we implement the profile animation, let's create a reusable **fade** animation that we can use elsewhere in different places with full input parameter support:

{% highlight js %}
{% raw %}
export const fadeAnimation = animation([
  animate('{{ duration }}', style({ opacity: '{{ to }}' }))
], { params: { duration: '1s', to: 1 }});
{% endraw %}
{% endhighlight %}

The `fadeAnimation` can now be imported into our application, adjusted via input parameter and invoked using `useAnimation()`. The values we specified for the input parameters are default values.

Once we have that in place, let's add the missing pieces to our animation:

{% highlight js %}
{% raw %}
animations: [
  trigger('profileAnimation', [
    transition(':enter', group([
      // Initial Styles
      ...

      query('.wrapper', group([
        useAnimation(fadeAnimation, {
          params: {
            duration: '150ms',
            to: 1
          }
        }),
        animate('300ms cubic-bezier(0.68, 0, 0.68, 0.19)', style({ transform: 'matrix(1, 0, 0, 1, 0, 0)' }))
      ])),

      query('.profile-image-border', [
        animate('200ms 250ms ease-out', style('*'))
      ]),

      query('.profile-image', [
        animate('200ms 300ms ease-out', style('*'))
      ]),

      query('.username, .username-title', stagger('100ms', [
        animate('200ms 250ms ease-out', style('*'))
      ])),

      query('main', [
        animate('200ms 250ms ease-out', style('*'))
      ])

      ...
    ]))
  ])
]
{% endraw %}
{% endhighlight %}

In the code above, we query a bunch of elements and use several animation helpers to achieve the desired effect. All animations will run in parallel because they are defined within a `group()`. Also, there are no "labels" or a similar feature to what GreenSock provides with `.add()`. Turns out, Angular has no timeline support yet and we need to fiddle with delays in order to orchestrate the animation.

If we take a closer look we can see that there's actually more to it. For instance for the `wrapper`, we run two animations in parallel one of which is the reusable animation we defined earlier. We can invoke a reusable animation with the `useAnimation()` method. While `AnimationOptions` are optional, we specify them to override the default input paramters.

Furthermore, we can spot this special style property of `style('*')`. This will basically remove all of the special styling we have added (e.g. initial styles) and reset the state of the element. It's an equivalent of setting each value to `*`. This means that Angular will figure out the values at runtime. On top of that use the `stagger()` animation helper method to animate multiple elements with a time gap in between each animated element.

#### Applying animations using @HostBinding()

Ok, but how do we use the animation? For that we can either attach the **trigger** to the element within the component's template or use a `@HostBinding()`. In our case, we use the `@HostBinding()` because we want to attach the trigger to the host element:

{% highlight js %}
{% raw %}
export class ProfileStatsComponent {
  ...

  @HostBinding('@profileAnimation')
  public animateProfile = true;

  ...
}
{% endraw %}
{% endhighlight %}

#### Understanding child animations

In a real-world scenario you most likely end up having multiple components and animations on different levels, e.g. parent or child animations. Turns out that parent animations will always get priority and any child animation will be blocked. That's a shame. But don't bury your head in the sand yet because Angular got you covered! We can query inner elements and use `animateChild()` to allow child animations to run. The cool thing is we can do that at any point in the animation sequence within a defined `transition`.

In our example, we created a component called `ProfileStatsComponent`. Let's see this in action and start off by creating a child animation for this component using everything we know by now:

{% highlight js %}
{% raw %}
animations: [
  trigger('statsAnimation', [
    transition('* => *', group([
      query('.stats-icon', style({ opacity: 0, transform: 'scale(0.8) translateY(10px)' })),
      query('.stats-text', style({ opacity: 0 })),

      query('.stats-icon', stagger('100ms', [
        animate('200ms 250ms ease-out', style('*'))
      ])),

      query('.stats-text', stagger('100ms', [
        animate('200ms 250ms ease-out', style('*'))
      ])),
    ])
  ])
]
{% endraw %}
{% endhighlight %}

Easy, right? Now we can go ahead and use the `animateChild()` helper as mentioned earlier in our `profileAnimation`:

{% highlight js %}
{% raw %}
animations: [
  trigger('profileAnimation', [
    transition(':enter', group([
      // Initial Styles
      ...

      // Animation
      ...
      query('profile-stats', animateChild())
    ]))
  ])
]
{% endraw %}
{% endhighlight %}

That's it. We fully re-implemented the profile animation using Angular's built-in animation system. It's very intuitive, easy to use and declarative.

Here's the demo. Try it out and fiddle with it!

<iframe style="height: 600px" src="https://embed.plnkr.co/kfJTtXT1V2AR01sFNfzw?show=preview&deferRun&sidebar" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

If you want to find out more about the new animation features in Angular 4.2+, check out [this](https://www.yearofmoo.com/2017/06/new-wave-of-animation-features.html#using-animation-and-useanimation) excellent post by Matias Niemela.

## Special Thanks

Kudos to [Matias Niemelä](https://twitter.com/yearofmoo) for the amazing work on the Angular Animation system!
