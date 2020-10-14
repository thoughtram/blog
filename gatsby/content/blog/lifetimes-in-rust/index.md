---
layout: post
title: "Lifetimes in Rust"
imageUrl: ../../assets/images/lifetimes.jpg
imgCaption: Photo by Ravi Roshan on Unsplash
summary: "Learn what Lifetimes are, why they exist and when you need them. This and more we'll explore in this article."
date: 2020-10-20T00:00:00.000Z
categories:
  - rust
author: pascal_precht
---

Lifetimes are one of the most important, yet probably one of the least understood topics in the Rust programming language. That's no surprise, because they can be hard to grok, especially if there's lack of understanding in how Rust manages memory. What are they, why do they exists and when do we need them? We're going to explore all that in this article.

## Let's start with a little scenario

The first time I heard about the term "lifetime" in the context of Rust, was when I tried implement some struct that holds a reference to another struct instance. If you're coming from other languages, it is in a way the equivalent of having some object holding another object or reference to it. In my case, I wanted to share a reference to some `Config` across different places in my application, so the code looked something like this:

```rust
struct Config {
  ...
}

struct App {
    config: &Config
}
```

If the ampersand syntax (`&Config`) doesn't make a lot of sense to you, you might want to read my article on [References in Rust](/references-in-rust/) first and come back once you're done. Either way, if we try to compile this code, we'll get the following error:

```
error[E0106]: missing lifetime specifier
 --> src/lib.rs:6:13
  |
6 |     config: &Config
  |             ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
5 | struct App<'a> {
6 |     config: &'a Config
```
Apparently the compiler wants something that's called a **named lifetime parameter**, whatever that is, and it also tells us exactly what that needs to look like. If we change our `App` struct accordingly, the code compiles.

```rust
struct App<'a> {
    config: &'a Config
}
```

Well... cool so we've added a bunch of weird syntax to our code and the compiler is happy, but what exactly is going on here?

The short answer is that we tell the compiler, that `config`, which is of type `&Config`, has the same lifetime as `App`. That lifetime happens to be called `a` but could be called really anything else. Because they both have the same lifetime, `App` is not allowed to outlive the referene to `Config`, otherwise it would be a dangling pointer, which Rust doesn't allow by design.

Uff.. what? Yea, right. Let's roll back a bit.

## On Reference Safety

Rust claims to be memory safe and we've talked about that to some extend in this article on [Ownership in Rust](/ownership-in-rust/). In there, we've discussed that Rust "drops" values from memory that go "out of scope" and a scope is pretty much anything that introduces a new block (a lexical block, a statement, an expression etc). Take for example this function:

```rust
fn greeting() {
    let s = "Have a nice day".to_string();
    println!("{}", s); // `s` is dropped here
}
```

The variable `s` is defined inside of `greeting` and a soon as the function is done doing its work, `s` is no longer needed so Rust will drop its value, freeing up the memory. We could say that `s` "lives" as long as the execution of `greeting`.

This is an important concept, especially when it comes to using [references in Rust](/references-in-rust/). Whenever we use references, Rust tries to assign them a **lifetime** that matches the constraints by how their used. Here's a simple example of that:

```rust
fn main() {
    let r;
    {
        let x = 1;
        r = &x;
    }
    println!("{}", r)
}
```

We introduce a variable `r`, that receives a reference to `x` in the following block. Notice that the square brackets really just introduce a new block. We probably wouldn't use them like that in real world applications. After that we print the value of `r`.

However, we'll quickly learn that the compiler isn't really happy about this code:

```
error[E0597]: `x` does not live long enough
 --> src/main.rs:6:13
  |
6 |         r = &x;
  |             ^^ borrowed value does not live long enough
7 |     }
  |     - `x` dropped here while still borrowed
8 |     println!("{}", r)
  |                    - borrow later used here
```

This makes sense. We're printing the value of `r` which holds a reference to `x`, but `x` is dropped from memory before that. In other words, `r` outlives `x`.

```rust
fn main() {
    let r;  –––––––––––––––+
    {       –––––––––––––+ |
        let x = 1;       | <––– // Lifetime of `&x`
        r = &x;          | |
    }       –––––––––––––+ | <––– // Lifetime of `r`
    println!("{}", r) –––––+
}
```

In other words, if the reference doesn't live at least as long as the variable does, `r` will be a dangling pointer at some point.

This might feel like an annoying characteristic of the Rust compiler, but it's actually an extremely powerful feature. Let this sink in for a second: **The compiler is able to derive from your code if and where you're trying to access a variable that potentially points to nothing.** 🤯

To make the code above work, we obviously have to move `x` in a way that its lifetime encloses the one of `r`:

```rust
fn main() {
    let x = 1;
    {
        let r = &x;
        println!("{}", r)
    }
}
```

Sweet. We understand the concept of lifetimes now, but we still don't know when and why we need to apply this weird syntax (`<'a>`) from earlier. Let's dig into that by looking at lifetimes and function arguments.

## Lifetimes and Arguments

Given what we've learned so far, we might wonder how these concepts apply to functions that take references as arguments. You might have already guessed that there's no magic mechanism that removes the idea of lifetimes in Rust, just because a reference is passed to a function. Let's take a look at the function below, which takes any argument that's of type `&i32`:

```rust
fn some_function(val: &i32) {
    ...
}
```

What we don't see here, is that Rust actually expands this code as if it was written like this:

```rust
fn some_function<'a>(val: &'a i32) {
    ...
}
```

Look, there's the `<'a>` again! What's going on here? We've just written out explicitly what Rust allows us to omit. `'a` is a **lifetime parameter** of our `some_function`. It doesn't really matter at this point that we call it `'a`, we might as well call it `'foo` or `'lifetime`, however it's convenient to give it some name that is enumerable (like the alphabet), because there could be more than one lifetime parameter, but more on that later. **Keep in mind however, that lifetimes are a compile-time feature and don't exist at runtime**.

With this signature we're basically saying: `some_function` takes a reference to an `i32` with any given lifetime `'a`. This is enough information for the compiler to know that `some_function` won't save `val` anywhere that might outlife the call. It would be different if `some_function` took a lifetime parameter of `'static`, which is Rust's lifetime for anything that is considered global. In such a case, whatever is passed to the function, needs to live at least as long. By definition, only `static values would match that constraint.

The same applies to functions that return references as well!

## Returning References

Fairly often, functions take references to data structures and return a reference that points **into** that structure. The following function illustrates this case:

```rust
fn smallest_number(n: &[i32]) -> &i32 {
    let mut s = &n[0];
    for r in &n[1..] {
        if r < s {
            s = r;
        }
    }
    s
}
```

`smallet_number` takes a reference to a vector of numbers and returns a reference to a number. By default, Rust will assume that these two references have the same lifetime. So the function signature will be expanded to:

```rust
fn smallest_number<'a>(n: &'a [i32]) -> &'a i32 {
    ...
}
```

Again, we're basically saying: For any lifetime `'a`, `smallest_number` takes a `&[i32]` and returns a `&i32` that has the same lifetime. This ensures that we can't borrow the returned reference from `smallest_number` if it doesn't life at least as long as the variable we've assigned it to. In other words, if we try to compile the this code:

```rust
let s;
{
    let numbers = [2, 4, 1, 0, 9];
    s = smallest_number(&numbers);
}
println!("{}", s)
```

Rust will tell us that `numbers` doesn't live long enough:

```
error[E0597]: `numbers` does not live long enough
 --> src/main.rs:5:29
  |
5 |         s = smallest_number(&numbers);
  |                             ^^^^^^^^ borrowed value does not live long enough
6 |     }
  |     - `numbers` dropped here while still borrowed
7 |     println!("{}", s)
  |                    - borrow later used here
```

Coming back to the scenario we started out with, namely structs that contain references, things make much more sense now.

## Structs with references

When it comes to actual type definitions, like the ones we've started out with in this article, as soon as it contains references, we have to write out their lifetimes. The code bwlow won't compile.

```rust
struct Config {
  ...
}

struct App {
    config: &Config
}
```

While this one does:


```rust
struct Config {
  ...
}

struct App<'a> {
    config: &'a Config
}
```

You might be wondering: Why can't the compiler simply expand our types with lifetimes just like it does with functions?

Good question! Turns out, earlier versions of the compiler actually did exactly that. However, developers found that part confusing and preferred it to know exactly when one value borrows something from another.

One last thing to note here, if `App` was borrowed in another type, that type will have to define its lifetime parameters as well:

```rust
struct Platform<'a> {
    app: App<'a>
}
```

## Lifetime parameters of different lifetimes

Of course, it's also possible for functions and types to contain references of **different** lifetimes. Say we have a struct `Point` that takes `x` and `y` which are both `&i32`:

```rust
struct Point {
    x: &i32,
    y: &i32
}
```

We've already learned that we have to write out the lifetimes of the references, so we could go ahead and define them like this:


```rust
struct Point<'a> {
    x: &'a i32,
    y: &'a i32
}
```

That's fine, as long as `x` and `y` have indeed the same lifetime. For example, the following code would compile:

```rust
fn main() {
    let x = 3;
    let y = 4;
    
    let point = Point { x: &x, y: &y };
}
```

However, as soon as `x` and `y` have different lifetimes and we're trying to reference one of them outside of the smallest scope, things are not going to fly.

```rust
fn main() {
    let x = 3;
    let r;
    {
        let y = 4;
        let point = Point { x: &x, y: &y };
        r = point.x
    }
    println!("{}", r);
}
```

Rust will have to find a lifetime that works for `point.x` and `point.y` but also **encloses** `r`'s lifetime. Since this code doesn't satisfy that constraint we'll get a compile error:

```
error[E0597]: `y` does not live long enough
  --> src/main.rs:12:39
   |
12 |         let point = Point { x: &x, y: &y };
   |                                       ^^ borrowed value does not live long enough
13 |         r = point.x
14 |     }
   |     - `y` dropped here while still borrowed
15 |     println!("{}", r);
   |                    - borrow later used here
```

To get around this, we can simply say that `Point` has multiple distinct lifetime parameters by extending the type definition like this:

```rust
struct Point<'a, 'b> {
    x: &'a i32,
    y: &'b i32
}
```

## Conclusion

Alright, so we've talked about the fact that Rust keeps its references under control by assigning lifetimes to them. Lifetimes are a compile-time only feature and don't exist at runtime. They ensure that types containing references don't outlive their them, which basically prevents us from writing code that produces dangling poitners. We also learned that in many cases, lifetime definitions can be omitted and Rust fills in the gaps for us. It's also possible to have types with multiple distinct lifetime parameters.

I hope this article gave you a better idea of what lifetimes are, how they work and when and why they are needed.
