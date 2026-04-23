import type { SymbolNodeData } from '../types'

type SymbolLabelProps = {
  nodeData: SymbolNodeData
  baseX: number
  baseY: number
}

export default function SymbolLabel({
  nodeData,
  baseX,
  baseY,
}: SymbolLabelProps) {
  if (!nodeData.label) return null

  const x =
    baseX +
    (typeof nodeData.labelOffsetX === 'number' ? nodeData.labelOffsetX : 0)

  const y =
    baseY +
    (typeof nodeData.labelOffsetY === 'number' ? nodeData.labelOffsetY : 0)

  const fill = nodeData.labelColor ?? '#111'
  const fontSize =
    typeof nodeData.labelSize === 'number' ? nodeData.labelSize : 14

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={fontSize}
      fill={fill}
    >
      {nodeData.label}
    </text>
  )
}