const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs')
const baseline='d18d1ca5ecadd4cd04c84ebdce9217860505bdb2'
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).replace(/\r\n/g,'\n')
const allowed=new Set([
 'PracticalLightPalette','GardenLanternNetwork','GardenLanternIrradiance','GardenPracticalBounce',
 'GardenLanternMaterials','GardenLanterns','GardenWallLanterns','GardenPavilionLighting',
 'GardenPavilionOccupancy','GardenWindowIrradiance','GardenPavilionGlow','GenkanInterior',
 'GenkanInteriorLighting','NightGarden','GardenShadows',
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

const integration='src/world/nightGarden/NightGarden.ts'
const stripLeaves=s=>s.split('\n').filter(line=>!line.includes('GardenLeaves')&&!line.includes('this.leaves.')).join('\n')
assert.equal(stripLeaves(fs.readFileSync(integration,'utf8').replace(/\r\n/g,'\n')),git('show',baseline+':'+integration),'Non-leaf camera/timing/ownership integration drift')
const shadowFile='src/world/nightGarden/GardenShadows.ts'
assert.equal(fs.readFileSync(shadowFile,'utf8').replace(/\r\n/g,'\n').replace(" || name.startsWith('garden-leaves-')",''),git('show',baseline+':'+shadowFile),'Shadow casting/cache drift')
console.log('Camera, routes, timing, ownership, stepping stones and shadow strategy frozen')
