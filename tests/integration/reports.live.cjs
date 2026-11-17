'use strict';
// Opt-in integration test. Never commit the credentials file or browser sessions.
const {createClient}=require('@supabase/supabase-js');const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
process.loadEnvFile('.env.local');
async function run(){
 const users=JSON.parse(fs.readFileSync(process.env.RAHYAR_TEST_USERS_FILE));
 const clients=[];
 for(const u of users){const c=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});const {error}=await c.auth.signInWithPassword({email:u.email,password:u.password});assert.ifError(error);clients.push(c);}
 const [a,b]=clients;
 const {data:stations,error:stationError}=await a.from('rahyar_stations').select('*').limit(212);assert.ifError(stationError);const station=stations[crypto.randomInt(stations.length)];
 const record={client_id:crypto.randomUUID(),category:'weigh',station_key:station.id,status:'open',latitude:station.latitude,longitude:station.longitude,accuracy_m:5,heading:90,observed_at:new Date().toISOString()};
 const {error}=await a.from('rahyar_road_reports').insert(record);assert.ifError(error);
 const {data:received,error:readError}=await b.from('rahyar_road_reports').select('*').eq('client_id',record.client_id);assert.ifError(readError);assert.equal(received.length,1);assert.equal(received[0].status,'open');assert.equal(received[0].source,'driver');
 console.log('PASS real independent-account report persistence and retrieval');
 const {stationStatus}=require('../../src/report-model.cjs');
 assert.equal(stationStatus(received,station.id,90).status,'unknown');
 const second={...record,client_id:crypto.randomUUID(),observed_at:new Date().toISOString()};
 const {error:secondError}=await b.from('rahyar_road_reports').insert(second);assert.ifError(secondError);
 const {data:corroborated}=await b.from('rahyar_road_reports').select('*').eq('station_key',station.id);
 assert.equal(stationStatus(corroborated,station.id,90).status,'open');
 const {error:conflictError}=await b.from('rahyar_road_reports').insert({...second,client_id:crypto.randomUUID(),status:'closed',observed_at:new Date().toISOString()});assert.ifError(conflictError);
 const {data:conflicting}=await a.from('rahyar_road_reports').select('*').eq('station_key',station.id);
 assert.equal(stationStatus(conflicting,station.id,90).status,'unknown');
 console.log('PASS real station observations: single driver Unknown, two agreeing drivers Open, conflicting latest evidence Unknown');
 const {error:replayError}=await a.from('rahyar_road_reports').insert(record);assert.ifError(replayError);
 const {data:replayed}=await b.from('rahyar_road_reports').select('id').eq('client_id',record.client_id);assert.equal(replayed.length,1);console.log('PASS offline retry idempotency');
 const {error:forged}=await a.from('rahyar_road_reports').insert({...record,client_id:crypto.randomUUID(),source:'official'});assert(forged);console.log('PASS source forgery denied');
 const {error:far}=await a.from('rahyar_road_reports').insert({...record,client_id:crypto.randomUUID(),latitude:station.latitude+1});assert(far);console.log('PASS distant station observation denied');
 const {error:stale}=await a.from('rahyar_road_reports').insert({...record,client_id:crypto.randomUUID(),observed_at:new Date(Date.now()-21*60000).toISOString()});assert(stale);console.log('PASS stale observation denied');
 const own={client_id:crypto.randomUUID(),kind:'preferences',data:{language:'fa'}};const {error:saveError}=await a.from('rahyar_saved_records').insert(own);assert.ifError(saveError);
 const {data:privateRows,error:privacyError}=await b.from('rahyar_saved_records').select('*').eq('client_id',own.client_id);assert.ifError(privacyError);assert.equal(privateRows.length,0);
 const {error:impersonate}=await b.from('rahyar_saved_records').insert({...own,user_id:users[0].id});assert(impersonate);console.log('PASS private saved records isolated and account impersonation denied');
 const anon=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});const {error:anonRead}=await anon.from('rahyar_road_reports').select('*');assert(anonRead);console.log('PASS signed-out report access denied');
 await a.from('rahyar_saved_records').delete().eq('client_id',own.client_id);
 await Promise.all(clients.map(c=>c.auth.signOut()));
}
run().catch(error=>{console.error('Live backend check failed:',error.code||error.name,error.message?.replace(/sb_[A-Za-z0-9_]+/g,'[redacted]'));process.exitCode=1;});
