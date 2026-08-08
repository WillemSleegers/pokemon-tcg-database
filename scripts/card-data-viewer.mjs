// A tiny local tool for eyeballing a card image next to every field we've
// extracted for it, to verify the pipeline (fetch-set.mjs + the flavor-text
// overlay) actually captured everything printed on the card.
//
//   node scripts/card-data-viewer.mjs [SET_CODE]
//
// SET_CODE just picks the initial set shown — switch sets from the dropdown
// in the browser without restarting the server. Read-only — unlike
// flavor-text-editor.mjs, there's nothing to save here.

import { createServer } from "node:http"
import { createReadStream } from "node:fs"
import { mkdir, readdir, readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { ensureCachedImage } from "./lib/image-cache.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PORT = 5174
const VIEWER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "card-data-viewer")
const SETS_DIR = resolve(ROOT, "data/sets")

const requestedCode = process.argv[2]

// Loaded set files are cached in memory for the life of the process — this
// is a short-lived local dev server, not something left running across a
// data edit, so there's no need to watch data/sets/ for changes.
const setCache = new Map()

async function loadSet(code) {
  if (setCache.has(code)) return setCache.get(code)
  const setData = JSON.parse(await readFile(resolve(SETS_DIR, `${code}.json`), "utf8"))
  setCache.set(code, setData)
  return setData
}

async function listSets() {
  const files = (await readdir(SETS_DIR)).filter((f) => f.endsWith(".json"))
  const sets = await Promise.all(
    files.map(async (f) => {
      const { set } = await loadSet(f.slice(0, -".json".length))
      return { code: set.code, name: set.name, releaseDate: set.releaseDate }
    })
  )
  return sets.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
}

const allSets = await listSets()
if (!allSets.length) {
  console.error(`No sets found in ${SETS_DIR} — run fetch-set.mjs first.`)
  process.exit(1)
}
if (requestedCode && !allSets.some((s) => s.code === requestedCode)) {
  console.error(`Unknown set "${requestedCode}" — have: ${allSets.map((s) => s.code).join(", ")}`)
  process.exit(1)
}
// Default to the most recently released set — most likely to be what's
// actively being worked on.
const defaultCode = requestedCode ?? allSets[allSets.length - 1].code

async function imageCacheDir(code) {
  const dir = resolve(ROOT, ".local/card-images", code)
  await mkdir(dir, { recursive: true })
  return dir
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html" })
    createReadStream(resolve(VIEWER_DIR, "index.html")).pipe(res)
    return
  }

  if (url.pathname === "/style.css") {
    res.writeHead(200, { "content-type": "text/css" })
    createReadStream(resolve(VIEWER_DIR, "style.css")).pipe(res)
    return
  }

  if (url.pathname === "/client.js") {
    const html = (await readFile(resolve(VIEWER_DIR, "client.js"), "utf8")).replaceAll(
      "{{DEFAULT_SET}}",
      defaultCode
    )
    res.writeHead(200, { "content-type": "text/javascript" })
    res.end(html)
    return
  }

  if (url.pathname === "/api/sets" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(allSets))
    return
  }

  if (url.pathname === "/api/cards" && req.method === "GET") {
    const code = url.searchParams.get("set")
    if (!code || !allSets.some((s) => s.code === code)) {
      res.writeHead(400)
      res.end("unknown or missing ?set=")
      return
    }
    const setData = await loadSet(code)
    // The full card objects, as-is — this tool's whole point is to show
    // every field we have, so unlike flavor-text-editor it doesn't project
    // down to a curated subset.
    const data = setData.cards.map((c) => ({ ...c, image: `/card-image/${code}/${c.localId}` }))
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(data))
    return
  }

  const imageMatch = url.pathname.match(/^\/card-image\/([^/]+)\/([^/]+)$/)
  if (imageMatch && req.method === "GET") {
    const [, code, localId] = imageMatch
    if (!allSets.some((s) => s.code === code)) {
      res.writeHead(404)
      res.end("not found")
      return
    }
    const setData = await loadSet(code)
    const card = setData.cards.find((c) => c.localId === localId)
    if (!card?.images?.large) {
      res.writeHead(404)
      res.end("not found")
      return
    }
    try {
      const filePath = await ensureCachedImage(await imageCacheDir(code), localId, card.images.large)
      const contentType = filePath.endsWith(".jpg") ? "image/jpeg" : "image/png"
      res.writeHead(200, { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" })
      createReadStream(filePath).pipe(res)
    } catch (err) {
      res.writeHead(502)
      res.end(String(err))
    }
    return
  }

  res.writeHead(404)
  res.end("not found")
})

server.listen(PORT, () => {
  console.log(`${allSets.length} sets available, starting on ${defaultCode}.`)
  console.log(`Card data viewer running at http://localhost:${PORT}`)
})
