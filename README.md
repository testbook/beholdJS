# beholdJS
A Server Side Rendering approach for JS components using JSDOM , primarily focussing on Angular 1.x but can be extended by supplying a custom renderer

# Target Use Case

Insert the server side rendered component in the un-initialised state of the existing component using server side includes.
Once the framework has initialised it will replace this with the "active" version of this component.

```
  <sample-directive val="text" isMobile="isMobile">
    <!--# include virtual="localhost:3000/sample-directive-conf?bind={val:'text',isMobile:false}" -->
  </sample-directive>

```

# AngularJS 1.x
For the included angularJS 1.x renderer we have to supply a config Object that will let us know which directive to use and how to pass params to it using DOM.

```
let sampleDirectiveConf = {
    ngApp     : "sample",
    directive : { name: "sample-directive" , type : "E"},
    bindings  : { val : {value:'initial state',type:'@'} , isMobile : {value: false ,type:'='} },
    scripts   : [  {src:angularRuntime}, {content:sampleDirectiveScript} ],
};
```
* ngApp & directive configuration must match your angular module and directive respectively. 
* The bindings also need to have a initial value and the type of binding that it is (this is important for params to pass properly).
* The directive itself & the angular runtime is expected to be loaded in the scripts section of the directive. 
each script can be defined as a url (using src) or as a string containing the JS to be inserted in a script tag before rendering. 
* If you are going to generate a lot of requests it might make sense for your project to also include the angular runtime as a string, to avoid resource fetching.

you can use the config object directly if you need to, or you can define optional custom JSDOM options, render timeout & renderer 

```
//return instance of holdable object with (optional) custom renderer & JSDOMOptions & timeout
function holdableSampleDirective(){
 return new Holdable(sampleDirective,{runScripts: "dangerously" , resources: "usable"},30000);
}
```

If you require to use the holdable object, make an instance of the object and call it's render function. the render function may have an optional parameter that is an object with key-value pairs of some or all of the directive's bindings & returns a Promise object that will resolve to the static markup.

``` 
let sampleDirective = holdableSampleDirective();
sampleDirective.render({val:'value1',isMobile:false}).then(console.log)
```
# Renderer

you may want to use the included renderer directily on a config Object, you can do that by creating an instance of the renderer & calling the render function

```
let eyeOfBeholder = new Beholder()
let params = {val:'value1',isMobile:false};

eyeOfBeholder.render(sampleDirectiveConf,params).then(console.log)
```

Incase you have multiple holdable objects but would want to share the same instance of the renderer among multiple of them, you can do so by not passing a renderer to the constructor and calling the chainable `using` function on the instance.

```
let beauty = new Holdable(sampleDirective,{runScripts: "dangerously" , resources: "usable"},30000);
let lies = new Holdable(sampleDirective,{runScripts: "dangerously" , resources: "usable"},10000);

beauty.using(eyeOfBeholder).render(params).then(console.log)
lies.using(eyeOfBeholder).render(params).then(console.log)

```

# Server
starting a server is as simple as making an instance of `beholdServer` & calling the `start()` method.
you do need to manually add each of your components (either as a config Object or as a holdableObject) for the server to actually render though.

```

// server port & (optional) renderer to use globally
let bh = new beholdServer(3000,Beholder);

// use any component config obj directly
bh.addComponent('sample-directive-conf',sampleDirectiveConf);

// use specific renderer, JSDOMoptions and timeout defined in holdable object
bh.addComponent('sample-directive',holdableSampleDirective(),true);

bh.start();
```

you may also optionally provide the constructor of a global renderer to be used by default by the server for rendering directives using the config object, or supply a holdableObject that includes it's own renderer. 

once the server starts it will render an initial state of your components which will be generated using the default values u have provided in the configObject , after rendering all the components it will start listening on the provide port number for requests that match the format.

```<Domain>:<port>/<endpoint>?bind=<object to bind>```

where the `<endpoint>` will be determined by the first parameter of `bh.addComponent` & `<object to bind>` will contain the parameters on basis of which we will render the component. for example :

```localhost:3000/sample-directive-conf?bind={val:'text',isMobile:false}```

This will render the component defined with the endpoint `sample-directive-conf` & pass the value of the parameters to the directive.

# Caching 

The inBuilt caching mechanism in the server, will first serve the last rendered state of the component, or initial state & then render the current state (against the current params), which will start serving after it has rendered for a TTL of 1 Hour. After which a new render will be triggered and stale state will be rendered untill this render is completed. we can consider it to be 'stale while rendering'.

# To-do

This project is far from finished, at it's current stage it is merely an exploration in the possibility of SSR rendering JS components without having to re-write it's logic in ,for example, PHP.

* expose caching ttl
* support innerText 
* implement a render queue with max 'concurrent' renders
* supply a small script with the SSRed component to allow for some interactivity
* allow components to expose the data from api calls when SSRed and to reuse them once the framework is loaded too.
* Improve compatibility by expanding the list of banned attributes & classes in the output markup
* allow user configurability of the banned attributes & classes
* forward useragent to server to allow JS based detection of device type to work
* allow support for setting some global parameters to window, during the request to server
* allow passing authentication cookies to allow for personalized / restricted content to be fetched by JS
  * caching mechanism in such a scenario
* explore if cache needs to be in memory or can be moved to disk

