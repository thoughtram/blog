---
layout: post
title: ngMessageFormat - Angular's unheard feature
relatedLinks:
  - title: Angular and i18n - A new world
    url: >-
      http://blog.thoughtram.io/angular/2015/03/21/angular-and-i18n-the-new-world.html
date: 2015-12-10T00:00:00.000Z
update_date_: 2015-12-10T00:00:00.000Z
summary: >-
  Angular 1.5 is pretty much around the corner. It turns out that there's a
  feature that already landed in Angular 1.4, that no one really noticed.
  Curious?
categories:
  - angular
tags:
  - angular
author: pascal_precht
related_posts:
  - 'Exploring Angular 1.5: Lifecycle Hooks'
  - Sponsoring AngularConnect. Again.
  - Multiple Transclusion and named Slots
  - Service vs Factory - Once and for all
  - Taking Angular Master Class to the next level
  - ngMessages revisited

---

Angular 1.5 is pretty much around the corner and with a new release, new fixes, improvements and features are added to the framework. While this is awesome and we're all excited about it, it seems like we're forgetting about all the nice things we already have.


<img src="/images/tweet.png" alt="Tweet by thoughtram">

A few days ago, we asked on twitter who's interested to learn about an **unheard feature** in Angular. Based on the reactions to that tweet, it's quite obvious that you all are and that's awesome! So what is this unheard feature we're talking about? If you read this article you can surely tell from its title that it's probably about this thing called **ngMessageFormat**. We'll get right into it but first we'd like to make one thing clear:

**This feature is available since Angular 1.4**

If you're on version 1.4 or higher, this feature is already available to use. So, what you learn in the next couple of minutes you can use straight away!

## Understanding Pluralization and Gender Selection

Earlier this year I gave a talk together with [Chirayu](http://twitter.com/chirayuk), a former member of the Angular core team, about how the Angular project is going to solve internationalization and localization in the future. The talk can be watched [right here](https://www.youtube.com/watch?v=iBBkCA1M-mc) and if you're more a reader kind of person, we wrote about everything in our article on [Angular and i18n - A new world](http://blog.thoughtram.io/angular/2015/03/21/angular-and-i18n-the-new-world.html).

One thing that is an essential part of i18n, but also a sort of isolated topic at the same time, is **pluralization** and **gender selection**. We probably all ran into this at a some point. For example, displaying a notification that says:

{% highlight html %}
{% raw %}
You have {{numberOfMessages}} new messages.
{% endraw %}
{% endhighlight %}

While this works as long as `numberOfMessages` evaluates to something `> 1`, it doesn't fit anymore as soon as we have just a single message. Our template would look something like this:

{% highlight html %}
{% raw %}
You have 1 new messages.
{% endraw %}
{% endhighlight %}

This can easily be solved with the `ngSwitch` directive, or, in fact Angular comes with an `ngPluralize` directive that introduces a couple more features (like `offset`) to make pluralization easy. Here's an `ngPluralize` solution for the scenario above:

{% highlight html %}
{% raw %}
<ng-pluralize count="numberOfMessages"
              when="{'1': 'You have one new message.',
                     'other': 'You have {} new messages.'}">
</ng-pluralize>
{% endraw %}
{% endhighlight %}

Pluralization can be hard, especially if we consider that it can vary heavily depending on the language we're using. While we have "one" and "more" in most of the european language rules, other languages have "one", "few" and "more".

Another thing that comes into play is **gender selection**. Depending on a persons gender, we might need to output different text.

{% highlight html %}
{% raw %}
Send him an invite.
Send her an invite.
Send them an invite.
{% endraw %}
{% endhighlight %}

This can not be solved with `ngPluralize` today. Also, what if we have text in HTML attributes that needs to be pluralized as well?

## Introducing ngMessageFormat

Luckily, there's a standard called [ICU Messageformat](http://userguide.icu-project.org/formatparse/messages) which tackles pluralization and gender selection properly. In fact, with Messageformat, we can even nest gender selection rules and pluralization rules and vice-versa. But what has this to do with Angular?

Well, as part of the effort for the new i18n solution, Angular's interplation syntax got extended **in Angular 1.4**. In other words, we can basically overload the expression syntax with ICU Messageformat expressions. All we have to do is to include the `ngMessageFormat` module.

`ngMessageFormat` can be installed via npm using the following command:

{% highlight sh %}
{% raw %}
$ npm install angular-message-format
{% endraw %}
{% endhighlight %}

Once installed and included in our HTML document, we can add it as a module dependency and start using it right away! 

{% highlight js %}
{% raw %}
angular.module('myApp', ['ngMessageFormat']);
{% endraw %}
{% endhighlight %}

**Pluralization with ngMessageFormat**

With `ngMessageFormat` included, we can overload Angular expressions using a comma like this:

{% highlight html %}
{% raw %}
{{EXPRESSION, TYPE,
     =VALUE { MESSAGE }
     ...
}}
{% endraw %}
{% endhighlight %}

Whereas `EXPRESSION` is the expression that needs to be evaluated, `TYPE` specifies what we want to do `plural` or `select` for pluralization and gender selection respectively. Let's use this syntax to output our notification, based on `numberOfMessages`.

{% highlight html %}
{% raw %}
{{numberOfMessages, plural,
    =0 { You have no new messages }
    =1 { You have one new message }
    other { You have # new messages }
}}
{% endraw %}
{% endhighlight %}

As we can see, `#` can be used as a placeholder that gets replaced with the actual evaluated value. Another nice thing to notice: We can use still use Angular expressions and filters **inside** those messages!

**Gender selection with ngMessageFormat**

Gender selection uses the exact same syntax. All we have to do is to change the selection type and define messages for each gender:

{% highlight html %}
{% raw %}
{{genderExpression, select,
    male { Send him a message. }
    female { Send her a message. }
    other { Send them a message. }
}}
{% endraw %}
{% endhighlight %}

Here's `ngMessageFormat` in action:

<iframe src="http://embed.plnkr.co/UYyBFyafomFllh5ZcP0s/"></iframe>

## Conclusion

Unfortunately [ngMessageFormat](https://docs.angularjs.org/api/ngMessageFormat) is not very well documented and it didn't get a lot of love after it has been released. However, it is right there and it wants to be used. Just remember that it allows you to pluralize not only HTML attributes, it even makes nesting of plural and gender selection possible!
