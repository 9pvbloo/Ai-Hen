import { Box3, Color, DynamicDrawUsage, InstancedMesh, Object3D, Sphere, Vector3 } from 'three'
import type { BufferGeometry, Group, MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { AIR_LEAVES, LEAF_COUNTS } from './GardenLeafComposition'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

/** Bounded responsive groups; no simulation allocations, RAF or shadow pass. */
export class GardenAirLeaves {
  readonly mesh: InstancedMesh
  private readonly dummy=new Object3D()
  private readonly heights=new Float64Array(AIR_LEAVES.length)
  private elapsed=0

  constructor(parent: Group,geometry: BufferGeometry,material: MeshStandardMaterial) {
    this.mesh=new InstancedMesh(geometry,material,AIR_LEAVES.length)
    this.mesh.name='garden-leaves-air';this.mesh.receiveShadow=true
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    const colors=['#95adc3','#8098ae','#a8bac9'].map(c=>new Color(c))
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
        const radius=leaf.size*.65,dx=leaf.driftX+.09+radius,dz=leaf.driftZ+radius
        box.expandByPoint(new Vector3(leaf.x-dx,y+.55-.12-radius,leaf.z-dz))
        box.expandByPoint(new Vector3(leaf.x+dx,y+.55+leaf.fallHeight+.12+radius,leaf.z+dz))
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
      const wave=this.elapsed*leaf.swayRate+leaf.group*2.3
      // Vanish gently at the cycle endpoints, so wrapping never teleports a visible blade.
      const edge=Math.min(1,phase/.12,(1-phase)/.12),envelope=edge*edge*(3-2*edge)
      // Related timing makes loose triplets; individual offsets/spin avoid lockstep motion.
      const descent=phase+(leaf.glide?.06*Math.sin(phase*Math.PI*2):0)
      const hover=leaf.glide?Math.sin(wave*.8)*.12:0
      this.dummy.position.set(leaf.x+Math.sin(wave)*leaf.driftX+Math.sin(wave*.43+i*.7)*.09,
        this.heights[i]+.55+(1-descent)*leaf.fallHeight+hover,
        leaf.z+Math.cos(wave*.73+i*.12)*leaf.driftZ)
      this.dummy.rotation.set((leaf.glide?.15:.45)+Math.sin(wave*1.2+i*.2)*(leaf.glide?.25:.55),
        i*.73+this.elapsed*leaf.spin,Math.cos(wave*.83+i*.19)*.32)
      this.dummy.scale.setScalar(leaf.size*envelope)
      this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix)
    }
    this.mesh.instanceMatrix.needsUpdate=true
  }

  dispose(): void { this.mesh.removeFromParent();this.mesh.dispose() }
}
