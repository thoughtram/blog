---
layout: post
title: "String vs &str in Rust"
imageUrl: ../../assets/images/rust-letters.jpg
imgCaption: Photo by Shaun Bell on Unsplash
summary: "In this article we'll explore the difference between String and str in Rust and when to use which."
date: 2020-03-03T00:00:00.000Z
categories:
  - rust
author: pascal_precht
---

Most likely, soon after you've started your Rust journey, you ran into this scenario where you tried to work with string types (or should I say, you thought you were?), and the compiler refused to compile your code because of something that looks like a string, actually isn't a string.

For example, let's take a look at this super simple function `greet(name: String)` which takes something of type `String` and prints it to screen using the `println!()` macro:

```rust
fn main() {
  let my_name = "Pascal";
  greet(my_name);
}

fn greet(name: String) {
  println!("Hello, {}!", name);
}
```

Compiling this code will result in a compile error that looks something like this:

```sh
error[E0308]: mismatched types
 --> src/main.rs:3:11
  |
3 |     greet(my_name);
  |           ^^^^^^^
  |           |
  |           expected struct `std::string::String`, found `&str`
  |           help: try using a conversion method: `my_name.to_string()`

error: aborting due to previous error

For more information about this error, try `rustc --explain E0308`.
```

You can [see this behaviour in action here](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=c7a2f191abc0eae9a201f1f65c6a4f12). Just hit the "Run" button and look at the compiler output.

Luckily, Rust's compiler is very good at telling us what's the problem. Clearly, we're dealing with two different types here: `std::string::String`, or short `String`, and `&str`. While `greet()` expects a `String`, apparently what we're passing to the function is something of type `&str`. The compiler even provides a hint on how it can be fixed. Changing line 3 to `let my_name = "Pascal".to_string();` fixes the issue.

What's going on here? What is a `&str`? And why do we have to perform an explicit conversion using `to_string()`?

## Understanding the `String` type

To answer these questions, it's beneficial to have a good understanding of how Rust stores data in memory. If you haven't read our article on [Taking a closer look at Ownership in Rust](/ownership-in-rust/) yet, I highly recommend checking it out first.

Let's take the example from above and look at how `my_name` is stored in memory, assuming that it's of type `String` (e.g we've used `.to_string()` as the compiler suggested):

```
                     buffer
                   /   capacity
                 /   /  length
               /   /   /
            +–––+–––+–––+
stack frame │ • │ 8 │ 6 │ <- my_name: String
            +–│–+–––+–––+
              │
            [–│–––––––– capacity –––––––––––]
              │
            +–V–+–––+–––+–––+–––+–––+–––+–––+
       heap │ P │ a │ s │ c │ a │ l │   │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+

            [––––––– length ––––––––]
```

Rust will store the `String` object for `my_name` on the stack. The object comes with a pointer to a heap-allocated buffer which holds the actual data, the buffer's capacity and the length of the data that is being stored. Given this, the size of the `String` object itself is **always fixed and three words long**.

One of the things that make a `String` a `String`, is the capability of resizing its buffer if needed. For example, we could use its `.push_str()` method to append more text, which potentially causes the underlying buffer to increase in size (notice that `my_name` needs to be mutable to make this work):

```rust
let mut my_name = "Pascal".to_string();
my_name.push_str( " Precht");
```

In fact, if you're familiar with Rust's [`Vec<T>`](https://doc.rust-lang.org/std/vec/index.html) type, you already know what a `String` is because it's essentially the same in behaviour and characteristics, just with the difference that it comes with guarantees of only holding well-formed UTF-8 text.

## Understanding string slices

String slices (or `str`) are what we work with when we either reference a range of UTF-8 text that is "owned" by someone else, or when we create them using **string literals**.

If we were only interested in the last name stored in `my_name`, we can get a reference to that part of the string like this:

```rust
let mut my_name = "Pascal".to_string();
my_name.push_str( " Precht");

let last_name = &my_name[7..];
```

By specifying the range from the 7th byte (because there's a whitespace) until the end of the buffer (".."), `last_name` is now a **string slice** referencing text owned by `my_name`. It borrows it. Here's what it looks like in memory:

```
            my_name: String   last_name: &str
            [––––––––––––]    [–––––––]
            +–––+––––+––––+–––+–––+–––+
stack frame │ • │ 16 │ 13 │   │ • │ 6 │ 
            +–│–+––––+––––+–––+–│–+–––+
              │                 │
              │                 +–––––––––+
              │                           │
              │                           │
              │                         [–│––––––– str –––––––––]
            +–V–+–––+–––+–––+–––+–––+–––+–V–+–––+–––+–––+–––+–––+–––+–––+–––+
       heap │ P │ a │ s │ c │ a │ l │   │ P │ r │ e │ c │ h │ t │   │   │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+
```

Notice that `last_name` does not store capacity information on the stack. This is because it's just a reference to a slice of another `String` that manages its capacity. The string slice, or `str` itself, is what's considered "**unsized**". Also, in practice string slices are **always** references so their type will always be `&str` instead of `str`.

Okay, this explains the difference between `String`, `&String` and `str` and `&str`, but we haven't actually created such a reference in our original example, did we?

## Understanding string literals

As mentioned earlier, there are two cases when we're working with string slices: we either create a reference to a sub string, or we use **string literals**.

A string literal is created by surrounding text with double quotes, just like we did earlier:

```rust
let my_name = "Pascal Precht"; // This is a `&str` not a `String`
```

The next question is, if a `&str` is a slice reference to a `String` owned by someone else, who is the owner of that value given that the text is created in place?

It turns out that string literals are a bit special. They are string slices that refer to **"preallocated text"** that is stored in **read-only** memory as part of the executable. In other words, it's memory that ships with our program and doesn't rely on buffers allocated in the heap.

That said, there's still an entry on the stack that points to that preallocated memory when the program is executed:

```
            my_name: &str
            [–––––––––––]
            +–––+–––+
stack frame │ • │ 6 │ 
            +–│–+–––+
              │                 
              +––+                
                 │
 preallocated  +–V–+–––+–––+–––+–––+–––+
 read-only     │ P │ a │ s │ c │ a │ l │
 memory        +–––+–––+–––+–––+–––+–––+

```

With a better understanding of the difference between `String` and `&str`, there's probably another question that comes up.

## Which one should be used?

Obviously, this depends on a number of variables, but generally, it's safe to say that, if the API we're building doesn't need to own or mutate the text it's working with, it should take a `&str` instead of a `String`. This means, an improved version of the original `greet()` function would look like this:

```rust
fn greet(name: &str) {
  println!("Hello, {}!", name);
}
```

Wait, but what if the caller of this API really only has a `String` and can't convert it to a `&str` for unknown reasons? No problem at all. Rust has this super powerful feature called **deref coercing** which allows it to turn any passed `String` reference using the borrow operator, so `&String`, to a `&str` before the API is executed. This will be covered in more detail in another article.

Our `greet()` function therefore will work with the following code:

```rust
fn main() {
  let first_name = "Pascal";
  let last_name = "Precht".to_string();

  greet(first_name);
  greet(&last_name); // `last_name` is passed by reference
}

fn greet(name: &str) {
  println!("Hello, {}!", name);
}
```

See it in action [here](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=0fd3fcd6a4a00fdebf30844a15fe6f52)!

That's it! I hope this article was useful. There's an [interesting discussion on Reddit](https://www.reddit.com/r/rust/comments/fcuq8x/understanding_string_and_str_in_rust/) about this content as well! Let me know what you think or what you would like to learn about next [on twitter](https://twitter.com/PascalPrecht) or sign up for the [Rust For JavaScript Developers](/categories/rust) mailing list!
