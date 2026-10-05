import { Color } from 'three'

/** sRGB authoring; shader transport uses the same colors converted to linear light. */
export const PRACTICAL_LIGHT = {
  // Soft amber transport, warm ivory transmission, and a quieter honey bounce.
  // Keep red below full scale: warmth comes from channel balance, not extra power.
  source: '#edbd7e',
  paper: '#efc58e',
  bounce: '#c99c66',
  dim: '#dfb37e',
} as const

export function practicalLinearGLSL(color: string): string {
  const c = new Color(color)
  return `vec3(${c.r.toFixed(6)}, ${c.g.toFixed(6)}, ${c.b.toFixed(6)})`
}
