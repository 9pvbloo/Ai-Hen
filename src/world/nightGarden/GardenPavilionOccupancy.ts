/** Authored room states, evaluated once while building the screen instance batches. */
export type PavilionOccupancy = 'cold' | 'warm' | 'dim' | 'entry'
export type PavilionScreenFinish = 'wall' | 'wallWarm' | 'wallDim' | 'wallEntry'

export const PAVILION_OCCUPANCY_FINISH: Readonly<Record<PavilionOccupancy, PavilionScreenFinish>> = {
  cold: 'wall', warm: 'wallWarm', dim: 'wallDim', entry: 'wallEntry',
}

/** Keep the Phase 3K.4 ivory albedo; emission is an additional, restrained light response. */
export const PAVILION_OCCUPANCY_EMISSION = {
  wallWarm: { color: '#bd7b45', intensity: 0.16 },
  wallDim: { color: '#8f542d', intensity: 0.065 },
  wallEntry: { color: '#d29154', intensity: 0.30 },
} as const

/** Front bays listed from west to east. Unlisted returns and rear rooms stay cold. */
export const PAVILION_OCCUPANCY_LAYOUT = {
  hall: ['cold', 'warm', 'cold', 'dim'],
  upper: ['cold', 'cold', 'dim', 'cold'],
  westWing: ['cold', 'cold', 'warm'],
  eastWing: ['cold', 'dim', 'cold'],
} as const satisfies Record<string, readonly PavilionOccupancy[]>
