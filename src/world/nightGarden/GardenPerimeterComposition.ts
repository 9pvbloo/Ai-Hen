/** Authored wall runs; depth offsets break the silhouette without closing the approach. */
export const GARDEN_WALL_RUNS = [
  { from: [-12.0, -22.0], to: [-11.6, -31.0], bays: 4, height: 2.13 },
  { from: [-11.6, -31.0], to: [-12.3, -38.5], bays: 3, height: 1.91 },
  { from: [-12.3, -38.5], to: [-8.8, -40.0], bays: 2, height: 1.91 },
  { from: [-8.8, -40.0], to: [-9.4, -47.5], bays: 3, height: 1.94 },
  { from: [12.2, -28.0], to: [13.1, -36.5], bays: 4, height: 1.66 },
  { from: [11.8, -38.8], to: [13.3, -47.7], bays: 4, height: 1.80 },
] as const

/** Planted pockets sit in front of the wall, leaving pale breathing space between them. */
export const GARDEN_PERIMETER_BANKS = [
  { x: -10.5, z: -23.5, rx: 1.7, rz: 2.2 },
  { x: -10.3, z: -34.8, rx: 2.1, rz: 2.8 },
  { x: -7.9, z: -40.8, rx: 1.8, rz: 2.5 },
  { x: 11.2, z: -30.4, rx: 1.6, rz: 2.3 },
  { x: 10.9, z: -40.7, rx: 1.8, rz: 2.4 },
  // Secondary pockets bridge the two middle-depth gaps behind the hero islands.
  { x: -10.5, z: -28.5, rx: 1.3, rz: 1.65 },
  { x: 11.5, z: -35.7, rx: 1.2, rz: 1.9 },
] as const
