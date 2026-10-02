import type { CompositionId } from '../shanshui/ShanshuiConfig'

export type DepthLayer = 'foreground' | 'midground' | 'background'
export type DepthAnchor = {
  readonly id: string; readonly x: number; readonly z: number
  readonly layer: DepthLayer; readonly rotation: number
  readonly scale: readonly [number, number, number]
  readonly layouts: readonly CompositionId[]
}
const ALL = ['desktop', 'tablet', 'portrait'] as const
const WIDE = ['desktop', 'tablet'] as const
const DESKTOP = ['desktop'] as const

/** Fixed clusters occupy the existing planted territories, never the open walk.
 * Background anchors sit outside the wall, leaving gaps in its coping silhouette. */
export const DEPTH_TREES: readonly DepthAnchor[] = [
  { id: 'right-island-pine', x: 5.8, z: -21.0, layer: 'foreground', rotation: 1.9, scale: [.68,.69,.62], layouts: WIDE },
  { id: 'left-middle-pine', x: -10.3, z: -36.3, layer: 'midground', rotation: -.9, scale: [.76,.84,.67], layouts: ALL },
  { id: 'right-middle-pine', x: 11.3, z: -33.4, layer: 'midground', rotation: 2.7, scale: [.84,.83,.72], layouts: ALL },
  { id: 'left-behind-wall', x: -14.0, z: -32.5, layer: 'background', rotation: .8, scale: [.88,1.16,.8], layouts: WIDE },
  { id: 'right-behind-wall', x: 15.0, z: -40.6, layer: 'background', rotation: -1.5, scale: [1.05,1.25,.83], layouts: ALL },
  { id: 'west-wing-silhouette', x: -12.0, z: -49.8, layer: 'background', rotation: .5, scale: [.83,1.08,.72], layouts: DESKTOP },
  { id: 'east-wing-silhouette', x: 18.4, z: -49.2, layer: 'background', rotation: 2.4, scale: [.88,1.12,.77], layouts: DESKTOP },
]

/** Each anchor contributes an asymmetric trio: moss, low foliage and a companion
 * stone. Adjacent trios meet existing hero rocks without surrounding them in rings. */
export const DEPTH_CLUSTERS: readonly DepthAnchor[] = [
  { id:'left-hero-foot',x:-8.3,z:-26.9,layer:'foreground',rotation:.3,scale:[1.05,.72,.82],layouts:ALL },
  { id:'left-hero-rear',x:-8.4,z:-28.5,layer:'foreground',rotation:1.3,scale:[.95,.85,.92],layouts:ALL },
  { id:'left-tree-foot',x:-9.0,z:-30.6,layer:'foreground',rotation:-.5,scale:[.76,.65,.7],layouts:ALL },
  { id:'right-front-rock',x:5.4,z:-18.2,layer:'foreground',rotation:2.1,scale:[.85,.68,.8],layouts:ALL },
  { id:'right-front-rear',x:4.1,z:-20.1,layer:'foreground',rotation:-.7,scale:[1.05,.78,.85],layouts:ALL },
  { id:'right-front-tree',x:6.0,z:-20.5,layer:'foreground',rotation:1.2,scale:[.9,.7,.85],layouts:WIDE },
  { id:'left-wall-near',x:-10.4,z:-24.8,layer:'midground',rotation:.8,scale:[.72,.6,.8],layouts:ALL },
  { id:'left-wall-pocket',x:-10.6,z:-35.6,layer:'midground',rotation:-1.0,scale:[1.0,.8,.85],layouts:ALL },
  { id:'left-wall-turn',x:-8.4,z:-40.8,layer:'midground',rotation:1.6,scale:[.9,.65,.85],layouts:WIDE },
  { id:'right-hero-foot',x:7.4,z:-33.6,layer:'midground',rotation:-.4,scale:[.9,.72,.8],layouts:ALL },
  { id:'right-hero-rear',x:7.2,z:-35.5,layer:'midground',rotation:1.6,scale:[1.1,.78,.85],layouts:ALL },
  { id:'right-wall-near',x:11.4,z:-30.1,layer:'midground',rotation:.5,scale:[.72,.68,.8],layouts:ALL },
  { id:'right-wall-middle',x:11.4,z:-34.5,layer:'midground',rotation:-.8,scale:[.8,.75,.78],layouts:WIDE },
  { id:'right-wall-turn',x:10.8,z:-41.3,layer:'midground',rotation:.8,scale:[.95,.75,.9],layouts:ALL },
  { id:'west-wing-foot',x:-6.5,z:-43.2,layer:'background',rotation:.4,scale:[.9,.65,.8],layouts:ALL },
  { id:'east-wing-foot',x:10.7,z:-45.4,layer:'background',rotation:-.7,scale:[.85,.65,.8],layouts:ALL },
  { id:'left-wall-end',x:-8.5,z:-46.0,layer:'background',rotation:1.7,scale:[.7,.6,.75],layouts:DESKTOP },
  { id:'right-wall-end',x:11.4,z:-46.8,layer:'background',rotation:-1.4,scale:[.75,.6,.75],layouts:DESKTOP },
]
