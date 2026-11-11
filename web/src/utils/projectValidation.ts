export interface ProjectFormValues {
  name: string
  client: string
  start_date: string
  end_date: string
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>

export const VALIDATION_MESSAGES = {
  name: 'Por favor, digite ao menos duas palavras',
  client: 'Por favor, digite ao menos uma palavra',
  date: 'Selecione uma data válida',
} as const

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

/** True for a real calendar date in the YYYY-MM-DD format a date input produces. */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

/** Mirrors the API rules in Project (name with two words, end date not before start date). */
export function validateProject(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {}

  if (wordCount(values.name) < 2) errors.name = VALIDATION_MESSAGES.name
  if (wordCount(values.client) < 1) errors.client = VALIDATION_MESSAGES.client

  const startValid = isValidDate(values.start_date)
  const endValid = isValidDate(values.end_date)

  if (!startValid) errors.start_date = VALIDATION_MESSAGES.date
  if (!endValid || (startValid && values.end_date < values.start_date)) {
    errors.end_date = VALIDATION_MESSAGES.date
  }

  return errors
}
