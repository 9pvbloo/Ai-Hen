import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'

type Point = readonly [number, number, number]
type Builder = { positions: number[]; colors: number[]; uvs: number[]; indices: number[]; detail: number }
type Crown = readonly [x: number, y: number, z: number, rx: number, ry: number, rz: number]
const UP = new Vector3(0, 1, 0)
function builder(detail = 1): Builder { return { positions: [], colors: [], uvs: [], indices: [], detail } }
function random(seed: number): () => number {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
}
function finish(data: Builder): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(data.positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(data.colors, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(data.uvs, 2))
  geometry.setIndex(data.indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Tapered curved wood, with a flared foot and longitudinal bark ridges. */
function wood(data: Builder, points: readonly Point[], radius: number, tip: number): void {
  const curve = new CatmullRomCurve3(points.map(p => new Vector3(...p)))
  const rings = Math.max(4, Math.round(12 * data.detail)), sides = Math.max(5, Math.round(10 * data.detail)), start = data.positions.length / 3
  const center = new Vector3(), tangent = new Vector3(), side = new Vector3(), other = new Vector3()
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings
    curve.getPoint(t, center); curve.getTangent(t, tangent)
    side.crossVectors(tangent, Math.abs(tangent.y) > 0.96 ? new Vector3(1, 0, 0) : UP).normalize()
    other.crossVectors(tangent, side).normalize()
    const r = tip + (radius - tip) * Math.pow(1 - t, 0.85)
    for (let i = 0; i <= sides; i++) {
      const angle = i / sides * Math.PI * 2
      const ridge = 1 + Math.sin(angle * 5 + t * 2) * 0.08
      const vertex = center.clone().addScaledVector(side, Math.cos(angle) * r * ridge).addScaledVector(other, Math.sin(angle) * r * ridge)
      data.positions.push(vertex.x, vertex.y, vertex.z)
      const tone = 0.7 + Math.sin(angle * 5 + 0.5) * 0.08 + t * 0.16
      data.colors.push(tone, tone * 0.96, tone * 0.87); data.uvs.push(i / sides, t * 3)
      if (ring < rings && i < sides) {
        const a = start + ring * (sides + 1) + i, b = a + sides + 1
        data.indices.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
  }
}

/** Needle sprays inhabit flattened crowns, leaving real gaps between the branches. */
function crown(data: Builder, shape: Crown, seed: number, count: number): void {
  const [x, y, z, rx, ry, rz] = shape, rand = random(seed)
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, radius = Math.sqrt(rand())
    const edge = 1 + Math.sin(a * 3 + seed) * 0.13 + Math.cos(a * 5) * 0.07
    const px = x + Math.cos(a) * rx * radius * edge
    const pz = z + Math.sin(a) * rz * radius * edge
    const py = y + (rand() - 0.34) * ry * Math.sqrt(1 - radius * radius) + Math.sin(a * 2) * 0.045
    const yaw = rand() * Math.PI * 2, pitch = 0.32 + rand() * 1.0
    const width = 0.17 + rand() * 0.10, height = width * (0.8 + rand() * 0.4)
    const right = new Vector3(Math.cos(yaw), 0, Math.sin(yaw)).multiplyScalar(width)
    const up = new Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(height)
    const start = data.positions.length / 3
    const tone = 0.49 + rand() * 0.23 + radius * 0.26 + Math.max(0, py - y) * 0.18
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      data.positions.push(px + right.x * (u - 0.5) + up.x * (v - 0.5), py + up.y * (v - 0.5), pz + right.z * (u - 0.5) + up.z * (v - 0.5))
      data.colors.push(tone * 0.88, tone * 0.95, tone); data.uvs.push(u, v)
    }
    data.indices.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }
}

export function createPineGeometry(variant: number, detail = 1): { wood: BufferGeometry; foliage: BufferGeometry } {
  const timber = builder(detail), needles = builder(detail)
  const sweep = variant === 0 ? 1 : -0.72
  const leader: Point[] = [[0, 0, 0], [-0.18 * sweep, 0.65, 0.08], [0.13 * sweep, 1.45, -0.02],
    [0.5 * sweep, 2.24, -0.13], [0.36 * sweep, 3.04, -0.26], [0.62 * sweep, 3.73, -0.19]]
  wood(timber, leader, 0.24, 0.025)
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + 0.3
    wood(timber, [[Math.cos(a) * 0.48, 0.01, Math.sin(a) * 0.35], [Math.cos(a) * 0.2, 0.14, Math.sin(a) * 0.18], leader[1]], 0.035, 0.06)
  }
  const crowns: Crown[] = [
    [-1.27 * sweep, 1.45, 0.28, 1.05, 0.52, 0.69], [1.3 * sweep, 2.04, 0.17, 1.04, 0.55, 0.70],
    [-0.64 * sweep, 2.65, -0.4, 0.92, 0.5, 0.64], [0.83 * sweep, 3.14, 0.18, 0.86, 0.48, 0.62],
    [0.49 * sweep, 3.72, -0.21, 0.82, 0.55, 0.62], [0.28 * sweep, 2.26, -0.94, 0.66, 0.42, 0.56],
  ]
  crowns.forEach((pad, i) => {
    const [x, y, z] = pad
    const start = leader[Math.min(4, Math.max(1, i))]
    const joint: Point = [(start[0] + x) * 0.5, y - 0.3, z * 0.55]
    wood(timber, [start, joint, [x, y - 0.06, z]], 0.09 - i * 0.008, 0.012)
    for (let j = 0; j < (detail < 0.4 ? 1 : 3); j++) {
      const dx = (j - 1) * pad[3] * 0.65, dz = (j % 2 ? -1 : 1) * pad[5] * 0.6
      wood(timber, [joint, [x + dx * 0.6, y - 0.13, z + dz * 0.5], [x + dx, y, z + dz]], 0.026, 0.006)
    }
    crown(needles, pad, 37 + i * 71 + variant * 503, Math.round(420 * detail))
  })
  return { wood: finish(timber), foliage: finish(needles) }
}

export function createPrunedShrubGeometry(detail = 1): BufferGeometry {
  const foliage = builder(detail)
  crown(foliage, [-0.35, 0.22, 0.1, 0.63, 0.4, 0.52], 937, Math.round(220 * detail))
  crown(foliage, [0.3, 0.34, -0.12, 0.73, 0.48, 0.56], 487, Math.round(270 * detail))
  crown(foliage, [0.06, 0.26, 0.36, 0.5, 0.35, 0.43], 825, Math.round(180 * detail))
  return finish(foliage)
}
