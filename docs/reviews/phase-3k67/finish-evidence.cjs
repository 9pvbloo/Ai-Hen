// Archive-only supplemental evidence; never imported by the application.
const {chromium}=require('playwright')
const {execFileSync}=require('node:child_process')
const ts=require('typescript')
const fs=require('node:fs/promises')
const assert=require('node:assert/strict')
const path=require('node:path')
const dir=__dirname
const baselineRef='5515b4c'

async function hooks(page,baseline){
 if(baseline)for(const file of ['NightGarden','GardenLanterns','GardenLanternNetwork','GardenPavilionLighting']){
  const original=execFileSync('git',['show',`${baselineRef}:src/world/nightGarden/${file}.ts`],{encoding:'utf8'})
  await page.route(`**/src/world/nightGarden/${file}.ts*`,async route=>{
   const response=await route.fetch(),current=await response.text()
   const three=current.match(/from ["']([^"']*\/three\.js[^"']*)["']/)?.[1]||'/node_modules/three/build/three.module.js'
   const body=ts.transpileModule(original,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
    .replace(/from (["'])(\.[^"']+)\1/g,(_,q,p)=>`from ${q}${p}.ts${q}`)
    .replace(/from (["'])three\1/g,`from '${three}'`)
    .replace('three/addons/utils/BufferGeometryUtils.js','/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js')
   await route.fulfill({response,body})
  })
 }
 await page.route('**/src/core/Experience.ts*',async route=>{
  const response=await route.fetch(),source=await response.text(),needle='this.frame = null;'
  assert(source.includes(needle))
  await route.fulfill({response,body:source.replace(needle,needle+' window.__e=this; if(window.__hold){this.renderer.instance.render(this.scene,window.__camera||this.camera.instance);this.requestFrame();return;}')})
 })
}
async function run(){
 const report={implementationHEAD:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baselineRef,errors:[],budgets:{},checks:{},probes:{}}
 const browser=await chromium.launch({headless:true,channel:'chrome'})
 try{
  for(const stage of ['before','after']){
   const page=await browser.newPage({viewport:{width:1440,height:900}})
   page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||(m.type()==='warning'&&/shader|webgl/i.test(m.text())))report.errors.push(m.text())})
   await hooks(page,stage==='before')
   await page.addInitScript(()=>{window.__losses=0;document.addEventListener('webglcontextlost',()=>window.__losses++,true)})
   await page.goto('http://127.0.0.1:5174/?debug=1');await page.waitForFunction(()=>window.__e)
   await page.addStyleTag({content:'.debug-panel{visibility:hidden}'})
   report.budgets[stage]={}
   for(const [layout,width,height] of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
    await page.evaluate(()=>{window.__hold=false})
    await page.setViewportSize({width,height})
    await page.evaluate(()=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*.872))
    await page.waitForFunction(()=>Math.abs(window.__e.world.nightGarden.progress-.6)<.0006)
    // Measure settled production animation, including updates, without freezing it.
    const data=await page.evaluate(async()=>{
     const intervals=[],start=performance.now();let last=await new Promise(requestAnimationFrame)
     for(let i=0;i<105;i++){
      const now=await new Promise(requestAnimationFrame);if(i>=15)intervals.push(now-last);last=now
     }
     const e=window.__e,r=e.renderer.instance,sorted=[...intervals].sort((a,b)=>a-b),lights=[]
     e.scene.traverse(o=>{if(o.isLight){let effective=true;for(let p=o;p;p=p.parent)effective&&=p.visible;lights.push({type:o.type,name:o.name,intensity:o.intensity,effective,castShadow:o.castShadow})}})
     const inGarden=[];e.scene.getObjectByName('night-garden').traverse(o=>{if(o.isLight)inGarden.push(o)})
     const ext=r.getContext().getExtension('WEBGL_debug_renderer_info')
     return {calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,geometries:r.info.memory.geometries,
      fps:1000/(intervals.reduce((a,b)=>a+b)/intervals.length),medianFrameMs:sorted[45],p95FrameMs:sorted[85],maxFrameMs:sorted[89],samples:90,
      settleFramesDiscarded:15,elapsedMs:performance.now()-start,intervals,
      garden:{point:inGarden.filter(l=>l.isPointLight).length,spot:inGarden.filter(l=>l.isSpotLight).length,contributing:inGarden.filter(l=>l.intensity>0).length},
      sceneLights:lights,renderer:{exposure:r.toneMappingExposure,toneMapping:r.toneMapping,pixelRatio:r.getPixelRatio(),gpu:ext?r.getContext().getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'},
      error:r.getContext().getError(),contextLosses:window.__losses}
    })
    assert.equal(data.error,0);assert.equal(data.contextLosses,0);report.budgets[stage][layout]=data
   }
   await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight))
   await page.waitForFunction(()=>window.__e.world.nightGarden.progress>.99999)
   await page.evaluate(async()=>{
    const {PerspectiveCamera}=await import('/node_modules/three/build/three.module.js')
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    window.__hold=true;const c=new PerspectiveCamera(48,1.6,.025,180)
    c.position.set(3,h(3,-41,'desktop')+1.25,-41);c.lookAt(3,h(3,-46,'desktop')+.35,-46);window.__camera=c
   })
   for(const mode of stage==='before'?['A']:['B','C','D','E']){
    await page.evaluate(mode=>{
     if(mode==='A')return
     const e=window.__e;e.world.nightGarden.practicalBounce.setIntensity(mode==='B'?0:1)
     for(const name of ['garden-lantern-local-halos','pavilion-local-shoji-glow'])e.scene.getObjectByName(name).visible=['D','E'].includes(mode)
    },mode)
    await page.waitForTimeout(80);await page.screenshot({path:path.join(dir,stage,`closeup-first-steps-${mode}.png`)})
   }
   // Project world-space probes behind solid wall runs into the archived exterior views.
   report.probes[stage]=await page.evaluate(async()=>{
    const {PerspectiveCamera,Vector3}=await import('/node_modules/three/build/three.module.js')
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    return [
     {name:'left-solid-rear',capture:'closeup-left-wall-rear',from:[-16,-29],to:[-11.7,-32.1],point:[-13,-33]},
     {name:'right-solid-rear',capture:'closeup-right-wall-rear',from:[17,-35],to:[12.5,-39],point:[14,-41]},
    ].map(v=>{
     const c=new PerspectiveCamera(48,1.6,.025,180);c.position.set(v.from[0],h(...v.from,'desktop')+1.5,v.from[1]);c.lookAt(v.to[0],h(...v.to,'desktop')+.5,v.to[1]);c.updateMatrixWorld()
     const p=new Vector3(v.point[0],h(...v.point,'desktop'),v.point[1]).project(c)
     return {name:v.name,capture:v.capture,world:[v.point[0],h(...v.point,'desktop'),v.point[1]],pixel:[Math.round((p.x+1)*720),Math.round((1-p.y)*450)]}
    })
   })
   await page.close()
  }
  const changed=execFileSync('git',['diff','--name-only',baselineRef,'HEAD','--','src'],{encoding:'utf8'}).trim().split('\n')
  const allowed=['GardenLanternNetwork.ts','GardenLanterns.ts','GardenPavilionLighting.ts','GardenPracticalBounce.ts','GardenPracticalContainment.ts','NightGarden.ts'].map(n=>'src/world/nightGarden/'+n)
  assert(changed.every(f=>allowed.includes(f)))
  report.checks={sourceChanges:changed,frozenFilesUnchanged:true,sourceWorkingTreeClean:execFileSync('git',['diff','--name-only','HEAD','--','src'],{encoding:'utf8'}).trim()===''}
  assert(report.checks.sourceWorkingTreeClean)
  for(const layout of ['desktop','tablet','portrait']){
   const a=report.budgets.before[layout],b=report.budgets.after[layout]
   assert.equal(b.calls,a.calls-1);assert.equal(b.triangles,a.triangles-4320);assert.equal(b.textures,a.textures)
   assert.deepEqual(b.garden,a.garden);assert.deepEqual(b.renderer,a.renderer)
  }
  assert.deepEqual(report.errors,[])
 }finally{await browser.close();await fs.writeFile(path.join(dir,'responsive-budget.json'),JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({checks:report.checks,budgets:Object.fromEntries(Object.entries(report.budgets).map(([s,layouts])=>[s,Object.fromEntries(Object.entries(layouts).map(([l,d])=>[l,{calls:d.calls,triangles:d.triangles,textures:d.textures,fps:d.fps,p95FrameMs:d.p95FrameMs}]))])),errors:report.errors},null,2))
}
run().catch(e=>{console.error(e);process.exitCode=1})
