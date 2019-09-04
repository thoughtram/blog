---
layout: post
title: Multiple Transclusion and named Slots
date: 2015-11-16T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  One of those bigger features in the 1.5 release is multiple transclusion via
  named slots. In this article we're going to discuss what it's all about.
categories:
  - angular
tags:
  - angular
author: pascal_precht
related_posts:
  - "The How and Why on using dynamic Angular components inside your custom\_widgets"
  - 'Exploring Angular 1.5: Lifecycle Hooks'
  - Sponsoring AngularConnect. Again.
  - ngMessageFormat - Angular's unheard feature
  - Service vs Factory - Once and for all
  - Taking Angular Master Class to the next level
related_videos:
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'
  - '189613148'
  - '189603515'

---

With the upcoming final 1.5 release of the AngularJS framework, tons of new features, improvements and bug fixes are right around the corner. One of those features is **multiple transclusion via named slots**. While transclusion is already a very nice and powerful feature, with the 1.5 release it's going to be taken to the next level. In this article we're going to discuss what multiple transclusion is all about and how it helps the framework to align more with the web components technologies.

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Understanding Transclusion

We surely don't have to make a huge recap on what transclusion is, since there are tons of resources out there in the internet already and most of us are probably very familiar with that feature. However, just to pick up everyone reading this article, here's what transclusion is (stolen from [Wikipedia](https://en.wikipedia.org/wiki/Transclusion)):

> In computer science, transclusion is the inclusion of part or all of an electronic document into one or more other documents by reference.

Clear, right? Well, not really.

It's actually way simpler than it sounds. In Angular world, when we build directives, transclusion allows us to take the HTML from the outer world, that is in between our directive tags, and insert it somewhere inside our directive template, which the outside world doesn't really know about.

The easiest way to illustrate that is the `<details>` element. `<details>` renders a UI component (in some browers), which we can click on to open and close it.

{% highlight html %}
{% raw %}
<details>
  <p>Hey y'all I've put some content here.</p>
</details>
{% endraw %}
{% endhighlight %}

As you can see, we can put some HTML in between the `<details>` tags and it gets somehow magically projected somewhere else. The thing that makes this possible are **Content Insertion Points** which are part of the **Shadow DOM** specification. They allow us to mark places in an element's template where Light DOM is going to be projected.

Angular's transclusion feature is basically some sort of polyfill for this kind of functionality, however, pretty much implemented in an Angular specific way. It really just works with the framework.

We can easily reimplement a `<details>` element with Angular like this:

{% highlight js %}
{% raw %}
angular.module('myApp', [])

.directive('ngDetails', function () {
  return {
    restrict: 'E',
    scope: {},
    transclude: true,
    template: `
      <div class="summary" ng-click="open = !open">
        {{ open ? '&blacktriangledown;' : '&blacktriangleright;' }} Details
      </div>
      <div class="content" ng-show="open" ng-transclude></div>
    `
  };
});
{% endraw %}
{% endhighlight %}

Setting `transclude` to `true` enables transclusion for the directive, whereas `ng-transclude` in the template tells Angular where to put the HTML from the outside world. Of course, this is a very very simple reimplementation, but it's really just to demonstrate the point of transclusion.

[Tero](http://twitter.com/teropa) has written an [amazing guide](http://teropa.info/blog/2015/06/09/transclusion.html) on transclusion, if you want to dig deeper on that topic I highly recommend his guide.

Even though transclusion is a very neat feature to provide APIs where consumers can hook into, it turns out that there's at least one drawback. We either take everything or nothing. Whenever we use transclusion, there's no way to specify **what** we want to transclude, we always have to take the whole DOM. This is where Shadow DOM and Content Insertion Points really shine.

## Content Selection and Shadow DOM

Shadow DOM uses a `<content>` tag to specify insertion points. If we'd reimplement the `<details>` tag with web components technologies, our component's template could look something like this (simplified):

{% highlight js %}
{% raw %}
<div class="summary">
  Details
</div>
<div class="content">
  <content></content>
</div>
{% endraw %}
{% endhighlight %}

This is more or less the equivalent of transclusion in Angular. However, Shadow DOM takes it even further. It allows us to specify what we want to project into our shadow DOM. This is where the `select` attribute comes into play. Let's say we're only interested in projecting `<h2>` elements, we can update our template with content selection like this:

{% highlight js %}
{% raw %}
<div class="summary">
  Details
</div>
<div class="content">
  <content select="h2"></content>
</div>
{% endraw %}
{% endhighlight %}

Super powerful! The specification has even evolved more with another `<slot>` tag which is a bit more powerful. However, after all it everything boils down to what we've seen so far. 

This is where multiple transclusion comes into play, **with Angular 1.5 we can finally do exactly that**!

## Multiple Transclusion

Multiple transclusion has been proposed a loooong time ago. In fact, Vojta [came up with this](https://github.com/angular/angular.js/issues/4357) over two years ago. Now, thanks to [Pete](https://github.com/angular/angular.js/commit/a4ada8ba9c4358273575e16778e76446ad080054), it's right here. So let's get back to our `<ng-details>` implementation and take a look at it.

The `<details>` tag allows us to configure a "summary" which defaults to `"Details"`. In order to change it, all we have to do is to put a `<summary>` tag inside the `<details>` element like this:

{% highlight html %}
{% raw %}
<details>
  <summary>Click me!</summary>
  <p>Hey y'all I've put some content here.</p>
</details>
{% endraw %}
{% endhighlight %}

This we couldn't do with Angular's transclusion before, because we can't just take all the DOM as it is. We would need to take the `<summary>`, transclude at a specific place in our template, and then we'd need to transclude the rest somewhere else.

With multpile transclusion we can totally do that. We just have to extend our directive a tiny little bit (note that we're using `<span>` as summary element, but you can use whatever you want):

{% highlight js %}
{% raw %}
angular.module('myApp', [])

.directive('ngDetails', function () {
  return {
    restrict: 'E',
    scope: {},
    transclude: {
      'summarySlot': 'span',
    },
    template: `
      <div class="summary" ng-click="open = !open">
        {{ open ? '&blacktriangledown;' : '&blacktriangleright;' }} <span ng-transclude="summarySlot"></span>
      </div>
      <div class="content" ng-show="open" ng-transclude></div>
    `
  };
});
{% endraw %}
{% endhighlight %}

We basically made two changes:

- We changed the `transclude` property to an object which specifies the transclusion slots. The key is the name of a <s>element or directive in camel-case</s> slot we can later use in our template, the value the name of an <s>element or directive in camel-case</s> we want to transclude.
- We replaced the default `"Details"` summary with an element that has `ng-transclude="summarySlot"`. As you can see, `ng-transclude` now excepts a string which is the name of a transclusion slot that we've defined earlier.

The original `ng-transclude` stays as is, since it simply takes the rest to be transcluded. We can now use our `<ng-details>` component like this:

{% highlight html %}
{% raw %}
<ng-details>
  <span>Details</span>
  <p>More content here</p>
</ng-details>
{% endraw %}
{% endhighlight %}

Isn't that cool? Here's the code in action:

{% include plunk.html url="http://embed.plnkr.co/R6s7EYUOJ1NlsDqpt0gP/" %}

We can even make transclusion slots optional by prefixing the element tag name with a `?` like this:

{% highlight html %}
{% raw %}
transclude: {
  'summarySlot': '?span'
}
{% endraw %}
{% endhighlight %}

This is already very cool, but our `ng-details` directive still lacks one specific behaviour. If we don't specify a `<summary>`, `<details>` defaults to `"Details"`. Our component however, doesn't do this. We can provide a fallback summary by simply putting something into the DOM where other elements will be transcluded to:

{% highlight js %}
{% raw %}
<div class="summary" ng-click="open = !open">
  {{ open ? '&blacktriangledown;' : '&blacktriangleright;' }} <span ng-transclude="summarySlot">Details</span>
</div>
{% endraw %}
{% endhighlight %}

Seen what happened? We just put `"Details"` as text into our span element. This text will be replace with the transcluded DOM, if it is applied.

What are you waiting for? Start using multiple transclusion in your directives and design beautful APIs for your consumers!
