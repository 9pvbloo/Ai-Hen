import type { PavilionBoxWriter } from './GardenPavilionParts'
import { GENKAN as D } from './GenkanDimensions'

/** Retained exterior shadow envelope and sill; the interior owns the room behind it. */
export function addGenkanRecess(add: PavilionBoxWriter): void {
  // Preserve the old hall shadow envelope everywhere outside the extracted aperture.
  // Only the passage is hollowed; upper and side facade silhouettes stay opaque.
  for (const side of [-1, 1]) add('opening', .39, 3.48, 6.42, side * 2.325, 4.28, -3.73)
  // Keep the front collar above the frozen doorway; clear the former low room blocker.
  add('opening', 4.26, .85, .15, 0, 5.595, -.595)
  // Stop beneath the recess floor rather than duplicating its visible top plane.
  add('opening', 4.26, .12, 6.42, 0, 2.60, -3.73)
  // Butt against the sill's rear edge (-.26) and the floor, without coplanar overlap.
  add('deck', 4.24, .08, .41, 0, D.bottom - .04, -.465)
}
