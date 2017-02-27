---
layout: post
title: How we run trainings
date: 2015-11-19T00:00:00.000Z
update_date: 2015-11-19T00:00:00.000Z
summary: >-
  People love the way we teach technology to them. In this post we like to shed
  some light on how we actually run our trainings.
categories:
  - announcements
author: christoph_burgdorf
related_posts:
  - Three things you didn't know about the AsyncPipe
  - Using Zones in Angular for better performance
  - Dominic joins thoughtram
  - Making your Angular apps fast
  - Announcing Angular Master Class in Freiburg
  - A revamped Angular Master Class
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

Since we started with thoughtram we have ran plenty of trainings in many different cities and countries. After each workshop we sat down to reflect and discuss the feedback we got. We fine tuned our setup and material again and again over the last couple of months.

It turned out that people really love the way we run our trainings. Many people told us that they attended lots of different workshops but never quite something close to what they experienced with us. We feel flattered by all [the](https://twitter.com/terrible_herbst/status/630744936053391360) [positive](http://jvandemo.com/thoughtram-angular-master-class-review/) [feedback](https://www.facebook.com/thoughtram/reviews/)

While we do have some information about our [Angular Master Class](http://thoughtram.io/angular-master-class.html) and [Git Master Class](http://thoughtram.io/git-master-class.html) on our website we thought you may be interested to get a more in depth view about how we actually run our workshops.

## It's all modular

Just like good software our workshops are organized in a modular fashion. For Angular 1 we have material for up to five days but the modularity of our material enables us to orchestrate topics to bundles of 2 or 3 days length. For in-house workshops the customer is in total control about the planned topics. For public workshops we obviously have to follow the advertised schedule but even then we often have enough room to let the audience decide between a selection of extra topics.

## The digest cycle

Learning new things can be really exhausting. We know it. In order to keep everyone alert and make learning fun we are iterating in a cycle that goes like this.

1. We explain things theoretically using our slide material.
2. We do live demos
3. We let the attendees solve exercises about what they just learned

While one of us is taking the lead as an instructor the other one is observing the chat room to pick up questions or to share links. Since Pascal and I are running most workshops together we usually toggle our roles multiple times per day.

Fun fact: We play music during the exercises blocks and we haven't had a single workshop where no one came to ask for the playlist!

## classroom

Our slides are built up on [reveal.js](https://github.com/hakimel/reveal.js) and while all attendees have access to our slide repositories building and serving the slides by yourself can be a bit cumbersome and simply is a distraction to the attendee. When we started to run workshops we gave out PDFs to our attendees so that they can lookup things in the slides while they try to solve the exercises.

From the feedback we got, we knew that would be something where we could definitely do better.

That's why we built [classroom](http://classroom.thoughtram.io). It's our very own platform to serve our workshop material to the attendees. With classroom, attendees can easily view all slides right from their browser. One thing to highlight here is that attendees get access to all slide decks of the master class even to those that weren't covered in that particular workshop. Also we constantly keep updating and adding new slide decks and attendees automatically have access to the improved material through classroom, too. For example, we just [announced new material](http://blog.thoughtram.io/announcements/2015/10/26/angular-master-class-extended-ngupgrade.html) that teaches how to upgrade from Angular 1 to Angular 2.

<img src="/assets/classroom_login.png" style="width: 350px;"/>
<img src="/assets/classroom_gmc.png" style="width: 350px;"/>
<img src="/assets/classroom_amc.png" style="width: 350px;"/>
<img src="/assets/classroom_digest_cycle.png" style="width: 350px;"/>

When we started to use classroom for our workshops we noticed that the exercise blocks went much smoother. People had an easier time looking up things in the slides and even started sharing links to specific slides in the chatroom (which isn't part of classroom yet).

Authentication for classroom is done via GitHub OAuth and for now is only accessible for people who attended one of our workshops. The project is pretty much in an alpha state but we are rolling with the vibe of *release early, release often*. The frontend is written in Angular 1 using TypeScript and a component oriented approach. You may want to checkout the [code on GitHub](https://github.com/thoughtram/classroom-app). The backend is written in [Rust](http://rust-lang.org) using [nickel.rs](http://nickel.rs) but is not yet publicly available.

In the future we may plan to open up classroom for a broader audience. For now we see it more as a supportive tool for our workshops rather than a polished product to share with the masses though.

If you like us to run a workshop in your city just drop us a line at <hello@thoughtram.io> and get in touch!
