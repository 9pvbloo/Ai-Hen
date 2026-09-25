import { Group, MathUtils, Vector3 } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../../core/Camera'
import type { ScrollDirector } from '../../core/ScrollDirector'
import type { Viewport } from '../../core/Viewport'
import { InkLayer } from './InkLayer'
import type { LayerFrame } from './InkLayer'
import { MistLayer } from './MistLayer'
import { COMPOSITIONS, LAYERS, SHANSHUI } from './ShanshuiConfig'
import type { CompositionConfig, CompositionId, LayerId } from './ShanshuiConfig'

type LayerExitWindow = readonly [start: number, end: number]

// The painted depth stack must retire in the same order the garden camera meets it.
// This preserves the far landscape as an atmospheric backdrop while clearing the
// foreground cards before the threshold is crossed.
const GARDEN_EXIT_WINDOWS: Record<LayerId, LayerExitWindow> = {
  foreground: [0.01, 0.18],
  near: [0.06, 0.25],
  mistFront: [0.04, 0.22],
  mid: [0.22, 0.48],
  mistBack: [0.28, 0.56],
  far: [0.44, 0.72],
}

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
    gardenTransition: 0, cameraPosition: new Vector3(), cameraDirection: new Vector3(0, 0, -1),
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

  /** Establishes the painting pose before the Moon Gate applies its authored approach. */
  updateCamera(scroll: ScrollDirector): void {
    if (this.loadState !== 'ready') return
    const progress = scroll.reducedMotion ? scroll.rawProgress : scroll.smoothProgress
    const awakening = MathUtils.smoothstep(scroll.getRangeProgress(SHANSHUI.ranges.awakening, !scroll.reducedMotion), 0, 1)
    const living = MathUtils.smoothstep(scroll.getRangeProgress(SHANSHUI.ranges.living, !scroll.reducedMotion), 0, 1)
    this.stage = progress < SHANSHUI.ranges.awakening.start ? 'Painting'
      : progress < SHANSHUI.ranges.living.start ? 'Awakening' : 'Living landscape'
    this.frame.depth = awakening * SHANSHUI.awakeningWeight + living * (1 - SHANSHUI.awakeningWeight)
    this.frame.motion = this.composition.motion * (scroll.reducedMotion ? SHANSHUI.reducedMotionScale : 1)
    this.frame.reducedMotion = scroll.reducedMotion
    this.frame.gardenTransition = this.gardenTransition
    // A global opacity fade left near cards in front of the garden camera. Stage the
    // painted planes by their authored depth instead: foreground first, then near,
    // then middle distance, with the far ridge remaining as the final depth cue.
    this.frame.mistVisibility = 1
    this.camera.setPose(0, 0, this.composition.cameraZ - this.composition.push * this.frame.depth * this.frame.motion)
  }

  /** Applies painted-card visibility against the final camera pose selected by the current world frame. */
  updateLayers(delta: number): void {
    if (this.loadState !== 'ready') return
    this.frame.delta = delta
    this.camera.instance.updateMatrixWorld()
    this.frame.cameraPosition.copy(this.camera.instance.position)
    this.camera.instance.getWorldDirection(this.frame.cameraDirection)
    for (const layer of this.layers) {
      const [start, end] = GARDEN_EXIT_WINDOWS[layer.config.id]
      this.frame.visibility = 1 - MathUtils.smoothstep(this.gardenTransition, start, end)
      layer.update(this.frame)
    }
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
