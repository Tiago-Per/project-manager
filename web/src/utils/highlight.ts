export interface TextSegment {
  text: string
  match: boolean
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Splits `text` into segments, flagging every case-insensitive occurrence of `query`. */
export function splitByMatch(text: string, query: string): TextSegment[] {
  const term = query.trim()
  if (!term) return [{ text, match: false }]

  // A capture group keeps the matches in the result, at the odd indexes.
  return text
    .split(new RegExp(`(${escapeRegExp(term)})`, 'gi'))
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((segment) => segment.text !== '')
}
