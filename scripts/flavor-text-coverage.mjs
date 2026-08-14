// Quick local coverage check: how many of a set's flavor-text-eligible cards
// already have flavorText, before deciding whether a set needs the crop
// workflow (see CLAUDE.md "Scarlet & Violet: check per-set, don't assume").
// No network calls — this is not the verification sweep, see
// check-flavor-text.mjs for that.
//
//   node scripts/flavor-text-coverage.mjs TWM

import { readFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const setCode = process.argv[2]
if (!setCode) {
  console.error("usage: node scripts/flavor-text-coverage.mjs <SET_CODE>   e.g. TWM")
  process.exit(1)
}

const SET_PATH = resolve(ROOT, "data/sets", `${setCode}.json`)

let setData
try {
  setData = JSON.parse(await readFile(SET_PATH, "utf8"))
} catch {
  console.error(`Couldn't read ${SET_PATH} — run fetch-set.mjs for ${setCode} first.`)
  process.exit(1)
}

// Only regular (non-ex/non-MEGA) Pokémon print the flavor text box — mostly the
// same criterion fetch-set.mjs uses for the pokedex info box, but not quite:
// a full-art card can print flavor text with no dex line above it (MEP's First
// Partner Illustration Collection cards do), so take either field as a reason
// to include the card.
const eligible = setData.cards.filter((c) => c.pokedex || c.flavorText)
const withText = eligible.filter((c) => c.flavorText)

console.log(`${setCode}: ${withText.length}/${eligible.length} eligible cards have flavorText`)
if (withText.length > 0 && withText.length < eligible.length) {
  const missing = eligible.filter((c) => !c.flavorText)
  console.log("missing:")
  for (const c of missing) {
    console.log(`  ${c.localId} ${c.name}`)
  }
}
