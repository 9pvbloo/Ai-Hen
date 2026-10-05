import { Group, PointLight, SpotLight } from 'three'
import { configureGardenShadow } from './GardenShadowSettings'

export const PAVILION_SPILL_ZONES = [
  { name: 'hall-spill', y: 4.72, z: -1.15, targetY: 2.25, targetZ: 6.3, range: 12, angle: 0.74, penumbra: 0.9, intensity: 21.5 },
  { name: 'upper-spill', y: 8.6, z: 2.5, targetY: 8.1, targetZ: 0.1, range: 3.5, angle: 1.05, penumbra: 0.9, intensity: 4 },
] as const

/** Local mansion coordinates: two short-range practical zones, never one light per bay. */
export const PAVILION_LIGHT_ZONES = [
  { name: 'inner-threshold', color: '#d2a06d', intensity: 2.4, range: 2.4, decay: 2,
    position: [0, 4.35, -1.15] },
  { name: 'covered-landing', color: '#bd936a', intensity: 2.2, range: 3.2, decay: 2,
    position: [0, 3.10, 6.15] },
] as const

/** Finite facade spill avoids the unbounded rear-eave response of unshadowed area lights. */
export class GardenPavilionLighting {
  private readonly root = new Group()
  private readonly lights: PointLight[] = []
  private readonly spillLights: SpotLight[] = []

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
    for (const zone of PAVILION_SPILL_ZONES) {
      const light = new SpotLight('#efb46b', 0, zone.range, zone.angle, zone.penumbra, 2)
      light.name = `pavilion-${zone.name}`
      light.position.set(0, zone.y, zone.z)
      light.target.position.set(0, zone.targetY, zone.targetZ)
      light.castShadow = false
      this.spillLights.push(light)
      if (zone.name === 'hall-spill') configureGardenShadow(light, 'hall')
      this.root.add(light, light.target)
    }
    parent.add(this.root)
  }

  setIntensity(visibility: number): void {
    this.spillLights.forEach((light, i) => { light.intensity = PAVILION_SPILL_ZONES[i].intensity * visibility })
    for (let index = 0; index < this.lights.length; index++) {
      this.lights[index].intensity = PAVILION_LIGHT_ZONES[index].intensity * visibility
    }
  }

  dispose(): void {
    for (const light of [...this.lights, ...this.spillLights]) light.dispose()
    this.root.removeFromParent()
    this.root.clear()
    this.lights.length = 0
    this.spillLights.length = 0
  }
}
