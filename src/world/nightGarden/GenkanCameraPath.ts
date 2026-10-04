import { Group, MathUtils, Vector3 } from 'three'
import type { GardenCameraPose } from './NightGardenCameraPath'
import { GENKAN as D } from './GenkanDimensions'

/** Only the new segment after the frozen arrival. All construction occurs on resize. */
export class GenkanCameraPath {
  private readonly start = new Vector3()
  private readonly end = new Vector3()
  private readonly startTarget = new Vector3()
  private readonly endTarget = new Vector3()
  private readonly local = new Vector3()
  private floorStart = 0
  private stopDistance = 0
  private readonly mansion: Group

  constructor(mansion: Group) { this.mansion = mansion }

  setArrival(arrival: GardenCameraPose, aspect: number): void {
    this.mansion.updateWorldMatrix(true, false)
    this.start.copy(arrival.position); this.mansion.worldToLocal(this.start)
    this.startTarget.copy(arrival.target)
    this.floorStart = this.start.y - D.eyeHeight
    const opening = 2 * (D.pitch + D.outerTravel)
    // Frame the useful open aperture at fixed 45°, with a portrait stop before the inner sill.
    this.stopDistance = Math.max(D.height * 1.10 / (2 * Math.tan(Math.PI / 8)),
      opening * 1.02 / (2 * Math.tan(Math.PI / 8) * aspect))
    this.end.set(0, D.bottom + .06 + D.eyeHeight, D.z + this.stopDistance)
    this.endTarget.set(0, D.bottom + D.height * .60, D.z - 1.5)
    this.mansion.localToWorld(this.endTarget)
  }

  sample(progress: number, pose: GardenCameraPose): number {
    const u = MathUtils.smootherstep(MathUtils.clamp(progress, 0, 1), 0, 1)
    this.local.lerpVectors(this.start, this.end, u)
    // Rise once across the five treads and landing, without following individual riser edges.
    const rise = 1 - MathUtils.smootherstep(this.local.z, 5.95, 9.90)
    this.local.y = MathUtils.lerp(this.floorStart, D.bottom + .06, rise) + D.eyeHeight
    pose.position.copy(this.local); this.mansion.localToWorld(pose.position)
    pose.target.lerpVectors(this.startTarget, this.endTarget, u)
    // Begin at the first tread's front edge; complete before the covered landing.
    return 1 - MathUtils.smootherstep(this.local.z, 6.22, 9.30)
  }
}
