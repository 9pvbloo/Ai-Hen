import { MeshStandardMaterial } from 'three'

export type InteriorFinish = 'timber' | 'trim' | 'floor' | 'stone' | 'plaster' | 'paper' | 'shadow' | 'lampPaper'

/** Owned here, shared by every interior instance. No images or transparent surfaces. */
export class GenkanInteriorMaterials {
  readonly palette: Record<InteriorFinish, MeshStandardMaterial> = {
    timber: new MeshStandardMaterial({ color: '#292019', roughness: .83 }),
    trim: new MeshStandardMaterial({ color: '#493426', roughness: .70 }),
    floor: new MeshStandardMaterial({ color: '#503a29', roughness: .66 }),
    stone: new MeshStandardMaterial({ color: '#343a39', roughness: .96 }),
    plaster: new MeshStandardMaterial({ color: '#898170', roughness: .98 }),
    paper: new MeshStandardMaterial({ color: '#b4a588', roughness: .95, emissive: '#d8954f', emissiveIntensity: .10 }),
    shadow: new MeshStandardMaterial({ color: '#151410', roughness: .97 }),
    lampPaper: new MeshStandardMaterial({ color: '#baaa8c', roughness: .95, emissive: '#e6ad69', emissiveIntensity: .65 }),
  }
  private disposed = false

  constructor() {
    for (const [name, material] of Object.entries(this.palette)) material.name = `genkan-interior-${name}`
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const material of Object.values(this.palette)) material.dispose()
  }
}
