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
function speciesName(cardName) {
  return cardName
    .replace(/^.*'s\s+/, '')
    .replace(/^Shining\s+/, '')
    .replace(/^Radiant\s+/, '')
    .replace(/^Special\s+Delivery\s+/, '')
    .replace(/^Light\s+/, '')
    .replace(/^(Paldean|Galarian|Alolan|Hisuian)\s+/, '')
    .replace(/^(Heat|Wash|Frost|Fan|Mow)\s+(?=Rotom)/, '')
    .replace(/^(Teal|Wellspring|Hearthflame|Cornerstone)\s+Mask\s+(?=Ogerpon)/, '')
    .replace(/^Bloodmoon\s+(?=Ursaluna)/, '')
    .replace(/^Castform\s+(Sunny|Rainy|Snowy)\s+Form$/, 'Castform')
    .replace(/^Pikachu\s+with\s+Grey\s+Felt\s+Hat$/, 'Pikachu')
    .replace(/^(Rapid|Single)\s+Strike\s+(?=Urshifu)/, '')
    .replace(/^(Black|White)\s+(?=Kyurem)/, '')
    .replace(/^(Ultra|Dawn\s+Wings|Dusk\s+Mane)\s+(?=Necrozma)/, '')
    .replace(/\s*◇$/, '')
    .replace(/\s+([♀♂])/, '$1')
}

// A card counts as "unmatched" if it's blank, or its saved text isn't a
// verbatim hit against any of its species' Bulbapedia candidates.
async function computeMatch(c) {
  if (!c.flavorText) return false
  const species = speciesName(c.name)
  if (!candidateCache[species]) {
    candidateCache[species] = fetch('/api/flavor-candidates?name=' + encodeURIComponent(species)).then(r => r.json())
  }
  const cands = await candidateCache[species]
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

// Bulbapedia's wikitext and pokemon-tcg-data's own flavorText disagree on
// straight vs curly quotes for the same real text (e.g. "doesn't" vs
// "doesn’t") — treat them as equivalent so that doesn't read as a
// mismatch.
function normalize(s) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\.\.\./g, '…')
    .replace(/−/g, '-')
    .replace(/--/g, '—')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
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
  const species = speciesName(name)
  if (!candidateCache[species]) {
    candidateCache[species] = fetch('/api/flavor-candidates?name=' + encodeURIComponent(species)).then(r => r.json())
  }
  const result = await candidateCache[species]
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
    el.innerHTML = '<div class="candidates-empty">No entry matches what you\'ve typed — might be original wording.</div>'
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
