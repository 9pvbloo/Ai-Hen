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

/** Size-aware even grids include the ridge centre and its exact hip junctions. */
export function pavilionRoofGrid(shape: PavilionRoofShape): { x: number[]; z: number[] } {
  const xCount = shape.xSegments ?? (shape.width >= 16 ? 24 : shape.width >= 12 ? 20 : shape.width >= 8 ? 16 : 12)
  const zCount = shape.zSegments ?? (shape.depth >= 10 ? 14 : shape.depth >= 8 ? 12 : 8)
  const xSegments = Math.max(4, Math.round(xCount / 2) * 2)
  const zSegments = Math.max(4, Math.round(zCount / 2) * 2)
  const halfSegments = xSegments / 2
  const ridgeSegments = Math.max(1, Math.min(halfSegments - 1, Math.round(halfSegments * shape.ridgeHalfWidth)))
  const positiveX = Array.from({ length: halfSegments + 1 }, (_, index) => shape.width / 2 *
    (index <= ridgeSegments ? shape.ridgeHalfWidth * index / ridgeSegments
      : shape.ridgeHalfWidth + (1 - shape.ridgeHalfWidth) * (index - ridgeSegments) / (halfSegments - ridgeSegments)))
  return {
    x: [...positiveX.slice(1).reverse().map(value => -value), ...positiveX],
    z: Array.from({ length: zSegments + 1 }, (_, index) => -shape.depth / 2 + shape.depth * index / zSegments),
  }
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
  const grid = pavilionRoofGrid(shape)
  const vertices: number[] = []
  const indices: number[] = []
  const vertexByPoint = new Map<string, number>()
  type Point = readonly [number, number]
  const vertex = ([x, z]: Point): number => {
    const key = `${x.toFixed(8)},${z.toFixed(8)}`
    const existing = vertexByPoint.get(key)
    if (existing !== undefined) return existing
    const index = vertices.length / 3
    vertices.push(x, pavilionRoofHeight(shape, x, z), z)
    vertexByPoint.set(key, index)
    return index
  }
  const clip = (polygon: Point[], signedDistance: (point: Point) => number): Point[] => {
    const result: Point[] = []
    for (let index = 0; index < polygon.length; index++) {
      const a = polygon[index]; const b = polygon[(index + 1) % polygon.length]
      const da = signedDistance(a); const db = signedDistance(b)
      if (da >= -1e-9) result.push(a)
      if ((da < -1e-9 && db > 1e-9) || (da > 1e-9 && db < -1e-9)) {
        const t = da / (da - db)
        result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      }
    }
    return result
  }
  const ridgeEnd = shape.width * shape.ridgeHalfWidth / 2
  const hipWidth = shape.width / 2 - ridgeEnd
  const boundary = (z: number) => ridgeEnd + hipWidth * Math.abs(z) / (shape.depth / 2)
  const left = ([x, z]: Point) => x + boundary(z)
  const right = ([x, z]: Point) => boundary(z) - x
  // Split each cell at the real hip junction before triangulation. A regular grid
  // alone bridges that crease and creates stair-step silhouettes at grazing angles.
  for (let iz = 0; iz < grid.z.length - 1; iz++) for (let ix = 0; ix < grid.x.length - 1; ix++) {
    const cell: Point[] = [[grid.x[ix], grid.z[iz]], [grid.x[ix], grid.z[iz + 1]],
      [grid.x[ix + 1], grid.z[iz + 1]], [grid.x[ix + 1], grid.z[iz]]]
    for (const polygon of [clip(clip(cell, left), right), clip(cell, point => -left(point)), clip(cell, point => -right(point))]) {
      const ids = [...new Set(polygon.map(vertex))]
      for (let index = 1; index < ids.length - 1; index++) indices.push(ids[0], ids[index], ids[index + 1])
    }
  }
  const layerSize = vertices.length / 3
  const topIndices = [...indices]
  for (let index = 0; index < layerSize; index++) {
    vertices.push(vertices[index * 3], vertices[index * 3 + 1] - shape.thickness, vertices[index * 3 + 2])
  }
  for (let index = 0; index < topIndices.length; index += 3) {
    indices.push(topIndices[index] + layerSize, topIndices[index + 2] + layerSize, topIndices[index + 1] + layerSize)
  }
  const perimeter = pavilionRoofPerimeter(shape)
  perimeter.forEach(([x, z], index) => {
    const [nx, nz] = perimeter[(index + 1) % perimeter.length]
    const y = pavilionRoofHeight(shape, x, z); const ny = pavilionRoofHeight(shape, nx, nz)
    const start = vertices.length / 3
    // Independent rim normals preserve the shell's top/side/underside creases.
    vertices.push(x, y, z, x, y - shape.thickness, z, nx, ny, nz, nx, ny - shape.thickness, nz)
    indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2)
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Clockwise perimeter viewed from above, shared by fascia and soffit. */
export function pavilionRoofPerimeter(shape: PavilionRoofShape): [number, number][] {
  const grid = pavilionRoofGrid(shape)
  const xSegments = grid.x.length - 1
  const zSegments = grid.z.length - 1
  const points: [number, number][] = []
  for (let x = 0; x <= xSegments; x++) points.push([grid.x[x], shape.depth / 2])
  for (let z = 1; z <= zSegments; z++) points.push([shape.width / 2, grid.z[zSegments - z]])
  for (let x = xSegments - 1; x >= 0; x--) points.push([grid.x[x], -shape.depth / 2])
  for (let z = 1; z < zSegments; z++) points.push([-shape.width / 2, grid.z[z]])
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
