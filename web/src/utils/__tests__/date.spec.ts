import { describe, expect, it } from 'vitest'

import { formatDate } from '../date'

describe('formatDate', () => {
  it('formats an ISO date in pt-BR with the month name', () => {
    expect(formatDate('2024-09-01')).toBe('01 de setembro de 2024')
    expect(formatDate('2024-12-12')).toBe('12 de dezembro de 2024')
  })

  it('does not shift the day for the local time zone', () => {
    expect(formatDate('2025-01-01')).toBe('01 de janeiro de 2025')
  })
})
