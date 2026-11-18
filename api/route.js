'use strict';
// Fixed-provider routing gateway. No service keys, caller-supplied URLs, GPS logs or database writes.
const limits={height:[.1,10],width:[.1,10],length:[.1,100],weight:[.1,200],axle_load:[.1,40],axle_count:[1,30],use_truck_route:[0,1],hgv_no_access_penalty:[0,43200],country_crossing_penalty:[0,43200]};
function validate(body){
 if(!body||!['auto','truck'].includes(body.costing)||!Array.isArray(body.locations)||body.locations.length<2||body.locations.length>16)throw Error('Invalid vehicle or waypoints');
 const locations=body.locations.map(p=>{if(!Number.isFinite(p.lon)||!Number.isFinite(p.lat)||Math.abs(p.lon)>180||Math.abs(p.lat)>90)throw Error('Invalid coordinates');const safe={lon:p.lon,lat:p.lat};if(Number.isFinite(p.heading)&&p.heading>=0&&p.heading<360){safe.heading=p.heading;safe.heading_tolerance=45;}if(p.type==='through')safe.type='through';return safe;});
 const options=body.costing_options?.[body.costing]||{},safe={};
 for(const [key,value]of Object.entries(options)){if(key==='hazmat'){if(typeof value!=='boolean')throw Error('Invalid cargo');safe.hazmat=value;continue;}if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1])throw Error('Invalid vehicle configuration');safe[key]=value;}
 if(body.costing==='truck'&&!['height','width','length','weight','axle_load','axle_count'].every(key=>Number.isFinite(safe[key])))throw Error('Truck dimensions are required');
 return {locations,costing:body.costing,costing_options:{[body.costing]:safe},format:'osrm',shape_format:'geojson',alternates:Math.min(2,Math.max(0,Number.isInteger(body.alternates)?body.alternates:0))};
}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 let request;
 try{if(JSON.stringify(req.body||'').length>12000)return res.status(413).json({error:'Route request too large'});request=validate(typeof req.body==='string'?JSON.parse(req.body):req.body);}catch{return res.status(400).json({error:'Invalid route request or vehicle configuration'});}
 try{
  const upstream=await fetch('https://valhalla1.openstreetmap.de/route',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Rahyar/1.0'},body:JSON.stringify(request),signal:AbortSignal.timeout(27000)});
  const data=await upstream.json();
  if(!upstream.ok)return res.status(upstream.status===429?429:upstream.status===400?400:503).json({code:data.code,error_code:data.error_code,error:'Routing provider could not calculate this section'});
  return res.status(200).json(data);
 }catch(error){const timeout=error.name==='TimeoutError'||error.name==='AbortError';return res.status(timeout?504:503).json({error:timeout?'Routing section timed out':'Routing service unavailable'});}
};
module.exports.validate=validate;
