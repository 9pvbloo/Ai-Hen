import { MathUtils, Vector3 } from 'three'
import type { Group } from 'three'
import type { GardenCameraPose } from './NightGardenCameraPath'
import { GENKAN } from './GenkanDimensions'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** A new segment sampled from the exact previous endpoint; only framing adapts on resize. */
export class GenkanInteriorCameraPath {
  private readonly start = new Vector3()
  private readonly end = new Vector3()
  private readonly startTarget = new Vector3()
  private readonly endTarget = new Vector3()
  private readonly local = new Vector3()
  private readonly mansion: Group

  constructor(mansion: Group) { this.mansion = mansion }

  setArrival(arrival: GardenCameraPose, aspect: number): void {
    this.mansion.updateWorldMatrix(true, false)
    this.start.copy(arrival.position); this.mansion.worldToLocal(this.start)
    this.startTarget.copy(arrival.target)
    const portalZ = D.rear + .34
    const framingDistance = D.futureOpeningWidth * 1.02 / (2 * Math.tan(Math.PI / 8) * aspect)
    // Preserve foreground mineral floor and the step line, with the exterior frame behind the eye.
    const stopZ = Math.min(D.front - .28, Math.max(D.stepZ + D.stepDepth / 2 + 2.20, portalZ + framingDistance))
    this.end.set(0, D.lowerY + GENKAN.eyeHeight + .12, stopZ)
    this.endTarget.set(0, D.raisedY + .40, D.rear + .22)
    this.mansion.localToWorld(this.endTarget)
  }

  sample(progress: number, pose: GardenCameraPose): void {
    const u = MathUtils.smootherstep(MathUtils.clamp(progress, 0, 1), 0, 1)
    this.local.lerpVectors(this.start, this.end, u)
    pose.position.copy(this.local); this.mansion.localToWorld(pose.position)
    pose.target.lerpVectors(this.startTarget, this.endTarget, u)
  }
}
