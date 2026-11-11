import { readonly, ref } from 'vue'

export const SEARCH_HISTORY_KEY = 'project-search-history'
export const SEARCH_HISTORY_LIMIT = 5

function sameTerm(a: string, b: string) {
  return a.toLocaleLowerCase() === b.toLocaleLowerCase()
}

function load(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]')
    return Array.isArray(stored)
      ? stored.filter((term): term is string => typeof term === 'string')
      : []
  } catch {
    return []
  }
}

function persist(terms: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(terms))
  } catch {
    // Storage full or blocked (private mode): the history just isn't kept.
  }
}

/** Last searched terms, most recent first, kept in localStorage. */
export function useSearchHistory() {
  const terms = ref<string[]>(load())

  function update(next: string[]) {
    terms.value = next
    persist(next)
  }

  function save(value: string) {
    const term = value.trim()
    if (!term) return

    let next = terms.value
    const latest = next[0]

    // "Proj" then "Projeto": the partial term is replaced instead of kept.
    if (latest && term.toLocaleLowerCase().startsWith(latest.toLocaleLowerCase())) {
      next = next.slice(1)
    }

    update([term, ...next.filter((saved) => !sameTerm(saved, term))].slice(0, SEARCH_HISTORY_LIMIT))
  }

  function remove(value: string) {
    update(terms.value.filter((saved) => !sameTerm(saved, value)))
  }

  return { terms: readonly(terms), save, remove }
}
