const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process')
const base='3c3d10e54be437ed49951ca3ad513c1341a2ab86',git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).replace(/\r\n/g,'\n')
const allowed=new Set(['GardenLanternMaterials','GardenLanterns','GardenPracticalBounce','PracticalLightPalette','PremiumPracticalEnergy'].map(n=>'src/world/nightGarden/'+n+'.ts'))
let frozen=0
for(const file of git('ls-tree','-r','--name-only',base,'src','package.json','package-lock.json','index.html').trim().split('\n')){
 if(allowed.has(file))continue
 let a=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),b=git('show',base+':'+file)
 if(/Garden(Air|Ground)Leaves.ts$/.test(file)){const colors=/\['#[0-9a-f]{6}'(?:,'#[0-9a-f]{6}')+\]/g;a=a.replace(colors,'COLORS');b=b.replace(colors,'COLORS')}
 assert.equal(a,b,file+' changed beyond micro calibration');frozen++
}
console.log({base,frozenFiles:frozen,cameraRoutesTimingsOwnershipArchitectureStonesMoonShadows:true,leafMotionDensity:true})
