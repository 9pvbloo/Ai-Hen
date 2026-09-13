import { Color, Scene } from 'three'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { ScrollDirector } from './ScrollDirector'
import { Viewport } from './Viewport'
import { World } from '../world/World'
import { DebugPanel } from '../ui/DebugPanel'

const MAX_DELTA_SECONDS = 0.05

export class Experience {
  readonly scene = new Scene()
  readonly viewport: Viewport
  readonly camera: Camera
  readonly renderer: Renderer
  readonly scroll: ScrollDirector
  readonly world: World

  private readonly debug: DebugPanel | null
  private frame: number | null = null
  private previousTime: number | null = null
  private elapsed = 0
  private disposed = false

  constructor(canvas: HTMLCanvasElement) {
    this.viewport = new Viewport(this.handleResize)
    this.camera = new Camera(this.viewport)
    try {
      this.renderer = new Renderer(canvas, this.viewport)
    } catch (error) {
      this.viewport.dispose()
      throw error
    }
    this.scene.background = new Color('#0b151b')
    this.world = new World(this.scene)
    this.scroll = new ScrollDirector(this.requestFrame)
    this.debug = new URLSearchParams(window.location.search).get('debug') === '1' ? new DebugPanel() : null

    document.addEventListener('visibilitychange', this.handleVisibility)
    window.addEventListener('pagehide', this.handlePageHide)
    window.addEventListener('pageshow', this.handlePageShow)
    this.handleVisibility()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopFrames()
    document.removeEventListener('visibilitychange', this.handleVisibility)
    window.removeEventListener('pagehide', this.handlePageHide)
    window.removeEventListener('pageshow', this.handlePageShow)
    this.viewport.dispose()
    this.scroll.dispose()
    this.debug?.dispose()
    this.world.dispose()
    this.scene.clear()
    this.renderer.dispose()
  }

  private readonly requestFrame = (): void => {
    if (this.disposed || document.hidden || this.frame !== null) return
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (timestamp: number): void => {
    this.frame = null
    if (this.disposed || document.hidden) return

    const frameDelta = this.previousTime === null || this.scroll.reducedMotion
      ? 0 : (timestamp - this.previousTime) / 1000
    const delta = Math.min(frameDelta, MAX_DELTA_SECONDS)
    this.previousTime = timestamp
    this.elapsed += delta
    this.scroll.update(delta)
    this.world.update(delta, this.scroll.smoothProgress, this.scroll.reducedMotion)
    this.renderer.render(this.scene, this.camera.instance)
    this.debug?.update(frameDelta, this.elapsed, this.viewport, this.renderer, this.camera, this.scroll)

    if (this.scroll.reducedMotion) {
      // Reduced motion renders only when an input or lifecycle event invalidates the scene.
      this.previousTime = null
    } else {
      this.requestFrame()
    }
  }

  private readonly handleResize = (): void => {
    this.camera.resize(this.viewport)
    this.renderer.resize(this.viewport)
    this.scroll.refresh()
    this.requestFrame()
  }

  private stopFrames(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.frame = null
    this.previousTime = null
    this.debug?.resetTiming()
  }

  private pause(): void {
    this.stopFrames()
    this.scroll.pause()
  }

  private resume(): void {
    this.previousTime = null
    this.viewport.refresh()
    this.scroll.resume()
    this.requestFrame()
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) this.pause()
    else this.resume()
  }

  private readonly handlePageHide = (event: PageTransitionEvent): void => {
    // A back/forward-cache entry must retain its resources so pageshow can resume it.
    if (event.persisted) this.pause()
    else this.dispose()
  }

  private readonly handlePageShow = (event: PageTransitionEvent): void => {
    if (event.persisted && !document.hidden) this.resume()
  }
}
