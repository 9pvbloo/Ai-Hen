import { Group, PointLight } from 'three'

/** Local mansion coordinates: two short-range practical zones, never one light per bay. */
export const PAVILION_LIGHT_ZONES = [
  { name: 'inner-threshold', color: '#d2a06d', intensity: 4.2, range: 4.0, decay: 2,
    position: [0, 4.35, 1.15] },
  { name: 'covered-landing', color: '#bd936a', intensity: 1.8, range: 3.4, decay: 2,
    position: [0, 3.55, 5.05] },
] as const

/** The pavilion owns both lights; resize moves their parent, never creates replacements. */
export class GardenPavilionLighting {
  private readonly root = new Group()
  private readonly lights: PointLight[] = []

  constructor(parent: Group) {
    this.root.name = 'pavilion-architectural-lights'
    for (const zone of PAVILION_LIGHT_ZONES) {
      const light = new PointLight(zone.color, 0, zone.range, zone.decay)
      light.name = `pavilion-${zone.name}`
      const [x, y, z] = zone.position
      light.position.set(x, y, z)
      light.castShadow = false
      this.lights.push(light)
      this.root.add(light)
    }
    parent.add(this.root)
  }

  setIntensity(visibility: number): void {
    for (let index = 0; index < this.lights.length; index++) {
      this.lights[index].intensity = PAVILION_LIGHT_ZONES[index].intensity * visibility
    }
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.lights.length = 0
  }
}
