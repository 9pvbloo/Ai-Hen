import type { PavilionBoxWriter } from './GardenPavilionParts'
import { GENKAN as D } from './GenkanDimensions'

/** Enclosed, undecorated promise of depth. No room, props, extra lighting or rear exit. */
export function addGenkanRecess(add: PavilionBoxWriter): void {
  const front = -.54, rear = -3.8, depth = front - rear, center = (front + rear) / 2
  add('opening', 4.36, 2.55, .16, 0, D.bottom + 1.22, rear)
  for (const side of [-1, 1]) add('opening', .14, 2.55, depth, side * 2.20, D.bottom + 1.22, center)
  add('opening', 4.54, .12, depth, 0, D.bottom - .06, center)
  add('opening', 4.54, .14, depth, 0, D.bottom + D.height + .04, center)
  // Continue the existing sill backwards, supported by the frozen hall floor below.
  add('deck', 4.24, .08, .58, 0, D.bottom - .04, -.38)
}
