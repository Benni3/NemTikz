import { type Node } from '@xyflow/react'
import type { RegisterNodeData } from './RegisterNode'
import { getRegisterGeometry } from './RegisterGeometry'
import { formatNum, toTikzPoint } from '../../../export/tikz/coordinateMap'

function point(p: { x: number; y: number }) {
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}

export function exportRegisterTikz(node: Node<RegisterNodeData>): string {
  const data = (node.data ?? {}) as RegisterNodeData
  const rotation = data.rotation ?? 0
  const geometry = getRegisterGeometry()

  const x = node.position.x
  const y = node.position.y

  const dStart = toTikzPoint(x + geometry.dIn.x, y + geometry.dIn.y)
  const dEnd = toTikzPoint(x + geometry.inputStubEndX, y + geometry.dIn.y)

  const clkStart = toTikzPoint(x + geometry.clkIn.x, y + geometry.clkIn.y)
  const clkEnd = toTikzPoint(x + geometry.inputStubEndX, y + geometry.clkIn.y)

  const qStart = toTikzPoint(x + geometry.outputStubStartX, y + geometry.qOut.y)
  const qEnd = toTikzPoint(x + geometry.outputStubEndX, y + geometry.qOut.y)

  const bStart = toTikzPoint(x + geometry.bottomPin.x, y + geometry.bottomStubStartY)
  const bEnd = toTikzPoint(x + geometry.bottomPin.x, y + geometry.bottomStubEndY)

  const rectTopLeft = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyTopY)
  const rectBottomRight = toTikzPoint(x + geometry.bodyRightX, y + geometry.bodyBottomY)

  const c1 = toTikzPoint(
    x + geometry.clockTriX,
    y + geometry.clockTriY - geometry.clockTriHeight / 2
  )
  const c2 = toTikzPoint(
    x + geometry.clockTriX + geometry.clockTriWidth,
    y + geometry.clockTriY
  )
  const c3 = toTikzPoint(
    x + geometry.clockTriX,
    y + geometry.clockTriY + geometry.clockTriHeight / 2
  )

  const dLabel = toTikzPoint(x + geometry.dLabelX, y + geometry.dLabelY)
  const qLabel = toTikzPoint(x + geometry.qLabelX, y + geometry.qLabelY)
  const center = toTikzPoint(x + geometry.centerX, y + geometry.centerY)

  const lines = [
    `\\draw ${point(dStart)} -- ${point(dEnd)};`,
    `\\draw ${point(clkStart)} -- ${point(clkEnd)};`,
    `\\draw ${point(qStart)} -- ${point(qEnd)};`,
    `\\draw ${point(bStart)} -- ${point(bEnd)};`,
    `\\draw ${point(rectTopLeft)} rectangle ${point(rectBottomRight)};`,
    `\\draw ${point(c1)} -- ${point(c2)} -- ${point(c3)};`,
    `\\node at ${point(dLabel)} {$D$};`,
    `\\node at ${point(qLabel)} {$Q$};`,
  ]

  if (rotation === 0) {
    return [`% REGISTER ${node.id}`, ...lines].join('\n')
  }

  return [
    `% REGISTER ${node.id}`,
    `\\begin{scope}[rotate around={${rotation}:${point(center)}}]`,
    ...lines,
    `\\end{scope}`,
  ].join('\n')
}