// Parses a Bulbapedia *TCG card* page into pokemon-tcg-data's own PrimaryCard
// shape, so fetch-set.mjs can build a set that pokemon-tcg-data doesn't carry
// at all without any special-casing downstream of the fetch.
//
// This is a fallback source, not a replacement: it's only reached for cards in
// a "NONE" (no pokemon-tcg-data set id) run that also aren't reprints of a card
// already in data/sets/. Everything it returns is cross-checked against the
// card's Limitless page before being written — see checkAgainstLimitless in
// fetch-set.mjs — because a wiki page is hand-edited prose, not a data feed.
//
// Bulbapedia's card pages are structured enough to parse reliably:
//
//   {{PokémoncardInfobox   |cardname= |evostage= |evoname= |type= |hp=
//                          |weakness= |resistance= |retreatcost= }}
//   {{Cardtext/Ability     |name= |effect= }}
//   {{Cardtext/Attack      |cost={{e|Grass}}{{e|Colorless}} |name= |damage=
//                          |effect= }}
//   {{Carddex              |species= |ndex= |dex= }}
//   {{TCGTrainerCardInfobox|cardname= |class= |subclass= }}
//   {{TCGTrainerText       |rule= |print= |effect= }}
//
// A reprint promo redirects to the original print's page instead of having one
// of its own (e.g. "Zarude (MEP Promo 88)" → "Zarude (Pitch Black 56)"), which
// is why the reprint path has to be tried first — following the redirect would
// land on a page describing a different print of the card.

import { cleanDexEntry, extractTemplates, splitTemplateParams } from "./bulbapedia.mjs"

// Every modern-era (Scarlet & Violet onward) card prints the same two values,
// which is why Bulbapedia's infobox records only the type and not the amount —
// confirmed against every weakness/resistance in this database's Mega Evolution
// and Scarlet & Violet sets (3751 and 817 respectively, no other value), and
// against the MEP card images themselves.
const WEAKNESS_VALUE = "×2"
const RESISTANCE_VALUE = "-30"

// Bulbapedia records the boilerplate half of a Trainer's text as a `rule=` name
// rather than spelling it out, but pokemon-tcg-data (and so this database)
// stores it verbatim in `rules` alongside the card-specific effect. Text taken
// from an existing card in data/sets/ rather than retyped.
// The infobox's `class=` marks a rarity mechanic that the card's *name* carries
// on the printed card but `cardname=` doesn't ("cardname=Kyogre" with
// "class=SVex" is the card named "Kyogre ex"). pokemon-tcg-data spells the
// suffix into the name, records the mechanic as a subtype, and stores the rule
// box it prints — text taken from an existing card in data/sets/ rather than
// retyped. Unlisted values raise rather than being ignored, because the effect
// of missing one is a card silently stored under the wrong name and without the
// subtype that decides whether it prints a Pokédex info box.
const CARD_CLASS = {
  SVex: {
    nameSuffix: " ex",
    subtype: "ex",
    rules: ["Pokémon ex rule: When your Pokémon ex is Knocked Out, your opponent takes 2 Prize cards."],
  },
}

const TRAINER_RULE_TEXT = {
  "SV Stadium":
    "You may play only 1 Stadium card during your turn. Put it next to the Active Spot, and discard it if another Stadium comes into play. A Stadium with the same name can't be played.",
  "SWSH Stadium":
    "This Stadium stays in play when you play it. Discard it if another Stadium comes into play. If a Stadium with the same name is in play, you can't play this card.",
}

// Bulbapedia types apostrophes and quotes both ways; pokemon-tcg-data (and so
// every set already in data/sets/) is near-uniformly straight — 2226 straight
// apostrophes against 19 curly across the whole database. Match the majority
// convention so a card sourced here doesn't read as different from its
// neighbours. (The flavor-text verification in lib/bulbapedia.mjs treats the
// two as equivalent either way, so this is about storage, not matching.)
function cardText(s) {
  return cleanDexEntry(s)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
}

// Bulbapedia writes an attack's cost as a run of {{e|<Type>}} templates, using
// the same type names as pokemon-tcg-data's cost arrays.
function parseEnergyCost(raw) {
  const cost = []
  const rest = raw.replace(/\{\{e\|([^|}]+)\}\}/g, (_, type) => {
    cost.push(type.trim())
    return ""
  })
  if (rest.trim()) throw new Error(`unparsed energy cost markup: ${JSON.stringify(raw)}`)
  return cost
}

// Template params are `|key=value`, but a value can itself contain "=" (and
// newlines), so split on the first one only.
function templateParams(inner) {
  const params = {}
  for (const param of splitTemplateParams(inner).slice(1)) {
    const eq = param.indexOf("=")
    if (eq === -1) continue
    params[param.slice(0, eq).trim()] = param.slice(eq + 1).trim()
  }
  return params
}

function parseTemplates(wikitext, name) {
  const escaped = name.replace(/[/]/g, "\\/")
  return extractTemplates(wikitext, new RegExp(`\\{\\{${escaped}\\s*[|\\n]`, "g")).map(templateParams)
}

function parseAttacks(wikitext) {
  return parseTemplates(wikitext, "Cardtext/Attack").map((p) => {
    const cost = parseEnergyCost(p.cost ?? "")
    return {
      name: cardText(p.name ?? ""),
      cost,
      convertedEnergyCost: cost.length,
      // pokemon-tcg-data stores damage exactly as printed ("110", "30+",
      // "50×") and an empty string when the attack does none.
      damage: (p.damage ?? "").trim(),
      text: cardText(p.effect ?? ""),
    }
  })
}

function parseAbilities(wikitext) {
  return parseTemplates(wikitext, "Cardtext/Ability").map((p) => ({
    name: cardText(p.name ?? ""),
    type: "Ability",
    text: cardText(p.effect ?? ""),
  }))
}

/**
 * @param {string} wikitext raw wikitext of a Bulbapedia TCG card page
 * @returns {{ primary: import("../../types/card.js").PrimaryCard, trainerEffects: {print: string, rules: string[]}[] }}
 *   `primary` is complete for a Pokémon card; for a Trainer, its `rules` is
 *   left empty and the caller picks from `trainerEffects` — a page covering a
 *   card reprinted across eras carries one block per wording, and only the
 *   card image (or Limitless) says which one this print uses.
 */
export function parseCardWikitext(wikitext) {
  const [pokemonBox] = parseTemplates(wikitext, "PokémoncardInfobox")
  const [trainerBox] = parseTemplates(wikitext, "TCGTrainerCardInfobox")
  const box = pokemonBox ?? trainerBox
  if (!box) throw new Error("no PokémoncardInfobox or TCGTrainerCardInfobox on page")

  const card = /** @type {any} */ ({
    name: cardText(box.cardname ?? ""),
    supertype: pokemonBox ? "Pokémon" : "Trainer",
    // Rarity isn't on the card page in any usable form (Bulbapedia describes
    // the finish in prose instead), and every promo in this database is
    // "Promo" — the caller supplies it from the set's own metadata.
    rarity: "",
    weaknesses: [],
    resistances: [],
  })

  const attacks = parseAttacks(wikitext)
  const abilities = parseAbilities(wikitext)
  if (attacks.length) card.attacks = attacks
  if (abilities.length) card.abilities = abilities

  const trainerEffects = []
  if (pokemonBox) {
    const stage = (pokemonBox.evostage ?? "").trim()
    if (!["Basic", "Stage 1", "Stage 2"].includes(stage)) {
      throw new Error(`unhandled evostage ${JSON.stringify(stage)} — check whether it needs a subtype mapping`)
    }
    card.subtypes = [stage]
    const cardClass = (pokemonBox.class ?? "").trim()
    if (cardClass) {
      const mechanic = CARD_CLASS[cardClass]
      if (!mechanic) throw new Error(`unhandled card class ${JSON.stringify(cardClass)} — add its name suffix, subtype and rule text`)
      card.name += mechanic.nameSuffix
      card.subtypes.push(mechanic.subtype)
      card.rules = mechanic.rules
    }
    if (pokemonBox.evoname) card.evolvesFrom = cardText(pokemonBox.evoname)
    if (pokemonBox.type) card.types = [pokemonBox.type.trim()]
    if (pokemonBox.hp) card.hp = pokemonBox.hp.trim()
    if (pokemonBox.weakness) card.weaknesses = [{ type: pokemonBox.weakness.trim(), value: WEAKNESS_VALUE }]
    if (pokemonBox.resistance) card.resistances = [{ type: pokemonBox.resistance.trim(), value: RESISTANCE_VALUE }]
    if (pokemonBox.retreatcost) card.convertedRetreatCost = Number(pokemonBox.retreatcost)

    const [dex] = parseTemplates(wikitext, "Carddex")
    if (dex?.dex) card.flavorText = cardText(dex.dex)
    // An empty `ndex` is Bulbapedia recording that this print has no Pokédex
    // info box at all — the full-art cards print flavor text without the
    // "NO. 0154 Herb Pokémon HT: … WT: …" line above it. Confirmed against the
    // card images for MEP's First Partner Illustration Collection cards.
    if (dex?.ndex) card.nationalPokedexNumbers = [Number(dex.ndex)]
  } else {
    const subclass = (trainerBox.subclass ?? "").trim()
    if (!subclass) throw new Error("Trainer card has no subclass")
    card.subtypes = [subclass]
    for (const p of parseTemplates(wikitext, "TCGTrainerText")) {
      const boilerplate = TRAINER_RULE_TEXT[(p.rule ?? "").trim()]
      if (!boilerplate) throw new Error(`unhandled Trainer rule ${JSON.stringify(p.rule)} — add its printed text`)
      trainerEffects.push({ print: (p.print ?? "").trim(), rules: [cardText(p.effect ?? ""), boilerplate] })
    }
    if (!trainerEffects.length) throw new Error("Trainer card has no TCGTrainerText block")
  }

  return { primary: card, trainerEffects }
}

/**
 * @param {string} title
 * @returns {Promise<{wikitext: string, redirect: null} | {wikitext: null, redirect: string}>}
 *   Exactly one of the two is set. Raw fetches don't follow redirects, and
 *   landing on one means the page for this exact print doesn't exist — which
 *   for a promo means it's a reprint of a print that does. The redirect target
 *   names that print ("Eevee (Stellar Crown 113)"), so it's returned rather
 *   than raised: the caller can resolve it against data/sets/ and reuse
 *   pokemon-tcg-data's already-verified text, which beats parsing either page.
 *   Parsing the *target* page here instead would silently describe a different
 *   print of the card, which is what this guards against.
 */
export async function fetchCardWikitext(title) {
  const res = await fetch(
    `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&action=raw`,
    { headers: { "user-agent": "pokemon-tcg-database (personal reference dataset)" } },
  )
  if (!res.ok) throw new Error(`Bulbapedia ${title}: HTTP ${res.status}`)
  const text = await res.text()
  const redirect = text.match(/^#REDIRECT\s*\[\[([^\]]+)\]\]/i)
  if (redirect) return { wikitext: null, redirect: redirect[1].trim() }
  return { wikitext: text, redirect: null }
}
