import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const base=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',base),'utf8');
const {planComposition,compositionPositions}=await import('data:text/javascript,'+encodeURIComponent(code+';export {planComposition,compositionPositions};'));
const lib=JSON.parse(await readFile(new URL('assets/library.json',base),'utf8'));
const ids=p=>planComposition(p,lib).assets.map(a=>a.id);
test('explicit five-item list keeps every requested object in input order without decoration',()=>{
 assert.deepEqual(ids('Книга, телефон, пазлы, монета, наушники'),['book','phone','puzzle','coin','headphones']);
 assert.deepEqual(ids('Наушники и книга'),['headphones','book']);
});
test('all catalogue objects fit and repeated names do not add unrequested copies',()=>{
 assert.equal(ids(lib.map(a=>a.name).join(', ')).length,10);
 assert.deepEqual(ids('Книга, книга, кошельки'),['book','wallet']);
 for(const n of [1,2,3,5,10,81,100]) for(const [w,h] of [[800,600],[1200,800],[600,600]]) {
  const p=compositionPositions(n,w,h);assert.equal(p.length,n);
  assert.equal(new Set(p.map(o=>`${o.x},${o.y}`)).size,n);
  assert.ok(p.every(o=>o.x>0&&o.x<w&&o.y>0&&o.y<h&&o.scale>=.2&&o.scale<=3));
 }
});
test('unavailable explicit component is reported instead of silently dropped',()=>{
 const p=planComposition('Книга, дракон, телефон',lib);
 assert.deepEqual(p.unknown,['дракон']);
});
test('meaning scenarios select only existing relevant objects',()=>{
 for(const [prompt,wanted] of [
  ['Преодолеть преграды на пути к мечте','puzzle'],
  ['Вместе решаем сложные задачи','puzzle'],
  ['Сбережения на будущее','coin'],
  ['Навести порядок в делах','folder'],
  ['Вдохновение для новых открытий','lamp'],
  ['Перезагрузка после рабочего дня','headphones'],
  ['Учиться и открывать новое','book'],
 ]) {const result=planComposition(prompt,lib);assert.equal(result.mode,'meaning');assert.ok(result.assets.some(a=>a.id===wanted),prompt);assert.ok(result.assets.every(a=>lib.includes(a)));}
 for(const prompt of ['', 'zxqv123', 'непонятная абракадабра'])assert.deepEqual(ids(prompt),[]);
});

test('explicit list recognizes common instrumental and prepositional forms', () => {
 assert.deepEqual(ids('книгами, телефонами, пазлом, монетами, наушниках, лампе, растениями, папками, ручками, кошельке'),
  ['book','phone','puzzle','coin','headphones','lamp','plant','folder','pen','wallet']);
});

test('imported multiword names match as complete phrases in input order', () => {
 const imported = {id:'custom-1', name:'Красная звезда'};
 const catalogue = [...lib, imported];
 const plan = planComposition('Красная звезда, телефон, книга', catalogue);
 assert.deepEqual(plan.assets.map(a=>a.id), ['custom-1','phone','book']);
 assert.deepEqual(plan.unknown, []);
 assert.deepEqual(planComposition('Красная, телефон', catalogue).assets.map(a=>a.id), ['phone']);
 assert.deepEqual(planComposition('Красная, телефон', catalogue).unknown, ['красная']);
});

test('conjunction within an imported name is not an unknown list item', () => {
 const imported = {id:'custom-2', name:'Солнце и луна'};
 const catalogue = [...lib, imported];
 const plan = planComposition('Книга и Солнце и луна и дракон', catalogue);
 assert.deepEqual(plan.assets.map(a=>a.id), ['book','custom-2']);
 assert.deepEqual(plan.unknown, ['дракон']);
});

test('unknown entries survive mixed separators and repeated names without library mutation', () => {
 const original = JSON.stringify(lib);
 const plan = planComposition('Кошелёк; ДРАКОН\nкнига и ракета, кошелёк', lib);
 assert.deepEqual(plan.assets.map(a=>a.id), ['wallet','book']);
 assert.deepEqual(plan.unknown, ['дракон','ракета']);
 assert.equal(JSON.stringify(lib), original);
});

test('complete imported names do not also select built-in words within them', () => {
 const imported = {id:'custom-book', name:'Красная книга'};
 const catalogue = [...lib, imported];
 const plan = planComposition('Красная книга, телефон', catalogue);
 assert.deepEqual(plan.assets.map(a=>a.id), ['custom-book','phone']);
 assert.deepEqual(plan.unknown, []);
 assert.deepEqual(planComposition('Красная книга и книга', catalogue).assets.map(a=>a.id),
  ['custom-book','book']);
});

test('longest imported name owns a conjunction and nested catalogue names', () => {
 const short = {id:'custom-short', name:'Книга и телефон'};
 const long = {id:'custom-long', name:'Книга и телефон вместе'};
 const catalogue = [...lib, short, long];
 const plan = planComposition('Книга и телефон вместе и дракон, монета', catalogue);
 assert.deepEqual(plan.assets.map(a=>a.id), ['custom-long','coin']);
 assert.deepEqual(plan.unknown, ['дракон']);
});

test('quantities accept digits, Russian numbers and flower synonyms', () => {
 for (const prompt of ['2 телефона и цветы по середине', 'два телефона и букет посередине', 'пара телефонов и тюльпаны в центре']) {
  const plan=planComposition(prompt,lib);
  assert.deepEqual(plan.assets.map(a=>a.id),['phone','phone','plant']);
  assert.deepEqual(plan.unknown,[]);
  assert.deepEqual(plan.layout[2],{x:.5,y:.5});
  const positions=compositionPositions(3,800,600,plan.layout);
  assert.equal(positions[2].x,400);assert.equal(positions[2].y,300);
  assert.equal(new Set(positions.map(p=>p.x)).size,3);
 }
 assert.deepEqual(ids('три книги, две лампы и один кошелёк'),['book','book','book','lamp','lamp','wallet']);
 assert.deepEqual(ids('10 монет'),Array(10).fill('coin'));
});
test('positional instructions apply to their noun rather than its neighbour',()=>{
 const plan=planComposition('книга слева, телефон справа и цветы в центре',lib);
 const positions=compositionPositions(3,1200,800,plan.layout);
 assert.equal(positions[0].x,240);assert.equal(positions[1].x,960);
 assert.equal(positions[2].x,600);assert.equal(positions[2].y,400);
 const vertical=planComposition('лампа сверху и монета снизу',lib);
 const p=compositionPositions(2,600,600,vertical.layout);
 assert.equal(p[0].y,150);assert.equal(p[1].y,450);
});
test('negated objects and zero counts do not appear, limits are checked before expansion',()=>{
 assert.deepEqual(ids('два телефона и без цветов'),['phone','phone']);
 assert.deepEqual(ids('книга, не телефон'),['book']);
 assert.deepEqual(ids('0 монет и лампа'),['lamp']);
 for(const prompt of ['101 телефон','999999999999999999999 телефон','100 телефонов и книга']) {
  const plan=planComposition(prompt,lib);assert.equal(plan.tooMany,true);assert.ok(plan.assets.length<=100);
 }
 assert.deepEqual(planComposition('два телефона и дракон',lib).unknown,['дракон']);
});
test('several objects in one requested region are separated and remain in bounds',()=>{
 for(const [w,h] of [[800,600],[1200,800],[600,600]]) {
  const plan=planComposition('четыре монеты в центре',lib);
  const positions=compositionPositions(plan.assets.length,w,h,plan.layout);
  assert.equal(new Set(positions.map(p=>`${p.x},${p.y}`)).size,4);
  assert.ok(positions.every(p=>p.x>0&&p.x<w&&p.y>0&&p.y<h&&p.scale>=.2));
 }
});

test('desk context uses the background as a surface without adding artwork',()=>{
 const scene=planComposition('За столом',lib);
 assert.deepEqual(scene.assets.map(a=>a.id),['lamp','book','plant']);
 assert.equal(scene.surface,'table');
 const explicit=planComposition('лампа и цветы на столе',lib);
 assert.deepEqual(explicit.assets.map(a=>a.id),['lamp','plant']);
 assert.equal(explicit.surface,'table');
 const positions=compositionPositions(explicit.assets.length,800,600,explicit.layout,explicit.surface);
 assert.equal(positions[0].y,positions[1].y);
 assert.ok(positions.every(p=>p.rotation===0));
 assert.deepEqual(planComposition('Чтение вечером',lib).assets.map(a=>a.id),['book','lamp','plant']);
});


test('table surface keeps explicit centre instruction and respects all canvas sizes',()=>{
 const plan=planComposition('два телефона и цветы по середине на рабочем столе',lib);
 assert.equal(plan.surface,'table');
 for(const [w,h] of [[800,600],[1200,800],[600,600]]) {
  const positions=compositionPositions(plan.assets.length,w,h,plan.layout,plan.surface);
  assert.equal(positions[2].x,w/2);assert.equal(positions[2].y,h/2);
  assert.ok(positions.every(p=>p.rotation===0));
  assert.equal(new Set(positions.map(p=>`${p.x},${p.y}`)).size,3);
 }
});
