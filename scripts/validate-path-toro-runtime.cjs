module.exports=async function validateToro(){
 const {Vector3,Matrix4,Raycaster}=await import('/node_modules/.vite/deps/three.js')
 const {LANTERN_LIGHT_ZONES}=await import('/src/world/nightGarden/GardenLanternNetwork.ts')
 const e=window.__e,g=e.world.nightGarden,r=e.renderer.instance,check=(v,m)=>{if(!v)throw Error(m)}
 window.__pose(.73);g.root.updateWorldMatrix(true,true)
 const paper=g.root.getObjectByName('garden-lantern-paper-chambers-path'),smallPaper=g.root.getObjectByName('garden-lantern-paper-chambers-secondary')
 const stone=g.root.getObjectByName('garden-lantern-plinths-path'),smallStone=g.root.getObjectByName('garden-lantern-plinths-secondary')
 check(paper.material!==smallPaper.material&&stone.material!==smallStone.material,'path finish not isolated')
 check(stone.material.map===smallStone.material.map&&paper.material.map===smallPaper.material.map,'unnecessary texture allocation')
 window.__pose(1,1,1)
 check(Math.abs(paper.material.emissiveIntensity/smallPaper.material.emissiveIntensity-.94)<1e-8,'path-only paper intensity')
 const matrix=new Matrix4(),ray=new Raycaster(),origin=new Vector3(),axis=new Vector3();let cavityRays=0,minRecess=Infinity
 for(let i=0;i<5;i++){
  const source=g.root.getObjectByName('garden-practical-'+LANTERN_LIGHT_ZONES[i].name)
  paper.getMatrixAt(i,matrix);matrix.premultiply(paper.matrixWorld)
  source.getWorldPosition(origin)
  for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1]]){
   axis.set(x,0,z).transformDirection(paper.matrixWorld);ray.set(origin,axis);ray.near=.001;ray.far=1
   // Back sides face the cavity; reverse the ray from outside to intersect FrontSide paper.
   const end=origin.clone().addScaledVector(axis,1);ray.set(end,axis.clone().negate());ray.far=1.01
   const hit=ray.intersectObject(paper,false).find(h=>h.instanceId===i)
   check(!!hit,'missing inset panel around source '+i);cavityRays++
   const radius=hit.point.distanceTo(origin);check(radius>.045&&radius<.15,'source/paper depth drift')
   minRecess=Math.min(minRecess,radius)
  }
 }
 let gap=Infinity
 stone.geometry.computeBoundingBox()
 for(let n=0;n<=100;n++){
  window.__pose(.68+.32*n/100,0,0,false,false)
  for(let i=0;i<5;i++){
   stone.getMatrixAt(i,matrix);matrix.premultiply(stone.matrixWorld)
   const box=stone.geometry.boundingBox.clone().applyMatrix4(matrix)
   gap=Math.min(gap,box.distanceToPoint(e.camera.instance.position))
  }
 }
 check(gap>.25,'refined lantern enters camera envelope')
 window.__pose(1,1,1)
 check(r.getContext().getError()===0,'toro WebGL error')
 return {cavityRays,minimumSourcePaperDistance:minRecess,cameraClearance:gap,sharedTextures:true,isolatedPathMaterials:true}
}
