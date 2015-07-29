---
layout:     post
title:      "A web app with Nickel: From first line to Heroku deployment"
date:       2015-07-29
update_date: 2015-07-29
relatedLinks:
  -
    title: "Rust's Ownership model for JavaScript developers"
    url: "http://blog.thoughtram.io/rust/2015/05/11/rusts-ownership-model-for-javascript-developers.html"

summary:    "In this article we will walk through the whole process of writing a simple simple web application with Nickel, the web application server for the Rust language. It also covers all necessary steps to host the application on Heroku."

categories:
- rust

tags:
- rust

author: christoph_burgdorf
---


Occasionally people ask about [Nickel](http://nickel.rs) projects that they can dig into to get a feel of some real world Nickel code. In case you never heard of Nickel, it's a web application server written in Rust. We thought it'd be nice to write a simple web application with Nickel, deploy it to Heroku and blog about it.

##Defining the scope of the application

What's better than dog fooding your project? Dog fooding two of your projects at once! In case you missed it, with the help of awesome contributors, we created [Clog](https://github.com/thoughtram/clog) which is a small tool to generate nice changelogs from semantic Git histories. Clog parses commit messages that follow the Angular commit message conventions which are quite popular among many projects such as [Angular](github.com/angular/angular), [angular-translate](https://github.com/angular-translate/angular-translate), [Hoodie](https://github.com/hoodiehq/hoodie-server), [Nickel](https://github.com/nickel-org/nickel.rs), [Clap.rs](https://github.com/kbknapp/clap-rs) and many more. Clog started as a fork of the Node.js based [conventional changelog](https://github.com/ajoslin/conventional-changelog) project but has since moved on to follow it's own ideas.

Let's build a website that lets you generate a nicely formatted changelog for any public repository on GitHub - right from your browser. Let's keep that as simple as possible and focus on the important parts.

- Use Nickel to build a JSON API that can be consumed from a frontend
- Make Nickel serve an Angular application as static html so that frontend and backend are nicely decoupled.
- Deploy the app to Heroku

##Bootstrapping our Nickel application

This article assumes a basic understanding of Rust. If you've never built anything with Rust before, the [Getting Started](https://doc.rust-lang.org/stable/book/getting-started.html) section of the official Rust book should answer all basic questions.

The easiest way to bootstrap a Rust project is through Cargo: Rust's official package manager.

{% highlight bash %}
{% raw %}
cargo new clog-website --bin
{% endraw %}
{% endhighlight %}

This will create a new directory `clog-website` with a ready to go "Hello World" app. We can compile and run the application with the following command.

{% highlight bash %}
{% raw %}
cargo run
{% endraw %}
{% endhighlight %}

In order to use Nickel we first need to add it as a dependency to our `Cargo.toml` file. At this point the `Cargo.toml` should look like this.

{% highlight toml %}
{% raw %}
[package]
name = "clog-website"
version = "0.1.0"
authors = ["Your Name <your@name.com>"]

[dependencies]
nickel = "*"

{% endraw %}
{% endhighlight %}

Now that we added Nickel as a dependency, let's try to make our server return a simple "Hello World" for any request. Replace the code in the `main.rs` file with the following.

{% highlight rust %}
{% raw %}
#[macro_use]
extern crate nickel;

use nickel::Nickel;

fn main() {
    let mut server = Nickel::new();
    server.get("**", middleware!("Hello from Nickel"));
    server.listen("127.0.0.1:6767");
}
{% endraw %}
{% endhighlight %}

However, when we try to execute our little app with the `cargo run` command we run into an error.

{% highlight rust %}
{% raw %}
$ cargo run
   Compiling clog-website v0.1.0 (file:///Users/cburgdorf/Documents/hacking/clog-website)
src/main.rs:9:12: 9:55 error: no method named `get` found for type `nickel::nickel::Nickel` in the current scope
src/main.rs:9     server.get("**", middleware!("Hello from Nickel"));
                         ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
src/main.rs:9:12: 9:55 help: items from traits can only be used if the trait is in scope; the following trait is implemented but not in scope, perhaps add a `use` for it:
src/main.rs:9:12: 9:55 help: candidate #1: use `nickel::router::http_router::HttpRouter`
{% endraw %}
{% endhighlight %}

The reason for that is quite simple. Even though the HTTP Verb handler registration methods such as `get`, `put`, `post` and `delete` appear to exist directly on the [`Nickel` object](http://docs.nickel.rs/nickel/struct.Nickel.html) that is returned by `Nickel::new()`, they are in fact methods from the [`HttpRouter` trait](http://docs.nickel.rs/nickel/router/http_router/trait.HttpRouter.html#method.get) which just happens to be [implemented](https://github.com/nickel-org/nickel.rs/blob/6fbfbfde2985c5724942835fec95953a3a996b65/src/nickel.rs#L17-L23) for the Nickel facade object.

Traits are an extremely powerful concept of the Rust language but it's out of the scope of this article to explain them in detail. If you haven't fully groked them yet, I recommend to head over to the [trait chapter](https://doc.rust-lang.org/stable/book/traits.html) of the official Rust book.

Luckily Rust's compiler is smart enough to give us the right hint here. We need to bring the `HttpRouter` trait into scope. Since Nickel exposes that trait on it's top level module we can simply change our import to this.

{% highlight rust %}
{% raw %}
use nickel::{ Nickel, HttpRouter };
{% endraw %}
{% endhighlight %}

Once we have brought the trait into scope, the methods become available on the Nickel facade object. You may think of them as extension methods.

Great, after we fixed that issue we can run our server with `cargo run` and point our browser to `http://127.0.0.1:6767` to finally see the text `Hello from Nickel`. That wasn't too hairy, was it?

##Generating a changelog

In order to generate our first changelog we need to do three things.

- Clone the repository that we want to generate the changelog from
- Generate the changelog with Clog
- Delete the repository to clean up the file system of the server

In order to achieve the downloading part, create a file called `git.rs` with the following contents.

{% highlight rust %}
{% raw %}
use std::process::Command;
use std::io::{Error, ErrorKind};


pub fn clone (repo_url: &str, into_directory: &str) -> Result<String, Error> {
    let output = try!(Command::new("git")
                    .arg("clone")
                    .arg(repo_url)
                    .arg(into_directory)
                    .output());

    match output.status.success() {
        true => Ok(String::from_utf8_lossy(&output.stdout).into_owned()),
        false => Err(Error::new(ErrorKind::Other, format!("{}", String::from_utf8_lossy(&output.stderr))))
    }
}
{% endraw %}
{% endhighlight %}

We won't go through the code line by line. It should be pretty clear to understand just by looking at the method signature. It takes an URI to a Git repository and clones it into whatever path was specified with the second parameter. It returns an `Result<String, Error>` that either carries a `String` with the message that was send to `stdout` or an `Error` that carries a `String` with the message that was send to `stderr`.

Before we are going to use that, let's move on and write the code that will interact with Clog. We create a file called `clog_interact.rs` with the following contents.

{% highlight rust %}
{% raw %}
use std::fs::{self, File};
use std::path::Path;
use std::io::{Read};
use clog::Clog;

pub fn generate_changelog (repository: &str, repo_url: &str) -> String {
    let mut clog = Clog::with_dir(repository).unwrap_or_else(|e| {
        fs::remove_dir_all(repository).ok();
        panic!("Failed to clone repository: {}", e);
    });
    let changelog_file_name = format!("changelog_{}.md", repository);
    clog.repository(repo_url);
    clog.write_changelog_to(Path::new(repository).join(&changelog_file_name));

    let mut contents = String::new();

    File::open(&Path::new(repository).join(&changelog_file_name))
        .map(|mut f| f.read_to_string(&mut contents).ok()).ok();

    fs::remove_dir_all(repository).ok();

    contents
}
{% endraw %}
{% endhighlight %}

This method takes a `&str` parameter carrying the path to a local git repository and the GitHub url of that repository. Clog needs to know the GitHub url in order to generate links to issues. The method returns a `String` carrying the generated markdown changelog. The method also takes care of deleting the repository as soon as the changelog was generated.

We now have the basic building blocks to generate our first changelog. Let's move on and do exactly that! We change the `main.rs` file to look like this.

{% highlight rust %}
{% raw %}
#[macro_use]
extern crate nickel;
extern crate clog;

use nickel::{ Nickel, HttpRouter };

mod git;
mod clog_interop;

fn main() {
    let mut server = Nickel::new();

    let repo_name = "some-unique-id";
    let repo_uri = "https://github.com/angular/angular";

    git::clone(repo_uri, repo_name).ok();

    let changelog = clog_interop::generate_changelog(repo_name, repo_uri);

    server.get("**", middleware!(&changelog as &str));
    server.listen("127.0.0.1:6767");
}
{% endraw %}
{% endhighlight %}

Let's shed some light on the code. In order to use Clog we first need to add it to our `Cargo.toml` file as we did before with Nickel. Then add an `extern crate clog;` statement. We also need to add `mod git;` and `mod clog_interop;` in order to have the compiler include those modules. Otherwise it would be just two Rust files that happen to be placed in our project directory.

The rest should be pretty straight forward. We hardcoded the `repo_uri` to fetch the [Angular 2](github.com/angular/angular) repository and clone it into a local folder called `some-unique-id`. We probably have some work here down the road to get that production ready.

The most interesting part is the `&changelog as &str` for the `middleware!` macro to return on every request.

This is a common source of confusion for newcomers but Ryman from the Nickel team did a great job to explain it [here](https://github.com/nickel-org/nickel.rs/issues/241#issuecomment-122476624).

The gist is that the handler gets called again and again for every request hence you can't *move* the `String` since it could only be moved once.

If we start our server again with `cargo run` and open up the website in the browser we should see something like this.

![Raw Clog Output](/assets/raw_clog_output.png)

Hooray! That's a markdown formatted changelog of the Angular 2 project.

##Working with JSON data

We now have our server to clone a repository, generate a markdown changelog and return it to the browser as is. That's all nice so far. In order to create something slightly nicer and more flexible we need to build a proper JSON API that can be consumed from a frontend.

Let's sketch out what the JSON request and response objects may look like.

**Request Object**

{% highlight javascript %}
{% raw %}
{
    "respository": "https://github.com/angular/angular"
}
{% endraw %}
{% endhighlight %}

We don't need anything apart from the `repository` itself so far. However, we may add things like `version_name` or `subtitle` later on to expose other Clog features to the frontend.

**Response Object**

{% highlight javascript %}
{% raw %}
{
    "changelog": "the formatted markdown string",
    "error": "foo"
}
{% endraw %}
{% endhighlight %}

Let's keep the response simple as well. There is nothing much we need apart from the changelog itself and an optional error message in case something didn't play out well.

In order to accept and return such JSON objects we first need to create new structs. Let's call them `ClogConfig` and `ClogResult` and create the files `clog_config.rs` and `clog_result.rs` respectively.

**clog_config.rs**

{% highlight rust %}
{% raw %}
#[derive(RustcDecodable, RustcEncodable)]
pub struct ClogConfig {
    pub repository: String,
}
{% endraw %}
{% endhighlight %}

**clog_result.rs**

{% highlight rust %}
{% raw %}
#[derive(RustcDecodable, RustcEncodable)]
pub struct ClogResult {
    pub changelog: String,
    pub error: String
}
{% endraw %}
{% endhighlight %}

In order to avoid manual JSON parsing and formatting code we can have Rust automatically implement the `RustcDecodable` and `RustcEncodable` traits for us.

With those two structs in place let's write a `POST` handler function that can accept and return those JSON structures.

{% highlight rust %}
{% raw %}
server.post("/generate", middleware! { |request, response|

    let clog_config = request.json_as::<ClogConfig>().unwrap();

    let result = if let Err(err) = git::clone(&clog_config.repository, &repo_name) {
        ClogResult {
            changelog: "".to_owned(),
            error: err.description().to_owned(),
        }
    } else {
        let changelog = clog_interop::generate_changelog(&repo_name, &clog_config.repository);

        ClogResult {
            changelog: changelog,
            error: "".to_owned()
        }
    };

    json::encode(&result).unwrap()
});
{% endraw %}
{% endhighlight %}


Let's take a closer look at the code. First, we use `server.post` to register a handler that answers `POST` requests to the `/generate` endpoint. The `middleware` macro that we previoulsy used with a simple string is now being used in it's block syntax form and also gives us access to the `request` and `response` objects that we'll need to cover all aspects of the handler.

Nickel supports parsing JSON bodies out of the box with it's `json_as` method. The catch is that - just as before with the `HttpRouter` - we need to bring a special trait into scope to use that functionality. But let's not get distracted by that for now, we'll take a look at all the needed imports in a moment.

After we've parsed the JSON into our `clog_config` variable which now holds an instance of a `ClogConfig`, we can move on and try to clone the given repository. Now that we don't hardcode the repository anymore we need to plan for typos or other reasons why cloning of a repository may fail. If cloning fails, we simply set `changelog` to an empty string and `error` to whatever error message was returned.

Otherwise we generate the changelog as before and set `changelog` and `error` accordingly. Notice that in Rust even if/else constructs work expression-based so that we can write the code in a way that is more concise and puts the `let result =` right before the `if`.

Last but not least we need to use `json::encode` to transform our `ClogResult` into it's JSON representation before we return it to the caller.

That was a bunch of new code and it actually leaves out an important part: we had to adjust our imports and even the `Cargo.toml` to adjust for new dependencies.

{% highlight rust %}
{% raw %}
#[macro_use]
extern crate nickel;
extern crate clog;
extern crate rustc_serialize;

use nickel::{ Nickel, JsonBody, HttpRouter };
use clog_config::ClogConfig;
use clog_result::ClogResult;
use rustc_serialize::json;
use std::error::Error;

mod git;
mod clog_interop;
mod clog_config;
mod clog_result; 
{% endraw %}
{% endhighlight %}

The biggest suprise here may be that JSON support is currently not baked into the standard library but instead needs to be pulled in via the `rustc-serialize` crate. Another catch here is that in the `Cargo.toml` one has to add the crate as `rustc-serialize = "*"` (hyphenated) whereas in Rust code underscores are being used.

Great! We are almost there. We can already use `curl` to try out our API.

{% highlight bash %}
{% raw %}
curl 'http://127.0.0.1:6767/generate' -H 'Cache-Control: no-cache' -H 'Content-Type: application/json;charset=UTF-8' --data-binary $'{\n  "repository": "https://github.com/thoughtram/clog"\n}' --compressed
{% endraw %}
{% endhighlight %}

There's still one big flaw though. We are still cloning into a directory called `some-unique-id`. For every request. This will break apart as soon as we have two simultanous requests to our API. Let's change the code to actually use real unique names for the directories that we clone into. And again, there's a crate for that. It's name is `uuid`.

With that crate in place, the fix is as easy as setting `repo_name` from *inside* of our handler to a unique string. 

{% highlight rust %}
{% raw %}
let repo_name = Uuid::new_v4().to_string();
{% endraw %}
{% endhighlight %}

We'll leave out the changes to the imports this time. If you have trouble figuring them out, feel free to jump to the final solution.

With this change in place our API is pretty much ready to use. We can improve ergonomics a little further with a parser for the repository name so that one doesn't have to type out the entire URL of the repo. This will be in the [final solution](https://github.com/thoughtram/demo-clog-website/blob/78121ab93f541700d01406be40d092e8925d739d/src/main.rs) but I'm not going to cover it here, it's a very simple step after all.

##Serving a frontend

Now that we have our API in place, we just need a simple frontend to serve as a basic use case. If we would aim for a proper scalable solution, we'd most likely not serve the frontend from the same server that serves the API. For the purpose of this blog post and to show off Nickels features, we will just keep the entire project together.

We won't cover the frontend part in the same depth as we did for the backend. You can simply jump to the [repository](https://github.com/thoughtram/demo-clog-website) on GitHub that contains the entire code that was written for this post.

Let's just assume that we are building a simple web app with a text input for the user to enter the URL to a repository on GitHub and a button to request the changelog from the API that we built.

In order to serve the frontend we will just create a directory called `assets` with subdirectories for `css`, `js` and `templates`. We will place an `index.html` in the templates folder and have that one include JavaScript and CSS files from the `js` and `css` directories respectively.

In order to serve the frontend we have to tell Nickel to just statically server those files.

{% highlight rust %}
{% raw %}
server.utilize(StaticFilesHandler::new("assets"));
server.utilize(StaticFilesHandler::new("assets/templates"));
{% endraw %}
{% endhighlight %}

We will create two individual mounts for `assets` and `assets/templates` so that we have the `index.html` exposed on the root level but the JavaScript and CSS exposed through it's subfolders.

![Rendered Clog Site](/assets/clog_final_site.png)

Voilà! We have a real working website.

##Deploying our application to Heroku

Now that we have our app running just fine on our development machine wouldn't it be nice to actually ship it for the world to see? Let's do exactly that and host it on Heroku. Hosting a Nickel app on Heroku is quite easy these days. If you've never worked with Heroku before, you first need to register at their website and download the [Heroku CLI tool](https://toolbelt.heroku.com/) that we will use for the next steps.

Once you have the Heroku CLI installed and logged in, you can simply create the app endpoint from your existing repository through the following command.

{% highlight bash %}
{% raw %}
heroku create demo-clog-website --buildpack https://github.com/emk/heroku-buildpack-rust.gi
{% endraw %}
{% endhighlight %}

Notice that the first parameter of the `heroku create` command will be the name that Heroku will use as a subdomain to serve your site. So in this case it's `http://demo-clog-website.herokuapp.com`.

This will also add a new Git remote called `heroku` to your repository. Deploying the site is as simple as running `git push heroku master`.

{% highlight bash %}
{% raw %}
$ git push heroku master
Counting objects: 28, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (24/24), done.
Writing objects: 100% (28/28), 5.73 KiB | 0 bytes/s, done.
Total 28 (delta 5), reused 0 (delta 0)
remote: Compressing source files... done.
remote: Building source:
remote: 
remote: -----> Fetching custom git buildpack... done
remote: 
remote:  !     Push rejected, no Cedar-supported app detected
remote: HINT: This occurs when Heroku cannot detect the buildpack
remote:       to use for this application automatically.
remote: See https://devcenter.heroku.com/articles/buildpacks
remote: 
remote: Verifying deploy....
remote: 
remote: !   Push rejected to demo-clog-website.
remote: 
To https://git.heroku.com/demo-clog-website.git
 ! [remote rejected] master -> master (pre-receive hook declined)
error: failed to push some refs to 'https://git.heroku.com/demo-clog-website.git'
{% endraw %}
{% endhighlight %}

Awww snap! We seem to be missing something as Heroku rejected to build the app. Heroku is capable of hosting apps with all kind of different tech stacks. The way that works is through special buildpacks that configure the server. When we created our app we set the buildpack to an unofficial (yet, usuable!) buildpack for Rust. But we are still missing two important files to give Heroku the right hints how to treat our program.

**RustConfig**
{% highlight bash %}
{% raw %}
VERSION="1.1.0"
{% endraw %}
{% endhighlight %}

The `RustConfig` file tells our buildpack which version of the Rust compiler we want to build our app against.

**Procfile**
{% highlight bash %}
{% raw %}
web: ./target/release/clog-website
{% endraw %}
{% endhighlight %}

The `Procfile` tells Heroku which command to invoke to start the process. Since `Cargo` puts the executable at `target/release/our-app-name` we have to set this up accordingly.

After we created and committed both files to our repository we deploy our site again with `git push heroku master`. The deployment should run just fine so let's check the live site.

![Heroku Application Error](/assets/heroku_application_error.png)

The live site just yields a generic Heroku error page, so let's dig into the output of the `heroku logs` command.

{% highlight bash %}
{% raw %}
heroku[web.1]: Starting process with command `./target/release/clog-website`
app[web.1]: Listening on http://127.0.0.1:6767
app[web.1]: Ctrl-C to shutdown server
heroku[web.1]: Error R10 (Boot timeout) -> Web process failed to bind to $PORT within 60 seconds of launch
heroku[web.1]: Stopping process with SIGKILL
heroku[web.1]: State changed from starting to crashed
heroku[web.1]: State changed from crashed to starting
heroku[web.1]: Process exited with status 137
{% endraw %}
{% endhighlight %}

From the logs we can clearly see that the server started successfuly but was shut down after a 60 seconds timeout because it failed to bind to `$PORT`.

Heroku expects us to bind to a random port number that they assign to the `PORT` environment variable. However our server code is currently hardcoded to use port `6767`.

We can fix that quite easily by reading from the `PORT` enviroment variable and defaulting to `6767` if it doesn't exist.

{% highlight rust %}
{% raw %}
fn get_server_port() -> u16 {
    env::var("PORT").unwrap_or("6767".to_string()).parse().unwrap()
}

server.listen(("0.0.0.0", get_server_port()));
{% endraw %}
{% endhighlight %}

After we fixed that issue our live site runs just fine!

![Running Live Site](/assets/final_hosted_clog_site.png)

You may just head over to [demo-clog-website.herokuapp.com](http://demo-clog-website.herokuapp.com) and give it a try. It also contains the mentioned URL parser improvement so that one can enter repositories in the form of `user/repo`. You can find the entire code of this demo project [here on Github](https://github.com/thoughtram/demo-clog-website).

Now, wouldn't that be a nice start for your first Nickel project?

