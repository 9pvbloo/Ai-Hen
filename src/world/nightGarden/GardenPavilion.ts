import {
  BoxGeometry, BufferGeometry, Color, Euler, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  Quaternion, Vector3,
} from 'three'
import type { Group as ThreeGroup } from 'three'
import type { CompositionId } from '../shanshui/ShanshuiConfig'
import { sampleDryGardenGroundWorldY } from './GardenGroundHeight'
import { GardenPavilionMaterials } from './GardenPavilionMaterials'

type PavilionMaterial = MeshStandardMaterial
type BoxPart = { size: readonly [number, number, number], position: readonly [number, number, number] }
type InteriorTone = 'warm' | 'quiet' | 'cool'

/** Plan-first structural datum for the Night Garden residence. */
export class GardenPavilion {
  private readonly root = new Group()
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly pavilionMaterials = new GardenPavilionMaterials()
  private readonly geometries: BufferGeometry[] = []
  private readonly foundationParts: BoxPart[] = []
  private readonly timberParts: BoxPart[] = []
  private readonly trimParts: BoxPart[] = []
  private readonly soffitParts: BoxPart[] = []
  private readonly roofDetailParts: BoxPart[] = []
  private readonly paperParts: BoxPart[] = []
  private readonly warmPaperParts: BoxPart[] = []
  private readonly quietPaperParts: BoxPart[] = []
  private readonly coreParts: BoxPart[] = []
  private readonly warmInteriorParts: BoxPart[] = []
  private readonly quietInteriorParts: BoxPart[] = []
  private readonly interiorShadowParts: BoxPart[] = []
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly euler = new Euler()
  private readonly instanceColor = new Color()

  // A genuinely deep primary residence: the later wings read as satellites, not facade dressing.
  private static readonly BAY_X = 2.08
  private static readonly BAY_Z = 2.02
  private static readonly LOWER_COLS = 10
  private static readonly LOWER_ROWS = 6
  private static readonly LOWER_HEIGHT = 3.20
  private static readonly UPPER_COLS = 8
  private static readonly UPPER_ROWS = 4
  private static readonly UPPER_HEIGHT = 2.55
  private static readonly FOUNDATION_HEIGHT = 0.34
  private static readonly ENGAWA_DEPTH = 1.85
  private static readonly ROOF_OVERHANG = 1.10
  private static readonly FLOOR_Y = 2.35
  private static readonly LOWER_PLAN_CENTER_Z = -1.10
  private static readonly UPPER_PLAN_CENTER_Z = GardenPavilion.LOWER_PLAN_CENTER_Z - 1.05
  // Seat the expanded compound behind the forecourt: its entry remains a destination, not a backdrop.
  private static readonly POSITION = { x: 3.2, z: -53.4 }
  private static readonly FOUNDATION_LOWEST_LOCAL_Y = GardenPavilion.FLOOR_Y - 0.47 - 0.15
  private static readonly ARCHITECTURE = {
    upperCols: GardenPavilion.UPPER_COLS, upperRows: GardenPavilion.UPPER_ROWS,
    upperHeight: GardenPavilion.UPPER_HEIGHT, roofOverhang: GardenPavilion.ROOF_OVERHANG,
  }

  constructor(parent: ThreeGroup, layout: CompositionId = 'desktop') {
    this.root.name = 'garden-pavilion-residence'
    this.root.position.set(GardenPavilion.POSITION.x, 0, GardenPavilion.POSITION.z)
    this.root.rotation.y = -0.035
    this.root.scale.setScalar(1)
    this.setLayout(layout)
    parent.add(this.root)

    this.createFoundationGrid()
    this.createLowerStructuralDatum()
    this.createLowerResidence()
    this.createUpperResidence()
    this.createRearResidenceWing()
    this.createSideResidenceWings()
    const { lowerRoof, upperRoof, wingRoof } = this.pavilionMaterials
    this.createLowerSkirtRoof(lowerRoof)
    this.createRoof(GardenPavilion.ARCHITECTURE.upperCols * GardenPavilion.BAY_X * 0.96 + GardenPavilion.ROOF_OVERHANG * 1.85, GardenPavilion.ARCHITECTURE.upperRows * GardenPavilion.BAY_Z * 0.96 + GardenPavilion.ROOF_OVERHANG * 1.85, 1.22, GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + GardenPavilion.ARCHITECTURE.upperHeight + 0.5, GardenPavilion.UPPER_PLAN_CENTER_Z, upperRoof, 'pavilion-upper-roof', 0, 0.60, 4)
    this.createUpperRoofCrown()
    this.createGrandEntranceCanopy(lowerRoof)
    this.createRearWingRoof(lowerRoof)
    this.createSideWingRoofs(wingRoof)
    this.createSideWingRoofPediments(wingRoof)
    this.createSideWingRoofTransitions()

    this.flushBoxes(this.foundationParts, this.pavilionMaterials.foundation, 'pavilion-foundation')
    this.flushBoxes(this.timberParts, this.pavilionMaterials.timber, 'pavilion-timber')
    this.flushBoxes(this.trimParts, this.pavilionMaterials.trim, 'pavilion-trim')
    this.flushBoxes(this.soffitParts, this.pavilionMaterials.soffit, 'pavilion-roof-soffit')
    this.flushBoxes(this.roofDetailParts, this.pavilionMaterials.roofDetail, 'pavilion-roof-batten-details')
    this.flushBoxes(this.coreParts, this.pavilionMaterials.core, 'pavilion-interior-core')
    this.flushBoxes(this.warmInteriorParts, this.pavilionMaterials.warmInterior, 'pavilion-interior-warm-cues')
    this.flushBoxes(this.quietInteriorParts, this.pavilionMaterials.quietInterior, 'pavilion-interior-quiet-cues')
    this.flushBoxes(this.interiorShadowParts, this.pavilionMaterials.interiorShadow, 'pavilion-interior-partition-silhouettes')
    this.flushBoxes(this.paperParts, this.pavilionMaterials.coolPaper, 'pavilion-shoji')
    this.flushBoxes(this.warmPaperParts, this.pavilionMaterials.warmPaper, 'pavilion-shoji-warm')
    this.flushBoxes(this.quietPaperParts, this.pavilionMaterials.quietPaper, 'pavilion-shoji-quiet')
  }

  // Keep the shoji legible under the restrained moon key without making a glowing facade.
  setIntensity(value: number): void {
    this.pavilionMaterials.setIntensity(value)
  }

  setLayout(layout: CompositionId): void {
    this.root.position.y = sampleDryGardenGroundWorldY(GardenPavilion.POSITION.x, GardenPavilion.POSITION.z, layout) -
      GardenPavilion.FOUNDATION_LOWEST_LOCAL_Y
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.boxGeometry.dispose()
    this.geometries.forEach(geometry => geometry.dispose())
    this.pavilionMaterials.dispose()
  }

  private get lowerWidth(): number { return GardenPavilion.BAY_X * GardenPavilion.LOWER_COLS }
  private get lowerDepth(): number { return GardenPavilion.BAY_Z * GardenPavilion.LOWER_ROWS }
  private gridX(column: number): number { return (column - GardenPavilion.LOWER_COLS / 2) * GardenPavilion.BAY_X }
  private gridZ(row: number): number { return GardenPavilion.LOWER_PLAN_CENTER_Z + (row - GardenPavilion.LOWER_ROWS / 2) * GardenPavilion.BAY_Z }

  private createFoundationGrid(): void {
    const { FOUNDATION_HEIGHT, FLOOR_Y, ENGAWA_DEPTH } = GardenPavilion
    const depth = this.lowerDepth + ENGAWA_DEPTH
    const centerZ = (this.gridZ(0) + this.gridZ(GardenPavilion.LOWER_ROWS) + ENGAWA_DEPTH) / 2
    this.foundationBox(this.lowerWidth + 0.54, FOUNDATION_HEIGHT, depth + 0.48, 0, FLOOR_Y - 0.34, centerZ)
    this.foundationBox(this.lowerWidth + 0.22, 0.14, depth + 0.14, 0, FLOOR_Y - 0.1, centerZ)
    this.timberBox(this.lowerWidth + 0.18, 0.14, depth + 0.12, 0, FLOOR_Y + 0.03, centerZ)
    this.trimBox(this.lowerWidth + 0.60, 0.10, 0.16, 0, FLOOR_Y - 0.17, centerZ + (depth + 0.48) / 2 - 0.08)
    this.trimBox(this.lowerWidth + 0.60, 0.10, 0.16, 0, FLOOR_Y - 0.17, centerZ - (depth + 0.48) / 2 + 0.08)
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
    this.addBeamZ(this.lowerDepth + 0.22, FLOOR_Y + LOWER_HEIGHT, this.gridX(0), GardenPavilion.LOWER_PLAN_CENTER_Z)
    this.addBeamZ(this.lowerDepth + 0.22, FLOOR_Y + LOWER_HEIGHT, this.gridX(GardenPavilion.LOWER_COLS), GardenPavilion.LOWER_PLAN_CENTER_Z)
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
    // A three-bay threshold gives the long front a genuine centre of gravity.
    this.createGrandEntrance(0, FLOOR_Y, front)
    const lowerInteriorTones: readonly InteriorTone[] = ['quiet', 'warm', 'cool', 'quiet', 'warm', 'quiet', 'cool', 'warm', 'quiet']
    for (let column = 1; column < GardenPavilion.LOWER_COLS; column++) {
      const x = (this.gridX(column) + this.gridX(column + 1)) / 2
      const width = GardenPavilion.BAY_X - 0.26
      const height = LOWER_HEIGHT - 0.52
      const arrivalBay = column >= 3 && column <= 6
      this.addRecessedFrontBay(x, screenY, front, width, height, lowerInteriorTones[column - 1], arrivalBay ? 0.86 : 0.56)
    }
    for (let column = 0; column < GardenPavilion.LOWER_COLS; column++) this.addShojiBay((this.gridX(column) + this.gridX(column + 1)) / 2, screenY, rear + 0.13, GardenPavilion.BAY_X - 0.26, LOWER_HEIGHT - 0.52, false)
    for (let row = 0; row < GardenPavilion.LOWER_ROWS; row++) {
      this.addShojiBay((this.gridZ(row) + this.gridZ(row + 1)) / 2, screenY, left + 0.13, GardenPavilion.BAY_Z - 0.26, LOWER_HEIGHT - 0.52, true)
      this.addShojiBay((this.gridZ(row) + this.gridZ(row + 1)) / 2, screenY, right - 0.13, GardenPavilion.BAY_Z - 0.26, LOWER_HEIGHT - 0.52, true)
    }
  }

  private createUpperResidence(): void {
    const { upperCols, upperRows, upperHeight } = GardenPavilion.ARCHITECTURE
    const upperBayX = GardenPavilion.BAY_X * 0.96
    const upperBayZ = GardenPavilion.BAY_Z * 0.96
    const width = upperCols * upperBayX
    const depth = upperRows * upperBayZ
    const floorY = GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + 0.24
    const centerZ = GardenPavilion.UPPER_PLAN_CENTER_Z
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
    this.addBeamZ(depth + 0.16, floorY + upperHeight, xAt(0), centerZ)
    this.addBeamZ(depth + 0.16, floorY + upperHeight, xAt(upperCols), centerZ)
    const upperInteriorTones: readonly InteriorTone[] = ['quiet', 'warm', 'cool', 'quiet', 'warm', 'quiet', 'cool', 'quiet']
    for (let column = 0; column < upperCols; column++) {
      const x = (xAt(column) + xAt(column + 1)) / 2
      const width = upperBayX - 0.24
      const height = upperHeight - 0.4
      this.addShojiBay(x, screenY, zAt(upperRows) - 0.12, width, height, false, upperInteriorTones[column])
      this.addFrontInteriorCue(x, screenY, zAt(upperRows) - 0.31, width, height, upperInteriorTones[column])
      this.addShojiBay(x, screenY, zAt(0) + 0.12, upperBayX - 0.24, upperHeight - 0.4, false)
    }
    for (let row = 0; row < upperRows; row++) {
      const z = (zAt(row) + zAt(row + 1)) / 2
      this.addShojiBay(z, screenY, xAt(0) + 0.12, upperBayZ - 0.24, upperHeight - 0.4, true)
      this.addShojiBay(z, screenY, xAt(upperCols) - 0.12, upperBayZ - 0.24, upperHeight - 0.4, true)
    }
    this.createUpperVerandaRails(width, floorY, zAt(upperRows) + 0.30)
  }

  /**
   * A lower, quieter rear wing materially extends the plan behind the main house.
   * It stays subordinate to the upper residence, so the silhouette reads as a compound.
   */
  private createRearResidenceWing(): void {
    const width = 13.2
    const depth = 4.45
    const height = 2.62
    const floorY = GardenPavilion.FLOOR_Y - 0.04
    const rear = this.gridZ(0) - depth + 0.22
    const front = rear + depth
    const centerZ = (front + rear) / 2
    const screenY = floorY + height * 0.5
    const bayWidth = width / 6

    this.foundationBox(width + 0.46, GardenPavilion.FOUNDATION_HEIGHT, depth + 0.42, 0, floorY - 0.34, centerZ)
    this.timberBox(width + 0.18, 0.14, depth + 0.12, 0, floorY + 0.03, centerZ)
    this.coreBox(width - 0.42, height - 0.35, depth - 0.38, 0, screenY, centerZ)
    for (let column = 0; column <= 6; column++) {
      const x = -width / 2 + column * bayWidth
      this.addPost(x, screenY, rear, height)
      this.addPost(x, screenY, front, height)
    }
    this.addBeamX(width + 0.18, floorY + height, rear)
    this.addBeamX(width + 0.18, floorY + height, front)
    this.addBeamZ(depth + 0.18, floorY + height, -width / 2, centerZ)
    this.addBeamZ(depth + 0.18, floorY + height, width / 2, centerZ)
    for (let column = 0; column < 6; column++) {
      const x = -width / 2 + (column + 0.5) * bayWidth
      this.addShojiBay(x, screenY, rear + 0.12, bayWidth - 0.25, height - 0.42, false, column === 2 ? 'warm' : 'quiet')
    }
    for (let row = 0; row < 2; row++) {
      const z = rear + (row + 0.5) * depth / 2
      this.addShojiBay(z, screenY, -width / 2 + 0.12, depth / 2 - 0.24, height - 0.42, true, 'quiet')
      this.addShojiBay(z, screenY, width / 2 - 0.12, depth / 2 - 0.24, height - 0.42, true, 'quiet')
    }
  }

  private createRearWingRoof(material: PavilionMaterial): void {
    const depth = 4.45
    const rear = this.gridZ(0) - depth + 0.22
    const centerZ = (this.gridZ(0) + rear) / 2
    this.createRoof(15.05, 6.25, 0.58, GardenPavilion.FLOOR_Y + 2.70, centerZ, material, 'pavilion-rear-residence-roof')
  }

  /** Offset side wings make the perimeter asymmetrical and legible in perspective. */
  private createSideResidenceWings(): void {
    this.createSideResidenceWing('west', -13.0, -3.35, 5.25, 7.30, 2.78)
    this.createSideResidenceWing('east', 13.05, -0.62, 5.10, 6.10, 2.70)
  }

  private createSideResidenceWing(name: 'west' | 'east', centerX: number, centerZ: number, width: number, depth: number, height: number): void {
    const floorY = GardenPavilion.FLOOR_Y - 0.03
    const screenY = floorY + height / 2
    const outerX = centerX + (name === 'west' ? -width / 2 : width / 2)
    const front = centerZ + depth / 2
    const rear = centerZ - depth / 2
    const bays = 3

    this.foundationBox(width + 0.42, GardenPavilion.FOUNDATION_HEIGHT, depth + 0.42, centerX, floorY - 0.34, centerZ)
    this.timberBox(width + 0.15, 0.14, depth + 0.14, centerX, floorY + 0.03, centerZ)
    this.coreBox(width - 0.34, height - 0.34, depth - 0.36, centerX, screenY, centerZ)
    for (let row = 0; row <= bays; row++) {
      const z = rear + row * depth / bays
      this.addPost(outerX, screenY, z, height)
    }
    this.addPost(centerX - width / 2, screenY, front, height)
    this.addPost(centerX + width / 2, screenY, front, height)
    this.addBeamZ(depth + 0.18, floorY + height, outerX, centerZ)
    this.addBeamX(width + 0.18, floorY + height, front)
    for (let row = 0; row < bays; row++) {
      const z = rear + (row + 0.5) * depth / bays
      this.addShojiBay(z, screenY, outerX + (name === 'west' ? 0.12 : -0.12), depth / bays - 0.25, height - 0.42, true, row === 1 ? 'warm' : 'quiet')
    }
    for (let column = 0; column < 2; column++) {
      const x = centerX - width / 2 + (column + 0.5) * width / 2
      this.addShojiBay(x, screenY, front - 0.12, width / 2 - 0.24, height - 0.42, false, column === 0 ? 'quiet' : 'warm')
    }
    this.createSideWingVeranda(name, centerX, front, width, floorY, height)
  }

  /** A shallow furnished threshold turns each side mass into an inhabitable wing rather than a wall end. */
  private createSideWingVeranda(name: 'west' | 'east', centerX: number, front: number, width: number, floorY: number, height: number): void {
    const deckWidth = width + 0.18
    const deckDepth = 0.76
    const deckZ = front + deckDepth / 2
    const postY = floorY + (height - 0.56) / 2
    this.timberBox(deckWidth, 0.16, deckDepth, centerX, floorY + 0.12, deckZ)
    this.soffitBox(deckWidth - 0.14, 0.08, deckDepth - 0.10, centerX, floorY - 0.03, deckZ)
    this.trimBox(deckWidth + 0.10, 0.13, 0.14, centerX, floorY + 0.23, front + deckDepth)
    this.foundationBox(deckWidth + 0.20, 0.14, 0.38, centerX, floorY - 0.15, front + deckDepth + 0.08)
    this.addPost(centerX - deckWidth / 2 + 0.10, postY, front + deckDepth, height - 0.56)
    this.addPost(centerX + deckWidth / 2 - 0.10, postY, front + deckDepth, height - 0.56)
    const railX = centerX + (name === 'west' ? -deckWidth * 0.22 : deckWidth * 0.22)
    this.addRailSection(deckWidth * 0.42, railX, floorY + 0.22, front + deckDepth + 0.02, 0.46)
  }

  private createSideWingRoofs(material: PavilionMaterial): void {
    this.createRoof(6.95, 9.00, 0.66, GardenPavilion.FLOOR_Y + 2.86, -3.35, material, 'pavilion-west-wing-roof', -13.0)
    this.createRoof(6.80, 7.80, 0.60, GardenPavilion.FLOOR_Y + 2.78, -0.62, material, 'pavilion-east-wing-roof', 13.05)
  }

  /** Shallow irimoya-inspired gable faces give each side wing a clear subordinate roof identity. */
  private createSideWingRoofPediments(material: PavilionMaterial): void {
    this.createRoofPediment(-13.0, -3.35 + 4.50 + 0.015, GardenPavilion.FLOOR_Y + 2.86, 4.48, 0.48, material, 'pavilion-west-wing-pediment')
    this.createRoofPediment(13.05, -0.62 + 3.90 + 0.015, GardenPavilion.FLOOR_Y + 2.78, 4.34, 0.43, material, 'pavilion-east-wing-pediment')
  }

  /** A dark collar separates the primary roof plane from the upper shoji band and deepens its shadow line. */
  private createUpperRoofCrown(): void {
    const width = GardenPavilion.ARCHITECTURE.upperCols * GardenPavilion.BAY_X * 0.96 + GardenPavilion.ROOF_OVERHANG * 1.70
    const depth = GardenPavilion.ARCHITECTURE.upperRows * GardenPavilion.BAY_Z * 0.96 + GardenPavilion.ROOF_OVERHANG * 1.70
    const eaveY = GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + GardenPavilion.ARCHITECTURE.upperHeight + 0.5
    const z = GardenPavilion.UPPER_PLAN_CENTER_Z
    this.soffitBox(width - 0.38, 0.10, 0.58, 0, eaveY - 0.16, z + depth / 2 - 0.28)
    this.soffitBox(width - 0.38, 0.10, 0.58, 0, eaveY - 0.16, z - depth / 2 + 0.28)
    this.trimBox(width + 0.08, 0.13, 0.19, 0, eaveY - 0.03, z + depth / 2)
    this.trimBox(width + 0.08, 0.13, 0.19, 0, eaveY - 0.03, z - depth / 2)
  }

  private createRoofPediment(x: number, z: number, eaveY: number, width: number, rise: number, material: PavilionMaterial, name: string): void {
    const vertices = [
      x - width / 2, eaveY, z, x + width / 2, eaveY, z, x, eaveY + rise, z,
      x - width / 2, eaveY, z - 0.03, x + width / 2, eaveY, z - 0.03, x, eaveY + rise, z - 0.03,
    ]
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setIndex([0, 1, 2, 3, 5, 4])
    geometry.computeVertexNormals()
    this.geometries.push(geometry)
    const pediment = new Mesh(geometry, material)
    pediment.name = name
    this.root.add(pediment)
    this.trimBox(width + 0.16, 0.13, 0.12, x, eaveY + 0.03, z + 0.02)
  }

  /** Shadowed overlap strips make the wing roofs read as related lower masses, not detached caps. */
  private createSideWingRoofTransitions(): void {
    const eaveY = GardenPavilion.FLOOR_Y + 2.82
    this.soffitBox(1.06, 0.13, 5.80, -10.36, eaveY - 0.15, -3.25)
    this.soffitBox(1.04, 0.13, 5.10, 10.38, eaveY - 0.15, -0.75)
    this.trimBox(0.17, 0.18, 5.86, -10.48, eaveY + 0.01, -3.25)
    this.trimBox(0.17, 0.18, 5.16, 10.50, eaveY + 0.01, -0.75)
  }

  private createRoof(width: number, depth: number, rise: number, eaveY: number, z: number, material: PavilionMaterial, name: string, x = 0, ridgeRatio = 0.46, battenRows = 3): void {
    const geometry = this.createSampledRoofGeometry(width, depth, rise, 12, 10)
    this.geometries.push(geometry)
    const roof = new Mesh(geometry, material)
    roof.name = name
    roof.position.set(x, eaveY, z)
    this.root.add(roof)
    this.trimBox(width + 0.04, 0.17, 0.16, x, eaveY + 0.03, z + depth / 2)
    this.trimBox(width + 0.04, 0.17, 0.16, x, eaveY + 0.03, z - depth / 2)
    this.trimBox(0.16, 0.17, depth - 0.18, x - width / 2, eaveY + 0.03, z)
    this.trimBox(0.16, 0.17, depth - 0.18, x + width / 2, eaveY + 0.03, z)
    const ridgeLength = width * ridgeRatio
    this.trimBox(ridgeLength, 0.15, 0.24, x, eaveY + rise + 0.07, z)
    this.roofDetailBox(ridgeLength * 0.96, 0.045, 0.10, x, eaveY + rise + 0.17, z)
    this.trimBox(0.24, 0.19, 0.32, x - ridgeLength / 2, eaveY + rise + 0.09, z)
    this.trimBox(0.24, 0.19, 0.32, x + ridgeLength / 2, eaveY + rise + 0.09, z)
    for (const side of [-1, 1]) for (let row = 1; row <= battenRows; row++) {
      const normalizedZ = row / (battenRows + 1)
      const detailZ = z + side * depth * normalizedZ * 0.5
      const detailY = eaveY + rise * (1 - normalizedZ * 0.94) + 0.035
      const detailWidth = width * (0.92 - row * 0.10)
      this.roofDetailBox(detailWidth, 0.035, 0.075, x, detailY, detailZ)
    }
    // Shadowed, structurally aligned soffit members keep the broad eaves grounded.
    this.soffitBox(width - 0.30, 0.065, 0.50, x, eaveY - 0.14, z + depth / 2 - 0.31)
    this.soffitBox(width - 0.30, 0.065, 0.50, x, eaveY - 0.14, z - depth / 2 + 0.31)
    this.roofDetailBox(width * 0.88, 0.04, 0.09, x, eaveY + 0.14, z + depth / 2 - 0.20)
    this.roofDetailBox(width * 0.88, 0.04, 0.09, x, eaveY + 0.14, z - depth / 2 + 0.20)
    for (let rafter = -width / 2 + 0.42; rafter < width / 2; rafter += 0.68) {
      this.trimBox(0.06, 0.09, 0.52, x + rafter, eaveY - 0.13, z + depth / 2 - 0.32)
      this.trimBox(0.06, 0.09, 0.52, x + rafter, eaveY - 0.13, z - depth / 2 + 0.32)
    }
  }

  /** Four shallow bands leave a clear well around the setback upper residence. */
  private createLowerSkirtRoof(material: PavilionMaterial): void {
    const outerWidth = this.lowerWidth + GardenPavilion.ROOF_OVERHANG * 2
    const outerDepth = this.lowerDepth + GardenPavilion.ENGAWA_DEPTH * 2 + GardenPavilion.ROOF_OVERHANG * 2
    const openingWidth = GardenPavilion.ARCHITECTURE.upperCols * GardenPavilion.BAY_X * 0.96 + 0.44
    const openingDepth = GardenPavilion.ARCHITECTURE.upperRows * GardenPavilion.BAY_Z * 0.96 + 0.44
    const centerZ = GardenPavilion.UPPER_PLAN_CENTER_Z
    const eaveY = GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT + 0.18
    const frontDepth = (outerDepth - openingDepth) / 2
    const sideWidth = (outerWidth - openingWidth) / 2
    const outerFront = centerZ + outerDepth / 2
    const outerRear = centerZ - outerDepth / 2
    const openingFront = centerZ + openingDepth / 2
    const openingRear = centerZ - openingDepth / 2

    // `innerAtPositiveAxis` makes the eave/upper-residence relationship explicit.
    this.createSkirtBand(outerWidth, frontDepth, 0, (outerFront + openingFront) / 2, eaveY, 1.02, 'z', false, material, 'pavilion-skirt-front')
    this.createSkirtBand(outerWidth, frontDepth, 0, (outerRear + openingRear) / 2, eaveY, 0.80, 'z', true, material, 'pavilion-skirt-rear')
    this.createSkirtBand(sideWidth, openingDepth, -(openingWidth + sideWidth) / 2, centerZ, eaveY, 0.70, 'x', true, material, 'pavilion-skirt-left')
    this.createSkirtBand(sideWidth, openingDepth, (openingWidth + sideWidth) / 2, centerZ, eaveY, 0.70, 'x', false, material, 'pavilion-skirt-right')
  }

  private createSkirtBand(width: number, depth: number, x: number, z: number, eaveY: number, rise: number, axis: 'x' | 'z', innerAtPositiveAxis: boolean, material: PavilionMaterial, name: string): void {
    const geometry = this.createSkirtBandGeometry(width, depth, rise, axis, innerAtPositiveAxis)
    this.geometries.push(geometry)
    const mesh = new Mesh(geometry, material)
    mesh.name = name
    mesh.position.set(x, eaveY, z)
    this.root.add(mesh)
    if (axis === 'z') {
      const outerZ = z + (innerAtPositiveAxis ? -depth / 2 : depth / 2)
      const innerZ = z + (innerAtPositiveAxis ? depth / 2 : -depth / 2)
      this.trimBox(width + 0.05, 0.18, 0.17, x, eaveY + 0.015, outerZ)
      this.trimBox(width + 0.04, 0.16, 0.19, x, eaveY + rise - 0.035, innerZ)
      this.soffitBox(width - 0.2, 0.065, 0.42, x, eaveY + rise - 0.16, innerZ + (innerAtPositiveAxis ? -0.18 : 0.18))
      this.soffitBox(width - 0.24, 0.09, 0.48, x, eaveY - 0.12, outerZ + (innerAtPositiveAxis ? 0.19 : -0.19))
      for (let rafter = -width / 2 + 0.36; rafter < width / 2; rafter += 0.62) this.trimBox(0.06, 0.055, 0.50, x + rafter, eaveY - 0.16, outerZ + (innerAtPositiveAxis ? 0.2 : -0.2))
    } else {
      const outerX = x + (innerAtPositiveAxis ? -width / 2 : width / 2)
      const innerX = x + (innerAtPositiveAxis ? width / 2 : -width / 2)
      this.trimBox(0.17, 0.18, depth + 0.04, outerX, eaveY + 0.015, z)
      this.trimBox(0.19, 0.16, depth + 0.03, innerX, eaveY + rise - 0.035, z)
      this.soffitBox(0.42, 0.065, depth - 0.2, innerX + (innerAtPositiveAxis ? -0.18 : 0.18), eaveY + rise - 0.16, z)
      this.soffitBox(0.48, 0.09, depth - 0.24, outerX + (innerAtPositiveAxis ? 0.19 : -0.19), eaveY - 0.12, z)
      for (let rafter = -depth / 2 + 0.36; rafter < depth / 2; rafter += 0.60) this.trimBox(0.50, 0.055, 0.06, outerX + (innerAtPositiveAxis ? 0.2 : -0.2), eaveY - 0.16, z + rafter)
    }
  }

  private createSkirtBandGeometry(width: number, depth: number, rise: number, axis: 'x' | 'z', innerAtPositiveAxis: boolean): BufferGeometry {
    const heights = (x: number, z: number) => {
      const t = axis === 'x' ? (x / width + 0.5) : (z / depth + 0.5)
      const towardInnerEdge = innerAtPositiveAxis ? t : 1 - t
      return rise * towardInnerEdge
    }
    const vertices: number[] = []
    for (const underside of [false, true]) for (const [x, z] of [[-width / 2, -depth / 2], [width / 2, -depth / 2], [width / 2, depth / 2], [-width / 2, depth / 2]]) vertices.push(x, heights(x, z) - (underside ? 0.13 : 0), z)
    const indices = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0]
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals()
    return geometry
  }

  /** A shallow hip resolves into a long ridge with a restrained lift only at its outer corners. */
  private createSampledRoofGeometry(width: number, depth: number, rise: number, xSegments: number, zSegments: number): BufferGeometry {
    const vertices: number[] = []
    const indices: number[] = []
    const roofY = (x: number, z: number) => {
      const nx = Math.abs(x) / (width / 2); const nz = Math.abs(z) / (depth / 2)
      const hip = Math.max(0, (nx - 0.46) / 0.54)
      const shoulder = Math.max(hip, nz * 0.94)
      const eased = 1 - Math.min(1, shoulder) ** 1.16
      const cornerProgress = Math.max(0, Math.min(1, (nx + nz - 1.50) / 0.50))
      const cornerLift = cornerProgress * cornerProgress * (3 - cornerProgress * 2) * Math.min(0.13, rise * 0.14)
      return rise * eased + cornerLift
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
    this.timberBox(this.lowerWidth + 0.42, 0.20, depth, 0, floorY + 0.10, centerZ)
    this.soffitBox(this.lowerWidth + 0.26, 0.10, depth - 0.08, 0, floorY - 0.06, centerZ)
    this.trimBox(this.lowerWidth + 0.46, 0.15, 0.17, 0, floorY + 0.24, front + depth)
    this.trimBox(this.lowerWidth + 0.38, 0.12, 0.14, 0, floorY + 0.18, front + 0.04)
    for (let plank = 0; plank < 6; plank++) {
      const z = front + 0.18 + (plank + 0.5) * (depth - 0.36) / 6
      this.trimBox(this.lowerWidth - 0.14, 0.032, 0.055, 0, floorY + 0.218, z)
    }
    for (let column = 0; column <= GardenPavilion.LOWER_COLS; column++) {
      const x = this.gridX(column)
      this.trimBox(0.08, 0.09, depth - 0.1, x, floorY + 0.21, centerZ)
      this.timberBox(0.24, 0.58, depth - 0.26, x, floorY - 0.20, centerZ)
      this.addPost(x, floorY - 0.10, front + depth, 0.62)
    }
    this.addRailSection(3.45, -8.10, floorY + 0.22, front + depth + 0.02, 0.54)
    this.addRailSection(3.45, 8.10, floorY + 0.22, front + depth + 0.02, 0.54)
  }

  /** Two calm upper rail runs imply private residential rooms while leaving the central axis open. */
  private createUpperVerandaRails(width: number, floorY: number, z: number): void {
    const sectionWidth = width * 0.23
    const offset = width * 0.34
    this.addRailSection(sectionWidth, -offset, floorY + 0.10, z, 0.68)
    this.addRailSection(sectionWidth, offset, floorY + 0.10, z, 0.68)
  }

  private addRailSection(width: number, x: number, deckY: number, z: number, height: number): void {
    this.trimBox(width, 0.075, 0.09, x, deckY + 0.06, z)
    this.trimBox(width, 0.075, 0.09, x, deckY + height, z)
    for (let post = 0; post <= 3; post++) {
      const postX = x - width / 2 + post * width / 3
      this.trimBox(0.07, height, 0.09, postX, deckY + height / 2, z)
    }
  }

  /** A deep, centred genkan porch converts the engawa from trim into a usable arrival room. */
  private createGrandEntrance(x: number, floorY: number, front: number): void {
    const width = GardenPavilion.BAY_X * 2.75
    const depth = GardenPavilion.ENGAWA_DEPTH + 0.58
    const y = floorY + GardenPavilion.LOWER_HEIGHT * 0.49
    const porchFront = front + depth
    this.timberBox(width + 0.34, 0.18, depth, x, floorY + 0.17, front + depth / 2)
    this.foundationBox(width + 0.72, 0.17, 0.78, x, floorY - 0.18, porchFront + 0.18)
    this.foundationBox(width * 0.76, 0.14, 0.52, x, floorY - 0.05, porchFront + 0.51)
    this.foundationBox(width * 0.50, 0.11, 0.34, x, floorY + 0.07, porchFront + 0.74)
    this.trimBox(width + 0.36, 0.15, 0.16, x, floorY + 0.29, porchFront)
    this.addPost(x - width / 2, y, porchFront, GardenPavilion.LOWER_HEIGHT - 0.12)
    this.addPost(x + width / 2, y, porchFront, GardenPavilion.LOWER_HEIGHT - 0.12)
    this.addPost(x, y, porchFront, GardenPavilion.LOWER_HEIGHT - 0.12)
    this.addBeamX(width + 0.30, floorY + GardenPavilion.LOWER_HEIGHT - 0.04, porchFront)
    this.trimBox(width + 0.48, 0.20, 0.24, x, floorY + GardenPavilion.LOWER_HEIGHT - 0.13, porchFront)
    this.trimBox(width * 0.82, 0.09, 0.16, x, floorY + GardenPavilion.LOWER_HEIGHT - 0.52, porchFront - 0.03)
    this.paperBox(width * 0.42, GardenPavilion.LOWER_HEIGHT - 0.72, 0.06, x - width * 0.25, y, front - 0.14, 'quiet')
    this.paperBox(width * 0.36, GardenPavilion.LOWER_HEIGHT - 0.72, 0.06, x + width * 0.28, y, front - 0.14, 'warm')
    this.addFrontInteriorCue(x + width * 0.28, y, front - 0.32, width * 0.36, GardenPavilion.LOWER_HEIGHT - 0.72, 'warm')
    this.trimBox(0.08, GardenPavilion.LOWER_HEIGHT - 0.68, 0.1, x - width * 0.03, y, front - 0.08)
    this.createGrandEntranceFrame(x, floorY, front, width, depth)
  }

  /** Nested timber posts and a shadowed ceiling give the threshold a residential, not temple-like, ceremony. */
  private createGrandEntranceFrame(x: number, floorY: number, front: number, width: number, depth: number): void {
    const frameZ = front + depth * 0.44
    const frameHeight = GardenPavilion.LOWER_HEIGHT - 0.72
    const frameY = floorY + frameHeight / 2 + 0.16
    const opening = width * 0.62
    this.timberBox(0.24, frameHeight, 0.24, x - opening / 2, frameY, frameZ)
    this.timberBox(0.24, frameHeight, 0.24, x + opening / 2, frameY, frameZ)
    this.trimBox(opening + 0.36, 0.20, 0.28, x, frameY + frameHeight / 2 - 0.06, frameZ)
    this.soffitBox(opening, 0.10, 0.88, x, frameY + frameHeight / 2 - 0.20, frameZ - 0.32)
    this.trimBox(opening * 0.76, 0.07, 0.12, x, floorY + 0.38, frameZ + 0.04)
  }

  /** A compact roofed genkan gives the path an unmistakable ceremonial destination. */
  private createGrandEntranceCanopy(material: PavilionMaterial): void {
    const front = this.gridZ(GardenPavilion.LOWER_ROWS)
    const width = GardenPavilion.BAY_X * 3.38
    const depth = GardenPavilion.ENGAWA_DEPTH + 1.46
    const eaveY = GardenPavilion.FLOOR_Y + GardenPavilion.LOWER_HEIGHT - 0.42
    const z = front + depth * 0.5
    this.createRoof(width, depth, 0.58, eaveY, z, material, 'pavilion-grand-genkan-canopy', 0, 0.38, 2)
    this.soffitBox(width - 0.24, 0.10, 0.68, 0, eaveY - 0.15, front + depth - 0.36)
    this.trimBox(width + 0.28, 0.20, 0.20, 0, eaveY + 0.04, front + depth)
    this.roofDetailBox(width * 0.46, 0.045, 0.11, 0, eaveY + 0.69, z)
  }

  private addShojiBay(axis: number, y: number, edge: number, width: number, height: number, side: boolean,
    tone: InteriorTone = 'cool'): void {
    if (side) {
      this.paperBox(0.055, height, width, edge, y, axis, tone)
      this.trimBox(0.08, height, 0.08, edge, y, axis - width / 2)
      this.trimBox(0.08, height, 0.08, edge, y, axis + width / 2)
      this.trimBox(0.08, 0.06, width - 0.1, edge, y + height * 0.18, axis)
      this.trimBox(0.08, 0.06, width - 0.1, edge, y - height * 0.18, axis)
    } else {
      this.paperBox(width, height, 0.055, axis, y, edge, tone)
      this.trimBox(width + 0.08, 0.07, 0.08, axis, y + height / 2, edge)
      this.trimBox(width + 0.08, 0.07, 0.08, axis, y - height / 2, edge)
      this.trimBox(0.065, height - 0.1, 0.08, axis, y, edge)
      this.trimBox(width - 0.1, 0.06, 0.08, axis, y + height * 0.18, edge)
      this.trimBox(width - 0.1, 0.06, 0.08, axis, y - height * 0.18, edge)
    }
  }

  /** Timber returns and a rear shoji plane give every front bay an actual threshold depth. */
  private addRecessedFrontBay(x: number, y: number, front: number, width: number, height: number, tone: InteriorTone, recess: number): void {
    const screenZ = front - recess
    this.addShojiBay(x, y, screenZ, width, height, false, tone)
    this.addFrontInteriorCue(x, y, screenZ - 0.25, width, height, tone)
    this.trimBox(0.12, height + 0.12, recess, x - width / 2, y, front - recess / 2)
    this.trimBox(0.12, height + 0.12, recess, x + width / 2, y, front - recess / 2)
    this.soffitBox(width - 0.16, 0.08, recess - 0.08, x, y + height / 2 + 0.03, front - recess / 2)
    this.trimBox(width - 0.12, 0.07, recess, x, y - height / 2 + 0.08, front - recess / 2)
  }

  /** Sparse recessed backing panels imply rooms beyond the front shoji without a furnished interior. */
  private addFrontInteriorCue(x: number, y: number, z: number, width: number, height: number, tone: InteriorTone): void {
    if (tone === 'cool') {
      this.interiorShadowParts.push({
        size: [width * 0.24, height * 0.62, 0.07], position: [x - width * 0.18, y - height * 0.06, z + 0.04],
      })
      return
    }
    const parts = tone === 'warm' ? this.warmInteriorParts : this.quietInteriorParts
    parts.push({ size: [width - 0.18, height - 0.22, 0.055], position: [x, y, z] })
    if (tone === 'warm') {
      this.interiorShadowParts.push({
        size: [width * 0.22, height * 0.58, 0.07], position: [x + width * 0.18, y - height * 0.08, z + 0.045],
      })
    }
  }

  private addPost(x: number, y: number, z: number, height: number): void {
    this.timberBox(0.19, height, 0.19, x, y, z)
    this.trimBox(0.27, 0.09, 0.27, x, y - height / 2 + 0.045, z)
  }
  private addBeamX(width: number, y: number, z: number): void { this.timberBox(width, 0.2, 0.22, 0, y, z) }
  private addBeamZ(depth: number, y: number, x: number, z = 0): void { this.timberBox(0.22, 0.2, depth, x, y, z) }

  private flushBoxes(parts: BoxPart[], material: PavilionMaterial, name: string): void {
    const mesh = new InstancedMesh(this.boxGeometry, material, parts.length)
    mesh.name = name
    parts.forEach((part, index) => {
      this.position.set(...part.position); this.scale.set(...part.size)
      this.rotation.setFromEuler(this.euler.set(0, 0, 0)); this.matrix.compose(this.position, this.rotation, this.scale)
      mesh.setMatrixAt(index, this.matrix)
      if (material.vertexColors) {
        const variation = this.deterministicVariation(part.position, index)
        this.instanceColor.setRGB(variation * 1.015, variation, variation * 0.95)
        mesh.setColorAt(index, this.instanceColor)
      }
    })
    mesh.instanceMatrix.needsUpdate = true; this.root.add(mesh)
  }
  private deterministicVariation(position: readonly [number, number, number], index: number): number {
    const seed = Math.sin(position[0] * 12.9898 + position[1] * 78.233 + position[2] * 37.719 + index * 0.193) * 43758.5453
    return 0.965 + (seed - Math.floor(seed)) * 0.07
  }
  private timberBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.timberParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private trimBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.trimParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private soffitBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.soffitParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private roofDetailBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.roofDetailParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private paperBox(width: number, height: number, depth: number, x: number, y: number, z: number, tone: InteriorTone = 'cool'): void {
    const parts = tone === 'warm' ? this.warmPaperParts : tone === 'quiet' ? this.quietPaperParts : this.paperParts
    parts.push({ size: [width, height, depth], position: [x, y, z] })
  }
  private coreBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.coreParts.push({ size: [width, height, depth], position: [x, y, z] }) }
  private foundationBox(width: number, height: number, depth: number, x: number, y: number, z: number): void { this.foundationParts.push({ size: [width, height, depth], position: [x, y, z] }) }
}
