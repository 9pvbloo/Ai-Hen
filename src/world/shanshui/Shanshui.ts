import { Group, MathUtils } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../../core/Camera'
import type { ScrollDirector } from '../../core/ScrollDirector'
import type { Viewport } from '../../core/Viewport'
import { InkLayer } from './InkLayer'
import type { LayerFrame } from './InkLayer'
import { MistLayer } from './MistLayer'
import { COMPOSITIONS, LAYERS, SHANSHUI } from './ShanshuiConfig'
import type { CompositionConfig, CompositionId } from './ShanshuiConfig'

export class Shanshui {
  readonly ready: Promise<boolean>
  loadState: 'loading' | 'ready' | 'error' | 'disposed' = 'loading'
  stage = 'Painting'
  compositionId: CompositionId = 'desktop'

  private readonly group = new Group()
  private readonly layers: InkLayer[]
  private readonly camera: Camera
  private readonly viewport: Viewport
  private composition: CompositionConfig = COMPOSITIONS.desktop
  private readonly frame: LayerFrame = {
    depth: 0, motion: 1, delta: 0, reducedMotion: false, visibility: 1, mistVisibility: 1,
  }
  private gardenTransition = 0

  constructor(scene: Scene, camera: Camera, viewport: Viewport) {
    this.camera = camera
    this.viewport = viewport
    this.group.name = 'shanshui'
    this.group.visible = false
    this.layers = LAYERS.map(config => config.id === 'mistBack' || config.id === 'mistFront'
      ? new MistLayer(config) : new InkLayer(config))
    for (const layer of this.layers) this.group.add(layer.mesh)
    scene.add(this.group)
    this.resize()
    this.ready = this.finishLoading()
  }

  get layerCount(): number { return this.loadState === 'ready' ? this.layers.length : 0 }

  resize(): void {
    this.compositionId = this.viewport.aspect < 0.6 || (this.viewport.category === 'mobile' && this.viewport.aspect < 1) ? 'portrait'
      : this.viewport.category === 'desktop' ? 'desktop' : 'tablet'
    this.composition = COMPOSITIONS[this.compositionId]
    this.camera.setPose(0, 0, this.composition.cameraZ)
    for (const layer of this.layers) layer.resize(this.viewport, this.camera.instance, this.composition)
  }

  update(delta: number, scroll: ScrollDirector): void {
    if (this.loadState !== 'ready') return
    const progress = scroll.reducedMotion ? scroll.rawProgress : scroll.smoothProgress
    const awakening = MathUtils.smoothstep(scroll.getRangeProgress(SHANSHUI.ranges.awakening, !scroll.reducedMotion), 0, 1)
    const living = MathUtils.smoothstep(scroll.getRangeProgress(SHANSHUI.ranges.living, !scroll.reducedMotion), 0, 1)
    this.stage = progress < SHANSHUI.ranges.awakening.start ? 'Painting'
      : progress < SHANSHUI.ranges.living.start ? 'Awakening' : 'Living landscape'
    this.frame.depth = awakening * SHANSHUI.awakeningWeight + living * (1 - SHANSHUI.awakeningWeight)
    this.frame.motion = this.composition.motion * (scroll.reducedMotion ? SHANSHUI.reducedMotionScale : 1)
    this.frame.delta = delta
    this.frame.reducedMotion = scroll.reducedMotion
    // The camera physically passes the painted layers during the gate crossing. This
    // late, gentle opacity support only lets humidity finish the compositional handoff.
    this.frame.visibility = 1 - MathUtils.smoothstep(this.gardenTransition, 0.3, 0.68)
    // These source-image cards must clear before the camera reaches their planes.
    // Garden-local radial mist takes over, so this remains a spatial exchange in either direction.
    this.frame.mistVisibility = 1 - MathUtils.smoothstep(this.gardenTransition, 0.08, 0.28)
    this.camera.setPose(0, 0, this.composition.cameraZ - this.composition.push * this.frame.depth * this.frame.motion)
    for (const layer of this.layers) layer.update(this.frame)
  }

  setGardenTransition(progress: number): void {
    this.gardenTransition = MathUtils.clamp(progress, 0, 1)
  }

  dispose(): void {
    if (this.loadState === 'disposed') return
    this.loadState = 'disposed'
    this.group.removeFromParent()
    for (const layer of this.layers) layer.dispose()
    this.group.clear()
  }

  private async finishLoading(): Promise<boolean> {
    const loaded = await Promise.all(this.layers.map(layer => layer.ready))
    if (this.loadState === 'disposed') return false
    if (loaded.some(success => !success)) {
      this.loadState = 'error'
      for (const layer of this.layers) layer.dispose()
      return false
    }
    // Present one composed painting, rather than revealing images in network-arrival order.
    this.resize()
    this.loadState = 'ready'
    this.group.visible = true
    return true
  }
}
