import { MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, Texture, Vector3 } from 'three'

export interface HybridCardOptions {
  readonly name: string
  readonly texture: Texture
  readonly width: number
  readonly height: number
  readonly baseOpacity: number
  readonly fadeStart: number
  readonly fadeEnd: number
  readonly alphaTest?: number
}

/** A transparent art card whose opacity is fully derived from scroll and camera state. */
export class HybridCard {
  readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>
  opacity = 0
  distance = Infinity

  private readonly worldPosition = new Vector3()
  private readonly width: number
  private readonly height: number

  constructor(options: HybridCardOptions) {
    this.width = options.width
    this.height = options.height
    const geometry = new PlaneGeometry(options.width, options.height)
    const material = new MeshBasicMaterial({
      map: options.texture,
      color: '#728b8c',
      transparent: true,
      opacity: 0,
      alphaTest: options.alphaTest ?? 0.025,
      depthTest: true,
      depthWrite: false,
      fog: true,
      toneMapped: false,
    })
    this.mesh = new Mesh(geometry, material)
    this.mesh.name = options.name
  }

  setLayout(position: readonly [number, number, number], width: number, height: number, rotationY = 0): void {
    this.mesh.position.set(...position)
    this.mesh.scale.set(width / this.width, height / this.height, 1)
    this.mesh.rotation.y = rotationY
  }

  update(cameraWorldPosition: Vector3, progressOpacity: number, fadeStart: number, fadeEnd: number, baseOpacity: number): void {
    this.mesh.getWorldPosition(this.worldPosition)
    this.distance = cameraWorldPosition.distanceTo(this.worldPosition)
    const distanceOpacity = MathUtils.smoothstep(this.distance, fadeEnd, fadeStart)
    this.opacity = baseOpacity * progressOpacity * distanceOpacity
    this.mesh.material.opacity = this.opacity
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}
