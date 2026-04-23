import { type Node } from '@xyflow/react'
import { getAndGeometry, type AndNodeData, type PinPoint } from './AndNode'
import { formatNum, toTikzPoint } from '../../../export/tikz/coordinateMap'
import { escapeTikz } from '../../../export/tikz/escapeTikz'

function point(p: { x: number; y: number }) {
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}

export function exportAndTikz(node: Node<AndNodeData>): string {
  const data = (node.data ?? {}) as AndNodeData
  const inputCount = data.inputCount ?? 2
  const rotation = data.rotation ?? 0
  const geometry = getAndGeometry(inputCount)

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

  const bodyLeftTop = toTikzPoint(
    x + geometry.bodyLeftX,
    y + geometry.bodyTopY
  )
  const bodyLeftBottom = toTikzPoint(
    x + geometry.bodyLeftX,
    y + geometry.bodyBottomY
  )
  const bodyRightBottom = toTikzPoint(
    x + geometry.bodyRightStartX,
    y + geometry.bodyBottomY
  )

  const center = toTikzPoint(
    x + geometry.centerX,
    y + geometry.centerY
  )

  const radius = (geometry.bodyRadius / 20) * 0.5
  const labelPoint = toTikzPoint(x + geometry.labelX, y + geometry.labelY)
  const label = data.label

  const lines = [
    ...inputLines,
    `\\draw ${point(outStart)} -- ${point(outEnd)};`,
    `\\draw ${point(bodyLeftTop)} -- ${point(bodyLeftBottom)} -- ${point(bodyRightBottom)} arc[start angle=-90,end angle=90,x radius=${formatNum(radius)},y radius=${formatNum(radius)}] -- ${point(bodyLeftTop)};`,
    ...(label ? [`\\node at ${point(labelPoint)} {${escapeTikz(label)}};`] : []),
  ]

  if (rotation === 0) {
    return [`% AND gate ${node.id}`, ...lines].join('\n')
  }

  return [
    `% AND gate ${node.id}`,
    `\\begin{scope}[rotate around={${rotation}:${point(center)}}]`,
    ...lines,
    `\\end{scope}`,
  ].join('\n')
}