import type { ScrollRange } from '../../core/ScrollDirector'
import type { CompositionId } from '../shanshui/ShanshuiConfig'

export type MoonGateState = 'Hidden' | 'Emerging' | 'Recognized' | 'Approach' | 'Threshold'

export interface MoonGateLayout {
  position: readonly [number, number, number]
  scale: number
  cameraApproach: number
}

export const MOON_GATE = {
  geometry: {
    wallWidth: 18,
    wallOuterRadius: 5.5,
    wallSideBulge: 0.35,
    wallBottom: -13,
    wallEndHeight: -4.2,
    wallShoulder: 4.6,
    wallCrown: 5.35,
    openingRadius: 5.05,
    openingY: -0.18,
    passageBaseY: -9,
    passageBaseHalfWidth: 8.5,
    revealBaseY: -5.08,
    revealBaseHalfWidth: 2.5,
    wallDepth: 1.35,
    revealWidth: 0.34,
    revealDepth: 0.12,
    radialSegments: 32,
  },
  colors: {
    plaster: '#596368',
    stone: '#687376',
    interior: '#071015',
    moonlight: '#c8d6dc',
    ambientSky: '#8097a2',
    ambientGround: '#071015',
    beyond: '#aebdc0',
  },
  materials: {
    roughness: 0.86,
    stoneRoughness: 0.9,
    hiddenVisibility: 0.012,
    emergenceVisibility: 0.58,
    interiorOpacity: 0.34,
    depthWriteVisibility: 0.68,
  },
  lighting: {
    hemisphere: 0.46,
    moon: 1.6,
    beyond: 0.48,
    emergenceFloor: 0.08,
  },
  ranges: {
    phase: { start: 0.4, end: 0.68 },
    emergence: { start: 0.4, end: 0.52 },
    recognition: { start: 0.52, end: 0.57 },
    approach: { start: 0.57, end: 0.635 },
    threshold: { start: 0.635, end: 0.68 },
  } satisfies Record<string, ScrollRange>,
  reducedMotionApproachScale: 0.45,
  layouts: {
    desktop: { position: [0.55, -0.42, -5.6], scale: 1.16, cameraApproach: 5.4 },
    tablet: { position: [0.15, -0.22, -5.35], scale: 1.02, cameraApproach: 3.8 },
    portrait: { position: [0, 0.32, -5.05], scale: 0.86, cameraApproach: 2.15 },
  } satisfies Record<CompositionId, MoonGateLayout>,
} as const
