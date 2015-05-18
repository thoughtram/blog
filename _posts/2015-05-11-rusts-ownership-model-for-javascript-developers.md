---
layout:     post
title:      "Rust's Ownership model for JavaScript developers"
date:       2015-05-11
summary:    "Rust is an exciting new system programming language by Mozilla. In this post we explore Rust's concept of ownership that enables the language to achieve 100 % memory safety without garbage collection. We start with a simple JavaScript code and port it to Rust step by step."

categories:
- rust

tags:
- rust

author: christoph_burgdorf
---
It's been roughly one year ago since we organized Hannover's first [Rust meetup](http://blog.thoughtram.io/announcements/rust/meetups/2014/06/24/organizing-hannovers-first-rust-meetup.html). Time has passed on and [nickel](http://nickel.rs/) has grown into a really nice web application framework with a very active community and 31 individual contributors as of the time of writing this.

We also created [clog](https://github.com/thoughtram/clog) a changelog generator that started as a straight port of [conventional-changelog](https://github.com/ajoslin/conventional-changelog) but has since moved on to follow it's own ideas and currently powers projects such as nickel and [clap](https://github.com/kbknapp/clap-rs).

I like to point out that both projects wouldn't have been where they are today without the help of lots of helping hands from a bunch of smart people.

While we wrote a lot about Angular and Git in this blog already, we didn't actually took the time to explore Rust.

Let's change that and start with baby steps. Many readers of this blog are familiar with JavaScript so let's explore a core concept of Rust from the perspective of a JavaScript developer.

##Memory management

Most languages (JavaScript included) use a garbage collector to ensure memory safety.

Well then, what's the job of a garbage collector anyway? Basically it frees up memory that isn't used anymore, that is, memory that nothing in the program points to anymore. Traditionally languages that are not memory safe such as C and C++ delegate that work to the developer. As we all know humans aren't free from failure and so here are some examples of problems that may arise with manual memory management

- access to memory that has already been freed
- trying to free memory that has already been freed (double free)
- not freeing memory at all that rather should have been freed (memory leak)

##The concept of ownership in Rust

Rust doesn't use a garbage collector while still being 100 % memory safe. So how does that work and how does it affect the way we write our code?

Let's explore it by comparing some simple JavaScript code (written in ES6) with it's Rust counterpart.

{% highlight js %}
{% raw %}

class Product {}

class Config {
  constructor(debugMode) {
    this.debugMode = debugMode;
  }
}

class ProductService {
  constructor (config) {
    this._config = config;
  }

  getProduct (id) {
    if (this._config.debugMode) {
      console.log('retrieving product for id' + id)
    }

    return new Product();
  }
}

class BasketService {
  constructor (config) {
    this._config = config;
  }

  addProduct (product) {
    if (this._config.debugMode) {
      console.log('adding product %O', product)
    }
  }
}

let config = new Config (true);

let productService = new ProductService(config);
let basketService = new BasketService(config);

var product = productService.getProduct(1);
basketService.addProduct(product);
{% endraw %}
{% endhighlight %}

It's a simple e-commerce example with four different classes working hand in hand. We have a `Product` class without any functionality because it's sole purpose is to represent a product in this demo context. Then there's a `Config` class which may contain a bunch of configurations such as API endpoints or simply a `debugMode` flag as in our simple example. And last but not least do we have a `ProductService` to retrieve products from and a `BasketService` to put products into a shopping basket. 

Let's fokus on what follows after the definition of those classes.

{% highlight js %}
{% raw %}
let config = new Config (true);

let productService = new ProductService(config);
let basketService = new BasketService(config);

let product = productService.getProduct(1);
basketService.addProduct(product);
{% endraw %}
{% endhighlight %}

We create an instance of a `Config` and pass it to both services. The last two lines show how the two services are used. Easy enough, right?

Let's write the same thing in Rust but instead of directly jumping to the final version let me take you on a journey to illustrate the process of how to get there.

We leave out the `getProduct` and `addProduct` methods for our first implementation as they are just a distraction at this point.

{% highlight rust %}
{% raw %}
struct Product;

struct Config {
    debug_mode: bool
}

struct ProductService {
    config: Config
}
struct BasketService {
    config: Config
}

impl ProductService {

    fn new (config: Config) -> ProductService {
        ProductService {
            config: config
        }
    }
}

impl BasketService {

    fn new (config: Config) -> BasketService {
        BasketService {
            config: config
        }
    }
}

fn main() {
    let config = Config { debug_mode: true };
    let product_service = ProductService::new(config);
    let basket_service = BasketService::new(config);
}
{% endraw %}
{% endhighlight %}

The first thing to notice here is that Rust has no classes but instead has structs. It's out of the scope of this article to discuss the differences though. The second thing to notice is that methods aren't written in the struct definition but are attached to a struct through an `impl` block instead. 

Also does Rust not know any `constructor` concept. Instances of structs can simply be made by writing out the structs name followed by curly braces and a body that initializes all of the structs fields. However it's a common pattern to add a "static" `new` method to the struct that wraps the initialization code. This `new` method is quite compareable to the `constructor` in our ES6 classes.

To get things going we need to put the code that creates a config and both services in the `main` function.

Ok, so we have our first version to try. That wasn't all that hard, was it? But no, what's that? When we try to run the code the compiler tells us that something isn't quite right.


{% highlight rust %}
{% raw %}
src/main.rs:37:45: 37:51 error: use of moved value: `config`
src/main.rs:37     let basket_service = BasketService::new(config);
                                                           ^~~~~~
src/main.rs:36:47: 36:53 note: `config` moved here because it has type `Config`, which is non-copyable
src/main.rs:36     let product_service = ProductService::new(config);
{% endraw %}
{% endhighlight %}

The compiler disallows usage of `config` in line 37 because it moved in line 36. Uhm..what's a move? Let's go back to how this all started. We were talking about memory management and how Rust assures 100 % memory safety without the usage of a garbage collector.

When we look back at the JavaScript version we can see that there are three places in our program that hold a reference to the `config`. Each service holds a reference as well as the calling code that creates `config` in the first place.

Since JavaScript is garbage collected we don't put much thought into that. A garbage collector will just regulary run checks and if it discovers that there is no reference anymore that points to the memory that was allocated for the `config`, it will free it up.

Rust doesn't have a garbage collector but it doesn't force you to manage the memory manually either. Instead it creates new rules to enforce memory safety without garbage collection, namely "Ownership".

Being the owner of an object means that you (and only you) own the right to destroy it.

Let's see what that really means in the context of our program. The comments explain what happens line by line.

{% highlight rust %}
{% raw %}
fn main() {
    let config = Config { debug_mode: true };
    // at this point config is owned by the `main` function
    // which also means the memory would be freed
    // at the end of the main function


    let product_service = ProductService::new(config);
    // at this point config is owned by the `new` method.
    // So the main method is no longer the owner of `config`
    // and further use of `config` is prohibited

    // config can't be used here because `main` doesn't own
    // it any more
    let basket_service = BasketService::new(config);
}
{% endraw %}
{% endhighlight %}

You may be wondering why we can't just continue to use `config` without being the owner. The point is that since the `new` method is now the new owner it may just decide to free up the memory. Keep in mind that the owner has the right to destroy the thing that it owns (either explicitly or implicity when it goes out of scope). 

If we were allowed to use `config` in the last line the memory may already be freed and hell breaks loose. The rust compiler prevents us from a potential runtime crash here.


**The concept of borrowing**

The good news is that we don't **have** to transfer ownership each time we pass something to another method. We can just lend out a reference instead.

Before we refactor our code to have the services borrow the config, we will temporarily simplify the code one last time to make it obvious why the move happens.

{% highlight rust %}
{% raw %}
struct Product;

struct Config {
    debug_mode: bool
}

struct ProductService;
struct BasketService;

impl ProductService {

    fn new (config: Config) -> ProductService {
        ProductService
    }
}

impl BasketService {

    fn new (config: Config) -> BasketService {
        BasketService
    }
}

fn main() {
    let config = Config { debug_mode: true };
    let product_service = ProductService::new(config);
    let basket_service = BasketService::new(config);
}
{% endraw %}
{% endhighlight %}

We removed the config from both services so that the `new` methods still takes the `config` as parameter but doesn't use it at all. We are still running into the same error.

{% highlight rust %}
{% raw %}
src/main.rs:27:45: 27:51 error: use of moved value: `config`
src/main.rs:27     let basket_service = BasketService::new(config);
                                                           ^~~~~~
src/main.rs:26:47: 26:53 note: `config` moved here because it has type `Config`, which is non-copyable
src/main.rs:26     let product_service = ProductService::new(config);
{% endraw %}
{% endhighlight %}

The reason for that lies in the method signature of `new`.

{% highlight rust %}
{% raw %}
fn new (config: Config) -> ProductService
{% endraw %}
{% endhighlight %}

This method signature says: "I'm a method that takes ownership of a `Config` and returns a `ProductService`".

But we can change it to borrow a reference instead.

{% highlight rust %}
{% raw %}
struct Product;

struct Config {
    debug_mode: bool
}

struct ProductService;
struct BasketService;

impl ProductService {

    fn new (config: &Config) -> ProductService {
        ProductService
    }
}

impl BasketService {

    fn new (config: &Config) -> BasketService {
        BasketService
    }
}

fn main() {
    let config = Config { debug_mode: true };
    let product_service = ProductService::new(&config);
    let basket_service = BasketService::new(&config);
}
{% endraw %}
{% endhighlight %}

Whew, this compiles! The `&Config` as the parameter type means that it now borrows a reference instead of taking ownership. The `main` method continues to be the owner with this change.

But there's another thing that we changed. Because the `new` methods now expect a reference instead of the actual type, we need to change the call site, too.

{% highlight rust %}
{% raw %}
let product_service = ProductService::new(&config);
let basket_service = BasketService::new(&config);
{% endraw %}
{% endhighlight %}

The leading `&` before `config` means that we pass the memory address to the config instead of passing the actual data. And that brings us closer to our JavaScript version which also just passes a reference to `config` under the cover.

Let's change our code back to store the config in the services so that the service methods can have access to it.

{% highlight rust %}
{% raw %}
struct Product;

struct Config {
    debug_mode: bool
}

struct ProductService {
    config: &Config
}
struct BasketService {
    config: &Config
}

impl ProductService {

    fn new (config: &Config) -> ProductService {
        ProductService {
            config: config
        }
    }
}

impl BasketService {

    fn new (config: &Config) -> BasketService {
        BasketService {
            config: config
        }
    }
}

fn main() {
    let config = Config { debug_mode: true };
    let product_service = ProductService::new(&config);
    let basket_service = BasketService::new(&config);
}
{% endraw %}
{% endhighlight %}

Unfortunately this gives us another error.

{% highlight rust %}
{% raw %}
src/main.rs:8:13: 8:20 error: missing lifetime specifier [E0106]
src/main.rs:8     config: &Config
                          ^~~~~~~
src/main.rs:11:13: 11:20 error: missing lifetime specifier [E0106]
src/main.rs:11     config: &Config
{% endraw %}
{% endhighlight %}

Rust's memory management relies on a concept of lifetimes to track references. Most of the time you won't even notice it because Rust lets us omit most lifetime annotations. But there are cases where Rust needs lifetime annotations such as when defining structs that hold references.

Since we changed our services to store a reference to a `Config` instead of the `Config` itself rusts expect us to annotate our services with lifetime annotations.

{% highlight rust %}
{% raw %}
struct Product;

struct Config {
    debug_mode: bool
}

struct ProductService<'a> {
    config: &'a Config
}
struct BasketService<'a> {
    config: &'a Config
}

impl<'a> ProductService<'a> {

    fn new (config: &Config) -> ProductService {
        ProductService {
            config: config
        }
    }
}

impl<'a> BasketService<'a> {

    fn new (config: &Config) -> BasketService {
        BasketService {
            config: config
        }
    }
}

fn main() {
    let config = Config { debug_mode: true };
    let product_service = ProductService::new(&config);
    let basket_service = BasketService::new(&config);
}
{% endraw %}
{% endhighlight %}

Whew, that's a lot of new syntax that we haven't seen yet. 

Basically what the `'a` lifetime annotation says is that the `ProductService` can't live longer than the reference to the `Config` that it contains. Rust doesn't infer that constrain for structs by itself so it needs us to bring clarity. The same helds true for the `BasketService` as it also keeps a reference to the `Config`.

The `'a` is really only a name that we get to choose, we could have picked `'config` but short single letter names are mostly used among the Rust community. 

We need to use the life time annotation in the `impl` blocks as well as those are written for the `ProductService` and `BasketService` which introduce those lifetimes. Please note that the `'a` of the `ProductService` is independend of the `'a` of the `BasketService` we could have picked different names for both.

A deep dive into the topic of lifetimes is out of scope for this article but we'll make sure to cover them in more detail with follow up posts.

Now that we got things working with the minimal code needed let's jump to the final version which introduces the `get_product` and `add_product` methods to the services.

{% highlight rust %}
{% raw %}
struct Config {
    debug_mode: bool
}

#[derive(Debug)]
struct Product;

struct ProductService<'a> {
    config: &'a Config
}
struct BasketService<'a> {
    config: &'a Config
}

impl<'a> ProductService<'a> {

    fn new (config: &Config) -> ProductService {
        ProductService {
            config: config
        }
    }

    fn get_product (&self, id: i32) -> Product {
        if self.config.debug_mode {
            println!("retrieving product for id: {:?}", id);
        }

        Product
    }
}

impl<'a> BasketService<'a> {

    fn new (config: &Config) -> BasketService {
        BasketService {
            config: config
        }
    }

    fn add_product (&self, item: Product) {
        if self.config.debug_mode {
            println!("adding product {:?}", item);
        }
    }
}

fn main() {

    let config = Config { debug_mode: true };
    let product_service = ProductService::new(&config);
    let basket_service = BasketService::new(&config);

    let product = product_service.get_product(1);
    basket_service.add_product(product);
}
{% endraw %}
{% endhighlight %}

The rest of the code shouldn't be too scary with the `#[derive(Debug)]` annotation being the only exception. For now let's just accept that those are needed in order to print out the product with the `println!` macro.

The code is a bit more verbose than the JavaScript version which mostly boils down to the fact that JavaScript isn't strongly typed. I still find the Rust code quite expressive and terse if we consider the benefits of safety, memory usage and performance.