import { CircleGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Texture, TextureLoader } from 'three'
import type { Group as ThreeGroup } from 'three'

type MountainId = 'mid' | 'far'

const MOUNTAIN_SOURCES: Record<MountainId, { readonly url: string; readonly aspect: number }> = {
  mid: { url: `${import.meta.env.BASE_URL}shanshui/mid-mountains.png`, aspect: 2171 / 724 },
  far: { url: `${import.meta.env.BASE_URL}shanshui/far-mountains.png`, aspect: 2172 / 724 },
}

const SKY_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

/** Owns the depth-separated painted geography, sky, moon, and small Pavilion cue. */
export class GardenBackground {
  readonly ready: Promise<void>

  private readonly root = new Group()
  // Oversized to keep the single gradient beyond every desktop and portrait camera framing.
  private readonly skyGeometry = new PlaneGeometry(140, 100)
  private readonly skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; void main() {
      vec3 horizon = vec3(0.045, 0.095, 0.115);
      vec3 zenith = vec3(0.009, 0.021, 0.029);
      float lift = smoothstep(0.0, 0.82, vUv.y);
      gl_FragColor = vec4(mix(horizon, zenith, lift), 1.0);
    }`,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly sky = new Mesh(this.skyGeometry, this.skyMaterial)
  private readonly mountainGeometry = new PlaneGeometry(1, 1)
  private readonly mountainMaterials = new Map<MountainId, MeshBasicMaterial>()
  private readonly textureLoader = new TextureLoader()
  private readonly textures = new Map<string, Promise<Texture>>()
  private readonly moonDiscGeometry = new CircleGeometry(1, 64)
  private readonly moonDiscMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; void main() {
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;
      float edge = 1.0 - smoothstep(0.84, 1.0, r);
      float mottle = sin(p.x * 22.0 + p.y * 8.0) * sin(p.y * 19.0 - p.x * 5.0) * 0.028;
      float shade = 0.93 + mottle - smoothstep(0.2, 0.95, r) * 0.09;
      gl_FragColor = vec4(vec3(0.79, 0.88, 0.89) * shade, edge * 0.95);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly moonDisc = new Mesh(this.moonDiscGeometry, this.moonDiscMaterial)
  private readonly haloGeometry = new PlaneGeometry(1, 1)
  private readonly haloMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX,
    fragmentShader: `varying vec2 vUv; void main() {
      float r = length(vUv - 0.5) * 2.0;
      float halo = pow(max(0.0, 1.0 - r), 2.4) * 0.065;
      gl_FragColor = vec4(vec3(0.72, 0.82, 0.86), halo);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  private readonly halo = new Mesh(this.haloGeometry, this.haloMaterial)
  private readonly pavilionGeometry = new PlaneGeometry(3.5, 1.8)
  private readonly pavilionMaterial = new MeshBasicMaterial({ color: '#263537', transparent: true, opacity: 0.52, depthWrite: false, toneMapped: false })
  private readonly pavilion = new Mesh(this.pavilionGeometry, this.pavilionMaterial)
  private disposed = false

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-atmospheric-background'
    this.sky.name = 'garden-gradient-sky'
    this.sky.position.set(0, 10, -55)
    this.root.add(this.sky)
    this.halo.name = 'garden-moon-halo'
    this.halo.position.set(-4.2, 6.3, -92)
    this.halo.scale.set(18, 18, 1)
    this.root.add(this.halo)
    this.moonDisc.name = 'garden-pearl-moon-disc'
    this.moonDisc.position.set(-4.2, 6.3, -91.8)
    this.moonDisc.scale.setScalar(1.6)
    this.root.add(this.moonDisc)
    this.pavilion.name = 'distant-pavilion-hint'
    this.pavilion.position.set(2.4, -3.55, -46.5)
    this.root.add(this.pavilion)
    parent.add(this.root)
    this.ready = Promise.all((Object.keys(MOUNTAIN_SOURCES) as MountainId[]).map(id => this.loadMountain(id))).then(() => undefined)
  }

  setLayout(layout: 'desktop' | 'tablet' | 'portrait'): void {
    this.pavilion.visible = layout === 'desktop'
    const moonX = layout === 'portrait' ? -2.1 : layout === 'tablet' ? -3.2 : -4.2
    const moonY = layout === 'portrait' ? 5.4 : layout === 'tablet' ? 6 : 6.3
    const moonScale = layout === 'portrait' ? 1.3 : layout === 'tablet' ? 1.45 : 1.6
    this.moonDisc.position.set(moonX, moonY, -91.8)
    this.moonDisc.scale.setScalar(moonScale)
    this.halo.position.set(moonX, moonY, -92)
    this.halo.scale.setScalar(layout === 'portrait' ? 14 : layout === 'tablet' ? 16 : 18)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.skyGeometry.dispose()
    this.skyMaterial.dispose()
    this.mountainGeometry.dispose()
    this.mountainMaterials.forEach(material => material.dispose())
    this.textures.forEach(texture => { void texture.then(value => value.dispose()) })
    this.moonDiscGeometry.dispose()
    this.moonDiscMaterial.dispose()
    this.haloGeometry.dispose()
    this.haloMaterial.dispose()
    this.pavilionGeometry.dispose()
    this.pavilionMaterial.dispose()
    this.root.removeFromParent()
    this.root.clear()
  }

  private async loadMountain(id: MountainId): Promise<void> {
    const source = MOUNTAIN_SOURCES[id]
    const texture = await this.loadTexture(source.url)
    if (this.disposed) return
    const material = new MeshBasicMaterial({
      map: texture, color: id === 'mid' ? '#44606b' : '#6d8491',
      transparent: true, opacity: id === 'mid' ? 0.54 : 0.34, alphaTest: 0.012,
      depthWrite: false, depthTest: true, fog: true, toneMapped: false,
    })
    const mesh = new Mesh(this.mountainGeometry, material)
    const width = id === 'mid' ? 74 : 86
    mesh.name = id === 'mid' ? 'garden-mid-shanshui-ridge' : 'garden-far-shanshui-ridge'
    mesh.position.set(id === 'mid' ? -1.8 : 1.4, id === 'mid' ? 0.5 : 3.2, id === 'mid' ? -69 : -87)
    mesh.scale.set(width, width / source.aspect, 1)
    this.mountainMaterials.set(id, material)
    this.root.add(mesh)
  }

  private loadTexture(url: string): Promise<Texture> {
    const existing = this.textures.get(url)
    if (existing) return existing
    const texture = this.textureLoader.loadAsync(url).then(loaded => {
      loaded.colorSpace = SRGBColorSpace
      return loaded
    })
    this.textures.set(url, texture)
    return texture
  }
}
