import { Color, Group, InstancedMesh, Object3D } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { createPineGeometry, createPrunedShrubGeometry } from './GardenPineGeometry'
import { GardenVegetationMaterials } from './GardenVegetationMaterials'

type VegetationPlacement = {
  readonly kind: 'shrub' | 'tree'
  readonly x: number
  readonly z: number
  readonly rotation: number
  readonly scale: readonly [number, number, number]
  readonly tone: number
  readonly layouts: readonly CompositionId[]
}

const VEGETATION_PLACEMENTS: readonly VegetationPlacement[] = [
  { kind: 'shrub', x: -10.8, z: -22.9, rotation: 0.5, scale: [1.55,0.95,1.1], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -10.9, z: -25.1, rotation: -0.3, scale: [1.7,0.8,1.3], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -11.1, z: -35.5, rotation: 0.8, scale: [2.0,1.1,1.25], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -9.4, z: -34.1, rotation: -0.2, scale: [1.25,0.65,1.1], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -10.9, z: -41.4, rotation: -0.3, scale: [1.6,1.0,1.2], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 11.7, z: -31.5, rotation: 0.6, scale: [1.65,0.85,1.1], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 13.4, z: -39.6, rotation: 0.4, scale: [1.6,0.9,1.15], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 13.1, z: -42.0, rotation: -0.7, scale: [1.4,0.7,1.1], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  // Quiet understory ties the open boundary to the existing hero islands.
  { kind: 'shrub', x: -11.1, z: -33.8, rotation: 0.7, scale: [1.5,0.6,1.1], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -10.8, z: -39.3, rotation: -0.4, scale: [1.8,0.7,1.2], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -10.6, z: -44.8, rotation: 0.3, scale: [1.35,0.6,1.1], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 14.5, z: -43.4, rotation: -0.6, scale: [1.45,0.55,1.0], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 5.3, z: -20.6, rotation: -0.32, scale: [1.15,0.72,1.1], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -7.5, z: -29.4, rotation: 0.58, scale: [1.5,0.85,1.3], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 7.3, z: -35.8, rotation: -0.46, scale: [1.4,0.75,1.15], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -5.6, z: -43.8, rotation: 0.18, scale: [1.9,0.8,1.4], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -2.6, z: -45.4, rotation: 0.3, scale: [1.4,0.65,1.1], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 9.7, z: -45.9, rotation: -0.5, scale: [1.9,0.8,1.4], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: 12, z: -47.2, rotation: 0.2, scale: [1.6,0.7,1.2], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'shrub', x: -8.5, z: -47.2, rotation: -0.2, scale: [1.9,0.65,1.25], tone: 2, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: -8.6, z: -30, rotation: 0.15, scale: [1.3,1.24,1.22], tone: 1, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: 8.1, z: -35.7, rotation: 2.5, scale: [1,1,1], tone: 0, layouts: ['desktop', 'tablet', 'portrait'] },
  { kind: 'tree', x: -6.8, z: -45.3, rotation: -0.3, scale: [1.25,1.3,1.2], tone: 1, layouts: ['desktop'] },
  { kind: 'tree', x: 12, z: -46.8, rotation: 2.8, scale: [1.15,1.15,1.1], tone: 0, layouts: ['desktop'] },
  { kind: 'tree', x: -3.7, z: -44.8, rotation: -0.3, scale: [0.9,0.95,0.9], tone: 1, layouts: ['tablet', 'portrait'] },
  { kind: 'tree', x: 7.8, z: -45.1, rotation: 2.8, scale: [0.85,0.9,0.85], tone: 0, layouts: ['tablet', 'portrait'] },
]

const FOLIAGE_TONES = [new Color('#9aafc5'), new Color('#b0c1d5'), new Color('#899fb9')]
const WOOD_TONES = [new Color('#beb6a5'), new Color('#cec4b1'), new Color('#b3af9e')]

/** Four trained pines, two related forms, and low planted masses. Static GPU instances. */
export class GardenVegetation {
  private readonly root = new Group()
  private readonly materials = new GardenVegetationMaterials()
  private readonly pineGeometries = [createPineGeometry(0), createPineGeometry(1)]
  private readonly shrubGeometry = createPrunedShrubGeometry()
  private readonly shrubs = new InstancedMesh(this.shrubGeometry, this.materials.foliage, 20)
  private readonly wood = this.pineGeometries.map(g => new InstancedMesh(g.wood, this.materials.wood, 2))
  private readonly foliage = this.pineGeometries.map(g => new InstancedMesh(g.foliage, this.materials.foliage, 2))
  private readonly dummy = new Object3D()

  constructor(parent: Group) {
    this.root.name = 'garden-authored-vegetation'
    this.shrubs.name = 'garden-pruned-understory'
    this.wood.forEach((mesh, i) => { mesh.name = 'garden-trained-pine-wood-' + i })
    this.foliage.forEach((mesh, i) => { mesh.name = 'garden-pine-needle-clouds-' + i })
    this.root.add(this.shrubs, ...this.wood, ...this.foliage)
    parent.add(this.root)
  }

  setLayout(layout: CompositionId): void {
    let shrubs = 0, trees = 0
    const counts = [0, 0]
    for (const placement of VEGETATION_PLACEMENTS) {
      if (!placement.layouts.includes(layout)) continue
      this.dummy.position.set(placement.x, sampleDryGardenGroundWorldY(placement.x, placement.z, layout) - 0.035, placement.z)
      this.dummy.rotation.set(0, placement.rotation, 0)
      this.dummy.scale.set(...placement.scale)
      this.dummy.updateMatrix()
      if (placement.kind === 'shrub') {
        this.place(this.shrubs, shrubs++, FOLIAGE_TONES[placement.tone])
      } else {
        const variant = trees++ % 2, instance = counts[variant]++
        this.place(this.wood[variant], instance, WOOD_TONES[placement.tone])
        this.place(this.foliage[variant], instance, FOLIAGE_TONES[placement.tone])
      }
    }
    this.commit(this.shrubs, shrubs)
    this.wood.forEach((mesh, i) => this.commit(mesh, counts[i]))
    this.foliage.forEach((mesh, i) => this.commit(mesh, counts[i]))
  }

  private place(mesh: InstancedMesh, index: number, color: Color): void {
    mesh.setMatrixAt(index, this.dummy.matrix); mesh.setColorAt(index, color)
  }

  private commit(mesh: InstancedMesh, count: number): void {
    mesh.count = count; mesh.visible = count > 0
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  dispose(): void {
    for (const mesh of [this.shrubs, ...this.wood, ...this.foliage]) mesh.dispose()
    this.shrubGeometry.dispose()
    for (const geometry of this.pineGeometries) { geometry.wood.dispose(); geometry.foliage.dispose() }
    this.materials.dispose()
    this.root.removeFromParent()
  }
}
