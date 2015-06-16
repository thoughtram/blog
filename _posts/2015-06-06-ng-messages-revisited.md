---
layout:     post
title:      "ngMessages revisited"
relatedLinks:
  -
    title: "Exploring Angular 1.3 - ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2015-06-06
update_date: 2015-06-16
summary:    "In one of our articles on exploring Angular 1.3, we discovered a new module that has been introduced - ngMessages. This extension allows us to easily define and display templates for error messages in our applications when it comes to forms. With the release of Angular 1.4, a few changes landed that affect that module. This article discusses what changed."

tags:
  - angular

author: pascal_precht
---

If you've followed our series on [Exploring Angular 1.3](http://blog.thoughtram.io/exploring-angular-1.3), you know that we've written an [article](http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html) about a new module that has been introduced then, called ngMessages. If you haven't read that article we highly recommend checking it out, since this article builds on top of that.

Angular 1.4 has been released just a few days ago and weeks before that, there were several beta releases so we could make our feet wet with it. Next to a ton of improvements, bug fixes and features, this release also introduces a couple of minor breaking changes. In this article we discuss the latest changes to the ngMessages module, so you can update your application code accordingly.

## ngMessagesInclude no longer an attribute

In applications where more than just a single form exists, we might want to reuse message templates. E.g. if we have an input field that is required, we want to display an error message that says so, in case the user forgets to enter anything. Such required fields appear very often in forms, so it would be quite cumbersome if we would have to define the same error message in a template over and over again.

To solve that issue, there was an `ngMessagesInclude` attribute, which we could use in combination with the `ngMessages` directive, to include existing templates in other `ngMessages` container.

To illustrate this scenario, here's what such a template definition could look like:
{% highlight html %}
{% raw %}
<script type="script/ng-template" id="required-message">
  <ng-message when="required">
    This field is required!
  </ng-message>
</script>
{% endraw %}
{% endhighlight %}

It's an overloaded `script` tag that has an `id` attribute so we can refer to it later, and in that script we can just define a template. In order to (re)use that template, all we had to do, was to use the `ngMessagesInclude` attribute like this:

{% highlight html %}
{% raw %}
<ng-messages ng-messages-include="required-message" for="otherForm.field.$error">
  ...
</ng-messages>
{% endraw %}
{% endhighlight %}

What happens here, is that we just have our `ngMessages` container to display messages, but in addition to that, an existing template will be automatically included and activated. Included templates have always been added to the **bottom** of the `ngMessages` container.

**In Angular 1.4, this has changed**. `ngMessagesInclude` is no longer an attribute but a directive. Which means, if we want to use it the same way, instead of adding an attribute to the `ngMessages` container, we have to add the `ngMessagesInclude` directive as a child element to the container like this:

{% highlight html %}
{% raw %}
<ng-messages for="otherForm.field.$error">
  <div ng-message="minlength">...<div>
  <div ng-messages-include="required-message"></div>
</ng-messages>
{% endraw %}
{% endhighlight %}

Of course, this gives us much better control over what happens inside the `ngMessages` container. Don't forget that the order of `ngMessage` directives inside a container configures the priority of each message.

## Dynamic Message resolution

A better method to include existing message templates is already great, but the framework could do better. Even if `ngMessages` as a whole is a very nice and useful extension, it turns out that there was one issue with it, that should have been supported out of the box based on the nature of Angular.

It was not possible to pass expressions to `ngMessage` directives, that evaluate to any kind of error type. This restricted us to only define static templates for each error message, which not only means we had to type more, it's also not possible to render error messages dynamically that come from a server. In addition to that, it was not possible to use directives on ngMessages that do structure changes to the DOM (e.g. `ngIf`, `ngRepeat`).

**Angular 1.4 fixes that issue**. It introduces another directive called `ngMessageExp` which gets an expression that evaluates to an error type, so we can dynamically display messages. Combined with directives that do structural changes to the DOM, this can be very powerful. Just imagine you'd get a list of error messages back from a server due to asynchronous validation. With the new added features, this can easily be implemented like this:

{% highlight html %}
{% raw %}
<ng-messages for="otherForm.field.$error">
  <div ng-repeat="errorMessage in errorMessages">
    <div ng-message-exp="errorMessage.type">
      {{errorMessage.text}}
    </div>
  </div>
</ng-messages>
{% endraw %}
{% endhighlight %}

We can simply iterate over a collection of messages using `ngRepeat` and dynamically display error messages based on the collection's message objects. Super powerful.
