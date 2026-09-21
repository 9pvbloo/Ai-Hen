import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'

export interface GardenCameraPose {
  readonly position: Vector3
  readonly target: Vector3
}

interface CameraPathProfile {
  readonly positionPoints: readonly [number, number, number][]
  readonly targetPoints: readonly [number, number, number][]
}

const CAMERA_PATH_PROFILES: Record<CompositionId, CameraPathProfile> = {
  desktop: {
    positionPoints: [
      [-4.62, -3.06, -10.10], [-5.04, -3.08, -14.55], [-4.78, -3.10, -19.55],
      [-3.48, -3.10, -25.15], [-2.16, -3.10, -30.05], [-0.62, -3.09, -34.20],
      [-0.26, -3.08, -35.75], [-0.85, -3.10, -37.30],
    ],
    targetPoints: [
      [-4.98, -3.48, -17.80], [-4.82, -3.44, -20.20], [-3.94, -3.36, -24.80],
      [-2.58, -3.30, -30.10], [-1.44, -3.22, -34.20], [-0.82, -3.16, -38.10],
      [-0.66, -3.10, -40.20], [-0.60, -3.08, -40.72],
    ],
  },
  tablet: {
    positionPoints: [
      [-4.48, -3.04, -10.05], [-4.92, -3.06, -14.20], [-4.62, -3.08, -18.60],
      [-3.36, -3.08, -23.35], [-2.04, -3.08, -27.50], [-1.04, -3.07, -30.35],
      [-0.82, -3.07, -31.35], [-0.88, -3.08, -32.20],
    ],
    targetPoints: [
      [-4.88, -3.42, -17.10], [-4.68, -3.38, -19.70], [-3.82, -3.32, -23.70],
      [-2.48, -3.26, -28.20], [-1.42, -3.18, -32.15], [-0.88, -3.12, -36.60],
      [-0.66, -3.10, -39.20], [-0.60, -3.08, -40.35],
    ],
  },
  portrait: {
    positionPoints: [
      [-4.38, -3.02, -10.00], [-4.74, -3.04, -13.45], [-4.40, -3.05, -16.90],
      [-3.66, -3.06, -20.35], [-3.04, -3.06, -23.25], [-2.62, -3.06, -24.75],
      [-2.66, -3.06, -25.30], [-2.82, -3.07, -25.75],
    ],
    targetPoints: [
      [-4.74, -3.36, -16.60], [-4.42, -3.32, -19.10], [-3.78, -3.27, -22.10],
      [-2.88, -3.22, -26.35], [-1.92, -3.16, -31.60], [-1.18, -3.12, -36.25],
      [-0.76, -3.10, -39.00], [-0.60, -3.08, -40.10],
    ],
  },
}

/** Deterministic, authored camera and attention curves for the garden walk. */
export class NightGardenCameraPath {
  private positionCurve: CatmullRomCurve3
  private targetCurve: CatmullRomCurve3

  constructor(layout: CompositionId) {
    const curves = this.createCurves(layout)
    this.positionCurve = curves.position
    this.targetCurve = curves.target
  }

  setLayout(layout: CompositionId): void {
    const curves = this.createCurves(layout)
    this.positionCurve = curves.position
    this.targetCurve = curves.target
  }

  createPose(): GardenCameraPose {
    return { position: new Vector3(), target: new Vector3() }
  }

  sample(progress: number, pose: GardenCameraPose): void {
    const travelProgress = MathUtils.clamp(progress, 0, 1)
    this.positionCurve.getPoint(travelProgress, pose.position)
    this.targetCurve.getPoint(travelProgress, pose.target)
  }

  private createCurves(layout: CompositionId): { position: CatmullRomCurve3; target: CatmullRomCurve3 } {
    const profile = CAMERA_PATH_PROFILES[layout]
    const position = new CatmullRomCurve3(profile.positionPoints.map(point => new Vector3(...point)), false, 'centripetal')
    const target = new CatmullRomCurve3(profile.targetPoints.map(point => new Vector3(...point)), false, 'centripetal')
    return { position, target }
  }
}
