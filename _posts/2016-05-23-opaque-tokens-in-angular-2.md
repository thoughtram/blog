---
layout:     post
title:      "Opaque Tokens in Angular 2"

date: 2016-05-23
imageUrl: '/images/banner/opaque-tokens-in-angular-2.jpeg'

summary: "Angular 2's dependency injection improved in many ways. It not only is more flexible when it comes to assembling dependencies from different parts of our app, it also provides a mechanism to avoid name collisions entirely. In this article we're going to explore how opaque tokens make this possible."

categories:
  - angular

tags:
  - angular2
  - di

topic: di

author: pascal_precht
---

If you've read our article series on everything dependency injection in Angular 2, you've probably realised that Angular is doing a pretty good job on that. We can either use string or type tokens to make dependencies available to the injector. However, when using string tokens, there's a possibility of running into naming collisions because... well, maybe someone else has used the same token for a different provider. In this article we're going to learn how so called "opaque tokens" solve this problem.

Let's first recap what the difference between a string token and a type token is, before we jump into the actual problem we want to solve.

## String Tokens vs Type Tokens

In order to associate a dependency creation with a token that we use throughout our application, we have to setup providers. A couple of weeks ago we've written about how [providers can be created using Map literals](/angular/2016/05/13/angular-2-providers-using-map-literals.html), if you haven't read this one yet we recommend to check it out, as this article pretty much builds up on that one.

The bottom line is that a provider token can be either a string or a type, and depending on our use case, we want to use one or the other. For example, if we have a `DataService` class, and all we want to do is inject an instance of that class when we ask for a dependency of that type, we would use `DataService` as a provider token like this:

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

Or, in this particular case, we can also use the shorthand version, as the token matches the dependency instance type and the provider strategy is `useClass`:

{% highlight js %}
{% raw %}
providers: [DataService]
{% endraw %}
{% endhighlight %}

That's cool, as long as we have classes (or types) to represent the things we want to work with. However, sometimes we need to create other objects that don't necessarily need to be put in a class representation. We could for example have a configuration object that we want to inject into our application. This configuration object can be a simple object literal, there's no type involved.

{% highlight js %}
{% raw %}
const CONFIG = {
  apiUrl: 'http://my.api.com',
  theme: 'suicide-squad',
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

In these cases, we can't use the `String` or `Boolean` type, as this would set a default value for places where we ask for dependencies of these types. In addition, we really don't want to introduce a new type just to represent these values.

That's where string tokens come into play. They allow us to make objects available via DI without introducing an actual type:

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

Okay awesome, we can use strings and types as tokens to inject dependencies in our application. Unfortunately, using string tokens like this, opens up potential for naming collisions.

## The problem with string tokens

Let's get back to our `config` string token for a second. "config" is a pretty general name, so we probably could've done better naming this thing in the first place. However, even if we come up with a more distinguishable name, there's is literally no guarantee that someone else will use the same string as a token.

Providers are flattened, meaning that, if there are multiple providers with the same token, the last one wins. There is in fact another concept that allows us to define multiple providers for the same token. Those are multi providers, and we've written about them [here](/angular2/2015/11/23/multi-providers-in-angular-2.html).

Let's say we use some sort of third-party library that comes with a set of providers defined like this:

{% highlight js %}
{% raw %}
export const THIRD_PARTY_LIB_PROVIDERS = [
  { provide: 'config', useClass: ThirdParyConfig }
];
{% endraw %}
{% endhighlight %}

Even though, it's not a common pattern to use a string token with a class, it's totally possible to do that, but we really just want to demonstrate the problem here. We can import and use these third-party providers like this:

{% highlight js %}
{% raw %}
import THIRD_PARTY_LIB_PROVIDERS from './third-party-lib';

...
providers = [
  DataService,
  THIRD_PARTY_LIB_PROVIDERS
]
{% endraw %}
{% endhighlight %}

Okay, so far so good. Very often, we don't really know what's defined behind other libraries' providers unless we check out the documentation or the source code. Let's assume we also don't know this time, that there's a string token for `config`, and we try to add our own provider like this:

{% highlight js %}
{% raw %}
...
providers = [
  DataService,
  THIRD_PARTY_LIB_PROVIDERS,
  { provide: configToken, useValue: CONFIG }
]
{% endraw %}
{% endhighlight %}

This will pretty much break our third-party library, because now, the thing that gets injected for the `config` string token is a different object than what the library expects. We basically ran into a naming collision.

## Opaque Tokens to the resque

Luckily, Angular got us covered. It comes with a type called `OpaqueToken` that basically allows us to create string based tokens without running into any collisions.

Creating an `OpaqueToken` is easy. All we need to do is to import and use it. Here's what the third-party providers collection looks like using `OpaqueToken`:

{% highlight js %}
{% raw %}
import { OpaqueToken } from '@angular/core';

const CONFIG_TOKEN = new OpaqueToken('config');

export const THIRD_PARTY_LIB_PROVIDERS = [
  { provide: CONFIG_TOKEN, useClass: ThirdPartyConfig }
];
{% endraw %}
{% endhighlight %}

Of course, this is an implementation detail and we usually shouldn't have to care about what APIs are used inside a third-party library. Let's assume we've created an `OpaqueToken` for our config token as well.

{% highlight js %}
{% raw %}
import { OpaqueToken } from '@angular/core';
import THIRD_PARTY_LIB_PROVIDERS from './third-party-lib';

const MY_CONFIG_TOKEN = new OpaqueToken('config');

...
providers = [
  DataService,
  THIRD_PARTY_LIB_PROVIDERS,
  { provide: MY_CONFIG_TOKEN, useValue: CONFIG }
]
{% endraw %}
{% endhighlight %}

Running this code will show us that, even though our application seems to use the exact same string token for different providers, Angular's DI is still smart enough to figure out which dependency we're interested in. As if we'd have two *different* tokens. And technically, this is exactly what happens.

## Why it works

If we take a look at the implementation of `OpaqueToken` we'll realise that it's just a simple class that almost doesn't do any special work.

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
