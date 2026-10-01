// Local browser diagnostics only. No review controls are shipped to production.
const { chromium } = require('playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const stage = process.env.PRACTICAL_STAGE || 'before'
const out = `docs/reviews/phase-3k67/${stage}`
const variants = {
  low: { intensity: [1.6, 2.4, 2.6, 1.7, 1.5, 2.8, 2.8], range: [4.4, 5.2, 5.2, 4.6, 4.4, 4.8, 4.8], height: [0.6,0.7,0.7,0.6,0.6,0.75,0.75], offset: 0.12, landing: [5,5.5,3.15,5.9], hall: [14,8,4.8,4.5,1.1,9.2] },
  balanced: { intensity: [2.8,4.2,4.6,2.8,2.4,4.8,4.8], range: [5.2,6.2,6.2,5.2,5,5.8,5.8], height: [0.7,0.85,0.85,0.7,0.65,0.85,0.85], offset: 0.22, landing: [6.4,6.5,3.1,6.15], hall: [20,10.5,4.8,4.5,0.6,11] },
  wide: { intensity: [4.2,6.8,7.2,4.2,3.8,7.5,7.5], range: [6.5,7.8,7.8,6.4,6.2,7,7], height: [0.9,1.05,1.05,0.9,0.85,1.05,1.05], offset: 0.4, landing: [9,8,3.1,6.4], hall: [30,13,4.8,4.5,0,13] },
}
const views = [
  { name: 'foreground-lantern', from: [-0.3, -11.9], to: [-3.05,-14.95], height: 1.6 },
  { name: 'mid-path-lantern', from: [0.5,-29], to: [-2.05,-33], height: 1.7 },
  { name: 'left-perimeter', from: [-6.5,-27.5], to: [-11,-32.1], height: 2.1 },
  { name: 'right-perimeter', from: [7.5,-33], to: [12.1,-37.5], height: 2.1 },
  { name: 'left-rock-moss', from: [-2.5,-22], to: [-7.2,-28], height: 2.3 },
  { name: 'right-rock-moss', from: [0,-27], to: [6.5,-34.5], height: 2.3 },
  { name: 'genkan-forecourt', from: [3,-38.5], to: [3,-47], height: 2.2 },
  { name: 'left-wall-rear', from: [-16,-29], to: [-11.7,-32.1], height: 1.5 },
  { name: 'right-wall-rear', from: [17,-35], to: [12.5,-39], height: 1.5 },
  { name: 'mansion-rear', local: true, from: [0,6,-19], to: [0,5,-5] },
]

async function attach(page) {
  // Replay the committed approved baseline through Vite without checking out or
  // changing working files. Useful for repeatable before/after performance runs.
  if (process.env.PRACTICAL_BASELINE === '1') {
    const {execFileSync}=require('node:child_process'), ts=require('typescript')
    for(const file of ['NightGarden','GardenLanterns','GardenLanternNetwork','GardenPavilionLighting']) {
      const original=execFileSync('git',['show',`5515b4c:src/world/nightGarden/${file}.ts`],{encoding:'utf8'})
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
  }
  await page.route('**/src/core/Experience.ts*', async route => {
    const response = await route.fetch(), source = await response.text()
    const needle = 'this.frame = null;'
    assert(source.includes(needle))
    await route.fulfill({response, body: source.replace(needle, needle + ' window.__experience = this; if (window.__practicalHold) { this.renderer.instance.render(this.scene, window.__studyCamera || this.camera.instance); this.requestFrame(); return; }')})
  })
  await require('./review-karesansui.cjs').attach(page)
}
async function hold(page) {
  await page.evaluate(() => {
    if (!window.__experience) throw new Error('Review freeze hook missing')
    window.__practicalHold = true
    const r = window.__gardenReview
    window.__studyCamera = r.camera.clone()
  })
}
async function render(page) {
  return page.evaluate(() => {
    const r = window.__gardenReview, c = window.__studyCamera
    r.renderer.render(r.scene,c)
    const lights = [], garden = r.scene.getObjectByName('night-garden')
    garden.traverse(o => {
      if (!o.isLight) return
      let visible = true
      for (let p=o;p;p=p.parent) visible &&= p.visible
      const pos = o.position.clone(); o.getWorldPosition(pos)
      const target = o.target?.position.clone(); if(target) o.target.getWorldPosition(target)
      lights.push({ name:o.name,type:o.type,intensity:o.intensity,distance:o.distance,decay:o.decay,angle:o.angle,penumbra:o.penumbra,
        local:o.position.toArray(),position:pos.toArray(),target:target?.toArray(),color:o.color.toArray(),visible,castShadow:o.castShadow })
    })
    return { lights, calls:r.renderer.info.render.calls, triangles:r.renderer.info.render.triangles, textures:r.renderer.info.memory.textures,
      geometries:r.renderer.info.memory.geometries, programs:r.renderer.info.programs.length,
      renderer:{exposure:r.renderer.toneMappingExposure,toneMapping:r.renderer.toneMapping,pixelRatio:r.renderer.getPixelRatio()},
      camera:{position:c.position.toArray(),quaternion:c.quaternion.toArray(),projection:c.projectionMatrix.toArray()},
      error:r.renderer.getContext().getError(),contextLosses:window.gardenContextLosses }
  })
}
async function capture(page, name, report) {
  const info = await render(page)
  assert.equal(info.error,0); assert.equal(info.contextLosses,0)
  await page.waitForTimeout(70)
  await page.screenshot({path:path.join(out, `${name}.png`)})
  report.captures[name] = info
}
async function closeCamera(page, view) {
  await page.evaluate(async view => {
    const {PerspectiveCamera,Vector3} = await import('/node_modules/three/build/three.module.js')
    const {sampleDryGardenGroundWorldY:h} = await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const c = new PerspectiveCamera(48,1440/900,0.025,180)
    if(view.local) {
      const root=window.__gardenReview.scene.getObjectByName('garden-pavilion-residence')
      c.position.copy(root.localToWorld(new Vector3(...view.from)))
      c.lookAt(root.localToWorld(new Vector3(...view.to)))
    } else {
      c.position.set(view.from[0],h(...view.from,'desktop')+view.height,view.from[1])
      c.lookAt(view.to[0],h(...view.to,'desktop')+0.5,view.to[1])
    }
    window.__studyCamera=c
  }, view)
}
async function applyVariant(page, config) {
  await page.evaluate(async config => {
    const {LANTERN_ANCHORS,lanternBaseY} = await import('/src/world/nightGarden/GardenLanternNetwork.ts')
    const r=window.__gardenReview, root=r.scene.getObjectByName('garden-path-lanterns'), lights=[]
    root.traverse(o=>{if(o.isPointLight)lights.push(o)})
    const indices=[0,11,12,3,4,6,9]
    lights.forEach((l,i)=>{
      const a=indices[i], [x,z]=LANTERN_ANCHORS[a]
      l.parent.scale.setScalar(1)
      l.parent.position.set(x,lanternBaseY(a,'desktop'),z)
      l.position.set(i===5?config.offset:i===6?-config.offset:0,config.height[i],0)
      l.intensity=config.intensity[i];l.distance=config.range[i];l.decay=2
    })
    const landing=r.scene.getObjectByName('pavilion-covered-landing'), hall=r.scene.getObjectByName('pavilion-hall-spill')
    const [li,lr,ly,lz]=config.landing
    landing.intensity=li;landing.distance=lr;landing.position.set(0,ly,lz)
    const [hi,hr,hy,hz,ty,tz]=config.hall
    hall.intensity=hi;hall.distance=hr;hall.position.set(0,hy,hz);hall.target.position.set(0,ty,tz)
    hall.angle=0.9;hall.penumbra=0.85
  },config)
}
async function layers(page, mode) {
  await page.evaluate(mode=>{
    const r=window.__gardenReview
    const pool=r.scene.getObjectByName('garden-lantern-ground-pools')
    if(pool)pool.visible=false
    for(const name of ['garden-lantern-local-halos','pavilion-local-shoji-glow'])r.scene.getObjectByName(name).visible=['D','E'].includes(mode)
    const garden=window.__experience.world.nightGarden
    garden.practicalBounce?.setIntensity(mode==='B'?0:garden.visibility)
  },mode)
}
async function benchmark(page) {
  return page.evaluate(async()=>{
    const r=window.__gardenReview,c=window.__studyCamera,samples=[],intervals=[]
    let last=0
    for(let i=0;i<70;i++){
      const now=await new Promise(requestAnimationFrame)
      if(i>=10)intervals.push(now-last)
      last=now
      const t=performance.now();r.renderer.render(r.scene,c);r.renderer.getContext().finish()
      if(i>=10)samples.push(performance.now()-t)
    }
    const sorted=[...samples].sort((a,b)=>a-b), mean=samples.reduce((a,b)=>a+b)/samples.length
    return {frames:samples.length,meanRenderMs:mean,p50RenderMs:sorted[30],p95RenderMs:sorted[57],renderThroughputFPS:1000/mean,
      observedRafFPS:1000/(intervals.reduce((a,b)=>a+b)/intervals.length),
      method:'60 warmed render+gl.finish samples plus observed rAF cadence in headless Chrome; not physical-device FPS'}
  })
}
async function main(){
 await fs.mkdir(out,{recursive:true})
 const browser=await chromium.launch({headless:true,channel:'chrome'})
 const page=await browser.newPage({viewport:{width:1440,height:900}})
 const report={stage,variants:stage==='sweep'?variants:undefined,captures:{},errors:[]}
 const baseline=stage==='after'?JSON.parse(await fs.readFile('docs/reviews/phase-3k67/before/report.json','utf8')):null
 page.on('pageerror',e=>report.errors.push(e.message))
 page.on('console',m=>{if(m.type()==='error'||(m.type()==='warning'&&/shader|webgl/i.test(m.text())))report.errors.push(m.text())})
 try{
  await attach(page)
  await page.addInitScript(()=>{window.gardenContextLosses=0;document.addEventListener('webglcontextlost',()=>window.gardenContextLosses++,true)})
  await page.goto('http://127.0.0.1:5174/?debug=1')
  await page.waitForFunction(()=>window.__gardenReview)
  await page.addStyleTag({content:'.debug-panel{visibility:hidden}'})
  for(const [layout,width,height,progresses] of [['desktop',1440,900,[.2,.4,.6,.8,1]],['tablet',820,1180,[.6,1]],['portrait',390,844,[.6,1]]]){
   if(stage==='sweep'&&layout!=='desktop')continue
   await page.evaluate(()=>{window.__practicalHold=false})
   await page.setViewportSize({width,height})
   for(const progress of progresses){
    if(stage==='sweep'&&progress!==.6)continue
    await page.evaluate(p=>{window.__practicalHold=false;scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(.68+.32*p))},progress)
    await page.waitForFunction(p=>{const d=[...document.querySelectorAll('.debug-panel dt')].find(d=>d.textContent==='Phase 3 local');return d&&Math.abs(Number(d.nextElementSibling.textContent)-p)<.0006},progress)
    await page.waitForTimeout(120)
    await hold(page)
    if(baseline)await page.evaluate(saved=>{
      const c=window.__studyCamera;c.position.fromArray(saved.position);c.quaternion.fromArray(saved.quaternion)
      c.projectionMatrix.fromArray(saved.projection);c.projectionMatrixInverse.copy(c.projectionMatrix).invert()
    },baseline.captures[`${layout}-${progress*100}-A`].camera)
    if(stage==='sweep'){
     for(const [name,cfg] of Object.entries(variants)){await applyVariant(page,cfg);await layers(page,'B');await capture(page,`${layout}-${progress*100}-${name}`,report)}
    }else if(stage==='after'&&layout==='desktop'){
     for(const mode of ['B','C','D','E']){await layers(page,mode);await capture(page,`${layout}-${progress*100}-${mode}`,report)}
    }else await capture(page,`${layout}-${progress*100}-${stage==='before'?'A':'E'}`,report)
    if(layout==='desktop'&&progress===.6)report.benchmark=await benchmark(page)
   }
  }
  await page.evaluate(()=>{window.__practicalHold=false})
  await page.setViewportSize({width:1440,height:900})
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight))
  await page.waitForTimeout(400);await hold(page)
  for(const view of views){
   await closeCamera(page,view)
   if(stage==='sweep'){
    for(const [name,cfg] of Object.entries(variants)){await applyVariant(page,cfg);await layers(page,'B');await capture(page,`closeup-${view.name}-${name}`,report)}
   }else if(stage==='after'){
    for(const mode of ['B','C','D','E']){await layers(page,mode);await capture(page,`closeup-${view.name}-${mode}`,report)}
   }else await capture(page,`closeup-${view.name}-A`,report)
  }
  if(stage==='after')await require('./review-practical-validation.cjs').validate(page,out,report)
  assert.deepEqual(report.errors,[])
 }finally{
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')
  await browser.close()
 }
 console.log(JSON.stringify({stage,captures:Object.keys(report.captures).length,errors:report.errors,benchmark:report.benchmark}))
}
main().catch(e=>{console.error(e);process.exitCode=1})
