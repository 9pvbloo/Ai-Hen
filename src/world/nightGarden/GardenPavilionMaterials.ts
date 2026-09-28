import { FrontSide, MeshStandardMaterial } from 'three'
import { PAVILION_MATERIAL_PALETTE } from './GardenPavilionMaterialPalette'
import type { PavilionMaterialFinish, PavilionMaterialSet } from './GardenPavilionMaterialPalette'

/** One opaque, texture-free material per finish, shared by every mansion batch. */
export class GardenPavilionMaterials implements PavilionMaterialSet {
  private readonly owned: MeshStandardMaterial[] = []
  private disposed = false

  readonly foundation = this.create('foundation')
  readonly deck = this.create('deck')
  readonly structure = this.create('structure')
  readonly secondaryStructure = this.create('secondaryStructure')
  readonly wall = this.create('wall')
  readonly opening = this.create('opening')
  readonly soffit = this.create('soffit')
  readonly roof = this.create('roof')
  readonly roofEdge = this.create('roofEdge')

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.owned.forEach(material => material.dispose())
    this.owned.length = 0
  }

  private create(finish: PavilionMaterialFinish): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      ...PAVILION_MATERIAL_PALETTE[finish],
      metalness: 0, emissive: 0, emissiveIntensity: 0,
      transparent: false, opacity: 1, depthWrite: true, depthTest: true,
      toneMapped: true, side: FrontSide,
    })
    material.name = `pavilion-${finish}`
    this.owned.push(material)
    return material
  }
}
