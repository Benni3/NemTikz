import type { SymbolNodeData } from '../types'

export type ResolvedSymbolStyle = {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  labelColor: string
  labelSize: number
  labelOffsetX: number
  labelOffsetY: number
}

export function getSymbolStyle(data: SymbolNodeData): ResolvedSymbolStyle {
  return {
    strokeColor: data.strokeColor ?? '#111111',
    fillColor: data.fillColor ?? '#ffffff',
    strokeWidth: data.strokeWidth ?? 2,

    labelColor: data.labelColor ?? '#111111',
    labelSize: data.labelSize ?? 14,
    labelOffsetX: data.labelOffsetX ?? 0,
    labelOffsetY: data.labelOffsetY ?? 0,
  }
}