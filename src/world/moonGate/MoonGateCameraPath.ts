import { MathUtils, Vector3 } from 'three'
import type { Camera } from '../../core/Camera'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { COMPOSITIONS, SHANSHUI } from '../shanshui/ShanshuiConfig'
import { NightGardenCameraPath } from '../nightGarden/NightGardenCameraPath'
import { MOON_GATE } from './MoonGateConfig'

export const GATE_CAMERA_RANGE = MOON_GATE.ranges.phase

/** A scroll-sampled physical approach. The approved garden sampler is read only.
 * Quintic endpoint correction matches its position AND velocity at local 0.16.
 * Position and attention have separate trajectories; sampling allocates nothing.
 */
export class MoonGateCameraPath {
  approachDistance = 0
  readonly pose = { position: new Vector3(), target: new Vector3() }
  private readonly destination = new NightGardenCameraPath('desktop')
  private readonly end = this.destination.createPose()
  private readonly next = this.destination.createPose()
  private readonly endVelocity = new Vector3()
  private readonly endBearing = new Vector3()
  private readonly bearingVelocity = new Vector3()
  private readonly start = new Vector3()
  private layout: CompositionId = 'desktop'

  setLayout(layout: CompositionId): void {
    this.layout = layout
    this.destination.setLayout(layout)
    this.destination.sample(this.destination.getTravelProgress(.16, false), this.end)
    this.destination.sample(this.destination.getTravelProgress(.1601, false), this.next)
    this.endVelocity.copy(this.next.position).sub(this.end.position).divideScalar(.000032)
    this.endBearing.copy(this.end.target).sub(this.end.position)
    this.bearingVelocity.copy(this.next.target).sub(this.next.position).sub(this.endBearing).divideScalar(.000032)
  }

  apply(progress: number, reduced: boolean, camera: Camera): void {
    const duration = GATE_CAMERA_RANGE.end - GATE_CAMERA_RANGE.start
    const t = MathUtils.clamp((progress - GATE_CAMERA_RANGE.start) / duration, 0, 1)
    const composition = COMPOSITIONS[this.layout]
    // Exact painting pose at ownership boundary, including reduced-motion parallax.
    const depth = MathUtils.smoothstep((.4 - .18) / (.48 - .18), 0, 1) * SHANSHUI.awakeningWeight
    this.start.set(0, 0, composition.cameraZ - composition.push * depth * composition.motion * (reduced ? SHANSHUI.reducedMotionScale : 1))
    const distance = MathUtils.smootherstep(t, 0, 1)
    // Endpoint derivative basis: zero value at both ends, derivative one at t=1.
    const match = t * t * t * (t - 1) * (4 - 3 * t)
    this.pose.position.lerpVectors(this.start, this.end.position, distance)
    this.pose.position.addScaledVector(this.endVelocity, duration * match)
    // Stay inside the aperture until the eye has passed its back face, then join
    // the west-hand stones. Lateral motion never belongs to a hidden garden blend.
    const thresholdX = this.layout === 'desktop' ? -3.35 : this.layout === 'tablet' ? -2.85 : -1.9
    const lateral = MathUtils.smootherstep(t, .25, .77)
    const join = MathUtils.clamp((t - .8) / .2, 0, 1)
    const lateralMatch = join * join * join * (join - 1) * (4 - 3 * join)
    this.pose.position.x = thresholdX * lateral + (this.end.position.x - thresholdX) * MathUtils.smootherstep(join, 0, 1)
      + this.endVelocity.x * duration * .2 * lateralMatch
    this.pose.target.set(0, 0, -12).lerp(this.endBearing, MathUtils.smootherstep(t, .2, 1))
    this.pose.target.addScaledVector(this.bearingVelocity, duration * match).add(this.pose.position)
    this.approachDistance = this.start.z - this.pose.position.z
    camera.setPose(this.pose.position.x, this.pose.position.y, this.pose.position.z,
      this.pose.target.x, this.pose.target.y, this.pose.target.z)
  }
}
