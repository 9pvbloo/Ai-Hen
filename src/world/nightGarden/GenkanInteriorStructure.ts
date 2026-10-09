import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** Compact three-bay timber rhythm, seated on the floor and joined to the ceiling. */
export function addGenkanInteriorStructure(add: InteriorBoxWriter): void {
  const x = D.halfWidth - .12, height = D.ceilingY - D.lowerY
  for (const side of [-1, 1]) {
    for (const z of [-1.00, D.stepZ, D.rear + .20])
      add('timber', D.postWidth, height, D.postWidth, side * x, D.lowerY + height / 2, z)
    add('timber', .20, .28, D.front - D.rear, side * x, D.ceilingY - .14, (D.front + D.rear) / 2)
    const lowerBack = D.stepZ + D.stepDepth / 2
    add('trim', .10, .14, D.front - lowerBack, side * (D.halfWidth - .08), D.lowerY + .07, (D.front + lowerBack) / 2)
    add('trim', .10, .14, D.stepZ - D.rear, side * (D.halfWidth - .08), D.raisedY + .07, (D.stepZ + D.rear) / 2)
  }
  for (const z of [-1.00, D.stepZ, D.rear + .20])
    add('timber', D.halfWidth * 2, D.beamHeight, .22, 0, D.ceilingY - D.beamHeight / 2, z)
  for (const z of [-2.35, -5.05])
    add('timber', D.halfWidth * 2, .10, .09, 0, D.ceilingY - .05, z)
  for (const x of [-1.05, 0, 1.05])
    add('timber', .055, .055, D.front - D.rear, x, D.ceilingY - .0275, (D.front + D.rear) / 2)
}
