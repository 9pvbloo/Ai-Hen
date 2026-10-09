// Incident diffuse luminance proxy using installed Three distance/spot attenuation.
// Numeric rays only; excludes albedo, normal maps, specular, fog and screen-space perception.
module.exports=async function probeContrast(){
 const {Vector3,Raycaster,Color}=await import('/node_modules/.vite/deps/three.js')
 const {GARDEN_ROUTE}=await import('/src/world/nightGarden/GardenApproach.ts')
 const {LANTERN_ANCHORS,lanternSourceY}=await import('/src/world/nightGarden/GardenLanternNetwork.ts')
 const {sampleDryGardenGroundWorldY}=await import('/src/world/nightGarden/GardenGroundHeight.ts')
 const e=window.__e,g=e.world.nightGarden;window.__pose(1,1,1);g.root.updateWorldMatrix(true,true)
 const lights=[],casters=[],up=new Vector3(0,1,0),ray=new Raycaster(),source=new Vector3(),direction=new Vector3(),target=new Vector3()
 const luminance=c=>.2126*c.r+.7152*c.g+.0722*c.b
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
 g.root.traverseVisible(o=>{if(o.isLight)lights.push(o);if(o.isMesh&&o.castShadow)casters.push(o)})
 const measure=(name,point)=>{
  let warm=0,cold=0;const blocked=[],occluders=[]
  for(const light of lights){
   let energy=light.intensity,normal=1,distance=0
   if(light.isHemisphereLight){cold+=energy*.5*(luminance(light.color)+luminance(light.groundColor));continue}
   if(!light.isDirectionalLight&&!light.isPointLight&&!light.isSpotLight)continue
   light.getWorldPosition(source)
   if(light.isDirectionalLight){light.target.getWorldPosition(target);direction.copy(source).sub(target).normalize();distance=100;source.copy(point).addScaledVector(direction,distance)}
   else {
    direction.copy(source).sub(point);distance=direction.length();direction.normalize()
    energy/=Math.max(.01,distance**light.decay)
    if(light.distance>0)energy*=Math.max(0,1-(distance/light.distance)**4)**2
    if(light.isSpotLight){light.target.getWorldPosition(target).sub(source).normalize();energy*=smooth(Math.cos(light.angle),Math.cos(light.angle*(1-light.penumbra)),-direction.dot(target))}
   }
   normal=Math.max(0,up.dot(direction));energy*=normal
   if(light.castShadow&&energy>0){
    ray.set(point.clone().addScaledVector(up,.025),direction);ray.near=.025;ray.far=distance-.025
    const hit=ray.intersectObjects(casters,false)[0]
    if(hit){blocked.push(light.name);occluders.push({light:light.name,object:hit.object.name,instance:hit.instanceId,local:g.pavilion.entranceRoot.worldToLocal(hit.point.clone()).toArray()});energy=0}
   }
   const value=energy*luminance(light.color)
   if(/^(garden-practical|garden-wall-practical|pavilion-|genkan-)/.test(light.name))warm+=value;else cold+=value
  }
  return {name,point:point.toArray(),warm,cold,warmFraction:warm/(warm+cold||1),blocked,occluders}
 }
 const receivers=[]
 for(let i=0;i<5;i++){
  const [x,z]=LANTERN_ANCHORS[i];let nearest=[0,0],best=Infinity
  for(let j=1;j<GARDEN_ROUTE.length;j++){
   const a=GARDEN_ROUTE[j-1],b=GARDEN_ROUTE[j],dx=b[0]-a[0],dz=b[1]-a[1]
   const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
   const p=[a[0]+dx*t,a[1]+dz*t],d=Math.hypot(p[0]-x,p[1]-z)
   if(d<best){best=d;nearest=p}
  }
  receivers.push(measure('path-'+i,new Vector3(nearest[0],sampleDryGardenGroundWorldY(...nearest,g.layoutId)+.1,nearest[1])))
 }
 for(const [name,x,y,z]of [['threshold',0,2.76,.35],['landing',0,2.76,4.8],['upper-stair',0,2.46,6.7],['middle-stair',0,2.22,7.82],['outer-stair',0,1.98,8.94]]){
  receivers.push(measure(name,g.pavilion.entranceRoot.localToWorld(new Vector3(x,y,z))))
 }
 receivers.push(measure('cold-control',new Vector3(0,sampleDryGardenGroundWorldY(0,-22,g.layoutId),-22)))
 // Actual secondary shader uniforms, including historical variants with a single fixed gain.
 const secondary=g.lanternIrradiance,sources=secondary.sources,indices=LANTERN_ANCHORS.map((_,i)=>i).filter(i=>![0,1,2,3,4,6,9].includes(i))
 const palette=await import('/src/world/nightGarden/PracticalLightPalette.ts'),tint=new Color(palette.PRACTICAL_LIGHT.source)
 const secondaryPools=sources.map((v,i)=>{
  const index=indices[i],y=lanternSourceY(index,g.layoutId)-sampleDryGardenGroundWorldY(v.x+.65,v.z,g.layoutId),d2=.65**2+y*y
  return {anchor:index,range:v.w,energy:secondary.energy?.[i]??1.8,
   diffuseProxy:(secondary.energy?.[i]??1.8)*Math.max(0,1-(d2/v.w**2)**2)**2/Math.max(.09,d2)*Math.max(0,y/Math.sqrt(d2))*luminance(tint)}
 })
 return {receivers,secondaryPools,lights:lights.filter(l=>l.isPointLight||l.isSpotLight).map(l=>({name:l.name,intensity:l.intensity,range:l.distance,color:l.color.getHexString()}))}
}
