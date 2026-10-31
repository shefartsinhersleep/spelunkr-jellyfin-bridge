const assert=require('node:assert/strict');
(async()=>{const base=new URL(process.argv[2]||'http://127.0.0.1:8097');
async function get(p){const r=await fetch(new URL(p,base),{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);return r.text();}
const health=JSON.parse(await get('/health'));assert.equal(health.ok,true);
const m3u=await get('/channels.m3u'),xml=await get('/guide.xml');
assert(m3u.startsWith('#EXTM3U'));assert(m3u.includes('tvg-id="saturday-morning"'));assert(m3u.includes('/stream/saturday-morning'));
assert(xml.startsWith('<?xml'));assert(xml.includes('<channel id="saturday-morning">'));assert(xml.includes('<programme channel="saturday-morning"'));
console.log('PASS: health, playlist and XMLTV channel mapping (not a full XML parser or playback check)');
})().catch(e=>{console.error(e.message);process.exit(1)});
