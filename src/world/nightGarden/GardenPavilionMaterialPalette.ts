import type { MeshStandardMaterial } from 'three'

export type PavilionMaterialFinish = 'foundation' | 'deck' | 'structure' | 'secondaryStructure' |
  'wall' | 'opening' | 'soffit' | 'roof' | 'roofEdge'

/** Architecture borrows these references; only the material owner disposes them. */
export type PavilionMaterialSet = Readonly<Record<PavilionMaterialFinish, MeshStandardMaterial>>

type FinishPalette = { readonly color: string; readonly roughness: number }

/** sRGB authoring values, converted by Three.js Color management without manual gamma. */
export const PAVILION_MATERIAL_PALETTE: Readonly<Record<PavilionMaterialFinish, FinishPalette>> = {
  foundation: { color: '#343a39', roughness: 0.96 },
  deck: { color: '#5d625f', roughness: 0.91 },
  structure: { color: '#424847', roughness: 0.90 },
  secondaryStructure: { color: '#5b615e', roughness: 0.92 },
  wall: { color: '#a8aca4', roughness: 0.96 },
  opening: { color: '#202827', roughness: 0.98 },
  soffit: { color: '#171d1d', roughness: 0.97 },
  roof: { color: '#242a2b', roughness: 0.94 },
  roofEdge: { color: '#353b3b', roughness: 0.91 },
}
