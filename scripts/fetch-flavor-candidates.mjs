// Prints Bulbapedia flavor-text candidates for one or more species names —
// a CLI counterpart to the flavor-text-editor's candidate lookup, for
// cross-checking transcriptions without needing the editor server running.
// See CLAUDE.md "Bulk flavor text via cropped images".
//
//   node scripts/fetch-flavor-candidates.mjs "Ledyba" "Celebi" ...

import { speciesName, fetchFlavorCandidates } from "./lib/bulbapedia.mjs"

const names = process.argv.slice(2)
if (!names.length) {
  console.error('Usage: node scripts/fetch-flavor-candidates.mjs "Name" ["Name2" ...]')
  process.exit(1)
}

for (const name of names) {
  const species = speciesName(name)
  console.log(`\n=== ${name} (${species}) ===`)
  try {
    const candidates = await fetchFlavorCandidates(species)
    if (!candidates.length) {
      console.log("  (no candidates found)")
      continue
    }
    for (const c of candidates) {
      console.log(`  [${c.versions.join(", ")}] ${c.text}`)
    }
  } catch (err) {
    console.log(`  error: ${err instanceof Error ? err.message : err}`)
  }
}
