# pokemon-tcg-database

A structured JSON database of Pokémon TCG cards, built set by set. Full per-source
notes are in `README.md`. This file is about how the pipeline works and why, for
picking the work back up. **The full chronological log — which set caught which
upstream bug, the exact wording of every typo found and fixed — lives in
[`HISTORY.md`](HISTORY.md), not here.** This file stays short on purpose: durable
mechanics only, plus a short completion index. When a set is added, append its
story to HISTORY.md, not this file.

## Status

Done, oldest era first (see HISTORY.md for per-set detail):

- **Sword & Shield era** (`swsh1`–`swsh12pt5gg`, plus `cel25`/`cel25c`, `pgo`) — 21 files.
- **Sun & Moon era** (`sm1`–`sm12`) — 20 files.
- **XY era** (`xy0`–`xy12`, `xyp`, plus `dc1` Double Crisis, `g1`/`g1`RC Generations) — 18 files.
- **Black Star Promos, all English** (`WP`, `NP`, `DPP`, `HSP`, `BWP`, `SMP`, `SP`, `SVP`, `XYP`) — 9 files. `SMP`/`SP`/`SVP` are ongoing snapshots; expect periodic re-fetches.
- **MEP** (Mega Evolution promos, pokemon-tcg-data doesn't carry this set at all), **DRV** (Dragon Vault, `dv1`), **MEE** (MEE Basic Energies) — 3 files, found outside any era backfill.
- **Black & White era proper** (`bw1`–`bw11`, `bw11` splitting into `LTR`/`LTRRC`) — 12 files.
- **HGSS era** (`hgss1`–`hgss4`, `col1`) — 5 files.
- **Platinum era** (`pl1`–`pl4`) — 4 files.
- **Mega Evolution series** (MEG, PFL, ASC, POR, CRI, PBL) and **Scarlet & Violet** (SVI, SVE, PAL, OBF, MEW, PAR, PAF, TEF, TWM, SFA, SCR, SSP, PRE, JTG, DRI, BLK, WHT) — done, predates this file's HISTORY.md split.
- **30th Celebration** (`me55` → `30C`, 161 cards) and its **Classic Collection** (`me55c` → `30CCC`, 30 cards) — 2 files. The subset shares `30C`'s Limitless page and needs both the third and fourth arguments, plus `data/local-id-map/` for its LEGEND pair; see HISTORY.md.
- **Diamond & Pearl era** (`dp1`–`dp7`) — `DP`, `MT`, `SW`, `GE`, `MD`, `LA`, `SF` — 7 files.
- **Every McDonald's Collection through 2024** (`MCD11`, `MCD12`, `MCD14`–`MCD19`, `MCD21`–`MCD24`) — 12 files. `MCD23`/`MCD24` are in neither pokemon-tcg-data nor Limitless — see HISTORY.md for how those two were hand-built entirely from Bulbapedia/reprint data instead.

- **WotC/e-Card era** (`base1`–`base6`, `gym1`–`gym2`, `neo1`–`neo4`, `si1`,
  `ecard1`–`ecard3`, `bp`) — `BS`, `JU`, `FO`, `BS2`, `TR`, `G1`, `G2`, `N1`,
  `N2`, `SI`, `N3`, `N4`, `LC`, `E1`, `E2`, `E3`, `BG` — 17 files.
- **EX era** (`ex1`–`ex16`, `tk1a`/`tk1b`, `tk2a`/`tk2b`) — `RS`, `SS`, `DR`,
  `MA`, `TK1A`/`TK1B`, `HL`, `RG`, `TRR`, `DX`, `EM`, `UF`, `DS`, `LM`,
  `TK2A`/`TK2B`, `HP`, `CG`, `DF`, `PK` — 20 files.
- **POP series** (`pop1`–`pop9`) — `P1`–`P9` — 9 files. `P1`–`P5` share the
  EX era's no-Pokédex template; `P6`–`P9` switch back to a DP-style template
  (Pokédex box and flavor text both present) since they released after
  Diamond & Pearl's own debut.
- **Misc later sets found outside any era backfill**: `ru1` (Pokémon
  Rumble, `RU`), `fut20` (Pokémon Futsal Collection, `FUT`) — 2 files.

Every set `missing-sets.mjs` can find is now in `data/sets/` — there is no
known remaining gap as of this writing. Don't trust that at face value: run
`node scripts/missing-sets.mjs [series]` (see below) to re-derive the
actual state from `sets/en.json` against `data/sets/` before assuming
there's nothing left to add; a numeric id walk has silently hidden `dc1`,
`dv1`, and `g1` in the past across five different backfills.

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

### `number` is what the card prints — everything on a card gets stored

`number` is defined as the exact phrasing printed on the card, and that's a real
constraint, not a loose description. Three separate ways it had drifted, all found
at once while adding 30th Celebration (see HISTORY.md):

- **Zero-padding is era-dependent.** The TCG only began padding the numerator to
  the denominator's width with Sword & Shield (2020/02/07). Base Set prints
  `58/102`, XY `50/146`, Cosmic Eclipse (2019/11) `50/236`; Sword & Shield prints
  `050/202`. `buildNumber` padded everything, so 7,065 cards across 115 pre-2020
  sets stored a number their card doesn't show. Fixed, and `buildNumber` now takes
  the set's release date. **Verify against a card image before assuming padding.**
- **A throwback-reprint subset prints its original set's number**, not the
  `CC<n>` Limitless files it under — 30CCC's Pikachu prints `58/102`, CELCC's
  Blastoise `2/102`. `CC<n>` is `localId`'s job (defined as exactly the
  Limitless/PTCGL id) and was wrongly duplicated into `number`. See
  `applyThrowbackNumbers`.
- **A card can print more than one number.** 30th Celebration's 30 Pikachu rares
  print `01/30`…`30/30` alongside the normal `023/128`, which is what the optional
  `subsetNumber` field holds.
- **A Black Star Promo prints a bare number, no denominator.** `WP` prints `24`,
  `NP` `040`, `SVP` `150` — all three used to store a fabricated `/53`, `/40`,
  `/102` (311 cards). `numberPad` in `data/set-meta/<CODE>.json` says "bare
  padded number"; it now reaches `buildNumber` on the pokemon-tcg-data path too,
  not just `"NONE"`. `WP` is `numberPad: 1` (unpadded), `NP`/`SVP` are `3`. A
  set that needs nothing else from that file can have just `{ "numberPad": 3 }`.
  Most promo-ish sets are _fine_ and print a real denominator — the McDonald's
  collections, POP series, theme decks, `RU`, `FUT`, `KSS` and Dragon Vault
  (`1/20`), all verified against images.

## Pipeline

`scripts/fetch-set.mjs <ptcgDataSetId> <code> [<limitlessUrlCode>]` merges three
sources per card:

- **pokemon-tcg-data** (GitHub) — primary source. Attacks, abilities, weaknesses/
  resistances, official rules text, rarity, regulation mark, national Pokédex numbers,
  images.
- **limitlesstcg.com** — scraped per card for the illustrator credit and for
  `printGroup` (which printings across _any_ set, including later ones, are legal
  substitutes for this card in a decklist).
- **pokeapi.co** — species genus/height/weight for the Pokédex info box. Only
  attached to regular prints, matching what's actually printed on the card — every
  rarity mechanic that gets its own oversized name treatment or rule box uses that
  space for something else instead, so `fetch-set.mjs` excludes all of those
  subtypes: `ex`, `MEGA`, `V`, `VMAX`, `VSTAR`, `V-UNION`, old-style uppercase `EX`,
  `GX`, `Star`, `Level-Up`/LV.X, `Prime`, `BREAK`, `SP` (Team Galactic's "G" Pokémon,
  which print a "Team Galactic's Pokémon" banner instead). Verified against card
  images, not guessed, each time a set introduced a new one — see HISTORY.md for
  which card caught which. A card old enough to predate the TCG's dex-box
  convention entirely (pre-Diamond & Pearl, ~2006) can still slip through this list
  since it has no distinguishing subtype — two such cases in Classic Collection were
  corrected by hand (see HISTORY.md) rather than guessing at a release-date cutoff.

### Subsets that share their base set's Limitless page

`<code>` is this set's own identity — the output filename, `data/flavor-text/
<code>.json`, and the stored `set.code`/`deckCode`. Normally it's also the Limitless
URL segment (`limitlesstcg.com/cards/<code>`), since one pokemon-tcg-data set has
historically always meant one Limitless page. That assumption breaks for a Trainer
Gallery, Shiny Vault, or Galarian Gallery subset: pokemon-tcg-data splits each of
those out as their own set id, but Limitless has no separate page for them — their
cards live at `limitlesstcg.com/cards/<baseCode>/<localId>`, under the _base_ set's
page, with the local id's leading zeros stripped (pokemon-tcg-data's `SV001`/`TG01`
is Limitless's `SV1`/`TG1` — handled by `toLimitlessLocalId()`). Pass the base set's
code as the third argument in that case: `node scripts/fetch-set.mjs swsh45sv SHFSV
SHF`. Both the resulting file's `limitless.url` and `deckCode` correctly point at
the shared base-set page; only the output filename and `set.code` are _the
subset's own_.

Sometimes pokemon-tcg-data doesn't even split the subset out as its own id (Generations'
Radiant Collection, `bw11`'s own Radiant Collection) — those fetch as one file with
the base set and get split by hand afterward for consistency with the rest of this
category. `printedTotal`/`secretTotal`/`total` need recomputing by hand after a split
like that, since the pre-split numbers don't make sense once the subset's cards are gone.

### Reprint subsets with non-sequential, non-unique numbers

pokemon-tcg-data's `number` field is normally both unique within a set and the
same numbering Limitless uses, so `fetch-set.mjs` uses it directly as `localId`.
That breaks for a throwback-reprint subset like Celebrations: Classic Collection
(`cel25c`): its `number` is each card's _original_ print number from its original
set, decades earlier — not unique within the subset, and unrelated to Limitless's
own clean sequential numbering for the subset. Pass a fourth argument to override
`localId` with a name-matched `${prefix}<n>` instead: `node scripts/fetch-set.mjs
cel25c CELCC CEL CC` (this also needs the third argument from the section above,
since Classic Collection shares Celebrations' `CEL` Limitless page too). Don't reach
for this unless a set's `number` field actually collides — check first.

**`<sequentialPrefix>` resolves `<n>` by matching each pokemon-tcg-data card's own
name against every `${prefix}<n>` page on Limitless — never by array position.**
An early implementation assumed pokemon-tcg-data's fetched array order matched
Limitless's own sequential numbering and got it wrong for 13 of Classic Collection's
25 cards, pairing each card's name/attacks/images with a _different_ card's
artist/deckCode/printGroup. Fixed by `resolveSequentialLocalIds()`
(`scripts/fetch-set.mjs`): before assigning any localId, it fetches every
`${prefix}<n>` page under the set up front, and pairs each pokemon-tcg-data card
with whichever page's own name actually matches it — throwing loudly on an
unmatched or ambiguous name rather than falling back to position. See HISTORY.md
for the full incident.

#### `data/local-id-map/<CODE>.json` — when name-matching genuinely can't decide

Name-matching has one blind spot it can't resolve on its own: two Limitless pages
under the prefix that really do share a name. An HGSS-era LEGEND card is split
across two physical halves, and pokemon-tcg-data stores them as two entries with
identical name _and_ identical game text — 30th Celebration: Classic Collection's
Darkrai & Cresselia LEGEND (`CC16`/`CC17`). `resolveSequentialLocalIds` throws
naming both pages rather than guessing; pin them by hand in
`data/local-id-map/<CODE>.json` as `{ "<pokemon-tcg-data card id>": "<localId>" }`.

Keyed on pokemon-tcg-data's **`id`** (`me55c-99`), not its `number`, because
`number` is exactly the field that isn't unique in this kind of subset — `me55c`
has three cards numbered 106, upstream-disambiguated as `me55c-106`/`-106p`/`-106m`.
Both sides of every entry are checked against what was actually fetched, so a
stale pin fails loudly instead of silently shadowing a name match that now works.

**Decide the mapping from the card images, never from array order.** A throwback
reprint still prints its _original_ collector number on its face, which is what
pokemon-tcg-data's `number` holds — `CC16` reads `99/102`, `CC17` reads `100/102`,
and that pairs them. Bulbapedia's set list (its entries run in subset order and
name each card's source set and number) is a good second opinion, and after the
fact `refresh-print-groups.mjs` is a third: it derived `CC16 → TM 99` and
`CC17 → TM 100` independently.

### Card numbers with the set code baked in

Some promo sets' pokemon-tcg-data `number` repeats the set code — `xyp`'s
`"XY67"`, `dpp`'s `"DP04"`, `swshp`'s `"SWSH074"` — where Limitless's URL is just
the number. `fetch-set.mjs` handles this automatically, no argument needed:
Limitless 301-redirects most of them (and the canonical id is read back off the
post-redirect URL), and for the ones that hard-404 instead, it retries with a
leading alpha prefix stripped. That retry is guarded on the fetched page's own
`<title>`, since "letters then digits" is also exactly what a legitimate subset
id looks like (`TG01`, `SV001`, `GG01`) — without the check, a subset id that
404s for a real reason would silently attach whatever unrelated card sits at that
bare number in the base set. The title comparison spells out the rarity glyphs
(`★`→`star`, `◇`→`prismstar`), because pokemon-tcg-data keeps the printed symbol
where Limitless writes the word.

### Sets pokemon-tcg-data has, but is behind Limitless on

An ongoing promo set drifts: pokemon-tcg-data can carry fewer cards than Limitless
has catalogued. `--fill-from-limitless` closes that gap without disturbing what's
already there —

```sh
node scripts/fetch-set.mjs svp SVP --fill-from-limitless
```

— by keeping pokemon-tcg-data primary for every card it _does_ have and sending
only the ids it's missing down the same reprint/Bulbapedia fallback path a
`"NONE"` run uses, with the same field-by-field Limitless cross-check. Nothing
already fetched and verified gets re-derived from a weaker source, and a card in
`data/no-limitless/<CODE>.json` (which by definition can't be in Limitless's set
index) is preserved rather than dropped. `total` is recomputed from the merged
card count, since `sets/en.json`'s own is a count of what pokemon-tcg-data has.

It needs `data/set-meta/<CODE>.json` for `bulbapediaSetPage` and `defaultRarity` —
the rest of that file is only read by a full `"NONE"` run.

It's **opt-in**: "Limitless lists an id we don't have" only means something when
the Limitless page is this set's own — a subset sharing its base set's page would
otherwise pull in the entire base set. It also refuses to combine with
`<sequentialPrefix>`, which replaces the `number` field the id diff compares on.

Resolving a fill card's game text goes through three tiers before Bulbapedia:

1. **Stored `printGroup`** — some other set in `data/sets/` already names this print.
2. **The card's own Limitless prints table**, scraped fresh — catches a reprint
   whose _source_ set was fetched before the promo existed and so never recorded it.
3. **Bulbapedia's redirect target** — no card page for a print means it's a
   reprint, and the redirect names the print it reprints. Never _follow_ the
   redirect (that would describe a different print); `fetchCardWikitext` returns
   the redirect target rather than raising on one specifically so this tier can read it.

Known gap: `buildFillCards`'s missing-card diff undercounts what's already present for
any set whose `number` bakes in a redundant set-code prefix (`swshp`'s `"SWSH001"`,
not `"1"`) — it only strips leading zeros, not the whole prefix. `fetchLimitlessExtra`'s
per-card 404 retry has the real prefix-strip logic; the diff doesn't share it. Not
fixed — worth fixing before trusting `--fill-from-limitless` on `swshp`/`xyp`/`dpp` again.

### Sets pokemon-tcg-data doesn't have

pokemon-tcg-data doesn't have every set (no `mep` entry at all, for instance).
Pass `"NONE"` as `<ptcgDataSetId>` for that case: `node scripts/fetch-set.mjs NONE MEP`.

Nothing downstream of the fetch changes — the mode's whole job is to assemble the
same `PrimaryCard[]` that pokemon-tcg-data would have provided:

- **Card list** from the Limitless set page — also the scope decision: a card
  Limitless doesn't catalogue has no `limitless.deckCode`/`printGroup` to record,
  so it isn't in the set as far as this database is concerned.
- **Game text for reprints** from `data/sets/` — any card whose stored `printGroup`
  names this set. A shared print group means identical game text, already verified
  when that set was added.
- **Game text for set-exclusives** from Bulbapedia's card page for that print,
  parsed by `scripts/lib/bulbapedia-card.mjs`. A reprint's promo page is a
  `#REDIRECT` to the original print's page — the reprint lookup has to come first,
  and the fetcher raises on a redirect rather than parsing whatever page it lands on.
- **Set metadata** from `data/set-meta/<CODE>.json`, since there's no `sets/en.json`
  entry to read it from — `printedTotal`, `numberPad`, etc. are judgement calls for
  an ongoing promo set. `set.ptcgDataId` is `null` for these sets.
- **`regulationMark` and `images`** always come off the card's own Limitless page,
  never the reprint source — a promo reprint can have its own artwork and regulation mark.

Every assembled card is then checked field by field against its Limitless page —
name, HP, types, stage, evolvesFrom, weakness/resistance, retreat, attack
names/costs/damage, ability names — and **the run fails on any disagreement**.
Free text (attack effects, Trainer rules) is deliberately not compared — Limitless
writes energy symbols as `[G]` where this database spells out `Grass`, all false alarms.

If you touch this mode, re-prove the check still fires (corrupt an HP, an attack
cost, an ability name; confirm all three are caught) before trusting a clean run.

One thing the Limitless cross-check _can't_ settle: which of several Bulbapedia
`{{TCGTrainerText}}` blocks a Trainer print uses, for a card reprinted across eras.
There the comparison is the resolution — the block whose text matches Limitless's
is the one this print shows.

### `data/no-pokedex/<CODE>.json` — cards that print no dex info box

`fetch-set.mjs` decides whether to attach the Pokédex info box from the card's
subtypes (see Pipeline above), which can't catch a card that predates the
convention entirely: the TCG dropped the dex line for the e-Card era (2002/09) and
didn't bring it back until Diamond & Pearl (2007/05). Neither a subtype nor a
per-set release date decides this, since a promo set can straddle that gap card by
card. List those cards' localIds in `data/no-pokedex/<CODE>.json` (a bare JSON
array; a lone `"*"` means the whole set) and `fetch-set.mjs` skips the box for
them. Confirm each against the actual card image first — see HISTORY.md for which
sets needed this and why (`NP`, `WP`, `DPP`, `SP`, `CELCC`, `HS`, `UL`, `UD`, `TM`).

A second case entirely: HGSS-era LEGEND cards are split across two physical
prints, and pokemon-tcg-data sometimes attaches a Pokédex box/`flavorText` to
_both_ halves even though only the bottom half prints one — or, for dual-species
LEGEND pairs, to _neither_ half despite pokemon-tcg-data/PokeAPI still attaching a
bogus box keyed off one of the two species. Confirm against the card images before
trusting either half. `no-pokedex` only suppresses the `pokedex` field — a bogus
`flavorText` on a card that should have none needs deleting by hand directly in
`data/sets/<CODE>.json`, since no overlay mechanism covers that yet (see HISTORY.md's
HS entry for the one-off precedent).

### `data/no-limitless/<CODE>.json` — cards Limitless doesn't have

`"NONE"` as `<limitlessUrlCode>` covers a set Limitless never catalogued at all
(the McDonald's collections). The long-running promo sets need the per-card
version of the same thing. List those localIds in `data/no-limitless/<CODE>.json`
and they take the same path as `"NONE"` — `artist` from pokemon-tcg-data,
`limitless` set to `null`.

**A card missing from Limitless is not automatically out of scope — check whether
it's a reprint before writing it off.** If Bulbapedia's card page for the print is
a `#REDIRECT` to an already-verified reprint in this database, the reprint's game
text is definitionally identical and the card can be hand-added directly to
`data/sets/<CODE>.json` (`limitless: null`) rather than treated as out of scope.
See HISTORY.md (SP's Jirachi V/Unown V/Lugia V) for the full incident, including
two gotchas that generalize: don't trust a Bulbapedia gallery image's caption
without opening it, and Limitless's own CDN can 403 for a genuinely broken asset
even on a card with an otherwise-normal page.

`limitless` is `null` rather than some placeholder deck code, deliberately — a
fabricated code would either falsely claim print-group knowledge this database
doesn't have, or silently union unrelated cards into one fake print group if two
such cards shared a placeholder (the exact bug the McDonald's Collections hit
originally). Every consumer (`computePrintGroups`, `refresh-print-groups.mjs`,
`buildReprintIndex`) guards on `card.limitless` being non-null and simply skips a
`null` card. It has to be explicit rather than an automatic fallback, because a
404 is also what an id-normalization bug looks like — see the XYP incident in
HISTORY.md for what happens when a fetch silently substitutes bad data instead.

### `data/no-rarity/<CODE>.json` — cards that print no rarity symbol

`fetch-set.mjs` requires an explicit source for `rarity` — either a non-empty
value from pokemon-tcg-data/the fallback path, or the card's localId (or a lone
`"*"`) listed in `data/no-rarity/<CODE>.json`, which stores `"None"` — and throws
naming the card otherwise, so a genuine gap fails loudly instead of silently
dropping the field. **A missing `rarity` field is not always a whole-set case —
check per card before assuming `"*"`**; sometimes pokemon-tcg-data just lacks the
field for a few cards that do have a real rarity (fixed by hand in that case, not
via this overlay — see HISTORY.md's DRV entry).

Every `rarity` value also runs through `normalizeRarity()`, which title-cases a
SCREAMING_SNAKE_CASE upstream constant (`MEGA_ATTACK_RARE` → `Mega Attack Rare`)
rather than special-casing individual strings, and folds three upstream aliases
via `RARITY_ALIASES`: `Rare Secret`/`Rare Ultra`/`Rare Shiny` → `Secret Rare`/
`Ultra Rare`/`Shiny Rare`. pokemon-tcg-data spelled the tier noun first up to
Sword & Shield and switched to the noun-last form the TCG itself uses (and that
Bulbapedia's [Rarity](https://bulbapedia.bulbagarden.net/wiki/Rarity) page
names) once Scarlet & Violet added new tiers — **one upstream convention
abandoned mid-stream, not two eras of official naming.** Don't reconstruct an
era distinction from the split.

Two limits, both deliberate. `Rare Secret` is *not* merged into `Hyper Rare`:
Bulbapedia lists Secret Rare and Hyper Rare as distinct tiers, not a rename.
And the mechanic-specific holo tiers (`Rare Holo EX`/`GX`/`V`/`VMAX`/`VSTAR`,
`Rare BREAK`, `Rare Prime`, `Rare Holo LV.X`, `Rare Prism Star`, `Rare ACE`)
are left verbatim — Bulbapedia's own wording for those is inconsistent in both
order and case ("rare Holo EX", "Rare Prime", "holo rare V", "Amazing rare"),
so there's no canonical target and a mechanical flip would invent names nobody
uses. Note `data/card-overrides/30CCC.json` pins that set's three
`Holo Rare V`/`VMAX`/`VSTAR` cards to the `Rare Holo *` form the other 434 such
cards use; that makes the database self-consistent, but Bulbapedia arguably
favours upstream's original ordering, so revisit it if this family ever does
get normalized.

#### Known rarity-spelling inconsistencies — noted, not flipped

Upstream's spelling of these tiers is inconsistent and the policy is to store it
verbatim and write the inconsistency down, rather than normalize toward a name
nobody uses. Current state, so a future reader doesn't mistake any of it for a
bug in this pipeline:

- **`Rare Holo ex` vs `Rare Holo EX`** — the only same-words-different-case
  collision left in `data/sets/`. It's tempting to read the case as the mechanic
  (`ex` is the EX-era/Scarlet & Violet lowercase Pokémon-ex; `EX` is the
  BW/XY-era Pokémon-EX), but **upstream doesn't maintain that distinction**: 133
  cards with the lowercase `ex` *subtype* carry `Rare Holo EX`, and exactly one
  (30CCC's Scizor ex) carries `Rare Holo ex`. The rarity string's case tells you
  nothing about which mechanic the card is — read `subtypes` for that.
- **Ordering across the `Rare Holo *` family** is upstream's, and Bulbapedia's
  own page disagrees with itself on it (see above). Don't "fix" one member of the
  family in isolation.
- **`Secret Rare` and `Hyper Rare` coexist by design** — distinct tiers, and the
  pre-SV/SV split in which sets use which is real, unlike the noun-order split
  that `RARITY_ALIASES` folds away.

To re-derive this list rather than trusting it: group every stored `rarity` by
its lowercased word-set and print any group with more than one spelling.

**pokemon.com's own current tier list** (Mega Evolution era) is exactly nine
names: Common, Uncommon, Rare, Double Rare, Ultra Rare, Illustration Rare,
Special Illustration Rare, Mega Attack Rare, Mega Hyper Rare. Audited against
`data/sets/`, everything this database stores outside those nine is accounted
for, so don't treat the extras as drift:

- **Earlier-era tiers, on purpose.** All of `30CCC`'s oddities (`Rare Holo`,
  `Rare Holo EX`/`GX`/`ex`/`LV.X`/`V`/`VMAX`/`VSTAR`, `Rare Prime`, `Rare BREAK`,
  `Amazing Rare`, `Legend`, `Secret Rare`) are a throwback-reprint subset whose
  cards each carry their *original* era's tier — correct by definition.
- **Tiers pokemon.com's current list has dropped rather than never had.**
  `Hyper Rare` (74 cards, 14 Scarlet & Violet sets) is the SV-era name for the
  gold cards, superseded by `Mega Hyper Rare`; `ACE SPEC Rare` (33) is likewise
  a real SV tier. Their absence from a Mega-era page isn't evidence against them.
  Note `Secret Rare` isn't on the list either — it's the *pre-SV* tier that
  `Hyper Rare` succeeded, which is the substantive reason not to merge the two.
- **Subset- and set-specific tiers.** `PAF`'s `Shiny Rare`/`Shiny Ultra Rare`,
  `BLK`/`WHT`'s `Black White Rare`, `30C`'s `Pikachu Rare`/`RGB Rare`/
  `Futuristic Rare`, `MEP`'s `Promo`, `MEE`'s `None`.
- **`Rare Shiny GX`** (35 cards) is left verbatim while bare `Rare Shiny` was
  folded to `Shiny Rare`, because the `GX` makes it mechanic-specific — same
  reasoning as the `Rare Holo *` family, but it does mean the two sit in the
  database spelled opposite ways round.

#### Open: `Rare Holo *` is a finish and a tier in one string

**Worth revisiting; deliberately not touched yet.** Holo was never a rarity tier
in the TCG's symbol system — it's a *print finish*. A Holofoil Rare and a
non-holo Rare print the same ★ symbol, and Bulbapedia describes Holofoil Rare as
a print variant within the Rare tier ("A small amount of rare cards within each
expansion are available as both Regular Rare and Holofoil Rare"), not a tier of
its own. That's why `Holo` appears nowhere on pokemon.com's nine-name list: it
was never on it to drop. It also stopped mattering from Scarlet & Violet on,
where every Rare in a booster pack is guaranteed to be a Holofoil Rare, so the
holo/non-holo distinction has nothing left to distinguish.

pokemon-tcg-data folded the finish into the `rarity` string anyway, which is
where the whole `Rare Holo`/`Rare Holo EX`/`GX`/`V`/`VMAX`/`VSTAR`/`LV.X`/`Star`
family comes from, and why its naming was never canonical enough to normalize
(see above). **So a `Rare Holo *` value is a finish+tier composite, not a tier —
don't reconcile it against pokemon.com's list and conclude the data is wrong.**

The strictly-correct representation is `rarity: "Rare"` plus a separate finish
field. That's a schema change (`types/card.ts`, `fetch-set.mjs`, and ~2,400
cards across most of `data/sets/`), not a naming pass, so it's left as is for
now. If it gets done, revisit `data/card-overrides/30CCC.json`'s three
`Rare Holo V`/`VMAX`/`VSTAR` pins at the same time — those only exist to make
that set consistent with the rest of the family, and the family would be gone.

### `data/card-overrides/<CODE>.json` — upstream is wrong and we know better

`{ "<localId>": { <field>: <value> } }`, shallow-merged onto the assembled card.
For the case where pokemon-tcg-data carries a field that's simply _wrong_ and the
right value is established from the card image, Bulbapedia or Limitless —
30th Celebration's three RGB Rare Mew cards are filed upstream as `"Common"`
where the card, the wiki and Limitless all agree they're a secret rarity.

**Reach for this only when the value is wrong, not when the pipeline is.** A
card slipping through a subtype exclusion, a mis-normalized localId or a bad
crop is a bug to fix in `fetch-set.mjs`; this file is for upstream's own errors,
and using it to paper over the former is how it turns into a dumping ground.

It exists rather than hand-editing `data/sets/<CODE>.json` because the normal
pipeline re-runs `fetch-set.mjs` after the flavor-text pass, which rewrites that
file and would silently drop a hand-edit. (The older DRV/HS-era precedent of
editing the output directly predates this and only survives because those sets
were never re-fetched.) Guards: `localId`, `limitless` and `name` are refused
outright — a wrong localId or a fabricated `limitless` block is the exact class
of bug the rest of the script works to make impossible — and a key naming a card
that isn't in the set throws. `supertype` used to be refused alongside them and
isn't any more (it names no card and claims no provenance, and it's right there
on the card's face); it's checked against the three legal values instead.
`assertSupertypeConsistency` is the real guard there: a non-Pokémon card
carrying `weaknesses`, `resistances`, `retreatCost` or `evolvesFrom` fails the
run. Deliberately *not* `hp`/`attacks` — a Fossil prints HP and a Technical
Machine prints an attack, both legitimately Trainers (95 such cards).

`pokedexNumber` is the one key that isn't a plain field assignment: it takes a
National Pokédex number and builds the whole `pokedex` box from PokeAPI, for a
card that prints a dex line but that pokemon-tcg-data gives no
`nationalPokedexNumbers` for (`30CCC`'s Erika's Jigglypuff, whose own face
prints `#39`). Note this is the _opposite_ direction from `data/no-pokedex/`,
which suppresses a box that shouldn't be there.

### `limitless.printGroup` goes stale, and that's fine

A card's stored `limitless.printGroup` is a snapshot of Limitless's prints table from
whenever _that card's set_ was fetched. If a later set reprints it, the later card's
own snapshot correctly includes the earlier one (Limitless always shows full history),
but the earlier card's stored array doesn't retroactively gain the new one — sets,
once fetched and verified, are never edited again to keep it current.

That's handled by not depending on any single card's copy being current:
`scripts/lib/print-groups.mjs` derives the _actual_ up-to-date group for any card
(skipping any whose `limitless` is `null`) as the connected component over every
card's stored `limitless.printGroup`, across every set in `data/sets/`. As long as
one member of a group has the up-to-date list — which the most recently fetched
member always does — the union recovers the full group regardless of how stale any
other member's own array is.

`scripts/refresh-print-groups.mjs` runs that derivation and rewrites every set file's
`limitless.printGroup` fields to match, so sets read in isolation stay current too —
but this is a convenience, not a correctness requirement. Run it whenever a set is
added (the `add-set` skill does this as its last step) or skip it; nothing downstream
should ever need to assume a stored `printGroup` is complete on its own.

## Flavor text has no structured source — but there's a shortcut

Neither pokemon-tcg-data, Limitless, nor TCGdex has flavor text for any set newer than
the community got around to typing it in.

**Some sets genuinely print no flavor text on any card at all** — confirmed for Gym
Heroes/`G1` by reading multiple card images directly (template has the Pokédex
genus/height/weight line but no italic descriptive sentence beneath it). `flavorText`
being absent for 0% of a set's cards isn't automatically a gap to fill; check the
actual card template before assuming pokemon-tcg-data/manual transcription owes you
something here.

Key discovery: TCG flavor text is a **verbatim reuse of an existing mainline-game
Pokédex entry** — usually the species' **Pokémon Scarlet** entry, falling back to an
earlier game (varies per species — Shield, Legends: Z-A, even the Pokopia spinoff have
all shown up) when there's no Scarlet/Violet entry. PokeAPI does **not** have
Scarlet/Violet data at all, so it undershoots this — Bulbapedia's raw wikitext does,
in a clean template: `{{Dex/EntryN|v=Scarlet|entry=...}}`. Fetch a species page and
parse those templates (see `parseDexEntries` in `scripts/flavor-text-editor.mjs`)
to get every game's entry for that species.

**Fetch wikitext through `fetchWikitext()` (`scripts/lib/bulbapedia.mjs`), which
goes through the MediaWiki API — not `index.php?action=raw`.** Cloudflare started
answering `action=raw` with a 403 "Just a moment..." interstitial; `api.php` on the
same host isn't challenged. This mattered more than it sounds: `fetchFlavorCandidates`
swallows a non-ok response (`if (!res.ok) return []`), so the block failed _silently_
— `check-flavor-text.mjs` reported every card unmatched rather than erroring, and the
editor's "Show unmatched only" sweep was equally worthless. **If a whole set suddenly
comes back unmatched, check Bulbapedia is actually reachable before touching the
text.** `node scripts/fetch-flavor-candidates.mjs Pikachu` returning "(no candidates
found)" is the quickest tell.

This isn't 100% automatable (the correct fallback game varies per card), but it turns
manual transcription from "read every card image" into "read a short list of ~15
candidates and pick the match" — usually a few seconds instead of reading the image.

A handful of sets/cards break the "verbatim Pokédex reuse" premise entirely — Double
Crisis's whole set (in-character Team Magma/Team Aqua ops chatter), Detective
Pikachu's movie tie-in text, Classic Collection's Dark Gyarados and birthday-Pikachu,
EVO's Flying/Surfing Pikachu, various SVP anime-tie-in promos, Team Rocket's whole
"Dark" Pokémon roster (custom corrupted-Pokémon lore text, no matching mainline
species page to compare against at all), and a few holo-print Legendary birds with
freshly paraphrased text. `check-flavor-text.mjs` will flag these
and can never clear them algorithmically — confirm against the card image once, and
that's the expected permanent state. See HISTORY.md for the specific cards.

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
mistyped species name. Run it as the last step before calling a set's flavor text done.

**Only "Save & Next" (or ⌘/Ctrl+Enter) persists.** Clicking a Bulbapedia candidate only
fills the textbox — it doesn't save. Prev, Skip, and jumping via the number grid don't
save either; an edit followed by one of those is silently lost. Always Save & Next
before navigating away from an edit.

### scripts/check-flavor-text.mjs — the headless counterpart

`node scripts/check-flavor-text.mjs <CODE>` runs the same "blank or non-matching
against any Bulbapedia candidate" check as the editor's "Show unmatched only" button,
but as a plain CLI command with no server and no browser — this is what Claude should
run to verify a set, rather than driving the interactive editor's HTTP API. Both share
the actual Bulbapedia fetching/parsing logic (`speciesName`, `normalize`,
`parseDexEntries`, `fetchFlavorCandidates`) from `scripts/lib/bulbapedia.mjs` rather
than duplicating it.

**A clean sweep only means something when the text and the check came from
different places.** This script compares against Bulbapedia, so for text that
was itself sourced from Bulbapedia (the set-exclusive cards in a `"NONE"`
`<ptcgDataSetId>` run) it's checking a source against itself and will pass
regardless. Read those cards' cropped strips against the stored text instead.
Text from pokemon-tcg-data is genuinely independent of Bulbapedia, so a clean
sweep there is real evidence.

A card the script flags isn't automatically wrong — check it against the actual card
image (`.local/card-images-cropped/<CODE>/<localId>.png`, or crop it if not already
cached) before touching anything. Roughly half of all flagged cards across this
project's history turned out to be Bulbapedia-side transcription slips (spacing,
punctuation) rather than real card errors — see HISTORY.md for the pattern.

### Bulbapedia wikitext parsing (`parseDexEntries` / `cleanDexEntry` / `splitTemplateParams`)

Two structural gotchas, both from treating wikitext as flat rather than nested:

- **Nested templates inside an entry silently drop the whole entry** if you match
  `{{Dex/EntryN|...}}` with a regex that excludes braces from the body (`[^{}]+`) —
  any entry containing e.g. `{{ScPkmn}}` or `{{tt|*|...}}` just vanishes from the
  candidate list with no error. Fixed by depth-counting `{{`/`}}` instead
  (`extractDexEntryTemplates`).
- **Piped wiki-links silently truncate an entry** if param-splitting only tracks
  `{{`/`}}` depth and not `[[`/`]]` — the `|` inside `[[Sinnoh myths|myths]]` gets
  read as a param separator. `splitTemplateParams` tracks both bracket types together.

Bulbapedia templates handled so far in `cleanDexEntry`: `ScPkmn`, `ScBall`, `Berries`,
`p`/`P`, `t`, `m`, `status`, `a`, `OBP`, `pkmn`/`pkmn2`, `wp`, `tt` (footnote markers
dropped, real text kept), `sup/N` (dropped), HTML comments (stripped). If a new set's
candidates show stray `{{`/`}}`/`[[`/`]]` in the text, it's almost certainly an
unhandled template — check what it renders to on the actual Bulbapedia page before guessing.

### Regional forms and Bulbapedia lookups

`speciesName()` (both `scripts/lib/bulbapedia.mjs` and its
`scripts/flavor-text-editor/client.js` duplicate — **always edit both**) strips
prefixes/suffixes that have no separate Bulbapedia page of their own, since those
forms' Dex entries live on the base species' page. The full chain, applied in order
(rarity/prefix strips run before the regional-form check, since either can stack):

- Trainer-possessive prefix: `"Erika's Oddish"` → `"Oddish"`.
- `Shining`, `Radiant` (rarity mechanics).
- `Special Delivery`, `Light` (promo prefixes).
- Regional forms: `Paldean|Galarian|Alolan|Hisuian`.
- Rotom's appliance forms: `Heat|Wash|Frost|Fan|Mow` (before `Rotom`).
- Ogerpon's mask forms: `Teal|Wellspring|Hearthflame|Cornerstone Mask` (before `Ogerpon`).
- `Bloodmoon` (before `Ursaluna`).
- `Castform Sunny|Rainy|Snowy Form` → `Castform`.
- `Pikachu with Grey Felt Hat` → `Pikachu` (Van Gogh promo).
- `Rapid|Single Strike` (before `Urshifu`).
- `Black|White` (before `Kyurem`, fusion forms).
- `Ultra|Dawn Wings|Dusk Mane` (before `Necrozma`, fused forms).
- Trailing `◇` (Prism Star cards).
- Trailing `LEGEND` (HGSS-era LEGEND cards).
- Trailing `East|West Sea` (Shellos/Gastrodon sea forms).
- Trailing `Plant|Sandy|Trash Cloak` (Wormadam/Burmy cloak forms).
- Space before `♀`/`♂` (Bulbapedia's page title has no space; the spaced form is a
  redirect stub, and the raw-wikitext fetch doesn't follow redirects).

`parseDexEntries` doesn't filter by form — it returns every entry on the page
regardless of which form it belongs to — so this relies on no other form on that
same page happening to have identical flavor text, which hasn't been an issue so far.

## Bulk flavor text via cropped images

For sets with no structured flavor-text source at all, this is the default way
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
series that a box from one doesn't carry over to the next, even at the same image
resolution. Also set `left`/`width` — the left third of the strip is always the
illustrator credit + set number/rarity column, never flavor text. Check against a
card with unusually long flavor text (a short entry sits centered/right-aligned
within the same box, so the long ones reveal how far left the box's text region
actually starts).

Known-good boxes so far (all in the script's 1024-height reference space):

| Era / template                               | Box                                     |
| -------------------------------------------- | --------------------------------------- |
| Mega Evolution                               | `top=900 height=95 left=220 width=513`  |
| 30th Celebration (652×914 — see note below)  | `top=900 height=95 left=220 width=505`  |
| Scarlet & Violet / Sun & Moon onward         | `top=905 height=95 left=260 width=473`  |
| WotC/Base-era                                | `top=910 height=70 left=55 width=625`   |
| Diamond & Pearl                              | `top=800 height=95 left=45 width=600`   |
| HGSS / Platinum                              | `top=825 height=100 left=45 width=600`  |
| Black & White (base template)                | `top=865 height=120 left=415 width=295` |
| Black & White (widened, BLW onward)          | `top=855 height=130 left=380 width=340` |
| Dragon Vault (BW holo, non-standard 700×990) | `top=830 height=130 left=200 width=530` |
| XY (non-standard 700×990, e.g. DCR)          | `top=880 height=130 left=190 width=500` |
| Generations (733×1024)                       | `top=860 height=150 left=190 width=500` |

`crop-flavor-text.mjs` scales the box by height alone and skips (rather than aborts)
images whose box would run off the edge — long promo sets mix in oversized/jumbo scans.

**A mass "non-standard-shaped" skip usually means the box is 2px too wide, not that
the set is odd.** 30th Celebration's images come back 652×914 — very slightly
narrower than the 733-wide reference the boxes above are written against — so the
standard Scarlet & Violet box's right edge (`left + width` = 733, exactly the
reference width) overflowed and 131 of 134 cards were skipped. Trimming `width` by
8 fixed it. If nearly a whole set skips, check `left + width` against the actual
image width before concluding the template is different.

Then, for each card: Claude reads the cropped image (`.local/card-images-cropped/
<CODE>/<localId>.png`) inline — no subagents, see Lessons below. Cross-check the
transcription against that species' Bulbapedia candidates before trusting it, and
save it once confirmed:

```sh
node scripts/fetch-flavor-candidates.mjs "Erika's Oddish" "Zapdos" ...   # applies speciesName() itself, pass raw card names
node scripts/save-flavor-text.mjs <CODE> <localId> "<text>" [<localId> "<text>" ...]   # writes straight to the overlay file
```

An exact match against a candidate is a strong signal the transcription is right; if
nothing matches, double check the crop/reading before saving — Claude misreading a
character is a much likelier explanation than the card printing text absent from
every mainline game. Don't improvise inline `curl`/`node -e` pipelines for either
step — these two scripts exist specifically so a fresh permission prompt isn't needed
per lookup.

The `http://localhost:5173` editor and its "Show unmatched only" sweep are still the
closing step regardless of who filled the text in — run it last, same as before.

### Scarlet & Violet: check per-set, don't assume

Unlike Mega Evolution, older Scarlet & Violet sets _do_ have flavor text already in
pokemon-tcg-data's own `flavorText` field (`fetch-set.mjs` reads it automatically,
overridden by the manual overlay if present). Coverage has a hard cutoff, not a
gradient — check any new set with `node scripts/flavor-text-coverage.mjs <CODE>`
(no network calls, just counts how many of the set's `pokedex`/`flavorText`-eligible
cards already have `flavorText` in the fetched set file) instead of assuming either
way from a neighboring set.

Even where coverage exists, still run the verification sweep — it's caught real
upstream errors (a card's `flavorText` copy-pasted from an unrelated Pokémon
entirely) that a presence check alone would have missed.

## Lessons from building MEG and PFL

- **Don't reach for subagents on bulk image-transcription work.** Spawning parallel
  agents to read card images one by one stalled repeatedly (10-minute idle watchdog,
  even at small batch sizes) and cost more time than doing it directly. For ~100+
  images, just read them inline.
- Rarity names, dex numbers, and rules text are trustworthy from pokemon-tcg-data.
  Artist and print-group data only exist on Limitless. Flavor text has no reliable
  structured source — see above.
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
# ...Claude reads the cropped images and transcribes+verifies+saves via
# fetch-flavor-candidates.mjs / save-flavor-text.mjs (see "Bulk flavor text via
# cropped images" above), then runs check-flavor-text.mjs as the closing check...
node scripts/fetch-set.mjs <ptcgDataSetId> <LimitlessCode>   # re-run to merge flavor text in
node scripts/refresh-print-groups.mjs                        # propagate reprints into older sets' printGroup
npm run typecheck
```

Find `ptcgDataSetId` from pokemon-tcg-data's `sets/en.json` (its `id` field), and
confirm the Limitless code on limitlesstcg.com before starting — don't guess and
assume a 404 means the set is out of scope; it usually means the wrong code (see
HISTORY.md's NXD entry for an example of confirming this properly). After
finishing, append the set's story to **HISTORY.md** (not this file) and update the
Status section above with a one-line index entry if a whole era just closed out.

`node scripts/missing-sets.mjs [series]` diffs pokemon-tcg-data's `sets/en.json`
against every `data/sets/*.json`'s stored `set.ptcgDataId` (not filenames — this
database's codes are Limitless's and deliberately don't track pokemon-tcg-data's
ids) and prints what's missing, grouped by `series`, oldest first. Use this instead
of walking a numeric id range — a numeric walk is what hid `dc1`, `dv1`, and `g1`
for years.

## Cards only this database has

A long-running promo set can hold cards that **neither pokemon-tcg-data nor
Limitless carries** — hand-added after confirming on Bulbapedia that the print
redirects to a card already verified here (see HISTORY.md's SP and SVP entries).
A re-fetch can't regenerate those: the assembled list is pokemon-tcg-data's set
plus at most the ids Limitless's index adds, so they exist only in
`data/sets/<CODE>.json` and a plain re-run used to drop them silently. SVP lost
8 cards (190–192, 213–215, 225, 226) exactly this way.

`carryOverUnsourcedCards` now re-reads the existing file and carries them over,
**opt-in via `data/no-limitless/<CODE>.json`** — the same file that already
means "this card has no Limitless page". An orphan that _isn't_ listed there is
a hard error naming every card, because the other thing that produces one is an
id-normalization bug, and losing a card to that quietly is the failure mode this
script exists to prevent. A carried card's `number` is recomputed, not copied,
so it still follows the set's current printed-number rules.

So: **if you hand-add a card to `data/sets/<CODE>.json`, list its localId in
`data/no-limitless/<CODE>.json` too**, or the next fetch of that set will refuse
to run. `SP` (15), `SVP` (9) and `MEP` (9) are fully listed as of this writing.
`--fill-from-limitless` recomputes `total` after the carry-over, so carried
cards are counted.
