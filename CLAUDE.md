# pokemon-tcg-database

A structured JSON database of Pokémon TCG cards, built set by set. Full per-source
notes are in `README.md` — this file is about how the pipeline works and why, for
picking the work back up.

## Status

`data/sets/MEG.json` (Mega Evolution, 188 cards) and `data/sets/PFL.json` (Phantasmal
Flames, 130 cards) are complete, including flavor text — verified against Bulbapedia
via the flavor-text editor's "Show unmatched only" filter (see below), not just
eyeballed. No other sets have been built yet.

## Schema

Ground truth is [`types/card.ts`](types/card.ts) (`CardSet`/`Card`, plus
`PrimaryCard`/`PrimarySetMeta` for pokemon-tcg-data's raw input shape) — not the
README, and not this file. `scripts/fetch-set.mjs` is checked against it via JSDoc
`@type` casts; run `npm run typecheck` after touching that script, and definitely
before trusting a new set's output. Both the _output_ (`Card`) and the _input_
(`PrimaryCard`) are typed — typing only the output would let a value copied straight
from pokemon-tcg-data (e.g. `card.hp = primary.hp`, a string) flow through as `any`
and bypass checking entirely.

Note the incremental-build pattern in `fetch-set.mjs`: `card` is cast to `Card` via an
`any` bridge at its _initial_ declaration (not annotated there, and not cast only at
return) specifically so the field-by-field `card.x = ...` assignments that follow
still typecheck. Annotating the declaration directly would make TS infer the
narrower initial-literal shape and reject every later assignment; casting only at
`return` wouldn't catch anything since `card`'s type during the function body would
still be inferred from that narrow initial shape.

## Pipeline

`scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>` merges three sources per card:

- **pokemon-tcg-data** (GitHub) — primary source. Attacks, abilities, weaknesses/
  resistances, official rules text, rarity, regulation mark, national Pokédex numbers,
  images.
- **limitlesstcg.com** — scraped per card for the illustrator credit and for
  `printGroup` (which printings across _any_ set, including later ones, are legal
  substitutes for this card in a decklist).
- **pokeapi.co** — species genus/height/weight for the Pokédex info box. Only attached
  to regular (non-ex/non-MEGA) prints, matching what's actually printed on the card.

### `printGroup` goes stale, and that's fine

A card's stored `printGroup` is a snapshot of Limitless's prints table from whenever
_that card's set_ was fetched. If a later set reprints it, the later card's own
snapshot correctly includes the earlier one (Limitless always shows full history), but
the earlier card's stored array doesn't retroactively gain the new one — sets, once
fetched and verified, are never edited again to keep it current.

That's handled by not depending on any single card's copy being current:
`scripts/lib/print-groups.mjs` derives the _actual_ up-to-date group for any card as
the connected component over every card's stored `printGroup`, across every set in
`data/sets/`. As long as one member of a group has the up-to-date list — which the
most recently fetched member always does — the union recovers the full group
regardless of how stale any other member's own array is.

`scripts/refresh-print-groups.mjs` runs that derivation and rewrites every set file's
`printGroup` fields to match, so sets read in isolation stay current too — but this is
a convenience, not a correctness requirement. Run it whenever a set is added (the
`add-set` skill does this as its last step) or skip it; nothing downstream should ever
need to assume a stored `printGroup` is complete on its own.

## Flavor text has no structured source — but there's a shortcut

Neither pokemon-tcg-data, Limitless, nor TCGdex has flavor text for any set newer than
the community got around to typing it in — for MEG none of them had it at all.

Key discovery: TCG flavor text is a **verbatim reuse of an existing mainline-game
Pokédex entry** — usually the species' **Pokémon Scarlet** entry, falling back to an
earlier game (varies per species — Shield, Legends: Z-A, even the Pokopia spinoff have
all shown up) when there's no Scarlet/Violet entry. PokeAPI does **not** have
Scarlet/Violet data at all, so it undershoots this — Bulbapedia's raw wikitext does,
in a clean template: `{{Dex/EntryN|v=Scarlet|entry=...}}`. Fetch a species page with
`?action=raw` and parse those templates (see `parseDexEntries` in
`scripts/flavor-text-editor.mjs`) to get every game's entry for that species.

This isn't 100% automatable (the correct fallback game varies per card), but it turns
manual transcription from "read every card image" into "read a short list of ~15
candidates and pick the match" — usually a few seconds instead of reading the image.

## scripts/flavor-text-editor.mjs

A local tool (`node scripts/flavor-text-editor.mjs MEG`, then open
`http://localhost:5173`) for filling in flavor text by hand: shows the card image next
to a text box, with Bulbapedia's candidate entries listed below (narrows live as you
type) and a "✓ Matches <game>" badge on an exact hit. Saves to
`data/flavor-text/<CODE>.json` (localId → text), kept separate from
`data/sets/<CODE>.json` so re-running `fetch-set.mjs` never wipes out what's been typed
in — it gets merged back in as `flavorText` on the next run. **Re-run `fetch-set.mjs`
after a flavor-text session** — the editor only writes the overlay file; `data/sets/
<CODE>.json` stays stale until the merge step runs again.

**"Show unmatched only" button** (header, top right) — toggles the card grid/nav down
to just the cards whose saved text isn't a verbatim hit against any Bulbapedia
candidate for that species (including still-blank ones). First toggle-on does a full
sweep of every card in the set (shows "Checking… n/total" while it fetches), so it's
slow once, instant after. This is the reliable way to close out a set — a full manual
read-through still misses things like curly-vs-straight apostrophes or a single
mistyped species name (both bit MEG; see git history). Run it as the last step before
calling a set's flavor text done.

**Only "Save & Next" (or ⌘/Ctrl+Enter) persists.** Clicking a Bulbapedia candidate only
fills the textbox — it doesn't save. Prev, Skip, and jumping via the number grid don't
save either; an edit followed by one of those is silently lost (the box reverts to
whatever was last saved). Always Save & Next before navigating away from an edit.

Not yet done: batch-fetching Bulbapedia candidates for a whole set upfront (or
pre-filling the obvious Scarlet match) rather than fetching on-demand per card as you
page through the editor. Lower priority now that the unmatched filter exists.

### Bulbapedia wikitext parsing (`parseDexEntries` / `cleanDexEntry` / `splitTemplateParams`)

Two structural gotchas cost the most debugging time on MEG, both from treating
wikitext as flat rather than nested:

- **Nested templates inside an entry silently drop the whole entry** if you match
  `{{Dex/EntryN|...}}` with a regex that excludes braces from the body (`[^{}]+`) —
  any entry containing e.g. `{{ScPkmn}}` or `{{tt|*|...}}` just vanishes from the
  candidate list with no error. Fixed by depth-counting `{{`/`}}` instead
  (`extractDexEntryTemplates`).
- **Piped wiki-links silently truncate an entry** if param-splitting only tracks
  `{{`/`}}` depth and not `[[`/`]]` — the `|` inside `[[Sinnoh myths|myths]]` gets
  read as a param separator, and everything after it is dropped. `splitTemplateParams`
  tracks both bracket types together.

Bulbapedia templates handled so far in `cleanDexEntry`: `ScPkmn`, `ScBall`, `p`/`P`,
`t`, `m`, `status`, `a`, `OBP`, `pkmn`/`pkmn2`, `tt` (footnote markers dropped, real
text kept), `sup/N` (dropped). If a new set's candidates show stray `{{`/`}}`/`[[`/`]]`
in the text, it's almost certainly an unhandled template — check what it renders to
on the actual Bulbapedia page before guessing.

## Lessons from building MEG and PFL

- **Don't reach for subagents on bulk image-transcription work.** Spawning parallel
  agents to read card images one by one stalled repeatedly (10-minute idle watchdog,
  even at small batch sizes) and cost more time than doing it directly. For ~100+
  images, just read them inline.
- Rarity names, dex numbers, and rules text are trustworthy from pokemon-tcg-data.
  Artist and print-group data only exist on Limitless. Flavor text has no reliable
  structured source — see above.
- **Default division of labor for flavor text: the user does the bulk pass in the
  browser, Claude only touches the leftovers.** Reading a card image costs Claude
  roughly 1,000–1,600 tokens, so having Claude transcribe an entire ~100-card set
  runs six figures in tokens for work a human can do by eye for free. Instead: the
  user fills in cards by hand at `http://localhost:5173`, then Claude runs the
  "Show unmatched only" sweep (or the equivalent `fetch("/api/cards")` +
  `fetch("/api/flavor-candidates?name=...")` loop from the shell) and only reads
  images for whatever's still flagged — a handful of cards, not the whole set. Only
  do the full-set read-through yourself if the user explicitly asks for it.
- **Don't improvise one-off shell pipelines for simple lookups.** Chaining a new
  `curl | python3 -c ...`, `curl | grep`, `find`, etc. together for something like
  "what's this field in a remote JSON file" triggers a fresh permission prompt for
  every slightly different command, which is friction for no reason. Reach for a
  dedicated tool instead — e.g. `WebFetch` for a URL — since it's already permitted
  and doesn't require inventing a new shell one-liner per query. Save Bash for things
  that actually need a shell (running scripts, git, checking running processes).

## Adding the next set

The `add-set` skill (`.claude/skills/add-set/skill.md`) covers this end-to-end. Steps:

```sh
node scripts/fetch-set.mjs <ptcgDataSetId> <LimitlessCode>
# e.g. node scripts/fetch-set.mjs sv10 ASC
node scripts/flavor-text-editor.mjs <LimitlessCode>
# ...user fills in flavor text by hand, then Claude runs the "Show unmatched only"
# sweep and only reads images for whatever's still flagged (see "Lessons" above)...
node scripts/fetch-set.mjs <ptcgDataSetId> <LimitlessCode>   # re-run to merge flavor text in
node scripts/refresh-print-groups.mjs                        # propagate reprints into older sets' printGroup
npm run typecheck
```

Find `ptcgDataSetId` from pokemon-tcg-data's `sets/en.json` (its `id` field). Sets
still to do, in release order: Ascended Heroes (ASC), Perfect Order (POR), Chaos
Rising (CRI), Pitch Black (PBL) — codes and release dates are in the sibling
`my-pokemon-card-collection` repo's `src/config/megaEvolution.ts`.
