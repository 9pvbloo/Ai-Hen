import type { PavilionBoxWriter } from './GardenPavilionParts'

/** Authored facade details feed the existing shared-material instance batches. */
export class GardenPavilionFacade {
  constructor(private readonly add: PavilionBoxWriter) {}

  create(): void {
    // Hall: a heavy entrance lintel is distinct from the quieter flanking bay rails.
    this.add('structure', 6.72, 0.30, 0.34, 0, 6.48, 2.34)
    this.add('secondaryStructure', 3.72, 0.18, 0.22, -5.34, 5.60, 2.31)
    this.add('secondaryStructure', 3.72, 0.18, 0.22, 5.34, 5.60, 2.31)
    for (const x of [-4.80, -2.40, 2.40, 4.80]) this.add('secondaryStructure', 0.16, 3.16, 0.18, x, 4.30, 2.31)

    // Wing beam lines recede one level below the hall hierarchy.
    for (const x of [-10.65, 10.65]) {
      this.add('secondaryStructure', 6.82, 0.17, 0.20, x, 4.72, 0.53)
      this.add('secondaryStructure', 6.78, 0.13, 0.18, x, 3.00, 0.53)
    }

    // Upper residence gets a shallow header and visible central bay, not a solid second-storey strip.
    this.add('secondaryStructure', 9.94, 0.18, 0.22, 0, 9.19, 0.14)
    this.add('secondaryStructure', 0.16, 1.94, 0.18, 0, 8.22, 0.14)
  }
}

