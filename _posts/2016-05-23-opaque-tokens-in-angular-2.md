---
layout: post
title: How to prevent name collisions in Angular 2 providers
date: 2016-05-23T00:00:00.000Z
update_date: 2016-11-08T00:00:00.000Z
imageUrl: /images/banner/opaque-tokens-in-angular-2.jpeg
summary: >-
  Angular provides a mechanism to avoid name collisions in provider tokens. In
  this article we're going to explore how opaque tokens make this possible.
categories:
  - angular
tags:
  - angular2
  - di
topic: di
videos:
  - url: 'http://casts.thoughtram.io/embedded/181222351'
  - url: 'http://casts.thoughtram.io/embedded/181222354'
author: pascal_precht
related_posts:
  - Angular 2 Providers using Map Literals
  - Two-way Data Binding in Angular 2
  - Resolving route data in Angular 2
  - Angular 2 Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular 2

---

If you've read our article series on everything dependency injection in Angular 2, you've probably realised that Angular is doing a pretty good job on that. We can either use string or type tokens to make dependencies available to the injector. However, when using string tokens, there's a possibility of running into naming collisions because... well, maybe someone else has used the same token for a different provider. In this article we're going to learn how so called "opaque tokens" solve this problem.

{% include demos-and-videos-buttons.html post=page %}

<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

Before we jump into the actual problem we want to solve, let's first recap the differences between a string token and a type token.


## String Tokens vs Type Tokens

Angular 2 DI injects singleton instances which are created by provider-registered factories. And it is these instances that are injected at runtime. In order to configure your application DI and associate a factory with a token, we have to setup providers. A couple weeks ago we blogged how [providers can be created using Map literals](/angular/2016/05/13/angular-2-providers-using-map-literals.html), if you haven't read this one yet we recommend to check it out, as this article pretty much builds up on that one.

The bottom line is that a provider token can be either a string or a type. Depending on our use case, we want to use one or the other. For example, if we have a `DataService` class, and all we want to do is inject an instance of that class when we ask for a dependency of that type, we would use `DataService` as a provider token like this:

{% highlight js %}
{% raw %}
@Component({
  selector: 'my-component',
  providers: [
    {provide: DataService, useClass: DataService}
  ]
})
class MyComponent {

  constructor(private dataService: DataService) {}
}
{% endraw %}
{% endhighlight %}

Since the token matches the dependency instance-type and the provider strategy is `useClass`, we can also use the **shorthand** version, as:

{% highlight js %}
{% raw %}
providers: [DataService]
{% endraw %}
{% endhighlight %}

Angular2 has many shorthand versions (DI, annotations, etc); and the above code is just one example of those.

Now this is cool, as long as we have classes (or types) to represent the things we want to work with. However, sometimes we need to create other objects that don't necessarily need to be put in a class representation. We could for example have a configuration object that we want to inject into our application. This configuration object can be a simple object literal where there is no type involved.

{% highlight js %}
{% raw %}
const CONFIG = {
  apiUrl: 'http://my.api.com',
  theme: 'suicid-squad',
  title: 'My awesome app'
};
{% endraw %}
{% endhighlight %}

Or maybe, we have a primitive value we want to make injectable, like a string or a boolean value.

{% highlight js %}
{% raw %}
const FEATURE_ENABLED = true;
{% endraw %}
{% endhighlight %}

In these cases, we can't use the `String` or `Boolean` type, as this would set a default value for place where we ask for dependencies of these types. And we really don't want to introduce a new type just to represent these values.

That's where string tokens come into play. They allows us to make objects available via DI without introducing an actual type:

{% highlight js %}
{% raw %}

let featureEnabledToken = 'featureEnabled';
let configToken = 'config';

...
providers: [
  { provide: featureEnabledToken, useValue: FEATURE_ENABLED },
  { provide: configToken, useValue: CONFIG }
]
{% endraw %}
{% endhighlight %}

Basically all we do is, instead of using a type, we use a simple string as a token. We can inject this dependency using the `@Inject()` decorator likes this:


{% highlight js %}
{% raw %}
import { Inject } from '@angular/core';

class MyComponent {

  constructor(
    @Inject(featureEnabledToken) private featureEnabled,
    @Inject(configToken) private config
  ) {...}
}
{% endraw %}
{% endhighlight %}

Note: that above we used `@Inject(featureEnabledToken) private featureEnabled` without any typing information; e.g. `private featureEnabled:boolean`.

Okay awesome, we can use strings and types as tokens to inject dependencies in our application. Unfortunately, using string tokens like this, opens up potential for naming collisions.

## The problem with string tokens

Let's get back to our `config` string token for a second. "config" is a pretty general name, so we probably could've done better naming this thing in the first place. However, even if we come up with a more distinguishable name, it is easily possible that someone else will use the same string as a token. Providers are flattened, meaning that, if there are multiple providers with the same token, the last one wins.

And there is another concept that allows us to define multiple providers for the same token. Those are multi providers, and we've written about them [here](/angular2/2015/11/23/multi-providers-in-angular-2.html).

Let's say we use some sort of third-party library that comes with a set of providers defined like this:

{% highlight js %}
{% raw %}
export const THIRDPARTYLIBPROVIDERS = [
  { provide: 'config', useClass: ThirdParyConfig }
];
{% endraw %}
{% endhighlight %}

Even though, it's not a common pattern to use a string token with a class, it's totally possible to do that, but we really just want to demonstrate the problem here. We can import and use these third-party providers like this:

{% highlight js %}
{% raw %}
import THIRDPARTYLIBPROVIDERS from './third-party-lib';

...
providers = [
  DataService,
  THIRDPARTYLIBPROVIDERS
]
{% endraw %}
{% endhighlight %}

Okay, so far so good. Very often, we don't really know what's defined behind other library providers unless we check out the documentation or the source code. Let's assume we also don't know this time, that there's a string token for `config`, and we try to add our own provider like this:

{% highlight js %}
{% raw %}
...
providers = [
  DataService,
  THIRDPARTYLIBPROVIDERS,
  { provide: configToken, useValue: CONFIG }
]
{% endraw %}
{% endhighlight %}

This will pretty much break our third-party library, because now, the thing that gets injected for the `config` string token is a different object than what the library expects. We basically ran into a naming collision.

## Opaque Tokens to the resque

Luckily, Angular anticipated such scenarios. It comes with a type called `OpaqueToken` that basically allows us to create string-based tokens without running into any collisions.

Creating an `OpaqueToken` is easy. All we need to do is to import and use it. Here's what the third-party providers collection looks like using `OpaqueToken`:

{% highlight js %}
{% raw %}
import { OpaqueToken } from '@angular/core';

const CONFIG_TOKEN = new OpaqueToken('config');

export const THIRDPARTYLIBPROVIDERS = [
  { provide: CONFIG_TOKEN, useClass: ThirdPartyConfig }
];
{% endraw %}
{% endhighlight %}

Of course, this is an implementation detail and we usually shouldn't have to care about what APIs are used inside a third-party library. Let's assume we've created an `OpaqueToken` for our config token as well.

{% highlight js %}
{% raw %}
import { OpaqueToken } from '@angular/core';
import THIRDPARTYLIBPROVIDERS from './third-party-lib';

const MY_CONFIG_TOKEN = new OpaqueToken('config');

...
providers = [
  DataService,
  THIRDPARTYLIBPROVIDERS,
  { provide: MY_CONFIG_TOKEN, useValue: CONFIG }
]
{% endraw %}
{% endhighlight %}

Running this code will show us that, even though our application seems to use the exact same string token for different providers, Angular's DI is still smart enough to figure out which dependency we're interested in. As if we'd have two *different* tokens. And technically, this is exactly what happens.

## Why it works

If we take a look at the implementation of `OpaqueToken` we'll realise that it's just a simple class with only a `.toString()` method.

{% highlight js %}
{% raw %}
export class OpaqueToken {

  constructor(private _desc: string) {}

  toString(): string { return `Token ${this._desc}`; }
}
{% endraw %}
{% endhighlight %}

`toString()` gets called when an error is thrown in case we're asking for a dependency that doesn't have a provider. All it does is add a tiny bit more information to the error message.

However, the secret sauce is, that we're creating actual object instances of `OpaqueToken` as opposed to simple string primitives. That's why Angular's DI is able to distinguish between our opaque tokens, even though they are based on the same string, because these instances are never the same.

We can easily double-check the equality of two opaque tokens like this:

{% highlight js %}
{% raw %}
const TOKEN_A = new OpaqueToken('token');
const TOKEN_B = new OpaqueToken('token');

TOKEN_A === TOKEN_B // false
{% endraw %}
{% endhighlight %}

## Conclusion

Opaque tokens are distinguishable and prevent us from running into naming collisions. In addition they provide a bit better error messages. Whenever we create a token that is not a type, `OpaqueToken` should be used.
