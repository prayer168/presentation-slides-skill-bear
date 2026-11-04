import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
test('local bridge rejects foreign origin and invalid requests, and reports spawn failure',async()=>{
 const port=4329,origin=`http://127.0.0.1:${port}`;
 const output=await mkdtemp(path.join(os.tmpdir(),'bear-bridge-test-'));
 const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/studio-server.mjs',import.meta.url))],{env:{...process.env,BEAR_PORT:String(port),BEAR_OUTPUT_DIR:output,CODEX_BIN:path.join(output,'missing-codex.exe')},windowsHide:true});
 try{
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server startup timeout')),10000);child.stdout.once('data',()=>{clearTimeout(t);resolve()});child.once('error',reject)});
  const session=await fetch(origin+'/api/session').then(r=>r.json());assert(session.token);assert.equal(session.approvalMode,'auto-review');
  assert.equal((await fetch(origin+'/api/session',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal((await fetch(origin+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  const headers={'Content-Type':'application/json','X-Bear-Token':session.token};
  assert.equal((await fetch(origin+'/api/jobs',{method:'POST',headers,body:'{}'})).status,400);
  assert.equal((await fetch(origin+'/ui/%2e%2e/%2e%2e/package.json')).status,404);
  assert.equal((await fetch(origin+'/ui/%2e%2e%2fpackage.json')).status,403);
  const request={format:'html',purpose:'一般分享',audience:'一般大眾',subject:'語文',topic:'讀書分享',goal:'比較兩個觀點',style:'minimal',density:'speaker',interaction:'none',notes:'',materials:'',pages:1,minutes:3};
  const submitted=await fetch(origin+'/api/jobs',{method:'POST',headers,body:JSON.stringify(request)});assert.equal(submitted.status,202);const {id}=await submitted.json();
  let job;for(let i=0;i<30;i++){job=await fetch(origin+'/api/jobs/'+id,{headers}).then(r=>r.json());if(job.status!=='running')break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(job.status,'failed');assert(job.error.includes('無法啟動'));assert(job.files.includes('bear-request.json'));assert(!job.files.includes('stderr.log'));
  const download=await fetch(origin+'/api/jobs/'+id+'/files/bear-request.json',{headers});assert.equal(download.status,200);assert.equal((await download.json()).topic,'讀書分享');
 }finally{child.kill();}
});
