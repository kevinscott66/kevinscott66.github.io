import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',root),'utf8')+'\n'+await readFile(new URL('composition-agent.js',root),'utf8');
const {LocalCompositionAgent,compositionPositions}=await import('data:text/javascript,'+encodeURIComponent(code+';export {LocalCompositionAgent,compositionPositions};'));
const lib=JSON.parse(await readFile(new URL('assets/library.json',root),'utf8'));
const {cases}=JSON.parse(await readFile(new URL('examples/web-inspired-cases.json',root),'utf8'));
for(const example of cases)test(`web-inspired composition: ${example.prompt}`,()=>{
 const plan=new LocalCompositionAgent().plan(example.prompt,lib);
 if(example.question){assert.ok(plan.question);return;}
 assert.equal(plan.question,undefined);assert.deepEqual(plan.unknown,[]);
 if(example.mode)assert.equal(plan.arrangement.mode,example.mode);
 if(example.emptySide)assert.equal(plan.arrangement.emptySide,example.emptySide);
 for(const [w,h]of [[800,600],[1200,800],[600,600]]){
  const p=compositionPositions(plan.assets.length,w,h,plan.layout,plan.surface,plan.arrangement);
  assert.equal(new Set(p.map(p=>`${p.x},${p.y}`)).size,p.length);
  assert.ok(p.every(p=>Object.values(p).every(Number.isFinite)&&p.x>0&&p.x<w&&p.y>0&&p.y<h));
  if(['row','symmetric'].includes(example.mode))assert.ok(p.every(p=>p.y===h*.5&&p.rotation===0));
  if(example.mode==='symmetric')assert.ok(Math.abs(p[0].x+p.at(-1).x-w)<1e-8);
  if(example.mode==='column')assert.ok(p.every(p=>p.x===w*.5&&p.rotation===0));
  if(example.mode==='thirds')assert.ok(p.every(p=>[w/3,w*2/3].some(x=>Math.abs(x-p.x)<1e-8)));
  if(example.emptySide==='right')assert.ok(p.every(p=>p.x+120*p.scale<w/2));
  if(example.emptySide==='left')assert.ok(p.every(p=>p.x-120*p.scale>w/2));
 }
});
