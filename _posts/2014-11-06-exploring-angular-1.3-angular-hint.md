---
layout:     post
title:      "Exploring Angular 1.3: Angular-hint"
relatedLinks:
  -
    title: "Exploring Angular 1.3: One-time bindings"
    url: "http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html"
  -
    title: "Exploring Angular 1.3: ng-model-options"
    url: "http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html"
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
  -
    title: "Exploring Angular 1.3: ngMessages"
    url: "http://blog.thoughtram.io/angularjs/2015/01/23/exploring-angular-1.3-ngMessages.html"
date:       2014-11-06
update_date: 2015-08-13
summary:    In this article we are talking about the very useful angular-hint module which makes our lifes easier by informing us about common mistakes when developing angular applications and telling us about best practices which leads to better code.
isExploringAngular13Article: true

categories: 
  - angularjs

tags:
  - angular

author: pascal_precht
---

With the release of version 1.3, the Angular project comes with a new module called [angular-hint](http://github.com/angular/angular-hint), that makes debugging and finding mistakes in the code base easier. It also gives us hints about best practices, so that our code is more maintainable and easier to read. In this article we'll take a brief look at this module and explore how we can actually use it and what great features it provides. As a side note, this is the third article of our "*Exploring Angular 1.3*" series, so you might want to check out our articles about [ngModelOptions](http://blog.thoughtram.io/angularjs/2014/10/19/exploring-angular-1.3-ng-model-options.html) and [one-time bindings](http://blog.thoughtram.io/angularjs/2014/10/14/exploring-angular-1.3-one-time-bindings.html) too. Okay, let's dive into the actual topic.

As already mentioned, `angular-hint` helps us writing better Angular code and makes finding very common mistakes in our code base easier. For example, did it ever happen to you, that you developed your Angular app, you grabbed a module from somewhere, then you started using the directives that the module comes with, and no matter how much you followed the usage instructions, it simply didn't work. And after one hour of debugging you found out that you forgot to add the module dependency to your application. Yikes!

But let me tell you something. With `angular-hint`, these times are over. And that's just one use case where `angular-hint` helps out. In fact, `angular-hint` comes with a couple of other sub modules for particular use cases. 

These modules are:

- [angular-hint-controllers](http://github.com/angular/angular-hint-controllers) - Warns about use of global controllers and hints about best practices for controller naming
- [angular-hint-directives](http://github.com/angular/angular-hint-directives) - Hints about misspelled attributes and tags, directives and more
- [angular-hint-dom](http://github.com/angular/angular-hint-dom) - Warns about use of DOM APIs in controllers
- [angular-hint-events](http://github.com/angular/angular-hint-events) - Identifies undefined variables in event expressions
- [angular-hint-interpolation](http://github.com/angular/angular-hint-interpolation) - Notifies of undefined parts of interpolations chains and suggests available variables
- [angular-hint-modules](http://github.com/angular/angular-hint-modules) - Identifies missing module namespaces, undeclared modules, multiple uses of `ng-app` and more

Let's start right away and see what the usage of `angular-hint` looks like.

## Install and using `angular-hint`

Using `angular-hint` is super easy, since all we have to do is to install it via npm, embed the source in our application and use the `ng-hint` directive that takes care of the rest. Alright, so let's install the module via npm:

{% highlight sh %}
$ npm install angular-hint
{% endhighlight %}

The `angular-hint` module declares all the sub modules (`angular-hint-directives`, `angular-hint-controllers`, ...) as dependency, so you don't have to care about installing them manually. The command above does the job for you. Also, the package comes with a pre-compiled `hint.js` file that contains the source of all mentioned `angular-hint-*` modules, so you can use it right away.

Once it's installed, we can embed the source in our application right after Angular itself like this:

{% highlight html %}
<script type="path/to/angular/angular.js"></script>
<script type="path/to/angular-hint/hint.js"></script>
{% endhighlight %}

Next, we apply the `ng-hint` directive in order to actually use the `angular-hint` module:

{% highlight html %}
<body ng-app="myApp" ng-hint>
</body>
{% endhighlight %}

That's it. We're done. It's that easy.

Applying the `ng-hint` directive to our document takes care of injecting all needed hint modules in your apps bootstrap phase. But how does `ng-hint` know, which hint modules we actually want to activate? By default, `ng-hint` injects all the mentioned hint modules. However, if we don't want to get controller related hints, but are interested in DOM related hints, we can restrict the use of hint modules by using the `ng-hint-include` directive instead. The following code only injects `angular-hint-dom`:

{% highlight html %}
<body ng-app="myApp" ng-hint-include="dom">
</body>
{% endhighlight %}

We can even define more than just one hint module if needed:

{% highlight html %}
<body ng-app="myApp" ng-hint-include="dom directives">
</body>
{% endhighlight %}

As you can see, the names used as value for `ng-hint-include` map to the suffixes of the actual hint module names. E.g. `dom` and `directives` map to `angular-hint-dom` and `angular-hint-directives` respectively.

## Module hints

Okay, so now that `angular-hint` is installed, let's try to reproduce the "I forgot to add module dependency" scenario we were talking about. To do that, we declare an additional Angular module that act as our app dependency. For simplicity's sake, we don't add any ground breaking functionality here.

{% highlight javascript %}
angular.module('myAppDependency', []);
{% endhighlight %}

Next we take a look at our actual app module definition. As you can see, we declare the module without any further dependencies a.k.a we simply forgot it.

{% highlight javascript %}
angular.module('myApp', []);
{% endhighlight %}

Now, instead of fiddling around for an hour to find out why `myAppDependency`'s directives aren't picked up, `angular-hint` is telling us that we might missed something. Simply open your browsers console and you should see something like this:

{% highlight sh %}
Angular Hint: Modules
  Module "myAppDependency" was created but never loaded.
{% endhighlight %}

This log occurs whenever an Angular module is present but not declared as dependency anywhere (You might see another message says that `ngHintModules` was also created but never loaded. This is a probably a bug and filed [here](https://github.com/angular/angular-hint-modules/issues/17)).

There are a couple more things that this module tries to warn you about and you can read about them [here](https://github.com/angular/angular-hint-modules).

## Controller hints

If there's one thing you should embrace when working on a bigger Angular app and especially when working in a bigger team, are best practices. The Angular team [published their style guide](https://docs.google.com/document/d/1XXMvReO8-Awi1EZXAXS4PzDzdNvV6pGcuaF4Q9821Es/pub) for apps built with Angular internally at Google, that covers best practices and conventions.

One of these best practices is, when naming controllers, to suffix them with `Controller` instead of using short names like `Ctrl`. `angular-hint` helps with that too. Let's take a look what happens when we define a controller with a name that doesn't have this suffix:

{% highlight javascript %}
angular.module('myApp', []).controller('AppCtrl', function () {

});
{% endhighlight %}

Having a controller registered like this, `angular-hint` gives us the following warning:

{% highlight sh %}
Angular Hint: Controllers
  The best practice is to name controllers ending with 'Controller'.
  Check the name of 'AppCtrl'
{% endhighlight %}

I think this makes pretty much clear what can be achieved with such a tool. Having a style guide with conventions and best practices that everybody agrees on, makes a projects structure easier to understand and debug. With `angular-hint` we actually have a tool to embrace and encourage these best practices and conventions and this is just the start!

## Directive hints

When dealing with directives, there are a couple of things that can go wrong and stop us from being productive because we have to debug (once again) why a given directive doesn't seem to work. Similar to the example where we forgot to add our module dependency, it also happens quiet often, that we misspell directive names. When a directive name is misspelled, for Angular, this is just an attribute (or element) that it doesn't know about, so it gets completely ignored.

Just take a look at this small snippet:

{% highlight html %}
<ul>
  <li ng-repaet="i in [1,2,3,4]">
    <!-- more dom goes here -->
  </li>
</ul>
{% endhighlight %}

As you can see, there's a typo in the directive name. We actually wanted to type `ng-repeat`, but we typed `ng-repaet`. I can easily remember the last time, when I was debugging for an hour because I just misspelled a directive name. Because literally **nothing** happens.

However, when `angular-hint` is activated, we get the following very useful warning:

{% highlight sh %}
Angular Hint: Directives
  There was an AngularJS error in LI element. 
  Found incorrect attribute "ng-repaet" try "ng-repeat"
{% endhighlight %}

How cool is that? Not only that `angular-hint` warns me about an incorrect directive name and on what kind of element it is applied, it also suggests me a directive that is actually registered and to use! And now think about how much time you can save with such a helper.

## Conclusion

Even if we took a look at just a few of all provided `angular-hint` modules and features, I'm pretty sure you get an idea how useful it is. Of course, it's still in early development and has one or the other bug here and there, but the initial idea of having such a module that you can easily apply and tells you about all your possible mistakes, is just awesome.

And again, this is just the start. I can't even think of all the possibilities we have when extending the hint modules with additional functionality and hints. I could also imagine that this module could help out migrating from 1.x to 2.x in the future once the APIs are stable.

However, you should go and try it out in your apps today. If you find any bugs, make sure to file them at the dedicated repositories on [GitHub](https://github.com/angular?query=angular-hint), or fix them directly and send a pull request. Also, don't hesitate to come up with new ideas on how the module could be extended. It'll make all our lives easier!
