---
layout:     post
title:      "Model-driven Forms in Angular 2"

date: 2016-06-22
imageUrl: "/images/banner/model-driven-forms-in-angular-2.jpeg"
relatedLinks:
  -
    title: "Custom Validators in Angular 2"
    url: "http://blog.thoughtram.io/angular/2016/03/14/custom-validators-in-angular-2.html"
  -
    title: "Template-driven Forms in Angular 2"
    url: "http://blog.thoughtram.io/angular/2016/03/21/template-driven-forms-in-angular-2.html"

summary: "Earlier this year we've talked about template-driven forms in Angular 2 and how they enable us to build sophisticated forms while writing as little JavaScript or TypeScript as possible. Another way to deal with forms is the model-driven approach and in this article we're going to discuss what that looks like."

categories:
  - angular
tags:
  - angular2

topic: forms

author: pascal_precht
---

Just a couple days ago, we've updated our article on [Template-driven Forms in Angular 2](/angular/2016/03/21/template-driven-forms-in-angular-2.html), as the APIs have changed for the better in the second release candidate. Meanwhile, RC3 is out and we think it's time to talk about **model-driven** and **reactive forms** on our blog. This article builds on top of the knowledge we've gained in our previous article, so you might want to take a look at it in case you haven't yet.

## The goal of model-driven forms

While template-driven forms in Angular 2 give us a way to create sophisticated forms while writing as little JavaScript as possible, model-driven forms enable us to test our forms without being required to rely on end-to-end tests. That's why model-driven forms are created imperatively, so they end up as actually properties on our components, which makes them easier to test.

In addition, it's important to understand that when building model-driven forms, Angular 2 doesn't magically create the templates for us. So it's not that we just create the form model and then all of a sudden we have DOM generated in our app that renders the form. Model-driven forms are more like an addition to template-driven forms, although, depending on what we're doing some things can be left out here and there (e.g. validators on DOM elements etc.).

## FormGroup and FormControl

Let's start off again with the same form we used in our previous article, a form to register a new user on a platform:

{% highlight html %}
{% raw %}
<form>
  <label>Firstname:</label>
  <input type="text">

  <label>Lastname:</label>
  <input type="text">

  <label>Street:</label>
  <input type="text">

  <label>Zip:</label>
  <input type="text">

  <label>City:</label>
  <input type="text">

  <button type="submit">Submit</button>
</form>
{% endraw %}
{% endhighlight %}

Nothing special going on here. We simply ask for a firstname, a lastname and some address information. Now, to make this form model-driven, what we need to do is to create a form model that represents that DOM structure in our component. One way to do that is to use the low level APIs for `FormGroup` and `FormControl`.

`FormGroup` always represents a set of `FormControl`s. In fact, a form is always a `FormGroup`. Let's create the corresponding form model for our template:

{% highlight js %}
{% raw %}
import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'my-app',
  ...
})
export class MyAppComponent {

  registerForm = new FormGroup({
    firstname: new FormControl(),
    lastname: new FormControl(),
    address: new FormGroup({
      street: new FormControl(),
      zip: new FormControl(),
      city: new FormControl()
    })
  });
}
{% endraw %}
{% endhighlight %}

Uff, that looks quite wordy! We'll fix that in a second but let's first discuss what happened. We created a component property `registerForm` which represents the `FormGroup`, which is our form. For each field in the form, we've created a `FormControl` and what we can't see here, is that a `FormControl` takes a string as first argument in case we want to prefill the form control with a default value. 

Another nice thing to notice is that `FormGroup`'s can be nested. `address` is also a collection of form controls, even though it doesn't show up in the DOM (yet). We'll see in a second why that is.

Okay, now that we've created our first form model, let's associate it to our template.

## Binding forms using formGroup, formGroupName and formControlName

Currently, there's nothing in our code that tells Angular that our form model is responsible for the form template. We need to associate the model to our form, and we can do that using the `formGroup` directive, which takes an expression that evaluates to a `FormGroup` instance.

In order to use that directive we need to import `REACTIVE_FORM_DIRECTIVES` and add then to our application's directives list:

{% highlight js %}
{% raw %}
import { REACTIVE_FORM_DIRECTIVES, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'my-app',
  ...
  directives: [REACTIVE_FORM_DIRECTIVES]
})
{% endraw %}
{% endhighlight %}

Now we can go ahead and use `formGroup` to connect the model with the form template:

{% highlight html %}
{% raw %}
<form [formGroup]="registerForm">
  ...
</form>
{% endraw %}
{% endhighlight %}

Great, the next thing we need to do is to associate the form controls to the model as well, because there's nothing that tells Angular "Hey these form controls here belong to your form control models!".

This is where the `formControlName` directive comes into play. It's pretty much the equivalent of an `ngModel` and `name` attribute combination in template-driven forms. Each form control gets a `formControlName` directive applied so we can register the controls on the outer form:

{% highlight html %}
{% raw %}
<form [formGroup]="registerForm">
  <label>Firstname:</label>
  <input type="text" formControlName="firstname">

  <label>Lastname:</label>
  <input type="text" formControlName="lastname">

  <label>Street:</label>
  <input type="text" formControlName="street">

  <label>Zip:</label>
  <input type="text" formControlName="zip">

  <label>City:</label>
  <input type="text" formControlName="city">

  <button type="submit">Submit</button>
</form>
{% endraw %}
{% endhighlight %}

And last but not least, since `address` is created as a `FormGroup` as well, we can associate a group of form controls to that model using `formGroupName`. However, we need a surrounding element for that, otherwise there's no place where we can apply that directive. Let's surround the address fields with a `<fieldset>` element and apply `formGroupName` there.

{% highlight html %}
{% raw %}
<fieldset formGroupName="address">
  <label>Street:</label>
  <input type="text" formControlName="street">

  <label>Zip:</label>
  <input type="text" formControlName="zip">

  <label>City:</label>
  <input type="text" formControlName="city">
</fieldset>
{% endraw %}
{% endhighlight %}

It's time to make our code a bit more readable and replace `FormGroup` and `FormControl` with `FormBuilder`.

## FormBuilder

As mentioned earlier, the creation of our form model looks quite wordy as we have to call `new FormGroup()` and `new FormControl` several times to construct the model. Luckily, we've used rather low level APIs and we can use a higher level API that makes this task a bit more pleasant.

`FormBuilder` is like a factory that creates `FormGroup`'s and `FormControl`'s for us. All we need to do is to import it and us its `.group()` method like this:

{% highlight js %}
{% raw %}
import { REACTIVE_FORM_DIRECTIVES, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'my-app',
  ...
  directives: [REACTIVE_FORM_DIRECTIVES]
})
export class MyAppComponent implements OnInit {

  registerForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      firstname: [],
      lastname: [],
      address: this.formBuilder.group({
        street: [],
        zip: [],
        city: []
      })
    });
  }
}
{% endraw %}
{% endhighlight %}

This looks way better! Let's recap really quick what happened:

- We imported `FormBuilder`
- We injected it into `MyAppComponent`
- We created the form model using `FormBuilder.group()` in `ngOnInit()` lifecycle
- We haven't done any changes on the template

## Adding Validators

Now that we have the form model set up, we can start adding validators to our form controls. There are different ways to add them, we can either add then as directives to the template or to the `FormControl` instance in our model.

Let's say we want to add a validators that makes sure that `firstname` and `lastname` is set. Angular comes with a `Validators` class that has some common validators built-in. We can import and apply them right away:

{% highlight js %}
{% raw %}
import { 
  REACTIVE_FORM_DIRECTIVES,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

...

ngOnInit() {
  this.registerForm = this.formBuilder.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    address: this.formBuilder.group({
      street: [],
      zip: [],
      city: []
    })
  });
}

{% endraw %}
{% endhighlight %}

A `FormControl` takes a value has first, a synchronous validator as second and an asynchronous validator as third parameter. We can also pass a collection of validators which causes Angular to compose them for us. And all we do here is applying a synchronous validator (`Validators.required`) to our form controls.

We can access the validity state of a form control like this:

{% highlight html %}
{% raw %}
<form [formGroup]="registerForm">
  <label>Firstname:</label>
  <input type="text" formControlName="firstname" #firstname="formControl">
  <p *ngIf="firstname.error">This field is required!</p>

  ...
</form>
{% endraw %}
{% endhighlight %}

We get a reference to the form control instance in a local variable `#firstname` and use that as an expression to access the form control's error object. If you're interested in learning how to build a custom validator, you might want to read our article on [Custom Validators in Angular 2](/angular/2016/03/14/custom-validators-in-angular-2.html).

## Forms with a single control

Sometimes, we don't need a `FormGroup`, as our form might only consist of a single form control. Think of a search field that let's you search for products in an e-commerce application. Technically, we don't even need a `<form>` element for that.

Angular comes with a directive `formControl` which doesn't have to be inside a `formGroup`. We can simply add it to a single form control and are ready to go:

{% highlight html %}
{% raw %}
<!-- no surrounding form -->
<input type="search" [formControl]="seachControl">
{% endraw %}
{% endhighlight %}

The cool thing about form controls in Angular is, that we can listen reactively for changes that are happening to that control. We'll talk about it in another article. Hopefully this one gave you a better idea of how model-driven and template-driven forms relate to each other.
