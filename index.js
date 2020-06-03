const { Behold , debugOptions } = require("./src/behold");

let sampleDirectiveScript = `
    (function() {
        function e() {
            return {
                restrict: "E",
                scope: { 
                val:'@',
                isMobile:'='
                },
                controller: ["$scope", "$rootScope", t],
                controllerAs: "sampleC",
                template: '{{val}}<div><span ng-if="!isMobile">sample directive</span> <span ng-if="isMobile">sample directive in mobile</span><div class="btn" ng-click="fun()" ng-class="{\\'btn-outline-grey\\':variable2%2==0,\\'btn-primary\\':variable2%2!=0}">{{variable}}</div></div>'
        }
        }
        function t(e, t) {
                e.isMobile = e.isMobile,
                e.fun = function() {
                    e.variable2++
                }
                ,
                e.variable = "click button toggle class",
                e.variable2 = 0
        }
        angular.module("sample", []).directive("sampleDirective", e)
    })();
    `;
let angularRuntime = "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0/angular.min.js";
let sampleDirective = {
    ngApp     : "sample",
    directive : { name: "sample-directive" , type : "E"},
    bindings  : { val : {value:'tesssting',type:'@'} , isMobile : {value: false ,type:'='} },
    scripts   : [  {src:angularRuntime}, {content:sampleDirectiveScript} ],
};

let heldSampleDirective = new Behold(sampleDirective,{runScripts: "dangerously" , resources: "usable"},30000);

heldSampleDirective.render({ isMobile : true , val : 'number 1'}).then(console.log);
heldSampleDirective.render({ isMobile : false , val : 'number 2' }).then(console.log);
