/** Authored wall runs; depth offsets break the silhouette without closing the approach. */
export const GARDEN_WALL_RUNS = [
  { from: [-12.0, -22.0], to: [-11.6, -31.0], bays: 4, height: 1.65 },
  { from: [-11.6, -31.0], to: [-12.3, -38.5], bays: 3, height: 1.48 },
  { from: [-12.3, -38.5], to: [-11.8, -47.5], bays: 4, height: 1.60 },
  { from: [12.2, -28.0], to: [13.1, -36.5], bays: 4, height: 1.25 },
  { from: [14.1, -38.1], to: [16.2, -47.7], bays: 4, height: 1.38 },
] as const

/** Planted pockets sit in front of the wall, leaving pale breathing space between them. */
export const GARDEN_PERIMETER_BANKS = [
  { x: -10.5, z: -23.5, rx: 1.7, rz: 2.2 },
  { x: -10.3, z: -34.8, rx: 2.1, rz: 2.8 },
  { x: -10.4, z: -40.1, rx: 1.8, rz: 2.5 },
  { x: 11.2, z: -30.4, rx: 1.6, rz: 2.3 },
  { x: 12.8, z: -40.7, rx: 1.8, rz: 2.4 },
] as const
