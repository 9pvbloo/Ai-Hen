import type { PavilionBoxWriter } from './GardenPavilionParts'
import { pavilionFacadePlane } from './GardenPavilionParts'
import { addPavilionScreen } from './GardenPavilionScreens'

/** Authored facade details feed the existing shared-material instance batches. */
export class GardenPavilionFacade {
  constructor(private readonly add: PavilionBoxWriter) {}

  create(): void {
    this.createHallFraming()
    this.createHallScreens()
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

  private createHallFraming(): void {
    // Four residential bays flank the three-part ceremonial centre.
    for (const x of [-6, -3.6, 3.6, 6]) {
      for (const offset of [-1.03, 1.03]) {
        this.add('secondaryStructure', 0.14, 3.12, 0.22, x + offset, 4.34, 2.17)
      }
      this.add('structure', 2.20, 0.23, 0.28, x, 5.98, 2.18)
      this.add('secondaryStructure', 2.20, 0.17, 0.27, x, 2.84, 2.18)
    }
    // Side lights set off the broad entry instead of repeating the residential grid.
    for (const x of [-1.65, 1.65]) {
      this.add('secondaryStructure', 0.16, 0.66, 0.22, x, 6.01, 2.25)
    }
  }

  private createHallScreens(): void {
    const front = pavilionFacadePlane(this.add, 0, 2.10)
    for (const x of [-6, -3.6, 3.6, 6]) {
      addPavilionScreen(front, { x, bottom: 2.95, width: 1.88, height: 2.53,
        reveal: Math.abs(x) < 4 })
    }
  }
}

