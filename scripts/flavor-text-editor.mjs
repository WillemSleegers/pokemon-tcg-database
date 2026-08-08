// A tiny local tool for typing in flavor text while looking at the card
// image — there's no structured source for it (see README), so this is
// manual transcription made fast instead of automated.
//
//   node scripts/flavor-text-editor.mjs MEG
//
// Saves to data/flavor-text/<CODE>.json (localId -> flavorText), kept
// separate from data/sets/<CODE>.json so re-running fetch-set.mjs never
// wipes out what you've typed in. fetch-set.mjs merges it back in on the
// next run.

import { createServer } from "node:http"
import { createReadStream } from "node:fs"
import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PORT = 5173
const EDITOR_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "flavor-text-editor")

const setCode = process.argv[2]
if (!setCode) {
  console.error("usage: node scripts/flavor-text-editor.mjs <SET_CODE>   e.g. MEG")
  process.exit(1)
}

const SET_PATH = resolve(ROOT, "data/sets", `${setCode}.json`)
const OVERLAY_PATH = resolve(ROOT, "data/flavor-text", `${setCode}.json`)
const IMAGE_CACHE_DIR = resolve(ROOT, ".local/card-images", setCode)
await mkdir(IMAGE_CACHE_DIR, { recursive: true })

// Card images are large and never change once printed, so cache them on
// disk (gitignored — see .gitignore) instead of re-fetching from
// images.pokemontcg.io on every page load while paging through a set.
function extFromUrl(url) {
  return /\.jpe?g(?:$|\?)/i.test(url) ? "jpg" : "png"
}

async function ensureCachedImage(localId, remoteUrl) {
  const ext = extFromUrl(remoteUrl)
  const filePath = resolve(IMAGE_CACHE_DIR, `${localId}.${ext}`)
  try {
    await stat(filePath)
  } catch {
    const res = await fetch(remoteUrl)
    if (!res.ok) throw new Error(`Failed to fetch image: ${remoteUrl}`)
    await writeFile(filePath, Buffer.from(await res.arrayBuffer()))
  }
  return filePath
}

async function loadOverlay() {
  try {
    return JSON.parse(await readFile(OVERLAY_PATH, "utf8"))
  } catch {
    return {}
  }
}

async function saveOverlay(overlay) {
  await mkdir(dirname(OVERLAY_PATH), { recursive: true })
  const sorted = Object.fromEntries(
    Object.keys(overlay)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((k) => [k, overlay[k]])
  )
  await writeFile(OVERLAY_PATH, JSON.stringify(sorted, null, 2) + "\n")
}

let setData
try {
  setData = JSON.parse(await readFile(SET_PATH, "utf8"))
} catch {
  console.error(`Couldn't read ${SET_PATH} — run fetch-set.mjs for ${setCode} first.`)
  process.exit(1)
}

// Only regular (non-ex/non-MEGA) Pokémon print the flavor text box — same
// criterion fetch-set.mjs uses for the pokedex info box.
const candidates = setData.cards.filter((c) => c.pokedex)

// TCG flavor text is a verbatim reuse of some mainline-game Pokédex entry —
// not always the same game per card, so all of them are shown as reference.
// Bulbapedia's raw wikitext has every game's entry in a consistent template
// (including Scarlet/Violet/Legends: Z-A, which PokeAPI doesn't have at
// all), keyed by species name rather than dex number since a dex number is
// shared by a Pokémon and its MEGA/ex evolutions, which don't get their own
// Bulbapedia species page.
function cleanDexEntry(s) {
  return s
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
function splitTemplateParams(inner) {
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

// Finds each {{Dex/EntryN ...}} template by counting brace depth rather than
// a regex, since entries routinely contain nested templates themselves — a
// regex that excludes braces from the match body silently drops those.
function extractDexEntryTemplates(wikitext) {
  const templates = []
  const startRe = /\{\{Dex\/Entry\d/g
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

function parseDexEntries(wikitext) {
  const entries = []
  for (const inner of extractDexEntryTemplates(wikitext)) {
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
async function fetchFlavorCandidates(speciesName) {
  if (flavorCandidateCache.has(speciesName)) return flavorCandidateCache.get(speciesName)
  const promise = (async () => {
    try {
      const res = await fetch(
        `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(speciesName)}_(Pok%C3%A9mon)&action=raw`,
        { headers: { "user-agent": "pokemon-tcg-database (flavor-text-editor)" } }
      )
      if (!res.ok) return []
      return parseDexEntries(await res.text())
    } catch (err) {
      // A transient network hiccup (e.g. ETIMEDOUT) shouldn't take the
      // whole editor down, and shouldn't permanently cache a failure either
      // — clear the cache entry so the next request actually retries.
      flavorCandidateCache.delete(speciesName)
      console.error(`Bulbapedia fetch failed for "${speciesName}": ${err instanceof Error ? err.message : err}`)
      return []
    }
  })()
  flavorCandidateCache.set(speciesName, promise)
  return promise
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)

  if (url.pathname === "/") {
    const html = (await readFile(resolve(EDITOR_DIR, "index.html"), "utf8")).replaceAll(
      "{{SET_NAME}}",
      setData.set.name
    )
    res.writeHead(200, { "content-type": "text/html" })
    res.end(html)
    return
  }

  if (url.pathname === "/style.css") {
    res.writeHead(200, { "content-type": "text/css" })
    createReadStream(resolve(EDITOR_DIR, "style.css")).pipe(res)
    return
  }

  if (url.pathname === "/client.js") {
    res.writeHead(200, { "content-type": "text/javascript" })
    createReadStream(resolve(EDITOR_DIR, "client.js")).pipe(res)
    return
  }

  if (url.pathname === "/api/cards" && req.method === "GET") {
    const overlay = await loadOverlay()
    const data = candidates.map((c) => ({
      localId: c.localId,
      number: c.number,
      name: c.name,
      image: `/card-image/${setCode}/${c.localId}`,
      // The overlay is a manual correction on top of whatever fetch-set.mjs
      // already merged onto the card (overlay itself, for MEG/PFL/ASC-style
      // sets, or pokemon-tcg-data's own flavorText for older SV-era sets).
      flavorText: overlay[c.localId] ?? c.flavorText ?? "",
    }))
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(data))
    return
  }

  if (url.pathname.startsWith(`/card-image/${setCode}/`) && req.method === "GET") {
    const localId = url.pathname.slice(`/card-image/${setCode}/`.length)
    const card = candidates.find((c) => c.localId === localId)
    if (!card?.images?.large) {
      res.writeHead(404)
      res.end("not found")
      return
    }
    try {
      const filePath = await ensureCachedImage(localId, card.images.large)
      const contentType = filePath.endsWith(".jpg") ? "image/jpeg" : "image/png"
      res.writeHead(200, { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" })
      createReadStream(filePath).pipe(res)
    } catch (err) {
      res.writeHead(502)
      res.end(String(err))
    }
    return
  }

  if (url.pathname === "/api/flavor-candidates" && req.method === "GET") {
    const name = url.searchParams.get("name")
    const data = name ? await fetchFlavorCandidates(name) : []
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(data))
    return
  }

  if (url.pathname === "/api/flavor-text" && req.method === "POST") {
    let body = ""
    for await (const chunk of req) body += chunk
    const { localId, flavorText } = JSON.parse(body)
    const overlay = await loadOverlay()
    if (flavorText && flavorText.trim()) overlay[localId] = flavorText.trim()
    else delete overlay[localId]
    await saveOverlay(overlay)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ ok: true, count: Object.keys(overlay).length }))
    return
  }

  res.writeHead(404)
  res.end("not found")
})

server.listen(PORT, () => {
  console.log(`${candidates.length} cards to caption.`)
  console.log(`Flavor text editor running at http://localhost:${PORT}`)
})
