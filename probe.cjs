const {on,uo,u0,z0}=require('./scheduler.cjs');
const base='https://data.spelunkr.tv/';
async function get(p){const r=await fetch(new URL(p,base),{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${p}: ${r.status}`);return r.json()}
async function load(){const l=await get('lineup.json');const c=l.channels.find(c=>c.id==='saturday-morning');const versions=[];for(const v of c.versions){const m=await get(v.manifest),p=await get(m.platform);versions.push(z0(m,p,v));}return {channel:c,state:u0(c.id,versions)};}
module.exports={load,get};
if(require.main===module)load().then(({channel,state})=>{console.log(JSON.stringify({channel,current:on(state,Date.now()),next:[...take(uo(state,Date.now()),5)]},null,2))}).catch(e=>{console.error(e);process.exit(1)});
function* take(g,n){for(const x of g){yield x;if(!--n)return}}
