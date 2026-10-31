// Isolated accelerated broadcast, bound only to loopback. No changes to live data.
const {u0}=require('./scheduler.cjs');
const cp=require('node:child_process'),originalSpawn=cp.spawn;
cp.spawn=(command,args,options)=>originalSpawn(command,args.map(a=>a.startsWith('https://archive.org/download/')?require('node:path').join(__dirname,'fixture.mp4'):a),options);
const item={id:'sat-toonz-1986-1987',mp4:'Sat Toonz 1986-1987.mp4',title:'Transition test',duration:4};
const bumps={channelBumps:[{id:'test-c',slides:[{text:'Channel bumper test'}]}],platformBumps:[{id:'test-p',slides:[{text:'Platform bumper test'}]}],channelAudio:[],platformAudio:[]};
const state=u0('saturday-morning',[{v:1,epochMs:Date.now()+1000,items:[item,item],bumps,engine:5}]);
require('./probe.cjs').load=async()=>({channel:{id:'saturday-morning',name:'TEST'},state});
process.env.PORT='18097';process.env.HOST='127.0.0.1';
require('./bridge.cjs');
