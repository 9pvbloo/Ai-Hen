import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PointLight } from 'three'
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
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly roofGeometry = new ConeGeometry(0.52, 0.26, 4)
  private readonly crownGeometry = new CylinderGeometry(0.075, 0.075, 0.14, 6)
  private readonly stone = new MeshStandardMaterial({ color: '#2d3937', roughness: 0.82, metalness: 0.02 })
  private readonly frame = new MeshStandardMaterial({ color: '#172221', roughness: 0.78, metalness: 0.025 })
  private readonly roof = new MeshStandardMaterial({ color: '#1a2828', roughness: 0.84, metalness: 0.02 })
  private readonly paper = new MeshStandardMaterial({
    color: '#a87855', roughness: 0.74, emissive: '#9e5422', emissiveIntensity: 0.52,
  })
  private readonly lights: PointLight[] = []
  private readonly lanternGroups: Group[] = []

  constructor(parent: ThreeGroup, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-path-lanterns'
    parent.add(this.root)
    for (const [x, z, scale] of LANTERN_ANCHORS) this.addLantern(x, z, scale, layout)
  }

  setIntensity(value: number): void {
    this.paper.emissiveIntensity = 0.52 * value
    this.lights.forEach((light, index) => { light.intensity = (0.31 - index * 0.036) * value })
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
    this.boxGeometry.dispose()
    this.roofGeometry.dispose()
    this.crownGeometry.dispose()
    this.stone.dispose()
    this.frame.dispose()
    this.roof.dispose()
    this.paper.dispose()
  }

  private addLantern(x: number, z: number, scale: number, layout: CompositionId): void {
    const group = new Group()
    group.position.set(x, sampleDryGardenGroundWorldY(x, z, layout), z)
    group.scale.setScalar(scale)
    const box = (width: number, height: number, depth: number, vertical: number, material: MeshStandardMaterial,
      horizontal = 0, longitudinal = 0): void => {
      const mesh = new Mesh(this.boxGeometry, material)
      mesh.scale.set(width, height, depth)
      mesh.position.set(horizontal, vertical, longitudinal)
      group.add(mesh)
    }

    // A stepped plinth, framed paper chamber, and low hip cap give the lantern a
    // crafted silhouette without adding fragile or high-density detail.
    box(0.82, 0.09, 0.78, 0.045, this.stone)
    box(0.64, 0.10, 0.60, 0.14, this.stone)
    box(0.42, 0.10, 0.40, 0.24, this.frame)
    box(0.58, 0.065, 0.54, 0.335, this.frame)
    box(0.48, 0.50, 0.42, 0.62, this.paper)
    for (const horizontal of [-0.27, 0.27]) for (const longitudinal of [-0.21, 0.21]) {
      box(0.065, 0.62, 0.065, 0.64, this.frame, horizontal, longitudinal)
    }
    box(0.55, 0.052, 0.055, 0.62, this.frame, 0, 0.225)
    box(0.55, 0.052, 0.055, 0.62, this.frame, 0, -0.225)
    box(0.61, 0.09, 0.57, 0.97, this.frame)
    const roof = new Mesh(this.roofGeometry, this.roof)
    roof.name = 'garden-lantern-hip-cap'
    roof.position.y = 1.14
    roof.rotation.y = Math.PI / 4
    group.add(roof)
    const crown = new Mesh(this.crownGeometry, this.frame)
    crown.name = 'garden-lantern-crown'
    crown.position.y = 1.34
    group.add(crown)
    box(0.17, 0.055, 0.17, 1.435, this.roof)
    const light = new PointLight('#d69843', 0.31, 2.75, 2)
    light.position.set(0, 0.68, 0)
    this.lights.push(light)
    group.add(light)
    this.lanternGroups.push(group)
    this.root.add(group)
  }
}
