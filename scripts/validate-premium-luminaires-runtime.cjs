// Numeric scene/resource inspection only. No screenshots, pixel capture or recordings.
module.exports=async function validateLuminaires(){
 const {Vector3,Box3,Group,Matrix4}=await import('/node_modules/.vite/deps/three.js')
 const {LANTERN_ANCHORS,LANTERN_LIGHT_ZONES,lanternScale,lanternSourceY}=await import('/src/world/nightGarden/GardenLanternNetwork.ts')
 const {LANTERN_FAMILY,createGardenLanternGeometry}=await import('/src/world/nightGarden/GardenLanternGeometry.ts')
 const {gardenRouteDistance}=await import('/src/world/nightGarden/GardenApproach.ts')
 const {GENKAN_PENDANT}=await import('/src/world/nightGarden/GenkanPendant.ts')
 const {GardenLanterns}=await import('/src/world/nightGarden/GardenLanterns.ts')
 const {GardenWallLanterns}=await import('/src/world/nightGarden/GardenWallLanterns.ts')
 const e=window.__e,g=e.world.nightGarden,r=e.renderer.instance,check=(v,m)=>{if(!v)throw Error(m)}
 window.__pose(1,1,1)
 let clearance=Infinity
 for(let i=0;i<5;i++){
  const [x,z]=LANTERN_ANCHORS[i]
  const gap=gardenRouteDistance(x,z)-LANTERN_FAMILY.path.footprint*lanternScale(i)
  clearance=Math.min(clearance,gap);check(gap>.90,'path fixture enters conservative walking envelope: '+i+' '+gap)
 }
 for(const family of ['path','secondary']){
  const geometries=createGardenLanternGeometry(family)
  for(const geometry of Object.values(geometries)){
   check(Array.from(geometry.attributes.position.array).every(Number.isFinite),'invalid lantern geometry')
   geometry.computeBoundingBox();check(!geometry.boundingBox.isEmpty(),'empty finish');geometry.dispose()
  }
 }
 for(const zone of LANTERN_LIGHT_ZONES){
  const light=g.root.getObjectByName('garden-practical-'+zone.name),[x,z]=LANTERN_ANCHORS[zone.anchor]
  check(light.position.distanceTo(new Vector3(x,lanternSourceY(zone.anchor,g.layoutId),z))<1e-9,'source detached from chamber')
 }
 const panels=g.root.getObjectByName('garden-boundary-wall-lantern-paper'),matrix=new Matrix4()
 panels.geometry.computeBoundingBox()
 for(let i=0;i<panels.count;i++){
  panels.getMatrixAt(i,matrix);matrix.premultiply(panels.matrixWorld).invert()
  const source=g.root.getObjectByName('garden-wall-practical-'+i).getWorldPosition(new Vector3()).applyMatrix4(matrix)
  check(panels.geometry.boundingBox.containsPoint(source),'wall source outside paper box')
 }
 const pendant=g.root.getObjectByName('genkan-pendant-paper'),bounds=new Box3().setFromObject(pendant)
 const light=g.root.getObjectByName('genkan-pendant-spill')
 check(bounds.containsPoint(light.getWorldPosition(new Vector3())),'pendant source outside paper')
 check(!pendant.castShadow,'paper blocks its own practical')
 let cameraGap=Infinity
 for(let i=0;i<=100;i++){
  window.__pose(1,1,i/100,false,false)
  cameraGap=Math.min(cameraGap,bounds.distanceToPoint(e.camera.instance.position))
 }
 check(cameraGap>.25,'pendant obstructs camera')
 const projected=pendant.getWorldPosition(new Vector3()).project(e.camera.instance)
 check(Math.abs(projected.x)<1&&Math.abs(projected.y)<1,'pendant lost in final frame')
 const shadeEnvelope=[]
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new Vector3(x,y,z).project(e.camera.instance);shadeEnvelope.push(p.toArray())
  check(Math.abs(p.x)<1&&Math.abs(p.y)<1,'pendant shade clipped in final frame')
 }
 check(GENKAN_PENDANT.y+GENKAN_PENDANT.radius<5.86,'pendant intersects ceiling')
 const disposal=[]
 for(const Type of [GardenLanterns,GardenWallLanterns]){
  const parent=new Group(),probe=new Type(parent),resources=new Set(),counts=new Map()
  parent.traverse(o=>{if(o.isMesh){resources.add(o.geometry);resources.add(o.material);if(o.isInstancedMesh)resources.add(o)}if(o.isLight)resources.add(o)})
  for(const item of resources){counts.set(item,0);item.addEventListener('dispose',()=>counts.set(item,counts.get(item)+1))}
  probe.dispose();probe.dispose()
  // Three Light.dispose emits no event without a shadow map; mesh/material/geometry owners do.
  for(const item of resources)if(!item.isLight)check(counts.get(item)===1,'fixture disposal owner drift')
  check(parent.children.length===0,'fixture root leaked');disposal.push(resources.size)
 }
 window.__pose(1,1,1)
 const shadows=[];g.root.traverse(o=>{if(o.isLight&&o.castShadow)shadows.push(o.name)})
 check(shadows.includes('genkan-pendant-spill')&&shadows.length===4,'selective shadow ownership')
 check(r.getContext().getError()===0,'WebGL error after fixture lifecycle')
 return {clearance,cameraGap,pendantNdc:projected.toArray(),shadeEnvelope,windowSources:g.pavilion.windowIrradiance.sourceCount,disposal,shadows}
}
