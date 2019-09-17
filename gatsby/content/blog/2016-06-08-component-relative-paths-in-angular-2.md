---
layout: post
title: Component-Relative Paths in Angular
date: 2016-06-08T00:00:00.000Z
update_date: 2016-12-18T00:00:00.000Z
imageUrl: ../assets/images/banner/component-relative-paths-in-angular-2.jpg
summary: >-
  Component-relative enable developers to more easily create maintainable,
  reusable, portable components in Angular. Here's how!
categories:
  - angular
tags:
  - angular2
  - components
  - relative paths
topic: components
author: thomas_burleson
related_posts:
  - Angular Animations - Foundation Concepts
  - RxJS Master Class and courseware updates
  - Advanced caching with RxJS
  - Custom Overlays with Angular's CDK - Part 2
  - Custom Overlays with Angular's CDK
  - Easy Dialogs with Angular Material
related_videos:
  - '175255006'
  - '193524896'
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'

---

<div class="thtrm-toc is-sticky" markdown="1">
### TABLE OF CONTENTS
{:.no_toc}
* TOC
{:toc}
</div>

Component-based development is Angular's *most-loved* feature. By now you should be familiar with using the `@Component` decorators to create components. You should be familiar with the required metadata information such as `selector` and `template`.

```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'contacts-header',
  template: `
    <nav class="navbar-fixed">
      <span class="brand-logo center">Contacts</span>
    </nav>
  `,
  styles: ['.navbar-fixed { position:fixed; }']
})
export class HeaderComponent implements OnInit {  }
```

> If the above component syntax is new and strange, you should first review our article on [Building a Zipping Component in Angular](/angular/2015/03/27/building-a-zippy-component-in-angular-2.html).

If you are familiar with these concepts and you happen to be lucky, your components load without any problems.  Mostly likely, though, you have already encountered (or soon will) the dreaded, frustrating 404 component-loading errors:  

![component_url_404](https://cloud.githubusercontent.com/assets/210413/15878482/eca5cba2-2ce0-11e6-8fb4-78868bec2644.png)

> These errors mean your template HTML or styles (CSS) cannot be loaded!

Let's talk about why that happens and see how we can solve such problems in a way that is flexible and portable.  Before we jump into the actual problem we want to solve, let's first review two (2) types of custom component implementations.

## Components with Inline Metadata

For every Angular component that we implement, we define not only an HTML template, but may also define the CSS styles that go with that template, specifying any selectors, rules, and media queries that we need.

One way to do this is to set the `styles` and `template` property in the component metadata. Consider a simple *Header* component:

```js
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
}
```

> We actually use this component in our [Angular Master Class training](http://thoughtram.io/angular-master-class.html).

Using this component is super easy. There are no external file dependencies as all the HTML and CSS is defined inline. Therefore we should *never* see [in the DevTools console] a 404 loading error for this component.

## Components with External Assets

Another component feature allows us to load HTML and styles from external files: using URLs in the metadata configuration block. Refactoring a component's code, HTML, and CSS into three separate files [in the same package] is a common [Angular Best-Practice](https://angular.io/docs/ts/latest/guide/style-guide.html#!#components).

*  header.component.ts
*  header.component.html
*  header.component.css

This practice of using external files is especially important when your HTML or CSS is non-trivial. And using external files keeps your *.ts logic files much cleaner and easier to maintain.

**header.component.ts**
```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'contacts-header',
  templateUrl: 'header.component.html',
  styleUrls  : ['header.component.css']
})
export class HeaderComponent implements OnInit {
}
```

**header.component.css**
```css
.navbar-fixed {
  position:fixed;
}
```

**header.component.html**
```html
<nav class="navbar-fixed">
  <div class="nav-wrapper">
    <span class="brand-logo center">Contacts</span>
  </div>
</nav>
```

Above we used URLs to specify external HTML and CSS resources. The important factor to note is that the URL required above [in `header.component.ts`] is not an absolute path. The path is actually relative to the **application root**: which is usually the location of the `index.html` web page that hosts the application.

So the above component - without any url path information - must be stored in the application root in order to avoid 404 errors.  Wow, this does not scale well!

*  What if we have many components all at the root level ?
*  What if my components are organized in distinct packages ?
*  What if we want to organize our components by feature or context ?

>  'Organizing by feature' is actually an [Angular Style Guide - Best Practice](https://angular.io/docs/ts/latest/guide/style-guide.html#!#application-structure)


To explore the issue, let's consider the scenario where our details component (and files) are in the `src/app/header` package. The urls used above ( `header.component.html` and `header.component.css` ) would cause the loader to fail and the developer would see the following 404 error in the developers console:

![component_url_404](https://cloud.githubusercontent.com/assets/210413/15878482/eca5cba2-2ce0-11e6-8fb4-78868bec2644.png)

If path to the component HTML or CSS file is not valid, the **EASY** workaround is to add absolute paths to the URLs. Let's briefly explore that idea:


```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'contacts-header',
  templateUrl: 'src/app/header/header.component.html',
  styleUrls  : ['src/app/header/header.component.css']
})
export class HeaderComponent implements OnInit {
}
```

This approach immediately triggers important questions and concerns:

* What if we move our components to other packages?
* What if we want to reuse our components in other applications?
* Can we not use using relative-paths in our components ?

Using absolute paths in our URLs for component HTML or CSS is a horrible idea and band-aid solution. Don't do it!

![no-gif](https://cloud.githubusercontent.com/assets/210413/15881568/9c552dac-2cfc-11e6-808c-f84540d2d758.gif)


## Components with Relative-Path URLs

In fact, we can use relative paths. But not the way you may first think... and not without understanding and accepting some constraints.

At first we might be tempted to try this:

```js
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'contacts-header',
  templateUrl: './header.component.html',
  styleUrls  : ['./header.component.css']
})
export class HeaderComponent implements OnInit {
}
```

We might expect that `./header.component.html` is a path relative to the `header.component.ts` file and that component-relative paths should work, right?  

Instead, we get another **404 - Not found - Exception**.

Remember we noted that the paths are relative to the **Application Root** (at load time)? Since we are using the package `src/app/header/header.component.*`, then our files obviously are not at the app root. Even worse is a scenario where the deployed files have different structures than the originating source.

We could use a gulp or grunt task to deploy to a `dist` directory and have all our components in the dist root directory. Don't deploy all your component files to the app root... OMG, that is another horrible idea! Don't do it.

![no-gif](https://cloud.githubusercontent.com/assets/210413/15881568/9c552dac-2cfc-11e6-808c-f84540d2d758.gif)

## Why Component-Relative Paths are not supported

At first this limitation seems like a real feature screw-up within Angular. But the bright minds at Google know [from experience] that developers can [and will] load the files and modules using many different methods:

* Loading each file explicitly with `<script>` tags
* Loading from CommonJS packages
* Loading from SystemJS
* Loading using JSPM
* Loading using WebPack
* Loading using Browserify

There are so many ways developers can deploy their apps: bundled or unbundled, different module formats, etc. It simply is not possible for Angular to absolutely know where the files reside at runtime.


## Agreeing on Constraints

If we decide on **CommonJS** formats AND we use a standard module loader, then we can use the `module.id` variable which contains the absolute URL of the component class [when the module file is actually loaded]: the exact syntax is `moduleId : module.id`.

> This **`moduleId`** value is used by the Angular reflection processes and the `metadata_resolver` component to evaluate the fully-qualified component path before the component is constructed.

Let's see how this works with the component using **CommonJS**, **SystemJS**, **JSPM**, and **WebPack**:

<br/>

----

*CommonJS*

**header.component.ts**
```js
import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,    // fully resolved filename; defined at module load time
  selector: 'contacts-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css']
})
export class HeaderComponent implements OnInit {
}
```

> *Note:* the above requires that your `tsconfig.json` file specifies **commonjs**; since `module.id` is a variable available when using that module format:

**tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es5"
  }
}
```

----

*SystemJS*

If we decide to use SystemJS, we use **`__moduleName`** variable instead of the `module.id variable`:


**header.component.ts**
```js
import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: __moduleName,    // fully resolved filename; defined at module load time
  selector: 'contacts-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css']
})
export class HeaderComponent implements OnInit {
}
```
----

*JSPM*

If we decide to use **JSPM**, we use the `typescriptOptions` configuration format in the `config.js` file:

**config.js**
```js
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
```

> *Note* this solution requires the [SystemJS Typescript Plugin](https://github.com/frankwallis/plugin-typescript) to transcompile the typescript

----

*WebPack*

If we decide to use **WebPack** to bundle our files, we can use `require` or `import` to force Webpack to load the file contents and assign directly to the metadata property. This means that WebPack is loading the content **instead** of Angular's runtime loader. See [WebPack : An Introduction](https://angular.io/docs/ts/latest/guide/webpack.html) for more details.

With WebPack there are three (3) options available to load the component's external HTML and CSS.

1) We can use `require( )` to reference component-relative paths.

```js
import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: require('./header.component.html'),
  styles: [require('./header.component.css')]
})
export class HeaderComponent implements OnInit {
}
```

It is important to note that here we are not using the `templateUrl` or `styleUrls` keys. Instead we are using `require('...')` to load the data and assign the file contents directly to the metadata object key `template` **BEFORE** the Angular  component initializes.

2) As an alternative approach to `require(...)`, we can instead use `import headerTemplate from './header.component.html';`:

```js
import { Component } from '@angular/core';

import { Component }  from '@angular/core';
import headerTemplate from './header.component.html';
import headerStyle    from './header.component.css';

@Component({
  selector : 'my-app',
  template : headerTemplate,
  styles   : [headerStyle]
})
export class HeaderComponent implements OnInit {
}
```

3) Finally, WebPack developers can load templates and styles at runtime by adding `./` at the beginning of the template,
styles, and styleUrls properties that reference *component-relative URLS.


```js
import { Component } from '@angular/core';

@Component({
  selector : 'my-app',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit { }
```

> Behind the scenese, Webpack will actually still do a `require` to load the templates and styles.
But our markup remains clean and uncluttered.

Personally, I like (3) approach used with the `moduleId` property (as a backup). Thanks to Soós Gábor for his WebPack expertise and insight here.


## Conclusion

The key lesson is to set the **`moduleId :  module.id`** in the `@Component` decorator! Without the **moduleId** setting, Angular will look for our files in paths relative to the application root.

> And don't forget the `"module": "commonjs"` in your **tsconfig.json**.

The beauty of this component-relative-path solution is that we can (1) easily repackage our components and (2) easily reuse components... all without changing the `@Component` metadata.

> The [Angular Cli WebPack preview](https://github.com/angular/angular-cli/blob/master/WEBPACK_UPDATE.md) now uses use webpack instead of Broccoli.
And with WebPack, the Angular Cli defaults to using the component-relative path approach described here. #ftw
