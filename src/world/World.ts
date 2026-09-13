import { AmbientLight, BoxGeometry, DirectionalLight, Group, Mesh, MeshLambertMaterial } from 'three'
import type { Scene } from 'three'

const ROTATION_SPEED = 0.15

export class World {
  private readonly group = new Group()
  private readonly geometry = new BoxGeometry(1, 1, 1)
  private readonly material = new MeshLambertMaterial({ color: '#c8ceca' })
  private readonly cube = new Mesh(this.geometry, this.material)

  constructor(scene: Scene) {
    this.group.name = 'phase-0-diagnostics'
    this.cube.name = 'temporary-diagnostic-cube'
    this.cube.rotation.set(0.3, 0.4, 0)
    const light = new DirectionalLight('#e7e2d7', 2)
    light.position.set(3, 4, 5)
    this.group.add(this.cube, new AmbientLight('#c8ceca', 1), light)
    scene.add(this.group)
  }

  update(delta: number, progress: number, reducedMotion: boolean): void {
    if (reducedMotion) return
    this.cube.rotation.y = (this.cube.rotation.y + delta * ROTATION_SPEED) % (Math.PI * 2)
    this.cube.rotation.x = 0.3 + progress * 0.5
  }

  dispose(): void {
    this.group.removeFromParent()
    this.geometry.dispose()
    this.material.dispose()
    this.group.clear()
  }
}
