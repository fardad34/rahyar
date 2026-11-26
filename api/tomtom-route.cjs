'use strict';
// Provider adapter only. Never log credentials, upstream URLs or driver coordinates.
function failure(message,status=422){return Object.assign(new Error(message),{status});}
function buildRequest(request,key){
 if(typeof key!=='string'||!/^[-_a-zA-Z0-9]{16,256}$/.test(key))throw failure('Add a valid TomTom key in Traffic setup; Routing API access is required.',503);
 const truck=request.costing==='truck',v=request.costing_options[request.costing];
 // The existing boolean does not identify cargo classes. Never guess a legal hazmat profile.
 if(truck&&v.hazmat)throw failure('TomTom needs an exact hazardous cargo class. This profile only records yes/no; use your explicitly selected Valhalla provider for now.');
 const points=request.locations.map(p=>`${p.lat},${p.lon}`).join(':');
 const url=new URL('https://api.tomtom.com/routing/1/calculateRoute/'+points+'/json');
 const params={key,travelMode:truck?'truck':'car',routeType:'fastest',traffic:'true',instructionsType:'text',language:'en-GB',routeRepresentation:'polyline',maxAlternatives:request.alternates,alternativeType:'anyRoute',computeBestOrder:'false'};
 if(truck)Object.assign(params,{vehicleHeight:v.height,vehicleWidth:v.width,vehicleLength:v.length,vehicleWeight:Math.round(v.weight*1000),vehicleAxleWeight:Math.round(v.axle_load*1000),vehicleNumberOfAxles:v.axle_count,vehicleCommercial:'true'});
 if(Number.isFinite(request.locations[0].heading))params.vehicleHeading=request.locations[0].heading;
 for(const [k,value]of Object.entries(params))url.searchParams.set(k,String(value));
 const rectangles=(request.exclude_locations||[]).map(p=>({southWestCorner:{latitude:Math.max(-90,p.lat-.00015),longitude:Math.max(-180,p.lon-.00015)},northEastCorner:{latitude:Math.min(90,p.lat+.00015),longitude:Math.min(180,p.lon+.00015)}}));
 return {url,options:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rectangles.length?{avoidAreas:{rectangles}}:{}),signal:AbortSignal.timeout(27000)}};
}
function maneuver(instruction){
 const m=instruction.maneuver||'',modifier=m.includes('LEFT')?'left':m.includes('RIGHT')?'right':m.includes('UTURN')?'uturn':'straight';
 let type='continue';
 if(m==='DEPART')type='depart';else if(m.startsWith('ARRIVE'))type='arrive';else if(m.startsWith('ROUNDABOUT'))type='roundabout';else if(m.startsWith('MOTORWAY_EXIT')||m==='TAKE_EXIT')type='off ramp';else if(m.startsWith('ENTER_')||m==='ENTRANCE_RAMP')type='on ramp';else if(m.startsWith('KEEP'))type='fork';else if(m.includes('TURN')||m.includes('BEAR')||m.startsWith('SHARP'))type='turn';
 return {type,modifier:m.startsWith('BEAR')?'slight '+modifier:m.startsWith('SHARP')?'sharp '+modifier:modifier,location:[instruction.point.longitude,instruction.point.latitude],...(instruction.roundaboutExitNumber?{exit:instruction.roundaboutExitNumber}:{})};
}
function convert(data){
 if(!Array.isArray(data.routes)||!data.routes.length)throw failure('TomTom returned no route for this vehicle.',400);
 return {code:'Ok',provider:'tomtom',routes:data.routes.slice(0,3).map(route=>{
  const distance=route.summary?.lengthInMeters,duration=route.summary?.travelTimeInSeconds;
  if(!Number.isFinite(distance)||!Number.isFinite(duration)||!route.legs?.length)throw failure('TomTom route response is incomplete.',502);
  const coordinates=[];for(const leg of route.legs)for(const p of leg.points||[]){if(!Number.isFinite(p.longitude)||!Number.isFinite(p.latitude))throw failure('Invalid route geometry.',502);coordinates.push([p.longitude,p.latitude]);}
  if(coordinates.length<2)throw failure('TomTom route geometry is missing.',502);
  const instructions=route.guidance?.instructions;
  if(!instructions?.length)throw failure('TomTom did not return navigation instructions.',502);
  let offset=0,time=0;
  function stepLine(i,next,leg){
   const points=leg.points.map(p=>[p.longitude,p.latitude]);
   const start=[i.point.longitude,i.point.latitude],finish=next?[next.point.longitude,next.point.latitude]:points.at(-1);
   // Guidance points may lie between native vertices. Locate on native segments; never shortcut bends.
   function locate(p,min){
    for(let n=Math.floor(min);n<points.length-1;n++){
     const a=points[n],b=points[n+1],scale=Math.cos(p[1]*Math.PI/180),dx=(b[0]-a[0])*scale,dy=b[1]-a[1],px=(p[0]-a[0])*scale,py=p[1]-a[1],length=dx*dx+dy*dy;
     const t=length?(px*dx+py*dy)/length:0;
     if(t<0||t>1||n+t<min-1e-8)continue;
     if(Math.hypot(px-t*dx,py-t*dy)*111320<=1)return n+t;
    }
    const last=points.at(-1);if(Math.hypot((p[0]-last[0])*Math.cos(p[1]*Math.PI/180),p[1]-last[1])*111320<=1)return points.length-1;
    throw failure('TomTom instruction geometry could not be aligned safely. Current trip preserved.',502);
   }
   const from=locate(start,0),to=locate(finish,from);
   const line=[start,...points.slice(Math.floor(from)+1,Math.ceil(to)),finish];
   return line.filter((p,n)=>!n||p[0]!==line[n-1][0]||p[1]!==line[n-1][1]);
  }
  const legs=route.legs.map((leg,index)=>{
   const length=leg.summary?.lengthInMeters,seconds=leg.summary?.travelTimeInSeconds,end=offset+length,last=index===route.legs.length-1;
   if(!Number.isFinite(length)||!Number.isFinite(seconds)||length<0||seconds<0)throw failure('TomTom leg summary is incomplete.',502);
   const list=instructions.filter(i=>i.routeOffsetInMeters>=offset&&(i.routeOffsetInMeters<end||(last&&i.routeOffsetInMeters<=end)));
   if(!list.length)throw failure('TomTom waypoint guidance is incomplete.',502);
   const steps=list.map((i,n)=>{
    if(!i.point||!Number.isFinite(i.point.latitude)||!Number.isFinite(i.point.longitude)||!Number.isFinite(i.travelTimeInSeconds))throw failure('TomTom instruction is incomplete.',502);
    const next=list[n+1];return {distance:Math.max(0,(next?.routeOffsetInMeters??end)-i.routeOffsetInMeters),duration:Math.max(0,(next?.travelTimeInSeconds??(time+seconds))-i.travelTimeInSeconds),name:i.street||'',ref:(i.roadNumbers||[]).join(';'),exits:i.exitNumber||'',destinations:i.signpostText||'',maneuver:maneuver(i),geometry:{type:'LineString',coordinates:stepLine(i,next,leg)},instruction:i.message||''};
   });
   if(list[0].routeOffsetInMeters>offset){const p=leg.points[0];steps.unshift({distance:list[0].routeOffsetInMeters-offset,duration:Math.max(0,list[0].travelTimeInSeconds-time),name:'',geometry:{type:'LineString',coordinates:stepLine({point:p},list[0],leg)},maneuver:{type:'depart',modifier:'straight',location:[p.longitude,p.latitude]}});}
   offset=end;time+=seconds;return {distance:length,duration:seconds,steps};
  });
  return {distance,duration,geometry:{type:'LineString',coordinates},legs,provider:'tomtom'};
 })};
}
async function handle(req,res,request){
 try{
  const key=req.headers?.['x-rahyar-tomtom-key'];
  const upstream=buildRequest(request,key),r=await fetch(upstream.url,upstream.options);
  if(!r.ok){const status=[400,401,403,429].includes(r.status)?r.status:503;return res.status(status).json({error:r.status===401||r.status===403?'TomTom key refused: enable Routing API and check domain restrictions.':r.status===429?'TomTom quota reached. Routing paused; no provider switch.':'TomTom could not calculate this vehicle route.'});}
  return res.status(200).json(convert(await r.json()));
 }catch(e){return res.status(e.status||(['TimeoutError','AbortError'].includes(e.name)?504:503)).json({error:e.status?e.message:'TomTom routing unavailable; your current trip is preserved.'});}
}
module.exports={buildRequest,convert,maneuver,handle};
