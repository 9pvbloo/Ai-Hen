import { FrontSide, MeshStandardMaterial } from 'three'
import { PAVILION_MATERIAL_PALETTE } from './GardenPavilionMaterialPalette'
import type { PavilionMaterialFinish, PavilionMaterialSet } from './GardenPavilionMaterialPalette'
import { shapePavilionSource } from './GardenPavilionSource'
import { PAVILION_OCCUPANCY_EMISSION } from './GardenPavilionOccupancy'
import { ArchitecturalMicrodetail } from './ArchitecturalMicrodetail'

/** Opaque finishes share small procedural maps and retain their existing source shaders. */
export class GardenPavilionMaterials implements PavilionMaterialSet {
  private readonly microdetail = new ArchitecturalMicrodetail()
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
  readonly wallWarm = this.createOccupied('wallWarm')
  readonly wallDim = this.createOccupied('wallDim')
  readonly wallEntry = this.createOccupied('wallEntry')

  setIntensity(visibility: number): void {
    this.wallWarm.emissiveIntensity = PAVILION_OCCUPANCY_EMISSION.wallWarm.intensity * visibility
    this.wallDim.emissiveIntensity = PAVILION_OCCUPANCY_EMISSION.wallDim.intensity * visibility
    this.wallEntry.emissiveIntensity = PAVILION_OCCUPANCY_EMISSION.wallEntry.intensity * visibility
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.owned.forEach(material => material.dispose())
    this.owned.length = 0
    this.microdetail.dispose()
  }

  private create(finish: PavilionMaterialFinish): MeshStandardMaterial {
    const material = new MeshStandardMaterial({
      ...PAVILION_MATERIAL_PALETTE[finish],
      metalness: 0, emissive: 0, emissiveIntensity: 0,
      transparent: false, opacity: 1, depthWrite: true, depthTest: true,
      toneMapped: true, side: FrontSide,
    })
    material.name = `pavilion-${finish}`
    if (['structure', 'secondaryStructure', 'deck'].includes(finish)) this.microdetail.apply(material, 'wood', .012)
    if (finish === 'foundation') this.microdetail.apply(material, 'stone', .025)
    if (finish === 'wall') this.microdetail.apply(material, 'paper', .006)
    this.owned.push(material)
    return material
  }

  private createOccupied(finish: keyof typeof PAVILION_OCCUPANCY_EMISSION): MeshStandardMaterial {
    const material = this.create('wall')
    const emission = PAVILION_OCCUPANCY_EMISSION[finish]
    material.name = `pavilion-${finish}`
    // Only occupied infill receives the warm paper tint; cold rooms stay unchanged.
    material.color.set('#dcc8a8')
    material.emissive.set(emission.color)
    material.emissiveIntensity = emission.intensity
    shapePavilionSource(material)
    return material
  }
}
