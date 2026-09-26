import type { PavilionBoxWriter } from './GardenPavilionParts'

/** Static support recipes reuse Architecture's box geometry and neutral finishes. */
export class GardenPavilionStructuralDetails {
  private readonly add: PavilionBoxWriter

  constructor(add: PavilionBoxWriter) { this.add = add }

  createVeranda(): void {
    // Separated front runs preserve the stair and ceremonial entry axis.
    for (const [x, width, z, y] of [
      [-5.55, 4.10, 3.20, 2.60], [5.55, 4.10, 3.20, 2.60],
      [-10.98, 6.50, 1.95, 2.48], [10.98, 6.50, 1.95, 2.48],
    ]) {
      this.add('structure', width, 0.20, 0.23, x, y - 0.26, z + 0.45)
      for (const offset of [-0.45, -0.15, 0.15, 0.45]) {
        this.add('secondaryStructure', width, 0.04, 0.035, x, y + 0.11, z + offset)
      }
      for (const offset of [-width * 0.30, width * 0.30]) {
        this.add('foundation', 0.36, 0.48, 0.44, x + offset, 2.01, z + 0.30)
        this.add('structure', 0.18, 0.16, 1.10, x + offset, y - 0.17, z)
      }
    }
    // Quiet outer hall rails; the inner flanks stay open to the entrance.
    for (const center of [-6.65, 6.65]) {
      for (const y of [2.91, 3.42]) this.add('secondaryStructure', 1.64, 0.09, 0.12, center, y, 3.72)
      for (const offset of [-0.76, 0.76]) this.add('structure', 0.12, 0.76, 0.14, center + offset, 3.10, 3.72)
    }
  }
}
