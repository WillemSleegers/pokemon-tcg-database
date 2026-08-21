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
clobbering a card. `data/sets/SSH.json` (Sword & Shield base set,
202 cards) is also complete — the first Sword & Shield-era set added, and the first
set in this database with V/VMAX cards. Its flavor text came from pokemon-tcg-data
directly. Fetching it surfaced a real bug in `fetch-set.mjs`: the pokedex-info-box
attachment only excluded `ex`/`MEGA` subtypes, not `V`/`VMAX`/`VSTAR`/`V-UNION` —
those also print no dex box (or flavor text) on the physical card, confirmed against
the card images (Celebi V, Lapras VMAX). Fixed by adding those subtypes to the
exclusion check, which took `flavorText` coverage from 134/173 "eligible" (38 V/VMAX
cards wrongly counted as eligible) to a clean 134/134. Its verification sweep flagged
one card, Kingler, a real upstream error in pokemon-tcg-data's `flavorText` ("The
large and hard pincer" instead of the card's actual "Its large and hard pincer"),
confirmed against the card image and fixed via the `data/flavor-text/SSH.json`
overlay. `data/sets/RCL.json` (Rebel Clash, 192 cards) and `data/sets/DAA.json`
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
(see "Pipeline" below): pokemon-tcg-data splits Shiny Vault out as its own set
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
using `fetch-set.mjs`'s new `<sequentialPrefix>` argument (see "Pipeline" below):
pokemon-tcg-data's `number` field for Classic Collection is each reprinted card's
*original* print number from its original set decades ago (not unique within the
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
Pokédex reuse" premise (see "Flavor text has no structured source" above).
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
`Radiant`/`Shining` strip ran *after* the regional-form strip in the replacement
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
  Ogerpon/etc. (see "Regional forms and Bulbapedia lookups" below), fixed in
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
  (see Status above) — its HeartGold/SoulSilver/Y Bulbapedia entry types an em
  dash as a plain `--`, which the card itself prints as a real "—". Confirmed
  against the card image and, since this is the second set to hit the same
  card with the same artifact, promoted from a documented one-off to an actual
  `normalize()` rule (`--` → `—`) in both copies, the same treatment as the
  existing ellipsis/minus-sign normalizations.

Detective Pikachu (`DET`) is a movie tie-in set, not a mainline-game reprint,
and its flavor text follows suit: the mascot card's text describes the movie
character rather than any Pokédex entry (no match expected, same exception
category as Classic Collection's Dark Gyarados/birthday-Pikachu cards — see
"Flavor text has no structured source" above), and even its Mewtwo card carries
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
pokemon-tcg-data's sequential number, but *only* for some sets and *only* for
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
exactly this, see below) turned up `g1` on its very first run — a third
XY-series set hidden by the same numeric walk. `data/sets/GEN.json`
(Generations, 85 cards) and `data/sets/GENRC.json` (Generations Radiant
Collection, 32 cards) are now done too, which finally does close the XY
series. Don't take an era's "done" claim in this file at face value; run the
script.

GEN's 117 fetched cards are its 83 numbered ones plus two alternate arts
(`28a`, `73a`) and the 32-card **Radiant Collection** subset (`RC1`–`RC32`).
Unlike every other subset in this database, Radiant Collection needs
**neither** the third nor the fourth `fetch-set.mjs` argument to *fetch*:
pokemon-tcg-data keeps it inside `g1` rather than splitting it out as its own
set id, and its `RC<n>` numbers are already unique and match Limitless's
own — plain `node scripts/fetch-set.mjs g1 GEN` pulls in all 117 as one file.

It was later split by hand into `GEN.json`/`GENRC.json`, at the user's
request, for consistency with every other subset that shares its base set's
Limitless page (Trainer Gallery, Shiny Vault, Galarian Gallery, Classic
Collection all get their own file — see "Subsets that share their base set's
Limitless page" below) — even though, unlike those, pokemon-tcg-data doesn't
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
isn't Pokédex reuse — but unlike DCR it's *mixed*, which is the part worth
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

Double Crisis is the first *whole set* whose flavor text isn't Pokédex reuse
at all: every one of its 20 eligible cards prints in-character Team Magma/Team
Aqua ops chatter ("Aron, which even devour metal, can eat and destroy enemy
ships in an instant."), so `check-flavor-text.mjs` flags all 20 and can never
clear any of them. Prior instances of this were one-offs inside an otherwise
normal set (Classic Collection's Dark Gyarados, Detective Pikachu, EVO's
`Imakuni?'s Doduo` — see "Flavor text has no structured source"); here it's
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
  didn't match the canonical `"67"` that every *other* set's own
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

Both bugs together meant the *first* XYP fetch (before either fix) wrote
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
`/^XYP XY\d+[a-z]?$/` across every set file, *then* re-running
`refresh-print-groups.mjs` to confirm the recomputed groups came out clean
(they did, on the first pass). Worth knowing if a future set's fetch ever
gets committed with a similar id-normalization bug: re-fetching the broken
set alone isn't sufficient once `refresh-print-groups.mjs` has already run
against it — the bad ids need to be purged from every file they leaked
into.

Two of EVO's flagged cards were genuine card-specific exceptions, not
errors — same category as Detective Pikachu and Classic Collection's Dark
Gyarados/birthday-Pikachu (see "Flavor text has no structured source"
above): `Imakuni?'s Doduo` is a gag card with no flavor-text region on the
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

**Every English Black Star Promos set is now done** — a fifth backfill,
oldest first, at the user's request after XYP: `WP` (basep, Wizards Black
Star Promos, 53), `NP` (np, Nintendo, 40), `DPP` (dpp, DP, 56), `HSP` (hsp,
HGSS, 25), `BWP` (bwp, BW, 101), `SMP` (smp, SM, 251), `SP` (swshp, SWSH,
304), and `SVP` (svp, Scarlet & Violet, 165 at the time; now 218) — 8 files joining the already-
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
gained `--fill-from-limitless` instead (see Pipeline below): pokemon-tcg-data
stays primary for every card it has, and only the ids it's missing take the
fallback path. `SVP` is now **218 cards** — the union of both sources — with
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
came *from* Bulbapedia (186, 187, 188, 199, 201, 202) were each read against
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
  the name, but which would *also* have wrongly given them a Pokédex info box.
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
outright — `svp` is the "partial coverage" set CLAUDE.md already warned
about, and its newer promos have none.

Confirmed-correct-as-printed exceptions that can never algorithmically clear:
WP's 25 flagged cards are almost all WotC-era rewordings of a Red/Blue entry
(singular for plural and similar), the same category as Classic Collection's
1999 Base Set prints; HSP's Porygon prints a doubled period ("any
environment..") that the card itself really has; DPP's Porygon-Z and Gliscor
have a dex box but no room left for flavor text; SMP's three Detective
Pikachu cards, Charizard SM226 and Armored Mewtwo SM228 carry *Mewtwo Strikes
Back*/*Detective Pikachu* movie text; and SVP's Pikachu #27 describes the
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
  "Card numbers with the set code baked in" below), because `dpp` has the
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

`data/sets/CELCC.json`'s original `<sequentialPrefix>` fetch (see Status above)
turned out to have mis-numbered 13 of its 25 cards: it assumed pokemon-tcg-data's
fetched array order matched Limitless's own `CC1`–`CC25` numbering, spot-checked
on only 3 positions, and that assumption broke silently for `CC4`–`CC16` — each
of those localIds ended up with one card's name/attacks/images (from
pokemon-tcg-data) paired with a *different* card's artist/deckCode/printGroup
(scraped from Limitless at that same wrong id), e.g. Claydol holding Here Comes
Team Rocket!'s printGroup. Caught by the user, not this database's own tooling —
the field-by-field Limitless cross-check that would normally catch a source
disagreement doesn't run for `<sequentialPrefix>` cards at all. Fixed at the
root: `fetch-set.mjs` now resolves `<sequentialPrefix>` localIds by matching
each card's own name against every fetched Limitless page under that prefix,
never by position (see "Reprint subsets with non-sequential, non-unique
numbers" below for the full mechanism). Re-fetching with the fix reassigned all
13 cards to their correct `localId` cleanly; `refresh-print-groups.mjs` and
`check-flavor-text.mjs CELCC` both confirmed clean afterward, and no other set
file needed touching, since every other set's own `CEL CC<n>` cross-references
were scraped correctly at that other set's own fetch time.

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
  rarity mechanic that gets its own oversized name treatment or rule box (`MEGA`,
  the `V` family, old-style `EX`/modern `ex`, `GX`, `Star`, `Level-Up`/LV.X,
  `Prime`) uses that space for something else instead, so `fetch-set.mjs` excludes
  all of those subtypes. Verified against card images, not guessed — see "Sword &
  Shield" and "Celebrations: Classic Collection" in Status above for the specific
  cards that caught each one. A card old enough to predate the TCG's dex-box
  convention entirely (pre-Diamond & Pearl, ~2006) can still slip through this
  list since it has no distinguishing subtype — confirmed two such cases in
  Classic Collection, corrected by hand (see Status above) rather than by
  guessing at a release-date cutoff.

### Subsets that share their base set's Limitless page

`<code>` is this set's own identity — the output filename, `data/flavor-text/
<code>.json`, and the stored `set.code`/`deckCode`. Normally it's also the Limitless
URL segment (`limitlesstcg.com/cards/<code>`), since one pokemon-tcg-data set has
historically always meant one Limitless page. That assumption breaks for a Trainer
Gallery, Shiny Vault, or Galarian Gallery subset: pokemon-tcg-data splits each of
those out as their own set id, but Limitless has no separate page for them — their
cards live at `limitlesstcg.com/cards/<baseCode>/<localId>`, under the *base* set's
page, with the local id's leading zeros stripped (pokemon-tcg-data's `SV001`/`TG01`
is Limitless's `SV1`/`TG1` — handled by `toLimitlessLocalId()`). Pass the base set's
code as the third argument in that case: `node scripts/fetch-set.mjs swsh45sv SHFSV
SHF`. Both the resulting file's `limitless.url` and `deckCode` correctly point at
the shared base-set page; only the output filename and `set.code` are _the
subset's own_. Found while adding Shining Fates' Shiny Vault (`swsh45sv`) — see
Status above.

### Reprint subsets with non-sequential, non-unique numbers

pokemon-tcg-data's `number` field is normally both unique within a set and the
same numbering Limitless uses, so `fetch-set.mjs` uses it directly as `localId`.
That breaks for a throwback-reprint subset like Celebrations: Classic Collection
(`cel25c`): its `number` is each card's *original* print number from its original
set, decades earlier — not unique within the subset (four different `cel25c`
cards are all `"15"`), and unrelated to Limitless's own clean sequential numbering
for the subset. Pass a fourth argument to override `localId` with a name-matched
`${prefix}<n>` instead: `node scripts/fetch-set.mjs cel25c CELCC CEL CC` (this
also needs the third argument from the section above, since Classic Collection
shares Celebrations' `CEL` Limitless page too). Don't reach for this unless a
set's `number` field actually collides — check first, since it's a narrower fix
than it looks.

**`<sequentialPrefix>` resolves `<n>` by matching each pokemon-tcg-data card's own
name against every `${prefix}<n>` page on Limitless — never by array position.**
The original implementation assumed pokemon-tcg-data's fetched array order
matched Limitless's own sequential numbering, spot-checked on 3 cards (positions
1, 3, 25) rather than verified in full. That assumption was wrong for 13 of
Classic Collection's 25 cards: pokemon-tcg-data's own array order for CC4–CC16
doesn't match Limitless's, so the position-based `localId` paired each of those
13 cards' name/attacks/images (from pokemon-tcg-data) with a *different* card's
artist/deckCode/printGroup (scraped from Limitless at that same, wrong,
position-derived id) — e.g. Claydol ended up holding Here Comes Team Rocket!'s
printGroup, and vice versa. Caught by the user cross-checking the stored `number`
column against each card's own printGroup entry (Imposter Professor Oak is Base
Set 73; the card stored as `CC4` had printGroup `["BS 73", ...]` but was named
"Here Comes Team Rocket!"). Fixed by `resolveSequentialLocalIds()`
(`scripts/fetch-set.mjs`): before assigning any localId, it fetches every
`${prefix}<n>` page under the set up front, and pairs each pokemon-tcg-data card
with whichever page's own name (via the same alphanumerics-only comparison
`limitlessPageIsCard` already used elsewhere) actually matches it — throwing
loudly on an unmatched or ambiguous name rather than falling back to position.
Re-running `node scripts/fetch-set.mjs cel25c CELCC CEL CC` after the fix
reassigned all 13 cards to their correct `localId` with no mismatch errors.

Two overlays keyed by the old (wrong) localId needed updating by hand alongside
the re-fetch, since neither is derived automatically: `data/flavor-text/
CELCC.json`'s `"CC6"` (Claydol's transcribed flavor text) became `"CC16"`; and
the two cards previously hand-stripped of a bogus Pokédex box directly in
`data/sets/CELCC.json` (Rocket's Zapdos, Team Magma's Groudon — see the
`data/no-pokedex/` section below) were migrated to a proper `data/no-pokedex/
CELCC.json` overlay (`["CC7", "CC11"]`, their corrected localIds) instead of
being re-stripped by hand again, since the hand-stripping approach silently
reverts on every re-fetch. `refresh-print-groups.mjs` and `check-flavor-text.mjs
CELCC` both came back clean afterward (the latter's 5/10 unmatched count
unchanged — the same long-documented exceptions, just at their now-correct
localIds), and no other set file needed touching: every other set's own
`CEL CC<n>` printGroup references were scraped directly off Limitless when
*that* set was fetched, so they were already correct — only CELCC's own
internal pairing was wrong.

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
where Limitless writes the word — `"Greninja ★"` vs `"Greninja Star"`, which is
what made `swshp`'s SWSH144 look absent when it isn't.

### Sets pokemon-tcg-data has, but is behind Limitless on

An ongoing promo set drifts: pokemon-tcg-data carried 165 of `svp`'s cards
while Limitless catalogued 217. `--fill-from-limitless` closes that gap
without disturbing what's already there —

```sh
node scripts/fetch-set.mjs svp SVP --fill-from-limitless
```

— by keeping pokemon-tcg-data primary for every card it *does* have and
sending only the ids it's missing down the same reprint/Bulbapedia fallback
path a `"NONE"` run uses, with the same field-by-field Limitless cross-check.
Nothing already fetched and verified gets re-derived from a weaker source,
and a card in `data/no-limitless/<CODE>.json` (which by definition can't be
in Limitless's set index) is preserved rather than dropped. `total` is
recomputed from the merged card count, since `sets/en.json`'s own is a count
of what pokemon-tcg-data has.

It needs `data/set-meta/<CODE>.json` for `bulbapediaSetPage` and
`defaultRarity` — the rest of that file is only read by a full `"NONE"` run.

It's **opt-in**, and must stay that way: "Limitless lists an id we don't
have" only means something when the Limitless page is this set's own. A
subset sharing its base set's page (`SHFSV` under `SHF`) would otherwise pull
in the entire base set. It also refuses to combine with `<sequentialPrefix>`,
which replaces the `number` field the id diff compares on.

Resolving a fill card's game text goes through three tiers before Bulbapedia,
because the obvious one alone isn't enough:

1. **Stored `printGroup`**, the same index a `"NONE"` run uses — some other
   set in `data/sets/` already names this print. Covered 39 of svp's 53.
2. **The card's own Limitless prints table**, scraped fresh. Needed because
   tier 1 only finds a reprint whose *source* set knew about this print, and
   a set fetched before the promo existed doesn't (see "printGroup goes
   stale").
3. **Bulbapedia's redirect target.** No card page for a print means it's a
   reprint, and the redirect names the print it reprints — `Eevee (SVP Promo
   200)` → `Eevee (Stellar Crown 113)`, resolved against `data/sets/` by set
   name. A set reprints itself this way too (svp's Paradise Resort 224 → its
   own 45), which tier 1 structurally cannot find, since the reprint index
   skips this set's own file so a re-run can't feed on its previous output.

`fetchCardWikitext` returns a redirect rather than raising on one, so tier 3
can read it. It still never *follows* the redirect — parsing the target page
would describe a different print of the card, which is the thing that guard
was always for.

### Sets pokemon-tcg-data doesn't have

pokemon-tcg-data is the primary source for everything else in this database,
but it doesn't have every set — it has no `mep` entry at all, and there's no
reason to assume it'll have the next promo set either. Pass `"NONE"` as
`<ptcgDataSetId>` for that case: `node scripts/fetch-set.mjs NONE MEP`.

Nothing downstream of the fetch changes — the mode's whole job is to assemble
the same `PrimaryCard[]` that pokemon-tcg-data would have provided, so
overlays, `limitless` (deck code, print groups) and the Pokédex box stay one
code path:

- **Card list** from the Limitless set page. That's also the scope decision:
  a card Limitless doesn't catalogue has no `limitless.deckCode` or
  `limitless.printGroup` to record, so it isn't in the set as far as this
  database is concerned.
- **Game text for reprints** from `data/sets/` — any card whose stored
  `printGroup` names this set. A shared print group *means* identical game
  text, so this is pokemon-tcg-data's own text, already verified when that set
  was added. It found 53 of MEP's 79 cards, because Limitless's prints table
  is full history and the earlier sets' fetches had already recorded the MEP
  print.
- **Game text for set-exclusives** from Bulbapedia's card page for that print,
  parsed by `scripts/lib/bulbapedia-card.mjs`. Note a reprint's promo page is
  a `#REDIRECT` to the original print's page — that's why the reprint lookup
  has to come first, and why the fetcher raises on a redirect rather than
  parsing whatever page it lands on.
- **Set metadata** from `data/set-meta/<CODE>.json`, since there's no
  `sets/en.json` entry to read it from. These are judgement calls, not
  lookups: an ongoing promo set has no real `printedTotal` (MEP uses 88, its
  highest printed number, which also makes `secret` correctly false for every
  card), and `numberPad` records that a promo prints a bare padded number
  ("MEP 046") with no denominator. `set.ptcgDataId` is `null` for these sets.
- **`regulationMark` and `images`** always come off the card's own Limitless
  page, never from the reprint source — a promo reprint has its own artwork
  (often a different illustrator) and can carry a different regulation mark.

Every assembled card is then checked field by field against its Limitless
page — name, HP, types, stage, evolvesFrom, weakness/resistance, retreat,
attack names/costs/damage, ability names — and **the run fails on any
disagreement**. That check is the point: Limitless is a different party
transcribing the same physical card, so agreement is real evidence, where a
single source quietly disagreeing with the card is the exact failure mode
every promo backfill turned up. Free text (attack effects, Trainer rules)
is deliberately not compared — Limitless writes energy symbols as `[G]` where
this database spells out `Grass`, so it would be all false alarms.

If you touch this mode, re-prove the check still fires (corrupt an HP, an
attack cost and an ability name, confirm all three are caught) before trusting
a clean run. A validator that never fires looks exactly like a clean set.

One thing the Limitless cross-check *can't* settle is which of several
Bulbapedia `{{TCGTrainerText}}` blocks a Trainer print uses — a card
reprinted across eras has one per wording. There the comparison is the
resolution: the block whose text matches Limitless's is the one this print
shows (MEP's Celebratory Fanfare has both a SWSH-era and a SV-era wording).

### `data/no-pokedex/<CODE>.json` — cards that print no dex info box

`fetch-set.mjs` decides whether to attach the Pokédex info box from the card's
subtypes (see Pipeline above), which can't catch a card that predates the
convention entirely: the TCG dropped the dex line for the e-Card era (Expedition,
2002/09) and didn't bring it back until Diamond & Pearl (2007/05). Neither a
subtype nor a per-set release date decides this, because a promo set straddles
that gap card by card — WP's #1–49 print it, its e-Card-era #50–53 don't.

List those cards' localIds in `data/no-pokedex/<CODE>.json` (a bare JSON array; a
lone `"*"` means the whole set) and `fetch-set.mjs` will skip the box for them.
Confirm each against the actual card image first. Files so far: `NP` (`["*"]` —
every Nintendo promo is e-Card/EX era), `WP`, `DPP` (its Darkrai movie promo plus
the three Team Galactic "SP" cards, whose banner takes the dex line's place),
`SP` (two retro-styled tribute cards aping EX- and DP-era layouts), and `CELCC`
(`["CC7", "CC11"]` — Rocket's Zapdos and Team Magma's Groudon).

This supersedes the hand-stripping originally used for Classic Collection's two
such cards (see Status) — that approach silently reverts on the next re-fetch,
which is exactly what happened when CELCC had to be re-fetched to fix its
CC4–CC16 localId mismatch (see "Reprint subsets with non-sequential, non-unique
numbers" above); migrated to this overlay at that point instead of re-stripping
by hand again.

### `data/no-limitless/<CODE>.json` — cards Limitless doesn't have

`"NONE"` as `<limitlessUrlCode>` covers a set Limitless never catalogued at all
(the McDonald's collections). The long-running promo sets need the per-card
version of the same thing: Limitless catalogues 292 of `swshp`'s (now 307)
cards, and misses one of `svp`'s. List those localIds in `data/no-limitless/
<CODE>.json` and they take the same path as `"NONE"` — `artist` from
pokemon-tcg-data, `limitless` set to `null`.

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

### `data/no-rarity/<CODE>.json` — cards that print no rarity symbol

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
per card before assuming "*".** The same audit also caught 3 individual cards
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
MEP and SVP too — this isn't an SP-specific fix, it's a standing policy error
in this file.** Both sets had deliberately excluded cards on exactly this
premise (documented as scope decisions in Status above). Re-checked the same
way as SP: diff each set's own Bulbapedia set-list page against what's stored,
not the stale "Limitless's N cards is the whole set" assumption.

- **MEP grew from 88 to 88 known-real cards** — Bulbapedia's set list actually
  runs to 120 (with a large ongoing gap, `111`–`119`, not yet assigned), which
  is a separate, much bigger backfill than what was tackled here. What *was*
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
  Bulbagarden Archives — no mislabeling this time (unlike the SP case below),
  confirmed by opening them.
- **SVP had 7 of Bulbapedia's 225 listed cards missing**, not the 9 the old
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
    exception (see below) — confirmed correct as printed, not fixed.
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

### `limitless.printGroup` goes stale, and that's fine

A card's stored `limitless.printGroup` is a snapshot of Limitless's prints table from
whenever _that card's set_ was fetched. If a later set reprints it, the later card's
own snapshot correctly includes the earlier one (Limitless always shows full history),
but the earlier card's stored array doesn't retroactively gain the new one — sets,
once fetched and verified, are never edited again to keep it current.

That's handled by not depending on any single card's copy being current:
`scripts/lib/print-groups.mjs` derives the _actual_ up-to-date group for any card
(skipping any whose `limitless` is `null` — there's no deck code to give them a graph
node) as the connected component over every card's stored `limitless.printGroup`,
across every set in `data/sets/`. As long as one member of a group has the up-to-date
list — which the most recently fetched member always does — the union recovers the
full group regardless of how stale any other member's own array is.

`scripts/refresh-print-groups.mjs` runs that derivation and rewrites every set file's
`limitless.printGroup` fields to match, so sets read in isolation stay current too —
but this is a convenience, not a correctness requirement. Run it whenever a set is
added (the `add-set` skill does this as its last step) or skip it; nothing downstream
should ever need to assume a stored `printGroup` is complete on its own.

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

**A clean sweep only means something when the text and the check came from
different places.** This script compares against Bulbapedia, so for text that
was itself sourced from Bulbapedia (the set-exclusive cards in a `"NONE"`
`<ptcgDataSetId>` run — see "Sets pokemon-tcg-data doesn't have" above) it's
checking a source against itself and will pass regardless. Read those cards'
cropped strips against the stored text instead; that's how MEP's Cottonee was
caught after sweeping clean. Text from pokemon-tcg-data — every other set —
is genuinely independent of Bulbapedia, so a clean sweep there is real
evidence.

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
though both happen to be ~733×1024 images.

Also set `left`/`width` — don't leave them at the full-width default. The left third
of the strip is always the illustrator credit + set number/rarity column, never
flavor text, so leaving it in wastes tokens on every single card for nothing. Check
it against a card with unusually long flavor text (a short entry sits centered/
right-aligned within the same box, so it's the long ones that reveal how far left
the box's text region actually starts) — verified against PBL/19 (Mega Evolution,
two-line) and DRI/20 (Scarlet & Violet, three-line), both of which had margin to
spare at the values below. Known-good boxes so far: Mega Evolution `top=900
height=95 left=220 width=513`, Scarlet & Violet `top=905 height=95 left=260
width=473`.

Then, for each card: Claude reads the cropped image (`.local/card-images-cropped/
<CODE>/<localId>.png`) inline — same "don't spawn subagents for this, just read them
one after another" reasoning as the old full-image approach (see Lessons below), just
much cheaper per card now. Cross-check the transcription against that species'
Bulbapedia candidates before trusting it, and save it once confirmed. Both steps have
a CLI script — no editor server needed for the bulk pass:

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
overridden by the manual overlay if present) — the community had years to fill it in.
But coverage has a hard cutoff, not a gradient: `sv1`–`sv6` and `sve` are 100%
covered, `sv6pt5` ("Shrouded Fable") onward through `sv10` are 0% covered, checked
card by card. `svp` (the ongoing promo set) is partial — confirmed when it was
added as `SVP`: 88 of its 107 eligible cards were covered, the other 19 needed
transcribing from crops. The 2026/08/14 `--fill-from-limitless` re-fetch took
it to 136 eligible, of which only one new card (Yanma 185) needed a crop —
the other 52 arrived with flavor text already attached, since a fill card
resolved from a reprint inherits its source print's. Check any new SV set for
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
# ...Claude reads the cropped images and transcribes+verifies+saves via
# fetch-flavor-candidates.mjs / save-flavor-text.mjs (see "Bulk flavor text via
# cropped images" above), then runs check-flavor-text.mjs as the closing check...
node scripts/fetch-set.mjs <ptcgDataSetId> <LimitlessCode>   # re-run to merge flavor text in
node scripts/refresh-print-groups.mjs                        # propagate reprints into older sets' printGroup
npm run typecheck
```

Find `ptcgDataSetId` from pokemon-tcg-data's `sets/en.json` (its `id` field). The
entire Mega Evolution series (MEG, PFL, ASC, POR, CRI, PBL) is done, plus
Scarlet & Violet's SVI, SVE, PAL (sv2), OBF (sv3), MEW (sv3pt5), PAR (sv4), PAF
(sv4pt5), TEF (sv5), TWM (sv6), SFA (sv6pt5, Limitless code `SFA`), SCR (sv7,
Limitless code `SCR`), SSP (sv8, Limitless code `SSP`), PRE (sv8pt5, Limitless
code `PRE`), JTG (sv9, Limitless code `JTG`), DRI (sv10, Limitless code `DRI`),
BLK (`zsv10pt5`, Limitless code `BLK`), and WHT (`rsv10pt5`, Limitless code `WHT`).
BLK and WHT were released the same day (2025/07/18) and sit chronologically before
the Mega Evolution series despite being added after it — don't assume the most
recent `sv*`-adjacent id in `sets/en.json` is the only thing missing; check the
full list against `data/sets/` rather than trusting the last-known "next set" note.
Nothing newer than `me5` (Pitch Black) exists in pokemon-tcg-data as of this
writing — re-check `sets/en.json` for what comes after it, and confirm any new
set's Limitless code on limitlesstcg.com before starting.

The Sword & Shield era (2020/02–2023/01, 25 entries in `sets/en.json` from `swshp`
promos through `swsh12pt5gg`) is **done** — added as a separate backfill from the
SV/Mega Evolution frontier above, oldest first: `SSH` (swsh1), `RCL` (swsh2),
`DAA` (swsh3), `CPA` (swsh35), `VIV` (swsh4), `SHF`/`SHFSV` (swsh45/swsh45sv),
`BST` (swsh5), `CRE` (swsh6), `EVS` (swsh7), `CEL`/`CELCC` (cel25/cel25c), `FST`
(swsh8), `BRS`/`BRSTG` (swsh9/swsh9tg), `ASR`/`ASRTG` (swsh10/swsh10tg), `PGO`
(pgo), `LOR`/`LORTG` (swsh11/swsh11tg), `SIT`/`SITTG` (swsh12/swsh12tg), and
`CRZ`/`CRZGG` (swsh12pt5/swsh12pt5gg) — 21 files, all verified. `swshp` (the
ongoing English promo set) was left out of this backfill, same treatment as `svp`
elsewhere in this file; both were added later as `SP`/`SVP` in the Black Star
Promos backfill below. Every Trainer/Galarian Gallery/Shiny Vault subset is pokemon-tcg-data's own
separate set id but shares its base set's Limitless page — see "Subsets that
share their base set's Limitless page" above for the `fetch-set.mjs` invocation.
Shiny Vault and Classic Collection needed the fourth (`<sequentialPrefix>`)
argument too (non-unique/non-sequential `number` fields); every Trainer Gallery
and Galarian Gallery subset had a `number` field that was already unique and
correctly ordered (`TG01`–`TG30`, `GG01`–`GG70`), so only the third argument was
needed — don't reach for the fourth without checking first (see "Reprint subsets
with non-sequential, non-unique numbers" above; this bit BRSTG on the first try).
This era introduces V/VMAX/VSTAR/V-UNION, old-style uppercase `EX`, `GX`, `Star`,
`Level-Up`/LV.X, and `Prime` subtypes, none of which print a Pokédex info box or
flavor text on the card — `fetch-set.mjs` excludes all of them from the
pokedex-info-box fetch (see Status above). A card old enough to predate the TCG's
dex-box convention entirely (pre-~2007) can still slip through since it has no
distinguishing subtype — the two known cases were both in Classic Collection,
fixed by hand (see Status above).

The Sun & Moon era (2017/02–2019/11, `sm1` through `sm12` in `sets/en.json`) is
also **done** — a third backfill, oldest first: `SUM` (sm1), `GRI` (sm2), `BUS`
(sm3), `SLG` (sm35), `CIN` (sm4), `MCD17` (mcd17), `UPR` (sm5), `FLI` (sm6),
`CES` (sm7), `DRM` (sm75), `MCD18` (mcd18), `LOT` (sm8), `TEU` (sm9), `DET`
(det1), `UNB` (sm10), `UNM` (sm11), `HIF`/`HIFSV` (sm115/sma), `MCD19` (mcd19),
and `CEC` (sm12) — 20 files, all verified (see Status above for the details;
this era needed more real fixes, both per-set overlay corrections and shared
`speciesName()`/`normalize()` library fixes, than either prior backfill). `smp`
(the ongoing promo set) was left out of this backfill, same treatment as
`swshp`/`svp`; it was added later as `SMP` in the Black Star Promos backfill
below. Hidden
Fates' Shiny Vault subset (`sma`) shares `HIF`'s Limitless page like every
other Shiny Vault/Trainer/Galarian Gallery subset before it — `node
scripts/fetch-set.mjs sma HIFSV HIF`. The three McDonald's Collection sets
(`mcd17`/`mcd18`/`mcd19`) are a new case, not covered by any existing
`fetch-set.mjs` argument: Limitless never catalogued them at all, so they need
the literal `"NONE"` `<limitlessUrlCode>` argument added for this backfill —
`node scripts/fetch-set.mjs mcd17 MCD17 NONE` — which reads `artist` straight
from pokemon-tcg-data instead of scraping it, and leaves `printGroup`/
`limitless` as empty placeholders (see Status above for why `deckCode` still
can't be left equally empty). Detective Pikachu (`det1`) has a normal
Limitless page (`DET`) despite being a movie tie-in, not a mainline
reprint — only its *flavor text* needed special treatment (see Status above),
not the fetch itself.

The XY era (2013/11–2016/11, `xy0` through `xy12` plus `xyp` in
`sets/en.json`) is also **done** — a fourth backfill, oldest first: `KSS`
(xy0), `XY` (xy1), `FLF` (xy2), `FFI` (xy3), `PHF` (xy4), `PRC` (xy5), `ROS`
(xy6), `AOR` (xy7), `BKT` (xy8), `BKP` (xy9), `FCO` (xy10), `STS` (xy11),
`EVO` (xy12), and `XYP` (xyp) — 15 files, all verified (see Status above for
the details, including two `fetch-set.mjs` bugs XYP's fetch surfaced around
Limitless's non-canonical URL redirects, and a `BREAK`-subtype dex-box
exclusion gap BKT surfaced). Unlike every prior era's promo set, `XYP` was
included rather than skipped, at the user's explicit request. `DCR` (dc1,
Double Crisis) and `GEN`/`GENRC` (g1, Generations plus its `RC1`–`RC32`
Radiant Collection subset, later split into its own file — see Status above)
were added later — two more XY-series sets the era walk missed because their
ids aren't `xy<n>`; see Status above. 18 files across 16 `sets/en.json`
entries. Enumerate an era with
`node scripts/missing-sets.mjs <series>`, not by a numeric range over ids.

All nine English Black Star Promos sets are **done** — a fifth backfill,
oldest first, going back for the promo sets every earlier era had skipped:
`WP` (basep), `NP` (np), `DPP` (dpp), `HSP` (hsp), `BWP` (bwp), `SMP` (smp),
`SP` (swshp), and `SVP` (svp), joining `XYP` from the XY era. See Status
above for the full detail — the per-set overlay fixes, the two new
`data/no-pokedex/` and `data/no-limitless/` mechanisms these sets needed,
and the crop boxes for the pre-Sun & Moon card templates. The three
"ongoing" ones (`smp`/`swshp`/`svp`) are snapshots: pokemon-tcg-data keeps
adding to them, and its card counts already exceed what `sets/en.json`
advertises, so re-fetching them periodically is expected.

`data/sets/MEP.json` (MEP Black Star Promos, 79 cards) is also **done** — the
Mega Evolution era's promo set, and the first set in this database that
**pokemon-tcg-data doesn't carry at all** (no `mep` in `sets/en.json`, no
`cards/en/mep.json`; checked directly, not assumed). TCGdex does have a `mep`
set but a thin one — 60 of the 79 cards, no image URLs, and no weakness data
on the first ~45 — so it isn't used. Instead `fetch-set.mjs` gained a `"NONE"`
`<ptcgDataSetId>` mode (see "Sets pokemon-tcg-data doesn't have" above): the
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
  and Bulbapedia's card page had transcribed the *Scarlet* entry's wording,
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
  changed wording *across* the reprint chain. All 8 MEE cards resolved to
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

The Black & White era proper (2011/04–2013/11, `bw1` through `bw11` in
`sets/en.json`, predating `xy0`) has begun: `data/sets/BLW.json` (Black &
White base set, 115 cards) is done, the first of the eleven. Its flavor text
came from pokemon-tcg-data directly. Its verification sweep flagged six
cards; five were real upstream `flavorText` errors, each a single-word or
punctuation slip, confirmed against the card images and fixed via the
`data/flavor-text/BLW.json` overlay — Darmanitan ("stone statue, then it"
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

The HGSS era (2010/02–2011/02, `hgss1` through `hgss4` plus `col1` in
`sets/en.json`, predating Black & White) has begun: `data/sets/HS.json`
(HeartGold & SoulSilver base set, Limitless code `HS`, 124 cards) is done.
Its flavor text came from pokemon-tcg-data directly. Its verification
sweep flagged 7 cards. Sandslash ("its spike" for the card's plural "its
spikes"), Chikorita (extra "the" before "humidity"), and Paras ("grows
large, large mushrooms" for the card's "grows, large mushrooms") were real
upstream `flavorText` errors, confirmed against the card images and fixed
via the `data/flavor-text/HS.json` overlay. The other 4 (both Ho-Oh LEGEND
prints, both Lugia LEGEND prints) surfaced a genuine upstream data bug, not
a wording slip: HGSS-era LEGEND cards are split across two physical
prints — a top half carrying only HP and a "put this card onto your Bench
with the other half" rule box, and a bottom half carrying the attacks,
Pokédex info box, and flavor text — but pokemon-tcg-data's `flavorText`
(and `nationalPokedexNumbers`) are set on *both* halves' entries, not just
the bottom one; confirmed against all four card images (111/112 for Ho-Oh,
113/114 for Lugia). Fixed by hand directly in `data/sets/HS.json` (deleting
`pokedex` and `flavorText` from the top-half prints, 111 and 113 — the same
one-off-hand-fix precedent as BLK/CELCC/DRV elsewhere in this file) plus a
`data/no-pokedex/HS.json` overlay (`["111", "113"]`) so a future re-fetch
doesn't reattach the Pokédex box; the `flavorText` half of the bug isn't
covered by any existing overlay mechanism (`no-pokedex` only suppresses
`pokedex`), so a future re-fetch would need the same `flavorText` deletion
repeated by hand for these two localIds specifically. Separately, "Ho-Oh
LEGEND"/"Lugia LEGEND" turned out to also be a `speciesName()` lookup gap
of the usual kind (no separate Bulbapedia page for the "LEGEND" suffix) —
fixed by stripping a trailing `LEGEND` in both `speciesName()` copies,
which is what let 112/114 clear the sweep once their own `flavorText` was
confirmed correct.
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

The remaining chronological gap is `hgss3`–`hgss4` and `col1`, plus
everything older than HGSS (Platinum, Diamond & Pearl, and back) and eight
more McDonald's collections. As always, re-derive the actual next step
from `sets/en.json` against `data/sets/` rather than trusting this note by
the time it's acted on.

`node scripts/missing-sets.mjs [series]` does that derivation — it diffs
pokemon-tcg-data's `sets/en.json` against every `data/sets/*.json`'s stored
`set.ptcgDataId` (not filenames; this database's codes are Limitless's and
deliberately don't track pokemon-tcg-data's ids) and prints what's missing,
grouped by `series`, oldest first. Use it instead of walking a numeric id
range: a numeric walk is what hid `dc1`, `dv1` and `g1` through five
backfills, and the first run of this script found `g1` immediately — after
`dc1` and `dv1` had already been added and the XY series declared done a
second time.
