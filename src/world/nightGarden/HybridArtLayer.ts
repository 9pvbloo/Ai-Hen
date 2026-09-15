import { Group, MathUtils, SRGBColorSpace, Texture, TextureLoader, Vector3 } from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { HybridCard } from './HybridCard'
import { HybridForeground } from './HybridForeground'

type CardId = 'treeLine' | 'bamboo' | 'reeds'
type CardProfile = {
  readonly position: readonly [number, number, number]
  readonly width: number
  readonly opacity: number
  readonly progressStart: number
  readonly progressEnd: number
  readonly fadeStart: number
  readonly fadeEnd: number
  readonly rotationY?: number
}
type HybridProfile = Record<CardId, CardProfile>
const CARD_IDS: readonly CardId[] = ['treeLine', 'bamboo', 'reeds']

const PROFILES: Record<CompositionId, HybridProfile> = {
  desktop: {
    treeLine: { position: [0.2, -0.65, -43], width: 42, opacity: 0.18, progressStart: 0.22, progressEnd: 0.82, fadeStart: 24, fadeEnd: 10 },
    bamboo: { position: [5.5, 1.1, -29], width: 9, opacity: 0.9, progressStart: 0.37, progressEnd: 0.75, fadeStart: 7, fadeEnd: 2, rotationY: -0.04 },
    reeds: { position: [3.5, -3.45, -24], width: 3.1, opacity: 0.86, progressStart: 0.42, progressEnd: 0.78, fadeStart: 4, fadeEnd: 1, rotationY: 0.06 },
  },
  tablet: {
    treeLine: { position: [0.15, -1.2, -42], width: 35, opacity: 0.16, progressStart: 0.22, progressEnd: 0.82, fadeStart: 24, fadeEnd: 10 },
    bamboo: { position: [5, 0, -28.5], width: 7.2, opacity: 0.86, progressStart: 0.39, progressEnd: 0.77, fadeStart: 7, fadeEnd: 2, rotationY: -0.04 },
    reeds: { position: [3.2, -3.45, -24], width: 3.1, opacity: 0.82, progressStart: 0.45, progressEnd: 0.8, fadeStart: 4, fadeEnd: 1, rotationY: 0.06 },
  },
  portrait: {
    treeLine: { position: [0.1, -2.2, -39], width: 25, opacity: 0.14, progressStart: 0.22, progressEnd: 0.82, fadeStart: 24, fadeEnd: 10 },
    bamboo: { position: [4.5, -0.8, -25.5], width: 6, opacity: 0.86, progressStart: 0.42, progressEnd: 0.8, fadeStart: 7, fadeEnd: 2, rotationY: -0.04 },
    reeds: { position: [3.6, -3.5, -23], width: 2.8, opacity: 0.8, progressStart: 0.5, progressEnd: 0.84, fadeStart: 4, fadeEnd: 1, rotationY: 0.04 },
  },
}

const SOURCES: Record<CardId, { url: string; aspect: number; alphaTest: number }> = {
  treeLine: { url: `${import.meta.env.BASE_URL}night-garden/distant-tree-line.png`, aspect: 2172 / 724, alphaTest: 0.035 },
  bamboo: { url: `${import.meta.env.BASE_URL}night-garden/bamboo-midground-right.png`, aspect: 1122 / 1402, alphaTest: 0.055 },
  reeds: { url: `${import.meta.env.BASE_URL}night-garden/pond-reeds-cluster.png`, aspect: 1448 / 1086, alphaTest: 0.045 },
}

/** Owns Night Garden authored cards and their shared texture cache. */
export class HybridArtLayer {
  readonly ready: Promise<void>
  treeLineOpacity = 0
  treeLineDistance = Infinity
  willowOpacity = 0
  jadeFoliageOpacity = 0
  scholarRockOpacity = 0
  bambooOpacity = 0
  reedsOpacity = 0
  nearestCardDistance = Infinity
  profile: CompositionId = 'desktop'

  private readonly root = new Group()
  private readonly foreground = new HybridForeground()
  private readonly textureLoader = new TextureLoader()
  private readonly textures = new Map<string, Promise<Texture>>()
  private readonly cameraPosition = new Vector3()
  private readonly cards = new Map<CardId, HybridCard>()
  private disposed = false

  constructor(parent: ThreeGroup) {
    this.root.name = 'night-garden-hybrid-art'
    parent.add(this.root)
    this.ready = Promise.all(CARD_IDS.map(id => this.loadCard(id))).then(() => undefined)
  }

  setProfile(profile: CompositionId): void {
    this.profile = profile
    this.foreground.setProfile(profile)
    const layouts = PROFILES[profile]
    for (const id of CARD_IDS) this.applyLayout(this.cards.get(id), layouts[id], SOURCES[id].aspect)
  }

  update(camera: Vector3, localProgress: number, reducedMotion: boolean): void {
    if (this.disposed) return
    this.cameraPosition.copy(camera)
    const layouts = PROFILES[this.profile]
    for (const id of CARD_IDS) this.updateCard(this.cards.get(id), layouts[id], localProgress)
    this.treeLineOpacity = this.cards.get('treeLine')?.opacity ?? 0
    this.treeLineDistance = this.cards.get('treeLine')?.distance ?? Infinity
    this.foreground.update(localProgress, reducedMotion)
    this.willowOpacity = this.foreground.opacity
    this.jadeFoliageOpacity = this.foreground.jadeOpacity
    this.scholarRockOpacity = this.foreground.scholarRockOpacity
    this.bambooOpacity = this.cards.get('bamboo')?.opacity ?? 0
    this.reedsOpacity = this.cards.get('reeds')?.opacity ?? 0
    this.nearestCardDistance = Infinity
    for (const card of this.cards.values()) this.nearestCardDistance = Math.min(this.nearestCardDistance, card.distance)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.foreground.dispose()
    this.cards.forEach(card => card.dispose())
    this.cards.clear()
    this.textures.forEach(texture => { void texture.then(value => value.dispose()) })
    this.textures.clear()
    this.root.removeFromParent()
    this.root.clear()
  }

  private async loadCard(id: CardId): Promise<void> {
    const source = SOURCES[id]
    const texture = await this.loadTexture(source.url)
    if (this.disposed) return
    const layout = PROFILES[this.profile][id]
    const card = new HybridCard({ name: `hybrid-${id}`, texture, width: layout.width, height: layout.width / source.aspect,
      baseOpacity: layout.opacity, fadeStart: layout.fadeStart, fadeEnd: layout.fadeEnd, alphaTest: source.alphaTest })
    this.applyLayout(card, layout, source.aspect)
    this.cards.set(id, card)
    this.root.add(card.mesh)
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

  private applyLayout(card: HybridCard | undefined, layout: CardProfile, aspect: number): void {
    card?.setLayout(layout.position, layout.width, layout.width / aspect, layout.rotationY)
  }

  private updateCard(card: HybridCard | undefined, layout: CardProfile, localProgress: number): void {
    if (!card) return
    card.update(this.cameraPosition, MathUtils.smoothstep(localProgress, layout.progressStart, layout.progressEnd),
      layout.fadeStart, layout.fadeEnd, layout.opacity)
  }
}
