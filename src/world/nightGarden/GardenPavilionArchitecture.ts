import { BoxGeometry, BufferGeometry, Group, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import type { MeshStandardMaterial } from 'three'
import { GardenPavilionBlockoutMaterials } from './GardenPavilionBlockoutMaterials'
import { createPavilionRoofFasciaGeometry, createPavilionRoofGeometry } from './GardenPavilionRoof'

export const MANSION_ROOT_POSITION = { x: 3.2, z: -53.4 } as const
export const MANSION_FOUNDATION_LOWEST_LOCAL_Y = 1.73

type Finish = 'foundation' | 'deck' | 'structure' | 'secondaryStructure' | 'wall' | 'opening' | 'soffit' | 'roofEdge'
type BoxPart = { readonly size: readonly [number, number, number]; readonly position: readonly [number, number, number] }

/**
 * Procedural architectural builder for the mansion blockout. Individual residence
 * systems add authored boxes here, then share a single instanced geometry per finish.
 */
export class GardenPavilionArchitecture {
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly geometries: BufferGeometry[] = []
  private readonly parts: Record<Finish, BoxPart[]> = {
    foundation: [], deck: [], structure: [], secondaryStructure: [], wall: [], opening: [], soffit: [], roofEdge: [],
  }
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly root: Group
  private readonly materials: GardenPavilionBlockoutMaterials
  private finalized = false

  constructor(root: Group, materials: GardenPavilionBlockoutMaterials) {
    this.root = root
    this.materials = materials
  }

  /** The first datum: a stepped mineral plinth beneath the future central hall. */
  createFoundationSystem(): void {
    this.add('foundation', 15.9, 0.54, 10.9, 0, 2.00, -2.55)
    this.add('foundation', 16.25, 0.13, 11.22, 0, 2.29, -2.55)
    this.add('deck', 15.42, 0.18, 10.36, 0, 2.43, -2.55)
    this.add('roofEdge', 16.14, 0.13, 0.20, 0, 2.16, 2.90)
    this.add('roofEdge', 16.14, 0.13, 0.20, 0, 2.16, -8.00)
  }

  /**
   * A six-bay hall becomes the compound's primary mass. Its centre remains open
   * for the deeper genkan rather than dissolving into a repeated window strip.
   */
  createGrandCentralHall(): void {
    const floorY = 2.52
    const height = 3.66
    const centerY = floorY + height / 2
    const front = 2.25
    const rear = -7.35
    const width = 14.8
    const side = width / 2

    this.add('opening', 14.08, 3.25, 8.72, 0, 4.18, -2.58)
    this.add('secondaryStructure', 15.18, 0.20, 9.96, 0, floorY + 0.08, -2.55)
    for (const x of [-7.2, -4.8, -2.4, 2.4, 4.8, 7.2]) {
      this.post(x, centerY, front, height, true)
      this.post(x, centerY, rear, height, true)
    }
    for (const z of [-4.95, -2.55, -0.15]) {
      this.post(-side, centerY, z, height, true)
      this.post(side, centerY, z, height, true)
    }
    this.beamX(15.24, floorY + height, front, true)
    this.beamX(15.24, floorY + height, rear, true)
    this.beamZ(9.94, floorY + height, -side, -2.55, true)
    this.beamZ(9.94, floorY + height, side, -2.55, true)
    this.beamX(14.92, floorY + 0.34, front, false)

    // Large flank planes deliberately leave the three central bays to the entry sequence.
    this.add('wall', 2.06, 2.86, 0.16, -5.98, 4.02, front - 0.10)
    this.add('wall', 2.06, 2.86, 0.16, 5.98, 4.02, front - 0.10)
    this.add('wall', 1.98, 2.86, 0.16, -3.58, 4.02, front - 0.10)
    this.add('wall', 1.98, 2.86, 0.16, 3.58, 4.02, front - 0.10)
  }

  /** Path, stepped landing, covered entry, and recessed threshold form one sequence. */
  createCeremonialEntry(): void {
    const floorY = 2.52
    const entryWidth = 7.35
    const outerFront = 5.52
    const headerY = 5.72
    const postHeight = 3.18
    const postY = floorY + postHeight / 2

    this.add('deck', entryWidth, 0.20, 3.30, 0, floorY + 0.10, 3.86)
    this.add('soffit', entryWidth - 0.34, 0.16, 2.92, 0, headerY - 0.18, 3.78)
    this.add('opening', 5.20, 2.90, 0.20, 0, 4.04, 1.72)
    this.add('roofEdge', entryWidth + 0.28, 0.20, 0.28, 0, headerY + 0.05, outerFront)
    this.beamX(entryWidth + 0.16, headerY, outerFront, true)
    this.beamX(5.38, headerY - 0.34, 2.78, false)

    for (const x of [-3.36, -1.12, 1.12, 3.36]) this.post(x, postY, outerFront, postHeight, true)
    for (const x of [-2.42, 2.42]) this.post(x, postY, 2.72, postHeight, false)
    this.add('structure', 0.28, 2.70, 0.28, -2.42, 4.03, 3.72)
    this.add('structure', 0.28, 2.70, 0.28, 2.42, 4.03, 3.72)

    // Five thick, progressively wider treads keep the stair legible at camera-walk distance.
    for (let step = 0; step < 5; step++) {
      const height = 0.12 * (step + 1)
      this.add('foundation', 8.45 - step * 0.34, height, 0.66, 0, 1.86 + height / 2, 6.58 - step * 0.54)
    }
    this.add('foundation', 7.80, 0.14, 0.78, 0, 2.19, 4.94)
  }

  /** Paired, recessed residential volumes extend the hall without matching its stature. */
  createSideResidenceWings(): void {
    this.createResidenceWing(-11.0, -2.45, 'west')
    this.createResidenceWing(11.0, -2.45, 'east')
  }

  /** A compact upper residence is materially set back, avoiding a second-floor strip. */
  createUpperResidence(): void {
    const width = 10.80
    const depth = 5.70
    const floorY = 6.30
    const height = 2.12
    const centerZ = -2.68
    const front = centerZ + depth / 2
    const rear = centerZ - depth / 2
    const side = width / 2
    const centerY = floorY + height / 2

    this.add('deck', width + 0.18, 0.18, depth + 0.18, 0, floorY, centerZ)
    this.add('opening', width - 0.46, height - 0.30, depth - 0.38, 0, centerY, centerZ)
    for (const x of [-5.10, -2.55, 0, 2.55, 5.10]) {
      this.post(x, centerY, front, height, false)
      this.post(x, centerY, rear, height, false)
    }
    for (const z of [-4.10, -2.68, -1.26]) {
      this.post(-side, centerY, z, height, false)
      this.post(side, centerY, z, height, false)
    }
    this.beamX(width + 0.22, floorY + height, front, false)
    this.beamX(width + 0.22, floorY + height, rear, false)
    this.beamZ(depth + 0.22, floorY + height, -side, centerZ, false)
    this.beamZ(depth + 0.22, floorY + height, side, centerZ, false)
    this.add('wall', 1.90, 1.62, 0.14, -3.78, centerY, front - 0.08)
    this.add('wall', 1.90, 1.62, 0.14, 3.78, centerY, front - 0.08)
    this.add('deck', width - 0.90, 0.10, 0.52, 0, floorY + 0.13, front + 0.26)
  }

  /** A lower rear room creates a second roof plane and side-view depth behind the hall. */
  createRearResidenceMass(): void {
    const width = 12.80
    const depth = 4.90
    const floorY = 2.46
    const height = 2.54
    const centerZ = -9.48
    const front = centerZ + depth / 2
    const rear = centerZ - depth / 2
    const side = width / 2
    const centerY = floorY + height / 2

    this.add('foundation', width + 0.44, 0.44, depth + 0.42, 0, 1.99, centerZ)
    this.add('deck', width - 0.08, 0.16, depth - 0.08, 0, floorY, centerZ)
    this.add('opening', width - 0.46, height - 0.32, depth - 0.42, 0, centerY, centerZ)
    for (const x of [-6.2, -3.1, 0, 3.1, 6.2]) {
      this.post(x, centerY, rear, height, false)
      this.post(x, centerY, front, height, false)
    }
    this.post(-side, centerY, centerZ, height, false)
    this.post(side, centerY, centerZ, height, false)
    this.beamX(width + 0.18, floorY + height, rear, false)
    this.beamX(width + 0.18, floorY + height, front, false)
    this.beamZ(depth + 0.18, floorY + height, -side, centerZ, false)
    this.beamZ(depth + 0.18, floorY + height, side, centerZ, false)
    this.add('wall', 2.62, 1.92, 0.14, -4.65, centerY, rear + 0.09)
    this.add('wall', 2.62, 1.92, 0.14, 4.65, centerY, rear + 0.09)
  }

  /** Six roof masses establish a readable compound before eave refinement begins. */
  createRoofHierarchy(): void {
    this.addRoof('pavilion-hall-roof', 16.9, 11.5, 1.16, 6.23, 0, -2.55, 0.39, 0.26)
    this.addRoof('pavilion-upper-main-roof', 12.8, 8.0, 1.55, 8.47, 0, -2.68, 0.38, 0.32)
    this.addRoof('pavilion-west-wing-roof', 8.25, 8.72, 0.82, 5.34, -11.0, -2.45, 0.35, 0.18)
    this.addRoof('pavilion-east-wing-roof', 8.25, 8.72, 0.82, 5.34, 11.0, -2.45, 0.35, 0.18)
    this.addRoof('pavilion-rear-roof', 13.9, 6.0, 0.72, 5.01, 0, -9.48, 0.36, 0.14)
    this.addRoof('pavilion-entry-roof', 8.2, 4.35, 0.58, 5.82, 0, 3.86, 0.33, 0.12)
  }

  finalize(): void {
    if (this.finalized) return
    this.finalized = true
    const materialByFinish: Record<Finish, MeshStandardMaterial> = {
      foundation: this.materials.foundation, deck: this.materials.deck, structure: this.materials.structure,
      secondaryStructure: this.materials.secondaryStructure, wall: this.materials.wall, opening: this.materials.opening,
      soffit: this.materials.soffit, roofEdge: this.materials.roofEdge,
    }
    ;(Object.keys(this.parts) as Finish[]).forEach(finish => this.flush(finish, materialByFinish[finish]))
  }

  dispose(): void {
    this.root.clear()
    this.boxGeometry.dispose()
    this.geometries.forEach(geometry => geometry.dispose())
  }

  private add(finish: Finish, width: number, height: number, depth: number, x: number, y: number, z: number): void {
    this.parts[finish].push({ size: [width, height, depth], position: [x, y, z] })
  }

  private post(x: number, y: number, z: number, height: number, primary: boolean): void {
    const section = primary ? 0.34 : 0.24
    this.add('structure', section, height, section, x, y, z)
    this.add(primary ? 'structure' : 'secondaryStructure', section + 0.12, 0.13, section + 0.12, x, y - height / 2 + 0.065, z)
  }

  private beamX(width: number, y: number, z: number, primary: boolean): void {
    this.add(primary ? 'structure' : 'secondaryStructure', width, primary ? 0.34 : 0.20, primary ? 0.38 : 0.24, 0, y, z)
  }

  private beamZ(depth: number, y: number, x: number, z: number, primary: boolean): void {
    this.add(primary ? 'structure' : 'secondaryStructure', primary ? 0.38 : 0.24, primary ? 0.34 : 0.20, depth, x, y, z)
  }

  private createResidenceWing(centerX: number, centerZ: number, side: 'west' | 'east'): void {
    const width = 7.20
    const depth = 7.70
    const floorY = 2.48
    const height = 2.86
    const front = centerZ + depth / 2
    const rear = centerZ - depth / 2
    const outerX = centerX + (side === 'west' ? -width / 2 : width / 2)
    const innerX = centerX - (side === 'west' ? -width / 2 : width / 2)
    const headerY = floorY + height

    this.add('foundation', width + 0.36, 0.48, depth + 0.38, centerX, 2.01, centerZ)
    this.add('deck', width - 0.12, 0.18, depth - 0.10, centerX, floorY, centerZ)
    this.add('opening', width - 0.54, height - 0.34, depth - 0.46, centerX, floorY + height / 2, centerZ)
    for (const x of [innerX, outerX]) {
      this.post(x, floorY + height / 2, front, height, false)
      this.post(x, floorY + height / 2, rear, height, false)
    }
    for (const z of [centerZ - 1.28, centerZ + 1.28]) this.post(outerX, floorY + height / 2, z, height, false)
    this.beamX(width + 0.14, headerY, front, false)
    this.beamX(width + 0.14, headerY, rear, false)
    this.beamZ(depth + 0.14, headerY, outerX, centerZ, false)
    this.add('wall', 2.00, 2.20, 0.15, centerX - 1.82, 3.91, front - 0.10)
    this.add('wall', 2.00, 2.20, 0.15, centerX + 1.82, 3.91, front - 0.10)
    this.add('wall', 0.15, 2.20, 2.06, outerX + (side === 'west' ? -0.09 : 0.09), 3.91, centerZ)
    this.add('deck', width + 0.12, 0.17, 1.16, centerX, floorY + 0.07, front + 0.52)
    this.add('foundation', width + 0.22, 0.22, 0.34, centerX, 2.05, front + 1.05)
  }

  private addRoof(
    name: string, width: number, depth: number, rise: number, eaveY: number, x: number, z: number,
    ridgeHalfWidth: number, cornerLift: number,
  ): void {
    const shape = { width, depth, rise, thickness: 0.18, ridgeHalfWidth, cornerLift }
    const geometry = createPavilionRoofGeometry(shape)
    this.geometries.push(geometry)
    const roof = new Mesh(geometry, this.materials.roof)
    roof.name = name
    roof.position.set(x, eaveY, z)
    this.root.add(roof)
    const fasciaGeometry = createPavilionRoofFasciaGeometry(shape)
    this.geometries.push(fasciaGeometry)
    const fascia = new Mesh(fasciaGeometry, this.materials.roofEdge)
    fascia.name = `${name}-swept-fascia`
    fascia.position.set(x, eaveY, z)
    this.root.add(fascia)
    this.add('soffit', width - 0.52, 0.10, 0.46, x, eaveY - 0.13, z + depth / 2 - 0.28)
    this.add('soffit', width - 0.52, 0.10, 0.46, x, eaveY - 0.13, z - depth / 2 + 0.28)
    this.add('roofEdge', width * ridgeHalfWidth * 2, 0.16, 0.24, x, eaveY + rise + 0.06, z)
  }

  private flush(finish: Finish, material: MeshStandardMaterial): void {
    const parts = this.parts[finish]
    if (parts.length === 0) return
    const mesh = new InstancedMesh(this.boxGeometry, material, parts.length)
    mesh.name = `pavilion-blockout-${finish}`
    parts.forEach((part, index) => {
      this.position.set(...part.position)
      this.scale.set(...part.size)
      this.matrix.compose(this.position, this.rotation.identity(), this.scale)
      mesh.setMatrixAt(index, this.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    this.root.add(mesh)
  }
}
