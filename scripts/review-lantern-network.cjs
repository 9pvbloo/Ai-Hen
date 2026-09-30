// Review cameras only. No changes to production camera, lights or renderer source.
const { chromium } = require('playwright')
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')

async function main() {
  const output = process.env.GARDEN_LANTERN_OUTPUT || 'docs/reviews/phase-3k65/individual'
  await fs.mkdir(output, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const report = { errors: [], lanterns: [] }
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await require('./review-karesansui.cjs').attach(page)
    page.on('pageerror', e => report.errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /shader|webgl/i.test(m.text()))) report.errors.push(m.text()) })
    await page.addInitScript(() => {
      window.lanternContextLosses = 0
      document.addEventListener('webglcontextlost', () => window.lanternContextLosses++, true)
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(process.env.GARDEN_REVIEW_URL || 'http://127.0.0.1:5174/?debug=1')
    await page.waitForTimeout(1200)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(400)
    await page.addStyleTag({ content: '.debug-panel{visibility:hidden}' })
    report.lights = await page.evaluate(async () => {
      const { PerspectiveCamera } = await import('/node_modules/three/build/three.module.js')
      window.__lanternCamera = new PerspectiveCamera(48, 1.6, 0.025, 160)
      const r = window.__gardenReview, lights = []
      r.scene.traverse(o => {
        if (!o.isLight) return
        let visible = true
        for (let p = o; p; p = p.parent) visible &&= p.visible
        lights.push({ type: o.type, name: o.name, intensity: o.intensity, visible, shadow: o.castShadow })
      })
      return lights
    })
    for (let i = 0; i < 15; i++) {
      const details = await page.evaluate(async i => {
        const { LANTERN_ANCHORS, lanternBaseY } = await import('/src/world/nightGarden/GardenLanternNetwork.ts')
        const { sampleDryGardenGroundWorldY } = await import('/src/world/nightGarden/GardenGroundHeight.ts')
        const r = window.__gardenReview, c = window.__lanternCamera
        const [x, z, size] = LANTERN_ANCHORS[i], y = lanternBaseY(i, 'desktop')
        c.position.set(x + (x < 0 ? 0.85 : -0.85), y + 0.90, z + 1.85)
        c.lookAt(x, y + size * 0.5, z)
        r.renderer.render(r.scene, c)
        const clearances = [-1, 1].flatMap(dx => [-1, 1].map(dz =>
          y - sampleDryGardenGroundWorldY(x + dx * 0.41 * size, z + dz * 0.39 * size, 'desktop')))
        return { index: i + 1, anchor: [x, y, z], size, clearances,
          error: r.renderer.getContext().getError(), contextLosses: window.lanternContextLosses }
      }, i)
      assert.equal(details.error, 0); assert.equal(details.contextLosses, 0)
      if (i >= 5) assert.ok(details.clearances.every(v => v < 0 && v > -0.08))
      report.lanterns.push(details)
      await page.screenshot({ path: path.join(output, `lantern-${String(i + 1).padStart(2, '0')}.png`) })
    }
    assert.deepEqual(report.errors, [])
  } finally {
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
    await browser.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
