'use strict';
const prefix='rahyar-offline-v1-';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='PREPARE')return;
 event.waitUntil((async()=>{try{
  const manifest=await (await fetch('offline-manifest.json',{cache:'no-store'})).json();
  const cache=await caches.open(prefix+manifest.version);
  // Reuse a complete download of this exact content version.
  if(!await cache.match('__ready__')){
   await cache.addAll(manifest.files);await cache.put('__ready__',new Response('complete'));
  }
  event.ports[0]?.postMessage({ok:true});
 }catch{event.ports[0]?.postMessage({ok:false});}})());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Never cache authentication, API calls, external tiles, traffic or satellite data.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith((async()=>{try{return await fetch(event.request);}catch{
  const names=(await caches.keys()).filter(n=>n.startsWith(prefix)).reverse();
  for(const name of names){const cache=await caches.open(name);if(!await cache.match('__ready__'))continue;
   const key=event.request.mode==='navigate'?'index.html':event.request;const response=await cache.match(key,{ignoreSearch:true});if(response)return response;
  }
  return Response.error();
 }})());
});
