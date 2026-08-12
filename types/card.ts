// Ground truth for data/sets/<CODE>.json's shape. scripts/fetch-set.mjs is
// checked against this (via JSDoc @type casts + `npm run typecheck`) so a
// shape mismatch fails loudly instead of silently writing a malformed set
// file. README.md's schema walkthrough should stay in sync with this file,
// but this file — not the README — is what's actually enforced.

export interface CardSet {
  set: SetMeta
  cards: Card[]
}

export interface SetMeta {
  code: string // this repo's set code, e.g. "MEG" — matches limitlessCode
  ptcgDataId: string // this set's id in pokemon-tcg-data, e.g. "me1"
  name: string
  series: string
  printedTotal: number // cards with localId above this number are secret rares
  secretTotal: number
  total: number
  releaseDate: string // "YYYY-MM-DD"
  copyright: string
  images: SetImages | null
}

export interface SetImages {
  symbol: string
  logo: string
}

export interface Card {
  number: string // exact phrasing printed on the card, e.g. "003/132"
  localId: string // bare number — Limitless/PTCGL URLs and IDs use this
  name: string
  supertype: "Pokémon" | "Trainer"
  subtypes: string[]
  evolvesFrom?: string // Pokémon only, if not Basic
  evolvesTo?: string[] // Pokémon only, if any
  types?: string[] // Pokémon only
  hp?: number // Pokémon only
  rules?: string[] // ex/MEGA rule box, or full Trainer card text
  abilities?: Ability[]
  attacks?: Attack[]
  weaknesses: Weakness[] // Pokémon only, [] otherwise
  resistances: Resistance[] // Pokémon only, [] otherwise
  retreatCost?: number // Pokémon only, energy count
  regulationMark: string | null
  rarity: string // official name, e.g. "Mega Hyper Rare"
  artist: string | null
  pokedex?: Pokedex // only on regular (non-ex/non-MEGA) Pokémon
  flavorText?: string // only on regular (non-ex/non-MEGA) Pokémon — see CLAUDE.md
  secret: boolean // localId > set.printedTotal
  deckCode: string // what you'd type/see in a PTCGL/Limitless decklist
  printGroup: string[] // every printing that's a legal substitute for this
  // card in a decklist — can span other sets on reprints
  limitless: LimitlessInfo
  images?: CardImages
}

export interface Ability {
  name: string
  type: string // e.g. "Ability"
  text: string
}

export interface Attack {
  name: string
  cost: string[]
  convertedEnergyCost: number
  damage: string // "" if none, "50×" / "200+" as printed
  text: string
}

export interface Weakness {
  type: string
  value: string // e.g. "×2"
}

export interface Resistance {
  type: string
  value: string
}

export interface Pokedex {
  number: number // national Pokédex number
  genus: string | null
  height: string // e.g. `3'3"`
  weight: string // e.g. "220.5 lbs"
}

export interface LimitlessInfo {
  id: number | null
  url: string
}

export interface CardImages {
  small: string
  large: string
}

// ---- pokemon-tcg-data's raw shape (input, not output) ---------------------
//
// Minimal — only the fields fetch-set.mjs actually reads from
// https://github.com/PokemonTCG/pokemon-tcg-data. Typing this input, not
// just the Card/CardSet output, is what catches a source field silently
// changing type (e.g. hp becoming a number instead of a numeric string) —
// without it, values copied straight from the untyped API response would
// flow into `card` as `any` and bypass the output checks entirely.

export interface PrimaryCard {
  number: string
  name: string
  supertype: "Pokémon" | "Trainer"
  subtypes?: string[]
  evolvesFrom?: string
  evolvesTo?: string[]
  types?: string[]
  hp?: string // numeric string, e.g. "380" — fetch-set.mjs does Number(primary.hp)
  rules?: string[]
  abilities?: Ability[]
  attacks?: Attack[]
  weaknesses?: Weakness[]
  resistances?: Resistance[]
  convertedRetreatCost?: number
  regulationMark?: string
  rarity: string
  nationalPokedexNumbers?: number[]
  images?: CardImages
  flavorText?: string // populated by pokemon-tcg-data itself for older (e.g. Scarlet & Violet) sets
  artist?: string // used directly only for sets with no Limitless page — see fetch-set.mjs's "NONE" mode
}

export interface PrimarySetMeta {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string // "YYYY/MM/DD" — fetch-set.mjs reformats to "-"
  images?: SetImages
}
