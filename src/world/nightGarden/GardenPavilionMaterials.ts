import { MeshStandardMaterial } from 'three'

function material(color: string, roughness: number): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness, metalness: 0.03 })
}

/** Owns the mansion's material instances and their lifecycle. */
export class GardenPavilionMaterials {
  readonly lowerRoof = material('#22323b', 0.82)
  readonly upperRoof = material('#18242a', 0.82)
  readonly wingRoof = material('#1c2b2e', 0.86)
  readonly foundation = material('#182426', 0.9)
  readonly timber = material('#263638', 0.76)
  readonly trim = material('#53635f', 0.7)
  readonly soffit = material('#141d1e', 0.9)
  readonly roofDetail = material('#364542', 0.76)
  readonly core = material('#101718', 0.95)
  readonly warmInterior = material('#604a35', 0.9)
  readonly quietInterior = material('#18201f', 0.92)
  readonly interiorShadow = material('#121412', 0.95)
  readonly coolPaper = material('#c8ceca', 0.84)
  readonly warmPaper = material('#c5ad8d', 0.86)
  readonly quietPaper = material('#a7afaa', 0.88)

  private readonly materials = [
    this.lowerRoof, this.upperRoof, this.wingRoof, this.foundation, this.timber, this.trim, this.soffit,
    this.roofDetail, this.core, this.warmInterior, this.quietInterior, this.interiorShadow,
    this.coolPaper, this.warmPaper, this.quietPaper,
  ]

  constructor() {
    this.warmInterior.emissive.set('#6f391b')
    this.quietInterior.emissive.set('#131a1a')
    this.coolPaper.emissive.set('#303634')
    this.warmPaper.emissive.set('#5c341d')
    this.quietPaper.emissive.set('#1c2424')
    for (const paper of [this.coolPaper, this.warmPaper, this.quietPaper]) {
      paper.transparent = true
      paper.depthWrite = false
    }
    this.coolPaper.opacity = 0.86
    this.warmPaper.opacity = 0.84
    this.quietPaper.opacity = 0.8
  }

  setIntensity(value: number): void {
    this.coolPaper.emissiveIntensity = 0.042 * value
    this.warmPaper.emissiveIntensity = 0.105 * value
    this.quietPaper.emissiveIntensity = 0.014 * value
    this.warmInterior.emissiveIntensity = 0.11 * value
    this.quietInterior.emissiveIntensity = 0.02 * value
  }

  dispose(): void {
    this.materials.forEach(material => material.dispose())
  }
}
