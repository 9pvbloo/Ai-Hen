import { Color, MathUtils } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../core/Camera'
import type { ScrollDirector } from '../core/ScrollDirector'
import type { Viewport } from '../core/Viewport'
import { Shanshui } from './shanshui/Shanshui'
import { AtmosphericField } from './shanshui/AtmosphericField'
import { SHANSHUI } from './shanshui/ShanshuiConfig'
import { MoonGate } from './moonGate/MoonGate'
import { NightGarden } from './nightGarden/NightGarden'
import { GATE_CAMERA_RANGE } from './moonGate/MoonGateCameraPath'

export class World {
  cameraOwner: 'shanshui' | 'moon-gate' | 'night-garden' = 'shanshui'
  readonly shanshui: Shanshui
  readonly moonGate: MoonGate
  readonly nightGarden: NightGarden
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
    this.moonGate = new MoonGate(scene, camera, viewport)
    this.nightGarden = new NightGarden(scene, camera, viewport)
    this.ready = this.shanshui.ready
    this.resize()
  }

  update(delta: number, scroll: ScrollDirector): void {
    const progress = scroll.reducedMotion ? scroll.rawProgress : scroll.smoothProgress
    this.cameraOwner = progress < GATE_CAMERA_RANGE.start ? 'shanshui'
      : progress < GATE_CAMERA_RANGE.end ? 'moon-gate' : 'night-garden'
    const reveal = MathUtils.smoothstep(progress, .52, .65)
    this.shanshui.setGardenTransition(MathUtils.clamp((progress - .49) / .22, 0, 1))
    this.moonGate.setCrossingProgress(reveal)
    this.shanshui.updateCamera(scroll, this.cameraOwner === 'shanshui')
    this.moonGate.update(scroll)
    if (this.cameraOwner === 'moon-gate') this.moonGate.updateCamera(scroll)
    this.nightGarden.update(delta, scroll, this.cameraOwner === 'night-garden', reveal)
    // The garden owns the final handoff pose. Evaluate card safety against that
    // camera, not the painting pose that initialized this frame.
    this.shanshui.updateLayers(delta)
  }

  resize(): void {
    this.shanshui.resize()
    this.moonGate.resize()
    this.nightGarden.resize()
    this.field.resize(this.viewport, this.camera.instance)
  }

  dispose(): void {
    this.shanshui.dispose()
    this.moonGate.dispose()
    this.nightGarden.dispose()
    this.field.dispose()
  }
}
