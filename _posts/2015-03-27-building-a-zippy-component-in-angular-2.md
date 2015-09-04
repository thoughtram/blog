---
layout:     post
title:      "Developing a zippy component in Angular 2"
relatedLinks:
  -
    title: "Using ES6 with Angular today"
    url: "http://blog.thoughtram.io/angularjs/es6/2015/01/23/exploring-angular-1.3-using-es6.html"
  -
    title: "Integrating Web Components with AngularJS"
    url: "http://pascalprecht.github.io/2014/10/25/integrating-web-components-with-angularjs/"
  -
    title: "The difference between Annotations and Decorators"
    url: "http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html"
date:       2015-03-27
update_date: 2015-06-23
summary:    "Even if Angular 2 is still in early development, we can already start playing with the code since it's up on GitHub and also published as npm module. We are following the development of Angular 2 since the beginning on and are also contributing to the project. Just recently we've built a simple zippy component in Angular 2 and in this article we want to show how."

categories: 
- angular

tags:
- angular2

topic: getting-started

author: pascal_precht
---
{% include breaking-changes-hint.html %}

Even if Angular 2 is still in early development, we can already start playing with the code since it's up on GitHub and also published as npm module for early adopters. We are following the development of Angular 2 since the beginning on and are also contributing to the project. Just recently we've built a simple zippy component in Angular 2 and in this article we want to show you how.

## Getting started with Angular 2

I think the community still tries to find out what currently the best starting point is, when it comes to Angular 2. There are several options today, for instance, we can go to [angular.io](http://angular.io) and use the [quickstart](https://angular.io/docs/js/latest/quickstart.html) guide. If this doesn't suit you, there's an article on [trying Angular 2 today](http://swirlycheetah.com/try-angular2-today/) that lists some other useful repositories to get started quickly. In this article we will use [Pawel Kozlowski's](http://twitter.com/pkozlowski_os) [ng2-play](https://github.com/pkozlowski-opensource/ng2-play) repository, but again, you can use whatever suits you (Thanks Pawel for setting this up btw).

As the readme of the project says, we can simply start by cloning the repository with Git and install it's dependencies using npm. We also need to install [gulp](gulpjs.com) globally, which is what we do first.

{% highlight sh %}
{% raw %}
$ npm install -g gulp
$ git clone https://github.com/pkozlowski-opensource/ng2-play
$ cd ng2-play
$ npm install
{% endraw %}
{% endhighlight %}

Cool, let's just run the code by executing the following command in our terminal and see what happens.

{% highlight sh %}
{% raw %}
$ gulp play
{% endraw %}
{% endhighlight %}

A browser tab opens on `localhost://9000` and what we see is the text "Hello, World!". After two seconds the text changes to "Hello, NEW World!" and this is because Pawel demonstrates how we can simply use `setTimeout()` in Angular 2 without using something like `$timeout` service or manually calling `$scope.$apply()`, which is how we deal with that today in Angular 1.

I don't want to go into much detail on what the existing code does, but you can go ahead and check out the `src/hello.js` file to get an idea of what's happening here. We want to focus on how to build a zippy component now.

## Building the zippy component

Before we start building the zippy component with Angular 2, we need to clarify what we're talking about when using the term "zippy". It turns out that a lot of people think they don't know what a zippy is, even if they do, just because of the naming.

Long story short: this, is a zippy.

<iframe src="http://embed.plnkr.co/1djdpE5uFLfYpYO8qBnm/preview"></iframe>

Also known as "accordion". You can click the summary text and the actual content toggles accordingly. If you take a look at this particular plunk, you'll see that we actually don't need to do any special implementation to get this working. We have the `<details>` element that does the job for us. But how can we implement such a thing in Angular 2?

We start off by adding a new file `src/zippy.js` and creating a class in ES6 that we export, so it can be imported by other consumers of this class, by using the ES6 module system. If you're not familiar with modules in ES6 you might want to read our article on [using ES6 with Angular today](http://blog.thoughtram.io/angularjs/es6/2015/01/23/exploring-angular-1.3-using-es6.html).

{% highlight javascript %}
{% raw %}
export class Zippy {

}
{% endraw %}
{% endhighlight %}

Angular 2 doesn't come with it's own module system anymore, since ES6 already provides a system that lets us load module asynchronously. That means we can just write plain ES6 code without any Angular specific bits which makes our code more reusable.

The next thing we want to do, is to make our `Zippy` class an actual component and give it a template so that we can see that it is ready to be used. In order to tell Angular that this particular class is a component, we use something called "Annotations".

Annotations are a way to add meta information to our existing code. Those annotations are actually not supported by ES6 but have been developed as language extension and are considered by the Traceur transpiler, which is used in this project. We're not required to use annotations though. As mentioned, those are just transpiled to ES5 and then simply used by the framework. However, for simplicity sake we'll use them in this article.

Angular provides us with a couple of annotation types so we can express our code in a much more elegant way. We need two annotations: `ComponentAnnotation` and `ViewAnnotation`. Annotations can be imported just like classes by using ES6 module syntax. We also import both annotations with a shorter name to match with provided decorators. This is for easy migration when we switch from Traceur to TypeScript or Babel in the future. If this is unclear to you, you might want to read our article on [the difference between annotations and decorators](http://blog.thoughtram.io/angular/2015/05/03/the-difference-between-annotations-and-decorators.html).

{% highlight javascript %}
{% raw %}
import { 
  ComponentAnnotation as Component,
  ViewAnnotation as View 
} from 'angular2/angular2';

export class Zippy {

}
{% endraw %}
{% endhighlight %}

The `Component` annotation lets us add information about what our component's element name will be, which attributes are bound to which properties and more. `View` annotation gives Angular information about the component's view and template but also which directives are probably used inside of such a template.

We want our zippy component to be usable as `<zippy>` element. So all we need to do, is to add a `Component` annotation with that particular information. To specify the element name, or rather CSS selector (since we could also build decorators), we need to add a `selector` property that matches a CSS selector.

{% highlight javascript %}
{% raw %}
import { 
  ComponentAnnotation as Component,
  ViewAnnotation as View
} from 'angular2/angular2';

@Component({
  selector: 'zippy'
})
export class Zippy {

}
{% endraw %}
{% endhighlight %}

Next, our component needs a template. We add a `View` annotation that tells Angular where to load the component template from like this:

{% highlight javascript %}
{% raw %}
import { 
  ComponentAnnotation as Component,
  ViewAnnotation as View
} from 'angular2/angular2';

@Component({
  selector: 'zippy'
})
@View({
  templateUrl: 'zippy.html'
})
export class Zippy {

}
{% endraw %}
{% endhighlight %}

Later at runtime, when Angular compiles this component, it'll fetch `zippy.html` asynchronously. You might wonder why we have `Component` **and** `View` annotations. Why not just the component annotation with the same information? Well, it turns out that, depending on the environment where you component is going to be deployed you might want to use a different template or even a different rendering environment. Extracting this information into a separate `View` annotation, makes it easy to swap it out.

Let's create a file `src/zippy.html` with the following contents:

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

Alright, believe it or not, that's basically all we need to do to get this component running. Let's use our zippy component inside the hello app. In order to do that, we need to make some changes to `src/hello.js`. Here's what it should look like, after changes have been applied (I removed everything that is distracting):

{% highlight javascript %}
{% raw %}
import { 
  ComponentAnnotation as Component,
  ViewAnnotation as View
} from 'angular2/angular2';
import {Zippy} from 'zippy';

@Component({
  selector: 'hello'
})
@View({
  template: `<zippy></zippy>`,
  directives: [Zippy]
})
export class Hello {

}
{% endraw %}
{% endhighlight %}

We don't go into much detail on what this all means right now since it gets clear throughout the article. Nice! Running this in the browser gives us at least something that looks like a zippy component. The next step is to bring our component to life.

## Bringing the component to life

In order to bring this component to life, let's recap quickly what we need:

- Clicking on the zippy title should toggle the content
- The title of the should be configurable from the outside world, currently hard-coded in the template
- DOM that is used inside the `<zippy>` element should be projected in the zippy content

Let's start with the first one: when clicking on the zippy title, the content should toggle. How do we implement that in Angular 2?

We know, in Angular 1, we'd probably add an `ngClick` directive to the title and set a scope property to `true` or `false` and toggle the zippy content respectively by using either `ngHide` or `ngShow`. We can do pretty much the same in Angular 2 as well, just that we have a bit different semantics.

Instead of adding an `ngClick` directive (which we don't have in Angular 2), to call for instance a method `toggle()`, we bind to the `click` event directly using the following template syntax.

{% highlight html %}
{% raw %}
...
<div class="zippy__title" (click)="toggle()">
  &blacktriangledown; Details
</div>
...
{% endraw %}
{% endhighlight %}

If you're not familiar with this syntax I recommend you either reading this article on [integrating Web Components with Angular](http://pascalprecht.github.io/2014/10/25/integrating-web-components-with-angularjs/) or watch [Misko's keynote](https://www.youtube.com/watch?v=-dMBcqwvYA0) from this year's ng-conf.

Now we're basically listening on a `click` event and execute a **statement**. But where does `toggle()` come from? We can access component methods directly in our template in Angular 2. There's no `$scope` service or controller that provides those methods. Which means, `toggle()` is just a method defined in `Zippy`.

Here's what the implementation of this method could look like:

{% highlight javascript %}
{% raw %}
export class Zippy {
  toggle() {
    this.visible = !this.visible;
  }
}
{% endraw %}
{% endhighlight %}

We simply invert the value of the component's `visible` property. In order to get a decent default state, we set `visible` to `true` when the component is loaded.

{% highlight javascript %}
{% raw %}
export class Zippy {

  constructor() {
    this.visible = true;
  }

  toggle() {
    this.visible = !this.visible;
  }
}
{% endraw %}
{% endhighlight %}

Now that we have a property that represents the visibility state of the content, we can use it in our template accordingly. Instead of `ngHide` or `ngShow` (which we also don't have in Angular 2), we can simply bind the value of our `visible` property to our zippy content's `hidden` property, which every DOM element has by default.

{% highlight html %}
{% raw %}
...
<div class="zippy__content" [hidden]="!visible">
  This is some content.
</div>
...
{% endraw %}
{% endhighlight %}

Again, what we see here is part of the new template syntax in Angular 2. Angular 2 binds to properties rather than attributes in order to work with Web Components, and this is how you do it. We can now click on the zippy title and the content toggles!

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

In Angular 2, we don't need to specify how scope properties are bound in our component, the consumer does. That means, this gets **a lot** easier in Angular to, because all we need to do is this:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'zippy',
  properties: ['title']
})
export class Zippy {
  ...
}
{% endraw %}
{% endhighlight %}

Notice the `properties` property in our component annotation? It's a list of property names where we can define which component attribute maps to which component property. Basically what we're doing here, is telling Angular that the value of the `title` **attribute** is projected to the `title` **property**. If we want to map the `title` property to a different attribute name, we can do so by suing the following syntax:

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'zippy',
  properties: ['title: zippy-title']
})
export class Zippy {
  ...
}
{% endraw %}
{% endhighlight %}

But for simplicity's sake, we stick with the shorthand synax. There's nothing more to do to make the title configurable, let's update the template annotation for `hello` app.

{% highlight javascript %}
{% raw %}
...
@View({
  template: `<zippy title="Details"></zippy>`,
  directives: [Zippy]
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
<zippy title="Details">
  <p>Here's some detailed content.</p>
</zippy>
{% endraw %}
{% endhighlight %}

In order to make this work, we've used transclusion in Angular 1. We don't need transclusion anymore, since Angular 2 makes use of Shadow DOM which is part of the Web Components specification. Shadow DOM comes with something called "Content Insertion Points", which lets us specify, where DOM from the outside world is projected in the Shadow DOM of the component.

I know, it's hard to believe, but all we need to do is adding a `<content>` tag to our component template.

{% highlight html %}
{% raw %}
...
<div class="zippy__content" [hidden]="!visible">
  <content></content>
</div>
...
{% endraw %}
{% endhighlight %}

Angular 2 uses Shadow DOM (Emulation) by default, so we can just take advantage of that technology. It turns out that insertion points in Shadow DOM are even more powerful than transclusion in Angular. The `<content>` tag lets us define **which** DOM elements are projected. If you want to learn more about Shadow DOM, I recommend the articles on [html5rocks.com](http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom/) or watch [this talk](https://www.youtube.com/watch?v=gSTNTXtQwaY) from ng-europe.

## Putting it all together

Yay, this is how we build a zippy component in Angular 2. Just to make sure we're on the same page, here's the complete zippy component code we've written throughout this article:

{% highlight javascript %}
{% raw %}
import { 
  ComponentAnnotation as Component,
  ViewAnnotation as View
} from 'angular2/angular2';

@Component({
  selector: 'zippy',
  properties: ['title']
})
@View({
  templateUrl: 'zippy.html'
})
export class Zippy {

  constructor() {
    this.visible = true;
  }

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
    <content></content>
  </div>
</div>
{% endraw %}
{% endhighlight %}

I've set up a repository so you can play with the code [here](https://github.com/thoughtram/angular-zippy). In fact, I've also added this component to the Angular project. The pull request is <s>pending</s> merged [here](https://github.com/angular/angular/pull/729) <s>and likely to be merged the next few days</s>. At this point I'd like to say thank you to [Victor](http://twitter.com/vberchet) and [Misko](http://twitter.com/mhevery) for helping me out on getting this implemented.

You might notice that it also comes with e2e tests. The component itself even emits it's own events using `EventEmitter`, which we haven't covered in this article. Those will be discussed in another article.

Go and check it out!
