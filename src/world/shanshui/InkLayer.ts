import { LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry,
  SRGBColorSpace, TextureLoader } from 'three'
import type { PerspectiveCamera, Texture } from 'three'
import type { Viewport } from '../../core/Viewport'
import { SHANSHUI } from './ShanshuiConfig'
import type { CompositionConfig, LayerConfig } from './ShanshuiConfig'

export interface LayerFrame {
  depth: number
  motion: number
  delta: number
  reducedMotion: boolean
  visibility: number
  mistVisibility: number
}

export class InkLayer {
  readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>
  readonly ready: Promise<boolean>
  readonly config: LayerConfig

  protected viewWidth = 1
  protected viewHeight = 1
  protected disposed = false
  private readonly geometry = new PlaneGeometry(1, 1)
  private readonly material: MeshBasicMaterial
  private texture: Texture | null = null
  private aspect = 3
  private baseX = 0
  private baseY = 0
  private baseZ = 0

  constructor(config: LayerConfig) {
    this.config = config
    this.material = new MeshBasicMaterial({
      transparent: true, opacity: config.opacity, color: config.color,
      depthWrite: false, depthTest: true, toneMapped: false,
    })
    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.name = `shanshui-${config.id}`
    this.mesh.renderOrder = config.order
    this.mesh.visible = false
    this.ready = this.load()
  }

  resize(viewport: Viewport, camera: PerspectiveCamera, composition: CompositionConfig): void {
    const placement = composition.layers[this.config.id]
    this.baseZ = this.config.depth * composition.depthScale
    this.viewHeight = 2 * Math.tan(camera.fov * Math.PI / 360) * (composition.cameraZ - this.baseZ)
    this.viewWidth = this.viewHeight * viewport.aspect

    // Focus controls crop, not UV stretching. Both lateral edges remain beyond the frustum.
    const focusMargin = 2 * Math.min(placement.focusX, 1 - placement.focusX)
    const height = Math.max(this.viewHeight * placement.height,
      this.viewWidth * SHANSHUI.edgeOverscan / (this.aspect * focusMargin))
    const width = height * this.aspect
    this.baseX = (0.5 - placement.focusX) * width
    this.baseY = placement.y * this.viewHeight
    this.mesh.scale.set(width, height, 1)
    this.mesh.position.set(this.baseX, this.baseY, this.baseZ)
  }

  update(frame: LayerFrame): void {
    const travel = frame.depth * frame.motion
    this.mesh.position.set(
      this.baseX + this.config.parallax[0] * this.viewWidth * travel,
      this.baseY + this.config.parallax[1] * this.viewHeight * travel,
      this.baseZ + this.config.depthShift * travel,
    )
    this.mesh.material.opacity = this.config.opacity * frame.visibility
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.mesh.removeFromParent()
    this.geometry.dispose()
    this.material.dispose()
    this.texture?.dispose()
    this.texture = null
    this.material.map = null
  }

  private async load(): Promise<boolean> {
    const url = `${import.meta.env.BASE_URL}shanshui/${this.config.file}`
    try {
      const texture = await new TextureLoader().loadAsync(url)
      // TextureLoader cannot abort an in-flight image; never attach a late result after teardown.
      if (this.disposed) {
        texture.dispose()
        return false
      }
      this.texture = texture
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearMipmapLinearFilter
      texture.magFilter = LinearFilter
      this.aspect = texture.image.width / texture.image.height
      this.material.map = texture
      this.material.needsUpdate = true
      this.mesh.visible = true
      return true
    } catch (error) {
      if (!this.disposed) console.error(`Shanshui: could not load ${url}`, error)
      return false
    }
  }
}
