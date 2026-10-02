// Ensure added low-detail options leave approved hero geometry byte-identical.
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url')
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto'),ts=require('typescript'),assert=require('node:assert/strict')
async function main(){
 const baseline='0933bf02e93bfbb8027be4b92408b837242f0a33',file='src/world/nightGarden/GardenPineGeometry.ts'
 const before=execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'}),after=await fs.readFile(file,'utf8')
 const three=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href
 const load=async source=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from (["'])three\1/g,`from '${three}'`)).toString('base64'))
 const old=await load(before),current=await load(after)
 const hash=g=>{const h=createHash('sha256');for(const [name,a] of Object.entries(g.attributes)){h.update(name);h.update(Buffer.from(a.array.buffer))}if(g.index)h.update(Buffer.from(g.index.array.buffer));const result=h.digest('hex');g.dispose();return result}
 const heroGeometry={}
 for(const i of [0,1]){const a=old.createPineGeometry(i),b=current.createPineGeometry(i);for(const kind of ['wood','foliage']){const prior=hash(a[kind]),final=hash(b[kind]);assert.equal(final,prior);heroGeometry[`pine-${i}-${kind}`]={before:prior,after:final,identical:true}}}
 const prior=hash(old.createPrunedShrubGeometry()),final=hash(current.createPrunedShrubGeometry());assert.equal(final,prior);heroGeometry.shrub={before:prior,after:final,identical:true}
 const allowed=['src/world/nightGarden/NightGarden.ts','src/world/nightGarden/GardenVegetation.ts',file,'src/world/nightGarden/GardenLateralDepth.ts','src/world/nightGarden/GardenDepthComposition.ts']
 const changed=execFileSync('git',['diff',baseline,'--name-only','--','src','package.json','package-lock.json'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean)
 assert(changed.every(f=>allowed.includes(f)),'Frozen system drift')
 const files=execFileSync('git',['ls-files','src','package.json','package-lock.json'],{encoding:'utf8'}).trim().split(/\r?\n/)
 const frozen=files.filter(f=>!allowed.includes(f));const frozenHashes={}
 for(const f of frozen){
  const a=execFileSync('git',['show',`${baseline}:${f}`],{encoding:'utf8'}).replace(/\r\n/g,'\n'),b=(await fs.readFile(f,'utf8')).replace(/\r\n/g,'\n')
  assert.equal(b,a,`Frozen file changed: ${f}`);frozenHashes[f]=createHash('sha256').update(b).digest('hex')
 }
 const report={baseline,heroGeometry,allowed,modifiedTrackedFiles:changed,frozenFileCount:frozen.length,frozenHashes,noNewDependencies:true}
 await fs.writeFile('docs/reviews/phase-3k68/frozen-systems.json',JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify({heroGeometriesIdentical:5,frozenFilesIdentical:frozen.length,changed}))
}
main().catch(e=>{console.error(e);process.exitCode=1})
