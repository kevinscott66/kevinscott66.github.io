import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',root),'utf8')+'\n'+await readFile(new URL('composition-agent.js',root),'utf8');
const {LocalCompositionAgent,compositionPositions}=await import('data:text/javascript,'+encodeURIComponent(code+';export {LocalCompositionAgent,compositionPositions};'));
const lib=JSON.parse(await readFile(new URL('assets/library.json',root),'utf8'));
const agent=new LocalCompositionAgent();
const positions=(prompt,w=800,h=600)=>{
 const plan=agent.plan(prompt,lib);assert.equal(plan.question,undefined,prompt);assert.deepEqual(plan.unknown,[],prompt);
 return {plan,p:compositionPositions(plan.assets.length,w,h,plan.layout,plan.surface,plan.arrangement)};
};
test('270 pairs support beside, above and below synonyms',()=>{
 let count=0;
 for(const a of lib)for(const b of lib.filter(b=>b.id!==a.id))for(const relation of ['над','под','рядом с']){
  const prompt=`${a.name} ${relation} ${b.name}`;const{p}=positions(prompt);
  if(relation==='над')assert.ok(p[0].y<p[1].y,prompt);
  if(relation==='под')assert.ok(p[0].y>p[1].y,prompt);
  if(relation==='рядом с'){assert.equal(p[0].y,p[1].y);assert.ok(p[0].x+120*p[0].scale<p[1].x-120*p[1].scale);}
  count++;
 }
 assert.equal(count,270);
});
test('180 side-and-centre combinations create two flanking copies',()=>{
 let count=0;
 for(const a of lib)for(const b of lib.filter(b=>b.id!==a.id))for(const phrase of ['по бокам','по краям']){
  const prompt=`два ${a.name} ${phrase} и ${b.name} в центре`;
  const{plan,p}=positions(prompt);
  assert.deepEqual(plan.assets.map(a=>a.id),[a.id,a.id,b.id]);
  assert.ok(p[0].x<p[2].x&&p[2].x<p[1].x,prompt);count++;
 }
 assert.equal(count,180);
 const{plan}=positions('телефоны по бокам и цветы в центре');
 assert.deepEqual(plan.assets.map(a=>a.id),['phone','phone','plant']);
 for(const prompt of ['телефон по бокам','три телефона по краям'])assert.ok(agent.plan(prompt,lib).question);
});
test('240 circle/diagonal quantity and canvas combinations stay finite and in bounds',()=>{
 let checked=0;
 for(const asset of lib)for(const n of [2,3,4,6])for(const mode of ['по кругу','кольцом','по диагонали'])
 for(const[w,h]of [[800,600],[1200,800]]){
  const{plan,p}=positions(`${n} ${asset.name} ${mode}`,w,h);
  assert.equal(plan.assets.length,n);assert.equal(new Set(p.map(o=>`${o.x},${o.y}`)).size,n);
  assert.ok(p.every(o=>Object.values(o).every(Number.isFinite)&&o.x>0&&o.x<w&&o.y>0&&o.y<h&&o.scale>=.2));
  if(mode==='по диагонали')for(let i=1;i<n;i++){assert.ok(p[i].x>p[i-1].x);assert.ok(p[i].y>p[i-1].y);}
  checked++;
 }
 assert.equal(checked,240);
});
