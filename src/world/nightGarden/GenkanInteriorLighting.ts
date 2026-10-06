import { PREMIUM_ENERGY } from './PremiumPracticalEnergy'
import { Group, PointLight, SpotLight } from 'three'
import { GENKAN_PENDANT as P } from './GenkanPendant'
import { PRACTICAL_LIGHT } from './PracticalLightPalette'
import { INTERIOR_LANTERNS as L, INTERIOR_WALL_LAMP as W } from './GenkanInteriorLanterns'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'
import { configureGardenShadow } from './GardenShadowSettings'

/** Directional practicals follow their visible paper sources. No symmetric wall fill. */
export class GenkanInteriorLighting {
  private readonly root = new Group()
  private readonly lights: (SpotLight | PointLight)[] = []
  private disposed = false

  constructor(parent: Group) {
    this.root.name = 'genkan-interior-warm-spill'
    const pendant = new SpotLight(PRACTICAL_LIGHT.source, 0, 4.8, 1.22, .85, 2)
    pendant.name = 'genkan-pendant-spill'
    pendant.position.set(P.x, P.y, P.z)
    pendant.target.position.set(-.20, D.lowerY, D.stepZ + .25)
    configureGardenShadow(pendant, 'interior')
    const display = new SpotLight(PRACTICAL_LIGHT.source, 0, 2.05, .73, 1, 2)
    display.name = 'genkan-display-lamp'
    display.position.set(W.x + .04, W.y - .015, W.z)
    display.target.position.set(-1.94, 4.18, -5.49)
    const andon = new PointLight(PRACTICAL_LIGHT.source, 0, 1.45, 2)
    andon.name = 'genkan-andon-local'
    andon.position.set(L.x, D.raisedY + L.height * .52, L.z)
    const upper = new PointLight(PRACTICAL_LIGHT.bounce, 0, 1.45, 2)
    upper.name = 'genkan-pendant-upper-diffusion'
    upper.position.set(P.x,P.y+.12,P.z)
    this.lights.push(pendant, display, andon, upper)
    for (const light of this.lights) {
      this.root.add(light)
      if(light instanceof SpotLight)this.root.add(light.target)
    }
    parent.add(this.root)
  }

  setIntensity(visibility: number): void {
    this.lights[0].intensity = PREMIUM_ENERGY.interior.pendant * visibility
    this.lights[1].intensity = PREMIUM_ENERGY.interior.display * visibility
    this.lights[2].intensity = PREMIUM_ENERGY.interior.andon * visibility
    this.lights[3].intensity = PREMIUM_ENERGY.interior.upper * visibility
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const light of this.lights) light.dispose()
    this.root.removeFromParent(); this.root.clear(); this.lights.length = 0
  }
}
