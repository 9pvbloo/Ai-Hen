import { MathUtils } from 'three'
import { GENKAN as D } from './GenkanDimensions'

/** Recess inner leaves onto the rear track before lateral overlap can begin. */
export function sampleGenkanDoor(progress: number, offsets: Float64Array): void {
  const p = MathUtils.clamp(progress, 0, 1)
  const lateral = MathUtils.smootherstep(p, .20, 1)
  const track = MathUtils.smootherstep(p, 0, .18) * D.innerTrack
  for (let leaf = 0; leaf < 4; leaf++) {
    const inner = leaf === 1 || leaf === 2, side = leaf < 2 ? -1 : 1
    offsets[leaf * 2] = side * (inner ? D.pitch + D.outerTravel : D.outerTravel) * lateral
    offsets[leaf * 2 + 1] = inner ? track : 0
  }
}
