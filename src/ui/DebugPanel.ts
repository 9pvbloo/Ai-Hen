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
      'Moon Gate', 'Gate progress', 'Gate visibility', 'Camera approach', 'Gate layout', 'Phase 3 state',
      'Phase 3 local', 'Crossing progress', 'Garden visibility', 'Crossing offset', 'Pond visibility',
      'Mist intensity', 'Garden layout', 'Hybrid profile', 'Tree-line opacity', 'Willow opacity', 'Jade foliage opacity', 'Scholar rock opacity', 'Bamboo opacity',
      'Reeds opacity', 'Nearest card', 'Tree-line distance', 'Layers', 'Textures']) {
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
    this.set('Phase 3 state', world.nightGarden.state)
    this.set('Phase 3 local', world.nightGarden.progress.toFixed(4))
    this.set('Crossing progress', world.nightGarden.crossingProgress.toFixed(4))
    this.set('Garden visibility', world.nightGarden.visibility.toFixed(2))
    this.set('Crossing offset', world.nightGarden.cameraOffset.toFixed(2))
    this.set('Pond visibility', world.nightGarden.pondVisibility.toFixed(2))
    this.set('Mist intensity', world.nightGarden.mistIntensity.toFixed(2))
    this.set('Garden layout', world.nightGarden.layoutId)
    this.set('Hybrid profile', world.nightGarden.layoutId)
    this.set('Tree-line opacity', world.nightGarden.hybridTreeLineOpacity.toFixed(3))
    this.set('Willow opacity', world.nightGarden.hybridWillowOpacity.toFixed(3))
    this.set('Jade foliage opacity', world.nightGarden.hybridJadeFoliageOpacity.toFixed(3))
    this.set('Scholar rock opacity', world.nightGarden.hybridScholarRockOpacity.toFixed(3))
    this.set('Bamboo opacity', world.nightGarden.hybridBambooOpacity.toFixed(3))
    this.set('Reeds opacity', world.nightGarden.hybridReedsOpacity.toFixed(3))
    this.set('Nearest card', Number.isFinite(world.nightGarden.hybridNearestCardDistance)
      ? world.nightGarden.hybridNearestCardDistance.toFixed(2) : 'Loading')
    this.set('Tree-line distance', Number.isFinite(world.nightGarden.hybridTreeLineDistance)
      ? world.nightGarden.hybridTreeLineDistance.toFixed(2) : 'Loading')
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
