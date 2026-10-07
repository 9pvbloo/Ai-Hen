module.exports=async function validateHybrid(){
 const e=window.__e,g=e.world.nightGarden,r=e.renderer.instance,check=(v,m)=>{if(!v)throw Error(m)}
 window.__pose(.73)
 const frame=g.root.getObjectByName('garden-lantern-frames-path'),small=g.root.getObjectByName('garden-lantern-frames-secondary')
 check(frame.material!==small.material,'hybrid finish shared with small lanterns')
 check(frame.material.map===small.material.map&&frame.material.roughnessMap===small.material.roughnessMap,'new timber textures')
 check(frame.material.color.getHexString()==='302d25'&&frame.material.roughness===.86,'hybrid timber finish')
 check(small.material.color.getHexString()==='282721'&&small.material.roughness===.78,'small frame finish drift')
 check(frame.castShadow&&frame.receiveShadow,'hybrid cage shadow flags')
 window.__pose(1,1,1)
 check(r.getContext().getError()===0,'hybrid WebGL error')
 return {isolatedTimber:true,sharedTextures:true,cageCastsShadow:true,secondaryFinishUnchanged:true}
}
