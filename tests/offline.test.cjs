const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function worker(fetcher) {
  const events={}, stores=new Map();
  const store=name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {match:async req=>m.get(req.url||req),put:async(req,res)=>m.set(req.url||req,res),addAll:async()=>{}};};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),{
    self:{location:{origin:'https://example.com'},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
    URL,fetch:fetcher,caches:{open:async name=>store(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),match:async req=>{for(const m of stores.values())if(m.has(req.url||req))return m.get(req.url||req);}}
  });
  return {
    stores, store,
    async request(url,mode='cors') {let promise;events.fetch({request:{url,mode,method:'GET'},respondWith:p=>promise=p});return promise;},
    async activate(){let p;events.activate({waitUntil:promise=>p=promise});await p;}
  };
}
test('visited photos are cached and continue working without network',async()=>{
  let calls=0,online=true;
  const sw=worker(async()=>{calls++;if(!online)throw new Error('offline');return new Response('webp bytes',{status:200});});
  const url='https://example.com/za-nas-stol/assets/meals/V12.webp';
  assert.equal(await (await sw.request(url)).text(),'webp bytes');online=false;
  assert.equal(await (await sw.request(url)).text(),'webp bytes');assert.equal(calls,1);
});
test('navigation falls back to the last good app on network or server failures',async()=>{
  let failure=false,offline=false;
  const sw=worker(async()=>{if(offline)throw new Error('offline');return new Response(failure?'server error':'app',{status:failure?503:200});});
  const url='https://example.com/za-nas-stol/';
  assert.equal(await (await sw.request(url,'navigate')).text(),'app');failure=true;
  assert.equal(await (await sw.request(url,'navigate')).clone().text(),'app');offline=true;
  assert.equal(await (await sw.request(url,'navigate')).clone().text(),'app');
});
test('failed image responses are not cached',async()=>{
  let calls=0;
  const sw=worker(async()=>new Response(++calls===1?'not found':'image',{status:calls===1?404:200}));
  const url='https://example.com/za-nas-stol/assets/meals/V12.webp';
  assert.equal((await sw.request(url)).status,404);assert.equal((await sw.request(url)).status,200);assert.equal(calls,2);
});
test('an app update preserves unrelated caches and the reusable font cache',async()=>{
  const sw=worker(async()=>new Response(''));
  sw.store('another-app');sw.store('zns-old');sw.store('zns-fonts');
  await sw.activate();assert.ok(sw.stores.has('another-app'));assert.ok(sw.stores.has('zns-fonts'));assert.ok(!sw.stores.has('zns-old'));
});
test('the new HTML requests content-versioned assets present in the offline shell',()=>{
  const {createHash}=require('node:crypto'),base=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),sw=fs.readFileSync(path.join(base,'sw.js'),'utf8');
  for(const asset of ['experience.css','shopping-data.js','shopping.js']) {
    const hash=createHash('sha256').update(fs.readFileSync(path.join(base,asset))).digest('hex').slice(0,12);
    assert.ok(html.includes(`${asset}?v=${hash}`),`${asset}: HTML must bypass the old worker cache`);
    assert.ok(sw.includes(`./${asset}?v=${hash}`),`${asset}: available offline`);
  }
});
test('a cache-first worker does not reuse unversioned CSS for a new version URL',async()=>{
  const sw=worker(async req=>new Response(req.url.includes('?v=')?'new styles':'old styles'));
  const url='https://example.com/za-nas-stol/experience.css';
  assert.equal(await (await sw.request(url)).text(),'old styles');
  assert.equal(await (await sw.request(url+'?v=new')).text(),'new styles');
});
