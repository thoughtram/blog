---
layout: post
title: "References in Rust"
imageUrl: ../../assets/images/galaxy.jpg
imgCaption: Photo by Shot by Cerqueira on Unsplash
summary: "A fundamental building block to make the language's model of Ownership work. In this article we discuss a few things to be aware of when dealing with references in Rust."
date: 2020-03-17T00:00:00.000Z
categories:
  - rust
author: pascal_precht
---

If you've read our article on [Rust's Ownership](/ownership-in-rust/) or if you've written your first few programs and wondered [what's the difference between String and &str](/string-vs-str-in-rust), you're most likely aware that there's the notion of references in Rust. References enable us to give things like functions an data structures access to values, without transferring ownership. Or, in other words, without **moving** them. In this article we're going to explore references a bit further and take a closer look at some interesting characteristics.

## What are references again?

Just in case you haven't checked out the other linked articles, here's a quick recap:

A reference is a **nonowning pointer type** that references another value in memory. References are created using the borrow-operator `&`, so the following code creates a variable `x` that owns `10` and a variable `r`, that is a reference to `x`:

```rust
let x = 10;
let r = &x;
```

Since `10` is a primitive type, it gets stored on the stack and so does the reference. Here's roughly what it looks like in memory (if "stack" and "heap" are terms that don't make sense to you, you should really have a look at [our article on Ownership in Rust](/ownership-in-rust):

```
                   +–––––––+
                   │       │
            +–––+––V–+–––+–│–+–––+
stack frame │   │ 10 │   │ • │   │ 
            +–––+––––+–––+–––+–––+
                [––––]   [–––]
                  x        r
```

References can point to values anywhere in memory, not just the stack frame. The following code for example, creates a **string slice reference** as discussed in our article on [String vs &str in Rust](/string-vs-str-in-rust):

```rust
let my_name = "Pascal Precht".to_string();

let last_name = &my_name[7..];
```

A `String` is a pointer type that points at the data stored on the **heap**. Notice that the string slice is a reference to a substring of that data and therefore also points at the memory on the heap:

```
                my_name       last_name
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

In case of strings, it's also possible to create **string literals**, which are preallocated readonly memory. So for example `name` in the following code is a reference to a `str` that lives in preallocated memory as part of the program:

```rust
let name = "Pascal";
```

Which looks something like this:

```
            name: &str
            [–––––––]
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

Okay, so what else is there to say about references? A few things. Let's start with **shared references** and **mutable references**.

## Shared and mutable references

As you probably know, variables in Rust are immutable by default. The same applies to references as well. Say we have a `struct Person` and try to compile the code below:

```rust 
struct Person {
  first_name: String,
  last_name: String,
  age: u8
}

let p = Person {
  first_name: "Pascal".to_string(),
  last_name: "Precht".to_string(),
  age: 28
};

let r = &p;

r.age = 29;
```

This will result in an error:

```
error[E0594]: cannot assign to `r.age` which is behind a `&` reference
  --> src/main.rs:16:3
   |
14 |   let r = &p;
   |           -- help: consider changing this to be a mutable reference: `&mut p`
15 |   
16 |   r.age = 29;
   |   ^^^^^^^^^^ `r` is a `&` reference, so the data it refers to cannot be written
```

You can [see it action here](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=3a40de737f8c6d47284fe3e91b04598b). Rust is very clear about the issue and tells us to make `&p` mutable using the `mut` keyword. The same goes for `r` and `p` as well. However, this introduces another characteristic. There can be only one mutable reference at a time.

```rust
let mut r = &mut p;
let mut r2 = &mut p;
```

The code above tries to create two mutable references to the same data. If we try to compile this code, Rust will emit this error:

```
error[E0499]: cannot borrow `p` as mutable more than once at a time
  --> src/main.rs:15:16
   |
14 |   let mut r = &mut p;
   |               ------ first mutable borrow occurs here
15 |   let mut r2 = &mut p;
   |                ^^^^^^ second mutable borrow occurs here
16 |   
17 |   r.age = 29;
   |   ---------- first borrow later used here
```

While it may occur unexpected, it actually makes perfect sense. Rust claims to be memory safe and one of the things that make this claim true, is that there can't be multiple mutable references to the same data. Allowing multiple such references in different parts of the code, there'd be no guarantee that one of them won't mutate the data in an unexpected way.

On the other hand though, it's possible to have as many **shared references** of the same data as needed. So assuming `p` and `r` aren't mutable, doing this would be totally fine:

```rust
let r = &p;
let r2 = &p;
let r3 = &p;
let r4 = &p;
let r5 = &p;
```

It's even possible to have references of references!

```rust
let r = &p;
let rr = &r; // &&p
let rrr = &rr; // &&&p
let rrrr = &rrr; // &&&&p
let rrrrr = &rrrrr; // &&&&&p
```

But wait... How would that be practical? If we pass `r5`, which really is a `&&&&&p`, to a function, how is that function supposed to work with a reference to a reference to a reference to a... you get the idea. Turns out, references can be dereferenced.

## Dereferencing References

References can be dereferenced using the `*`-operator, so one can access their underlying value in memory. If we take the code snippet from earlier where `x` owned `10` and `r` held a reference to it, the reference could be dereferenced as follows for comparison:

```rust
let x = 10;
let r = &x;

if *r == 10 {
  println!("Same!");
}
```

However, let's take a look at this slightly different code:

```rust
fn main() {
  let x = 10;
  let r = &x;
  let rr = &r; // `rr` is a `&&x`

  if is_ten(rr) {
    println!("Same!");
  }
}

fn is_ten(val: &i32) -> bool {
  *val == 10
}
```

`is_ten()` takes a `&i32`, or, a reference to a 32 bit signed integer. The thing we pass to it though, is actually a `&&i32`, or, a reference **to a reference** to a 32 bit signed integer.

So for this to work, it looks like `val: &i32` should actually be `val: &&i32`, and the expression `*val == 10` should be `**val == 10`. In fact, if make those changes to the code it compiles and runs as expected. You can [see it in action here](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=f03305d9cf51f3d242e989eab4b84019). However, it turns out that when **not** making these changes, [the code still compiles](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=dc6b1e4414151ff45a3f123dcd6f4ac6), so what's going on there?

Rust's comparison operators (things like `==` and `>=` etc) are smart enough to traverse a chain of references until they reach a value, as long as both operands have the same type. This means in practice, you can have as many references to references as needed, the "synctactical cost" stays the same as the compiler will figure it out for you!

## Implicit dereferencing and borrowing

At this point, you might be wondering: How come I don't have to use the `*`-operator when calling methods on certain types?

To illustrate this, let's have a look at the `Person` struct from earlier:

```rust
struct Person {
  first_name: String,
  last_name: String,
  age: u8
}

fn main() {
  let pascal = Person {
    first_name: "Pascal".to_string(),
    last_name: "Precht".to_string(),
    age: 28
  };

  let r = &pascal;

  println!("Hello, {}!", r.first_name);
}
```

Notice that, even though we're working with a reference, we didn't have to use the `*`-operator to access the `first_name` property of `r`, which is actually a reference.
**What we're experiencing here is another usability feature of the Rust compiler**. It turns out the `.`-operator performs the dereferencing implicitly, if needed!

The same code can be de-sugared to:

```rust
println!("Hello, {}!", (*r).first_name);
```

The same applies to borrowing references and mutable references as well. For example, an array's `sort()` method needs a `&mut self`. However, we don't have to worry about that when writing code like this:

```rust
fn main() {
  let mut numbers = [3, 1, 2];
  numbers.sort();
}
```

The `.`-operator will implicitly borrow a reference to its left operand. This means, the `.sort()` call is the equivalent of:

```rust
(&mut numbers).sort();
```

🤯 How cools is that? 

## What's next?

If there's one more thing that should be talked about when it comes to references in Rust, it's probably its safety and lifetime characteristics. Those however, we'll discuss in another article very soon, so stay tuned and make sure to sign up to our [Rust For JavaScript Developers](/categories/rust) newsletter!
