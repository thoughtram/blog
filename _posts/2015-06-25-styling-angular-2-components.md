---
layout: post
title: Styling Angular components
relatedLinks:
  - title: Exploring Angular 2 - Article Series
    url: /exploring-angular-2
  - title: Futuristic Routing in Angular
    url: /angularjs/2015/02/19/futuristic-routing-in-angular.html
  - title: Dependency Injection in Angular 2
    url: /angular/2015/05/18/dependency-injection-in-angular-2.html
  - title: Developing a zippy component in Angular 2
    url: /angular/2015/03/27/building-a-zippy-component-in-angular-2.html
  - title: Developing a tabs component in Angular 2
    url: /angular/2015/04/09/developing-a-tabs-component-in-angular-2.html
date: 2015-06-25T00:00:00.000Z
update_date: 2016-08-23T00:00:00.000Z
summary: >-
  In this article we are going to explore the different possible ways of styling
  Angular 2 components.
categories:
  - angular
tags:
  - angular2
topic: views
author: pascal_precht
related_posts:
  - RxJS Master Class and courseware updates
  - Advanced caching with RxJS
  - Custom Overlays with Angular's CDK - Part 2
  - Custom Overlays with Angular's CDK
  - Easy Dialogs with Angular Material
  - A web animations deep dive with Angular
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

Until now, we mostly talked about how to create simple components in Angular, like a [zippy](/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) or a [tabs](/angular/2015/04/09/developing-a-tabs-component-in-angular-2.html) component, and we also covered some isolated parts of the framework like the new [dependency injection](/angular/2015/05/18/dependency-injection-in-angular-2.html). In this article we are going to discuss another essential part when it comes to building components: **Styling**.

A component in Angular is basically a controller class with a template. But as all of us know, a component also needs it's own styles, especially when it comes to sharing reusable components across applications, which is what we want to achieve in the modern web anyways, right?

We can always write our CSS code in a way, that it is modular and easily extensible at the same time. However, if we don't rely on technologies like Web Components, our styles all end up concatenated and minified in the head of our HTML document, without our components actually knowing that they exist. This is actually good when we think in separation of concerns, on the other hand, if we build a component and want to share it, it should come packaged with all the needed styles, scoped to that component.

Angular components are designed with exactly that in mind. A component comes with HTML, JavaScript but also has it's own styles that belong to it. All we need to do is to define the styles in our component, or at least declare, where to get those from. In fact, there are three ways to associate CSS styles to a component in Angular: **Component inline styles**, **style urls** and **template inline styles**. Let's explore them one by one.

## Component inline styles

The easiest way to add styles to a component is taking advantage of the `@Component` decorators that allow us to define component inline styles. All we need to do is to add a `styles` property to the decorator and define the styles. To see what that looks like, here's a snippet of our zippy component that we've built a while ago.

{% highlight js %}
@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html',
  styles: [`
    .zippy {
      background: green;
    }
  `]
})
class ZippyComponent {
  @Input() title: string;
}
{% endhighlight %}

This is pretty straight forward. You might wonder though, why the value of that property is a list and not just a (multi-line) string. Well, I wonder too. That's why I asked the [question](https://github.com/angular/angular/issues/2730) right away.

Okay, so defining styles on the component is pretty clear, but where did those end up in the DOM? If we run this code in our browser, we see that there's something very interesting happening. It turns out that Angular takes the defined styles, and writes them into the head of the HTML document. Here's what that looks like:

{% highlight html %}
<!DOCTYPE html>
<html>
  <head>
    <style>
      .zippy { 
        background: green;
      }
    </style>
  </head>
  <body>
  ...
  </body>
</html>
{% endhighlight %}

What's going on there? The reason why Angular takes our styles and puts them up there, is because of the **View Encapsulation** that we are using. Since Angular 2.x, it comes with three different view encapsulation types in order to support both, browsers that don't support Shadow DOM, and also the ones that do support it. The view encapsulations <s>will be explored in another article</s> are covered in [this article](/angular/2015/06/29/shadow-dom-strategies-in-angular2.html), but we have to touch on this though in order to understand why this is happening.

Angular currently uses the `Emulated View Encapsulation` by default. Which basically means, there's no usage of any Shadow DOM at all. One of the nice features of Shadow DOM is style encapsulation. It allows us to scope styles to a specific component without affecting the outer world.

To take advantage of style encapsulation, styles have to be put into the `shadowRoot` of a component. Due to the Shadow DOM strategy that is used, there is no `shadowRoot` to put our styles into. That's why Angular writes them into the head. But as mentioned, there's another article that explains all three view encapsulations.

Let's take a look at another way of adding styles to our component.

## Styles urls

In an ideal world, we don't have to mix our styles with our application code. That's why we have the `<link>` tag, that allows us to fetch and embed a stylesheet from a server. Angular components allow us to define `styleUrls`, so that styles don't have to be written into the component. Pretty straight forward, here's an example:

{% highlight js %}
@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html',
  styleUrls: ['my-zippy.component.css']
})
class ZippyComponent {
  @Input() title: string;
}
{% endhighlight %}

Where do **those** end up in the DOM? Well, for the same reason as explained earlier, they are written into the head of the document. But not only that, when Angular fetches the style resources, it takes the text response, inlines and appends them after all component inline styles. So if we would have a configuration like this:

{% highlight js %}
@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html',
  styles: ['.zippy { background: green; }'],
  styleUrls: ['my-zippy.component.css']
})
class ZippyComponent {
  @Input() title: string;
}
{% endhighlight %}

And the `my-zippy.component.css` content would look like this:

{% highlight js %}
.zippy {
  background: blue;
}
{% endhighlight %}

We will end up with a document head that looks something like this:

{% highlight html %}
<!DOCTYPE html>
<html>
  <head>
    <style>
      .zippy { 
        background: green;
      }
    </style>
    <style>.zippy {
      background: blue;
    }
    </style>
  </head>
  <body>
  ...
  </body>
</html>
{% endhighlight %}

This also brings us to the next conclusion that styles defined in style urls will always be appended and therefore override styles defined in the component, unless the inline styles don't have a higher specificity.

Last but not least, we have template inline styles.

## Template inline styles

We can for sure always write our styles directly into the DOM, nobody can prevent us from doing that. In fact, when thinking in Web Components it's quite common to put styles directly into the template of a component, since they will be encapsulated when Shadow DOM is used.

Translating the styles used above to template inline styles would look something like this (in case of our zippy component):

{% highlight html %}{% raw %}
<style>
  .zippy {
    background: red;
  }
</style>
<div class="zippy">
  <div (click)="toggle()" class="zippy__title">
    {{ visible ? '&blacktriangledown;' : '&blacktriangleright;' }} {{title}}
  </div>
  <div [hidden]="!visible" class="zippy__content">
    <content></content>
  </div>
</div>
{% endraw %}
{% endhighlight %}

Guess what, also those will be appended in the head of our document, after the ones defined in the component or as style urls. Template inline styles always have the highest priority, which sounds pretty straight forward to me.
