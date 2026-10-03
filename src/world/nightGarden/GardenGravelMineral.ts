/** Periodic jittered mineral grains baked into the existing 256px material maps.
 * Nine neighbouring cells prevent square-grid seams; no per-frame cell search. */
export function gravelMineralHeight(x: number, y: number): number {
  const cells = 38, px = x * cells, py = y * cells
  const wrap = (v: number): number => ((v % cells) + cells) % cells
  const hash = (a: number, b: number): number => {
    const h = Math.sin(wrap(a) * 127.1 + wrap(b) * 311.7) * 43758.5453123
    return h - Math.floor(h)
  }
  let grain = 0
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = Math.floor(px) + i, cy = Math.floor(py) + j
    const dx = px - cx - (0.18 + hash(cx, cy) * 0.64)
    const dy = py - cy - (0.18 + hash(cx + 17, cy + 9) * 0.64)
    const aspect = 0.62 + hash(cx + 5, cy + 13) * 0.70
    const angle = hash(cx + 11, cy + 7) * Math.PI
    const u = (dx * Math.cos(angle) - dy * Math.sin(angle)) * aspect
    const v = (dx * Math.sin(angle) + dy * Math.cos(angle)) / aspect
    // Angular chips with different sizes and heights, not identical circular beads.
    const distance = Math.max(Math.abs(u) * 0.87 + Math.abs(v) * 0.36, Math.abs(v) * 0.92 + Math.abs(u) * 0.21)
    const radius = 0.33 + hash(cx + 19, cy + 3) * 0.25
    const shoulder = Math.max(0, 1 - distance / radius)
    grain = Math.max(grain, shoulder * shoulder * (3 - 2 * shoulder) * (0.55 + hash(cx + 8, cy + 23) * 0.45))
  }
  return 0.26 + grain * 0.64
}
