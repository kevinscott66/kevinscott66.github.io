import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
test('local demo executes a real worker, requests approval and completes without network',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'agent-demo-check-'));
 const bus=new EventTarget();globalThis.window=bus;
 globalThis.Worker=class{constructor(url){this.ready=fetch(url).then(r=>r.text()).then(code=>{this.worker=new NodeWorker(`const {parentPort}=require('node:worker_threads');global.postMessage=data=>parentPort.postMessage(data);${code}`,{eval:true});this.worker.on('message',data=>this.onmessage?.({data}));});}terminate(){this.ready.then(()=>this.worker.terminate());}};
 try{
 await build({entryPoints:[new URL('../agent-demo/src/lib/demo-engine.ts',import.meta.url).pathname],outfile:path.join(temp,'engine.mjs'),bundle:true,platform:'node',format:'esm'});
 const {demoRequest:req}=await import('file://'+path.join(temp,'engine.mjs'));
 assert.equal((await req('/api/autonomy')).admin,true);
 let approvals=[];const deadline=Date.now()+14000;
 while(!approvals.length&&Date.now()<deadline){await new Promise(r=>setTimeout(r,100));approvals=(await req('/api/approvals?status=pending')).approvals;}
 assert.equal(approvals.length,1,'worker must produce an approval');
 const t=(await req('/api/tasks')).tasks.find(t=>t.id===approvals[0].payload.task_id);
 assert.equal(t.output.progress,100);assert.ok(t.output.checksum>0);assert.equal(t.status,'awaiting_approval');
 await req(`/api/approvals/${approvals[0].id}/decide`,{method:'POST',body:JSON.stringify({decision:'approved'})});
 assert.equal((await req('/api/tasks/'+t.id)).task.status,'done');
 await assert.rejects(req(`/api/tasks/${t.id}/status`,{method:'POST',body:JSON.stringify({status:'running'})}),/переход/);
 await assert.rejects(req('/api/mac/stop',{method:'POST'}),/не входит/);
 }finally{delete globalThis.window;delete globalThis.Worker;await rm(temp,{recursive:true,force:true});}
});
