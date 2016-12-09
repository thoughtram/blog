---
layout: post
title: The difference between Annotations and Decorators
date: 2015-05-03T00:00:00.000Z
update_date: 2016-05-12T00:00:00.000Z
summary: >-
  Learn how AtScript annotations differ from TypeScript decorators in this
  article.
categories:
  - angular
tags:
  - angular2
topic: others
author: pascal_precht
relatedLinks:
  - title: Exploring Angular 2 - Article Series
    url: 'http://blog.thoughtram.io/exploring-angular-2'
related_posts:
  - Testing Services with Http in Angular 2
  - Two-way Data Binding in Angular 2
  - Resolving route data in Angular 2
  - Angular 2 Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular 2
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

Last year, the Angular team announced it's ECMAScript language extension AtScript, which adds types and annotations to the language in order to enable better tooling, debugging and overall development experience. Half a year later at ng-conf, the team announced that AtScript becomes TypeScript, which supports annotations and another feature called "decorators".

But how do those annotations actually work? And what are decorators then? This article details the translation of annotations and how they differ from decorators.

## Annotations

Let's start off with annotations. As mentioned, the Angular team announced AtScript  as their language extension to JavaScript. AtScript comes with features like **Type Annotations**, **Field Annotations** and **MetaData Annotations**. We're going to focus on metadata annotations. Let's take a look at the following Angular 2 component to get an idea of what metadata annotations can look like:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'tabs',
  template: `
    <ul>
      <li>Tab 1</li>
      <li>Tab 2</li>
    </ul>
  `
})
export class Tabs {

}
{% endraw %}
{% endhighlight %}

We have a class `Tabs` that is basically empty. The class has one annotation `@Component`. If we'd remove all annotations, what would be left is just an empty class that doesn't have any special meaning right? So it seems that `@Component` add some metadata to the class in order to give it a specific meaning. This is what annotations are all about. They are a declarative way to add metadata to code.

`@Component` is an annotation that tells Angular, that the class, which the annotation is attached to, is a component.

Okay, even if that seems to be quite clear, there are a few questions coming up:

- Where do those annotations come from? This is nothing that JavaScript gives us out of the box right?
- Who defined this annotations called `@Component`?
- If this is part of AtScript, what does that translate to, so we can use it in today's browsers?
 
 Let's answer these one by one. Where do those annotations come from? To answer that question, we need to complete the code sample. `@Component` is something we need to import from the Angular 2 framework like this:

{% highlight javascript %}
{% raw %}
import { 
  ComponentMetadata as Component,
} from '@angular/core';
{% endraw %}
{% endhighlight %}

This pretty much answers our first question. Both annotations are provided by the framework. Let's take a look at what the implementation of those annotations look like:

{% highlight javascript %}
{% raw %}
export class ComponentMetadata extends DirectiveMetadata {

  constructor() {
    ...
  }
}
{% endraw %}
{% endhighlight %}

We can see that `ComponentMetadata` is in fact an implementation detail of the Angular framework. This answers our second question.

But wait. It's just yet another class? How can just a simple class change the way how other classes behave? And why are we able to use those classes as annotations by just prefixing them with an `@` sign? Well, actually we can't. Annotations are not available in browser's of today, which means we need to transpile it to something that *does* run in current browsers.

Even though we have a couple of transpilers we can choose from. Babel, Traceur, TypeScript, ... It turns out there's only one that actually implements annotations as we know them from AtScript: Traceur. Taking the component code from above, this is what it translates to using Traceur:

{% highlight javascript %}
{% raw %}
var Tabs = (function () {
  function Tabs() {}

  Tabs.annotations = [
    new ComponentMetadata({...}),
  ];

  return Tabs;
})
{% endraw %}
{% endhighlight %}

In the end, a class is just a function, which is also just an object, and all annotations end up as instance calls on the `annotations` property of the class. When I said "all" annotations end up there, I actually lied a bit. We can have parameter annotations as well and whose will be assigned to a class' `parameters` property. So if we have code like this:

{% highlight javascript %}
{% raw %}
class MyClass {

  constructor(@Annotation() foo) {
    ...
  }
}
{% endraw %}
{% endhighlight %}

This would translate to something like this:

{% highlight javascript %}
{% raw %}
var MyClass = (function () {
  function MyClass() {}

  MyClass.parameters = [[new Annotation()]];

  return MyClass;
})
{% endraw %}
{% endhighlight %}

The reason why this translate to a nested array, is because a parameter can have more than one annotation.

Okay, so now we know what those metadata annotations are and what they translate to, but we still don't know how something like `@Component` makes a normal class actually a component in Angular 2. It turns out that Angular itself takes care of that. Annotations are really just metadata added to code. That's why `@Component` is a very specific implementation detail of Angular 2. In fact, there are a couple of other annotations that the framework comes with. But also only the framework knows what to do with that information.

Another very interesting learning is that Angular expects the metadata on `annotations` and `parameters` properties of classes. If Traceur would not translate them to those particular properties, Angular 2 wouldn't know from where to get the metadata. Which makes **AtScript Annotations** just a very specific implementation of what annotations could actually be.

Wouldn't it be nicer if you as a consumer could decide where your metadata is attached to in your code? Yes! And this is where decorators come into play.

## Decorators

Decorators are a [proposed standard](https://github.com/wycats/javascript-decorators) for ECMAScript 2016 by Yehuda Katz, to annotate and modify classes and properties at design time. This sounds pretty much like what annotations do right? Well... sort of. Let's take a look at what a decorator looks like:

{% highlight javascript %}
{% raw %}
// A simple decorator
@decoratorExpression
class MyClass { }
{% endraw %}
{% endhighlight %}

Wait. This looks exactly like an AtScript annotation! That's right. But it isn't. From a consumer perspective, a decorator indeed looks like the thing that we know as "AtScript Annotation". There is a significant difference though. **We** are in charge of what our decorator does to our code. Taking the code above, a corresponding decorator implementation for `@decoratorExpression` could look like this:

{% highlight javascript %}
{% raw %}
function decoratorExpression(target) {
   // Add a property on target
   target.annotated = true;
}
{% endraw %}
{% endhighlight %}

Right. A decorator is just a function that gives you access to the `target` that needs to be decorated. Get the idea? Instead of having a transpiler that decides where your annotations go, we are in charge of defining what a specific decoration/annotation does.

This, of course, also enables us to implement a decorator that adds metadata to our code the same way AtScript annotations do (I keep referring to "AtScript annotations" because what they do, is really an AtScript specific thing). Or in other words: with decorators, we can build annotations.

There's a lot more to explore about decorators, but that is out of the scope of this article. I recommend checking out [Yehuda's proposal](https://github.com/wycats/javascript-decorators) to learn more about the feature.

## Does TypeScript support Annotations or Decorators?

As you might know, the Angular team announced earlier this year that they're going to drop the term "AtScript" in favour of TypeScript, since both languages seem to solve the same problems. In addition, there were announcements that TypeScript will support annotations **and** decorators once version 1.5 alpha is out.

It turns out that it actually doesn't. TypeScript supports decorators, but doesn't know about Angular 2 specific annotations. Which makes sense, because they are an implementation detail of Angular. That also means that either we as consumers, or the framework needs to provide those decorators in order to make the code compile. Only the latter really makes sense. Luckily, generators for both, annotation and parameter decorators, have landed in the Angular 2 code base lately. So what the framework behind the scenes does is, it comes with metadata annotation implementations, which are then passed to the decorator generator to make decorators out of them. That's also why we have to write the following code when transpiling with traceur:

{% highlight javascript %}
{% raw %}
import {
  ComponentMetadata as Component
} from '@angular/core';
{% endraw %}
{% endhighlight %}

As we can see, we're actually importing the metadata rather than the decorator. This is simply just because traceur doesn't understand decorators, but does understand `@Component` annotations. Which is why we're also importing them with these namespaces respectively.


## Conclusion

"AtScript Annotations" and decorators are nearly the same thing. From a consumer perspective we have exactly the same syntax. The only thing that differs is that we don't have control over how AtScript annotations are added as metadata to our code. Whereas decorators are rather an interface to build something that ends up as annotation. Over a long term, however, we can just focus on decorators, since those are a real proposed standard. AtScript is deprecated, and TypeScript implements decorators.

I hope this article made some things clear though.
