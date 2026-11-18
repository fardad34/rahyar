'use strict';
// Keep the vehicle in the lower visible map, outside the actual planner/watchlist bounds.
function navigationCameraFrame(width,height,{sheet=null,search=null}={}){
 const docked=width>=700&&sheet&&sheet.width<=width*.65;
 const leftDocked=docked&&sheet.x<width*.2;
 let x=docked?(leftDocked?width*.56:Math.max(width*.25,Math.min(width*.42,sheet.x*.68))):width*.5;
 let available=docked?height:Math.max(160,height-(sheet?.height||112));
 let y=docked?available*.8:Math.min(available*.8,available-65);
 if(search&&search.width>0){x=Math.min(width*.65,Math.max(width*.56,search.x+search.width+65));y=height*.72;}
 x=Math.max(60,Math.min(width-60,x));y=Math.max(120,Math.min(height-65,y));
 return {x,y,padding:{left:Math.max(0,2*x-width),right:Math.max(0,width-2*x),top:Math.max(0,2*y-height),bottom:Math.max(0,height-2*y)}};
}
function rahyarCameraFrame(width,height){
 const rect=id=>{const el=document.getElementById(id);return el&&!el.hidden?el.getBoundingClientRect():null;};
 return navigationCameraFrame(width,height,{sheet:rect('nav-trip-sheet'),search:rect('nav-search-panel')});
}
