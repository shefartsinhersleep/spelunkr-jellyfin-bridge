'use strict';
// The upstream scheduler is generated locally; it is not redistributed here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=__dirname;
const expected='7e5aee341ed30670a39dc51a354d90cee9f6cb1016437e526b79c63306c5b8e8';
async function fetchBytes(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Upstream HTTP ${r.status}`);return Buffer.from(await r.arrayBuffer());}
async function main(){let raw;
 if(process.argv[2])raw=fs.readFileSync(path.resolve(process.argv[2]));
 else {
  const origin='https://spelunkr.tv/';
  const html=(await fetchBytes(origin)).toString('utf8');
  const tags=html.match(/<script\b[^>]*>/gi)||[];
  const tag=tags.find(t=>/type=["']module["']/.test(t)&&/\bsrc=/.test(t));
  const src=tag?.match(/\bsrc=["']([^"']+)["']/)?.[1];
  if(!src)throw Error('Could not locate the upstream module script');
  const url=new URL(src,origin);
  if(url.origin!==new URL(origin).origin)throw Error('Unexpected upstream script origin');
  raw=await fetchBytes(url);
 }
 const hash=crypto.createHash('sha256').update(raw).digest('hex');
 if(hash!==expected)throw Error(`Upstream bundle changed (${hash}). Refusing unreviewed code. Supply the supported saved bundle or update the adapter after review.`);
 const cache=path.join(root,'.cache');fs.mkdirSync(cache,{recursive:true});
 const bundle=path.join(cache,'spelunkr-app.js');fs.writeFileSync(bundle,raw);
 const result=spawnSync(process.execPath,[path.join(root,'extract-scheduler.cjs'),bundle,path.join(root,'scheduler.cjs')],{stdio:'inherit'});
 if(result.status!==0)throw Error('Scheduler extraction failed');
 console.log('Supported scheduler generated locally. Run npm test, then npm start.');
}
main().catch(e=>{console.error(e.message);process.exit(1)});
