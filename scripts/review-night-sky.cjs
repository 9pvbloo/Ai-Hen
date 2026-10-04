// Numeric browser validation only. No screenshots, video or repository report artifacts.
const {chromium}=require('playwright'),fs=require('node:fs/promises'),assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path')
const {execFileSync}=require('node:child_process'),ts=require('typescript')
const stage=process.env.SKY_STAGE||'after',dir=process.env.SKY_REPORT_DIR||path.join(os.tmpdir(),'ai-hen-night-sky-validation')
async function main(){
 const browser=await chromium.launch({headless:true,channel:'chrome'})
 const report={stage,errors:[],layouts:{}}
 const baseline=stage==='after'?await fs.readFile(`${dir}/before.json`,'utf8').then(JSON.parse).catch(()=>null):null
 try{
  const page=await browser.newPage()
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
  if(process.env.SKY_ORIGINAL){
   // Read-only baseline diagnosis in the browser; never restore or edit working files.
   await page.route(/\/src\/world\/nightGarden\/(GardenBackground|GardenAtmosphere|NightGarden)\.ts(?:\?.*)?$/,async route=>{
    const file=new URL(route.request().url()).pathname.slice(1)
    const source=execFileSync('git',['show',`a6a1b7d:${file}`],{encoding:'utf8'})
    const body=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
     .replace(/from ['"]three['"]/g,"from '/node_modules/.vite/deps/three.js'")
     .replace(/from (['"])(\.[^'"]+)\1/g,(_,quote,url)=>`from ${quote}${url}.ts${quote}`)
     .replaceAll('import.meta.env.BASE_URL',JSON.stringify('/'))
    await route.fulfill({status:200,contentType:'application/javascript',body})
   })
  }
  await page.route('**/src/core/Experience.ts*',async route=>{
   const response=await route.fetch(),source=await response.text(),needle='this.frame = null;';assert(source.includes(needle))
   await route.fulfill({response,body:source.replace(needle,needle+' window.__e=this; if(window.__hold){this.requestFrame();return;}')})
  })
  await page.goto(process.env.SKY_URL||'http://127.0.0.1:5174/')
  await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
  await page.evaluate(async()=>{
   await window.__e.world.nightGarden.background.ready;window.__hold=true
   window.__pose=(g,reduced=false)=>{const e=window.__e;e.world.update(0,{reducedMotion:reduced,rawProgress:g,smoothProgress:g,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))});e.camera.instance.updateMatrixWorld();e.renderer.render(e.scene,e.camera.instance)}
  })
  for(const [layout,width,height] of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
   report.layouts[layout]=await page.evaluate(async()=>{
    const e=window.__e,r=e.renderer.instance,moon=e.scene.getObjectByName('garden-pearl-moon-disc'),samples=[]
    const {Vector3}=await import('/node_modules/three/build/three.module.js')
    for(const g of [.55,.60,.625,.642,.65,.6675,.70,.7312,.76,.85,1]){
     window.__pose(g);const c=e.camera.instance,center=moon.getWorldPosition(new Vector3()),edge=center.clone().add(new Vector3(moon.scale.x,0,0));center.project(c);edge.project(c)
     const lights=[];e.scene.traverseVisible(o=>{if(o.isLight)lights.push([o.type,o.intensity])})
     samples.push({g,position:c.position.toArray(),quaternion:c.quaternion.toArray(),fov:c.fov,lights,owner:e.world.cameraOwner,fog:e.scene.fog.density,moonCenter:center.toArray(),moonWidth:(edge.x-center.x),calls:r.info.render.calls,triangles:r.info.render.triangles})
    }
    let finite=true;e.scene.traverse(o=>{finite&&=o.matrixWorld.elements.every(Number.isFinite);if(o.geometry)for(const attr of Object.values(o.geometry.attributes))finite&&=Array.from(attr.array).every(Number.isFinite)})
    const resources=[];for(let j=0;j<3;j++){for(const g of [.60,.65,.7312,1,.7312,.65])window.__pose(g);resources.push({...r.info.memory,programs:r.info.programs.length})}
    let reverseError=0;for(const s of [...samples].reverse()){window.__pose(s.g);reverseError=Math.max(reverseError,...e.camera.instance.position.toArray().map((n,i)=>Math.abs(n-s.position[i])))}
    let reducedError=0;for(const s of samples){window.__pose(s.g,true);reducedError=Math.max(reducedError,...e.camera.instance.position.toArray().map((n,i)=>Math.abs(n-s.position[i])))}
    window.__pose(.6675)
    return {samples,finite,resources,reverseError,reducedError,error:r.getContext().getError(),contextLost:r.getContext().isContextLost()}
   })
   const v=report.layouts[layout];assert(v.finite);assert.equal(v.reverseError,0);assert.equal(v.error,0);assert.equal(v.contextLost,false);assert.deepEqual(v.resources[0],v.resources[2])
   if(baseline){
    const base=baseline.layouts[layout];assert.equal(v.reducedError,base.reducedError)
    for(let i=0;i<v.samples.length;i++)for(const field of ['g','position','quaternion','fov','lights','owner','fog'])assert.deepEqual(v.samples[i][field],base.samples[i][field],`${layout}: frozen ${field}`)
   }
  }
  await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>window.__e.viewport.width===1440)
  report.resize=await page.evaluate(()=>{window.__pose(.6675);const e=window.__e;return {position:e.camera.instance.position.toArray(),moon:e.scene.getObjectByName('garden-pearl-moon-disc').position.toArray(),resources:{...e.renderer.instance.info.memory}}})
  assert.deepEqual(report.resize.position,report.layouts.desktop.samples.find(s=>s.g===.6675).position)
  report.aperture=await page.evaluate(async()=>{
   const e=window.__e,r=e.renderer.instance,gl=r.getContext(),{Vector3}=await import('/node_modules/three/build/three.module.js')
   window.__pose(.55)
   const garden=e.world.nightGarden.root,background=e.world.nightGarden.background.root
   const saved=[...e.scene.children,...garden.children].map(o=>[o,o.visible])
   for(const o of e.scene.children)o.visible=o===garden
   for(const o of garden.children)o.visible=o===background
   e.world.nightGarden.background.setVisibility?.(1);e.renderer.render(e.scene,e.camera.instance)
   const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,a=new Uint8Array(width*height*4),b=new Uint8Array(a.length)
   gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,a)
   background.visible=false;e.renderer.render(e.scene,e.camera.instance)
   gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,b);background.visible=true
   const opening=e.world.nightGarden.aperture.opening.value,c=e.camera.instance,ray=new Vector3();let outside=0,changedOutside=0,changedInside=0
   for(let y=1;y<height;y+=3)for(let x=1;x<width;x+=3){
    ray.set((x+.5)/width*2-1,(y+.5)/height*2-1,.5).unproject(c).sub(c.position)
    const t=(opening.z-c.position.z)/ray.z,dx=c.position.x+t*ray.x-opening.x,dy=c.position.y+t*ray.y-opening.y
    const isOutside=dx*dx+dy*dy>(opening.w+.04)**2,i=(y*width+x)*4,changed=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>1
    if(isOutside){outside++;if(changed)changedOutside++}else if(changed)changedInside++
   }
   for(const [o,visible] of saved)o.visible=visible
   window.__pose(.6675);return {outside,changedOutside,changedInside}
  })
  assert.equal(report.aperture.changedOutside,0);assert(report.aperture.outside>1000);assert(report.aperture.changedInside>1000)
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__e.scroll.reducedMotion)
  report.mediaReducedMotion=await page.evaluate(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!window.__e.scroll.reducedMotion)
  if(stage==='after'){
   report.ownership=await page.evaluate(async()=>{
    const {Group}=await import('/node_modules/three/build/three.module.js')
    const {GardenMoon}=await import('/src/world/nightGarden/GardenMoon.ts')
    const {GardenNightSky}=await import('/src/world/nightGarden/GardenNightSky.ts')
    const {GardenAtmosphere}=await import('/src/world/nightGarden/GardenAtmosphere.ts')
    const {NightSkyState}=await import('/src/world/nightGarden/NightSkyState.ts')
    const root=new Group(),state=new NightSkyState(),sky=new GardenNightSky(root,state),moon=new GardenMoon(root,state),haze=new GardenAtmosphere(root,state)
    const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)})
    let geoDisposals=0,materialDisposals=0,shared=true
    for(const g of geometries)g.addEventListener('dispose',()=>geoDisposals++)
    for(const m of materials){m.addEventListener('dispose',()=>materialDisposals++);shared&&=m.uniforms.uMoonPosition===state.uniforms.uMoonPosition}
    sky.dispose();moon.dispose();haze.dispose()
    return {geometries:geometries.size,materials:materials.size,geoDisposals,materialDisposals,shared,children:root.children.length}
   })
   assert.deepEqual(report.ownership,{geometries:4,materials:7,geoDisposals:4,materialDisposals:7,shared:true,children:0})
  }
  await page.evaluate(()=>{const r=window.__e.renderer.instance;window.__restored=false;r.domElement.addEventListener('webglcontextrestored',()=>window.__restored=true,{once:true});r.forceContextLoss()})
  await page.waitForFunction(()=>window.__e.renderer.instance.getContext().isContextLost())
  await page.evaluate(()=>window.__e.renderer.instance.forceContextRestore());await page.waitForFunction(()=>window.__restored)
  report.contextRestore=await page.evaluate(()=>{for(const g of [0,.3,.55,.65,.7312,1,.6675])window.__pose(g);const r=window.__e.renderer.instance;return {error:r.getContext().getError(),lost:r.getContext().isContextLost(),resources:{...r.info.memory},programs:r.info.programs.length}})
  assert.equal(report.contextRestore.error,0);assert.equal(report.contextRestore.lost,false);assert.deepEqual(report.contextRestore.resources,report.resize.resources)
  report.disposal=await page.evaluate(async()=>{const e=window.__e,r=e.renderer.instance,steps=[];for(const [name,o] of Object.entries(e.world.nightGarden).concat(Object.entries(e.world))){if(o&&typeof o.dispose==='function'&&o!==e.world){const original=o.dispose.bind(o);o.dispose=()=>{original();steps.push({name,error:r.getContext().getError()})}}}e.world.dispose();await new Promise(resolve=>setTimeout(resolve,50));e.renderer.render(e.scene,e.camera.instance);return {...r.info.memory,programs:r.info.programs.length,steps,error:r.getContext().getError()}})
  assert.equal(report.disposal.geometries,0);assert.equal(report.disposal.programs,0);assert.deepEqual(report.errors,[])
  if(stage==='after'){
   const recoveryBase=await fs.readFile(`${dir}/recovery-baseline.json`,'utf8').then(JSON.parse).catch(()=>null)
   if(recoveryBase){
    assert.deepEqual(report.disposal,recoveryBase.disposal,'post-context-loss cleanup regression')
    report.knownRecoveryCleanupError=report.disposal.error
   }else assert.equal(report.disposal.error,0,'diagnose cleanup against SKY_ORIGINAL before accepting any error')
  }
  // Fresh-context teardown distinguishes normal lifecycle from the baseline forced-loss issue.
  await page.reload();await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready')
  report.normalDisposal=await page.evaluate(async()=>{
   const e=window.__e,r=e.renderer.instance;await e.world.nightGarden.background.ready;window.__hold=true
   const g=.7312;e.world.update(0,{reducedMotion:true,rawProgress:g,smoothProgress:g,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))})
   e.renderer.render(e.scene,e.camera.instance);const renderError=r.getContext().getError()
   e.world.dispose();await new Promise(resolve=>setTimeout(resolve,50));e.renderer.render(e.scene,e.camera.instance)
   return {...r.info.memory,programs:r.info.programs.length,renderError,error:r.getContext().getError()}
  })
  assert.equal(report.normalDisposal.geometries,0);assert.equal(report.normalDisposal.programs,0);assert.equal(report.normalDisposal.renderError,0);assert.equal(report.normalDisposal.error,0);assert.deepEqual(report.errors,[])
 }finally{await fs.mkdir(dir,{recursive:true});await fs.writeFile(`${dir}/${stage}.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
