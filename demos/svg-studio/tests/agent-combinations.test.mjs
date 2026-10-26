import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',root),'utf8')+'\n'+await readFile(new URL('composition-agent.js',root),'utf8');
const {LocalCompositionAgent,compositionPositions}=await import('data:text/javascript,'+encodeURIComponent(code+';export {LocalCompositionAgent,compositionPositions};'));
const lib=JSON.parse(await readFile(new URL('assets/library.json',root),'utf8'));
const agent=new LocalCompositionAgent();
const directions=[['слева','x',.2],['справа','x',.8],['сверху','y',.25],['снизу','y',.75],['по центру','x',.5]];
const counts=[['1',1],['2',2],['три',3]];
const validate=(prompt)=>{const p=agent.plan(prompt,lib);assert.equal(p.question,undefined,prompt);assert.deepEqual(p.unknown,[],prompt);return p;};
test('900 quantity/position/case combinations resolve before and after the noun',()=>{
 let checked=0;
 for(const a of lib)for(const[count,n]of counts)for(const[direction,axis,value]of directions)
 for(const prefix of [true,false])for(const decorate of [s=>s,s=>s.toUpperCase(),s=>'Пожалуйста, '+s+'!']) {
  const prompt=decorate(prefix?`${direction} ${count} ${a.name}`:`${count} ${a.name} ${direction}`);
  const p=validate(prompt);assert.deepEqual(p.assets.map(x=>x.id),Array(n).fill(a.id),prompt);
  assert.ok(p.layout.every(d=>d[axis]===value),prompt);checked++;
 }
 assert.equal(checked,900);
});
test('1080 pairs keep counts and positional clauses separated across punctuation',()=>{
 let checked=0;
 for(const a of lib)for(const b of lib.filter(b=>b.id!==a.id))for(const separator of [', ','; ',' и ','\n'])
 for(const[nword,n]of counts) {
  const prompt=`${nword} ${a.name} слева${separator}${b.name} справа`;
  const p=validate(prompt);assert.deepEqual(p.assets.map(x=>x.id),[...Array(n).fill(a.id),b.id],prompt);
  assert.ok(p.layout.slice(0,n).every(d=>d.x===.2),prompt);assert.equal(p.layout[n].x,.8,prompt);checked++;
 }
 assert.equal(checked,1080);
});
test('360 relative-direction pairs preserve the requested relation',()=>{
 let checked=0;
 for(const a of lib)for(const b of lib.filter(b=>b.id!==a.id))
 for(const[relation,axis,sign]of [['слева от','x',-1],['справа от','x',1],['выше','y',-1],['ниже','y',1]]) {
  const prompt=`${a.name} ${relation} ${b.name}`;const p=validate(prompt);
  const pos=compositionPositions(p.assets.length,800,600,p.layout,p.surface);
  assert.ok((pos[0][axis]-pos[1][axis])*sign>0,prompt);checked++;
 }
 assert.equal(checked,360);
});
test('90 between combinations keep a distinct middle item between two copies',()=>{
 let checked=0;
 for(const a of lib)for(const b of lib.filter(b=>b.id!==a.id)) {
  const prompt=`${a.name} между двумя ${b.name}`;const p=validate(prompt);
  assert.deepEqual(p.assets.map(x=>x.id),[a.id,b.id,b.id],prompt);
  const pos=compositionPositions(3,800,600,p.layout,p.surface);
  assert.ok(pos[1].x<pos[0].x&&pos[0].x<pos[2].x,prompt);checked++;
 }
 assert.equal(checked,90);
});

test('180 positive/excluded pairs do not add an explicitly forbidden item',()=>{
 let checked=0;
 for(const a of lib)for(const b of lib.filter(b=>b.id!==a.id))for(const separator of [' без ', ', без ']) {
  const prompt=a.name+separator+b.name;const p=validate(prompt);
  assert.deepEqual(p.assets.map(x=>x.id),[a.id],prompt);checked++;
 }
 assert.equal(checked,180);
});
test('natural inflections and invalid counts have explicit outcomes',()=>{
 const fixtures=[
 ['Две книги и три монеты',['book','book','coin','coin','coin']],
 ['Поставь два телефона справа и букет слева',['phone','phone','plant']],
 ['Собери, пожалуйста, лампу и растение',['lamp','plant']],
 ['Книгу слева, телефон справа, цветок по центру',['book','phone','plant']],
 ['Двенадцать монет',Array(12).fill('coin')],
 ['Четыре ручки, пять папок',[...Array(4).fill('pen'),...Array(5).fill('folder')]],
 ['на столе лампа и цветы',['lamp','plant']],
 ['Папка и ручка на письменном столе',['folder','pen']],
 ];
 for(const [prompt,ids]of fixtures)assert.deepEqual(validate(prompt).assets.map(a=>a.id),ids,prompt);
 for(const prompt of ['-2 телефона','1.5 телефона','2,5 книги','несколько ламп','много монет'])
  assert.ok(agent.plan(prompt,lib).question,prompt);
});
test('plans stay finite and bounded for generated noise and maximum allowed quantity',()=>{
 const snapshots=JSON.stringify(lib);
 const inputs=['','!'.repeat(2000),'<script>fetch("/x")</script>','телефон '.repeat(200),'100 монет в центре','100 монет справа', '0 телефонов'];
 for(const prompt of inputs) {
  const p=agent.plan(prompt,lib);assert.ok(p.assets.length<=100);
  if(p.question||p.tooMany||p.unknown.length||!p.assets.length)continue;
  for(const [w,h]of [[800,600],[1200,800],[600,600]]){
   const positions=compositionPositions(p.assets.length,w,h,p.layout,p.surface);
   assert.ok(positions.every(o=>Object.values(o).every(Number.isFinite)&&o.x>0&&o.x<w&&o.y>0&&o.y<h&&o.scale>=.2));
  }
 }
 assert.equal(JSON.stringify(lib),snapshots);
});
