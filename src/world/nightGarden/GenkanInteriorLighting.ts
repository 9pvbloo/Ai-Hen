import { Group, SpotLight } from 'three'

/** Two finite, inward/downward paper-niche spills; no exposure, ambient or garden edits. */
export class GenkanInteriorLighting {
  private readonly root = new Group()
  private readonly lights: SpotLight[] = []
  private disposed = false

  constructor(parent: Group) {
    this.root.name = 'genkan-interior-warm-spill'
    for (const side of [-1, 1]) {
      const light = new SpotLight('#e8b478', 0, 3.15, 1.02, .85, 2)
      light.name = `genkan-paper-spill-${side < 0 ? 'left' : 'right'}`
      light.position.set(side * 1.96, 4.35, -4.65)
      light.target.position.set(side * .25, 3.05, -3.80)
      light.castShadow = false
      this.lights.push(light); this.root.add(light, light.target)
    }
    parent.add(this.root)
  }

  setIntensity(visibility: number): void {
    this.lights[0].intensity = 20 * visibility
    this.lights[1].intensity = 15 * visibility
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const light of this.lights) light.dispose()
    this.root.removeFromParent(); this.root.clear(); this.lights.length = 0
  }
}
