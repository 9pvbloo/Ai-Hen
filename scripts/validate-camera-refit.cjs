const assert=require('node:assert/strict'),fs=require('node:fs/promises')
exports.validate=async(page)=>{
 const result={layouts:[],scroll:[]},before=JSON.parse(await fs.readFile('docs/reviews/phase-3k69/before.json','utf8'))
 for(const [layout,width,height] of [['desktop',1440,900],['tablet',820,1180],['portrait',390,844]]){
  await page.setViewportSize({width,height});await page.waitForFunction(({width,height})=>window.__e.viewport.width===width&&window.__e.viewport.height===height,{width,height})
  result.layouts.push(await page.evaluate(async({layout,old})=>{
   const {Vector3,Matrix4,Box3,Triangle}=await import('/node_modules/three/build/three.module.js')
   const {GARDEN_ROUTE}=await import('/src/world/nightGarden/GardenApproach.ts')
   const e=window.__e,c=e.camera.instance,path=e.world.nightGarden.cameraPath,check=(x,m)=>{if(!x)throw Error(m)}
   window.__pose(1);e.scene.updateMatrixWorld(true)
   const arrival=path.getArrival(),root=e.scene.getObjectByName('garden-pavilion-residence')
   check(arrival.threshold.distanceTo(root.localToWorld(new Vector3(0,2.78,-.1)))<1e-8,'threshold mismatch')
   const stones=e.scene.getObjectByName('garden-beveled-wet-paving').geometry.getAttribute('position')
   GARDEN_ROUTE.forEach(([x,z],i)=>check(Math.hypot(stones.getX(i*49+48)-x-(i<18?Math.sin(i*2.4)*.11:0),stones.getZ(i*49+48)-z)<.000003,'stone source drift'))
   const candidates=[],matrix=new Matrix4(),v=new Vector3()
   const corridor=new Box3(new Vector3(-6.2,-4.2,-44),new Vector3(5,1,25))
   for(const name of ['night-garden','moon-gate'])e.scene.getObjectByName(name).traverse(o=>{
    if(!o.isMesh||!o.geometry.getAttribute('position'))return
    // Disabled or distance-faded hybrid cards and light halos are not solid surfaces.
    // The surviving tree-line card's close-range opacity is checked below.
    if(o.name.startsWith('hybrid-')||o.material?.transparent&&o.material.opacity<=.001||/halo|glow|bounce|mist/i.test(o.name))return
    let visible=true;for(let a=o;a&&a!==e.scene;a=a.parent)visible&&=a.visible
    if(!visible)return
    const geometry=o.geometry;geometry.computeBoundingBox()
    for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
     if(o.isInstancedMesh){o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld)}else matrix.copy(o.matrixWorld)
     const box=geometry.boundingBox.clone().applyMatrix4(matrix)
     if(!box.intersectsBox(corridor))continue
     candidates.push({name:o.name||o.parent.name,index:i,box,matrix:matrix.clone(),geometry,triangles:null})
    }
   })
   const tri=new Triangle(),closest=new Vector3()
   const distance=(point)=>{
    let nearest=Infinity,who=''
    for(const a of candidates){
     if(a.box.distanceToPoint(point)>=nearest)continue
     if(!a.triangles){const p=a.geometry.getAttribute('position'),idx=a.geometry.index,n=idx?idx.count:p.count;a.triangles=[]
      for(let j=0;j<n;j+=3){const t=[];for(let k=0;k<3;k++)t.push(new Vector3().fromBufferAttribute(p,idx?idx.getX(j+k):j+k).applyMatrix4(a.matrix));a.triangles.push(t)}
     }
     for(const t of a.triangles){tri.set(...t);tri.closestPointToPoint(point,closest);const d=point.distanceTo(closest);if(d<nearest){nearest=d;who=a.name+':'+a.index}}
    }
    return {distance:nearest,obstacle:who}
   }
   const samples=[],forward=[],nearRadius=c.near*Math.sqrt(1+Math.tan(c.fov*Math.PI/360)**2*(1+c.aspect*c.aspect))
   let minimum={distance:Infinity},minimumOwned={distance:Infinity}
   for(let i=0;i<=200;i++){
    const p=i/200;window.__pose(p);const values=[...c.position.toArray(),...c.quaternion.toArray(),...e.world.nightGarden.cameraPose.target.toArray()];check(values.every(Number.isFinite),'non finite camera');forward.push(values)
    if(e.world.nightGarden.hybridTreeLineDistance<1)check(e.world.nightGarden.hybridTreeLineOpacity<.00001,'visible close hybrid card')
    const d=distance(c.position),row={progress:p,...d,nearPlaneSphereClearance:d.distance-nearRadius};samples.push(row)
    if(d.distance<minimum.distance)minimum=row;if(p>=.16&&d.distance<minimumOwned.distance)minimumOwned=row
   }
   for(let i=200;i>=0;i--){window.__pose(i/200);check([...c.position.toArray(),...c.quaternion.toArray(),...e.world.nightGarden.cameraPose.target.toArray()].every((n,j)=>Math.abs(n-forward[i][j])<1e-10),'reverse drift')}
   // Denser sampling where the inherited camera crosses the gate fastest.
   let handoffMinimum={distance:Infinity},handoffSegmentMargin=Infinity,previousPosition=null
   for(let i=0;i<=320;i++){const p=i*.0005;window.__pose(p);const d=distance(c.position);if(d.distance<handoffMinimum.distance)handoffMinimum={progress:p,...d};if(previousPosition)handoffSegmentMargin=Math.min(handoffSegmentMargin,d.distance-nearRadius-c.position.distanceTo(previousPosition));previousPosition=c.position.clone()}
   check(handoffSegmentMargin>0,'dense handoff corridor margin')
   let reducedDelta=0;for(let i=32;i<=200;i++){window.__pose(i/200,true);reducedDelta=Math.max(reducedDelta,...c.position.toArray().map((n,j)=>Math.abs(n-forward[i][j])))}
   check(reducedDelta<1e-8,'reduced motion left physical route')
   const pose=path.createPose();const start=performance.now();for(let i=0;i<20000;i++)path.sample(path.getTravelProgress((i%1001)/1000,false),pose);const cpuUs=(performance.now()-start)*1000/20000
   const controls=path.positionCurve.points.map(p=>p.toArray()),targets=path.targetCurve.points.map(p=>p.toArray())
   const gpu=[];for(const i of [40,120,200]){const a=old.samples[i];window.__pose(a.progress);c.position.fromArray(a.position);c.quaternion.fromArray(a.quaternion);c.updateMatrixWorld();e.renderer.instance.render(e.scene,c);gpu.push({progress:a.progress,before:{calls:a.calls,triangles:a.triangles},after:{calls:e.renderer.instance.info.render.calls,triangles:e.renderer.instance.info.render.triangles}})}
   check(minimumOwned.distance>nearRadius+.05,'near-plane corridor intersects solid geometry')
   check(minimum.distance>nearRadius,'handoff near-plane corridor intersects solid geometry')
   check(gpu.every(v=>v.before.calls===v.after.calls&&v.before.triangles===v.after.triangles),'same-pose GPU complexity changed')
   return {layout,clearancePass:true,handoffMinimum,handoffSegmentMargin,arrival:{position:arrival.position.toArray(),target:arrival.target.toArray(),quaternion:arrival.quaternion.toArray(),threshold:arrival.threshold.toArray(),remainingDistance:arrival.remainingDistance,progress:arrival.progress},minimum,minimumOwned,nearRadius,samples,controls,targets,reverse:true,reducedDelta,cpuUs,gpu}
  },{layout,old:before.layouts[layout]}))
 }
 // Resize preserves the physical route; only macro ground differs across frozen layouts.
 result.resize=[]
 for(const p of [.2,.5,.85,1]){const poses=[];for(const [w,h] of [[1440,900],[820,1180],[390,844],[1440,900]]){await page.setViewportSize({width:w,height:h});await page.waitForFunction(({w,h})=>window.__e.viewport.width===w&&window.__e.viewport.height===h,{w,h});poses.push(await page.evaluate(p=>{window.__pose(p);return window.__e.camera.instance.position.toArray()},p))}result.resize.push({progress:p,poses});assert.deepEqual(poses[0],poses[3])}
 // Real ScrollDirector: settled hold, slow/normal traversal, reverse and a fast jump.
 await page.evaluate(()=>{window.__hold=false;scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*.68)})
 await page.waitForTimeout(1400)
 for(const [label,end,duration] of [['slow',.30,2400],['normal',.75,900],['fast',1,0],['reverse',0,900]]){
  result.scroll.push(await page.evaluate(async({label,end,duration})=>{
   const e=window.__e,start=e.world.nightGarden.progress,t0=performance.now(),samples=[]
   await new Promise(resolve=>{function tick(t){const u=duration?Math.min(1,(t-t0)/duration):1;scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(.68+.32*(start+(end-start)*u)));samples.push({p:e.world.nightGarden.progress,position:e.camera.instance.position.toArray(),q:e.camera.instance.quaternion.toArray()});if(u<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})
   for(let i=0;i<100;i++){await new Promise(requestAnimationFrame);samples.push({p:e.world.nightGarden.progress,position:e.camera.instance.position.toArray(),q:e.camera.instance.quaternion.toArray()})}
   return {label,start,end,samples}
  },{label,end,duration}))
 }
 await page.evaluate(()=>window.__hold=true)
 for(const run of result.scroll){assert(run.samples.every(s=>s.position.concat(s.q).every(Number.isFinite)));assert(run.samples.every(s=>s.p>=Math.min(run.start,run.end)-.001&&s.p<=Math.max(run.start,run.end)+.001));assert(Math.abs(run.samples.at(-1).p-run.end)<.002)}
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{window.__hold=false;scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(.68+.32*.6))});await page.waitForFunction(()=>Math.abs(window.__e.world.nightGarden.progress-.6)<.002)
 result.reducedMedia=await page.evaluate(async()=>{const e=window.__e,a=e.camera.instance.position.toArray();await new Promise(resolve=>setTimeout(resolve,250));return {enabled:e.scroll.reducedMotion,progress:e.world.nightGarden.progress,stable:a.every((v,i)=>v===e.camera.instance.position.toArray()[i])}})
 assert(result.reducedMedia.enabled&&result.reducedMedia.stable);await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>window.__hold=true)
 return result
}
