import { DirectionalLight, Group, HemisphereLight, MathUtils, Object3D, PointLight } from 'three'
import type { Scene } from 'three'
import type { Camera } from '../../core/Camera'
import type { ScrollDirector } from '../../core/ScrollDirector'
import type { Viewport } from '../../core/Viewport'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { MOON_GATE } from './MoonGateConfig'
import type { MoonGateState } from './MoonGateConfig'
import { createMoonGateArchitecture } from './MoonGateGeometry'
import { MoonGateMaterials } from './MoonGateMaterials'

export class MoonGate {
  state: MoonGateState = 'Hidden'
  progress = 0
  visibility: number = MOON_GATE.materials.hiddenVisibility
  cameraApproach = 0
  layoutId: CompositionId = 'desktop'
  private gardenLightHandoff = 1

  private readonly root = new Group()
  private readonly materials = new MoonGateMaterials()
  private readonly architecture = createMoonGateArchitecture(this.materials)
  private readonly hemisphere = new HemisphereLight(
    MOON_GATE.colors.ambientSky, MOON_GATE.colors.ambientGround, 0)
  private readonly moonlight = new DirectionalLight(MOON_GATE.colors.moonlight, 0)
  private readonly beyondLight = new PointLight(MOON_GATE.colors.beyond, 0, 18, 2)
  private readonly moonTarget = new Object3D()
  private readonly camera: Camera
  private readonly viewport: Viewport
  private disposed = false

  constructor(scene: Scene, camera: Camera, viewport: Viewport) {
    this.camera = camera
    this.viewport = viewport
    this.root.name = 'moon-gate'
    this.moonlight.position.set(-7, 10, 9)
    this.moonlight.target = this.moonTarget
    this.beyondLight.position.set(1.5, 1.2, -3.5)
    this.root.add(this.architecture.group, this.hemisphere, this.moonlight, this.moonTarget, this.beyondLight)
    scene.add(this.root)
    this.materials.setVisibility(this.visibility)
    this.resize()
  }

  resize(): void {
    this.layoutId = this.viewport.aspect < 0.6 ||
      (this.viewport.category === 'mobile' && this.viewport.aspect < 1) ? 'portrait'
      : this.viewport.category === 'desktop' ? 'desktop' : 'tablet'
    const layout = MOON_GATE.layouts[this.layoutId]
    this.root.position.set(...layout.position)
    this.root.scale.setScalar(layout.scale)
  }

  setCrossingProgress(progress: number): void {
    this.materials.setCrossingProgress(progress)
    // The gate can remain as a threshold object, but its local lighting must not
    // double the Night Garden's authored moonlight after the handoff.
    this.gardenLightHandoff = 1 - MathUtils.smoothstep(progress, 0.04, 0.28)
  }

  update(scroll: ScrollDirector): void {
    if (this.disposed) return
    const smoothed = !scroll.reducedMotion
    const globalProgress = smoothed ? scroll.smoothProgress : scroll.rawProgress
    const emergence = MathUtils.smoothstep(scroll.getRangeProgress(MOON_GATE.ranges.emergence, smoothed), 0, 1)
    const recognition = MathUtils.smoothstep(scroll.getRangeProgress(MOON_GATE.ranges.recognition, smoothed), 0, 1)
    const approach = MathUtils.smoothstep(scroll.getRangeProgress(MOON_GATE.ranges.approach, smoothed), 0, 1)
    const threshold = MathUtils.smoothstep(scroll.getRangeProgress(MOON_GATE.ranges.threshold, smoothed), 0, 1)

    this.progress = scroll.getRangeProgress(MOON_GATE.ranges.phase, smoothed)
    this.state = globalProgress < MOON_GATE.ranges.emergence.start ? 'Hidden'
      : globalProgress < MOON_GATE.ranges.recognition.start ? 'Emerging'
        : globalProgress < MOON_GATE.ranges.approach.start ? 'Recognized'
          : globalProgress < MOON_GATE.ranges.threshold.start ? 'Approach' : 'Threshold'

    this.visibility = MOON_GATE.materials.hiddenVisibility +
      emergence * (MOON_GATE.materials.emergenceVisibility - MOON_GATE.materials.hiddenVisibility) +
      recognition * (1 - MOON_GATE.materials.emergenceVisibility)
    this.materials.setVisibility(this.visibility)
    this.root.visible = this.visibility > 0.005

    const lightProgress = MOON_GATE.lighting.emergenceFloor * emergence +
      (1 - MOON_GATE.lighting.emergenceFloor) * recognition
    this.hemisphere.intensity = MOON_GATE.lighting.hemisphere * lightProgress * this.gardenLightHandoff
    this.moonlight.intensity = MOON_GATE.lighting.moon * lightProgress * this.gardenLightHandoff
    this.beyondLight.intensity = MOON_GATE.lighting.beyond * recognition * (0.35 + threshold * 0.65) * this.gardenLightHandoff

    const approachProgress = approach * 0.72 + threshold * 0.28
    const layout = MOON_GATE.layouts[this.layoutId]
    const motionScale = scroll.reducedMotion ? MOON_GATE.reducedMotionApproachScale : 1
    this.cameraApproach = layout.cameraApproach * approachProgress * motionScale
    const currentZ = this.camera.instance.position.z
    this.camera.setPose(0, 0, currentZ - this.cameraApproach)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.root.removeFromParent()
    for (const geometry of this.architecture.geometries) geometry.dispose()
    this.materials.dispose()
    this.root.clear()
  }
}
