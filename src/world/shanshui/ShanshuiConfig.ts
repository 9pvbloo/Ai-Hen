import type { ScrollRange } from '../../core/ScrollDirector'

export type LayerId = 'far' | 'mistBack' | 'mid' | 'mistFront' | 'near' | 'foreground'
export type CompositionId = 'desktop' | 'tablet' | 'portrait'

export interface LayerPlacement {
  /** Image height relative to the viewport; the original image aspect is preserved. */
  height: number
  /** Image-space point to place on the horizontal centerline. */
  focusX: number
  /** Vertical offset from screen center, in viewport heights; positive is up. */
  y: number
}

export interface LayerConfig {
  id: LayerId
  file: string
  depth: number
  depthShift: number
  order: number
  opacity: number
  color: string
  parallax: readonly [number, number]
}

export interface CompositionConfig {
  cameraZ: number
  push: number
  depthScale: number
  motion: number
  layers: Record<LayerId, LayerPlacement>
}

export const SHANSHUI = {
  background: '#07090a',
  // Remains behind the Phase 3 sky plane instead of cutting across the garden camera.
  fieldDepth: -60,
  fieldColors: ['#090f14', '#1c2a32', '#46535b', '#233039', '#0b141a'],
  edgeOverscan: 1.12,
  reducedMotionScale: 0.06,
  awakeningWeight: 0.8,
  layerSafetyCull: {
    // Cards retain their authored soft exit, then retire deterministically before
    // the active garden camera can intersect their image plane.
    fadeStart: 2.35,
    passedDepth: 0.18,
    opacityThreshold: 0.002,
    handoffStart: 0.005,
    handoffEnd: 0.04,
  },
  ranges: {
    painting: { start: 0, end: 0.18 },
    awakening: { start: 0.18, end: 0.48 },
    living: { start: 0.48, end: 0.68 },
  } satisfies Record<string, ScrollRange>,
  mist: {
    restingStrength: 0.015,
    back: { periodX: 193, periodY: 257, phase: 0.7, driftX: 0.009, driftY: 0.003, opacityGain: 0.08 },
    front: { periodX: 239, periodY: 311, phase: 2.1, driftX: 0.013, driftY: 0.004, opacityGain: 0.12 },
  },
} as const

// Back-to-front order is explicit, independent of transparent-object center sorting.
export const LAYERS: readonly LayerConfig[] = [
  { id: 'far', file: 'far-mountains.png', depth: -10, depthShift: -1.1, order: 1,
    opacity: 0.64, color: '#b3c1c9', parallax: [-0.006, 0.005] },
  { id: 'mistBack', file: 'mist-back.png', depth: -8, depthShift: -0.6, order: 2,
    opacity: 0.16, color: '#b4c0c8', parallax: [0.008, 0.002] },
  { id: 'mid', file: 'mid-mountains.png', depth: -6, depthShift: -0.25, order: 3,
    opacity: 0.94, color: '#a6b5bf', parallax: [0.014, 0.003] },
  { id: 'mistFront', file: 'mist-front.png', depth: -4, depthShift: 0.1, order: 4,
    opacity: 0.19, color: '#adbcc4', parallax: [-0.012, -0.004] },
  { id: 'near', file: 'near-mountains.png', depth: -2, depthShift: 0.35, order: 5,
    opacity: 0.98, color: '#8999a3', parallax: [-0.029, -0.012] },
  { id: 'foreground', file: 'foreground-ink.png', depth: 0, depthShift: 0.55, order: 6,
    opacity: 1, color: '#75868e', parallax: [0.041, -0.023] },
]

export const COMPOSITIONS: Record<CompositionId, CompositionConfig> = {
  desktop: {
    cameraZ: 24, push: 0.35, depthScale: 1, motion: 1,
    layers: {
      far: { height: 0.80, focusX: 0.54, y: 0.13 },
      mistBack: { height: 0.88, focusX: 0.47, y: -0.08 },
      mid: { height: 0.88, focusX: 0.44, y: -0.15 },
      mistFront: { height: 0.98, focusX: 0.52, y: -0.27 },
      near: { height: 0.98, focusX: 0.54, y: -0.41 },
      foreground: { height: 1.20, focusX: 0.52, y: -0.32 },
    },
  },
  tablet: {
    cameraZ: 25, push: 0.25, depthScale: 0.85, motion: 0.7,
    layers: {
      far: { height: 0.75, focusX: 0.53, y: 0.17 },
      mistBack: { height: 0.95, focusX: 0.52, y: -0.03 },
      mid: { height: 0.87, focusX: 0.39, y: -0.13 },
      mistFront: { height: 1.04, focusX: 0.54, y: -0.23 },
      near: { height: 1.04, focusX: 0.60, y: -0.37 },
      foreground: { height: 1.12, focusX: 0.47, y: -0.32 },
    },
  },
  portrait: {
    cameraZ: 26, push: 0.18, depthScale: 0.7, motion: 0.45,
    layers: {
      far: { height: 0.68, focusX: 0.51, y: 0.16 },
      mistBack: { height: 0.90, focusX: 0.53, y: 0.00 },
      mid: { height: 0.82, focusX: 0.36, y: -0.11 },
      mistFront: { height: 1.0, focusX: 0.54, y: -0.21 },
      near: { height: 0.96, focusX: 0.65, y: -0.35 },
      foreground: { height: 1.0, focusX: 0.40, y: -0.34 },
    },
  },
}
