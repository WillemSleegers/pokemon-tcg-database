// Headless verification sweep for a set's flavor text — the scriptable
// counterpart to flavor-text-editor.mjs's "Show unmatched only" button,
// for running from the command line (or by Claude) without needing the
// interactive browser editor running.
//
//   node scripts/check-flavor-text.mjs OBF
//
// A card counts as unmatched if it's blank, or its saved text isn't a
// verbatim hit against any of its species' Bulbapedia candidates.

import { readFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { speciesName, normalize, fetchFlavorCandidates } from "./lib/bulbapedia.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const setCode = process.argv[2]
if (!setCode) {
  console.error("usage: node scripts/check-flavor-text.mjs <SET_CODE>   e.g. OBF")
  process.exit(1)
}

const SET_PATH = resolve(ROOT, "data/sets", `${setCode}.json`)
const OVERLAY_PATH = resolve(ROOT, "data/flavor-text", `${setCode}.json`)

let setData
try {
  setData = JSON.parse(await readFile(SET_PATH, "utf8"))
} catch {
  console.error(`Couldn't read ${SET_PATH} — run fetch-set.mjs for ${setCode} first.`)
  process.exit(1)
}

let overlay
try {
  overlay = JSON.parse(await readFile(OVERLAY_PATH, "utf8"))
} catch {
  overlay = {}
}

// Only regular (non-ex/non-MEGA) Pokémon print the flavor text box — same
// criterion fetch-set.mjs uses for the pokedex info box.
const candidates = setData.cards.filter((c) => c.pokedex)

async function checkCard(c) {
  const flavorText = overlay[c.localId] ?? c.flavorText ?? ""
  if (!flavorText) return { card: c, flavorText, matched: false, candidates: [] }
  const cands = await fetchFlavorCandidates(speciesName(c.name))
  const current = normalize(flavorText)
  const matched = cands.some((cand) => normalize(cand.text) === current)
  return { card: c, flavorText, matched, candidates: cands }
}

const results = []
let next = 0
async function worker() {
  while (next < candidates.length) {
    const idx = next++
    results.push(await checkCard(candidates[idx]))
  }
}
await Promise.all(Array.from({ length: 6 }, worker))

const unmatched = results
  .filter((r) => !r.matched)
  .sort((a, b) => a.card.localId.localeCompare(b.card.localId, undefined, { numeric: true }))

if (unmatched.length === 0) {
  console.log(`${setCode}: all ${candidates.length} cards matched.`)
} else {
  console.log(`${setCode}: ${unmatched.length}/${candidates.length} unmatched:`)
  for (const { card, flavorText, candidates: cands } of unmatched) {
    console.log(`  ${card.localId} ${card.name}${flavorText ? "" : " (blank)"}`)
    console.log(`    saved: ${flavorText || "(none)"}`)
    for (const cand of cands) {
      console.log(`    ${cand.versions.join("/")}: ${cand.text}`)
    }
  }
}
