import { Color, InstancedMesh, Object3D, Vector3 } from 'three'
import type { BufferGeometry, Group, MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { createGroundLeafPlacements, LEAF_COUNTS, leafRandom } from './GardenLeafComposition'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

const TONES=['#879db0','#768da1','#9dabb8','#687f94'].map(c=>new Color(c))

/** Owns one instance buffer; geometry/material belong to GardenLeaves. */
export class GardenGroundLeaves {
  readonly mesh: InstancedMesh
  private readonly dummy=new Object3D()
  private readonly up=new Vector3(0,1,0)
  private readonly normal=new Vector3()
  private readonly vertex=new Vector3()

  constructor(parent: Group,geometry: BufferGeometry,material: MeshStandardMaterial) {
    this.mesh=new InstancedMesh(geometry,material,LEAF_COUNTS.desktop.ground)
    this.mesh.name='garden-leaves-ground'
    this.mesh.receiveShadow=true
    parent.add(this.mesh)
  }

  setLayout(layout: CompositionId): void {
    const placements=createGroundLeafPlacements(layout),geometry=this.mesh.geometry.attributes.position
    this.mesh.count=Math.min(LEAF_COUNTS[layout].ground,placements.length)
    placements.slice(0,this.mesh.count).forEach(({x,z,seed,lift:stackLift},i)=>{
      const height=(px:number,pz:number)=>sampleDryGardenGroundWorldY(px,pz,layout)
      this.normal.set(height(x-.08,z)-height(x+.08,z),.16,height(x,z-.08)-height(x,z+.08)).normalize()
      this.dummy.quaternion.setFromUnitVectors(this.up,this.normal)
      this.dummy.rotateY(leafRandom(seed,8)*Math.PI*2)
      const scale=.19+leafRandom(seed,9)*.11
      this.dummy.scale.set(scale*(.85+leafRandom(seed,10)*.3),scale,scale)
      this.dummy.position.set(x,height(x,z)+.007,z);this.dummy.updateMatrix()
      // Support every blade vertex on the contour; no floating horizontal decals.
      let lift=0
      for(let v=0;v<geometry.count;v++) {
        this.vertex.fromBufferAttribute(geometry,v).applyMatrix4(this.dummy.matrix)
        lift=Math.max(lift,height(this.vertex.x,this.vertex.z)+.006-this.vertex.y)
      }
      this.dummy.position.y+=lift+stackLift;this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i,this.dummy.matrix)
      this.mesh.setColorAt(i,TONES[seed%TONES.length])
    })
    this.mesh.instanceMatrix.needsUpdate=true
    if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true
    this.mesh.computeBoundingBox();this.mesh.computeBoundingSphere()
  }

  dispose(): void { this.mesh.removeFromParent();this.mesh.dispose() }
}
