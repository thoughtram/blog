---
layout: post
title: Angular Animations - Foundation Concepts
date: 2016-09-16T00:00:00.000Z
update_date: 2017-04-01T00:00:00.000Z
imageUrl: ../assets/images/banner/angular-2-component-animations.jpg
summary: >-
  Animation in Angular is now easy and more intuitive... Learn foundational
  animation concepts and start animating your Angular components!
categories:
  - angular
tags:
  - angular2
  - animation
  - components
  - relative paths
topic: components
author: thomas_burleson
related_posts:
  - Component-Relative Paths in Angular
  - RxJS Master Class and courseware updates
  - Advanced caching with RxJS
  - Custom Overlays with Angular's CDK - Part 2
  - Custom Overlays with Angular's CDK
  - Easy Dialogs with Angular Material
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

Animations features often are scary goals for developers. And Angular's doctrine

> "... controllers should not directly modify DOM elements!"

made Animation features intimidating as hell. But **Angular animations are not scary!** Templates are closely associated/integrated with `@Component`. We will notice that animations following a similar pattern.

Let's build a component that hides and shows its contents, uses fade animation effects, and allows external components to easily trigger those fade effects.

### Our Scenario

Here is a simple Angular component with hide and show features. This sample, however, does not have animations (yet):

```js
@Component({
  selector: 'my-fader',
    template: `
    <div *ngIf="visibility == 'shown'" >
      <ng-content></ng-content>
      Can you see me? 
    </div>
  `
})
export class MyComponent implements OnChanges {
  visibility = 'shown';

  @Input() isVisible : boolean = true;

  ngOnChanges() {
   this.visibility = this.isVisible ? 'shown' : 'hidden';
  }
}
```

This component simply publishes an `@Input() isVisible` property; which allows other external components to show/hide the text content... without any animations.

### Enable Animations Module

Since Angular 4.x, there's a new module `BrowserAnimationsModule` that introduces all animation capabilities. That's why we first have add that to our application module's `imports` like this:

```js
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    ...
    BrowserAnimationsModule
  ]
  ...
})
export class AppModule {}
```

Once that is done, we can use any kind of animation API in our application. If we want to use animation function like `trigger()` or `state()`, we need to import them also from `'@angular/platform-browser/animations'` instead of `'@angular/core'`.

### Configure Component Animations

We want the `my-fader` component to **fade-in** or **fade-out** its text content. And we want to *animate* those fades effects.

To start animating, let's first add animation metadata to our component.

```js
@Component({
  ...,
  template : ``,
  animations: [
    ...
  ]
)]
class MyComponent() { ... }
```

Above we show that the `animations` metadata property is defined in the `@Component` decorator. Just like `template` metadata property!

Since our component has a `visibility` property whose state can change between `shown` and `hidden`, let’s configure animations to trigger and animate during each value change.

```js
animations: [
  trigger('visibilityChanged', [
  state('shown' , style({ opacity: 1 })), 
  state('hidden', style({ opacity: 0 }))
  ])
]
```

Before we add more metadata, let's talk about the syntax above. What does it mean... and why is this syntax used?

The techno-speak above is saying that when the `visibilityChanged` property changes and the value `== shown`, then the target element opacity changes to 1. And when the value changes to `== hidden`, the target element opacity should change to 0.

> Note: The `[@visibilityChanged]` binding is on `<div>` child content element in the `<my-fader>` component. It is NOT on the `<my-fader>` element itself. In other words, the animation target in our example is actually the `<div>` element; not the component **host** element.

Now, you might also wonder where `visibilityChanged` comes from? Because our component property is just called `visibility`. Hold your wild horses Mr. StageCoach, we'll clarify that soon!" Let's first talk about animation durations.

We want to animate these changes over a time duration instead of instantly hiding/showing the content. We need to configure a *transition* to specify animation durations. With Angular this is also suprisingly easy:

```js
animations: [
  trigger(’visibilityChanged', [
    state('shown' , style({ opacity: 1 })), 
    state('hidden', style({ opacity: 0 })),
    transition('* => *', animate('.5s'))
  ])
]
```

With the above `transition`, we added information to the animation configuration so each trigger value change will have a 500 msec transition. 

So a **fade-in** (opacity 0 -> 1, with a duration of 500 msec) will occur when the value changes from `hidden` to `shown`. And likewise the **fade-out** (opacity 1 -> 0, with a duration of 500 msec) will occur when the value changes from `shown` to `hidden`. By the way, you could also have used `animate('500ms')` to indicate the millsecond duration explicitly.

And what does the `transition('* => *', ...)` mean? Think of `* => *` as a transition from one state to another state; where `*` is a wildcard to mean **any** state value. If we wanted the *fade-out* to be slower than the *fade-in*, here is how we would configure the animation metadata:

```js
animations: [
  trigger(’visibilityChanged', [
    state('shown' , style({ opacity: 1 })),
    state('hidden', style({ opacity: 0 })),
    transition('shown => hidden', animate('600ms')),
    transition('hidden => shown', animate('300ms')),
  ])
]
```

See how easy this is? This notation is so easy to understand.


### The Essential Concept

The essential take-away Animation concept is that **Angular Animations** are triggered on component <u>state changes</u>. And developers should consider <u>state changes</u> to be equivalent to <u>value changes in a property</u> of the component instance.

![super-cool](https://media.giphy.com/media/NUC0kwRfsL0uk/giphy.gif)


### Linking Animation to the Component


<br/>
While we configured the Animation metadata,  I am sure you are wondering:

  *  How is the animation property `visibilityChanged` actually connected to the component?
  *  How are the animations linked to the component’s properties?

Since data-binding features are already supported between the **component** and its **template**,  Angular uses a <u>special</u> template animation syntax to support triggering the animation after data-binding changes. So in the component template, we can do this:

```html
<div [@visibilityChanged]="visibility">
  Can you see me? I should fade in or out...
</div>
```


Above the `@visibilityChanged` is the special template animation property and it uses databinding  `[@visibilityChanged]=“visibility”` to bind the component's visibility property to the animation  trigger property `visibilityChanged`.

Here is the entire component definition updated with Animation features:

```js
import { Component, OnChanges, Input } from '@angular/core';
import { trigger, state, animate, transition, style } from '@angular/platform-browser/animations';

@Component({
  selector : 'my-fader',
  animations: [
  trigger('visibilityChanged', [
    state('shown' , style({ opacity: 1 })),
    state('hidden', style({ opacity: 0 })),
    transition('* => *', animate('.5s'))
  ])
  ],
  template: `
  <div [@visibilityChanged]="visibility" >
    <ng-content></ng-content>  
    <p>Can you see me? I should fade in or out...</p>
  </div>
  `
})
export class FaderComponent implements OnChanges {
  @Input() isVisible : boolean = true;
  visibility = 'shown';

  ngOnChanges() {
   this.visibility = this.isVisible ? 'shown' : 'hidden';
  }
}
```


### Reducing Complexity

What if - instead of the using the extra `visibility` property - you just wanted to use the `isVisible` property directly? This would obviate `ngOnChanges()` and reduce the code complexity to:

 ```js
 @Component({
   animations: [
     trigger('visibilityChanged', [
       state('shown' , style({ opacity: 1 })),
       state('hidden', style({ opacity: 0 })),
       transition('* => *', animate('.5s'))
     ])
   ],
   template: `
   <div [@visibilityChanged]="isVisible" >
        ...
   </div>
   `
 })
 export class FaderComponent {
   @Input() isVisible : boolean = true;
 }
```

I love the tersity of this code. But this will not work without another **important** change to the animation metadata!

> Remember that the `@visibilityChanged` animation trigger property has defined states for the values: `shown` or `hidden`.

If you use the `myFader::isVisible` boolean property, then your animation state values must be changed to `true` and `false` since those are the possible values of the `isVisible` property.


```js
import { Component, OnChanges, Input } from '@angular/core';
import { trigger, state, animate, transition, style } form '@angular/platform-browser/animations';

@Component({
  selector : 'my-fader',
  animations: [
    trigger('visibilityChanged', [
      state('true' , style({ opacity: 1, transform: 'scale(1.0)' })),
      state('false', style({ opacity: 0, transform: 'scale(0.0)'  })),
      transition('1 => 0', animate('300ms')),
      transition('0 => 1', animate('900ms'))
    ])
  ],
  template: `
  <div [@visibilityChanged]="isVisible" >
    <ng-content></ng-content>
    <p>Can you see me? I should fade in or out...</p>
  </div>
  `
})
export class FaderComponent implements OnChanges {
  @Input() isVisible : boolean = true;
}
```

> Extra Bonus: The demo has some extra features. The *host* `my-fader` element now has a purple background; when you hide the `my-fader` content children you will see the host background. This change was added so you can visually see the differences between the *host* and the *target* animation elements.

### Our Animation Workflow

Above we have an improved the component definition; enhanced with animation features. Here is a workflow of the [animation] process:

  1.  the input value for `isVisible` changes,
  2.  the template databinding updates the `@visibilityChanged` property,
  3.  the animation trigger is invoked,
  4.  the `@visibilityChanged` value is used to identify the **state** animations and transitions, and
  5.  the target element opacity (and other properties) change-animates for xxx msecs


### Animation Philosophy

One of the design goals for Angular Animations is to make it **easy** for developers to configure and use animations. The API and syntax is designed to be:

  *  intuitive
  *  declarative and
  *  immediately associated with the component using metadata

The best part of Angular Animation design is that the **component->template->animation** binding solution <u>decouples</u> the animation from the component internals and uses the template as the binding bridge.

The developer decides which component properties should bind to which animation triggers, then simply uses the possible component property values to set the animation *state* values accordingly.

> In most cases, you will never need to write JavaScript animation logic.

All the mechanics of preparing and managing the animations are hidden from the developer. This 'separation of concerns' provides HUGE benefits to allow developers to easily use Angular Animations with custom architectures & custom implementations.

### Animations with Components Hierarchies

Components should never be concerned with the details regarding animation of child components. Parent components can monitor and alter the public **state** of child components, but should never attempt to modify the internals of those components.

In our examples (above), parent components can simply change the state of the child `my-fader` instances and then magically the contents of the `my-fader` instance will fadeIn or fadeOut.

```js
@Component({
  selector : 'my-app',
  template: `

  <my-fader [isVisible]="showFader">
    Am I visible ?
  </my-fader>

  <button (click)="showFader = !showFader"> Toggle </button>
  `
})
export class MyAppComponent {  
  showFader : boolean = true;
}
```

### Summary

The Angular Animation engine and compiler does all the hard work preparing, managing, and running the animations. Developers use the `@Component` metadata to declaratively define the component styles, templates, and [now] animations. And it is the component **template** that serves as the *bridge* to link the component instance state to the animation trigger property.

### Thanks

Kudos to [Matias Niemelä](https://twitter.com/yearofmoo) for the amazing Animation engine in Angular!

![matiasvikinghair](https://cloud.githubusercontent.com/assets/210413/18608523/49b8707c-7cb1-11e6-8d2c-ab43db07ca78.jpg)

These core animation features [discussed above] are available in the Angular 2.0.0 release. And never fear, Matias and his team are working hard on more amazing, intuitive Animation features. So stay tuned for even MORE cool features and blogs coming soon!
