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
no upstream errors, no lookup bugs. `data/sets/SSH.json` (Sword & Shield base set,
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
for the subset. The fetched array order does still match Limitless's numbering
(verified by spot-checking a few cards' positions against Limitless before
trusting it), so pass a fourth argument to override `localId` with
`${prefix}${1-based array position}` instead: `node scripts/fetch-set.mjs cel25c
CELCC CEL CC` (this also needs the third argument from the section above, since
Classic Collection shares Celebrations' `CEL` Limitless page too). Don't reach for
this unless a set's `number` field actually collides — check first, since it's a
narrower fix than it looks (order-verified per set, not assumed).

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
ongoing English promo set) was left out, same treatment as `svp` elsewhere in this
file. Every Trainer/Galarian Gallery/Shiny Vault subset is pokemon-tcg-data's own
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
(the ongoing promo set) was left out, same treatment as `swshp`/`svp`. Hidden
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
