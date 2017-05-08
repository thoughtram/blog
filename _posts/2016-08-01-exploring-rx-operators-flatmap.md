---
layout: post
title: 'Exploring Rx Operators: flatMap'
imageUrl: /images/banner/rx-flatmap.jpeg
date: 2016-08-01T00:00:00.000Z
summary: >-
  Another post in a series of articles to discover the magic of different Rx
  operators. In this article we like to learn about the very powerful flatMap
  operator.
categories:
  - rx
tags:
  - rx
author: christoph_burgdorf
related_posts:
  - Angular Master Class - Redux and ngrx
  - Three things you didn't know about the AsyncPipe
  - Cold vs Hot Observables
  - 'Exploring Rx Operators: map'
  - Taking advantage of Observables in Angular 2 - Part 2
  - Taking advantage of Observables in Angular
related_videos:
  - '181311615'
  - '181311609'
  - '181311613'
  - '181311611'
  - '181311614'
  - '181311616'

---


This is another post in a series of articles to discover the magic of different Rx operators. In our last article, [Exploring Rx Operators: map](/angular/2016/05/16/exploring-rx-operators-map.html) we learned how we can map the notifications of Observables to create other more meaningful Observables.

Today we like to move our attention to another very important and also related operator, namely `flatMap`. In the same way that the `map` operator is closely related to the `map` function that we know from Arrays, `flatMap` should sound familiar to many people who worked with collections in a functional programming kind of way. In fact, the similarity is so strong that it makes sense to first move our attention to a collection based example.

<div id="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>



## Understanding `flatMap` for collections

Consider the following collection of invoices where each invoice has a property `positions` holding the individual items of the invoice. That's a pretty common (yet simplified) structure of pretty much every e-commerce system out there.

{% highlight js %}
{% raw %}
let invoices = [{
    id: 1,
    date: '07-29-2016',
    customerId: 4711,
    positions: [
      { id: 1, title: 'Superhero shirt' },
      { id: 2, title: 'Batman mask' }
    ]
  },{
    id: 2,
    date: '07-29-2016',
    customerId: 4712,
    positions: [
      { id: 1, title: 'Batman car' },
      { id: 2, title: 'Spiderman suit' }
    ]
  }
]
{% endraw %}
{% endhighlight %}

What if we are interested in a collection of all *positions*? Of course we could simply loop through all invoices and push the positions into a new shared collection.

{% highlight js %}
{% raw %}
let positions = [];

for (let inv of invoices) {
  positions.push(inv.positions);
}

console.log(positions);
{% endraw %}
{% endhighlight %}

But [that's](http://jsbin.com/ziveloviqa/edit?js,console) very imperative and focuses a lot on the actual implementation. What we rather like to have is a declarative solution that focuses on *what* we want to achieve. Coming from a collection of invoices, we want to retrieve a collection of positions.  

In the functional programming world there's a `flatMap` function for exactly this use case.

Unfortunately native JavaScript Arrays don't have a `flatMap` function yet. However, we can reach for the popular [lodash](http://lodash.com) library and rewrite the code to use `flatMap` with that.

{% highlight js %}
{% raw %}
let positions = _.flatMap(invoices, inv => inv.positions);

console.log(positions);
{% endraw %}
{% endhighlight %}

We just [replaced](http://jsbin.com/cuwowuliru/edit?html,js,console) four lines of code with a single one that is far easier to follow. This declarative solution doesn't move our intention to the actual implementation. We don't even know whether it's using a for loop behind the scenes or not. Once you become familar with the vocabulary the code becomes much easier to understand then it's imperative counterpart. Pretty neat, no?

What `flatMap` does is, it goes through each invoice in our collection and applies our function which maps to the array of positions. It then flattens all the positions into a single collection, hence the name `flatMap`. Just to make it very clear: A simple `map` isn't suitable here because it would leave us with an array of arrays which is not quite what we want.

By now you may be wondering what this has to do with `flatMap` from the Rx library. The good news is, if you've understand the example above, understanding `flatMap` for Observables isn't a far stretch. In fact, it's very similar.

## Understanding `flatMap` for Observables

Remember that Observables are very much like collections with the difference that items are *pushed* to us as they arrive instead of being pulled out. In our example above we had a collection of invoices where each invoice had a collection of positions. Can we have an Observable of invoices where each invoice has an Observable of positions? Well, we could make that up but it would suggest that we have invoices where the positions may arrive asynchronously.

A better suited example may be an Observable of tweets where each tweet has an Observable of like actions. A `LikeAction` is a simple enum with two variants `Like` and `Unlike`.

{% highlight js %}
{% raw %}
enum LikeAction {
  Like = 1,
  Unlike = -1
}
{% endraw %}
{% endhighlight %}

We can assign the values `1` and `-1` to the variants so that we can easily accumulate a total count of them later.

A `Tweet` is a simple class with a `text` property of type `string` and a `likes` property of type `Observable<LikeAction>`.

{% highlight js %}
{% raw %}
class Tweet {
  likes = new Rx.Subject<LikeAction>();
  constructor (public text: string) {}
}
{% endraw %}
{% endhighlight %}

Don't get confused by the use of `Subject` here. A subject is an `Observable` that one can not only subscribe to but also raise notifications on which is exactly what we need to mock the actions.

Now that we have our basic models we can create an `Observable<Tweet>` and save a reference to it. Again, we're using `Subject` for the purpose of mocking out our notifications.

{% highlight js %}
{% raw %}
let tweets = new Rx.Subject<Tweet>();
{% endraw %}
{% endhighlight %}

Tweets are pushed through the `Observable<Tweet>` as they arrive. Whenever someone likes or unlikes a tweet the `Observable<LikeAction>` on that tweet pushes a new notification.

To make a tweet we have to create an instance of `Tweet` and pass it to `next` on our tweets `Subject`.
{% highlight js %}
{% raw %}
let firstTweet = new Tweet('first tweet');
tweets.next(firstTweet);
{% endraw %}
{% endhighlight %}

Adding or removing likes is as simple as calling `likes.next(val)` with either `LikeAction.Like` or `LikeAction.Unlike`.

{% highlight js %}
{% raw %}
//increases likes
firstTweet.likes.next(LikeAction.Like);

//decreases likes
firstTweet.likes.next(LikeAction.Unlike);
{% endraw %}
{% endhighlight %}

Now that we have set up the ground work let's come to the interesting part. We like to be able to keep track of all likes/unlikes so that we can show the total number of likes of all tweets.

Remember the imperative for loop that we wrote in the previous example to collect all positions manually? We could kind of do the same here to calculate the total number of likes [manually](http://jsbin.com/yoximomuji/1/edit?js,console).

{% highlight js %}
{% raw %}
let likeCount = 0;
tweets.subscribe(tweet => {
  tweet.likes.subscribe(likeAction => {
    likeCount = likeCount + likeAction;
    console.log(`Total Likes: ${likeCount}`);
  });
});
{% endraw %}
{% endhighlight %}

>**Special tip:** Don't get confused, the fact that we can accumulate our `LikeActions` is simply because we assigned `1` and `-1` to them.

But just as we used `flatMap` to get one single collection of positions of all the invoices we can use `flatMap` [here](http://jsbin.com/lupazehuve/1/edit?js,console) to get one single `Observable` for all like actions of all the tweets.

{% highlight js %}
{% raw %}
let likeCount = 0;
tweets.flatMap(tweet => tweet.likes)
      .subscribe(like => {
        likeCount = likeCount + like;
        console.log(`Likes: ${likeCount}`);
      });
{% endraw %}
{% endhighlight %}

>**Special tip:** This is a perfect use case for the `scan` operator which can help us to get rid of the manual book-keeping in the `likeCount` variable. But let's not get ahead of ourselves.

So what does the above code do? For each tweet that gets pushed to us `flatMap` maps to the `Observable<LikeAction>` on the `likes` property. It subscribes to these Observables and flattens the notifications into a single `Observable<LikeAction>` that we can then subscribe to.

The full working code of our example looks like this.

{% highlight js %}
{% raw %}
enum LikeAction {
  Like = 1,
  Unlike = -1
}

class Tweet {
  likes = new Rx.Subject<LikeAction>();
  constructor (public text: string) {}
}

let tweets = new Rx.Subject<Tweet>();
let likeCount = 0;

tweets.subscribe(tweet => console.log(tweet.text));

tweets.flatMap(tweet => tweet.likes)
      .subscribe(likeAction => {
        likeCount = likeCount + likeAction;
        console.log(`Total Likes: ${likeCount}`);
      });

let firstTweet = new Tweet('first tweet');
let secondTweet = new Tweet('second tweet');

tweets.next(firstTweet);
tweets.next(secondTweet);

firstTweet.likes.next(LikeAction.Like);
secondTweet.likes.next(LikeAction.Like);
secondTweet.likes.next(LikeAction.Like);
secondTweet.likes.next(LikeAction.Unlike);
{% endraw %}
{% endhighlight %}

When we run the code we see the following output.

{% highlight js %}
{% raw %}
first tweet
second tweet
Total Likes: 1
Total Likes: 2
Total Likes: 3
Total Likes: 2
{% endraw %}
{% endhighlight %}


## Conclusion

Observables are really powerful. They allow us to to compose asynchronous tasks in a functional reactive way. Because they share so many similarities with collections we can apply a lot of our knowledge from popular libraries such as lodash.
