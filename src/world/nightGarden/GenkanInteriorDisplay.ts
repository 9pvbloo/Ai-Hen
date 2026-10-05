import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** Interior joinery over the intact plaster shell; no invented exterior apertures. */
export function addGenkanInteriorDisplay(add: InteriorBoxWriter): void {
  const x = -1.99, z = -5.49
  // The plaster backing is recessed behind projecting timber jambs and a low shelf.
  add('plaster', .04, 2.14, 1.39, -2.075, 4.30, z)
  for (const edge of [-1, 1]) add('timber', .20, 2.25, .08, x, 4.30, z + edge * .73)
  add('timber', .20, .09, 1.54, x, 5.47, z)
  add('trim', .56, .14, 1.54, -1.79, D.raisedY + .07, z)
  // Unlit hanging scroll, with narrow dark rollers and a spare ink branch motif.
  add('scroll', .018, 1.20, .52, -2.025, 4.66, z)
  for (const y of [4.04, 5.28]) add('timber', .032, .034, .59, -2.006, y, z)
  for (let i = 0; i < 5; i++) add('shadow', .007, .12, .014 + i * .002,
    -2.012, 4.32 + i * .10, z + .08 - i * .025)
  add('shadow', .007, .016, .16, -2.012, 4.65, z - .05)
  // A low getabako-like cabinet stays against the right wall, clear of the portal.
  add('timber', .45, .60, 1.26, 1.84, D.raisedY + .35, -5.40)
  add('trim', .49, .055, 1.32, 1.82, D.raisedY + .68, -5.40)
  for (const x of [1.66, 2.02]) for (const z of [-5.94, -4.86])
    add('timber', .075, .05, .075, x, D.raisedY + .025, z)
  for (const dz of [-.32, .32]) {
    add('trim', .018, .48, .58, 1.606, D.raisedY + .37, -5.40 + dz)
    add('shadow', .028, .065, .025, 1.588, D.raisedY + .39, -5.40 + dz * .22)
  }
}
