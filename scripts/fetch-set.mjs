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
//   node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>
//   e.g. node scripts/fetch-set.mjs me1 MEG
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

const CONCURRENCY = 6
const RETRIES = 3

const [ptcgDataSetId, limitlessCode] = process.argv.slice(2)
if (!ptcgDataSetId || !limitlessCode) {
  console.error("usage: node scripts/fetch-set.mjs <ptcgDataSetId> <limitlessCode>   e.g. me1 MEG")
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

async function get(url, { json = false } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "pokemon-tcg-database (personal reference dataset)" } })
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return json ? await res.json() : await res.text()
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

async function fetchLimitlessExtra(code, localId) {
  const html = await get(`https://limitlesstcg.com/cards/${code}/${localId}`)

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
      else if (cls) printGroup.push(`${code} ${localId}`)
    }
  }

  return {
    limitless: {
      id: idMatch ? Number(idMatch[1]) : null,
      url: `https://limitlesstcg.com/cards/${code}/${localId}`,
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
  console.log(`Found ${primaryCards.length} cards. Fetching per-card data from Limitless + PokeAPI...`)

  let done = 0
  // mapWithConcurrency isn't itself typed (it's a generic helper with no
  // JSDoc @template), so the PrimaryCard[] type of primaryCards wouldn't
  // otherwise flow through to this callback's parameter — annotate it
  // directly so primary.* below is actually checked against pokemon-tcg-data's
  // shape, not silently `any`.
  const cards = await mapWithConcurrency(primaryCards, CONCURRENCY, async (/** @type {import("../types/card.js").PrimaryCard} */ primary) => {
    const localId = primary.number
    const [extra, pokedex] = await Promise.all([
      fetchLimitlessExtra(limitlessCode, localId),
      // Only regular (non-ex/non-MEGA) Pokémon print the dex info box.
      primary.supertype === "Pokémon" &&
      primary.nationalPokedexNumbers?.length &&
      !primary.subtypes?.some((s) => s === "ex" || s === "MEGA")
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
    card.deckCode = `${limitlessCode} ${localId}`
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

  await mkdir(OUT_DIR, { recursive: true })
  const outPath = resolve(OUT_DIR, `${limitlessCode}.json`)
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n")
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
