import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** Static architectural paper layers; no second animated door system or Main Hall. */
export function addGenkanInteriorPanels(add: InteriorBoxWriter): void {
  const portalZ = D.rear + .34, half = D.futureOpeningWidth / 2, top = D.raisedY + D.futureOpeningHeight
  for (const side of [-1, 1]) {
    add('timber', .16, top - D.raisedY + .16, .22, side * (half + .08), (D.raisedY + top) / 2, portalZ)
    const flankWidth = D.halfWidth - half - .16
    add('plaster', flankWidth, D.ceilingY - D.raisedY, .08,
      side * (half + .16 + flankWidth / 2), (D.ceilingY + D.raisedY) / 2, portalZ - .04)
    // Paired luminous side infill motivates the two finite warm spill sources.
    add('paper', .035, 1.38, 1.05, side * (D.halfWidth - .10), 4.25, -4.65)
    for (const z of [-4.08, -5.22]) add('trim', .08, 1.54, .07, side * (D.halfWidth - .13), 4.25, z)
    for (const y of [3.50, 5.00]) add('trim', .08, .08, 1.20, side * (D.halfWidth - .13), y, -4.65)
    for (const y of [3.89, 4.25, 4.61]) add('timber', .04, .035, 1.08, side * (D.halfWidth - .135), y, -4.65)
    add('timber', .04, 1.42, .035, side * (D.halfWidth - .135), 4.25, -4.65)
  }
  add('timber', D.futureOpeningWidth + .32, .16, .26, 0, top + .08, portalZ)
  add('plaster', D.futureOpeningWidth, D.ceilingY - top - .16, .08,
    0, (D.ceilingY + top + .16) / 2, portalZ - .04)
  // A recessed closed shoji pair frames the promise of the next room, not its contents.
  const paperZ = D.rear + .06, paperHeight = D.futureOpeningHeight - .12
  for (const side of [-1, 1]) add('paper', half - .045, paperHeight, .035,
    side * half / 2, D.raisedY + .06 + paperHeight / 2, paperZ)
  for (let column = -2; column <= 2; column++)
    add('timber', column === 0 ? .045 : .025, D.futureOpeningHeight, .055,
      column * half / 2, D.raisedY + D.futureOpeningHeight / 2, paperZ + .038)
  for (let row = 0; row <= 5; row++)
    add('timber', D.futureOpeningWidth, .025, .055, 0,
      D.raisedY + row * D.futureOpeningHeight / 5, paperZ + .038)
}
