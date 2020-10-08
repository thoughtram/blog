---
layout: post
title: "Iterators in Rust"
imageUrl: ../../assets/images/windows.jpg
imgCaption: Shot by Colton Dean Marshall on Unsplash
summary: "Explore the power and flexibility of Iterators to produce sequences of values you can loop over."
date: 2020-10-08T00:00:00.000Z
categories:
  - rust
author: pascal_precht
---

Whether you're new to programming or have many years of experience in solving problems and implementing algorithms, chances are high you've heard about and used iterators at some point. Iterators are objects that produce sequences of values, so they can be iterated or looped over. Or, in other words, every time you ended up using a `for` loop in your program, you were most likely interacting with some kind of iterator.

Obviously, Rust comes with support for loops and iterators as well, and, just like in many other languages, iterators can be implemented from scratch. In this article we're going to take a closer look at the `Iterator` and `IntoIterator` traits to create iterators and turning existing types into iterators as well.

## Understanding the `Iterator` trait

Alright, let's start off by inspecting the following code snippet:

```rust
let names = vec!["Pascal", "Elvira", "Dominic", "Christoph"];

for name in names {
    println!("{}", name);
}
```

We've got a `Vec<&str>` of names and print out each and every one of them by iterating over it with a `for` loop. Nothing too fancy going on here. Oh by the way, if you're wondering what `&str` means, check out this article about [String vs &str in Rust](/string-vs-str-in-rust/).

The next snippet is very similar:

```rust
let mut book_reviews = HashMap::new();

book_reviews.insert(
    "Search Inside Yourself".to_string(),
    "A great book about meditation.".to_string(),
);

book_reviews.insert(
    "Limitless".to_string(),
    "Unleash the potential of your brain!".to_string(),
);

for review in book_reviews {
    println!("{}: {}", review.0, review.1);
}
```

This time however, we're dealing with a `HashMap<String, String>`. Still, we're able to simply iterate over `book_reviews`, how come that's possible? You've probably already guessed that there's some mechanism in place that ensures Rust treats these types as something we can iterate over. There are some things going on here, but the first important bit is that `for` loops consume any type that implement the `Iterator` trait.

Here's what it looks like:

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    ...
}
```

The `Iterator` trait comes with a `next()` method that returns `Option<Self::Item>`. The exact type of `Self::Item` depends on the values the iterator produces. What's more interesting however, is that it's wrapped in an `Option`. `next()` returns the next value of the iterator and because it could potentially run out of values, returning an `Option` enables the API to return `None` in such cases. This also means that iterators are stateful because they keep track of where they are in the iteration process. There are some more methods attached to the trait but we can ignore those for now.

Okay cool, we use `Vec<T>` and `HashMap<K, V>` (and other collection types) in `for` loops so they most likely implement the `Iterator` trait. However if we try to call `next()` on them like this:

```rust
let names = vec!["Pascal", "Elvira", "Dominic", "Christoph"];
names.next();
```

We'll get a compiler error telling us that there's no such API:

```
error[E0599]: no method named `next` found for struct `std::vec::Vec<&str>` in the current scope
 --> src/main.rs:9:11
  |
9 |     names.next();
  |           ^^^^ method not found in `std::vec::Vec<&str>`
```

What's going on here? Well, it turns out that there's another trait in place that ensures our loop indeed receives an `Iterator`. That trait is the `IntoIterator` trait.

## Iterables with `IntoIterator`

When there's a "natural way" to iterate over some type, it can implement the `IntoIterator` trait. `IntoIterator` comes with an `into_iter()` method that returns an iterator over its value. Here's what it looks like:

```rust
trait IntoIterator where Self::IntoIter::Item == Self::Item {
    type Item;
    type IntoIter: Iterator;
    fn into_iter(self) -> Self::IntoIter;
}
```

Any type that implements `IntoIterator` is also called an **Iterable**. So how does this trait play a role in the original scenario we've discussed? If we have a `for` loop that looks like this:

```rust
let names = vec!["Pascal", "Elvira", "Dominic", "Christoph"];

for name in names {
    println!("{}", name);
}
```

It actually desugars to something like this:

```rust
let mut iterator = (names).into_iter();
while let Some(name) = iterator.next() {
    println!("{}", name);
}
```

Aha! Our `for` loop actually takes care of turning an Iterable into an Iterator by calling `into_iter()` on it! This also works when iterators are passed directly to `for` loops, because any type that implements `Iterator` also implements `IntoIterator`, which then just simply returns the iterator itself:

```rust
let names = vec!["Pascal", "Elvira", "Dominic", "Christoph"];

let iterator = (names).into_iter();

for name in iterator {
    println!("{}", name); 
}
```

Obviously, in this particular case there's no additional value in doing that. However, when we deal with types like `Range` and other iterator types, everything works just as expected. If you're curious about what other built-in iterator types are there, keep on reading!

## Creating iterator using `iter()` and `iter_mut()`

There are actually different ways in Rust to create iterators from types. While the `IntoIterator` and its `into_iter()` method are mostly called implicitly when we use `for` loops, `iter()` and `iter_mut()` methods are often provided by collection types to create iterators explicitly. There's no trait that provides `iter()` and `iter_mut()`, so it's more of a convention that collection types may implement these methods. 

The example from above can then be written as follows:

```rust
let names = vec!["Pascal", "Elvira", "Dominic", "Christoph"];

let mut iterator = (names).iter(); // or iter_mut() respectively

println!("{}", iterator.next().unwrap());
println!("{}", iterator.next().unwrap());
println!("{}", iterator.next().unwrap());
println!("{}", iterator.next().unwrap());
```

So what's the point of having `iter()` und `iter_mut()` when there's `into_iter()`, which seems to do the same thing? As always, the devil is in the details as [this StackOverFlow answer](https://stackoverflow.com/a/34745885/1531806) illustrates very nicely.

As mentioned before, `IntoIterator` implementations mostly come into play in combination with `for` loops. One thing to keep in mind here, is that we probably want the flexibility to consume our iterable values to be by value **or** (mutable) reference depending on our context. 

If this doesn't make a lot of sense to you, you might want to read this article on [References in Rust](/references-in-rust) and come back once you're done.

In other words, we want to be able to any of the following:

```rust
for element in &collection { ... }
for element in &mut collection { ... }
for element in collection { ... }
```

The `IntoIterator` trait allows for that. For example, if we look at the implementation of `Vec<T>` it implements the trait three times:

```rust
impl<T> IntoIterator for Vec<T>
impl<'a, T> IntoIterator for &'a Vec<T>
impl<'a, T> IntoIterator for &'a mut Vec<T>
```

Depending on how we use `into_iter()` on a `Vec<T>` we'll get different types of values produced, namely values of `T`, `&T` or `&mut T` respectively (as illustrated in the three `for` loops above). Keep in mind though, that this only works because `Vec<T>` happens to implement `IntoIterator` for these three scenarios. There are other types, that only come with one or two implementations of `IntoIterator`, which might lead to surprising results when relying on `into_iter()` directly.

This is different when we use `iter()` or `iter_mut()`. These two methods always return immutable references (`&T`) or mutable references (`&mut T`) but never values, making these APIs very predictable. 

In short:

- Given a shared reference to a collection, `into_iter()` returns an iterator that produces shared references to its items.
- Given a mutable reference to a collection, it returns an iterator that produces mutable references to the items.
- Given a collection as value, it returns an iterator that takes **ownership** of the collection and returns items by value. For a quick primer on ownership, check out [this article](/ownership-in-rust/).
- `iter()` always returns an iterator that produces shared references to its items.
- `iter_mut()` always returns an iterator that produces mutable references to its items.

## What else is there?

So far we've discussed what iterators are and how we create them, but obviously, there's more to them. The real power of iterators emerges when we leverage the power of **Iterator adapters**, which are functional APIs that enable us to build new iterators with specific characteristics. We'll take a closer look at the most important ones in another article, so stay tuned and sign up to the [Rust For JavaScript Developers](/categories/rust) newsletter!


