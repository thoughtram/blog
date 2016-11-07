---
layout:     post
title:      "Two-way Data Binding in Angular 2"
imageUrl:   "/images/banner/two-way-data-binding-in-angular-2.jpg"

date: 2016-10-13

summary: "Two-way data binding was one of the main selling points of Angular. In Angular 2, we can build directives that implement two-way data binding. This article explains how!"

categories:
  - angular

tags:
  - angular2
  - forms

author: pascal_precht

topic: forms

---

If there was one feature in Angular that made us go "Wow", then it was probably its two-way data binding system. Changes in the application state have been automagically reflected into the view and vise-versa. In fact, we could build our own directives with two-way data bound scope properties, by setting a configuration value.

{% include demos-and-videos-buttons.html post=page %}

**Angular 2 doesn't come with such a (built-in) two-way data binding anymore.** However, this doesn't mean we can't create directives that support two-way data binding. In this article we're going to explore how two-way data binding in Angular 2 is implemented and how we can implement it in our own directives.


## Two-way data binding in a nutshell

There's one directive in Angular 2 that implements two-way data binding: **ngModel**. On the surface, it looks and behaves as magical as we're used to (from Angular 1). But how does it really work? It's not that hard really. In fact, it turns out that two-way data binding really just boils down to event binding and property binding.

In order to understand what that means, let's take a look at this code snippet here:

{% highlight html %}
{% raw %}
<input [(ngModel)]="username">

<p>Hello {{username}}!</p>
{% endraw %}
{% endhighlight %}

Right, this is that one demo that blew our minds back in 2009, implemented in Angular 2. When typing into the input, the input's value is written into the `username` model and then reflected back into the view, resulting in a nice greeting.

How does this all work? Well, as mentioned earlier, two-way data binding in Angular 2 really just boils down to property binding and event binding. There is no such thing as two-way data binding. Without the `ngModel` directive, we could easily implement two-way data binding just like this:

{% highlight html %}
{% raw %}
<input [value]="username" (input)="username = $event.target.value">

<p>Hello {{username}}!</p>
{% endraw %}
{% endhighlight %}

Let's take a closer look at what's going on here:

- **[value]="username"** - Binds the expression `username` to the input element's `value` property
- **(input)="expression"** - Is a declarative way of binding an expression to the input element's `input` event (yes there's such event)
- **username = $event.target.value** - The expression that gets executed when the `input` event is fired
- **$event** - Is an expression exposed in event bindings by Angular, which has the value of the event's payload

Considering these observations, it becomes very clear what's happening. We're binding the value of the `username` expression to the input's `value` property (data goes into the component).

We also bind an expression to the element's `input` event. This expression assigns the value of `$event.target.value` to the `username` model. But what is `$event.target.value`? As mentioned, `$event` is the payload that's emitted by the event. Now, what is the payload of the `input` event? It's an [InputEventObject](https://developer.mozilla.org/en-US/docs/Web/Events/input), which comes with a `target` property, which is a reference to the DOM object that fired the event (our input element). So all we do is, we're reading from the input's `value` property when a user enters a value (data comes out of the component).

**That's it. That's two-way data binding in a nutshell.** Wasn't that hard right?

Okay cool, but when does `ngModel` come into play then? Since a scenario like the one shown above is very common, it just makes sense to have a directive that abstracts things away and safes us some keystrokes. 

## Understanding ngModel

If we take a look at the source code, we'll notice that `ngModel` actually comes with a property and event binding as well. Here's what our example looks like using `ngModel`, but without using the shorthand syntax:

{% highlight html %}
{% raw %}
<input [ngModel]="username" (ngModelChange)="username = $event">

<p>Hello {{username}}!</p>
{% endraw %}
{% endhighlight %}

Same rules apply. The property binding `[ngModel]` takes care of updating the underlying input DOM element. The event binding `(ngModelChange)` notifies the outside world when there was a change in the DOM. We also notice that the handler expression uses only `$event` and no longer `$event.target.value`. Why is that? As we've mentioned earlier, `$event` is the payload of the emitted event. In other words, `ngModelChange` takes care of extracting `target.value` from the inner `$event` payload, and simply emits that (to be technically correct, it's actually the `DefaultValueAccessor` that takes of the extracting that value and also writing to the underlying DOM object).

Last but not least, since writing `username` and `ngModel` twice is still too much, Angular allows the shorthand syntax using `[()]`, also called "Banana in a box". So after all, it's really an implementation detail of `ngModel` that enables two-way data binding.

## Creating custom two-way data bindings

Using this knowledge, we can now build our own custom two-way data bindings. All we have to do is to follow the same rules that `ngModel` follows, which are:

- Introduce a property binding (e.g. `[foo]`)
- Introduce a event binding with the same name, plus a `Change` suffix (e.g. `(fooChange)`)
- Make sure the event binding takes care of property extraction (if needed)

As you can see, there's a bit more work involved to make two-way data binding work compared to Angular 1. However, we should also always consider if a custom two-way data binding implementation is really needed, or if we can just take advantage of `ngModel`. This, for example is the case when building [custom form controls](/angular/2016/07/27/custom-form-controls-in-angular-2.html).

Let's say we create a custom counter component and ignore of a second that this would rather be a custom form control.

{% highlight js %}
{% raw %}
@Component({
  selector: 'custom-counter',
  template: `
    <button (click)="decrement()">-</button>
    <span>{{counter}}</span>
    <button (click)="increment()">+</button>
  `
})
export class CustomCounterComponent {

  counterValue = 0;

  get counter() {
    return this.counterValue;
  }

  set counter(value) {
    this.counterValue = value;
  }

  decrement() {
    this.counter--;
  }

  increment() {
    this.counter++'
  }
}
{% endraw %}
{% endhighlight %}

It has an internal `counter` property that is used to display the current counter value. In order to make this property two-way data bound, the first thing we have to do is to make it an `Input` property. Let's add the `@Input()` decorator:

{% highlight js %}
{% raw %}
@Component()
export class CustomCounterComponent {

  counterValue = 0;

  @Input()
  get counter() {
    return this.counterValue;
  }
  ...
}
{% endraw %}
{% endhighlight %}

This already enables us to bind expression to that property as a consumer of that component like this:

{% highlight html %}
{% raw %}
<custom-counter [counter]="someValue"></custom-counter>
{% endraw %}
{% endhighlight %}

The next thing we need to do, is to introduce an `@Output()` event with the same name, plus the `Change` suffix. We want to emit that event, whenever the value of the `counter` property changes. Let's add an `@Output()` property and emit the latest value in the setter interceptor:


{% highlight js %}
{% raw %}
@Component()
export class CustomCounterComponent {

  ...
  @Output() counterChange = new EventEmitter();

  set counter(val) {
    this.counterValue = val;
    this.counterChange.emit(this.counterValue);
  }
  ...
}
{% endraw %}
{% endhighlight %}

That's it! We can now bind an expression to that property using the two-way data binding syntax:

{% highlight html %}
{% raw %}
<custom-counter [(counter)]="someValue"></custom-counter>

<p>counterValue = {{someValue}}</p>
{% endraw %}
{% endhighlight %}

Check out the demo and try it out!

<iframe src="https://embed.plnkr.co/RtrRej/"></iframe>

Again, please keep in mind that a component like a custom counter, would better serve as a custom form control and takes advantage of `ngModel` to implement two-way data binding as explained in [this article](/angular/2016/07/27/custom-form-controls-in-angular-2.html).

## Conclusion

Angular 2 doesn't come with built-in two-way data binding anymore, but with APIs that allow to implement this type of binding using property and event bindings. `ngModel` comes as a built-in directive as part of the `FormsModule` to implement two-way data binding and should be preferred when building components that serve as custom form controls.
