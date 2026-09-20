import {
  BoxGeometry, BufferGeometry, Euler, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  Quaternion, Vector3,
} from 'three'
import type { Group as ThreeGroup } from 'three'

type PavilionMaterial = MeshStandardMaterial
type BoxPart = { size: readonly [number, number, number], position: readonly [number, number, number] }

/** Plan-first structural datum for the Night Garden residence. */
export class GardenPavilion {
  private readonly root = new Group()
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly materials: PavilionMaterial[] = []
  private readonly geometries: BufferGeometry[] = []
  private readonly foundationParts: BoxPart[] = []
  private readonly timberParts: BoxPart[] = []
  private readonly trimParts: BoxPart[] = []
  private readonly paperParts: BoxPart[] = []
  private readonly coreParts: BoxPart[] = []
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly euler = new Euler()
  private paper!: PavilionMaterial

  // Architectural grid: the lower residence is four bays wide by three bays deep.
  private static readonly BAY_X = 1.34
  private static readonly BAY_Z = 1.28
  private static readonly LOWER_COLS = 4
  private static readonly LOWER_ROWS = 3
  private static readonly LOWER_HEIGHT = 2.92
  private static readonly UPPER_COLS = 3
  private static readonly UPPER_ROWS = 2
  private static readonly UPPER_HEIGHT = 2.02
  private static readonly FOUNDATION_HEIGHT = 0.34
  private static readonly ENGAWA_DEPTH = 1.16
  private static readonly ROOF_OVERHANG = 0.82
  private static readonly FLOOR_Y = 2.35
  private static readonly ARCHITECTURE = {
    upperCols: GardenPavilion.UPPER_COLS, upperRows: GardenPavilion.UPPER_ROWS,
    upperHeight: GardenPavilion.UPPER_HEIGHT, roofOverhang: GardenPavilion.ROOF_OVERHANG,
  }

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-pavilion-residence'
    this.root.position.set(5.15, -5.6, -31.2)
    this.root.rotation.y = -0.035
    this.root.scale.setScalar(1)
    parent.add(this.root)

    this.createFoundationGrid()
    this.createLowerStructuralDatum()
    this.createLowerResidence()
    this.createUpperResidence()
    const roof = this.material('#18242a', 0.82)
    this.createRoof(this.lowerWidth + GardenPavilion.ROOF_OVERHANG * 2, this.lowerDepth + GardenPavilion.ENGAWA_DEPTH + GardenPavilion.ROOF_OVERHANG * 2, 1.32, GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + 0.18, GardenPavilion.ENGAWA_DEPTH * 0.28, roof, 'pavilion-lower-roof')
    this.createRoof(GardenPavilion.ARCHITECTURE.upperCols * GardenPavilion.BAY_X * 0.86 + GardenPavilion.ROOF_OVERHANG * 1.6, GardenPavilion.ARCHITECTURE.upperRows * GardenPavilion.BAY_Z * 0.8 + GardenPavilion.ROOF_OVERHANG * 1.6, 0.9, GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + GardenPavilion.ARCHITECTURE.upperHeight + 0.5, -0.34, roof, 'pavilion-upper-roof')

    this.flushBoxes(this.foundationParts, this.material('#182426', 0.9), 'pavilion-foundation')
    this.flushBoxes(this.timberParts, this.material('#263638', 0.76), 'pavilion-timber')
    this.flushBoxes(this.trimParts, this.material('#53635f', 0.7), 'pavilion-trim')
    this.flushBoxes(this.coreParts, this.material('#101718', 0.95), 'pavilion-interior-core')
    this.paper = this.material('#c8ceca', 0.84)
    this.paper.emissive.set('#303634')
    this.flushBoxes(this.paperParts, this.paper, 'pavilion-shoji')
  }

  setIntensity(value: number): void { this.paper.emissiveIntensity = 0.035 * value }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.boxGeometry.dispose()
    this.geometries.forEach(geometry => geometry.dispose())
    this.materials.forEach(material => material.dispose())
  }

  private get lowerWidth(): number { return GardenPavilion.BAY_X * GardenPavilion.LOWER_COLS }
  private get lowerDepth(): number { return GardenPavilion.BAY_Z * GardenPavilion.LOWER_ROWS }
  private gridX(column: number): number { return (column - GardenPavilion.LOWER_COLS / 2) * GardenPavilion.BAY_X }
  private gridZ(row: number): number { return (row - GardenPavilion.LOWER_ROWS / 2) * GardenPavilion.BAY_Z }

  private createFoundationGrid(): void {
    const { FOUNDATION_HEIGHT, FLOOR_Y, ENGAWA_DEPTH } = GardenPavilion
    const depth = this.lowerDepth + ENGAWA_DEPTH
    this.foundationBox(this.lowerWidth + 0.54, FOUNDATION_HEIGHT, depth + 0.48, 0, FLOOR_Y - 0.34, ENGAWA_DEPTH / 2)
    this.foundationBox(this.lowerWidth + 0.22, 0.14, depth + 0.14, 0, FLOOR_Y - 0.1, ENGAWA_DEPTH / 2)
    this.timberBox(this.lowerWidth + 0.18, 0.14, depth + 0.12, 0, FLOOR_Y + 0.03, ENGAWA_DEPTH / 2)
    for (let column = 0; column <= GardenPavilion.LOWER_COLS; column++) {
      for (const row of [0, GardenPavilion.LOWER_ROWS]) this.foundationBox(0.32, 0.3, 0.36, this.gridX(column), FLOOR_Y - 0.47, this.gridZ(row))
      this.foundationBox(0.32, 0.3, 0.36, this.gridX(column), FLOOR_Y - 0.47, this.gridZ(GardenPavilion.LOWER_ROWS) + ENGAWA_DEPTH)
    }
  }

  private createLowerStructuralDatum(): void {
    const { FLOOR_Y, LOWER_HEIGHT } = GardenPavilion
    for (let column = 0; column <= GardenPavilion.LOWER_COLS; column++) {
      for (let row = 0; row <= GardenPavilion.LOWER_ROWS; row++) {
        if (column === 0 || column === GardenPavilion.LOWER_COLS || row === 0 || row === GardenPavilion.LOWER_ROWS) this.addPost(this.gridX(column), FLOOR_Y + LOWER_HEIGHT / 2, this.gridZ(row), LOWER_HEIGHT)
      }
    }
    this.addBeamX(this.lowerWidth + 0.22, FLOOR_Y + LOWER_HEIGHT, this.gridZ(0))
    this.addBeamX(this.lowerWidth + 0.22, FLOOR_Y + LOWER_HEIGHT, this.gridZ(GardenPavilion.LOWER_ROWS))
    this.addBeamZ(this.lowerDepth + 0.22, FLOOR_Y + LOWER_HEIGHT, this.gridX(0))
    this.addBeamZ(this.lowerDepth + 0.22, FLOOR_Y + LOWER_HEIGHT, this.gridX(GardenPavilion.LOWER_COLS))
  }

  private createLowerResidence(): void {
    const { FLOOR_Y, LOWER_HEIGHT, ENGAWA_DEPTH } = GardenPavilion
    const front = this.gridZ(GardenPavilion.LOWER_ROWS)
    const rear = this.gridZ(0)
    const left = this.gridX(0)
    const right = this.gridX(GardenPavilion.LOWER_COLS)
    const screenY = FLOOR_Y + LOWER_HEIGHT * 0.49

    // The dark inner block ensures every screen reveals a genuinely deep residence.
    this.coreBox(this.lowerWidth - 0.5, LOWER_HEIGHT - 0.42, this.lowerDepth - 0.48, 0, screenY, (front + rear) / 2 - 0.1)
    this.createEngawa(front, FLOOR_Y, ENGAWA_DEPTH)

    // Perimeter sill and mid rails align to the same bay rhythm as the posts.
    this.addBeamX(this.lowerWidth + 0.12, FLOOR_Y + 0.15, front)
    this.addBeamX(this.lowerWidth + 0.12, FLOOR_Y + 0.15, rear)
    this.addBeamZ(this.lowerDepth + 0.12, FLOOR_Y + 0.15, left)
    this.addBeamZ(this.lowerDepth + 0.12, FLOOR_Y + 0.15, right)
    for (let column = 1; column < GardenPavilion.LOWER_COLS; column++) {
      this.addPost(this.gridX(column), screenY, front, LOWER_HEIGHT)
      this.addPost(this.gridX(column), screenY, rear, LOWER_HEIGHT)
    }
    for (let row = 1; row < GardenPavilion.LOWER_ROWS; row++) {
      this.addPost(left, screenY, this.gridZ(row), LOWER_HEIGHT)
      this.addPost(right, screenY, this.gridZ(row), LOWER_HEIGHT)
    }

    // The entry occupies the first front bay; all remaining bays receive recessed residential screens.
    this.createEntrance((this.gridX(0) + this.gridX(1)) / 2, FLOOR_Y, front)
    for (let column = 1; column < GardenPavilion.LOWER_COLS; column++) this.addShojiBay((this.gridX(column) + this.gridX(column + 1)) / 2, screenY, front - 0.13, GardenPavilion.BAY_X - 0.26, LOWER_HEIGHT - 0.52, false)
    for (let column = 0; column < GardenPavilion.LOWER_COLS; column++) this.addShojiBay((this.gridX(column) + this.gridX(column + 1)) / 2, screenY, rear + 0.13, GardenPavilion.BAY_X - 0.26, LOWER_HEIGHT - 0.52, false)
    for (let row = 0; row < GardenPavilion.LOWER_ROWS; row++) {
      this.addShojiBay((this.gridZ(row) + this.gridZ(row + 1)) / 2, screenY, left + 0.13, GardenPavilion.BAY_Z - 0.26, LOWER_HEIGHT - 0.52, true)
      this.addShojiBay((this.gridZ(row) + this.gridZ(row + 1)) / 2, screenY, right - 0.13, GardenPavilion.BAY_Z - 0.26, LOWER_HEIGHT - 0.52, true)
    }
  }

  private createUpperResidence(): void {
    const { upperCols, upperRows, upperHeight } = GardenPavilion.ARCHITECTURE
    const upperBayX = GardenPavilion.BAY_X * 0.86
    const upperBayZ = GardenPavilion.BAY_Z * 0.8
    const width = upperCols * upperBayX
    const depth = upperRows * upperBayZ
    const floorY = GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + 0.24
    const centerZ = -0.34
    const xAt = (column: number) => (column - upperCols / 2) * upperBayX
    const zAt = (row: number) => centerZ + (row - upperRows / 2) * upperBayZ
    const screenY = floorY + upperHeight * 0.5

    this.timberBox(width + 0.15, 0.15, depth + 0.15, 0, floorY, centerZ)
    this.coreBox(width - 0.28, upperHeight - 0.28, depth - 0.26, 0, screenY, centerZ)
    for (let column = 0; column <= upperCols; column++) {
      for (let row = 0; row <= upperRows; row++) {
        if (column === 0 || column === upperCols || row === 0 || row === upperRows) this.addPost(xAt(column), screenY, zAt(row), upperHeight)
      }
    }
    this.addBeamX(width + 0.16, floorY + upperHeight, zAt(0))
    this.addBeamX(width + 0.16, floorY + upperHeight, zAt(upperRows))
    this.addBeamZ(depth + 0.16, floorY + upperHeight, xAt(0))
    this.addBeamZ(depth + 0.16, floorY + upperHeight, xAt(upperCols))
    for (let column = 0; column < upperCols; column++) {
      const x = (xAt(column) + xAt(column + 1)) / 2
      this.addShojiBay(x, screenY, zAt(upperRows) - 0.12, upperBayX - 0.24, upperHeight - 0.4, false)
      this.addShojiBay(x, screenY, zAt(0) + 0.12, upperBayX - 0.24, upperHeight - 0.4, false)
    }
    for (let row = 0; row < upperRows; row++) {
      const z = (zAt(row) + zAt(row + 1)) / 2
      this.addShojiBay(z, screenY, xAt(0) + 0.12, upperBayZ - 0.24, upperHeight - 0.4, true)
      this.addShojiBay(z, screenY, xAt(upperCols) - 0.12, upperBayZ - 0.24, upperHeight - 0.4, true)
    }
  }

  private createRoof(width: number, depth: number, rise: number, eaveY: number, z: number, material: PavilionMaterial, name: string): void {
    const geometry = this.createSampledRoofGeometry(width, depth, rise, 12, 10)
    this.geometries.push(geometry)
    const roof = new Mesh(geometry, material)
    roof.name = name
    roof.position.set(0, eaveY, z)
    this.root.add(roof)
    this.trimBox(width, 0.12, 0.11, 0, eaveY + 0.02, z + depth / 2)
    this.trimBox(width, 0.12, 0.11, 0, eaveY + 0.02, z - depth / 2)
    this.trimBox(0.11, 0.12, depth - 0.22, -width / 2, eaveY + 0.02, z)
    this.trimBox(0.11, 0.12, depth - 0.22, width / 2, eaveY + 0.02, z)
    // Shadowed, structurally aligned soffit members keep the broad eaves grounded.
    for (let x = -width / 2 + 0.42; x < width / 2; x += 0.68) {
      this.trimBox(0.055, 0.07, 0.42, x, eaveY - 0.12, z + depth / 2 - 0.28)
      this.trimBox(0.055, 0.07, 0.42, x, eaveY - 0.12, z - depth / 2 + 0.28)
    }
  }

  /** Dense height-field roof: shells, fascia, and a short calm ridge share one silhouette. */
  private createSampledRoofGeometry(width: number, depth: number, rise: number, xSegments: number, zSegments: number): BufferGeometry {
    const vertices: number[] = []
    const indices: number[] = []
    const roofY = (x: number, z: number) => {
      const nx = Math.abs(x) / (width / 2); const nz = Math.abs(z) / (depth / 2)
      const shoulder = Math.max(nx, nz * 0.92)
      const eased = 1 - Math.min(1, shoulder) ** 1.22
      const ridge = Math.max(0, 1 - Math.abs(x) / (width * 0.22)) * 0.08
      const edgeLift = Math.max(0, (nx + nz - 1.68) * 0.06)
      return rise * eased + ridge + edgeLift
    }
    for (const underside of [false, true]) {
      const offset = underside ? -0.13 : 0
      const base = vertices.length / 3
      for (let iz = 0; iz <= zSegments; iz++) for (let ix = 0; ix <= xSegments; ix++) {
        const x = -width / 2 + width * ix / xSegments; const z = -depth / 2 + depth * iz / zSegments
        vertices.push(x, roofY(x, z) + offset, z)
      }
      for (let iz = 0; iz < zSegments; iz++) for (let ix = 0; ix < xSegments; ix++) {
        const a = base + iz * (xSegments + 1) + ix; const b = a + 1; const c = a + xSegments + 1; const d = c + 1
        indices.push(underside ? a : a, underside ? c : b, underside ? b : c, underside ? b : b, underside ? c : d, underside ? d : c)
      }
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals()
    return geometry
  }

  private createEngawa(front: number, floorY: number, depth: number): void {
    const centerZ = front + depth / 2
    this.timberBox(this.lowerWidth + 0.36, 0.16, depth, 0, floorY + 0.1, centerZ)
    this.trimBox(this.lowerWidth + 0.38, 0.13, 0.14, 0, floorY + 0.22, front + depth)
    for (let column = 0; column <= GardenPavilion.LOWER_COLS; column++) {
      this.trimBox(0.07, 0.08, depth - 0.1, this.gridX(column), floorY + 0.21, centerZ)
      this.addPost(this.gridX(column), floorY - 0.16, front + depth, 0.5)
    }
  }

  private createEntrance(x: number, floorY: number, front: number): void {
    const width = GardenPavilion.BAY_X - 0.34
    const depth = 0.74
    const y = floorY + GardenPavilion.LOWER_HEIGHT * 0.49
    this.timberBox(width, 0.13, depth, x, floorY + 0.12, front - depth / 2)
    this.trimBox(0.15, GardenPavilion.LOWER_HEIGHT - 0.5, depth, x - width / 2, y, front - depth / 2)
    this.trimBox(0.15, GardenPavilion.LOWER_HEIGHT - 0.5, depth, x + width / 2, y, front - depth / 2)
    this.trimBox(width, 0.16, depth, x, floorY + GardenPavilion.LOWER_HEIGHT - 0.32, front - depth / 2)
    this.trimBox(width - 0.18, 0.12, 0.12, x, floorY + 0.16, front - depth + 0.12)
    this.paperBox(width - 0.3, GardenPavilion.LOWER_HEIGHT - 0.72, 0.06, x, y, front - depth + 0.16)
    this.trimBox(0.06, GardenPavilion.LOWER_HEIGHT - 0.76, 0.08, x, y, front - depth + 0.2)
  }

  private addShojiBay(axis: number, y: number, edge: number, width: number, height: number, side: boolean): void {
    if (side) {
      this.paperBox(0.055, height, width, edge, y, axis)
      this.trimBox(0.08, height, 0.08, edge, y, axis - width / 2)
      this.trimBox(0.08, height, 0.08, edge, y, axis + width / 2)
      this.trimBox(0.08, 0.06, width - 0.1, edge, y + height * 0.18, axis)
      this.trimBox(0.08, 0.06, width - 0.1, edge, y - height * 0.18, axis)
    } else {
      this.paperBox(width, height, 0.055, axis, y, edge)
      this.trimBox(width + 0.08, 0.07, 0.08, axis, y + height / 2, edge)
      this.trimBox(width + 0.08, 0.07, 0.08, axis, y - height / 2, edge)
      this.trimBox(0.065, height - 0.1, 0.08, axis, y, edge)
      this.trimBox(width - 0.1, 0.06, 0.08, axis, y + height * 0.18, edge)
      this.trimBox(width - 0.1, 0.06, 0.08, axis, y - height * 0.18, edge)
    }
  }

  private addPost(x: number, y: number, z: number, height: number): void {
    this.timberBox(0.19, height, 0.19, x, y, z)
    this.trimBox(0.27, 0.09, 0.27, x, y - height / 2 + 0.045, z)
  }
  private addBeamX(width: number, y: number, z: number): void { this.timberBox(width, 0.2, 0.22, 0, y, z) }
  private addBeamZ(depth: number, y: number, x: number): void { this.timberBox(0.22, 0.2, depth, x, y, 0) }

  private flushBoxes(parts: BoxPart[], material: PavilionMaterial, name: string): void {
    const mesh = new InstancedMesh(this.boxGeometry, material, parts.length)
    mesh.name = name
    parts.forEach((part, index) => {
      this.position.set(...part.position); this.scale.set(...part.size)
      this.rotation.setFromEuler(this.euler.set(0, 0, 0)); this.matrix.compose(this.position, this.rotation, this.scale)
      mesh.setMatrixAt(index, this.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true; this.root.add(mesh)
  }
  private material(color: string, roughness: number): PavilionMaterial {
    const material = new MeshStandardMaterial({ color, roughness, metalness: 0.03 })
    this.materials.push(material); return material
  }
  private timberBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.timberParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private trimBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.trimParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private paperBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.paperParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private coreBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.coreParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private foundationBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.foundationParts.push({ size: [width, height, depth], position: [x, y, z] }) }
}
