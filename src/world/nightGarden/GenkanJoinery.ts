import type { PavilionBoxWriter } from './GardenPavilionParts'
import { GENKAN as D } from './GenkanDimensions'

/** Fixed surround reproduces the original screen recipe; animated joinery stays separate. */
export function addGenkanSurround(add: PavilionBoxWriter): void {
  const y = D.bottom + D.height / 2
  for (const side of [-1, 1]) {
    const x = side * (D.width / 2 - D.stile / 2)
    // Preserve the approved front face, but leave a real rear pocket for the outer leaf.
    add('structure', D.stile, D.height, .02, x, y, .11)
    add('structure', .015, D.height, .24, side * (D.width / 2 - .0075), y, 0)
  }
  for (const [y, sign] of [[D.bottom + D.stile / 2, -1], [D.bottom + D.height - D.stile / 2, 1]]) {
    // The original front face stays at +.12. A grooved bed receives both leaf tracks.
    add('structure', D.width - D.stile * 2, D.stile, .02, 0, y, .11)
    add('structure', D.width - D.stile * 2, D.stile, .02, 0, y, -.48)
    add('structure', D.width - D.stile * 2, .02, .61, 0, y + sign * .05, -.185)
  }
}

/** Half-stiles meet without overlap at CLOSED, reproducing each old shared mullion. */
export function addGenkanLeaf(add: PavilionBoxWriter, leaf: number): void {
  const x = -D.width / 2 + D.stile / 2 + D.pitch * (leaf + .5)
  const y = D.bottom + D.height / 2, infill = D.pitch - D.stile
  add('wallEntry', infill, D.height - D.stile * 2, D.paperDepth, x, y, D.z + D.paperInset)
  add('structure', infill, .065, .22, x, D.bottom + D.height * .29, D.z)
  for (const side of [-1, 1]) {
    const outer = (leaf === 0 && side < 0) || (leaf === 3 && side > 0)
    // Outer half-stiles nest behind the static jamb, with distinct front/back planes.
    add('structure', D.stile / 2, D.height - D.stile * 2, outer ? .20 : .24,
      x + side * (D.pitch / 2 - D.stile / 4), y, D.z + (outer ? -.015 : 0))
  }
  // Concealed behind the original continuous rails when closed, carried with each leaf.
  // Both rails meet the stile ends while remaining inside the fixed guide pockets.
  add('structure', D.pitch, .10, .18, x, D.bottom + .07, D.z - .025)
  // The existing lintel begins at 5.13; keep the upper guide below that face.
  add('structure', D.pitch, .08, .18, x, D.bottom + D.height - .08, D.z - .025)
}
