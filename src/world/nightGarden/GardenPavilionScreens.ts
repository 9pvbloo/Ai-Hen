import type { PavilionBoxWriter } from './GardenPavilionParts'

export interface PavilionScreen {
  readonly x: number
  readonly bottom: number
  readonly width: number
  readonly height: number
  readonly leaves?: 2 | 3 | 4
  /** A deliberate room opening in the last leaf, not transparent material. */
  readonly reveal?: boolean
  readonly door?: boolean
}

/** Opaque, layered joinery. All dimensions are local to a facade plane. */
export function addPavilionScreen(add: PavilionBoxWriter, screen: PavilionScreen): void {
  const { x, bottom, width, height, reveal = false, door = false, leaves = 2 } = screen
  const stile = door ? 0.12 : 0.085
  const y = bottom + height / 2
  const leafWidth = (width - stile) / leaves
  const finish = door ? 'structure' : 'secondaryStructure'
  // Backing is 0.34 m behind the frame, with a clear air gap behind the infill.
  add('opening', width, height, 0.06, x, y, -0.34)
  for (const u of [x - width / 2 + stile / 2, x + width / 2 - stile / 2]) {
    add(finish, stile, height, 0.24, u, y, 0)
  }
  for (const railY of [bottom + stile / 2, bottom + height - stile / 2]) {
    add(finish, width - stile * 2, stile, 0.24, x, railY, 0)
  }
  for (let leaf = 0; leaf < leaves; leaf++) {
    const u = x - width / 2 + stile / 2 + leafWidth * (leaf + 0.5)
    if (leaf > 0) add(finish, stile, height - stile * 2, 0.24,
      x - width / 2 + stile / 2 + leafWidth * leaf, y, 0)
    const infillWidth = leafWidth - stile
    // An offset closed leaf leaves one broad shadow reveal; no microscopic lattice.
    const aperture = reveal && leaf === leaves - 1 ? infillWidth * 0.36 : 0
    add('wall', infillWidth - aperture, height - stile * 2, 0.045,
      u - aperture / 2, y, -0.13)
    for (const fraction of door ? [0.29] : [0.28, 0.72]) {
      add(finish, infillWidth, 0.065, 0.22, u, bottom + height * fraction, 0)
    }
  }
}
