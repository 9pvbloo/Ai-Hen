module.exports=async function validateShadows(){
 const {Box3,Vector3,Raycaster}=await import('/node_modules/.vite/deps/three.js')
 const e=window.__e,g=e.world.nightGarden,r=e.renderer.instance,root=g.pavilion.entranceRoot
 const check=(v,m)=>{if(!v)throw Error(m)}
 window.__pose(1,1,1)
 const lights=[],casters=[];g.root.traverse(o=>{if(o.isLight&&o.castShadow)lights.push(o);if(o.isMesh&&o.castShadow)casters.push(o)})
 check(lights.length===3,'shadow light budget');check(lights.every(l=>!l.isPointLight),'point shadow budget')
 check(casters.every(m=>!(/halo|paper|glow|blossom/.test(m.name))),'FX caster')
 check(lights.every(l=>!l.shadow.autoUpdate&&!l.shadow.needsUpdate),'idle shadow invalidation')
 const ids=lights.map(l=>l.shadow.map.uuid),poses=[]
 for(let n=0;n<=100;n++){window.__pose(1,n/100,0,false,false);poses.push([...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray()])}
 for(let n=100;n>=0;n--){window.__pose(1,n/100,0,false,false);check(JSON.stringify(poses[n])===JSON.stringify([...e.camera.instance.position.toArray(),...e.camera.instance.quaternion.toArray()]),'door reversal camera drift')}
 window.__pose(1,.5);check(lights.every(l=>!l.shadow.needsUpdate),'moving door map refresh')
 window.__pose(1,1,1);check(JSON.stringify(ids)===JSON.stringify(lights.map(l=>l.shadow.map.uuid)),'shadow reallocation')
 const moon=lights.find(l=>l.isDirectionalLight),box=new Box3().setFromObject(root),ndc=[]
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])ndc.push(new Vector3(x,y,z).project(moon.shadow.camera).toArray())
 const envelope=[0,1,2].map(axis=>[Math.min(...ndc.map(v=>v[axis])),Math.max(...ndc.map(v=>v[axis]))])
 check(envelope.every(([min,max])=>min>=-1&&max<=1),'mansion shadow frustum cutoff '+JSON.stringify(envelope))
 const hall=lights.find(l=>l.name==='pavilion-hall-spill');check(hall.position.z<-.67,'hall source outside doorway')
 // Physical line of sight through the open doorway; paper deliberately transmits light.
 const source=hall.getWorldPosition(new Vector3()),target=root.localToWorld(new Vector3(0,2.75,5.2))
 const delta=target.clone().sub(source),distance=delta.length(),ray=new Raycaster(source,delta.normalize(),.03,distance-.03)
 const blockers=ray.intersectObjects(casters,false)
 check(blockers.length===0,'hall source blocked before landing: '+blockers.map(h=>h.object.name))
 window.__pose(1,1,1)
 const nearLight=r.info.render.calls;g.shadows.invalidate();window.__pose(1,1,1);const refreshCalls=r.info.render.calls
 window.__pose(1,1,1);check(r.info.render.calls===nearLight,'idle shadow cache drift')
 return {casters:casters.length,moonEnvelope:envelope,hallLandingClear:true,mapReuse:true,reverse:true,idleCalls:nearLight,refreshCalls,error:r.getContext().getError()}
}
