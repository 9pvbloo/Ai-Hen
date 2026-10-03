// Review-only camera and per-source ablations. No diagnostics enter production.
const {chromium}=require('playwright')
const fs=require('node:fs/promises')
const path=require('node:path')
const assert=require('node:assert/strict')
const stage=process.env.LANTERN_STAGE||'before'
const out='logs/lantern-coverage/raw'
const archive='docs/reviews/lantern-coverage'
async function main(){
 await fs.mkdir(path.join(out,stage),{recursive:true})
 await fs.mkdir(path.join(archive,stage),{recursive:true})
 const only=process.env.LANTERN_ONLY?Number(process.env.LANTERN_ONLY)-1:null
 const report=only===null?{stage,captures:{},errors:[],budgets:{}}:JSON.parse(await fs.readFile(path.join(out,stage,'report.json'),'utf8'))
 const baseline=stage==='after'?JSON.parse(await fs.readFile(path.join(out,'before/report.json'),'utf8')):null
 const browser=await chromium.launch({headless:true,channel:'chrome'})
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}})
  page.on('pageerror',e=>report.errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error'||(m.type()==='warning'&&/shader|webgl/i.test(m.text())))report.errors.push(m.text())})
  await page.addInitScript(()=>{window.__losses=0;Object.defineProperty(window,'gardenContextLosses',{get:()=>window.__losses});document.addEventListener('webglcontextlost',()=>window.__losses++,true)})
  if(process.env.LANTERN_BASELINE==='1')await page.route('**/src/world/nightGarden/GardenPavilionLighting.ts*',async route=>{
   const response=await route.fetch(),current=await response.text(),ts=require('typescript'),{execFileSync}=require('node:child_process')
   const three=current.match(/from ["']([^"']*\/three\.js[^"']*)["']/)?.[1]||'/node_modules/three/build/three.module.js'
   const source=execFileSync('git',['show','f1699b5:src/world/nightGarden/GardenPavilionLighting.ts'],{encoding:'utf8'})
   const body=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from (["'])three\1/g,`from '${three}'`)
   await route.fulfill({response,body})
  })
  await page.route('**/src/core/Experience.ts*',async route=>{
   const response=await route.fetch(),source=await response.text(),needle='this.frame = null;'
   assert(source.includes(needle))
   await route.fulfill({response,body:source.replace(needle,needle+' window.__e=this; if(window.__hold){this.renderer.instance.render(this.scene,window.__camera||this.camera.instance);this.requestFrame();return;}')})
  })
  // Inject 15 independently switchable weights into the actual receiver shader.
  await page.route('**/src/world/nightGarden/GardenPracticalBounce.ts*',async route=>{
   const response=await route.fetch();let source=await response.text();const needle='material.needsUpdate = true;'
   if(process.env.LANTERN_BASELINE==='1'){
    const ts=require('typescript'),{execFileSync}=require('node:child_process')
    source=ts.transpileModule(execFileSync('git',['show','f1699b5:src/world/nightGarden/GardenPracticalBounce.ts'],{encoding:'utf8'}),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'./GardenLanternNetwork'","'./GardenLanternNetwork.ts'")
   }
   assert(source.includes(needle))
   const hook=`const reviewCompile=material.onBeforeCompile;
    material.onBeforeCompile=(shader,renderer)=>{
     reviewCompile.call(material,shader,renderer);
     window.__weights=window.__weights||{value:Array(15).fill(1)};
     shader.uniforms.uReviewWeights=window.__weights;
     window.__receiverUniforms=shader.uniforms;
     shader.fragmentShader=shader.fragmentShader.replace('uniform float uPracticalBounce;', 'uniform float uPracticalBounce; uniform float uReviewWeights[15];');
     let index=0;
     shader.fragmentShader=shader.fragmentShader.replace(/bounce = max\\(bounce, gardenBouncePatch[^;]+;/g,line=>line.replace('));', ') * uReviewWeights['+(index++)+']);'));
     if(index!==15)throw new Error('Expected 15 receiver fields, got '+index);
    };`
   await route.fulfill({response,body:source.replace(needle,hook+needle)})
  })
  await page.goto('http://127.0.0.1:5174/?debug=1');await page.waitForFunction(()=>window.__e)
  await page.addStyleTag({content:'.debug-panel{visibility:hidden}'})
  const capture=async name=>{
   if(baseline?.captures[name])await page.evaluate(saved=>{
    const c=window.__camera;c.position.fromArray(saved.position);c.quaternion.fromArray(saved.quaternion);c.projectionMatrix.fromArray(saved.projection);c.projectionMatrixInverse.copy(c.projectionMatrix).invert()
   },baseline.captures[name].camera)
   await page.waitForTimeout(90)
   const info=await page.evaluate(()=>{
    const e=window.__e,r=e.renderer.instance,c=window.__camera;
    r.render(e.scene,c);const lights=[];e.scene.getObjectByName('night-garden').traverse(o=>{if(o.isLight)lights.push({type:o.type,name:o.name,intensity:o.intensity,shadow:o.castShadow})})
    return {calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,lights,
     camera:{position:c.position.toArray(),quaternion:c.quaternion.toArray(),projection:c.projectionMatrix.toArray()},
     error:r.getContext().getError(),losses:window.__losses}
   })
   assert.equal(info.error,0);assert.equal(info.losses,0)
   await page.screenshot({path:path.join(out,stage,name+'.png')});report.captures[name]=info
  }
  for(const [layout,width,height] of only===null?[['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]:[]){
   await page.evaluate(()=>window.__hold=false);await page.setViewportSize({width,height})
   for(const progress of [.2,.4,.6,.8,1]){
    await page.evaluate(p=>{window.__hold=false;scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(.68+.32*p))},progress)
    await page.waitForFunction(p=>Math.abs(window.__e.world.nightGarden.progress-p)<.0006,progress)
    await page.waitForTimeout(180)
    if(progress===.6)report.budgets[layout]=await page.evaluate(async()=>{
     let last=await new Promise(requestAnimationFrame);const samples=[];
     for(let i=0;i<105;i++){const t=await new Promise(requestAnimationFrame);if(i>=15)samples.push(t-last);last=t}
     const r=window.__e.renderer.instance,sorted=[...samples].sort((a,b)=>a-b)
     const lights=[];window.__e.scene.getObjectByName('night-garden').traverse(o=>{if(o.isLight)lights.push(o)})
     return {fps:1000/(samples.reduce((a,b)=>a+b)/samples.length),p95Ms:sorted[85],calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,
      geometries:r.info.memory.geometries,programs:r.info.programs.length,
      pointLights:lights.filter(l=>l.isPointLight).length,spotLights:lights.filter(l=>l.isSpotLight).length,contributingLights:lights.filter(l=>l.intensity>0).length,samples}
    })
    await page.evaluate(()=>{window.__hold=true;window.__camera=window.__e.camera.instance.clone()})
    await capture(`${layout}-${progress*100}`)
   }
  }
  await page.evaluate(()=>window.__hold=false);await page.setViewportSize({width:1440,height:900})
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForFunction(()=>window.__e.world.nightGarden.progress>.9999)
  await page.evaluate(()=>window.__hold=true)
  for(let i=0;i<15;i++){
   if(only!==null&&only!==i)continue
   const inventory=await page.evaluate(async i=>{
    const {PerspectiveCamera,Vector3}=await import('/node_modules/three/build/three.module.js')
    const {LANTERN_ANCHORS,LANTERN_LIGHT_ZONES,lanternBaseY}=await import('/src/world/nightGarden/GardenLanternNetwork.ts')
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const [x,z,scale]=LANTERN_ANCHORS[i],c=new PerspectiveCamera(48,1.6,.025,180)
    // Rear-right fixture is occluded by a hero rock from the generic diagonal.
    const dx=i===10?-.8:i>=5&&i<11?(x<0?3.3:-3.3):2.6
    const dz=i===10?1.4:3.8
    c.position.set(x+dx,h(x+dx,z+dz,'desktop')+(i===10?1.1:2.5),z+dz);c.lookAt(x,h(x,z,'desktop')+.12,z);c.updateMatrixWorld();window.__camera=c
    const lights=[];window.__e.scene.getObjectByName('garden-path-lanterns').traverse(o=>{if(o.isPointLight)lights.push(o)})
    window.__sourceLight=lights[LANTERN_LIGHT_ZONES.findIndex(l=>l.anchor===i)]||null
    window.__sourceIntensity=window.__sourceLight?.intensity
    const project=p=>{const v=new Vector3(...p).project(c);return [(v.x*.5+.5)*1440,(-v.y*.5+.5)*900]}
    return {index:i+1,anchor:[x,z],scale,realLight:LANTERN_LIGHT_ZONES.find(l=>l.anchor===i)||null,
     fixturePixels:[project([x,lanternBaseY(i,'desktop'),z]),project([x,lanternBaseY(i,'desktop')+1.6*scale,z])],
     baseY:lanternBaseY(i,'desktop')}
   },i)
   report.inventory??=[];report.inventory[i]=inventory
   const name=`lantern-${String(i+1).padStart(2,'0')}`
   await capture(name)
   await page.evaluate(i=>{window.__weights.value[i]=0;if(window.__sourceLight)window.__sourceLight.intensity=0},i)
   await capture(name+'-off')
   await page.evaluate(i=>{window.__weights.value[i]=1;if(window.__sourceLight)window.__sourceLight.intensity=window.__sourceIntensity},i)
  }
  // Existing exterior control cameras detect boundary leaks independently of interiors.
  for(const [name,from,to] of only===null?[['left-rear',[-16,-29],[-11.7,-32.1]],['right-rear',[17,-35],[12.5,-39]],['genkan',[3,-38.5],[3,-47]]]:[]){
   await page.evaluate(async({from,to})=>{
    const {PerspectiveCamera}=await import('/node_modules/three/build/three.module.js')
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const c=new PerspectiveCamera(48,1.6,.025,180);c.position.set(from[0],h(...from,'desktop')+2.2,from[1]);c.lookAt(to[0],h(...to,'desktop')+.5,to[1]);window.__camera=c
   },{from,to});await capture(name)
  }
  if(only===null){
   report.darkProbes=await page.evaluate(async()=>{
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    return {coldGravelWorld:[2,h(2,-23,'desktop'),-23]}
   })
   // Reuse the established practical-light health, layer-ablation and coherence review.
   await page.evaluate(()=>{
    const e=window.__e;window.__experience=e
    window.__gardenReview={renderer:e.renderer.instance,scene:e.scene,camera:e.camera.instance}
    Object.defineProperty(window,'__studyCamera',{configurable:true,get:()=>window.__camera,set:c=>window.__camera=c})
    Object.defineProperty(window,'__practicalHold',{configurable:true,get:()=>window.__hold,set:v=>window.__hold=v})
   })
   const practical={captures:{'desktop-60-E':report.captures['desktop-60']}}
   await require('./review-practical-validation.cjs').validate(page,path.join(out,stage),practical)
   delete practical.captures;report.practicalValidation=practical
   report.receiverUniformHealth=await page.evaluate(()=>{
    let checked=0
    for(const {value} of Object.values(window.__receiverUniforms)){
     const values=typeof value==='number'?[value]:Array.isArray(value)||ArrayBuffer.isView(value)?Array.from(value):value?.isVector2||value?.isVector3||value?.isVector4||value?.isMatrix3||value?.isMatrix4?value.toArray():[]
     for(const v of values)if(typeof v==='number'){if(!Number.isFinite(v))throw new Error('Non-finite receiver uniform');checked++}
    }
    return {finite:true,checked}
   })
  }
  assert.deepEqual(report.errors,[])
 }finally{
  const json=JSON.stringify(report,null,2)+'\n'
  await fs.writeFile(path.join(out,stage,'report.json'),json)
  await fs.writeFile(path.join(archive,stage,'report.json'),json)
  await browser.close()
 }
 console.log(JSON.stringify({stage,captures:Object.keys(report.captures).length,errors:report.errors,budgets:report.budgets},(k,v)=>k==='samples'?undefined:v))
}
main().catch(e=>{console.error(e);process.exitCode=1})
