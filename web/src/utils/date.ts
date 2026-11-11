const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formats an ISO date (YYYY-MM-DD) as "01 de setembro de 2024". */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
