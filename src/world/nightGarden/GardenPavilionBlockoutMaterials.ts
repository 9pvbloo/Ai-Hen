import { MeshStandardMaterial } from 'three'

/**
 * Deliberately plain materials for the Phase 3K.1 architectural review.
 *
 * The mansion must hold its silhouette before the former procedural wood, paper,
 * and roof treatments are considered again. These instances own no textures,
 * emissive response, or shader patches.
 */
export class GardenPavilionBlockoutMaterials {
  readonly foundation = new MeshStandardMaterial({ color: '#343a39', roughness: 0.96, metalness: 0 })
  readonly deck = new MeshStandardMaterial({ color: '#5d625f', roughness: 0.91, metalness: 0 })
  readonly structure = new MeshStandardMaterial({ color: '#424847', roughness: 0.9, metalness: 0 })
  readonly secondaryStructure = new MeshStandardMaterial({ color: '#5b615e', roughness: 0.92, metalness: 0 })
  readonly wall = new MeshStandardMaterial({ color: '#a8aca4', roughness: 0.96, metalness: 0 })
  readonly opening = new MeshStandardMaterial({ color: '#202827', roughness: 0.98, metalness: 0 })
  readonly soffit = new MeshStandardMaterial({ color: '#171d1d', roughness: 0.97, metalness: 0 })
  readonly roof = new MeshStandardMaterial({ color: '#242a2b', roughness: 0.94, metalness: 0 })
  readonly roofEdge = new MeshStandardMaterial({ color: '#353b3b', roughness: 0.91, metalness: 0 })

  private readonly materials = [
    this.foundation, this.deck, this.structure, this.secondaryStructure, this.wall,
    this.opening, this.soffit, this.roof, this.roofEdge,
  ]

  dispose(): void { this.materials.forEach(material => material.dispose()) }
}
