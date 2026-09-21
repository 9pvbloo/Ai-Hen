import { DirectionalLight, HemisphereLight, Object3D, PointLight } from 'three'
import type { Group } from 'three'

export class GardenLighting {
  private readonly sky = new HemisphereLight('#6f929b', '#07100f', 0.23)
  private readonly moon = new DirectionalLight('#dbecee', 3.05)
  private readonly waterBounce = new PointLight('#91bdc7', 0.52, 24, 2)
  private readonly rockRim = new DirectionalLight('#9bbbc2', 0.34)
  private readonly pathLanterns = [
    new PointLight('#e2a24a', 0.72, 5.8, 2), new PointLight('#e2a24a', 0.56, 4.8, 2),
    new PointLight('#d98d34', 0.42, 4.4, 2),
  ]
  private readonly target = new Object3D()
  private readonly rimTarget = new Object3D()

  constructor(parent: Group) {
    this.moon.position.set(-12, 15, 4)
    this.target.position.set(-0.8, -4.15, -24)
    this.moon.target = this.target
    this.waterBounce.position.set(0.6, -1.2, -23.2)
    this.rockRim.position.set(8, 5, -4)
    this.rimTarget.position.set(-5.1, -3.2, -21.4)
    this.rockRim.target = this.rimTarget
    this.pathLanterns[0].position.set(-3.05, -3.65, -14.95)
    this.pathLanterns[1].position.set(-1.25, -3.72, -27.95)
    this.pathLanterns[2].position.set(0.75, -3.65, -39.15)
    parent.add(this.sky, this.moon, this.waterBounce, this.rockRim, this.target, this.rimTarget, ...this.pathLanterns)
  }

  setIntensity(visibility: number): void {
    this.sky.intensity = 0.23 * visibility
    this.moon.intensity = 3.05 * visibility
    this.waterBounce.intensity = 0.52 * visibility
    this.rockRim.intensity = 0.34 * visibility
    this.pathLanterns[0].intensity = 0.72 * visibility
    this.pathLanterns[1].intensity = 0.56 * visibility
    this.pathLanterns[2].intensity = 0.42 * visibility
  }
}
