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
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { ensureCachedImage } from "./lib/image-cache.mjs"
import { fetchFlavorCandidates } from "./lib/bulbapedia.mjs"

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
      const filePath = await ensureCachedImage(IMAGE_CACHE_DIR, localId, card.images.large)
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
