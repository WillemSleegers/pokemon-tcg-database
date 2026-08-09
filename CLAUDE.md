# pokemon-tcg-database

A structured JSON database of Pokémon TCG cards, built set by set. Full per-source
notes are in `README.md` — this file is about how the pipeline works and why, for
picking the work back up.

## Status

`data/sets/MEG.json` (Mega Evolution, 188 cards), `data/sets/PFL.json` (Phantasmal
Flames, 130 cards), `data/sets/ASC.json` (Ascended Heroes, 295 cards),
`data/sets/POR.json` (Perfect Order, 124 cards), `data/sets/CRI.json` (Chaos Rising,
122 cards), and `data/sets/PBL.json` (Pitch Black, 120 cards) are complete, including
flavor text — verified against Bulbapedia via the flavor-text editor's "Show unmatched
only" filter (see below), not just eyeballed. That's the entire Mega Evolution series
done. `data/sets/SVI.json` (Scarlet & Violet base set), `data/sets/SVE.json`
(Scarlet & Violet Energies, 16 cards — energy cards, no flavor text applicable), and
`data/sets/PAL.json` (Paldea Evolved, 279 cards) are also complete — their flavor
text came from pokemon-tcg-data directly rather than the crop workflow (see
"Scarlet & Violet: check per-set, don't assume"). PAL's verification sweep caught one
real upstream error (Flamigo's flavor text had an extra "the" not present on the
actual card) and needed a fix to the editor's species-name lookup for regional forms
(see "Regional forms and Bulbapedia lookups" below). `data/sets/OBF.json` (Obsidian
Flames, 230 cards) is also complete — its verification sweep caught three upstream
errors in pokemon-tcg-data's `flavorText` (Chandelure missing spaces around an em
dash, Frogadier using the wrong unit — "600 metres" instead of the card's actual
"2,000 feet" — and the same Flamigo "extra the" error PAL had, on its OBF reprint),
each confirmed against the actual card image and fixed via the `data/flavor-text/
OBF.json` overlay. `data/sets/MEW.json` (151, 207 cards) is also complete — its
verification sweep initially flagged Nidoran ♀ and Nidoran ♂ as unmatched, but both
turned out to have correct flavor text; the real bug was in the Bulbapedia
species-name lookup (see "Regional forms and Bulbapedia lookups" below).
`data/sets/PAR.json` (Paradox Rift, 266 cards) is also complete — its verification
sweep flagged three cards; Bounsweet's `flavorText` had a real upstream error (a
stray space from the card's line-wrap hyphenation, "boiled- down" instead of
"boiled-down", confirmed against the card image and fixed via the `data/flavor-text/
PAR.json` overlay), while Mienfoo and Whismur were confirmed correct as printed —
they just don't match Bulbapedia's own wording for that game version (Mienfoo's
printed "flurry of graceful attacks" vs. Bulbapedia's Shield entry "flurry of
attacks"; Whismur's printed "it's exhausted" vs. a typo, "its exhausted", in
Bulbapedia's own Shield entry). `data/sets/PAF.json` (Paldean Fates, 245 cards) is
also complete — its verification sweep flagged four cards: Magmortar and both
Revavroom prints had the same line-wrap em-dash bug as PAR's Bounsweet (a stray space
after the dash where the card wraps a line right at it — e.g. "environment— it"
instead of "environment—it"), confirmed against the card images and fixed via the
`data/flavor-text/PAF.json` overlay; Heat Rotom was a lookup bug, not a text error
(see "Regional forms and Bulbapedia lookups" below). `data/sets/TEF.json` (Temporal
Forces, 218 cards) is also complete — its verification sweep flagged one card,
Sharpedo, whose printed text ("the scent of prey") drops an "its" present in
Bulbapedia's closest-matching (Sword) entry ("the scent of its prey"); confirmed
correct as printed against the card image, no fix needed. `data/sets/TWM.json`
(Twilight Masquerade, 226 cards) is also complete — its flavor text came from
pokemon-tcg-data directly (148/148 eligible cards covered). Its verification sweep
flagged four cards (Sandshrew, Scolipede, Ducklett, Swanna) and one lookup bug (Teal
Mask Ogerpon — fixed by adding Ogerpon's mask-form prefixes to the species-name
strip, same fix category as Heat Rotom; see "Regional forms and Bulbapedia lookups").
The four flagged cards were each confirmed correct as printed against the card image
and each differs from Bulbapedia's own closest (Violet, mostly) entry by a single
word or character that reads as a Bulbapedia-side transcription slip, not a data
error: Sandshrew "rolling into a ball" vs. Bulbapedia's "rolling in a ball";
Scolipede "claws' toxic spikes" (plural possessive) vs. Bulbapedia's "claw's toxic
spikes"; Ducklett "diving into the depths" vs. Bulbapedia's "diving in to the
depths"; Swanna "a Swanna performing" vs. Bulbapedia's "Swanna performing" (missing
article). No fix needed. `data/sets/SFA.json` (Shrouded Fable, 99 cards) is also
complete — the first set built via the crop workflow (pokemon-tcg-data has 0%
`flavorText` coverage for `sv6pt5` onward), Claude transcribed all 62 eligible cards
directly from cropped image strips. Its verification sweep flagged one lookup bug,
Bloodmoon Ursaluna — no separate Bulbapedia page, same category as Heat Rotom and
Teal Mask Ogerpon; its Dex entries live on the base `Ursaluna (Pokémon)` page, and the
Violet entry is a verbatim match — fixed by stripping the `Bloodmoon` prefix in
`speciesName()` (see "Regional forms and Bulbapedia lookups"). `data/sets/SCR.json`
(Stellar Crown, 175 cards) is also complete — built via the crop workflow like SFA
(zero `flavorText` coverage in pokemon-tcg-data for `sv7`), Claude transcribed all 127
eligible cards directly from cropped image strips. Its verification sweep flagged one
card, Grubbin, whose printed "It spits sticky threads" (plural) differs from
Bulbapedia's own Violet entry, "It spits sticky thread" (singular) — the card's
wording is internally consistent (plural "threads...them") while Bulbapedia's is not
(singular "thread...them"), reading as a Bulbapedia-side transcription slip; confirmed
correct as printed against the card image, no fix needed. `data/sets/SSP.json`
(Surging Sparks, 252 cards) is also complete — built via the crop workflow like SFA
and SCR (zero `flavorText` coverage in pokemon-tcg-data for `sv8`), Claude transcribed
all 166 eligible cards directly from cropped image strips. Its verification sweep
flagged both Castform Sunny Form cards (localId 20 and its 195 reprint) as a lookup
bug, not a text error — "Castform Sunny Form" has no separate Bulbapedia page, its Dex
entries live on the base `Castform (Pokémon)` page, same category as Heat Rotom, Teal
Mask Ogerpon, and Bloodmoon Ursaluna; fixed by stripping the `Sunny|Rainy|Snowy Form`
suffix in `speciesName()` (see "Regional forms and Bulbapedia lookups").
`data/sets/PRE.json` (Prismatic Evolutions, 180 cards) is also complete — built via
the crop workflow (zero `flavorText` coverage in pokemon-tcg-data for `sv8pt5`),
Claude transcribed all 61 eligible cards directly from cropped image strips. Its
verification sweep flagged one card, Lopunny, whose printed "If danger approaches"
(singular) differs from Bulbapedia's own Sword entry, "If dangers approaches" —
Bulbapedia's own wording is grammatically broken (plural noun with singular verb),
reading as a Bulbapedia-side typo rather than a data error; confirmed correct as
printed against the card image, no fix needed. `data/sets/JTG.json` (Journey
Together, 190 cards) is also complete — built via the crop workflow (zero
`flavorText` coverage in pokemon-tcg-data for `sv9`), Claude transcribed all 136
eligible cards directly from cropped image strips. Its verification sweep flagged
two cards, both confirmed correct as printed against the card images: Karrablast's
printed "eat the shell—it eats" has no space around the em dash where the card wraps
a line right at it, differing only from Bulbapedia's own Shield entry, which has a
stray space there — the same line-wrap artifact category as PAR's Bounsweet and
PAF's Magmortar/Revavroom; and Meowscarada's printed "lining its cape" differs from
Bulbapedia's own Scarlet/Pokopia entries, "lining in its cape", which read as a
Bulbapedia-side wording glitch (the extra "in" is redundant), not a card error.

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

### scripts/check-flavor-text.mjs — the headless counterpart

`node scripts/check-flavor-text.mjs <CODE>` runs the same "blank or non-matching
against any Bulbapedia candidate" check as the editor's "Show unmatched only" button,
but as a plain CLI command with no server and no browser — this is what Claude should
run to verify a set, rather than driving the interactive editor's HTTP API. The editor
is for the user typing text in by hand; this script is for verification, which is a
separate concern. Both share the actual Bulbapedia fetching/parsing logic
(`speciesName`, `normalize`, `parseDexEntries`, `fetchFlavorCandidates`) from
`scripts/lib/bulbapedia.mjs` rather than duplicating it.

A card the script flags isn't automatically wrong — check it against the actual card
image (`.local/card-images-cropped/<CODE>/<localId>.png`, or crop it if not already
cached) before touching anything. OBF's sweep flagged three cards; two were real
upstream errors in pokemon-tcg-data's `flavorText` (confirmed by comparing to the
card image and fixed via the overlay), the third was a correct read that just
differs from Bulbapedia's own transcription by one space around an em dash — spacing
inconsistencies like that don't always indicate a real error.

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

Bulbapedia templates handled so far in `cleanDexEntry`: `ScPkmn`, `ScBall`, `Berries`,
`p`/`P`, `t`, `m`, `status`, `a`, `OBP`, `pkmn`/`pkmn2`, `tt` (footnote markers dropped,
real text kept), `sup/N` (dropped). If a new set's candidates show stray
`{{`/`}}`/`[[`/`]]` in the text, it's almost certainly an unhandled template — check
what it renders to on the actual Bulbapedia page before guessing. (Found `{{Berries}}`
this way while doing PBL's Charcadet — it renders to the plain word "Berries".)

### Regional forms and Bulbapedia lookups

`speciesName()` (`scripts/flavor-text-editor/client.js`) strips a trainer-possessive
prefix (`"Erika's Oddish"` → `"Oddish"`) before looking up Bulbapedia candidates, but
originally didn't strip regional-form prefixes like `"Paldean Wooper"` or
`"Paldean Tauros"` — Bulbapedia has no separate page for those, their Dex entries live
on the base species' page (`Wooper (Pokémon)`, `Tauros (Pokémon)`) alongside the
regular form's. Found while verifying PAL: the "Show unmatched only" sweep flagged
every Paldean Tauros breed and Paldean Wooper as unmatched purely because the lookup
went to a nonexistent `"Paldean Wooper" (Pokémon)` page, not because the saved text was
wrong (all of it checked out by hand against Bulbapedia — Tauros against the Violet
entry, a valid fallback since Scarlet/Violet share the same generation). Fixed by
stripping `Paldean|Galarian|Alolan|Hisuian` prefixes the same way as the possessive
case. `parseDexEntries` doesn't filter by form — it returns every entry on the page
regardless of which form it belongs to — so this relies on no other form on that same
page happening to have identical flavor text, which hasn't been an issue so far.

Same category of bug, found while verifying MEW: card names `"Nidoran ♀"` /
`"Nidoran ♂"` have a space before the gender symbol, but Bulbapedia's actual page
titles don't (`Nidoran♀ (Pokémon)`) — the spaced title exists only as a redirect
stub (`#REDIRECT [[Nidoran♀ (Pokémon)]]`), and the raw-wikitext fetch doesn't follow
redirects, so it returned zero `Dex/EntryN` templates and both cards were flagged as
unmatched despite correct, verified text. Fixed by stripping the space before `♀`/`♂`
in `speciesName()` (both the shared `scripts/lib/bulbapedia.mjs` copy and the
`client.js` duplicate).

Same category again, found while verifying PAF: `"Heat Rotom"` has no separate
Bulbapedia page — its Dex entries live on the base `Rotom (Pokémon)` page, same as
regional forms. Fixed by stripping `Heat|Wash|Frost|Fan|Mow` prefixes before `Rotom`
in both `speciesName()` copies.

Same category again, found while verifying TWM: `"Teal Mask Ogerpon"` has no separate
Bulbapedia page — its Dex entries live on the base `Ogerpon (Pokémon)` page, same as
regional forms and Rotom's appliance forms. Fixed by stripping
`Teal|Wellspring|Hearthflame|Cornerstone` prefixes before `Mask Ogerpon` in both
`speciesName()` copies (only `Teal Mask Ogerpon` has shipped in a set so far, but the
other three mask forms follow the same naming pattern).

Same category again, found while verifying SFA: `"Bloodmoon Ursaluna"` has no separate
Bulbapedia page — its Dex entries live on the base `Ursaluna (Pokémon)` page, same as
the regional/appliance/mask forms above. Fixed by stripping the `Bloodmoon` prefix
before `Ursaluna` in both `speciesName()` copies.

Same category again, found while verifying SSP: `"Castform Sunny Form"` has no
separate Bulbapedia page — its Dex entries live on the base `Castform (Pokémon)` page,
same as the other weather/appliance/mask forms above. Fixed by stripping the trailing
`Sunny|Rainy|Snowy Form` suffix before `Castform` in both `speciesName()` copies (only
the Sunny Form has shipped in a set so far, but Rainy and Snowy Form follow the same
naming pattern).

## Bulk flavor text via cropped images

For sets with no structured flavor-text source at all (any Mega Evolution set;
Scarlet & Violet sets `sv6pt5` onward — see below), this is now the default way
Claude fills in the bulk of a set, instead of the user doing it by hand in the
browser. A full card image costs Claude ~1,000 tokens to read; the flavor text is
always a small strip near the bottom, so cropping down to just that strip costs
~90 tokens instead — cheap enough to read the whole set directly.

```sh
node scripts/download-images.mjs <CODE>              # cache full images locally first
node scripts/crop-flavor-text.mjs <CODE> <top> <height> [left] [width]
```

`top`/`height` are pixel coordinates and **must be calibrated per set** — crop one
sample card, look at the result, adjust until the box cleanly frames the text with a
little margin, then apply it to the whole set. Card templates differ enough between
series (Mega Evolution's separate copyright line below the flavor text vs Scarlet &
Violet's single footer row) that a box from one doesn't carry over to the next, even
though both happen to be ~733×1024 images. Known-good boxes so far: Mega Evolution
`top=900 height=95` (full width), Scarlet & Violet `top=905 height=95` (full width).

Then, for each card: Claude reads the cropped image (`.local/card-images-cropped/
<CODE>/<localId>.png`) inline — same "don't spawn subagents for this, just read them
one after another" reasoning as the old full-image approach (see Lessons below), just
much cheaper per card now. Cross-check the transcription against that species'
Bulbapedia candidates (`fetch("/api/flavor-candidates?name=...")` against a running
`flavor-text-editor.mjs` instance — strip any trainer-possessive prefix first, e.g.
"Erika's Oddish" → "Oddish") before trusting it, and save via `POST /api/flavor-text`
(same endpoint the browser UI uses, writes to the overlay file). An exact match
against a candidate is a strong signal the transcription is right; if nothing matches,
double check the crop/reading before saving — Claude misreading a character is a much
likelier explanation than the card printing text absent from every mainline game.

The `http://localhost:5173` editor and its "Show unmatched only" sweep are still the
closing step regardless of who filled the text in — run it last, same as before.

### Scarlet & Violet: check per-set, don't assume

Unlike Mega Evolution, older Scarlet & Violet sets _do_ have flavor text already in
pokemon-tcg-data's own `flavorText` field (`fetch-set.mjs` reads it automatically,
overridden by the manual overlay if present) — the community had years to fill it in.
But coverage has a hard cutoff, not a gradient: `sv1`–`sv6` and `sve` are 100%
covered, `sv6pt5` ("Shrouded Fable") onward through `sv10` are 0% covered, checked
card by card. `svp` (the ongoing promo set) is partial. Check any new SV set for
coverage before assuming either way; don't extrapolate from a neighboring set.
`node scripts/flavor-text-coverage.mjs <CODE>` does this check — no network calls,
just counts how many of the set's `pokedex`-eligible cards already have `flavorText`
in the fetched set file — instead of an improvised inline script each time.

Even where coverage exists, still run the verification sweep — it caught a real
upstream error in `sv1` (one card's `flavorText` was copy-pasted from an unrelated
Pokémon entirely; see git history) that a presence check alone would have missed.

## Lessons from building MEG and PFL

- **Don't reach for subagents on bulk image-transcription work.** Spawning parallel
  agents to read card images one by one stalled repeatedly (10-minute idle watchdog,
  even at small batch sizes) and cost more time than doing it directly. For ~100+
  images, just read them inline.
- Rarity names, dex numbers, and rules text are trustworthy from pokemon-tcg-data.
  Artist and print-group data only exist on Limitless. Flavor text has no reliable
  structured source — see above.
- **(Superseded — see "Bulk flavor text via cropped images" below.) Originally,
  the default division of labor had the user do the whole bulk pass by hand in the
  browser, since reading a full card image costs Claude ~1,000–1,600 tokens and
  transcribing an entire ~100-card set that way ran six figures in tokens for work
  a human can do by eye for free.** Cropping down to just the flavor-text strip
  (~90 tokens/card) made Claude doing the bulk pass directly cheap enough to be the
  new default instead. The `http://localhost:5173` editor and the "Show unmatched
  only" sweep still exist and are still how a set gets verified either way.
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
# e.g. node scripts/fetch-set.mjs me5 PBL
node scripts/download-images.mjs <LimitlessCode>              # cache images before cropping
node scripts/crop-flavor-text.mjs <LimitlessCode> <top> <height>   # calibrate on one card first
node scripts/flavor-text-editor.mjs <LimitlessCode>
# ...Claude reads the cropped images and transcribes+verifies+saves via the editor's
# API (see "Bulk flavor text via cropped images" above), then runs the "Show unmatched
# only" sweep as the closing check...
node scripts/fetch-set.mjs <ptcgDataSetId> <LimitlessCode>   # re-run to merge flavor text in
node scripts/refresh-print-groups.mjs                        # propagate reprints into older sets' printGroup
npm run typecheck
```

Find `ptcgDataSetId` from pokemon-tcg-data's `sets/en.json` (its `id` field). The
entire Mega Evolution series (MEG, PFL, ASC, POR, CRI, PBL) is done, plus
Scarlet & Violet's SVI, SVE, PAL (sv2), OBF (sv3), MEW (sv3pt5), PAR (sv4), PAF
(sv4pt5), TEF (sv5), TWM (sv6), SFA (sv6pt5, Limitless code `SFA`), SCR (sv7,
Limitless code `SCR`), SSP (sv8, Limitless code `SSP`), PRE (sv8pt5, Limitless
code `PRE`), and JTG (sv9, Limitless code `JTG`). The backlog now needs the crop
workflow for the rest, since these are confirmed to have zero flavor-text coverage
in pokemon-tcg-data (see "Scarlet & Violet: check per-set, don't assume" above):
Destined Rivals (sv10). Its Limitless code isn't confirmed yet — look it up on
limitlesstcg.com before starting.
