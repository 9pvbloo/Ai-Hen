module.exports=async function validateCalibration(){
 const {Color}=await import('/node_modules/.vite/deps/three.js')
 const e=window.__e,g=e.world.nightGarden,r=e.renderer.instance,check=(v,m)=>{if(!v)throw Error(m)}
 window.__pose(1,1,1)
 const color=new Color();let leaves=0
 for(const name of ['garden-leaves-ground','garden-leaves-air']){
  const mesh=g.root.getObjectByName(name)
  for(let i=0;i<mesh.count;i++){mesh.getColorAt(i,color);check(color.b>color.g&&color.g>color.r,'leaf albedo lost cold family');leaves++}
  check(mesh.material.emissive.getHex()===0,'leaf self illumination')
 }
 const gl=r.getContext(),shaders=r.info.programs.map(p=>gl.getShaderSource(p.fragmentShader)||'')
 check(shaders.some(s=>s.includes('paperShoulder')),'paper highlight shoulder not compiled')
 check(shaders.some(s=>s.includes('windowTransfer')&&s.includes('front>1.35')),'bounded window transport not compiled')
 const landing=g.root.getObjectByName('pavilion-covered-landing')
 // Its support ends in front of the facade, well short of the rear enclosure.
 check(landing.position.z-landing.distance>0,'porch bounce reaches back enclosure')
 check(g.pavilion.windowIrradiance.sourceCount===24,'window source count changed')
 check(gl.getError()===0,'calibration WebGL error')
 return {blueLeafInstances:leaves,compiledPaperShoulder:true,compiledBoundedWindows:true,porchRearExtent:landing.position.z-landing.distance}
}
