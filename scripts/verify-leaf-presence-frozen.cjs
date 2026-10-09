const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs')
const baseline='87c61fc43e4b85f2d3d43c850b62a7a237d44ab5'
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).replace(/\r\n/g,'\n')
const allowed=new Set(['GardenLeaves','GardenLeafComposition','GardenGroundLeaves','GardenAirLeaves'].map(n=>'src/world/nightGarden/'+n+'.ts'))
let frozen=0
for(const file of git('ls-tree','-r','--name-only',baseline,'src','package.json','package-lock.json','index.html').trim().split('\n')){
 if(allowed.has(file))continue
 assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),git('show',baseline+':'+file),file+' changed')
 frozen++
}
console.log(JSON.stringify({baseline,frozenFiles:frozen,scope:'leaf system only'}))
