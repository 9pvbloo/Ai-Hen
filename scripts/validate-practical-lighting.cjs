// Numeric WebGL validation only. External Playwright; no media or recordings.
const {chromium}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict')
const stage=process.env.LIGHTING_STAGE||'after',file=path.join(os.tmpdir(),'ai-hen-lighting-'+stage+'.json')
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:true}),report={errors:[],layouts:{}}
 try{
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
  await page.route('**/src/core/Experience.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('this.frame = null;','this.frame = null; window.__e=this; if(window.__hold){this.requestFrame();return;}')})})
  await page.goto('http://127.0.0.1:5174/');await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
  await page.evaluate(async()=>{
   const e=window.__e;await e.world.nightGarden.background.ready;window.__hold=true
   window.__pose=(g,t=0,i=0)=>{e.world.update(0,{rawProgress:g,smoothProgress:g,continuationProgress:t,interiorProgress:i,reducedMotion:false,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))});e.camera.instance.updateMatrixWorld();e.renderer.render(e.scene,e.camera.instance)}
  })
  for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
   report.layouts[name]=await page.evaluate(async()=>{
    const e=window.__e,r=e.renderer.instance,metrics=()=>({calls:r.info.render.calls,triangles:r.info.render.triangles,...r.info.memory,programs:r.info.programs.length})
    const result={};for(const [key,args]of [['garden',[1]],['threshold',[1,1]],['interior',[1,1,1]]]){
     window.__pose(...args);window.__pose(...args);result[key]=metrics()
     const samples=[];let last=performance.now();for(let n=0;n<12;n++){await new Promise(requestAnimationFrame);window.__pose(...args);r.getContext().finish();const now=performance.now();samples.push(now-last);last=now}
     result[key].fps=Math.round(12000/samples.reduce((a,b)=>a+b,0))
    }
    result.pose=[...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray(),e.camera.instance.fov]
    result.renderer={enabled:r.shadowMap.enabled,type:r.shadowMap.type,toneMapping:r.toneMapping,exposure:r.toneMappingExposure}
    let lights=0,casters=0,receivers=0;const shadows=[]
    e.scene.traverse(o=>{if(o.isMesh){casters+=+o.castShadow;receivers+=+o.receiveShadow}if(o.isLight){lights++;if(o.castShadow)shadows.push({name:o.name,size:o.shadow.mapSize.toArray(),near:o.shadow.camera.near,far:o.shadow.camera.far,bias:o.shadow.bias,normalBias:o.shadow.normalBias})}})
    result.inventory={lights,casters,receivers,shadows};result.error=r.getContext().getError();return result
   })
   assert.equal(report.layouts[name].error,0)
   console.log(name,JSON.stringify(report.layouts[name]))
  }
  if(stage==='after'){
   const before=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'ai-hen-lighting-before.json')))
   for(const name of Object.keys(report.layouts)){assert.deepEqual(report.layouts[name].pose,before.layouts[name].pose);assert(report.layouts[name].inventory.shadows.length<=3)}
   report.lifecycle=await require('./validate-genkan-interior-lifecycle.cjs')(page)
   console.log('lifecycle',JSON.stringify(report.lifecycle.cleanup))
  }
  assert.deepEqual(report.errors,[]);console.log('PASS '+stage)
 }finally{fs.writeFileSync(file,JSON.stringify(report));await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
