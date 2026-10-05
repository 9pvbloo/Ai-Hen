const {execFileSync}=require('node:child_process'),ts=require('typescript'),assert=require('node:assert/strict')
module.exports=async function compareExterior(page){
 const originals=['GardenPavilion','GardenPavilionArchitecture','GenkanRecess']
 await page.route(/\/__interior-baseline\/[^/]+\.ts$/,async route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop(),source=execFileSync('git',['show',`e0d49f2:src/world/nightGarden/${name}`],{encoding:'utf8'})
  const body=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
   .replace(/from ['"]three['"]/g,"from '/node_modules/.vite/deps/three.js'")
   .replace(/from ['"]three\/addons\/([^'"]+)['"]/g,"from '/node_modules/three/examples/jsm/$1'")
   .replace(/from ['"]\.\/([^'"]+)['"]/g,(_,name)=>`from '${originals.includes(name)?'/__interior-baseline/':'/src/world/nightGarden/'}${name}.ts'`)
  await route.fulfill({status:200,contentType:'application/javascript',body})
 })
 const result=await page.evaluate(async()=>{
  const {GardenPavilion}=await import('/__interior-baseline/GardenPavilion.ts'),{Vector3}=await import('/node_modules/.vite/deps/three.js')
  const e=window.__e,w=e.world.nightGarden,current=w.pavilion,original=new GardenPavilion(w.root,w.layoutId),old=original.entranceRoot,root=current.entranceRoot,r=e.renderer.instance,gl=r.getContext(),results=[]
  original.setIntensity(1);w.aperture.attach(old);old.visible=false
  for(const threshold of [0,.5,1]){
   window.__pose(1,threshold);root.updateWorldMatrix(true,true)
   const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,a=new Uint8Array(width*height*4),b=new Uint8Array(a.length)
   gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,a)
   const bounds=[Infinity,Infinity,-Infinity,-Infinity]
   for(const x of [-2.16,2.16])for(const y of [2.76,5.19]){const v=root.localToWorld(new Vector3(x,y,-.1)).project(e.camera.instance);bounds[0]=Math.min(bounds[0],v.x);bounds[1]=Math.min(bounds[1],v.y);bounds[2]=Math.max(bounds[2],v.x);bounds[3]=Math.max(bounds[3],v.y)}
   original.setDoorProgress(current.doors.progress);root.visible=false;old.visible=true;r.render(e.scene,e.camera.instance)
   gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,b)
   let count=0,total=0,changed=0,max=0
   for(let row=0;row<height;row++)for(let column=0;column<width;column++){
    const x=(column+.5)/width*2-1,y=(row+.5)/height*2-1
    if(threshold>0&&x>bounds[0]&&x<bounds[2]&&y>bounds[1]&&y<bounds[3])continue
    const i=(row*width+column)*4,delta=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))
    count++;total+=delta;if(delta>3)changed++;max=Math.max(max,delta)
   }
   results.push({threshold,pixels:count,changed,mean:total/count,max,error:gl.getError()})
   root.visible=true;old.visible=false
  }
  original.dispose();window.__pose(1,1,1);return results
 })
 for(const sample of result){assert.equal(sample.error,0);assert(sample.mean<.05&&sample.changed/sample.pixels<.001,JSON.stringify(sample))}
 return result
}
