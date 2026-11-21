'use strict';
// Adapt Netlify's event contract to the existing Vercel/Node handlers.
// Credentials remain environment variables; no privileged key is introduced.
function adapt(handler) {
  return async event => {
    const headers={'cache-control':'no-store'};
    const encoded=event.body||'';
    if(Buffer.byteLength(encoded)>20000)return {statusCode:413,headers,body:'Request too large'};
    const body=event.isBase64Encoded?Buffer.from(encoded,'base64').toString('utf8'):encoded;
    if(Buffer.byteLength(body)>12000)return {statusCode:413,headers,body:'Request too large'};
    let statusCode=200,result='',finished=false;
    const query=new URLSearchParams(Object.entries(event.queryStringParameters||{}).filter(([,value])=>value!==null&&value!==undefined)).toString();
    const request={url:event.rawUrl||(event.path||'/')+(query?'?'+query:''),method:event.httpMethod,headers:Object.fromEntries(Object.entries(event.headers||{}).map(([key,value])=>[key.toLowerCase(),value])),body};
    const response={setHeader(name,value){headers[name.toLowerCase()]=String(value);},status(code){statusCode=code;return response;},json(value){headers['content-type']='application/json; charset=utf-8';result=JSON.stringify(value);finished=true;return response;}};
    try {
      await handler(request,response);
      if(!finished)throw Error('Handler did not complete');
      return {statusCode,headers,body:event.httpMethod==='HEAD'?'':result};
    } catch {
      console.warn(JSON.stringify({event:'rahyar_function_failed'}));
      return {statusCode:500,headers:{...headers,'content-type':'application/json'},body:JSON.stringify({error:'Service unavailable'})};
    }
  };
}
module.exports={adapt};
