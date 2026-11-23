'use strict';
const {answer}=require('../src/assistant-data.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST required'});
 try{
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)return res.status(503).json({error:'Account service unavailable'});
  const token=req.headers.authorization;
  if(!token?.startsWith('Bearer '))return res.status(401).json({error:'Sign in first'});
  const user=await fetch(process.env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,Authorization:token},signal:AbortSignal.timeout(5000)});
  if(!user.ok)return res.status(401).json({error:'Session expired. Sign in again.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body.question!=='string'||body.question.length>500||JSON.stringify(body).length>12000)return res.status(400).json({error:'Question or context is too large'});
  const safe={};for(const key of ['weather','border','flyingJ','station','stops'])if(typeof body.context?.[key]==='string')safe[key]=body.context[key].slice(0,1600);
  const result=answer(body.question,safe);
  return res.status(200).json({...result,mode:'data_lookup',modelConnected:false,cost:0});
 }catch(error){console.warn(JSON.stringify({event:'rahyar_assistant_unavailable',code:error.code||error.name||'unknown'}));return res.status(503).json({error:'Assistant unavailable. Navigation still works.'});}
};
