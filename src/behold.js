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

class Behold {

    cleanMarkup(markup){
        this.$ = cheerio.load(markup);
        this.bannedAttrs.map(i => this.$(`[${i}]`).removeAttr(i));
        this.bannedClasses.map(i => this.$(`.${i}`).removeClass(i));
        return this.$.html(this.component.directive._selector).replace(/<\!--.*?-->/g, "");
    }

    getMarkup (dom)  {
        this._element = dom.window.document.querySelector(this.component.directive._selector);
        if(this._element){
            return this.cleanMarkup(this._element.outerHTML);
        }
    };

    freeze (markup, name) {
        return markup.replace(new RegExp(name, "g"),`behold-${name}`);
    };

    generateStatic(dom,resolve,reject){
        let markup = '';
        try{
            markup = this.getMarkup(dom);
            if(this.component.freezeChildren){
                markup = this.freeze(markup, this.component.directive.name);
                this.component.freezeChildren.forEach(child => {markup = this.freeze(markup,child);})
            }
            dom.window.close();
            resolve(markup);
        } catch (e) {
            reject(e);
            dom.window.close();
        }
    };


    applyParams(params){
        Object.keys(params).forEach(param => {
            if(this.component.bindings[param]){
                this.component.bindings[param].value = params[param];
            }
        });

        this.component = this.componentFrom(this.component);
    }

    render(params){
        let dom,timeout;
        if(params){
            this.applyParams(params);
        } else {
            this.component = this.componentFrom(this.component);
        }
        return new Promise((resolve,reject)=>{
            try{
                dom = new JSDOM(this.component._template,this.options);
                //console.log(dom.serialize());
            } catch (e){
                reject(e);
                dom.window.close();
            }
            timeout = setTimeout(()=>{
                this.generateStatic(dom,resolve,reject);
            },this.timeout);
        });
    }


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

    componentFrom(componentConfig){
        let component = {...componentConfig};
        component._bindings = this.generateBindings(component);
        component = this.generateTemplate(component);
        return component;
    }

    constructor(componentConfig,options = defaultOptions,timeout = 10000) {
        this.bannedAttrs = bannedAttrs;
        this.bannedClasses = bannedClasses;

        this.component = {...componentConfig};
        this.options = options;
        this.timeout = timeout;
    }
}

module.exports = {
    defaultOptions, debugOptions , Behold
};
