let sets = []
let setCode = '{{DEFAULT_SET}}'
let cards = []
let i = 0

async function load() {
  sets = await (await fetch('/api/sets')).json()
  const select = document.getElementById('setSelect')
  select.innerHTML = sets.map((s) => '<option value="' + s.code + '">' + s.name + ' (' + s.code + ')</option>').join('')

  const requested = new URLSearchParams(location.search).get('set')
  setCode = sets.some((s) => s.code === requested) ? requested : setCode
  select.value = setCode

  select.onchange = () => selectSet(select.value)
  await loadCards()
}

async function selectSet(code) {
  setCode = code
  i = 0
  history.replaceState(null, '', '?set=' + encodeURIComponent(code))
  await loadCards()
}

async function loadCards() {
  cards = await (await fetch('/api/cards?set=' + encodeURIComponent(setCode))).json()
  const setName = sets.find((s) => s.code === setCode)?.name ?? setCode
  document.title = 'Card data — ' + setName
  render()
}

// "evolvesFrom" -> "Evolves From". Not perfect for acronyms (hp -> "Hp"),
// but this is a debugging view, not user-facing copy.
function humanize(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

// Short strings (types, subtypes, print-group codes, ...) read fine as
// pills. Long ones (rule-box text, attack/ability text) need to stay on
// their own line to be readable, so arrays of those render as a stacked
// list instead of chips.
const CHIP_MAX_LENGTH = 24

function renderPrimitive(value) {
  if (typeof value === 'boolean') {
    const span = document.createElement('span')
    span.className = value ? 'bool-true' : 'bool-false'
    span.textContent = String(value)
    return span
  }
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    const a = document.createElement('a')
    a.href = value
    a.target = '_blank'
    a.rel = 'noopener'
    a.className = 'field-link'
    a.textContent = value
    return a
  }
  const span = document.createElement('span')
  span.textContent = String(value)
  return span
}

function emptyDD() {
  const dd = document.createElement('dd')
  dd.className = 'empty'
  dd.textContent = '—'
  return dd
}

// Renders any field value (primitive, array, or nested object) as a <dd>,
// recursing into objects/arrays so nothing in the JSON is left undisplayed
// — the whole point of this tool is to show everything we extracted.
function renderValue(value) {
  if (value === null || value === undefined || value === '') return emptyDD()

  if (Array.isArray(value)) {
    if (value.length === 0) return emptyDD()

    const isObjectArray = value.some((v) => isPlainObject(v) || Array.isArray(v))
    const dd = document.createElement('dd')

    if (isObjectArray) {
      const group = document.createElement('div')
      group.className = 'item-group'
      for (const item of value) {
        const itemCard = document.createElement('div')
        itemCard.className = 'item-card'
        itemCard.appendChild(renderObjectDl(item))
        group.appendChild(itemCard)
      }
      dd.appendChild(group)
      return dd
    }

    const allShort = value.every((v) => typeof v !== 'string' || v.length <= CHIP_MAX_LENGTH)
    const wrap = document.createElement('div')
    wrap.className = allShort ? 'chip-list' : 'text-list'
    for (const v of value) {
      const item = document.createElement(allShort ? 'span' : 'div')
      item.className = allShort ? 'chip' : 'text-item'
      item.textContent = String(v)
      wrap.appendChild(item)
    }
    dd.appendChild(wrap)
    return dd
  }

  if (isPlainObject(value)) {
    const dd = document.createElement('dd')
    dd.appendChild(renderObjectDl(value))
    return dd
  }

  const dd = document.createElement('dd')
  dd.appendChild(renderPrimitive(value))
  return dd
}

function renderObjectDl(obj) {
  const dl = document.createElement('dl')
  dl.className = 'nested-list'
  for (const [key, val] of Object.entries(obj)) {
    const dt = document.createElement('dt')
    dt.textContent = humanize(key)
    dl.appendChild(dt)
    dl.appendChild(renderValue(val))
  }
  return dl
}

function renderFields(card) {
  const dl = document.getElementById('fields')
  dl.innerHTML = ''
  for (const [key, val] of Object.entries(card)) {
    if (key === 'image') continue // synthetic — only used for the <img> src, not part of the schema
    const dt = document.createElement('dt')
    dt.textContent = humanize(key)
    dl.appendChild(dt)
    dl.appendChild(renderValue(val))
  }
}

function render() {
  const c = cards[i]
  document.getElementById('cardImage').src = c.image
  document.getElementById('cardName').textContent = c.name
  document.getElementById('cardNumber').textContent = c.number
  document.getElementById('position').textContent = (i + 1) + ' / ' + cards.length
  document.getElementById('prevBtn').disabled = i === 0
  document.getElementById('nextBtn').disabled = i === cards.length - 1
  renderFields(c)
  renderGrid()
}

function renderGrid() {
  const grid = document.getElementById('grid')
  grid.innerHTML = ''
  cards.forEach((c, idx) => {
    const b = document.createElement('button')
    b.textContent = c.localId
    b.className = idx === i ? 'current' : ''
    b.title = c.name
    b.onclick = () => { i = idx; render() }
    grid.appendChild(b)
  })
}

function goto(idx) {
  if (idx < 0 || idx >= cards.length) return
  i = idx
  render()
}

document.getElementById('prevBtn').onclick = () => goto(i - 1)
document.getElementById('nextBtn').onclick = () => goto(i + 1)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') goto(i - 1)
  if (e.key === 'ArrowRight') goto(i + 1)
})

load()
