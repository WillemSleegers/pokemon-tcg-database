// Prints a set as tab-separated rows for pasting into the Google Sheets
// collection list — see .claude/skills/collection-csv/skill.md.
//
//   node scripts/collection-csv.mjs <CODE>
//
// Columns: mark, number, name, supertype, type, subtype, rarity. Tab-separated
// (Sheets splits those into columns on a plain paste, no import step), with a
// header row, in the set file's own card order. Multi-value fields are joined
// with "," — safe unquoted here precisely because the separator is a tab.
//
// `type` is the card's kind, `subtype` the modifiers below it. For a Pokémon
// that's `types` (Grass) and `subtypes` (Basic, ex). A Trainer/Energy has no
// `types` at all, so its kind lives in `subtypes` alongside the modifiers and
// has to be split back out: Item/Supporter/Stadium/Special/... go in `type`,
// leaving ACE SPEC, Prism Star, Single Strike and friends in `subtype`.
// Anything unrecognized falls through to `subtype`, so a new mechanic label
// never silently lands in the `type` column.

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const code = process.argv[2]
if (!code) {
  console.error("Usage: node scripts/collection-csv.mjs <CODE>")
  process.exit(1)
}

const setData = JSON.parse(await readFile(resolve("data/sets", `${code}.json`), "utf8"))

// Trainer/Energy `subtypes` values that name the card's kind rather than modify it.
const CARD_KINDS = new Set([
  "Item",
  "Supporter",
  "Stadium",
  "Pokémon Tool",
  "Pokémon Tool F",
  "Technical Machine",
  "Rocket's Secret Machine",
  "Goldenrod Game Corner",
  "Special",
  "Basic",
])

/** @returns {[string, string]} the `type` and `subtype` cells for one card. */
function typeAndSubtype(card) {
  const subtypes = card.subtypes ?? []
  if (card.supertype === "Pokémon") {
    return [(card.types ?? []).join(","), subtypes.join(",")]
  }
  const kinds = subtypes.filter((s) => CARD_KINDS.has(s))
  const modifiers = subtypes.filter((s) => !CARD_KINDS.has(s))
  return [kinds.join(","), modifiers.join(",")]
}

const columns = ["mark", "number", "name", "supertype", "type", "subtype", "rarity"]
console.log(columns.join("\t"))

for (const card of setData.cards) {
  const [type, subtype] = typeAndSubtype(card)
  const row = [
    card.regulationMark ?? "",
    card.number ?? "",
    card.name,
    card.supertype,
    type,
    subtype,
    card.rarity ?? "",
  ]
  console.log(row.join("\t"))
}

console.error(`${setData.cards.length} cards in ${code}`)
