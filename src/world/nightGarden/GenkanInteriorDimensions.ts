import { GENKAN } from './GenkanDimensions'

/** Mansion-local envelope derived from the flanking hall shadows, foundation and roof. */
export const GENKAN_INTERIOR = {
  halfWidth: 2.13, front: -.67, rear: -6.50,
  lowerY: GENKAN.bottom, stepZ: -3.80, stepHeight: .32, stepDepth: .24,
  supportY: 2.70,
  raisedY: GENKAN.bottom + .32, ceilingY: 5.86, wallThickness: .12,
  postWidth: .18, beamHeight: .22,
  futureOpeningWidth: 1.92, futureOpeningHeight: 2.24,
} as const
