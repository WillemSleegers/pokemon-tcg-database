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

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

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

const CONCURRENCY = 6
const RETRIES = 3

const [ptcgDataSetId, limitlessCode, limitlessUrlCodeArg, sequentialPrefix] = process.argv.slice(2)
const noLimitless = limitlessUrlCodeArg === "NONE"
const limitlessUrlCode = noLimitless ? null : limitlessUrlCodeArg || limitlessCode
if (!ptcgDataSetId || !limitlessCode) {
  console.error("usage: node scripts/fetch-set.mjs <ptcgDataSetId> <code> [<limitlessUrlCode>] [<sequentialPrefix>]   e.g. me1 MEG")
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

  return {
    resolvedLocalId: limitlessLocalId,
    limitless: {
      id: idMatch ? Number(idMatch[1]) : null,
      url: `https://limitlesstcg.com/cards/${code}/${limitlessLocalId}`,
    },
    artist: artistMatch ? textOnly(artistMatch[1]) : null,
    printGroup: [...new Set(printGroup)],
  }
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

function buildNumber(localId, printedTotal) {
  const width = String(printedTotal).length
  const n = Number(localId)
  if (!Number.isInteger(n)) return localId // suffixed numbers (e.g. "68a") stay as-is
  return `${String(n).padStart(width, "0")}/${printedTotal}`
}

async function main() {
  console.log(`Fetching ${ptcgDataSetId} from pokemon-tcg-data...`)
  const { setMeta, cards: primaryCards } = await fetchPrimarySet(ptcgDataSetId)
  const flavorTextOverlay = await loadFlavorTextOverlay(limitlessCode)
  const noPokedex = await loadNoPokedexOverlay(limitlessCode)
  const noLimitlessCards = await loadNoLimitlessOverlay(limitlessCode)
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
        ? Promise.resolve({ resolvedLocalId: null, limitless: { id: null, url: "" }, artist: primary.artist ?? null, printGroup: [] })
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
            return { resolvedLocalId: null, limitless: { id: null, url: "" }, artist: primary.artist ?? null, printGroup: [] }
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
    const card = /** @type {import("../types/card.js").Card} */ (/** @type {any} */ ({
      number: buildNumber(localId, setMeta.printedTotal),
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
    card.rarity = primary.rarity
    card.artist = extra.artist
    if (pokedex) card.pokedex = pokedex
    // pokemon-tcg-data already carries flavor text for older sets (it's the
    // community having caught up since release) — trust it as a starting
    // point, but let the manual overlay override it for any gaps or fixes.
    if (primary.flavorText) card.flavorText = primary.flavorText
    if (flavorTextOverlay[localId]) card.flavorText = flavorTextOverlay[localId]
    card.secret = Number(localId) > setMeta.printedTotal
    // deckCode must stay unique per card even with no Limitless page to
    // confirm it against — used as computePrintGroups()'s graph key, so an
    // empty/shared placeholder here would wrongly union unrelated cards into
    // one fake print group (found while adding the McDonald's Collections).
    // resolvedLocalId is null whenever the Limitless scrape was skipped —
    // either for the whole set ("NONE") or for a single card Limitless has no
    // page for — so key the fallback off that rather than off noLimitless
    // alone, which would leave every skipped card in a normal set sharing one
    // "<code> null" deckCode.
    card.deckCode = extra.resolvedLocalId === null ? `${limitlessCode} ${localId}` : `${limitlessUrlCode} ${extra.resolvedLocalId}`
    card.printGroup = extra.printGroup.length ? extra.printGroup : [card.deckCode]
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
      ptcgDataId: setMeta.id,
      name: setMeta.name,
      series: setMeta.series,
      printedTotal: setMeta.printedTotal,
      secretTotal: setMeta.total - setMeta.printedTotal,
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
