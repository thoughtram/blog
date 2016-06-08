---
layout:     post
title:      "Component-Relative Paths in Angular 2"

date: 2016-06-08
imageUrl: '/images/banner/opaque-tokens-in-angular-2.jpeg'

summary: "Creating components in Angular 2 has been improved in many ways. But developers should be careful when using external HTML and CSS files. Component-relative paths are not immediatley intuitive. But with a brief review of the relative issues and constraints, developers can more easily create maintainable, reusable, portable components."

categories:
  - angular

tags:
  - angular2
  - components
  - relative paths

topic: components

author: thomasburleson
---

Easily creating components is the most-loved feature of Angular 2. By now you should be familiar with using the @Component annotations to create components. And I bet you are also familiar with the required metadata information such as `selector` and `template`.

If you happen to be lucky, your components and their HTML/CSS load without any problems. But I am willing to bet that you will or have already encountered the dreaded, frustrating 404 errors where the template HTML or styles (CSS) cannot be found! Let's talk about why that happens and see how we can solve that problem in a way that is flexible and portable. 

Before we jump, however, into the actual problem we want to solve, let's first review two (2) types of component implementations.

## Components with Inline Metadata

For every Angular 2 component that we implement, we define not only an HTML template, but may also the define CSS styles that go with that template, specifying any selectors, rules, and media queries that we need.

One way to do this is to set the `styles` and `template` property in the component metadata.

Consider a simple *Header* component... which we actually use in our Angular 2 Master Class training.

**header.component.ts**
{% highlight ts %}
{% raw %}
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'contacts-header',
  template: `
    <nav class="navbar-fixed">
      <div class="nav-wrapper">
        <span class="brand-logo center">Contacts</span>
      </div>
    </nav>
  `,
  styles: ['.navbar-fixed { position:fixed; }']
})
export class HeaderComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
{% endraw %}
{% endhighlight %}

Using this component is super easy and since there are no external file dependencies and everything is defined inline then you should *never* see a 404 error [for this component] in the DevTools console.

## Components with External Assets

Another options let's us load html and styles from external files by using the URLs in the metadata configuration block. This is a common practice to split a component's code, HTML, and CSS into three separate files in the same directory:

*  header.component.ts
*  header.component.html
*  header.component.css

This practice of using external files is especially important when your HTML or CSS is non-trivial. Using external files keeps your *.ts logic files much cleaner and easier to maintain.

**header.component.ts**
{% highlight ts %}
{% raw %}
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'contacts-header',
  templateUrl: 'header.component.html',
  stylesUrl  : 'header.component.css'
})
export class HeaderComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
{% endraw %}
{% endhighlight %}

**header.component.css**
{% highlight css %}
{% raw %}
.navbar-fixed {
  position:fixed;
}
{% endraw %}
{% endhighlight %}

**header.component.html**
{% highlight html %}
{% raw %}
<nav class="navbar-fixed">
  <div class="nav-wrapper">
    <span class="brand-logo center">Contacts</span>
  </div>
</nav>
{% endraw %}
{% endhighlight %}

Now this is where it gets tricky!

The URL required is relative to the application root which is usually the location of the `index.html` web page that hosts the application. So the above component must be stored in the application root. Wow, this does not scale well.

*  What if we have many components all at the root level ? ( OMG! )
*  What if my components are organized in distinct packages ?
*  What if we want to organize our components by feature (Angular Style Guide - Best Practice)?

To explore the issue, let's consider the scenario where our details component (and files) are in the `src/app/header` package. The urls used above would cause the loader to fail and the developer would see the following 404 error in the developers console:

![component_url_404](https://cloud.githubusercontent.com/assets/210413/15878482/eca5cba2-2ce0-11e6-8fb4-78868bec2644.png)

Are you tempted to try and debug or introspect the exception stack and determine why the file was not found: good luck with that!
 
So if path to the component HTML or CSS file is not valid, the **EASY** workaround is to add absolute paths to the URLs... but don't do it:


**header.component.ts**
{% highlight ts %}
{% raw %}
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'contacts-header',
  templateUrl: 'src/app/header/header.component.html',
  stylesUrl  : 'src/app/header/header.component.css'
})
export class HeaderComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
{% endraw %}
{% endhighlight %}

I hope you agree that this is a horrible idea and band-aid solution. 

* What if I move my components to other packages? I will have to update the absolute paths...
* What if I want to reuse my components in other applications?
* Can I not use using relative-paths in my components ?

![what](https://cloud.githubusercontent.com/assets/210413/15881627/0d0bc056-2cfd-11e6-8086-a87bfbbf91e6.gif)


## Components with Relative-Path URLs

In fact, you can use relative paths. But not the way you may first think... and not without understanding and accepting some constraints.

At first we might be tempted to try this:

**header.component.ts**
{% highlight ts %}
{% raw %}
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'contacts-header',
  templateUrl: './header.component.html',
  stylesUrl  : './header.component.css'
})
export class HeaderComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
{% endraw %}
{% endhighlight %}

You might expect that `./header.component.html` is a path relative to the `header.component.ts` file and that component-relative paths should work, right?  Nope, you get another **404 Not found Exception**.

Remember we noted that the paths are relative to the Application Root **at load time**? Since we are using the package `src/app/header/header.component.*`, then our files obviously are not at the app root.

We could use a gulp or grunt task to deploy to a `dist` directory and have all our components in the dist root directory. 

OMG, that is a horrible idea! Don't do it.

![no-gif](https://cloud.githubusercontent.com/assets/210413/15881568/9c552dac-2cfc-11e6-808c-f84540d2d758.gif)


## Why Component-Relative Paths are not supported

At first this limitation seems like a real screw-up from the Angular team. But the bright minds at Google know [from experience] that developers can [and will] load the files and modules using many different methods:

* Loading each file explicitly using `<script type="text/javascript" src="..."></script>`
* Loading from CommonJS packages
* Loading from SystemJS
* Loading using JSPM
* Loading using WebPack
* Loading using Browserify

There are so many ways developers can deploy their apps, bundled or unbundled, different module formats... It simply is not possible for Angular to absolutely know where the files reside at runtime.


## Agreeing on Constraints

If we decide on **CommonJS** formats AND we use a standard module loader, then we can use the `module.id` variable which contains the absolute URL of the component class [when the module file is actually loaded]. The exact syntax is `moduleId : module.id`.

Let's see how this works in the component:

**header.component.ts**
{% highlight ts %}
{% raw %}
import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,    // fully resolved filename; defined at module load time
  selector: 'contacts-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css']
})
export class HeaderComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
{% endraw %}
{% endhighlight %}

> Note the above requires that your `tsconfig.json` file specifies *commmonjs*; since module.id is a variable available when using that module format:
**tsconfig.json**
{% highlight json %}
{% raw %}
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es5"
  }
}
{% endraw %}
{% endhighlight %}

##### JSPM

If we decide to use **JSPM**, we use alternate format in the `config.js` file:

**config.js**
{% highlight js %}
{% raw %}
SystemJS.config({
  typescriptOptions: {
    module: "commonjs",
    emitDecoratorMetadata: true,
    experimentalDecorators: true
  },
  transpiler: false,
  baseURL: "/dist",
  map: {
    app: 'src',
    typescript: 'node_modules/typescript/lib/typescript.js',
    angular2: 'node_modules/angular2',
    rxjs: 'node_modules/rxjs'
  },
  packages: {
    app: {
      defaultExtension: 'ts',
      main: 'app.ts'
    },
    angular2: {
      defaultExtension: 'js'
    },
    rxjs: {
      defaultExtension: 'js'
    }
  }
});
{% endraw %}
{% endhighlight %}

> Note: this solution requires the [SystemJS Typescript Plugin](https://github.com/frankwallis/plugin-typescript) to transcompile the typescript

##### WebPack

If we decide to use **WebPack** to bundle our files, we can use `template : require('./header.component.html')` to reference component-relative paths. See [WebPack : An Introduction](https://angular.io/docs/ts/latest/guide/webpack.html) for more details.

**header.component.js**
{% highlight js %}
{% raw %}
import { Component } from '@angular/core';

import '../../public/css/styles.css';

@Component({
  selector: 'my-app',
  template: require('./header.component.html'),
  styles: [require('./header.component.css')]
})
export class HeaderComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
{% endraw %}
{% endhighlight %}

> Note here we are not using Urls **and** we are using `template: require('...')`

## Conclusion

So just remember that setting `moduleId :  module.id` in the @Component decorator is the key lesson here; otherwise Angular 2 will look for your files relative to the application root path.

Best of all, the beauty of this solution is that (1) you can easily repackage your components and (2) easily reuse components... all without change with paths in the component Url metadata.
