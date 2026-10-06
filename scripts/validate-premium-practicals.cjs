// Numeric WebGL validation only. External Playwright; no media or recordings.
const {chromium}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict')
const stage=process.env.LIGHTING_STAGE||'after',file=path.join(os.tmpdir(),(process.env.LIGHTING_REPORT_PREFIX||'ai-hen-premium-')+stage+'.json')
const baselineRef=process.env.LIGHTING_BASELINE_REF
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:true}),report={errors:[],layouts:{}}
 try{
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
  const historical=new Map()
  if(baselineRef){
   const {execFileSync}=require('node:child_process'),ts=require('typescript')
   for(const name of execFileSync('git',['diff','--name-only','--diff-filter=M',baselineRef,'--','src'],{encoding:'utf8'}).trim().split('\n')){
    if(!name.endsWith('.ts'))continue
    const source=execFileSync('git',['show',`${baselineRef}:${name}`],{encoding:'utf8'})
    historical.set('/'+name,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
     .replace(/from ['"]three['"]/g,"from '/node_modules/.vite/deps/three.js'")
     .replace(/from ['"]three\/addons\/([^'"]+)['"]/g,"from '/node_modules/three/examples/jsm/$1'")
     .replace(/from ['"](\.[^'"]+)['"]/g,(_,p)=>`from '${new URL(p+(path.extname(p)?'':'.ts'),'http://local/'+name).pathname}'`))
   }
  }
  await page.route('**/src/**',async route=>{
   const name=new URL(route.request().url()).pathname
   if(!historical.has(name)&&name!=='/src/core/Experience.ts'){await route.continue();return}
   const response=await route.fetch();let body=historical.get(name)||await response.text()
   if(name==='/src/core/Experience.ts')body=body.replace('this.frame = null;','this.frame = null; window.__e=this; if(window.__hold){this.requestFrame();return;}')
   await route.fulfill({response,body})
  })
  await page.goto('http://127.0.0.1:5174/');await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
  await page.evaluate(async()=>{
   const e=window.__e;await e.world.nightGarden.background.ready;window.__hold=true
   window.__pose=(g,t=0,i=0,reduced=false,render=true)=>{e.world.update(0,{rawProgress:g,smoothProgress:g,continuationProgress:t,interiorProgress:i,reducedMotion:reduced,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))});e.camera.instance.updateMatrixWorld();if(render)e.renderer.render(e.scene,e.camera.instance)}
  })
  for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
   if(process.env.LIGHTING_PROBE_ONLY){
    report.layouts[name]=process.env.LIGHTING_MICRO_AUDIT
     ? {micro:await page.evaluate(require('./validate-premium-micro-runtime.cjs'))}
     : {contrast:await page.evaluate(require('./probe-practical-contrast-runtime.cjs'))};continue
   }
   report.layouts[name]=await page.evaluate(async includeReveal=>{
    const e=window.__e,r=e.renderer.instance,metrics=()=>({calls:r.info.render.calls,triangles:r.info.render.triangles,...r.info.memory,programs:r.info.programs.length})
    const poses=[...(includeReveal?[['reveal',[.73]]]:[]),['garden',[1]],['threshold',[1,1]],['interior',[1,1,1]]]
    const result={};for(const [key,args]of poses){
     window.__pose(...args);window.__pose(...args);result[key]=metrics()
     e.world.nightGarden.shadows?.invalidate();window.__pose(...args);result[key].refresh=metrics()
     for(let n=0;n<15;n++){window.__pose(...args);r.getContext().finish()}
     const samples=[];let last=performance.now();for(let n=0;n<12;n++){await new Promise(requestAnimationFrame);window.__pose(...args);r.getContext().finish();const now=performance.now();samples.push(now-last);last=now}
     result[key].fps=Math.round(12000/samples.reduce((a,b)=>a+b,0))
    }
    result.pose=[...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray(),e.camera.instance.fov]
    result.renderer={enabled:r.shadowMap.enabled,type:r.shadowMap.type,toneMapping:r.toneMapping,exposure:r.toneMappingExposure}
    let lights=0,casters=0,receivers=0;const shadows=[]
    e.scene.traverse(o=>{if(o.isMesh){casters+=+o.castShadow;receivers+=+o.receiveShadow}if(o.isLight){lights++;if(o.castShadow)shadows.push({name:o.name,size:o.shadow.mapSize.toArray(),near:o.shadow.camera.near,far:o.shadow.camera.far,bias:o.shadow.bias,normalBias:o.shadow.normalBias})}})
    result.inventory={lights,casters,receivers,shadows};result.error=r.getContext().getError();return result
   },Boolean(process.env.LIGHTING_TORO_AUDIT))
   assert.equal(report.layouts[name].error,0)
   if(process.env.LIGHTING_CONTRAST_AUDIT)report.layouts[name].contrast=await page.evaluate(require('./probe-practical-contrast-runtime.cjs'))
   if(stage==='after'){
    if(process.env.LIGHTING_TORO_AUDIT)report.layouts[name].toro=await page.evaluate(require('./validate-path-toro-runtime.cjs'))
    if(process.env.LIGHTING_MICRO_AUDIT)report.layouts[name].micro=await page.evaluate(require('./validate-premium-micro-runtime.cjs'))
    if(process.env.LIGHTING_CONTRAST_AUDIT)report.layouts[name].calibration=await page.evaluate(require('./validate-premium-calibration-runtime.cjs'))
    if(process.env.LIGHTING_LEAF_AUDIT)report.layouts[name].leaves=await page.evaluate(require('./validate-garden-leaves-runtime.cjs'))
    report.layouts[name].luminaires=await page.evaluate(require('./validate-premium-luminaires-runtime.cjs'))
    const interior=await page.evaluate(require('./validate-genkan-interior-runtime.cjs'))
    delete interior.geometry;report.layouts[name].validation=interior
    console.log(name+' interior',JSON.stringify(interior))
    const baseline=require('./genkan-refinement-baseline.json').layouts[name]
    assert.deepEqual(interior.finalPosition,baseline.finalPosition);assert.deepEqual(interior.finalTarget,baseline.finalTarget);assert.equal(interior.length,baseline.length)
   }
   const {validation,...summary}=report.layouts[name];console.log(name,JSON.stringify(summary))
  }
  if(process.env.LIGHTING_PROBE_ONLY){assert.deepEqual(report.errors,[]);return}
  // Revisit all layouts after program compilation; synchronized steady-state samples.
  report.warmFps={}
  for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
   report.warmFps[name]=await page.evaluate(async()=>{
    const r=window.__e.renderer.instance,result={}
    for(const [name,args]of [['garden',[1]],['interior',[1,1,1]]]){
     for(let n=0;n<20;n++){await new Promise(requestAnimationFrame);window.__pose(...args);r.getContext().finish()}
     const start=performance.now();for(let n=0;n<60;n++){await new Promise(requestAnimationFrame);window.__pose(...args);r.getContext().finish()}
     result[name]=Math.round(60000/(performance.now()-start))
    }
    return result
   })
  }
  console.log('warmFps',JSON.stringify(report.warmFps))
  if(process.env.LIGHTING_LEAF_AUDIT){
   report.movingLeavesFps={}
   for(const [name,width,height]of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
    await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
    report.movingLeavesFps[name]=await page.evaluate(async()=>{
     const e=window.__e,r=e.renderer.instance
     const frame=()=>{window.__pose(1,0,0,false,false);e.world.nightGarden.leaves.update(1/75,true,false);r.render(e.scene,e.camera.instance);r.getContext().finish()}
     for(let n=0;n<20;n++){await new Promise(requestAnimationFrame);frame()}
     const start=performance.now()
     for(let n=0;n<60;n++){await new Promise(requestAnimationFrame);frame()}
     return Math.round(60000/(performance.now()-start))
    })
   }
   console.log('movingLeavesFps',JSON.stringify(report.movingLeavesFps))
  }
  if(stage==='after'){
   const before=require(process.env.LIGHTING_BUDGET_BASELINE||'./lantern-premium-baseline.json')
   if(process.env.LIGHTING_BUDGET_BASELINE){
    for(const name of Object.keys(report.layouts)){
     const a=report.layouts[name],b=before.layouts[name]
     for(const pose of ['garden','threshold','interior'])for(const key of ['calls','triangles','geometries','textures','programs']){
      assert.equal(a[pose][key],b[pose][key],`${name}/${pose}/${key} budget changed`)
      assert.equal(a[pose].refresh[key],b[pose].refresh[key],`${name}/${pose}/${key} refresh budget changed`)
     }
     assert.deepEqual(a.inventory,b.inventory,`${name} light/shadow inventory changed`)
     assert.deepEqual(a.renderer,b.renderer,`${name} renderer changed`)
    }
    report.stableBudget=true
   }
   for(const name of Object.keys(report.layouts)){assert.deepEqual(report.layouts[name].pose,before.layouts[name].pose);assert(report.layouts[name].inventory.shadows.length<=4)}
   report.shadowValidation=await page.evaluate(require('./validate-premium-shadow-runtime.cjs'))
   console.log('shadowValidation',JSON.stringify(report.shadowValidation))
   report.lifecycle=await require('./validate-genkan-interior-lifecycle.cjs')(page)
   console.log('lifecycle',JSON.stringify(report.lifecycle.cleanup))
  }
  assert.deepEqual(report.errors,[]);console.log('PASS '+stage)
 }finally{fs.writeFileSync(file,JSON.stringify(report));await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
