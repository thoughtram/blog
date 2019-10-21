---
layout: post
title: "A closer look at Ownership in Rust"
imageUrl: ../../assets/images/earth-from-space.jpg
imgCaption: Photo by NASA on Unsplash
summary: "In this article we'll take a closer look at Rust's Ownership model and how it manages memory."
date: 2019-10-28T00:00:00.000Z
categories:
  - rust
author: pascal_precht
---

So you want to learn Rust and keep hearing about the concept of Ownership and Borrowing, but can't fully wrap your head around what it is. Ownership is so essential that it's good to understand it early on in your journey of learning Rust, also to avoid running into compiler errors that keep you from implementing your programs.

In our [previous](/rust/2015/05/11/rusts-ownership-model-for-javascript-developers.html) article, we've already talked about the Ownership model from a JavaScript developer's perspective. In this article we'll take a closer look at how Rust manages memory and why this ultimately affects how we write our code in Rust and preserve memory safety.

## What is Memory Safety anyway?

First and foremost it's good to understand what memory safety actually means when it comes to discussing what makes Rust stand out as a programming language. Especially when coming from a non-systems programming background, or with mainly experience in garbage collected languages, it might be a bit harder to appreciate this fundamental feature of Rust.

As Will Crichton states in his great article [Memory Safety in Rust: A Case Stud with C](http://willcrichton.net/notes/rust-memory-safety/):

"_Memory safety is the property of a program where memory pointers used always point to valid memory, i.e. allocated and of the correct type/size. Memory safety is a correctness issue—a memory unsafe program may crash or produce nondeterministic output depending on the bug._"

In practice, this means that there are languages that allow us to write "memory unsafe" code, in the sense that it's fairly easy to introduce bugs. Some of those bugs are:

- **Dangling pointers**: Pointers that point to invalid data (this will make more sense once we look at how data is stored in memory). You can read more about dangling pointers [here](https://stackoverflow.com/questions/17997228/what-is-a-dangling-pointer).
- **Double frees**: Trying to free the same memory location twice, which can lead to "undefined behaviour". More on that [here](https://stackoverflow.com/questions/21057393/what-does-double-free-mean).

To illustrate the concept of a dangling pointer, let's take a look at the following **C++ code** and how it is represented in memory:

```c
std::string s = "Have a nice day";
```

The initialized string is usually represented in memory using the **stack** and **heap** like this:

```
                     buffer
                   /   capacity
                 /   /    length
               /   /    /
            +–––+––––+––––+
stack frame │ • │ 16 │ 15 │ <– s
            +–│–+––––+––––+
              │
            [–│––––––––––––––––––––––––– capacity ––––––––––––––––––––––––––]
              │
            +–V–+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+
       heap │ H │ a │ v │ e │   │ a │   │ n │ i │ c │ e │   │ d │ a │ y │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+

            [––––––––––––––––––––––––– length ––––––––––––––––––––––––––]
```

We'll get into what stack and heap are in a second, but for now it's important to appreciate that what gets stored on the stack is the `std::string` object itself which is of a three words long, fixed size. The fields are a pointer to the **heap-allocated** buffer which holds the actual data, the buffers capacity and the length of the text. In other words, the `std::string` **owns** its buffer. When the program destroys this string, it'll free the corresponding buffer as well through the string's destructor.

However, it's totally possible to create other pointer objects to a character living inside that same buffer which won't get destroyed as well, leaving them invalid after the string has been destroyed, and there we have it - a dangling pointer!

If you wonder how this is not exactly an issue when you write programs in languages like JavaScript or Python, the reason for that is that those languages are **garbage collected**. This means that the language comes with a program that, at run-time, will traverse the memory and free everything up that is no longer in use. Such program is called a Garbage Collector. While this sounds like a nice thing to have, of course garbage collection comes at a cost. Since it happens at run-time of your program, it can certainly affect the program's overall run-time performance.

Rust does not come with garbage collection, instead, it solves the issue of guaranteeing memory safety using ownership and borrowing. When we say that Rust comes with memory safety, we refer to the fact that, by default, **Rust's compiler doesn't even allow us to write code that is not memory safe**. How cool is that?

## Stack and Heap

Before we jump into how Rust handles Ownership of data, let's quickly touch on what the stack and heap are and how they relate to which data gets stored where.

Both, stack and heap, are parts of memory but are represented in different data structures. While the stack is... well, a stack, where values are stored in order as they come in, and removed in the opposite order (which are very fast operations), a heap is more like a tree structure that requires a bit more computational effort to read and write data.

What goes onto the stack and what onto the heap depends on what data we're dealing with. In Rust, any data of fixed size (or "known" size at compile time), such as machine integers, floating-point numeric types, **pointer types** and a few others, are stored on the stack. Dynamic and "unsized" data is stored on the heap. This is because often these types of unkown size either need to be able to to dynamically grow, or because they need to do certain "clean up" work when destructed (more than just popping a value off the stack).

That's why in the previous example, the string object itself is actually a pointer stored on the stack, which is always of fixed size (a buffer pointer, capacity and length), whereas the buffer (the raw data) is stored on the heap.

As for Rust, generally the language avoids storing data on the heap and the compiler will never **implicitly** do so either. To make it explicit, Rust comes with certain pointer types such as [Box<T>](https://doc.rust-lang.org/book/ch15-02-deref.html?highlight=Box%3CT%3E#defining-our-own-smart-pointer), which we'll cover in another article. For more information on stack and heap I highly recommend taking a look at [Rust's official chapter on Ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html).

## Understanding Ownership

Now that we have a little bit of a better understanding of how data is stored, let's take a closer look at Ownership in Rust. In Rust, every value has a single owner that determines its lifetime. If we take the C++ code from above and look at the Rust equivalent, the data is stored in memory pretty much the same way.

```rust
let s = "Have a nice day".to_string();
```

Similarly, when the owner of some value is "freed", or in Rust lingo, "dropped", the owned value is dropped as well. When are values dropped? This is where it gets interesting. When the program leaves a block in which a variable is declared, that variable will be dropped, dropping its value with it.

A block could be a function, an if statement, or pretty much anything that introduces a new code block with curly braces. Assuming we have the following function:

```rust
fn greeting() {
  let s = "Have a nice day".to_string();
  println!("{}", s); // `s` is dropped here
}
```

Just by looking at the code, we know the lifetime of `s` because we know that Rust will drop its value when it reaches the end of the function block. The same applies when we deal with more complex data structures. Let's take a look at the following code:

```rust
let names = vec!["Pascal".to_string(), "Christoph".to_string()];
```

This creates a vector of names. A vector in Rust is like an array, or list, but it's dynamic in size. We can `push()` values into it at run-time. Our memory will look something like this:

```
            [–– names ––]
            +–––+–––+–––+
stack frame │ • │ 3 │ 2 │
            +–│–+–––+–––+
              │
            [–│–– 0 –––] [–––– 1 ––––]
            +–V–+–––+–––+–––+––––+–––+–––+–––+
       heap │ • │ 8 │ 6 │ • │ 12 │ 9 │       │
            +–│–+–––+–––+–│–+––––+–––+–––+–––+
              │\   \   \  │
              │ \   \    length
              │  \    capacity
              │    buffer │
              │           │
            +–V–+–––+–––+–––+–––+–––+–––+–––+
            │ P │ a │ s │ c │ a │ l │   │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+
                          │
                          │
                        +–V–+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+
                        │ C │ h │ r │ i │ s │ t │ o │ p │ h │   │   │   │
                        +–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+

```

Notice how the vector object itself, similar to the string object earlier, is stored on the stack with its capacity, and length. It also comes with a pointer, pointing at the location in the heap where the vector data is located. The string objects of the vector are then stored on the heap, which in turn own their dedicated buffer.

This creates a tree structure of data where every value is owned by a single variable. When `names` goes out of scope, its values will be dropped which eventually cause the string buffers to be dropped as well.

This probably raises a couple of questions though. How does Rust ensure that only a single variable owns its value? How can we have multiple variables point at the same data? Are we forced to copy everything to ensure only a single variable owns some value?

## Moves and Borrowing

Let's start with the first question: How does Rust ensure that only a single variable owns its value? It turns out that Rust __moves__ values to their new owner when doing things like value assignment or passing values to functions. This is a very important concept as it affects how we write code in Rust.

Let's take a look at the following code:

```rust
let name = "Pascal".to_string();
let a = name;
let b = name;
```

Coming from languages like Python or JavaScript, we'd probably expect that both `a` and `b` will have a reference to `name` and therefore will both point at the same data. However, when we try to compile this code, we soon realize that this is not the case:

```
error[E0382]: use of moved value: `name`
 --> src/main.rs:4:11
  |
2 |   let name = "Pascal".to_string();
  |       ---- move occurs because `name` has type `std::string::String`, which does not implement the `Copy` trait
3 |   let a = name;
  |           ---- value moved here
4 |   let b = name;
  |           ^^^^ value used here after move
```

We get a compiler error with a lot of (useful) information. The compiler tells us that we're trying to assign the value from `name` to `b` **after** it had been moved to `a`. The problem here is that, by the time we're trying to assign the value of `name` to `b`, `name` doesn't actually own the value anymore. Why? Because ownership has been moved to `a` in the meantime.

Let's take a look at what happens in memory to get a better understanding of what's going on. When `name` is initialized, it looks very similar to our examples earlier:

```
            +–––+–––+–––+
stack frame │ • │ 8 │ 6 │ <– name
            +–│–+–––+–––+
              │
            +–V–+–––+–––+–––+–––+–––+–––+–––+
       heap │ P │ a │ s │ c │ a │ l │   │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+
```

However, when we assign the value of `name` to `a`, we **move** ownership to `a` as well, leaving `name` uninitialized:

```
            [–– name ––] [––– a –––]
            +–––+–––+–––+–––+–––+–––+
stack frame │   │   │   │ • │ 8 │ 6 │ 
            +–––+–––+–––+–│–+–––+–––+
                          │
              +–––––––––––+
              │
            +–V–+–––+–––+–––+–––+–––+–––+–––+
       heap │ P │ a │ s │ c │ a │ l │   │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+
```

At this point, it's no surprise that the expession `let b = name` will result in an error. What's important to appreciate here is that all of this is static analysis done by the compiler without actually running our code!

Remember when I said Rust's compiler doesn't allow us to write memory unsafe code?

So how do we handle cases like these? What if we really want to have multiple variables point at the same data? There are two ways to deal with this, and depending on the case we want to go with one or the other. Probably the easiest but also most costly way to handle this scenario is to copy or clone the value. Obviously, that also means we'll end up duplicating the data in memory:

```rust
let name = "Pascal".to_string();
let a = name;
let b = a.clone();
```
Notice that we don't need to clone the value from `name` into `a` because we're not trying to read a value from `name` after its value has been assigned to `a`. When we run this program, the data will be represented in memory like this before its dropped:


```
            [–– name ––] [––– a –––][–––– b ––––]
            +–––+–––+–––+–––+–––+–––+–––+–––+–––+
stack frame │   │   │   │ • │ 8 │ 6 │ • │ 8 │ 6 │
            +–––+–––+–––+–│–+–––+–––+–│–+–––+–––+
                          │           │
              +–––––––––––+           +–––––––+
              │                               │
            +–V–+–––+–––+–––+–––+–––+–––+–––+–V–+–––+–––+–––+–––+–––+–––+–––+
       heap │ P │ a │ s │ c │ a │ l │   │   │ P │ a │ s │ c │ a │ l │   │   │
            +–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+–––+
```

Obviously, cloning data isn't always an option. Depending on what data we're dealing with, this can be a quite expensive operation with a lot of memory preassure. Often, all we really need is a **reference** to a value. This is especially useful when we write functions that don't actually need ownership of a value. Imagine a function `greet()` that takes a name and simply outputs it:

```
fn greet(name: String) {
  println!("Hello, {}!", name);
}
```
This function doesn't need ownership to output the value it takes. Also, it would prevent us from calling the function multiple times with the same variable:

```rust
let name = "Pascal".to_string();
greet(name);
greet(name); // Move happened earlier so this won't compile
```

To get a reference to a variable we use the `&` symbol. With that we can be explict about when we expect a reference over a value:

```
fn greet(name: &String) {
  println!("Hello, {}!", name);
}
```

For the record, we would probably design this API to expect a `&str` instead for various reasons, but I don't want to make it more confusing as it needs to be so we'll just stick with a `&String` for now.

`greet()` now expects a string reference, which also enables us to call it multiple times like this:

```rust
let name = "Pascal".to_string();
greet(&name);
greet(&name);
```
When a function expects a reference to a value, it **borrows* it. Notice that it never gets ownership of the values that are being passed to it.

We can address the variable assignment from earlier in a similar fashion:

```rust
let name = "Pascal".to_string();
let a = &name;
let b = &name;
```
With this code, `name` never loses ownership of its value and `a` and `b` are just pointers to the same data. The same can be expressed with:

```rust
let name = "Pascal".to_string();
let a = &name;
let b = a;
```

Calling `greet()` in between those assignments is no longer problem either:


```rust
let name = "Pascal".to_string();
let a = &name;
greet(a);
let b = a;
greet(a);
```

## Conclusion

This was really just the tip of the iceberg. There are a few more things to consider when it comes to Ownership, Borrowing and Moving data, but hopefully this artice conveys a good basic understanding of what's going on behind the scenes on how Rust ensures memory safety.

More articles on Rust to come!
