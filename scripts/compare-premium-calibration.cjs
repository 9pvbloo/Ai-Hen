// Compare fresh runtime budgets and same-coordinate irradiance probes; never pixel capture.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const base=require('./premium-calibration-before.json')
const read=n=>JSON.parse(fs.readFileSync(n,'utf8'))
const before=read(process.argv[2]||path.join(__dirname,'premium-calibration-historical-before.json')),after=read(process.argv[3]||path.join(__dirname,'premium-calibration-after.json'))
assert.deepEqual(before.errors,[]);assert.deepEqual(after.errors,[])
const comparisons={}
for(const name of Object.keys(base.layouts)){
 const a=after.layouts[name],b=before.layouts[name],fresh=base.layouts[name]
 for(const pose of ['garden','threshold','interior'])for(const key of ['calls','triangles','geometries','textures','programs']){
  assert.equal(a[pose][key],fresh[pose][key],`${name}/${pose}/${key} budget drift`)
  assert.equal(b[pose][key],fresh[pose][key],`${name}/${pose}/${key} historical baseline mismatch`)
  assert.equal(a[pose].refresh[key],fresh[pose].refresh[key],`${name}/${pose}/${key} shadow refresh drift`)
 }
 assert.deepEqual(a.pose,fresh.pose);assert.deepEqual(a.renderer,fresh.renderer)
 const inventory=structuredClone(a.inventory)
 inventory.shadows.find(l=>l.name==='garden-practical-foreground').far=3
 assert.deepEqual(inventory,fresh.inventory)
 comparisons[name]={receivers:[],secondary:[]}
 for(const point of a.contrast.receivers){
  const old=b.contrast.receivers.find(p=>p.name===point.name)
  assert.deepEqual(point.point,old.point);assert.equal(point.cold,old.cold,'cold contribution changed')
  if(point.name==='cold-control'){assert.equal(point.warm,0);assert.equal(old.warm,0)}
  else assert(point.warm>old.warm*1.5,point.name+' insufficient incident warm gain')
  comparisons[name].receivers.push({name:point.name,before:old.warm,after:point.warm,gain:old.warm?point.warm/old.warm:null,warmFractionBefore:old.warmFraction,warmFractionAfter:point.warmFraction})
 }
 for(const point of a.contrast.secondaryPools){
  const old=b.contrast.secondaryPools.find(p=>p.anchor===point.anchor)
  assert(point.diffuseProxy>old.diffuseProxy*1.5,'secondary pool gain')
  comparisons[name].secondary.push({anchor:point.anchor,gain:point.diffuseProxy/old.diffuseProxy})
 }
}
console.log(JSON.stringify(comparisons,null,2))
console.log('PASS: unchanged runtime budgets, camera and cold light; stronger warm receiver probes')
