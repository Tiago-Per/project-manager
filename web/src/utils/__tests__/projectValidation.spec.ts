import { describe, expect, it } from 'vitest'

import { validateProject, VALIDATION_MESSAGES } from '../projectValidation'

const valid = {
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
}

describe('validateProject', () => {
  it('accepts valid values', () => {
    expect(validateProject(valid)).toEqual({})
  })

  it('requires at least two words in the name', () => {
    expect(validateProject({ ...valid, name: '  Iridium  ' }).name).toBe(VALIDATION_MESSAGES.name)
    expect(validateProject({ ...valid, name: 'Projeto  Iridium' }).name).toBeUndefined()
  })

  it('requires at least one word in the client', () => {
    expect(validateProject({ ...valid, client: '   ' }).client).toBe(VALIDATION_MESSAGES.client)
  })

  it('requires valid dates', () => {
    const errors = validateProject({ ...valid, start_date: '', end_date: '2024-02-30' })

    expect(errors.start_date).toBe(VALIDATION_MESSAGES.date)
    expect(errors.end_date).toBe(VALIDATION_MESSAGES.date)
  })

  it('rejects an end date before the start date', () => {
    const errors = validateProject({ ...valid, start_date: '2024-12-12', end_date: '2024-12-11' })

    expect(errors.start_date).toBeUndefined()
    expect(errors.end_date).toBe(VALIDATION_MESSAGES.date)
  })

  it('accepts the same start and end date', () => {
    expect(validateProject({ ...valid, end_date: valid.start_date })).toEqual({})
  })
})
