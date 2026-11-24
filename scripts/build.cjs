'use strict';
const {buildSync}=require('esbuild');
buildSync({entryPoints:['src/cloud-client.js'],bundle:true,platform:'browser',format:'iife',target:['safari16'],outfile:'dist/vendor/rahyar-cloud.js',minify:true,legalComments:'eof'});
console.log('Built shared reporting client; existing application remains classic JavaScript.');

const {readdirSync,statSync,writeFileSync,readFileSync}=require('node:fs');
const {join}=require('node:path');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]);}
const {mkdirSync,copyFileSync,cpSync}=require('node:fs');
mkdirSync('dist/vendor/leaflet',{recursive:true});
for(const file of ['leaflet.js','leaflet.css'])copyFileSync('node_modules/leaflet/dist/'+file,'dist/vendor/leaflet/'+file);
cpSync('node_modules/leaflet/dist/images','dist/vendor/leaflet/images',{recursive:true});
copyFileSync('node_modules/leaflet/LICENSE','dist/vendor/leaflet/LICENSE');
const assets=files('dist').filter(p=>!p.endsWith('.json')&&!p.endsWith('offline-manifest.json'));
writeFileSync('dist/offline-manifest.json',JSON.stringify({version:require('node:crypto').createHash('sha256').update(assets.map(p=>p+require('node:crypto').createHash('sha256').update(readFileSync(p)).digest('hex')).join('|')).digest('hex').slice(0,16),files:assets.map(p=>p.replace(/^dist\//,'')),bytes:assets.reduce((n,p)=>n+statSync(p).size,0)}));
