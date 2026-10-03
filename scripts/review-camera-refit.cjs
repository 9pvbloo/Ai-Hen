// Review-only runtime instrumentation. No diagnostic code enters the app bundle.
const {chromium}=require('playwright')
const fs=require('node:fs/promises'),assert=require('node:assert/strict')
const stage=process.env.CAMERA_STAGE||'before',dir='docs/reviews/phase-3k69',raw=`logs/phase-3k69/${stage}`
async function main(){
 await fs.mkdir(dir,{recursive:true});await fs.mkdir(raw,{recursive:true})
 const browser=await chromium.launch({headless:true,channel:'chrome'}),report={stage,errors:[],layouts:{}}
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}})
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||/shader|webgl/i.test(m.text())&&m.type()==='warning')report.errors.push(m.text())})
  await page.route('**/src/core/Experience.ts*',async route=>{const response=await route.fetch(),source=await response.text(),needle='this.frame = null;';assert(source.includes(needle));await route.fulfill({response,body:source.replace(needle,needle+' window.__e=this; if(window.__hold){this.requestFrame();return;}')})})
  await page.addInitScript(()=>{window.__losses=0;document.addEventListener('webglcontextlost',()=>window.__losses++,true)})
  await page.goto('http://127.0.0.1:5174/?debug=1');await page.waitForFunction(()=>window.__e?.world.shanshui.loadState==='ready');await page.addStyleTag({content:'.debug-panel{display:none!important}'})
  await page.evaluate(()=>{
   window.__hold=true
   window.__pose=(p,reduced=false)=>{const e=window.__e,g=.68+.32*p;const scroll={reducedMotion:reduced,rawProgress:g,smoothProgress:g,getRangeProgress:({start,end})=>Math.max(0,Math.min(1,(g-start)/(end-start)))};e.world.update(0,scroll);e.camera.instance.updateMatrixWorld();e.renderer.instance.render(e.scene,e.camera.instance)}
  })
  if(process.env.CAMERA_VALIDATE_ONLY){report.validation=await require('./validate-camera-refit.cjs').validate(page);return}
  for(const [layout,width,height] of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
   await page.setViewportSize({width,height});await page.waitForFunction(({width,height})=>window.__e.viewport.width===width&&window.__e.viewport.height===height,{width,height})
   report.layouts[layout]=await page.evaluate(async()=>{
    const e=window.__e,c=e.camera.instance,r=e.renderer.instance,g=e.world.nightGarden
    const {sampleDryGardenGroundWorldY:h}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const {GARDEN_ROUTE}=await import('/src/world/nightGarden/GardenApproach.ts')
    window.__pose(1);const mesh=e.scene.getObjectByName('garden-beveled-wet-paving'),p=mesh.geometry.getAttribute('position')
    const stones=GARDEN_ROUTE.map((_,i)=>{const j=i*49+48,x=p.getX(j),y=p.getY(j),z=p.getZ(j);return {index:i,x,y,z,rotation:i>17?-.035:-.18+Math.sin(i*1.6)*.22}})
    stones.forEach((s,i)=>s.nextSegmentDistance=i+1<stones.length?Math.hypot(s.x-stones[i+1].x,s.y-stones[i+1].y,s.z-stones[i+1].z):null)
    const samples=[],pose=g.cameraPath.createPose()
    for(let i=0;i<=200;i++){const progress=i/200;window.__pose(progress);g.cameraPath.sample(g.cameraPath.getTravelProgress(progress,false),pose,false);samples.push({progress,position:c.position.toArray(),target:g.cameraPose.target.toArray(),quaternion:c.quaternion.toArray(),pathPosition:pose.position.toArray(),pathTarget:pose.target.toArray(),ground:h(c.position.x,c.position.z,g.layoutId),calls:r.info.render.calls,triangles:r.info.render.triangles})}
    const mansion=e.scene.getObjectByName('garden-pavilion-residence');const {Vector3}=await import('/node_modules/three/build/three.module.js')
    const anchor=(x,y,z)=>mansion.localToWorld(new Vector3(x,y,z)).toArray()
    return {layout:g.layoutId,stones,samples,fov:c.fov,near:c.near,far:c.far,threshold:anchor(0,2.78,-.1),doorCenter:anchor(0,3.975,-.1),firstStairFront:anchor(0,1.98,9.30),outerEntry:anchor(0,2.775,5.75),mansionMatrix:mansion.matrixWorld.toArray(),resources:{textures:r.info.memory.textures,geometries:r.info.memory.geometries,programs:r.info.programs.length},error:r.getContext().getError(),losses:window.__losses}
   })
   for(const percent of (layout==='desktop'?[0,10,20,30,40,50,60,70,80,90,95,100]:[0,20,40,60,80,90,95,100])){
    await page.evaluate(p=>window.__pose(p),percent/100);await page.screenshot({path:`${raw}/${layout}-${percent}.png`})
   }
  }
  if(stage==='after')report.validation=await require('./validate-camera-refit.cjs').validate(page)
  await page.setViewportSize({width:960,height:600});await page.waitForTimeout(150)
  const video=await page.evaluate(async()=>{
   window.__pose(0);const canvas=window.__e.renderer.instance.domElement,stream=canvas.captureStream(30),chunks=[]
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:2500000})
   const done=new Promise(resolve=>recorder.onstop=async()=>{const blob=new Blob(chunks,{type:'video/webm'}),reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob)})
   recorder.ondataavailable=e=>chunks.push(e.data);recorder.start()
   const start=performance.now();await new Promise(resolve=>{function tick(t){const p=Math.min(1,(t-start)/24000);window.__pose(p);if(p<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})
   recorder.stop();stream.getTracks().forEach(t=>t.stop());return done
  });await fs.writeFile(`${dir}/${stage}-walk.webm`,Buffer.from(video,'base64'))
  assert.deepEqual(report.errors,[]);for(const l of Object.values(report.layouts)){assert.equal(l.error,0);assert.equal(l.losses,0)}
 }finally{await fs.writeFile(`${dir}/${process.env.CAMERA_VALIDATE_ONLY?'validation-only':stage}.json`,JSON.stringify(report,null,2)+'\n');await browser.close()}
 console.log(JSON.stringify({stage,layouts:Object.keys(report.layouts),errors:report.errors,validation:report.validation},(k,v)=>k==='samples'?undefined:v))
}
main().catch(e=>{console.error(e);process.exitCode=1})
