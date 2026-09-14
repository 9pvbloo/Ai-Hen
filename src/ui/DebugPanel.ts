import type { Camera } from '../core/Camera'
import type { Renderer } from '../core/Renderer'
import type { ScrollDirector } from '../core/ScrollDirector'
import type { Viewport } from '../core/Viewport'
import type { World } from '../world/World'

const UPDATE_INTERVAL = 0.25

export class DebugPanel {
  private readonly element = document.createElement('aside')
  private readonly values = new Map<string, HTMLElement>()
  private sampleTime = 0
  private sampleFrames = 0

  constructor() {
    this.element.className = 'debug-panel'
    this.element.setAttribute('aria-label', 'Runtime diagnostics')
    const heading = document.createElement('h2')
    heading.textContent = 'Runtime diagnostics'
    const list = document.createElement('dl')
    for (const label of ['FPS', 'Elapsed', 'Delta', 'Raw scroll', 'Smooth scroll', 'Viewport', 'Pixel ratio',
      'Category', 'Draw calls', 'Triangles', 'Camera x / y / z', 'Reduced motion', 'Shanshui', 'Composition',
      'Moon Gate', 'Gate progress', 'Gate visibility', 'Camera approach', 'Gate layout', 'Layers', 'Textures']) {
      const term = document.createElement('dt')
      const value = document.createElement('dd')
      term.textContent = label
      value.textContent = '—'
      this.values.set(label, value)
      list.append(term, value)
    }
    this.element.append(heading, list)
    document.body.append(this.element)
  }

  update(delta: number, elapsed: number, viewport: Viewport, renderer: Renderer,
    camera: Camera, scroll: ScrollDirector, world: World): void {
    this.sampleTime += delta
    if (delta > 0) this.sampleFrames++
    if (delta > 0 && this.sampleTime < UPDATE_INTERVAL) return

    const position = camera.instance.position
    this.set('FPS', scroll.reducedMotion ? 'On demand' : this.sampleTime > 0
      ? (this.sampleFrames / this.sampleTime).toFixed(0) : 'Measuring')
    this.set('Elapsed', `${elapsed.toFixed(2)} s`)
    this.set('Delta', `${(delta * 1000).toFixed(1)} ms`)
    this.set('Raw scroll', scroll.rawProgress.toFixed(4))
    this.set('Smooth scroll', scroll.smoothProgress.toFixed(4))
    this.set('Viewport', `${viewport.width} × ${viewport.height}`)
    this.set('Pixel ratio', viewport.pixelRatio.toFixed(2))
    this.set('Category', viewport.category)
    this.set('Draw calls', String(renderer.info.render.calls))
    this.set('Triangles', String(renderer.info.render.triangles))
    this.set('Camera x / y / z', `${position.x.toFixed(2)} / ${position.y.toFixed(2)} / ${position.z.toFixed(2)}`)
    this.set('Reduced motion', scroll.reducedMotion ? 'Yes' : 'No')
    this.set('Shanshui', world.shanshui.loadState === 'ready' ? world.shanshui.stage : world.shanshui.loadState)
    this.set('Composition', world.shanshui.compositionId)
    this.set('Moon Gate', world.moonGate.state)
    this.set('Gate progress', world.moonGate.progress.toFixed(4))
    this.set('Gate visibility', world.moonGate.visibility.toFixed(2))
    this.set('Camera approach', world.moonGate.cameraApproach.toFixed(2))
    this.set('Gate layout', world.moonGate.layoutId)
    this.set('Layers', String(world.shanshui.layerCount))
    this.set('Textures', String(renderer.info.memory.textures))
    this.resetTiming()
  }

  resetTiming(): void {
    this.sampleTime = 0
    this.sampleFrames = 0
  }

  dispose(): void {
    this.element.remove()
    this.values.clear()
  }

  private set(label: string, value: string): void {
    this.values.get(label)!.textContent = value
  }
}
