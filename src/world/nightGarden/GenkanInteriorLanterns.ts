import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

export const INTERIOR_LANTERNS = { x: 1.21, z: -5.18, height: .34, width: .24 } as const

/** Two low timber-and-paper lamps seated on the platform, outside the clear center. */
export function addGenkanInteriorLanterns(add: InteriorBoxWriter): void {
  const { x, z, height, width } = INTERIOR_LANTERNS
  for (const side of [-1, 1]) {
    const center = side * x
    add('timber', width, .035, width, center, D.raisedY + .0175, z)
    add('timber', width, .025, width, center, D.raisedY + height - .0125, z)
    add('lampPaper', width - .044, height - .06, width - .044, center, D.raisedY + .175, z)
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      add('timber', .022, height - .06, .022, center + dx * (width / 2 - .011), D.raisedY + .175, z + dz * (width / 2 - .011))
    for (const dz of [-1, 1])
      add('timber', width - .044, .014, .014, center, D.raisedY + .18, z + dz * (width / 2 - .007))
  }
}
