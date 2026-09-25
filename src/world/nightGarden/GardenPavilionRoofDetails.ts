import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { PavilionRoofShape } from './GardenPavilionRoof'
import { pavilionRoofHeight } from './GardenPavilionRoof'

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
    return [x, lift === 0 ? bottom : shape.rise + height * lift + (end ? 0.075 : 0), z]
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

