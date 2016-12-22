---
layout: post
title: Testing Services with Http in Angular
imageUrl: /images/banner/testing-services-with-http-in-angular-2.jpg
date: 2016-11-28T00:00:00.000Z
update_date: 2016-12-18T00:00:00.000Z
summary: >-
  Want to learn how to test services in Angular that have an Http dependency?
  Read more here!
categories:
  - angular
tags:
  - angular2
  - services
  - http
  - testing
author: pascal_precht
related_posts:
  - Two-way Data Binding in Angular
  - Resolving route data in Angular
  - Angular Animations - Foundation Concepts
  - Angular 2 is out - Get started here
  - Bypassing Providers in Angular
  - Custom Form Controls in Angular
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

Testing is important. That's why Angular comes with a testing story out-of-the-box. Due to its dependency injection system, it's fairly easy to mock dependencies, swap out Angular modules, or even create so called "shallow" tests, which enable us to test Angular components, without actually depending on their views (DOM). In this article we're going to take a look at how to unit test a service that performs http calls, since there's a little bit more knowledge required to make this work.

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

## The Service we want to test

Let's start off by taking a look at the service want to test. Sure, sometimes we actually want to do test-driven development, where we **first** create the test and **then** implement the actual service. However, from a learning point of view, it's probably easier to grasp testing concepts when we first explore the APIs we want to test.

At thoughtram, we're currently recording screencasts and video tutorials, to provide additional content to our blog readers. In order to make all these videos more explorable, we're also building a little application that lets users browse and watch them. The video data is hosted on Vimeo, so we've created a service that fetches the data from their API.

Here's what our `VideoService` roughly looks like:

{% highlight js %}
{% raw %}
import { Injectable, Inject } from '@angular/core';
import { VIMEO_API_URL } from '../config';

import 'rxjs/add/operator/map';

@Injectable()
export class VideoService {

  constructor(private http: Http, @Inject(VIMEO_API_URL) private apiUrl) {}

  getVideos() {
    return this.http.get(`${this.apiUrl}/videos`)
                    .map(res => res.json().data);
  }
}
{% endraw %}
{% endhighlight %}

`getVideos()` returns an `Observable<Array<Video>>`. This is just an excerpt of the actual service we use in production. In reality, we cache the responses so we don't peform an http request every single time we call this method. 

> **Special Tip**: If the `@Inject()` decorator is new to you, make sure to checkout this [article](/angular/2015/09/17/resolve-service-dependencies-in-angular-2.html)


To use this service in our application, we first need to create a provider for it on our application module, later we will use it in our tests:

{% highlight js %}
{% raw %}
@NgModule({
  imports: [HttpModule]
  providers: [VideoService]
  ...
})
export class AppModule {}
{% endraw %}
{% endhighlight %}

Since the API returns an Observable, we need to subscribe to it to actually perform the http request. That's why the call side of the method looks something like this:

{% highlight js %}
{% raw %}
@Component()
export class VideoDashboard {
  
  private videos = [];

  constructor(private videoService: VideoService) {}

  ngOnInit() {
    this.videoService.getVideos()
        .subscribe(videos => this.videos = videos);
  }
}
{% endraw %}
{% endhighlight %}

Notice how we're passing a callback function to access the video data that is emitted by the Observable. We need to keep that in mind when testing these methods, because we can't call them synchronously. To get an introduction to Observables in conjunction with Angular, make sure to read [this article](/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html).

Alright, now that we know what the service we want to test looks like, let's take a look at writing the tests.

## Configuring a testing module

Before we can start writing test specs for our service APIs, we need to configure a testing module. This is needed because in our tests, we want to make sure that we aren't performing actual http requests and use a `MockBackend` instead. Our goal is to isolate the test scenario as much as we can without touching any other **real** dependencies. Since NgModules configure injectors, a testing module allows us to do exactly that.

When testing services or components that don't have any dependencies, we can just go ahead an instantiate them manually, using their constructors like this:

{% highlight js %}
{% raw %}
it('should do something', () => {
  let service = new VimeoService();

  expect(service.foo).toEqual('bar');
});
{% endraw %}
{% endhighlight %}


> **Special Tip**: When testing components and services that don't have any dependencies, we don't necessarily need to create a testing module.

To configure a testing module, we use Angular's `TestBed`. `TestBed` is Angular's primary API to configure and initialize environments for unit testing and provides methods for creating components and services in unit tests. We can create a module that overrides the actual dependencies with testing dependencies, using `TestBed.configureTestingModule()`. 

{% highlight js %}
{% raw %}
import { TestBed } from '@angular/core/testing';

describe('VideoService', () => {

  beforeEach(() => {

    TestBed.configureTestingModule({
      ...
    });

  });
});
{% endraw %}
{% endhighlight %}

This will create an NgModule for every test spec, as we're running this code as part of a `beforeEach()` block. This is a [Jasmine](https://jasmine.github.io/) API. If you aren't familiar with Jasmine, we highly recommend reading their documentation.

Okay, but what does a configuration for such a testing module look like? Well, it's an NgModule, so it has pretty much the same API. Let's start with adding an `import` for `HttpModule` and a provider for `VideoService` like this:

{% highlight js %}
{% raw %}
import { HttpModule } from '@angular/http';
import { VideoService } from './video.service';
import { VIMEO_API_URL } from '../config';
...
TestBed.configureTestingModule({
  imports: [HttpModule],
  providers: [
    { provide: VIMEO_API_URL, useValue: 'http://example.com' },
    VideoService
  ]
});
...
{% endraw %}
{% endhighlight %}

This configures an injector for our tests that knows how to create our `VideoService`, as well as the `Http` service. However, what we actually want is an `Http` service that doesn't really perform http requests. How do we do that? It turns out that the `Http` service uses a `ConnectionBackend` to perform requests. If we find a way to swap that one out with a different backend, we get what we want.

To give a better picture, here's what the constructor of Angular's `Http` service looks like:

{% highlight js %}
{% raw %}
@Injectable()
export class Http {

  constructor(
    protected _backend: ConnectionBackend,
    protected _defaultOptions: RequestOptions
  ) {}

  ...
}
{% endraw %}
{% endhighlight %}

By adding an `HttpModule` to our testing module, providers for `Http`, `ConnectionBackend` and `RequestOptions` are already configured. However, using an NgModule's `providers` property, we can **override** providers that have been introduced by other imported NgModules! This is where Angular's dependency injection really shines!

### Overriding the Http Backend

In practice, this means we need to create a new provider for `Http`, which instantiates the class with a different `ConnectionBackend`. Angular's http module comes with a testing class `MockBackend`. **That** one not only ensures that no real http requests are performed, it also provides APIs to subscribe to opened connections and send mock responses.

With the `useFactory` strategy of a provider configuration, we can then create `Http` instances that use a different `ConnectionBackend`. Here's what that looks like:

{% highlight js %}
{% raw %}
import { HttpModule, Http, BaseRequestOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
...
TestBed.configureTestingModule({
  ...
  providers: [
    ...
    {
      provide: Http,
      useFactory: (mockBackend, options) => {
        return new Http(mockBackend, options);
      },
      deps: [MockBackend, BaseRequestOptions]
    },
    MockBackend,
    BaseRequestOptions
  ]
});
...
{% endraw %}
{% endhighlight %}

Wow, that's a lot of code! Let's go through this step by step:

- We create a new provider for `Http` that uses `useFactory` strategy, so we are in charge of creating the actual service instance.
- `Http` asks for a `ConnectionBackend` and `RequestOptions`. That's why we pass `mockBackend` and `options` to the constructor.
- To make sure Angular knows what we mean by `mockBackend` and `options`, we add `deps: [MockBackend, BaseRequestOptions]`. This is needed because metadata (Type Annotations) in normal functions aren't preserved at runtime.
- We add providers for `MockBackend` and `BaseRequestOptions`

Awesome! We've created a testing module that uses an `Http` service with a `MockBackend`. Now let's take a look at how to actually test our service.

## Testing the service

When writing unit tests with Jasmine, every test spec is written as an `it()` block, where an assertion is made and then checked if that assertion is true or not. We won't go into too much detail here, since there's a lot of documentation for Jasmine out there. We want to test if our `VideoService` returns an `Observable<Array<Video>>`, so let's start with the following `it()` statement:

{% highlight js %}
{% raw %}
describe('VideoService', () => {
  ...
  describe('getVideos()', () => {

    it('should return an Observable<Array<Video>>', () => {
      // test goes here
    });
  });
});
{% endraw %}
{% endhighlight %}

We've also added another nested `describe()` block so we can group all tests that are related to that particular method we test. Okay, next we need to get an instance of our `VideoService`. Since we've created a testing module that comes with all providers for our services, we can use dependency injection to inject instances accordingly.

### Injecting Services

Angular's testing module comes with a helper function `inject()`, which injects service dependencies. This turns out to be super handy as we don't have to take care of getting access to the injector ourselves. `inject()` takes a list of provider tokens and a function with the test code, and it **returns** a function in which the test code is executed. That's why we can pass it straight to our spec and remove the anonymous function we've introduced in the first place:

{% highlight js %}
{% raw %}
import { TestBed, inject } from '@angular/core/testing';
...
it('should return an Observable<Array<Video>>',
  inject([/* provider tokens */], (/* dependencies */) => {
  // test goes here
}));
{% endraw %}
{% endhighlight %}

Cool, now we have all the tools we need to inject our services and write a test. Let's go ahead an do exactly that. Once we have our service injected, we can call `getVideos()` and subscribe to the Observable it returns, to then test if the emitted value is the one we expect.

{% highlight js %}
{% raw %}
it('should return an Observable<Array<Video>>',
  inject([VideoService], (videoService) => {

    videoService.getVideos().subscribe((videos) => {
      expect(videos.length).toBe(4);
      expect(videos[0].name).toEqual('Video 0');
      expect(videos[1].name).toEqual('Video 1');
      expect(videos[2].name).toEqual('Video 2');
      expect(videos[3].name).toEqual('Video 3');
    });
}));
{% endraw %}
{% endhighlight %}

**This test is not finished yet.** Right now we're having a test that expects some certain data that is going to be emitted by `getVideos()`, however, remember we've swapped out the `Http` backend so there's no actual http request performed? Right, if there's no request performed, this Observable won't emit anything. We need a way to fake a response that is emitted when we subscribe to our Observable.

### Mocking http responses

As mentioned earlier, `MockBackend` provides APIs to not only subscribe to http connections, it also enables us to send mock responses. What we want is, when the underlying `Http` service creates a connection (performs a request), send a fake http response with the data we're asserting in our `getVideos()` subscription.

We can subscribe to all opened http connections via `MockBackend.connections`, and get access to a `MockConnection` like this:

{% highlight js %}
{% raw %}
it('should return an Observable<Array<Video>>',
  inject([VideoService, MockBackend], (videoService, mockBackend) => {
    ...
    mockBackend.connections.subscribe((connection) => {
      // This is called every time someone subscribes to
      // an http call.
      //
      // Here we want to fake the http response.
    });
}));
{% endraw %}
{% endhighlight %}

The next thing we need to do, is to make the connection send a response. We use `MockConnection.mockRespond()` for that, which takes an instance of Angular's `Response` class. In order to define what the response looks like, we need to create `ResponseOptions` and define the response body we want to send (which is a string):

{% highlight js %}
{% raw %}
...
const mockResponse = {
  data: [
    { id: 0, name: 'Video 0' },
    { id: 1, name: 'Video 1' },
    { id: 2, name: 'Video 2' },
    { id: 3, name: 'Video 3' },
  ]
};

mockBackend.connections.subscribe((connection) => {
  connection.mockRespond(new Response(new ResponseOptions({
    body: JSON.stringify(mockResponse)
  })));
});
...
{% endraw %}
{% endhighlight %}

Cool! With this code we now get a fake response inside that particular test spec. Even though it looks like we're done, **there's one more thing we need to do**.

### Making the test asynchronous

Because the code we want to test is asynchronous, we need to inform Jasmine when the asynchronous operation is done, so it can run our assertions. This is not a problem when testing synchronous code, because the assertions are always executed in the same tick as the code we test. However, when testing asynchronous code, assertions might be executed later in another tick. That's why we can explicitly tell Jasmine that we're writing an asynchronous test. We just need to also tell Jasmine, when the actual code is "done".

Jasmine usually provides access to a function `done()` that we can ask for inside our test spec and then call it when we think our code is done. This looks something like this:

{% highlight js %}
{% raw %}
it('should do something async', (done) => {
  setTimeout(() => {
    expect(true).toBe(true);
    done();
  }, 2000);
});
{% endraw %}
{% endhighlight %}

Angular makes this a little bit more convenient. It comes with another helper function `async()` which takes a test spec and then runs `done()` behind the scenes for us. This is pretty cool, because we can write our test code as if it was synchronous!

How does that work? Well... Angular takes advantage of a feature called Zones. It creates a "testZone", which automatically figures out when it needs to call `done()`. If you havent heard about Zones before, we wrote about them [here](/angular/2016/01/22/understanding-zones.html) and [here](/angular/2016/02/01/zones-in-angular-2.html).

> **Special Tip**: Angular's `async()` function executes test specs in a test zone!

Let's update our test to run inside Angular's test zone:

{% highlight js %}
{% raw %}
import { TestBed, inject, async } from '@angular/core/testing';
...
it('should return an Observable<Array<Video>>',
  async(inject([VideoService, MockBackend], (videoService, mockBackend) => {
    ...
})));
...
{% endraw %}
{% endhighlight %}

Notice that all we did was wrapping the `inject()` call in an `async()` call.

## The complete code

Putting it all together, here's what the test spec for the `getVideos()` method looks like:

{% highlight js %}
{% raw %}
import { TestBed, async, inject } from '@angular/core/testing';
import {
  BaseRequestOptions,
  HttpModule,
  Http,
  Response,
  ResponseOptions
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { VideoService } from './video.service';
import { VIMEO_API_URL } from '../config';

describe('VideoService', () => {

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        { provide: VIMEO_API_URL, useValue: 'http://example.com' },
        VideoService,
        {
          provide: Http,
          useFactory: (mockBackend, options) => {
            return new Http(mockBackend, options);
          },
          deps: [MockBackend, BaseRequestOptions]
        },
        MockBackend,
        BaseRequestOptions
      ]
    });
  });

  describe('getVideos()', () => {

    it('should return an Observable<Array<Video>>',
        async(inject([VideoService, MockBackend], (videoService, mockBackend) => {

        const mockResponse = {
          data: [
            { id: 0, name: 'Video 0' },
            { id: 1, name: 'Video 1' },
            { id: 2, name: 'Video 2' },
            { id: 3, name: 'Video 3' },
          ]
        };

        mockBackend.connections.subscribe((connection) => {
          connection.mockRespond(new Response(new ResponseOptions({
            body: JSON.stringify(mockResponse)
          })));
        });

        videoService.getVideos().subscribe((videos) => {
          expect(videos.length).toBe(4);
          expect(videos[0].name).toEqual('Video 0');
          expect(videos[1].name).toEqual('Video 1');
          expect(videos[2].name).toEqual('Video 2');
          expect(videos[3].name).toEqual('Video 3');
        });

    })));
  });
});
{% endraw %}
{% endhighlight %}

This pattern works for pretty much every test that involves http operations. Hopefully this gave you a better understanding of what `TestBed`, `MockBackend` and `async` are all about.
