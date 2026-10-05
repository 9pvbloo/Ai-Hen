module.exports=async function validateInterior(){
 const {Vector3,Vector2,Matrix4,Raycaster,Group}=await import('/node_modules/.vite/deps/three.js')
 const {GenkanInterior}=await import('/src/world/nightGarden/GenkanInterior.ts')
 const e=window.__e,w=e.world.nightGarden,p=w.pavilion,room=p.interior,root=p.entranceRoot,r=e.renderer.instance
 const check=(v,m)=>{if(!v)throw Error(m)},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
 window.__pose(1,1,0);root.updateWorldMatrix(true,true)
 const boxes=[],matrix=new Matrix4(),point=new Vector3(),previous=new Vector3(),ray=new Raycaster()
 root.traverse(mesh=>{if(mesh.isInstancedMesh&&mesh.geometry.type==='BoxGeometry')for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);const a=matrix.elements
  boxes.push({name:mesh.name,min:[a[12]-Math.abs(a[0])/2,a[13]-Math.abs(a[5])/2,a[14]-Math.abs(a[10])/2],max:[a[12]+Math.abs(a[0])/2,a[13]+Math.abs(a[5])/2,a[14]+Math.abs(a[10])/2]})
 }})
 const distance=(v,b)=>Math.hypot(...v.toArray().map((n,k)=>Math.max(b.min[k]-n,0,n-b.max[k])))
 const pose={position:new Vector3(),target:new Vector3()},oldPose={position:new Vector3(),target:new Vector3()}
 w.genkanPath.sample(1,oldPose);w.interiorPath.sample(0,pose)
 check(pose.position.distanceTo(oldPose.position)<1e-12&&pose.target.distanceTo(oldPose.target)<1e-12,'handoff discontinuity')
 const snapshots=[],doors=Array.from(p.doors.paper.instanceMatrix.array),geometry=[]
 room.root.traverse(m=>{if(m.isInstancedMesh)geometry.push(m.name,...m.instanceMatrix.array)})
 let length=0,minimum=Infinity,wall=Infinity,ceiling=Infinity,door=Infinity,writes=0,rays=0,leaks=0
 const original=e.camera.setPose;e.camera.setPose=function(...args){writes++;return original.apply(this,args)}
 try{
  for(let i=0;i<=400;i++){
   writes=0;window.__pose(1,1,i/400,false,false);check(writes===1,'multiple camera writers')
   check(same(doors,Array.from(p.doors.paper.instanceMatrix.array))&&p.doors.progress===1,'door moved during interior')
   const camera=e.camera.instance;check(camera.fov===45,'FOV changed')
   if(i)length+=previous.distanceTo(camera.position);previous.copy(camera.position)
   root.worldToLocal(point.copy(camera.position))
   for(const b of boxes){const gap=distance(point,b);minimum=Math.min(minimum,gap)
    if(b.name==='genkan-moving-timber'||b.name==='pavilion-blockout-wallEntry')door=Math.min(door,gap)
    if(b.name!=='genkan-moving-timber'&&b.name!=='pavilion-blockout-wallEntry'&&b.max[1]-b.min[1]>1&&(b.max[0]-b.min[0]<.5||b.max[2]-b.min[2]<.5))wall=Math.min(wall,gap)
    if(b.min[1]>=4.9)ceiling=Math.min(ceiling,gap)
   }
   snapshots.push([...camera.position.toArray(),...camera.quaternion.toArray()]);check(snapshots[i].every(Number.isFinite),'nonfinite camera')
   if(i%20===0&&point.z<-.7){
    // Full frustum grid once inside: physical opaque mansion must enclose every sightline.
    root.updateWorldMatrix(true,true)
    for(let y=-.98;y<1;y+=.196)for(let x=-.98;x<1;x+=.196){
     ray.setFromCamera(new Vector2(x,y),camera)
     const hit=ray.intersectObject(root,true).find(h=>!h.object.material.transparent)
     rays++;if(!hit)leaks++
    }
   }
  }
  const finalPosition=e.camera.instance.position.toArray();w.interiorPath.sample(1,pose);const finalTarget=pose.target.toArray(),localPosition=point.toArray()
  const framing={}
  for(const [name,x,y,z]of [['lowerFloor',.25,2.78,-3.55],['step',0,3.10,-3.68],['rearHeader',0,5.50,-6.16]]){
   const projected=root.localToWorld(new Vector3(x,y,z)).project(e.camera.instance);framing[name]=projected.toArray()
   check(Math.abs(projected.x)<1&&Math.abs(projected.y)<1,'final framing loses '+name+': '+JSON.stringify(projected.toArray()))
  }
  check(localPosition[2]<-.7&&localPosition[2]>-3.68,'endpoint must be inside lower Genkan')
  const nearEnvelope=e.camera.instance.near*Math.hypot(1,Math.tan(Math.PI/8),Math.tan(Math.PI/8)*e.camera.instance.aspect)
  check(minimum>nearEnvelope,'near-plane collision');check(leaks===0,'unoccluded interior frustum rays '+leaks)
  for(let cycle=0;cycle<2;cycle++)for(let i=400;i>=0;i--){
   window.__pose(1,1,i/400,cycle===1,false)
   check(same([...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray()],snapshots[i]),'reverse/reduced drift')
  }
  // Downward rays confirm real floors and exactly one exposed top at each sampled point.
  let floorSamples=0
  for(const x of [-1.5,-.5,.5,1.5])for(let z=-.8;z>-6.1;z-=.19){
   const surfaces=boxes.filter(b=>b.min[0]<x&&b.max[0]>x&&b.min[2]<z&&b.max[2]>z&&b.max[1]<=3.100001)
   check(surfaces.length>0,'missing floor support')
   const top=Math.max(...surfaces.map(b=>b.max[1]));check(top>=2.74999,'floor hole')
   check(surfaces.filter(b=>Math.abs(b.max[1]-top)<1e-6).length===1,'coplanar floor tops');floorSamples++
  }
  for(const x of [-1.5,0,1.5])for(const z of [-3.8,-4.2,-6.1]){
   const support=boxes.filter(b=>b.min[0]<=x&&b.max[0]>=x&&b.min[2]<=z&&b.max[2]>=z&&b.max[1]<3.100001).sort((a,b)=>a.min[1]-b.min[1])
   let top=2.70;for(const b of support)if(b.min[1]<=top+1e-6)top=Math.max(top,b.max[1])
   check(top>=3.099999,'unsupported step/platform at '+x+','+z)
  }
  const probe=new GenkanInterior(new Group()),disposed={geometries:0,materials:0,meshes:0}
  const geometries=new Set(),materials=new Set()
  probe.root.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);m.addEventListener('dispose',()=>disposed.meshes++)}})
  geometries.forEach(g=>g.addEventListener('dispose',()=>disposed.geometries++));materials.forEach(m=>m.addEventListener('dispose',()=>disposed.materials++))
  probe.dispose();probe.dispose();check(same(disposed,{geometries:1,materials:7,meshes:7}),'interior disposal ownership')
  window.__pose(1,1,1)
  const metrics={calls:r.info.render.calls,triangles:r.info.render.triangles,...r.info.memory,programs:r.info.programs.length}
  return {length,minimum,wall,ceiling,door,nearEnvelope,finalPosition,finalTarget,localPosition,framing,rays,leaks,floorSamples,disposed,metrics,geometry,error:r.getContext().getError()}
 }finally{e.camera.setPose=original}
}
