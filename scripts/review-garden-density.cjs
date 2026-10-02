// Local-only Phase 3K.6.8 cameras and diagnostics. No review code ships.
const {chromium}=require('playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const stage=process.env.DENSITY_STAGE||'before',out=`logs/phase-3k68/${stage}`,archive='docs/reviews/phase-3k68'
const views=[
 ['left-foreground',[-3,-23],[-8,-28],2.0],['left-midground',[-3,-29],[-10,-35],2.4],['left-perimeter',[-5,-36],[-9,-43],2.4],
 ['right-foreground',[-.5,-14],[5,-19],1.8],['right-midground',[.5,-27],[8,-34],2.3],['right-perimeter',[4,-36],[11,-42],2.2],
 ['mansion-west-wing',[-1,-41],[-9,-48],2.4],['mansion-east-wing',[6,-41],[14,-48],2.4],
 ['hero-rock',[-3,-24],[-7,-28],1.4],['hero-tree',[-3,-26],[-8.6,-30],2.5],
]
async function main(){
 await fs.mkdir(out,{recursive:true});await fs.mkdir(archive,{recursive:true})
 const baseline=stage==='after'?JSON.parse(await fs.readFile(`${archive}/before.json`,'utf8')):null
 const report={stage,captures:{},errors:[],budgets:{}}
 const browser=await chromium.launch({headless:true,channel:'chrome'})
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}})
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||(m.type()==='warning'&&/shader|webgl/i.test(m.text())))report.errors.push(m.text())})
  await page.addInitScript(()=>{window.__losses=0;document.addEventListener('webglcontextlost',()=>window.__losses++,true)})
  await page.route('**/src/core/Experience.ts*',async route=>{
   const response=await route.fetch(),source=await response.text(),needle='this.frame = null;';assert(source.includes(needle))
   await route.fulfill({response,body:source.replace(needle,needle+' window.__e=this; if(window.__hold){this.renderer.instance.render(this.scene,window.__camera||this.camera.instance);this.requestFrame();return;}')})
  })
  await page.goto('http://127.0.0.1:5174/?debug=1');await page.waitForFunction(()=>window.__e)
  await page.addStyleTag({content:'.debug-panel{visibility:hidden}'})
  const capture=async name=>{
   if(baseline?.captures[name])await page.evaluate(c=>{
    const camera=window.__camera;camera.position.fromArray(c.position);camera.quaternion.fromArray(c.quaternion);camera.projectionMatrix.fromArray(c.projection);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
   },baseline.captures[name].camera)
   await page.waitForTimeout(100)
   report.captures[name]=await page.evaluate(()=>{
    const e=window.__e,r=e.renderer.instance,c=window.__camera,instances=[],lights=[]
    r.render(e.scene,c)
    e.scene.getObjectByName('night-garden').traverse(o=>{
     if(o.isInstancedMesh)instances.push({name:o.name,count:o.count})
     if(o.isLight)lights.push({name:o.name,type:o.type,intensity:o.intensity,color:o.color.toArray(),position:o.position.toArray(),distance:o.distance,angle:o.angle,shadow:o.castShadow})
    })
    return {camera:{position:c.position.toArray(),quaternion:c.quaternion.toArray(),projection:c.projectionMatrix.toArray()},
     calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,geometries:r.info.memory.geometries,programs:r.info.programs.length,
     error:r.getContext().getError(),losses:window.__losses,instances,lights}
   })
   assert.equal(report.captures[name].error,0);assert.equal(report.captures[name].losses,0)
   await page.screenshot({path:path.join(out,name+'.png')})
  }
  for(const [layout,width,height] of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.evaluate(()=>window.__hold=false);await page.setViewportSize({width,height})
   for(const progress of [.2,.4,.6,.8,1]){
    await page.evaluate(p=>{window.__hold=false;scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(.68+.32*p))},progress)
    await page.waitForFunction(p=>Math.abs(window.__e.world.nightGarden.progress-p)<.0006,progress);await page.waitForTimeout(150)
    if(progress===.6)report.budgets[layout]=await page.evaluate(async()=>{
     let last=await new Promise(requestAnimationFrame);const samples=[]
     for(let i=0;i<105;i++){const t=await new Promise(requestAnimationFrame);if(i>=15)samples.push(t-last);last=t}
     const r=window.__e.renderer.instance,sorted=[...samples].sort((a,b)=>a-b)
     return {fps:1000/(samples.reduce((a,b)=>a+b)/samples.length),p95Ms:sorted[85],calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,geometries:r.info.memory.geometries,programs:r.info.programs.length,samples}
    })
    await page.evaluate(()=>{window.__hold=true;window.__camera=window.__e.camera.instance.clone()})
    await capture(`${layout}-${progress*100}`)
   }
  }
  await page.evaluate(()=>window.__hold=false);await page.setViewportSize({width:1440,height:900})
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForFunction(()=>window.__e.world.nightGarden.progress>.9999)
  await page.evaluate(()=>window.__hold=true)
  for(const [name,from,to,height] of views){
   await page.evaluate(async({from,to,height})=>{
    const {PerspectiveCamera}=await import('/node_modules/three/build/three.module.js')
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const c=new PerspectiveCamera(48,1.6,.025,180);c.position.set(from[0],h(...from,'desktop')+height,from[1]);c.lookAt(to[0],h(...to,'desktop')+1,to[1]);window.__camera=c
   },{from,to,height});await capture(name)
  }
  if(stage==='after')await require('./validate-garden-density.cjs').validate(page,out,report)
  assert.deepEqual(report.errors,[])
 }finally{await fs.writeFile(`${archive}/${stage}.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
 console.log(JSON.stringify({stage,captures:Object.keys(report.captures).length,errors:report.errors,budgets:report.budgets},(k,v)=>k==='samples'?undefined:v))
}
main().catch(e=>{console.error(e);process.exitCode=1})
