// Client-side only "tracking" — no accounts, no push notifications yet. Saves a filter
// combination in localStorage and remembers which project links have already been seen,
// so we can badge how many are new since the last visit.

import type { EgpPhayaoParams } from './api'

export interface SavedSearch {
  id: string
  name: string
  filters: EgpPhayaoParams
  seenLinks: string[]
}

const STORAGE_KEY = 'egp_phayao_saved_searches'

function readAll(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedSearch[]) : []
  } catch {
    return []
  }
}

function writeAll(searches: SavedSearch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
}

export function listSavedSearches(): SavedSearch[] {
  return readAll()
}

export function saveSearch(name: string, filters: EgpPhayaoParams): SavedSearch {
  const search: SavedSearch = {
    id: crypto.randomUUID(),
    name,
    filters,
    seenLinks: [],
  }
  writeAll([...readAll(), search])
  return search
}

export function removeSavedSearch(id: string) {
  writeAll(readAll().filter((s) => s.id !== id))
}

// Marks every currently-visible project link as seen for this saved search.
export function markSeen(id: string, links: string[]) {
  const searches = readAll()
  const search = searches.find((s) => s.id === id)
  if (!search) return
  search.seenLinks = Array.from(new Set([...search.seenLinks, ...links]))
  writeAll(searches)
}

// Counts links not yet marked as seen for this saved search.
export function countNew(search: SavedSearch, currentLinks: string[]): number {
  const seen = new Set(search.seenLinks)
  return currentLinks.filter((link) => !seen.has(link)).length
}
