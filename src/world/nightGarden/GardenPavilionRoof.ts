import { BufferGeometry, Float32BufferAttribute } from 'three'

export interface PavilionRoofShape {
  readonly width: number
  readonly depth: number
  readonly rise: number
  readonly thickness: number
  readonly ridgeHalfWidth: number
  readonly cornerLift: number
  readonly xSegments?: number
  readonly zSegments?: number
}

function smoothstep(min: number, max: number, value: number): number {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return normalized * normalized * (3 - normalized * 2)
}

/**
 * A closed, procedural hip-roof shell. The long ridge remains calm while a
 * separately controlled outer-corner term can later lift only the eaves.
 */
export function createPavilionRoofGeometry(shape: PavilionRoofShape): BufferGeometry {
  const xSegments = shape.xSegments ?? 16
  const zSegments = shape.zSegments ?? 10
  const columns = xSegments + 1
  const layerSize = columns * (zSegments + 1)
  const vertices: number[] = []
  const indices: number[] = []
  const roofHeight = (x: number, z: number) => {
    const nx = Math.abs(x) / (shape.width / 2)
    const nz = Math.abs(z) / (shape.depth / 2)
    const hip = Math.max(nz, Math.max(0, (nx - shape.ridgeHalfWidth) / (1 - shape.ridgeHalfWidth)))
    const base = shape.rise * (1 - Math.min(1, hip))
    const outerCorner = smoothstep(0.68, 1, nx) * smoothstep(0.68, 1, nz)
    return base + shape.cornerLift * outerCorner
  }
  const indexAt = (layer: number, x: number, z: number) => layer * layerSize + z * columns + x

  for (const layer of [0, 1]) {
    const offset = layer === 0 ? 0 : -shape.thickness
    for (let z = 0; z <= zSegments; z++) for (let x = 0; x <= xSegments; x++) {
      const localX = -shape.width / 2 + shape.width * x / xSegments
      const localZ = -shape.depth / 2 + shape.depth * z / zSegments
      vertices.push(localX, roofHeight(localX, localZ) + offset, localZ)
    }
  }
  for (let z = 0; z < zSegments; z++) for (let x = 0; x < xSegments; x++) {
    const a = indexAt(0, x, z); const b = indexAt(0, x + 1, z)
    const c = indexAt(0, x, z + 1); const d = indexAt(0, x + 1, z + 1)
    indices.push(a, c, b, b, c, d)
    const underside = layerSize
    indices.push(underside + a, underside + b, underside + c, underside + b, underside + d, underside + c)
  }
  const closeEdge = (a: number, b: number) => {
    indices.push(a, layerSize + a, b, b, layerSize + a, layerSize + b)
  }
  for (let x = 0; x < xSegments; x++) {
    closeEdge(indexAt(0, x, 0), indexAt(0, x + 1, 0))
    closeEdge(indexAt(0, x + 1, zSegments), indexAt(0, x, zSegments))
  }
  for (let z = 0; z < zSegments; z++) {
    closeEdge(indexAt(0, 0, z + 1), indexAt(0, 0, z))
    closeEdge(indexAt(0, xSegments, z), indexAt(0, xSegments, z + 1))
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
