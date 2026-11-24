'use strict';
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 const id=new URL(req.url,'https://rahyar.invalid').searchParams.get('id');
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id||''))return res.status(400).json({error:'Invalid share link'});
 const authorization=req.headers.authorization;if(!authorization?.startsWith('Bearer '))return res.status(401).json({error:'Sign in first'});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;if(!base||!key)return res.status(503).json({error:'Account service unavailable'});
 try{
  const userResponse=await fetch(base+'/auth/v1/user',{headers:{apikey:key,authorization},signal:AbortSignal.timeout(5000)});if(!userResponse.ok)return res.status(401).json({error:'Session unavailable'});
  const user=await userResponse.json();if(!user.email_confirmed_at||user.is_anonymous)return res.status(403).json({error:'Verify your email before opening shared trips'});
  const response=await fetch(base+'/rest/v1/rahyar_trip_shares?id=eq.'+id+'&select=payload',{headers:{apikey:key,authorization,'x-rahyar-share':id},signal:AbortSignal.timeout(8000)});
  if(!response.ok)return res.status(503).json({error:'Shared trip unavailable'});const rows=await response.json();if(!rows.length)return res.status(404).json({error:'Shared trip not found, revoked, or phone registration incomplete'});return res.status(200).json(rows);
 }catch{return res.status(503).json({error:'Shared trip service unavailable; current navigation is preserved'});}
};
