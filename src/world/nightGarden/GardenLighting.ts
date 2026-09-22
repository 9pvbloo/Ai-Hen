import { DirectionalLight, HemisphereLight, Object3D } from 'three'
import type { Group } from 'three'

export class GardenLighting {
  private readonly sky = new HemisphereLight('#6f929b', '#07100f', 0.14)
  private readonly moon = new DirectionalLight('#dbecee', 2.15)
  private readonly rockRim = new DirectionalLight('#9bbbc2', 0.12)
  private readonly target = new Object3D()
  private readonly rimTarget = new Object3D()

  constructor(parent: Group) {
    this.moon.position.set(-14, 16, 3)
    this.target.position.set(0.8, -3.5, -32)
    this.moon.target = this.target
    this.rockRim.position.set(7, 5, -5)
    this.rimTarget.position.set(-3.4, -3.1, -24)
    this.rockRim.target = this.rimTarget
    parent.add(this.sky, this.moon, this.rockRim, this.target, this.rimTarget)
  }

  setIntensity(visibility: number): void {
    this.sky.intensity = 0.14 * visibility
    this.moon.intensity = 2.15 * visibility
    this.rockRim.intensity = 0.12 * visibility
  }
}
