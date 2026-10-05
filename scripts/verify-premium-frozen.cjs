const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs')
const baseline='d84d914f5803801c490cfb45e268d1dd1dff5941'
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).replace(/\r\n/g,'\n')
const allowed=new Set([
 'GardenLanternGeometry','GardenLanternIrradiance','GardenLanternMaterials','GardenLanternNetwork','GardenLanterns',
 'GardenPavilion','GardenPavilionGlow','GardenPavilionLighting','GardenPavilionOccupancy','GardenPavilionSource',
 'GardenPracticalBounce','GardenShadowSettings','GardenShadows','GardenWallLanterns','GardenWindowIrradiance',
 'GenkanInterior','GenkanInteriorLighting','GenkanInteriorMaterials','GenkanPendant','PracticalLightPalette',
].map(n=>'src/world/nightGarden/'+n+'.ts'))
let frozen=0
for(const file of git('ls-tree','-r','--name-only',baseline,'src','package.json','package-lock.json','index.html').trim().split('\n')){
 if(allowed.has(file))continue
 assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),git('show',baseline+':'+file),file+' changed')
 frozen++
}
const current=fs.readFileSync('src/world/nightGarden/GardenLanternNetwork.ts','utf8')
const anchors=s=>s.match(/export const LANTERN_ANCHORS = \[[\s\S]*?\] as const/)[0]
assert.equal(anchors(current).replace(/\r\n/g,'\n'),anchors(git('show',baseline+':src/world/nightGarden/GardenLanternNetwork.ts')))
console.log(JSON.stringify({baseline,frozenFiles:frozen,lanternAnchorsUnchanged:true}))
