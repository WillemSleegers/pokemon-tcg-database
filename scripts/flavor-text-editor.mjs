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
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PORT = 5173

const setCode = process.argv[2]
if (!setCode) {
  console.error("usage: node scripts/flavor-text-editor.mjs <SET_CODE>   e.g. MEG")
  process.exit(1)
}

const SET_PATH = resolve(ROOT, "data/sets", `${setCode}.json`)
const OVERLAY_PATH = resolve(ROOT, "data/flavor-text", `${setCode}.json`)

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
    const res = await fetch(
      `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(speciesName)}_(Pok%C3%A9mon)&action=raw`,
      { headers: { "user-agent": "pokemon-tcg-database (flavor-text-editor)" } }
    )
    if (!res.ok) return []
    return parseDexEntries(await res.text())
  })()
  flavorCandidateCache.set(speciesName, promise)
  return promise
}

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Flavor text — ${setData.set.name}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f4f4f2; color: #1a1a1a; display: flex; flex-direction: column; height: 100vh;
  }
  @media (prefers-color-scheme: dark) { body { background: #17181a; color: #eee; } }
  header {
    padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(128,128,128,0.25); flex-shrink: 0;
  }
  header h1 { font-size: 15px; font-weight: 600; margin: 0; }
  header .right { display: flex; align-items: center; gap: 12px; }
  header .progress { font-size: 13px; opacity: 0.7; font-variant-numeric: tabular-nums; }
  #filterBtn.active { background: #4a7dfc; border-color: #4a7dfc; color: white; }
  main { flex: 1; display: flex; overflow: hidden; }
  .card-pane { flex: 0 0 560px; display: flex; flex-direction: column; align-items: center; padding: 20px; overflow-y: auto; }
  .card-pane img { max-width: 100%; max-height: 82vh; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
  .card-meta { margin-top: 12px; text-align: center; }
  .card-meta .name { font-size: 17px; font-weight: 600; }
  .card-meta .number { font-size: 13px; opacity: 0.6; }
  .form-pane { flex: 1; display: flex; flex-direction: column; padding: 24px 32px; overflow-y: auto; }
  label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.6; margin-bottom: 8px; }
  textarea {
    width: 100%; font-size: 16px; line-height: 1.5; padding: 14px; border-radius: 10px;
    border: 1px solid rgba(128,128,128,0.35); background: transparent; color: inherit;
    resize: vertical; min-height: 100px; font-family: inherit;
  }
  textarea:focus { outline: 2px solid #4a7dfc; outline-offset: -1px; }
  .actions { display: flex; gap: 10px; margin-top: 16px; }
  button {
    font-size: 14px; padding: 9px 16px; border-radius: 8px; border: 1px solid rgba(128,128,128,0.35);
    background: rgba(128,128,128,0.08); color: inherit; cursor: pointer;
  }
  button:hover { background: rgba(128,128,128,0.18); }
  button.primary { background: #4a7dfc; border-color: #4a7dfc; color: white; }
  button.primary:hover { background: #3a6ceb; }
  .hint { font-size: 12px; opacity: 0.55; margin-top: 8px; }
  .match-badge {
    display: inline-flex; align-items: center; gap: 6px; font-size: 12px; margin-top: 10px;
    padding: 5px 10px; border-radius: 999px; background: rgba(62,165,94,0.15); color: #2f8a4c; font-weight: 600;
  }
  @media (prefers-color-scheme: dark) { .match-badge { color: #6fd98c; } }
  .candidates-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.6; margin: 22px 0 8px; }
  .candidates { display: flex; flex-direction: column; gap: 6px; }
  .candidate {
    text-align: left; font-size: 13px; line-height: 1.4; padding: 9px 12px; border-radius: 8px;
    border: 1px solid rgba(128,128,128,0.25); background: rgba(128,128,128,0.05); cursor: pointer;
  }
  .candidate:hover { background: rgba(74,125,252,0.12); border-color: rgba(74,125,252,0.4); }
  .candidate.matched { background: rgba(62,165,94,0.15); border-color: #3ea55e; }
  .candidate .versions { display: block; margin-top: 3px; font-size: 11px; opacity: 0.55; text-transform: capitalize; }
  .candidates-empty { font-size: 12px; opacity: 0.5; font-style: italic; }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(30px, 1fr)); gap: 4px; margin-top: 24px;
  }
  .grid button {
    padding: 0; height: 30px; font-size: 11px; border-radius: 5px; background: rgba(128,128,128,0.1);
  }
  .grid button.done { background: #3ea55e; border-color: #3ea55e; color: white; }
  .grid button.current { outline: 2px solid #4a7dfc; outline-offset: 1px; }
</style>
</head>
<body>
<header>
  <h1>${setData.set.name} — flavor text</h1>
  <div class="right">
    <button id="filterBtn">Show unmatched only</button>
    <div class="progress" id="progress"></div>
  </div>
</header>
<main>
  <div class="card-pane">
    <img id="cardImage" src="" alt="">
    <div class="card-meta">
      <div class="name" id="cardName"></div>
      <div class="number" id="cardNumber"></div>
    </div>
  </div>
  <div class="form-pane">
    <label for="flavorText">Flavor text</label>
    <textarea id="flavorText" placeholder="Type what's printed at the bottom of the card..." autofocus></textarea>
    <div id="matchBadge"></div>
    <div class="actions">
      <button id="prevBtn">← Prev</button>
      <button id="saveNextBtn" class="primary">Save &amp; Next →</button>
      <button id="skipBtn">Skip</button>
    </div>
    <div class="hint">⌘/Ctrl + Enter to save &amp; advance. Skip leaves it blank for now.</div>
    <div class="candidates-label" id="candidatesLabel">Pokédex entries (game versions, for reference — click to fill)</div>
    <div class="candidates" id="candidates"><div class="candidates-empty">Loading...</div></div>
    <div class="grid" id="grid"></div>
  </div>
</main>
<script>
let cards = []
let i = 0
let candidateCache = {}
let currentCandidates = []
let matchStatus = {} // localId -> true (exact match found) | false (no match) | undefined (not checked yet)
let matchStatusComputed = false
let filterActive = false

async function load() {
  cards = await (await fetch('/api/cards')).json()
  const firstBlank = cards.findIndex(c => !c.flavorText)
  i = firstBlank === -1 ? 0 : firstBlank
  render()
}

// A card counts as "unmatched" if it's blank, or its saved text isn't a
// verbatim hit against any of its species' Bulbapedia candidates.
async function computeMatch(c) {
  if (!c.flavorText) return false
  if (!candidateCache[c.name]) {
    candidateCache[c.name] = fetch('/api/flavor-candidates?name=' + encodeURIComponent(c.name)).then(r => r.json())
  }
  const cands = await candidateCache[c.name]
  const current = normalize(c.flavorText)
  return cands.some(cand => normalize(cand.text) === current)
}

async function ensureAllMatchStatus() {
  if (matchStatusComputed) return
  const btn = document.getElementById('filterBtn')
  let done = 0
  let next = 0
  async function worker() {
    while (next < cards.length) {
      const idx = next++
      matchStatus[cards[idx].localId] = await computeMatch(cards[idx])
      done++
      btn.textContent = 'Checking… ' + done + '/' + cards.length
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  matchStatusComputed = true
}

// Next/prev index that respects the active filter — when off, this is just
// i ± 1 within bounds, same as before the filter existed.
function findVisibleIndex(from, dir) {
  let idx = from
  for (let step = 0; step < cards.length; step++) {
    idx += dir
    if (idx < 0 || idx >= cards.length) return null
    if (!filterActive || matchStatus[cards[idx].localId] === false) return idx
  }
  return null
}

function updateFilterBtn() {
  const btn = document.getElementById('filterBtn')
  if (filterActive) {
    const unmatchedCount = cards.filter(c => matchStatus[c.localId] === false).length
    btn.textContent = 'Show all (' + unmatchedCount + ' unmatched)'
  } else {
    btn.textContent = 'Show unmatched only'
  }
  btn.classList.toggle('active', filterActive)
}

document.getElementById('filterBtn').onclick = async () => {
  filterActive = !filterActive
  const btn = document.getElementById('filterBtn')
  btn.disabled = true
  if (filterActive) await ensureAllMatchStatus()
  btn.disabled = false
  updateFilterBtn()
  if (filterActive && matchStatus[cards[i].localId] !== false) {
    const next = findVisibleIndex(i, 1) ?? findVisibleIndex(i, -1)
    if (next !== null) i = next
  }
  render()
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

async function render() {
  const c = cards[i]
  document.getElementById('cardImage').src = c.image
  document.getElementById('cardName').textContent = c.name
  document.getElementById('cardNumber').textContent = c.number
  document.getElementById('flavorText').value = c.flavorText || ''
  const done = cards.filter(c => c.flavorText).length
  document.getElementById('progress').textContent = done + ' / ' + cards.length + ' captioned'
  document.getElementById('prevBtn').disabled = findVisibleIndex(i, -1) === null
  if (matchStatusComputed) updateFilterBtn()
  renderGrid()
  updateMatch()
  document.getElementById('flavorText').focus()

  currentCandidates = []
  renderCandidates()
  const name = c.name
  if (!candidateCache[name]) {
    candidateCache[name] = fetch('/api/flavor-candidates?name=' + encodeURIComponent(name)).then(r => r.json())
  }
  const result = await candidateCache[name]
  if (cards[i].name === name) { currentCandidates = result; renderCandidates() }
}

function renderCandidates() {
  const el = document.getElementById('candidates')
  const label = document.getElementById('candidatesLabel')
  if (!currentCandidates.length) {
    label.textContent = 'Pokédex entries (game versions, for reference — click to fill)'
    el.innerHTML = '<div class="candidates-empty">No reference entries found on Bulbapedia for this species.</div>'
    return
  }
  const current = normalize(document.getElementById('flavorText').value)
  // Narrow the list to entries that could still match what's typed so far —
  // a prefix match in either direction, so it also still narrows once
  // you've typed past a short entry's full length. Prefix rather than
  // substring: some entries (e.g. Stadium/Stadium 2 "cartridge inserted"
  // combos) concatenate two unrelated games' text together, and a plain
  // substring check would falsely keep those around any time what's typed
  // happens to match their second half.
  const visible = current
    ? currentCandidates.filter(cand => normalize(cand.text).startsWith(current) || current.startsWith(normalize(cand.text)))
    : currentCandidates
  label.textContent = current
    ? visible.length + ' of ' + currentCandidates.length + ' entries still match'
    : 'Pokédex entries (' + currentCandidates.length + ' game versions, for reference — click to fill)'
  if (!visible.length) {
    el.innerHTML = '<div class="candidates-empty">No entry matches what you\\'ve typed — might be original wording.</div>'
    return
  }
  el.innerHTML = ''
  for (const cand of visible) {
    const div = document.createElement('div')
    div.className = 'candidate' + (normalize(cand.text) === current && current ? ' matched' : '')
    const versions = cand.versions.map(v => v.replace(/-/g, ' ')).join(', ')
    div.innerHTML = '<span>' + cand.text.replace(/</g, '&lt;') + '</span><span class="versions">' + versions + '</span>'
    div.onclick = () => {
      const ta = document.getElementById('flavorText')
      ta.value = cand.text
      ta.focus()
      updateMatch()
      renderCandidates()
    }
    el.appendChild(div)
  }
}

function updateMatch() {
  const current = normalize(document.getElementById('flavorText').value)
  const badge = document.getElementById('matchBadge')
  const hit = current && currentCandidates.find(cand => normalize(cand.text) === current)
  badge.innerHTML = hit
    ? '<span class="match-badge">✓ Matches ' + hit.versions.map(v => v.replace(/-/g, ' ')).join(', ') + '</span>'
    : ''
}

function renderGrid() {
  const grid = document.getElementById('grid')
  grid.innerHTML = ''
  cards.forEach((c, idx) => {
    if (filterActive && matchStatus[c.localId] !== false) return
    const b = document.createElement('button')
    b.textContent = c.localId
    b.className = (c.flavorText ? 'done ' : '') + (idx === i ? 'current' : '')
    b.title = c.name
    b.onclick = () => { i = idx; render() }
    grid.appendChild(b)
  })
}

async function save(advance) {
  const text = document.getElementById('flavorText').value
  cards[i].flavorText = text
  await fetch('/api/flavor-text', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ localId: cards[i].localId, flavorText: text }),
  })
  const current = normalize(text)
  matchStatus[cards[i].localId] = !!(text && currentCandidates.some(cand => normalize(cand.text) === current))
  const next = advance ? findVisibleIndex(i, 1) : null
  if (next !== null) { i = next; render() } else { renderGrid(); if (matchStatusComputed) updateFilterBtn(); document.getElementById('progress').textContent = cards.filter(c => c.flavorText).length + ' / ' + cards.length + ' captioned' }
}

document.getElementById('saveNextBtn').onclick = () => save(true)
document.getElementById('skipBtn').onclick = () => { const next = findVisibleIndex(i, 1); if (next !== null) { i = next; render() } }
document.getElementById('prevBtn').onclick = () => { const prev = findVisibleIndex(i, -1); if (prev !== null) { i = prev; render() } }
document.getElementById('flavorText').addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); save(true) }
})
document.getElementById('flavorText').addEventListener('input', () => { updateMatch(); renderCandidates() })

load()
</script>
</body>
</html>`

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html" })
    res.end(HTML)
    return
  }

  if (url.pathname === "/api/cards" && req.method === "GET") {
    const overlay = await loadOverlay()
    const data = candidates.map((c) => ({
      localId: c.localId,
      number: c.number,
      name: c.name,
      image: c.images?.large,
      flavorText: overlay[c.localId] ?? "",
    }))
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(data))
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
