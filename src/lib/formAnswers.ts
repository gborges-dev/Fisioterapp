export function parseMultiselectAnswer(raw: string): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string')
    }
  } catch {
    /* valor legado ou texto simples */
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serializeMultiselectAnswer(values: string[]): string {
  return JSON.stringify(values)
}

export function formatMultiselectDisplay(raw: string): string {
  return parseMultiselectAnswer(raw).join(', ')
}
