import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const code=await readFile(new URL('engine.js',root),'utf8')+'\n'+await readFile(new URL('composition-agent.js',root),'utf8');
const {LocalCompositionAgent,compositionPositions}=await import('data:text/javascript,'+encodeURIComponent(code+';export {LocalCompositionAgent,compositionPositions};'));
const library=JSON.parse(await readFile(new URL('assets/library.json',root),'utf8'));
const cases=JSON.parse(await readFile(new URL('examples/agent-cases.json',root),'utf8'));
for(const example of cases) test(`local agent: ${example.prompt}`,()=>{
 const plan=new LocalCompositionAgent().plan(example.prompt,library);
 if(example.question){assert.ok(plan.question);return;}
 assert.equal(plan.question,undefined);
 const ids=plan.assets.map(a=>a.id);
 if(example.ids)assert.deepEqual(ids,example.ids);
 if(example.contains)assert.ok(ids.includes(example.contains));
 if(example.count)assert.equal(ids.length,example.count);
 if(example.surface)assert.equal(plan.surface,example.surface);
 if(example.tooMany)assert.equal(plan.tooMany,true);
 if(example.unknown)assert.deepEqual(plan.unknown,example.unknown);
 const p=compositionPositions(ids.length,800,600,plan.layout,plan.surface);
 if(example.xOrder)assert.ok(p[example.xOrder[0]].x<p[example.xOrder[1]].x);
 if(example.yOrder)assert.ok(p[example.yOrder[0]].y<p[example.yOrder[1]].y);
 if(example.between){const[a,b,c]=example.between;assert.ok(p[b].x<p[a].x&&p[a].x<p[c].x);}
});
test('agent rejects oversized/invalid input and never evaluates prompt text',()=>{
 const agent=new LocalCompositionAgent();
 for(const value of [null,{},'a'.repeat(2001)])assert.ok(agent.plan(value,library).question);
 const before=JSON.stringify(library);
 assert.ok(agent.plan('<script>alert(1)</script>',library).question);
 assert.equal(JSON.stringify(library),before);
});
