import { FogExp2, Group, MathUtils } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../../core/Camera'
import type { ScrollDirector } from '../../core/ScrollDirector'
import type { Viewport } from '../../core/Viewport'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GardenAtmosphere } from './GardenAtmosphere'
import { GardenBackground } from './GardenBackground'
import { GardenGround } from './GardenGround'
import { GardenMaterials } from './GardenMaterials'
import { HybridArtLayer } from './HybridArtLayer'
import { GardenLighting } from './GardenLighting'
import { GardenPath } from './GardenPath'
import { GardenPond } from './GardenPond'
import { GardenRocks } from './GardenRocks'
import { GardenVegetation } from './GardenVegetation'
import { NIGHT_GARDEN } from './NightGardenConfig'
import type { NightGardenState } from './NightGardenConfig'

function easedRange(progress: number, start: number, end: number): number {
  return MathUtils.smoothstep(MathUtils.clamp((progress - start) / (end - start), 0, 1), 0, 1)
}

export class NightGarden {
  state: NightGardenState = 'COMMIT'
  progress = 0
  crossingProgress = 0
  visibility = 0
  cameraOffset = 0
  pondVisibility = 0
  mistIntensity = 0
  layoutId: CompositionId = 'desktop'
  hybridTreeLineOpacity = 0
  hybridTreeLineDistance = Infinity
  hybridWillowOpacity = 0
  hybridJadeFoliageOpacity = 0
  hybridScholarRockOpacity = 0
  hybridBambooOpacity = 0
  hybridReedsOpacity = 0
  hybridNearestCardDistance = Infinity

  private readonly root = new Group()
  private readonly ground: GardenGround
  private readonly materials: GardenMaterials
  private readonly path: GardenPath
  private readonly pond: GardenPond
  private readonly rocks: GardenRocks
  private readonly vegetation: GardenVegetation
  private readonly atmosphere: GardenAtmosphere
  private readonly background: GardenBackground
  private readonly lighting: GardenLighting
  private readonly hybridArt: HybridArtLayer
  private readonly fog: FogExp2
  private readonly scene: Scene
  private readonly previousFog: Scene['fog']
  private readonly camera: Camera
  private readonly viewport: Viewport
  private disposed = false

  constructor(scene: Scene, camera: Camera, viewport: Viewport) {
    this.scene = scene
    this.previousFog = scene.fog
    this.camera = camera
    this.viewport = viewport
    this.fog = new FogExp2('#0a161a', 0)
    scene.fog = this.fog
    this.root.name = 'night-garden'
    this.materials = new GardenMaterials()
    this.ground = new GardenGround(this.root, this.materials.groundMaterial)
    this.path = new GardenPath(this.root, this.materials.pathMaterial)
    this.pond = new GardenPond(this.root)
    this.rocks = new GardenRocks(this.root, this.materials.rockMaterial)
    this.vegetation = new GardenVegetation(this.root)
    this.atmosphere = new GardenAtmosphere(this.root)
    this.background = new GardenBackground(this.root)
    this.hybridArt = new HybridArtLayer(this.root)
    this.lighting = new GardenLighting(this.root)
    scene.add(this.root)
    this.resize()
  }

  resize(): void {
    this.layoutId = this.viewport.aspect < 0.6 ||
      (this.viewport.category === 'mobile' && this.viewport.aspect < 1) ? 'portrait'
      : this.viewport.category === 'desktop' ? 'desktop' : 'tablet'
    const layout = NIGHT_GARDEN.layouts[this.layoutId]
    this.path.setCount(layout.pathCount)
    this.pond.setLayout(layout.pondScale)
    this.rocks.setCount(layout.rockCount, this.layoutId !== 'desktop')
    this.vegetation.setCount(layout.bambooCount, this.layoutId !== 'portrait')
    this.atmosphere.setProfile(this.layoutId)
    this.background.setLayout(this.layoutId)
    this.hybridArt.setProfile(this.layoutId)
  }

  update(delta: number, scroll: ScrollDirector): void {
    if (this.disposed) return
    const smoothed = !scroll.reducedMotion
    this.progress = scroll.getRangeProgress(NIGHT_GARDEN.range, smoothed)
    this.state = this.progress < 0.15 ? 'COMMIT'
      : this.progress < 0.35 ? 'PASSAGE'
        : this.progress < 0.55 ? 'REVEAL'
          : this.progress < 0.8 ? 'ARRIVAL' : 'NIGHT GARDEN ESTABLISHED'
    this.crossingProgress = easedRange(this.progress, 0, 0.62)
    this.visibility = easedRange(this.progress, 0.04, 0.38)
    this.pondVisibility = easedRange(this.progress, 0.22, 0.5)
    this.mistIntensity = 0.3 + easedRange(this.progress, 0.06, 0.48) * 0.7
    this.fog.density = easedRange(this.progress, 0.34, 0.58) * 0.012
    this.root.visible = this.progress > 0.001

    const layout = NIGHT_GARDEN.layouts[this.layoutId]
    const crossingScale = scroll.reducedMotion ? NIGHT_GARDEN.reducedMotionCrossingScale : 1
    this.cameraOffset = layout.crossingDistance * crossingScale * this.crossingProgress
    const settle = easedRange(this.progress, 0.34, 0.8)
    const start = this.camera.instance.position
    const cameraX = layout.cameraX * settle
    const cameraY = layout.cameraY * settle
    const targetX = layout.targetX * settle
    const targetY = layout.targetY * settle
    const targetZ = -6 - (Math.abs(layout.targetZ) - 6) * settle
    this.camera.setPose(cameraX, cameraY, start.z - this.cameraOffset, targetX, targetY, targetZ)

    this.pond.update(delta, this.pondVisibility, scroll.reducedMotion)
    this.atmosphere.update(delta, this.mistIntensity * this.visibility, scroll.reducedMotion)
    this.vegetation.setVisible(this.progress >= 0.4)
    this.vegetation.update(delta, scroll.reducedMotion)
    this.lighting.setIntensity(this.visibility)
    this.hybridArt.update(this.camera.instance.position, this.progress, scroll.reducedMotion)
    this.hybridTreeLineOpacity = this.hybridArt.treeLineOpacity
    this.hybridTreeLineDistance = this.hybridArt.treeLineDistance
    this.hybridWillowOpacity = this.hybridArt.willowOpacity
    this.hybridJadeFoliageOpacity = this.hybridArt.jadeFoliageOpacity
    this.hybridScholarRockOpacity = this.hybridArt.scholarRockOpacity
    this.hybridBambooOpacity = this.hybridArt.bambooOpacity
    this.hybridReedsOpacity = this.hybridArt.reedsOpacity
    this.hybridNearestCardDistance = this.hybridArt.nearestCardDistance
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.root.removeFromParent()
    this.ground.dispose()
    this.path.dispose()
    this.pond.dispose()
    this.rocks.dispose()
    this.vegetation.dispose()
    this.atmosphere.dispose()
    this.background.dispose()
    this.hybridArt.dispose()
    this.materials.dispose()
    this.fog.density = 0
    this.scene.fog = this.previousFog
    this.root.clear()
  }
}
