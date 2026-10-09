const assert=require('node:assert/strict')
const before=require('./leaf-presence-before.json'),after=require('./leaf-presence-after.json')
assert.deepEqual(before.errors,[]);assert.deepEqual(after.errors,[])
const totals={desktop:[144,12,360,60],tablet:[96,8,240,42],portrait:[64,5,160,27]}
for(const [layout,[oldGround,oldAir,ground,air]]of Object.entries(totals)){
 const a=after.layouts[layout],b=before.layouts[layout]
 assert.deepEqual(a.inventory,b.inventory);assert.deepEqual(a.pose,b.pose);assert.deepEqual(a.renderer,b.renderer)
 assert.equal(a.leaves.ground,ground);assert.equal(a.leaves.air,air);assert.equal(a.leaves.trianglesPerLeaf,18)
 assert(a.leaves.minimumClearance>2);assert(a.leaves.depths.every(n=>n>=9))
 for(const pose of ['reveal','garden','threshold','interior']){
  const delta=pose==='reveal'||pose==='garden'?18*(ground+air-oldGround-oldAir):0
  for(const key of ['calls','geometries','textures','programs']){
   assert.equal(a[pose][key],b[pose][key],layout+'/'+pose+'/'+key)
   assert.equal(a[pose].refresh[key],b[pose].refresh[key],layout+'/'+pose+'/refresh/'+key)
  }
  assert.equal(a[pose].triangles-b[pose].triangles,delta)
  assert.equal(a[pose].refresh.triangles-b[pose].refresh.triangles,delta,'leaf geometry entered shadow pass')
 }
 console.log(layout,JSON.stringify({ground:[oldGround,ground],air:[oldAir,air],depths:a.leaves.depths,extraGardenTriangles:a.garden.triangles-b.garden.triangles,drawCalls:a.garden.calls}))
}
assert.equal(after.lifecycle.cleanup.memory.geometries,0);assert.equal(after.lifecycle.cleanup.programs,0);assert.equal(after.lifecycle.cleanup.memory.textures,4)
console.log('PASS: leaf-only triangle delta; stable calls, resources, lights, shadows and camera; clean lifecycle')
