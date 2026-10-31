const assert=require('node:assert/strict');
const {load}=require('./probe.cjs'),{on,uo}=require('./scheduler.cjs');
(async()=>{const {state}=await load();let n=0,end=Date.now()+48*3600000;for(const p of uo(state,Date.now())){assert(p.endMs>p.startMs);assert.equal(on(state,p.endMs-1).key,p.key);assert.notEqual(on(state,p.endMs).key,p.key);if(++n>2000||p.endMs>end)break;}for(const v of state.versions)assert.equal(on(state,v.effectiveAtMs).version,v.v);console.log(`PASS: ${n} scheduler boundary checks and version effective times`);})().catch(e=>{console.error(e);process.exit(1)});
