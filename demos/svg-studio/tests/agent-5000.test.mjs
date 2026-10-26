import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',root),'utf8')+'\n'+await readFile(new URL('composition-agent.js',root),'utf8');
const {LocalCompositionAgent,compositionPositions}=await import('data:text/javascript,'+encodeURIComponent(code+';export {LocalCompositionAgent,compositionPositions};'));
const lib=JSON.parse(await readFile(new URL('assets/library.json',root),'utf8'));
const agent=new LocalCompositionAgent();
const addedCases=new Set();
function verify(prompt,catalogue=lib) {
 assert.ok(!addedCases.has(prompt),`duplicate new prompt: ${prompt}`);addedCases.add(prompt);
 const plan=agent.plan(prompt,catalogue);assert.equal(plan.question,undefined,prompt);assert.deepEqual(plan.unknown,[],prompt);
 return plan;
}
const directions=[['слева','x',.2],['справа','x',.8],['сверху','y',.25],['снизу','y',.75],['по центру','x',.5]];
const customNames=['Красная звезда','Синий куб','Зелёный шар','Белый треугольник','Жёлтый дом','Серая башня','Чёрный кот','Розовый конверт','Серебряный ключ','Золотой компас','Красная книга','Синий телефон','Зелёная лампа','Белая папка','Жёлтая ручка','Серый кошелёк','Чёрная монета','Розовое растение','Серебряные наушники','Золотые пазлы'];

test('1000 imported-name combinations preserve whole names, counts and directional scope',()=>{
 let checked=0;
 for(const[nameIndex,name]of customNames.entries())for(const n of [1,2,3,4,5])for(const[direction,axis,value]of directions)for(const prefix of [false,true]){
  const asset={id:`custom-${nameIndex}`,name};
  const prompt=prefix?`${direction} ${n} ${name}`:`${n} ${name} ${direction}`;
  const plan=verify(prompt,[...lib,asset]);assert.deepEqual(plan.assets.map(a=>a.id),Array(n).fill(asset.id),prompt);
  assert.ok(plan.layout.every(d=>d[axis]===value),prompt);assert.deepEqual(plan.corrections,[]);checked++;
 }
 assert.equal(checked,1000);
});
test('250 polite command combinations do not become unknown object names',()=>{
 let checked=0;
 for(const a of lib)for(const n of [4,5,6,7,8])for(const command of ['Сделай','Добавь','Размести','Поставь','Собери']){
  const prompt=`${command}, ${n} ${a.name}`;const p=verify(prompt);
  assert.deepEqual(p.assets.map(x=>x.id),Array(n).fill(a.id),prompt);checked++;
 }
 assert.equal(checked,250);
});
test('300 whitespace-layout combinations actually keep text half free of object bounds',()=>{
 let checked=0;
 for(const a of lib)for(const n of [1,2,3])for(const mode of ['в ряд','в столбик','сеткой','симметрично','по кругу'])for(const side of ['справа','слева']){
  const prompt=`${n} ${a.name} ${mode}, оставь место для текста ${side}`;const plan=verify(prompt);
  assert.deepEqual(plan.assets.map(x=>x.id),Array(n).fill(a.id));
  for(const[w,h]of [[800,600],[1200,800],[600,600]]){
   const p=compositionPositions(n,w,h,plan.layout,plan.surface,plan.arrangement);
   assert.ok(p.every(o=>Object.values(o).every(Number.isFinite)),prompt);
   assert.ok(p.every(o=>side==='справа'?o.x+120*o.scale<w/2:o.x-120*o.scale>w/2),prompt);
  }
  checked++;
 }
 assert.equal(checked,300);
});
test('150 theme-and-exclusion combinations preserve scene meaning without forbidden objects',()=>{
 const scenes=[['рабочее место',['lamp','book','plant']],['рост знаний',['book','plant','lamp']],['финансы',['coin','wallet','plant']],['музыка и отдых',['headphones','plant']],['новые идеи',['lamp','pen','puzzle']]];
 let checked=0;
 for(const a of lib)for(const[scene,expected]of scenes)for(const exclude of [`без ${a.name}`,`не добавляй ${a.name}`,`без одного ${a.name}`]){
  const prompt=`${scene} ${exclude}`;const p=verify(prompt);
  assert.deepEqual(p.assets.map(x=>x.id),expected.filter(id=>id!==a.id),prompt);checked++;
 }
 assert.equal(checked,150);
});
test('exactly 1700 distinct new prompts extend the prior 3300 cases to 5000',()=>{
 assert.equal(addedCases.size,1700);
});
