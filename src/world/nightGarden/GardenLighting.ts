import { DirectionalLight, HemisphereLight, Object3D } from 'three'
import type { Group } from 'three'
import { configureGardenShadow } from './GardenShadowSettings'

const NIGHT_LIGHT_LEVELS = { sky: 0.14, moon: 1.85, rockRim: 0.12 } as const

export class GardenLighting {
  private readonly sky = new HemisphereLight('#6f929b', '#07100f', NIGHT_LIGHT_LEVELS.sky)
  private readonly moon = new DirectionalLight('#dbecee', NIGHT_LIGHT_LEVELS.moon)
  private readonly rockRim = new DirectionalLight('#9bbbc2', NIGHT_LIGHT_LEVELS.rockRim)
  private readonly target = new Object3D()
  private readonly rimTarget = new Object3D()

  constructor(parent: Group) {
    // Oblique moon key separates roof planes while letting the recessed facade fall quiet.
    this.moon.name = 'garden-moon-key'
    // Translate light and target together: approved illumination direction is unchanged.
    this.moon.position.set(-21.2, 14, -27.6)
    this.target.position.set(0, -2.5, -39)
    this.moon.target = this.target
    configureGardenShadow(this.moon, 'moon')
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

  dispose(): void { this.moon.dispose(); this.rockRim.dispose(); this.sky.dispose() }
}
