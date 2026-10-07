const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),{execFileSync}=require('node:child_process')
const base='79c7f45f62d5d1bb78a9878076da3f09364deedb'
async function main(){
 const THREE=await import('three')
 global.document={createElement:()=>{const canvas={width:0,height:0};const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{canvas.data=image.data}};canvas.getContext=()=>ctx;return canvas}}
 function load(file,historical,cache=new Map()){
  if(cache.has(file))return cache.get(file)
  const out={};cache.set(file,out)
  const source=historical?execFileSync('git',['show',base+':'+file],{encoding:'utf8'}):fs.readFileSync(file,'utf8')
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
  new Function('require','exports',code)(name=>name.startsWith('.')?load(path.posix.normalize(path.posix.join(path.posix.dirname(file),name+'.ts')),historical,cache):name==='three'?THREE:require(name),out)
  return out
 }
 const file='src/world/nightGarden/GardenMaterials.ts',before=new (load(file,true).GardenMaterials)(),after=new (load(file,false).GardenMaterials)()
 for(const family of ['pathMaps','groundMaps','gravelMaps'])for(const key of ['color','height','roughness','normal'])assert.deepEqual(after[family][key].image.data,before[family][key].image.data,family+'/'+key+' changed')
 const sample=load('src/world/nightGarden/GardenRockMineral.ts',false).rockMineralSample
 let seamError=0,min=1,max=0,maxTilt=0,meanTilt=0
 for(let i=0;i<1024;i++){
  const v=i/1024
  for(const [a,b]of [[sample(0,v),sample(1,v)],[sample(v,0),sample(v,1)]]){
   for(const key of ['height','roughness'])seamError=Math.max(seamError,Math.abs(a[key]-b[key]))
   for(let c=0;c<3;c++)seamError=Math.max(seamError,Math.abs(a.color[c]-b.color[c]))
  }
 }
 assert(seamError<1e-9,'nonperiodic map boundary')
 const r=after.rockMaps.roughness.image.data,n=after.rockMaps.normal.image.data
 for(let i=0;i<r.length;i+=4){min=Math.min(min,r[i+1]/255);max=Math.max(max,r[i+1]/255);const dx=n[i]/255*2-1,dy=n[i+1]/255*2-1,z=n[i+2]/255*2-1;const tilt=Math.atan2(Math.hypot(dx,dy)*.55,z)*180/Math.PI;maxTilt=Math.max(maxTilt,tilt);meanTilt+=tilt/(r.length/4)}
 assert(min>=.82-1/255&&max<=.97+1/255);assert(max-min>.04,'roughness variation collapsed');assert(maxTilt<15&&meanTilt>.3,'normal strength out of restrained range: '+JSON.stringify({maxTilt,meanTilt}))
 let disposed=0;for(const family of ['pathMaps','rockMaps','groundMaps','gravelMaps'])for(const map of Object.values(after[family]))map.addEventListener('dispose',()=>disposed++)
 after.dispose();before.dispose();assert.equal(disposed,16)
 let frozen=0
 for(const file of execFileSync('git',['ls-tree','-r','--name-only',base,'src','package.json','package-lock.json','index.html'],{encoding:'utf8'}).trim().split('\n')){
  if(file==='src/world/nightGarden/GardenMaterials.ts')continue
  assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',base+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file+' changed');frozen++
 }
 console.log(JSON.stringify({base,frozenFiles:frozen,otherSurfaceMapsByteIdentical:true,mapSize:256,newAllocatedMaps:0,additionalUploadedMaps:1,seamError,roughness:[min,max],normalTiltDegrees:{mean:meanTilt,max:maxTilt},disposedMaps:disposed},null,2))
}
main().catch(e=>{console.error(e);process.exitCode=1})
