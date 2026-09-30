/** Authored room states, evaluated once while building the screen instance batches. */
export type PavilionOccupancy = 'cold' | 'warm' | 'dim' | 'entry'
export type PavilionScreenFinish = 'wall' | 'wallWarm' | 'wallDim' | 'wallEntry'

export const PAVILION_OCCUPANCY_FINISH: Readonly<Record<PavilionOccupancy, PavilionScreenFinish>> = {
  cold: 'wall', warm: 'wallWarm', dim: 'wallDim', entry: 'wallEntry',
}

/** Keep the Phase 3K.4 ivory albedo; emission is an additional, restrained light response. */
export const PAVILION_OCCUPANCY_EMISSION = {
  wallWarm: { color: '#e7a96c', intensity: 0.52 },
  wallDim: { color: '#ce925b', intensity: 0.28 },
  wallEntry: { color: '#e6b46b', intensity: 0.78 },
} as const

/** Front bays listed from west to east. Unlisted returns and rear rooms stay cold. */
export const PAVILION_OCCUPANCY_LAYOUT = {
  hall: ['warm', 'warm', 'dim', 'warm'],
  upper: ['warm', 'warm', 'dim', 'warm'],
  westWing: ['dim', 'cold', 'dim'],
  eastWing: ['dim', 'dim', 'cold'],
} as const satisfies Record<string, readonly PavilionOccupancy[]>
