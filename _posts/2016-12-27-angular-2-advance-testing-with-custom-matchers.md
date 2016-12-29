---
layout: post
title: Testing Angular Directives with Custom Matchers
date: 2016-12-27T00:00:00.000Z
update_date: 2016-12-27T00:00:00.000Z
imageUrl: /images/banner/testing-directives-with-custom-matchers.jpg
summary: >-
  Deliver terse, DRY, self-documenting unit tests with Angular using custom
  Jasmine Matchers and  Helper functions.
categories:
  - angular
tags:
  - angular2
  - karma
  - jasmine
  - unit tests
  - testing
  - directives
  - custom matchers
  - typescript
  - special helper functions
  - DRY
topic: testing
author: thomas_burleson
related_posts:
  - Testing Services with Http in Angular
  - Two-way Data Binding in Angular
  - Resolving route data in Angular
  - Angular Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular
related_videos:
  - '193524896'

---

## Preface 

A few weeks ago, Pascal Precht wrote a blog article on 
[Testing Services with HTTP with Angular](http://blog.thoughtram.io/angular/2016/11/28/testing-services-with-http-in-angular-2.html).
In this article, we want to discuss more advanced topics on DRY Angular testing techniques 
using **Custom Matchers** and **Special Helpers**.

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

These are techniques to make your unit-tests incredibly easy to read and to maintain. And to achieve 
our learning goals, there are three (3) important testing topics that we want to cover:

*  (1) [Testing custom Angular **Directives**](#testing-directives)
*  (2) [Building reusable, DRY TestBed **Helper** methods](#testing-with-helpers)
*  (3) [Using Typescript Jasmine **Custom Matchers**](#custom-matchers)

> These techniques are practically undocumented... yet they dramatically improve the quality of 
our tests.

To whet your appetite, here are some sample DRY tests that we will be showing you how to write:

![Unit Test with Matchers and Helpers](/images/dry_tests/example1.jpg)

![Testing Nested DOM Styles](/images/dry_tests/example2.jpg)

## Background

There a several excellent resources already available that developers can read to 
learn about Angular testing:

*  [Angular 2 - Testing Guide](https://medium.com/google-developer-experts/angular-2-testing-guide-a485b6cb1ef0#.2ytwy9k9w) (by [Gerard Sans](https://twitter.com/gerardsans))
*  [Angular 2 - Unit Testing Recipes](https://medium.com/google-developer-experts/angular-2-unit-testing-with-jasmine-defe20421584#.cmk3cg9bc) (by [Gerard Sans](https://twitter.com/gerardsans))
*  [Testing with the Angular CLI](https://www.sitepoint.com/angular-2-tutorial/?utm_campaign=NG-Newsletter&utm_medium=email&utm_source=NG-Newsletter_180) 
(by [Todd Motto](https://twitter.com/toddmotto), [Jurgen Van de Moere](https://twitter.com/jvandemo))
*  [Testing Angular 2 Components](http://chariotsolutions.com/blog/post/testing-angular-2-components-unit-tests-testcomponentbuilder/) (by [Ken Rimple](https://twitter.com/krimple))

The biggest take-aways from these articles is the singular concept that instead of manually 
instantiating and testing classes, Angular developers <u>should consider using</u> 
the `TestBed.configureTestingModule()` to prepare an entire test Angular DI **environment** for each
test module (*.spec.ts).

> We would not use `TestBed.configureTestingModule()` when we are testing a service that 
doesn't have any dependencies. It'd be easier and less verbose to just instantiate using `new`. The 
**TestBed** is for useful for dependencies and injections.

## A Traditional Test

Consider the traditional approach of manual construction:

{% highlight js %}
{% raw %}
import { ServiceA } from './services/ServiceA';

describe('ServiceA', () => {
  it('should emit greeting event', () => {
    let inst = new ServiceA();
    inst.greeting.subscribe(g => {
       expect(g).toEqual({greeting:'hello'});
    });
    inst.sayHello();
  });
});
{% endraw %}
{% endhighlight %}

> Note that it's fine to do it this way, because **ServiceA** obviously does not need anything 
else to be instantiated; it is a self-contained service without external dependencies. So assuming 
that this service won't get any dependencies in the future, this test is the one we want to write.  

## Introducing Angular TestBed

The Angular **TestBed** allows developers to configure **ngModules** that provide instances/values and use 
Dependency Injection. This is the same approach developers use in their regular Angular applications. 

With the **TestBed** and its support for for component-lifecycle features, Angular components can be 
easily instantiated and tested. Here is an example - shown below - that we will continue to 
use in this article:

{% highlight js %}
{% raw %}
import { MyComponent } from './viewer/MyComponent';

/**
 * Configure testbed to register components and prepare services
 */
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ FlexLayoutModule.forRoot() ],
    declarations: [MyComponent],
    
    // 'MatchMedia' construction requires BreakPointRegistry
    // 'MyComponent' construction requires MatchMedia parameter
    
    providers: [
      BreakPointRegistry,
      BreakPointsProvider,
      {
        provide: MatchMedia,
        useClass: MockMatchMedia
      }
    ]
  })
});

/**
 * Helper function to easily build a component Fixture using the specified template
 */
function createTestComponent(template: string): ComponentFixture<Type<any>>
{
  return TestBed
    .overrideComponent(MyComponent, {set: {template: template}} )
    .createComponent(MyComponent);
}
{% endraw %}
{% endhighlight %}

Before each test, we want configure a new, fresh testing module with <u>only</u> the providers, 
components, and directives we <u>need for the current test module</u>. 

> And notice that we just created a reusable **Helper** function: `createTestComponent()`. 
This cool utility function will construct an instance of MyComponent [using the configured TestBed] 
using any custom HTML template you specify. 

At first, this complexity may seem like overkill. But let's consider two critical requirements 
shown in the sample above:

* **MatchMedia** instantiation requires an injected **BreakPointRegistry** instance
* **MyComponent** instantiation requires an injected **MatchMedia** instance

Even with these requirements, testing developers should NOT have to worry about all those internals just 
to test **MyComponent**. Using ngModule, DI, and Angular... we now don't have to worry about those 
details.

This is just like those real-world scenarios where our components, directives, and services will 
have complex dependencies upon providers and non-trivial construction processes. 

And this is where **TestBed** demonstrates its real value!

> We are not using external templates nor any other resources or services that are asynchronous. 
So we do not discuss the `async()` nor the the `TestBed::compileComponents()` functions. 

## 1) Testing Directives

With relative ease, developers can find literature on testing Angular Services and Components. 
Yet the <u>How-to's for testing Directives</u> is oddly not well documented.


Unlike Components with their associated templates, Directives do not have templates. This means 
that we **cannot** simply import a Directive and manually instantiate it. 

The solution is rather easy! We only need to:

* configure a TestBed that imports and declares the directive(s),
* prepare a shell test Component, and
* use a custom template which uses the Directive selector(s) as attribute(s).


Since Directives usually affect the **host element**, our tests will check if those changes to the host 
element are present and valid.

So let's use the Angular [Flex-Layout](http://github.com/angular/flex-layout) library as the basis 
for the following discussions on Directives, Matchers, and TestBed Helpers.

> Real-world solutions often provide great examples for reusable techniques.

We will be using both the **fxLayout** directive and excerpts from the unit test for that directive 
to explore testing ideas, techniques, and solutions that we can also use in our own tests.

First, let's import the FlexLayout library into our own tests and prepare to test the *fxLayout* 
directive.

> You can see the actual testing code in [layout.spec.ts](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts). 
<br/>But **don't** jump there yet! Wait until you have finished reading this article.


### Configuring the TestBed

Very similar to the TestBed sample shown above, we will configure a testing module but we will 
not *import* an external test component. My test component `TestLayoutComponent` is itself defined 
within our test (*.spec.ts) module.

> Using an internal test component enables each test module <br/>e.g. <br/>`<directive>.spec.ts`<br/> to define 
and use its own custom test component with custom properties.

Here is the initial configuration:

{% highlight js %}
{% raw %}
import {Component, OnInit} from '@angular/core';
import {ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FlexLayoutModule,
  MockMatchMedia,
  MatchMedia,
  BreakPointsProvider,
  BreakPointRegistry
} from '@angular/flex-layout';

describe('layout directive', () => {

  beforeEach(() => {

    // Configure testbed to prepare services
    TestBed.configureTestingModule({
      imports: [FlexLayoutModule.forRoot()],
      declarations: [TestLayoutComponent],
      providers: [
        BreakPointRegistry, BreakPointsProvider,
        {provide: MatchMedia, useClass: MockMatchMedia}
      ]
    })
  });

  it('should add correct styles for default `fxLayout` usage', () => {
			// TEST LOGIC HERE
  });

});

/*
 * Shell component with property 'direction' that will be used
 * with our tests
 */
@Component({
  selector: 'test-layout',
  template: `<span>PlaceHolder HTML to be Replaced</span>`
})
export class TestLayoutComponent implements OnInit {
  direction = "column";
  constructor() {   }
  ngOnInit() {   }
}

/*
 * Custom Helper function to quickly create a `fixture` instance based on
 * the 'TestLayoutComponent' class
 */
function createTestComponent(template: string): ComponentFixture<TestLayoutComponent>
{
  return TestBed
    .overrideComponent(TestLayoutComponent, {set: {template: template}} )
    .createComponent(TestLayoutComponent);
}
{% endraw %}
{% endhighlight %}

We now have everything we need to write a Directive test quickly.

{% highlight js %}
{% raw %}
it('should compile with custom directives', () => {
  let fixture = createTestComponent(`<div fxLayout></div>`);
  expect( fixture ).toBeDefined();
});
{% endraw %}
{% endhighlight %}

Wow! That is pretty easy. 

> The component has been constructed and prepared with the same 
processes and DI that your real world application will use.

Let's first write our test using the traditional long-form... one without custom matchers and the 
more advanced helper methods.

Since the **fxLayout** directive will add custom flexbox CSS to the host element, our test logic 
here will confirm that the initial CSS is correctly assigned.

### Non-DRY Testing

The traditional approach would probably implement something like this:

{% highlight js %}
{% raw %}
it('should add correct styles for `fxLayout` with template bindings', () => {
  let template = '<div [fxLayout]="direction"></div>';
  let fixture = createTestComponent(template);
  let el = fixture.debugElement.children[0].nativeElement;
  
    fixture.detectChanges();
    
  expect( el.style['display'] ).toBe('flex');
  expect( el.style['box-sizing'] ).toBe('border-box');
  expect( el.style['flex-direction'] ).toBe('column');
 
    fixture.componentInstance.direction = 'row';
    fixture.detectChanges();
    
  expect( el.style['flex-direction'] ).toBe('row'); 
});
{% endraw %}
{% endhighlight %}

In the code above, we 

* defined a custom template with bindings to the component property `direction`, 
* use deeply nested references to get access to the native element,
* test each style individually.

All this in one (1) single test. And truly it is not easily read. 

Now imagine that our test module has more than 20 individual `it(...)` tests!
 
> That would be a lot of duplicate code. And there is certainly nothing DRY ("do not repeat yourself") about 
such code! 

## 2) Testing with Helpers

Above we explored the standard approach to implement unit tests; which resulted 
in verbose, non-reusable code.

Here is the DRY version that we want:

![Testing Directives - DRY Code](/images/dry_tests/example3.jpg)

Now this test is much more readable, maintainable, and DRY. We hide all the 
complexities of:

*  forcing change detection, 
*  accessing the native element, and 
*  confirming  1...n DOM CSS styles 

Those complexities are now encapsulated in a Helper function and a Custom Matcher (respectively). 

The custom Helper function **expectNativeEl( )** is similar to the standard **expect( )** function.
In fact, it is wrapper function that internalizes the `expect( )` call. 

{% highlight js %}
{% raw %}
/**
 * Note: this helper only accesses the 1st-level child within a component
 *       A different helper method is need to access deep-level DOM nodes
 */
export function expectNativeEl(fixture: ComponentFixture<any>): any {
  fixture.detectChanges();

  // Return response of `expect(...)`
  return expect(fixture.debugElement.children[0].nativeElement);
}
{% endraw %}
{% endhighlight %}


> It is important to note that these helper methods always return the value of an `expect(...)` call!

And the resulting code change uses a similar notation to our standard training. So

{% highlight js %}
{% raw %}
expect(...).toBe
{% endraw %}
{% endhighlight %}

becomes

{% highlight js %}
{% raw %}
expectNativeEl(...).toBe
{% endraw %}
{% endhighlight %}


### Testing Nested DOM

For more complex DOM access, we can use the DebugElement's query feature to select nested DOM nodes. 

Angular's **DebugElement** has several query features:

*  `query(predicate: Predicate<DebugElement>): DebugElement;`
*  `queryAll(predicate: Predicate<DebugElement>): DebugElement[];`
*  `queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[];`

> Please note that all debugging apis are currently experimental.

Consider the following helper function **expectDomForQuery( )**:

![pic6](/images/dry_tests/example2.jpg)

In this example, we actually want to test the <u>nested DOM node</u> that hosts the attribute **fxFlex**. 
Using another helper method **expectDomForQuery( )** makes that easy.

{% highlight js %}
{% raw %}
/**
 * Create component instance using custom template, the query for the native DOM node
 * based on the query selector
 */
function expectDomForQuery(template:string, selector:string) : any {
  let fixture = createTestComponent(template);
      fixture.detectChanges();

  // Return response of `expect(...)`
  return expect( queryFor(fixture,selector).nativeElement );
};

/**
 * Don't forget to import the `By` utilities
 */
import {By} from '@angular/platform-browser';

/**
 * Reusable Query helper function
 */
function  queryFor(fixture:ComponentFixture<any>, selector:string):any {
  return fixture.debugElement.query(By.css(selector))
}
{% endraw %}
{% endhighlight %}

And the resulting code change is again a similar notation to our standard training:

{% highlight js %}
{% raw %}
expect(...).toBe
{% endraw %}
{% endhighlight %}

becomes

{% highlight js %}
{% raw %}
expectDomForQuery(...).toBe
{% endraw %}
{% endhighlight %}

 
### More Special Helpers

Earlier, we showed a code snapshot that had a *special helper* `activateMediaQuery( )`:

![Unit Test with Matchers and Helpers](/images/dry_tests/example1.jpg)

The Flex-Layout library has a responsive engine that supports change detection when a mediaQuery 
activates (*aka* when the viewport size changes). The API uses selectors with dot-notation to 
indicate which values should be used for which mediaQuery:

{% highlight html %}
{% raw %}
<div fxLayout="row" fxLayout.md="column"></div>
{% endraw %}
{% endhighlight %}

Testing these features presents several additional requirements:

* mock the window API `window.matchMedia(...)`
* simulate a mediaQuery activation
* trigger fixture.detectChange() after a simulated activation
* hide all these details from indvidual tests (DRY)

Thankfully, the Flex-Layout library actually publishes a MockMatchMedia class; which we used in our 
TestBed configuration:

{% highlight js %}
{% raw %}
let fixture: ComponentFixture<any>;

/**
 * Special Helper
 */
const activateMediaQuery = (alias) => {
  let injector = fixture.debugElement.injector;
  let matchMedia : MockMatchMedia = injector.get(MatchMedia);
  
  // simulate mediaQuery change and trigger fxLayout changes
  matchMedia.activate(alias);
};

beforeEach(() => {
  // Configure testbed to prepare services
  TestBed.configureTestingModule({
    imports: [FlexLayoutModule.forRoot()],
    declarations: [TestLayoutComponent],
    providers: [
      BreakPointRegistry, BreakPointsProvider,
      {provide: MatchMedia, useClass: MockMatchMedia}   //Special mock config
    ]
  })
});
{% endraw %}
{% endhighlight %}

Let's explore three (3) very interesting things are happening in this code: 

*  override DI providers, and
*  dynamic injection using `injector.get(MatchMedia)`
*  use special helper **activateMediaQuery( )** function that hides all these details


**(1) Overriding DI Providers**


{% highlight js %}
{% raw %}
{ provide: MatchMedia, useClass: MockMatchMedia }
{% endraw %}
{% endhighlight %}

tells the TestBed DI system to provide an instance of the `MockMatchMedia` **whenever** any code 
asks for an instance of the `MatchMedia` token to be injected via DI.

> You can read more about the Angular DI systems here:<br/> [Dependency Injection in Angular](http://blog.thoughtram.io/angular/2015/05/18/dependency-injection-in-angular-2.html)

**(2) Dynamic Injection**

Our special helper `activateMediaQuery()` needs a dynamic injected instance of the MatchMedia token. 
Using the `fixture` instance, we can dynamically get a **MockMatchMedia** instance from our fixtures 
injector.

Notice that all this complexity [and construction details] is encapsulated in our TestBed and special 
helper... and the individual tests simply make the easy call:

{% highlight js %}
{% raw %}
activateMediayQuery('md');
{% endraw %}
{% endhighlight %}

That is very, very cool!

## 3) Custom Matchers

We have only one more tool [in our testing toolkit] to discuss: **Custom Jasmine Matchers**.

For those developers not familiar with the concepts of Jasmine *matchers*, we recommend the online 
Jasmine documentation:

<a href="https://jasmine.github.io/2.0/custom_matcher.html" title="Jasmine Matchers Documentation">
![pic9](https://cloud.githubusercontent.com/assets/210413/21524374/334a2f68-ccdb-11e6-816c-5059fc91d806.png)
</a>

Remember that matchers are used **after** the `expect()` call and should encapsulate complex logic 
and reduce code-clutter in our test code.

> This allows our test(s) to remain terse, concise, readable, maintainable, and DRY.

And we should always give our custom matcher functions clear, readable names. E.g. **toHaveCssStyles()**.


### Building a TypeScript Matcher

Similar to `expect(...).toBeTruthy()`, we want a custom matcher `toHaveCSSStyle( )`:

{% highlight js %}
{% raw %}
expectNativeEl(fixture).toHaveCssStyle({
  'display': 'flex',
  'flex-direction': 'row',
  'box-sizing': 'border-box'
});
{% endraw %}
{% endhighlight %}

Creating a matcher in JavaScript is documented on the Jasmine site. Our challenge is the harder 
goal of creating a *custom matcher* implemented in TypeScript using well-defined types.

* we need to enhance the `expect()` API, and 
* we need to implement custom matchers.

The global Jasmine `expect()` method normally returns `<any>` value. To use custom matchers 
(with types), we want the **expect( )** function to support returning either a standard matcher or 
a custom matcher.

Here is a teaser that shows how that is done:

{% highlight js %}
{% raw %}
export const expect: (actual: any) => NgMatchers = <any> _global.expect;

export interface NgMatchers extends jasmine.Matchers { /* ... */ };
{% endraw %}
{% endhighlight %}

We assigned the global *expect* function reference to a new export that states that `expect()` calls 
now return references to a **NgMatchers** interface.
  
Here are the full implementation details of our `custom-matchers.ts` module:

{% highlight js %}
{% raw %}
declare var global: any;
const _global = <any>(typeof window === 'undefined' ? global : window);

/**
 * Extend the API to support chaining with custom matchers
 */
export const expect: (actual: any) => NgMatchers = <any> _global.expect;

/**
 * Jasmine matchers that support checking custom CSS conditions.
 * !! important to add your custom matcher to the interface
 */
export interface NgMatchers extends jasmine.Matchers {
  toHaveCssStyle(expected: {[k: string]: string}|string): boolean;
  not: NgMatchers;
}

/**
 * Implementation of 1...n custom matchers
 */
export const customMatchers: jasmine.CustomMatcherFactories = {
  // Here is our custom matcher; cloned from @angular/core
  toHaveCssStyle: function () {
    return {
      compare: function (actual: any, styles: {[k: string]: string}|string) {
        let allPassed: boolean;
        if (typeof styles === 'string') {
          allPassed = getDOM().hasStyle(actual, styles);
        } else {
          allPassed = Object.keys(styles).length !== 0;
          Object.keys(styles).forEach(prop => {
            allPassed = allPassed && getDOM().hasStyle(actual, prop, styles[prop]);
          });
        }

        return {
          pass: allPassed,
          get message() {
            const expectedValueStr = typeof styles === 'string' ? styles : JSON.stringify(styles);
            return `Expected ${actual.outerHTML} ${!allPassed ? ' ' : 'not '}to contain the
                      CSS ${typeof styles === 'string' ? 'property' : 'styles'} "${expectedValueStr}"`;
          }
        };
      }
    };
  }

};
{% endraw %}
{% endhighlight %}

With the above definitions, we can now use `expect(...).toHaveCssStyles(...)` without any 
TypeScript complaints.

Wait! 

We need one to discuss one more addition to our custom-matcher code. Did you notice the call to 
**getDOM()**.hasStyle() ? But where does `getDOM` come from? 

After some inspection of the **@angular/core** code, we were able to 
get a reference to the special Angular DOM Adapter:

{% highlight js %}
{% raw %}
import {__platform_browser_private__} from '@angular/platform-browser';
const getDOM = __platform_browser_private__.getDOM;
{% endraw %}
{% endhighlight %}

> Please note that the **getDOM()** is a private Angular API and may change in the future.

### Using a Custom Matcher

Now we are *golden* with features. Let's import and use our custom Jasmine matcher.

{% highlight js %}
{% raw %}
import {customMatchers} from '../utils/testing/custom-matchers';

describe('layout directive', () => {

  beforeEach(() => {
    jasmine.addMatchers(customMatchers);

    // TestBed stuff here...
  });

});
{% endraw %}
{% endhighlight %}

Notice that we must register the custom matchers in a `beforeEach()` call to configure the 
matchers for each subsequent test. And now everything is ready for the individual tests:

{% highlight js %}
{% raw %}
expect(...).toHaveCssStyle({
  'display': 'flex',
  'flex-direction': 'row',
  'box-sizing': 'border-box'
});
{% endraw %}
{% endhighlight %}

## Protractor + e2e

It should be noted that the above sample tests confirm whether CSS styles have been applied 
correctly to the DOM element. Unit tests perform tests logic and state... but those same 
tests cannot easily test how those values affect renderings in the UI.

Jasmine unit tests **do not** test whether the CSS styles or states render the elements in the 
browser as expected. Nor do they test renderings across different browsers. Those types of visual 
tests are best performed in e2e testing with Protractor and visual differencing tools.

## Summary

Perhaps you will say: "Wow, this is cool... but totally overkill!"  If you are tempted to say that, 
then look at all the DRY tests here: 
[layout.spec.ts](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts#L45). 
You will quickly see the value of using helpers and custom matchers.

You now have the techniques and tools to create your own custom matchers and deliver quality, terse 
unit tests.

Enjoy!

## Resources

* [Custom Matchers](https://github.com/angular/flex-layout/blob/master/src/lib/utils/testing/custom-matchers.ts): a full set of custom Jasmine Matchers
* [Special Helpers](https://github.com/angular/flex-layout/blob/master/src/lib/utils/testing/helpers.ts): a reusable, importable set of Helpers
* [Usage Samples](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts#L45): a full DRY set of usages.

> The Flex-Layout Helper functions are actually partial applications (function currying). Here is 
[How to use](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts#L16-L17) them.



