import { Box3, Color, DynamicDrawUsage, InstancedMesh, Object3D, Sphere, Vector3 } from 'three'
import type { BufferGeometry, Group, MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { AIR_LEAVES, LEAF_COUNTS } from './GardenLeafComposition'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

/** At most twelve transforms, no simulation allocations, no RAF or shadow pass. */
export class GardenAirLeaves {
  readonly mesh: InstancedMesh
  private readonly dummy=new Object3D()
  private readonly heights=new Float64Array(AIR_LEAVES.length)
  private elapsed=0

  constructor(parent: Group,geometry: BufferGeometry,material: MeshStandardMaterial) {
    this.mesh=new InstancedMesh(geometry,material,AIR_LEAVES.length)
    this.mesh.name='garden-leaves-air';this.mesh.receiveShadow=true
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    const colors=['#947849','#81704e','#8b794f'].map(c=>new Color(c))
    AIR_LEAVES.forEach((_,i)=>this.mesh.setColorAt(i,colors[i%colors.length]))
    parent.add(this.mesh)
  }

  setLayout(layout: CompositionId): void {
    this.mesh.count=LEAF_COUNTS[layout].air
    const box=new Box3()
    AIR_LEAVES.forEach((leaf,i)=>{
      const y=sampleDryGardenGroundWorldY(leaf.x,leaf.z,layout)
      this.heights[i]=y
      if(i<this.mesh.count){
        box.expandByPoint(new Vector3(leaf.x-.65,y-.1,leaf.z-.65))
        box.expandByPoint(new Vector3(leaf.x+.65,y+3.7,leaf.z+.65))
      }
    })
    this.mesh.boundingBox=box;this.mesh.boundingSphere=box.getBoundingSphere(new Sphere())
    this.writeMatrices()
  }

  update(delta: number,active: boolean,reducedMotion: boolean): void {
    this.mesh.visible=active
    if(!active||reducedMotion||document.hidden||delta<=0)return
    this.elapsed+=Math.min(delta,.05)
    this.writeMatrices()
  }

  private writeMatrices(): void {
    for(let i=0;i<this.mesh.count;i++){
      const leaf=AIR_LEAVES[i],phase=(leaf.phase+this.elapsed/leaf.period)%1
      const wave=this.elapsed*.32+i*2.3
      // Vanish gently at the cycle endpoints, so wrapping never teleports a visible blade.
      const edge=Math.min(1,phase/.12,(1-phase)/.12),envelope=edge*edge*(3-2*edge)
      this.dummy.position.set(leaf.x+Math.sin(wave)*.28,this.heights[i]+.25+(1-phase)*3.0,
        leaf.z+Math.cos(wave*.73)*.20)
      this.dummy.rotation.set(.30+Math.sin(wave*1.2)*.45,wave*.55,Math.cos(wave*.83)*.32)
      this.dummy.scale.setScalar(leaf.size*envelope)
      this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate=true
  }

  dispose(): void { this.mesh.removeFromParent();this.mesh.dispose() }
}
