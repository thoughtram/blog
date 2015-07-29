---
layout:     post
title:      "Service vs Factory - Once and for all"
relatedLinks:
  -
    title: "Using ES6 with Angular today"
    url: "http://blog.thoughtram.io/angularjs/es6/2015/01/23/exploring-angular-1.3-using-es6.html"
date:       2015-07-07
update_date: 2015-07-07
summary:    "Yes, this is yet another article on services vs factories in AngularJS. Why is that? Well... it turns out that despite the fact that this question pops up every week or so, it also turns out that the current web doesn't really promote the actual best practice. This article explains once and for all, what the difference between services and factories is and why you should use service."

categories: 
  - angular

tags:
  - angular

author: pascal_precht
---

Wait, what? Yet another article that answers the big question: Service vs Factory, what should I use? Yes, it seems that this is not needed anymore, since there are a ton of resources in the internet that discuss that topic. It turns out that this question still pops up every week or so on different channels, and even after reading the top ten answers on StackOverflow, it's still not very clear. Despite that, it also appears that the current resources on the web don't really promote the actual best practice, especially if we consider the recent movements of the web platform. ES6 I'm looking at you!

This article explains once and for all the difference between services and factories and why **we want to prefer services over factories**.


## The difference between services and factories

Okay, so what is the difference between a service and a factory in AngularJS? As we all know, we can define a service like this:

{% highlight javascript %}
{% raw %}
app.service('MyService', function () {
  this.sayHello = function () {
    console.log('hello');
  };
});
{% endraw %}
{% endhighlight %}

`.service()` is a method on our module that takes a name and a function that defines the service. Pretty straight forward. Once defined, we can inject and use that particular service in other components, like controllers, directives and filters, like this:

{% highlight javascript %}
{% raw %}
app.controller('AppController', function (MyService) {
  MyService.sayHello(); // logs 'hello'
});
{% endraw %}
{% endhighlight %}

Okay, clear. Now the same thing as a factory:

{% highlight javascript %}
{% raw %}
app.factory('MyService', function () {
  return {
    sayHello: function () {
      console.log('hello');
    };
  }
});
{% endraw %}
{% endhighlight %}

Again, `.factory()` is a method on our module and it also takes a name and a function, that defines the factory. We can inject and use that thing exactly the same way we did with the service. Now what is the difference here?

Well, you might see that instead of working with `this` in the factory, we're returning an object literal. Why is that? It turns out, **a service is a constructor function** whereas a factory is not. Somewhere deep inside of this Angular world, there's this code that calls `Object.create()` with the service constructor function, when it gets instantiated. However, a factory function is really just a function that gets called, which is why we have to return an object explicitly.

To make that a bit more clear, we can simply take a look at the Angular source code. Here's what the `factory()` function looks like:

{% highlight javascript %}
{% raw %}
function factory(name, factoryFn, enforce) {
  return provider(name, {
    $get: enforce !== false ? enforceReturnValue(name, factoryFn) : factoryFn
  });
}
{% endraw %}
{% endhighlight %}

It takes the name and the factory function that is passed and basically returns a provider with the same name, that has a `$get` method which is our factory function. So what is it with this provider thing? Well, whenever you ask the injector for a specific dependency, it basically asks the corresponding provider for an instance of that service, by calling the `$get()` method. That's why `$get()` is required, when creating providers.

In other words, if we inject `MyService` somewhere, what happens behind the scenes is:

{% highlight javascript %}
{% raw %}
MyServiceProvider.$get(); // return the instance of the service
{% endraw %}
{% endhighlight %}

Alright, factory functions just get called, what about the service code? Here's another snippet:

{% highlight javascript %}
{% raw %}
function service(name, constructor) {
  return factory(name, ['$injector', function($injector) {
    return $injector.instantiate(constructor);
  }]);
}
{% endraw %}
{% endhighlight %}

Oh look, it turns out that when we call `service()` it actually calls `factory()`. But it doesn't just pass our service constructor function to the factory as it is. It passes a function that asks the injector to instantiate and object by the given constructor. In other words: a service calls a predefined factory, which ends up as `$get()` method on the corresponding provider. `$injector.instantiate()` is the method that ultimately calls `Object.create()` with the constructor function. That's why we use `this` in services.

Okay, so it turns out that, no matter what we use, `service()` or `factory()`, it's always a factory that is called which creates a provider for our service. Which brings us to the mostly asked question in the Angular history: Which one should I use?

## Which one to use?

Asking that question on the internet takes us to a couple of articles and StackOverflow answers. The first is [this](http://stackoverflow.com/questions/13762228/confused-about-service-vs-factory) answer. It says:

"Basically the difference between the service and factory is as follows:"


{% highlight javascript %}
{% raw %}
app.service('myService', function() {

  // service is just a constructor function
  // that will be called with 'new'

  this.sayHello = function(name) {
     return "Hi " + name + "!";
  };
});

app.factory('myFactory', function() {

  // factory returns an object
  // you can run some code before

  return {
    sayHello : function(name) {
      return "Hi " + name + "!";
    }
  }
});
{% endraw %}
{% endhighlight %}

We now already know what happens behind the scenes, but this answer adds another comment. It says we can run code **before** we return our object literal. That basically allows us to do some configuration stuff or conditionally create an object or not, which doesn't seem to be possible when creating a service directly, which is why **most resources recommend to use factories over services, but the reasoning is inappreciable.**

What if I told you, **we can do the exact same thing with services too?**

Yeap, correct. A service is a constructor function, however, that doesn't prevent us from doing additional work and return object literals. In fact, constructor functions in JavaScript can return whatever they want. So we can take our service code and write it in a way that it basically does the exact same thing as our factory:

{% highlight javascript %}
{% raw %}
app.service('MyService', function () {

  // we could do additional work here too
  return {
    sayHello: function () {
      console.log('hello');
    };
  }
});
{% endraw %}
{% endhighlight %}

Hoppla, so what now? We just realised that, depending on how we write our services, there's no difference between the two at all anymore. The big question remains: Which one should we use?

## Services allow us to use ES6 classes

Of course, writing services in that way is kind of contra productive, since it's called as a constructor function, so it should also be used like one. Is there any advantage over the other at all then? Yes, there is. It turns out that it's actually better to use services where possible, when it comes to migrating to ES6. The reason for that is simply that a service is a constructor function and a factory is not. Working with constructor functions in ES5 allows us to easily use ES6 classes when we migrate to ES6.

For example, we can take our code and rewrite it in ES6 like this:

{% highlight javascript %}
{% raw %}
class MyService {
  sayHello() {
    console.log('hello');
  }
}

app.service('MyService', MyService);
{% endraw %}
{% endhighlight %}

An ES6 class is really just a constructor function in ES5. We wrote about that in [Using ES6 with Angular today](http://blog.thoughtram.io/angularjs/es6/2015/01/23/exploring-angular-1.3-using-es6.html), if you haven't read that article yet, I'd recommend checking that out.

With factories, this is not possible because they are simply called as functions. I hope this article made everything clear and encourages people to **not** use factories over services, if they don't know what to use.

This and more you learn in our [Angular Master Class](http://thoughtram.io/angular-master-class.html)!
