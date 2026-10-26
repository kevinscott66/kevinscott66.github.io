import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',root),'utf8')+'\n'+await readFile(new URL('composition-agent.js',root),'utf8');
const {LocalCompositionAgent,correctCompositionTypos,oneTypoApart}=await import('data:text/javascript,'+encodeURIComponent(code+';export {LocalCompositionAgent,correctCompositionTypos,oneTypoApart};'));
const lib=JSON.parse(await readFile(new URL('assets/library.json',root),'utf8'));
const agent=new LocalCompositionAgent();
for(const[prompt,ids]of [
 ['два телфона и цвты посеридине',['phone','phone','plant']],
 ['телфон и книгаа',['phone','book']],
 ['лапма и кнгиа',['lamp','book']],
 ['монекта и кошелк',['coin','wallet']],
 ['наушнки и растене',['headphones','plant']],
 ['телефоон спрва',['phone']],
 ['кнгиа слева от телфона',['book','phone']],
 ['лампа и цветы на стлое',['lamp','plant']],
 ['три монеты по диагоанли',['coin','coin','coin']],
 ['книга и лампа, остпвь место для текта справа',['book','lamp']],
 ])test(`typo correction: ${prompt}`,()=>{
 const plan=agent.plan(prompt,lib);assert.equal(plan.question,undefined,prompt);assert.deepEqual(plan.unknown,[],prompt);
 assert.deepEqual(plan.assets.map(a=>a.id),ids);assert.ok(plan.corrections.length>0);
});
test('ambiguous correction asks rather than choosing a command',()=>{
 const p=agent.plan('лампа в центра',lib);assert.ok(p.question);assert.match(p.question,/Уточните слово/);
});
test('unrelated real words, short tokens and numbers are never guessed as objects',()=>{
 for(const word of ['палка','лапка','шапка','маска','рамка','слова','слава','цвета','папа','мама','2','100','дракон']) {
  const result=correctCompositionTypos(word,lib);assert.equal(result.text,word);assert.deepEqual(result.corrections,[]);
 }
});
test('exact imported names keep intentional spellings and built-in names unchanged',()=>{
 const custom={id:'custom',name:'Телфон Центра'};
 const p=agent.plan('Телфон Центра, книга',[...lib,custom]);
 assert.equal(p.question,undefined);assert.deepEqual(p.assets.map(a=>a.id),['custom','book']);assert.deepEqual(p.corrections,[]);
 const exact=agent.plan('книга и лампа',lib);assert.deepEqual(exact.corrections,[]);
});
test('single-edit matcher handles insertion deletion substitution and adjacent swap only',()=>{
 for(const[a,b]of [['телфон','телефон'],['телефоон','телефон'],['лапма','лампа'],['монкта','монета']])assert.equal(oneTypoApart(a,b),true);
 for(const[a,b]of [['abc','uvwxyz'],['аа','аааа'],['тлфн','телефон']])assert.equal(oneTypoApart(a,b),false);
});

test('missing space after a quantity is restored only for a known object',()=>{
 const p=agent.plan('2телефона и цветы',lib);
 assert.equal(p.question,undefined);assert.deepEqual(p.assets.map(a=>a.id),['phone','phone','plant']);
 assert.equal(agent.plan('101телефон',lib).tooMany,true);
 const custom={id:'code-object',name:'Модель2'};
 const exact=agent.plan('Модель2',[...lib,custom]);assert.deepEqual(exact.assets.map(a=>a.id),['code-object']);
});
