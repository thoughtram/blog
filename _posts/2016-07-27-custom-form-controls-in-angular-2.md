---
layout:     post
title:      "Custom Form Controls in Angular 2"
imageUrl:   "/images/banner/custom-form-controls-in-angular-2.jpg"

date: 2016-07-27
update_date: 2016-08-11

summary: "Angular makes it very easy to create custom form controls. Read on to learn how to do it!"

categories:
  - angular

tags:
  - angular2

topic: forms

demos:
  -
   url: http://embed.plnkr.co/035BWnCCvSuchgpO1b9Z/
   title: Custom number input control

author: pascal_precht
---

There are many things that Angular helps us out with when creating forms. We've covered several topics on [Forms in Angular 2](/forms-in-angular-2), like model-driven forms and template-driven forms. If you haven't read those articles yet, we highly recommend you to do so as this one is based on them. [Almero Steyn](http://twitter.com/kryptos_rsa), one of our training students, who later on contributed to the official documentation as part of the Docs Authoring Team for Angular 2, has also written a very nice [introduction](http://almerosteyn.com/2016/04/linkup-custom-control-to-ngcontrol-ngmodel) to creating custom controls.

His article inspired us and we would like to take it a step further and explore how to create custom form controls that integrate nicely with Angular's form APIs.

{% include demos-and-videos-buttons.html post=page %}

<h2 id="things-to-consider">Custom form control considerations</h2>

Before we get started and build our own custom form control, we want to make sure that we have an idea of the things come into play when creating custom form controls. 

First of all, it's important to realise that we shouldn't just create custom form controls right away, if there's a native element (like `<input type="number">`) that perfectly takes care of the job. It seems native form elements are often underestimated in what they are capable of. While we often just see a text box that we can type into, it does way more work for us. **Every native form element is accessible**, some inputs have built-in validation and some even provide an improved user experience on different platforms (e.g. mobile browsers).

So whenever we think of creating a custom form control we should ask ourselves:

- Is there a native element that has the same semantics?
- If yes, can we simply rely on that element and use CSS and/or progressive enhancement to change its appearance/behaviour to our needs?
- If not, what will the custom control look like?
- How can we make it accessible?
- Does it behave differently on different platforms?
- How does it validate?

There are probably more things to consider, but these are the most important ones. If we do decide to create a custom form control (in Angular 2), we should make sure that:

- It properly propagates changes to the DOM/View
- It properly propagates changes to the Model
- It comes with custom validation if needed
- It adds validity state to the DOM so it can be styled
- **It's accessible**
- It works with template-driven forms
- It works with model-driven forms
- It needs to be responsive

We will discuss different scenarios through out this article to demonstrate how these things can be implemented. **We will not cover accessibility in this article** though, as there'll be follow-up articles to talk about that in-depth.

<h2 id="creating-a-custom-counter">Creating a custom counter</h2>

Let's start off with a rather simple counter component. The idea is to have a component that lets us increment and decrement a model value. And yes, if we think about the [things to consider](#things-to-consider), we probably realise that an `<input type="number">` would do the trick.

However, in this article we want to demonstrate how to implement a custom form control and a custom counter component seems trivial enough to make things look not too complicated. In addition, our counter component will have a different appearance that should work the same across all browsers, which is where we might reach the boundaries of a native input element anyways.

We start off with the raw component. All we need is a model value that can be changed and two buttons that cause the change.

{% highlight js %}
{% raw %}
import { Component, Input } from '@angular/core';

@Component({
  selector: 'counter-input',
  template: `
    <button (click)="increment()">+</button>
    {{counterValue}}
    <button (click)="decrement()">-</button>
  `
})
class CounterInputComponent {

  @Input()
  counterValue = 0;

  increment() {
    this.counterValue++;
  }

  decrement() {
    this.counterValue--;
  }
}
{% endraw %}
{% endhighlight %}

Nothing special going on here. `CounterInputComponent` has a model `counterValue` that is interpolated in its template and can be incremented or decremented by the `increment()` and `decrement()` methods respectively. This component works perfectly fine, we can already use it once declared on our application module, as it is by putting it into another component like this:

**app.module.ts**

{% highlight js %}
{% raw %}
@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent, CounterInputComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

**app.component.ts**
{% highlight js %}
{% raw %}
import { Component } from '@angular/core';

@Component({
  selector: 'app-component',
  template: `
    <counter-input></counter-input>
  `,
})
class AppComponent {}
{% endraw %}
{% endhighlight %}

Okay cool, but now we want to make it work with Angular's form APIs. Ideally, what we end up with is a custom control that works with template-driven forms and reactive/model-driven forms. For example, in the most simple scenario, we should be able to create a template-driven form like this:

{% highlight html %}
{% raw %}
<!-- this doesn't work YET -->
<form #form="ngForm" (ngSubmit)="submit(form.value)">
  <counter-input name="counter" ngModel></counter-input>
  <button type="submit">Submit</button>
</form>
{% endraw %}
{% endhighlight %}

If that syntax is new to you, check out our article on [Template-Driven forms in Angular 2](/angular/2016/03/21/template-driven-forms-in-angular-2.html). Okay but how do we get there? We need to learn what a `ControlValueAccessor` is, because that's the thing that Angular uses to build a bridge between a form model and a DOM element.

<h2 id="understanding-control-value-accessors">Understanding ControlValueAccessor</h2>

While our counter component works, there's currently no way we can connect it to an outer form. In fact, if we try to bind any kind of form model to our custom control, we'll get an error that there's a missing `ControlValueAccessor`. And that's exactly what we need to enable proper integration with forms in Angular.

So, what is a `ControlValueAccessor`? Well, remember the things we talked about earlier that are needed to implement a custom form control? One of the things we need to make sure is that changes are propagated from the model to the view/DOM, and also from the view, back to the model. **This is what a `ControlValueAccessor` is for.**

A `ControlValueAccessor` is an interface that takes care of:

- Writing a value from the form model into the view/DOM
- Informing other form directives and controls when the view/DOM changes

The reason why Angular has such an interface, is because the way how DOM elements need to be updated can vary across input types. For example, a normal text input has a `value` property that needs to be written to, whereas a checkbox comes with a `checked` property that needs to be updated. If we take a look under the hood, we realise that **there's a `ControlValueAccessor` for every input type**  which knows how to update its view/DOM.

There's the `DefaultValueAccessor` that takes care of text inputs and textareas, the `SelectControlValueAccessor` that handles select inputs, or the `CheckboxControlValueAccessor`, which, surprise, deals with checkboxes, and many more.

Our counter component needs a `ControlValueAccessor` that knows how to update the `counterValue` model and inform the outside world about changes too. As soon as we implement that interface, it'll be able to talk to Angular forms.

<h2 id="implementing-control-value-accessor">Implementing ControlValueAccessor</h2>

The `ControlValueAccessor` interface looks like this:

{% highlight js %}
{% raw %}
export interface ControlValueAccessor {
  writeValue(obj: any) : void
  registerOnChange(fn: any) : void
  registerOnTouched(fn: any) : void
}
{% endraw %}
{% endhighlight %}

**writeValue(obj: any)** is the method that writes a new value from the form model into the view or (if needed) DOM property. This is where we want to update our `counterValue` model, as that's the thing that is used in the view.

**registerOnChange(fn: any)** is a method that registers a handler that should be called when something in the view has changed. It gets a function that tells other form directives and form controls to update their values. In other words, that's the handler function we want to call whenever `counterValue` changes through the view.

**registerOnTouched(fn: any)** Similiar to `registerOnChange()`, this registers a handler specifically for when a control receives a touch event. We don't need that in our custom control.

A `ControlValueAccessor` needs access to its control's view and model, which means, the custom form control itself has to implement that interface. Let's start with `writeValue()`. First we import the interface and update the class signature.

{% highlight js %}
{% raw %}
import { ControlValueAccessor } from '@angular/forms';

@Component(...)
class CounterInputComponent implements ControlValueAccessor {
  ...
}
{% endraw %}
{% endhighlight %}

Next, we implement `writeValue()`. As mentioned earlier, it takes a new value from the form model and writes it into the view. In our case, all we need is updating the `counterValue` property, as it's interpolated automatically.

{% highlight js %}
{% raw %}
@Component(...)
class CounterInputComponent implements ControlValueAccessor {
  ...
  writeValue(value: any) {
    this.counterValue = value;
  }
}
{% endraw %}
{% endhighlight %}

This method gets called when the form is initialized, with the form model's initial value. This means it will override the default value `0`, which is fine but if we think about the simple form setup we talked about earlier, we realise that there is no initial value in the form model:

{% highlight js %}
{% raw %}
<counter-input name="counter" ngModel></counter-input>
{% endraw %}
{% endhighlight %}

This will cause our component to render an empty string. As a quick fix, we only set the value when it's not undefined:

{% highlight js %}
{% raw %}
writeValue(value: any) {
  if (value !== undefined) {
    this.counterValue = value;
  }
}
{% endraw %}
{% endhighlight %}

Now, it only overrides the default when there's an actual value written to the control. Next, we implement `registerOnChange()` and `registerOnTouched()`. `registerOnChange()` has access to a function that informs the outside world about changes. Here's where we can do special work, whenever we propagate the change, if we wanted to. `registerOnTouched()` registers a callback that is excuted whenever a form control is "touched". E.g. when an input element blurs, it fire the touch event. We don't want to do anything at this event, so we can implement the interface with an empty function.

{% highlight js %}
{% raw %}
@Component(...)
class CounterInputComponent implements ControlValueAccessor {
  ...
  propagateChange = (_: any) => {};

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched() {}
}
{% endraw %}
{% endhighlight %}

Great, our counter input now implements the `ControlValueAccessor` interface. The next thing we need to do is to call `propagateChange()` with the value whenever `counterValue` changes through the view. In other words, if either the `increment()` or `decrement()` button is clicked, we want to propagate the new value to the outside world.

Let's update these methods accordingly.

{% highlight js %}
{% raw %}
@Component(...)
class CounterInputComponent implements ControlValueAccessor {
  ...
  increment() {
    this.counterValue++;
    this.propagateChange(this.counterValue);
  }

  decrement() {
    this.counterValue--;
    this.propagateChange(this.counterValue);
  }
}
{% endraw %}
{% endhighlight %}

We can make this code a little better using property mutators. Both methods, `increment()` and `decrement()`, call `propagateChange()` whenever `counterValue` changes. Let's use getters and setters to get rid off the redudant code:


{% highlight js %}
{% raw %}
@Component(...)
class CounterInputComponent implements ControlValueAccessor {
  ...
  @Input()
  _counterValue = 0; // notice the '_'

  get counterValue() {
    return this._counterValue;
  }

  set counterValue(val) {
    this._counterValue = val;
    this.propagateChange(this._counterValue);
  }

  increment() {
    this.counterValue++;
  }

  decrement() {
    this.counterValue--;
  }
}
{% endraw %}
{% endhighlight %}


`CounterInputComponent` is almost ready for prime-time. Even though it implements the `ControlValueAccessor` interface, there's nothing that tells Angular that it should be considered as such. We need to register it.

<h2 id="registering-the-control-value-accessor">Registering the ControlValueAccessor</h2>

Implementing the interface is only half of the story. As we know, interfaces don't exist in ES5, which means once the code is transpiled, that information is gone. So after all, it happens that our component implements the interface, but we still need to make Angular pick it up as such.

In our article on [multi-providers in Angular 2](/angular2/2015/11/23/multi-providers-in-angular-2.html) we learned that there are some DI tokens that Angular uses to inject multiple values, to do certain things with them. For example there's the `NG_VALIDATORS` token that gives Angular all registered validators on a form control, and we can add our own validators to it.

In order to get hold of a `ControlValueAccessor` for a form control, Angular internaly injects all values that are registered on the `NG_VALUE_ACCESSOR` token. So all we need to do is to extend the multi-provider for `NG_VALUE_ACCESSOR` with our own value accessor instance (which is our component).

Let's do that right away:

{% highlight js %}
{% raw %}
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  ...
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CounterInputComponent),
      multi: true
    }
  ]
})
class CounterInputComponent {
  ...
}
{% endraw %}
{% endhighlight %}

If this code doesn't make any sense to you, you should definitely check out our article on [multi-providers in Angular 2](/angular2/2015/11/23/multi-providers-in-angular-2.html), but the bottom line is, that we're adding our custom value accessor to the DI system so Angular can get an instance of it. We also have to use `useExisting` because `CounterInputComponent` will be already created as a directive dependency in the component that uses it. If we don't do that, we get a new instance as this is how DI in Angular works. The `forwardRef()` call is explained in [this article](/angular/2015/09/03/forward-references-in-angular-2.html).

Awesome, our custom form control is now ready to be used!

<h2 id="using-it-insde-template-driven-forms">Using it inside template-driven forms</h2>

We've already seen that the counter component works as intended, but now we want to put it inside an actual form and make sure it works in all common scenarios.

<h3 id="activating-form-apis">Activating form APIs</h3>

As discussed in our article on [template-driven forms in Angular 2](/angular/2016/03/21/template-driven-forms-in-angular-2.html#activating-new-form-apis), we need to activate the form APIs like this:

{% highlight js %}
{% raw %}
import { FormsModule} from '@angular/forms';

@NgModule({
  imports: [BrowserModule, FormsModule], // we're add FormsModule here
  ...
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

<h3 id="without-model-initialization">Without model initialization</h3>

That's pretty much it! Remember our `AppComponent` from ealier? Let's create a template-driven form in it and see if it works. Here's an example that uses the counter control without initializing it with a value (it will use its own internal default value which is `0`):

{% highlight js %}
{% raw %}
@Component({
  selector: 'app-component',
  template: `
    <form #form="ngForm">
      <counter-input name="counter" ngModel></counter-input>
    </form>

    <pre>{{ form.value | json }}</pre>
  `
})
class AppComponent {}
{% endraw %}
{% endhighlight %}

> **Special Tip:** Using the json pipe is a great trick to debug a form's value.

`form.value` returns the values of all form controls mapped to their names in a JSON structure. That's why `JsonPipe` will out put an object literal with a `counter` field of the value that the counter has.

<h3 id="model-initialization-with-property-binding">Model initialization with property binding</h3>

Here's another example that binds a value to the custom control using property binding:

{% highlight js %}
{% raw %}
@Component({
  selector: 'app-component',
  template: `
    <form #form="ngForm">
      <counter-input name="counter" [ngModel]="outerCounterValue"></counter-input>
    </form>

    <pre>{{ form.value | json }}</pre>
  `
})
class AppComponent {
  outerCounterValue = 5;  
}
{% endraw %}
{% endhighlight %}

<h3 id="two-way-data-binding-with-ngmodel-template-driven">Two-way data binding with ngModel</h3>

And of course, we can take advantage of `ngModel`'s two-way data binding implementation simply by changing the syntax to this:

{% highlight html %}
{% raw %}
<p>ngModel value: {{outerCounterValue}}</p>
<counter-input name="counter" [(ngModel)]="outerCounterValue"></counter-input>
{% endraw %}
{% endhighlight %}

How cool is that? Our custom form control works seamlessly with the template-driven forms APIs! Let's see what that looks like when using model-driven forms.

<h2 id="using-it-inside-model-driven-forms">Using it inside model-driven forms</h2>

The following examples use Angular's reactive form directives, so don't forget to add `ReactiveFormsModule` to `AppModule` as discussed in [this article](/angular/2016/06/22/model-driven-forms-in-angular-2.html).

<h3 id="binding-value-via-formcontrolname">Binding value via formControlName</h3>

Once we've set up a `FormGroup` that represents our form model, we can bind it to a form element and associate each control using `formControlName`. This example binds a value to our custom form control from a form model:

{% highlight js %}
{% raw %}
@Component({
  selector: 'app-component',
  template: `
    <form [formGroup]="form">
      <counter-input formControlName="counter"></counter-input>
    </form>

    <pre>{{ form.value | json }}</pre>
  `
})
class AppComponent implements OnInit {

  form: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      counter: 5
    });
  }
}
{% endraw %}
{% endhighlight %}

<h2 id="adding-custom-validation">Adding custom validation</h2>

One last thing we want to take a look at is how we can add validation to our custom control. In fact, we've already written an article on [custom validators in Angular 2](/angular/2016/03/14/custom-validators-in-angular-2.html) and everything we need to know is written down there. However, to make things more clear we'll add a custom validator to our custom form control by example.

Let's say we want to teach our control to become invalid when its `counterValue` is greater than `10` or smaller than `0`. Here's what it could look like:

{% highlight js %}
{% raw %}
import { NG_VALIDATORS, FormControl } from '@angular/forms';

@Component({
  ...
  providers: [
    { 
      provide: NG_VALIDATORS,
      useValue: (c: FormControl) => {
        let err = {
          rangeError: {
            given: c.value,
            max: 10,
            min: 0
          }
        };

        return (c.value > 10 || c.value < 0) ? err : null;
      },
      multi: true
    }
  ]
})
class CounterInputComponent implements ControlValueAccessor {
  ...
}
{% endraw %}
{% endhighlight %}

We register a validator function that returns `null` if the control value is valid, or an error object when it's not. This already works great, we can display an error message accordingly like this:

{% highlight js %}
{% raw %}
<form [formGroup]="form">
  <counter-input
    formControlName="counter"
    ></counter-input>
</form>

<p *ngIf="!form.valid">Counter is invalid!</p>
<pre>{{ form.value | json }}</pre>
{% endraw %}
{% endhighlight %}

<h2 id="making-the-validator-testable">Making the validator testable</h2>

We can do a little bit better though. When using model-driven forms, we might want to test the component that has the form without the DOM. In that case, the validator wouldn't exist, as it's provided by the counter input component. This can be easily fixed by extracting the validator function into its own declaration and exporting it, so other modules can import it when needed.

Let's change our code to this:

{% highlight js %}
{% raw %}
export function validateCounterRange(c: FormControl) {
  let err = {
    rangeError: {
      given: c.value,
      max: 10,
      min: 0
    }
  };

  return (c.value > 10 || c.value < 0) ? err : null;
}

@Component({
  ...
  providers: [
    { 
      provide: NG_VALIDATORS,
      useValue: validateCounterRange,
      multi: true
    }
  ]
})
class CounterInputComponent implements ControlValueAccessor {
  ...
}
{% endraw %}
{% endhighlight %}

>> **Special Tip:** To make validator functions available to other modules when building reactive forms, it's good practice to declare them first and reference them in the provider configuration.

Now, the validator can be imported and added to our form model like this:

{% highlight js %}
{% raw %}
import { validateCounterRange } from './counter-input';

@Component(...)
class AppComponent implements OnInit {
  ...
  ngOnInit() {
    this.form = this.fb.group({
      counter: [5, validateCounterRange]
    });
  }
}
{% endraw %}
{% endhighlight %}

This custom control is getting better and better, but wouldn't it be **really** cool if the validator was configurable, so that the consumer of the custom form control can decide what the max and min range values are?

<h2 id="making-the-validation-configurable">Making the validation configurable</h2>

Ideally, the consumer of our custom control should be able to do something like this:

{% highlight html %}
{% raw %}
<counter-input
  formControlName="counter"
  counterRangeMax="10"
  counterRangeMin="0"
  ></counter-input>
{% endraw %}
{% endhighlight %}

Thanks to Angular's dependency injection and property binding system, this is very easy to implement. Basically what we want to do is to teach our [validator to have dependencies](/angular/2016/03/14/custom-validators-in-angular-2.html#custom-validators-with-dependencies).

Let's start off by adding the input properties.

{% highlight js %}
{% raw %}
import { Input } from '@angular/core';
...

@Component(...)
class CounterInputComponent implements ControlValueAccessor {
  ...
  @Input()
  counterRangeMax;

  @Input()
  counterRangeMin;
  ...
}
{% endraw %}
{% endhighlight %}

Next, we somehow have to pass these values to our `validateCounterRange(c: FormControl)`, but per API it only asks for a `FormControl`. That means we need to create that validator function using a factory that creates a closure like this:

{% highlight js %}
{% raw %}
export function createCounterRangeValidator(maxValue, minValue) {
  return function validateCounterRange(c: FormControl) {
    let err = {
      rangeError: {
        given: c.value,
        max: maxValue,
        min: minValue
      }
    };

    return (c.value > +maxValue || c.value < +minValue) ? err: null;
  }
}
{% endraw %}
{% endhighlight %}

Great, we can now create the validator function with the dynamic values we get from the input properties inside our component, and implement a `validate()` method that Angular will use to perform validation:

{% highlight js %}
{% raw %}
import { Input, OnInit } from '@angular/core';
...

@Component(...)
class CounterInputComponent implements ControlValueAccessor, OnInit {
  ...

  validateFn:Function;

  ngOnInit() {
    this.validateFn = createCounterRangeValidator(this.counterRangeMax, this.counterRangeMin);
  }

  validate(c: FormControl) {
    return this.validateFn(c);
  }
}
{% endraw %}
{% endhighlight %}

This works but introduces a new problem: `validateFn` is only set in `ngOnInit()`. What if `counterRangeMax` or `counterRangeMin` change via their bindings? We need to create a new validator function based on these changes. Luckily there's the `ngOnChanges()` lifecycle hook that, allows us to do exactly that. All we have to do is to check if there are changes on one of the input properties and recreate our validator function. We can even get rid off `ngOnInit()` again, because `ngOnChanges()` is called before `ngOnInit()` anyways:


{% highlight js %}
{% raw %}
import { Input, OnChanges } from '@angular/core';
...

@Component(...)
class CounterInputComponent implements ControlValueAccessor, OnChanges {
  ...

  validateFn:Function;

  ngOnChanges(changes) {
    if (changes.counterRangeMin || changes.counterRangeMax) {
      this.validateFn = createCounterRangeValidator(this.counterRangeMax, this.counterRangeMin);
    }
  }
  ...
}
{% endraw %}
{% endhighlight %}


Last but not least, we need to update the provider for the validator, as it's now no longer just the function, but the component itself that performs validation:

{% highlight js %}
{% raw %}
@Component({
  ...
  providers: [
    ...
    { 
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CounterInputComponent),
      multi: true
    }
  ]
})
class CounterInputComponent implements ControlValueAccessor, OnInit {
  ...
}
{% endraw %}
{% endhighlight %}

Believe it or not, we can now configure the max and min values for our custom form control! If we're building template-driven forms, it simply looks like this:

{% highlight html %}
{% raw %}
<counter-input
  ngModel
  name="counter"
  counterRangeMax="10"
  counterRangeMin="0"
  ></counter-input>
{% endraw %}
{% endhighlight %}

This works also with expressions:

{% highlight html %}
{% raw %}
<counter-input
  ngModel
  name="counter"
  [counterRangeMax]="maxValue"
  [counterRangeMin]="minValue"
  ></counter-input>
{% endraw %}
{% endhighlight %}

If we're building model-driven forms, we can simply use the validator factory to add the validator to the form control like this:

{% highlight js %}
{% raw %}
import { createCounterRangeValidator } from './counter-input';

@Component(...)
class AppComponent implements OnInit {
  ...
  ngOnInit() {
    this.form = this.fb.group({
      counter: [5, createCounterRangeValidator(10, 0)]
    });
  }
}
{% endraw %}
{% endhighlight %}

Check out the demos below!
