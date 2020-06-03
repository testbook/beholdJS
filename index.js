const { beholdServer } = require("./src/behold-server");
const { holdableSampleDirective } = require("./holdableComponents/sample-directive");

let bh = new beholdServer(3000);
bh.addComponent('sample-directive',holdableSampleDirective);

bh.start();
