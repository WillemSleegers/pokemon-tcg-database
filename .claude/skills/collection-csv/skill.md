---
name: collection-csv
description: Produce the tab-separated card list for Willem's Google Sheets Pokémon collection tracker (mark, number, name, supertype, type, subtype, rarity). Use when the user asks for a set as a CSV/spreadsheet/sheet list, for something to paste into their collection sheet, or mentions their Google Sheets collection.
---

`node scripts/collection-csv.mjs <CODE>` prints the set as tab-separated rows
(header row included) on stdout, and the card count on stderr. `<CODE>` is this
database's own set code — the `data/sets/<CODE>.json` filename, e.g. `30C`, `SVP`,
`BS`.

Then **paste the script's stdout verbatim into the reply inside a fenced code
block**, so the user gets a copy button and can paste it straight into Sheets.
Tabs make Sheets split it into columns with no import step. Don't write it to a
file, don't summarize or truncate it, and don't reformat it into a markdown table
— the whole point is the raw pasteable block.

Notes:

- `mark` is `regulationMark`, blank for any set predating regulation marks.
- `type`/`subtype` are the `types`/`subtypes` arrays joined with `,` (e.g.
  `Basic,ex`), blank where the card has none — a Trainer has no `types`.
- Order is the set file's own card order; nothing is sorted or filtered.
- If the set code doesn't exist, check `ls data/sets/` rather than guessing —
  the codes are Limitless's, not pokemon-tcg-data's ids.

`type` means the card's kind and `subtype` the modifiers beneath it, which takes
a little untangling for non-Pokémon: a Trainer/Energy has no `types` field at
all, so its kind sits in `subtypes` next to the modifiers. `CARD_KINDS` in the
script splits them — `Item`/`Supporter`/`Stadium`/`Special`/… move to `type`,
leaving `ACE SPEC`, `Prism Star`, `Single Strike` etc. in `subtype`. An
unrecognized value stays in `subtype`, so a new mechanic label can't quietly
land in the `type` column; if a new set introduces a genuine new card *kind*,
add it to that set.
