/** Box recipes have no GPU ownership; Architecture batches and disposes them. */
export type PavilionFinish = 'foundation' | 'deck' | 'structure' | 'secondaryStructure' |
  'wall' | 'wallWarm' | 'wallDim' | 'wallEntry' | 'opening' | 'soffit' | 'roofEdge'

export type PavilionBoxWriter = (finish: PavilionFinish, width: number, height: number,
  depth: number, x: number, y: number, z: number) => void

/** Local u runs along a facade; v points outward. Quarter turns keep positive scales. */
export function pavilionFacadePlane(add: PavilionBoxWriter, x: number, z: number,
  facing: 'front' | 'rear' | 'west' | 'east' = 'front'): PavilionBoxWriter {
  return (finish, width, height, depth, u, y, v) => {
    if (facing === 'front') add(finish, width, height, depth, x + u, y, z + v)
    else if (facing === 'rear') add(finish, width, height, depth, x - u, y, z - v)
    else if (facing === 'west') add(finish, depth, height, width, x - v, y, z + u)
    else add(finish, depth, height, width, x + v, y, z - u)
  }
}
