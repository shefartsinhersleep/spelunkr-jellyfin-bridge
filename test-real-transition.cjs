const {load}=require('./probe.cjs'),{u0}=require('./scheduler.cjs');
(async()=>{const data=await load(),v=data.state.versions.at(-1);
 const state=u0('saturday-morning',[{...v,v:1,epochMs:Date.now(),effectiveAtMs:Date.now(),startIndex:0,items:v.items.slice(3,5).map(i=>({...i,duration:18})),block:null,ads:null}]);
 require('./probe.cjs').load=async()=>({channel:data.channel,state});
 process.env.PORT='18097';process.env.HOST='127.0.0.1';require('./bridge.cjs');
})().catch(e=>{console.error(e);process.exit(1)});
