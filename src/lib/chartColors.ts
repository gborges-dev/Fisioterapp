export function getChartColor(index: 1 | 2 | 3 | 4 | 5): string {
  if (typeof document === 'undefined') {
    const fallbacks: Record<number, string> = {
      1: '#0f5f5a',
      2: '#2b6e45',
      3: '#4a7c9b',
      4: '#c99a2e',
      5: '#b4502b',
    }
    return fallbacks[index]
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--chart-${index}`)
    .trim()
}
