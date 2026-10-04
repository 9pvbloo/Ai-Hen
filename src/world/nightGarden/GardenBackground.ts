import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Texture, TextureLoader } from 'three'
import type { Group as ThreeGroup } from 'three'
import { GardenMoon } from './GardenMoon'
import { GardenNightSky } from './GardenNightSky'
import { NightSkyState } from './NightSkyState'

type MountainId = 'mid' | 'far'

const MOUNTAIN_SOURCES: Record<MountainId, { readonly url: string; readonly aspect: number }> = {
  mid: { url: `${import.meta.env.BASE_URL}shanshui/mid-mountains.png`, aspect: 2171 / 724 },
  far: { url: `${import.meta.env.BASE_URL}shanshui/far-mountains.png`, aspect: 2172 / 724 },
}


/** Owns the depth-separated painted geography, sky, moon, and small Pavilion cue. */
export class GardenBackground {
  readonly ready: Promise<void>

  private readonly root = new Group()
  private readonly skyState = new NightSkyState()
  private readonly sky: GardenNightSky
  private readonly mountainGeometry = new PlaneGeometry(1, 1)
  private readonly mountainMaterials = new Map<MountainId, MeshBasicMaterial>()
  private readonly textureLoader = new TextureLoader()
  private readonly textures = new Map<string, Promise<Texture>>()
  private readonly moon: GardenMoon
  private readonly pavilionGeometry = new PlaneGeometry(3.5, 1.8)
  private readonly pavilionMaterial = new MeshBasicMaterial({ color: '#263537', transparent: true, opacity: 0.52, depthWrite: false, toneMapped: false })
  private readonly pavilion = new Mesh(this.pavilionGeometry, this.pavilionMaterial)
  private disposed = false

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-atmospheric-background'
    this.sky = new GardenNightSky(this.root, this.skyState)
    this.moon = new GardenMoon(this.root, this.skyState)
    this.pavilion.name = 'distant-pavilion-hint'
    this.pavilion.position.set(2.4, -3.55, -46.5)
    this.root.add(this.pavilion)
    parent.add(this.root)
    this.ready = Promise.all((Object.keys(MOUNTAIN_SOURCES) as MountainId[]).map(id => this.loadMountain(id))).then(() => undefined)
  }

  setLayout(layout: 'desktop' | 'tablet' | 'portrait'): void {
    this.skyState.setLayout(layout)
    // The old distant cue sits in front of the built mansion and masks its lit doorway.
    // Retain it only for a background used without the real architectural subject.
    this.pavilion.visible = layout === 'desktop' &&
      !this.root.parent?.getObjectByName('garden-pavilion-residence')
    this.moon.setLayout(layout)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.sky.dispose()
    this.mountainGeometry.dispose()
    this.mountainMaterials.forEach(material => material.dispose())
    this.textures.forEach(texture => { void texture.then(value => value.dispose()) })
    this.moon.dispose()
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
