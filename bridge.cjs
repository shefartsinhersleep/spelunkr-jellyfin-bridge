'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {load}=require('./probe.cjs'),{on,uo}=require('./scheduler.cjs');
const {port:PORT,host:HOST,publicUrl:PUBLIC}=require('./config.cjs').config();
const esc=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const stamp=n=>new Date(n).toISOString().replace(/[-:T]/g,'').slice(0,14)+' +0000';
let data,updated=0,lastError=null,active=null;
async function refresh(){try{data=await load();updated=Date.now();lastError=null;}catch(e){lastError=e.message;console.error(e);if(!data)throw e;}}
function guide(){const {channel,state}=data;let xml=`<?xml version="1.0" encoding="UTF-8"?><tv generator-info-name="Spelunkr experimental bridge"><channel id="${channel.id}"><display-name>${esc(channel.name)}</display-name></channel>`;const end=Date.now()+86400000;let count=0;for(const p of uo(state,Date.now()-3600000)){if(p.startMs>=end||++count>2000)break;const title=p.item.title||(p.item.type==='ad'?'Advertisement':'Spelunkr intermission');xml+=`<programme channel="${channel.id}" start="${stamp(p.startMs)}" stop="${stamp(p.endMs)}"><title>${esc(title)}</title><desc>${esc(p.item.type==='video'?'Spelunkr archive recording. Experimental bridge; synchronization unverified.':'Timed intermission. Prototype uses a silent text card for this segment.')}</desc></programme>`;}return xml+'</tv>';}
function source(item){if(item.type==='video'&&item.id&&item.mp4)return `https://archive.org/download/${encodeURIComponent(item.id)}/${item.mp4.split('/').map(encodeURIComponent).join('/')}`;return null;}
function titleCard(item){const slides=[...(item.channelBump?.slides||[]),...(item.platformBump?.slides||[])];return ['SPELUNKR TV',item.type==='ad'?'Advertisement — prototype intermission': 'Intermission',...slides.map(s=>s.text)].join('\n');}
async function stream(req,res){if(active){res.writeHead(503,{'Retry-After':'10'});res.end('Prototype supports one viewer at a time');return;}
 const session={child:null,closed:false,bytes:0,segments:0};active=session;
 const close=()=>{session.closed=true;session.child?.kill('SIGTERM');if(active===session)active=null;};res.on('close',close);
 res.writeHead(200,{'Content-Type':'video/mp2t','Cache-Control':'no-store','Connection':'close'});res.flushHeaders();
 let ticks=0;
 try{while(!session.closed){const p=on(data.state,Date.now()),url=source(p.item);const duration=Math.max(.04,p.remaining);
 const args=['-hide_banner','-loglevel','warning','-nostdin','-threads','2'];
 if(url)args.push('-rw_timeout','15000000','-re','-ss',String(p.offsetExact),'-i',url);
 else {const card=path.join(__dirname,'intermission.txt');fs.writeFileSync(card,titleCard(p.item));args.push('-re','-f','lavfi','-i','color=c=black:s=640x480:r=25','-f','lavfi','-i','anullsrc=r=48000:cl=stereo');}
 const vf='scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25'+(!url?`,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${path.join(__dirname,'intermission.txt')}:fontsize=18:fontcolor=white:x=20:y=40`: '');
 args.push('-t',String(duration),'-map','0:v:0','-map',url?'0:a:0':'1:a:0','-vf',vf,'-c:v','libx264','-preset','ultrafast','-tune','zerolatency','-threads','2','-pix_fmt','yuv420p','-b:v','1200k','-g','50','-c:a','aac','-b:a','128k','-ar','48000','-ac','2','-output_ts_offset',String(ticks),'-mpegts_flags','+resend_headers+initial_discontinuity','-muxdelay','0','-muxpreload','0','-f','mpegts','pipe:1');
 console.log(JSON.stringify({event:'segment',type:p.item.type,key:p.key,offset:p.offsetExact,remaining:duration,at:new Date().toISOString()}));
 const child=spawn('ffmpeg',args,{stdio:['ignore','pipe','pipe']});session.child=child;session.segments++;
 let stderr='',bytes=0;child.stderr.on('data',b=>{stderr=(stderr+b).slice(-4000)});child.stdout.on('data',b=>{session.bytes+=b.length;bytes+=b.length;});child.stdout.pipe(res,{end:false});
 // A stalled source cannot hold the channel past its scheduled boundary.
 let boundaryStop=false;
 const deadline=setTimeout(()=>{boundaryStop=true;child.kill('SIGTERM');},Math.ceil(duration*1000));
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code)=>resolve(code));});clearTimeout(deadline);
 // Leave room for AAC encoder priming and the final encoded frame.
 ticks+=duration+0.1;
 if(session.closed)break;
 if(!boundaryStop&&(result!==0||!bytes)){console.error('FFmpeg failed',result,stderr);throw Error('Source failed; retune to retry');}
 const early=p.endMs-Date.now();
 if(early>2000)throw Error('Source ended before its scheduled boundary');
 if(early>0)await new Promise(resolve=>setTimeout(resolve,early));
 // Recompute from the clock at every segment; never loop a stale MP4 list.
 }}catch(e){lastError=e.message;console.error(e);}finally{close();res.end();}
}
async function main(){await refresh();const server=http.createServer((req,res)=>{try{const p=new URL(req.url,'http://bridge').pathname;if(p==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:!!data,channel:data.channel.id,updated:new Date(updated),synchronization:'unverified',intermissions:'silent text cards; original ad and bumper media not yet rendered',lastError,active:active?{bytes:active.bytes,segments:active.segments}:null}));}if(p==='/channels.m3u'){res.setHeader('Content-Type','audio/x-mpegurl');return res.end(`#EXTM3U url-tvg="${PUBLIC}/guide.xml"\n#EXTINF:-1 tvg-id="${data.channel.id}" tvg-chno="2" group-title="Spelunkr POC",${data.channel.name}\n${PUBLIC}/stream/${data.channel.id}\n`);}if(p==='/guide.xml'){res.setHeader('Content-Type','application/xml; charset=utf-8');return res.end(guide());}if(p==='/now'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(on(data.state,Date.now())));}if(p==='/stream/'+data.channel.id){stream(req,res).catch(e=>{console.error(e);res.destroy();});return;}res.writeHead(404);res.end('Not found');}catch(e){res.writeHead(500);res.end('Bridge error');console.error(e);}});server.listen(PORT,HOST,()=>console.log(`Bridge on ${HOST}:${PORT}`));const timer=setInterval(refresh,300000);timer.unref();for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{clearInterval(timer);active?.child?.kill();server.close(()=>process.exit());setTimeout(()=>process.exit(),3000).unref();});}
main().catch(e=>{console.error(e);process.exit(1)});
