const assert=require('node:assert/strict')
module.exports=async function validateLifecycle(page,baseline=false){
 const layouts=[['desktop',1440,900],['tablet',820,1180],['portrait',390,844]],stable={},native={}
 // First cycle warms view-dependent GPU uploads; compare the following three cycles.
 for(let cycle=0;cycle<4;cycle++)for(const [name,width,height]of layouts){
  await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
  const value=await page.evaluate(()=>{window.__pose(1,1);const e=window.__e,r=e.renderer.instance;return {pose:e.camera.instance.position.toArray(),memory:{...r.info.memory},programs:r.info.programs.length,error:r.getContext().getError()}})
  assert.equal(value.error,0);if(cycle>1)assert.deepEqual(value,stable[name],'resize resources or pose drift');else if(cycle===1)stable[name]=value
 }
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.waitForFunction(()=>window.__e.scroll.reducedMotion)
 await page.evaluate(()=>{window.__hold=false;window.__e.requestFrame()})
 for(const [name,width,height]of layouts){
  await page.setViewportSize({width,height});await page.waitForFunction(w=>window.__e.viewport.width===w,width)
  native[name]=[]
  for(const fraction of [0,.5,1,1.15,1.3,1,0]){
   const expected=await page.evaluate(f=>{const extension=document.querySelector('#genkan-scroll').offsetHeight,total=document.documentElement.scrollHeight-innerHeight,old=total-extension;const y=Math.min(total,Math.round(old*f));window.scrollTo(0,y);return {y,raw:Math.min(1,y/old),continuation:Math.max(0,(y-old)/extension)}},fraction)
   await page.waitForFunction(v=>Math.abs(window.__e.scroll.rawProgress-v.raw)<.00001&&Math.abs(window.__e.scroll.continuationProgress-v.continuation)<.00001,expected)
   await page.waitForFunction(()=>window.__e.frame===null)
   const actual=await page.evaluate(()=>({progress:window.__e.scroll.rawProgress,continuation:window.__e.scroll.continuationProgress,door:window.__e.world.nightGarden.pavilion.doors?.progress}))
   if(!baseline&&expected.continuation===0)assert.equal(actual.door,0)
   if(!baseline&&expected.continuation>.999)assert.equal(actual.door,1)
   native[name].push(actual)
  }
 }
 const lifecycle=await page.evaluate(()=>{
  const e=window.__e,r=e.renderer.instance,check=(v,m)=>{if(!v)throw Error(m)},before={...r.info.memory}
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))
  check(e.frame===null&&!e.scroll.trigger.enabled,'hidden did not pause')
  delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))
  check(e.scroll.trigger.enabled,'visible did not resume')
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}))
  check(e.frame===null&&!e.disposed&&!e.scroll.trigger.enabled,'bfcache pause invalid')
  window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))
  check(e.scroll.trigger.enabled&&!e.disposed,'bfcache resume invalid')
  check(JSON.stringify(before)===JSON.stringify(r.info.memory),'lifecycle resources changed')
  return {hiddenPause:true,visibleResume:true,bfcacheResume:true}
 })
 await page.waitForFunction(()=>window.__e.frame===null)
 await page.emulateMedia({reducedMotion:'no-preference'})
 await page.waitForFunction(()=>!window.__e.scroll.reducedMotion&&window.__e.frame!==null)
 const cleanup=await page.evaluate(()=>{
  const e=window.__e,r=e.renderer.instance;e.stopFrames();e.world.dispose();e.scene.clear();r.render(e.scene,e.camera.instance)
  const memory={...r.info.memory},programs=r.info.programs.length,error=r.getContext().getError();e.dispose();e.dispose()
  return {memory,programs,error,stopped:e.frame===null,triggerKilled:!e.scroll.trigger.enabled}
 })
 assert.equal(cleanup.memory.geometries,0);assert.equal(cleanup.programs,0);assert.equal(cleanup.error,0);assert(cleanup.stopped&&cleanup.triggerKilled)
 // Compare against historical GPU owners under this same resize/scroll lifecycle sequence.
 if(!baseline)assert.equal(cleanup.memory.textures,require('./genkan-baseline.json').lifecycleTextures)
 return {stable,native,lifecycle,cleanup}
}
