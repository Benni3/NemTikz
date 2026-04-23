import { type Node } from '@xyflow/react'
import type { BufferNodeData } from './BufferNode'
import { getBufferGeometry } from './BufferGeometry'
import { formatNum, toTikzPoint } from '../../../export/tikz/coordinateMap'

function point(p: { x: number; y: number }) {
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}

export function exportBufferTikz(node: Node<BufferNodeData>): string {
  const data = (node.data ?? {}) as BufferNodeData
  const rotation = data.rotation ?? 0

  const geometry = getBufferGeometry()

  const x = node.position.x
  const y = node.position.y

  const inStart = toTikzPoint(x + geometry.in.x, y + geometry.in.y)
  const inEnd = toTikzPoint(x + geometry.inputStubEndX, y + geometry.in.y)

  const outStart = toTikzPoint(x + geometry.outputStubStartX, y + geometry.out.y)
  const outEnd = toTikzPoint(x + geometry.outputStubEndX, y + geometry.out.y)

  const pTop = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyTopY)
  const pBottom = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyBottomY)
  const pFront = toTikzPoint(x + geometry.bodyRightX, y + geometry.bodyMidY)

  const center = toTikzPoint(
    x + geometry.centerX,
    y + geometry.centerY
  )

  const lines = [
    `\\draw ${point(inStart)} -- ${point(inEnd)};`,
    `\\draw ${point(outStart)} -- ${point(outEnd)};`,
    `\\draw ${point(pTop)} -- ${point(pBottom)} -- ${point(pFront)} -- cycle;`,
  ]

  if (rotation === 0) {
    return [`% BUFFER ${node.id}`, ...lines].join('\n')
  }

  return [
    `% BUFFER ${node.id}`,
    `\\begin{scope}[rotate around={${rotation}:${point(center)}}]`,
    ...lines,
    `\\end{scope}`,
  ].join('\n')
}