export function getChartColor(index: 1 | 2 | 3 | 4 | 5): string {
  if (typeof document === 'undefined') {
    const fallbacks: Record<number, string> = {
      1: 'oklch(0.58 0.11 190)',
      2: 'oklch(0.65 0.14 160)',
      3: 'oklch(0.55 0.12 240)',
      4: 'oklch(0.75 0.15 80)',
      5: 'oklch(0.65 0.18 25)',
    }
    return fallbacks[index]
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--chart-${index}`)
    .trim()
}
