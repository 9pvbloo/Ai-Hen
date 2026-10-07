const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path')
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'))
const before=read(process.argv[2]||path.join(__dirname,'hybrid-toro-before.json'))
const after=read(process.argv[3]||path.join(__dirname,'hybrid-toro-after.json'))
assert.deepEqual(before.errors,[]);assert.deepEqual(after.errors,[])
const result={}
for(const name of Object.keys(before.layouts)){
 const a=after.layouts[name],b=before.layouts[name];result[name]={}
 assert.deepEqual(a.inventory,b.inventory,'light/shadow inventory drift')
 assert.deepEqual(a.pose,b.pose,'camera pose drift');assert.deepEqual(a.renderer,b.renderer,'renderer drift')
 for(const pose of ['reveal','garden','threshold','interior']){
  for(const key of ['calls','geometries','textures','programs']){
   assert.equal(a[pose][key],b[pose][key],name+'/'+pose+'/'+key)
   assert.equal(a[pose].refresh[key],b[pose].refresh[key],name+'/'+pose+'/refresh/'+key)
  }
  const triangleDelta=a[pose].triangles-b[pose].triangles
  const shadowDelta=a[pose].refresh.triangles-b[pose].refresh.triangles
  assert.equal(triangleDelta,0,'unexpected visible geometry change')
  assert.equal(shadowDelta,0,'unexpected shadow geometry change')
  result[name][pose]={calls:[b[pose].calls,a[pose].calls],triangles:[b[pose].triangles,a[pose].triangles],refreshTriangles:[b[pose].refresh.triangles,a[pose].refresh.triangles]}
 }
 assert.equal(a.toro.cavityRays,20);assert(a.toro.cameraClearance>1)
}
assert.equal(after.lifecycle.cleanup.memory.geometries,0);assert.equal(after.lifecycle.cleanup.programs,0)
console.log(JSON.stringify(result,null,2));console.log('PASS: unchanged hybrid geometry budget; unchanged draw calls, resources, lights, camera and renderer')
