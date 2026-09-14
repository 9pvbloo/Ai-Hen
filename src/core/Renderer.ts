import { NoToneMapping, SRGBColorSpace, WebGLRenderer } from 'three'
import type { Camera, Scene, ToneMapping } from 'three'
import type { Viewport } from './Viewport'

export class Renderer {
  readonly instance: WebGLRenderer

  constructor(canvas: HTMLCanvasElement, viewport: Viewport, toneMapping: ToneMapping = NoToneMapping) {
    this.instance = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.instance.outputColorSpace = SRGBColorSpace
    // Painted textures need no HDR lighting; later worlds can opt into tone mapping.
    this.instance.toneMapping = toneMapping
    this.resize(viewport)
  }

  get info() {
    return this.instance.info
  }

  resize(viewport: Viewport): void {
    this.instance.setPixelRatio(viewport.pixelRatio)
    this.instance.setSize(viewport.width, viewport.height, false)
  }

  render(scene: Scene, camera: Camera): void {
    this.instance.render(scene, camera)
  }

  dispose(): void {
    this.instance.dispose()
  }
}
