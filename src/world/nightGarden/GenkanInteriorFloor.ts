import type { InteriorBoxWriter } from './GenkanInteriorBatch'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** Continuous supported floors; joints expose a recessed base, never another coplanar top. */
export function addGenkanInteriorFloor(add: InteriorBoxWriter): void {
  const stepFront = D.stepZ + D.stepDepth / 2, stepRear = D.stepZ - D.stepDepth / 2
  const width = D.halfWidth * 2, lowerDepth = D.front - stepFront
  add('stone', width, .09, lowerDepth, 0, D.lowerY - .075, (D.front + stepFront) / 2, .75)
  const columns = 4, rows = 3, tileWidth = width / columns, tileDepth = lowerDepth / rows
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    add('stone', tileWidth - .012, .03, tileDepth - .012,
      -D.halfWidth + (column + .5) * tileWidth, D.lowerY - .015, D.front - (row + .5) * tileDepth,
      .91 + ((row * 3 + column * 5) % 7) * .018)
  }
  // A solid noble-timber edge gives the level change its front, top, depth and support.
  add('trim', width, D.stepHeight, D.stepDepth, 0, D.lowerY + D.stepHeight / 2, D.stepZ)
  const platformDepth = stepRear - D.rear, platformCenter = (stepRear + D.rear) / 2
  add('shadow', width, D.stepHeight - .05, platformDepth, 0, D.lowerY + (D.stepHeight - .05) / 2, platformCenter)
  const boards = 11, boardWidth = width / boards
  for (let i = 0; i < boards; i++) for (let row = 0; row < 2; row++) {
    add('floor', boardWidth - .008, .05, platformDepth / 2 - .008,
      -D.halfWidth + (i + .5) * boardWidth, D.raisedY - .025, stepRear - (row + .5) * platformDepth / 2,
      .92 + ((i * 7 + row * 3) % 9) * .015)
  }
}
