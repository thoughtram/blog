---
layout: post
title: Multi Providers in Angular
date: 2015-11-23T00:00:00.000Z
update_date: 2016-12-18T00:00:00.000Z
summary: >-
  Multi-providers allow us to extend existing dependencies in Angular. Read on
  to learn when this is useful!
categories:
  - angular2
tags:
  - angular2
topic: di
author: pascal_precht
relatedLinks:
  - title: Exploring Angular 2 - Article Series
    url: /exploring-angular-2
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

The new dependency injection system in Angular comes with a feature called "Multi Providers" that basically enable us, the consumer of the platform, to hook into certain operations and plug in custom functionality we might need in our application use case. We're going to discuss what they look like, how they work and how Angular itself takes advantage of them to keep the platform flexible and extendible.

## Recap: What is a provider?

If you've read our article on [Dependency Injection in Angular](/angular/2015/05/18/dependency-injection-in-angular-2.html) you can probably skip this section, as you're familiar with the provider terminology,  how they work, and how they relate to actual dependencies being injected. If you haven't read about providers yet, here's a quick recap.

**A provider is an instruction that describes how an object for a certain token is created.**

Quick example: In an Angular component we might have a `DataService` dependency, which we can ask for like this:

```js
import { DataService } from './data.service';

@Component(...)
class AppComponent {

  constructor(dataService: DataService) {
    // dataService instanceof DataService === true
  }
}
```

We import the **type** of the dependency we're asking for, and annotate our dependency argument with it in our component's constructor. Angular knows how to create and inject an object of type `DataService`, if we configure a provider for it. This can happen either on the application module, that bootstrap our app, or in the component itself (both ways have different implications on the dependency's life cycle and availability).

```js
// application module
@NgModule({
  ...
  providers: [
    { provide: DataService, useClass: DataService }
  ]
})
...

// or in component
@Component({
  ...
  providers: [
    { provide: DataService, useClass: DataService }
  ]
})
class AppComponent { }
```

In fact, there's a shorthand syntax we can use if the instruction is `useClass` and the value of it the same as the token, which is the case in this particular provider:

```js
@NgModule({
  ...
  providers: [DataService]
})
...

// or in component
@Component({
  ...
  providers: [DataService]
})
class AppComponent { }
```

Now, whenever we ask for a dependency of type `DataService`, Angular knows how to create an object for it.

## Understanding Multi Providers

With multi providers, we can basically provide **multiple dependencies for a single token**. Let's see what that looks like. The following code manually creates an injector with multi providers:

```js
const SOME_TOKEN: OpaqueToken = new OpaqueToken('SomeToken');

var injector = Injector.create([
  { provide: SOME_TOKEN, useValue: 'dependency one', multi: true },
  { provide: SOME_TOKEN, useValue: 'dependency two', multi: true }
]);

var dependencies = injector.get(SOME_TOKEN);
// dependencies == ['dependency one', 'dependency two']
```

**Note**: We usually don't create injectors manually when building Angular applications since the platform takes care of that for us. This is really just for demonstration purposes.

A token can be either a string or a type. We use a string, because we don't want to create classes to represent a string value in DI. However, to provide better error messages in case something goes wrong, we can create our string token using `OpaqueToken`. We don't have to worry about this too much now. The interesting part is where we're registering our providers using the `multi: true` option.

Using `multi: true` tells Angular that the provider is a multi provider. As mentioned earlier, with multi providers, we can provide multiple values for a single token in DI. That's exactly what we're doing. We have two providers, both have the same token but they provide different values. If we ask for a dependency for that token, what we get is a list of all registered and provided values.

**Okay understood, but why?**

Alright, fine. We can provide multiple values for a single token. But why in hell would we do this? Where is this useful? Good question!

Usually, when we register multiple providers with the same token, the last one wins. For example, if we take a look at the following code, only `TurboEngine` gets injected because it's provider has been registered at last:

```js
class Engine { }
class TurboEngine { }

var injector = Injector.create([
  { provide: Engine, deps: []},
  { provide: Engine, useClass: TurboEngine, deps: [] }
]);

var engine = injector.get(Engine);
// engine instanceof TurboEngine
```

This means, with multi providers we can basically **extend** the thing that is being injected for a particular token. Angular uses this mechanism to provide pluggable hooks.

One of these hooks for example are validators. When creating a validator, we need to add it to the `NG_VALIDATORS` multi provider, so Angular picks it up when needed

```js
@Directive({
  selector: '[customValidator][ngModel]',
  providers: [
    provide: NG_VALIDATORS,
    useValue: (formControl) => {
      // validation happens here
    },
    multi: true
  ]
})
class CustomValidator {}
```

Multi providers also can't be mixed with normal providers. This makes sense since we either extend or override a provider for a token.

## Other Multi Providers

The Angular platform comes with a couple more multi providers that we can extend with our custom code. At the time of writing these were

- **`NG_VALIDATORS`** - Interface that can be implemented by classes that can act as validators
- **`NG_ASYNC_VALIDATORS`** - Token that can be implemented by classes that can act as async validators

## Conclusion

Multi providers are a very nice feature to implement pluggable interface that can be extended from the outside world. The only "downside" I can see is that multi providers only as powerful as what the platform provides. `NG_VALIDATORS` and `NG_ASYNC_VALIDATORS` are implemented right into the platform, which is the only reason we can take advantage of those particular multi providers. There's no way we can introduce our own custom multi providers (with a specific token) that influences what the platform does, but maybe this is also not needed.
