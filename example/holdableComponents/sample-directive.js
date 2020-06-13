const { Holdable,Beholder } = require('beholdjs');

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
                e.variable = "click button toggle class"+Math.random(),
                e.variable2 = 0
        }
        angular.module("sample", []).directive("sampleDirective", e)
    })();
    `;
let angularRuntime = "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0/angular.min.js";

//component config object
let sampleDirective = {
    ngApp     : "sample",
    directive : { name: "sample-directive" , type : "E"},
    bindings  : { val : {value:'initial state',type:'@'} , isMobile : {value: false ,type:'='} },
    scripts   : [  {src:angularRuntime}, {content:sampleDirectiveScript} ],
};

//return instance of holdable object with (optional) custom renderer & JSDOMOptions & timeout
function holdableSampleDirective(){
 return new Holdable(sampleDirective,{runScripts: "dangerously" , resources: "usable"},30000,Beholder);
}

module.exports = {
    holdableSampleDirective , sampleDirectiveConf:sampleDirective
};
