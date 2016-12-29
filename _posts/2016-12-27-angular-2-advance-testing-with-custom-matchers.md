---
layout: post
title: Angular Testing Directives with Custom Matchers
date: 2016-12-27T00:00:00.000Z
update_date: 2016-12-27T00:00:00.000Z
imageUrl: /images/banner/testing-directives-with-custom-matchers.jpg
summary: >-
  Deliver terse, DRY, self-documenting Karma tests with Angular using custom Jasmine Matchers and 
  Helper functions.
categories:
  - angular
tags:
  - angular2
  - karma
  - jasmine
  - testing directives
  - custom matchers
  - typescript
  - special helper functions
  - DRY
topic: testings
author: thomas_burleson
related_posts:
  - Testing Services with Http in Angular
related_videos:
  - '193524896'

---

This is not another article on basic Jasmine/Karma testing with Angular 2. Rather this is a more 
advanced article on DRY Karma testing techinques using **Custom Matchers** and **Special Helpers**... 
these techniques will make your unit-tests incredibly easy to read and to maintain.

To achieve our goals, there are three (3) important testing topics that we must cover:

* Testing custom Angular **Directives**
* Building reusable, DRY TestBed **Helper** methods
* Using Typescript Jasmine **Custom Matchers**

These techniques are practically undocumented... yet they are also fundamentally critical to writing 
quality tests.

To whet your appetite, here are some sample DRY tests that we will be learning how to write:

![pic1](https://cloud.githubusercontent.com/assets/210413/21514513/8a9690ea-cc8b-11e6-98ac-2a66a42f023d.png)

![pic2](https://cloud.githubusercontent.com/assets/210413/21514536/bf6531dc-cc8b-11e6-8d5f-fad4a1d82be9.png)

### Background

To be fair there a several excellent resources available to learn about Angular Karma testing:

*  [Angular 2 - Testing Guide](https://medium.com/google-developer-experts/angular-2-testing-guide-a485b6cb1ef0#.2ytwy9k9w) (by Gerard Sans)
*  [Angular 2 - Unit Testing Recipes](https://medium.com/google-developer-experts/angular-2-unit-testing-with-jasmine-defe20421584#.cmk3cg9bc) (by Gerard Sans)
*  [Testing with the Angular CLI](https://www.sitepoint.com/angular-2-tutorial/?utm_campaign=NG-Newsletter&utm_medium=email&utm_source=NG-Newsletter_180) (by Todd Moto, Jurgen Van de Moere)
*  [Testing Angular 2 Components](http://chariotsolutions.com/blog/post/testing-angular-2-components-unit-tests-testcomponentbuilder/) (by Ken Rimple)

The biggest take-aways from these ^ articles is the singular concept that instead of using 
*imports* and manually instantiating and testing classes, developers <u>should be using</u> 
the `TestBed.configureTestingModule()` to prepare an entire test Angular DI **environment**.

###### Traditional Approach:

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

###### Angular Approach:

TestBed allows developers to configure **ngModules** that provide instances/values and use 
Dependency Injection... just like those processes developers use in their regular Ng applications. 

And Angular components can be easily instantiated and tested using the **TestBed** with its support 
for component-lifecycle features.

{% highlight js %}
{% raw %}
// 'MatchMedia' construction requires BreakPointRegistry
// 'MyComponent' construction requires MatchMedia parameter

import { MyComponent } from './viewer/MyComponent';

// Configure testbed to register components and prepare services
beforeEach(() => {

  TestBed.configureTestingModule({
    imports: [ FlexLayoutModule.forRoot() ],
    declarations: [MyComponent],
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
// Helper function to easily build a component Fixture using the specified template
function createTestComponent(template: string): ComponentFixture<Type<any>>
{
  return TestBed
    .overrideComponent(MyComponent, {set: {template: template}} )
    .createComponent(MyComponent);
}
{% endraw %}
{% endhighlight %}

Before each test, we want configure a new, fresh testing module with <u>only</u> the providers, 
components, and directives we need. And we use `createTestComponent()` to allow us to easily 
specify a custom template to be used when instantiating a component.

At first, this complexity may seem like overkill. But let's consider two critical requirements 
shown in the sample above:

* `MatchMedia` instantiation requires an injected `BreakPointRegistry` instance
* `MyComponent` instantiation requires an injected `MatchMedia` instance

Even with these requirements, developers should NOT have to worry about all these internals just 
to test **MyComponent**. Using ngModule, DI, and Angular... we now don't have to worry about those 
details.

This is just like those real-world scenarios where your components, directives, and services will 
have complex dependencies upon providers and non-trivial construction processes. 

And this is where **TestBed** demonstrates its real value!

> I am not using external templates nor any other resources or services that are asynchronous. 
So I do not discuss the `async()` wrapper function: since I do not need to asynchronously prepare 
the TestBed nor `compileComponents()`.

### 1) Testing Angular Directives

With relative ease, developers can find literature on testing Angular Services and Components. 
Yet the <u>How-to's for testing Directives</u> is oddly not well documented.


Unlike Components with their associated templates, Directives do not have templates. This means 
that we cannot simply **import** a Directive and create it. 

Yet the solution is rather easy! We must:

* configure a TestBed that imports and declares the directive(s),
* prepare a shell test Component, and
* use a custom template which uses the Directive selector(s) as attribute(s).


Since Directives usually affect the host element, our tests will check if those changes to the host 
element are present and valid.

###### Testing the fxLayout Directive

I have found that real-world exmaples provide the best examples for solutions and reusable techniques.

So let's use the Angular [Flex-Layout](http://github.com/angular/flex-layout) library as the basis 
for the following discussions on Directives, Matchers, and TestBed Helpers.

We will be using excerpts of the karma tests for the **fxLayout** directive as real examples. The 
solutions and techniques used in those tests are the same ones that you can also use in your own 
tests.

First, let's import the FlexLayout library into our own tests and prepare to to Test the fxLayout 
directive.

> You can see the actual testing code in [layout.spec.ts](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts). 
But **don't** jump there yet! Wait until you have finished reading this article.


###### Configuring the TestBed, Component Shell, and Helpers

Very similar to the TestBed sample shown above, we will configure a testing module but we will 
not *import* an external test component. Our test component `TestLayoutComponent` is itself defined 
within our test (*.spec) file.

> Using an internal test component enables each `<directive>.spec.ts` to define and use its own 
custom test component with custom properties.

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

Wow! That is pretty easy... and the component has been constructed and prepared with the same 
processes and DI that your real world application would use.

### 2) Using DRY Helper Methods

Let's first write out test using the traditional long-form... one without custom matchers and the 
more advanced helper methods.

Since the **fxLayout** directive will add custom flexbox CSS to the host element, our test logic 
will confirm that the initial CSS is correctly assigned.

###### Test Directive Logic: Long-Form

The traditional approach would probably implement something like this:

![pic4](https://cloud.githubusercontent.com/assets/210413/21525027/fd15cf06-ccdf-11e6-8da2-3ac91d5b9d08.png)



Above we defined a custom template with bindings to the component property `direction`. Then we use 
deeply nested references to get access to the native element... and then we test each style individually.

To exacerbate this issue, imagine that our test module has more than 20 individual `it(...)` tests! 
That is a lot of duplicate code. And there is certainly nothing DRY ("do not repeat yourself") about 
this code! 

###### Test Directive Logic: Short-Form

Here is the DRY version that we want:

![pic51](https://cloud.githubusercontent.com/assets/210413/21514729/2656a662-cc8e-11e6-8b7a-0594ea3cf120.png)

All the complexities of forcing change detection, accessing the native element, and confirming  
1...n DOM CSS styles is now easily encapsulated in a Helper function and a Custom Matcher 
(respectively). 

Instead of using the standard `expect(...)` method, we define a custom *expect* Helper function 
`expectNativeEl( <fixture> )`:

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

And the resulting code change is a similar notation to our standard training:

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

For more complex DOM access, we can use a Query to select nested DOM nodes. Consider the following:

![pic6](https://cloud.githubusercontent.com/assets/210413/21514536/bf6531dc-cc8b-11e6-8d5f-fad4a1d82be9.png)

In this example ^, we actually want to test the nested DOM node with the attribute **fxFlex**. 
Using another *helper* method makes that easy.

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

##### Special Helpers

Earlier, I showed a code snapshot that had a *special helper* `activateMediaQuery( )`:

![pic8](https://cloud.githubusercontent.com/assets/210413/21514513/8a9690ea-cc8b-11e6-98ac-2a66a42f023d.png)

The Flex-Layout library has a responsive engine that supports change detection when a mediaQuery 
activates (*aka* when the viewport size changes). The API uses selectors with dot-notation to 
indicate which values should be used for which mediaQuery:

{% highlight html %}
{% raw %}
<div fxLayout="row" fxLayout.md="column"></div>
{% endraw %}
{% endhighlight %}

Testing these features presents several additional requirements. We need to be able to :

* mock the window API `window.matchMedia(...)`
* simulate a mediaQuery activation
* trigger fixture.detectChange() after a simulated activation
* hide all these details from indvidual tests (DRY)

The Flex-Layout library actually publishes a MockMatchMedia class... and our earlier TestBed 
configuration showed how we setup the DI:

{% highlight js %}
{% raw %}
let fixture: ComponentFixture<any>;

/**
 * Special Helper
 */
let activateMediaQuery = (alias) => {
      let matchMedia : MockMatchMedia = fixture.debugElement.injector.get(MatchMedia);
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

Two (2) very interesting things are happening here: override DI providers and dynamic injection

(1) Overriding DI Providers:

Using

{% highlight js %}
{% raw %}
{ provide: MatchMedia, useClass: MockMatchMedia }
{% endraw %}
{% endhighlight %}

tells the TestBed DI system to provide an instance of the `MockMatchMedia` **whenever** any code 
asks for an instance of the `MatchMedia` token to be injected via DI.

(2) Dynamic Injection

Our special helper `activateMediaQuery()` needs a dynamic injected instance of the MatchMedia token. 
Using the `fixture` instance, we can dynamically get a **MockMatchMedia** instance from our fixtures 
injector.

Notice that all this complexity [and construction details] is encapsulated in our TestBed and special 
helper... and the individual tests simply make the call:

{% highlight js %}
{% raw %}
activatemediayQuery('md');
{% endraw %}
{% endhighlight %}

That is very, very cool!

### Custom Matchers

We have only one more tool - in our testing toolkit - to discuss: Custom Jasmine Matchers.

For those developers not familiar with the concepts of Jasmine *matchers*, I recommend the online 
Jasmine documentation:

<a href="https://jasmine.github.io/2.0/custom_matcher.html" target="_blank">
![pic9](https://cloud.githubusercontent.com/assets/210413/21524374/334a2f68-ccdb-11e6-816c-5059fc91d806.png)
</a>

Remember that matchers are used **after** the `expect()` call and should encapsulate custom or 
complex logic testings.

> This allows our test(s) to remain terse, concise, readable, maintainable, and DRY.

###### Building a Typescript Matcher

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
goal of creating a *custom matcher* implemented in TypeSript and well-defined types.

First we need to enhance the `expect()` API and then implement custom matchers.

The global Jasmine `expect()` method normally returns `<any>` value. To use custom matchers 
(with types), we want the **expect** to support returning a custom matcher.

Here is how we do that in a `custom-matchers.ts` module:

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
 */
export interface NgMatchers extends jasmine.Matchers {
  toHaveCssStyle(expected: {[k: string]: string}|string): boolean;
  not: NgMatchers;
}

/**
 * Implementation of 1...n custom matchers
 */
export const customMatchers: jasmine.CustomMatcherFactories = {

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

Wait... we need one more addition to our custom-matcher code. Notice the call to 
`getDOM().hasStyle()` ?

Where does `getDOM` come from ? After some inspection of the @angular/core code, I was able to 
get a reference to the special Angular DOM Adapter:

{% highlight js %}
{% raw %}
import {__platform_browser_private__} from '@angular/platform-browser';
const getDOM = __platform_browser_private__.getDOM;
{% endraw %}
{% endhighlight %}

Now we are golden with features. Let's import and use our jasmine matcher.

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

Notice that we must add the custom matchers in a `beforeEach()` call to configure the 
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

### Summary

Perhaps you will say: "Wow, this is cool... but totally overkill!" 

If you are tempted to say that, then look at all the DRY tests here: 
[layout.spec.ts](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts#L45). 
You will quickly see the value of using helpers and custom matchers.

Now you have the techniques and tools to create your own custom matchers and deliver quality, terse 
Karma tests.

Enjoy!

### Resources

* [Custom Matchers](https://github.com/angular/flex-layout/blob/master/src/lib/utils/testing/custom-matchers.ts): a full set of custom Jasmine Matchers
* [Special Helpers](https://github.com/angular/flex-layout/blob/master/src/lib/utils/testing/helpers.ts): a reusable, importable set of Helpers
  *  The Flex-Layout Helper functions are actually partial applications (function currying).
  *  Here is [How to use](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts#L16-L17) them.
* [Usage Samples](https://github.com/angular/flex-layout/blob/master/src/lib/flexbox/api/layout.spec.ts#L45): a full DRY set of usages.

### When to use Protractor + e2e

It should be noted that the above sample tests confirm whether CSS styles have been applied 
correctly to the DOM element. Karma tests can test logic and state values... but those same 
tests cannot easily test how those values affect renderings in the UI.

Jasmine/Karma tests **do not** test whether the CSS styles or states render the elements in the 
browser as expected. Nor do they test renderings across different browsers.

Those types of visual tests are best performed in e2e testing with Protractor and visual 
differencing tools.



