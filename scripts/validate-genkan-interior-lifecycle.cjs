const assert=require('node:assert/strict')
module.exports=async function validateLifecycle(page){
 const layouts=[['desktop',1440,900],['tablet',820,1180],['portrait',390,844]],stable={}
 for(let cycle=0;cycle<4;cycle++)for(const [name,width,height]of layouts){
  await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
  const value=await page.evaluate(()=>{window.__pose(1,1,1);const e=window.__e,r=e.renderer.instance;return {pose:e.camera.instance.position.toArray(),memory:{...r.info.memory},programs:r.info.programs.length,error:r.getContext().getError()}})
  assert.equal(value.error,0);if(cycle>1)assert.deepEqual(value,stable[name],'resize drift');else if(cycle===1)stable[name]=value
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__e.scroll.reducedMotion)
 await page.evaluate(()=>{window.__hold=false;window.__e.requestFrame()})
 const native={}
 for(const [name,width,height]of layouts){
  await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
  native[name]=[]
  for(const fraction of [0,.5,1,1.15,1.3,1.5,1.7,1.5,1.3,1.15,1,0]){
   const expected=await page.evaluate(f=>{const threshold=document.querySelector('#genkan-scroll').offsetHeight,interior=document.querySelector('#genkan-interior-scroll').offsetHeight,total=document.documentElement.scrollHeight-innerHeight,original=total-threshold-interior;const y=Math.min(total,Math.round(original*f));window.scrollTo(0,y);return {raw:Math.min(1,y/original),threshold:Math.max(0,Math.min(1,(y-original)/threshold)),interior:Math.max(0,Math.min(1,(y-original-threshold)/interior))}},fraction)
   await page.waitForFunction(v=>{const s=window.__e.scroll;return Math.abs(s.rawProgress-v.raw)<1e-5&&Math.abs(s.continuationProgress-v.threshold)<1e-5&&Math.abs(s.interiorProgress-v.interior)<1e-5},expected)
   await page.waitForFunction(()=>window.__e.frame===null)
   const actual=await page.evaluate(()=>({door:window.__e.world.nightGarden.pavilion.doors.progress,owner:window.__e.world.cameraOwner,interior:window.__e.scroll.interiorProgress}))
   if(expected.interior>0){assert.equal(actual.door,1);assert.equal(actual.owner,'genkan-interior')}
   if(expected.threshold===0)assert.equal(actual.door,0)
   native[name].push(actual)
  }
 }
 const lifecycle=await page.evaluate(()=>{
  const e=window.__e,r=e.renderer.instance,check=(v,m)=>{if(!v)throw Error(m)},before={...r.info.memory}
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))
  check(e.frame===null&&!e.scroll.trigger.enabled,'hidden pause')
  delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));check(e.scroll.trigger.enabled,'visible resume')
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));check(e.frame===null&&!e.disposed,'bfcache pause')
  window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));check(e.scroll.trigger.enabled,'bfcache resume')
  check(JSON.stringify(before)===JSON.stringify(r.info.memory),'visibility allocation')
  return {hiddenPause:true,visibleResume:true,bfcache:true}
 })
 await page.waitForFunction(()=>window.__e.frame===null)
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!window.__e.scroll.reducedMotion&&window.__e.frame!==null)
 for(const end of [true,false,true,false]){
  await page.evaluate(end=>window.scrollTo(0,end?document.documentElement.scrollHeight:0),end)
  try{await page.waitForFunction(end=>{const e=window.__e;return end?Math.abs(e.scroll.interiorProgress-1)<1e-8&&e.world.nightGarden.pavilion.doors.progress===1:e.scroll.smoothProgress===0&&e.world.nightGarden.pavilion.doors.progress===0},end)}
  catch(error){throw Error('native normal scroll failed '+JSON.stringify(await page.evaluate(()=>({hold:window.__hold,hidden:document.hidden,raw:window.__e.scroll.raw,smooth:window.__e.scroll.smooth,threshold:window.__e.scroll.continuationProgress,interior:window.__e.scroll.interiorProgress,frame:window.__e.frame,door:window.__e.world.nightGarden.pavilion.doors.progress,enabled:window.__e.scroll.trigger.enabled})))+': '+error.message)}
 }
 const cleanup=await page.evaluate(()=>{
  const e=window.__e,r=e.renderer.instance;e.stopFrames();e.world.dispose();e.scene.clear();r.render(e.scene,e.camera.instance)
  const result={memory:{...r.info.memory},programs:r.info.programs.length,error:r.getContext().getError()};e.dispose();e.dispose();return {...result,stopped:e.frame===null,killed:!e.scroll.trigger.enabled}
 })
 assert.equal(cleanup.memory.geometries,0);assert.equal(cleanup.programs,0);assert.equal(cleanup.error,0);assert(cleanup.stopped&&cleanup.killed)
 // Same retained texture count reproduced against e0d49f2's GPU owners in Phase 2.2.
 assert.equal(cleanup.memory.textures,4)
 return {stable,native,lifecycle,cleanup}
}
