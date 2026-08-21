# History

Chronological log of set additions: which sets are done, upstream data bugs found
and fixed, one-off hand corrections, and the specific cards that caught each pipeline
bug. This is archaeology — CLAUDE.md keeps only current pipeline mechanics and a short
completion index; this file has the full story for anyone picking through why a
particular field looks the way it does.

Newest entries are at the bottom (most recent work), matching how this file grew.

## Mega Evolution and Scarlet & Violet frontier

`data/sets/MEG.json` (Mega Evolution, 188 cards), `data/sets/PFL.json` (Phantasmal
Flames, 130 cards), `data/sets/ASC.json` (Ascended Heroes, 295 cards),
`data/sets/POR.json` (Perfect Order, 124 cards), `data/sets/CRI.json` (Chaos Rising,
122 cards), and `data/sets/PBL.json` (Pitch Black, 120 cards) are complete, including
flavor text — verified against Bulbapedia via the flavor-text editor's "Show unmatched
only" filter (see CLAUDE.md), not just eyeballed. That's the entire Mega Evolution series
done. `data/sets/SVI.json` (Scarlet & Violet base set), `data/sets/SVE.json`
(Scarlet & Violet Energies, 16 cards — energy cards, no flavor text applicable), and
`data/sets/PAL.json` (Paldea Evolved, 279 cards) are also complete — their flavor
text came from pokemon-tcg-data directly rather than the crop workflow (see
"Scarlet & Violet: check per-set, don't assume" in CLAUDE.md). PAL's verification sweep caught one
real upstream error (Flamigo's flavor text had an extra "the" not present on the
actual card) and needed a fix to the editor's species-name lookup for regional forms
(see "Regional forms and Bulbapedia lookups" in CLAUDE.md). `data/sets/OBF.json` (Obsidian
Flames, 230 cards) is also complete — its verification sweep caught three upstream
errors in pokemon-tcg-data's `flavorText` (Chandelure missing spaces around an em
dash, Frogadier using the wrong unit — "600 metres" instead of the card's actual
"2,000 feet" — and the same Flamigo "extra the" error PAL had, on its OBF reprint),
each confirmed against the actual card image and fixed via the `data/flavor-text/
OBF.json` overlay. `data/sets/MEW.json` (151, 207 cards) is also complete — its
verification sweep initially flagged Nidoran ♀ and Nidoran ♂ as unmatched, but both
turned out to have correct flavor text; the real bug was in the Bulbapedia
species-name lookup (see "Regional forms and Bulbapedia lookups" in CLAUDE.md).
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
(see "Regional forms and Bulbapedia lookups" in CLAUDE.md). `data/sets/TEF.json` (Temporal
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
`data/sets/DRI.json` (Destined Rivals, 244 cards) is also complete — built via the
crop workflow (zero `flavorText` coverage in pokemon-tcg-data for `sv10`), Claude
transcribed all 166 eligible cards directly from cropped image strips. Its
verification sweep flagged one card on the first pass, but that was a transcription
slip on Claude's side (a reprint accidentally saved with the previous card's text,
Quilava's instead of Typhlosion's) rather than a real data or lookup issue; fixed by
re-saving the correct text, and the sweep came back clean on the second pass.
`data/sets/BLK.json` (Black Bolt, 172 cards) and `data/sets/WHT.json` (White Flare,
173 cards) are also complete — these were the actual next sets after Destined Rivals
(`zsv10pt5`/`rsv10pt5`, released 2025/07/18), sitting chronologically before the Mega
Evolution series; they'd been skipped over when MEG et al. were added and were caught
by re-checking pokemon-tcg-data's `sets/en.json` from scratch rather than assuming
Mega Evolution was next. Both had full `flavorText` coverage direct from
pokemon-tcg-data, and both verification sweeps came back clean on the first pass —
no upstream errors, no lookup bugs.

BLK's original fetch silently produced a duplicate: pokemon-tcg-data's own record
for Antique Cover Fossil (`id: zsv10pt5-80`, images pointing at `80.png`) carries a
wrong `number` field of `"60"` — the same slot as Escavalier — along with Escavalier's
own `artist` ("DOM") and `flavorText` copy-pasted onto it too. `fetch-set.mjs` trusted
`number` as `localId` with no duplicate check at the time, so Antique Cover Fossil
silently overwrote Escavalier's entry at localId 60 and BLK 80 went missing entirely
— the set still counted 172 cards (masking the loss) because pokemon-tcg-data's own
card list was one entry short of Limitless's, not because a card had vanished after
fetching correctly. Caught only by the user directly comparing the stored data against
the card images. Confirmed against both images (`.local` cache): Escavalier's stored
data (060/086, DOM, the flavor text) is entirely correct; Antique Cover Fossil is
080/086, illustrated by AYUMI ODASHIMA, and prints no flavor text at all (a Fossil
Trainer card, not a Pokédex reuse — same "no room left" category as DPP's Porygon-Z).
Fixed by hand-correcting the entry directly in `data/sets/BLK.json` (localId, number,
artist, dropping the bogus `flavorText`, and re-scraping the correct Limitless
id/url/printGroup from `limitlesstcg.com/cards/BLK/80`) — the same precedent as
Classic Collection's two hand-fixed e-Card-era cards (see below): a one-off upstream
data bug on an already-completed set, not worth a new overlay mechanism. Also fixed
`fetch-set.mjs` itself: it now throws on any duplicate `number` across `primaryCards`
(exempting `sequentialPrefix` sets, which are expected to have non-unique `number`),
so a future occurrence of this exact upstream bug fails loudly instead of silently
clobbering a card.

## Sword & Shield era

`data/sets/SSH.json` (Sword & Shield base set, 202 cards) is also complete — the first
Sword & Shield-era set added, and the first set in this database with V/VMAX cards. Its
flavor text came from pokemon-tcg-data directly. Fetching it surfaced a real bug in
`fetch-set.mjs`: the pokedex-info-box attachment only excluded `ex`/`MEGA` subtypes, not
`V`/`VMAX`/`VSTAR`/`V-UNION` — those also print no dex box (or flavor text) on the
physical card, confirmed against the card images (Celebi V, Lapras VMAX). Fixed by
adding those subtypes to the exclusion check, which took `flavorText` coverage from
134/173 "eligible" (38 V/VMAX cards wrongly counted as eligible) to a clean 134/134. Its
verification sweep flagged one card, Kingler, a real upstream error in pokemon-tcg-data's
`flavorText` ("The large and hard pincer" instead of the card's actual "Its large and
hard pincer"), confirmed against the card image and fixed via the `data/flavor-text/
SSH.json` overlay. `data/sets/RCL.json` (Rebel Clash, 192 cards) and `data/sets/DAA.json`
(Darkness Ablaze, 189 cards) are also complete — both flavor text came from
pokemon-tcg-data directly. RCL's verification sweep flagged one card, Pidove, the
same line-wrap em-dash spacing artifact as prior sets (Bulbapedia's own Sword entry
has a stray space after the dash that the card doesn't), confirmed correct as
printed, no fix needed. DAA's sweep flagged one card, Lairon, a real upstream error
in pokemon-tcg-data's `flavorText` (missing "the size of" — printed "shows off its
strength with the size of sparks" vs. the upstream text's "shows off its strength
with sparks"), confirmed against the card image and fixed via the `data/flavor-text/
DAA.json` overlay. `data/sets/CPA.json` (Champion's Path, 80 cards) is also
complete — its flavor text came from pokemon-tcg-data directly, and its
verification sweep came back clean on the first pass. `data/sets/VIV.json` (Vivid
Voltage, 203 cards) is also complete — its verification sweep flagged three cards:
Tynamo (missing "a" — upstream text read "only trickle" instead of the card's
"only a trickle") and Xerneas (extra "different" — upstream text read "seven
different colors" instead of the card's "seven colors") were both real upstream
errors, confirmed against the card images and fixed via the `data/flavor-text/
VIV.json` overlay; Exploud was confirmed correct as printed — it matches
Bulbapedia's HeartGold/SoulSilver/Y entry word-for-word, differing only in using an
em dash where Bulbapedia's own transcription uses a double hyphen (`--`), a
normalization mismatch rather than a text error. `data/sets/SHF.json` (Shining
Fates, 73 cards) and `data/sets/SHFSV.json` (Shining Fates Shiny Vault, 122 cards)
are also complete — the first sets built with `fetch-set.mjs`'s new third argument
(see CLAUDE.md "Pipeline"): pokemon-tcg-data splits Shiny Vault out as its own set
(`swsh45sv`, numbered `SV001`–`SV122`) but Limitless has no separate page for it —
its cards live at `limitlesstcg.com/cards/SHF/SV1` etc., under the base set's own
`SHF` page, with leading zeros stripped from the number. Fetched via
`node scripts/fetch-set.mjs swsh45sv SHFSV SHF`. Both sets' flavor text came from
pokemon-tcg-data directly, and both verification sweeps came back clean on the
first pass. `data/sets/BST.json` (Battle Styles, 163 cards) is also complete — its
flavor text came from pokemon-tcg-data directly. Its verification sweep flagged
three cards: Spewpa was a real upstream error (missing "Pokémon" — printed "beaks
of bird Pokémon" vs. the upstream text's "beaks of birds"), confirmed against the
card image and fixed via the `data/flavor-text/BST.json` overlay; Gliscor and
Lickitung were both false positives from a normalize()-level gap, not text
errors — the card art renders an ellipsis as a single "…" glyph while
Bulbapedia's own transcription types it as three literal periods "...", the same
class of surface-level mismatch as the existing curly-vs-straight-quote
normalization. Fixed by adding an equivalent `...`→`…` normalization to
`normalize()` in both `scripts/lib/bulbapedia.mjs` and its
`scripts/flavor-text-editor/client.js` duplicate, which cleared both cards on
re-sweep without touching the overlay. `data/sets/CRE.json` (Chilling Reign, 198
cards) is also complete — its flavor text came from pokemon-tcg-data directly. Its
verification sweep flagged three cards: Sealeo was a real upstream error (extra
"a" — upstream text read "Spheal or a Poké Ball" instead of the card's "Spheal or
Poké Ball"), confirmed against the card image and fixed via the `data/flavor-text/
CRE.json` overlay; Rapid Strike Urshifu and Single Strike Urshifu were both a
lookup bug, not text errors — same category as Heat Rotom, Teal Mask Ogerpon,
Bloodmoon Ursaluna, and Castform Sunny Form: no separate Bulbapedia page for
either style, their Dex entries (alternating Sword/Shield per style) live on the
base `Urshifu (Pokémon)` page. Fixed by stripping the `Rapid Strike|Single Strike`
prefix in `speciesName()` (both copies). `data/sets/EVS.json` (Evolving Skies, 110
cards) is also complete — its flavor text came from pokemon-tcg-data directly. Its
verification sweep flagged three cards: Hippopotas was confirmed correct as
printed ("burrowed snugly") — Bulbapedia's own Shield entry has a typo
("snuggly"), not a card error. Gigalith and Froslass were both real
character-normalization gaps, not text errors: Gigalith's saved text had a stray
space after an em dash ("limitation— they") where the card prints it tight to the
next word ("limitation—they") — confirmed against a zoomed crop of the card image
and fixed via the `data/flavor-text/EVS.json` overlay (unlike prior line-wrap
em-dash cases, here pokemon-tcg-data's own text had the extra space, not
Bulbapedia's); Froslass's saved text used a plain hyphen for its temperature
("-60 degrees") where both the card and Bulbapedia's Shield entry use a proper
minus sign ("−60 degrees", U+2212) — fixed by adding a `−`→`-` normalization to
`normalize()` (both copies), the same character-equivalence treatment as the
ellipsis fix, which cleared the card without touching the overlay.
`data/sets/CEL.json` (Celebrations, 17 cards) and `data/sets/CELCC.json`
(Celebrations: Classic Collection, 10 cards) are also complete — the first sets
using `fetch-set.mjs`'s new `<sequentialPrefix>` argument (see CLAUDE.md "Pipeline"):
pokemon-tcg-data's `number` field for Classic Collection is each reprinted card's
_original_ print number from its original set decades ago (not unique within the
subset — four different cards are all "15" — and unrelated to Limitless's own
clean `CC1`–`CC25` numbering for it), so `localId` had to be derived from array
position instead; verified by spot-checking positions 1, 3, and 25 against
Limitless before trusting it for the whole set. Fetched via
`node scripts/fetch-set.mjs cel25c CELCC CEL CC`. Classic Collection's 25-year
span of reprints (1999–2020) also exercised rarity mechanics no other set in this
database had touched — old-style uppercase `EX` (distinct from modern lowercase
`ex`), `GX`, `Star`, `Level-Up` (LV.X) — which print no Pokédex info box, same as
the V family; fixed by extending `fetch-set.mjs`'s exclusion list. Two cards
(Rocket's Zapdos, Team Magma's Groudon) needed the same fix but have no
distinguishing subtype — they're just old enough (e-Card/EX Team era, 2003–2004)
to predate the TCG's modern dex-box convention entirely, which no subtype captures
— confirmed against their card images and corrected by manually stripping their
`pokedex` field directly in `data/sets/CELCC.json` after the automated fetch,
documented here since a future re-fetch of this specific set would silently
reintroduce it. Claydol was genuinely missing `flavorText` in pokemon-tcg-data (not
a dex-box exclusion case) — transcribed directly from the card image, verified as
an exact match against its Diamond/Pearl/Platinum/Black/White/X Bulbapedia
candidate, and saved via the overlay. Shining Magikarp was a lookup bug, same
category as Heat Rotom et al. — no separate Bulbapedia page for `Shining`-prefixed
Pokémon (a Neo Destiny-era rarity predating the modern Shiny mechanic), fixed by
stripping that prefix in `speciesName()` (both copies). The verification sweep's
final 5 unmatched cards are all confirmed-correct exceptions that can never
algorithmically clear: Blastoise, Charizard, and Venusaur (original 1999 Base Set
prints) match their own card images exactly but differ from Bulbapedia's own
Red/Blue transcription in minor wording Bulbapedia itself is inconsistent about;
Dark Gyarados and `_____'s Pikachu` (the fill-in-your-birthday promo) carry
card-specific text that was never a mainline Pokédex entry to begin with — the
one documented exception to this whole project's "TCG flavor text is a verbatim
Pokédex reuse" premise (see CLAUDE.md "Flavor text has no structured source").
`data/sets/FST.json` (Fusion Strike, 197 cards) is also complete — its flavor
text came from pokemon-tcg-data directly. Its verification sweep flagged two
cards, both real upstream errors, each confirmed against the card image and fixed
via the `data/flavor-text/FST.json` overlay: Marill had a stray space after a
hyphen ("water- repellent" instead of the card's "water-repellent" — pokemon-tcg-
data's own error this time, not a Bulbapedia-side artifact, unlike the earlier
line-wrap cases); Toxtricity was missing "what" ("fills its surroundings with
sounds like" instead of the card's "fills its surroundings with what sounds
like"). `data/sets/BRS.json` (Brilliant Stars, 101 cards) and `data/sets/
BRSTG.json` (Brilliant Stars Trainer Gallery, 12 cards) are also complete — the
first Trainer Gallery subset added, and a useful contrast with Shiny Vault/Classic
Collection: unlike those, Trainer Gallery's `number` field (`TG01`–`TG30`) is
already unique and correctly ordered, so it only needed the third
(`<limitlessUrlCode>`) argument, not the fourth (`<sequentialPrefix>`) —
`node scripts/fetch-set.mjs swsh9tg BRSTG BRS`. Caught this distinction by trying
the sequential-prefix argument first (out of habit from Classic Collection) and
noticing it silently discarded the correct zero-padded `TG01` localId in favor of
a coincidentally-matching but wrong `TG1`; re-fetched without it once noticed.
Both sets' flavor text came from pokemon-tcg-data directly, and both verification
sweeps came back clean on the first pass. `data/sets/ASR.json` (Astral Radiance,
106 cards) and `data/sets/ASRTG.json` (Astral Radiance Trainer Gallery, 12 cards)
are also complete — both sets' flavor text came from pokemon-tcg-data directly.
ASR's verification sweep flagged four cards: Radiant Heatran, Radiant Greninja,
and Radiant Hawlucha were a lookup bug, not text errors — "Radiant" (a new rarity
mechanic this set introduces) has no separate Bulbapedia page, same category as
Heat Rotom, Teal Mask Ogerpon, Bloodmoon Ursaluna, Castform Sunny Form, the
Urshifu styles, and Shining Magikarp — fixed by stripping the `Radiant` prefix in
`speciesName()` (both copies); Oshawott was a real upstream error — a duplicated
trailing period after the closing quote (`"scalchop.".` instead of the card's
`"scalchop."`), confirmed against the card image and fixed via the
`data/flavor-text/ASR.json` overlay. ASRTG's sweep flagged one card, Abomasnow, a
real upstream error ("The Pokémon is known" instead of the card's "This Pokémon is
known"), confirmed against the card image and fixed via the `data/flavor-text/
ASRTG.json` overlay. `data/sets/PGO.json` (Pokémon GO, 54 cards) is also
complete — its flavor text came from pokemon-tcg-data directly, and its
verification sweep came back clean on the first pass. `data/sets/LOR.json` (Lost
Origin, 132 cards) and `data/sets/LORTG.json` (Lost Origin Trainer Gallery, 11
cards) are also complete — both sets' flavor text came from pokemon-tcg-data
directly. LOR's verification sweep flagged one card, Radiant Hisuian Sneasler — a
real bug in `speciesName()` itself rather than a missing prefix rule: the
`Radiant`/`Shining` strip ran _after_ the regional-form strip in the replacement
chain, so "Radiant Hisuian Sneasler" never got a chance to match the
`^(Paldean|Galarian|Alolan|Hisuian)` regex (anchored to the start of the string) —
by the time `Radiant` was stripped, that check had already run and failed. Fixed
by reordering the chain so rarity prefixes (`Shining`, `Radiant`) strip first, in
both `speciesName()` copies, since either can stack with a regional-form prefix.
LORTG's sweep came back clean on the first pass. `data/sets/SIT.json` (Silver
Tempest, 128 cards) and `data/sets/SITTG.json` (Silver Tempest Trainer Gallery, 11
cards) are also complete — both sets' flavor text came from pokemon-tcg-data
directly. SIT's verification sweep flagged two cards: Foongus was a real upstream
error — an en dash where the card prints a plain hyphen ("Poké Ball–like" instead
of "Poké Ball-like"), confirmed against the card image and fixed via the
`data/flavor-text/SIT.json` overlay (treated as a one-off transcription slip, not
a normalize()-level character-equivalence case like the ellipsis/minus-sign
fixes, since an en dash isn't a standard alternate rendering of a hyphen the way
those were); Lopunny is the same confirmed-correct case as Prismatic Evolutions'
Lopunny (see above) — printed "If danger approaches" (singular) vs. Bulbapedia's
own grammatically-broken Sword entry "If dangers approaches", no fix needed.
SITTG's sweep came back clean on the first pass. `data/sets/CRZ.json` (Crown
Zenith, 93 cards) and `data/sets/CRZGG.json` (Crown Zenith Galarian Gallery, 34
cards) are also complete — the last sets in the Sword & Shield era. Both sets'
flavor text came from pokemon-tcg-data directly. CRZ's sweep came back clean on
the first pass. CRZGG's sweep flagged one card, Hisuian Goodra, a real upstream
error — a stray space after an em dash ("clingy— it will fume" instead of the
card's "clingy—it will fume"), confirmed against the card image and fixed via the
`data/flavor-text/CRZGG.json` overlay. This closes out the entire Sword & Shield
era (`swsh1` through `swsh12pt5gg`, plus `cel25`/`cel25c` and `pgo`) — 21 files
across 15 real-world set releases, all verified clean.

## Sun & Moon era

The entire Sun & Moon era (2017/02–2019/11, `sm1` through `sm12`) is also
**done** — a second backfill, oldest first: `SUM` (sm1), `GRI` (sm2), `BUS`
(sm3), `SLG` (sm35, Shining Legends), `CIN` (sm4), `MCD17` (mcd17, McDonald's
Collection 2017), `UPR` (sm5), `FLI` (sm6), `CES` (sm7), `DRM` (sm75, Dragon
Majesty), `MCD18` (mcd18), `LOT` (sm8), `TEU` (sm9), `DET` (det1, Detective
Pikachu), `UNB` (sm10), `UNM` (sm11), `HIF`/`HIFSV` (sm115/sma, Hidden Fates +
its Shiny Vault subset), `MCD19` (mcd19), and `CEC` (sm12) — 20 files across 21
`sets/en.json` entries (the ongoing `smp` promo set excluded, same treatment as
`swshp`/`svp`). All flavor text came from pokemon-tcg-data directly; every set's
verification sweep was run to completion, several multiple times, since this
era's sweep runs turned out flaky — a card flagged as unmatched on one run
routinely cleared on a retry with no text change (a Bulbapedia fetch timeout
reads as "no candidates," not a distinguishable error), so a flag was only
trusted after it reproduced on a second run.

This era surfaced more upstream errors and lookup bugs than any prior backfill,
in roughly two categories:

- **Real upstream `flavorText` errors**, all confirmed against card images and
  fixed via each set's overlay: SUM (8 cards — Surskit, Torkoal, Golduck,
  Wingull, Brionne, Primarina, Herdier, Trumbeak), GRI (Mimikyu, Drampa), BUS
  (Meowstic, Noibat), SLG (Zorua), CIN (Gogoat, Mankey), FLI (Spewpa — the same
  missing-"Pokémon" bug as BST's Spewpa; Delphox, Clauncher, Malamar), LOT (11
  cards — Popplio, Wobbuffet, Meloetta, Nihilego, Umbreon, Forretress,
  Jigglypuff, Kirlia, Stantler, both Pikipek prints), HIFSV (Malamar, Zorua,
  Noibat — reprints of the same three FLI/SLG/BUS cards above, carrying the
  same uncorrected upstream text independently since `flavorText` isn't
  deduped across pokemon-tcg-data's per-set files), and MCD19 (Alolan Dugtrio,
  "This Pokémon" instead of "These Pokémon"). CEC's sweep flagged Deerling
  (missing the plural "seasons") the same way. TEU flagged Spiritomb and DET
  flagged both its cards, but all three were confirmed correct as printed, not
  errors — see the movie-tie-in note below.
- **`speciesName()` lookup bugs**, same category as Heat Rotom/Teal Mask
  Ogerpon/etc. (see CLAUDE.md "Regional forms and Bulbapedia lookups"), fixed in
  both `speciesName()` copies rather than the overlay: Ultra Prism's Prism Star
  cards suffix the name with "◇" (e.g. "Giratina ◇"), not part of the species
  name; Lost Thunder's White Kyurem and Cosmic Eclipse's Ultra Necrozma are
  both fusion/absorption forms with no separate Bulbapedia page, sharing the
  base `Kyurem (Pokémon)`/`Necrozma (Pokémon)` page like every regional/
  appliance/mask form before them.

Two more one-off fixes came out of this era, both to shared library code
rather than any one set:

- Guardians Rising's Alolan Graveler was flagged despite its saved text being
  correct — `cleanDexEntry` (`scripts/lib/bulbapedia.mjs`) had no handler for
  Bulbapedia's `{{wp|Article}}` template (a real-world Wikipedia link, e.g.
  `{{wp|dravite}}`), so raw template braces leaked into the parsed candidate
  text and broke the comparison. Fixed by adding a `wp` handler alongside the
  existing `p`/`OBP`/etc. ones.
- Celestial Storm's Exploud reproduced the exact Vivid Voltage Exploud case
  (see above) — its HeartGold/SoulSilver/Y Bulbapedia entry types an em
  dash as a plain `--`, which the card itself prints as a real "—". Confirmed
  against the card image and, since this is the second set to hit the same
  card with the same artifact, promoted from a documented one-off to an actual
  `normalize()` rule (`--` → `—`) in both copies, the same treatment as the
  existing ellipsis/minus-sign normalizations.

Detective Pikachu (`DET`) is a movie tie-in set, not a mainline-game reprint,
and its flavor text follows suit: the mascot card's text describes the movie
character rather than any Pokédex entry (no match expected, same exception
category as Classic Collection's Dark Gyarados/birthday-Pikachu cards — see
CLAUDE.md "Flavor text has no structured source"), and even its Mewtwo card carries
a movie-adapted paraphrase of the classic "created by gene splicing" entry
rather than a verbatim reuse. Both confirmed correct as printed against the
card images; no fix applied or needed.

The three McDonald's Collection sets (`MCD17`/`MCD18`/`MCD19`, 12 cards each)
needed a real pipeline change: unlike every other set added so far, Limitless
never catalogued them at all (confirmed via a 404 on the set page and a
full-text search of Limitless's own set list) — not a numbering quirk like the
Trainer Gallery/Shiny Vault subsets, but a genuine absence of any scrapeable
page. `fetch-set.mjs` now accepts `"NONE"` as the `<limitlessUrlCode>` argument
for this case: it skips the per-card Limitless scrape entirely, reads `artist`
directly from pokemon-tcg-data's own field (added to the `PrimaryCard` type),
and falls back to `deckCode = "<code> <localId>"` with `printGroup`/`limitless`
left as empty placeholders. `deckCode` still has to stay unique per card even
here — an early version used a literal empty string for all three sets, which
silently unioned all 36 unrelated McDonald's cards into one fake print group
the next time `refresh-print-groups.mjs` ran (it keys the union-find graph on
`deckCode`); caught by inspecting the output before committing, fixed by
switching to the `"<code> <localId>"` fallback instead.

Sun & Moon's own basic Energy reprints (`SUM`, localId 164–172) turned up
another `fetch-set.mjs` gap: Limitless pages plain "Grass Energy"/"Fire
Energy"/etc. cards under a type letter (`SUM/G`, `SUM/R`, ...) instead of
pokemon-tcg-data's sequential number, but _only_ for some sets and _only_ for
the plain-common print — Sun & Moon's own secret-rare full-art Psychic/Metal
Energy cards kept numeric Limitless pages, and Guardians Rising's basic
energies turned out to stay fully numeric with no letter page at all (checked
directly, not assumed). Handled as a 404 fallback rather than a blanket rule:
`fetchLimitlessExtra` tries the numeric id first, and only on a 404 retries
under the matching letter for a known basic-energy name (Grass→G, Fire→R,
Water→W, Lightning→L, Psychic→P, Fighting→F, Darkness→D, Metal→M, Fairy→Y) —
`deckCode` still reports pokemon-tcg-data's own number either way, matching
existing basic-energy precedent (see SVE), while `limitless.url` and the
printGroup scrape use whichever id actually resolved.

## XY era

The entire XY era (2013/11–2016/11, `xy0` through `xy12` plus `xyp` in
`sets/en.json`) is also **done** — a fourth backfill, oldest first: `KSS`
(xy0, Kalos Starter Set), `XY` (xy1, the base set), `FLF` (xy2, Flashfire),
`FFI` (xy3, Furious Fists), `PHF` (xy4, Phantom Forces), `PRC` (xy5, Primal
Clash), `ROS` (xy6, Roaring Skies), `AOR` (xy7, Ancient Origins), `BKT` (xy8,
BREAKthrough), `BKP` (xy9, BREAKpoint), `FCO` (xy10, Fates Collide), `STS`
(xy11, Steam Siege), `EVO` (xy12, Evolutions), and — unlike every prior
era — `XYP` (xyp, XY Black Star Promos), included this time at the user's
request rather than skipped like `smp`/`swshp`/`svp`/`bwp`. 15 files across
14 `sets/en.json` entries, all verified. All flavor text came from
pokemon-tcg-data directly. `KSS` needed the third (`<limitlessUrlCode>`)
argument (`node scripts/fetch-set.mjs xy0 KSS KSS`) purely for symmetry with
the rest of the pipeline, not because it's a subset — Limitless does host it
under its own `KSS` page.

`data/sets/DCR.json` (Double Crisis, 34 cards) closes the one gap that
backfill left: `dc1` is an XY-series mini-set (2015/03/25, Team Magma vs Team
Aqua) whose id doesn't match the `xy<n>` pattern the era walk enumerated, so
it was skipped without anyone noticing. Flavor text came from pokemon-tcg-data
directly.

`dc1` was not the only one: `node scripts/missing-sets.mjs XY` (added for
exactly this) turned up `g1` on its very first run — a third
XY-series set hidden by the same numeric walk. `data/sets/GEN.json`
(Generations, 85 cards) and `data/sets/GENRC.json` (Generations Radiant
Collection, 32 cards) are now done too, which finally does close the XY
series. Don't take an era's "done" claim at face value; run the script.

GEN's 117 fetched cards are its 83 numbered ones plus two alternate arts
(`28a`, `73a`) and the 32-card **Radiant Collection** subset (`RC1`–`RC32`).
Unlike every other subset in this database, Radiant Collection needs
**neither** the third nor the fourth `fetch-set.mjs` argument to _fetch_:
pokemon-tcg-data keeps it inside `g1` rather than splitting it out as its own
set id, and its `RC<n>` numbers are already unique and match Limitless's
own — plain `node scripts/fetch-set.mjs g1 GEN` pulls in all 117 as one file.

It was later split by hand into `GEN.json`/`GENRC.json`, at the user's
request, for consistency with every other subset that shares its base set's
Limitless page (Trainer Gallery, Shiny Vault, Galarian Gallery, Classic
Collection all get their own file — see CLAUDE.md "Subsets that share their base set's
Limitless page") — even though, unlike those, pokemon-tcg-data doesn't
itself split Radiant Collection out as a separate id. `GENRC`'s `ptcgDataId`
is still `"g1"`, same as `GEN`'s, since that's genuinely where the data came
from; harmless duplication, not a bug (`missing-sets.mjs` only checks set
membership). Each card's `limitless.deckCode`/`url`/`printGroup` were left
exactly as fetched (`"GEN RC1"` etc.) since that's still Limitless's own
numbering under `GEN`'s page, not `GENRC`'s — only the output file and
`set.code` changed, so no other set's stored `printGroup` cross-references
needed touching; confirmed by `refresh-print-groups.mjs` coming back clean
against the split files. `fetch-set.mjs` itself has no native way to split
one pokemon-tcg-data set into two output files, so a future re-fetch (there's
no reason to expect one — this is a closed, years-old set) would need the
same by-hand split repeated, not a plain re-run.

Radiant Collection is the second case (after DCR, above) of flavor text that
isn't Pokédex reuse — but unlike DCR it's _mixed_, which is the part worth
remembering. 24 of its cards carry first-person poetic text written for the
subset ("Wings and beaks. I like yours, and I like mine, too."), while the
rest reuse real Pokédex entries and clear the sweep normally. So a partial
unmatched result inside one subset is the expected outcome here — don't read
the 24 as a systematic lookup failure. All 24 were read against their cropped
strips and confirmed correct as printed.

GEN's sweep also caught two real upstream errors in pokemon-tcg-data's
`flavorText`, both confirmed against the card images and fixed via the
`data/flavor-text/GEN.json` overlay: Zubat's "it emits from **it** mouth" for
the card's "from **its** mouth", and Pinsir's "It swings its long **antlers**"
where the card prints "its long **pincer horns**" — pokemon-tcg-data had the
Silver-era wording while the card uses the SoulSilver/Y one, and the
correction is a verbatim match to that entry, so both cards clear the sweep
now. GEN's images are 733×1024, not DCR's 700×990, so the standard-width box
works: `top=860 height=150 left=190 width=500`.

Double Crisis is the first _whole set_ whose flavor text isn't Pokédex reuse
at all: every one of its 20 eligible cards prints in-character Team Magma/Team
Aqua ops chatter ("Aron, which even devour metal, can eat and destroy enemy
ships in an instant."), so `check-flavor-text.mjs` flags all 20 and can never
clear any of them. Prior instances of this were one-offs inside an otherwise
normal set (Classic Collection's Dark Gyarados, Detective Pikachu, EVO's
`Imakuni?'s Doduo` — see CLAUDE.md "Flavor text has no structured source"); here it's
the set's whole design. All 20 were read against their cropped strips and
confirmed correct as printed, character for character. A 20-of-20 unmatched
result is the expected outcome for this set — don't read it as a broken
lookup and go hunting for a `speciesName()` fix.

DCR's images are **700×990**, not the 733×1024 every other set has returned.
`crop-flavor-text.mjs` scales the box by height alone, so a `left`/`width`
calibrated against the reference overshoots the right edge by a few pixels and
the script skips the entire set as "non-standard-shaped" — which looks like the
jumbo-scan case it was written for, but isn't: these are ordinary cards at a
slightly narrower aspect ratio. Narrowing the box is the fix, not touching the
script. Known-good XY box at this resolution: `top=880 height=130 left=190
width=500`.

This era introduced the `BREAK` subtype (BREAKthrough onward), which prints
no Pokédex info box or flavor text — same full-art treatment as MEGA/V/EX,
using the space instead for "BREAK Evolution Rule" text. Confirmed against
BKT's Chesnaught BREAK card image (which initially fetched a bogus dex box
and 6 missing-flavorText false positives) and fixed by adding `BREAK` to
`fetch-set.mjs`'s exclusion list alongside the existing subtypes.

XYP's fetch also surfaced two real `fetch-set.mjs` bugs, both in
`fetchLimitlessExtra`:

- pokemon-tcg-data's `number` field for `xyp` keeps a redundant `XY` set-code
  prefix baked into the card number itself (e.g. `"XY67"`, not just `"67"`),
  unlike every other set fetched so far. For plain numbers Limitless silently
  301-redirects `/cards/XYP/XY67` → `/cards/xyp/67`, so the fetch itself
  didn't error — but the pre-redirect, non-canonical local id (`"XY67"`) was
  what got stored as `resolvedLocalId`/`deckCode`/`limitless.url`, which
  didn't match the canonical `"67"` that every _other_ set's own
  cross-reference scrape correctly recorded when linking to the same
  physical promo card. Fixed by having `get()` optionally report the
  post-redirect `res.url` (a new `returnUrl` option) and reading the
  canonical local id back off of it, rather than trusting the requested URL.
- XYP's 5 letter-suffixed alt-art cards (`XY67a` Jirachi, `XY150a`
  Yveltal-EX, `XY177a` Karen, `XY198a` M Camerupt-EX, `XY200a` M
  Sharpedo-EX) don't redirect at all — `/cards/XYP/XY67a` is a hard 404,
  since Limitless's actual page is the same prefix-stripped pattern
  (`/cards/xyp/67a`) but isn't reachable via redirect from the prefixed
  form. Handled as a 404 fallback (same shape as the existing basic-energy
  letter fallback) that strips a leading `XY` before a trailing
  `<digits><letter>` and retries.

Both bugs together meant the _first_ XYP fetch (before either fix) wrote
non-canonical deckCodes across the board, and running
`refresh-print-groups.mjs` against that bad data baked phantom `"XYP
XY<n>"` entries into more than a dozen other already-fetched sets'
`printGroup` arrays (anywhere that unioned with an XYP card). Since
`computePrintGroups` treats every stored `printGroup` array as graph edges
with nothing to prune a stale node, those phantom entries wouldn't have
self-healed just by re-fetching XYP correctly and re-running the refresh —
confirmed by trying exactly that, which left the phantom entries in place
because they were still sitting as literal strings inside other sets' own
files. Fixed with a one-off sweep deleting any `printGroup` entry matching
`/^XYP XY\d+[a-z]?$/` across every set file, _then_ re-running
`refresh-print-groups.mjs` to confirm the recomputed groups came out clean
(they did, on the first pass). Worth knowing if a future set's fetch ever
gets committed with a similar id-normalization bug: re-fetching the broken
set alone isn't sufficient once `refresh-print-groups.mjs` has already run
against it — the bad ids need to be purged from every file they leaked
into.

Two of EVO's flagged cards were genuine card-specific exceptions, not
errors — same category as Detective Pikachu and Classic Collection's Dark
Gyarados/birthday-Pikachu (see CLAUDE.md "Flavor text has no structured source"):
`Imakuni?'s Doduo` is a gag card with no flavor-text region on the
physical card at all (confirmed against the image — the dex info line runs
straight into the Pokémon Power text), and `ナッシー[Exeggutor]` is a
Japanese-only novelty card whose "flavor text" is Dr. Ooyama's own
hand-written blurb, not a Pokédex reuse. `Flying Pikachu` and `Surfing
Pikachu` are card-specific descriptive text by design, confirmed correct as
printed. XYP's Magearna (`XY165`, reprinted as `XY186`) is a similar
exception found fresh in this era: its printed text ("Magearna, with its
metallic body, is an artificial Pokémon created 500 years ago by humans.")
doesn't verbatim-match any mainline Pokédex entry for Magearna — confirmed
against the card image — likely because this promo predates Sun & Moon,
Magearna's actual mainline debut, by several months.

## Black Star Promos (all English)

**Every English Black Star Promos set is now done** — a fifth backfill,
oldest first, at the user's request after XYP: `WP` (basep, Wizards Black
Star Promos, 53), `NP` (np, Nintendo, 40), `DPP` (dpp, DP, 56), `HSP` (hsp,
HGSS, 25), `BWP` (bwp, BW, 101), `SMP` (smp, SM, 251), `SP` (swshp, SWSH,
304), and `SVP` (svp, Scarlet & Violet, 165 at the time; now 226) — 8 files joining the already-
added `XYP`. Codes are Limitless's own, as everywhere else in this database,
which is why the Wizards and SWSH sets are `WP`/`SP` rather than `BSP`/
`SWSHP`. Note that `smp`/`swshp`/`svp` are the sets earlier eras
deliberately skipped as "ongoing"; they're snapshots, and pokemon-tcg-data's
counts have already grown past what `sets/en.json` advertises (`svp` says 102
but ships 165), so re-fetching them later is expected rather than a bug.

`SVP` was the first of those re-fetches (2026/08/14), and it turned up a gap
no existing mode covered: **pokemon-tcg-data can be behind Limitless on an
ongoing set**, not just behind reality. It carried 165 cards where Limitless
catalogued 217. Plain `NONE` mode would have picked all 217 up, but at the
cost of dropping `SVP 85` (Limitless has no page for it — a confirmed 404,
already listed in `data/no-limitless/SVP.json`) and re-deriving 56
already-verified cards from Bulbapedia, 42 of them with flavor text that's
independently checkable today and wouldn't be afterwards. So `fetch-set.mjs`
gained `--fill-from-limitless` instead (see CLAUDE.md "Pipeline"): pokemon-tcg-data
stays primary for every card it has, and only the ids it's missing take the
fallback path. `SVP` grew to **218 cards** — the union of both sources — with
`total`/`secretTotal` corrected to 218/116 from a long-stale 75/-27.
Bulbapedia claims 226; the 9-card difference is cards Limitless doesn't
catalogue, out of scope by the same rule as MEP's 55–63 (no page means no
`deckCode` or `printGroup` to record).

Verified end to end: every one of the 165 pre-existing cards came through
byte-identical apart from `printGroup` **ordering** (membership unchanged on
all 97 that moved), card 85 kept its placeholder treatment, and the
field-by-field Limitless cross-check was re-proven non-vacuous by corrupting
an HP, an ability name and an attack cost and confirming all three were
caught. Flavor text ended at 136/136 — the reprint sources carried it through
for 52 of the 53 new cards, and `SVP 185` (Yanma) was transcribed from its
crop as a verbatim Violet-entry match. The six new cards whose flavor text
came _from_ Bulbapedia (186, 187, 188, 199, 201, 202) were each read against
their cropped strips rather than trusted to the sweep, which for them would
be checking a source against itself. The sweep itself ends at 1/136
unmatched: Pikachu 27, the already-documented starter-trio exception.

Five fixes came out of it, all in shared code rather than the set file:

- `fetchBulbapediaSetList` now also reads a set-list row written as a plain
  wiki-link (`[[Kyogre ex (SVP Promo 178)|Kyogre]]`) instead of a
  `{{TCG ID}}` template. Three of svp's Azure Legends Tins promos are.
- `parseCardWikitext` reads the infobox's `class=`. Bulbapedia keeps
  `cardname=Kyogre` with `class=SVex` separately, so five ex cards were being
  built named "Kyogre" with no `ex` subtype — which the cross-check caught on
  the name, but which would _also_ have wrongly given them a Pokédex info box.
  Unknown `class` values raise rather than being ignored, for that reason.
- `parseLimitlessCardText` maps Limitless's `0` energy symbol to an empty
  cost array (svp's Cleffa 37, "Grasping Draw"). A latent bug, not a new one —
  SVP was last fetched before that parser existed.
- `limitlessMismatches` drops Limitless's `Tera` ability block before
  comparing. pokemon-tcg-data models Tera as a subtype plus a `rules` entry
  and keeps `abilities` for real abilities; neither is wrong, and without this
  every Tera card in a set reports a false mismatch.
- A Limitless parse failure now names the card and URL. The raw error said
  only `unknown Limitless energy symbol "0"` — nothing about which of 218
  pages it came from.

Real upstream `flavorText` errors found and fixed via each set's overlay,
all confirmed against card images: WP (Dragonite, "can fly **is** spite"),
DPP (Glameow, "fickleness **if** very popular"), HSP (Ho-Oh, "form behind
when it flies", missing "it"), BWP (Pansage "are **know** to relieve",
Serperior "give their all" missing "it", Kyurem "**a** powerful, freezing
energy"), SMP (Pikipek, Decidueye, Zorua, Heatran — "like **plasma**" for
"like magma", Mimikyu, Malamar, Pikachu SM157 "It **feel** stressed", and
both Dusk Mane Necrozma prints, whose "This is its form **with** it is
devouring" garbles "while"), SP (Cinccino "body **secrets** oil", Sobble
"**attacks** won't be able to resist weeping", Pikachu SWSH234 missing its
final period, Hisuian Basculin's em dashes typed as " - ", Manaphy "It
starts life" missing "its"), and SVP (both Revavroom prints' line-wrap
em-dash space, and the Van Gogh Pikachu's "pouches **of** its cheeks" for
"in its cheeks"). SVP also needed 19 cards transcribed from cropped images
outright — `svp` is the "partial coverage" set, and its newer promos have none.

Confirmed-correct-as-printed exceptions that can never algorithmically clear:
WP's 25 flagged cards are almost all WotC-era rewordings of a Red/Blue entry
(singular for plural and similar), the same category as Classic Collection's
1999 Base Set prints; HSP's Porygon prints a doubled period ("any
environment..") that the card itself really has; DPP's Porygon-Z and Gliscor
have a dex box but no room left for flavor text; SMP's three Detective
Pikachu cards, Charizard SM226 and Armored Mewtwo SM228 carry _Mewtwo Strikes
Back_/_Detective Pikachu_ movie text; and SVP's Pikachu #27 describes the
Scarlet & Violet starter trio. Sabrina's Abra (WP 19) prints a dex box but no
flavor text at all.

Five shared-library fixes came out of this backfill:

- `speciesName()` (both copies) gained the "Special Delivery" and "Light"
  promo prefixes, Necrozma's `Dawn Wings`/`Dusk Mane` fused forms (alongside
  the existing `Ultra`), and the Van Gogh promo's full card name, `Pikachu
with Grey Felt Hat` — all the same no-separate-Bulbapedia-page category as
  Heat Rotom et al.
- `cleanDexEntry` now strips HTML comments. Bulbapedia's Glaceon Ultra Sun
  entry annotates its temperature as `–75<!--U+2013 EN DASH in-game-->`,
  which rendered to nothing on the page but leaked into the compared text and
  flagged SM238 despite identical wording.
- `fetch-set.mjs`'s XY-specific set-code-prefix fallback is now general (see
  CLAUDE.md "Card numbers with the set code baked in"), because `dpp` has the
  same problem: pokemon-tcg-data numbers its cards `DP04` where Limitless's
  URL is just `4`, and unlike XYP's plain numbers these 404 rather than
  redirecting.
- `crop-flavor-text.mjs` skips images whose box would run off the edge
  instead of aborting the run. The long promo sets mix in oversized/jumbo
  scans with a non-standard aspect ratio (SMP has 7), and the box is scaled
  by height alone.
- The `deckCode` fallback keys off `resolvedLocalId === null` rather than the
  whole-set `noLimitless` flag. Caught by inspecting the output: the first
  version gave all 13 no-Limitless SP cards the same `"SP null"` deckCode,
  the exact non-unique-deckCode trap the McDonald's sets documented.

Crop boxes for the older card templates, since none of the existing ones fit
(all in the script's 1024-height reference space, as always): WotC/Base-era
`top=910 height=70 left=55 width=625`, Diamond & Pearl `top=800 height=95
left=45 width=600`, HGSS `top=825 height=100 left=45 width=600`. Black &
White moved flavor text into a right-hand column at the bottom — `top=865
height=120 left=415 width=295` — and Sun & Moon onward matches the existing
Scarlet & Violet box (`top=905 height=95 left=260 width=473`).

`data/sets/CELCC.json`'s original `<sequentialPrefix>` fetch turned out to have
mis-numbered 13 of its 25 cards: it assumed pokemon-tcg-data's fetched array order
matched Limitless's own `CC1`–`CC25` numbering, spot-checked on only 3 positions, and
that assumption broke silently for `CC4`–`CC16` — each of those localIds ended up with
one card's name/attacks/images (from pokemon-tcg-data) paired with a _different_
card's artist/deckCode/printGroup (scraped from Limitless at that same wrong id), e.g.
Claydol holding Here Comes Team Rocket!'s printGroup. Caught by the user, not this
database's own tooling — the field-by-field Limitless cross-check that would normally
catch a source disagreement doesn't run for `<sequentialPrefix>` cards at all. Fixed
at the root: `fetch-set.mjs` now resolves `<sequentialPrefix>` localIds by matching
each card's own name against every fetched Limitless page under that prefix, never by
position (see CLAUDE.md "Reprint subsets with non-sequential, non-unique numbers" for
the full mechanism). Re-fetching with the fix reassigned all 13 cards to their correct
`localId` cleanly; `refresh-print-groups.mjs` and `check-flavor-text.mjs CELCC` both
confirmed clean afterward, and no other set file needed touching, since every other
set's own `CEL CC<n>` cross-references were scraped correctly at that other set's own
fetch time.

## MEP, Dragon Vault, MEE

`data/sets/MEP.json` (MEP Black Star Promos, 79 cards) is also **done** — the
Mega Evolution era's promo set, and the first set in this database that
**pokemon-tcg-data doesn't carry at all** (no `mep` in `sets/en.json`, no
`cards/en/mep.json`; checked directly, not assumed). TCGdex does have a `mep`
set but a thin one — 60 of the 79 cards, no image URLs, and no weakness data
on the first ~45 — so it isn't used. Instead `fetch-set.mjs` gained a `"NONE"`
`<ptcgDataSetId>` mode (see CLAUDE.md "Sets pokemon-tcg-data doesn't have"): the
card list comes from Limitless, and game text from either the card's existing
print elsewhere in `data/sets/` (53 of the 79 are reprints — found via the
stored `printGroup` cross-references, which already pointed at MEP because
Limitless's prints table is always full history) or, for the 26
set-exclusives, from Bulbapedia's own card page for that print. Every card is
then cross-checked field by field against its Limitless page, which came back
clean on the first pass; the check itself was proven non-vacuous by
deliberately corrupting an HP, an attack cost and an ability name and
confirming all three were caught.

Scope is Limitless's 79 cards (`1`–`54`, `64`–`88`). Bulbapedia lists more
(`55`–`63` and `89`–`107`+, an ongoing set), but those have no Limitless page
and so no `deckCode`, `printGroup`, or images — the same reason this database
takes Limitless as the authority on set membership everywhere else. Expect to
re-fetch as the set grows, same as `SMP`/`SP`/`SVP`.

Two things this set turned up that weren't MEP-specific:

- **`pokedex` is no longer a reliable proxy for "has flavor text."** Until MEP
  the two went together, so `check-flavor-text.mjs`, `crop-flavor-text.mjs`,
  `flavor-text-coverage.mjs` and the editor all filtered on `c.pokedex`. MEP's
  18 First Partner Illustration Collection cards (`37`–`54`) are full-art:
  they print flavor text with **no dex line above it** (confirmed against the
  card images, and matching Bulbapedia's own empty `ndex=` for them). All four
  filters now take `c.pokedex || c.flavorText`, which changes nothing for any
  existing set but stops silently skipping 18 of MEP's 61 flavor-text cards.
- **A verification sweep against the same source the text came from proves
  nothing.** The 26 exclusives' flavor text came from Bulbapedia, and
  `check-flavor-text.mjs` compares against Bulbapedia — so all 61 "matched" on
  the first pass while Cottonee (`18`) was in fact wrong. Reading the cropped
  strips caught it: the card prints "light and airy—altogether top quality."
  and Bulbapedia's card page had transcribed the _Scarlet_ entry's wording,
  which has a stray space after the em dash (the same line-wrap artifact
  category as PAR's Bounsweet and PAF's Magmortar). The card actually matches
  Bulbapedia's **Moon** entry verbatim; fixed via the `data/flavor-text/
MEP.json` overlay. All 26 exclusives were read against their crops; only
  this one was wrong.

`data/sets/DRV.json` (Dragon Vault, 21 cards) is also **done** — `dv1`, a
Black & White-series mini-set (2012/10/05, all Dragon-types, 21 cards against
a `printedTotal` of 20). It was added alongside `DCR` rather than with the
rest of its era, since both were found the same way: as `sets/en.json` ids
that no era backfill's numeric walk would ever reach. Flavor text came from
pokemon-tcg-data directly and its sweep flagged one card, Latias, a real
upstream error — "Its body is covered **in** a down" where the card prints
"covered **with** a down" (Bulbapedia's Diamond/Pearl/Platinum/Black/White
entry agrees with the card); confirmed against the card image and fixed via
the `data/flavor-text/DRV.json` overlay. Its 3 ineligible cards are all
Trainers, as expected. The Black & White card template puts flavor text in a
right-hand column, but Dragon Vault's holo cards sit further left than `BWP`'s
box allows — `top=830 height=130 left=200 width=530` frames them.

`data/sets/MEE.json` (MEE Basic Energies, 8 cards) is also **done** — a
dedicated basic-energy set for the Mega Evolution era (released 2025/09/26),
found while answering a user question about a specific card rather than
during a backfill sweep. Same shape as `SVE`/MEP: pokemon-tcg-data has no
`mee` entry at all, so it went through `"NONE"` mode
(`node scripts/fetch-set.mjs NONE MEE`) against a hand-written
`data/set-meta/MEE.json` (`bulbapediaSetPage: "MEE Basic Energies (TCG)"`).
All 8 cards are reprints of existing basic energies already in `data/sets/`,
so nothing needed transcribing from Bulbapedia — but reusing an existing
reprint's stored text surfaced two real gaps, one in the fetch script and
one in its reprint-selection logic:

- **`parseLimitlessCardText` (the Limitless cross-check every `"NONE"`-mode
  card goes through) had no `Energy` case at all** — only `Trainer` vs.
  `Pokémon`, since no prior `"NONE"`/`--fill-from-limitless` set had ever
  included an Energy card. All 8 cards failed the cross-check with a bogus
  `supertype: "Pokémon"` mismatch. Fixed by detecting `Energy` from the
  card's `typeLine` (`"Energy - Basic Energy"` / `"Energy - Special
Energy"` on Limitless) and stripping the redundant trailing `" Energy"`
  before comparing against this database's own `"Basic"`/`"Special"`
  subtype.
- **`rarity` needed a value in `defaultRarity` even though these cards print
  no rarity symbol** — `"NONE"` mode has no per-card `data/no-rarity/`
  branch the way a normal fetch does, so `data/set-meta/MEE.json` sets
  `defaultRarity: "None"` directly (confirmed against Bulbapedia's own set
  list, which marks all 8 rows' rarity column "-").
- **The reprint text a card inherits can come from the wrong era.**
  `buildReprintIndex` resolves a reprint by scanning `data/sets/*.json` in
  directory order and taking the first file whose stored `printGroup`
  already lists this set's card — with no tie-break for a field that
  changed wording _across_ the reprint chain. All 8 MEE cards resolved to
  `CRZ`/`XY`/`GEN`-era text, whose `name` is the bare pre-Scarlet & Violet
  "Grass Energy" — but the actual MEE print (confirmed against all 8 card
  images directly) reads "**Basic** Grass Energy", the same S&V-era wording
  `SVE.json` already stores, just not the file the scan happened to hit
  first alphabetically. Fixed by hand directly in `data/sets/MEE.json`
  (prepending "Basic " to all 8 names) rather than touching the shared
  selection logic — this is the one field basic-energy reprints are known to
  disagree on across eras, and a name is cheap to eyeball against 8 card
  images directly, the same one-off-hand-fix precedent as BLK/CELCC/DRV
  elsewhere in this file.

The next chronological gap after this work was the Black & White era proper — see below.

## No-Limitless / no-rarity overlay case studies

Full narrative behind the `data/no-limitless/` and `data/no-rarity/` mechanisms
(see CLAUDE.md for the mechanism description):

**A card missing from Limitless is not out of scope — check whether it's a
reprint before writing it off.** SP (`swshp`) was found short 3 cards neither
pokemon-tcg-data nor (for 2 of the 3) Limitless carries at all: SWSH299
(Jirachi V), SWSH300 (Unown V), SWSH301 (Lugia V). The instinct to treat "no
Limitless page" as "not in scope" (the MEP/SVP precedent, where Limitless's own
card-list scope decision is treated as authoritative) doesn't hold here,
because these three aren't unique prints with no other source — Bulbapedia's
card page for each is a `#REDIRECT` to an already-verified reprint in this
database (Jirachi V → `ASR 170`, Unown V → `SIT 65`, Lugia V → `SIT 138`), the
same redirect-resolution tier `buildFallbackCards` already uses for
`--fill-from-limitless`. A reprint's game text is definitionally identical, so
all three were hand-added directly to `data/sets/SP.json` (not run through
`fetch-set.mjs`, since no existing mode covers "no Limitless page, but a known
reprint") with text/HP/attacks/weakness/resistance/retreat copied verbatim
from their source card, confirmed against each promo's own card image before
trusting anything. SWSH301 does have a live Limitless page (`id`/`deckCode`/
`printGroup` set normally, and its `printGroup` already listed `SP 301` — no
`refresh-print-groups.mjs` change needed); SWSH299/300 have `limitless: null`,
same as any other no-Limitless card.

Two things this surfaced that aren't SP-specific:

- **Don't trust a Bulbapedia gallery image's caption.** The files captioned as
  SWSH300's and SWSH301's promo prints (`UnownVSWSHPromo300.jpg`,
  `LugiaVSWSHPromo301.jpg`) are actually the **Japanese** S-P promo scans
  (320/S-P, 322/S-P) — confirmed by opening both images (wrong language) and
  by the file's own upload-history comment on Bulbagarden Archives ("Unown V
  (S-P Promo 320)"). Only SWSH299's file was genuinely correct. Always open
  the image and read the card, not just the caption — same lesson as every
  "confirmed against the card image" note elsewhere in this file, just for a
  source image instead of a flavor-text transcription.
- **Limitless's own CDN can 404 in spirit while 200ing in form.** All three
  promo images 403'd from `limitlesstcg.nyc3.cdn.digitaloceanspaces.com`
  (`AccessDenied`, not a clean 404) even for SWSH301, which has a normal card
  page — a genuinely missing/broken asset on Limitless's side, not an id bug.
  Confirmed by fetching a known-good MEP/SVP fallback image from the same CDN
  successfully, which ruled out a general outage. Final images for all three
  came from `storage.googleapis.com/images.pricecharting.com/...` instead (a
  new source for this database, supplied and confirmed by the user) — SWSH299
  used its correct Bulbapedia Archives URL instead, since that one held up.
  Neither has a `_LG`/small variant, so `images.small`/`images.large` point at
  the same URL for these three cards specifically.

Also worth remembering for the next long-running promo set's refresh:
`--fill-from-limitless`'s missing-card diff is currently broken for any set
whose pokemon-tcg-data `number` bakes in a redundant set-code prefix the way
`swshp`'s does (`"SWSH001"`, not `"1"`) — `buildFillCards`'s `have` set runs
`toLimitlessLocalId()` over that number, which only strips leading zeros, not
the whole prefix, so it undercounts what's already present almost entirely
(a test run on SP saw 292 of 304 already-fetched cards reported as "missing").
`fetchLimitlessExtra`'s per-card 404 retry already has the real prefix-strip
logic (guarded on the fetched page's title); `buildFillCards`'s upfront diff
doesn't share it. Not fixed here — SP's 3 cards were added by hand instead —
but worth fixing before trusting `--fill-from-limitless` on `swshp`/`xyp`/
`dpp` again.

`card.rarity = primary.rarity` used to be a direct, unchecked copy — which
silently dropped the field entirely for any set whose pokemon-tcg-data source
has no `rarity` at all (`rarity: string` is required in `types/card.ts`, but
that's only checked against the typed input shape, not the actual JSON an
external fetch returns). Found by audit: 75 cards across `KSS` (Kalos Starter
Set) and the three McDonald's Collections (`MCD17`/`MCD18`/`MCD19`) had no
`rarity` key at all. Confirmed genuine — not a fetch bug — against
Bulbapedia's own set-list rarity column, which shows a bare "—" for every card
in all four sets: these are theme-deck/promo-collection prints that carry no
rarity symbol on the physical card, the same real fact `data/no-pokedex/`
records for cards that predate the dex-box convention. `fetch-set.mjs` now
requires an explicit source for `rarity` — either a non-empty value from
pokemon-tcg-data/the fallback path, or the card's localId (or a lone `"*"`)
listed in `data/no-rarity/<CODE>.json`, which stores `"None"` — and throws
naming the card otherwise, so a future set with a genuine gap fails loudly
instead of silently dropping the field again.

**A missing `rarity` field is not always a whole-set case, though — check
per card before assuming "\*".** The same audit also caught 3 individual cards
in the already-completed `DRV.json` (Dragon Vault) missing `rarity` — Exp.
Share (18), First Ticket (19), and the Kyurem secret rare (21) — despite the
other 18 cards in that same 21-card set carrying `Rare Holo` normally. Unlike
KSS/MCD, this wasn't "no rarity concept": Limitless's own card pages list all
three as "Holo Rare" (Bulbapedia's set list agrees, using this database's
`Rare Holo` spelling), pokemon-tcg-data just happens to lack the field for
those three specific cards. Fixed by hand directly in `data/sets/DRV.json`
(the BLK/Escavalier precedent — a one-off upstream gap on an already-completed
set isn't worth a new overlay), not added to `data/no-rarity/`, since these
cards do have a real rarity, just not one pokemon-tcg-data carries.

Separately, 7 cards in `ASC.json` (Ascended Heroes) carried the raw upstream
constant `"MEGA_ATTACK_RARE"` in `rarity` instead of pokemon-tcg-data's usual
title-cased strings — confirmed against `me2pt5.json` directly, where every
other card's `rarity` is already title case (`"Common"`, `"Double Rare"`,
etc.) and only these 7 escaped it. `fetch-set.mjs` now runs every `rarity`
value through `normalizeRarity()`, which title-cases a SCREAMING_SNAKE_CASE
value structurally (`MEGA_ATTACK_RARE` → `Mega Attack Rare`) rather than
special-casing this one string, so the same upstream slip on a future set is
caught too.

**The same "not in Limitless, therefore out of scope" reasoning was wrong for
MEP and SVP too — this isn't an SP-specific fix, it's a standing policy error.**
Both sets had deliberately excluded cards on exactly this
premise. Re-checked the same way as SP: diff each set's own Bulbapedia set-list
page against what's stored, not the stale "Limitless's N cards is the whole set"
assumption.

- **MEP grew from 88 to 88 known-real cards** — Bulbapedia's set list actually
  runs to 120 (with a large ongoing gap, `111`–`119`, not yet assigned), which
  is a separate, much bigger backfill than what was tackled here. What _was_
  in scope: `055`–`063`, the "First Partner Illustration Collection Series 3"
  cards (Treecko, Torchic, Mudkip, Chespin, Fennekin, Froakie, Sprigatito,
  Fuecoco, Quaxly) — still absent from Limitless's own MEP page as of this
  writing (a very recent release, August 7, 2026), but each has its own full
  Bulbapedia card page (not a redirect) with complete, self-consistent game
  text, matching the exact shape of the already-verified `037`–`054` cards in
  this same set (single attack, no ability, flavor text, no resistance). All
  9 transcribed from Bulbapedia's wikitext and cross-checked against their own
  card images (2 read in full, the rest spot-checked for retreat cost and
  regulation mark, which the infobox text doesn't state) before saving. Added
  by hand directly to `data/sets/MEP.json`, `limitless: null`. Images from
  Bulbagarden Archives — no mislabeling this time (unlike the SP case above),
  confirmed by opening them.
- **SVP had 7 of Bulbapedia's 225 listed cards missing**, not the 9 an old
  note claimed (that count had drifted). Same triage as SP: checked each
  card's own Bulbapedia page for a `#REDIRECT` before assuming it needed
  transcription.
  - `190`, `225` (Pikachu, Play!Pokémon/Worlds promos) and `191`
    (Sprigatito), `192` (Fuecoco) — Pokémon Horizons anime tie-in prints —
    all redirect, to `SVP 101`, `SVI 13`, and `PAL 34` respectively (192 also
    joins `PAL 34`'s existing print group alongside the already-stored `SVP
79`, a different Fuecoco promo — three separate physical prints of the
    same game text is normal here, same as any other reprint chain).
    **Redirecting to the same source doesn't mean identical card, though**:
    191 and 192 turned out to carry unique anime-tie-in flavor text ("Liko's
    partner is quirky...", "Roy's partner is lax...") instead of the source
    print's Pokédex text — caught only by actually opening the image rather
    than assuming a reprint's flavor text carries over unchanged the way its
    attacks/HP do. Filed alongside Detective Pikachu and Classic Collection's
    Dark Gyarados as the same "flavor text has no structured source"
    exception — confirmed correct as printed, not fixed.
  - `213` (Feraligatr), `214` (Pikachu), `215` (Toxtricity ex) — 2024
    Illustration Contest winner promos — have no Bulbapedia redirect, so were
    transcribed directly from Bulbapedia's card page the same way MEP's
    original exclusives were, each confirmed against its own card image.
    Regulation mark had to come off the image directly (varies by print date,
    not carried in the infobox text) — confirmed `H`/`I` depending on print,
    not assumed from a neighboring card.
  - All added by hand to `data/sets/SVP.json`, `limitless: null`.
    `check-flavor-text.mjs SVP` came back 3/142 unmatched afterward: the
    pre-existing Pikachu 27 exception plus the two new anime tie-ins above —
    expected, not a regression.

SVP grew to **226 cards** shortly after (2026/08/15) with `Terapagos &
Friends`, a jumbo/oversized promo from the Pokémon Horizons "Grand Adventure
Collection" gift set (2024/11/15 US release). Confirmed against its own card
image (Bulbapedia Archives): no pokemon-tcg-data entry (still capped at 165
as of this writing), no Limitless page (confirmed 404, and not a redirect —
Bulbapedia's own page for it is the genuine article, not a `#REDIRECT`), and
critically **no printed card number at all** — the bottom-left corner shows
only "SVP EN" and the promo star, unlike every other hand-added no-Limitless
SVP card (213–215, 225), which at least print a bare number. That's a new
case `Card.number: string` couldn't represent, so `types/card.ts` widened it
to `string | null` — null meaning the card genuinely prints no number, not
"unknown". `localId` is still `"226"`, continuing the sequence positionally.
Its flavor text ("After a long slumber in the form of a pendant...") is
anime-continuity text, not a Pokédex reuse — the same "flavor text has no
structured source" exception as SVP 191/192 above; `check-flavor-text.mjs`
flags it and always will, expected rather than a bug. `pokedex.height` is
stored as `"0'8\""` (the feet'inches convention every other card uses) even
though the card itself prints the abbreviated `HT: 8"` with no feet
component — confirmed against Terapagos's real-world Normal Form height
(0.2 m ≈ 8 in) rather than transcribed literally, unlike `number`, which does
get transcribed literally when present.

`limitless` is `null` rather than some placeholder deck code, deliberately: we
have no source for what Limitless (or anything else) would call a card it
never catalogued, and a fabricated code would either falsely claim print-group
knowledge this database doesn't have, or — if two such cards shared a
placeholder — silently union unrelated cards into one fake print group (the
exact bug the original placeholder-based version of this hit while adding the
McDonald's Collections; see also `types/card.ts`). Every consumer
(`computePrintGroups`, `refresh-print-groups.mjs`, `buildReprintIndex`) guards
on `card.limitless` being non-null before reading `deckCode`/`printGroup` off
it, and simply skips a `null` card rather than matching it against some
shared "unknown" key.

It has to be explicit rather than an automatic fallback, because a 404 is also
what an id-normalization bug looks like, and quietly substituting placeholder
data for one of those is how phantom deckCodes leaked into a dozen set files
while adding XYP. A 404 that isn't listed fails the run — but the run collects
every one first and reports them together, so a set needs one pass to find them,
not one pass per card.

## Black & White era proper

`data/sets/BLW.json` (Black & White base set, 115 cards) is done, the first of
the eleven. Its flavor text came from pokemon-tcg-data directly. Its verification
sweep flagged six cards; five were real upstream `flavorText` errors, each a
single-word or punctuation slip, confirmed against the card images and fixed via
the `data/flavor-text/BLW.json` overlay — Darmanitan ("stone statue, then it"
instead of the card's "stone statue. Then it"), Scolipede ("its opponent"
for the card's plural "its opponents"), Duosion ("the same thought" for the
card's plural "the same thoughts"), Timburr ("piece of timber" for the
card's "piece of lumber"), and Patrat ("keep watches" for the card's
singular "keep watch"). Pikachu (115, the "extremely rare" promo-style card)
was confirmed correct as printed — card-specific text with no Pokédex
source, the same exception category as Classic Collection's Dark Gyarados.
The Black & White-era flavor-text box from `BWP`/`DRV` needed widening for
this set's card template: `top=855 height=130 left=380 width=340`.

`data/sets/EPO.json` (Emerging Powers, 98 cards) is also done — its flavor
text also came from pokemon-tcg-data directly. Its verification sweep
flagged five cards: Pansear and Darmanitan were both a real
character-normalization gap, not text errors — pokemon-tcg-data's own
`flavorText` types a degree sign as "º" (the masculine ordinal indicator,
visually near-identical) where the card prints a real "°"; fixed by adding
a `º`→`°` normalization to `normalize()` (both copies), the same treatment
as the existing ellipsis/minus-sign/`--` fixes. Emolga ("membranes" for the
card's singular "membrane"), Unfezant ("fell" — a typo — for the card's
"feel"), and Audino ("radar-like"/"surrounding" for the card's
"radarlike"/"surroundings") were real upstream errors, confirmed against
the card images and fixed via the `data/flavor-text/EPO.json` overlay.

`data/sets/NVI.json` (Noble Victories, 102 cards) is also done — its flavor
text also came from pokemon-tcg-data directly. Its verification sweep
flagged an unusually large 14 of 94 cards, all real upstream `flavorText`
errors (a dropped word, a wrong word, or a singular/plural slip), each
confirmed against the card image and fixed via the `data/flavor-text/
NVI.json` overlay: Leavanny (missing "the" before "cutters"), Dwebble
("The Pokémon" for the card's "This Pokémon"), Karrablast (missing "an"
before "acidic liquid"), Palpitoad (missing "the" before "water"),
Jellicent (missing "the" before "ships", and "habitats" for the card's
singular "habitat"), Kyurem (missing "a" before "powerful, freezing
energy" — the same bug already documented on BWP's Kyurem, here on a
different card entirely), Garbodor (missing "a" before "poisonous
liquid"), Litwick 57 (missing "that" before "it burns"), Litwick 58
("leaches" for the card's "leeches"), Conkeldurr ("It it thought" — a
typo — for the card's "It is thought"), Stunfisk ("volt" for the card's
"jolt"), Mienfoo ("attack" for the card's plural "attacks"), Mienshao
("wield"/"arms attacks" for the card's "wields"/"arm attacks"), and Durant
("against" for the card's "from"). Meowth (102, the "extremely rare"
promo-style card) was confirmed correct as printed, the same exception
category as BLW's Pikachu and EPO's own precedent.

`data/sets/NXD.json` (Next Destinies, 103 cards) is also done — Limitless
files this one under `NXD`, not the `NDE` guess tried first (all 103 cards
404ing on the first attempt was the tell — a wrong code, not a genuinely
missing set; confirmed via a direct card-page fetch before retrying). Its
flavor text also came from pokemon-tcg-data directly. Its verification
sweep flagged 10 cards: both Growlithe prints (10, 11), Muk, Mienfoo, and
Scraggy were real upstream `flavorText` errors — a comma-and-lowercase
"it" where the card has a period and capital "It" (Growlithe), "A toxic
fluids" for the card's "A toxic fluid" (Muk), "They has mastered" for the
card's "They have mastered" (Mienfoo), and "anyones" for the card's
"anyone" (Scraggy) — each confirmed against the card image and fixed via
the `data/flavor-text/NXD.json` overlay; Litwick repeated the exact
"leaches"/"leeches" typo already seen on NVI's own Litwick, same fix.
Emboar, Chandelure, Zoroark, and Hydreigon (100–103, this set's shiny-rare
cards) were all confirmed correct as printed — identical card-specific
text ("This extremely rare Pokémon is a different color than usual. It is
very hard to find."), the same exception category as BLW's Pikachu and
NVI's Meowth.

`data/sets/DEX.json` (Dark Explorers, 111 cards) is also done — its flavor
text also came from pokemon-tcg-data directly. Its verification sweep
flagged 7 cards: Carnivine ("on marshes" for the card's "in marshes"),
Blaziken ("it foes" — a typo — for the card's "its foes"), Tympole
(missing "s" on "warn others"), Vanillite ("areas surrounding them" for
the card's "areas around them"), and Herdier (extra "a" before "black,
cape-like fur") were all real upstream `flavorText` errors, confirmed
against the card images and fixed via the `data/flavor-text/DEX.json`
overlay. Gardevoir and Archeops (109, 110, this set's shiny-rare cards)
were confirmed correct as printed — the same identical card-specific text
and exception category as NXD's own shiny-rare cards.

`data/sets/DRX.json` (Dragons Exalted, 128 cards) is also done — its
flavor text also came from pokemon-tcg-data directly. Its verification
sweep flagged an unusually large 19 of 110 cards; 15 were real upstream
`flavorText` errors, mostly single dropped/wrong words or typos, each
confirmed against the card image and fixed via the `data/flavor-text/
DRX.json` overlay: Jumpluff (extra "the" before "seasonal winds"), Buizel
(extra "the" before "water"), Palpitoad ("the can make wave" — a
typo — for "they can make waves"), Golurk ("around the sky" for "across
the sky"), Baltoy ("It move" — a typo — for "It moves"), Gigalith
("magnified internally are fired" for "magnified internally and fired"),
Lairon ("it steely body" for "its steely body"), Deino ("bit everything"
for "bite everything"), Aipom ("can us its tail" for "can use its tail"),
both Swablu prints (104, 105; "wipes of dirt" for "wipes off dirt"),
Bibarel (extra "the" before "people nearby"), Audino (missing "a" before
"radarlike ability"), Minccino ("They great" for "They greet"), and
Bouffalant ("derail a trail" for "derail a train"). Serperior, Reuniclus,
Krookodile, and Rayquaza (125–128, this set's shiny-rare cards) were
confirmed correct as printed — the same identical card-specific text and
exception category as NXD's and DEX's own shiny-rare cards.

`data/sets/BCR.json` (Boundaries Crossed, 153 cards) is also done — its
flavor text also came from pokemon-tcg-data directly. Its verification
sweep flagged 9 cards: Camerupt (an en dash "–" where the card prints a
real em dash "—" — a one-off transcription slip, not promoted to a
`normalize()` rule since it's the first occurrence), Darumaka (missing
"°" before "F"), Mandibuzz (extra "the" before "bones it finds"),
Skarmory ("speed of over 180 mph" for the card's "speeds over 180 mph"),
Flygon (missing the comma after the quoted "The Desert Spirit"), and
Buneary ("rolled up ears" for the card's hyphenated "rolled-up ears") were
all real upstream `flavorText` errors, confirmed against the card images
and fixed via the `data/flavor-text/BCR.json` overlay. Golurk, Terrakion,
and Altaria (150–152, this set's shiny-rare cards) were confirmed correct
as printed — the same identical card-specific text and exception category
as the prior three sets' own shiny-rare cards.

`data/sets/PLS.json` (Plasma Storm, 138 cards) is also done — its flavor
text also came from pokemon-tcg-data directly. Its verification sweep
flagged 12 cards; 10 were real upstream `flavorText` errors, confirmed
against the card images and fixed via the `data/flavor-text/PLS.json`
overlay. Most were single dropped/wrong words or missing punctuation —
Infernape ("hand" for "hands"), Swinub (an extra comma), Beartic ("around
the ocean waters" for "across the ocean waters"), both Zubat prints (52,
53; "surrounding" for "surroundings"), Klang ("comprises" for "comprise",
and "its foe" for "a foe"), Doduo (missing "a" before "telepathic
power") — but two were more substantial: Sharpedo's saved `flavorText`
was truncated mid-sentence, cutting off after "and is known as" with the
rest of the quoted title missing entirely; and both Riolu and Patrat had
saved text that didn't match the card at all — not a wording slip but
wholesale wrong text, each replaced with the Bulbapedia candidate that
turned out to be a verbatim match against the card image (Riolu's Black
2/White 2/X/Omega Ruby entry, Patrat's Black 2/White 2 entry). Charizard
and Blastoise (136, 137, this set's shiny-rare cards) were confirmed
correct as printed — the same identical card-specific text and exception
category as the prior sets' own shiny-rare cards.

`data/sets/PLF.json` (Plasma Freeze, 122 cards) is also done — its flavor
text also came from pokemon-tcg-data directly. Its verification sweep
flagged 5 cards: Nidoran ♀ had an extra "its" before "barbs" (the card
reads "the poison it secretes from barbs"), a real upstream error
confirmed against the card image and fixed via the `data/flavor-text/
PLF.json` overlay. Empoleon, Sigilyph, Garbodor, and Garchomp (117–120,
this set's shiny-rare cards) were confirmed correct as printed — the same
identical card-specific text and exception category as the prior sets'
own shiny-rare cards.

`data/sets/PLB.json` (Plasma Blast, 105 cards) is also done — its flavor
text also came from pokemon-tcg-data directly. Its verification sweep
flagged 5 cards: Kangaskhan was missing "out to" before "play" (the card
reads "lets the baby out to play only when it feels safe"), a real
upstream error confirmed against the card image and fixed via the
`data/flavor-text/PLB.json` overlay; Froslass was confirmed correct as
printed — the card really does say "-58 degrees F" (plural), and it's
Bulbapedia's own Platinum entry that has the "degree" (singular) typo, not
the card. Exeggcute, Virizion, and Dusknoir (102–104, this set's
shiny-rare cards) were confirmed correct as printed — the same identical
card-specific text and exception category as the prior sets' own
shiny-rare cards.

`data/sets/LTR.json` (Legendary Treasures, 115 cards) and `data/sets/
LTRRC.json` (Legendary Treasures Radiant Collection, 25 cards) are also
done — this closes out the entire Black & White era. `bw11`'s fetch
pulled in 140 cards total (like `g1`/Generations before it, pokemon-tcg-
data keeps this set's own Radiant Collection subset — `RC1`–`RC25` —
inside the base set id rather than splitting it out); it was split by
hand into two files afterward, same precedent as GEN/GENRC, for
consistency with every other subset that shares its base set's Limitless
page. `printedTotal`/`secretTotal`/`total` needed recomputing by hand
after the split (113/2/115 for the base set — 2 secret rares sit past its
113 printed slots — and 25/0/25 for Radiant Collection), since the
fetched file's original `secretTotal: 27` was `140 - 113`, a figure that
only made sense before the split. Both halves' flavor text came from
pokemon-tcg-data directly. The sweep (run once, before splitting) flagged
two cards, both real upstream `flavorText` errors, confirmed against the
card images and fixed via the `data/flavor-text/LTR.json` overlay: Pignite
("When it trouble" — a typo — for "When in trouble") and Solosis (missing
its final period).

The Black & White era (`bw1` through `bw11`, plus its already-done `bwp`
promos and `dv1` Dragon Vault) is now **done** — 12 files across the 11
`sets/en.json` entries the era backfill covers (`bw11` splitting into two
files).

## HGSS era

`data/sets/HS.json` (HeartGold & SoulSilver base set, Limitless code `HS`,
124 cards) is done. Its flavor text came from pokemon-tcg-data directly. Its
verification sweep flagged 7 cards. Sandslash ("its spike" for the card's
plural "its spikes"), Chikorita (extra "the" before "humidity"), and Paras
("grows large, large mushrooms" for the card's "grows, large mushrooms")
were real upstream `flavorText` errors, confirmed against the card images
and fixed via the `data/flavor-text/HS.json` overlay. The other 4 (both
Ho-Oh LEGEND prints, both Lugia LEGEND prints) surfaced a genuine upstream
data bug, not a wording slip: HGSS-era LEGEND cards are split across two
physical prints — a top half carrying only HP and a "put this card onto
your Bench with the other half" rule box, and a bottom half carrying the
attacks, Pokédex info box, and flavor text — but pokemon-tcg-data's
`flavorText` (and `nationalPokedexNumbers`) are set on _both_ halves'
entries, not just the bottom one; confirmed against all four card images
(111/112 for Ho-Oh, 113/114 for Lugia). Fixed by hand directly in
`data/sets/HS.json` (deleting `pokedex` and `flavorText` from the top-half
prints, 111 and 113 — the same one-off-hand-fix precedent as BLK/CELCC/DRV
elsewhere in this file) plus a `data/no-pokedex/HS.json` overlay
(`["111", "113"]`) so a future re-fetch doesn't reattach the Pokédex box;
the `flavorText` half of the bug isn't covered by any existing overlay
mechanism (`no-pokedex` only suppresses `pokedex`), so a future re-fetch
would need the same `flavorText` deletion repeated by hand for these two
localIds specifically. Separately, "Ho-Oh LEGEND"/"Lugia LEGEND" turned out
to also be a `speciesName()` lookup gap of the usual kind (no separate
Bulbapedia page for the "LEGEND" suffix) — fixed by stripping a trailing
`LEGEND` in both `speciesName()` copies, which is what let 112/114 clear
the sweep once their own `flavorText` was confirmed correct.

`data/sets/UL.json` (HS—Unleashed, Limitless code `UL`, 96 cards) is also
done. Its flavor text also came from pokemon-tcg-data directly. Its
coverage check first flagged 7 cards missing `flavorText`: Metagross
turned out to be the same "has a dex box but no room left for flavor
text" case as DPP's Porygon-Z/Gliscor and WP's Sabrina's Abra (confirmed
against the card image) — expected to stay flagged as blank, not a bug.
The other 6 were this set's own LEGEND cards (Entei & Raikou, Raikou &
Suicune, Suicune & Entei — three dual-species pairs, 90–95), which are a
different LEGEND layout than HS's single-species pairs: neither half
prints a Pokédex box or flavor text at all here (confirmed against all
six card images), yet pokemon-tcg-data/PokeAPI had still attached a
`pokedex` box to all 6, keyed off of just one of the two species'
national dex numbers. Fixed with a `data/no-pokedex/UL.json` overlay
(`["90", "91", "92", "93", "94", "95"]`) — no hand-`flavorText`-deletion
needed this time, since pokemon-tcg-data never had `flavorText` for these
6 to begin with. The verification sweep on the remaining 70 flagged 2
more cards: Ursaring ("unfailing finds" — a typo — for the card's
"unfailingly finds"), a real upstream error confirmed against the card
image and fixed via the `data/flavor-text/UL.json` overlay; and Lucario,
confirmed correct as printed — it's Bulbapedia's own HeartGold/SoulSilver
entry that has a period where the card has a comma, the same kind of
Bulbapedia-side transcription variance as several prior sets' exceptions.

`data/sets/UD.json` (HS—Undaunted, Limitless code `UD`, 91 cards) is also
done — its own two dual-species LEGEND pairs (Kyogre & Groudon,
Rayquaza & Deoxys; 87–90) hit the exact same bogus-Pokédex-box bug as
UL's three pairs, fixed the same way via a `data/no-pokedex/UD.json`
overlay (`["87", "88", "89", "90"]`). Its flavor text also came from
pokemon-tcg-data directly. Its verification sweep flagged one card,
Oddish, missing a comma before "it stays" — a real upstream error,
confirmed against the card image and fixed via the `data/flavor-text/
UD.json` overlay.

`data/sets/TM.json` (HS—Triumphant, Limitless code `TM`, 103 cards) is
also done — its own two dual-species LEGEND pairs (Darkrai & Cresselia,
Palkia & Dialga; 99–102) hit the same bogus-Pokédex-box bug as UL's and
UD's, fixed the same way via a `data/no-pokedex/TM.json` overlay
(`["99", "100", "101", "102"]`). Its flavor text also came from
pokemon-tcg-data directly, and its verification sweep came back clean on
the first pass.

`data/sets/CL.json` (Call of Legends, Limitless code `CL`, 106 cards) is
also done — no LEGEND cards in this one, and its flavor text also came
from pokemon-tcg-data directly. Its verification sweep flagged one card,
Ursaring, the exact same "unfailing"/"unfailingly" typo already fixed on
UL's own Ursaring — a reprint carrying the same uncorrected upstream text
independently (`flavorText` isn't deduped across pokemon-tcg-data's
per-set files, same as HIFSV/FLI/SLG/BUS's Malamar/Zorua/Noibat back in
the Sun & Moon backfill); confirmed against the card image and fixed via
the `data/flavor-text/CL.json` overlay.

The HGSS era (`hgss1`–`hgss4` plus `col1`) is now **done** — 5 files
across all 5 `sets/en.json` entries the era backfill covers, closing the
gap between the already-done Black & White era and everything older
(Platinum, Diamond & Pearl, and back), plus eight more McDonald's
collections still outstanding.

## Platinum era

`data/sets/PL.json` (Platinum base set, Limitless code `PL`, 133 cards) is
done. Its flavor text came from pokemon-tcg-data directly. This set surfaced
a genuine `fetch-set.mjs` gap: 11 cards are Team Galactic's "G" Pokémon
(Dialga G, Palkia G, and 9 others), which print a "Team Galactic's Pokémon"
banner in place of the Pokédex info box entirely (confirmed against the card
images) — pulled in regardless because only their `SP` subtype distinguishes
them, which wasn't in the dex-box exclusion list. Fixed by adding `SP` to
that list alongside `ex`/`MEGA`/`V`/etc. A further 24 cards (Ampharos,
Blastoise, and 22 others, including all 3 of this set's Shining-rarity
cards, `SH4`–`SH6`) have a normal dex box but no flavor text at all —
confirmed against the card images as the same "3 rule-text blocks leave no
room for flavor text" case as DPP's Porygon-Z/Gliscor, WP's Sabrina's Abra,
and UL's Metagross; expected to stay flagged blank, not a bug. The
verification sweep on the remaining 74 flagged 5 cards, all real upstream
`flavorText` errors — Infernape ("fires" for the card's singular "fire"),
Monferno ("control" for "controls"), Vigoroth (word order: "cannot sit
still even for a moment" for the card's "cannot sit still for even a
moment"), Cacnea (missing "for" before "30 days"), and Poochyena (missing
"a" before "persistent nature", and "chosen" before "prey") — each
confirmed against the card image and fixed via the `data/flavor-text/
PL.json` overlay.

`data/sets/RR.json` (Rising Rivals, Limitless code `RR`, 120 cards) is
also done — its flavor text also came from pokemon-tcg-data directly. 25
cards (Arcanine, Flygon, both Gastrodon sea forms, all 5 Rotom appliance
forms, and 19 others) repeated PL's "3 rule-text blocks leave no room for
flavor text" pattern, confirmed against the card images and expected to
stay flagged blank. Its verification sweep on the rest flagged 4 more
cards: Carvanha ("any foes that invades" — grammatically broken — for the
card's "any foe that invades"), a real upstream error confirmed against
the card image and fixed via the `data/flavor-text/RR.json` overlay; both
Shellos sea-form prints (East Sea, West Sea), a `speciesName()` lookup gap
of the usual kind — no separate Bulbapedia page for the "East Sea"/"West
Sea" suffix, fixed by stripping it in both `speciesName()` copies (the
Gastrodon sea forms hit the same category but were already excluded by
the "no room" case above, so the fix only visibly cleared Shellos here);
and Flying Pikachu/Surfing Pikachu, confirmed correct as printed — the
same card-specific, no-Pokédex-source text as EVO's own Flying Pikachu/
Surfing Pikachu precedent.

`data/sets/SV.json` (Supreme Victors, Limitless code `SV`, 153 cards) is
also done — its flavor text also came from pokemon-tcg-data directly. 8
cards (Garchomp, Magmortar, Swampert, Venusaur, Yanmega, Dewgong, Exploud,
Mawile) repeated the "3 rule-text blocks leave no room for flavor text"
pattern, confirmed against the card images and expected to stay flagged
blank. Its verification sweep on the rest flagged 4 more: Yanma ("hover
is one spot" — a typo — for the card's "hover in one spot"), a real
upstream error confirmed against the card image and fixed via the
`data/flavor-text/SV.json` overlay; and this set's Articuno, Moltres, and
Zapdos holo prints, each confirmed correct as printed against their card
images — unique paraphrased text for these specific prints that doesn't
verbatim-match any single Bulbapedia game entry, the same
no-structured-source category as EVO's Flying/Surfing Pikachu and RR's
own reprints of them, just phrased freshly rather than reused.

`data/sets/AR.json` (Arceus, Limitless code `AR`, 111 cards) is also
done — this closes out the entire Platinum era. Its flavor text also came
from pokemon-tcg-data directly. 7 cards (Charizard, Probopass, Salamence,
Golem, Rapidash, Sceptile, Spiritomb) repeated the "no room for flavor
text" pattern, confirmed against the card images and expected to stay
flagged blank. Its verification sweep on the rest flagged 10 more:
Toxicroak ("more potency" for the card's "greater potency") and both
Gulpin prints (40, 66; extra "of" before "its body") were real upstream
errors, confirmed against the card images and fixed via the
`data/flavor-text/AR.json` overlay; all three Wormadam and all three
Burmy cloak-form prints (Plant/Sandy/Trash; 49–51, 56–58) were a
`speciesName()` lookup gap of the usual kind — no separate Bulbapedia
page per cloak form, fixed by stripping the `Plant|Sandy|Trash Cloak`
suffix in both `speciesName()` copies; and Froslass repeated PLB's own
precedent exactly — the card really does print "-58 degrees F" (plural),
and it's Bulbapedia's own Platinum entry with the "degree" (singular)
typo, not the card.

The Platinum era (`pl1`–`pl4`) is now **done** — 4 files across all 4
`sets/en.json` entries the era backfill covers. The remaining gap is
everything older than Platinum (Diamond & Pearl, and back) and eight more
McDonald's collections.

## Diamond & Pearl era

`data/sets/DP.json` (Diamond & Pearl base set, Limitless code `DP`, 130
cards) is done, the first of the era. Its flavor text came from
pokemon-tcg-data directly. Its verification sweep flagged 8 cards: Floatzel
("floatation sac" for the card's "flotation sac"), Gengar ("cools that
area" for the card's "cools the area"), Glameow ("if very popular" for the
card's "is very popular"), and Goldeen (missing "fin" after "tail") were
real upstream `flavorText` errors, confirmed against the card images and
fixed via the `data/flavor-text/DP.json` overlay. Unown's four letter-form
prints (`[A]`–`[D]`) were a `speciesName()` lookup gap of the usual kind —
no separate Bulbapedia page per letter form, fixed by stripping the
trailing `[X]` bracket suffix in both `speciesName()` copies.

`data/sets/MT.json` (Mysterious Treasures, Limitless code `MT`, 124 cards)
is done, 2 of 7. Its flavor text came from pokemon-tcg-data directly, with
one wrinkle: three cards — Bidoof (73), Buizel (75), Shinx (98) — each
print a Berry-effect ability (Wacan/Chesto/Rawst Berry) in the space
normally held by the Pokédex info box, and print no dex box or flavor text
at all; pokemon-tcg-data's own `pokedex` fields for all three were
spurious (genus/height/weight attached despite nothing being printed),
caught by checking the card images directly rather than trusting the
per-card subtype exclusion list. Added to `data/no-pokedex/MT.json`. The
verification sweep flagged 8 cards, all real upstream `flavorText`
transcription errors confirmed against the card images and fixed via the
`data/flavor-text/MT.json` overlay: Celebi ("is is said" for "it is
said"), Whiscash ("setting of tremors" for "setting off tremors"), Gabite
("its scale will heal" for "its scales will heal"), Happiny ("carries and
egg-shaped rock" for "carries an egg-shaped rock"), Quilava ("fire burn
more strongly" for "fire burns more strongly"), Vigoroth ("cannot sit
still even for a moment" for "cannot sit still for even a moment",
transposed), Teddiursa ("Every sets of paws" for "Every set of paws"), and
Totodile ("Trainer need to be careful" for "Trainer needs to be careful").

`data/sets/SW.json` (Secret Wonders, Limitless code `SW`, 132 cards) is
done, 3 of 7. Same wrinkle as MT: three cards — Clefairy (83), Duskull
(86), Murkrow (95) — print an evolution-item ability (Moon Stone/Reaper
Cloth/Dusk Stone) in place of the Pokédex box, with pokemon-tcg-data again
attaching a spurious `pokedex` field to all three; added to
`data/no-pokedex/SW.json`. The verification sweep flagged 11 cards, all
real upstream `flavorText` transcription errors confirmed against the
card images and fixed via the `data/flavor-text/SW.json` overlay:
Lickilicky ("to close" for "too close"), Salamence ("structure changes"
for "structure changed"), Absol ("disasters coming" for "coming
disasters", transposed), Dugtrio ("heads moves" for "heads move"), Jynx
("It cries" for "Its cries"), Muk ("toxic fluids seeps" for "toxic fluid
seeps"), Carvanha ("They can swarm" for "They swarm"), Psyduck ("its
starts exhibiting" for "it starts exhibiting"), Ralts ("thorns on its
head" for "horns on its head"), Shellder ("swims backwards" for "swims
backward"), and Venonat ("At nights" for "At night").

`data/sets/GE.json` (Great Encounters, Limitless code `GE`, 106 cards) is
done, 4 of 7 — no `no-pokedex` cases this time, full flavor-text coverage
from pokemon-tcg-data. The verification sweep flagged 3 cards, all real
upstream `flavorText` errors confirmed against the card images and fixed
via the `data/flavor-text/GE.json` overlay: Hypno ("even if someone just
woke up" for "even in someone who just woke up"), Floatzel ("floatation
sac" for "flotation sac" — the same typo DP's own Floatzel print already
caught, see above), and Cacnea (missing "for" — "survive 30 days" for
"survive for 30 days").

`data/sets/MD.json` (Majestic Dawn, Limitless code `MD`, 100 cards) is
done, 5 of 7. Five cards print an ability box in place of the Pokédex box
— Dialga (4, Adamant Orb), Palkia (11, Lustrous Orb), Chimchar (57, Cheri
Berry), Piplup (72, Pecha Berry), Turtwig (78, Persim Berry) — with
pokemon-tcg-data again attaching a spurious `pokedex` field to all five;
added to `data/no-pokedex/MD.json`. The verification sweep flagged 2
cards, both real upstream `flavorText` errors confirmed against the card
images and fixed via the `data/flavor-text/MD.json` overlay: Jolteon
("furs" for "fur") and Vaporeon (missing "an" — "suitable for aquatic
life" for "suitable for an aquatic life").

`data/sets/LA.json` (Legends Awakened, Limitless code `LA`, 146 cards) is
done, 6 of 7 — full flavor-text coverage from pokemon-tcg-data, no
`no-pokedex` cases. The verification sweep flagged 17 cards. Six were a
genuine `speciesName()` lookup gap: Deoxys's four Formes ("Normal Forme",
"Attack Forme", "Defense Forme", "Speed Forme") and Castform's DP-era
weather-form naming ("Rain Form", "Snow-Cloud Form" — different from the
"Sunny/Rainy/Snowy Form" wording `speciesName()` already handled) weren't
being stripped before the Bulbapedia lookup, so those pages returned no
candidates at all even though the printed text was already correct; fixed
by adding both patterns to `speciesName()` in both
`scripts/lib/bulbapedia.mjs` and `scripts/flavor-text-editor/client.js`
(per CLAUDE.md, always edit both copies). Ten were real upstream
`flavorText` transcription errors, confirmed against the card images and
fixed via the `data/flavor-text/LA.json` overlay: Probopass ("call" for
"called"), Poliwrath (missing "its" — "With extremely tough muscles" for
"With its extremely tough muscles"), Swellow ("dive" for "dives"), and all
seven Unown letter-form prints ([!], [J], [R], [U], [V], [W], [Y]) sharing
the same extra-"an" typo ("Shaped like an ancient writing" for "Shaped
like ancient writing"). The remaining flagged
card, Staryu (122), was confirmed correct as printed against the card
image — its flavor text simply isn't among any of the mainline-game
entries Bulbapedia's species page lists, a Bulbapedia-side gap rather than
a card error, left as is.

`data/sets/SF.json` (Stormfront, Limitless code `SF`, 106 cards) is done,
closing out the Diamond & Pearl era (7 of 7). Different wrinkle from the
rest of the era: no `no-pokedex` cases, but 38 of the set's ability-heavy
Rare Holos (Dusknoir, Empoleon, Infernape, and 35 others, plus the three
Shining Pokémon SH1–SH3) print a Pokédex info box (genus/height/weight)
but no flavor text at all — the card's Poké-Power/Poké-Body plus 2–3
attacks fill the entire lower half, leaving no room for a flavor-text
line. Confirmed against several sample card images rather than assumed
from the pattern alone; pokemon-tcg-data's own `flavorText` field is
correctly absent for all 38, so no overlay or `no-pokedex` entry was
needed — an absent `flavorText` on a card that does have a `pokedex` box
is a legitimate state, not a gap to fill. The verification sweep flagged
one real error among the 49 cards that do print flavor text: Pupitar
(missing "as" — "Its body is hard as bedrock" for "Its body is as hard as
bedrock"), confirmed against the card image and fixed via the
`data/flavor-text/SF.json` overlay.

The Diamond & Pearl era (`dp1`–`dp7`) is now **done** — 7 files across all
7 `sets/en.json` entries the era backfill covers. The remaining gap is
everything older than Diamond & Pearl (the WotC/e-Card era, and back) and
seven more McDonald's collections (CLAUDE.md's "eight more" note turned
out stale — pokemon-tcg-data only has ten `mcd*` entries total, three of
which, `MCD17`–`MCD19`, were already done).

## McDonald's Collections, remaining seven

`data/sets/MCD11.json`, `MCD12.json`, `MCD14.json`, `MCD15.json`,
`MCD16.json`, `MCD21.json`, and `MCD22.json` (12, 12, 12, 12, 12, 25, and
15 cards) are all done, closing out every McDonald's Collection
pokemon-tcg-data carries (`MCD11`–`MCD19`, `MCD21`, `MCD22` — no 2013 or
2020 collection exists). Same pipeline as `MCD17`–`MCD19`: Limitless
doesn't catalogue any of them (confirmed via a 404 and a scan of
Limitless's own set list, not assumed), so all seven used `"NONE"` as the
`<limitlessUrlCode>` argument, with `artist` read from pokemon-tcg-data
and `limitless`/`printGroup` left as the standard no-Limitless
placeholders. Every one of the seven also hit `fetch-set.mjs`'s
`rarity`-is-required guard on its first card — confirmed against
Bulbapedia's own rarity column for each set (all show "—" across every
card, promotional cards printing no rarity symbol at all) before adding a
lone `"*"` to each set's `data/no-rarity/<CODE>.json`, rather than
assuming from the first failure that the whole set matched. All seven had
full flavor-text coverage from pokemon-tcg-data directly. The verification
sweep flagged 6 cards total across four sets, all real upstream
`flavorText` transcription errors confirmed against the card images and
fixed via each set's `data/flavor-text/<CODE>.json` overlay: MCD12's
Dwebble ("The Pokémon" for "This Pokémon") and Emolga ("membranes" for
"membrane"), MCD16's Scraggy ("pulling it skin" for "pulling its skin"),
and MCD22's Tynamo (missing "a" — "only trickle" for "only a trickle").
MCD11, MCD14, MCD15, and MCD21 needed no fixes at all.

## McDonald's Collection 2023/2024 — hand-built, no primary source at all

While confirming the seven sets above were complete against Bulbapedia,
two more turned up that neither pokemon-tcg-data nor Limitless carries at
all: **McDonald's Collection 2023** ("Match Battle 2023" internally, 15
cards, Bulbapedia page `McDonald's_Collection_2023_(TCG)`) and
**McDonald's Collection 2024** ("Dragon Discovery", 15 cards,
`McDonald's_Collection_2024_(TCG)`). No 2025 collection exists yet — the
2024 one's release window just runs into mid-2025 depending on region.
`fetch-set.mjs`'s existing `"NONE"` `<ptcgDataSetId>` mode couldn't apply
as-is: that mode gets its card list from Limitless's own set page, and
Limitless has no page for either set (same 404-plus-set-list-scan check as
every other McDonald's set). Rather than extend the script for a
one-off, both sets were built by hand directly as JSON, bypassing
`fetch-set.mjs` entirely.

The key discovery that made this tractable: **every card in both sets is
a reprint that shares its game text, artist, and regulation mark with an
existing print already verified in this database** — confirmed by
following each card's Bulbapedia page, which is a plain `#REDIRECT` to the
original print's own page (e.g. `Sprigatito (Match Battle 2023 1)` →
`Sprigatito (Scarlet & Violet 13)`), one card at a time for all 30 cards.
Cross-checked against `pkmncards.com`'s own per-card listings (indexed
under set codes `M23`/`M24`) for `regulationMark`, HP, and illustrator on
every MCD23 card and a sample of MCD24's, all of which matched the
redirect-target print already in `data/sets/`. MCD23's 15 cards all
redirect into `SVI`/`PAL`; MCD24's 15 span `VIV`, `MEW`, `SVI`, `FST`,
`CPA`, `SIT`, `PAL`, `TEF`, and `SP` (`SP` being this database's code for
`swshp`, the SWSH Black Star Promos set — not obvious from the code
alone, worth remembering if this pattern recurs). Every reprint's source
print was confirmed present in `data/sets/` by localId and name before
being reused.

`data/sets/MCD23.json` and `MCD24.json` copy each source card's
`supertype`/`subtypes`/`evolvesFrom`/`evolvesTo`/`types`/`hp`/`attacks`/
`weaknesses`/`resistances`/`retreatCost`/`regulationMark`/`artist`/
`pokedex`/`flavorText` verbatim, only overriding what's genuinely specific
to the McDonald's print: `number`/`localId` (this set's own sequential
numbering), `rarity` ("None", confirmed via Bulbapedia's dash-rarity
column same as every other McDonald's set), `secret: false`, and
`limitless: null` (no Limitless page, same as every other McDonald's set).
Neither set has an `images` field — no official CDN (`images.pokemontcg.io`
or Limitless's own) hosts scans of either print, and pkmncards.com's own
image URLs aren't an official source this database otherwise depends on,
so the field is omitted rather than pointed at a fan-site host.
`set.images` is `null` for the same reason (no symbol/logo asset exists to
link). `releaseDate` uses each set's earliest confirmed regional release
(2023-07-27 Germany/Austria for MCD23, 2024-12-04 France for MCD24) per
existing precedent (MCD21's stored date is also its earliest region).
`npm run typecheck` passes on both hand-built files. `refresh-print-groups.mjs`
is a no-op for both, same as every other McDonald's set — `limitless: null`
cards are always skipped by that script's union-find, by design.

This closes out every McDonald's Collection that exists in English through
2024 — 12 files total (`MCD11`, `MCD12`, `MCD14`–`MCD19`, `MCD21`–`MCD24`).
Worth re-checking Bulbapedia periodically for a McDonald's Collection 2025
once that promotion actually starts.

## Base Set (`base1` → `BS`) — opening the WotC/e-Card era backfill

`node scripts/missing-sets.mjs` (no argument, whole-database sweep) confirmed
`base1` (1999-01-09, 102 cards) as the oldest set missing from `data/sets/`,
same conclusion CLAUDE.md's cached "Remaining gap" note already pointed at —
but re-derived properly rather than trusted at face value, per house habit.
Limitless code `BS` confirmed against `limitlesstcg.com/cards/BS` before
starting (title reads "Base Set (BS) – Limitless", 102 cards, matches).

`fetch-set.mjs base1 BS` failed on card 97, Fighting Energy: no rarity from
any source. Checked Bulbapedia's Base Set set-list table rather than
guessing — all six basic energy cards (97 Fighting through 102 Water) show
"—" in the rarity column, not a symbol. Added `data/no-rarity/BS.json` with
all six localIds and re-ran clean.

**Pokédex info box is genuine here, not a `no-pokedex` case.** CLAUDE.md's
"cards that print no dex info box" note covers the *e-Card era through just
before Diamond & Pearl* (2002/09–2007/05) — Base Set (1999) predates even
that gap. Confirmed against the Charizard (4/102) and Chansey (3/102) card
images: both print a genus/height/weight line just above the rules text
("Flame Pokémon. Length: 5'7", Weight: 200 lbs."), matching what
`fetch-set.mjs` attached from PokeAPI/pokemon-tcg-data. No override needed.

**Flavor text: already covered by pokemon-tcg-data (69/69), but Base Set is
a new addition to the "breaks verbatim reuse" list** in CLAUDE.md's flavor
text section. `check-flavor-text.mjs BS` flagged 43/69 as not matching any
Bulbapedia mainline-game candidate. Spot-checked four spread across the
flagged list against actual card images (Chansey 3/102, Zapdos 16/102, plus
reading the diffs for Alakazam and Blastoise) — every one matched the stored
text exactly, word for word, including "manage to catch it" (card) vs.
Bulbapedia's own Red/Blue transcription "manage to get it", and "wielding"
(card) vs. Bulbapedia's "dropping". This is the WotC-era English card
localization diverging from Bulbapedia's own separately-transcribed Red/Blue
Pokédex text — not a card error, not a Bulbapedia transcription slip, just a
distinct translation that predates the "byte-identical reuse" convention
later sets follow. Nothing needed fixing; the pokemon-tcg-data-sourced text
was correct as fetched.

`npm run typecheck` clean. `refresh-print-groups.mjs` touched 26 cards in
`BS.json` itself (first-time population) and no other set files — expected,
since no later set has reprinted a Base Set card yet as far as this
database's own stored `printGroup` data reaches.

## Jungle (`base2` → `JU`)

Second stop in the WotC backfill. Limitless code `JU` confirmed against
`limitlesstcg.com/cards/JU` ("Jungle (JU) – Limitless", 1999-06-16, 64
cards) before starting. `fetch-set.mjs base2 JU` ran clean on the first try
— no rarity gaps this time (Jungle's basic energy reprints weren't part of
this set; it introduces no new basic energy cards). Pokédex box confirmed
genuine (not a `no-pokedex` case) against Clefable 1/64's card image, same
as Base Set.

Flavor text: 63/63 already covered by pokemon-tcg-data.
`check-flavor-text.mjs` flagged 24/63 against Bulbapedia. Spot-checked
Electrode 2/64 (diff only) and Pinsir 9/64 (full card-image read) — both
matched the stored text exactly, confirming the same WotC-era-diverges-from-
Bulbapedia's-own-Red/Blue-transcription pattern documented in Base Set's
entry above, not a new failure mode. No fixes made.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated only
`JU.json` (47 cards) — no existing set file needed a rewrite, so Jungle
doesn't yet reprint anything already in `data/sets/`.

## Fossil (`base3` → `FO`)

Third stop in the WotC backfill. Limitless code `FO` confirmed against
`limitlesstcg.com/cards/FO` ("10th October 1999", 62 cards) before starting.
`fetch-set.mjs base3 FO` ran clean — no rarity gaps, no unusual subtypes.
Pokédex box confirmed genuine against Aerodactyl 1/62's card image, same as
Base Set and Jungle.

Flavor text: 57/57 already covered by pokemon-tcg-data.
`check-flavor-text.mjs` flagged 14/57 against Bulbapedia; the top hit
(Aerodactyl 1/62, missing comma: "ferocious prehistoric" vs. Bulbapedia's
"ferocious, prehistoric") was already confirmed against the card image
during the pokedex-box check and matches the stored text exactly — same
WotC-era-diverges-from-Bulbapedia's-Red/Blue-transcription pattern as the
two prior sets, not re-verified card by card given the pattern is now
established across three sets.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated only
`FO.json` (5 cards).

## Base Set 2 (`base4` → `BS2`)

Fourth stop in the WotC backfill — an all-reprint set (every card here is a
reprint of a Base Set/Jungle/Fossil card, none new). Limitless code `BS2`
confirmed against `limitlesstcg.com/cards/BS2` ("24th February 2000", 130
cards) — `B2` 404s, worth remembering as another non-obvious Limitless code
alongside the ones already documented in CLAUDE.md.

Hit the same basic-energy-has-no-rarity gap as Base Set: cards 125-130
(Fighting through Water Energy). Confirmed against Bulbapedia's Base Set 2
set-list table (all six show "—") before adding `data/no-rarity/BS2.json`.
Re-ran clean.

Flavor text: 100/100 already covered by pokemon-tcg-data. Pokédex box
confirmed genuine against Charizard 4/130 — identical text to Base Set's
own Charizard (4/102), as expected for a straight reprint.
`check-flavor-text.mjs` flagged 51/100, same established WotC-vs-Bulbapedia
pattern — not re-verified per card since these are reprints of cards
already confirmed correct in `BS.json`/`JU.json`/`FO.json`.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `BS2.json`
(60 cards) — the older `BS`/`JU`/`FO` files weren't rewritten on this run;
their own stored `printGroup` arrays go stale until something re-touches
them, which is expected and harmless per the "goes stale, and that's fine"
section in CLAUDE.md (the union-find derivation doesn't depend on any one
file being current).

## Team Rocket (`base5` → `TR`)

Fifth stop in the WotC backfill. Limitless code `TR` confirmed against
`limitlesstcg.com/cards/TR` ("24th April 2000", 83 cards) before starting.
`fetch-set.mjs base5 TR` ran clean — no rarity gaps. Pokédex box confirmed
genuine against Dark Alakazam 1/83: genus/height/weight still describe the
base species (Psi Pokémon, 4'11", matches Alakazam), correctly unaffected
by the "Dark" prefix.

Flavor text: 68/68 already covered by pokemon-tcg-data, but
`check-flavor-text.mjs` flagged **all 68/68**, and unlike every prior WotC
set, none of the flagged cards showed any Bulbapedia candidate text at all
— `speciesName()` doesn't strip Team Rocket's "Dark" prefix (nor should it:
"Dark Alakazam" isn't a species with its own Bulbapedia page, it's TR's own
in-universe corrupted-Pokémon concept), so no comparison could ever have
been possible here. Confirmed this is the expected outcome, not a bug, by
reading two card images directly (Dark Alakazam 1/83, Dark Charizard
4/83) — both match the stored pokemon-tcg-data text verbatim, including
Team-Rocket-specific lore phrasing ("Almost as if it were being controlled
by something else…", "Seemingly possessed, it spews fire like a
volcano…") that has no mainline-game Pokédex equivalent to match against.
Added Team Rocket to CLAUDE.md's list of sets that break the "verbatim
Pokédex reuse" premise entirely, alongside Double Crisis/Detective
Pikachu/etc. — this set's whole roster of "Dark" Pokémon is custom lore
text by construction, so a 100% unmatched sweep here is the expected
permanent state, not something to keep re-checking.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated only
`TR.json` (25 cards).

## Gym Heroes (`gym1` → `G1`)

Sixth stop in the WotC backfill, first of the two Gym sets. Limitless code
`G1` confirmed against `limitlesstcg.com/cards/G1` ("14th August 2000", 132
cards) — `GH` 404s. No collision with this database's own `GEN`/`GENRC`
codes for Generations (that set's *pokemon-tcg-data* id happens to also be
`g1`, but this database's own code for it has always been `GEN`, so `G1`
was free to use here as Gym Heroes' own code).

Hit the same basic-energy-has-no-rarity gap as every `base*` set so far
(cards 127-132, Fighting through Water Energy) — confirmed against
Bulbapedia's Gym Heroes set-list table (all six show "—"), added
`data/no-rarity/G1.json`, re-ran clean.

**New discovery: Gym Heroes prints no flavor text at all, on any card.**
`flavor-text-coverage.mjs` showed 0/91. Downloaded images and read three
card templates directly (Blaine's Moltres 1/132, Misty's Tentacruel
10/132, Lt. Surge's Magnemite 50/132) — all three have the Pokédex
genus/height/weight line but no italic descriptive sentence beneath it,
just `LV. ## #dexnum`. This isn't a transcription gap to fill; the
physical card template for this set has no flavor text slot. Documented
in CLAUDE.md's flavor text section so this isn't mistaken for missing work
on a future pass. Pokédex box itself confirmed genuine (matches Alakazam/
Charizard-style boxes from earlier WotC sets).

`npm run typecheck` clean. `refresh-print-groups.mjs` updated only
`G1.json` (9 cards).

## Gym Challenge (`gym2` → `G2`)

Seventh stop, second of the two Gym sets. Limitless code `G2` confirmed
against `limitlesstcg.com/cards/G2` ("16th October 2000", 132 cards) before
starting. Same basic-energy-has-no-rarity gap as every set since `base1`
(cards 127-132) — confirmed against Bulbapedia's Gym Challenge set-list
table, added `data/no-rarity/G2.json`, re-ran clean.

Flavor text: 0/95, as expected — confirmed against Blaine's Arcanine 1/132's
card image, same template as Gym Heroes with no flavor text slot at all.
Not a gap; matches the exception already documented for `G1`.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated only
`G2.json` (12 cards).

This closes out both Gym sets (`G1`, `G2`).

## Neo Genesis (`neo1` → `N1`)

Eighth stop, opening the Neo series. Limitless code `N1` confirmed against
`limitlesstcg.com/cards/N1` ("16th December 2000", 111 cards) before
starting. Same basic-energy-has-no-rarity gap as every set since `base1`
(cards 106-111) — confirmed against Bulbapedia's Neo Genesis set-list
table, added `data/no-rarity/N1.json`, re-ran clean.

Flavor text is back for this set (unlike the two Gym sets) — 81/81 already
covered by pokemon-tcg-data. Pokédex box confirmed genuine against Ampharos
1/111. `check-flavor-text.mjs` flagged 10/81 against Bulbapedia; read the
full diff for all ten (Lugia, Ledian, Phanpy, Chikorita, Hoothoot, Ledyba,
Oddish, Snubbull, Sunkern, Wooper) rather than sampling — all are the same
established WotC-vs-Bulbapedia minor wording/punctuation drift pattern from
every prior set in this backfill, nothing that reads as a genuine card
error. No fixes made.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated only
`N1.json` (14 cards).

## Neo Discovery (`neo2` → `N2`)

Ninth stop. Limitless code `N2` confirmed against
`limitlesstcg.com/cards/N2` ("1st June 2001", 75 cards) before starting.
`fetch-set.mjs neo2 N2` ran clean — first set since `base1` with no
rarity gap (Neo Discovery introduces no new basic energy cards of its
own). Flavor text: 71/71 already covered by pokemon-tcg-data. Pokédex box
confirmed genuine against Espeon 1/75. `check-flavor-text.mjs` flagged
10/71, same established WotC-vs-Bulbapedia drift pattern, spot-checked via
the diff output only (Hitmontop's missing hyphen in "dance-like"), no
fixes needed.

`npm run typecheck` clean. `refresh-print-groups.mjs` was a no-op —
`N2.json`'s own per-card printGroup data (scraped fresh from Limitless
during the fetch) was already the up-to-date union.

## Southern Islands (`si1` → `SI`)

Tenth stop, and out of strict numeric order deliberately — `si1` released
2001/07/31, before Neo Revelation (2001/09/21), so it's next per
`missing-sets.mjs`'s date ordering even though it sits outside the Neo
series proper. Limitless code `SI` confirmed against
`limitlesstcg.com/cards/SI` before starting.

pokemon-tcg-data only carries 18 of this set's 32 physical cards (Bulbapedia's
full set list has 32; `si1` in pokemon-tcg-data stops at 18) — not a bug, just
the source's own coverage limit for this small collector-only Japanese-import
set. `fetch-set.mjs si1 SI` failed on Raticate's missing rarity; confirmed via
a general-purpose agent against Bulbapedia's Southern Islands page, whose
Trivia section states outright: "None of the cards have rarity symbols, as
they are part of a fixed set." Added `data/no-rarity/SI.json` as `["*"]`,
re-ran clean.

Flavor text: 18/18 already covered by pokemon-tcg-data. `check-flavor-text.mjs`
flagged all 18/18 against Bulbapedia — unusually total, so read every card
image directly rather than sampling. Mew (1/18) and Raticate (6/18) both
confirmed the saved text verbatim against the printed card. This set's flavor
text consistently doesn't exact-match any single Bulbapedia mainline-game
candidate, but does read as a close paraphrase of an existing entry each
time (Raticate's saved text near-matches Yellow's entry, for instance) —
same minor WotC-era-translation-drift pattern as every other set in this
backfill, just hitting 100% of the set instead of a handful of cards. No
fixes made; this is expected, not a gap.

`npm run typecheck` clean. `refresh-print-groups.mjs` was a no-op.

## Neo Revelation (`neo3` → `N3`)

Eleventh stop, back to the Neo series proper. Limitless code `N3` confirmed
against `limitlesstcg.com/cards/N3` (66 cards) before starting.
`fetch-set.mjs neo3 N3` ran clean — no rarity or Pokédex gaps.

Flavor text: 61/61 already covered by pokemon-tcg-data. `check-flavor-text.mjs`
initially flagged 6/61, two of them (both Ho-oh prints, 7 and 18) with *no*
Bulbapedia candidates listed at all rather than a normal near-miss list —
traced to a real tooling bug in `speciesName()`: Bulbapedia's page title is
`Ho-Oh_(Pokémon)` (capital second O), but the card's own printed name and
`speciesName()`'s output are both `Ho-oh`, a 404. Fixed by adding a
`Ho-oh`→`Ho-Oh` rewrite to `speciesName()` in both
`scripts/lib/bulbapedia.mjs` and its `scripts/flavor-text-editor/client.js`
duplicate (per CLAUDE.md, always edit both). Re-ran clean at 5/61 remaining
(one of the two Ho-oh entries now resolves to an exact Silver match) — the
other four (Magneton, Octillery, Goldeen, Snubbull) are the same established
minor-punctuation/hyphenation WotC-vs-Bulbapedia drift pattern as every other
set in this backfill (e.g. Magneton's saved "Three Magnemites" vs Bulbapedia's
"Three Magnemite"), confirmed via the diff text alone, no card-image checks
needed. No further fixes made.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `N3.json`
(3 cards).

## Neo Destiny (`neo4` → `N4`)

Twelfth stop, closing out the Neo series. Limitless code `N4` confirmed
against `limitlesstcg.com/cards/N4` (113 cards) before starting.
`fetch-set.mjs neo4 N4` ran clean — no rarity or Pokédex gaps.

Flavor text: 98/98 already covered by pokemon-tcg-data. `check-flavor-text.mjs`
flagged all 98/98 against Bulbapedia — read the full diff rather than
sampling given how total it was. Two populations:

- **26 Dark Pokémon** (Dark Ampharos through Dark Tyranitar) returned *no*
  Bulbapedia candidates at all, not just a near-miss list — same category as
  Team Rocket's Dark Pokémon roster (see that set's HISTORY.md entry): custom
  corrupted-Pokémon lore text with no mainline species page to compare
  against, since "Dark Ampharos" etc. isn't a real Bulbapedia page. Confirmed
  against Dark Ampharos 1/105's card image — saved text matches the print
  verbatim.
- **The remaining 72** (plain-named Pokémon, the Light-prefixed Pokémon,
  Unown letters, and the Shining Pokémon) are the same established minor
  punctuation/wording WotC-vs-Bulbapedia drift pattern as every other set in
  this backfill — confirmed via the diff text alone.

No fixes made — this is the expected shape for a set built around the
Dark/Light Pokémon mechanic, not a gap.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `N4.json`
(1 card).

This closes out the Neo series (`N1`–`N4`).

## Legendary Collection (`base6` → `LC`)

Thirteenth stop. Limitless code `LC` confirmed against
`limitlesstcg.com/cards/LC` ("24th May 2002", 110 cards) before starting.
`fetch-set.mjs base6 LC` ran clean — no rarity or Pokédex gaps, despite this
being an all-reprint set drawing cards from Base Set through Neo Destiny.

Flavor text: 99/99 already covered by pokemon-tcg-data. `check-flavor-text.mjs`
flagged 53/99 — read the full diff rather than sampling given the size.
9 of the 53 are Dark Pokémon reprints (Dark Blastoise, Dark Dragonite, Dark
Persian, Dark Raichu, Dark Slowbro, Dark Vaporeon, Dark Dragonair, Dark
Wartortle, plus one more) returning no Bulbapedia candidates at all — same
custom-lore-no-mainline-page category as Team Rocket/Neo Destiny's Dark
Pokémon. The remaining 44 are the same established minor punctuation/wording
WotC-vs-Bulbapedia drift pattern as every other set in this backfill. No
fixes made.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `LC.json`
(42 cards) — expected for an all-reprint set touching cards across nine
earlier sets.

## Expedition Base Set (`ecard1` → `E1`)

Fourteenth stop, opening the e-Card era. Limitless code `E1` confirmed
against `limitlesstcg.com/cards/E1` ("15th September 2002", 165 cards) —
"EX" and "EXP" both 404 first.

Same basic-energy-has-no-rarity gap as every set since `base1` (cards
160-165); confirmed against Bulbapedia's set-list rarity column (shown as
"—"), added `data/no-rarity/E1.json`.

**New per-card Pokédex gap, genuinely per-card rather than whole-set or
subtype-based**: this set's card template only prints the genus/height/
weight info line for **Rare Holo** cards — every non-Holo Pokémon (any
rarity) omits it entirely, showing just a bare "ID: B-89-#"-style code under
a rectangular (non-oval) art frame instead. Caught by comparing Golem 49/165
and Kingler 50/165's card images against pokemon-tcg-data's attached
`pokedex` field (both wrongly had one attached). Confirmed the full range —
localIds 33-136 are exactly the non-Holo-Pokémon block (1-32 Rare Holo, 137+
Trainers with no `pokedex` to begin with) — added
`data/no-pokedex/E1.json` listing that whole 33-136 range.

Flavor text: 0/136, confirmed genuine — same as Gym Heroes/Challenge, this
era's template has no flavor-text slot at all (verified directly against
Alakazam, Ampharos, Arbok, Golem, and Kingler's card images while
investigating the Pokédex gap above).

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `E1.json`
(27 cards).

## Best of Game (`bp` → `BG`)

Fifteenth stop, a small 9-card promo set. Limitless code `BG` confirmed
against `limitlesstcg.com/cards/BG` (9 cards, 2002/12/01). `fetch-set.mjs bp
BG` ran clean.

Flavor text: 2/8 eligible (Electabuzz, Hitmonchan) already covered by
pokemon-tcg-data; the other 6 (Rocket's Scizor/Sneasel/Mewtwo/Hitmonchan,
Dark Ivysaur/Venusaur) had none. Confirmed genuine against Rocket's Scizor
4/9 and Dark Ivysaur 6/9's card images — same custom-roster Pokémon as Team
Rocket/Neo Destiny/Legendary Collection, and this time with no flavor text
at all rather than custom lore text. `check-flavor-text.mjs` flagged all
8/8: the 2 covered cards are the usual minor drift, the 6 blank ones are
expected.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `BG.json`
(5 cards).

## Aquapolis (`ecard2` → `E2`)

Sixteenth stop. Limitless code `E2` confirmed against
`limitlesstcg.com/cards/E2` ("15th January 2003", 182 cards) before
starting. `fetch-set.mjs ecard2 E2` ran clean — no rarity gap this time
(Aquapolis's basic energy cards carry a real rarity value).

Same Rare-Holo-only Pokédex-box rule as Expedition — confirmed again via
image (Slowbro 33/147, non-Holo, no box; Kingdra 148/147, a "Crystal type"
Rare Secret holo, has the box). localIds 33-117 are the non-Holo-Pokémon
block wrongly carrying `pokedex` data (1-32 are Rare Holo, 118-147 are
Trainers/Energy with none to begin with, 148-150 are the holo Rare Secret
Pokémon and correctly keep theirs). Added `data/no-pokedex/E2.json` for
33-117.

Flavor text: 0/152, confirmed genuine from the same two images used for the
Pokédex check above — this era's template still has no flavor-text slot at
all.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `E2.json`
(11 cards).

## Skyridge (`ecard3` → `E3`)

Seventeenth stop, closing out the e-Card era. Limitless code `E3` confirmed
against `limitlesstcg.com/cards/E3` ("12th May 2003", 182 cards) before
starting. `fetch-set.mjs ecard3 E3` ran clean.

Same Rare-Holo-only Pokédex rule as Expedition/Aquapolis, but Skyridge's own
numbering makes it easy to misjudge at a glance: its 32 Rare Holo cards use
a separate `H1`-`H32` localId namespace (not plain numbers), and its 6 "Rare
Secret" Crystal-type cards (`145`-`150`) are holofoil too and correctly kept
their `pokedex`. Confirmed against Abra 46/144 (Common, wrongly had a box)
and Celebi 145/144 (Rare Secret Crystal type, holo, correctly has one).
Added `data/no-pokedex/E3.json` for the numeric non-holo Pokémon range
`1`-`118`, excluding `47` (Buried Fossil, a Trainer despite sitting in that
numeric block).

Flavor text: 0/155, confirmed genuine from the same two images checked
above.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `E3.json`
(8 cards).

This closes out the e-Card era (`E1`-`E3`).

## EX Ruby & Sapphire (`ex1` → `RS`)

Eighteenth stop, opening the EX era. Limitless code `RS` confirmed against
`limitlesstcg.com/cards/RS` (109 cards, 18 June 2003) before starting.
`fetch-set.mjs ex1 RS` ran clean — no rarity gap.

New template, new gap: unlike the e-Card era's Rare-Holo-only rule, the EX
era's card template has **no Pokédex box at all, for any card** — confirmed
against Aggron 1/109 (Rare Holo) and Aron 50/109 (Common Basic), neither of
which prints a genus/height/weight line despite pokemon-tcg-data attaching
`pokedex` data to 79/109 cards. Added `data/no-pokedex/RS.json` as `["*"]`.

Flavor text: 0/79, confirmed genuine from the same two images.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `RS.json`
(28 cards).

## EX Sandstorm (`ex2` → `SS`)

Nineteenth stop. Limitless code `SS` confirmed against
`limitlesstcg.com/cards/SS` (100 cards, 18 September 2003) before starting.
`fetch-set.mjs ex2 SS` ran clean. Same EX-era no-Pokédex-at-all template as
Ruby & Sapphire, confirmed against Armaldo 1/100; added
`data/no-pokedex/SS.json` as `["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `SS.json`
(13 cards).

## EX Dragon (`ex3` → `DR`)

Twentieth stop. Limitless code `DR` confirmed against
`limitlesstcg.com/cards/DR` (100 cards, 24 November 2003) before starting.
`fetch-set.mjs ex3 DR` ran clean. Same EX-era no-Pokédex template,
confirmed against Absol 1/97; added `data/no-pokedex/DR.json` as `["*"]`.
Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `DR.json`
(4 cards).

## EX Team Magma vs Team Aqua (`ex4` → `MA`)

Twenty-first stop. Limitless code `MA` confirmed against
`limitlesstcg.com/cards/MA` (97 cards, 15 March 2004) before starting.
`fetch-set.mjs ex4 MA` ran clean. Same EX-era no-Pokédex template,
confirmed against Team Aqua's Cacturne 1/95; added `data/no-pokedex/MA.json`
as `["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `MA.json`
(7 cards).

## EX Trainer Kit Latias / Latios (`tk1a`/`tk1b` → `TK1A`/`TK1B`)

Twenty-second and twenty-third stops, the two-deck EX Trainer Kit. Neither
half is on Limitless at all — checked `TK1a`, `TK1b`, `EXTK`, `tk`, and the
full EX-era listing, all 404/absent — so both used `NONE` as the
`<limitlessUrlCode>` (per-card `artist` from pokemon-tcg-data, `limitless:
null`). Bulbapedia confirms all 20 cards (both halves) print no rarity
symbol at all, consistent with other trainer/starter-deck exclusives; added
`data/no-rarity/TK1A.json` and `data/no-rarity/TK1B.json` as `["*"]`. Same
EX-era no-Pokédex template as every set since Ruby & Sapphire, confirmed
against Bagon (TK1A 1/10) and Latios (TK1B 2/10); added
`data/no-pokedex/TK1A.json`/`TK1B.json` as `["*"]`. Flavor text 0/0 eligible
for both, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` was a no-op for both —
expected, since every card's `limitless` is `null`.

## EX Hidden Legends (`ex5` → `HL`)

Twenty-fourth stop. Limitless code `HL` confirmed against
`limitlesstcg.com/cards/HL` (102 cards, 14 June 2004) before starting.
`fetch-set.mjs ex5 HL` ran clean. Same EX-era no-Pokédex template,
confirmed against Banette 1/101; added `data/no-pokedex/HL.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `HL.json`
(4 cards).

## EX FireRed & LeafGreen (`ex6` → `RG`)

Twenty-fifth stop. Limitless code `RG` confirmed against
`limitlesstcg.com/cards/RG` (116 cards, 30 August 2004) before starting.
`fetch-set.mjs ex6 RG` ran clean. Same EX-era no-Pokédex template,
confirmed against Beedrill 1/112; added `data/no-pokedex/RG.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `RG.json`
(14 cards).

## POP Series 1 (`pop1` → `P1`)

Twenty-sixth stop, opening the POP promo series. Limitless code `P1`
confirmed against `limitlesstcg.com/cards/P1` (17 cards, 1 September 2004)
before starting. `fetch-set.mjs pop1 P1` ran clean. Same EX-era
no-Pokédex template, confirmed against Blaziken 1/17; added
`data/no-pokedex/P1.json` as `["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` was a no-op.

## EX Team Rocket Returns (`ex7` → `TRR`)

Twenty-seventh stop. Limitless code `TRR` confirmed against
`limitlesstcg.com/cards/TRR` (111 cards, 8 November 2004) before starting.
`fetch-set.mjs ex7 TRR` ran clean. Same EX-era no-Pokédex template,
confirmed against Azumarill 1/109; added `data/no-pokedex/TRR.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `TRR.json`
(4 cards).

## EX Deoxys (`ex8` → `DX`)

Twenty-eighth stop. Limitless code `DX` confirmed against
`limitlesstcg.com/cards/DX` (108 cards, 14 February 2005) before starting.
`fetch-set.mjs ex8 DX` ran clean. Same EX-era no-Pokédex template,
confirmed against Altaria 1/107; added `data/no-pokedex/DX.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `DX.json`
(8 cards).

## EX Emerald (`ex9` → `EM`)

Twenty-ninth stop. Limitless code `EM` confirmed against
`limitlesstcg.com/cards/EM` (107 cards, 9 May 2005) before starting.
`fetch-set.mjs ex9 EM` ran clean. Same EX-era no-Pokédex template,
confirmed against Blaziken 1/106; added `data/no-pokedex/EM.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `EM.json`
(19 cards).

## EX Unseen Forces (`ex10` → `UF`)

Thirtieth stop. Limitless code `UF` confirmed against
`limitlesstcg.com/cards/UF` (145 cards per pokemon-tcg-data, Limitless
itself shows 143, 22 August 2005) before starting.

Found and fixed a real tooling bug: this set's 28 Unown letter cards
include "!" and "?" variants, and Limitless's URL for those needs
percent-encoding (`/cards/UF/%3F`) — `fetchLimitlessExtra` was building the
request URL by simple template-literal interpolation with no encoding, so
the "?" card's request silently became `.../UF/?` (an empty path segment
plus a query string), landing on the base set page and failing with "no
CARD ID comment found". Fixed in `scripts/fetch-set.mjs` by wrapping the
localId in `encodeURIComponent()` at both the initial fetch and the retry
fetch. That surfaced a second bug: the post-redirect canonical-URL read
(`canonicalMatch`) picks the localId back out of the already-encoded
fetched URL, so re-encoding it again for the stored `url` field
double-encoded it into `%253F` — fixed by `decodeURIComponent()`-ing
`canonicalMatch`'s capture before it's used anywhere else. Verified both
Unown `!` and `?` end up with a clean single-encoded `url`
(`.../UF/%3F`) and a human-readable `deckCode` (`"UF ?"`, not
`"UF %3F"`).

Same EX-era no-Pokédex template as every set since Ruby & Sapphire,
confirmed against Ampharos 1/115; added `data/no-pokedex/UF.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `UF.json`
(16 cards).

## POP Series 2 (`pop2` → `P2`)

Thirty-first stop. Limitless code `P2` confirmed against
`limitlesstcg.com/cards/P2` (17 cards, 1 August 2005) before starting.
`fetch-set.mjs pop2 P2` ran clean. Same EX-era no-Pokédex template,
confirmed against Entei 1/17; added `data/no-pokedex/P2.json` as `["*"]`.
Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P2.json`
(2 cards).

## EX Delta Species (`ex11` → `DS`)

Thirty-second stop. Limitless code `DS` confirmed against
`limitlesstcg.com/cards/DS` (114 cards, 31 October 2005) before starting.
`fetch-set.mjs ex11 DS` ran clean. Same EX-era no-Pokédex template,
confirmed against Beedrill 1/113; added `data/no-pokedex/DS.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `DS.json`
(12 cards).

## EX Legend Maker (`ex12` → `LM`)

Thirty-third stop. Limitless code `LM` confirmed against
`limitlesstcg.com/cards/LM` (93 cards, 13 February 2006) before starting.
`fetch-set.mjs ex12 LM` ran clean. Same EX-era no-Pokédex template,
confirmed against Aerodactyl 1/92; added `data/no-pokedex/LM.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `LM.json`
(6 cards).

## EX Trainer Kit 2 Plusle / Minun (`tk2a`/`tk2b` → `TK2A`/`TK2B`)

Thirty-fourth and thirty-fifth stops, the second two-deck Trainer Kit.
Neither half is on Limitless (both 404, and neither appears in the full
EX-era set listing) — same as the first Trainer Kit, fetched with `NONE`
as the `<limitlessUrlCode>`. Same no-rarity-at-all and no-Pokédex-at-all
pattern as `TK1A`/`TK1B`, confirmed against Beldum (TK2A 1/12); added
`data/no-rarity/TK2A.json`/`TK2B.json` and
`data/no-pokedex/TK2A.json`/`TK2B.json` as `["*"]`. Flavor text 0/0
eligible for both, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` was a no-op for
both — expected, since every card's `limitless` is `null`.

## POP Series 3 (`pop3` → `P3`)

Thirty-sixth stop. Limitless code `P3` confirmed against
`limitlesstcg.com/cards/P3` (17 cards, 1 April 2006) before starting.
`fetch-set.mjs pop3 P3` ran clean. Same EX-era no-Pokédex template,
confirmed against Blastoise 1/17; added `data/no-pokedex/P3.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P3.json`
(1 card).

## EX Holon Phantoms (`ex13` → `HP`)

Thirty-seventh stop. Limitless code `HP` confirmed against
`limitlesstcg.com/cards/HP` (111 cards, 3 May 2006) before starting — no
collision with any existing set code in this database. `fetch-set.mjs
ex13 HP` ran clean. Same EX-era no-Pokédex template, confirmed against
Armaldo 1/110; added `data/no-pokedex/HP.json` as `["*"]`. Flavor text
0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `HP.json`
(16 cards).

## EX Crystal Guardians (`ex14` → `CG`)

Thirty-eighth stop. Limitless code `CG` confirmed against
`limitlesstcg.com/cards/CG` (100 cards, 30 August 2006) before starting.
`fetch-set.mjs ex14 CG` ran clean. Same EX-era no-Pokédex template,
confirmed against Banette 1/100; added `data/no-pokedex/CG.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `CG.json`
(13 cards).

## POP Series 4 (`pop4` → `P4`)

Thirty-ninth stop. Limitless code `P4` confirmed against
`limitlesstcg.com/cards/P4` (17 cards, 1 August 2006) before starting.
`fetch-set.mjs pop4 P4` ran clean. Same EX-era no-Pokédex template,
confirmed against Chimecho 1/17; added `data/no-pokedex/P4.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P4.json`
(4 cards).

## EX Dragon Frontiers (`ex15` → `DF`)

Fortieth stop. Limitless code `DF` confirmed against
`limitlesstcg.com/cards/DF` (101 cards, 8 November 2006) before starting.
`fetch-set.mjs ex15 DF` ran clean. Same EX-era no-Pokédex template,
confirmed against Ampharos 1/101; added `data/no-pokedex/DF.json` as
`["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `DF.json`
(21 cards).

## EX Power Keepers (`ex16` → `PK`)

Forty-first stop, closing out the EX era. Limitless code `PK` confirmed
against `limitlesstcg.com/cards/PK` (108 cards, 14 February 2007) before
starting. `fetch-set.mjs ex16 PK` ran clean. Same EX-era no-Pokédex
template as every set since Ruby & Sapphire, confirmed against Aggron
1/108; added `data/no-pokedex/PK.json` as `["*"]`. Flavor text 0/0
eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `PK.json`
(27 cards).

This closes out the EX era (`RS`, `SS`, `DR`, `MA`, `TK1A`/`TK1B`, `HL`,
`RG`, `TRR`, `DX`, `EM`, `UF`, `DS`, `LM`, `TK2A`/`TK2B`, `HP`, `CG`, `DF`,
`PK`).

## POP Series 5 (`pop5` → `P5`)

Forty-second stop. Limitless code `P5` confirmed against
`limitlesstcg.com/cards/P5` (17 cards, 1 March 2007) before starting.
`fetch-set.mjs pop5 P5` ran clean. Still the EX-era no-Pokédex template
despite this releasing after `ex16` — confirmed against Ho-Oh 1/17; added
`data/no-pokedex/P5.json` as `["*"]`. Flavor text 0/0 eligible, genuine.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P5.json`
(6 cards).

## POP Series 6 (`pop6` → `P6`)

Forty-third stop. Limitless code `P6` confirmed against
`limitlesstcg.com/cards/P6` (17 cards, 1 September 2007) before starting.
`fetch-set.mjs pop6 P6` ran clean. **Template changed**: unlike every EX-era
set since Ruby & Sapphire, this one (released after Diamond & Pearl's own
debut) has the Pokédex box and flavor text back, and both worked
automatically via the normal subtype-based logic for 15/17 cards —
confirmed against Bastiodon 1/17.

Two cards (Gible 7/17, Pikachu 9/17) hold an Oran Berry, and this
template's held-item banner occupies the same space the Pokédex box would
use — both wrongly had `pokedex` attached despite the card printing neither
a dex box nor flavor text at all. Confirmed against both card images; added
`data/no-pokedex/P6.json` for `["7", "9"]`.

`check-flavor-text.mjs` flagged 2/15 covered cards. Buneary 12/17 turned out
to be a genuine upstream typo, not the usual wording drift — pokemon-tcg-data's
`flavorText` read "uncoiling **is** rolled ears" where the card clearly prints
"uncoiling **its** rolled ears"; confirmed against the card image and fixed
directly in `data/sets/P6.json` (no overlay mechanism covers a flavorText
correction, same as the HS LEGEND precedent — see CLAUDE.md). Chimchar 14/17's
mismatch is the ordinary drift pattern, no fix needed.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P6.json`
(4 cards).

## POP Series 7 (`pop7` → `P7`)

Forty-fourth stop. Limitless code `P7` confirmed against
`limitlesstcg.com/cards/P7` (17 cards, 1 March 2008) before starting.
`fetch-set.mjs pop7 P7` ran clean — Pokédex and flavor text both fully
covered automatically (17/17 and 17/17), no overlays needed this time.

`check-flavor-text.mjs` flagged 3/17, and all three turned out to be
genuine upstream typos rather than the usual wording drift — confirmed
against each card image and fixed directly in `data/sets/P7.json`:
Gallade 2/17 ("on it elbows" → "on its elbows"), Flaaffy 7/17 ("It fire
hair" → "It fires hair"), Wormadam Sandy Cloak 10/17 ("it cloak became" →
"its cloak became"). Three real errors in one set is unusually many for
this backfill — worth noting in case `pop7`'s source data has more
issues than most.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P7.json`
(14 cards).

## POP Series 8 (`pop8` → `P8`)

Forty-fifth stop. Limitless code `P8` confirmed against
`limitlesstcg.com/cards/P8` (17 cards, 1 September 2008) before starting.
`fetch-set.mjs pop8 P8` ran clean — Pokédex and flavor text both fully
covered automatically.

`check-flavor-text.mjs` flagged 2/14: Luxray 3/17's mismatch is just an
en-dash-vs-double-hyphen transcription difference against the matching
Pearl candidate, not a card error. Probopass 4/17 is a genuine upstream
typo — pokemon-tcg-data read "from all **cover**" where the card prints
"from all **over**"; confirmed against the card image and fixed directly
in `data/sets/P8.json`.

`npm run typecheck` clean. `refresh-print-groups.mjs` updated `P8.json`
(6 cards).

## POP Series 9 (`pop9` → `P9`)

Forty-sixth stop, closing out the POP series. Limitless code `P9`
confirmed against `limitlesstcg.com/cards/P9` (17 cards, 1 March 2009)
before starting. `fetch-set.mjs pop9 P9` ran clean — Pokédex and flavor
text both fully covered automatically.

`check-flavor-text.mjs` flagged 2/17, both genuine upstream typos —
confirmed against the card images and fixed directly in
`data/sets/P9.json`: Pachirisu 10/17 ("It live atop trees" → "It lives
atop trees") and Gible 14/17 ("Its nests is small" → "It nests in
small").

`npm run typecheck` clean. `refresh-print-groups.mjs` was a no-op.

This closes out the POP series (`P1`-`P9`).
