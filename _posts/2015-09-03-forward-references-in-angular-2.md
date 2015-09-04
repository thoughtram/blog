---
layout:     post
title:      "Forward references in Angular 2"
relatedLinks:
  -
    title: "Dependency Injection in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html"
  -
    title: "Host and Visibility in Angular 2's Dependency Injection"
    url: "http://blog.thoughtram.io/angular/2015/08/20/host-and-visibility-in-angular-2-dependency-injection.html"

date:       2015-09-03
update_date: 2015-09-04
summary:    "Even though we already covered many aspects of the dependency injection system in Angular 2 there are still some features left that we haven't covered yet. Some of them more bold and some more subtile. In this article we like to explore forward references. Why they exist and how we can use them."

categories:
  - angular

tags:
  - angular2

topic: di

author: christoph_burgdorf
---

In our article on [Dependency Injection in Angular 2](http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html) we explored what dependency injection actually is, and how it is implemented in the Angular 2 framework. If you haven't read that article yet, I highly recommend you doing so, since this article is based on it.

In a [another article](http://blog.thoughtram.io/angular/2015/08/20/host-and-visibility-in-angular-2-dependency-injection.html) we even learned about **host** and **visibility of dependencies** as another aspect of Angular 2's DI system. But that doesn't mean that we've already discovered all features of the machinery yet. In this article we'll take a look at **forward references**. Another tiny, yet useful feature of the DI system in Angular 2.

## Understanding the problem

As a small recap, here we have an `AppComponent` that relies on DI to get a `NameService` injected. As we are using TypeScript, all we need to do is to annotate our constructor parameter `nameService` with the `NameService` type. This gives Angular all the relevant info to correctly resolve the dependency at runtime.

**app.ts**
{% highlight ts %}
{% raw %}
import {Component, View, bootstrap} from 'angular2/angular2';
import {NameService} from './nameService';
@Component({
  selector: 'my-app'
})
@View({
  template: '<h1>Favourite framework: {{ name }}</h1>'
})
class AppComponent {
  name: String
  constructor(nameService: NameService) {
    this.name = nameService.getName();
  }
}
bootstrap(AppComponent, [NameService]);
{% endraw %}
{% endhighlight %}

**nameService.ts**
{% highlight ts %}
{% raw %}
export class NameService {
  getName () {
    return "Angular 2";
  }
}
{% endraw %}
{% endhighlight %}

This works well, but let's see what happens when we inline the contents of `nameService.ts` directly in `app.ts`. In this case, you probably wouldn't want to do that but bear with me as I'm trying to make my point.


{% highlight ts %}
{% raw %}
import {Component, View, bootstrap} from 'angular2/angular2';
@Component({
  selector: 'my-app'
})
@View({
  template: '<h1>Favourite framework: {{ name }}</h1>'
})
class AppComponent {
  name: String
  constructor(nameService: NameService) {
    this.name = nameService.getName();
  }
}

class NameService {
  getName () {
    return "Angular 2";
  }
}

bootstrap(AppComponent, [NameService]);
{% endraw %}
{% endhighlight %}


When we try to run this code we notice that it stopped working. In my case, I wasn't even able to get an error reported to the console which I assume boils down to some glitch with debugging TypeScript code with source maps. Anyways, when we use the debuggers "Pause on exceptions" feature we can follow the rabbit into it's hole somewhere deep down inside the Angular 2 framework.

`Cannot resolve all parameters for AppComponent(undefined). Make sure they all have valid type or annotations`.

Ok, this gives us a little hint. It seems `NameService` is undefined in the constructor of `AppComponent`. This makes sense if you look at the flow of the code because we already used `NameService` in the constructor of `AppComponent` before we actually declared it. But on the other hand, using regular ES5 constructor functions that would be totally valid because function declarations get hoisted to the top by the JavaScript interpreter behind the scenes. And then, aren't ES6 classes just sugar on top of regular ES5 functions after all?

Let's see what happens when we move `NameService` to the top so that it's declared before it's first usage.

{% highlight ts %}
{% raw %}
import {Component, View, bootstrap} from 'angular2/angular2';

class NameService {
  getName () {
    return "Angular 2";
  }
}

@Component({
  selector: 'my-app'
})
@View({
  template: '<h1>Favourite framework: {{ name }}</h1>'
})
class AppComponent {
  name: String
  constructor(nameService: NameService) {
    this.name = nameService.getName();
  }
}

bootstrap(AppComponent, [NameService]);
{% endraw %}
{% endhighlight %}

Ok, this seems to work just fine. But why doesn't the JavaScript interpreter do that for us in the first place as it does for regular ES5 constructor functions?

## Classes aren't hoisted for a good reason

Let's step back from Angular 2 for a moment in order to understand the bare mechanics of the JavaScript language in this regard.

The JavaScript interpreter doesn't hoist class declarations because it may lead to unsound behavior when we have a class that uses the `extend` keyword to inherit from something. In particular, when it inherits from an expression which is absolutely valid.

Consider this ES6 code:

{% highlight js %}
{% raw %}
class Dog extends Animal {

}

function Animal {
  this.move = function () {
    alert(defaultMove);
  }
}

let defaultMove = "moving";

let dog = new Dog();
dog.move();
{% endraw %}
{% endhighlight %}

This alerts `moving` just fine because what happens behind the scenes is that the JavaScript interpreter restructures the code to this.

{% highlight js %}
{% raw %}

let defaultMove, dog;

function Animal {
  this.move = function () {
    alert(defaultMove);
  }
}

class Dog extends Animal {

}

defaultMove = "moving";

dog = new Dog();
dog.move();
{% endraw %}
{% endhighlight %}

However, try making `Animal` an expression rather than a function declaration.

{% highlight js %}
{% raw %}
class Dog extends Animal {

}

let Animal = function Animal {
  this.move = function () {
    alert(defaultMove);
  }
}

let defaultMove = "moving";

let dog = new Dog();
dog.move();
{% endraw %}
{% endhighlight %}

Again, this will be hoisted but now it becomes this.

{% highlight js %}
{% raw %}

let Animal, defaultMove, dog;

class Dog extends Animal {

}

Animal = function Animal {
  this.move = function () {
    alert(defaultMove);
  }
}

defaultMove = "moving";

dog = new Dog();
dog.move();
{% endraw %}
{% endhighlight %}

At the point where `class Dog extends Animal` is interpreted `Animal` is actually undefined and we get an error. We can easily fix that by moving the `Animal` expression before the declaration of `Dog`.


{% highlight js %}
{% raw %}

let Animal = function Animal {
  this.move = function () {
    alert(defaultMove);
  }
}

class Dog extends Animal{

}

let defaultMove = "moving";

let dog = new Dog();
dog.move();
{% endraw %}
{% endhighlight %}

This works just fine again. Now think about what *would* actually happen if the JavaScript interpreter hoisted `Dog` just like a regular ES5 constructor function? We would end up with this code:

{% highlight js %}
{% raw %}

let Animal, defaultMove, dog;

// Dog is now hoisted above `Animal = function Anim...`
class Dog extends Animal{

}

Animal = function Animal {
  this.move = function () {
    alert(defaultMove);
  }
}

defaultMove = "moving";

dog = new Dog();
dog.move();
{% endraw %}
{% endhighlight %}

Now that `Dog` is hoisted to the top the code breaks at the moment where the `extends Animal` is interpreted because `Animal` is `undefined` at that moment. The important thing to note here is that the `extends` part has to be evaluated at the right point in time. Therefore classes aren't hoisted.

## So the class must always be declared before it's usage?

Ok, now that we understood *why* classes aren't hoisted what does that mean for our earlier Angular 2 example where we had to move the `NameService` to the very top? Is this the only way to get things working?

Turns out there is a solution we can reach for. Instead of annotating our `nameService` parameter with the `NameService` type which we learned evaluates to `undefined` at this point in time, we can use the `@Inject` annotation in conjunction with the `forwardRef` function as demonstrated here.

{% highlight ts %}
{% raw %}
import { Component, View, Inject,
         forwardRef, bootstrap} from 'angular2/angular2';

@Component({
  selector: 'my-app'
})
@View({
  template: '<h1>Favourite framework: {{ name }}</h1>'
})
class AppComponent {
  name: String
  constructor(@Inject(forwardRef(() => NameService)) nameService) {
    this.name = nameService.getName();
  }
}

class NameService {
  getName () {
    return "Angular 2";
  }
}
bootstrap(AppComponent, [NameService]);
{% endraw %}
{% endhighlight %}

What `forwardRef` does is, it takes a function as a parameter that returns a class. And because this functions isn't immediately called but instead is called *after* `NameService` is declared it is safe to return `NameService` from it. In other words: At the point where `() => NameService` runs `NameService` isn't undefined anymore.

## Conclusion

The described scenario isn't something that one has to deal with too often. This only becomes a problem when we want to have a class injected that we created in the same file. Most of the time we have one class per file and import the classes that we need at the very top of the file so we won't actually suffer from the fact that classes aren't hoisted.
