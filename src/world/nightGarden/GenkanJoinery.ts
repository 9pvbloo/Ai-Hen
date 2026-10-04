import type { PavilionBoxWriter } from './GardenPavilionParts'
import { GENKAN as D } from './GenkanDimensions'

/** Fixed surround reproduces the original screen recipe; animated joinery stays separate. */
export function addGenkanSurround(add: PavilionBoxWriter): void {
  const y = D.bottom + D.height / 2
  add('opening', D.width, D.height, .06, 0, y, -.34)
  for (const x of [-D.width / 2 + D.stile / 2, D.width / 2 - D.stile / 2])
    add('structure', D.stile, D.height, .24, x, y, 0)
  for (const y of [D.bottom + D.stile / 2, D.bottom + D.height - D.stile / 2])
    add('structure', D.width - D.stile * 2, D.stile, .24, 0, y, 0)
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
  for (const y of [D.bottom + D.stile / 2, D.bottom + D.height - D.stile / 2])
    add('structure', D.pitch, .08, .18, x, y, D.z - .025)
}
