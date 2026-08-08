// One-off: pre-populate the flavor-text editor's image cache for a whole
// set, instead of relying on fetch-on-page-view while paging through cards.
//
//   node scripts/download-images.mjs <SET_CODE>

import { mkdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { ensureCachedImage } from "./lib/image-cache.mjs"

const setCode = process.argv[2]
if (!setCode) {
  console.error("usage: node scripts/download-images.mjs <SET_CODE>   e.g. ASC")
  process.exit(1)
}

const ROOT = resolve(import.meta.dirname, "..")
const SET_PATH = resolve(ROOT, "data/sets", `${setCode}.json`)
const IMAGE_CACHE_DIR = resolve(ROOT, ".local/card-images", setCode)
await mkdir(IMAGE_CACHE_DIR, { recursive: true })

const { cards } = JSON.parse(await readFile(SET_PATH, "utf8"))

const CONCURRENCY = 8
let next = 0
let done = 0

async function worker() {
  while (next < cards.length) {
    const card = cards[next++]
    const url = card.images?.large
    if (!url) continue
    try {
      await ensureCachedImage(IMAGE_CACHE_DIR, card.localId, url)
    } catch (err) {
      console.error(`  FAILED ${card.localId}: ${err instanceof Error ? err.message : err}`)
      continue
    }
    done++
    if (done % 20 === 0) console.log(`  ${done}/${cards.length}`)
  }
}

console.log(`Downloading ${cards.length} images for ${setCode}...`)
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log(`Done: ${done}/${cards.length}`)
