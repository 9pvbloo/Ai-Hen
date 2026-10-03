const path = require('node:path')
const assert = require('node:assert/strict')

exports.validate = async (page, output, report) => {
  report.health = await page.evaluate(() => {
    const r=window.__gardenReview, root=r.scene.getObjectByName('night-garden')
    const check=(v,msg)=>{if(!v)throw new Error(msg)}
    let attributes=0,matrices=0,uniforms=0,points=0,spots=0
    const geometries=new Set(), materials=new Set()
    root.traverse(o=>{
      for(const v of o.matrixWorld.elements)check(Number.isFinite(v),'non-finite transform')
      matrices++
      if(o.isPointLight||o.isSpotLight){
        o.isPointLight?points++:spots++
        check(o.distance>0&&Number.isFinite(o.distance),'unbounded practical')
        check(Number.isFinite(o.intensity)&&o.intensity>=0&&o.decay===2&&!o.castShadow,'invalid light')
        check(o.position.toArray().every(Number.isFinite),'non-finite light position')
      }
      if(o.geometry)geometries.add(o.geometry)
      if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)
      if(o.instanceMatrix)for(const v of o.instanceMatrix.array)check(Number.isFinite(v),'non-finite instance')
    })
    for(const g of geometries)for(const a of Object.values(g.attributes))for(const v of a.array){check(Number.isFinite(v),'non-finite geometry');attributes++}
    for(const m of materials)for(const u of Object.values(m.uniforms||{})){
      if(typeof u.value==='number'){check(Number.isFinite(u.value),'non-finite uniform');uniforms++}
    }
    check(points===9&&spots===2,'light budget changed')
    check(!root.getObjectByName('garden-lantern-ground-pools'),'overlay pool still exists')
    const ground=root.getObjectByName('garden-contoured-ground'),rake=root.getObjectByName('garden-physical-rake-relief')
    check(ground.material===rake.material,'rake does not share receiver lighting')
    check(root.getObjectByName('garden-lantern-paper-chambers').count===15,'fixture count changed')
    return {points,spots,attributes,matrices,uniforms,finite:true,overlays:0,sharedGroundRakeLighting:true,fixtures:15}
  })
  // Same production checkpoint; isolate actual radiance, not an artist-painted mask.
  const saved=report.captures['desktop-60-E'].camera
  await page.evaluate(saved=>{
    const r=window.__gardenReview,c=window.__studyCamera
    c.position.fromArray(saved.position);c.quaternion.fromArray(saved.quaternion)
    c.projectionMatrix.fromArray(saved.projection);c.projectionMatrixInverse.copy(c.projectionMatrix).invert()
    window.__savedPracticalLights=[]
    r.scene.getObjectByName('night-garden').traverse(o=>{if(o.isPointLight||o.isSpotLight)window.__savedPracticalLights.push([o,o.visible])})
    for(const name of ['garden-lantern-local-halos','pavilion-local-shoji-glow'])r.scene.getObjectByName(name).visible=false
  },saved)
  for(const mode of ['base','real','bounce']){
    await page.evaluate(mode=>{
      const r=window.__gardenReview
      for(const [o] of window.__savedPracticalLights)o.visible=mode==='real'
      window.__experience.world.nightGarden.practicalBounce.setIntensity(mode==='bounce'?1:0)
      r.renderer.render(r.scene,window.__studyCamera)
    },mode)
    await page.waitForTimeout(80)
    await page.screenshot({path:path.join(output,`debug-${mode}.png`)})
  }
  await page.evaluate(()=>{
    const r=window.__gardenReview
    for(const [o,visible] of window.__savedPracticalLights)o.visible=visible
    for(const name of ['garden-lantern-local-halos','pavilion-local-shoji-glow'])r.scene.getObjectByName(name).visible=true
    window.__practicalHold=false
  })
  report.reducedMotion=[]
  for(const [layout,width,height] of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'})
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(250)
    const health=await page.evaluate(()=>{
      const r=window.__gardenReview
      return {error:r.renderer.getContext().getError(),contextLosses:window.gardenContextLosses,reduced:window.__experience.scroll.reducedMotion}
    })
    assert.deepEqual(health,{error:0,contextLosses:0,reduced:true})
    report.reducedMotion.push({layout,...health})
    await page.screenshot({path:path.join(output,`${layout}-reduced-100.png`)})
  }
  // Ground/stone contact and physical field coherence reuse the existing geometry review.
  report.coherence=await require('./verify-rake-coherence.cjs').verify(page)
  report.health.finalError=await page.evaluate(()=>window.__gardenReview.renderer.getContext().getError())
  assert.equal(report.health.finalError,0)
}
