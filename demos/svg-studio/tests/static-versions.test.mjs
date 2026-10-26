import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
const root=new URL('../',import.meta.url);
test('HTML versions match deployed CSS and scripts to avoid mixed cached releases',async()=>{
 for(const [page, files] of [['index.html',['style.css','engine.js','svg-safety.js','composition-agent.js','app.js']], ['privacy.html',['style.css']]]) {
 const html=await readFile(new URL(page,root),'utf8');
 for(const file of files) {
  const bytes=await readFile(new URL(file,root));
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  assert.ok(html.includes(`="${file}?v=${hash}"`),`Run python3 tools/sync_static_versions.py after editing ${file}`);
 }
 }
});
