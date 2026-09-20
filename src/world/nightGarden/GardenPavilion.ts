import {
  BoxGeometry, BufferGeometry, Euler, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Vector3,
} from 'three'
import type { Group as ThreeGroup } from 'three'

type PavilionMaterial = MeshStandardMaterial
type BoxPart = {
  size: readonly [number, number, number]
  position: readonly [number, number, number]
  rotation?: readonly [number, number, number]
}

/** A two-tier residence assembled from a compact, repeated architectural vocabulary. */
export class GardenPavilion {
  private readonly root = new Group()
  private readonly boxGeometry = new BoxGeometry(1, 1, 1)
  private readonly materials: PavilionMaterial[] = []
  private readonly roofGeometries: BufferGeometry[] = []
  private readonly timberParts: BoxPart[] = []
  private readonly trimParts: BoxPart[] = []
  private readonly paperParts: BoxPart[] = []
  private readonly foundationParts: BoxPart[] = []
  private readonly matrix = new Matrix4()
  private readonly position = new Vector3()
  private readonly scale = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly euler = new Euler()
  private paper!: PavilionMaterial

  constructor(parent: ThreeGroup) {
    this.root.name = 'garden-pavilion-residence'
    // Preserve the established destination; local height compensates for the scene's compressed Y scale.
    this.root.position.set(5.15, -5.6, -31.2)
    this.root.rotation.y = -0.035
    this.root.scale.set(1.3, 0.62, 1.3)
    parent.add(this.root)

    const foundation = this.material('#182426', 0.9)
    const timber = this.material('#263638', 0.76)
    const trim = this.material('#53635f', 0.7)
    this.paper = this.material('#b8b9ad', 0.84, '#5c625e', 0.05)
    const roof = this.material('#18242a', 0.8)

    this.createFoundation()
    this.createLowerResidence()
    this.createUpperResidence()
    this.createRoofMass(7.5, 5.4, 1.86, 0.15, 5.42, 0.08, roof, false)
    this.createRoofMass(4.9, 3.34, 1.48, 0.13, 8.9, -0.78, roof, true)
    this.flushBoxes(this.foundationParts, foundation, 'pavilion-foundation')
    this.flushBoxes(this.timberParts, timber, 'pavilion-timber')
    this.flushBoxes(this.trimParts, trim, 'pavilion-trim-and-lattice')
    this.flushBoxes(this.paperParts, this.paper, 'pavilion-shoji')
  }

  setIntensity(value: number): void {
    // Screens remain subtly cool and legible without introducing pavilion lighting in this pass.
    this.paper.emissiveIntensity = 0.05 * value
  }

  dispose(): void {
    this.root.removeFromParent()
    this.root.clear()
    this.boxGeometry.dispose()
    this.roofGeometries.forEach(geometry => geometry.dispose())
    this.materials.forEach(material => material.dispose())
  }

  private createFoundation(): void {
    // Stepped, inset plinths keep the raised residence grounded without a monolithic slab read.
    this.foundationBox(6.18, 0.28, 3.88, 0, 1.78, -0.12)
    this.foundationBox(5.84, 0.16, 3.48, 0, 2.0, -0.08)
    this.timberBox(6.22, 0.16, 3.96, 0, 2.22, 0)
    // A deep, supported engawa establishes garden → veranda → post → screen depth.
    this.foundationBox(6.7, 0.22, 1.64, 0, 2.18, 2.42)
    this.timberBox(6.6, 0.18, 1.58, 0, 2.42, 2.42)
    for (const x of [-2.92, -1.94, -0.97, 0, 0.97, 1.94, 2.92]) {
      this.trimBox(0.08, 0.1, 1.48, x, 2.54, 2.42)
      this.trimBox(0.16, 0.7, 0.16, x, 2.03, 2.86)
    }
    for (const x of [-2.55, -1.28, 0, 1.28, 2.55]) this.foundationBox(0.36, 0.3, 0.38, x, 1.82, 2.3)
    this.trimBox(6.72, 0.12, 0.15, 0, 2.54, 3.17)
    this.trimBox(6.72, 0.12, 0.15, 0, 2.54, 1.66)
  }

  private createLowerResidence(): void {
    const bays = [-2.7, -1.35, 0, 1.35, 2.7]
    // Posts in front of recessed panels establish a deep, readable facade.
    for (const x of bays) {
      this.createPost(x, 3.9, 1.62, 3.15)
      this.createPost(x, 3.9, -1.62, 3.15)
    }
    this.createBeam(6.02, 0.22, 0.24, 0, 5.34, 1.62)
    this.createBeam(6.02, 0.22, 0.24, 0, 5.34, -1.62)
    this.createBeam(0.22, 0.22, 3.48, -3.02, 5.34, 0)
    this.createBeam(0.22, 0.22, 3.48, 3.02, 5.34, 0)
    this.createBeam(6.24, 0.16, 0.18, 0, 4.98, 1.62)
    this.createBeam(6.24, 0.16, 0.18, 0, 4.98, -1.62)

    // Three narrow shoji bays leave a dedicated recessed entrance at the left.
    for (const x of [-0.675, 0.675, 2.025]) this.createShojiPanel(x, 3.8, 1.22, 1.0, 2.34, 2)
    for (const z of [-0.92, 0.12]) this.createSideShoji(2.8, 3.78, z, 1.28, 2.5)

    // A recessed left-hand entry breaks the screen rhythm without becoming an ornate focal point.
    // Its outer frame remains forward of a complete tunnel-like reveal, unlike the normal shoji bays.
    this.timberBox(1.34, 0.12, 0.76, -2.02, 2.62, 1.1)
    this.trimBox(1.22, 0.14, 0.16, -2.02, 2.91, 1.05)
    this.trimBox(0.12, 2.1, 0.16, -2.58, 3.84, 1.05)
    this.trimBox(0.12, 2.1, 0.16, -1.46, 3.84, 1.05)
    this.trimBox(1.16, 0.12, 0.14, -2.02, 4.84, 1.05)
    // Jambs, soffit, and inset floor form a real architectural reveal from z 1.05 to -0.1.
    this.timberBox(0.16, 1.9, 1.14, -2.43, 3.62, 0.47)
    this.timberBox(0.16, 1.9, 1.14, -1.61, 3.62, 0.47)
    this.timberBox(0.98, 0.14, 1.14, -2.02, 4.61, 0.47)
    this.timberBox(0.98, 0.1, 0.94, -2.02, 2.66, 0.56)
    this.trimBox(0.84, 0.12, 0.14, -2.02, 2.74, -0.03)
    this.paperBox(0.72, 1.72, 0.055, -2.02, 3.66, -0.1)
    this.trimBox(0.07, 1.62, 0.08, -2.02, 3.66, -0.06)
    this.trimBox(0.62, 0.065, 0.08, -2.02, 3.66, -0.06)
  }

  private createUpperResidence(): void {
    // The upper storey is deliberately narrower and pulled back beneath the wider lower roof.
    this.timberBox(4.18, 0.18, 2.26, 0.18, 6.35, -0.78)
    for (const x of [-1.65, -0.44, 0.78, 1.98]) {
      this.createPost(x, 7.48, 0.04, 2.05)
      this.createPost(x, 7.48, -1.56, 2.05)
    }
    this.createBeam(4.26, 0.2, 0.22, 0.18, 8.6, 0.04)
    this.createBeam(4.26, 0.2, 0.22, 0.18, 8.6, -1.56)
    this.createBeam(4.4, 0.15, 0.16, 0.18, 8.28, 0.04)
    for (const x of [-1.04, 0.18, 1.4]) this.createShojiPanel(x, 7.45, -0.03, 0.86, 1.72, 2)
    this.createSideShoji(2.08, 7.45, -0.76, 1.35, 1.72)
  }

  private createRoofMass(width: number, depth: number, rise: number, thickness: number, eaveY: number, z: number, material: PavilionMaterial, upper: boolean): void {
    const geometry = this.createHippedRoofGeometry(width, depth, rise, thickness, upper ? 0.43 : 0.5, upper ? 0.055 : 0.075)
    this.roofGeometries.push(geometry)
    const mesh = new Mesh(geometry, material)
    mesh.name = upper ? 'pavilion-upper-pitched-roof' : 'pavilion-primary-pitched-roof'
    mesh.position.set(0, eaveY, z)
    this.root.add(mesh)

    // Fine fascia and a recessed soffit make the roof feel layered rather than slab-like.
    this.trimBox(width + 0.04, 0.075, 0.11, 0, eaveY + 0.1, z + depth / 2)
    this.trimBox(width + 0.04, 0.075, 0.11, 0, eaveY + 0.1, z - depth / 2)
    this.trimBox(0.1, 0.075, depth - 0.22, -width / 2, eaveY + 0.1, z)
    this.trimBox(0.1, 0.075, depth - 0.22, width / 2, eaveY + 0.1, z)
    this.trimBox(width * (upper ? 0.43 : 0.5), 0.1, 0.13, 0, eaveY + rise + 0.02, z)
    this.trimBox(width - 0.58, 0.1, 0.1, 0, eaveY - 0.18, z + depth / 2 - 0.25)
    this.trimBox(width - 0.58, 0.1, 0.1, 0, eaveY - 0.18, z - depth / 2 + 0.25)
    // Rafters are expressed as shadowed soffit members, not bright strips laid across the roof skin.
    for (let x = -width * 0.27; x <= width * 0.27; x += 1.08) {
      this.trimBox(0.065, 0.07, 0.5, x, eaveY - 0.2, z + depth / 2 - 0.42)
      this.trimBox(0.065, 0.07, 0.5, x, eaveY - 0.2, z - depth / 2 + 0.42)
    }
  }

  private createPost(x: number, y: number, z: number, height: number): void {
    this.timberBox(0.18, height, 0.18, x, y, z)
    this.trimBox(0.25, 0.1, 0.25, x, y - height / 2 + 0.05, z)
  }

  private createBeam(width: number, height: number, depth: number, x: number, y: number, z: number): void {
    this.timberBox(width, height, depth, x, y, z)
  }

  private createShojiPanel(x: number, y: number, z: number, width: number, height: number, columns = 2): void {
    this.paperBox(width, height, 0.05, x, y, z)
    this.trimBox(width + 0.12, 0.1, 0.1, x, y + height / 2, z + 0.035)
    this.trimBox(width + 0.12, 0.1, 0.1, x, y - height / 2, z + 0.035)
    this.trimBox(0.1, height, 0.1, x - width / 2, y, z + 0.035)
    this.trimBox(0.1, height, 0.1, x + width / 2, y, z + 0.035)
    for (let column = 1; column < columns; column++) {
      const offset = -width / 2 + width * column / columns
      this.trimBox(0.065, height - 0.12, 0.075, x + offset, y, z + 0.055)
    }
    this.trimBox(width - 0.12, 0.065, 0.075, x, y + height * 0.17, z + 0.055)
    this.trimBox(width - 0.12, 0.065, 0.075, x, y - height * 0.17, z + 0.055)
  }

  private createSideShoji(x: number, y: number, z: number, depth: number, height: number): void {
    this.paperBox(0.05, height, depth, x, y, z)
    this.trimBox(0.1, height, 0.1, x, y, z - depth / 2)
    this.trimBox(0.1, height, 0.1, x, y, z + depth / 2)
    this.trimBox(0.1, 0.07, depth - 0.1, x, y + height * 0.18, z)
    this.trimBox(0.1, 0.07, depth - 0.1, x, y - height * 0.18, z)
  }

  private createHippedRoofGeometry(width: number, depth: number, rise: number, thickness: number, ridgeRatio: number, eaveLift: number): BufferGeometry {
    const halfWidth = width / 2
    const halfDepth = depth / 2
    const ridgeWidth = width * ridgeRatio / 2
    const vertices = new Float32Array([
      -halfWidth, eaveLift, halfDepth, halfWidth, eaveLift, halfDepth, -ridgeWidth, rise, 0, ridgeWidth, rise, 0, -halfWidth, eaveLift, -halfDepth, halfWidth, eaveLift, -halfDepth,
      -halfWidth, eaveLift - thickness, halfDepth, halfWidth, eaveLift - thickness, halfDepth, -ridgeWidth, rise - thickness, 0, ridgeWidth, rise - thickness, 0, -halfWidth, eaveLift - thickness, -halfDepth, halfWidth, eaveLift - thickness, -halfDepth,
    ])
    const indices = [
      0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4, 0, 2, 4, 1, 5, 3,
      6, 9, 7, 6, 8, 9, 8, 11, 9, 8, 10, 11, 6, 10, 8, 7, 9, 11,
      0, 6, 7, 0, 7, 1, 4, 5, 11, 4, 11, 10, 0, 4, 10, 0, 10, 6, 1, 7, 11, 1, 11, 5,
      2, 3, 9, 2, 9, 8,
    ]
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }

  private flushBoxes(parts: BoxPart[], material: PavilionMaterial, name: string): void {
    const mesh = new InstancedMesh(this.boxGeometry, material, parts.length)
    mesh.name = name
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]
      this.position.set(...part.position)
      this.scale.set(...part.size)
      const rotation = part.rotation ?? [0, 0, 0]
      this.rotation.setFromEuler(this.euler.set(...rotation))
      this.matrix.compose(this.position, this.rotation, this.scale)
      mesh.setMatrixAt(index, this.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    this.root.add(mesh)
  }

  private material(color: string, roughness: number, emissive = '#000000', emissiveIntensity = 0): PavilionMaterial {
    const material = new MeshStandardMaterial({ color, roughness, metalness: 0.03, emissive, emissiveIntensity })
    this.materials.push(material)
    return material
  }

  private timberBox(width: number, height: number, depth: number, x: number, y: number, z: number): void {
    this.timberParts.push({ size: [width, height, depth], position: [x, y, z] })
  }

  private trimBox(width: number, height: number, depth: number, x: number, y: number, z: number, rotation?: readonly [number, number, number]): void {
    this.trimParts.push({ size: [width, height, depth], position: [x, y, z], rotation })
  }

  private paperBox(width: number, height: number, depth: number, x: number, y: number, z: number): void {
    this.paperParts.push({ size: [width, height, depth], position: [x, y, z] })
  }

  private foundationBox(width: number, height: number, depth: number, x: number, y: number, z: number): void {
    this.foundationParts.push({ size: [width, height, depth], position: [x, y, z] })
  }
}
