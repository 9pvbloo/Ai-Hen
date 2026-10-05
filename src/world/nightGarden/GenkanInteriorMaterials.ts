import { MeshStandardMaterial } from 'three'
import { ArchitecturalMicrodetail } from './ArchitecturalMicrodetail'

export type InteriorFinish = 'timber' | 'trim' | 'floor' | 'stone' | 'plaster' | 'paper' | 'shadow' | 'lampPaper' | 'scroll'

/** Owned here, shared by every interior instance. No images or transparent surfaces. */
export class GenkanInteriorMaterials {
  private readonly microdetail = new ArchitecturalMicrodetail()
  readonly palette: Record<InteriorFinish, MeshStandardMaterial> = {
    scroll: new MeshStandardMaterial({ color: '#a59a80', roughness: .98 }),
    timber: new MeshStandardMaterial({ color: '#292019', roughness: .83 }),
    trim: new MeshStandardMaterial({ color: '#493426', roughness: .70 }),
    floor: new MeshStandardMaterial({ color: '#503a29', roughness: .66 }),
    stone: new MeshStandardMaterial({ color: '#343a39', roughness: .96 }),
    plaster: new MeshStandardMaterial({ color: '#898170', roughness: .98 }),
    paper: new MeshStandardMaterial({ color: '#b4a588', roughness: .95, emissive: '#d8954f', emissiveIntensity: .10 }),
    shadow: new MeshStandardMaterial({ color: '#151410', roughness: .97 }),
    lampPaper: new MeshStandardMaterial({ color: '#baaa8c', roughness: .95, emissive: '#e6ad69', emissiveIntensity: .30 }),
  }
  private disposed = false

  constructor() {
    for (const [name, material] of Object.entries(this.palette)) material.name = `genkan-interior-${name}`
    for (const name of ['timber', 'trim', 'floor'] as const) this.microdetail.apply(this.palette[name], 'wood', .012)
    this.microdetail.apply(this.palette.plaster, 'plaster', .009)
    this.microdetail.apply(this.palette.stone, 'stone', .025)
    this.microdetail.apply(this.palette.paper, 'paper', .006)
    this.microdetail.apply(this.palette.scroll, 'paper', .006)
    this.microdetail.apply(this.palette.lampPaper, 'paper', .006)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const material of Object.values(this.palette)) material.dispose()
    this.microdetail.dispose()
  }
}
