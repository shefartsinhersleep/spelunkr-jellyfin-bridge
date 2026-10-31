// Extract the complete pure scheduling region from the supplied saved bundle.
// Minified symbol names are bundle-specific. Review before using another build.
const fs=require('node:fs'),crypto=require('node:crypto');
const input=process.argv[2]||'../spelunkr-app.js',out=process.argv[3]||'scheduler.cjs';
const raw=fs.readFileSync(input),s=raw.toString('utf8');
const a=s.indexOf('const Ng='),b=s.indexOf('function p0(',a),c=s.indexOf('function z0(',b),d=s.indexOf('function J0(',c);
if([a,b,c,d].some(x=>x<0))throw Error('Unsupported bundle: expected scheduler boundaries missing');
fs.writeFileSync(out,s.slice(a,b)+s.slice(c,d)+';module.exports={on,uo,u0,z0};');
console.log(JSON.stringify({input,sha256:crypto.createHash('sha256').update(raw).digest('hex'),output:out}));
