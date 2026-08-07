---
name: add-set
description: Add a new set to the Pokémon TCG database, or bring the database up to date after any set/card addition. Use when the user asks to add a set (e.g. "add PFL"), fetch a new set, or otherwise mentions adding cards to data/sets/.
---

Full pipeline for adding `<ptcgDataSetId>` / `<limitlessCode>` (find `ptcgDataSetId` from pokemon-tcg-data's `sets/en.json`, its `id` field — see CLAUDE.md):

1. `node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>`
2. `node scripts/flavor-text-editor.mjs <limitlessCode>`. Default division of labor (see CLAUDE.md "Lessons from building MEG and PFL"): the **user** fills in flavor text by hand at `http://localhost:5173` — reading card images costs Claude ~1,000-1,600 tokens each, so a full-set read-through is expensive for Claude to do itself and cheap for a human to do by eye. Once the user says they're done, **Claude** runs the "Show unmatched only" sweep (either the button in the UI, or the equivalent `fetch("/api/cards")` + `fetch("/api/flavor-candidates?name=...")` loop from the shell) and only reads card images for whichever cards are still flagged — that's the reliable completeness check, not a manual read-through. Keep going until it's 0. Only do the full-set transcription yourself if the user explicitly asks for it.
3. Re-run `node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>` to merge the flavor text overlay back in.
4. `node scripts/refresh-print-groups.mjs` — rewrites every set's stored `printGroup` (including older, already-finished sets) to reflect any reprints the new set introduces. A card's stored `printGroup` is a snapshot from whenever *that* set was fetched, so an older card doesn't automatically learn about a newer reprint of itself — this step is what keeps it current. It's a pure convenience/safeguard step, not a correctness requirement (see `scripts/lib/print-groups.mjs`): nothing depends on any single card's stored `printGroup` being up to date, since it can always be re-derived from the full set of cards. Still, run it every time a set is added so stale data doesn't linger.
5. `npm run typecheck`
6. Update CLAUDE.md's "Status" line and the "Sets still to do" list.

Run step 4 on its own (no need for steps 1-3, 5, or 6) whenever a card is added or corrected outside the normal per-set pipeline — e.g. a manual fix to one card's `printGroup`.
