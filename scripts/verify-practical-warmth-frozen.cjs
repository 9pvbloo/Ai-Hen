const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs')
const baseline='3cc2ed73d6c1502a0b0fa496f1670a564eb3d470'
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).replace(/\r\n/g,'\n')
const allowed=new Set([
 'PracticalLightPalette','GardenLanternMaterials','GardenPavilionMaterials','GardenWindowIrradiance',
 'GardenLanterns','GardenWallLanterns','GenkanInterior','GenkanInteriorMaterials',
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

// Coordinator files may change paper emission only; source placement and ownership stay frozen.
for(const [name,after,before] of [['GardenLanterns','.82 * value','.78 * value'],['GardenWallLanterns','.68*value','.65*value'],['GenkanInterior','.64 * visibility','.62 * visibility']]){
 const file='src/world/nightGarden/'+name+'.ts'
 assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n').replace(after,before),git('show',baseline+':'+file),name+' non-emission drift')
}
console.log('Fixture geometry, light placement, ownership and shadow rig frozen')
