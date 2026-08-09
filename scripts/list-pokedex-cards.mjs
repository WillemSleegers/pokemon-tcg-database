// Lists the pokedex-eligible cards in a set (localId + name), one per line.
// Used to plan/drive the crop-workflow flavor-text transcription pass —
// see CLAUDE.md "Bulk flavor text via cropped images".
//
//   node scripts/list-pokedex-cards.mjs <CODE>

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const code = process.argv[2]
if (!code) {
  console.error("Usage: node scripts/list-pokedex-cards.mjs <CODE>")
  process.exit(1)
}

const setData = JSON.parse(await readFile(resolve("data/sets", `${code}.json`), "utf8"))
const eligible = setData.cards.filter((c) => c.pokedex)

console.error(`${eligible.length} pokedex-eligible cards in ${code}`)
for (const c of eligible) {
  console.log(`${c.localId}\t${c.name}`)
}
