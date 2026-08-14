// Crops the flavor-text strip out of every cached, pokedex-eligible card
// image for a set (Trainers/Energy and ex/MEGA/V-family cards never carry
// flavor text, so they're skipped), so Claude can read just that region
// instead of the full card (~90% fewer image tokens — see CLAUDE.md).
// Images must already be cached locally via download-images.mjs or the
// flavor-text-editor.
//
//   node scripts/crop-flavor-text.mjs <SET_CODE> <top> <height> [left] [width]
//   e.g. node scripts/crop-flavor-text.mjs ASC 895 90
//
// top/height (and optional left/width) are pixel coordinates on the source
// image — there's no reliable way to infer them, so calibrate once per set
// by cropping a single sample card, looking at it, and adjusting until the
// box cleanly frames the flavor text with a little margin (card templates
// differ enough between series — e.g. Mega Evolution's separate copyright
// line vs Scarlet & Violet's — that a box from one set won't just carry
// over to the next).

import { mkdir, readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import sharp from "sharp"

const [setCode, top, height, left, width] = process.argv.slice(2)
if (!setCode || top === undefined || height === undefined) {
  console.error("usage: node scripts/crop-flavor-text.mjs <SET_CODE> <top> <height> [left] [width]")
  process.exit(1)
}

const ROOT = resolve(import.meta.dirname, "..")
const SRC_DIR = resolve(ROOT, ".local/card-images", setCode)
const OUT_DIR = resolve(ROOT, ".local/card-images-cropped", setCode)
await mkdir(OUT_DIR, { recursive: true })

// top/height (and left/width, when given) are calibrated against a
// 1024px-tall reference image. A handful of cards occasionally come back
// from the source at a smaller resolution (same aspect ratio) — scale the
// box by this image's actual height instead of failing on it.
const REFERENCE_HEIGHT = 1024

// Only cards that carry flavor text are worth cropping — Trainers/Energy and
// ex/MEGA/V-family cards never do, so there's no point cropping those even if
// they're cached locally. That's mostly the pokedex-eligible ones (the same
// criterion fetch-set.mjs uses for the dex info box, and that the flavor-text
// editor / check-flavor-text.mjs filter on), plus full-art cards that print
// flavor text with no dex line above it — MEP's First Partner Illustration
// Collection cards, whose strip is the only way to verify their text.
const { cards } = JSON.parse(await readFile(resolve(ROOT, "data/sets", `${setCode}.json`), "utf8"))
const eligibleIds = new Set(cards.filter((c) => c.pokedex || c.flavorText).map((c) => String(c.localId)))

const files = (await readdir(SRC_DIR)).filter(
  (f) => /\.(png|jpg)$/i.test(f) && eligibleIds.has(f.replace(/\.(png|jpg)$/i, "")),
)
let done = 0
const skipped = []
for (const file of files) {
  const src = resolve(SRC_DIR, file)
  const dst = resolve(OUT_DIR, file)
  const meta = await sharp(src).metadata()
  const scale = meta.height / REFERENCE_HEIGHT
  const box = {
    left: Math.round((left !== undefined ? Number(left) : 0) * scale),
    top: Math.round(Number(top) * scale),
    width: Math.round((width !== undefined ? Number(width) : meta.width / scale) * scale),
    height: Math.round(Number(height) * scale),
  }
  // The box is scaled by height alone, which assumes every image shares the
  // standard card aspect ratio. A handful don't — the long promo sets mix in
  // oversized/jumbo scans — and there the box can run off the right or bottom
  // edge. Skip those with a note rather than aborting the whole run: the crop
  // would be misframed for them anyway, so they're a "go look at the full
  // image" case, not a reason to lose the other few hundred cards.
  if (box.left + box.width > meta.width || box.top + box.height > meta.height) {
    skipped.push(`${file} (${meta.width}×${meta.height})`)
    continue
  }
  await sharp(src).extract(box).toFile(dst)
  done++
}
console.log(`Cropped ${done} image(s) into ${OUT_DIR}`)
if (skipped.length) {
  console.log(`Skipped ${skipped.length} non-standard-shaped image(s) — read these full-size instead:`)
  for (const s of skipped) console.log(`  ${s}`)
}
