// Card images are large and never change once printed, so every tool that
// pages through a set's images (flavor-text-editor.mjs, card-data-viewer.mjs)
// caches them on disk (gitignored — see .gitignore) under
// .local/card-images/<CODE>/ instead of re-fetching from images.pokemontcg.io
// on every page load.

import { stat, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

export function extFromUrl(url) {
  return /\.jpe?g(?:$|\?)/i.test(url) ? "jpg" : "png"
}

export async function ensureCachedImage(cacheDir, localId, remoteUrl) {
  const filePath = resolve(cacheDir, `${localId}.${extFromUrl(remoteUrl)}`)
  try {
    await stat(filePath)
  } catch {
    const res = await fetch(remoteUrl)
    if (!res.ok) throw new Error(`Failed to fetch image: ${remoteUrl}`)
    await writeFile(filePath, Buffer.from(await res.arrayBuffer()))
  }
  return filePath
}
