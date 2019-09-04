---
layout: post
title: "Dynamic Angular components inside custom widgets"
imageUrl: ../assets/images/banner/dynamic-angular-components-inside-custom-widgets.png
summary: "Learn how and why you want to use dynamic Angular components inside your custom widgets."
date: 2019-03-11T00:00:00.000Z
categories:
  - angular
tags:
  - angular
author: maxim_koretskyi
related_posts:
  - 'Exploring Angular 1.5: Lifecycle Hooks'
  - Sponsoring AngularConnect. Again.
  - ngMessageFormat - Angular's unheard feature
  - Multiple Transclusion and named Slots
  - Service vs Factory - Once and for all
  - Taking Angular Master Class to the next level
related_videos:
  - '189792758'
  - '189785428'
  - '175218351'
  - '189618526'
  - '189613148'
  - '189603515'

---

[In my previous article](https://blog.angularindepth.com/a-step-by-step-guide-to-integrating-a-third-party-widget-with-angular-99c2fed174a4/?utm_source=dynamiccomponents3rdpartywidget&utm_medium=blog&utm_campaign=thoughtram) I showed how you can integrate a third party widget with Angular using as an example a datagrid widget by [ag-Grid](https://angular-grid.ag-grid.com/). Most widgets you'll find on the web are customizable and ag-Grid is not an exception. In fact, here at ag-Grid we strongly believe that developers [should be able to easily extend the default functionality](https://medium.com/ag-grid/learn-to-customize-angular-grid-in-less-than-10-minutes-88005d53808d/?utm_source=dynamiccomponents3rdpartywidget&utm_medium=blog&utm_campaign=thoughtram) to meet their business requirements. For example, you can provide your custom components to implement a custom cell renderer, cell editor or custom filters.

Pure JavaScript version of ag-Grid is extended by implementing a JavaScript component - a class that implements methods for communication between ag-Grid and the component. For example, all components that implement some kind of UI element must implement `getGui` method that returns a DOM hierarchy that our JavaScript datagrid will render on the screen.

However, when ag-Grid is used inside Angular, we don't directly work with DOM. In Angular, we define UI for a component through a template and  delegate DOM manipulation to Angular. And this is exactly the possibility we want to provide for someone who wants to customize ag-Grid that is used as an Angular component. We want to allow our users to customize parts of our Angular datagrid by implementing Angular components.

Let me give you an example. A developer uses ag-Grid as an Angular component and wants to implement a requirement to format all numbers in cells according to a user's locale (EUR). To implement this formatting logic in the pure JavaScript grid version, the developer needs to wrap this logic into a JavaScript class and implement the `getGui` method that returns the DOM with formatted values. This will be a component that ag-Grid will use for cell rendering, hence the type of a component is defined in the docs as a [cell renderer](https://www.ag-grid.com/javascript-grid-cell-rendering/?utm_source=dynamiccomponents3rdpartywidget&utm_medium=blog&utm_campaign=thoughtram). Here is how it could look:

```js
class NumberCellFormatter {
    init(params) {
        const text = params.value.toLocaleString(undefined, {style: 'currency', currency: 'EUR'});
        
        this.eGui = document.createElement('span');
        this.eGui.innerHTML = text;
    }

    getGui() {
        return this.eGui;
    }
}
```

But when ag-Grid is used as an Angular datagrid, we want developers to define a cell render in Angular way like this:

```js
@Component({
    selector: 'app-number-formatter-cell',
    template: `
        <span>{{params.value | currency:'EUR'}}</span>
    `
})
export class NumberFormatterComponent {
    params: any;

    agInit(params: any): void {
        this.params = params;
    }
}
```

Also, as you can see, if a customization component is defined as an Angular component, it can take advantage of built-in Angular mechanisms, like the `currency` pipe to format values.

**To make it possible for developers to use customization components implemented as Angular components, we need to use the [dynamic components mechanism](https://blog.angularindepth.com/here-is-what-you-need-to-know-about-dynamic-components-in-angular-ac1e96167f9e) provided by the framework.** Since the DOM of ag-Grid is not controlled by Angular, we need the possibility to retrieve the DOM rendered by Angular for a customization component and render that DOM in an arbitrary place inside the grid. There are many other architectural pieces required to enable developers to customize the grid through Angular components and we’ll now take a look briefly at the most important ones. Here’s the explanation of how we implemented this mechanism in ag-Grid.

##Implementation

We represent each customization component using a generic wrapper component [DynamicAgNg2Component](https://github.com/ag-grid/ag-grid/blob/5372a42fa6042c7ddc3c7c13b94eebcc348715d3/packages/ag-grid-angular/src/ng2FrameworkComponentWrapper.ts#L22). This component [keeps a reference to the original](https://github.com/ag-grid/ag-grid/blob/5372a42fa6042c7ddc3c7c13b94eebcc348715d3/packages/ag-grid-angular/src/ng2FrameworkComponentWrapper.ts#L29) customization Angular component implemented by a developer. When ag-Grid needs to instantiate an original component, it creates an instance of the generic `DynamicAgNg2Component` that’s responsible for using dynamic components mechanism to instantiate an Angular component. Once it obtains the reference to the instantiated dynamic component, it retrieves the DOM created by Angular and assigns it to the `_eGui` property of the wrapper component. The `DynamicAgNg2Component` component also implements the `getGui` method that ag-Grid uses to obtain the DOM from a customization component. Here we simply returned the DOM retrieved from a dynamic Angular component.

Here’s how it all looks in code. The `DynamicAgNg2Component` component extends the [BaseGuiComponent](https://github.com/ag-grid/ag-grid/blob/5372a42fa6042c7ddc3c7c13b94eebcc348715d3/packages/ag-grid-angular/src/ng2FrameworkComponentWrapper.ts#L62) it delegates all work to the `init` method of the class:

```js
class DynamicAgNg2Component extends BaseGuiComponent {
    init(params) {
           _super.prototype.init.call(this, params);
           this._componentRef.changeDetectorRef.detectChanges();
    };
    ...
}
```

Inside the `init` method of the `BaseGuiComponent` is where a dynamic component is initialized and the DOM is retrieved. Once everything is setup, we run change detection manually once and forget about it. 

The `BaseGuiComponent` implements a few required methods for the communication with ag-Grid. Particularly, it implements the `getGui` method that ag-Grid uses to obtain the DOM that needs to be rendered inside the grid:

```js
class BaseGuiComponent {
    protected init(params: P): void { ... }

    public getGui(): HTMLElement {
        return this._eGui;
    }
}
```

As you can see, the implementation of the `getGui` is very trivial. We simply return the value of the `_eGui` property. This property holds the DOM created for a dynamic component by Angular. When we dynamically instantiate a component, we obtain its DOM and assign it to the `_eGui` property. This happens in the `init` method.

Before we take a look at the implementation of the method, let’s remember that to dynamically instantiate components in Angular we need to get a factory for Angular components. The factory can be obtained using a [ComponentFactoryResolver](https://angular.io/api/core/ComponentFactoryResolver). That’s why we inject it to the main [AgGridNg2](https://github.com/ag-grid/ag-grid/blob/c7d34a7bda3bfecdf90a11fd6d9a1ed478cc56e5/packages/ag-grid-angular/src/agGridNg2.ts#L42) when the component is initialized:

```js
@Component({
    selector: 'ag-grid-angular',
    ...
})
export class AgGridNg2 implements AfterViewInit {
    ...
    constructor(private viewContainerRef: ViewContainerRef,
                private frameworkComponentWrapper: Ng2FrameworkComponentWrapper,
                private _componentFactoryResolver: ComponentFactoryResolver, ...) {
        ...
        this.frameworkComponentWrapper.setViewContainerRef(this.viewContainerRef);
        this.frameworkComponentWrapper.setComponentFactoryResolver(this._componentFactoryResolver);
    }
}
```

We also inject [ViewContainerRef](https://angular.io/api/core/ViewContainerRef) and [Ng2FrameworkComponentWrapper](https://github.com/ag-grid/ag-grid/blob/5372a42fa6042c7ddc3c7c13b94eebcc348715d3/packages/ag-grid-angular/src/ng2FrameworkComponentWrapper.ts#L7) services. The latter is used to wrap an original customization component provided by a developer into the `DynamicAgNg2Component`. The view container is used to render DOM and make change detection automatic. We run change detection manually only once in the init method of the `DynamicAgNg2Component` once the component is rendered. By injecting `ViewContainerRef` into the `AgGridNg2` we turn this top level component a container and all dynamic customization components are attached to this container. When Angular checks the top-level `AgGridNg2` component, all customization components are checked automatically as [part of change detection process](https://blog.angularindepth.com/everything-you-need-to-know-about-change-detection-in-angular-8006c51d206f).

Let’s now take a closer look at the `init` method:

```js
class BaseGuiComponent {
    protected init(params: P): void {
        this._params = params;

        this._componentRef = this.createComponent();
        this._agAwareComponent = this._componentRef.instance;
        this._frameworkComponentInstance = this._componentRef.instance;
        this._eGui = this._componentRef.location.nativeElement;

        this._agAwareComponent.agInit(this._params);
    }

    ...
}
```

Basically, inside the `createComponent` we delegate the call to the `createComponent` method of the `Ng2FrameworkComponentWrapper`. As you remember, this service keeps the references to the `ViewContainerRef` and `componentFactoryResolver` that were attached to it during the instantiation of `AgGridNg2`. In the `createComponent` method it uses them to resolve a factory for the customization component and instantiate the component:

```js
export class Ng2FrameworkComponentWrapper extends ... {
    ...
    public createComponent<T>(componentType: { new(...args: any[]): T; }): ComponentRef<T> {
        let factory = this.componentFactoryResolver.resolveComponentFactory(componentType);
        return this.viewContainerRef.createComponent(factory);
    }
}
```

Then using the component reference we get the DOM and attach it to the `eGui` private property:

```js
this._componentRef = this.createComponent();
this._agAwareComponent = this._componentRef.instance;
this._frameworkComponentInstance = this._componentRef.instance;
this._eGui = this._componentRef.location.nativeElement;
```

And that’s it. If you’re interested to learn how we implemented the component resolution process, continue reading.

##Component resolution process
[ag-Grid is a very complex piece of software](https://www.youtube.com/watch?v=rT0vQejPcrs). To simplify things internally we’ve designed and implemented our own Dependency Injection (IoC) system that’s modeled after [Spring’s IoC container and beans](https://docs.spring.io/spring/docs/3.2.x/spring-framework-reference/html/beans.html). The component resolution process requires a bunch of services that are registered in this DI system. The most important ones are [ComponentResolver](https://github.com/ag-grid/ag-grid/blob/04cd73b3716d9da66b9187f5450ecf4911158075/packages/ag-grid-community/src/ts/components/framework/componentResolver.ts#L71) and [ComponentProvider](https://github.com/ag-grid/ag-grid/blob/56d1d66b7d50f3f4093a9f82c4c89be1f658edc9/packages/ag-grid-community/src/ts/components/framework/componentProvider.ts#L56). Also, we need the `Ng2FrameworkComponentWrapper` service that is specific for ag-Grid used as Angular wrapper. It’s registered in the DI system using `frameworkComponentWrapper` token.

Resolution is performed through the `ComponentResolver` service. When the resolver is instantiated, the `frameworkComponentWrapper` and `componentProvider` services are attached to the resolver through the DI system and are available on the class instance:

```js
@Bean('componentResolver')
export class ComponentResolver {
    @Autowired("gridOptions")
    private gridOptions: GridOptions;

    @Autowired("componentProvider")
    private componentProvider: ComponentProvider;

    @Optional("frameworkComponentWrapper")
    private frameworkComponentWrapper: FrameworkComponentWrapper;

    ...
}
```

When the grid needs to instantiate a particular type of a component, e.g. a cell renderer, it calls `ComponentResolver.createAgGridComponent` method. The method uses a descriptor of a column to obtain the name of a component that needs to be created. For the cell renderer component the property that contains the name of a component is `cellRenderer`:

```js
let columnDefs = [
    {
        headerName: 'Price',
        field: 'price',
        editable: true,
        cellRenderer: 'numberFormatterComponent'
    },
    ...
]
```

Once the name is obtained, it is used to [retrieve the component class](https://github.com/ag-grid/ag-grid/blob/04cd73b3716d9da66b9187f5450ecf4911158075/packages/ag-grid-community/src/ts/components/framework/componentResolver.ts#L239) and metadata from the `componentProvider`:

```js
export class ComponentResolver {
    private resolveByName(propertyName, ...) {
        const componentName = componentNameOpt != null ? componentNameOpt : propertyName;
        const registeredComponent = this.componentProvider.retrieve(componentName);
        ...
    }
}
```

The `retrieve` method returns the following descriptor of a component:

```js
{
    component: NumberFormatterComponent
    dynamicParams: null
    source: 1
    type: Component_Type.Framework
}
```

The type of a component denotes that it’s a framework specific component. All framework components are wrapped into the `DynamicAgNg2Component` as explained the first section of the article. Once the component is wrapped, it contains the `getGui` method common to all customization components and ag-Grid can work with it as if it’s a plain JavaScript component.

