import {
  BoxGeometry, BufferGeometry, Euler, Group, InstancedMesh, Matrix4, MeshStandardMaterial,
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
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly euler = new Euler()

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

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-pavilion-residence'
    this.root.position.set(5.15, -5.6, -31.2)
    this.root.rotation.y = -0.035
    this.root.scale.setScalar(1)
    parent.add(this.root)

    this.createFoundationGrid()
    this.createLowerStructuralDatum()

    this.flushBoxes(this.foundationParts, this.material('#182426', 0.9), 'pavilion-foundation')
    this.flushBoxes(this.timberParts, this.material('#263638', 0.76), 'pavilion-timber')
    this.flushBoxes(this.trimParts, this.material('#53635f', 0.7), 'pavilion-trim')
  }

  setIntensity(_value: number): void {}

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
  private foundationBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.foundationParts.push({ size: [width, height, depth], position: [x, y, z] }) }
}
