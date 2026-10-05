import { PRACTICAL_LIGHT } from './PracticalLightPalette'
/** Authored room states, evaluated once while building the screen instance batches. */
export type PavilionOccupancy = 'cold' | 'warm' | 'dim' | 'entry'
export type PavilionScreenFinish = 'wall' | 'wallWarm' | 'wallDim' | 'wallEntry'

export const PAVILION_OCCUPANCY_FINISH: Readonly<Record<PavilionOccupancy, PavilionScreenFinish>> = {
  cold: 'wall', warm: 'wallWarm', dim: 'wallDim', entry: 'wallEntry',
}

/** Keep the Phase 3K.4 ivory albedo; emission is an additional, restrained light response. */
export const PAVILION_OCCUPANCY_EMISSION = {
  wallWarm: { color: PRACTICAL_LIGHT.paper, intensity: 0.50 },
  wallDim: { color: PRACTICAL_LIGHT.dim, intensity: 0.23 },
  wallEntry: { color: PRACTICAL_LIGHT.paper, intensity: 0.58 },
} as const

/** Front bays listed from west to east. Unlisted returns and rear rooms stay cold. */
export const PAVILION_OCCUPANCY_LAYOUT = {
  hall: ['warm', 'warm', 'dim', 'warm'],
  upper: ['warm', 'warm', 'dim', 'warm'],
  westWing: ['dim', 'cold', 'dim'],
  eastWing: ['dim', 'dim', 'cold'],
} as const satisfies Record<string, readonly PavilionOccupancy[]>
