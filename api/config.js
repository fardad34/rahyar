'use strict';
module.exports = (req,res) => {
  res.setHeader('Cache-Control','no-store');
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url || !key || !key.startsWith('sb_publishable_')) return res.status(503).json({error:'Shared reports are not configured'});
  res.status(200).json({url,publishableKey:key});
};
