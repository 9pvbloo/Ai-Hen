import { Color } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../core/Camera'
import type { ScrollDirector } from '../core/ScrollDirector'
import type { Viewport } from '../core/Viewport'
import { Shanshui } from './shanshui/Shanshui'
import { AtmosphericField } from './shanshui/AtmosphericField'
import { SHANSHUI } from './shanshui/ShanshuiConfig'

export class World {
  readonly shanshui: Shanshui
  readonly ready: Promise<boolean>
  private readonly field: AtmosphericField
  private readonly camera: Camera
  private readonly viewport: Viewport

  constructor(scene: Scene, camera: Camera, viewport: Viewport) {
    this.camera = camera
    this.viewport = viewport
    scene.background = new Color(SHANSHUI.background)
    this.field = new AtmosphericField(scene)
    this.shanshui = new Shanshui(scene, camera, viewport)
    this.ready = this.shanshui.ready
    this.resize()
  }

  update(delta: number, scroll: ScrollDirector): void {
    this.shanshui.update(delta, scroll)
  }

  resize(): void {
    this.shanshui.resize()
    this.field.resize(this.viewport, this.camera.instance)
  }

  dispose(): void {
    this.shanshui.dispose()
    this.field.dispose()
  }
}
