import { CylinderGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, Quaternion, SphereGeometry, Vector2, Vector3 } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { GenkanInteriorMaterials } from './GenkanInteriorMaterials'
import { GENKAN_INTERIOR as D } from './GenkanInteriorDimensions'

/** One quiet side arrangement. Construction is static; borrowed finishes stay with the room. */
export class GenkanInteriorFlowers {
  readonly root = new Group()
  private readonly geometries: BufferGeometry[] = []
  private readonly petals = new MeshStandardMaterial({ color: '#dddcd1', roughness: .94 })
  private disposed = false

  constructor(parent: Group, materials: GenkanInteriorMaterials) {
    this.root.name = 'genkan-ikebana'
    this.root.position.set(-1.72, D.raisedY + .14, -5.53)
    this.petals.name = 'genkan-blossom-ivory'
    // Closed foot and an inset inner neck: a physical vessel, not a capped solid cylinder.
    const vase = new LatheGeometry([
      [0, 0], [.10, 0], [.15, .05], [.17, .17], [.12, .25],
      [.09, .28], [.077, .27], [.07, .11], [0, .08],
    ].map(([x, y]) => new Vector2(x, y)), 16)
    this.add('genkan-stoneware-vase', vase, materials.palette.stone)
    const stems: BufferGeometry[] = [], flowers: BufferGeometry[] = []
    const up = new Vector3(0, 1, 0)
    const branch = (points: number[][], thickness: number): void => {
      for (let i = 1; i < points.length; i++) {
        const a = new Vector3(...points[i - 1]), b = new Vector3(...points[i])
        const direction = b.clone().sub(a)
        const geometry = new CylinderGeometry(thickness * .55, thickness, direction.length(), 5)
        geometry.applyQuaternion(new Quaternion().setFromUnitVectors(up, direction.clone().normalize()))
        geometry.translate(...a.add(b).multiplyScalar(.5).toArray()); stems.push(geometry)
      }
    }
    // Three independent stems: upright, lateral and low counterweight, with open air between.
    branch([[0, .12, 0], [.01, .55, -.05], [-.04, .91, -.15], [.02, 1.28, -.27]], .010)
    branch([[.025, .13, .01], [.12, .43, .13], [.20, .65, .32], [.27, .77, .43]], .008)
    branch([[-.02, .13, -.02], [-.08, .37, -.15], [-.11, .48, -.37]], .007)
    for (const [x, y, z] of [[.02, 1.28, -.27], [.27, .77, .43], [-.11, .48, -.37]]) {
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal * Math.PI * 2 / 5
        const geometry = new SphereGeometry(1, 6, 4)
        geometry.scale(.017, .029, .009); geometry.rotateZ(angle)
        geometry.translate(x - Math.sin(angle) * .021, y + Math.cos(angle) * .021, z)
        flowers.push(geometry)
      }
    }
    this.add('genkan-ikebana-branches', mergeGeometries(stems)!, materials.palette.timber)
    this.add('genkan-ikebana-blossoms', mergeGeometries(flowers)!, this.petals)
    for (const geometry of [...stems, ...flowers]) geometry.dispose()
    parent.add(this.root)
  }

  private add(name: string, geometry: BufferGeometry, material: MeshStandardMaterial): void {
    this.geometries.push(geometry)
    const mesh = new Mesh(geometry, material); mesh.name = name; this.root.add(mesh)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.root.removeFromParent(); this.root.clear()
    for (const geometry of this.geometries) geometry.dispose()
    this.geometries.length = 0; this.petals.dispose()
  }
}
