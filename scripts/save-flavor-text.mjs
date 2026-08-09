// Writes one or more localId/text pairs into data/flavor-text/<CODE>.json —
// a CLI counterpart to the flavor-text-editor's "Save & Next" button, for
// saving transcriptions in bulk without needing the editor server running.
// See CLAUDE.md "Bulk flavor text via cropped images".
//
//   node scripts/save-flavor-text.mjs DRI 1 "Flavor text for card 1." 2 "Flavor text for card 2." ...

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const [setCode, ...pairs] = process.argv.slice(2)
if (!setCode || pairs.length === 0 || pairs.length % 2 !== 0) {
  console.error('Usage: node scripts/save-flavor-text.mjs <CODE> <localId> "<text>" [<localId> "<text>" ...]')
  process.exit(1)
}

const OVERLAY_PATH = resolve(ROOT, "data/flavor-text", `${setCode}.json`)

let overlay
try {
  overlay = JSON.parse(await readFile(OVERLAY_PATH, "utf8"))
} catch {
  overlay = {}
}

for (let i = 0; i < pairs.length; i += 2) {
  const [localId, text] = [pairs[i], pairs[i + 1]]
  if (text && text.trim()) overlay[localId] = text.trim()
  else delete overlay[localId]
}

const sorted = Object.fromEntries(
  Object.keys(overlay)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((k) => [k, overlay[k]])
)

await mkdir(dirname(OVERLAY_PATH), { recursive: true })
await writeFile(OVERLAY_PATH, JSON.stringify(sorted, null, 2) + "\n")
console.log(`Saved ${pairs.length / 2} entr${pairs.length / 2 === 1 ? "y" : "ies"}. Overlay now has ${Object.keys(overlay).length} total.`)
