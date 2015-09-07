---
layout:     post
title:      "View Encapsulation in Angular 2"
relatedLinks:
  -
    title: "Styling Angular 2 components"
    url: "http://blog.thoughtram.io/angular/2015/06/25/styling-angular-2-components.html"
  -
    title: "Dependency Injection in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html"
date:       2015-06-29
update_date: 2015-09-05
summary:    "Angular 2 has been rewritten from scratch to take advantage of a lot of new technologies that are coming to the web. One of those technologies are Web Components. In fact, Web Components is a set of four technologies: HTML Imports, Templates, Shadow DOM and Custom Elements. Angular uses templates for structural DOM changes, and Shadow DOM for styles and DOM encapsulation. This article explores Angular 2's view encapsulation  and how we can use it."

categories: 
  - angular

tags:
  - angular2

topic: views

author: pascal_precht
---

{% include breaking-changes-hint.html %}

In our article on [styling Angular 2 components](http://blog.thoughtram.io/angular/2015/06/25/styling-angular-2-components.html) we learned how styles are applied to our component when defining them in different ways. We mentioned that all our component styles are appended to the document head, but usually would end up in the component's template, in case we use native Shadow DOM. This article explains not only how we can tell Angular to use native Shadow DOM, but also what the other view encapsulation solutions are, that the framework comes with and why they exist.

## Understanding Shadow DOM

Before we get started and take a look at how to use Angular's different view encapsulation types, we need to understand what Shadow DOM actually is, what it makes so awesome and why we want to use it. We won't have a super deep dive here, since there are a lot of great resources out there already. If you want to start from scratch and learn Shadow DOM 101, which you really should in case this is new to you, [Eric Bidelman](http://twitter.com/ebidel) has written one of the best [guides](http://www.html5rocks.com/en/search?q=Shadow+DOM) over at [html5rocks.com](http://html5rocks.com).

In one sentence, Shadow DOM is part of the Web Components standard and enables DOM tree and style encapsulation. DOM tree and style encapsulation? What does that even mean? Well, it basically means that Shadow DOM allows us to hide DOM logic behind other elements. Addition to that, it enables us to apply **scoped styles** to elements without them bleeding out to the outer world.

Why is that great? We can finally build components that expose a single (custom) element with hidden DOM logic under the hood, and styles that only apply to that element - a web component. Just think of an `<input type="date">` element. Isn't it nice that we can just use a single tag and the browser renders a whole date picker for us? Guess with what you can achieve that...

## Shadow DOM in Angular 2

Now that we got an idea of what Shadow DOM is (and trust me, there is so much more to cover), we can take a look at how Angular 2 actually uses it.

As we know, in Angular 2 we build components. A component is a controller class with a template and styles that belong to it. Those components can be shared across applications if they are general enough. That means, Angular 2 already embraces the idea of building applications in components and making them reusable. However, components in Angular are not web components per se but they take advantage of them as mentioned earlier.

Whenever we create a component, Angular puts it's template into a `shadowRoot`, which is the Shadow DOM of that particular component. Doing that, we get DOM tree and style encapsulation for free, right? But what if we don't have Shadow DOM in the browser? Does that mean we can't use Angular 2 in those environments? **We can.** In fact, Angular 2 doesn't use native Shadow DOM by default, it uses an emulation. To be technically correct, it also doesn't create a `shadowRoot` for our components in case no native Shadow DOM is used.

The main reason for that is that most browsers simply don't support Shadow DOM yet, but we should still be able to use the framework. Even better, we can easily tell Angular to use the native Shadow DOM if we want. So how is that implemented and what do we need to do?

## View Encapsulation Types

Angular 2 comes with view encapsulation built in, which enables us to use Shadow DOM or even emulate it. There are three view encapsulation types:

- **ViewEncapsulation.None** - No Shadow DOM at all. Therefore, also no style encapsulation.
- **ViewEncapsulation.Emulated** - No Shadow DOM but style encapsulation emulation.
- **ViewEncapsulation.Native** - Native Shadow DOM with all it's goodness.

You might wonder why we have three types. Why not just one for native Shadow DOM support and another one that doesn't use Shadow DOM? Things become more clear when we explore how they affect the way Angular applies styles to components. Let's try them out one by one.

**ViewEncapsulation.None**

Angular doesn't use Shadow DOM at all. Styles applied to our component are written to the document head. We talked about that in a more detail in [styling Angular 2 components](http://blog.thoughtram.io/angular/2015/06/25/styling-angular-2-components.html), but to make a quick recap, having a zippy component with styles like this (note that we set the `encapsulation` property in our `@View` decorator):

{% highlight js %}
import {ViewEncapsulation} from 'angular2/angular2';

@Component({
  selector: 'zippy',
  properties: ['title']
})
@View({
  templateUrl: 'zippy.html',
  styles: [`
    .zippy {
      background: green;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
class Zippy { }
{% endhighlight %}

And a template like this:

{% highlight html %}
<div class="zippy">
  <div (click)="toggle()" class="zippy__title">
    {{ visible ? '&blacktriangledown;' : '&blacktriangleright;' }} {{title}}
  </div>
  <div [hidden]="!visible" class="zippy__content">
    <ng-content></ng-content>
  </div>
</div>
{% endhighlight %}
 
Will make Angular creating a DOM like this:

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
    <zippy title="Details">
      <div class="zippy">
        <div (click)="toggle()" class="zippy__title">
          ▾ Details
        </div>
        <div [hidden]="!visible" class="zippy__content">
          <script tyle="ng/contentStart"></script>
            ...
          <script tyle="ng/contentEnd"></script>
        </div>
      </div>
    </zippy>
  </body>
</html>
{% endhighlight %}

Again, this is due to the fact that there's no Shadow DOM. This also means that all the styles apply to the entire document. Or in other words, a component could overwrite styles from another component because its styles are applied to the document head later. That's why this is the **unscoped** strategy. If there was Shadow DOM, Angular could just write all the styles into the `shadowRoot` which will enable style encapsulation.

Also note that the `<ng-content>` tag has been replaced with `<script>` tags that basically act as markers to emulate [content insertion points](http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-301/#toc-distributed-nodes).

**ViewEncapsulation.Emulated**

This view encapsulation is used by default. `ViewEncapsulation.Emulated` emulates style encapsulation, even if no Shadow DOM is available. This is a very powerful feature in case you want to use a third-party component that comes with styles that might affect your application. What happens to our components, and especially to the styles, when this view encapsulation is used? Well, let's first check if the styles are still written to the document head. Here's what the head looks like with the exact same component but different strategy:

{% highlight html %}
<head>
  <style>.zippy[_ngcontent-1] {
  background: green;
  }</style>
</head>
{% endhighlight %}

Looks like styles are still written to the document head. But wait, what's that? Instead of the simple `.zippy` selector that we used, Angular creates a `.zippy[_ngcontent-1]` selector. So it seems like Angular rewrote our component's styles. Let's see what the component's template looks like:

{% highlight html %}
<zippy title="Details" _ngcontent-0 _nghost-1>
  <div class="zippy" _ngcontent-1>
    <div (click)="toggle()" class="zippy__title" _ngcontent-1>
      ▾ Details
    </div>
    <div [hidden]="!visible" class="zippy__content" _ngcontent-1>
      <script type="ng/contentStart" class="ng-binding"></script>
        ...
      <script type="ng/contentEnd"></script>
    </div>
  </div>
</zippy>
{% endhighlight %}

Ha! Angular added some attributes to our component's template as well! We see the `_ngcontent-1` attribute which is also used in our rewritten CSS, but we also have `_ngcontent-0` and `_nghost-1`. So what the hell is going on there?

Actually it's quite simple. We want scoped styles without Shadow DOM right? And that's exactly what happens. Since there's no Shadow DOM, Angular has to write the styles to the head of the document. Okay that's nothing new, we know that from the unscoped strategy. But in order to enable scoped styles, Angular has to make sure that the component's style selectors only match this particlar component and nothing else on the page. That's why it extends the CSS selectors, so they have a higher specificity and don't collide with other selectors defined before at the same. And of course, to make those selectors actually match, the elements in the template need to be extended as well. That's why we see all those `_ngcontent-*` and `_nghost-*` attributes.

Okay cool, now we know how Angular emulates scoped styles, but still, why are those attributes called `_ngcontent-*` and `_nghost-*` and what does the number in the attributes mean? If we take a closer look at the generated template, we can actually see a pattern. The number in the attribute matches the Shadow DOM, or content insertion point, level.

The app that we bootstrap is a component that already uses Shadow DOM (emulation) and therefore has a content insertion point. That means, our root component is already a host element. However, it doesn't get any additional attribute, because Angular is not in charge of rewriting it. We've written it (maybe) as `<app></app>` into our `index.html` and that's it. Our zippy component is also a host element, which is why it get's the `_nghost-1` attribute. Why not `_nghost-0`? Well, that's the one our root component would get. At the same time, the zippy component also gets a `_ngcontent-0` attribute. That's because it is part of the very first content insertion point level in the application, which is the one of our root component. We can confirm that pattern by taking a look at what's inside the zippy element. Every direct child element inside the zippy element is part of the next content insertion point level, which is why they get the `_ngcontent-1` attribute. And so on and so forth.

Not sure what **you** think, but in my opinion, this is a very smart approach.

**ViewEncapsulation.Native**

Last but not least, we have the native Shadow DOM view encapsulation. This one is super simple to understand since it basically just makes Angular using native Shadow DOM. We can activate it the same way we did with the other types. Here's what that looks like:

{% highlight js %}
...
@View({
  templateUrl: 'zippy.html',
  styles: [`
    .zippy {
      background: green;
    }
  `],
  encapsulation: ViewEncapsulation.Native
})
...
{% endhighlight %}

Okay that was easy. If we run our code in the browser, we see that no styles are written to the document head anymore. However, styles do now end up in the component's template inside the shadow root. Here's what that looks like:

{% highlight html %}
<zippy title="Details">
  #shadow-root
  | <style>
  |   .zippy {
  |     background: green;
  |   }
  | </style>
  | <div class="zippy">
  |   <div (click)="toggle()" class="zippy__title">
  |     ▾ Details
  |   </div>
  |   <div [hidden]="!visible" class="zippy__content">
  |     <content></content>
  |   </div>
  | </div>
  "This is some content"
</zippy>
{% endhighlight %}

In order to get an output like this, we need to tell our browser dev tools to display Shadow DOM when inspecting element. No weird attributes anymore. Instead we get a nice shadow root and we can see very nicely how the styles are written into it. 

From here on, all the rules that apply to plain Shadow DOM, apply to our Angular 2 component as well.
