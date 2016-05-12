---
layout:     post
title:      "Exploring Rx Operators: map"
imageUrl:  "/images/banner/rx-map.jpg"


date: 2016-05-16

summary: "In two of our previous articles we already highlighted the importance of Observables in Angular 2. This is the first article that is part of a new series where we take a look at different operators of the Reactive Extensions for JavaScript."

categories:
  - angular
tags:
  - angular2
  - Rx

author: christoph_burgdorf
---

In [Taking advantage of Observables Part one](/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html) and [two](/angular/2016/01/07/taking-advantage-of-observables-in-angular2-pt2.html) we already highlighted the importance of Observables in Angular 2. We believe that mastering Observables can make a key difference in how we write our applications. Well, if you agree, here are some good news! This article is the first of a series of posts where we'll explore operators of the Reactive Extensions for JavaScript (RxJS) and their practical applications.

The first operator we want to explore is the most commonly used one: `map`.

## Understanding the `map` operator

We've probably all used `map` before when we were working with arrays. The idea is that each
item in the collection will potentially be projected into a different value.

Here is a very simple example where an array of numbers is transformed so that each number is multiplied by 10.

{% highlight js %}
{% raw %}
let values = [1, 2, 3];

let transformed = values.map(value => value * 10);

//prints [10, 20, 30]
console.log(transformed);
{% endraw %}
{% endhighlight %}

By now we may be wondering what that has to do with Observables and the `map` operator that is part of RxJS.

Observables are very much like arrays in a way. Well, they are actually more like Iterators but let's not get lost in the details. The key point to understand is that both represent a sequence of values. The key difference is that with Arrays/Iterators you *pull* values out as you want to work with them whereas with Observables you get values *pushed* to you as they arrive. It's this similarity that allows us to take advantage of pretty much all operators that we know from the pull-based world and apply them to the push-based world.

## `map` and Observables

Let's start with a little demo. All we need is a simple `<input>` element to enter some text.

{% highlight js %}
{% raw %}
<input type="text" id="demo"/>
{% endraw %}
{% endhighlight %}

Then we create an Observable that emits every time that the value of our input changes.

{% highlight js %}
{% raw %}
let demoInput = document.querySelector('#demo')
let obs = Rx.Observable.fromEvent(demoInput, 'input');
obs.subscribe(value => console.log(value));
{% endraw %}
{% endhighlight %}

The payload of the Observable is the plain old event object that is provided by the `input` event of the browser. But that may not match what we are most interested in. What if we are more interested in the current value of the input? The `map` operator lets us project the payload of the Observable into something else. All it takes to project the payload is this tiny change.

{% highlight js %}
{% raw %}
let obs = Rx.Observable.fromEvent(demoInput, 'input')
                       .map(e => e.target.value);  
{% endraw %}
{% endhighlight %}

We can go on and chain `map` calls to project the data even further. For instance, it may be more convenient to work with a data structure that carries the value among with the length of the string.
{% highlight js %}
{% raw %}
let obs = Rx.Observable.fromEvent(demoInput, 'input')
                       .map(e => e.target.value)
                       .map(v => {
                         return {
                           value: v,
                           length: v.length
                         };
                       });
{% endraw %}
{% endhighlight %}

Of course we could have done the same in the first `map` call already but it's sometimes more readable to break things into multiple steps. We also often use different operators in between of two `map` calls (e.g to filter something out).

If you like to play a bit with the operator yourself, here is a working demo.

<iframe src="http://embed.plnkr.co/iWR9b2s4wd0pZSOEfHuR/"></iframe>


Now that we got the `map` operator out of the way, watch out for the next article of this series where we'll take a look at the related `flatMap` operator.
