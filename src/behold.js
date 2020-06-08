const jsdom = require("jsdom");
const cheerio = require('cheerio');

const JSDOM = jsdom.JSDOM;
const silent = new jsdom.VirtualConsole();

const bannedAttrs = ['ng-class','ng-if','ng-click','ng-show','ng-hide','ng-repeat','ng-bind-html','ng-change','ng-keyup','ng-keydown','ng-model','translate'];
const bannedClasses = ['ng-isolate-scope','ng-scope','ng-binding','ng-pristine' , 'ng-untouched' , 'ng-valid' , 'ng-empty'];

const defaultOptions = {  url: "https://local.example.com", runScripts: "dangerously" , resources: "usable" , virtualConsole: silent};
const debugOptions = {url: "https://local.example.com", runScripts: "dangerously" , resources: "usable"};

function toTag(script){
    if(script.src){
        return `<script src="${script.src}"></script>`;
    }
    if(script.content){
        return `<script>${script.content}</script>`;
    }
    return '';
}
function kebab(string){ return string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); }
function typed (value){
    if(typeof value === 'string'){
        return `'${value}'`;
    }
    return value
}

// default renderer
class Beholder{

    generateBindings(component){
        let _bindings = {};
        _bindings.keys = Object.keys(component.bindings);
        _bindings.toInit = _bindings.keys.filter(i => component.bindings[i].type !== '@' );
        _bindings.init = _bindings.toInit.map(i => `${i}=${typed(component.bindings[i].value)}`).join(';');
        //_bindings.initGuard = !(_bindings.toInit.length > 0) || _bindings.toInit.join(' || ');
        _bindings.actual = _bindings.keys.map( i => component.bindings[i].type==='@' ? ` ${kebab(i)}="${component.bindings[i].value}" ` : ` ${kebab(i)}="${i}" `)
        return _bindings;
    }

    generateTemplate(component){
        component.directive._template = `<${component.directive.name} ${component._bindings.actual.join(" ")} ></${component.directive.name}>`;
        component.directive._selector = `${component.directive.name}`;

        if(component.directive.type === 'A'){
            component.directive._template = `<div ${component.directive.name} ${component._bindings.actual.join(" ")} ></div>`;
            component.directive._selector = `[${component.directive.name}]`;
        }

        component._template = `
        <div ng-app="${component.ngApp}" ng-init="${component._bindings.init}">
            <div>
                ${component.directive._template}
            </div>
        </div>
        
        ${component.scripts.map(toTag)}
        `;
        return component;
    }

    applyParams(component,params){
        params && Object.keys(params).forEach(param => {
            if(component.bindings[param]){
                component.bindings[param].value = params[param];
            }
        });
        return component;
    }

    componentFrom(componentConfig,params){
        let component = {...componentConfig};
        component = this.applyParams(component,params);

        component._bindings = this.generateBindings(component);
        component = this.generateTemplate(component);
        return component;
    }

    cleanMarkup(component,markup){
        let $ = cheerio.load(markup);
        this.bannedAttrs.map(i => $(`[${i}]`).removeAttr(i));
        this.bannedClasses.map(i => $(`.${i}`).removeClass(i));
        return $.html(component.directive._selector).replace(/<\!--.*?-->/g, "");
    }

    getMarkup(component,dom)  {
        let _element = dom.window.document.querySelector(component.directive._selector);
        if(_element){
            return this.cleanMarkup(component,_element.outerHTML);
        }
    };

    freeze(markup, name) {
        return markup.replace(new RegExp(name, "g"),`behold-${name}`);
    };

    generateStatic(component,dom,resolve,reject){
        let markup = '';
        try{
            markup = this.getMarkup(component,dom);
            if(component.freezeChildren){
                markup = this.freeze(markup, component.directive.name);
                component.freezeChildren.forEach(child => {markup = this.freeze(markup,child);})
            }
            dom.window.close();
            resolve(markup);
        } catch (e) {
            reject(e);
            dom.window.close();
        }
    };

    render(componentConfig,params,_options,_timeout){
        let dom,timer;

        let component = this.componentFrom(componentConfig,params);

        return new Promise((resolve,reject)=>{
            try{
                dom = new JSDOM(component._template,_options || this.options);
                //console.log(dom.serialize());
            } catch (e){
                reject(e);
                dom.window.close();
            }
            //todo add a runtime event support to detect if component render has finished in JSDOM
            //Max timeout to force generation of static markup
            timer = setTimeout(()=>{
                this.generateStatic(component,dom,resolve,reject);
            },_timeout || this.timeout);
        });
    }

    constructor(options = defaultOptions,timeout = 10000){
        this.bannedAttrs = bannedAttrs;
        this.bannedClasses = bannedClasses;

        this.options = options;
        this.timeout = timeout;
    }
}

// component
class Holdable{

    using(renderer){
        this.beholder = renderer;
        return this;
    }

    render(params){
        if(!this.beholder){
            this.beholder = new this.BeholdConstructor();
        }
        return this.beholder.render(this.config,params,this.options,this.timeout);
    }

    constructor(componentConfig,options,timeout,BeholdConstructor = Beholder){
        this.BeholdConstructor = BeholdConstructor;
        this.beholder = undefined;
        this.options = options;
        this.timeout = timeout;
        this.config = {...componentConfig};
    }

}

module.exports = {
    defaultOptions, debugOptions , Beholder , Holdable
};
