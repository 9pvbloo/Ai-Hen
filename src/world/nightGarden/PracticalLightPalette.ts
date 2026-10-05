import { Color } from 'three'

/** sRGB authoring; shader transport uses the same colors converted to linear light. */
export const PRACTICAL_LIGHT = {
  source: '#f1ce9f',
  paper: '#f3d6af',
  bounce: '#d6b58f',
  dim: '#e5c39a',
} as const

export function practicalLinearGLSL(color: string): string {
  const c = new Color(color)
  return `vec3(${c.r.toFixed(6)}, ${c.g.toFixed(6)}, ${c.b.toFixed(6)})`
}
