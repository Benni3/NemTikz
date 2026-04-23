import { type Node } from '@xyflow/react'
import type { AdderNodeData } from './AdderNode'
import { getAdderGeometry } from './AdderGeometry'
import { formatNum, toTikzPoint } from '../../../export/tikz/coordinateMap'

function point(p: { x: number; y: number }) {
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}

export function exportAdderTikz(node: Node<AdderNodeData>): string {
  const data = (node.data ?? {}) as AdderNodeData
  const rotation = data.rotation ?? 0
  const geometry = getAdderGeometry()

  const x = node.position.x
  const y = node.position.y

  const inAStart = toTikzPoint(x + geometry.inA.x, y + geometry.inA.y)
  const inAEnd = toTikzPoint(x + geometry.inputStubEndX, y + geometry.inA.y)

  const inBStart = toTikzPoint(x + geometry.inB.x, y + geometry.inB.y)
  const inBEnd = toTikzPoint(x + geometry.inputStubEndX, y + geometry.inB.y)

  const outStart = toTikzPoint(x + geometry.outputStubStartX, y + geometry.out.y)
  const outEnd = toTikzPoint(x + geometry.outputStubEndX, y + geometry.out.y)

  const p1 = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyTopY)
  const p2 = toTikzPoint(x + geometry.bodyRightX, y + geometry.bodyMidY - 10)
  const p3 = toTikzPoint(x + geometry.bodyRightX, y + geometry.bodyMidY + 10)
  const p4 = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyBottomY)
  const p5 = toTikzPoint(
    x + geometry.bodyLeftX,
    y + geometry.notchMidY + geometry.notchHalfHeight
  )
  const p6 = toTikzPoint(x + geometry.notchTipX, y + geometry.notchMidY)
  const p7 = toTikzPoint(
    x + geometry.bodyLeftX,
    y + geometry.notchMidY - geometry.notchHalfHeight
  )

  const plusPoint = toTikzPoint(x + geometry.plusX, y + geometry.plusY)
  const center = toTikzPoint(x + geometry.centerX, y + geometry.centerY)

  const lines = [
    `\\draw ${point(inAStart)} -- ${point(inAEnd)};`,
    `\\draw ${point(inBStart)} -- ${point(inBEnd)};`,
    `\\draw ${point(outStart)} -- ${point(outEnd)};`,
    `\\draw ${point(p1)} -- ${point(p2)} -- ${point(p3)} -- ${point(p4)} -- ${point(p5)} -- ${point(p6)} -- ${point(p7)} -- cycle;`,
    `\\node at ${point(plusPoint)} {\\Large $+$};`,
  ]

  if (rotation === 0) {
    return [`% ADDER ${node.id}`, ...lines].join('\n')
  }

  return [
    `% ADDER ${node.id}`,
    `\\begin{scope}[rotate around={${rotation}:${point(center)}}]`,
    ...lines,
    `\\end{scope}`,
  ].join('\n')
}