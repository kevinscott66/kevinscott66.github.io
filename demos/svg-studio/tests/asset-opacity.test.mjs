import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
// Frozen signatures of the original supplied paths, excluding the new backing.
const originals = {
  "S-13": {
    "count": 130,
    "sha256": "fd373fbbb4ae2214ee91da2646d67f9e3541a8b87c425d0304ebb5fe7120e227"
  },
  "L-26": {
    "count": 136,
    "sha256": "e1d129c25a6b9cfec8dcdff9d3902fb54ee8a450aab0f8c6cc4e7d06bcec6162"
  },
  "S-22": {
    "count": 136,
    "sha256": "7b2d84dcdccf8f8797420cd8e0b79cf1b428ec8fc291cb876aa84f90f649830b"
  },
  "L-27": {
    "count": 136,
    "sha256": "eb962f204521579768b846cd95b5a107d58a52725b56bf51404f8b3dc2b70d03"
  }
}
;
for(const [name,expected] of Object.entries(originals)) test(`opaque coin ${name} preserves original contours`,async()=>{
 const text=await readFile(new URL(`../assets/${name}.svg`,import.meta.url),'utf8');
 const paths=[...text.matchAll(/<ns0:path\b([^>]*)\/>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
 const backing=paths.filter(p=>p.id==='coin-solid-backing');
 assert.equal(backing.length,1);
 assert.equal(paths[0],backing[0],'backing is beneath every original path');
 assert.equal(backing[0].fill,['S-13','L-26'].includes(name)?'white':'#D7CDF5');
 assert.match(backing[0].d,/C/,'Bezier silhouette remains vector geometry');
 const supplied=paths.filter(p=>p.id!=='coin-solid-backing');
 assert.equal(supplied.length,expected.count);
 assert.equal(createHash('sha256').update(JSON.stringify(supplied)).digest('hex'),expected.sha256);
 assert.ok(!text.includes('<image'),'no raster backing');
});
