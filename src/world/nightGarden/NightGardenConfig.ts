import type { ScrollRange } from '../../core/ScrollDirector'
import type { CompositionId } from '../shanshui/ShanshuiConfig'

/** Temporary review switch: preserves all garden systems while rendering only the Pavilion setting. */
export const PAVILION_ISOLATION_MODE = true

/** Temporary composition view: ground, stepping stones, and the frozen Pavilion only. */
export const STONE_PATH_REVIEW_MODE = true

export type NightGardenState = 'COMMIT' | 'PASSAGE' | 'REVEAL' | 'ARRIVAL' | 'NIGHT GARDEN ESTABLISHED'

export interface GardenLayout {
  readonly crossingDistance: number
  readonly cameraX: number
  readonly cameraY: number
  readonly targetX: number
  readonly targetY: number
  readonly targetZ: number
  readonly pondScale: readonly [number, number]
  readonly mistLayers: number
  readonly pathCount: number
  readonly bambooCount: number
  readonly rockCount: number
}

export const NIGHT_GARDEN = {
  range: { start: 0.68, end: 1 } satisfies ScrollRange,
  reducedMotionCrossingScale: 0.86,
  shanshuiExit: { start: 0.3, end: 0.68 },
  colors: {
    background: '#07090a',
    ground: '#101d1d',
    groundEdge: '#1a2927',
    path: '#4d5655',
    pathEdge: '#87918d',
    water: '#09161b',
    waterSilver: '#aebfc5',
    rock: '#313b3b',
    rockLight: '#697473',
    bamboo: '#172b29',
    leaf: '#203835',
    mist: '#a8bbc0',
  },
  layouts: {
    desktop: {
      crossingDistance: 34, cameraX: -0.7, cameraY: -1.2,
      targetX: -0.4, targetY: -3.15, targetZ: -26,
      pondScale: [1, 1], mistLayers: 3, pathCount: 12, bambooCount: 30, rockCount: 7,
    },
    tablet: {
      crossingDistance: 29, cameraX: -0.42, cameraY: -1.0,
      targetX: -0.18, targetY: -3.05, targetZ: -24,
      pondScale: [0.88, 0.9], mistLayers: 2, pathCount: 9, bambooCount: 22, rockCount: 6,
    },
    portrait: {
      crossingDistance: 25, cameraX: -0.18, cameraY: -0.78,
      targetX: -0.05, targetY: -3.12, targetZ: -22,
      pondScale: [0.68, 0.78], mistLayers: 1, pathCount: 7, bambooCount: 15, rockCount: 4,
    },
  } satisfies Record<CompositionId, GardenLayout>,
} as const
