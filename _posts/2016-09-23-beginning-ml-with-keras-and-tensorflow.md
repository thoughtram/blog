---
layout: post
title: Beginning Machine Learning with Keras and TensorFlow
date: 2016-09-23T00:00:00.000Z
date: 2016-11-08T00:00:00.000Z
imageUrl: /images/banner/intro_in_ml.jpeg
summary: >-
  With all the latest accomplishments in the field of artificial intelligence
  it's really hard not to get excited about AI. In this article we'll build our
  very first neural network.
categories:
  - machine-learning
tags:
  - machine-learning
author: christoph_burgdorf
related_posts:
  - Understanding XOR with Keras and TensorFlow
  - Announcing Angular 2 Master Class in Sydney
  - Two-way Data Binding in Angular 2
  - Resolving route data in Angular 2
  - Angular 2 Animations - Foundation Concepts
  - Angular 2 is out - Get started here

---

This isn't our typical kind of blog post. In fact this one is very special. It's the beginning of our journey with a new shiny toy.

Every now and then there comes a field of technology that strikes us as being especially exciting. With all the latest accomplishments in the field of artificial intelligence it's really hard not to get excited about AI.

Companies such as Google, NVIDIA or [Comma.ai](http://comma.ai/) are using neural networks to train cars that know how to drive themselves. Apps such as [PRISMA](http://prisma-ai.com/) are using AI to create artwork from photography that is inspired by real artists.

We are happy to jump on this exciting journey and we are even happier to share our findings with you.

<div class="thtrm-toc" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>


## What's all the buzz about AI and Machine Learning

If you like to learn about the difference between AI, Machine Learning and Deep Learning we recommend [this article](https://blogs.nvidia.com/blog/2016/07/29/whats-difference-artificial-intelligence-machine-learning-deep-learning-ai/) by NVIDIA. For the rest of this article we will use these terms interchangeably.

So what exactly is exciting about AI? With traditional software engineering techniques we always define functions to solve problems. It doesn't matter much if we are talking about [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming), [FP](https://en.wikipedia.org/wiki/Functional_programming), [AOP](https://en.wikipedia.org/wiki/Aspect-oriented_programming) or anything else. At the end of the day **we are writing code** to solve problems.

We are facing times where we tackle problems that seem to be too hard to solve with traditional programming techniques. For instance, self-driving cars are pretty much around the corner. Ever thought about what it takes to drive a car?

With a fair amount of practice a human can drive a car. We aren't particular good at it but we can manage to drive thousands of miles without ever getting into an accident.

But can you imagine what it takes to write a software that drives a car? How do we make it slam on the breaks for a crossing kid but not bother about a plastic bag? How do we make it stay in lane if there are no lane markers or no sealed roads at all? How does it find its way through complicated temporary construction sites? What about hand signals from police officers or other drivers?

Writing code to deal with such issues is really difficult. That's why companies such as [Comma.ai](http://comma.ai/) and NVIDIA [demonstrate](https://devblogs.nvidia.com/parallelforall/deep-learning-self-driving-cars/) an alternative strategy to solve these problems. They use video recordings of real humans driving a car to actually teach a machine how to drive.

That's the point of Machine Learning. Feed the machine with enough data and it will *generate* the complex function for you. How does that work? Pretty much the same way as raising a child. Provide information and give feedback about how they are doing.

The applications of AI seem infinite. [PRISMA](https://www.instagram.com/prisma/) is another astonishing demonstration of what AI can do that would be really difficult with traditional programming techniques. The PRISMA app takes photos and turns them into breath-taking pieces of art. Art in the style of Van Gogh, Monet or other exeptional painters.

## Let's get started

Getting started with Machine Learning can be quite intimidating at first. There's a whole bunch of vocabulary: [neural networks](https://en.wikipedia.org/wiki/Artificial_neural_network), [perceptrons](https://en.wikipedia.org/wiki/Perceptron), neurons, activation functions and of course a lot of maths. There are plenty of [great articles](http://neuralnetworksanddeeplearning.com/chap1.html) about these kind of things so there's no need for us to scare you with yet another intimidating article.

We aren't particular good at math. I'm sure we're actually pretty bad at math. We are coders and tinkerers so that's what we're gonna do! Let's build a neural network to solve a task!

In a nutshell, a neural network is a system that is inspired by how we think the human brain works.

<img alt="A neural network" src="/images/1024px-Neural_network.svg.png">

It has connected neurons where information flows through. The information is then transformed by functions which apply so called weights. The idea is that the neural network finds the right weights for each neuron to eventually learn how to calculate the expected output.

## TensorFlow, Keras and Python

There are a couple of JavaScript libraries that one can use to tinker with neural networks right in the browser. That's pretty neat and in fact we also took our first baby steps with [brain.js](https://github.com/harthur-org/brain.js) and [synaptic](https://github.com/cazala/synaptic). The demos are super cool!

That said, you're probably not gonna build a self driving car with one of these. Machine learning is a computational intensive task which means highly optimized frameworks written in system languages are better suited for the time being.

As of now, [TensorFlow](https://www.tensorflow.org) seems to be most popular machine learning library. It's written in C++ and can leverage GPUs very well. This is what you build a self-driving car with. Fortunately there are Python bindings so that we don't have to deal with C++ directly. But even better, there's a library called [Keras](https://keras.io/), also written in Python, which creates a higher level API and uses TensorFlow as it's backend. Let that sink in, we are going to use TensorFlow but with a much simpler API!

None of us has much experience with Python but honestly that's not a big issue. Python is quite simple and fun to learn. And after all the code we're writing isn't rocket sience. Remember, machine learning is all about having the machine doing the rocket sience for us!

## Setting up your machine to become an AI engineer

Now that we know which library to use, how do we actually set up our machine to get going? As with everything in life there are multiple options.

The most obvious option would be to install TensorFlow and Keras directly on your machine. However, this may lead us down a path of upgrading dependencies such as Python or Numpy which in turn may be hard to upgrade if other software depends on them.

We found using [docker](https://www.docker.com/) to be the simplest solution for us. Just grab a preconfigured image, spin off a container and start using Keras without any hassle. You haven't used docker yet you say? Welcome to the club. We are like ten minutes ahead of you. We even created and published our very own [thoughtram/keras](https://hub.docker.com/r/thoughtram/keras/) docker image for you to give you an easy start.

No excuses. Go and [install docker](https://docs.docker.com/engine/installation/) and then once that's done, here is all you need to get going.

**1. Create a directory on your machine where you want to put your code.**

{% highlight shell %}
{% raw %}
mkdir ~/ml-fun
{% endraw %}
{% endhighlight %}

**2. Create a docker container from our existing image**

When we create a container from an image we can map a local directory (e.g `/Users/cburgdorf/ml-fun` to a directory inside our container (e.g `/ml-fun`). That way we can simply use our favourite editor from our host system to work on the code.

We use the `--name` parameter to assign a name to our container that we can easily remember (e.g. `keras-playground`).

{% highlight shell %}
{% raw %}
docker create -it -v ~/ml-fun:/projects/ml-fun
              --name keras-playground thoughtram/keras
{% endraw %}
{% endhighlight %}

**3. The last thing left to do is to *start* the container**

{% highlight shell %}
{% raw %}
docker start keras-playground
{% endraw %}
{% endhighlight %}


## Let's build our first neural network.

Whew. That was easy, wasn't it? Let's keep it simple and just build our very first neural network. No math required!

Many people say that hand-writing recognition would be the *hello world* of machine learning but for now, let's go even simpler than that. Let's teach a neural network to understand the XOR gate. XOR represents the inequality function, i.e., the output is true if the inputs are not alike otherwise the output is false.

{% highlight python %}
{% raw %}
[0, 0] = 0
[0, 1] = 1
[1, 0] = 1
[1, 1] = 0
{% endraw %}
{% endhighlight %}


Our job is to build a neural network that will predict the correct output for any of the four different inputs. Obviously, that isn't a real world use case to throw a neural network at. This task is actually much simpler to solve with traditional programming techniques. Simply put all four states into a HashMap and map them to the desired result.

That said, it's pretty much the simplest thing we can put together in just a couple of lines to demonstrate how a neural network works.

Let's go and create a new file `keras_xor.py` in the directory that we mapped from our host machine into the container. We'll put in the following code.

{% highlight python %}
{% raw %}
import numpy as np
from keras.models import Sequential
from keras.layers.core import Activation, Dense

# the four different states of the XOR gate
training_data = np.array([[0,0],[0,1],[1,0],[1,1]], "float32")

# the four expected results in the same order
target_data = np.array([[0],[1],[1],[0]], "float32")

model = Sequential()
model.add(Dense(16, input_dim=2, activation='relu'))
model.add(Dense(1, activation='sigmoid'))

model.compile(loss='mean_squared_error',
              optimizer='adam',
              metrics=['binary_accuracy'])

model.fit(training_data, target_data, nb_epoch=500, verbose=2)

print model.predict(training_data).round()
{% endraw %}
{% endhighlight %}

We don't have to understand the code entirely just yet. The most important part is that we set up *training data* and *target data* according to how the XOR gate is supposed to work.

{% highlight python %}
{% raw %}
# the four samples, each with two inputs
training_data = np.array([[0,0],[0,1],[1,0],[1,1]], "float32")

# the four expected results, each with one output
target_data = np.array([[0],[1],[1],[0]], "float32")
{% endraw %}
{% endhighlight %}


To run our code we have to use `docker exec`, pass the name of the container and the command which we want to run *inside* the container.

{% highlight python %}
{% raw %}
docker exec -it keras-playground python /projects/ml-fun/keras_xor.py
{% endraw %}
{% endhighlight %}

Alternatively we could execute a `bash` session in the container and then invoke the script from there. Doesn't matter much.

Our output for this command should look somewhat like this.

{% highlight python %}
{% raw %}
...
Epoch 14/500
0s - loss: 0.2376 - binary_accuracy: 0.5000
Epoch 15/500
0s - loss: 0.2373 - binary_accuracy: 0.7500
...
Epoch 23/500
0s - loss: 0.2347 - binary_accuracy: 0.7500
Epoch 24/500
0s - loss: 0.2344 - binary_accuracy: 1.0000
...
[[ 0.]
 [ 1.]
 [ 1.]
 [ 0.]]
{% endraw %}
{% endhighlight %}

The last four lines are the prediction for our input which was

{% highlight python %}
{% raw %}
training_data = np.array([[0,0],[0,1],[1,0],[1,1]], "float32")
{% endraw %}
{% endhighlight %}

If you paid attention you'll notice that `0, 1, 1, 0` is actually the correct result for our input according to how the XOR gate is defined.

But what do all these lines above the prediction actually mean? Training a neural network happens in iterations so called *epochs*. After each epoch the neural network calculates how bad it performs, the so called *loss*. By adjusting the *weights* of the neurons the neural network tries to reduce the loss to effectively get better after each epoch.

Because we've set `verbose=2` when we called `model.fit(...)` we log some info about how our neural network is doing after each epoch. Notice that there's also a value called `binary_accuracy` in these logs. The accuracy tells us how good the predictions of our neural network are after each epoch. In that sense it's like the opposite of the loss with the main difference being that the accuracy is a percentage based number where 0.75 means 75 % and 1.00 means 100 %. However, while the loss is actually used as a feedback mechanism to the network itself to learn, the accuracy is really just a metric for us to observe.

From the accuracy that is logged after each epoch we can see that the predictions weren't correct right from the beginning. That's because our neural network starts off pretty dumb and keeps learning with each epoch.

If you want to see what the prediction is like after the first epoch just change the value of `ng_epoch` to `1`.

{% highlight python %}
{% raw %}
model.fit(training_data, target_data, nb_epoch=1, verbose=2)
{% endraw %}
{% endhighlight %}

Run again and you'll see the predictions are really bad in the beginning.

## Where do we go from here?

Our main intention for sharing our very own early ML experience is to make it easier for other newcomers to get started.

This is really just the beginning. We've started to work on a little AI based game so expect more articles to follow soon.
