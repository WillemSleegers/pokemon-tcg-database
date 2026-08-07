// A card's stored `printGroup` (types/card.ts) is a snapshot of Limitless's
// prints table from whenever that card's set was fetched — it only knows
// about reprints that existed *at that time*. If a later set reprints the
// card, that new card's own snapshot will correctly include the old one
// (Limitless always shows the full history), but the old card's stored
// array doesn't retroactively gain the new one.
//
// Rather than editing old sets' files whenever a new set is added, treat
// every card's stored printGroup as one edge-list in a graph and derive the
// real group as its connected component: union a card's deckCode with every
// code in its own stored array, across every set. As long as *some* member
// of a group has the up-to-date list — which the most recently fetched
// member always does — the union recovers the full group even for members
// whose own stored array is stale. This is what makes staleness safe to
// ignore: nothing needs to depend on any single card's copy being current.

class UnionFind {
  #parent = new Map()

  find(code) {
    if (!this.#parent.has(code)) this.#parent.set(code, code)
    let root = code
    while (this.#parent.get(root) !== root) root = this.#parent.get(root)
    while (this.#parent.get(code) !== root) {
      const next = this.#parent.get(code)
      this.#parent.set(code, root)
      code = next
    }
    return root
  }

  union(a, b) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.#parent.set(rootA, rootB)
  }

  keys() {
    return this.#parent.keys()
  }
}

function compareDeckCodes(a, b) {
  const [setA, idA] = a.split(" ")
  const [setB, idB] = b.split(" ")
  if (setA !== setB) return setA.localeCompare(setB)
  return idA.localeCompare(idB, undefined, { numeric: true })
}

/**
 * @param {import("../../types/card.js").CardSet[]} sets
 * @returns {Map<string, string[]>} deckCode -> up-to-date printGroup
 */
export function computePrintGroups(sets) {
  const uf = new UnionFind()

  for (const set of sets) {
    for (const card of set.cards) {
      uf.find(card.deckCode)
      for (const other of card.printGroup) uf.union(card.deckCode, other)
    }
  }

  const members = new Map()
  for (const code of uf.keys()) {
    const root = uf.find(code)
    if (!members.has(root)) members.set(root, [])
    members.get(root).push(code)
  }

  const result = new Map()
  for (const codes of members.values()) {
    const sorted = [...codes].sort(compareDeckCodes)
    for (const code of codes) result.set(code, sorted)
  }
  return result
}
