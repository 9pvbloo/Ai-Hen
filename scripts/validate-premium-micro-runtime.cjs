module.exports=async function validateMicro(){
 const {Vector3,Matrix4,Color}=await import('/node_modules/.vite/deps/three.js')
 const e=window.__e,g=e.world.nightGarden,r=e.renderer.instance,gl=r.getContext(),check=(v,m)=>{if(!v)throw Error(m)}
 // Warm both the reveal paper and the arrival ground before inspecting programs.
 window.__pose(.73);window.__pose(1,1,1)
 const directional=[];e.scene.traverse(o=>{if(o.isDirectionalLight&&o.castShadow)directional.push(o.name)})
 check(directional.length===1&&directional[0]==='garden-moon-key','ground filter no longer identifies only moon')
 const fragment=material=>gl.getShaderSource(r.properties.get(material).currentProgram.fragmentShader)||''
 const ground=g.materials.groundMaterial
 check(fragment(ground).includes('gardenMoonGravel'),'ground moon filter did not compile')
 check(fragment(ground).includes('directLight.color *= practicalInterior;'),'existing practical containment lost')
 let filtered=0
 e.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(r.properties.get(m).currentProgram&&fragment(m).includes('gardenMoonGravel')){check(m===ground,'moon filter escaped ground material');filtered++}
 }})
 const paper=g.root.getObjectByName('garden-lantern-paper-chambers-path'),light=g.root.getObjectByName('garden-practical-foreground')
 const uniforms=r.properties.get(paper.material).uniforms,mask=uniforms.uPaperForeground.value
 check(Math.hypot(mask.x-light.position.x,mask.y-light.position.y,mask.z-light.position.z)<1e-8,'paper correction detached from foreground source')
 check(fragment(paper.material).includes('foregroundPaper'),'foreground correction not compiled')
 paper.geometry.computeBoundingBox();const matrix=new Matrix4(),p=new Vector3(),center=new Vector3(mask.x,mask.y,mask.z)
 let selected=0
 for(let i=0;i<paper.count;i++){
  paper.getMatrixAt(i,matrix);const box=paper.geometry.boundingBox.clone().applyMatrix4(matrix)
  if(box.distanceToPoint(center)<mask.w){selected++;check(i===0&&box.containsPoint(light.position),'foreground source not inside paper')}
 }
 check(selected===1,'paper correction affects another lantern')
 // Inspect the reveal, before the camera has walked past the first fixture.
 window.__pose(.73,0,0,false,false);const foregroundNdc=light.getWorldPosition(p).project(e.camera.instance).toArray()
 check(foregroundNdc[0]>0&&foregroundNdc[2]<1,'foreground correction is not the right-hand reveal lantern')
 const colors=new Color();let leafInstances=0
 for(const name of ['garden-leaves-ground','garden-leaves-air']){
  const mesh=g.root.getObjectByName(name)
  for(let i=0;i<mesh.count;i++){mesh.getColorAt(i,colors);check(colors.b>colors.g&&colors.g>colors.r,'leaf lost blue-grey color');leafInstances++}
  check(mesh.material.emissive.getHex()===0,'leaves emit light')
 }
 check(gl.getError()===0,'micro pass WebGL error')
 window.__pose(1,1,1)
 return {filteredGroundMeshes:filtered,moonOnly:true,foregroundSelected:selected,foregroundNdc,paperMultiplier:.86,leafInstances}
}
