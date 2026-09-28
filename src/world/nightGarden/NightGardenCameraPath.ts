import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GARDEN_ARRIVAL, GARDEN_ROUTE } from './GardenApproach'

export interface GardenCameraPose {
  readonly position: Vector3
  readonly target: Vector3
}

interface CameraPathProfile {
  readonly positionPoints: readonly [number, number, number][]
  readonly targetPoints: readonly [number, number, number][]
}

function routeX(z: number): number {
  for (let i = 1; i < GARDEN_ROUTE.length; i++) {
    const a = GARDEN_ROUTE[i - 1], b = GARDEN_ROUTE[i]
    if (z >= b[1]) return MathUtils.lerp(a[0], b[0], MathUtils.clamp((z - a[1]) / (b[1] - a[1]), 0, 1))
  }
  return GARDEN_ARRIVAL.x
}

function profile(depths: readonly number[]): CameraPathProfile {
  const heights = [-3.06, -3.07, -3.08, -3.08, -3.04, -2.98, -2.91, -2.87]
  const attention: readonly [number, number, number][] = [
    [-4.98, -3.48, -17.8], [-4.46, -3.4, -22.45], [-2.88, -3.25, -27.22],
    [-0.83, -3.0, -31.96], [1.34, -2.7, -36.55], [GARDEN_ARRIVAL.x, -2.25, -43.35],
    [3.04, -1.85, -47.2], [3.2, -1.65, -53.4],
  ]
  return {
    positionPoints: depths.map((z, i) => [routeX(z), heights[i], z]),
    // Attention rises steadily from the stone sequence to the recessed entrance.
    targetPoints: attention.map(([x, y, z], i) => {
      // Once revealed, hold the genkan bearing instead of panning beyond it
      // when the stone route turns right. Especially important in portrait.
      const bearingX = MathUtils.lerp(routeX(depths[i]), 3.2, (z - depths[i]) / (-53.4 - depths[i]))
      return [i < 2 ? x : bearingX, y, z]
    }),
  }
}

const CAMERA_PATH_PROFILES: Record<CompositionId, CameraPathProfile> = {
  desktop: profile([-10.10, -14.55, -18.9, -22.6, -25.2, -26.9, -27.9, -28.4]),
  tablet: profile([-10.05, -13.8, -17.7, -21.0, -23.5, -25.0, -25.8, -26.2]),
  portrait: profile([-10.0, -13.0, -16.1, -18.9, -21.0, -22.3, -23.1, -23.5]),
}

/** Deterministic, authored camera and attention curves for the garden walk. */
export class NightGardenCameraPath {
  private positionCurve: CatmullRomCurve3
  private targetCurve: CatmullRomCurve3
  private readonly reducedPositionStart = new Vector3()
  private readonly reducedPositionEnd = new Vector3()
  private readonly reducedTargetStart = new Vector3()
  private readonly reducedTargetEnd = new Vector3()

  constructor(layout: CompositionId) {
    const profile = CAMERA_PATH_PROFILES[layout]
    const curves = this.createCurves(profile)
    this.positionCurve = curves.position
    this.targetCurve = curves.target
    this.setReducedProfile(profile)
  }

  setLayout(layout: CompositionId): void {
    const profile = CAMERA_PATH_PROFILES[layout]
    const curves = this.createCurves(profile)
    this.positionCurve = curves.position
    this.targetCurve = curves.target
    this.setReducedProfile(profile)
  }

  createPose(): GardenCameraPose {
    return { position: new Vector3(), target: new Vector3() }
  }

  /** One remap gives the walk a gentle entry, clear middle, and settled threshold. */
  getTravelProgress(progress: number, reducedMotion: boolean): number {
    const normalized = MathUtils.clamp(progress, 0, 1)
    return reducedMotion ? normalized : MathUtils.smootherstep(normalized, 0, 1)
  }

  sample(progress: number, pose: GardenCameraPose, reducedMotion = false): void {
    const travelProgress = MathUtils.clamp(progress, 0, 1)
    if (reducedMotion) {
      pose.position.lerpVectors(this.reducedPositionStart, this.reducedPositionEnd, travelProgress)
      pose.target.lerpVectors(this.reducedTargetStart, this.reducedTargetEnd, travelProgress)
      return
    }
    this.positionCurve.getPoint(travelProgress, pose.position)
    this.targetCurve.getPoint(travelProgress, pose.target)
  }

  private setReducedProfile(profile: CameraPathProfile): void {
    this.reducedPositionStart.fromArray(profile.positionPoints[1])
    this.reducedPositionEnd.fromArray(profile.positionPoints[profile.positionPoints.length - 1])
    this.reducedTargetStart.fromArray(profile.targetPoints[3])
    this.reducedTargetEnd.fromArray(profile.targetPoints[profile.targetPoints.length - 1])
  }

  private createCurves(profile: CameraPathProfile): { position: CatmullRomCurve3; target: CatmullRomCurve3 } {
    const position = new CatmullRomCurve3(profile.positionPoints.map(point => new Vector3(...point)), false, 'centripetal')
    const target = new CatmullRomCurve3(profile.targetPoints.map(point => new Vector3(...point)), false, 'centripetal')
    return { position, target }
  }
}
