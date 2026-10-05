import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

export const INTERIOR_LANTERNS = { x: -1.40, z: -4.40, height: .64, width: .29 } as const
export const INTERIOR_WALL_LAMP = { x: -1.87, y: 5.25, z: -5.49 } as const

/** One slender floor andon and one small shielded lamp integrated in the display header. */
export function addGenkanInteriorLanterns(add: InteriorBoxWriter): void {
  const { x, z, height, width } = INTERIOR_LANTERNS
  add('timber', width, .065, width, x, D.raisedY + .0325, z)
  add('trim', width + .025, .03, width + .025, x, D.raisedY + height - .015, z)
  add('lampPaper', width - .05, height - .10, width - .05, x, D.raisedY + height / 2, z)
  for (const dx of [-1, 1]) for (const dz of [-1, 1])
    add('timber', .024, height - .08, .024, x + dx * (width / 2 - .012), D.raisedY + height / 2, z + dz * (width / 2 - .012))
  for (const y of [.20, .43]) for (const dz of [-1, 1])
    add('trim', width - .048, .012, .012, x, D.raisedY + y, z + dz * (width / 2 - .006))
  const lamp = INTERIOR_WALL_LAMP
  add('timber', .16, .035, .29, lamp.x, lamp.y + .075, lamp.z)
  add('lampPaper', .105, .11, .22, lamp.x, lamp.y, lamp.z)
  add('timber', .03, .16, .29, lamp.x - .065, lamp.y, lamp.z)
}
