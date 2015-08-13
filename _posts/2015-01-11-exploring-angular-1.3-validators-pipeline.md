---
layout:     post
title:      "Exploring Angular 1.3: Validators Pipeline"
relatedLinks:
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
    title: "Exploring Angular 1.3: Go fast with $applyAsync"
    url: "http://blog.thoughtram.io/angularjs/2015/01/14/exploring-angular-1.3-speed-up-with-applyAsync.html"
  -
    title: "Exploring Angular 1.3: ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2015-01-11
update_date: 2015-08-13
summary:    "Angular makes working with forms in applications a breeze. Not only that it extends a form's capabilities, it makes it possible to handle them in a different way due to its scope model nature. In this article we discuss a newly introduced feature called custom validators. We usually made custom validations in with parsers and formatters. But the validators pipeline makes validating forms even better."

isExploringAngular13Article: true

categories: 
- angularjs

tags:
  - angular

author: pascal_precht
---

We know that working with forms in Angular is just great. Due to its scope model nature, we always have a reference to the actual form state in its corresponding scope, which makes it easy to access particular field values or represent the form state in our views. 

If there's one thing that takes probably most of the work when building forms, it's their validation. We know that validation on the server-side is always required in order to process given user data that could break our app. But we also want to provide a great user experience, which is where validation on the client-side comes into play. We already learned about [ngModelOptions](http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html). In this article we are going to discuss the ways we've been able to validate data in our Angular forms in 1.2 and detail how version 1.3 makes it even easier with the validators pipeline.

## Built-in form validation

Before we start looking at what the latest bigger Angular release brings to the table when it comes to form validation, let's take a look at what capabilities we had anyway and also especially, why there was a need for an improvement at all.

HTML5 provides some validation attributes we can use to let the browser validate our form controls. For example, if we want to have native validation support for email input fields, all we have to do is to apply the `required` attribute to that element.

{% highlight html %}
{% raw %}
<input type="email" required>
{% endraw %}
{% endhighlight %}

And as you probably know, there are a couple of other validation attributes like `minlength`, `maxlength` and `pattern`. However, it turns out that the API is inconsistent and not even supported in all browsers and platforms today. That's why Angular provides basic implementation for HTML5 validation with its `ngModel` directive and controller and makes it consistent between browsers.

Here's a list of supported validation attributes:

- `ng-required`
- `ng-minlength`
- `ng-maxlength`
- `ng-min`
- `ng-max`
- `ng-pattern`

In addition to that, Angular validates certain input types automatically without us doing anything. The following code displays a simple form that has just one field of type `email`. Applying an `ng-model` to it makes Angular aware of it. Also notice the `name` attribute of the form which publishes the `FormController` instance of the form into the scope.

{% highlight html %}
{% raw %}
<form name="myForm">
  <input type="email">
  <p ng-if="myForm.$error.email">Email address is not valid!</p>
</form>
{% endraw %}
{% endhighlight %}

Running this code in the browser, you can see the validation happens automatically. Errors are even exposed on the `FormController`'s `$error` object, which makes displaying error messages a breeze.

Of course, `email` is not the only type where automatic validation happens. It's also triggered when type `url` or `number` is used. In 1.3 there's additional support for date and time inputs like `date`, `time`, `datetime-local`, `week` and `month` as well.

## Custom Validations - The Old Way

Built-in validations are nice, but in some cases we need validations that go far beyond the basic functionality we get out of the box. And this is where custom validations come in.

The key part of validation in Angular is the `ngModelController` since it controls the logic of passing values back and forth between the DOM and the scope. In versions before 1.3, we were able to implement custom validations by using `ngModelController` and it's `$formatters` and `$parsers` pipeline.

Let's say we want to implement a custom validation that checks if the value that is passed by the user is an actual integer. In order to do that, we would first create a new directive that accesses `ngModelController` like so:

{% highlight js %}

app.directive('validateInteger', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      // add validation to ctrl
    }
  };
});

{% endhighlight %}

In a directive's `link` function, we can ask for other directives controllers with the `require` property of the directive definition object. `ctrl` is now a reference to an `ngModelController` instance which has a `$formatters` and `$parsers` property. These two properties are arrays, that act as pipelines that get called when certain things happen.

These certain things are:

- **Model to view update** - Whenever the bound model changes, all functions in `$formatters` are called one by one, in order to format the value and changes it's validity state.


- **View to model update** - Whenever the user interacts with a form control, it calls the `ngModelController`'s `$setViewValue` method, which in turn calls all functions of the `$parsers` array in order to convert the value and also change it's validity state accordingly.

Okay, so we have one pipeline that pipes the value from model to view and another one that pipes it from view to model. Since we want to check if the given value in our control is an actual integer, we need to use the pipeline that is executed when the view updates the model, which is the `$parsers` array.

All we have to do now, is to add a new function to `$parsers` that performs the needed checks and sets the validity state with `$setValidity()` accordingly. In order to make sure that our validation function is called first in the pipe, we use [Array.prototype.unshift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift).

{% highlight js %}

app.directive('validateInteger', function () {

  var REGEX = /^\-?\d+$/;

  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {

      ctrl.$parsers.unshift(function (viewValue) {

        if (REGEX.test(viewValue)) { 
          ctrl.$setValidity('integer', true);
          return viewValue;
        } else {
          ctrl.$setValidity('integer', false);
          // if invalid, return undefined
          // (no model update happens)
          return undefined;
        }

      });
    }
  };
});

{% endhighlight %}

We check if the new values matches against our regular expression. If it matches we set the validity of `integer` to `true` and return `viewValue`, so it can be passed to further parser functions. 

In case it doesn't match, we set it's validity to `false`, which also exposes an `integer` member on the `FormController`'s `$error` object, so we can display error messages accordingly. We also return `undefined` explicitly, in order to stop processing of the pipe.

We can then use it like every other directive:

{% highlight html %}
<form name="myForm">
  <input type="text" validate-integer>
  <p ng-if="myForm.$error.integer">Oups error.</p>
</form>
{% endhighlight %}

As you can see, there's a lot to take care of when writing custom validations. We need to know about the `$parsers` and `$formatters` pipeline. We also need to set a value's validity state explicitly with `$setValidity()`. 

In addition to that, it turns out that due to the nature of HTML5 form validation, some input types may not expose the input value until the valid value is entered.

So how does Angular 1.3 a better job?

## Meet the `$validators` pipeline

Angular 1.3 introduces yet another pipeline, the `$validators` pipeline, which is rather used than `$parsers` + `$formatters`. Unlike parsers and formatters, the validators pipeline has access to both, `viewValue` and `modelValue`, since it's called once `$parsers` and `$formatters` has been successfully run.

Another API difference is that `$validators` is not an array, but an object with each member describing a validator. Let's implement our `integer` custom validation as part of the `$validators` pipeline.


{% highlight js %}

app.directive('validateInteger', function () {

  var REGEX = /^\-?\d+$/;

  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {

      ctrl.$validators.integer = function (modelValue, viewValue) {

        if (REGEX.test(viewValue)) {
          return true
        }
        return false;
      };
    }
  };
});

{% endhighlight %}

As you can see, we no longer have to take care of calling `$setValidity()`. Angular calls `$setValidity()` internally, with the value that a validator returns, which is either `true` or `false`.

And of course, if a value is invalid, an `$error` is exposed on the `FormController` accordingly.

## Async validators

With 1.3, Angular goes even a step futher and makes asynchronous validations possible. Just imagine the case you have an input field for a user name and whenever a user types in a name, you need to perform some validity checks on your server. The application needs to wait until the server responses.

That's why there's next to `$validators` **another** validators object called `$asyncValidators`. Asynchronous validators work pretty much like synchronous validators except that they are asynchronous and therefore promise based. Instead of returning `true` or `false`, we return a promise that holds the state of an asynchronous code execution.

Here's what it could look like:

{% highlight js %}

app.directive('validateUsername', function ($q, userService) {

  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {

      ctrl.$asyncValidators.username = function (modelValue, viewValue) {
        return $q(function (resolve, reject) {
          userService.checkValidity(viewValue).then(function () {
              resolve();
            }, function () {
              reject();
            });
        });
      };
    }
  };
});

{% endhighlight %}

Asynchronous validators are called, after synchronous validators have been successfully executed. While an asynchronous validator is running, a `$pending` object will be exposed on the field's `ngModelController`. Flags like `$valid` and `$invalid` are set to `undefined` at this point.

We could display a loading message like this (notice the `name` attribute applied to the field to expose it's controller):

{% highlight html %}
<form name="myForm">
  <input type="text" name="username" validate-username>
  <p ng-if="myForm.username.$pending">Validating user name...</p>
</form>
{% endhighlight %}

Okay, we now learned about `$validators` and `$asynchValidators`, but does that mean our existing `$parsers` and `$formatters` won't work anymore?

The answer is **no**. The validation pipeline has been added to the existing pipelines. It is basically there, so developers can explicitly distinguish between validations and parsing/formatting related functionality.

Also, as we learned, the validators pipeline has a slight simpler API. We don't have to take care of setting `$setValidity()` anymore. And we can finally do proper asynchronous validations.
