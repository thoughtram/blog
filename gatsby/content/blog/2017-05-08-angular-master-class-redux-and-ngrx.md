---
layout: post
title: Angular Master Class - Redux and ngrx
imageUrl: ../assets/images/banner/ngrx_slide_logo.jpg
date: 2017-05-08T00:00:00.000Z
summary: >-
  Today we're super excited to announce that we finished working on our new
  Angular Master Class courseware. Read on for more information!
categories:
  - angular
tags:
  - angular2
  - observables
  - rx
  - ngrx
  - redux
author: pascal_precht
related_posts:
  - Taming snakes with reactive streams
  - 'Exploring Rx Operators: flatMap'
  - RxJS Master Class and courseware updates
  - Taking advantage of Observables in Angular 2 - Part 2
  - Taking advantage of Observables in Angular
  - Advanced caching with RxJS
related_videos:
  - '181311615'
  - '181311609'
  - '181311613'
  - '181311611'
  - '181311614'
  - '181311616'

---

Despite some appearances at [ng-conf](https://www.ng-conf.org/) and [Jazoon Conference](http://jazoon.com/), it's been a little bit quiet around us since [the last time we blogged](/angular/2017/02/27/three-things-you-didnt-know-about-the-async-pipe.html). You might have read our [announcement about the upcoming Angular Master Class](/announcements/2017/05/05/announcing-angular-master-class-in-denmark.html) in Denmark, however, apart from that, many people have been wondering what we've been up to these days and what's the reason for not publishing Angular articles at the pace we usually do. Let's get straight to the point: We've been working super hard on some very exciting things. One of these things is - you probably guessed it - **brand new Angular Master Class courseware**, and we can't wait to see it in action in our upcoming classes!

<img src="/images/banner/ngrx_slide_logo.jpg" alt="Redux and ngrx banner">

## What's new?

We've seen a lot of interest in topics around architecture and state management in bigger Angular applications. Common questions regarding this topic are "*How to manage state across many components that deal with different kinds of data?*" or "*How do we ensure a robust and predictable data flow?*". That's why we decided to extend the Angular Master Class experience with additional courseware on [Redux](http://redux.js.org/) and [ngrx](https://github.com/ngrx). You've probably heard of both, if not, here's a brief primer:

**Redux** is a pattern that let's us implement a predictable state container for our applications. **ngrx** is a library for Angular that implements Redux in a reactive fashion by using Observable APIs.

Hence, the courseware is split up into two parts. While the first part focusses on understanding Redux as a design pattern, how an implementation could look like, and how the redux library can be used in an application to take advantage of this pattern, the second part explores ngrx as the most appropriate solution for Angular applications, as it integrates perfectly with its reactive APIs.

To give you a better idea, here's a rough overview of **part one**:

- Understanding Redux, Stores, Dispatchers and Actions
- Implementing a custom Redux store
- Using redux as implemented library in an Angular application
- Applying middleware for side effects
- Learning how to deal with deferred and asynchronous actions

**Part two** discusses the following things:

- What is ngrx and how does it compare to redux
- Setting up ngrx stores and creating an dispatching actions
- Building and using store selectors
- Improving performance with reselect queries
- Applying third-party and custom middleware
- Dealing asynchronous actions using ngrx Effects
- Creating facade architectures for better reusability
- Devtools

## Who is this training for?

We consider this additional courseware as one of the more advanced topics, especially because the ngrx requires knowledge that goes far beyond the basics. This means, this training is for you if you've already attended one of our Angular Master Classes.

## When will we teach it?

**It's really up to you!** As always, we put a lot of time into figuring out how the new courseware can fit into the existing one and we think we came up with the best possible solution for our setup.

The courseware is built in a way that it can either form a full isolated single-day training, or, being part of the bigger Angular Master Class experience. This means, if you've already attended one of our 3-day classes, **this is the right time to reach out to us** to discuss training on Redux and ngrx on top of that!

## What else are we working on?

Of course we don't stop here. There's even more courseware material in the making that's almost finished, and we know, almost everyone needs it.

Make sure to follow us on [Twitter](http://twitter.com/thoughtram) and [Facebook](http://facebook.com/thoughtram) or subscribe to our blog, to get notified when we announce it in the next couple of weeks!
