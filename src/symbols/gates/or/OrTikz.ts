import { type Node } from '@xyflow/react'
import type { OrNodeData } from './OrNode'
import { getOrGeometry, type PinPoint } from './OrGeometry'
import { formatNum, toTikzPoint } from '../../../export/tikz/coordinateMap'
import { escapeTikz } from '../../../export/tikz/escapeTikz'

function point(p: { x: number; y: number }) {
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}

export function exportOrTikz(node: Node<OrNodeData>): string {
  const data = (node.data ?? {}) as OrNodeData
  const inputCount = data.inputCount ?? 2
  const rotation = data.rotation ?? 0
  const geometry = getOrGeometry(inputCount)

  const x = node.position.x
  const y = node.position.y

  const inputLines = geometry.inputPins.map((pin: PinPoint, index: number) => {
    const start = toTikzPoint(x + pin.x, y + pin.y)
    const end = toTikzPoint(x + geometry.inputStubEndX, y + pin.y)
    return `\\draw ${point(start)} -- ${point(end)}; % in${index + 1}`
  })

  const outStart = toTikzPoint(
    x + geometry.outputStubStartX,
    y + geometry.out.y
  )
  const outEnd = toTikzPoint(
    x + geometry.outputStubEndX,
    y + geometry.out.y
  )

  const pTop = toTikzPoint(x + geometry.bodyStartX, y + geometry.bodyTopY)
  const pFront = toTikzPoint(x + geometry.bodyFrontX, y + geometry.bodyMidY)
  const pBottom = toTikzPoint(x + geometry.bodyStartX, y + geometry.bodyBottomY)

  const cTop1 = toTikzPoint(x + geometry.bodyTopControlX, y + geometry.bodyTopY)
  const cTop2 = toTikzPoint(
    x + geometry.bodyFrontControlX,
    y + geometry.bodyMidY - 6
  )

  const cBottom1 = toTikzPoint(
    x + geometry.bodyFrontControlX,
    y + geometry.bodyMidY + 6
  )
  const cBottom2 = toTikzPoint(
    x + geometry.bodyBottomControlX,
    y + geometry.bodyBottomY
  )

  const cBack1 = toTikzPoint(
    x + geometry.bodyBackControlX1,
    y + geometry.bodyBottomY - 10
  )
  const cBack2 = toTikzPoint(
    x + geometry.bodyBackControlX2,
    y + geometry.bodyTopY + 10
  )

  const center = toTikzPoint(
    x + geometry.centerX,
    y + geometry.centerY
  )

  const labelPoint = toTikzPoint(x + geometry.labelX, y + geometry.labelY)
  const label = data.label

  const lines = [
    ...inputLines,
    `\\draw ${point(outStart)} -- ${point(outEnd)};`,
    `\\draw ${point(pTop)} .. controls ${point(cTop1)} and ${point(cTop2)} .. ${point(pFront)} .. controls ${point(cBottom1)} and ${point(cBottom2)} .. ${point(pBottom)} .. controls ${point(cBack1)} and ${point(cBack2)} .. ${point(pTop)};`,
    ...(label ? [`\\node at ${point(labelPoint)} {${escapeTikz(label)}};`] : []),
  ]

  if (rotation === 0) {
    return [`% OR gate ${node.id}`, ...lines].join('\n')
  }

  return [
    `% OR gate ${node.id}`,
    `\\begin{scope}[rotate around={${rotation}:${point(center)}}]`,
    ...lines,
    `\\end{scope}`,
  ].join('\n')
}