const express = require('express')
const { holdableSampleDirective } = require("../index");
const { holdable } = require("../old/index");

//const app = express()
//const port = 3000

const TTL = 60*60*1000; // 1Hour

//var map = {};
//app.get('/favicon.ico',(req,res) => {
//    res.status(404).send();
//})
/*
app.get('/*', (req, res) => {
    let component = req.params[0];
    let bindStr = req.query.bind;
    let key = component+bindStr;
    let out = '';

    if(map[key]){
        out = map[key].value || (map[component] && map[component].value);
    }
    if(!map[key] || !map[key]._processing && TTL < new Date().getTime() - map[key].lastUpdated ){
        let bind = JSON.parse(bindStr);
        console.log('render');
        map[key] = map[key] || {};
        map[key]._processing = true;
        heldSampleDirective.render(bind).then(i=> { map[key] = {value:i,lastUpdated:new Date().getTime()} })
    }
    res.send(out || `<!-- Rendering ${component}${bindStr} -->`)
});
*/
//heldSampleDirective.render().then(i=> { map['sample-directive'] = {value:i,lastUpdated:new Date().getTime()}; console.log('initial render done')})

//app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))



class beholdServer{
    start(){
        if(!this.preRender){
            this.server.listen(this.port, () => console.log(`Behold server listening on port:${this.port}`))
        } else {
            this.startWaiting = true;
            console.clear();
            console.log(`waiting for ${this.preRender} components to preRender`)
        }
    }

    addToCache(key,heldComponent){
        this.map[key] = {value:heldComponent ,lastUpdated:new Date().getTime()};
    }

    getFromCache(component,bindStr){
        let key = component+bindStr;
        if(this.map[key]){
            return this.map[key].value || (this.map[component] && this.map[component].value)
        }
    }

    isRenderRequired(key){
        return !this.map[key] || !this.map[key]._processing && TTL < new Date().getTime() - this.map[key].lastUpdated;
    }

    setComponentProcessing(key){
        this.map[key] = this.map[key] || {};
        this.map[key]._processing = true;
    }

    addComponent(componentPath,behold){
        this.preRender+=1;
        this.components[componentPath] = behold;
        //render initial state of component
        // todo perhaps using a queue here makes sense
        behold.render().then(heldComponent => {
            this.addToCache(componentPath,heldComponent);
            this.preRender-=1;
            if(this.startWaiting){
                this.start()
            }
        })
    }

    getHeldComponent(req,res){
        let component = req.params && req.params[0];
        let bindStr = req.query && req.query.bind || "";

        if(!this.components[component]) return res.status(404).send(`<!-- unable to render ${component}${bindStr}-->`);

        let key = component+bindStr;

        if(this.isRenderRequired(key)){
            let bind = JSON.parse(bindStr);
            console.log('render');
            this.setComponentProcessing(key);
            this.components[component].render(bind).then(heldComponent => this.addToCache(key,heldComponent))
        }

        res.send(this.getFromCache(component,bindStr) || `<!-- Rendering ${component}${bindStr} -->`)
    }

    constructor(port){
        this.server = express();
        this.port = port;
        this.map = {};
        this.components = {};
        this.preRender = 0;
        this.server.get('/favicon.ico',(req,res) => {
            res.status(404).send();
        });
        this.server.get('/*',(req,res) => {
            this.getHeldComponent(req,res)
        });
    }
}

let bh = new beholdServer(3000);
bh.addComponent('sample-directive',holdableSampleDirective);

bh.start();
module.exports = {
    beholdServer
};
