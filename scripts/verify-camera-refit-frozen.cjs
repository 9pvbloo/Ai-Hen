const fs=require('node:fs/promises'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto')
async function main(){
 const baseline='bfdcabaff875c37a32506b7a1857c1c9250fc92e',camera='src/world/nightGarden/NightGardenCameraPath.ts',integration='src/world/nightGarden/NightGarden.ts'
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).replace(/\r\n/g,'\n')
 const files=git('ls-files','src','package.json','package-lock.json').trim().split('\n'),hashes={}
 for(const file of files){if(file===camera||file===integration)continue;const old=git('show',`${baseline}:${file}`),now=(await fs.readFile(file,'utf8')).replace(/\r\n/g,'\n');assert.equal(now,old,file);hashes[file]=createHash('sha256').update(now).digest('hex')}
 const strip=s=>s.replace(/    const travelProgress =[\s\S]*?    this.atmosphere.update/, '    CAMERA_BLOCK\n    this.atmosphere.update')
 assert.equal(strip((await fs.readFile(integration,'utf8')).replace(/\r\n/g,'\n')),strip(git('show',`${baseline}:${integration}`)),'Non-camera NightGarden drift')
 const changed=git('diff',baseline,'--name-only','--','src','package.json','package-lock.json').trim().split('\n');assert(changed.every(f=>[camera,integration].includes(f)))
 const report={baseline,productionFiles:changed,frozenFileCount:Object.keys(hashes).length,nightGardenOutsideCameraIdentical:true,hashes}
 await fs.writeFile('docs/reviews/phase-3k69/frozen-systems.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,hashes:undefined}))
}
main().catch(e=>{console.error(e);process.exitCode=1})
