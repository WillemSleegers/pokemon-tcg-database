# Pokémon TCG Database

A structured JSON database of Pokémon TCG cards, built set by set — full game
text, official rules, Pokédex info, and deck-legality data, not just the
name/rarity/quantity a collection tracker needs.

Starting point: **Mega Evolution (MEG)**, [`data/sets/MEG.json`](data/sets/MEG.json)
— 188 cards (132 printed + 56 secret rares).

## Sources

Three sources, merged per card:

- **[pokemon-tcg-data](https://github.com/PokemonTCG/pokemon-tcg-data)** —
  primary source. Attacks, abilities, weaknesses, resistances, official rules
  text (Trainer card text and ex/MEGA rule boxes), rarity, regulation mark,
  national Pokédex numbers, card images.
- **[limitlesstcg.com](https://limitlesstcg.com)** — the only source with the
  illustrator credit, and with the "Int. Prints" table used to build
  `printGroup` (see below).
- **[pokeapi.co](https://pokeapi.co)** — species genus/height/weight for the
  Pokédex info box printed on regular (non-ex/non-MEGA) Pokémon cards. This
  is game Pokédex data (same for every card of that species), looked up by
  national dex number rather than scraped per card.

A fourth source, **[Bulbapedia](https://bulbapedia.bulbagarden.net)**, is used
for flavor text (its species pages carry every game's Pokédex entry in a clean
template — see "Notes on the data" below), and, for a set pokemon-tcg-data
doesn't carry at all, for the game text of that set's exclusive cards. `MEP`
(the Mega Evolution promos) is the only such set so far.

## How this differs from other databases

No single upstream source combines everything here into one record — checked
directly against live data, not assumption:

- **pokemon-tcg-data** has attacks, rules text, rarity, and images, but no
  `artist`, no `flavorText`, and no concept of `printGroup` at all (its raw
  card record has neither). It does carry a `legalities` object, which isn't
  used here — `printGroup` covers deck-legality instead.
- **limitlesstcg.com** is a per-card webpage, not a downloadable dataset — no
  bulk API. Its prints-table HTML is the only place `printGroup` exists at
  all, and its card pages don't show attack/ability text.
- **pokeapi.co** has no notion of a "TCG card" — it's mainline-game species
  data. It's bound here to the specific printed card it actually appears on
  (regular prints only, not ex/MEGA).
- **Bulbapedia** has the raw per-game Pokédex text, but nowhere records which
  entry got reused for which TCG card — that match is done and verified by
  hand (see `CLAUDE.md`).
- **[TCGdex](https://tcgdex.dev)**, the closest existing all-in-one
  alternative (not used as a source here) — has `illustrator` and
  attack/rules text like this database does, but its live API has no flavor
  text and no genus/height/weight, and its "variants" field tracks same-set
  foil/holo variants, not cross-set deck-legal substitutes. It also carries
  live pricing, which is deliberately out of scope here.

The differentiator isn't any one field — it's that flavor text, full rules
text, the Pokédex info box, cross-set `printGroup`, and artist all live on
the same record here, which no upstream source does.

## Schema

Ground truth is [`types/card.ts`](types/card.ts) (`CardSet` / `Card`), not this
README — `scripts/fetch-set.mjs` is checked against it via JSDoc `@type`
casts, so `npm run typecheck` fails loudly if the assembled output ever
drifts from that shape (wrong field type, typo'd property name, or a
pokemon-tcg-data source field silently changing shape upstream).

A representative card, `MEG 3` (Mega Venusaur ex):

```jsonc
{
  "number": "003/132",         // exact phrasing printed on the card
  "localId": "3",              // bare number — Limitless/PTCGL URLs and IDs use this
  "name": "Mega Venusaur ex",
  "supertype": "Pokémon",
  "subtypes": ["Stage 2", "MEGA", "ex"],
  "evolvesFrom": "Ivysaur",
  "types": ["Grass"],
  "hp": 380,
  "rules": ["Mega Evolution ex Rule: ..."],  // ex/MEGA rule box, or full Trainer text
  "abilities": [{ "name": "Solar Transfer", "type": "Ability", "text": "..." }],
  "attacks": [{ "name": "Jungle Dump", "cost": ["Grass", "Grass", "Grass", "Grass"],
                "convertedEnergyCost": 4, "damage": "240", "text": "Heal 30 damage from this Pokémon." }],
  "weaknesses": [{ "type": "Fire", "value": "×2" }],
  "resistances": [],
  "retreatCost": 4,
  "regulationMark": "I",
  "rarity": "Double Rare",
  "artist": "5ban Graphics",
  "pokedex": { "number": 3, "genus": "Seed Pokémon", "height": "3'3\"", "weight": "220.5 lbs" },
  "flavorText": "...",
  "secret": false,               // localId > set.printedTotal
  "deckCode": "MEG 3",           // what you'd type/see in a PTCGL/Limitless decklist
  "printGroup": ["MEP 13", "MEG 3", "MEG 155", "MEG 177"],  // legal decklist substitutes
  "limitless": { "id": 37787, "url": "https://limitlesstcg.com/cards/MEG/3" },
  "images": { "small": "...", "large": "..." }
}
```

## Adding a set

```sh
node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>
# e.g.
node scripts/fetch-set.mjs me2 PFL
```

Find `ptcgDataSetId` from [pokemon-tcg-data's `sets/en.json`](https://github.com/PokemonTCG/pokemon-tcg-data/blob/master/sets/en.json)
(its `id` field, e.g. `"me2"` for Phantasmal Flames) — `limitlessCode` is the
set's code on limitlesstcg.com / in PTCGL decklists (its `ptcgoCode` in that
same file, which should match).

For a set pokemon-tcg-data doesn't have at all, pass `NONE` as the
`ptcgDataSetId` (e.g. `node scripts/fetch-set.mjs NONE MEP`). Limitless's set
page then supplies the card list; each card's game text comes either from the
card it reprints elsewhere in `data/sets/` or, for a set-exclusive, from
Bulbapedia's page for that print; and the set's own metadata comes from
`data/set-meta/<code>.json`. Every card assembled that way is checked field by
field against its Limitless page, and the run fails on any disagreement.

This makes a network call per card to Limitless and (for non-ex/MEGA
Pokémon) one or two calls per distinct species to PokeAPI, so a full set
takes a couple of minutes. The script fails loudly rather than guessing when
a page or record doesn't look like the expected shape — and `npm run
typecheck` (see `types/card.ts` above) catches shape drift at edit time,
before you even run it.

## Notes on the data

- English printings only. `printGroup` only tracks English legal substitutes
  — Limitless's JP printings are a separate numbering scheme not used in
  English decklists, so they're dropped.
- No structured source for flavor text — it isn't in pokemon-tcg-data or on
  Limitless for recent sets, and PokeAPI doesn't have Scarlet/Violet-era
  Pokédex text at all. It's filled in by hand with
  `scripts/flavor-text-editor.mjs`, using the discovery that TCG flavor text
  is a verbatim reuse of a mainline-game Pokédex entry findable on
  Bulbapedia — see `CLAUDE.md` for how that pipeline works.
- No pricing — this is a card-text reference, not a market-value tracker.
- Two small per-set overlays sit alongside the flavor-text one, for cases the
  automated fetch can't infer and shouldn't guess at:
  `data/no-pokedex/<CODE>.json` lists cards that print no Pokédex info box for
  a reason no subtype captures (mostly cards from the 2002–2007 gap when the
  TCG dropped the dex line), and `data/no-limitless/<CODE>.json` lists cards
  Limitless has no page for at all (the long-running promo sets have a
  handful each). Both are plain JSON arrays of local ids, confirmed against
  card images; see `CLAUDE.md`.
