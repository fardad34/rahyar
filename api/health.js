'use strict';
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  let database='unconfigured';
  if(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) {
    try {
      const response=await fetch(process.env.SUPABASE_URL+'/auth/v1/health',{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(5000)});
      database=response.ok?'reachable':'unavailable';
    } catch {database='unavailable';}
  }
  if(database!=='reachable')console.warn(JSON.stringify({event:'rahyar_health_degraded',auth:database}));
  res.status(database==='reachable'?200:503).json({service:'rahyar',status:database==='reachable'?'ok':'degraded',auth:database,commit:process.env.VERCEL_GIT_COMMIT_SHA||process.env.COMMIT_REF||'local'});
};
