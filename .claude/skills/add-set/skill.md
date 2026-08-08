---
name: add-set
description: Add a new set to the Pokémon TCG database, or bring the database up to date after any set/card addition. Use when the user asks to add a set (e.g. "add PFL"), fetch a new set, or otherwise mentions adding cards to data/sets/.
---

Full pipeline for adding `<ptcgDataSetId>` / `<limitlessCode>` (find `ptcgDataSetId` from pokemon-tcg-data's `sets/en.json`, its `id` field — see CLAUDE.md):

1. `node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>`
2. Flavor text — see CLAUDE.md "Bulk flavor text via cropped images" and "Scarlet & Violet: check per-set, don't assume" for the full detail:
   - If `pokemon-tcg-data` already carries `flavorText` for this set (check per-set — true for `sv1`–`sv6`/`sve`, false for everything from `sv6pt5` on, unknown for anything new), `fetch-set.mjs` picks it up automatically. Skip straight to the verification sweep.
   - Otherwise (any Mega Evolution set, or an uncovered SV set): `node scripts/download-images.mjs <limitlessCode>`, then `node scripts/crop-flavor-text.mjs <limitlessCode> <top> <height>` (calibrate the box on one sample card first — it doesn't carry over between card templates). Claude reads each cropped image inline (no subagents — see "Lessons"), cross-checks the transcription against that species' Bulbapedia candidates, and saves via `POST /api/flavor-text` against a running `flavor-text-editor.mjs <limitlessCode>` instance.
   - Either way, finish with the verification sweep: `node scripts/flavor-text-editor.mjs <limitlessCode>`, then the "Show unmatched only" button (or the equivalent `fetch("/api/cards")` + `fetch("/api/flavor-candidates?name=...")` loop) — keep going until it's 0. This has caught real errors even in "already covered" SV data (see git history), so don't skip it either way.
3. Re-run `node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>` to merge the flavor text overlay back in.
4. `node scripts/refresh-print-groups.mjs` — rewrites every set's stored `printGroup` (including older, already-finished sets) to reflect any reprints the new set introduces. A card's stored `printGroup` is a snapshot from whenever *that* set was fetched, so an older card doesn't automatically learn about a newer reprint of itself — this step is what keeps it current. It's a pure convenience/safeguard step, not a correctness requirement (see `scripts/lib/print-groups.mjs`): nothing depends on any single card's stored `printGroup` being up to date, since it can always be re-derived from the full set of cards. Still, run it every time a set is added so stale data doesn't linger.
5. `npm run typecheck`
6. Update CLAUDE.md's "Status" line and the "Sets still to do" list.

Run step 4 on its own (no need for steps 1-3, 5, or 6) whenever a card is added or corrected outside the normal per-set pipeline — e.g. a manual fix to one card's `printGroup`.
