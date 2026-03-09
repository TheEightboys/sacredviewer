/**
 * Generates a lightweight geometry-only preview GLB from the full building model.
 * Strips all textures, keeps mesh geometry and hierarchy intact.
 * The result is small enough to bundle in the Cloudflare Pages deployment (<25 MB).
 *
 * Usage: node scripts/generate-preview.mjs
 */
import { NodeIO } from '@gltf-transform/core'
import { dedup, prune, quantize } from '@gltf-transform/functions'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const INPUT = 'public/models/building.glb'
const OUTPUT = 'public/models/building-preview.glb'

async function main() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(INPUT)

  // Remove all textures (they are 95%+ of the file size)
  for (const texture of doc.getRoot().listTextures()) {
    texture.dispose()
  }

  // Set all materials to a simple flat color so the silhouette is recognizable
  for (const material of doc.getRoot().listMaterials()) {
    material
      .setBaseColorFactor([0.55, 0.55, 0.6, 1]) // neutral gray-blue
      .setMetallicFactor(0.1)
      .setRoughnessFactor(0.8)
      .setNormalTexture(null)
      .setOcclusionTexture(null)
      .setEmissiveTexture(null)
      .setEmissiveFactor([0, 0, 0])
  }

  // Optimize: deduplicate, prune unused, quantize geometry
  await doc.transform(dedup(), prune(), quantize())

  await io.write(OUTPUT, doc)

  // Report size
  const { statSync } = await import('fs')
  const stats = statSync(OUTPUT)
  const sizeKB = (stats.size / 1024).toFixed(1)
  console.log(`Preview model generated: ${OUTPUT} (${sizeKB} KB)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
