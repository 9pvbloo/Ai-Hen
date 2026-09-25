import { BufferGeometry, Float32BufferAttribute } from 'three'

export interface PavilionRoofShape {
  readonly width: number
  readonly depth: number
  readonly rise: number
  readonly thickness: number
  readonly ridgeHalfWidth: number
  readonly cornerLift: number
  /** Localized slope relaxation; never bends the entire roof into a tent. */
  readonly eaveFlare?: number
  readonly eaveSag?: number
  readonly cornerStart?: number
  readonly xSegments?: number
  readonly zSegments?: number
}

function smoothstep(min: number, max: number, value: number): number {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return normalized * normalized * (3 - normalized * 2)
}

export function pavilionRoofHeight(shape: PavilionRoofShape, x: number, z: number): number {
  const nx = Math.abs(x) / (shape.width / 2)
  const nz = Math.abs(z) / (shape.depth / 2)
  const hip = Math.max(nz, Math.max(0, (nx - shape.ridgeHalfWidth) / (1 - shape.ridgeHalfWidth)))
  const slope = Math.min(1, hip)
  const base = shape.rise * (1 - slope)
  // Preserve the upper plane, then ease its pitch over the outer slope.
  // Both terms vanish at the ridge and the eave datum.
  const relaxation = (shape.eaveFlare ?? 0.36) * smoothstep(0.32, 0.80, slope) * (1 - slope)
  const start = shape.cornerStart ?? 0.58
  const sx = smoothstep(start, 1, nx)
  const sz = smoothstep(start, 1, nz)
  // A shallow trough ahead of the corner gives the edge a continuous sag/sweep/rise.
  const sag = (shape.eaveSag ?? 0.055) * (4 * sx * (1 - sx) * sz + 4 * sz * (1 - sz) * sx)
  return base - relaxation - sag + shape.cornerLift * sx * sz
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
  const indexAt = (layer: number, x: number, z: number) => layer * layerSize + z * columns + x

  for (const layer of [0, 1]) {
    const offset = layer === 0 ? 0 : -shape.thickness
    for (let z = 0; z <= zSegments; z++) for (let x = 0; x <= xSegments; x++) {
      const localX = -shape.width / 2 + shape.width * x / xSegments
      const localZ = -shape.depth / 2 + shape.depth * z / zSegments
      vertices.push(localX, pavilionRoofHeight(shape, localX, localZ) + offset, localZ)
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
    // Separate rim vertices preserve a hard edge between top, side and underside.
    const start = vertices.length / 3
    for (const index of [a, b, layerSize + a, layerSize + b]) {
      vertices.push(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2])
    }
    indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2)
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

/** Clockwise perimeter viewed from above, shared by fascia and soffit. */
export function pavilionRoofPerimeter(shape: PavilionRoofShape): [number, number][] {
  const xSegments = shape.xSegments ?? 16
  const zSegments = shape.zSegments ?? 10
  const points: [number, number][] = []
  for (let x = 0; x <= xSegments; x++) points.push([-shape.width / 2 + shape.width * x / xSegments, shape.depth / 2])
  for (let z = 1; z <= zSegments; z++) points.push([shape.width / 2, shape.depth / 2 - shape.depth * z / zSegments])
  for (let x = xSegments - 1; x >= 0; x--) points.push([-shape.width / 2 + shape.width * x / xSegments, -shape.depth / 2])
  for (let z = zSegments - 1; z >= 1; z--) points.push([-shape.width / 2, -shape.depth / 2 + shape.depth * z / zSegments])
  return points
}

/** Four joined strips close a projected timber fascia; no coplanar overlay on the shell. */
export function createPavilionRoofFasciaGeometry(shape: PavilionRoofShape, height = shape.thickness + 0.055): BufferGeometry {
  const points = pavilionRoofPerimeter(shape)
  const vertices: number[] = []
  const indices: number[] = []
  // Each strip owns normals at the cross-section crease; the perimeter stays smooth.
  const profile = [[0.045, 0.025], [0.045, -height], [-0.055, -height], [-0.055, 0.025]] as const
  for (let strip = 0; strip < profile.length; strip++) {
    const start = vertices.length / 3
    for (const [x, z] of points) {
      for (const [projection, y] of [profile[strip], profile[(strip + 1) % profile.length]]) {
        vertices.push(x * (1 + projection * 2 / shape.width), pavilionRoofHeight(shape, x, z) + y,
          z * (1 + projection * 2 / shape.depth))
      }
    }
    for (let point = 0; point < points.length; point++) {
      const a = start + point * 2
      const b = start + ((point + 1) % points.length) * 2
      indices.push(a, a + 1, b, a + 1, b + 1, b)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
