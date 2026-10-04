import { FogExp2, Group, MathUtils } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../../core/Camera'
import type { ScrollDirector } from '../../core/ScrollDirector'
import type { Viewport } from '../../core/Viewport'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GardenAtmosphere } from './GardenAtmosphere'
import { GardenBackground } from './GardenBackground'
import { GardenBoundary } from './GardenBoundary'
import { GardenRakeRelief } from './GardenRakeRelief'
import { GardenGround } from './GardenGround'
import { GardenMaterials } from './GardenMaterials'
import { HybridArtLayer } from './HybridArtLayer'
import { GardenLighting } from './GardenLighting'
import { GardenLanterns } from './GardenLanterns'
import { GardenPracticalBounce } from './GardenPracticalBounce'
import { containGardenPracticalLights } from './GardenPracticalContainment'
import { GardenPath } from './GardenPath'
import { GardenPavilion } from './GardenPavilion'
import { GardenRocks } from './GardenRocks'
import { GardenVegetation } from './GardenVegetation'
import { GardenLateralDepth } from './GardenLateralDepth'
import { NightGardenCameraPath } from './NightGardenCameraPath'
import { MoonGateAperture } from '../moonGate/MoonGateAperture'
import { GenkanCameraPath } from './GenkanCameraPath'
import {
  NIGHT_GARDEN, NIGHT_GARDEN_ATMOSPHERE_REVIEW_MODE, NIGHT_GARDEN_COMPOSITION_REVIEW_MODE, PAVILION_ISOLATION_MODE,
} from './NightGardenConfig'
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
  private readonly aperture = new MoonGateAperture()
  private readonly boundary: GardenBoundary
  private readonly relief: GardenRakeRelief
  private readonly ground: GardenGround
  private readonly materials: GardenMaterials
  private readonly path: GardenPath
  private readonly pavilion: GardenPavilion
  private readonly rocks: GardenRocks
  private readonly vegetation: GardenVegetation
  private readonly lateralDepth: GardenLateralDepth
  private readonly atmosphere: GardenAtmosphere
  private readonly background: GardenBackground
  private readonly lighting: GardenLighting
  private readonly lanterns: GardenLanterns
  private readonly practicalBounce: GardenPracticalBounce
  private readonly hybridArt: HybridArtLayer
  private readonly cameraPath: NightGardenCameraPath
  private readonly cameraPose: ReturnType<NightGardenCameraPath['createPose']>
  private readonly genkanPath: GenkanCameraPath
  private readonly genkanPose: ReturnType<NightGardenCameraPath['createPose']>
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
    this.boundary = new GardenBoundary(this.root)
    this.ground = new GardenGround(this.root, this.materials.groundMaterial)
    this.path = new GardenPath(this.root, this.materials.pathMaterial)
    this.relief = new GardenRakeRelief(this.root, this.materials.groundMaterial)
    this.pavilion = new GardenPavilion(this.root)
    this.rocks = new GardenRocks(this.root, this.materials.rockMaterial)
    this.vegetation = new GardenVegetation(this.root)
    this.lateralDepth = new GardenLateralDepth(this.root, this.vegetation.sharedMaterials.foliage, this.vegetation.sharedMaterials.wood, this.materials.rockMaterial)
    this.background = new GardenBackground(this.root)
    this.atmosphere = new GardenAtmosphere(this.root, this.background.skyState)
    this.hybridArt = new HybridArtLayer(this.root)
    this.cameraPath = new NightGardenCameraPath(this.layoutId)
    this.cameraPose = this.cameraPath.createPose()
    this.genkanPose = this.cameraPath.createPose()
    this.genkanPath = new GenkanCameraPath(this.pavilion.entranceRoot)
    this.lighting = new GardenLighting(this.root)
    this.lanterns = new GardenLanterns(this.root)
    containGardenPracticalLights(this.root)
    this.practicalBounce = new GardenPracticalBounce(this.materials.groundMaterial)
    this.aperture.attach(this.root)
    void this.background.ready.then(() => { if (!this.disposed) this.aperture.attach(this.root) })
    this.setPavilionIsolation(PAVILION_ISOLATION_MODE)
    scene.add(this.root)
    this.resize()
  }

  resize(): void {
    this.layoutId = this.viewport.aspect < 0.6 ||
      (this.viewport.category === 'mobile' && this.viewport.aspect < 1) ? 'portrait'
      : this.viewport.category === 'desktop' ? 'desktop' : 'tablet'
    const layout = NIGHT_GARDEN.layouts[this.layoutId]
    this.boundary.setLayout(this.layoutId)
    this.ground.setLayout(this.layoutId)
    this.pavilion.setLayout(this.layoutId)
    this.path.setLayout(this.layoutId)
    this.relief.setLayout(this.layoutId)
    this.lanterns.setLayout(this.layoutId)
    this.rocks.setLayout(this.layoutId, layout.rockCount)
    this.vegetation.setLayout(this.layoutId)
    this.lateralDepth.setLayout(this.layoutId)
    this.atmosphere.setProfile(this.layoutId)
    this.background.setLayout(this.layoutId)
    this.hybridArt.setProfile(this.layoutId)
    this.cameraPath.setLayout(this.layoutId)
    this.genkanPath.setArrival(this.cameraPath.getArrival(), this.viewport.aspect)
    this.aperture.setLayout(this.layoutId)
  }

  private setPavilionIsolation(isolated: boolean): void {
    const physicalGardenVisible = !isolated
    const compositionReviewVisible = physicalGardenVisible || NIGHT_GARDEN_COMPOSITION_REVIEW_MODE
    const atmosphereReviewVisible = physicalGardenVisible || NIGHT_GARDEN_ATMOSPHERE_REVIEW_MODE
    this.boundary.setVisible(compositionReviewVisible)
    this.path.setVisible(compositionReviewVisible)
    this.relief.setVisible(compositionReviewVisible)
    this.rocks.setVisible(compositionReviewVisible)
    this.vegetation.setVisible(compositionReviewVisible)
    this.lateralDepth.setVisible(compositionReviewVisible)
    this.atmosphere.setVisible(atmosphereReviewVisible)
    this.lanterns.setVisible(compositionReviewVisible)
    this.hybridArt.setPhysicalGardenVisible(physicalGardenVisible)
  }

  update(delta: number, scroll: ScrollDirector, ownsCamera = true, preReveal = 0): void {
    if (this.disposed) return
    const smoothed = !scroll.reducedMotion
    this.progress = scroll.getRangeProgress(NIGHT_GARDEN.range, smoothed)
    this.state = this.progress < 0.15 ? 'COMMIT'
      : this.progress < 0.35 ? 'PASSAGE'
        : this.progress < 0.55 ? 'REVEAL'
          : this.progress < 0.8 ? 'ARRIVAL' : 'NIGHT GARDEN ESTABLISHED'
    this.crossingProgress = easedRange(this.progress, 0, 0.62)
    this.visibility = Math.max(preReveal, easedRange(this.progress, 0.04, 0.38))
    this.mistIntensity = 0.3 + easedRange(this.progress, 0.06, 0.48) * 0.7
    // Establish depth across the whole crossing instead of filling the mid-route with
    // a sudden global veil. Local haze carries the mountain separation.
    this.fog.density = easedRange(this.progress, 0.12, 0.88) * 0.0052
    this.root.visible = this.visibility > 0

    const travelProgress = this.cameraPath.getTravelProgress(this.progress, scroll.reducedMotion)
    this.cameraPath.sample(travelProgress, this.cameraPose, scroll.reducedMotion)
    this.cameraOffset = this.cameraPose.position.z - this.camera.instance.position.z
    if (ownsCamera) this.camera.setPose(
      this.cameraPose.position.x, this.cameraPose.position.y, this.cameraPose.position.z,
      this.cameraPose.target.x, this.cameraPose.target.y, this.cameraPose.target.z,
    )

    const extension = scroll.continuationProgress ?? 0
    if (extension > 0) {
      this.pavilion.setDoorProgress(this.genkanPath.sample(extension, this.genkanPose))
      // World has explicitly relinquished garden ownership before this sole writer runs.
      this.camera.setPose(this.genkanPose.position.x, this.genkanPose.position.y, this.genkanPose.position.z,
        this.genkanPose.target.x, this.genkanPose.target.y, this.genkanPose.target.z)
    } else this.pavilion.setDoorProgress(0)

    this.atmosphere.update(delta, this.mistIntensity * this.visibility, scroll.reducedMotion)
    this.background.setVisibility(this.visibility)
    this.lighting.setIntensity(this.visibility)
    this.lanterns.setIntensity(this.visibility)
    this.practicalBounce.setIntensity(this.visibility)
    this.pavilion.setIntensity(this.visibility)
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
    this.boundary.dispose()
    this.relief.dispose()
    this.ground.dispose()
    this.path.dispose()
    this.pavilion.dispose()
    this.lanterns.dispose()
    this.rocks.dispose()
    this.lateralDepth.dispose()
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
