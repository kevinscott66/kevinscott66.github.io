import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
// Frozen signatures of the original supplied paths, excluding the new backing.
const originals = {
  "S-13": {
    "count": 130,
    "sha256": "0cb330c6750cd71685039c995e30878c0b65f4558f20550f5496428bad5838f7"
  },
  "S-22": {
    "count": 136,
    "sha256": "d2aaf7fb78d962222ab7f72c4e4ad0536dafddec91617ae960fa8126e76d7edf"
  },
  "L-26": {
    "count": 136,
    "sha256": "de9a2bf25bebd4d6e28604da0ebdfbd2f01c5fba70a5ece62e9cc2c9409bf4d5"
  },
  "L-27": {
    "count": 136,
    "sha256": "eca7c9fc4b94fb29cb8e812000879107290a023befc8b4fb0e482f8f3dd9656c"
  }
};
for(const [name,expected] of Object.entries(originals)) test(`opaque coin ${name} preserves original contours`,async()=>{
 const text=await readFile(new URL(`../assets/${name}.svg`,import.meta.url),'utf8');
 const paths=[...text.matchAll(/<ns0:path\b([^>]*)\/>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
 const backing=paths.filter(p=>p.id==='coin-solid-backing');
 assert.equal(backing.length,1);
 assert.ok(text.indexOf('id="coin-cast-shadow"')<text.indexOf('id="coin-solid-backing"'),'floor shadow is behind the solid side');
 assert.equal((text.match(/opacity="0.24"/g)||[]).length,1,'one opacity group avoids dark seams');
 assert.equal(backing[0].fill,['S-13','L-26'].includes(name)?'white':'#D7CDF5');
 assert.match(backing[0].d,/C/,'Bezier silhouette remains vector geometry');
 const supplied=paths.filter(p=>p.id!=='coin-solid-backing').sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 assert.equal(supplied.length,expected.count);
 assert.equal(createHash('sha256').update(JSON.stringify(supplied)).digest('hex'),expected.sha256);
 assert.ok(!text.includes('<image'),'no raster backing');
});
