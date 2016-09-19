---
layout:     post
title:      "Angular 2 Animations - Foundation Concepts"

date: 2016-09-16
imageUrl: '/images/banner/angular-2-component-animations.jpg'

summary: "Animation in Angular 2 is now easy and more intuitive... Learn foundational animation concepts and start animating your Angular 2 components!"

categories:
  - angular

tags:
  - angular2
  - animation
  - components
  - relative paths

topic: components

author: thomas_burleson
---

Animations features often are scary goals for developers. And Angular's doctrine

> "... controllers should not directly modify DOM elements!"

made Animation features intimidating as hell. But **Angular 2 animations are not scary!** Templates are
closely associated/integrated with `@Component`. We will notice that animations following a similar pattern.
Let's build a component that hides and shows its contents, uses fade animation effects, and allows external components to
easily trigger those fade effects.

### Our Scenario

Here is a simple Angular 2 component with hide and show features... but no animations (yet):

{% highlight js %}
{% raw %}
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
{% endraw %}
{% endhighlight %}

This component simply publishes an `@Input() isVisible` property; which allows other external components to show/hide the text content... without any animations.

<iframe style="width: 100%; height: 600px" src="http://embed.plnkr.co/vUPTsY/" frameborder="0" allowfullscren="allowfullscren"></iframe>


### Configure Component Animations

We want the `my-fader` component to **fade-in** or **fade-out** its text content. And we want to *animate* those fades effects.

----

The essential take-away Animation concept is that **Angular 2 Animations** are triggered on component state changes. Developers should consider state changes simply as value changes in a property of the component instance.

----

To start animating, let's first add animation metadata to our component.

{% highlight js %}
{% raw %}
@Component({
  ...,
  template : ``,
  animations: [
    ...
  ]
)]
class MyComponent() { ... }
{% endraw %}
{% endhighlight %}

Above we show that the `animations` metadata property is defined in the `@Component` decorator. Just like `template`(s)!

Since our component has a `visibility` property whose state can change between `shown` and `hidden`, let’s configure animations to trigger and animate during each value change.

{% highlight js %}
{% raw %}
animations: [
  trigger('visibilityChanged', [
  state('shown' , style({ opacity: 1 })), 
  state('hidden', style({ opacity: 0 }))
  ])
]
{% endraw %}
{% endhighlight %}

But what does the above mean... and why is this syntax used?

The techno-speak above is saying that when the `visibilityChanged` property changes to the value == 'shown', 
then the target element opacity changes to 1. And when the value changes == ‘hidden’, the
target element opacity should change to 0.

> Note: The `[@visibilityChanged]` binding is on `<div>` child content element in the <my-fader> component.
It is NOT on the <my-fader> element itself. Thus the animation target in our example
is the `<div>` element; not the component **host** element.

Now, you might also wonder where `visibilityChanged` comes from? Because our component property is just called `visibility`.
Hold your wild horses Mr. StageCoach, we'll clarify that soon!"

We want to animate these changes over a time duration instead of instantly hiding/showing the content.
We need to configure a *transition* to specify animation durations. With Angular 2 this is also suprisingly easy:

{% highlight js %}
{% raw %}
animations: [
  trigger(’visibilityChanged', [
    state('shown' , style({ opacity: 1 })), 
    state('hidden', style({ opacity: 0 })),
    transition('* => *', animate('.5s'))
  ])
]
{% endraw %}
{% endhighlight %}

With the above `transition`, we added information to the animation configuration so each trigger value change will have a 500 msec transition. 

So a **fade-in** (opacity 0 -> 1, with a duration of 500 msec) will occur when the value changes from `hidden` to `shown`. 
And likewise the **fade-out** (opacity 1 -> 0, with a duration of 500 msec) will occur when the value changes from `shown` to `hidden`.
By the way, you could also have used `animate('500ms')` to indicate the millsecond duration explicitly.

And what does the `transition('* => *', ...)` mean?

Think of `* => *` as a transition from one state to another state; where `*` is a wildcard to mean **any** state value.
If we wanted the *fade-out* to be slower than the *fade-in*, here is how we would configure the animation metadata:

{% highlight js %}
{% raw %}
animations: [
  trigger(’visibilityChanged', [
    state('shown' , style({ opacity: 1 })),
    state('hidden', style({ opacity: 0 })),
    transition('shown => hidden', animate('600ms')),
    transition('hidden => shown', animate('300ms')),
  ])
]
{% endraw %}
{% endhighlight %}

See how easy this is? This notation is so easy to understand.
The intention with Angular Animations is to make it **easy** for developers, to be:

*  intuitive
*  declarative and
*  immediately associated with the component...
  *  the `animations` configuration is right above the Class definition!

### Linking Animation to the Component


<br/>
We are not done yet! While we configured the Animation metadata,  I am sure you are wondering:

*  How is the animation property `visibilityChanged` actually connected to the component?
*  How are the animations linked to the component’s properties? 

Since data-binding features are already supported between the **component** and its **template**, 
Angular 2 uses a <u>special</u> template animation syntax to support triggering the animation after data-binding changes.
So in the component template, we can do this:

{% highlight html %}
{% raw %}
<div [@visibilityChanged]="visibility">
  Can you see me? I should fade in or out...
</div>
{% endraw %}
{% endhighlight %}


Above the `@visibilityChanged` is the special template animation property and it uses databinding 
`[@visibilityChanged]=“visibility”` to bind the component's visibility property to the animation 
trigger property `visibilityChanged`. 

And here is the entire component definition updated with Animation features:

{% highlight js %}
{% raw %}
import { 
  Component, OnChanges, Input, 
  trigger, state, animate, transition, style 
} from '@angular/core';

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
{% endraw %}
{% endhighlight %}
<br/>

----

This template-binding solution <u>decouples</u> the animation from the component internals and uses the template as the binding bridge.

----

### Reducing Complexity

What if - instead of the using the extra `visibility` property - you just wanted to use the `isVisible` property directly?
This would obviate `ngOnChanges()` and reduce the code complexity to:

 {% highlight js %}
 {% raw %}
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
 {% endraw %}
 {% endhighlight %}

But this will not work!  Why the heck not?

Remember that the `@visibilityChanged` animation trigger property is watching only triggers on values: `shown` or `hidden`.
If you use the `@Input() isVisible` property, then your animation state values must be changed to `true` and `false`:

{% highlight js %}
{% raw %}
import {
  Component, OnChanges, Input,
  trigger, state, animate, transition, style
} from '@angular/core';

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
{% endraw %}
{% endhighlight %}
<br/>

<iframe style="width: 100%; height: 600px" src="http://embed.plnkr.co/74lprkmzUGjT7UWbiyUr/" frameborder="0" allowfullscren="allowfullscren"></iframe>

> Extra Bonus: the *host* `my-fader` element has a purple background. When you hide the `my-fader` content children you will
see the host background. This was added so you can quickly see the differences between the *host* and the *target* animation elements.

<br/>
The beauty of this component-template-animation solution is that the developer decides which
component properties should bind to which animation triggers, then simply sets the *state*
values accordingly.

This separation of concerns provides HUGE benefits to couple Angular 2 animations to custom architectures & custom implementations.


### Our Animation Workflow 

Above we have an improved the component definition; enhanced with animation features.
Here is a workflow of the [animation] process:

*  the input value for `isVisible`
*  change detection triggers a call to `ngOnChanges()`
*  the component visibilty property changes
*  the template databinding updates the @visibilityChanged property value
*  the animation trigger is invoked
*  the state value is used to determine the animation 
*  the target element opacity change animates for 500 msecs

![super-cool](https://media.giphy.com/media/NUC0kwRfsL0uk/giphy.gif)

### Using Components with internal Animations

Parent components can simply change the state of the child `my-fader` instances and then magically the
contents of the `my-fader` instance will fadeIn or fadeOut.

> Recall that component state == value of `isVisible` property.

{% highlight js %}
{% raw %}
@Component({
  selector : 'my-app',
  template: `

  <my-fader [visibility]="showFader">
    Am I visible ?
  </my-fader>

  <button (click)="showFader = !showFader"> Toggle </button>
  `
})
export class MyAppComponent {  
  showFader : boolean = true;
}
{% endraw %}
{% endhighlight %}

<iframe style="width: 100%; height: 600px" src="http://embed.plnkr.co/NbWGjs/" frameborder="0" allowfullscren="allowfullscren"></iframe>



### Summary

The Angular 2 Animation engine and compiler does all the hard work of the preparing, managing, and running the animations.

The `@Component` metadata registers the component animation, and the component template is the glue
that *bridges* the component instance state to the animation trigger property.

<br/>

### Thanks

Kudos to [Matias Niemelä](https://twitter.com/yearofmoo) for the amazing Animation engine in Angular 2!

![matiasvikinghair](https://cloud.githubusercontent.com/assets/210413/18608523/49b8707c-7cb1-11e6-8d2c-ab43db07ca78.jpg)

These core animation features [discussed above] are available in the Angular 2.0.0 release. And never fear,
Matias and his team are working hard on more amazing, intuitive Animation features. So stay tuned for even MORE cool features and blogs coming soon!
