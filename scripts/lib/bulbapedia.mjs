// Shared Bulbapedia flavor-text lookup: fetches a species page's raw
// wikitext and parses out every game's Pokédex entry. Used by both the
// interactive flavor-text-editor (for typing text in) and check-flavor-text
// (for verifying it against Bulbapedia headlessly).

// Trainer-owned Pokémon (e.g. "Erika's Oddish") print the same flavor text
// as the plain species — Bulbapedia only has a page for the species itself,
// not "Erika's Oddish", so strip the possessive prefix before looking it up.
// Regional forms (e.g. "Paldean Wooper", "Paldean Tauros") share their base
// species' Bulbapedia page too — its Dex/EntryN templates cover every form,
// not just the base one — so strip those prefixes as well.
// Nidoran ♀/♂'s card name has a space before the gender symbol, but
// Bulbapedia's actual page title doesn't ("Nidoran♀ (Pokémon)") — the
// spaced form just redirects to it, and raw-wikitext fetches don't follow
// redirects, so the space has to go before the lookup.
// Rotom's appliance forms (e.g. "Heat Rotom", "Wash Rotom") share the base
// "Rotom (Pokémon)" page too, same as regional forms above.
// Ogerpon's mask forms (e.g. "Teal Mask Ogerpon") share the base
// "Ogerpon (Pokémon)" page too, same category of bug (found via TWM).
// "Bloodmoon Ursaluna" shares the base "Ursaluna (Pokémon)" page too, same
// category again (found via SFA) — its Violet entry is the verbatim match.
export function speciesName(cardName) {
  return cardName
    .replace(/^.*'s\s+/, "")
    // Rarity prefixes (Shining, Radiant) can stack with a regional-form
    // prefix (e.g. "Radiant Hisuian Sneasler") — strip these before the
    // regional-form check below, which is anchored to the start of the
    // string and would otherwise miss "Hisuian" once "Radiant" is in front
    // of it. Found while adding Lost Origin.
    .replace(/^Shining\s+/, "")
    .replace(/^Radiant\s+/, "")
    // Promo-only name prefixes with no Bulbapedia page of their own, same
    // category as the regional forms below: the Pokémon Center "Special
    // Delivery" promos, and the retro-styled "Light" tribute cards (a Neo
    // Destiny-era mechanic, like the "Shining" prefix above). Found while
    // adding the SWSH Black Star Promos.
    .replace(/^Special\s+Delivery\s+/, "")
    .replace(/^Light\s+/, "")
    .replace(/^(Paldean|Galarian|Alolan|Hisuian)\s+/, "")
    .replace(/^(Heat|Wash|Frost|Fan|Mow)\s+(?=Rotom)/, "")
    .replace(/^(Teal|Wellspring|Hearthflame|Cornerstone)\s+Mask\s+(?=Ogerpon)/, "")
    .replace(/^Bloodmoon\s+(?=Ursaluna)/, "")
    .replace(/^Castform\s+(Sunny|Rainy|Snowy)\s+Form$/, "Castform")
    // DP-era Castform prints spell its weather forms differently ("Rain
    // Form", "Snow-Cloud Form" instead of "Rainy"/"Snowy") — same base
    // "Castform (Pokémon)" page either way. Found while adding Legends
    // Awakened (dp6).
    .replace(/^Castform\s+(Rain|Snow-Cloud)\s+Form$/, "Castform")
    // Deoxys's four Formes share the base "Deoxys (Pokémon)" page too, same
    // category as regional/appliance/mask forms above. Found while adding
    // Legends Awakened (dp6).
    .replace(/^Deoxys\s+(Normal|Attack|Defense|Speed)\s+Forme$/, "Deoxys")
    // The Van Gogh Museum promo (svp 85) names the card after the painting it
    // recreates; its flavor text is still a plain Pikachu Pokédex entry.
    .replace(/^Pikachu\s+with\s+Grey\s+Felt\s+Hat$/, "Pikachu")
    .replace(/^(Rapid|Single)\s+Strike\s+(?=Urshifu)/, "")
    // Fusion forms (Black Kyurem, White Kyurem) share the base Kyurem page,
    // same category as regional/appliance/mask forms above. Found while
    // adding Lost Thunder.
    .replace(/^(Black|White)\s+(?=Kyurem)/, "")
    // Necrozma's fused forms all share the base "Necrozma (Pokémon)" page —
    // "Ultra" found while adding Cosmic Eclipse, "Dawn Wings"/"Dusk Mane"
    // while adding the SM Black Star Promos.
    .replace(/^(Ultra|Dawn\s+Wings|Dusk\s+Mane)\s+(?=Necrozma)/, "")
    // Prism Star cards (Ultra Prism era) suffix the name with "◇" — not part
    // of the species name. Found while adding Ultra Prism.
    .replace(/\s*◇$/, "")
    // LEGEND cards (HGSS era) suffix the name with "LEGEND" — not part of
    // the species name. Found while adding HS (HeartGold & SoulSilver).
    .replace(/\s+LEGEND$/, "")
    // Shellos/Gastrodon's East Sea/West Sea forms share the base species'
    // Bulbapedia page, same category as regional/appliance/mask forms
    // above. Found while adding Rising Rivals (pl2).
    .replace(/\s+(East|West)\s+Sea$/, "")
    // Wormadam/Burmy's Plant/Sandy/Trash Cloak forms share the base
    // species' Bulbapedia page too, same category. Found while adding
    // Arceus (pl4).
    .replace(/\s+(Plant|Sandy|Trash)\s+Cloak$/, "")
    // Unown's letter forms (e.g. "Unown [A]") share the base "Unown
    // (Pokémon)" page too. Found while adding Diamond & Pearl (dp1).
    .replace(/\s+\[[A-Z!?]\]$/, "")
    .replace(/\s+([♀♂])/, "$1")
}

// Bulbapedia's wikitext and pokemon-tcg-data's own flavorText disagree on
// straight vs curly quotes for the same real text (e.g. "doesn't" vs
// "doesn't") — treat them as equivalent so that doesn't read as a mismatch.
export function normalize(s) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\.\.\./g, "…")
    .replace(/−/g, "-")
    // pokemon-tcg-data's own flavorText sometimes types a degree sign as the
    // masculine ordinal indicator "º" (visually near-identical) instead of
    // the real "°" the card prints — found on EPO's Pansear and Darmanitan.
    .replace(/º/g, "°")
    // Bulbapedia's own wikitext sometimes types an em dash as a plain "--"
    // (e.g. Exploud's HeartGold/SoulSilver/Y entry) where the actual card
    // prints "—" — a transcription-style difference, not a text error. Found
    // twice now (Vivid Voltage, Celestial Storm), both times on Exploud.
    .replace(/--/g, "—")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

// TCG flavor text is a verbatim reuse of some mainline-game Pokédex entry —
// not always the same game per card, so all of them are shown as reference.
// Bulbapedia's raw wikitext has every game's entry in a consistent template
// (including Scarlet/Violet/Legends: Z-A, which PokeAPI doesn't have at
// all), keyed by species name rather than dex number since a dex number is
// shared by a Pokémon and its MEGA/ex evolutions, which don't get their own
// Bulbapedia species page.
// Exported because Bulbapedia's TCG *card* pages (parsed by bulbapedia-card.mjs
// for sets pokemon-tcg-data doesn't carry at all) write attack and Trainer
// effect text in the same wikitext dialect as these Pokédex entries — same
// {{p|...}}/[[link]]/''italics'' markup, same need to render it down to the
// plain text actually printed on the card.
export function cleanDexEntry(s) {
  return s
    // Editor notes left in the wikitext as HTML comments render to nothing on
    // the page, but were leaking into the compared text — Glaceon's Ultra Sun
    // entry annotates its "–75 degrees" with "<!--U+2013 EN DASH in-game-->",
    // which read as a mismatch against the identical text on SM238. Found
    // while adding the SM Black Star Promos.
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{ScPkmn\}\}/g, "Pokémon")
    .replace(/\{\{ScBall\}\}/g, "Poké Ball")
    .replace(/\{\{Berries\}\}/g, "Berries")
    .replace(/\{\{p\|([^|}]+)(?:\|([^|}]+))?\}\}/gi, (_, name, display) => display || name)
    .replace(/\{\{pkmn2?\|([^|}]+)\}\}/g, "$1")
    .replace(/\{\{t\|([^|}]+)\}\}/g, (_, type) => type.charAt(0).toUpperCase() + type.slice(1).toLowerCase())
    // {{m|Move}}/{{m|Move|Display}}, {{status|X}}/{{status|X|Y}}, and
    // {{a|Ability}}/{{a|Ability|Display}} all use the same shape — the
    // display text overrides the name when given.
    .replace(/\{\{(?:m|status|a)\|([^|}]+)(?:\|([^|}]+))?\}\}/g, (_, name, display) => display || name)
    // {{OBP|name|category}}/{{OBP|name|category|display}} — category is a
    // disambiguation param, never shown.
    .replace(/\{\{OBP\|([^|}]+)\|[^|}]+(?:\|([^|}]+))?\}\}/g, (_, name, display) => display || name)
    // {{wp|Article}}/{{wp|Article|Display}} links out to real-world Wikipedia
    // (e.g. {{wp|dravite}}) — same shape as {{p|...}}, just a different target.
    .replace(/\{\{wp\|([^|}]+)(?:\|([^|}]+))?\}\}/gi, (_, name, display) => display || name)
    // {{TCG|Confused}}/{{TCG|Energy card|Energy}} links a TCG glossary term.
    // Same shape again — the printed card just says the word. Only reached via
    // bulbapedia-card.mjs (attack and Trainer effect text); Pokédex entries
    // don't use it.
    .replace(/\{\{TCG\|([^|}]+)(?:\|([^|}]+))?\}\}/g, (_, name, display) => display || name)
    .replace(/<sc>(.*?)<\/sc>/g, (_, name) => name)
    .replace(/<small>[\s\S]*?<\/small>/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    // {{tt|X|Y}} is Bulbapedia's tooltip template. When X is a bare footnote
    // marker (*, †, ...) it's Bulbapedia's own annotation (e.g. "HOME-only"),
    // not part of the actual game text, so drop it — but keep X when it's
    // real visible text (e.g. {{tt|10F|...}}).
    .replace(/\{\{tt\|([^|}]+)\|[^}]+\}\}/g, (_, marker) => (/^[^\w\s]+$/.test(marker) ? "" : marker))
    // {{sup/N|X}} is a superscript footnote marker (e.g. flagging which
    // game abbreviation a wording variant applies to) — not real text.
    .replace(/\{\{sup\/\d\|[^}]+\}\}/g, "")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Splits a template's inner content (without the outer {{ }}) on top-level
// `|` only — entries often contain nested templates of their own
// ({{ScPkmn}}, {{tt|*|...}}) and piped wiki-links ([[Sinnoh myths|myths]]),
// whose internal `|` must not be split on.
export function splitTemplateParams(inner) {
  const params = []
  let depth = 0
  let current = ""
  for (let i = 0; i < inner.length; i++) {
    if (inner.startsWith("{{", i) || inner.startsWith("[[", i)) {
      depth++
      current += inner.slice(i, i + 2)
      i++
    } else if (inner.startsWith("}}", i) || inner.startsWith("]]", i)) {
      depth--
      current += inner.slice(i, i + 2)
      i++
    } else if (inner[i] === "|" && depth === 0) {
      params.push(current)
      current = ""
    } else {
      current += inner[i]
    }
  }
  params.push(current)
  return params
}

// Finds each {{<startRe> ...}} template by counting brace depth rather than
// a regex, since template bodies routinely contain nested templates
// themselves — a regex that excludes braces from the match body silently
// drops those. Returns each match's inner text (the outer braces stripped).
//
// Exported for bulbapedia-card.mjs, which pulls the same shape of template
// ({{PokémoncardInfobox ...}}, {{Cardtext/Attack ...}}) off TCG card pages;
// startRe must be a /g regex matching the opening "{{" plus template name.
export function extractTemplates(wikitext, startRe) {
  const templates = []
  let m
  while ((m = startRe.exec(wikitext))) {
    let depth = 0
    let i = m.index
    while (i < wikitext.length) {
      if (wikitext.startsWith("{{", i)) {
        depth++
        i += 2
      } else if (wikitext.startsWith("}}", i)) {
        depth--
        i += 2
        if (depth === 0) break
      } else {
        i++
      }
    }
    templates.push(wikitext.slice(m.index + 2, i - 2))
    startRe.lastIndex = i
  }
  return templates
}

export function parseDexEntries(wikitext) {
  const entries = []
  for (const inner of extractTemplates(wikitext, /\{\{Dex\/Entry\d/g)) {
    const params = splitTemplateParams(inner).slice(1) // drop "Dex/EntryN" name
    const versions = params.filter((p) => /^v\d?=/.test(p)).map((p) => p.replace(/^v\d?=/, "").trim())
    const entryParam = params.find((p) => /^entry=/.test(p))
    if (!entryParam || !versions.length) continue
    const entry = cleanDexEntry(entryParam.slice("entry=".length))
    if (entry) entries.push({ versions, text: entry })
  }
  // Same text can come from multiple games (e.g. Black & White share one) —
  // Bulbapedia already groups those into one template, but different
  // templates occasionally still produce identical text; merge those too.
  const byText = new Map()
  for (const { versions, text } of entries) {
    if (!byText.has(text)) byText.set(text, [])
    byText.get(text).push(...versions)
  }
  return [...byText.entries()].map(([text, versions]) => ({ text, versions }))
}

const flavorCandidateCache = new Map()
export async function fetchFlavorCandidates(name) {
  if (flavorCandidateCache.has(name)) return flavorCandidateCache.get(name)
  const promise = (async () => {
    try {
      const res = await fetch(
        `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(name)}_(Pok%C3%A9mon)&action=raw`,
        { headers: { "user-agent": "pokemon-tcg-database (flavor-text-editor)" } }
      )
      if (!res.ok) return []
      return parseDexEntries(await res.text())
    } catch (err) {
      // A transient network hiccup (e.g. ETIMEDOUT) shouldn't permanently
      // cache a failure — clear the cache entry so the next request retries.
      flavorCandidateCache.delete(name)
      console.error(`Bulbapedia fetch failed for "${name}": ${err instanceof Error ? err.message : err}`)
      return []
    }
  })()
  flavorCandidateCache.set(name, promise)
  return promise
}
