import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** Thin inner skins sit in front of the retained structural shadow sides. */
export function addGenkanInteriorShell(add: InteriorBoxWriter): void {
  const height = D.ceilingY - D.lowerY, depth = D.front - D.rear, center = (D.front + D.rear) / 2
  for (const side of [-1, 1])
    add('plaster', .06, height, depth, side * (D.halfWidth - .03), D.lowerY + height / 2, center)
  add('shadow', D.halfWidth * 2, height + .12, D.wallThickness, 0,
    D.lowerY + height / 2, D.rear - D.wallThickness / 2)
  add('shadow', D.halfWidth * 2, .12, depth, 0, D.ceilingY + .06, center)
}
