---
layout: post
title: 'Exploring Rx Operators: map'
imageUrl: ../assets/images/banner/rx-map.jpg
date: 2016-05-16T00:00:00.000Z
summary: >-
  This is the first article that is part of a new series where we take a look at
  different operators of the Reactive Extensions for JavaScript.
categories:
  - angular
tags:
  - angular2
  - rx
author: christoph_burgdorf
related_posts:
  - Taming snakes with reactive streams
  - 'Exploring Rx Operators: flatMap'
  - RxJS Master Class and courseware updates
  - Advanced caching with RxJS
  - Angular Master Class - Redux and ngrx
  - Three things you didn't know about the AsyncPipe
related_videos:
  - '181311615'
  - '181311609'
  - '181311613'
  - '181311611'
  - '181311614'
  - '181311616'

---

In [Taking advantage of Observables Part one](/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html) and [two](/angular/2016/01/07/taking-advantage-of-observables-in-angular2-pt2.html) we already highlighted the importance of Observables in Angular. We believe that mastering Observables can make a key difference in how we write our applications. Well, if you agree, here are some good news! This article is the first of a series of posts where we'll explore operators of the Reactive Extensions for JavaScript (RxJS) and their practical applications.

The first operator we want to explore is the most commonly used one: `map`.

## Understanding the `map` operator

We've probably all used `map` before when we were working with arrays. The idea is that each
item in the collection will potentially be projected into a different value.

Here is a very simple example where an array of numbers is transformed so that each number is multiplied by 10.

```js
let values = [1, 2, 3];

let transformed = values.map(value => value * 10);

//prints [10, 20, 30]
console.log(transformed);
```

By now we may be wondering what that has to do with Observables and the `map` operator that is part of RxJS.

Observables are very much like arrays in a way. Well, they are actually more like Iterators but let's not get lost in the details. The key point to understand is that both represent a sequence of values. The key difference is that with Arrays/Iterators you *pull* values out as you want to work with them whereas with Observables you get values **pushed** to you as they arrive.

It's this similarity that allows us to take advantage of pretty much all operators that we know from the pull-based world and apply them to the push-based world.

## `map` and Observables

Let's start with a little demo. All we need is a simple `<input>` element to enter some text.

```html
<input type="text" id="demo"/>
```

Then we create an Observable that emits every time that the value of our input changes.

```js
let demoInput = document.querySelector('#demo')
let obs = Rx.Observable.fromEvent(demoInput, 'input');

// Activate the observable and log all 'pushed' events
obs.subscribe(event => console.log(event));
```

The payload of the Observable is the plain old Event object that is provided by the `input` event of the browser. But that may not match what we are most interested in. What if we are more interested in the current value of the input? The `map` operator lets us project the payload of the Observable into something else. All it takes to project the payload is this tiny change.

```js
let obs = Rx.Observable.fromEvent(demoInput, 'input')
                       .map(e => e.target.value);
```

We can go on and chain `map` calls to project the data even further. For instance, it may be more convenient to work with a data structure that carries the value among with the length of the string.
```js
let obs = Rx.Observable.fromEvent(demoInput, 'input')
                       .map(e => e.target.value)
                       .filter( value => value > 100 )
                       .map(v => {
                         return {
                           value: v,
                           length: v.length
                         };
                       });
```

Of course, we could have done the same in the first `map` call. But it's sometimes more readable to break things into multiple steps. Notice that often we also use different operators in between of two `map` calls (e.g to filter something out).

If you like to play a bit with the operator yourself, here is a working demo.

{% include plunk.html url="http://embed.plnkr.co/iWR9b2s4wd0pZSOEfHuR/" %}

At this point, you may think that Observables are really just a minor enhancement on the Observer or Promise patterns... better suited to handle a sequence of events rather than a single callback. And the `.map()` function certainly does not - at first glance - seem to offer any added-value. The power of Observables is revealed when you start using Rx operators to transform, combine, manipulate, and work with sequences of items emitted by Observables.

These operators allow you to compose asynchronous sequences together in a declarative manner with all the efficiency benefits of callbacks but without the drawbacks of nesting callback handlers that are typically associated with asynchronous systems.

We will see that in future articles. Watch out for the next article of this series where we'll build upon this lesson with `map()` and take a look at the related `flatMap` operator.
