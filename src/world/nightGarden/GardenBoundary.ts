import { BoxGeometry, Group, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

/** Low open timber enclosure. Two static batches, no lights or animated work. */
export class GardenBoundary {
  private readonly root = new Group()
  private readonly geometry = new BoxGeometry(1, 1, 1)
  private readonly stoneMaterial = new MeshStandardMaterial({ color: '#414b50', roughness: 1 })
  private readonly woodMaterial = new MeshStandardMaterial({ color: '#42413b', roughness: 0.96 })
  private readonly stone = new InstancedMesh(this.geometry, this.stoneMaterial, 24)
  private readonly wood = new InstancedMesh(this.geometry, this.woodMaterial, 256)

  constructor(parent: Group) {
    this.root.name = 'garden-low-lateral-enclosure'
    this.stone.name = 'garden-boundary-stone-footings'
    this.wood.name = 'garden-boundary-open-timber'
    this.root.add(this.stone, this.wood)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    const dummy = new Object3D()
    let stones = 0, timbers = 0
    // The left side extends further forward; the right stays lower and shorter.
    for (const [x0, z0, x1, z1, bays, height] of [
      [-12.1, -24, -11.8, -47.7, 10, 0.96],
      [12.9, -31, 16.3, -48, 7, 0.72],
    ]) {
      const dx = (x1 - x0) / bays, dz = (z1 - z0) / bays
      const length = Math.hypot(dx, dz), angle = Math.atan2(dx, dz)
      const place = (mesh: InstancedMesh, index: number, t: number, y: number, w: number, h: number, d: number): void => {
        const x = x0 + dx * t, z = z0 + dz * t
        dummy.position.set(x, sampleDryGardenGroundWorldY(x, z, layout) + y, z)
        dummy.rotation.set(0, angle, 0); dummy.scale.set(w, h, d); dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
      }
      for (let bay = 0; bay < bays; bay++) {
        place(this.stone, stones++, bay + 0.5, 0.07, 0.40, 0.30, length + 0.02)
        place(this.wood, timbers++, bay, height * 0.5, 0.12, height + 0.12, 0.12)
        for (const y of [0.25, height - 0.06]) {
          place(this.wood, timbers++, bay + 0.5, y, 0.085, 0.07, length)
        }
        for (let slat = 1; slat <= 8; slat++) {
          place(this.wood, timbers++, bay + slat / 9, height * 0.5, 0.035, height - 0.28, 0.05)
        }
      }
      place(this.wood, timbers++, bays, height * 0.5, 0.12, height + 0.12, 0.12)
    }
    for (const [mesh, count] of [[this.stone, stones], [this.wood, timbers]] as const) {
      mesh.count = count; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere()
    }
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    this.stone.dispose(); this.wood.dispose(); this.geometry.dispose()
    this.stoneMaterial.dispose(); this.woodMaterial.dispose(); this.root.removeFromParent()
  }
}
