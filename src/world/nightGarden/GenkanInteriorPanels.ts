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
