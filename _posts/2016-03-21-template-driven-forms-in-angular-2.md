---
layout: post
title: Template-driven Forms in Angular 2
date: 2016-03-21T00:00:00.000Z
update_date: 2016-08-11T00:00:00.000Z
imageUrl: /images/template-driven-forms.jpeg
relatedLinks:
  - title: Custom Validators in Angular 2
    url: /angular/2016/03/14/custom-validators-in-angular-2.html
  - title: Reactive Forms in Angular 2
    url: /angular/2016/06/22/model-driven-forms-in-angular-2.html
summary: >-
  In this article we discuss the template-driven forms in Angular 2 and all the
  directives that come into play.
categories:
  - angular
tags:
  - angular2
  - forms
topic: forms
demos:
  - url: 'http://embed.plnkr.co/Xmgx1x/'
    title: Simple template-driven form
  - url: 'http://embed.plnkr.co/LLf7Il/'
    title: ngModelGroup Directive
  - url: 'http://embed.plnkr.co/XgRYoe/'
    title: ngModel with expressions
author: pascal_precht
related_posts:
  - Two-way Data Binding in Angular 2
  - Custom Form Controls in Angular 2
  - Reactive Forms in Angular 2
  - Custom Validators in Angular 2
  - Resolving route data in Angular 2
  - Angular 2 Animations - Foundation Concepts

---

Angular comes with three different ways of building forms in our applications. There's the template-driven approach which allows us to build forms with very little to none application code required, then there's the model-driven **or reactive** approach using low level APIs, which makes our forms testable without a DOM being required, and last but not least, we can build our forms model-driven but with a higher level API called the `FormBuilder`.

Hearing all these different solutions, it's kind of natural that there are also probably many different tools to reach the goal. This can be sometimes confusing and with this article we want to clarify a subset of form directives by focussing on template-driven forms in Angular 2.

{% include demos-and-videos-buttons.html post=page %}

## Activating new Form APIs

The form APIs have changed in RC2 and in order to not break all existing apps that have been built with RC1 and use forms, these **new APIs are added on top** of the existing ones. That means, we need to tell Angular explicitly which APIs we want to use (of course, this will go away in the final release).

In order to activate the new APIs we need to import Angular's `FormsModule` into our application module.

Here's what that could look like:

{% highlight js %}
{% raw %}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export AppModule {}
{% endraw %}
{% endhighlight %}

We then bootstrap our application module like this:

{% highlight js %}
{% raw %}
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule);
{% endraw %}
{% endhighlight %}


## `ngForm` Directive

Let's start off with a simple login form that asks for some user data:

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

We've probably all built one of those forms several times. A simple HTML form with input controls for a name and an address of a user. Nothing special going on here.

What we can't see here is that Angular comes with a directive `ngForm` that matches the `<form>` selector, so in fact, our form element already has an instance of `ngForm` applied. `ngForm` is there for a reason. It provides us information about the current state of the form including:

- A JSON representation of the form value
- Validity state of the entire form

**Accessing the `ngForm` instance**

Angular comes with a very convenient way of exposing directive instances in a component's template using the `exportAs` property of the directive metadata. For example, if we'd build a directive `draggable`, we could expose an instance to the template via the name `draggable` like so:

{% highlight ts %}
{% raw %}
@Directive({
  selector: '[draggable]',
  exportAs: 'draggable'
})
class Draggable {
  ...
}
{% endraw %}
{% endhighlight %}

And then, in the template where it's used, we can simply ask for it using Angular's local variable mechanism:

{% highlight ts %}
{% raw %}
<div draggable #myDraggable="draggable">I'm draggable!</div>
{% endraw %}
{% endhighlight %}

From this point on `myDraggable` is a reference to an instance of `Draggable` and we can use it throughout our entire template as part of other expressions.

You might wonder why that's interesting. Well, it turns out that `ngForm` directive is exposed as `ngForm`, which means we can get an instance of our form without writing any application code like this:

{% highlight html %}
{% raw %}
<form #form="ngForm">
  ...
</form>
{% endraw %}
{% endhighlight %}

### Submitting a form and Accessing its value

We can now use `form` to access the form's value and it's validity state. Let's log the value of the form when it's submitted. All we have to do is to add a handler to the form's `submit` event and pass it the form's value. In fact, there's a property on the `ngForm` instance called `value`, so this is what it'd look like:

{% highlight html %}
{% raw %}
<form #form="ngForm" (submit)="logForm(form.value)">
  ...
</form>
{% endraw %}
{% endhighlight %}

Even though this would work, it turns out that there's another output event `ngForm` fires when it's submitted. It's called `ngSubmit`, and it seems to be doing exactly the same as `submit` at a first glance. However, `ngSubmit` ensures that the form doesn't submit when the handler code throws (which is the default behaviour of `submit`) and causes an actual http post request. Let's use `ngSubmit` instead as this is the best practice:

{% highlight html %}
{% raw %}
<form #form="ngForm" (ngSubmit)="logForm(form.value)">
  ...
</form>
{% endraw %}
{% endhighlight %}

In addition, we might have a component that looks something like this:

{% highlight js %}
{% raw %}
@Component({
  selector: 'app',
  template: ...
})
class App {

  logForm(value: any) {
    console.log(value);
  }
}
{% endraw %}
{% endhighlight %}

Running this code makes us realize, that the form's value is an empty object. This seems natural, because there's nothing in our component's template yet, that tells the form that the input controls are part of this form. We need a way to register them. This is where `ngModel` comes into play.

## `ngModel` Directive

In order to register form controls on an `ngForm` instance, we use the `ngModel` directive. In combination with a `name` attribute, `ngModel` creates a form control abstraction for us behind the scenes. Every form control that is registered with `ngModel` will automatically show up in `form.value` and can then easily be used for further post processing.

Let's give our form object some structure and register our form controls:

{% highlight html %}
{% raw %}
<form #form="ngForm" (ngSubmit)="logForm(form.value)">
  <label>Firstname:</label>
  <input type="text" name="firstname" ngModel>

  <label>Lastname:</label>
  <input type="text" name="lastname" ngModel>

  <label>Street:</label>
  <input type="text" name="street" ngModel>

  <label>Zip:</label>
  <input type="text" name="zip" ngModel>

  <label>City:</label>
  <input type="text" name="city" ngModel>

  <button type="submit">Submit</button>
</form>
{% endraw %}
{% endhighlight %}

Great! If we now enter some values and submit the form, we'll see that our application will log something like this:

{% highlight json %}
{% raw %}
{
  firstname: 'Pascal',
  lastname: 'Precht',
  street: 'thoughtram Road',
  zip: '00011',
  city: 'San Francisco'
}
{% endraw %}
{% endhighlight %}

Isn't that cool? We can basically take this JSON object as it is and send it straight to a remote server for whatever we want to do with it. Oh wait, what if we actually want to have some more structure and make our form object look like this?

{% highlight json %}
{% raw %}
{
  name: {
    firstname: 'Pascal',
    lastname: 'Precht',
  },
  address: {
    street: 'thoughtram Road',
    zip: '00011',
    city: 'San Francisco'
  }
}
{% endraw %}
{% endhighlight %}

Do we now have to wire everything together by hand when the form is submitted? Nope! Angular has us covered - introducing `ngModelGroup`.

## `ngModelGroup` Directive

`ngModelGroup` enables us to semantically group our form controls. In other words, there can't be a control group without controls. In addition to that, it also tracks validity state of the inner form controls. This comes in very handy if we want to check the validity state of just a sub set of the form.

And if you now think: "Wait, isn't a form then also just a control group", then you're right my friend. A form is also just a control group.

Let's semantically group our form control values with `ngModelGroup`:

{% highlight html %}
{% raw %}
<fieldset ngModelGroup="name">
  <label>Firstname:</label>
  <input type="text" name="firstname" ngModel>

  <label>Lastname:</label>
  <input type="text" name="lastname" ngModel>
</fieldset>

<fieldset ngModelGroup="address">
  <label>Street:</label>
  <input type="text" name="street" ngModel>

  <label>Zip:</label>
  <input type="text" name="zip" ngModel>

  <label>City:</label>
  <input type="text" name="city" ngModel>
</fieldset>
{% endraw %}
{% endhighlight %}

As you can see, all we did was wrapping form controls in `<fieldset>` elements and applied `ngModelGroup` directives to them. There's no specific reason we used `<fieldset>` elements. We could've used `<div>`s too. The point is, that there has to be an element, where we add `ngModelGroup` so it will be registered at our `ngForm` instance.

We can see that it worked out by submitting the form and looking at the output:

{% highlight json %}
{% raw %}
{
  name: {
    firstname: 'Pascal',
    lastname: 'Precht',
  },
  address: {
    street: 'thoughtram Road',
    zip: '00011',
    city: 'San Francisco'
  }
}
{% endraw %}
{% endhighlight %}

Awesome! We now get the wanted object structure out of our form without writing any application code.

## What about ngModel with expressions?

So `ngModel` is the thing in Angular 2 that implements two-way data binding. It's not the only thing that does that, but it's in most cases the directive we want to use for simple scenarios. So far we've used `ngModel` as attribute directive without any value, but we might want to use it with an expression to bind an existing domain model to our form. This, of course works out of the box!

There are two ways to handle this, depending on what we want to do. One thing we can do is to apply property binding using the brackets syntax, so we can bind an existing value to a form control using one-way binding:

{% highlight html %}
{% raw %}
<fieldset ngModelGroup="name">
  <label>Firstname:</label>
  <input type="text" name="firstname" [ngModel]="firstname">

  <label>Lastname:</label>
  <input type="text" name="lastname" [ngModel]="lastname">
</fieldset>
{% endraw %}
{% endhighlight %}

Whereas the corresponding model could look something like this:

{% highlight js %}
{% raw %}
@Component({
  selector: 'app',
  template: ...
})
class App {

  firstname = 'Pascal';
  lastname = 'Precht';

  logForm(value: any) {
    console.log(value);
  }
}
{% endraw %}
{% endhighlight %}

In addition, we can of course use `ngModel` and two-way data binding, in case we want to reflect the model values somewhere else in our template:

{% highlight html %}
{% raw %}
<fieldset ngModelGroup="name">
  <label>Firstname:</label>
  <input type="text" name="firstname" [(ngModel)]="firstname">
  <p>You entered {{firstname}}</p>

  <label>Lastname:</label>
  <input type="text" name="lastname" [(ngModel)]="lastname">
  <p>You entered {{lastname}}</p>
</fieldset>
{% endraw %}
{% endhighlight %}

This just simply works as expected.

## More to cover

Of course, this is really just the tip of the ice berg when it comes to building forms. We haven't talked about validation yet and how to display error messages when the validity state of a form control or a control group changes. We will talk about these and other things in future articles. However, if you're interested in how to build a custom validator in Angular 2, checkout [this article](/angular/2016/03/14/custom-validators-in-angular-2.html).

Watch out for more articles on forms in Angular 2!
