// Numeric-only browser validation. Reports live in OS TEMP, never in Git.
const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict')
const {execFileSync}=require('node:child_process'),ts=require('typescript')
const hash=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex')
const dir=path.join(os.tmpdir(),'ai-hen-genkan-validation'),stage=process.env.GENKAN_STAGE||'after'
const lifecycleBaseline=process.env.GENKAN_LIFECYCLE_BASELINE==='1'
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:true}),report={errors:[],layouts:{}}
 try{
  const page=await browser.newPage()
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
  await page.route(/\/__genkan-baseline\/(GardenPavilion|GardenPavilionArchitecture|GardenPavilionFacade)\.ts$/,async route=>{
   const name=new URL(route.request().url()).pathname.split('/').pop(),source=execFileSync('git',['show',`8200ce9:src/world/nightGarden/${name}`],{encoding:'utf8'})
   const body=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
    .replace(/from ['"]three['"]/g,"from '/node_modules/.vite/deps/three.js'")
    .replace(/from ['"]three\/addons\/([^'"]+)['"]/g,"from '/node_modules/three/examples/jsm/$1'")
    .replace(/from ['"]\.\/([^'"]+)['"]/g,(_,name)=>`from '${['GardenPavilionArchitecture','GardenPavilionFacade'].includes(name)?'/__genkan-baseline/':'/src/world/nightGarden/'}${name}.ts'`)
   await route.fulfill({status:200,contentType:'application/javascript',body})
  })
  await page.route('**/src/core/Experience.ts*',async route=>{const response=await route.fetch(),source=await response.text();await route.fulfill({response,body:source.replace('this.frame = null;','this.frame = null; window.__e=this; if(window.__hold){this.requestFrame();return;}')})})
  if(lifecycleBaseline)await page.route(/\/src\/world\/(?:nightGarden\/)?(?:World|NightGarden|GardenPavilion|GardenPavilionArchitecture|GardenPavilionFacade|GardenPavilionGlow)\.ts(?:\?.*)?$/,async route=>{
   const file=new URL(route.request().url()).pathname.slice(1),source=execFileSync('git',['show',`8200ce9:${file}`],{encoding:'utf8'})
   const body=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
    .replace(/from ['"]three['"]/g,"from '/node_modules/.vite/deps/three.js'")
    .replace(/from ['"]three\/addons\/([^'"]+)['"]/g,"from '/node_modules/three/examples/jsm/$1'")
    .replace(/from ['"](\.{1,2}\/[^'"]+)['"]/g,(_,name)=>`from '${name}.ts'`)
   await route.fulfill({status:200,contentType:'application/javascript',body})
  })
  await page.goto('http://127.0.0.1:5174/')
  await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
  await page.evaluate(async()=>{
   const e=window.__e;await e.world.nightGarden.background.ready;window.__hold=true;e.world.nightGarden.atmosphere.elapsed=0
   window.__pose=(g,extension=0,reduced=false,render=true)=>{
    const scroll={rawProgress:g,smoothProgress:g,continuationProgress:extension,reducedMotion:reduced,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))}
    e.world.update(0,scroll);e.camera.instance.updateMatrixWorld();if(render)e.renderer.render(e.scene,e.camera.instance)
   }
  })
  for(const [layout,width,height] of lifecycleBaseline?[]:[['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
   report.layouts[layout]=await page.evaluate(()=>{
    const e=window.__e,r=e.renderer.instance,w=e.world.nightGarden,poses=[]
    for(let i=0;i<=100;i++){const g=i/100;window.__pose(g);poses.push([...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray()])}
    const metrics={calls:r.info.render.calls,triangles:r.info.render.triangles,...r.info.memory,programs:r.info.programs.length}
    const paper=e.scene.getObjectByName('pavilion-blockout-wallEntry')
    const materials={color:paper.material.color.toArray(),emissive:paper.material.emissive.toArray(),intensity:paper.material.emissiveIntensity,roughness:paper.material.roughness}
    return {poses,metrics,paper:Array.from(paper.instanceMatrix.array.slice(0,paper.count*16)),materials,arrival:w.cameraPath.getArrival(),error:r.getContext().getError()}
   })
   assert.equal(report.layouts[layout].error,0)
   if(stage==='after'){
    const before=require('./genkan-baseline.json').layouts[layout],v=report.layouts[layout]
    assert.equal(hash(v.poses),before.poses,'approved camera changed');assert.equal(hash(v.paper),before.paper,'closed paper matrices changed');assert.equal(hash(v.materials),before.materials,'closed shoji materials changed')
    v.closedPixels=await page.evaluate(async()=>{
     const {GardenPavilion}=await import('/__genkan-baseline/GardenPavilion.ts'),e=window.__e,w=e.world.nightGarden,r=e.renderer.instance,gl=r.getContext()
     const current=w.pavilion.entranceRoot,original=new GardenPavilion(w.root,w.layoutId),old=original.root
     original.setIntensity(1);w.aperture.attach(old);old.visible=false
     window.__pose(1)
     const a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4),b=new Uint8Array(a.length)
     gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a)
     current.visible=false;old.visible=true;e.renderer.render(e.scene,e.camera.instance)
     gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,b)
     let changed=0,total=0,max=0;for(let i=0;i<a.length;i+=4){const delta=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));max=Math.max(max,delta);total+=delta;if(delta>3)changed++}
     current.visible=true;original.dispose();window.__pose(1)
     return {changedFraction:changed/(a.length/4),meanDelta:total/(a.length/4),maxDelta:max,error:gl.getError()}
    })
    // CLOSED is visually approved, not pixel-identical: split joinery changes a few edge pixels.
    assert.equal(v.closedPixels.error,0);assert(v.closedPixels.meanDelta<.05 && v.closedPixels.changedFraction<.004,JSON.stringify(v.closedPixels))
    v.engineering=await page.evaluate(require('./validate-genkan-runtime.cjs'))
    delete v.poses;delete v.paper;delete v.materials;delete v.arrival
    console.log(layout,JSON.stringify({metrics:v.metrics,closed:v.closedPixels,engineering:v.engineering}))
   }
  }
  if(stage==='after'){
   // Baseline comparison mounts historical meshes. Isolate lifecycle from that diagnostic scene.
   await page.reload();await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
   await page.evaluate(async()=>{
    const e=window.__e;await e.world.nightGarden.background.ready;window.__hold=true
    window.__pose=(g,extension=0)=>{
     e.world.update(0,{rawProgress:g,smoothProgress:g,continuationProgress:extension,reducedMotion:false,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))})
     e.renderer.render(e.scene,e.camera.instance)
    }
   })
   report.lifecycle=await require('./validate-genkan-lifecycle.cjs')(page,lifecycleBaseline)
   console.log('lifecycle',JSON.stringify(report.lifecycle.cleanup))
  }
  assert.deepEqual(report.errors,[])
  console.log(lifecycleBaseline?'PASS: historical GPU ownership lifecycle':'PASS: baseline, joinery, camera, native scroll, resize, reduced motion and lifecycle')
 }finally{await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,(lifecycleBaseline?'lifecycle-baseline':stage)+'.json'),JSON.stringify(report));await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
