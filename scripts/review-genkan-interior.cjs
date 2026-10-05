// Numeric-only validation; requires external Playwright tooling and Vite on 5174.
const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict')
const hash=v=>require('node:crypto').createHash('sha256').update(JSON.stringify(v)).digest('hex')
const dir=path.join(os.tmpdir(),'ai-hen-interior-validation'),stage=process.env.INTERIOR_STAGE||'after'
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:true}),report={errors:[],layouts:{}}
 try{
  const page=await browser.newPage()
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
  await page.route('**/src/core/Experience.ts*',async route=>{const response=await route.fetch(),source=await response.text();await route.fulfill({response,body:source.replace('this.frame = null;','this.frame = null; window.__e=this; if(window.__hold){this.requestFrame();return;}')})})
  await page.goto('http://127.0.0.1:5174/');await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
  await page.evaluate(async()=>{
   const e=window.__e;await e.world.nightGarden.background.ready;window.__hold=true;e.world.nightGarden.atmosphere.elapsed=0
   window.__pose=(g,threshold=0,interior=0,reduced=false,render=true)=>{
    e.world.update(0,{rawProgress:g,smoothProgress:g,continuationProgress:threshold,interiorProgress:interior,reducedMotion:reduced,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))})
    e.camera.instance.updateMatrixWorld();if(render)e.renderer.render(e.scene,e.camera.instance)
   }
  })
  for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
   const data=await page.evaluate(()=>{
    const e=window.__e,w=e.world.nightGarden,r=e.renderer.instance,poses=[],metrics=()=>({calls:r.info.render.calls,triangles:r.info.render.triangles,...r.info.memory,programs:r.info.programs.length})
    for(let i=0;i<=100;i++){window.__pose(i/100);poses.push([...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray()])}
    window.__pose(1);const arrival=metrics()
    for(let i=0;i<=100;i++){window.__pose(1,i/100,0,false,false);poses.push([...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray(),...w.pavilion.doors.offsets])}
    window.__pose(1,1);const threshold=metrics(),endpoint=e.camera.instance.position.toArray();let lights=0;e.scene.traverse(o=>{if(o.isLight)lights++})
    return {poses,arrival,threshold,endpoint,lights,error:r.getContext().getError()}
   })
   data.poseHash=hash(data.poses);delete data.poses;report.layouts[name]=data;assert.equal(data.error,0)
   if(stage==='after'){
    const before=require('./genkan-interior-baseline.json');assert.equal(data.poseHash,before.layouts[name].poseHash,'previous choreography changed')
    data.interior=await page.evaluate(require('./validate-genkan-interior-runtime.cjs'))
    data.interior.geometryHash=hash(data.interior.geometry);delete data.interior.geometry
    data.refinement=await page.evaluate(require('./validate-genkan-refinement.cjs'))
    const refinementBefore=require('./genkan-refinement-baseline.json').layouts[name]
    assert.deepEqual(data.interior.finalPosition,refinementBefore.finalPosition,'approved interior endpoint changed')
    assert.deepEqual(data.interior.finalTarget,refinementBefore.finalTarget,'approved interior target changed')
    assert.equal(data.interior.length,refinementBefore.length,'approved extension changed')
    assert.equal(data.arrival.textures,refinementBefore.arrival.textures,'unexpected texture cost')
    assert.equal(data.lights,refinementBefore.lights+2,'unexpected practical light count')
    assert(data.arrival.calls<=refinementBefore.arrival.calls+4,'refinement draw budget exceeded')
    assert.equal(data.interior.error,0)
   }
   console.log(name,JSON.stringify(data))
  }
  if(stage==='after'){
   assert.equal(report.layouts.desktop.interior.geometryHash,report.layouts.tablet.interior.geometryHash)
   assert.equal(report.layouts.desktop.interior.geometryHash,report.layouts.portrait.interior.geometryHash)
   report.exterior={}
   for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
    await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
    report.exterior[name]=await require('./compare-genkan-interior-exterior.cjs')(page)
   }
   console.log('exterior',JSON.stringify(report.exterior))
   // Historical comparison objects are test fixtures; lifecycle uses a fresh production scene.
   await page.reload();await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
   await page.evaluate(async()=>{
    const e=window.__e;await e.world.nightGarden.background.ready;window.__hold=true
    window.__pose=(g,threshold=0,interior=0)=>{
     e.world.update(0,{rawProgress:g,smoothProgress:g,continuationProgress:threshold,interiorProgress:interior,reducedMotion:false,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))})
     e.renderer.render(e.scene,e.camera.instance)
    }
   })
   report.lifecycle=await require('./validate-genkan-interior-lifecycle.cjs')(page)
   console.log('lifecycle',JSON.stringify(report.lifecycle.cleanup))
  }
  assert.deepEqual(report.errors,[])
  console.log('PASS: previous choreography, interior clearance, reversal, responsive and lifecycle')
 }finally{await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,stage+'.json'),JSON.stringify(report,null,2));await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
