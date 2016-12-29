---
layout: post
title: Developing a zippy component in Angular
relatedLinks:
  - title: Exploring Angular 2 - Article Series
    url: 'http://blog.thoughtram.io/exploring-angular-2'
  - title: Using ES6 with Angular today
    url: >-
      http://blog.thoughtram.io/angularjs/es6/2015/01/23/exploring-angular-1.3-using-es6.html
  - title: Integrating Web Components with AngularJS
    url: >-
      http://pascalprecht.github.io/2014/10/25/integrating-web-components-with-angularjs/
  - title: The difference between Annotations and Decorators
    url: >-
      http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html
demos:
  - url: 'http://embed.plnkr.co/mbJOYS/'
    title: Angular Zippy Component (RC4)
  - url: 'https://embed.plnkr.co/dkorye/'
    title: Angular Zippy Component (RC5)
date: 2015-03-27T00:00:00.000Z
update_date: 2016-12-16T00:00:00.000Z
summary: >-
  Just recently we've built a simple zippy component in Angular 2.0.0 and in
  this article we want to show how. Read on to build your first component.
categories:
  - angular
tags:
  - angular2
topic: getting-started
author: pascal_precht
related_posts:
  - Testing Angular Directives with Custom Matchers
  - Testing Services with Http in Angular
  - Two-way Data Binding in Angular
  - Resolving route data in Angular
  - Angular Animations - Foundation Concepts
  - Angular 2 is out - Get started here
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

<s>Even if Angular 2.0.0 is still in early development, we can already start playing with the code since it's up on GitHub and also published as npm module for early adopters.</sn> We are following the development of Angular 2.0.0 since the beginning on and are also contributing to the project. Just recently we've built a simple zippy component in Angular and in this article we want to show you how.

{% include demos-and-videos-buttons.html post=page %}


<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## Getting started with Angular 2.0.0

There are several options today to get started with Angular. For instance, we can go to [angular.io](http://angular.io) and use the [quickstart](https://angular.io/docs/js/latest/quickstart.html) guide. Or, we can install the [Angular CLI](http://cli.angulario), which takes care of scaffolding, building and serving Angular applications. In this article we will use <s><a href="http://twitter.com/pkozlowski_os" title="Pawel Kozlowski on Twitter">Pawel Kozlowski's</a> <a href="https://github.com/pkozlowski-opensource/ng2-play" title="ng2-play on GitHub">ng2-play repository</a></s> the Angular CLI, but again, you can use whatever suits you.

We start by installing Angular CLI as a global command on our local machine using npm.

{% highlight sh %}
{% raw %}
$ npm install -g angular-cli
{% endraw %}
{% endhighlight %}

Once that is done, we can scaffold a new Angular project by running `ng new <PROJECT_NAME>`. Note that the project is scaffolded in the directory where we're in at this moment.

{% highlight sh %}
{% raw %}
$ ng new zippy-app
{% endraw %}
{% endhighlight %}

Next, we navigate into the project and run `ng serve`, which will essentially build and serve a hello world app on `http://localhost:4200`.

{% highlight sh %}
{% raw %}
$ cd zippy-app
$ ng serve
{% endraw %}
{% endhighlight %}

We open a browser tab on `localhost://4200` and what we see is the text "zippy-app works!". Cool, we're all set up to build a zippy component in Angular!

## Building the zippy component

Before we start building the zippy component with Angular, we need to clarify what we're talking about when using the term "zippy". It turns out that a lot of people think they don't know what a zippy is, even if they do, just because of the naming.

Long story short: this, is a zippy.

{% include plunk.html url="http://embed.plnkr.co/1djdpE5uFLfYpYO8qBnm/preview" %}

Also known as "accordion". You can click the summary text and the actual content toggles accordingly. If you take a look at this particular plunk, you'll see that we actually don't need to do any special implementation to get this working. We have the `<details>` element that does the job for us. But how can we implement such a thing in Angular?

We start off by adding a new file `src/app/my-zippy.component.ts` and creating a class in ES2015 that we export, so it can be imported by other consumers of this class, by using the ES2015 module system. If you're not familiar with modules in ES2015 you might want to read our article on [using ES2015 with Angular today](/angularjs/es6/2015/01/23/exploring-angular-1.3-using-es6.html).

>> **Special Tip**: We would normaly use Angular CLI to generate a component for us, instead of creating the files manually, but this articles focuses on understanding the building blocks of creating a custom component.

{% highlight javascript %}
{% raw %}
export class ZippyComponent {

}
{% endraw %}
{% endhighlight %}

The next thing we want to do, is to make our `ZippyComponent` class an actual component and give it a template so that we can see that it is ready to be used. In order to tell Angular that this particular class is a component, we use something called "Decorators".

Decorators are a way to add metadata to our existing code. Those decorators are actually not supported by ES2015 but have been developed as language extension of the TypeScript transpiler, which is used in this project. We're not required to use decorators though. As mentioned, those are just transpiled to ES5 and then simply used by the framework. However, for simplicity sake we'll use them in this article.

Angular provides us with a couple of decorators so we can express our code in a much more elegant way. In order to build a component, we need the `@Component()` decorator. Decorators can be imported just like classes or other symbols, by using ES2015 module syntax. If you heard about **annotations in traceur** before and wonder how they relate to decorators, you might want to read our article on [the difference between annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html).

{% highlight javascript %}
{% raw %}
import { Component } from '@angular/core';

export class ZippyComponent {

}
{% endraw %}
{% endhighlight %}

The `Component` decorator adds information about what our component's element name will be, what  input properties it has and more. We can also add information about the component's view and template.

We want our zippy component to be usable as `<my-zippy>` element. So all we need to do, is to add a `@Component()` decorator with that particular information. To specify the element name, or rather CSS selector, we need to add a `selector` property that matches a CSS selector.

{% highlight javascript %}
{% raw %}
import { Component } from '@angular/core';

@Component({
  selector: 'my-zippy'
})
export class ZippyComponent {

}
{% endraw %}
{% endhighlight %}

Next, our component needs a template. We add information about the component's view. `templateUrl` tells Angular where to load the component template from. To make `templateUrl` work with relative paths, we add another property `moduleId` with a value `module.id`. To get more information on `moduleId`, make sure to check out our article on [Component-Relative Paths in Angular](/angular/2016/06/08/component-relative-paths-in-angular-2.html)

{% highlight javascript %}
{% raw %}
import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html'
})
export class ZippyComponent {

}
{% endraw %}
{% endhighlight %}

Later at runtime, when Angular compiles this component, it'll fetch `my-zippy.component.html` asynchronously. Let's create a file `src/app/my-zippy.component.html` with the following contents:

{% highlight html %}
{% raw %}
<div class="zippy">
  <div class="zippy__title">
    &blacktriangledown; Details
  </div>
  <div class="zippy__content">
    This is some content.
  </div>
</div>
{% endraw %}
{% endhighlight %}

CSS classes can be ignored for now. They just give us some semantics throughout our template.

Alright, believe it or not, that's basically all we need to do to create a component. Let's use our zippy component inside the application. In order to do that, we need to do things:

- Add our new component to the application module
- Use `ZippyComponent` in `ZippyAppComponent`'s template
 
Angular comes with a module system that allows us to register directives, components, service and many other things in a single place, so we can use them throughout our application. If we take a look at the `src/app/app.module.ts` file, we see that Angular CLI already created a module for us.  To register `ZippyComponent` on `AppModule`, we import it and add it to the list `AppModule`'s declarations:

{% highlight javascript %}
{% raw %}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ZippyAppComponent } from './zippy-app.component';
import { ZippyComponent } from './my-zippy.component';

@NgModule({
  imports: [BrowserModule],
  declarations: [ZippyAppComponent, ZippyComponent], // we're adding ZippyComponent here
  bootstrap: [ZippyAppComponent]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

We don't worry too much about the `imports` for now, but we acknowledge that Angular needs `BrowserModule` to make our app run in the browser. The `declarations` property defines all directives and pipes that are used in this module and `bootstrap` tells Angular, which component should be bootstrapped to run the application. `ZippyAppComponent` is our root component and has been generated by Angular CLI as well, `ZippyComponent` is our own custom component that we've just created.

Now, to actually render our zippy component in our application, we need to use it in `ZippyAppComponent`'s template. Let's do that right away:

{% highlight javascript %}
{% raw %}
import { Component } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'zippy-app',
  template: '<my-zippy></my-zippy>'
})
export class ZippyAppComponent {

}
{% endraw %}
{% endhighlight %}

Nice! Running this in the browser gives us at least something that looks like a zippy component. The next step is to bring our component to life.

## Bringing the component to life

In order to bring this component to life, let's recap quickly what we need:

- Clicking on the zippy title should toggle the content
- The title of the should be configurable from the outside world, currently hard-coded in the template
- DOM that is used inside the `<my-zippy>` element should be projected in the zippy content

Let's start with the first one: when clicking on the zippy title, the content should toggle. How do we implement that in Angular?

We know, in Angular 1.x, we'd probably add an `ngClick` directive to the title and set a scope property to `true` or `false` and toggle the zippy content respectively by using either `ngHide` or `ngShow`. We can do pretty much the same in Angular >= 2.x as well, just that we have a bit different semantics.

Instead of adding an `ngClick` directive (which we don't have in Angular 2.x), to call for instance a method `toggle()`, we bind to the `click` event directly using the following template syntax.

{% highlight html %}
{% raw %}
...
<div class="zippy__title" (click)="toggle()">
  &blacktriangledown; Details
</div>
...
{% endraw %}
{% endhighlight %}

If you're not familiar with this syntax I recommend you either reading this article on [integrating Web Components with Angular](http://pascalprecht.github.io/2014/10/25/integrating-web-components-with-angularjs/), or this article about [Angular's template syntax demystified](http://blog.thoughtram.io/angular/2015/08/11/angular-2-template-syntax-demystified-part-1.html). [Misko's keynote](https://www.youtube.com/watch?v=-dMBcqwvYA0) from this year's ng-conf is also a nice resource.

Now we're basically listening on a `click` event and execute a **statement**. But where does `toggle()` come from? We can access component methods directly in our template. There's no `$scope` service or controller that provides those methods. Which means, `toggle()` is just a method defined in `ZippyComponent`.

Here's what the implementation of this method could look like:

{% highlight javascript %}
{% raw %}
export class ZippyComponent {
  toggle() {
    this.visible = !this.visible;
  }
}
{% endraw %}
{% endhighlight %}

We simply invert the value of the component's `visible` property. In order to get a decent default state, we set `visible` to `true` when the component is loaded.

{% highlight javascript %}
{% raw %}
export class ZippyComponent {

  visible = true;

  toggle() {
    this.visible = !this.visible;
  }
}
{% endraw %}
{% endhighlight %}

Now that we have a property that represents the visibility state of the content, we can use it in our template accordingly. Instead of `ngHide` or `ngShow` (which we also don't have in Angular >= 2.x), we can simply bind the value of our `visible` property to our zippy content's `hidden` property, which every DOM element has by default.

{% highlight html %}
{% raw %}
...
<div class="zippy__content" [hidden]="!visible">
  This is some content.
</div>
...
{% endraw %}
{% endhighlight %}

Again, what we see here is part of the new template syntax in Angular. Angular >= 2.x binds to properties rather than attributes in order to work with Web Components, and this is how you do it. We can now click on the zippy title and the content toggles!

Oh! The little arrow in the title still points down, even if the zippy is closed. We can fix that easily with Angular's interpolation like this:

{% highlight html %}
{% raw %}
...
<div class="zippy__title" (click)="toggle()">
  {{ visible ? '&blacktriangledown;' : '&blacktriangleright;' }} Details
</div>
...
{% endraw %}
{% endhighlight %}

Okay, we're almost there. Let's make the zippy title configurable. We want that consumers of our component can define how they pass a title to it. Here's what our consumer will be able to do:

{% highlight html %}
{% raw %}
<zippy title="Details"></zippy>
<zippy [title]="'Details'"></zippy>
<zippy [title]="evaluatesToTitle"></zippy>
{% endraw %}
{% endhighlight %}

In Angular >= 2.x, we don't need to specify how scope properties are bound in our component, the consumer does. That means, this gets **a lot** easier in Angular too, because all we need to do is to import the `@Input()` decorator and teach our component about an input property, like this:

{% highlight javascript %}
{% raw %}
import { Component, Input } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html'
})
export class ZippyComponent {
  @Input() title;
  ...
}
{% endraw %}
{% endhighlight %}

Basically what we're doing here, is telling Angular that the value of the `title` **attribute** is projected to the `title` **property**. Input data that flows into the component. If we want to map the `title` property to a different attribute name, we can do so by passing the attribute name to `@Input()`:

{% highlight javascript %}
{% raw %}
@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html'
})
export class ZippyComponent {
  @Input('zippyTitle') title;
  ...
}
{% endraw %}
{% endhighlight %}

But for simplicity's sake, we stick with the shorthand syntax. There's nothing more to do to make the title configurable, let's update the template for `ZippyAppComponent` app.

{% highlight javascript %}
{% raw %}
@Component({
  moduleId: module.id,
  selector: 'zippy-app',
  template: '<my-zippy title="Details"></zippy>',
})
...
{% endraw %}
{% endhighlight %}

Now we need to change the template of zippy to make title to appear at correct place, let's udpate the template for zippy title.

{% highlight html %}
{% raw %}
...
<div class="zippy__title" (click)="toggle()">
  {{ visible ? '&blacktriangledown;' : '&blacktriangleright;' }} {{title}}
</div>
...
{% endraw %}
{% endhighlight %}

## Insertion Points instead of Transclusion

Our component's title is configurable. But what we really want to enable, is that a consumer can decide what goes **into** the component and what not, right?

We could for example use our component like this:

{% highlight html %}
{% raw %}
<my-zippy title="Details">
  <p>Here's some detailed content.</p>
</my-zippy>
{% endraw %}
{% endhighlight %}

In order to make this work, we've used transclusion in Angular 1. We don't need transclusion anymore, since Angular 2.x makes use of Shadow DOM (Emulation) which is part of the Web Components specification. Shadow DOM comes with something called "Content Insertion Points" or "Content Projection", which lets us specify, where DOM from the outside world is projected in the Shadow DOM or view of the component.

I know, it's hard to believe, but all we need to do is adding a `<ng-content>` tag to our component template.

{% highlight html %}
{% raw %}
...
<div class="zippy__content" [hidden]="!visible">
  <ng-content></ng-content>
</div>
...
{% endraw %}
{% endhighlight %}

Angular uses Shadow DOM (Emulation) since 2.x by default, so we can just take advantage of that technology. <s>It turns out that insertion points in Shadow DOM are even more powerful than transclusion in Angular.</s> Angular 1.5 introduces [multiple transclusion slots](http://localhost:4000/angular/2015/11/16/multiple-transclusion-and-named-slots.html), so we can explicitly "pick" which DOM is going to be projected into our directive's template. The `<ng-content>` tag lets us define **which** DOM elements are projected too. If you want to learn more about Shadow DOM, I recommend the articles on [html5rocks.com](http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom/) or watch [this talk](https://www.youtube.com/watch?v=gSTNTXtQwaY) from ng-europe.

## Putting it all together

Yay, this is how we build a zippy component in Angular. Just to make sure we're on the same page, here's the complete zippy component code we've written throughout this article:

{% highlight javascript %}
{% raw %}
import { Component, Input } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'my-zippy',
  templateUrl: 'my-zippy.component.html'
})
export class ZippyComponent {

  @Input() title;
  visible = true;

  toggle() {
    this.visible = !this.visible;
  }
}
{% endraw %}
{% endhighlight %}

And here's the template:

{% highlight html %}
{% raw %}
<div class="zippy">
  <div (click)="toggle()" class="zippy__title">
    {{ visible ? '&blacktriangledown;' : '&blacktriangleright;' }} {{title}}
  </div>
  <div [hidden]="!visible" class="zippy__content">
    <ng-content></ng-content>
  </div>
</div>
{% endraw %}
{% endhighlight %}

I've set up a repository so you can play with the code [here](https://github.com/thoughtram/angular-zippy). In fact, I've also added this component to the Angular project. The pull request is <s>pending</s> merged [here](https://github.com/angular/angular/pull/729) <s>and likely to be merged the next few days</s>. At this point I'd like to say thank you to [Victor](http://twitter.com/vberchet) and [Misko](http://twitter.com/mhevery) for helping me out on getting this implemented.

You might notice that it also comes with e2e tests. The component itself even emits it's own events using `EventEmitter`, which we haven't covered in this article. Check out the demos to see event emitters in action!
