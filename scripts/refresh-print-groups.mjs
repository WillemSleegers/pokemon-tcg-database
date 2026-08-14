// Rewrites every card's stored printGroup (data/sets/*.json) to the current
// connected component across all sets — see scripts/lib/print-groups.mjs for
// why staleness is safe but worth refreshing anyway: this just makes a set
// file read in isolation show up-to-date reprints without anyone having to
// re-run the derivation themselves. Idempotent — safe to run any time, e.g.
// after adding a new set.
//
//   node scripts/refresh-print-groups.mjs

import { readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { computePrintGroups } from "./lib/print-groups.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SETS_DIR = resolve(ROOT, "data/sets")

async function main() {
  const files = (await readdir(SETS_DIR)).filter((f) => f.endsWith(".json"))
  /** @type {import("../types/card.js").CardSet[]} */
  const sets = await Promise.all(files.map(async (file) => JSON.parse(await readFile(resolve(SETS_DIR, file), "utf8"))))

  const printGroups = computePrintGroups(sets)

  let changedCards = 0
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    let dirty = false
    for (const card of set.cards) {
      if (!card.limitless) continue
      const current = printGroups.get(card.limitless.deckCode)
      if (current && JSON.stringify(current) !== JSON.stringify(card.limitless.printGroup)) {
        card.limitless.printGroup = current
        dirty = true
        changedCards++
      }
    }
    if (dirty) {
      await writeFile(resolve(SETS_DIR, files[i]), JSON.stringify(set, null, 2) + "\n")
      console.log(`Updated ${files[i]}`)
    }
  }

  console.log(changedCards ? `Refreshed printGroup on ${changedCards} card(s).` : "All printGroup fields already up to date.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
