import { CatmullRomCurve3, MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { GARDEN_ROUTE } from './GardenApproach'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { MANSION_FOUNDATION_LOWEST_LOCAL_Y, MANSION_ROOT_POSITION } from './GardenPavilionArchitecture'

export interface GardenCameraPose {
  readonly position: Vector3
  readonly target: Vector3
}
export const GARDEN_CAMERA_EYE_HEIGHT = 1.62
// Audited frozen facade datums. Review checks against the actual mansion transform.
const MANSION_ROTATION = -.035
const SPEED_KEYS = [[0, 0], [.08, 0], [.22, 1.35], [.43, 1.65], [.63, 1.05], [.80, .50], [.94, .16], [1, 0]] as const

/** Same placement rule as GardenPath; review asserts against actual mesh centers. */
function stoneCenter(index: number): Vector3 {
  const [x, z] = GARDEN_ROUTE[index]
  return new Vector3(x + (index < 18 ? Math.sin(index * 2.4) * .11 : 0), 0, z)
}

/** Scroll owns distance. No timers, head bob, frame allocations or irreversible state. */
export class NightGardenCameraPath {
  private readonly positionCurve: CatmullRomCurve3
  private targetCurve!: CatmullRomCurve3
  private readonly heights = new Float64Array(1025)
  private readonly pacing = new Float64Array(1025)
  private readonly scratch = new Vector3()
  private readonly threshold = new Vector3()
  private readonly doorway = new Vector3()
  private arrivalFraction = 1
  private layout!: CompositionId

  constructor(layout: CompositionId) {
    const stones = GARDEN_ROUTE.map((_, i) => stoneCenter(i))
    const controls = stones.map((point, i) => i === 0 || i === stones.length - 1 ? point :
      point.clone().multiplyScalar(.5).addScaledVector(stones[i - 1], .25).addScaledVector(stones[i + 1], .25))
    controls.unshift(new Vector3(stones[0].x, 0, -10.1))
    this.positionCurve = new CatmullRomCurve3(controls, false, 'centripetal')
    this.positionCurve.arcLengthDivisions = 2048
    this.positionCurve.updateArcLengths()
    let previous = 0
    for (let i = 1; i < this.pacing.length; i++) {
      const p = i / (this.pacing.length - 1)
      let speed = 0
      for (let k = 1; k < SPEED_KEYS.length; k++) {
        const [a, va] = SPEED_KEYS[k - 1], [b, vb] = SPEED_KEYS[k]
        if (p <= b) { speed = MathUtils.lerp(va, vb, MathUtils.smootherstep(p, a, b)); break }
      }
      this.pacing[i] = this.pacing[i - 1] + (previous + speed) * .5
      previous = speed
    }
    const total = this.pacing[this.pacing.length - 1]
    for (let i = 0; i < this.pacing.length; i++) this.pacing[i] /= total
    this.setLayout(layout)
  }

  setLayout(layout: CompositionId): void {
    if (layout === this.layout) return
    this.layout = layout
    const rootY = sampleDryGardenGroundWorldY(MANSION_ROOT_POSITION.x, MANSION_ROOT_POSITION.z, layout) - MANSION_FOUNDATION_LOWEST_LOCAL_Y
    const doorZ = -.10
    this.threshold.set(MANSION_ROOT_POSITION.x + Math.sin(MANSION_ROTATION) * doorZ, rootY + 2.78,
      MANSION_ROOT_POSITION.z + Math.cos(MANSION_ROTATION) * doorZ)
    this.doorway.copy(this.threshold); this.doorway.y += 2.39 / 2
    // The 4.72-wide entry frame must fit the reviewed 390/844 portrait at fixed 45° FOV.
    // Stop on the same route for every layout, avoiding a resize-dependent arrival jump.
    const last = this.positionCurve.points[this.positionCurve.points.length - 1]
    const frameDistance = 4.72 * 1.03 / (2 * Math.tan(Math.PI / 8) * (390 / 844))
    const remaining = Math.hypot(last.x - this.threshold.x, last.z - this.threshold.z)
    this.arrivalFraction = Math.min(1, 1 - Math.max(0, frameDistance - remaining) / this.positionCurve.getLength())
    // Attention is independent of the position tangent: route, opening, then entry.
    this.targetCurve = new CatmullRomCurve3([
      new Vector3(-4.95, -3.48, -18), new Vector3(-3.5, -3.20, -25),
      new Vector3(-.5, -2.80, -35), new Vector3(2.6, -2.5, -46), this.doorway.clone(),
    ], false, 'centripetal')
    // Cache the macro sampler only. Filter across 0.9 units; never use rake or stone tops.
    for (let i = 0; i < this.heights.length; i++) {
      this.positionCurve.getPointAt(i / (this.heights.length - 1), this.scratch)
      const { x, z } = this.scratch
      this.heights[i] = (sampleDryGardenGroundWorldY(x, z, layout) * 2 +
        sampleDryGardenGroundWorldY(x, z - .45, layout) + sampleDryGardenGroundWorldY(x, z + .45, layout)) / 4
    }
  }

  createPose(): GardenCameraPose { return { position: new Vector3(), target: new Vector3() } }

  getTravelProgress(progress: number, _reducedMotion: boolean): number {
    return this.lookup(this.pacing, MathUtils.clamp(progress, 0, 1))
  }

  sample(progress: number, pose: GardenCameraPose, _reducedMotion = false): void {
    const u = MathUtils.clamp(progress, 0, 1)
    this.positionCurve.getPointAt(u * this.arrivalFraction, pose.position)
    pose.position.y = this.lookup(this.heights, u * this.arrivalFraction) + GARDEN_CAMERA_EYE_HEIGHT
    this.targetCurve.getPoint(u, pose.target)
  }

  /** Phase 3K.7 handoff contract, called on demand rather than in the frame loop. */
  getArrival() {
    const pose = this.createPose(); this.sample(1, pose)
    const orientation = new Matrix4().lookAt(pose.position, pose.target, new Vector3(0, 1, 0))
    return { ...pose, quaternion: new Quaternion().setFromRotationMatrix(orientation), threshold: this.threshold.clone(),
      doorway: this.doorway.clone(), remainingDistance: Math.hypot(pose.position.x - this.threshold.x, pose.position.z - this.threshold.z),
      progress: 1, globalProgress: 1, eyeHeight: GARDEN_CAMERA_EYE_HEIGHT }
  }

  private lookup(values: Float64Array, progress: number): number {
    const at = progress * (values.length - 1), index = Math.min(values.length - 2, Math.floor(at))
    return MathUtils.lerp(values[index], values[index + 1], at - index)
  }
}
