import type { PavilionBoxWriter } from './GardenPavilionParts'
import { pavilionFacadePlane } from './GardenPavilionParts'
import { addPavilionScreen } from './GardenPavilionScreens'

/** Authored facade details feed the existing shared-material instance batches. */
export class GardenPavilionFacade {
  private readonly add: PavilionBoxWriter

  constructor(add: PavilionBoxWriter) { this.add = add }

  create(): void {
    this.createHallFraming()
    this.createHallScreens()
    this.createEntry()
    this.createUpperResidence()
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

  private createEntry(): void {
    // Two thresholds reinforce the existing 5.9 m covered approach.
    for (const [z, halfWidth, lintelY] of [[5.75, 2.79, 5.32], [2.66, 2.20, 5.20]]) {
      for (const x of [-halfWidth, halfWidth]) {
        this.add('secondaryStructure', 0.18, 2.54, 0.27, x, 3.97, z)
      }
      this.add('structure', halfWidth * 2 + 0.18, 0.20, 0.32, 0, lintelY, z)
      this.add('deck', halfWidth * 2, 0.09, 0.30, 0, 2.73, z)
    }
    for (const z of [3.14, 4.18, 5.22]) {
      this.add('secondaryStructure', 5.12, 0.18, 0.22, 0, 5.32, z)
    }
    const doorway = pavilionFacadePlane(this.add, 0, -0.10)
    addPavilionScreen(doorway, { x: 0, bottom: 2.78, width: 4.30, height: 2.39,
      leaves: 4, door: true })
    for (const x of [-2.23, 2.23]) {
      this.add('secondaryStructure', 0.20, 2.61, 0.34, x, 4.03, -0.06)
    }
    this.add('structure', 4.66, 0.22, 0.40, 0, 5.29, -0.06)
    this.add('deck', 4.66, 0.12, 0.40, 0, 2.72, -0.06)
  }

  private createUpperResidence(): void {
    const front = pavilionFacadePlane(this.add, 0, 0.10)
    for (const x of [-3.825, -1.275, 1.275, 3.825]) {
      addPavilionScreen(front, { x, bottom: 7.24, width: 2.23, height: 1.78,
        reveal: Math.abs(x) < 2 })
      this.add('secondaryStructure', 2.30, 0.12, 0.22, x, 7.17, 0.13)
    }
    for (const x of [-5.10, 5.10]) {
      this.add('structure', 0.32, 2.40, 0.32, x, 8.22, 0.17)
    }
    // Two short rails sit on the existing narrow ledge, leaving the centre open.
    for (const center of [-3.80, 3.80]) {
      for (const y of [7.35, 7.78]) this.add('secondaryStructure', 2.12, 0.08, 0.10, center, y, 0.60)
      for (const offset of [-1.0, 0, 1.0]) {
        this.add('structure', 0.10, 0.62, 0.12, center + offset, 7.50, 0.60)
      }
    }
  }
}

