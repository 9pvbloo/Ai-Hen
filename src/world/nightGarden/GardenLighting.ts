import { DirectionalLight, HemisphereLight, Object3D } from 'three'
import type { Group } from 'three'

const NIGHT_LIGHT_LEVELS = { sky: 0.14, moon: 1.85, rockRim: 0.12 } as const

export class GardenLighting {
  private readonly sky = new HemisphereLight('#6f929b', '#07100f', NIGHT_LIGHT_LEVELS.sky)
  private readonly moon = new DirectionalLight('#dbecee', NIGHT_LIGHT_LEVELS.moon)
  private readonly rockRim = new DirectionalLight('#9bbbc2', NIGHT_LIGHT_LEVELS.rockRim)
  private readonly target = new Object3D()
  private readonly rimTarget = new Object3D()

  constructor(parent: Group) {
    // Oblique moon key separates roof planes while letting the recessed facade fall quiet.
    this.moon.position.set(-18, 14, -42)
    this.target.position.set(3.2, -2.5, -53.4)
    this.moon.target = this.target
    this.rockRim.position.set(7, 5, -5)
    this.rimTarget.position.set(-3.4, -3.1, -24)
    this.rockRim.target = this.rimTarget
    parent.add(this.sky, this.moon, this.rockRim, this.target, this.rimTarget)
  }

  setIntensity(visibility: number): void {
    this.sky.intensity = NIGHT_LIGHT_LEVELS.sky * visibility
    this.moon.intensity = NIGHT_LIGHT_LEVELS.moon * visibility
    this.rockRim.intensity = NIGHT_LIGHT_LEVELS.rockRim * visibility
  }
}
