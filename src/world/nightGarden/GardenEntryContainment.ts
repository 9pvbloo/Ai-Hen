import type { DepthAnchor } from './GardenDepthComposition'

/** Entry extensions are intentionally separate from the approved practical-light mask. */
export const ENTRY_WALL_RUNS = [
  { from: [-12, -8], to: [-12, -22], bays: 5, height: 2.13, joinEnd: true },
  { from: [12.2, -8], to: [12.2, -28], bays: 7, height: 2.13, joinEnd: true },
  { from: [13.1, -36.5], to: [11.8, -38.8], bays: 1, height: 1.75, joinStart: true, joinEnd: true },
] as const

const ALL = ['desktop', 'tablet', 'portrait'] as const

/** Low, irregular planting stays on the outer banks; the central gravel stays open. */
export const ENTRY_CLUSTERS: readonly DepthAnchor[] = [
  { id: 'entry-left-near', x: -10.8, z: -12.8, layer: 'foreground', rotation: .4, scale: [1.0,.55,.9], layouts: ALL },
  { id: 'entry-left-middle', x: -11.45, z: -17.5, layer: 'foreground', rotation: -1.0, scale: [.72,.56,1.0], layouts: ALL },
  { id: 'entry-left-join', x: -10.8, z: -21.5, layer: 'foreground', rotation: 1.3, scale: [.85,.5,.85], layouts: ALL },
  { id: 'entry-right-near', x: 10.8, z: -13.0, layer: 'foreground', rotation: -1.2, scale: [1.0,.55,.95], layouts: ALL },
  { id: 'entry-right-middle', x: 10.7, z: -18.2, layer: 'foreground', rotation: .7, scale: [1.15,.64,1.05], layouts: ALL },
  { id: 'entry-right-join', x: 10.8, z: -24.0, layer: 'foreground', rotation: 2.1, scale: [1.0,.58,.9], layouts: ALL },
]

export const ENTRY_TREES: readonly DepthAnchor[] = [
  { id: 'entry-left-silhouette', x: -13.6, z: -18.5, layer: 'background', rotation: .6, scale: [.62,.76,.64], layouts: ALL },
  { id: 'entry-right-silhouette', x: 13.7, z: -22.0, layer: 'background', rotation: -1.3, scale: [.72,.83,.68], layouts: ALL },
]

