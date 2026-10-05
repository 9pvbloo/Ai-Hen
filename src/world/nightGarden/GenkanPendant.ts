import { CylinderGeometry, Group, Mesh, SphereGeometry, TorusGeometry } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { GenkanInteriorMaterials } from './GenkanInteriorMaterials'

export const GENKAN_PENDANT = { x: -.55, y: 5.08, z: -4.65, radius: .36, squash: .88 } as const

/** Two owned meshes borrow interior finishes; fine ribs are real silhouettes, not stripes. */
export class GenkanPendant {
  private readonly root = new Group()
  private readonly geometries: BufferGeometry[] = []
  private disposed = false

  constructor(parent: Group, materials: GenkanInteriorMaterials) {
    const { x, y, z, radius, squash } = GENKAN_PENDANT
    this.root.name = 'genkan-washi-pendant'
    this.root.position.set(x, y, z)
    const paper = new SphereGeometry(radius, 40, 24).scale(1, squash, 1)
    const ribs: BufferGeometry[] = []
    for (let i = 1; i < 12; i++) {
      const theta = i / 12 * Math.PI
      ribs.push(new TorusGeometry(radius * Math.sin(theta) + .0015, .0024, 4, 40)
        .rotateX(Math.PI / 2).translate(0, Math.cos(theta) * radius * squash, 0))
    }
    for (let i = 0; i < 4; i++) ribs.push(new TorusGeometry(radius + .002, .0018, 4, 48)
      .scale(1, squash, 1).rotateY(i * Math.PI / 4))
    ribs.push(new CylinderGeometry(.006,.006,.46,8).translate(0,.54,0))
    for (const sign of [-1,1]) ribs.push(new CylinderGeometry(.055,.055,.018,16).translate(0,sign*.313,0))
    const frame = mergeGeometries(ribs)!
    ribs.forEach(g=>g.dispose())
    this.geometries.push(paper,frame)
    const shade = new Mesh(paper, materials.palette.lampPaper)
    shade.name = 'genkan-pendant-paper'
    const skeleton = new Mesh(frame, materials.palette.trim)
    skeleton.name = 'genkan-pendant-ribs'
    this.root.add(shade,skeleton); parent.add(this.root)
  }

  dispose(): void {
    if(this.disposed)return
    this.disposed=true
    this.geometries.forEach(g=>g.dispose())
    this.root.removeFromParent();this.root.clear()
  }
}
