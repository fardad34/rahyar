const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(){let now=0;const timers=[],markers=[];const container={clientWidth:1000,clientHeight:800,getBoundingClientRect:()=>({left:0,top:0})};
 const ctx={window:{},map:null,navigationReady:true,navigationMap:{getSource:()=>({setData(){}}),getLayer:()=>true,getContainer:()=>container,project:p=>({x:p[0],y:p[1]})},document:{getElementById:()=>null,createElement:()=>({style:{},setAttribute(){}})},Date:{now:()=>now},watch:null,setInterval(){},clearInterval(){},setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},maplibregl:{Marker:class {constructor({element}){this.element=element;}setLngLat(p){this.point=p;return this;}addTo(){markers.push(this);return this;}remove(){this.removed=true;}}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/route-options-map.js','utf8'),ctx);
 return {ctx,options:ctx.window.RahyarRouteOptions,advance(ms){now+=ms;timers.at(-1)();},labels:()=>markers.filter(m=>!m.removed),markers};
}
const route=line=>({distance:100000,duration:3600,geometry:{coordinates:line}}),primary=()=>route([[200,200],[500,450],[700,600]]),alternative=()=>route([[200,200],[500,250],[700,600]]);
test('selected-route distance/time disappears after one minute; visible alternative branch keeps its label',()=>{
 const c=setup(),routes=[primary(),alternative()];c.options.set(routes,0);assert.equal(c.labels().length,2);
 c.advance(60001);assert.equal(c.labels().length,1);assert.equal(c.labels()[0].routeIndex,1);assert.deepEqual(Array.from(c.labels()[0].point),[500,250]);
 c.options.render();c.options.set(routes,0);assert.equal(c.labels().length,1,'map refresh/same-route set must not restart the minute');
 c.options.set(routes,1);assert.equal(c.labels().length,2,'choosing another route starts a new selected-route minute');
});
test('alternatives are not labeled on the shared road above the truck or outside the visible map',()=>{
 const c=setup(),r=primary();c.options.set([r,primary()],0);assert.equal(c.labels().length,1,'same shared corridor is not an alternative branch label');
 c.options.set([route([[1200,1200],[1400,1400]])],0);assert.equal(c.labels().length,0,'no arbitrary offscreen/first-point fallback label');
});

test('2D fallback applies the same selected-label expiration and branch anchoring',()=>{
 const c=setup(),tooltips=[];c.ctx.navigationReady=false;c.ctx.navigationMap=null;c.ctx.$=()=>({hidden:false});c.ctx.map={getContainer:()=>({clientWidth:1000,clientHeight:800,getBoundingClientRect:()=>({left:0,top:0})}),latLngToContainerPoint:p=>({x:p[1],y:p[0]})};
 const layer=()=>({addTo(){return this;},on(){},remove(){this.removed=true;}});c.ctx.L={polyline:layer,tooltip:()=>{const t=layer();t.setLatLng=p=>{t.point=p;return t;};t.setContent=()=>t;tooltips.push(t);return t;}};
 c.options.set([primary(),alternative()],0);assert.equal(tooltips.filter(t=>!t.removed).length,2);c.advance(60001);const shown=tooltips.filter(t=>!t.removed);assert.equal(shown.length,1);assert.deepEqual(Array.from(shown[0].point),[250,500]);
});
test('a visible urban branch gets a label even when thousands of distant shared points follow it',()=>{const c=setup(),tail=Array.from({length:5000},(_,i)=>[1200+i,1000]);c.options.set([route([[200,200],[500,450],[700,600],...tail]),route([[200,200],[500,250],[700,600],...tail])],0);const alternative=c.labels().find(m=>m.routeIndex===1);assert(alternative,'sampling must focus on visible geometry instead of skipping the short city branch');assert.deepEqual(Array.from(alternative.point),[500,250]);});
