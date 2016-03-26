---
layout:     post
title:      "Template-driven Forms in Angular 2"

date: 2016-03-21
update_date: 2016-03-21
imageUrl: "/images/template-driven-forms.png"
relatedLinks:
  -
    title: "Custom Validators in Angular 2"
    url: "http://blog.thoughtram.io/angular/2016/03/14/custom-validators-in-angular-2.html"

summary: "Angular gives us many different tools to build forms in our applications. Sometimes it doesn't seem to be very obvious what's the right thing to use. This article discusses the template-driven approach of building forms and all the directives that come into play."

categories:
  - angular
tags:
  - angular2

topic: forms

author: pascal_precht
---

Angular comes with three different ways of building forms in our applications. There's the template-driven approach which allows us to build forms with very little to none application code required, then there's the model-driven approach using low level APIs, which makes our forms testable without a DOM being required, and last but not least, we can build our forms model-driven but with a higher level API called the `FormBuilder`.

Hearing all these different solutions, it's kind of natural that there are also probably many different tools to reach the goal. This can be sometimes confusing and with this article we want to clarify a subset of form directives by focussing on template-driven forms in Angular 2.

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

**Submitting a form and Accessing its value**

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

Running this code makes us realize, that the form's value is an empty object. This seems natural, because there's nothing in our component's template yet, that tells the form that the input controls are part of this form. We need a way to register them. This is where `ngControl` comes into play.

## `ngControl` Directive

In order to register form controls on an `ngForm` instance, we use the `ngControl` directive. `ngControl` simply takes a name as a string and creates a form control abstraction for us behind the scenes. Every form control that is registered with `ngControl` will automatically show up in `form.value` and can then easily be used for further post processing.

Let's give our form object some structure and register our form controls:

{% highlight html %}
{% raw %}
<form #form="ngForm" (ngSubmit)="logForm(form.value)">
  <label>Firstname:</label>
  <input type="text" ngControl="firstname">

  <label>Lastname:</label>
  <input type="text" ngControl="lastname">

  <label>Street:</label>
  <input type="text" ngControl="street">

  <label>Zip:</label>
  <input type="text" ngControl="zip">

  <label>City:</label>
  <input type="text" ngControl="city">

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

Isn't that cool? We can basically take this JSON object as it is and send it straight to a remote server for what ever we want to do with it. Oh wait, what if we actually want to have some more structure and make our form object look like this?

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

Do we now have to wire everything together by hand when the form is submitted? Nope! Angular has us covered - introducing `ngControlGroup`.

## `ngControlGroup` Directive

`ngControlGroup` enables us to semantically group our form controls. In other words, there can't be a control group without controls. In addition to that, it also tracks validity state of the inner form controls. This comes in very handy if we want to check the validity state of just a sub set of the form.

And if you now think: "Wait, isn't a form then also just a control group", then you're right my friend. A form is also just a control group.

Let's semantically group our form control values with `ngControlGroup`:

{% highlight html %}
{% raw %}
<fieldset ngControlGroup="name">
  <label>Firstname:</label>
  <input type="text" ngControl="firstname">

  <label>Lastname:</label>
  <input type="text" ngControl="lastname">
</fieldset>

<fieldset ngControlGroup="address">
  <label>Street:</label>
  <input type="text" ngControl="street">

  <label>Zip:</label>
  <input type="text" ngControl="zip">

  <label>City:</label>
  <input type="text" ngControl="city">
</fieldset>
{% endraw %}
{% endhighlight %}

As you can see, all we did was wrapping form controls in `<fieldset>` elements and applied `ngControlGroup` directives to them. There's no specific reason we used `<fieldset>` elements. We could've used `<div>`s too. The point is, that there has to be an element, where we add `ngControlGroup` so it will be registered at our `ngForm` instance.

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

Awesome! We now get the wanted object structure out of our form without writing any application code. You might wonder, what role `ngModel` plays in the world of forms in Angular 2. Good question!

## What about ngModel?

So `ngModel` is the thing in Angular 2 that implements two-way data binding. It's not the only thing that does that, but it's in most cases the directive we want to use for simple scenarios. How does `ngModel` apply to our template-driven form? Can we still use it? Of course we can!

Whereas `ngForm`, `ngControl` and `ngControlGroup` provide us a way to structure and access the raw form data, `ngModel` can still be used as a domain model to take advantage of two-way data binding. In other words, whereas `form.value` is the thing we want to send to a remote server, `ngModel` can be the object that feeds our form control, but can be used in other places in our component at the same time.

`ngControl` provides bindings for `ngModel`, so we can simply use it as expected:

{% highlight html %}
{% raw %}
<fieldset ngControlGroup="name">
  <label>Firstname:</label>
  <input type="text" ngControl="firstname" [(ngModel)]="firstname">
  <p>You entered {{firstname}}</p>

  <label>Lastname:</label>
  <input type="text" ngControl="lastname" [(ngModel)]="lastname">
  <p>You entered {{lastname}}</p>
</fieldset>
{% endraw %}
{% endhighlight %}

## More to cover

Of course, this is really just the tip of the ice berg when it comes to building forms. We haven't talked about validation yet and how to display error messages when the validity state of a form control or a control group changes. We will talk about these and other things in future articles. However, if you're interested in how to build a custom validator in Angular 2, checkout [this article](http://blog.thoughtram.io/angular/2016/03/14/custom-validators-in-angular-2.html).

Watch out for more articles on forms in Angular 2!
