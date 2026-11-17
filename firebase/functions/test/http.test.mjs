import test from 'node:test';
import assert from 'node:assert/strict';
import {gvcnApi} from '../index.mjs';

const origin='https://gvcnva2.netlify.app';
function configure(t,overrides={}) {
  const values={MICROSOFT_TENANT_ID:'11111111-1111-1111-1111-111111111111',
    MICROSOFT_CLIENT_ID:'22222222-2222-2222-2222-222222222222',GVCN_ALLOWED_ORIGINS:origin,...overrides};
  const old=Object.fromEntries(Object.keys(values).map(k=>[k,process.env[k]]));
  for(const [k,v] of Object.entries(values)) if(v===undefined) delete process.env[k];else process.env[k]=v;
  t.after(()=>{for(const [k,v] of Object.entries(old)) if(v===undefined) delete process.env[k];else process.env[k]=v;});
}
async function request({method='GET',path='/bootstrap',requestOrigin=origin,authorization}={}) {
  const headers={...(requestOrigin?{origin:requestOrigin}:{}),...(authorization?{authorization}:{})};
  const req={method,path,headers,rawBody:Buffer.alloc(0),body:{role:'admin'},
    get(name){return headers[name.toLowerCase()];},header(name){return headers[name.toLowerCase()];}};
  const result={status:200,headers:{},body:undefined};
  const res={set(name,value){result.headers[name.toLowerCase()]=value;return this;},
    status(code){result.status=code;return this;},json(body){result.body=body;return this;},end(){return this;}};
  await gvcnApi(req,res);return result;
}
test('Netlify browser preflight allows Authorization and returns 204',async t=>{
  configure(t);const r=await request({method:'OPTIONS'});
  assert.equal(r.status,204);assert.equal(r.headers['access-control-allow-origin'],origin);
  assert(r.headers['access-control-allow-headers'].includes('Authorization'));
});
test('unknown origin is denied without allowing the browser to read the response',async t=>{
  configure(t);const r=await request({method:'OPTIONS',requestOrigin:'https://untrusted.example'});
  assert.equal(r.status,403);assert.equal(r.headers['access-control-allow-origin'],undefined);
});
test('bootstrap remains authenticated even if request body claims Admin',async t=>{
  configure(t);const r=await request();assert.equal(r.status,401);assert.equal(r.headers['access-control-allow-origin'],origin);
  assert(r.body.error.includes('Microsoft'));
});
test('health reports readiness without revealing Microsoft IDs or accessing class records',async t=>{
  configure(t);const r=await request({path:'/health'});assert.equal(r.status,200);assert.equal(r.body.configured,true);
  assert.equal(r.body.service,'vietanh-gvcn-api');assert(!JSON.stringify(r.body).includes('11111111'));
  assert(!Object.hasOwn(r.body,'classes'));
});
test('health returns 503 when Microsoft deployment configuration is missing',async t=>{
  configure(t,{MICROSOFT_TENANT_ID:undefined});const r=await request({path:'/health'});
  assert.equal(r.status,503);assert.equal(r.body.microsoftConfigured,false);assert.equal(r.body.configured,false);
});
