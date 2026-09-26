import { BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Vector3 } from 'three'
import type { PavilionRoofShape } from './GardenPavilionRoof'
import { pavilionRoofHeight, pavilionRoofPerimeter } from './GardenPavilionRoof'

/** Sparse exposed rafter tails, constructed once and submitted in one instanced batch. */
export function createPavilionRafterMatrices(
  shape: PavilionRoofShape, depth: number, count: number, centerGap = 0,
): Matrix4[] {
  const matrices: Matrix4[] = []
  if (count < 2) return matrices
  const axis = new Vector3(0, 0, 1)
  for (let index = 0; index < count; index++) {
    const x = (index / (count - 1) - 0.5) * shape.width * 0.84
    if (Math.abs(x) < centerGap / 2) continue
    const outerZ = shape.depth / 2 - 0.10
    const innerZ = shape.depth / 2 - depth - 0.10
    const outer = new Vector3(x, pavilionRoofHeight(shape, x, outerZ) - shape.thickness - 0.15, outerZ)
    const inner = new Vector3(x, pavilionRoofHeight(shape, x, innerZ) - shape.thickness - 0.15, innerZ)
    const direction = outer.clone().sub(inner)
    const length = direction.length()
    const rotation = new Quaternion().setFromUnitVectors(axis, direction.normalize())
    matrices.push(new Matrix4().compose(inner.add(outer).multiplyScalar(0.5), rotation, new Vector3(0.14, 0.14, length)))
  }
  return matrices
}

/** A continuous four-sided dark underside, with a return into the shell. */
export function createPavilionSoffitGeometry(shape: PavilionRoofShape, depth: number): BufferGeometry {
  const points = pavilionRoofPerimeter(shape)
  const vertices: number[] = []
  const indices: number[] = []
  // Outer underside, inset underside, inset return. Fascia closes the outer edge.
  const sections = [[-0.035, -0.035], [depth, -0.10], [depth, 0.005]] as const
  for (let strip = 0; strip < sections.length - 1; strip++) {
    const start = vertices.length / 3
    for (const [x, z] of points) {
      for (const [inset, drop] of [sections[strip], sections[strip + 1]]) {
        const sx = x * (1 - inset * 2 / shape.width)
        const sz = z * (1 - inset * 2 / shape.depth)
        // Outside the shell, follow its actual edge instead of extrapolating the profile.
        const y = pavilionRoofHeight(shape, inset < 0 ? x : sx, inset < 0 ? z : sz)
        vertices.push(sx, y - shape.thickness + drop, sz)
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

/** A low, chamfered ridge with integral tapered ends, seated on the actual hip ridge. */
export function createPavilionRidgeGeometry(shape: PavilionRoofShape, height: number, width: number): BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfLength = shape.width * shape.ridgeHalfWidth / 2
  const endLength = Math.min(0.30, halfLength * 0.16)
  const stations = [-halfLength, -halfLength + endLength, 0, halfLength - endLength, halfLength]
  const section = [[-0.5, 0], [-0.5, 0.38], [-0.28, 0.85], [0, 1], [0.28, 0.85], [0.5, 0.38], [0.5, 0]]
  const point = (station: number, side: number): number[] => {
    const x = stations[station]
    const end = station === 0 || station === stations.length - 1
    const [zFraction, lift] = section[side]
    const z = zFraction * width * (end ? 0.78 : 1)
    // The underside follows the shell rather than floating over the hip ends.
    const bottom = pavilionRoofHeight(shape, x, z) - 0.035
    return [x, lift === 0 ? bottom : shape.rise + height * lift + (end ? height * 0.25 : 0), z]
  }
  // Cross-section creases stay crisp; each longitudinal face owns its normals.
  for (let side = 0; side < section.length; side++) {
    const nextSide = (side + 1) % section.length
    const start = vertices.length / 3
    for (let station = 0; station < stations.length; station++) {
      vertices.push(...point(station, side), ...point(station, nextSide))
    }
    for (let station = 0; station < stations.length - 1; station++) {
      const a = start + station * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  for (const station of [0, stations.length - 1]) {
    const start = vertices.length / 3
    for (let side = 0; side < section.length; side++) vertices.push(...point(station, side))
    for (let side = 1; side < section.length - 1; side++) {
      if (station === 0) indices.push(start, start + side + 1, start + side)
      else indices.push(start, start + side, start + side + 1)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
