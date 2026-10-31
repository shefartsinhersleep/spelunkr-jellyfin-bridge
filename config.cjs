'use strict';
function config(env=process.env) {
  const port=Number(env.PORT||8097);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be an integer between 1 and 65535');
  const host=env.HOST||'127.0.0.1';
  if(host!=='127.0.0.1'&&host!=='localhost'&&host!=='::1'&&!env.PUBLIC_URL)throw Error('Set PUBLIC_URL explicitly when binding beyond loopback');
  const url=new URL(env.PUBLIC_URL||`http://127.0.0.1:${port}`);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('PUBLIC_URL must be an HTTP(S) origin without credentials, path, query, or fragment');
  return {port,host,publicUrl:url.origin};
}
module.exports={config};
