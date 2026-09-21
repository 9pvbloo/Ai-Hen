import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PointLight } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'

const LANTERN_ANCHORS = [
  [-3.05, -14.95, 0.58],
  [-6.45, -20.15, 0.49],
  [-1.25, -27.95, 0.48],
  [-2.05, -33.00, 0.42],
  [0.75, -39.15, 0.38],
] as const

/** Reusable stone-and-paper path lanterns: warm cues that make the route readable at night. */
export class GardenLanterns {
  private readonly root = new Group()
  private readonly frameGeometry = new BoxGeometry(1, 1, 1)
  private readonly stone = new MeshStandardMaterial({ color: '#2d3937', roughness: 0.82, metalness: 0.02 })
  private readonly paper = new MeshStandardMaterial({ color: '#765634', roughness: 0.68, emissive: '#8f4818', emissiveIntensity: 0.38 })
  private readonly lights: PointLight[] = []
  private readonly lanternGroups: Group[] = []

  constructor(parent: ThreeGroup, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-path-lanterns'
    parent.add(this.root)
    for (const [x, z, scale] of LANTERN_ANCHORS) this.addLantern(x, z, scale, layout)
  }

  setIntensity(value: number): void {
    this.paper.emissiveIntensity = 0.38 * value
    this.lights.forEach((light, index) => { light.intensity = (0.34 - index * 0.032) * value })
  }

  setVisible(visible: boolean): void { this.root.visible = visible }

  setLayout(layout: CompositionId): void {
    this.lanternGroups.forEach((group, index) => {
      const [x, z] = LANTERN_ANCHORS[index]
      group.position.y = sampleDryGardenGroundWorldY(x, z, layout)
    })
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.frameGeometry.dispose()
    this.stone.dispose()
    this.paper.dispose()
  }

  private addLantern(x: number, z: number, scale: number, layout: CompositionId): void {
    const group = new Group()
    group.position.set(x, sampleDryGardenGroundWorldY(x, z, layout), z)
    group.scale.setScalar(scale)
    const box = (width: number, height: number, depth: number, vertical: number, material: MeshStandardMaterial): void => {
      const mesh = new Mesh(this.frameGeometry, material)
      mesh.scale.set(width, height, depth)
      mesh.position.y = vertical
      group.add(mesh)
    }
    box(0.7, 0.1, 0.7, 0.05, this.stone)
    box(0.12, 0.82, 0.12, 0.48, this.stone)
    box(0.48, 0.46, 0.42, 0.48, this.paper)
    box(0.78, 0.1, 0.72, 0.91, this.stone)
    box(0.58, 0.12, 0.52, 1.03, this.stone)
    const light = new PointLight('#d69843', 0.32, 3.4, 2)
    light.position.set(0, 0.52, 0)
    this.lights.push(light)
    group.add(light)
    this.lanternGroups.push(group)
    this.root.add(group)
  }
}
