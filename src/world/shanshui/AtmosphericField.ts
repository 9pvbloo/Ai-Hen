import { Color, Float32BufferAttribute, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import type { PerspectiveCamera, Scene } from 'three'
import type { Viewport } from '../../core/Viewport'
import { SHANSHUI } from './ShanshuiConfig'

/** A broad ink-to-silver wash using vertex colors, with no image, lighting or custom shader. */
export class AtmosphericField {
  private readonly geometry = new PlaneGeometry(1, 1, 1, SHANSHUI.fieldColors.length - 1)
  private readonly material = new MeshBasicMaterial({ vertexColors: true, depthWrite: false, toneMapped: false })
  private readonly mesh = new Mesh(this.geometry, this.material)

  constructor(scene: Scene) {
    const colors: number[] = []
    for (const hex of SHANSHUI.fieldColors) {
      const color = new Color(hex)
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b)
    }
    this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.mesh.name = 'shanshui-atmospheric-field'
    this.mesh.position.z = SHANSHUI.fieldDepth
    scene.add(this.mesh)
  }

  resize(viewport: Viewport, camera: PerspectiveCamera): void {
    const height = 2 * Math.tan(camera.fov * Math.PI / 360) * (camera.position.z - SHANSHUI.fieldDepth)
    this.mesh.scale.set(height * viewport.aspect * SHANSHUI.edgeOverscan, height * SHANSHUI.edgeOverscan, 1)
  }

  dispose(): void {
    this.mesh.removeFromParent()
    this.geometry.dispose()
    this.material.dispose()
  }
}
