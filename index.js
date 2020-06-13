const { beholdServer } = require("./src/behold-server");
const { defaultOptions, debugOptions , Beholder , Holdable }  = require('./src/behold');

exports.defaultOptions = defaultOptions;
exports.debugOptions = debugOptions;

exports.Holdable = Holdable;
exports.Beholder = Beholder;
exports.beholdServer = beholdServer;
