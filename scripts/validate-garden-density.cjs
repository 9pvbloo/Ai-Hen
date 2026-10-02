const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises')
exports.validate=async(page,out,report)=>{
 report.validation=await page.evaluate(async()=>{
  const {Group,Matrix4,Vector3}=await import('/node_modules/three/build/three.module.js')
  const {GardenLateralDepth}=await import('/src/world/nightGarden/GardenLateralDepth.ts')
  const {sampleDryGardenGroundWorldY:h,sampleDryGardenGround}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
  const {gardenRouteDistance}=await import('/src/world/nightGarden/GardenApproach.ts')
  const {LANTERN_ANCHORS}=await import('/src/world/nightGarden/GardenLanternNetwork.ts')
  const e=window.__e,root=e.scene.getObjectByName('garden-lateral-depth'),check=(v,msg)=>{if(!v)throw new Error(msg)}
  const m=new Matrix4(),v=new Vector3(),layouts=[]
  for(const layout of ['desktop','tablet','portrait']){
   e.world.nightGarden.lateralDepth.setLayout(layout)
   const geometrySet=new Set(),materialSet=new Set(),data=root.userData.composition
   let values=0,instanceCount=0,minRoute=Infinity,minLantern=Infinity,rockMinContact=Infinity,rockMaxContact=-Infinity
   root.traverse(o=>{
    if(o.geometry)geometrySet.add(o.geometry)
    if(o.material)materialSet.add(o.material)
    for(const n of o.matrixWorld.elements)check(Number.isFinite(n),'non-finite world matrix')
    if(o.isInstancedMesh){
     instanceCount+=o.count
     const p=o.geometry.getAttribute('position')
     for(let i=0;i<o.count;i++){
      o.getMatrixAt(i,m);for(const n of m.elements)check(Number.isFinite(n),'non-finite instance')
      let bottom=Infinity
      for(let j=0;j<p.count;j++){
       v.fromBufferAttribute(p,j).applyMatrix4(m)
       if(j%5===0)minRoute=Math.min(minRoute,gardenRouteDistance(v.x,v.z))
       bottom=Math.min(bottom,v.y-h(v.x,v.z,layout))
       if(o.name.includes('understory'))minLantern=Math.min(minLantern,...LANTERN_ANCHORS.map(([x,z])=>Math.hypot(v.x-x,v.z-z)))
      }
      if(o.name.includes('companion-rocks')){rockMinContact=Math.min(rockMinContact,bottom);rockMaxContact=Math.max(rockMaxContact,bottom);check(bottom<0,'floating companion rock')}
      if(o.name.includes('wood'))check(bottom<0,'floating tree root')
      if(o.name.includes('understory'))check(bottom<.05,'floating understory')
     }
    }
   })
   for(const g of geometrySet)for(const a of Object.values(g.attributes))for(const n of a.array){check(Number.isFinite(n),'non-finite geometry');values++}
   for(const a of data.trees)check(Math.abs(a.y-h(a.x,a.z,layout)+.06)<1e-6,'tree datum drift')
   const moss=root.getObjectByName('garden-depth-moss-cushions').geometry,p=moss.getAttribute('position'),normal=moss.getAttribute('normal')
   let mossMaxHeight=-Infinity,mossMinGravel=Infinity,mossMinLantern=Infinity
   for(const j of new Set(moss.index.array)){
    const x=p.getX(j),z=p.getZ(j),d=p.getY(j)-h(x,z,layout)
    mossMaxHeight=Math.max(mossMaxHeight,d);mossMinGravel=Math.min(mossMinGravel,sampleDryGardenGround(x,z,layout).gravelDistance)
    mossMinLantern=Math.min(mossMinLantern,...LANTERN_ANCHORS.map(([lx,lz])=>Math.hypot(lx-x,lz-z)))
    check(d>=-.026&&d<=.106,'moss contact envelope');check(normal.getY(j)>0,'inverted moss face')
   }
   check(mossMinGravel>.099,'moss crosses approved gravel');check(mossMinLantern>.899,'moss masks lantern pool');check(minRoute>2,'new geometry enters walk clearance')
   const snapshot=()=>{const result=[];root.traverse(o=>{if(o.isInstancedMesh)result.push(...o.instanceMatrix.array.slice(0,o.count*16));if(o.name==='garden-depth-moss-cushions')result.push(...o.geometry.getAttribute('position').array)});return result}
   const first=snapshot();e.world.nightGarden.lateralDepth.setLayout(layout==='desktop'?'portrait':'desktop');e.world.nightGarden.lateralDepth.setLayout(layout)
   const second=snapshot();check(first.length===second.length&&first.every((n,i)=>n===second[i]),'non-deterministic placement')
   layouts.push({layout,trees:data.trees.length,clusters:data.clusters.length,shrubs:data.clusters.length*2,rocks:data.clusters.length,mossPatches:data.clusters.length,
    layers:['foreground','midground','background'].map(layer=>({layer,trees:data.trees.filter(a=>a.layer===layer).length,clusters:data.clusters.filter(a=>a.layer===layer).length})),
    gpuInstances:instanceCount,finiteValues:values,minRoute,minUnderstoryLanternDistance:minLantern,rockMinContact,rockMaxContact,mossMaxHeight,mossMinGravel,mossMinLantern,deterministic:true})
  }
  e.world.nightGarden.lateralDepth.setLayout('desktop')
  // Exercise disposal of a separate instance. Shared materials/textures must survive.
  const parent=new Group(),materials=e.world.nightGarden.vegetation.sharedMaterials,rock=e.scene.getObjectByName('garden-flat-rock-archetypes').material
  const probe=new GardenLateralDepth(parent,materials.foliage,materials.wood,rock);probe.setLayout('desktop')
  let geoDisposals=0,meshDisposals=0,borrowedDisposals=0,mossDisposals=0
  const geometries=new Set();parent.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.isInstancedMesh)o.addEventListener('dispose',()=>meshDisposals++);if(o.name==='garden-depth-moss-cushions')o.material.addEventListener('dispose',()=>mossDisposals++)})
  for(const g of geometries)g.addEventListener('dispose',()=>geoDisposals++)
  const onBorrowed=()=>borrowedDisposals++;for(const mat of [materials.foliage,materials.wood,rock])mat.addEventListener('dispose',onBorrowed)
  probe.dispose();for(const mat of [materials.foliage,materials.wood,rock])mat.removeEventListener('dispose',onBorrowed)
  check(geoDisposals===7&&meshDisposals===6&&mossDisposals===1&&borrowedDisposals===0&&parent.children.length===0,'resource ownership/disposal')
  return {layouts,disposal:{geoDisposals,meshDisposals,mossDisposals,borrowedDisposals},error:e.renderer.instance.getContext().getError(),losses:window.__losses}
 })
 assert.equal(report.validation.error,0);assert.equal(report.validation.losses,0)
 // Review-only depth palette: real geometry and depth test, unlit colors by layer.
 await page.evaluate(async saved=>{
  const {MeshBasicMaterial,Color}=await import('/node_modules/three/build/three.module.js')
  const c=window.__camera;c.position.fromArray(saved.position);c.quaternion.fromArray(saved.quaternion);c.projectionMatrix.fromArray(saved.projection);c.projectionMatrixInverse.copy(c.projectionMatrix).invert()
  const root=window.__e.scene.getObjectByName('garden-lateral-depth'),data=root.userData.composition
  const palette={foreground:'#e9aa57',midground:'#52d3b2',background:'#6173e4'}
  window.__depthDebug=[]
  root.traverse(o=>{
   if(!o.isMesh)return
   window.__depthDebug.push([o,o.material,o.instanceColor?.clone()])
   o.material=new MeshBasicMaterial({color:o.isInstancedMesh?'white':'#6a9565',map:o.material.map,alphaTest:o.material.alphaTest,side:o.material.side})
   if(o.isInstancedMesh){
    const records=o.name.includes('background')?data.trees.filter(a=>a.layer==='background'):o.name.includes('secondary')?data.trees.filter(a=>a.layer!=='background'):o.name.includes('understory')?data.clusters.flatMap(a=>[a,a]):data.clusters
    records.forEach((a,i)=>o.setColorAt(i,new Color(palette[a.layer])));o.instanceColor.needsUpdate=true
   }
  })
 },report.captures['desktop-20'].camera)
 await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'depth-diagnostic.png')})
 await page.evaluate(()=>{for(const [o,material,colors] of window.__depthDebug){o.material.dispose();o.material=material;if(colors){o.instanceColor=colors;o.instanceColor.needsUpdate=true}}})
 // Compare every approved diagnostic lantern view with only the new layers toggled.
 const lanterns=JSON.parse(await fs.readFile('docs/reviews/lantern-coverage/after/report.json','utf8'))
 report.lanternViews=[]
 for(let i=0;i<15;i++){
  const name=`lantern-${String(i+1).padStart(2,'0')}`,saved=lanterns.captures[name].camera
  const box=await page.evaluate(async({saved,i})=>{
   const {Vector3}=await import('/node_modules/three/build/three.module.js')
   const {LANTERN_ANCHORS,lanternBaseY}=await import('/src/world/nightGarden/GardenLanternNetwork.ts')
   const c=window.__camera;c.position.fromArray(saved.position);c.quaternion.fromArray(saved.quaternion);c.projectionMatrix.fromArray(saved.projection);c.projectionMatrixInverse.copy(c.projectionMatrix).invert();c.updateMatrixWorld()
   const [x,z,s]=LANTERN_ANCHORS[i],base=lanternBaseY(i,'desktop'),points=[]
   for(const dx of [-.25,.25])for(const dz of [-.22,.22])for(const y of [.36,.88]){const p=new Vector3(x+dx*s,base+y*s,z+dz*s).project(c);points.push([(p.x*.5+.5)*1440,(-p.y*.5+.5)*900])}
   return [Math.floor(Math.min(...points.map(p=>p[0]))),Math.floor(Math.min(...points.map(p=>p[1]))),Math.ceil(Math.max(...points.map(p=>p[0]))),Math.ceil(Math.max(...points.map(p=>p[1])))]
  },{saved,i})
  for(const mode of ['baseline','density']){
   await page.evaluate(mode=>window.__e.scene.getObjectByName('garden-lateral-depth').visible=mode==='density',mode)
   await page.waitForTimeout(70);await page.screenshot({path:path.join(out,`${name}-${mode}.png`)})
  }
  report.lanternViews.push({id:i+1,box})
 }
}
