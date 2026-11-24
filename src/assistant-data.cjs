'use strict';
// Deterministic retrieval only. No language model or paid inference is activated.
function answer(question,context={}) {
 const q=String(question||'').toLowerCase();
 if(/legal|legality|restriction|مجاز|محدودیت|légal|legalidad|zulässig/.test(q))return {text:'I cannot verify road legality for your truck from the available data. Routing uses your dimensions, but mapped restrictions may be incomplete. Follow posted signs and official restrictions.',source:'limitation'};
 if(/night|شب|nuit|noche|nacht|रात/.test(q))return {text:'Switch to night map?',action:'night',source:'map control'};
 if(/\b3d\b|سه.?بعدی/.test(q))return {text:'Enable 3D perspective?',action:'3d',source:'map control'};
 if(/destination|مقصد/.test(q)&&/change|switch|set|تغییر/.test(q))return {text:'Destination changes require your confirmation in the trip planner. I have not changed your destination or route.',source:'confirmation required'};
 if(/weather|temperature|هوا|météo|clima|wetter|मौसम/.test(q))return {text:context.weather||'Destination weather is unavailable. No forecast has been invented.',source:context.weather?'Open-Meteo arrival forecast':'unavailable'};
 if(/border|مرز|frontière|frontera|grenze|सीमा/.test(q))return {text:context.border||'No upcoming boundary has been identified on the loaded route.',source:'loaded route and region boundaries'};
 if(/flying\s*j/.test(q))return {text:context.flyingJ||'No Flying J is identified ahead in the loaded corridor. Coverage may be incomplete.',source:'loaded facility inventory'};
 if(/weigh|inspection|باسکول|بازرسی|pesée|báscula|waage|वजन/.test(q))return {text:context.station||'No relevant government station is identified ahead. Operational status is Unknown.',source:'loaded government inventory and driver observations'};
 if(/truck stop|fuel|استراحت|سوخت|relais|combustible|rast|ईंधन/.test(q))return {text:context.stops||'No relevant stops have been identified in the loaded data.',source:'loaded facility inventory'};
 return {text:'I can look up the next border, Flying J, weigh station, destination weather, or map controls from loaded trip data. A language model is not connected.',source:'data assistant'};
}
module.exports={answer};
