// Opt-in Playwright-only inspection. No camera/debug code enters the Vite bundle.
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')

exports.attach = async page => {
  await page.route('**/src/core/Renderer.ts', async route => {
    const response = await route.fetch()
    const source = await response.text()
    const needle = 'this.instance.render(scene, camera);'
    assert.ok(source.includes(needle), 'review renderer hook not found')
    await route.fulfill({ response, body: source.replace(needle,
      'window.__gardenReview = { renderer: this.instance, scene, camera }; ' + needle) })
  })
}

exports.capture = async (page, output, report) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(350)
  await page.evaluate(async () => {
    const { PerspectiveCamera } = await import('/node_modules/three/build/three.module.js')
    const { sampleDryGardenGroundWorldY } = await import('/src/world/nightGarden/GardenGroundHeight.ts')
    const review = window.__gardenReview
    review.height = (x, z) => sampleDryGardenGroundWorldY(x, z, 'desktop')
    review.closeCamera = new PerspectiveCamera(48, 1440 / 900, 0.025, 160)
    review.ground = review.scene.getObjectByName('garden-contoured-ground')
    review.originalMaterial = review.ground.material
  })
  const views = [
    { name: 'directional', from: [-1.5, -18], to: [1.0, -20], height: 0.28 },
    { name: 'radial', from: [2.2, -14.8], to: [4.3, -17.4], height: 0.30 },
    { name: 'lantern', from: [-3.8, -31.6], to: [-1.1, -34], height: 0.28 },
  ]
  report.closeups = []
  for (const view of views) {
    const diagnostics = await page.evaluate(view => {
      const r = window.__gardenReview, c = r.closeCamera
      c.position.set(view.from[0], r.height(...view.from) + view.height, view.from[1])
      c.lookAt(view.to[0], r.height(...view.to) + 0.015, view.to[1])
      r.renderer.render(r.scene, c)
      return { position: c.position.toArray(), target: [view.to[0], r.height(...view.to) + 0.015, view.to[1]],
        calls: r.renderer.info.render.calls, triangles: r.renderer.info.render.triangles,
        textures: r.renderer.info.memory.textures, error: r.renderer.getContext().getError() }
    }, view)
    assert.equal(diagnostics.error, 0)
    await page.screenshot({ path: path.join(output, `closeup-${view.name}.png`) })
    report.closeups.push({ ...view, ...diagnostics })
    if (process.env.GARDEN_RELIEF_ABLATION === '1') {
      for (const mode of ['no-cavity', 'flat-normal']) {
        await page.evaluate(mode => {
          const r = window.__gardenReview, original = r.originalMaterial
          const material = original.clone()
          material.onBeforeCompile = (shader, renderer) => {
            original.onBeforeCompile(shader, renderer)
            const normalLine = shader.fragmentShader.includes('rakeSample.height * gravelNormalBlend * (1.0 - vPhysicalRake)')
              ? 'normal = gardenRelief(normal, rakeSample.height * gravelNormalBlend * (1.0 - vPhysicalRake));'
              : 'normal = gardenRelief(normal, rakeSample.height * gravelNormalBlend);'
            if (!shader.fragmentShader.includes(normalLine)) throw new Error('relief ablation hook missing')
            if (mode === 'no-cavity') shader.fragmentShader = shader.fragmentShader.replace(/float rakeCavity = [^;]+;/, 'float rakeCavity = 0.0;')
            else shader.fragmentShader = shader.fragmentShader.replace(normalLine, '')
          }
          material.customProgramCacheKey = () => original.customProgramCacheKey() + '-review-' + mode
          r.ground.material = material
          r.renderer.render(r.scene, r.closeCamera)
        }, mode)
        await page.screenshot({ path: path.join(output, `closeup-${view.name}-${mode}.png`) })
        await page.evaluate(() => {
          const r = window.__gardenReview
          r.ground.material.dispose()
          r.ground.material = r.originalMaterial
          r.renderer.render(r.scene, r.closeCamera)
        })
      }
    }
  }
  // Keep a short, deterministic subpixel camera traverse for temporal inspection.
  const temporal = path.join(output, 'temporal')
  await fs.mkdir(temporal, { recursive: true })
  for (let i = 0; i < 12; i++) {
    await page.evaluate(i => {
      const r = window.__gardenReview, c = r.closeCamera, x = -1.5 + i * 0.006
      c.position.set(x, r.height(x, -18) + 0.28, -18)
      c.lookAt(1 + i * 0.006, r.height(1 + i * 0.006, -20) + 0.015, -20)
      r.renderer.render(r.scene, c)
    }, i)
    await page.screenshot({ path: path.join(temporal, `directional-${String(i).padStart(2, '0')}.png`) })
  }
  await page.evaluate(() => {
    const r = window.__gardenReview
    r.renderer.render(r.scene, r.camera)
  })
}
