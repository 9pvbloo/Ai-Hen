import { Group, SpotLight } from 'three'
import { INTERIOR_LANTERNS as L, INTERIOR_WALL_LAMP as W } from './GenkanInteriorLanterns'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'
import { configureGardenShadow } from './GardenShadowSettings'

/** Directional practicals follow their visible paper sources. No symmetric wall fill. */
export class GenkanInteriorLighting {
  private readonly root = new Group()
  private readonly lights: SpotLight[] = []
  private disposed = false

  constructor(parent: Group) {
    this.root.name = 'genkan-interior-warm-spill'
    const andon = new SpotLight('#e6bc88', 0, 3.8, 1.18, .95, 2)
    andon.name = 'genkan-andon-spill'
    andon.position.set(L.x, D.raisedY + L.height * .52, L.z)
    andon.target.position.set(-.35, D.lowerY + .06, D.stepZ + .30)
    configureGardenShadow(andon, 'interior')
    const display = new SpotLight('#e4c39a', 0, 2.05, .73, 1, 2)
    display.name = 'genkan-display-lamp'
    display.position.set(W.x + .04, W.y - .015, W.z)
    display.target.position.set(-1.94, 4.18, -5.49)
    this.lights.push(andon, display)
    for (const light of this.lights) this.root.add(light, light.target)
    parent.add(this.root)
  }

  setIntensity(visibility: number): void {
    this.lights[0].intensity = 1.2 * visibility
    this.lights[1].intensity = 1.6 * visibility
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const light of this.lights) light.dispose()
    this.root.removeFromParent(); this.root.clear(); this.lights.length = 0
  }
}
