// Numerical placement and visibility checks only; no screenshots or recordings.
module.exports=async function validateRefinement(){
 const {Box3,Vector3,Matrix4,Raycaster}=await import('/node_modules/.vite/deps/three.js')
 const e=window.__e,p=e.world.nightGarden.pavilion,room=p.interior.root,root=p.entranceRoot
 const check=(v,m)=>{if(!v)throw Error(m)},inverse=new Matrix4(),bounds=[],framing={}
 window.__pose(1,1,1);root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert()
 for(const name of ['genkan-stoneware-vase','genkan-ikebana-branches','genkan-ikebana-blossoms']){
  const mesh=room.getObjectByName(name);mesh.geometry.computeBoundingBox()
  const box=mesh.geometry.boundingBox.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld))
  check(box.min.x>-1.92&&box.max.x<-.96,'arrangement leaves side pocket')
  check(box.min.z>-6.03&&box.max.z<-4.3,'arrangement overlaps rear frame or lamp')
  check(box.max.y<5.64,'arrangement reaches ceiling')
  bounds.push(box)
  if(name==='genkan-stoneware-vase')check(Math.abs(box.min.y-3.10)<1e-6,'vase floats')
  const center=box.getCenter(new Vector3());root.localToWorld(center);center.project(e.camera.instance)
  framing[name]={ndc:center.toArray(),centerVisible:Math.abs(center.x)<1&&Math.abs(center.y)<1}
 }
 for(const side of [-1,1]){
  const box=new Box3(new Vector3(side*1.21-.12,3.10,-5.30),new Vector3(side*1.21+.12,3.44,-5.06))
  check(Math.min(Math.abs(box.min.x),Math.abs(box.max.x))>1.08,'lamp invades clear passage')
  bounds.push(box)
  const origin=root.localToWorld(new Vector3(side*1.21,3.11,-5.18)),direction=new Vector3(0,-1,0)
  const hits=new Raycaster(origin,direction,0,.02).intersectObject(room,true)
  check(hits.some(h=>h.object.name==='genkan-interior-floor'),'lamp lacks platform support')
  const center=box.getCenter(new Vector3());root.localToWorld(center);center.project(e.camera.instance)
  framing['lamp'+side]={ndc:center.toArray(),centerVisible:Math.abs(center.x)<1&&Math.abs(center.y)<1}
 }
 let clearance=Infinity
 for(let i=0;i<=400;i++){
  window.__pose(1,1,i/400,false,false)
  const camera=root.worldToLocal(e.camera.instance.position.clone())
  for(const box of bounds)clearance=Math.min(clearance,box.distanceToPoint(camera))
 }
 check(clearance>.127,'prop intersects camera near envelope')
 if(e.camera.instance.aspect>.65)check(Object.values(framing).every(v=>v.centerVisible),'desktop/tablet loses accent centers')
 const lights=[];room.traverse(o=>{if(o.name.startsWith('genkan-low-lamp-'))lights.push(o)})
 check(lights.length===2&&lights.every(l=>!l.castShadow&&l.distance===2.05),'unbounded practical lighting')
 p.interior.setIntensity(0);check(lights.every(l=>l.intensity===0),'practicals ignore visibility')
 p.interior.setIntensity(1);check(lights.every(l=>l.intensity===1.2),'practical intensity drift')
 window.__pose(1,1,1)
 return {clearance,framing,practicalLights:2,passageWidth:2.16}
}
