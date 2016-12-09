---
layout: post
title: Developing a tabs component in Angular 2
date: 2015-04-09T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
summary: >-
  This article details how to build another simple, but widely used type of
  component: tabs.
categories:
  - angular
tags:
  - angular2
topic: getting-started
author: pascal_precht
demos:
  - url: 'http://embed.plnkr.co/KU8eGM/'
    title: Tabs Component build with Angular 2 (RC4)
  - url: 'https://plnkr.co/edit/LEpgaP?p=preview'
    title: Tabs Component build with Angular 2 (RC5)
  - url: 'https://embed.plnkr.co/afhLA8wHw9LRnzwwTT3M/'
    title: Tabs Component using @ContentChildren
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
Just recently, we wrote about how to [build a zippy component](/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) in Angular 2. We explored how to get started with the framework and learned about some concepts that it comes with to build a very simple component. If you haven't read the article, you might want to check it out.

As a follow up, we now want to build yet another component that is widely used in a lot of applications: Tabs. Building tabs has always been the de facto example when it comes to explaining directive controllers in Angular. Angular 2 does not have the concept of directive controllers, because the component itself is the execution context. It also makes it much easier to access other directives and components through dependency injection. However, you **do** want to [use directive controllers](/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html) in Angular 1 in order to make the migration process to Angular 2 easier.

{% include demos-and-videos-buttons.html post=page %}

Let's start right away and learn how easy it is to build a tabs component in Angular 2 without the confusing relationship between directive link functions and controllers. We'll skip the installation part, since that was explored in the other article.


<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## What it should look like

Before we start implementing the actual component, let's first clarify what we want to achieve from a consumer point of view. Building tabs with web technologies usually ends up with having a HTML list, that represents the tabs, and container elements per each tab that display the content of a tab.

Of course, in Angular, those implementation details are hidden behind some nice readable and declarative elements that we all know as directives. Having a tool like Angular (and also Web Components) allows us to create custom elements, so that a consumer could use something like the following snippet to add tabs to an application:

{% highlight html %}
{% raw %}
<tabs>
  <tab tabTitle="Tab 1">
    Here's some content.
  </tab>
  <tab tabTitle="Tab 2">
    And here's more in another tab.
  </tab>
</tabs>
{% endraw %}
{% endhighlight %}

We have a `<tab>` element that simply represents a single tab which has a title, and we have a `<tabs>` element that takes care of making those `<tab>` elements actually "tabbable".

If you've been following the development and concepts of Angular 2, you probably learned that, in Angular 2, the **consumer** of a component is in charge of deciding how a value is passed to a component. Whereas in Angular 1, the directive defines how a value is bound to it's scope, so the consumer needs to know about the inner workings of a directive.

This means, talking about the `tabTitle` attribute that we have in the code above, consumers can either write to the component attribute (if it exists), or to the component property. The latter would allow the consumer to pass expressions to the component that first get evaluated. Here's what it could look like:

{% highlight html %}
{% raw %}
<tab tabTitle="This is just a String">
  ...
</tab>
<tab [tabTitle]="thisIsAnExpression">
  ...
</tab>
{% endraw %}
{% endhighlight %}

Alright, now that we know what we want to build, let's get our hands dirty with some Angular 2 code.

## Building the components

We start off by implementing a rather static version of the `<tabs>` element. If you've read our article on [building a zippy component in Angular 2](/angular/2015/03/27/building-a-zippy-component-in-angular-2.html),
you know that we need the `@Component()` decorator to tell Angular what the selector and template for our component should be.

{% highlight js %}
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

When using the `Component` decorator, we can specify the template using the `template` property. The back tick syntax comes with ES2015 and allows us to do multi-line string definition without using concatenation operators like `+`.

As you can see, the component template already comes with a static list of tabs. This list will be replaced with a dynamic directive later, for now we keep it like this so we get a better picture of the direction we're going. We also need a place where the tab contents will go. Let's add an insertion point to our template. This will project the outer light DOM into the Shadow DOM (Emulation).

{% highlight js %}
{% raw %}
@Component({
  selector: 'tabs',
  template: `
    <ul>
      <li>Tab 1</li>
      <li>Tab 2</li>
    </ul>
    <ng-content></ng-content>
  `
})
{% endraw %}
{% endhighlight %}

Cool, we can already start using our `<tabs>` component and write HTML into it like this:

{% highlight html %}
{% raw %}
<tabs>
  <p>Some random HTML with some random content</p>
</tabs>
{% endraw %}
{% endhighlight %}

Of course, we do want to use `<tab>` elements inside our `<tabs>` component, so let's build that one. It turns out that the `<tab>` element is actually quite primitive. It's basically just a container element that has an insertion point to project light DOM. We shouldn't forget the configurable `tabTitle`. Here's how we do it.

{% highlight js %}
{% raw %}
@Component({
  selector: 'tab',
  template: `
    <div>
      <ng-content></ng-content>
    </div>
  `
})
export class Tab {
  @Input() tabTitle;
}
{% endraw %}
{% endhighlight %}

The element should be named `<tab>` so we set the `selector` property accordingly. We bind the `tabTitle` **input** to the component's `tabTitle` **property**. Last but not least we add a template that is just a div with an insertion point.

Wait, that's it? Well, sort of. There's a tiny bit more we need to do, but let's just use our new `<tab>` component in our `<tabs>` component.

{% highlight html %}
{% raw %}
<tabs>
  <tab tabTitle="Foo">
    Content of tab Foo
  </tab>
  <tab tabTitle="Bar">
    Content of tab Bar
  </tab>
</tabs>
{% endraw %}
{% endhighlight %}

Executing this in the browser, we notice that we still get a list with `Tab 1` and `Tab 2` and in addition, we see the projected contents of both tabs at the same time. That's not quite a tabs component, right?

## Making the components dynamic

We're getting there. Let's first make our `<tabs>` component to actually use the correct titles instead of a hard-coded list. In order to generate a dynamic list, we need a collection. We can use our component's constructor to initialize a collection that holds all tabs like this:

{% highlight js %}
{% raw %}
export class Tabs {

  // typescript needs to know what properties will exist on class instances
  tabs: Tab[] = [];
}
{% endraw %}
{% endhighlight %}

Okay cool, but how do we get our tab titles into that collection? This is where, in Angular 1, directive controllers come in. However, in Angular 2 it's much easier. First we need an interface so that the outside world can actually add items to our internal collection. Let's add a method `addTab(tab: Tab)`, that takes a `Tab` object and does exactly what we need.

{% highlight js %}
{% raw %}
export class Tabs {
  ...
  addTab(tab:Tab) {
    this.tabs.push(tab);
  }
}
{% endraw %}
{% endhighlight %}

The method just simply pushes the given object into our collection and we're good. Next we update the template so that the list is generated dynamically based on our collection. In Angular 1 we have a `ngRepeat` directive that lets us iterate over a collection to repeat DOM. Angular 2 has an `ngFor` directive that pretty much solves the exact same problem. We use the directive to iterate over our tabs collection to generate a dynamic list of tab titles in the component's template.

{% highlight js %}
{% raw %}
@Component({
  ...
  template: `
    <ul>
      <li *ngFor="let tab of tabs">{{ tab.tabTitle }}</li>
    </ul>
  `
})
{% endraw %}
{% endhighlight %}

If the templating syntax doesn't make sense to you at all, you might want to check out [this design doc](https://docs.google.com/document/d/1HHy_zPLGqJj0bHMiWPzPCxn1pO5GlOYwmv-qGgl4f_s/edit).

Alright, we have a collection, we have an API to extend the collection and we have a list in our template that is generated dynamically based on that collection. Since the collection is empty by default, the generated list is empty and no tab title is shown. Somebody needs to call this `addTab()` method!

That's where the `<tab>` component comes into play (again). Inside the component we can simply ask for a **parent** `Tabs` dependency by using the new, much more powerful dependency injection system and get an instance of it. This allows us to simply use given APIs inside a child component. Let's take a look at what that looks like.

{% highlight js %}
{% raw %}
class Tab {
  constructor(tabs: Tabs) {
    tabs.addTab(this)
  }
}
{% endraw %}
{% endhighlight %}

Wait, what happens here? `tabs: Tabs` is just Typescript type annotation which Angular 2 uses for Dependency Injection.
Please check out our article where we go deeper inside [Angular 2 DI](/angular/2015/05/18/dependency-injection-in-angular-2)

**tl;dr**

> Angular 2 Hierarchical Injector knows, that we want first `Tabs` instance that it can get,
when traversing upwards from current host. In our case the actual host is our  `<tab>` component.
> Injector ask on tab for Tabs, if there is none, Injector will ask Parent Injector for `Tabs`. In our case parent Injector is on `<tabs>` component
and it has indeed `Tabs` instance, so it will return the correct instance of `Tabs`.

For now it's just important to understand that this particular type annotation gives you access to a **parent** component dependency, which in our case is `<tabs>`.
Using that instance, we can simply call the `addTab()` method with a `Tab` object and we are good to go.

## Making it tabbable

Using the components as they are right now, we **do** get a tabs list generated by our tab titles, but we still see all the contents of each tab at the same time. What we want, is to make that component actually "tabbable", so that only one tab content is shown. How do we achieve that?

Well, first we need a property that activates or deactivates a tab and depending on that value, we either show or hide it. We can simply extend our `<tab>` template accordingly like this:

{% highlight js %}
{% raw %}
@Component({
  template: `
    <div [hidden]="!active">
      <ng-content></ng-content>
    </div>
  `
})
class Tab { ... }
{% endraw %}
{% endhighlight %}

If a tab is not active, we simply hide it. We haven't specified this property anywhere, which means it's `undefined` which evaluates to `false` in that condition. So every tab is deactivated by default. In order to have at least one tab active, we can extend the `addTab()` method accordingly. The following code for instance, activates the very first tab that is added to the collection.

{% highlight js %}
{% raw %}
export class Tabs {
  ...
  addTab(tab:Tab) {
    if (this.tabs.length === 0) {
      tab.active = true;
    }
    this.tabs.push(tab);
  }
}
{% endraw %}
{% endhighlight %}

Awesome! The only thing that is missing, is to activate other tabs when a user clicks on a tab. In order to make this possible, we just need a function that sets the `activate` property when a tab is clicked. Here's what such a function could look like.

{% highlight js %}
{% raw %}
export class Tabs {
  ...
  selectTab(tab:Tab) {
    this.tabs.forEach((tab) => {
      tab.active = false;
    });
    tab.active = true
  }
}
{% endraw %}
{% endhighlight %}

We simply iterate over all tabs we have, deactivate them, and activate the one that is passed to that function. Then we just add this function to the template, so it is executed whenever a user clicks a tab, like this.

{% highlight js %}
{% raw %}
@Component({
  ...
  template: `
    <ul>
      <li *ngFor="let tab of tabs" (click)="selectTab(tab)">
        {{tab.tabTitle}}
      </li>
    </ul>
  `
})
{% endraw %}
{% endhighlight %}

Again, if this template syntax is new to you, check out the mentioned design document. What happens here is, whenever a `click` event is fired `selectTab()` is executed with the iterator tab instance. Try it out!

Here's the complete source in case you ran into any problems.

{% highlight js %}
{% raw %}
@Component({
  selector: 'tabs',
  template: `
    <ul>
      <li *ngFor="let tab of tabs" (click)="selectTab(tab)">
        {{tab.tabTitle}}
      </li>
    </ul>
    <ng-content></ng-content>
  `,
})
export class Tabs {
  tabs: Tab[] = [];

  selectTab(tab: Tab) {
    this.tabs.forEach((tab) => {
      tab.active = false;
    });
    tab.active = true;
  }

  addTab(tab: Tab) {
    if (this.tabs.length === 0) {
      tab.active = true;
    }
    this.tabs.push(tab);
  }
}

@Component({
  selector: 'tab',
  template: `
    <div [hidden]="!active">
      <ng-content></ng-content>
    </div>
  `
})
export class Tab {

  @Input() tabTitle: string;

  constructor(tabs:Tabs) {
    tabs.addTab(this);
  }
}
{% endraw %}
{% endhighlight %}

And we shouldn't forget that these components need to be declared on our application module:

{% highlight js %}
{% raw %}
@NgModule({
  imports: [BrowserModule],
  declarations: [Tab, Tabs, AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
{% endraw %}
{% endhighlight %}


## Where to go from here

This is a very rudimentary implementation of a tabs component. We can use that as a starting point to make it better over time. For example, we haven't done anything in terms of accessibility. It would also be nice if the component emits some custom events when a tab is activated. We'll cover working with events in Angular 2 in another article.

## Bonus

Angular 2 is so awesome that there is not just one way how to do things!

We can take a totally different approach how to implement our simple tabs ( which isn't so easily possible in Angular 1 ),
leveraging special Angular 2 `@ContentChildren` property decorator with `QueryList` type and `AfterContentInit` life cycle interface.
Those are more advanced concepts, which are covered in more details by [Juri Strumpflohner](https://twitter.com/juristr) in [his follow-up article](http://juristr.com/blog/2016/02/learning-ng2-creating-tab-component).

If you're just curious what it looks like, check out the demos below!
