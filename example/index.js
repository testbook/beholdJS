const { Beholder,beholdServer } = require('beholdjs');

const { holdableSampleDirective,sampleDirectiveConf } = require("./holdableComponents/sample-directive");

// server port & (optional) renderer to use globally
let bh = new beholdServer(3000,Beholder);

// use any component config obj directly
bh.addComponent('sample-directive-conf',sampleDirectiveConf);

// use specific renderer, JSDOMoptions and timeout defined in holdable object
bh.addComponent('sample-directive',holdableSampleDirective(),true);


bh.start();
