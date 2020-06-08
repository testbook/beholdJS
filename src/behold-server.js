const express = require('express');
const { Beholder } = require('./behold');

const TTL = 60*60*1000; // 1Hour

class beholdServer{
    start(){
        console.clear();
        if(!this.preRenderComponentLeft){
            this.server.listen(this.port, () => console.log(`Behold server listening on port:${this.port}`))
        } else {
            this.startWaiting = true;
            console.log(`waiting for ${this.preRenderComponentLeft} components to render initial state`)
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

    renderComponent(component,params,cacheKey,firstRender){

        let postRender = (heldComponent) => {
            this.addToCache(cacheKey,heldComponent);
            if(firstRender){
                this.preRenderComponentLeft-=1;
                if(this.startWaiting){
                    this.start()
                }
            }
        };

        if(component.isHoldable){
            component.behold.using(component.behold.beholder || this.renderer).render(params).then(postRender)
        } else {
            this.renderer.render(component.behold,params).then(postRender)
        }
    }

    addComponent(componentPath,behold,isHoldable){
        this.preRenderComponentLeft+=1;
        this.components[componentPath] = {behold,isHoldable};
        //render initial state of component
        // todo perhaps using a queue here makes sense to constrain rendering to a Max of N components at a time
        this.renderComponent(this.components[componentPath],undefined,componentPath,true);
    }

    getHeldComponent(req,res){
        let component = req.params && req.params[0];
        let bindStr = req.query && req.query.bind || "";

        if(!this.components[component]) return res.status(404).send(`<!-- unable to render ${component}${bindStr}-->`);

        let key = component+bindStr;

        if(this.isRenderRequired(key)){
            let bind = JSON.parse(bindStr);
            //console.log('render');
            this.setComponentProcessing(key);
            this.renderComponent(this.components[component],bind,key);
        }

        res.send(this.getFromCache(component,bindStr) || `<!-- Rendering ${component}${bindStr} -->`)
    }

    constructor(port,rendererConstructor = Beholder){
        this.server = express();
        this.port = port;
        this.map = {};
        this.components = {};
        this.preRenderComponentLeft = 0;
        this.server.get('/*',(req,res) => {
            this.getHeldComponent(req,res)
        });
        this.rendererConstructor = rendererConstructor;
        this.renderer = new this.rendererConstructor();
    }
}

module.exports = {
    beholdServer
};
