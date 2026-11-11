import {readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const files=[];function walk(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())walk(p);else if(f.name!=='sw.js')files.push(p.replace('dist/','./'))}}walk('dist');
const cache='amardesh-'+createHash('sha256').update(files.join('|')).digest('hex').slice(0,12);
writeFileSync('dist/sw.js',`const CACHE=${JSON.stringify(cache)};const ASSETS=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('amardesh-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))});`);
console.log('Offline cache:',cache,files.length,'files');
