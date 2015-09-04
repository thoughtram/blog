---
layout:     post
title:      "Developing a tabs component in Angular 2"
relatedLinks:
  -
    title: "Builing a zippy component in Angular 2"
    url: "http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html"
date:       2015-04-09
update_date: 2015-06-23
summary:    "In our last article we learned how to build a zippy component in Angular 2. This article details how to build another simple, but widely used type of component: tabs. Building tabs in Angular has always been the de facto example to example controllers in directives. Angular 2 makes it much easier and here's how you do it."

categories: 
- angular

tags:
- angular2

topic: getting-started

author: pascal_precht
---
{% include breaking-changes-hint.html %}
Just recently, we wrote about how to [build a zippy component](http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html) in Angular 2. We explored how to get started with the framework and learned about some concepts that it comes with to build a very simple component. If you haven't read the article, you might want to check it out.

As a follow up, we now want to build yet another component that is widely used in a lot of applications: Tabs. Building tabs has always been the de facto example when it comes to explaining directive controllers in Angular. Angular 2 does not have the concept of directive controllers, because the component itself is the execution context. It also makes it much easier to access other directives and components through dependency injection. However, you **do** want to [use directive controllers](http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html) in Angular 1 in order to make the migration process to Angular 2 easier.

Let's start right away and learn how easy it is to build a tabs component in Angular 2 without the confusing relationship between directive link functions and controllers. We'll skip the installation part, since that was explored in the other article.

## What it should look like

Before we start implementing the actual component, let's first clarify what we want to achieve from a consumer point of view. Building tabs with web technologies usually ends up with having a HTML list, that represents the tabs, and container elements per each tab that display the content of a tab.

Of course, in Angular, those implementation details are hidden behind some nice readable and declarative elements that we all know as directives. Having a tool like Angular (and also Web Components) allows us to create custom elements, so that a consumer could use something like the following snippet to add tabs to an application:

{% highlight html %}
{% raw %}
<tabs>
  <tab tab-title="Tab 1">
    Here's some content.
  </tab>
  <tab tab-title="Tab 2">
    And here's more in another tab.
  </tab>
</tabs>
{% endraw %}
{% endhighlight %}

We have a `<tab>` element that simply represents a single tab which has a title, and we have a `<tabs>` element that takes care of making those `<tab>` elements actually "tabbable".

If you've been following the development and concepts of Angular 2, you probably learned that, in Angular 2, the **consumer** of a component is in charge of deciding how a value is passed to a component. Whereas in Angular 1, the directive defines how a value is bound to it's scope, so the consumer needs to know about the inner workings of a directive.

This means, talking about the `tab-title` attribute that we have in the code above, consumers can either write to the component attribute (if it exists), or to the component property. The latter would allow the consumer to pass expressions to the component that first get evaluated. Here's what it could look like:

{% highlight html %}
{% raw %}
<tab tab-title="This is just a String">
  ...
</tab>
<tab [tab-title]="thisIsAnExpression">
  ...
</tab>
{% endraw %}
{% endhighlight %}

Alright, now that we know what we want to build, let's get our hands dirty with some Angular 2 code.

## Building the components

We start off by implementing a rather static version of the `<tabs>` element. If you've read our article on [building a zippy component in Angular 2](http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html), you know that we need the `View` and `Component` annotations to tell Angular what the selector and template for our component should be.

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'tabs'
})
@View({
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

When using `View` annotations, we can specify the template inside the annotation using the `template` property. The back tick syntax comes with ES6 and allows us to do multi-line string definition without using concatenation operators like `+`.

As you can see, the component template already comes with a static list of tabs. This list will be replaced with a dynamic directive later, for now we keep it like this so we get a better picture of the direction we're going. We also need a place where the tab contents will go. Let's add an insertion point to our template. This will project the outer light DOM into the Shadow DOM (Emulation).

{% highlight javascript %}
{% raw %}
@View({
  template: `
    <ul>
      <li>Tab 1</li>
      <li>Tab 2</li>
    </ul>
    <content></content>
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

Of course, we do want to use `<tab>` elements inside our `<tabs>` component, so let's build that one. It turns out that the `<tab>` element is actually quite primitive. It's basically just a container element that has an insertion point to project light DOM. We shouldn't forget the configurable `tab-title`. Here's how we do it.

{% highlight javascript %}
{% raw %}
@Component({
  selector: 'tab',
  properties: ['tabTitle: tab-title']
})
@View({
  template: `
    <div>
      <content></content>
    </div>
  `
})
export class Tab {

}
{% endraw %}
{% endhighlight %}

The element should be namend `<tab>` so we set the `selector` property accordingly. We bind the `tab-title` **attribute** to the component's `tabTitle` **property**. Last but not least we add a template that is just a div with an insertion point.

Wait, that's it? Well, sort of. There's a tiny bit more we need to do, but let's just use our new `<tab>` component in our `<tabs>` component.

{% highlight html %}
{% raw %}
<tabs>
  <tab tab-title="Foo">
    Content of tab Foo
  </tab>
  <tab tab-title="Bar">
    Content of tab Bar
  </tab>
</tabs>
{% endraw %}
{% endhighlight %}

Executing this in the browser, we notice that we still get a list with `Tab 1` and `Tab 2` and in addition, we see the projected contents of both tabs at the same time. That's not quite a tabs component, right?

## Making the components dynamic

We're getting there. Let's first make our `<tabs>` component to actually use the correct titles instead of a hard-coded list. In order to generate a dynamic list, we need a collection. We can use our component's constructor to initialize a collection that holds all tabs like this;

{% highlight js %}
{% raw %}
export class Tabs {
  constructor() {
    this.tabs = [];
  }
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

The method just simply pushes the given object into our collection and we're good. Next we update the template so that the list is generated dynamically based on our collection. In Angular 1 we have a `ngRepeat` directive that lets us iterate over a collection to repeat DOM. Angular 2 has a `For` directive that pretty much solves the exact same problem. In order to use it in our template, we first need to import it (just like everything else):

{% highlight javascript %}
{% raw %}
import { NgFor } from 'angular2/angular2';
{% endraw %}
{% endhighlight %}

Then we need to add it to the list of used directives in our `View` annotation:

{% highlight js %}
{% raw %}
@View({
  ...
  directives: [NgFor]
})
{% endraw %}
{% endhighlight %}

Last but not least, we use the directive to iterate over our tabs collection to generate a dynamic list of tab titles in the component's template.

{% highlight js %}
{% raw %}
@View({
  ...
  directives: [NgFor],
  template: `
    <ul>
      <li *ng-for="#tab of tabs">{{tab.tabTitle}}</li>
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
  constructor(@Parent() tabs:Tabs) {
    tabs.addTab(this)
  }
}
{% endraw %}
{% endhighlight %}

Wait, what happens here? `@Parent()` is yet another annotation that describes the visibility of a dependency for a directive. In fact there are more annotations that let us ask for children or ancestors. But we're going to cover this in another article. For now it's just important to understand that this particular annotation gives you access to a **parent** component dependency, which in our case is `<tabs>`. Using that instance, we can simply call the `addTab()` method with a `Tab` object and we are good to go.

## Making it tabbable

Using the components as they are right now, we **do** get a tabs list generated by our tab titles, but we still see all the contents of each tab at the same time. What we want, is to make that component actually "tabbable", so that only one tab content is shown. How do we achieve that?

Well, first we need a property that activates or deactivates a tab and depending on that value, we either show or hide it. We can simply extend our `<tab>` template accordingly like this:

{% highlight js %}
{% raw %}
@View({
  template: `
    <div [hidden]="!active">
      <content></content>
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
@View({
  ...
  directives: [NgFor],
  template: `
    <ul>
      <li *ng-for="#tab of tabs" (click)="selectTab(tab)">
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
  selector: 'tabs'
})
@View({
  template: `
    <ul>
      <li *ng-for="#tab of tabs" (click)="selectTab(tab)">
        {{tab.tabTitle}}
      </li>
    </ul>
    <content></content>
  `,
  directives: [NgFor]
})
export class Tabs {
  constructor() {
    this.tabs = [];
  }

  selectTab(tab) {
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
  properties: ['tabTitle: tab-title']
})
@View({
  template: `
    <div [hidden]="!active">
      <content></content>
    </div>
  `
})
export class Tab {
  constructor(@Parent() tabs:Tabs) {
    tabs.addTab(this);
  }
}
{% endraw %}
{% endhighlight %}

## Where to go from here

This is a very rudimentary implementation of a tabs component. We can use that as a starting point to make it better over time. For example, we haven't done anything in terms of accessibility. It would also be nice if the component emits some custom events when a tab is activated. We'll cover working with events in Angular 2 in another article.

You can find the running code in [this repository](https://github.com/thoughtram/angular-tabs).
