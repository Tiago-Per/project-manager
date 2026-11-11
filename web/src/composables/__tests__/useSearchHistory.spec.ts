import { beforeEach, describe, expect, it } from 'vitest'

import { SEARCH_HISTORY_KEY, useSearchHistory } from '../useSearchHistory'

beforeEach(() => localStorage.clear())

describe('useSearchHistory', () => {
  it('keeps the most recent term first and persists it', () => {
    const history = useSearchHistory()

    history.save('Alpha')
    history.save('Beta')

    expect(history.terms.value).toEqual(['Beta', 'Alpha'])
    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)!)).toEqual(['Beta', 'Alpha'])
    expect(useSearchHistory().terms.value).toEqual(['Beta', 'Alpha'])
  })

  it('keeps only the last 5 terms', () => {
    const history = useSearchHistory()

    for (const term of ['Um', 'Dois', 'Tres', 'Quatro', 'Cinco', 'Seis']) history.save(term)

    expect(history.terms.value).toEqual(['Seis', 'Cinco', 'Quatro', 'Tres', 'Dois'])
  })

  it('moves a repeated term to the top instead of duplicating it', () => {
    const history = useSearchHistory()

    history.save('Alpha')
    history.save('Beta')
    history.save('alpha')

    expect(history.terms.value).toEqual(['alpha', 'Beta'])
  })

  it('replaces the latest term when the new one extends it', () => {
    const history = useSearchHistory()

    history.save('Site')
    history.save('Proj')
    history.save('Projeto')
    history.save('Projeto 01')

    expect(history.terms.value).toEqual(['Projeto 01', 'Site'])
  })

  it('only replaces the latest term, not older ones', () => {
    const history = useSearchHistory()

    history.save('Proj')
    history.save('Site')
    history.save('Projeto')

    expect(history.terms.value).toEqual(['Projeto', 'Site', 'Proj'])
  })

  it('trims terms and ignores blank ones', () => {
    const history = useSearchHistory()

    history.save('  Projeto  ')
    history.save('   ')

    expect(history.terms.value).toEqual(['Projeto'])
  })

  it('removes a term', () => {
    const history = useSearchHistory()
    history.save('Alpha')
    history.save('Beta')

    history.remove('Alpha')

    expect(history.terms.value).toEqual(['Beta'])
    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)!)).toEqual(['Beta'])
  })

  it('ignores invalid stored data', () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, '{broken')
    expect(useSearchHistory().terms.value).toEqual([])

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Ok', 3, null]))
    expect(useSearchHistory().terms.value).toEqual(['Ok'])
  })
})
