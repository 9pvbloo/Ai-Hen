// Numeric validation only; never captures pixels or records media.
module.exports=async function validateLeaves(){
 const {Matrix4,Vector3,Group}=await import('/node_modules/.vite/deps/three.js')
 const {GardenLeaves}=await import('/src/world/nightGarden/GardenLeaves.ts')
 const {LEAF_COUNTS,leafGroundAllowed,AIR_LEAVES}=await import('/src/world/nightGarden/GardenLeafComposition.ts')
 const {gardenRouteDistance}=await import('/src/world/nightGarden/GardenApproach.ts')
 const {sampleDryGardenGroundWorldY}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
 const check=(v,m)=>{if(!v)throw Error(m)},e=window.__e,g=e.world.nightGarden,leaves=g.leaves
 window.__pose(1)
 const ground=g.root.getObjectByName('garden-leaves-ground'),air=g.root.getObjectByName('garden-leaves-air')
 check(ground.count===LEAF_COUNTS[g.layoutId].ground&&air.count===LEAF_COUNTS[g.layoutId].air,'responsive count')
 check(ground.geometry===air.geometry&&ground.material===air.material,'leaf resource sharing')
 check(!ground.castShadow&&!air.castShadow&&ground.receiveShadow&&air.receiveShadow,'leaf shadow budget')
 check(!ground.material.transparent&&!ground.material.map,'leaf texture/overdraw budget')
 const matrix=new Matrix4(),p=new Vector3(),attribute=ground.geometry.attributes.position
 let minimumClearance=Infinity,minimumLift=Infinity,maximumLift=0
 for(let i=0;i<ground.count;i++){
  ground.getMatrixAt(i,matrix)
  const x=matrix.elements[12],z=matrix.elements[14]
  check(leafGroundAllowed(x,z,g.layoutId),'leaf outside planted pocket')
  minimumClearance=Math.min(minimumClearance,gardenRouteDistance(x,z))
  for(let v=0;v<attribute.count;v++){
   p.fromBufferAttribute(attribute,v).applyMatrix4(matrix)
   check(leafGroundAllowed(p.x,p.z,g.layoutId),'blade crosses protected garden edge')
   const gap=p.y-sampleDryGardenGroundWorldY(p.x,p.z,g.layoutId)
   minimumLift=Math.min(minimumLift,gap);maximumLift=Math.max(maximumLift,gap)
   check(gap>=.0059&&gap<.07,'leaf terrain support '+gap)
  }
 }
 const frames=()=>Array.from(air.instanceMatrix.array),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
 const initial=frames();leaves.update(1/30,true,false);check(!same(initial,frames()),'air leaves do not move')
 const frozen=frames(),version=air.instanceMatrix.version
 for(let i=0;i<20;i++)leaves.update(1/30,true,true)
 check(same(frozen,frames())&&air.instanceMatrix.version===version,'reduced motion writes')
 leaves.update(1/30,false,false);check(same(frozen,frames())&&!air.visible,'inactive leaves run')
 const elapsed=leaves.air.elapsed
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>true})
 try{leaves.update(1,true,false);check(leaves.air.elapsed===elapsed,'hidden leaf work')}finally{delete document.hidden}
 const depths=[0,0,0]
 for(const leaf of AIR_LEAVES.slice(0,air.count))depths[leaf.layer]++
 check(depths.every(n=>n>=9),'responsive profile loses a depth layer')
 check(AIR_LEAVES.slice(0,air.count).some(l=>l.glide)&&AIR_LEAVES.slice(0,air.count).some(l=>!l.glide),'missing fall style')
 // More than two longest cycles; all blades stay within their culling volume and off the route.
 for(let n=0;n<1600;n++){
  leaves.update(.05,true,false)
  if(n%8)continue
  for(let i=0;i<air.count;i++){
   air.getMatrixAt(i,matrix)
   check(matrix.elements.every(Number.isFinite),'nonfinite leaf matrix')
   check(gardenRouteDistance(matrix.elements[12],matrix.elements[14])>1.7,'air leaf enters route')
   for(let v=0;v<attribute.count;v++){
    p.fromBufferAttribute(attribute,v).applyMatrix4(matrix)
    check(air.boundingBox.containsPoint(p),'air culling bounds too small')
    check(gardenRouteDistance(p.x,p.z)>1.7,'air blade crosses route clearance')
    check(p.y>sampleDryGardenGroundWorldY(p.x,p.z,g.layoutId),'air leaf clips terrain')
   }
  }
 }
 const held=frames();leaves.setLayout(g.layoutId);check(same(held,frames()),'resize resets air phase')
 const own=new Group(),probe=new GardenLeaves(own),resources=new Set(),events=new Map()
 probe.setLayout(g.layoutId)
 own.traverse(o=>{if(o.isMesh){resources.add(o);resources.add(o.geometry);resources.add(o.material)}})
 for(const o of resources){events.set(o,0);o.addEventListener('dispose',()=>events.set(o,events.get(o)+1))}
 probe.dispose();probe.dispose();check(own.children.length===0,'leaf group leaked')
 check([...events.values()].every(n=>n===1),'leaf GPU ownership disposal')
 window.__pose(1,1,1);check(!air.visible,'air leaves active inside genkan')
 return {ground:ground.count,air:air.count,trianglesPerLeaf:attribute.count?ground.geometry.index.count/3:0,
  minimumClearance,minimumLift,maximumLift,depths,cycleSeconds:80,reducedFreeze:true,hiddenPause:true,
  resizePhase:true,disposedResources:resources.size,authoredAirCount:AIR_LEAVES.length}
}
