import { DoubleSide, Group, MeshStandardMaterial } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { createGardenLeafGeometry } from './GardenLeafGeometry'
import { GardenGroundLeaves } from './GardenGroundLeaves'
import { GardenAirLeaves } from './GardenAirLeaves'

/** Sole owner of shared leaf GPU resources; attached to the existing garden lifecycle. */
export class GardenLeaves {
  private readonly root=new Group()
  private readonly geometry=createGardenLeafGeometry()
  private readonly material=new MeshStandardMaterial({color:'#ffffff',roughness:.93,metalness:0,
    side:DoubleSide,vertexColors:true})
  private readonly ground: GardenGroundLeaves
  private readonly air: GardenAirLeaves
  private disposed=false

  constructor(parent: Group) {
    this.root.name='garden-leaf-detail';this.material.name='garden-leaf-matte'
    this.ground=new GardenGroundLeaves(this.root,this.geometry,this.material)
    this.air=new GardenAirLeaves(this.root,this.geometry,this.material)
    parent.add(this.root)
  }
  setLayout(layout: CompositionId): void {
    this.ground.setLayout(layout);this.air.setLayout(layout)
  }
  setVisible(visible: boolean): void { this.root.visible=visible }
  update(delta: number,visible: boolean,reducedMotion: boolean): void {
    this.air.update(delta,visible&&this.root.visible,reducedMotion)
  }
  dispose(): void {
    if(this.disposed)return
    this.disposed=true
    this.ground.dispose();this.air.dispose();this.geometry.dispose();this.material.dispose()
    this.root.removeFromParent();this.root.clear()
  }
}
