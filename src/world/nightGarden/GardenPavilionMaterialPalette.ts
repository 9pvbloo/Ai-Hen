import type { MeshStandardMaterial } from 'three'

export type PavilionMaterialFinish = 'foundation' | 'deck' | 'structure' | 'secondaryStructure' |
  'wall' | 'opening' | 'soffit' | 'roof' | 'roofEdge'

/** Architecture borrows these references; only the material owner disposes them. */
export type PavilionMaterialSet = Readonly<Record<PavilionMaterialFinish, MeshStandardMaterial>>

type FinishPalette = { readonly color: string; readonly roughness: number }

/**
 * sRGB authoring values, converted by Three.js Color management without manual gamma.
 * Tuned under the frozen garden lights: pale matte infill, heavy warm-neutral posts,
 * quieter secondary joinery and cool roof planes. No emissive or texture compensation.
 */
export const PAVILION_MATERIAL_PALETTE: Readonly<Record<PavilionMaterialFinish, FinishPalette>> = {
  foundation: { color: '#282d2e', roughness: 0.96 },
  deck: { color: '#382d25', roughness: 0.82 },
  structure: { color: '#241c19', roughness: 0.72 },
  secondaryStructure: { color: '#49433f', roughness: 0.80 },
  wall: { color: '#cfd2cf', roughness: 0.94 },
  opening: { color: '#0a0d10', roughness: 0.98 },
  soffit: { color: '#111618', roughness: 0.98 },
  roof: { color: '#182632', roughness: 0.68 },
  roofEdge: { color: '#10171e', roughness: 0.78 },
}
