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
    // Establish a dark world behind the aperture; readable architecture follows
    // the centered passage, before the unchanged approved camera match.
    const reveal = Math.max(MathUtils.smoothstep(progress, .625, .71),
      .001 * MathUtils.smoothstep(progress, .55, .58))
    this.shanshui.setGardenTransition(MathUtils.clamp((progress - .43) / .18, 0, 1))
    this.moonGate.setCrossingProgress(MathUtils.smoothstep(progress, .51, .58),
      MathUtils.smoothstep(progress, .60, .64))
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
