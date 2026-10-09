const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process')
const baseline='7103bc1e53d47606dc94d4db3574c5d3c8906231'
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).replace(/\r\n/g,'\n')
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')
const allowed=new Set(['GardenLanternIrradiance','GardenLanternMaterials','GardenLanternNetwork','GardenLanterns','GardenPavilionGlow','GardenPavilionLighting','GardenPavilionOccupancy','GardenPavilionSource','GardenPracticalBounce','GardenShadowSettings','GardenWallLanterns','GardenWindowIrradiance','GenkanInterior','GenkanInteriorLighting','PracticalLightPalette'].map(f=>'src/world/nightGarden/'+f+'.ts'))
let frozen=0
for(const file of git('ls-tree','-r','--name-only',baseline,'src','package.json','package-lock.json','index.html').trim().split('\n')){
 if(allowed.has(file))continue
 let a=read(file),b=git('show',baseline+':'+file)
 if(/Garden(Air|Ground)Leaves.ts$/.test(file)){
  const colors=/\['#[0-9a-f]{6}'(?:,'#[0-9a-f]{6}')+\]/g
  a=a.replace(colors,'COLORS');b=b.replace(colors,'COLORS')
 }
 assert.equal(a,b,file+' changed beyond calibration');frozen++
}
const anchors=s=>s.match(/export const LANTERN_ANCHORS = \[[\s\S]*?\] as const/)[0]
const file='src/world/nightGarden/GardenLanternNetwork.ts'
assert.equal(anchors(read(file)),anchors(git('show',baseline+':'+file)))
const shadow='src/world/nightGarden/GardenShadowSettings.ts'
assert.equal(read(shadow).replace("import { PREMIUM_ENERGY } from './PremiumPracticalEnergy'\n",'').replace('far: PREMIUM_ENERGY.path[0].range','far: 3.0'),git('show',baseline+':'+shadow))
console.log({baseline,frozenFiles:frozen,cameraRoutesTimingsOwnershipMoonArchitecture:true,leafDensityMotion:true,shadowChange:'foreground far only'})
