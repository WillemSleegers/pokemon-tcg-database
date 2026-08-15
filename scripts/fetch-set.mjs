// Builds data/sets/<CODE>.json for one set, from three sources:
//
//   - github.com/PokemonTCG/pokemon-tcg-data — primary source for game text
//     (attacks, abilities, weaknesses, resistances, rules text, rarity,
//     regulation mark, national Pokédex numbers, card images).
//   - limitlesstcg.com — the only source with the illustrator credit and
//     with the "Int. Prints" table (which printings of a card are legal
//     substitutes for each other in a decklist).
//   - pokeapi.co — species genus/height/weight for the Pokédex info box
//     printed on regular (non-ex/non-MEGA) Pokémon cards. Same data as the
//     game Pokédex, looked up by national dex number rather than scraped
//     per card.
//
//   node scripts/fetch-set.mjs <ptcgDataSetId> <code> [<limitlessUrlCode>] [<sequentialPrefix>]
//   e.g. node scripts/fetch-set.mjs me1 MEG
//
//   <code> is this set's own identity — used for the output filename,
//   data/flavor-text/<code>.json, and the stored set.code/deckCode. Normally
//   this is also the Limitless URL segment (limitlesstcg.com/cards/<code>),
//   but subsets that pokemon-tcg-data splits out as their own set (a Trainer
//   Gallery, Shiny Vault, Galarian Gallery) share their base set's Limitless
//   page instead of having one of their own — pass the base set's Limitless
//   code as <limitlessUrlCode> in that case, e.g.:
//     node scripts/fetch-set.mjs swsh45sv SHFSV SHF
//
//   <sequentialPrefix>, if given, replaces pokemon-tcg-data's own `number`
//   field with `${prefix}${1-based position in the fetched array}` as the
//   local id. Needed for throwback-reprint subsets (e.g. Celebrations:
//   Classic Collection, cel25c) whose `number` is each card's *original*
//   print number from its original set decades ago — not unique within the
//   subset, and unrelated to Limitless's own numbering for it — while the
//   fetched array order does still match Limitless's sequential numbering
//   (verified by spot-checking a few cards' positions against Limitless
//   before trusting this for a new set). e.g.:
//     node scripts/fetch-set.mjs cel25c CELCC CEL CC
//
//   Pass "NONE" as <ptcgDataSetId> for a set pokemon-tcg-data doesn't carry at
//   all — the Mega Evolution promos (MEP) are the first such set. The card list
//   then comes from the Limitless set page, and each card's game text from one
//   of two places:
//
//     - data/sets/, when the card is a reprint of one already in this database
//       (found via the stored printGroup cross-references). Two thirds of MEP
//       is reprints, and this text is pokemon-tcg-data's own, already verified.
//     - Bulbapedia's card page for that print, for the set-exclusives — see
//       lib/bulbapedia-card.mjs.
//
//   Either way the result is cross-checked field by field against the card's
//   Limitless page before being written, and the set's own metadata (name,
//   series, totals, release date) comes from data/set-meta/<code>.json, since
//   there's no pokemon-tcg-data set entry to read it from. e.g.:
//     node scripts/fetch-set.mjs NONE MEP
//
//   Pass --fill-from-limitless when pokemon-tcg-data *has* the set but is
//   behind Limitless on it, which the long-running promo sets drift into —
//   pokemon-tcg-data carries 165 of svp's cards where Limitless catalogues 217.
//   pokemon-tcg-data stays the primary source for every card it does have
//   (nothing already fetched and verified is re-derived from a weaker source);
//   the cards it's missing take the same reprint/Bulbapedia fallback path as a
//   "NONE" run, and the same field-by-field Limitless cross-check. e.g.:
//     node scripts/fetch-set.mjs svp SVP --fill-from-limitless
//
//   Opt-in rather than automatic, because "Limitless lists an id we don't have"
//   is only meaningful when the Limitless page is this set's own — a subset
//   sharing its base set's page (SHFSV under SHF) would otherwise pull in the
//   entire base set.
//
//   Pass "NONE" as <limitlessUrlCode> for a set with no Limitless page at
//   all — confirmed for the McDonald's Collection promo sets (mcd17/18/19),
//   which Limitless never catalogued. This skips the per-card Limitless
//   scrape entirely: artist comes from pokemon-tcg-data's own `artist` field
//   instead, deckCode falls back to "<code> <localId>" (still unique, just
//   not a confirmed real decklist code), and printGroup/limitless are left
//   as empty placeholders — there's no print-group data to put there. e.g.:
//     node scripts/fetch-set.mjs mcd17 MCD17 NONE
//
// Card numbers stay strings — some sets use suffixed numbers (e.g. "68a").

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { fetchCardWikitext, parseCardWikitext } from "./lib/bulbapedia-card.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = resolve(ROOT, "data/sets")

// Manually transcribed via scripts/flavor-text-editor.mjs — no structured
// source has this (see README). Kept separate so re-running this script
// never wipes out what's been typed in.
async function loadFlavorTextOverlay(code) {
  try {
    return JSON.parse(await readFile(resolve(ROOT, "data/flavor-text", `${code}.json`), "utf8"))
  } catch {
    return {}
  }
}

// Cards that print no Pokédex info box for a reason no subtype captures —
// namely, being old enough to predate the convention entirely. The TCG dropped
// the dex line for the e-Card era (Expedition, 2002/09) and didn't bring it
// back until Diamond & Pearl (2007/05), and a promo set can straddle that gap
// card by card (WP's #1–49 print it, its e-Card-era #50–53 don't), so neither a
// subtype check nor a per-set release date can decide this. Confirmed against
// card images and listed by hand here rather than stripped from the output
// after the fact, so a re-fetch doesn't silently reintroduce the field.
// A lone "*" entry means the whole set.
async function loadNoPokedexOverlay(code) {
  try {
    const ids = JSON.parse(await readFile(resolve(ROOT, "data/no-pokedex", `${code}.json`), "utf8"))
    return { all: ids.includes("*"), ids: new Set(ids) }
  } catch {
    return { all: false, ids: new Set() }
  }
}

// Cards Limitless has no page for at all. The "NONE" <limitlessUrlCode> covers
// a set Limitless never catalogued (the McDonald's collections); this covers the
// per-card version of the same gap, which the long-running promo sets have —
// Limitless catalogues 292 of swshp's 304 cards. Listed explicitly, because a
// 404 is also what an id-normalization bug looks like, and silently substituting
// placeholder data for one of those is how phantom deckCodes leaked across a
// dozen set files while adding XYP (see CLAUDE.md).
async function loadNoLimitlessOverlay(code) {
  try {
    return new Set(JSON.parse(await readFile(resolve(ROOT, "data/no-limitless", `${code}.json`), "utf8")))
  } catch {
    return new Set()
  }
}

// Cards that print no rarity symbol at all — confirmed against Bulbapedia's
// own set-list rarity column (a "—" for every card), not assumed from the
// absence of a pokemon-tcg-data field, since that absence is equally what a
// genuine data gap looks like. So far this is whole theme-deck/promo-collection
// sets rather than individual cards (Kalos Starter Set, the McDonald's
// Collections), listed with a lone "*" the same as data/no-pokedex/.
async function loadNoRarityOverlay(code) {
  try {
    const ids = JSON.parse(await readFile(resolve(ROOT, "data/no-rarity", `${code}.json`), "utf8"))
    return { all: ids.includes("*"), ids: new Set(ids) }
  } catch {
    return { all: false, ids: new Set() }
  }
}

// pokemon-tcg-data's rarity field is normally already the title-cased name
// this database stores verbatim ("Rare Holo VMAX"), but Ascended Heroes'
// Mega Attack Rare cards carry the raw upstream constant "MEGA_ATTACK_RARE"
// instead — the one set found so far where that escaped normalization on
// pokemon-tcg-data's own side. Detected structurally (SCREAMING_SNAKE_CASE)
// rather than as a one-off string replacement, so any future set with the
// same upstream slip is caught too.
function normalizeRarity(rarity) {
  if (!/^[A-Z]+(_[A-Z]+)*$/.test(rarity)) return rarity
  return rarity.split("_").map((word) => word[0] + word.slice(1).toLowerCase()).join(" ")
}

const CONCURRENCY = 6
const RETRIES = 3

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith("--")))
const [ptcgDataSetId, limitlessCode, limitlessUrlCodeArg, sequentialPrefix] = args.filter((a) => !a.startsWith("--"))
const noPrimary = ptcgDataSetId === "NONE"
const noLimitless = limitlessUrlCodeArg === "NONE"
const fillFromLimitless = flags.has("--fill-from-limitless")
const limitlessUrlCode = noLimitless ? null : limitlessUrlCodeArg || limitlessCode
if (!ptcgDataSetId || !limitlessCode) {
  console.error(
    "usage: node scripts/fetch-set.mjs <ptcgDataSetId> <code> [<limitlessUrlCode>] [<sequentialPrefix>] [--fill-from-limitless]   e.g. me1 MEG",
  )
  process.exit(1)
}
for (const flag of flags) {
  if (flag !== "--fill-from-limitless") {
    console.error(`unknown flag ${flag}`)
    process.exit(1)
  }
}
if (fillFromLimitless && (noPrimary || noLimitless)) {
  console.error("--fill-from-limitless needs both sources: it fills pokemon-tcg-data's gaps from Limitless")
  process.exit(1)
}
// The flag matches Limitless's ids against pokemon-tcg-data's own `number`
// field to find what's missing; a sequential-prefix run replaces that field
// wholesale, so "which ids do we already have" would compare two unrelated
// numberings.
if (fillFromLimitless && sequentialPrefix) {
  console.error("--fill-from-limitless can't be combined with <sequentialPrefix>")
  process.exit(1)
}

function decodeEntities(s) {
  return s
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .trim()
}
function textOnly(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " "))
}

async function get(url, { json = false, allow404 = false, returnUrl = false } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "pokemon-tcg-database (personal reference dataset)" } })
      if (allow404 && res.status === 404) return null
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = json ? await res.json() : await res.text()
      // fetch() follows redirects transparently, so res.url is the final,
      // canonical URL — not necessarily the one requested. Some Limitless
      // pages (e.g. XY Black Star Promos' "XY7"-style numbers, which keep
      // pokemon-tcg-data's "XY" set-code prefix baked into the number)
      // redirect to a differently-formatted canonical URL ("xyp/7"). Callers
      // that derive a stored id/URL from the request need the post-redirect
      // one, or they'll persist a URL that doesn't match what Limitless
      // itself considers canonical (and that other sets' print-group scrapes
      // already reference) — confirmed while adding XYP, see CLAUDE.md.
      return returnUrl ? { body, url: res.url } : body
    } catch (err) {
      if (attempt > RETRIES) throw new Error(`${url}: ${err instanceof Error ? err.message : err}`)
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt))
    }
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  return results
}

// ---- pokemon-tcg-data (primary) ----------------------------------------

/** @param {string} setId */
async function fetchPrimarySet(setId) {
  /** @type {import("../types/card.js").PrimarySetMeta[]} */
  const allSets = await get("https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json", {
    json: true,
  })
  const setMeta = allSets.find((s) => s.id === setId)
  if (!setMeta) throw new Error(`set "${setId}" not found in pokemon-tcg-data`)
  /** @type {import("../types/card.js").PrimaryCard[]} */
  const cards = await get(`https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${setId}.json`, {
    json: true,
  })
  return { setMeta, cards }
}

// ---- limitlesstcg.com (artist + print groups) --------------------------

// Limitless drops leading zeros from the numeric part of alpha-prefixed card
// numbers — pokemon-tcg-data's "SV001"/"TG01" are Limitless's "SV1"/"TG1".
// Plain numbers and letter-suffixed numbers ("68a") are unaffected. Found
// while adding Shining Fates' Shiny Vault subset (swsh45sv).
function toLimitlessLocalId(localId) {
  const m = localId.match(/^([A-Za-z]+)0*(\d+)$/)
  return m ? `${m[1]}${m[2]}` : localId
}

// Older sets (Sun & Moon on back, at least) that reprint plain basic Energy
// cards sometimes page them on Limitless under a type letter instead of
// pokemon-tcg-data's own sequential number — e.g. Sun & Moon's "Grass Energy"
// is pokemon-tcg-data's #164 but limitlesstcg.com/cards/SUM/G. Not every old
// set does this (Guardians Rising's basic energies stayed numeric, confirmed
// against SVE.json's printGroup cross-references), so this is only a 404
// fallback, not assumed upfront. Confirmed letters via the actual SUM page.
const BASIC_ENERGY_LETTERS = {
  "Grass Energy": "G",
  "Fire Energy": "R",
  "Water Energy": "W",
  "Lightning Energy": "L",
  "Psychic Energy": "P",
  "Fighting Energy": "F",
  "Darkness Energy": "D",
  "Metal Energy": "M",
  "Fairy Energy": "Y",
}

// Limitless titles every card page "<name> - <set name> (<CODE>) #<n> – Limitless".
// Compared on alphanumerics only, since the two sources punctuate names
// differently in places — pokemon-tcg-data's "Unown [J]" vs Limitless's
// "Unown J" — and with the rarity glyphs spelled out, since pokemon-tcg-data
// keeps the printed symbol where Limitless writes the word ("Greninja ★" vs
// "Greninja Star"). Deliberately not a substring/prefix match: this guards a
// fallback that would otherwise attach a different card's artist and print
// group, and "Mew" is a prefix of "Mewtwo".
function limitlessPageIsCard(html, cardName) {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
  if (!title) return false
  const simplify = (s) =>
    decodeEntities(s)
      .replace(/[★☆]/g, "star")
      .replace(/[◇♢]/g, "prismstar")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
  return simplify(title.split(" - ")[0]) === simplify(cardName)
}

// Limitless writes energy costs as a run of single letters in a
// <span class="ptcg-symbol">, e.g. "GGCC" for {G}{G}{C}{C}.
const ENERGY_SYMBOLS = {
  G: "Grass",
  R: "Fire",
  W: "Water",
  L: "Lightning",
  P: "Psychic",
  F: "Fighting",
  D: "Darkness",
  M: "Metal",
  Y: "Fairy",
  N: "Dragon",
  C: "Colorless",
}

// Pulls the printed game text off a Limitless card page. Only used by the
// "NONE" <ptcgDataSetId> mode, as the independent second opinion that every
// fallback-sourced card is checked against — Limitless is a different party
// transcribing the same physical card than either data/sets/ (pokemon-tcg-data)
// or Bulbapedia, so agreement between the two is real evidence, where a single
// source silently disagreeing with the card is exactly the failure mode the
// promo backfills kept turning up.
function parseLimitlessCardText(html) {
  const section = html.match(/<div class="card-text">([\s\S]*?)<div class="card-legality">/)?.[1] ?? ""
  const title = textOnly(section.match(/<p class="card-text-title">([\s\S]*?)<\/p>/)?.[1] ?? "")
  const typeLine = textOnly(section.match(/<p class="card-text-type">([\s\S]*?)<\/p>/)?.[1] ?? "")
  const wrr = textOnly(section.match(/<p class="card-text-wrr">([\s\S]*?)<\/p>/)?.[1] ?? "")

  const attacks = []
  for (const [, block] of section.matchAll(/<div class="card-text-attack">([\s\S]*?)<\/div>/g)) {
    const info = block.match(/<p class="card-text-attack-info">([\s\S]*?)<\/p>/)?.[1] ?? ""
    const symbols = info.match(/<span class="ptcg-symbol">([^<]*)<\/span>/)?.[1]?.trim() ?? ""
    // Everything after the symbol span is "<name> <damage>", with damage
    // optional and always last ("110", "20+", "20×").
    const rest = textOnly(info.replace(/<span class="ptcg-symbol">[\s\S]*?<\/span>/, ""))
    const damage = rest.match(/\s(\d+[+×x]?)$/)?.[1] ?? ""
    attacks.push({
      // An attack that costs no energy is a "0" symbol on Limitless and an
      // empty cost array in pokemon-tcg-data (svp's Cleffa 37, "Grasping
      // Draw"). It's never one symbol among others, so it's its own case
      // rather than a letter to filter out.
      cost:
        symbols === "0"
          ? []
          : [...symbols].map((letter) => {
              const type = ENERGY_SYMBOLS[letter]
              if (!type) throw new Error(`unknown Limitless energy symbol ${JSON.stringify(letter)}`)
              return type
            }),
      name: (damage ? rest.slice(0, -damage.length) : rest).trim(),
      damage,
      text: textOnly(block.match(/<p class="card-text-attack-effect">([\s\S]*?)<\/p>/)?.[1] ?? ""),
    })
  }

  const abilities = []
  for (const [, block] of section.matchAll(/<div class="card-text-ability">([\s\S]*?)<\/div>/g)) {
    abilities.push({
      name: textOnly(block.match(/<p class="card-text-ability-info">([\s\S]*?)<\/p>/)?.[1] ?? "").replace(/^Ability:\s*/, ""),
      text: textOnly(block.match(/<p class="card-text-ability-effect">([\s\S]*?)<\/p>/)?.[1] ?? ""),
    })
  }

  // Trainer cards put their whole printed text in plain sections instead of
  // the attack/ability blocks above.
  const effects = [...section.matchAll(/<div class="card-text-section">([\s\S]*?)<\/div>/g)]
    .filter(([, block]) => !block.includes("card-text-title") && !block.includes("card-text-wrr"))
    .map(([, block]) => textOnly(block))
    .filter(Boolean)

  return {
    name: textOnly(title.match(/^(.*?)\s+-\s+(?:[A-Za-z]+\s+-\s+)?\d+ HP$/)?.[1] ?? title.split(" - ")[0]),
    hp: title.match(/(\d+) HP$/)?.[1] ?? null,
    types: title.match(/\s-\s([A-Za-z]+)\s-\s\d+ HP$/)?.[1] ?? null,
    supertype: typeLine.startsWith("Trainer") ? "Trainer" : "Pokémon",
    // "Pokémon - Stage 1 - Evolves from Bayleef" / "Trainer - Stadium"
    subtype: typeLine.split(" - ")[1]?.trim() ?? null,
    evolvesFrom: typeLine.match(/Evolves from\s+(.*)$/)?.[1]?.trim() ?? null,
    weakness: wrr.match(/Weakness:\s*(.*?)\s*(?:Resistance:|$)/)?.[1]?.trim() ?? null,
    resistance: wrr.match(/Resistance:\s*(.*?)\s*(?:Retreat:|$)/)?.[1]?.trim() ?? null,
    retreat: wrr.match(/Retreat:\s*(\d+)/)?.[1] ?? null,
    attacks,
    abilities,
    effects,
    regulationMark: html.match(/<div class="regulation-mark">\s*([A-Z])\s+Regulation Mark/)?.[1] ?? null,
    imageUrl: html.match(/data-src="(https:\/\/[^"]+\/tpci\/[^"]+\.png)"/)?.[1] ?? null,
  }
}

async function fetchLimitlessExtra(code, localId, cardName) {
  const numericLocalId = toLimitlessLocalId(localId)
  let limitlessLocalId = numericLocalId
  let result = await get(`https://limitlesstcg.com/cards/${code}/${limitlessLocalId}`, { allow404: true, returnUrl: true })
  if (result === null) {
    // Several Black Star Promos sets keep pokemon-tcg-data's set-code prefix
    // baked into the card number itself ("XY67a" for XY Black Star Promos'
    // lettered alt-arts, "DP4" for DP Black Star Promos) where Limitless's own
    // URL is just the number. Plain-numbered ones mostly 301-redirect and are
    // handled by the canonical-URL read below; these 404 outright, so retry
    // with the prefix stripped. Confirmed against xyp's 5 lettered cards
    // (Jirachi XY67a, Yveltal-EX XY150a, Karen XY177a, M Camerupt-EX XY198a,
    // M Sharpedo-EX XY200a) and against dpp, whose every card 404s this way.
    //
    // Guarded on the retrieved page's own card name, because this pattern
    // ("letters then digits") is also what a legitimate subset id looks like
    // (TG01, SV001, GG01) — without the check, a subset id that 404s for a
    // real reason would silently resolve to whatever unrelated card sits at
    // that bare number in the base set, instead of raising.
    const unprefixed = limitlessLocalId.match(/^[A-Za-z]+(\d+[a-z]?)$/)?.[1]
    if (unprefixed) {
      const retry = await get(`https://limitlesstcg.com/cards/${code}/${unprefixed}`, { allow404: true, returnUrl: true })
      if (retry !== null && limitlessPageIsCard(retry.body, cardName)) {
        result = retry
        limitlessLocalId = unprefixed
      }
    }
  }
  if (result === null) {
    const letter = BASIC_ENERGY_LETTERS[cardName]
    if (!letter) throw new Error(`https://limitlesstcg.com/cards/${code}/${limitlessLocalId}: HTTP 404`)
    limitlessLocalId = letter
    result = await get(`https://limitlesstcg.com/cards/${code}/${limitlessLocalId}`, { returnUrl: true })
  }
  const html = result.body
  // The un-suffixed XY Black Star Promos numbers ("XY7") don't 404 — they
  // redirect straight to Limitless's differently-formatted canonical URL
  // ("xyp/7"). Read the localId back off the post-redirect URL so the
  // stored id/deckCode/url match what Limitless (and every other set's
  // print-group scrape) actually considers canonical, rather than silently
  // persisting the pre-redirect request. Confirmed while adding XYP: without
  // this, its own cards' deckCodes ("XYP XY7") didn't match the "XYP 7"
  // already recorded in CELCC's printGroup for the same physical card.
  const canonicalMatch = result.url.match(/\/cards\/[^/]+\/([^/?#]+)\/?$/)
  if (canonicalMatch) limitlessLocalId = canonicalMatch[1]

  const idMatch = html.match(/<!-- CARD ID (\d+) -->/)

  const artistMatch = html.match(/Illustrated by[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)

  const printGroup = []
  const tableMatch = html.match(/<table class="card-prints-versions">([\s\S]*?)<\/table>/)
  if (tableMatch) {
    const intPrintsOnly = tableMatch[1].split("JP. Prints")[0]
    for (const [, cls, row] of intPrintsOnly.matchAll(/<tr\s*(class="current")?\s*>([\s\S]*?)<\/tr>/g)) {
      if (!row.includes("prints-table-card-number")) continue
      const href = row.match(/href="\/cards\/([A-Za-z0-9]+)\/([0-9a-zA-Z]+)"/)
      if (href) printGroup.push(`${href[1]} ${href[2]}`)
      else if (cls) printGroup.push(`${code} ${limitlessLocalId}`)
    }
  }

  if (!idMatch) {
    throw new Error(`https://limitlesstcg.com/cards/${code}/${limitlessLocalId}: no <!-- CARD ID --> comment found`)
  }
  const deckCode = `${code} ${limitlessLocalId}`
  const dedupedPrintGroup = [...new Set(printGroup)]
  return {
    resolvedLocalId: limitlessLocalId,
    limitless: {
      id: Number(idMatch[1]),
      url: `https://limitlesstcg.com/cards/${code}/${limitlessLocalId}`,
      deckCode,
      printGroup: dedupedPrintGroup.length ? dedupedPrintGroup : [deckCode],
    },
    artist: artistMatch ? textOnly(artistMatch[1]) : null,
    // Only read in the "NONE" <ptcgDataSetId> mode; parsing it costs one regex
    // pass over HTML already in hand, so it isn't worth making conditional.
    // Wrapped because the parse failures worth debugging are all "this one
    // card's page is shaped unexpectedly", and the raw error says nothing
    // about which of a few hundred pages that was.
    text: (() => {
      try {
        return parseLimitlessCardText(html)
      } catch (err) {
        throw new Error(
          `https://limitlesstcg.com/cards/${code}/${limitlessLocalId} (${cardName}): ${err instanceof Error ? err.message : err}`,
        )
      }
    })(),
  }
}

// ---- fallback primary, for sets pokemon-tcg-data doesn't carry -----------
//
// Reached only with "NONE" as <ptcgDataSetId>. Everything here exists to
// produce the same PrimaryCard[] shape fetchPrimarySet returns, so that
// assembly in main() — overlays, deckCode, print groups, the Pokédex box —
// stays a single code path with no idea where the cards came from.

// The set's own metadata, which normally comes from pokemon-tcg-data's
// sets/en.json entry. Hand-written per set, because these are judgement calls
// (an ongoing promo set has no real "printed total") rather than lookups.
async function loadSetMetaOverride(code) {
  const path = resolve(ROOT, "data/set-meta", `${code}.json`)
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch {
    throw new Error(`"NONE" <ptcgDataSetId> needs set metadata in data/set-meta/${code}.json`)
  }
}

// Which cards are in the set at all. Limitless is the authority here, the same
// as it is for this database's set codes — its set page links each card it
// catalogues, and a card it doesn't catalogue has no deckCode or print group
// to record anyway.
async function fetchLimitlessSetIndex(urlCode) {
  const html = await get(`https://limitlesstcg.com/cards/${urlCode}`)
  const ids = new Set()
  for (const [, id] of html.matchAll(new RegExp(`href="/cards/${urlCode}/([0-9a-zA-Z]+)"`, "g"))) ids.add(id)
  if (!ids.size) throw new Error(`no cards found on https://limitlesstcg.com/cards/${urlCode}`)
  return [...ids]
}

// Card names, and with them the Bulbapedia page title of each print. A set
// list's {{TCG ID|MEP Promo|Meganium|1}} entries spell out exactly the title
// its card page lives at ("Meganium (MEP Promo 1)"), which beats guessing at
// one from the card name.
async function fetchBulbapediaSetList(pageTitle) {
  const wikitext = await get(
    `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(pageTitle.replace(/ /g, "_"))}&action=raw`,
  )
  const byLocalId = new Map()
  // How Bulbapedia names this set inside a card-page title ("SVP Promo", from
  // "Sprigatito (SVP Promo 1)"). Read off the entries rather than derived from
  // the page title, which is the longer "SVP Black Star Promos (TCG)". Used to
  // recognize a redirect that points back into this same set.
  let setPrefix = null
  for (const [, inner] of wikitext.matchAll(/\{\{Setlist\/entry\|([\s\S]*?)\n?\}\}/g)) {
    // One entry can list several variants of the same card (staff stamp,
    // Pokémon Center print); they share a name and number, so the first wins.
    const id = inner.match(/\{\{TCG ID\|([^|}]+)\|([^|}]+)\|([^|}]+)/)
    if (id) {
      setPrefix ??= id[1].trim()
      byLocalId.set(id[3].trim(), { name: id[2].trim(), title: `${id[2].trim()} (${id[1].trim()} ${id[3].trim()})` })
      continue
    }
    // Not every row uses the template — some are written as a plain wiki-link
    // to the same page it would have generated ("[[Kyogre ex (SVP Promo 178)|
    // Kyogre]]"), which carries the title outright. Found on three of svp's
    // Azure Legends Tins promos.
    const link = inner.match(/\[\[((.+?) \(.+? ([0-9a-zA-Z]+)\))(?:\|[^\]]*)?\]\]/)
    if (link) byLocalId.set(link[3].trim(), { name: link[2].trim(), title: link[1].trim() })
  }
  if (!byLocalId.size) throw new Error(`no {{Setlist/entry}} rows on Bulbapedia page "${pageTitle}"`)
  return { byLocalId, setPrefix }
}

// Every card already in data/sets/ that some card's printGroup ties to this
// set, keyed by the localId it has *here*. A promo that reprints an existing
// card is the same card by definition — that's what a shared print group
// means — so its game text is already in this database, sourced from
// pokemon-tcg-data and verified when that set was added.
async function buildReprintIndex(code) {
  const index = new Map()
  // Every card in this database by its own deckCode, so a print group scraped
  // fresh from Limitless can be resolved to text already here. Needed because
  // `index` only finds a reprint whose *source* set already knew about this
  // print — and a set fetched before this promo existed doesn't (a stored
  // printGroup is a snapshot; see CLAUDE.md "printGroup goes stale").
  const byDeckCode = new Map()
  // Every card by "<set name> <localId>", the form a Bulbapedia card-page
  // redirect names its target in ("Eevee (Stellar Crown 113)").
  const bySetNameAndLocalId = new Map()
  for (const file of await readdir(OUT_DIR)) {
    // Skip this set's own file: a re-run would otherwise match every card
    // against the copy of itself written by the previous run.
    if (!file.endsWith(".json") || file === `${code}.json`) continue
    /** @type {import("../types/card.js").CardSet} */
    const set = JSON.parse(await readFile(resolve(OUT_DIR, file), "utf8"))
    for (const card of set.cards) {
      const entry = { card, source: `${set.set.code} ${card.localId}` }
      bySetNameAndLocalId.set(`${set.set.name} ${card.localId}`, entry)
      // limitless is null when Limitless has no page for this card — no
      // deckCode/printGroup to index then, and a shared "no deckCode" key
      // would wrongly match every such card to each other.
      if (!card.limitless) continue
      byDeckCode.set(card.limitless.deckCode, entry)
      for (const print of card.limitless.printGroup) {
        const [printCode, printLocalId] = print.split(" ")
        if (printCode === code && !index.has(printLocalId)) {
          index.set(printLocalId, entry)
        }
      }
    }
  }
  return { index, byDeckCode, bySetNameAndLocalId }
}

/**
 * @param {import("../types/card.js").Card} card
 * @returns {import("../types/card.js").PrimaryCard}
 */
function cardToPrimary(card, localId, rarity) {
  /** @type {import("../types/card.js").PrimaryCard} */
  const primary = {
    number: localId,
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes,
    weaknesses: card.weaknesses,
    resistances: card.resistances,
    // Not copied from the source print: rarity (a reprint is its own rarity —
    // for a promo, always the set's), artist and images (this print has its
    // own art, often by a different illustrator), regulationMark (can differ
    // between prints, so it's read off this print's Limitless page), and
    // printGroup/deckCode (recomputed for this card).
    rarity,
  }
  if (card.evolvesFrom) primary.evolvesFrom = card.evolvesFrom
  if (card.evolvesTo) primary.evolvesTo = card.evolvesTo
  if (card.types) primary.types = card.types
  if (card.hp !== undefined) primary.hp = String(card.hp)
  if (card.rules) primary.rules = card.rules
  if (card.abilities) primary.abilities = card.abilities
  if (card.attacks) primary.attacks = card.attacks
  if (card.retreatCost !== undefined) primary.convertedRetreatCost = card.retreatCost
  if (card.pokedex) primary.nationalPokedexNumbers = [card.pokedex.number]
  if (card.flavorText) primary.flavorText = card.flavorText
  return primary
}

// The fallback assembly itself, for a given list of local ids: reprint text
// from data/sets/ where the card already exists in this database, Bulbapedia's
// card page for that print otherwise. Split out from buildFallbackPrimarySet so
// --fill-from-limitless can run it over just the ids pokemon-tcg-data is
// missing, rather than the whole set.
/**
 * cardToPrimary's counterpart for a source print that's still in
 * pokemon-tcg-data's own PrimaryCard shape rather than stored in data/sets/ —
 * a reprint of a card in this very set, which the fill path has in hand.
 * Drops the same print-specific fields cardToPrimary declines to copy.
 * @param {import("../types/card.js").PrimaryCard} primary
 * @returns {import("../types/card.js").PrimaryCard}
 */
function reprintPrimary(primary, localId, rarity) {
  const { artist, images, regulationMark, ...rest } = primary
  return { ...rest, number: localId, rarity }
}

async function buildFallbackCards(code, limitlessUrlCode, localIds, meta, existingByLocalId = new Map()) {
  const [{ byLocalId: bulbapediaSetList, setPrefix }, { index: reprints, byDeckCode, bySetNameAndLocalId }] = await Promise.all([
    fetchBulbapediaSetList(meta.bulbapediaSetPage),
    buildReprintIndex(code),
  ])
  const reprintCount = localIds.filter((id) => reprints.has(id)).length
  console.log(`Building ${localIds.length} card(s) from fallback sources; ${reprintCount} are reprints already in data/sets/.`)

  const trainerEffectsByLocalId = new Map()
  const cards = await mapWithConcurrency(localIds, CONCURRENCY, async (localId) => {
    const reprint = reprints.get(localId)
    if (reprint) return cardToPrimary(reprint.card, localId, meta.defaultRarity)

    const listed = bulbapediaSetList.get(localId)
    // Second try at the reprint path, for a card whose earlier print is in
    // this database but whose set was fetched before this print existed. Its
    // own Limitless page lists the full prints history, so it names the
    // sibling even when the sibling's stored copy doesn't name it back.
    const siblings = await fetchLimitlessExtra(limitlessUrlCode, localId, listed?.name ?? "")
    const sibling = siblings.limitless.printGroup.map((print) => byDeckCode.get(print)).find(Boolean)
    if (sibling) {
      console.log(`  ${code} ${localId}: reusing ${sibling.source} (same print group, not yet in its stored printGroup)`)
      return cardToPrimary(sibling.card, localId, meta.defaultRarity)
    }

    if (!listed) throw new Error(`no Bulbapedia set-list entry for ${code} ${localId} — can't find its card page`)
    // Not destructured: the return is a discriminated union (wikitext xor
    // redirect), and destructuring drops the correlation between the two.
    const page = await fetchCardWikitext(listed.title)
    // Third try at the reprint path. A redirect means Bulbapedia has no page
    // for this print because it's a reprint, and the target names the print it
    // reprints ("Eevee (Stellar Crown 113)") — so if that set is in this
    // database, use its pokemon-tcg-data-sourced text rather than parsing
    // Bulbapedia at all. Reached when Limitless hasn't grouped the two prints
    // either (svp's Eevee 200 lists no sibling print), so neither earlier tier
    // finds it.
    if (page.redirect !== null) {
      const target = page.redirect.match(/^(.*) \((.+) ([0-9a-zA-Z]+)\)$/)
      // A promo set reprints itself too — svp's Paradise Resort 224 redirects
      // to its own 45. That print isn't in data/sets/ under this set's name
      // (the reprint index skips this set's own file, so a re-run can't feed
      // on its own previous output), but a --fill-from-limitless run has
      // pokemon-tcg-data's copy of it right here.
      if (target && target[2] === setPrefix) {
        const self = existingByLocalId.get(target[3])
        if (!self) {
          throw new Error(`Bulbapedia "${listed.title}" redirects to "${page.redirect}", which isn't among this set's own cards`)
        }
        console.log(`  ${code} ${localId}: reusing this set's own ${target[3]} (Bulbapedia redirects this print to it)`)
        return reprintPrimary(self, localId, meta.defaultRarity)
      }
      const source = target && bySetNameAndLocalId.get(`${target[2]} ${target[3]}`)
      if (!source) {
        throw new Error(
          `Bulbapedia "${listed.title}" redirects to "${page.redirect}", a print not in data/sets/ — add that set first`,
        )
      }
      console.log(`  ${code} ${localId}: reusing ${source.source} (Bulbapedia redirects this print to it)`)
      return cardToPrimary(source.card, localId, meta.defaultRarity)
    }
    const { primary, trainerEffects } = parseCardWikitext(page.wikitext)
    primary.number = localId
    primary.rarity = meta.defaultRarity
    if (trainerEffects.length) trainerEffectsByLocalId.set(localId, trainerEffects)
    return primary
  })
  return { cards, trainerEffectsByLocalId }
}

// The cards Limitless catalogues that pokemon-tcg-data doesn't have yet, built
// the same way a "NONE" run builds the whole set. Only the *gap* goes through
// the fallback — every card pokemon-tcg-data does carry keeps its existing,
// already-verified text, so this can't quietly downgrade a finished set.
async function buildFillCards(code, limitlessUrlCode, primaryCards) {
  const meta = await loadSetMetaOverride(code)
  // pokemon-tcg-data's number can carry a set-code prefix Limitless's id
  // doesn't ("SWSH074" vs "74"), the same normalization fetchLimitlessExtra
  // applies per card — compare on Limitless's own form so an id we already
  // have isn't mistaken for a missing one.
  const have = new Set(primaryCards.map((c) => toLimitlessLocalId(c.number)))
  const localIds = (await fetchLimitlessSetIndex(limitlessUrlCode)).filter((id) => !have.has(id))
  localIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  if (!localIds.length) {
    console.log(`Limitless has no cards beyond pokemon-tcg-data's ${primaryCards.length}.`)
    return { cards: [], trainerEffectsByLocalId: new Map() }
  }
  console.log(`Limitless has ${localIds.length} card(s) pokemon-tcg-data doesn't: ${localIds.join(", ")}`)
  return buildFallbackCards(code, limitlessUrlCode, localIds, meta, new Map(primaryCards.map((c) => [c.number, c])))
}

async function buildFallbackPrimarySet(code, limitlessUrlCode) {
  const meta = await loadSetMetaOverride(code)
  const localIds = await fetchLimitlessSetIndex(limitlessUrlCode)
  localIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  console.log(`Limitless lists ${localIds.length} cards.`)
  const { cards, trainerEffectsByLocalId } = await buildFallbackCards(code, limitlessUrlCode, localIds, meta)

  /** @type {import("../types/card.js").PrimarySetMeta} */
  const setMeta = {
    id: code,
    name: meta.name,
    series: meta.series,
    printedTotal: meta.printedTotal,
    total: cards.length,
    releaseDate: meta.releaseDate,
    images: meta.images ?? undefined,
  }
  return { setMeta, cards, trainerEffectsByLocalId, numberPad: meta.numberPad }
}

// The fallback sources agreeing with Limitless is what makes them trustworthy
// here, so disagreement is a hard failure rather than a warning. Compares the
// structured fields only: free text (attack effects, Trainer rules) is where
// the two render the same card differently on purpose — Limitless writes energy
// symbols as "[G]" where this database spells out "Grass" — so comparing it
// would be all false alarms. Attack names, costs and damage cover the same
// ground without that problem.
function limitlessMismatches(primary, text) {
  const problems = []
  const check = (field, ours, theirs) => {
    if (String(ours ?? "") !== String(theirs ?? "")) {
      problems.push(`${field}: ${JSON.stringify(ours ?? null)} vs Limitless ${JSON.stringify(theirs ?? null)}`)
    }
  }
  const noneToNull = (v) => (v && v !== "none" ? v : null)

  check("name", primary.name, text.name)
  check("supertype", primary.supertype, text.supertype)
  check("hp", primary.hp, text.hp)
  check("types", primary.types?.[0], text.types)
  check("evolvesFrom", primary.evolvesFrom, text.evolvesFrom)
  check("weakness", primary.weaknesses?.[0]?.type, noneToNull(text.weakness))
  check("resistance", primary.resistances?.[0]?.type, noneToNull(text.resistance))
  if (primary.supertype === "Pokémon") check("retreatCost", primary.convertedRetreatCost ?? 0, Number(text.retreat ?? 0))
  // Limitless names one subtype (the evolution stage, or the Trainer kind);
  // this database also records rarity mechanics like MEGA/ex alongside it.
  if (text.subtype && !primary.subtypes?.includes(text.subtype)) {
    problems.push(`subtypes: ${JSON.stringify(primary.subtypes)} doesn't include Limitless's ${JSON.stringify(text.subtype)}`)
  }

  const ours = primary.attacks ?? []
  check("attack count", ours.length, text.attacks.length)
  for (const [i, attack] of ours.entries()) {
    const theirs = text.attacks[i]
    if (!theirs) break
    check(`attack ${i + 1} name`, attack.name, theirs.name)
    check(`attack ${i + 1} damage`, attack.damage, theirs.damage)
    check(`attack ${i + 1} cost`, attack.cost.join(""), theirs.cost.join(""))
  }
  const ourAbilities = primary.abilities ?? []
  // Limitless renders a Tera Pokémon's "prevent all damage on the Bench" rule
  // box as an ability named "Tera"; pokemon-tcg-data models it as a `Tera`
  // subtype plus a `rules` entry, with `abilities` left for real abilities
  // only. Neither is wrong, so drop it before comparing rather than reporting
  // every Tera card in the set.
  const theirAbilities = text.abilities.filter((a) => a.name !== "Tera")
  check("ability count", ourAbilities.length, theirAbilities.length)
  for (const [i, ability] of ourAbilities.entries()) {
    if (theirAbilities[i]) check(`ability ${i + 1} name`, ability.name, theirAbilities[i].name)
  }
  return problems
}

// A Bulbapedia card page covers every print of that card, so a card reprinted
// across eras carries one {{TCGTrainerText}} block per wording. Limitless's
// page is per-print, so it says which one this print actually shows.
function resolveTrainerRules(trainerEffects, text) {
  const printed = normalizeForCompare(text.effects.join(" "))
  const match = trainerEffects.find((candidate) => printed.startsWith(normalizeForCompare(candidate.rules[0])))
  if (!match) {
    throw new Error(
      `none of Bulbapedia's ${trainerEffects.length} Trainer text variants match Limitless's printed text:\n` +
        `  Limitless: ${text.effects.join(" ")}\n` +
        trainerEffects.map((c) => `  ${c.print || "(unlabelled)"}: ${c.rules[0]}`).join("\n"),
    )
  }
  return match.rules
}

function normalizeForCompare(s) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

// ---- pokeapi.co (species Pokédex info) ----------------------------------

const pokedexCache = new Map()

function cmToFeetInches(cm) {
  let totalInches = Math.round(cm / 2.54)
  let feet = Math.floor(totalInches / 12)
  let inches = totalInches % 12
  return `${feet}'${inches}"`
}

async function fetchPokedexInfo(dexNumber) {
  if (pokedexCache.has(dexNumber)) return pokedexCache.get(dexNumber)
  const promise = (async () => {
    const [species, pokemon] = await Promise.all([
      get(`https://pokeapi.co/api/v2/pokemon-species/${dexNumber}`, { json: true }),
      get(`https://pokeapi.co/api/v2/pokemon/${dexNumber}`, { json: true }),
    ])
    const genus = species.genera.find((g) => g.language.name === "en")?.genus ?? null
    return {
      number: dexNumber,
      genus,
      height: cmToFeetInches(pokemon.height * 10),
      weight: `${(pokemon.weight / 10 / 0.45359237).toFixed(1)} lbs`,
    }
  })()
  pokedexCache.set(dexNumber, promise)
  return promise
}

// ---- assembly -------------------------------------------------------------

function buildNumber(localId, printedTotal, numberPad) {
  const n = Number(localId)
  if (!Number.isInteger(n)) return localId // suffixed numbers (e.g. "68a") stay as-is
  // A promo prints a bare padded number with no denominator ("MEP 046"), the
  // same as the SWSH/XY promo sets already store ("SWSH001", "XY01") — those
  // just get it for free from pokemon-tcg-data's own prefixed number field.
  if (numberPad) return String(n).padStart(numberPad, "0")
  return `${String(n).padStart(String(printedTotal).length, "0")}/${printedTotal}`
}

async function main() {
  let setMeta, primaryCards, trainerEffectsByLocalId = new Map(), numberPad
  // Which cards didn't come from pokemon-tcg-data, and so need the fallback
  // sources' extra handling below (Limitless-sourced images/regulation mark,
  // Trainer text resolution, and the cross-check that makes them trustworthy).
  // A whole-set "NONE" run is just the case where that's every card.
  const fallbackLocalIds = new Set()
  if (noPrimary) {
    console.log(`No pokemon-tcg-data set for ${limitlessCode} — building from data/sets/ reprints + Bulbapedia...`)
    ;({ setMeta, cards: primaryCards, trainerEffectsByLocalId, numberPad } = await buildFallbackPrimarySet(limitlessCode, limitlessUrlCode))
  } else {
    console.log(`Fetching ${ptcgDataSetId} from pokemon-tcg-data...`)
    ;({ setMeta, cards: primaryCards } = await fetchPrimarySet(ptcgDataSetId))
    if (fillFromLimitless) {
      const fill = await buildFillCards(limitlessCode, limitlessUrlCode, primaryCards)
      trainerEffectsByLocalId = fill.trainerEffectsByLocalId
      for (const card of fill.cards) fallbackLocalIds.add(card.number)
      primaryCards = [...primaryCards, ...fill.cards]
      // sets/en.json's own total counts what pokemon-tcg-data has, which is the
      // number this run just went past. printedTotal is the number printed on
      // the cards and stays as-is (a promo set's is a denominator that stopped
      // matching reality long ago — svp prints "/102" on card 165).
      setMeta = { ...setMeta, total: primaryCards.length }
    }
  }
  // A set with a genuinely non-unique/non-sequential `number` field (Classic
  // Collection's throwback reprints) needs the <sequentialPrefix> argument,
  // which overrides `number` entirely (see below) — so it's exempt from this
  // check. Every other set's `number` is supposed to be unique, and a
  // duplicate here means one card's data will silently overwrite another's at
  // the same localId. Found in BLK: pokemon-tcg-data's own Antique Cover
  // Fossil record has `id: zsv10pt5-80` and images pointing at 80.png, but its
  // `number` field wrongly says "60" — the same slot as Escavalier — so it
  // clobbered Escavalier's entry and left 80 missing. Also catches
  // --fill-from-limitless combining fill.cards with primaryCards under a
  // mismatched id (Limitless numbers a card differently than pokemon-tcg-data
  // expected; check toLimitlessLocalId()).
  if (!sequentialPrefix) {
    const ids = primaryCards.map((c) => c.number)
    const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
    if (duplicates.length) {
      throw new Error(
        `duplicate card number(s) in source data: ${duplicates.join(", ")}\n` +
          `Check each duplicate's "id"/"images" fields against its "number" field — a wrong ` +
          `"number" silently overwrites one card with another at the same localId.`,
      )
    }
  }
  const sourceMismatches = []
  const flavorTextOverlay = await loadFlavorTextOverlay(limitlessCode)
  const noPokedex = await loadNoPokedexOverlay(limitlessCode)
  const noLimitlessCards = await loadNoLimitlessOverlay(limitlessCode)
  const noRarity = await loadNoRarityOverlay(limitlessCode)
  const missingFromLimitless = []
  console.log(`Found ${primaryCards.length} cards. Fetching per-card data from Limitless + PokeAPI...`)

  let done = 0
  // mapWithConcurrency isn't itself typed (it's a generic helper with no
  // JSDoc @template), so the PrimaryCard[] type of primaryCards wouldn't
  // otherwise flow through to this callback's parameter — annotate it
  // directly so primary.* below is actually checked against pokemon-tcg-data's
  // shape, not silently `any`.
  const cards = await mapWithConcurrency(primaryCards, CONCURRENCY, async (/** @type {import("../types/card.js").PrimaryCard} */ primary, /** @type {number} */ index) => {
    const localId = sequentialPrefix ? `${sequentialPrefix}${index + 1}` : primary.number
    const [extra, pokedex] = await Promise.all([
      noLimitless || noLimitlessCards.has(localId)
        ? Promise.resolve({ resolvedLocalId: null, limitless: null, artist: primary.artist ?? null, text: null })
        : fetchLimitlessExtra(limitlessUrlCode, localId, primary.name).catch((err) => {
            // A 404 that survives every id-normalization fallback means
            // Limitless genuinely has no page for this card — which does
            // happen (it catalogues 292 of swshp's 304 cards). Collect these
            // rather than aborting on the first one, so a single run reports
            // the whole list; the run still fails, since the alternative is
            // silently persisting placeholder artist/printGroup data for a
            // card whose 404 might just as easily be an id bug (see the DPP
            // and XYP set-code-prefix cases above).
            if (!/HTTP 404$/.test(err.message)) throw err
            missingFromLimitless.push(localId)
            return { resolvedLocalId: null, limitless: null, artist: primary.artist ?? null, text: null }
          }),
      // Only regular Pokémon print the dex info box — every rarity mechanic
      // that gets its own oversized name treatment or rule box (MEGA, V
      // family, old-style "EX"/modern "ex", "GX", "Star", "Level-Up"/LV.X,
      // "Prime", "BREAK") uses that space for something else instead.
      // Confirmed against card images while adding Celebrations: Classic
      // Collection, whose 25-year span of reprints exercises rarities the
      // rest of this database hasn't touched — see CLAUDE.md Status. BREAK
      // confirmed separately while adding BREAKthrough (xy8): its full-art
      // layout uses the dex-box space for the "BREAK Evolution Rule" text
      // instead.
      primary.supertype === "Pokémon" &&
      primary.nationalPokedexNumbers?.length &&
      !(noPokedex.all || noPokedex.ids.has(localId)) &&
      !primary.subtypes?.some((s) =>
        ["ex", "MEGA", "V", "VMAX", "VSTAR", "V-UNION", "EX", "GX", "Star", "Level-Up", "Prime", "BREAK"].includes(s),
      )
        ? fetchPokedexInfo(primary.nationalPokedexNumbers[0])
        : null,
    ])

    // Typed as Card from the start (via an `any` bridge) rather than left to
    // infer from this initial literal — the fields below are filled in
    // incrementally, and a narrower inferred type would reject those later
    // assignments. This still catches typo'd property names and wrong value
    // types on every assignment against types/card.ts.
    // With no pokemon-tcg-data behind the card, the Limitless page is the only
    // per-print source for these two — a reprint's source card in data/sets/
    // has the *other* print's art and can have a different regulation mark.
    if (noPrimary || fallbackLocalIds.has(localId)) {
      // Every field below comes off the Limitless page, and so does the check
      // that the fallback source got the card right — a card Limitless has no
      // page for has neither, and there's no pokemon-tcg-data to fall back to.
      // (Unreachable for a --fill-from-limitless card, whose id came off the
      // Limitless set index in the first place.)
      if (!extra.text) throw new Error(`${localId} has no Limitless page, which fallback-sourced cards depend on`)
      primary.regulationMark = extra.text.regulationMark ?? undefined
      if (extra.text.imageUrl) {
        // Limitless serves two sizes; the "_LG"-suffixed file is the smaller
        // (460×640) of the two, and the unsuffixed one the full 736×1024.
        const large = extra.text.imageUrl.replace(/_LG\.png$/, ".png")
        primary.images = { small: large.replace(/\.png$/, "_LG.png"), large }
      }
      if (trainerEffectsByLocalId.has(localId)) primary.rules = resolveTrainerRules(trainerEffectsByLocalId.get(localId), extra.text)
      const problems = limitlessMismatches(primary, extra.text)
      if (problems.length) sourceMismatches.push(`  ${localId} ${primary.name}:\n${problems.map((p) => `    ${p}`).join("\n")}`)
    }

    const card = /** @type {import("../types/card.js").Card} */ (/** @type {any} */ ({
      number: buildNumber(localId, setMeta.printedTotal, numberPad),
      localId,
      name: primary.name,
      supertype: primary.supertype,
      subtypes: primary.subtypes ?? [],
    }))
    if (primary.evolvesFrom) card.evolvesFrom = primary.evolvesFrom
    if (primary.evolvesTo) card.evolvesTo = primary.evolvesTo
    if (primary.types) card.types = primary.types
    if (primary.hp) card.hp = Number(primary.hp)
    if (primary.rules) card.rules = primary.rules
    if (primary.abilities) card.abilities = primary.abilities
    if (primary.attacks) card.attacks = primary.attacks
    card.weaknesses = primary.weaknesses ?? []
    card.resistances = primary.resistances ?? []
    if (primary.convertedRetreatCost !== undefined) card.retreatCost = primary.convertedRetreatCost
    card.regulationMark = primary.regulationMark ?? null
    if (primary.rarity) {
      card.rarity = normalizeRarity(primary.rarity)
    } else if (noRarity.all || noRarity.ids.has(localId)) {
      card.rarity = "None"
    } else {
      throw new Error(
        `${localId} ${primary.name} has no rarity from any source — if the physical card genuinely ` +
          `prints no rarity symbol (confirm against Bulbapedia's own set-list rarity column, not just ` +
          `this field's absence), add it to data/no-rarity/${limitlessCode}.json`,
      )
    }
    card.artist = extra.artist
    if (pokedex) card.pokedex = pokedex
    // pokemon-tcg-data already carries flavor text for older sets (it's the
    // community having caught up since release) — trust it as a starting
    // point, but let the manual overlay override it for any gaps or fixes.
    if (primary.flavorText) card.flavorText = primary.flavorText
    if (flavorTextOverlay[localId]) card.flavorText = flavorTextOverlay[localId]
    // buildNumber() above still denominates against setMeta.printedTotal
    // unconditionally, because that's what's literally printed on the card
    // (svp prints "165/102" for real). But treating everything past that as
    // a "secret rare" would be wrong for --fill-from-limitless sets
    // specifically: that mode exists exactly because the source's own total
    // has already fallen behind the real count, so its printedTotal isn't a
    // meaningful secret-rare threshold anymore — same "no real printedTotal"
    // treatment MEP's NONE mode already gives an ongoing promo set (see
    // CLAUDE.md). Found on svp: 123 of 225 numbered cards were coming out
    // secret:true off a printedTotal (102) more than a hundred cards stale.
    card.secret = fillFromLimitless ? false : Number(localId) > setMeta.printedTotal
    // null whenever the Limitless scrape was skipped — either for the whole
    // set ("NONE") or for a single card Limitless has no page for. Never
    // synthesize a deckCode/printGroup here: a placeholder would falsely
    // claim print-group knowledge this database doesn't have, and (if shared
    // across cards) wrongly union unrelated ones into one fake print group
    // (found while adding the McDonald's Collections — see CLAUDE.md).
    card.limitless = extra.limitless
    if (primary.images) card.images = primary.images

    done++
    if (done % 20 === 0 || done === primaryCards.length) console.log(`  ${done}/${primaryCards.length}`)
    return card
  })

  cards.sort((a, b) => a.localId.localeCompare(b.localId, undefined, { numeric: true }))

  /** @type {import("../types/card.js").CardSet} */
  const out = {
    set: {
      code: limitlessCode,
      ptcgDataId: noPrimary ? null : setMeta.id,
      name: setMeta.name,
      series: setMeta.series,
      printedTotal: setMeta.printedTotal,
      // See the matching card.secret comment above — a --fill-from-limitless
      // set's printedTotal is a stale printed denominator, not a real
      // secret-rare threshold, so it can't be subtracted from total here.
      secretTotal: fillFromLimitless ? 0 : setMeta.total - setMeta.printedTotal,
      total: setMeta.total,
      releaseDate: setMeta.releaseDate.replace(/\//g, "-"),
      // The year matches the set's release year for original artwork; sets
      // that reuse older art could vary, but that's not the case here —
      // confirmed against sample card images from this set.
      copyright: `©${setMeta.releaseDate.slice(0, 4)} Pokémon / Nintendo / Creatures / GAME FREAK`,
      images: setMeta.images ?? null,
    },
    cards,
  }

  if (sourceMismatches.length) {
    throw new Error(
      `${sourceMismatches.length} card(s) where the fallback source and Limitless disagree:\n${sourceMismatches.join("\n")}\n` +
        `Check each against the card image before trusting either side.`,
    )
  }

  if (missingFromLimitless.length) {
    throw new Error(
      `Limitless has no page for ${missingFromLimitless.length} card(s):\n` +
        `  ${missingFromLimitless.join(", ")}\n` +
        `Confirm each is genuinely absent (not an id-normalization bug — check\n` +
        `limitlesstcg.com/cards/${limitlessUrlCode} yourself), then list them in\n` +
        `data/no-limitless/${limitlessCode}.json and re-run.`,
    )
  }

  await mkdir(OUT_DIR, { recursive: true })
  const outPath = resolve(OUT_DIR, `${limitlessCode}.json`)
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n")
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
