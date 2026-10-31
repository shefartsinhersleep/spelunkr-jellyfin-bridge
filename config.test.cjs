const {test}=require('node:test');
const assert=require('node:assert/strict');
const {config}=require('./config.cjs');
test('defaults bind only to loopback and advertise the configured port',()=>{
 assert.deepEqual(config({}),{host:'127.0.0.1',port:8097,publicUrl:'http://127.0.0.1:8097'});
 assert.equal(config({PORT:'18097'}).publicUrl,'http://127.0.0.1:18097');
});
test('LAN binding requires explicit advertised origin',()=>{
 assert.throws(()=>config({HOST:'0.0.0.0'}));
 assert.equal(config({HOST:'0.0.0.0',PUBLIC_URL:'http://bridge.example:8097/'}).publicUrl,'http://bridge.example:8097');
});
test('credentials and secrets cannot be embedded in advertised URLs',()=>{
 for(const PUBLIC_URL of ['http://user:password@bridge.example','http://bridge.example/?token=secret','http://bridge.example/#secret','file:///tmp/example','http://bridge.example/path'])assert.throws(()=>config({PUBLIC_URL}));
});
test('invalid ports fail before opening a listener',()=>{
 for(const PORT of ['0','65536','2.5','invalid'])assert.throws(()=>config({PORT}));
});
