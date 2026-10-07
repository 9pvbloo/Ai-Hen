const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),{execFileSync}=require('node:child_process')
async function main(){
const THREE=await import('three')
const base='6e732da3b307653857bbc39c9a89d03ef6482945'
function moduleAt(file,historical,cache=new Map()){
 if(cache.has(file))return cache.get(file)
 const exports={};cache.set(file,exports)
 const source=historical?execFileSync('git',['show',base+':'+file],{encoding:'utf8'}):fs.readFileSync(file,'utf8')
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
 new Function('require','exports',code)(name=>name.startsWith('.')?moduleAt(path.posix.normalize(path.posix.join(path.posix.dirname(file),name+'.ts')),historical,cache):name==='three'?THREE:require(name),exports)
 return exports
}
const file='src/world/nightGarden/GardenLanternGeometry.ts',old=moduleAt(file,true),now=moduleAt(file,false),report={}
for(const family of ['path','secondary']){
 const a=old.createGardenLanternGeometry(family),b=now.createGardenLanternGeometry(family);report[family]={}
 for(const finish of ['stone','frame','paper']){
  const before=a[finish],after=b[finish];report[family][finish]={before:before.index.count/3,after:after.index.count/3}
  for(const attribute of Object.values(after.attributes))assert(Array.from(attribute.array).every(Number.isFinite),'nonfinite attribute')
  assert(Array.from(after.index.array).every(i=>i<after.attributes.position.count),'invalid index')
  if(family==='secondary'||finish==='paper'){
   for(const key of Object.keys(before.attributes))assert.deepEqual(after.attributes[key].array,before.attributes[key].array,'secondary attribute changed')
   assert.deepEqual(after.index.array,before.index.array)
  }else{
   const positions=after.attributes.position
   for(let i=0;i<positions.count;i++)assert(Math.hypot(positions.getX(i),positions.getZ(i))<=old.LANTERN_FAMILY.path.footprint+1e-6,'expanded path footprint')
   after.computeBoundingBox();assert(after.boundingBox.min.y>=-1e-6&&after.boundingBox.max.y<1.54,'height envelope')
  }
  before.dispose();after.dispose()
 }
}
const partsFile='src/world/nightGarden/PathToroGeometry.ts'
const originalParts=moduleAt(partsFile,true).createPathToroParts(),currentParts=moduleAt(partsFile,false).createPathToroParts()
for(let i=0;i<8;i++){
 for(const key of Object.keys(originalParts.stone[i].attributes))assert.deepEqual(currentParts.stone[i].attributes[key].array,originalParts.stone[i].attributes[key].array,'base/shaft geometry drift')
 assert.deepEqual(currentParts.stone[i].index.array,originalParts.stone[i].index.array)
}
for(const g of currentParts.stone){const p=g.attributes.position;for(let i=0;i<p.count;i++)assert(!(p.getY(i)>.77&&p.getY(i)<1.12),'stone remains in luminous chamber')}
for(const parts of [originalParts,currentParts])for(const list of Object.values(parts))for(const g of list)g.dispose()
const delta=Object.values(report.path).reduce((sum,p)=>sum+p.after-p.before,0)
assert.equal(delta,0,'hybrid should reuse the existing topology')
console.log(JSON.stringify({base,triangles:report,extraTrianglesForFive:5*delta,secondaryExact:true},null,2))
const allowed=new Set(['PathToroGeometry.ts','GardenLanterns.ts'].map(n=>'src/world/nightGarden/'+n))
let frozen=0
for(const file of execFileSync('git',['ls-tree','-r','--name-only',base,'src','package.json','package-lock.json','index.html'],{encoding:'utf8'}).trim().split('\n')){
 if(allowed.has(file))continue
 assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',base+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file+' changed outside scope');frozen++
}
console.log({frozenFiles:frozen,cameraRouteTimingOwnershipLeavesMansionGateMoonArchitecture:true})

}
main().catch(e=>{console.error(e);process.exitCode=1})
