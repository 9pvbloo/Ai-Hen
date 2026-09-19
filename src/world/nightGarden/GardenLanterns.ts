import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PointLight } from 'three'
import type { Group as ThreeGroup } from 'three'

const LANTERN_POSITIONS = [
  [-2.85, -4.23, -14.1, 0.48], [-1.8, -4.23, -17.5, 0.40], [-0.55, -4.23, -21.3, 0.42],
  [1.0, -4.22, -25.1, 0.38], [2.45, -4.2, -28.2, 0.34],
] as const

/** Reusable stone-and-paper path lanterns: warm cues that make the route readable at night. */
export class GardenLanterns {
  private readonly root = new Group()
  private readonly frameGeometry = new BoxGeometry(1, 1, 1)
  private readonly stone = new MeshStandardMaterial({ color: '#2d3937', roughness: 0.82, metalness: 0.02 })
  private readonly paper = new MeshStandardMaterial({ color: '#765634', roughness: 0.68, emissive: '#8f4818', emissiveIntensity: 0.38 })
  private readonly lights: PointLight[] = []

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-path-lanterns'
    parent.add(this.root)
    for (const [x, y, z, scale] of LANTERN_POSITIONS) this.addLantern(x, y, z, scale)
  }

  setIntensity(value: number): void {
    this.paper.emissiveIntensity = 0.38 * value
    this.lights.forEach((light, index) => { light.intensity = (0.34 - index * 0.032) * value })
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.frameGeometry.dispose()
    this.stone.dispose()
    this.paper.dispose()
  }

  private addLantern(x: number, y: number, z: number, scale: number): void {
    const group = new Group()
    group.position.set(x, y, z)
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
    this.root.add(group)
  }
}
