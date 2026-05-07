export function getSymbolScale(value: unknown): number {
  if (typeof value !== 'number') return 1
  return Math.max(1, Math.min(10, Math.floor(value)))
}

export function s(value: number, scale: number): number {
  return Math.round((value * scale) / 10) * 10
}