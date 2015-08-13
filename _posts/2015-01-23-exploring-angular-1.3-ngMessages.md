---
layout:     post
title:      "Exploring Angular 1.3: ngMessages"
relatedLinks:
  -
    title: "ngMessages revisited"
    url: "http://blog.thoughtram.io/2015/06/06/ng-messages-revisited.html"
  -
    title: "Exploring Angular 1.3: One-time bindings"
    url: "http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html"
  -
    title: "Exploring Angular 1.3: ng-model-options"
    url: "http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html"
  -
    title: "Exploring Angular 1.3: Angular-hint"
    url: "http://blog.thoughtram.io/angularjs/2014/11/06/exploring-angular-1.3-angular-hint.html"
  -
    title: "Exploring Angular 1.3: Stateful Filters"
    url: "http://blog.thoughtram.io/angularjs/2014/11/19/exploring-angular-1.3-stateful-filters.html"
  -
    title: "Exploring Angular 1.3: ES6 Style Promises"
    url: "http://blog.thoughtram.io/angularjs/2014/12/18/exploring-angular-1.3-es6-style-promises.html"
  -
    title: "Exploring Angular 1.3: Disabling Debug Info"
    url: "http://blog.thoughtram.io/angularjs/2014/12/22/exploring-angular-1.3-disabling-debug-info.html"
  -
    title: "Exploring Angular 1.3: Binding to Directive Controllers"
    url: "http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html"
  -
    title: "Exploring Angular 1.3: Validators Pipeline"
    url: "http://blog.thoughtram.io/angularjs/2015/01/11/exploring-angular-1.3-validators-pipeline.html"
  -
    title: "Exploring Angular 1.3: Go fast with $applyAsync"
    url: "http://blog.thoughtram.io/angularjs/2015/01/14/exploring-angular-1.3-speed-up-with-applyAsync.html"
date:       2015-01-23
update_date: 2015-08-13
summary:    "Our blog series on Angular 1.3 already covers tons of information about the latest bigger release of the framework. Some of the articles cover form related improvements in features like the newly introduced validators pipeline. However, there's another bigger feature that the 1.3 release brings to the table, which is the ngMessages module. In this article we're going to discuss what it does and how it improves the way we handle validation messages when dealing with forms."

isExploringAngular13Article: true

categories: 
- angularjs

tags:
  - angular

author: pascal_precht
---

In one of our articles of our blog series on exploring Angular 1.3, we've covered a very nice feature that makes validating forms in Angular a breeze. Right, I'm talking about the [validators pipeline](http://blog.thoughtram.io/angularjs/2015/01/11/exploring-angular-1.3-validators-pipeline.html).

While the validators pipeline seems to make our life a lot easier and we as developers think it can't get any better, it turns out there's another bigger feature that adds even more awesomeness to the world of forms when building Angular applications: **ngMessages**.

[ngMessages](https://docs.angularjs.org/api/ngMessages) is an entire new module that comes with a couple of directives to enhance the support for displaying messages within templates. Which means, even if in this article we're using it just for forms, we're not restricted to do so. But let's start right away and take a look at a scenario that `ngMessages` tries to solve.

## Displaying messages in forms - The old way

Providing a good user experience is always important. When building forms, it's pretty common to display messages to the user depending on the data that the user entered into the form fields. This, for example, could be a message that tells the user that a specific field is required to be filled out, or a message that says that the given data doesn't match a certain pattern.

We've already learned about the [validators pipeline](http://blog.thoughtram.io/angularjs/2015/01/11/exploring-angular-1.3-validators-pipeline.html) that lets us easily determine if the value of a form field is valid or not. Each state of an input element is exposed on the associated scope of a form (as long as a `name` attribute is applied), which makes it super easy to conditionally display DOM elements that have (validation) messages.

Let's say we want to build a common login form where the user needs to enter an email address and a password, like this:

{% highlight html %}
{% raw %}
<form name="loginForm">
  <label>Email:</label>
  <input type="email" ng-model="email" name="email">

  <label>Password:</label>
  <input type="password" ng-model="password" name="password">
</form>
{% endraw %}
{% endhighlight %}

Notice the `name` attributes on the `<form>` and `<input>` elements. These make sure the form's `FormController` instance, that holds the state of the form, is exposed on the scope. Giving the `<input>` elements names exposes _their_ state on the `FormController`. In other words, `loginForm` is now an actual expressions on the scope that we can use to evaluate data in our template.

We also specify the `type` of each `<input>` which adds some default validations to the fields behind the scenes. In fact, we can visualize the form's state by adding the following expression to our document:

{% highlight html %}
{% raw %}
{{ loginForm | json }}
{% endraw %}
{% endhighlight %}

While entering an email address, Angular automatically validates the data given to the field and exposes the state to `loginForm`. That means, as long as we're entering data which isn't valid, the `$error` property of `loginForm` gets extended with a new object `email` that has all information about the state of the field.

{% highlight json %}
{% raw %}
{
  "$error": {
    "email": [
      {
        "$viewValue": "invalid value",
        "$validators": {},
        "$asyncValidators": {},
        "$parsers": [],
        "$formatters": [
          null
        ],
        "$viewChangeListeners": [],
        "$untouched": false,
        "$touched": true,
        "$pristine": false,
        "$dirty": true,
        "$valid": false,
        "$invalid": true,
        "$error": {
          "email": true
        },
        "$name": "email",
        "$options": null
      }
    ]
  },
  ...
}
{% endraw %}
{% endhighlight %}

In addition to that, due to adding `name` attributes to the field itself, there's also an `email` and `password` property on `loginForm` which have an `$error` object themselves. The `$error` object on form fields is a simple key/value store that represents the error state for each applied validator on a field.

{% highlight json %}
{% raw %}
{
  ...
  "email": {
    ...
    "$error": {
      "email": true
    },
    ...
  }
}
{% endraw %}
{% endhighlight %}

So, in order to display a message when there's an error with the default email validation (which we get automatically by specifying the `type`), all we need to do is to conditionally add a DOM node to the document like this:

{% highlight html %}
{% raw %}
<p ng-if="loginForm.email.$error.email">
  Please enter a valid email
</p>
{% endraw %}
{% endhighlight %}

Again, `loginForm.email` is the field reference, `$error.email` is the result of the `email` validation. To make it more clear, we can extend the example by adding a `required` attribute to the field, which also adds a validator to the field behind the scenes.

{% highlight html %}
{% raw %}
<input type="email" ng-model="email" name="email" required>
{% endraw %}
{% endhighlight %}

Displaying an error message accordingly could look like this:

{% highlight html %}
{% raw %}
<p ng-if="loginForm.email.$error.required">
  Please enter your email
</p>
{% endraw %}
{% endhighlight %}

I think we get the idea. Now imagine instead of just two different validations, we have five validations for just one field and we want to display a message for each. The markup for our form gets out of control very quickly. Here's how our `password` field could be extended with conditional messages.

{% highlight html %}
{% raw %}
<label>Password:</label>
<input 
  name="password"
  ng-model="password"
  type="password"
  required
  minlength="8"
  pattern="..."
  validator4
  validator5
>
<p ng-if="loginForm.email.$error.required">...
<p ng-if="loginForm.email.$error.minlength">...
<p ng-if="loginForm.email.$error.pattern">...
<p ng-if="loginForm.email.$error.validator4">...
<p ng-if="loginForm.email.$error.validator5">...
{% endraw %}
{% endhighlight %}

We probably also want to control what message shows up when, especially when multiple messages occur at the same time. Try to build that with just `ngIf` directives all over the place. And this is where `ngMessages` comes into play.

## Displaying messages in forms with `ngMessages`

`ngMessages` comes as a separate module. In order to use it, we first need to install it. One way to do so is to use npm:

{% highlight sh %}
$ npm install angular-messages
{% endhighlight %}

Then, we need to embed the actual script in our document:

{% highlight html %}
<script src="path/to/angular-messages.js"></script>
{% endhighlight %}

Once done, we declare `ngMessages` as module dependency of our app and we are ready to go.

{% highlight html %}
{% raw %}
angular.module('myApp', ['ngMessages']);
{% endraw %}
{% endhighlight %}

Alright. The module is now installed and ready to be used. Let's take a look at what our login form would look when `ngMessages` is used. The module comes with two directives - `ngMessages` and `ngMessage`.

Whereas `ngMessages` directive gets an expression that evaluates to an object where each member can control if a certain message is displayed or not, `ngMessage` directive is in charge of displaying that particular message.

Things are a bit easier to understand when actual code is shown, so here's what our DOM looks like when `ngMessages` is used:

{% highlight html %}
{% raw %}
<div ng-messages="loginForm.password.$error">
  <p ng-message="required">...</p>
  <p ng-message="minlength">...</p>
  <p ng-message="pattern">...</p>
  <p ng-message="validator4">...</p>
  <p ng-message="validator5">...</p>
</div>
{% endraw %}
{% endhighlight %}

We have an element where `ngMessages` directive is applied. As mentioned earlier, `ngMessages` gets an expression that evaluates to an object where each member is either `true` or `false`. This fits perfectly to what `FormController` exposes on the scope, when fields have validations errors and a `name` attribute applied.

With `ngMessage` directive, we can just conditionally display messages by providing it with a name of a validator that is applied to the corresponding form field. Now, whenever a validator declares the value of the password field invalid, it displays the message that belongs to it.

In case we don't want to pollute our DOM with additional elements, just to apply the directives, `ngMessages` and `ngMessage` are not restricted to attributes. We can also use them as elements. In that case, `for` and `when` attributes are needed to pass expressions accordingly.

{% highlight html %}
{% raw %}
<ng-messages for="loginForm.password.$error">
  <ng-message when="required">...</ng-message>
  <ng-message when="minlength">...</ng-message>
  <ng-message when="pattern">...</ng-message>
  <ng-message when="validator4">...</ng-message>
  <ng-message when="validator5">...</ng-message>
</ng-messages>
{% endraw %}
{% endhighlight %}

Taking a closer look at this code snippet, you might think this is a very familiar construct. Right. It looks pretty much like using `ngSwitch` and `ngSwitchWhen` directives. In fact, it **is** almost the same.

So what is the difference and why do we want to use one version over the other? Well, it turns out `ngMessages` is much more powerful.

## Prioritization and multiple messages

Only one message is displayed at a time by default when using `ngMessages`. However, there might be cases where we want to display multiple message for a single field at a time. This we cannot do with `ngSwitch`, since it only renders a single match of the given construct. In order to display multiple messages, we can apply the `ng-messages-multiple` attribute to our `ngMessages` directive. This causes all messages to be displayed where the corresponding validations fail.

{% highlight html %}
{% raw %}
<ng-messages ng-messages-multiple for="loginForm.password.$error">
  ...
</ng-messages>
{% endraw %}
{% endhighlight %}

Or, if we want to display a single one, we at least want to prioritize which message shows up when. For example, before we want to display a message that says the given value doesn't match a particular pattern, we first want to make sure we have at least six characters (`minlength`) and therefore displaying a message for that first.

We can do so by simply assembling our DOM accordingly. Messages that appear first in the DOM are also displayed first. The following construct displays a message for entering a value that is too short, before it informs the user that the given value doesn't match certain pattern:

{% highlight html %}
{% raw %}
<ng-messages for="loginForm.password.$error">
  <ng-message when="minlength">...</ng-message>
  <ng-message when="pattern">...</ng-message>
</ng-messages>
{% endraw %}
{% endhighlight %}

## Reusing existing messages

It gets even better. It's pretty common to have the same messages for the same validations across many forms. Instead of redefining the same message over and over again to have it available in each and every form, `ngMessages` directive expects yet another optional attribute called `ng-messages-include` that lets us include predefined messages at different places in our application.

All we need to do is to define a template that contains the messages we want to reuse and give it an id so we can reference it via `ng-messages-include`.

{% highlight html %}
{% raw %}
<script type="script/ng-template" id="required-message">
  <ng-message when="required">
    This field is required!
  </ng-messages>
</script>

<ng-messages ng-messages-include="required-message" for="loginForm.password.$error">
  ...
</ng-messages>

<!-- somewhere else -->
<ng-messages ng-messages-include="required-message" for="otherForm.field.$error">
  ...
</ng-messages>
{% endraw %}
{% endhighlight %}

<p style="background: #f47676; border-radius: 0.3em; padding: 1em; border: red 1px solid;"><strong>Breaking change in Angular 1.4</strong>: <br><code>ngMessagesInclude</code> is no longer an attribute in Angular 1.4. If you're using an Angular version >= 1.4, we recommend reading <a href="http://blog.thoughtram.io/2015/06/06/ng-messages-revisited.html" tile="ngMessages revisited">this article</a> on breaking changes introduced in ngMessages.</p>

If the template is *not* present in the document, Angular performs a `$templateRequest` to fetch the template first.

Now we've learned that how we can define templates in order to reuse messages at different places in our application. You might think that this is a scenario where [HTML Templates](http://webcomponents.org/articles/introduction-to-template-element/) would be a better fit, instead of doing script overloading. I agree on that, since this is what the `<template>` element has been designed for. Unfortunately, at the time of writing this article, this was not supported, which is why I've created a corresponding issue [here](https://github.com/angular/angular.js/issues/10846).

There's a lot more to cover and I recommend heading over to the official [docs](https://docs.angularjs.org/api/ngMessages) to learn everything you need to know. This module is not only a time-saver but also adds some very powerful features to our declarative world.

