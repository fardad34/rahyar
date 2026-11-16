'use strict';
// Do not require AbortSignal.timeout: older iPad browsers may not implement it.
async function getJSON(url,options={},timeout=22000){
  const controller=typeof AbortController==='function'?new AbortController():null;
  let timer;
  try{
    return await new Promise((resolve,reject)=>{
      timer=setTimeout(()=>{const error=new Error('Request timed out');error.name='TimeoutError';reject(error);if(controller)controller.abort()},timeout);
      const requestOptions={...options};if(controller&&!requestOptions.signal)requestOptions.signal=controller.signal;
      Promise.resolve().then(()=>fetch(url,requestOptions)).then(async response=>{
        if(!response.ok){
          const error=new Error('HTTP '+response.status);
          error.status=response.status;
          if(response.status===400 && typeof response.json==='function'){
            const detail=await response.json().catch(()=>null);
            error.code=detail?.code;
            error.errorCode=detail?.error_code;
          }
          throw error;
        }
        return response.json();
      }).then(resolve,reject);
    });
  }finally{clearTimeout(timer)}
}
