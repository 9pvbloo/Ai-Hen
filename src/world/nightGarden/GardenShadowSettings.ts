import type { DirectionalLight, SpotLight } from 'three'

/** Fixed world-space budgets across layouts; no camera-following shadow swimming. */
export const GARDEN_SHADOWS = {
  moon: { size: 2048, left: -32, right: 24, bottom: -25, top: 25, near: .5, far: 85, bias: -.00012, normalBias: .025 },
  hall: { size: 1024, near: .15, far: 12, bias: -.00008, normalBias: .008 },
  interior: { size: 512, near: .08, far: 4.8, bias: -.00008, normalBias: .004 },
  lantern: { size: 512, near: .05, far: 3.0, bias: -.00006, normalBias: .003 },
} as const

export function configureGardenShadow(light: DirectionalLight | SpotLight, zone: keyof typeof GARDEN_SHADOWS): void {
  const settings = GARDEN_SHADOWS[zone]
  light.castShadow = true
  light.shadow.mapSize.set(settings.size, settings.size)
  light.shadow.camera.near = settings.near
  light.shadow.camera.far = settings.far
  light.shadow.bias = settings.bias
  light.shadow.normalBias = settings.normalBias
  light.shadow.radius = 2
  light.shadow.autoUpdate = false
  light.shadow.needsUpdate = true
  if (zone === 'moon' && 'isDirectionalLight' in light) {
    Object.assign(light.shadow.camera, {
      left: GARDEN_SHADOWS.moon.left, right: GARDEN_SHADOWS.moon.right,
      bottom: GARDEN_SHADOWS.moon.bottom, top: GARDEN_SHADOWS.moon.top,
    })
  }
  light.shadow.camera.updateProjectionMatrix()
}
