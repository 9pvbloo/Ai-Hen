import { DirectionalLight, Mesh, MeshDepthMaterial, MeshStandardMaterial, SpotLight } from 'three'
import type { Group } from 'three'

/** Explicit semantic allowlist. FX, paper, small planting and backdrop cards never cast. */
export class GardenShadows {
  private readonly depth = new MeshDepthMaterial()
  private readonly lights: (DirectionalLight | SpotLight)[] = []
  private doorProgress = -1

  constructor(root: Group) {
    root.traverse(node => {
      if ((node instanceof DirectionalLight || node instanceof SpotLight) && node.castShadow) this.lights.push(node)
      if (!(node instanceof Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      if (!materials.every(m => m instanceof MeshStandardMaterial && !m.transparent)) return
      const name = node.name
      const architecture = name.startsWith('pavilion-') || name.startsWith('genkan-')
      const mineral = /^garden-(contoured-ground|physical-rake-relief|beveled-wet-paving|.*rock-archetypes|depth-companion-rocks)/.test(name)
      const tree = /^garden-(trained-pine-wood|pine-needle-clouds)-/.test(name)
      const fixture = /^garden-lantern-(plinths|frames|hip-caps)(-|$)/.test(name)
      const boundary = name.startsWith('garden-boundary-')
      node.receiveShadow = architecture || mineral || tree || fixture || boundary
      const finish = materials[0].name
      node.castShadow = (architecture && /^(pavilion-(foundation|deck|structure|opening|soffit|roof)|genkan-interior-(timber|trim|floor|stone|plaster|shadow))$/.test(finish))
        || /^garden-(.*rock-archetypes|trained-pine-wood|pine-needle-clouds)-?/.test(name)
        || fixture || boundary
      // Paper remains a visible source, not an opaque shadow blocker.
      if (/paper|wallWarm|wallDim|wallEntry|blossom/.test(finish)) node.castShadow = false
      if (node.castShadow) node.customDepthMaterial = this.depth
    })
  }

  invalidate(): void { for (const light of this.lights) light.shadow.needsUpdate = true }

  dispose(): void { this.depth.dispose(); this.lights.length = 0 }

  update(progress: number): void {
    if (progress === this.doorProgress) return
    this.doorProgress = progress
    this.invalidate()
  }
}
