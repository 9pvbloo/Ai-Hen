import { PerspectiveCamera } from 'three'
import type { Viewport } from './Viewport'

export class Camera {
  readonly instance = new PerspectiveCamera(45, 1, 0.1, 100)

  constructor(viewport: Viewport) {
    this.resize(viewport)
    this.setPose(0, 0, 5)
  }

  resize(viewport: Viewport): void {
    this.instance.aspect = viewport.aspect
    this.instance.updateProjectionMatrix()
  }

  setPose(x: number, y: number, z: number, targetX = 0, targetY = 0, targetZ = 0): void {
    this.instance.position.set(x, y, z)
    this.instance.lookAt(targetX, targetY, targetZ)
  }
}
