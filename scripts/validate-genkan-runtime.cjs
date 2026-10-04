// Runs inside the instrumented Vite page; no production debug hooks or captured media.
module.exports=async function validateGenkan(){
 const {Matrix4,Vector3,Group,Raycaster}=await import('/node_modules/.vite/deps/three.js')
 const {GenkanDoorSystem}=await import('/src/world/nightGarden/GenkanDoorSystem.ts')
 const e=window.__e,w=e.world.nightGarden,p=w.pavilion,d=p.doors,root=p.entranceRoot,r=e.renderer.instance
 const check=(value,message)=>{if(!value)throw Error(message)}
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
 const snapshot=()=>[...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray(),...d.paper.instanceMatrix.array,...d.timber.instanceMatrix.array,...p.glow.mesh.instanceMatrix.array]
 const box=(mesh,i)=>{const m=new Matrix4();mesh.getMatrixAt(i,m);const a=m.elements;return {mesh,i,min:[a[12]-Math.abs(a[0])/2,a[13]-Math.abs(a[5])/2,a[14]-Math.abs(a[10])/2],max:[a[12]+Math.abs(a[0])/2,a[13]+Math.abs(a[5])/2,a[14]+Math.abs(a[10])/2]}}
 const boxes=[];root.traverse(m=>{if(m.isInstancedMesh&&m.geometry.type==='BoxGeometry'&&m.parent!==d.root)for(let i=0;i<m.count;i++)boxes.push(box(m,i))})
 const moving=()=>[...d.timberParts.map((v,i)=>({...box(d.timber,i),leaf:v.leaf})),...d.paperParts.map((v,i)=>({...box(d.paper,i),leaf:v.leaf}))]
 const overlaps=(a,b)=>a.min.every((v,k)=>Math.min(a.max[k],b.max[k])-Math.max(v,b.min[k])>1e-6)
 const distance=(v,b)=>Math.hypot(...v.toArray().map((x,k)=>Math.max(b.min[k]-x,0,x-b.max[k])))
 const closedOther=Array.from(p.glow.mesh.instanceMatrix.array.slice(64)),states=[],collisions=[]
 p.setDoorProgress(0);const version=d.paper.instanceMatrix.version;p.setDoorProgress(0)
 check(version===d.paper.instanceMatrix.version,'unchanged progress uploads matrices')
 for(const mesh of [d.paper,d.timber])check(mesh.material.opacity===1&&!mesh.material.transparent,'leaves must remain opaque')
 for(let i=0;i<=200;i++){
  p.setDoorProgress(i/200);const leaves=moving()
  for(let a=0;a<leaves.length;a++){
   for(let b=a+1;b<leaves.length;b++)if(leaves[a].leaf!==leaves[b].leaf&&overlaps(leaves[a],leaves[b]))collisions.push(['leaf',i,a,b])
   for(const fixed of boxes)if(overlaps(leaves[a],fixed))collisions.push([fixed.mesh.name,i,a,fixed.i])
  }
  if(i%50===0)states.push(Array.from(d.offsets))
  for(let j=0;j<4;j++){
   const paper=d.paper.instanceMatrix.array,glow=p.glow.mesh.instanceMatrix.array
   check(Math.abs(paper[j*16+12]-glow[j*16+12])<1e-6,'glow X detached')
   check(Math.abs(glow[j*16+14]-paper[j*16+14]-.0305)<1e-6,'glow Z detached')
  }
  check(same(closedOther,Array.from(p.glow.mesh.instanceMatrix.array.slice(64))),'room glow moved')
 }
 check(collisions.length===0,'moving joinery intersections: '+JSON.stringify(collisions.slice(0,10))+' fixed '+JSON.stringify([...new Set(collisions.map(c=>c[0]+':'+c[3]))].map(id=>{const b=boxes.find(b=>b.mesh.name+':'+b.i===id);return b&&{id,min:b.min,max:b.max}})))
 const forward=[],previous=new Vector3(),local=new Vector3(),pose={position:new Vector3(),target:new Vector3()}
 let length=0,leafClearance=Infinity,structureClearance=Infinity,architectureClearance=Infinity,writes=0,maxWrites=0
 const setPose=e.camera.setPose;e.camera.setPose=function(...args){writes++;return setPose.apply(this,args)}
 try{
  for(let i=0;i<=400;i++){
   writes=0;window.__pose(1,i/400,false,false);maxWrites=Math.max(maxWrites,writes);check(writes===1,'multiple camera owners')
   check(e.camera.instance.fov===45,'FOV changed');const point=e.camera.instance.position
   if(i)length+=previous.distanceTo(point);previous.copy(point)
   root.worldToLocal(local.copy(point));for(const b of moving())leafClearance=Math.min(leafClearance,distance(local,b))
   for(const b of boxes){architectureClearance=Math.min(architectureClearance,distance(local,b));if(/structure/i.test(b.mesh.name))structureClearance=Math.min(structureClearance,distance(local,b))}
   forward.push(snapshot());check(forward[i].every(Number.isFinite),'nonfinite transform')
  }
  const finalPosition=e.camera.instance.position.toArray();w.genkanPath.sample(1,pose);const finalTarget=pose.target.toArray()
  for(let i=400;i>=0;i--){window.__pose(1,i/400,false,false);check(same(snapshot(),forward[i]),'reverse drift '+i);window.__pose(1,i/400,true,false);check(same(snapshot(),forward[i]),'reduced pose differs '+i)}
  w.genkanPath.sample(0,pose);const arrival=w.cameraPath.getArrival()
  check(pose.position.distanceTo(arrival.position)<1e-12&&pose.target.distanceTo(arrival.target)<1e-12,'arrival discontinuity')
  const nearRadius=e.camera.instance.near*Math.hypot(1,Math.tan(Math.PI/8),Math.tan(Math.PI/8)*e.camera.instance.aspect)
  check(leafClearance>nearRadius&&architectureClearance>nearRadius,'camera clearance below near plane envelope')
  // Closed opaque paper remains solid; opening rays hit the enclosing recess after OPEN.
  p.setDoorProgress(1);root.updateWorldMatrix(true,true)
  const ray=new Raycaster(),direction=new Vector3(0,0,-1).transformDirection(root.matrixWorld)
  let backHits=0
  for(const x of [-.95,0,.95])for(const y of [3,3.9,4.9]){
   ray.set(root.localToWorld(new Vector3(x,y,-.65)),direction)
   const hits=ray.intersectObject(root,true).filter(hit=>!hit.object.material.transparent)
   check(hits.length>0&&hits[0].distance<3.2,'placeholder background leak');backHits++
  }
  // Continuous floor support from covered deck across the sill into the recess.
  for(let i=0;i<=100;i++){
   const z=2.5-i*.06
   check(boxes.some(b=>b.min[0]<=0&&b.max[0]>=0&&b.min[2]<=z&&b.max[2]>=z&&b.max[1]>=2.7&&b.max[1]<=2.8),'threshold floor gap at '+z)
   if(z<.14)check(boxes.filter(b=>b.min[0]<0&&b.max[0]>0&&b.min[2]<z&&b.max[2]>z&&Math.abs(b.max[1]-2.78)<1e-6).length===1,'coplanar threshold surfaces at '+z)
  }
  // Disposal must release exactly owned GPU resources, never borrowed materials.
  const probe=new GenkanDoorSystem(new Group(),p.materials),disposed={geometry:0,mesh:0,material:0}
  probe.geometry.addEventListener('dispose',()=>disposed.geometry++)
  for(const mesh of [probe.timber,probe.paper])mesh.addEventListener('dispose',()=>disposed.mesh++)
  const onMaterial=()=>disposed.material++
  for(const material of [p.materials.structure,p.materials.wallEntry])material.addEventListener('dispose',onMaterial)
  probe.setProgress(1);probe.dispose();probe.dispose()
  for(const material of [p.materials.structure,p.materials.wallEntry])material.removeEventListener('dispose',onMaterial)
  check(same(disposed,{geometry:1,mesh:2,material:0}),'resource ownership incorrect')
  window.__pose(1,1)
  return {states,length,leafClearance,structureClearance,architectureClearance,nearRadius,finalPosition,finalTarget,maxWrites,backHits,disposed,error:r.getContext().getError()}
 }finally{e.camera.setPose=setPose}
}
