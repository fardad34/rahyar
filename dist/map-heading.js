'use strict';
let gpsTravelHeading=null,lastHeadingFix=null,mapDisplayHeading=null,mapHeadingUp=true;
function bearingBetween(a,b){
  if(!a||!b||a[0]===b[0]&&a[1]===b[1])return null;
  const r=Math.PI/180,lat1=a[1]*r,lat2=b[1]*r,dl=(b[0]-a[0])*r;
  return (Math.atan2(Math.sin(dl)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dl))/r+360)%360;
}
function blendBearing(previous,next,weight=.4){if(previous===null)return next;const delta=((next-previous+540)%360)-180;return Math.abs(delta)<1.5?previous:(previous+delta*weight+360)%360}
function resetMapHeading(){gpsTravelHeading=null;lastHeadingFix=null;mapDisplayHeading=null}
function recordGpsHeading(fix,coord){
  const now=Date.now(),accurate=Number.isFinite(fix.accuracy)&&fix.accuracy<=35;
  if(accurate&&Number.isFinite(fix.heading)&&fix.heading>=0&&fix.heading<360&&Number.isFinite(fix.speed)&&fix.speed>=1.5)gpsTravelHeading=fix.heading;
  else if(accurate&&lastHeadingFix&&now-lastHeadingFix.time>=1000){const moved=hav(lastHeadingFix.coord,coord),elapsed=(now-lastHeadingFix.time)/1000;if(moved>=Math.max(8,fix.accuracy*.6)&&moved/elapsed>=1.5)gpsTravelHeading=bearingBetween(lastHeadingFix.coord,coord)}
  if(accurate&&(!lastHeadingFix||(now-lastHeadingFix.time>=1000&&hav(lastHeadingFix.coord,coord)>=8)))lastHeadingFix={coord:[...coord],time:now};
}
function updateCockpitBearing(){
  if(!map||typeof map.setBearing!=='function')return;
  if(!document.body.classList.contains('driving')||!mapHeadingUp){map.setBearing(0);return}
  let target=gpsTravelHeading;
  if(target===null&&coords.length>1&&routeLength>progress+3)target=bearingBetween(pointOnRoute(progress),pointOnRoute(Math.min(routeLength,progress+60)));
  if(target!==null){mapDisplayHeading=blendBearing(mapDisplayHeading,target);map.setBearing(-mapDisplayHeading)}
}
function initMapHeading(){
  $('focus-orientation').onclick=()=>{mapHeadingUp=!mapHeadingUp;$('focus-orientation').textContent=mapHeadingUp?'Heading up':'North up';updateCockpitBearing();followNavigationPosition(lastPos||pointOnRoute(progress))};
}
