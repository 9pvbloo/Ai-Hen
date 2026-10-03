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
    const g = GATE_CAMERA_RANGE.start + t * duration
    const layout = MOON_GATE.layouts[this.layout]
    const centerX = layout.position[0]
    const centerY = layout.position[1] + MOON_GATE.geometry.openingY * layout.scale
    const entryZ = layout.position[2] + (MOON_GATE.geometry.wallDepth + .18) * layout.scale + 2
    const exitZ = layout.position[2] - .18 * layout.scale - .8
    const passageVelocity = (exitZ - entryZ) / .05
    const align = MathUtils.smootherstep(g, .4, .58)
    this.pose.position.set(centerX * align, centerY * align, 0)
    if (g < .60) {
      this.pose.position.z = this.segment(this.start.z, entryZ, 0, passageVelocity, (g - .4) / .20, .20)
    } else if (g <= .65) {
      // Both eye and bearing are on the physical circle axis throughout the wall.
      this.pose.position.z = entryZ + passageVelocity * (g - .60)
    } else {
      const span = GATE_CAMERA_RANGE.end - .65
      const u = (g - .65) / span
      this.pose.position.set(
        this.segment(centerX, this.end.position.x, 0, this.endVelocity.x, u, span),
        this.segment(centerY, this.end.position.y, 0, this.endVelocity.y, u, span),
        this.segment(exitZ, this.end.position.z, passageVelocity, this.endVelocity.z, u, span),
      )
    }
    const join = MathUtils.clamp((g - .65) / (GATE_CAMERA_RANGE.end - .65), 0, 1)
    const match = join * join * join * (join - 1) * (4 - 3 * join)
    this.pose.target.set(0, 0, -12).lerp(this.endBearing, MathUtils.smootherstep(join, 0, 1))
    this.pose.target.addScaledVector(this.bearingVelocity, (GATE_CAMERA_RANGE.end - .65) * match).add(this.pose.position)
    this.approachDistance = this.start.z - this.pose.position.z
    camera.setPose(this.pose.position.x, this.pose.position.y, this.pose.position.z,
      this.pose.target.x, this.pose.target.y, this.pose.target.z)
  }

  /** Quintic Hermite with zero endpoint acceleration and authored velocities. */
  private segment(a: number, b: number, va: number, vb: number, t: number, span: number): number {
    const u = MathUtils.clamp(t, 0, 1), u2 = u * u, u3 = u2 * u
    const startVelocity = u - 6 * u3 + 8 * u3 * u - 3 * u3 * u2
    const endVelocity = -4 * u3 + 7 * u3 * u - 3 * u3 * u2
    return MathUtils.lerp(a, b, MathUtils.smootherstep(u, 0, 1)) + span * (va * startVelocity + vb * endVelocity)
  }
}
