import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_KEYS,cameraPose,damp,progressFromTops} from '../src/camera-path.js';
test('the scroll path has finite poses and reverses without history',()=>{
 for(let p=0;p<=4;p+=.002){const a=cameraPose(p),b=cameraPose(p);assert.deepEqual(a,b);assert.ok([...a.position,...a.look].every(Number.isFinite));}
 const forward=Array.from({length:401},(_,i)=>cameraPose(i/100));const backward=Array.from({length:401},(_,i)=>cameraPose((400-i)/100)).reverse();assert.deepEqual(forward,backward);
});
test('position and tangent remain continuous at every chapter/control boundary',()=>{
 for(const k of CAMERA_KEYS.slice(1,-1)){
  const e=1e-5,a=cameraPose(k.at-e),b=cameraPose(k.at),c=cameraPose(k.at+e);
  for(const field of ['position','look'])for(let n=0;n<3;n++){
   assert.ok(Math.abs(a[field][n]-c[field][n])<.002);
   assert.ok(Math.abs((b[field][n]-a[field][n])/e-(c[field][n]-b[field][n])/e)<.04);
  }
 }
});
test('the camera holds still while visitors read each product',()=>{
 for(const [a,b] of [[.95,1.23],[1.98,2.23],[2.98,3.65]])assert.deepEqual(cameraPose(a),cameraPose((a+b)/2));
});
test('smoothing has equal response at 30,60 and120Hz',()=>{
 const result=hz=>{let p=0;for(let i=0;i<hz;i++)p=damp(p,3,1/hz);return p;};assert.ok(Math.abs(result(30)-result(120))<1e-9);assert.ok(Math.abs(result(60)-result(120))<1e-9);
});
test('scroll progress follows actual section dimensions, including taller mobile chapters',()=>{
 assert.equal(progressFromTops([0,900,2120,3340,4560]),0);assert.equal(progressFromTops([-900,0,1220,2440,3660]),1);assert.equal(progressFromTops([-1510,-610,610,1830,3050]),1.5);assert.equal(progressFromTops([-4560,-3660,-2440,-1220,0]),4);
});
