// Which sets does pokemon-tcg-data have that this database doesn't? Answers
// "what's the next set to add" from the actual data instead of from CLAUDE.md's
// cached note, which goes stale the moment a set is added.
//
//   node scripts/missing-sets.mjs              # everything missing, oldest first
//   node scripts/missing-sets.mjs "Black & White"   # just that series
//
// This exists because every era backfill so far enumerated its era by walking a
// numeric id range (`xy0`..`xy12`, `sm1`..`sm12`, ...), and a set whose id
// doesn't fit that pattern is invisible to that walk no matter how carefully
// it's done — `dc1` (Double Crisis, XY) and `dv1` (Dragon Vault, Black & White)
// both hid through five backfills that way. Grouping by the `series` field
// instead is what makes those show up, so that's what this does.
//
// Sets with no pokemon-tcg-data entry at all (MEP — see CLAUDE.md "Sets
// pokemon-tcg-data doesn't have") can't appear here by construction; this
// compares against pokemon-tcg-data's list, so it can only find what that list
// knows about.

import { readdir, readFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SETS_DIR = resolve(ROOT, "data/sets")
const EN_JSON = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json"

const seriesFilter = process.argv[2]

const res = await fetch(EN_JSON)
if (!res.ok) {
  console.error(`Couldn't fetch ${EN_JSON} — ${res.status} ${res.statusText}`)
  process.exit(1)
}
const upstream = await res.json()

// Match on ptcgDataId rather than the filename: this database's set codes are
// Limitless's, which deliberately don't track pokemon-tcg-data's ids (swsh1 is
// SSH, basep is WP), so a name-based comparison would report nonsense.
const have = new Set()
for (const file of await readdir(SETS_DIR)) {
  if (!file.endsWith(".json")) continue
  const { set } = JSON.parse(await readFile(resolve(SETS_DIR, file), "utf8"))
  if (set?.ptcgDataId) have.add(set.ptcgDataId)
}

const missing = upstream
  .filter((s) => !have.has(s.id))
  .filter((s) => !seriesFilter || s.series.toLowerCase() === seriesFilter.toLowerCase())
  .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))

if (missing.length === 0) {
  console.log(seriesFilter ? `No missing sets in series "${seriesFilter}".` : "No missing sets.")
  process.exit(0)
}

// Grouped by series because that's the unit a backfill actually works in, and
// because seeing a lone straggler under an otherwise-complete series is the
// signal this script is for.
let lastSeries = null
for (const s of missing) {
  if (s.series !== lastSeries) {
    console.log(`\n${s.series}`)
    lastSeries = s.series
  }
  console.log(`  ${s.id.padEnd(12)} ${s.releaseDate}  ${s.name} (${s.total} cards)`)
}
console.log(`\n${missing.length} set(s) missing.`)
