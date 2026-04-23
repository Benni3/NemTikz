import { type Node } from '@xyflow/react'
import type { InvertNodeData } from './InvertNode'
import { getInvertGeometry } from './InvertGeometry'
import { formatNum, toTikzPoint } from '../../../export/tikz/coordinateMap'

export type InlineInvertTikzItem = {
  id: string
  point: {
    x: number
    y: number
  }
}

function point(p: { x: number; y: number }) {
  return `(${formatNum(p.x)}, ${formatNum(p.y)})`
}

function bubbleRadiusToTikz(radius: number) {
  return formatNum((radius / 20) * 0.5)
}

export function exportInvertTikz(node: Node<InvertNodeData>): string {
  const data = (node.data ?? {}) as InvertNodeData
  const rotation = data.rotation ?? 0
  const geometry = getInvertGeometry()

  const x = node.position.x
  const y = node.position.y

  const inStart = toTikzPoint(x + geometry.in.x, y + geometry.in.y)
  const inEnd = toTikzPoint(x + geometry.inputStubEndX, y + geometry.in.y)

  const pTop = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyTopY)
  const pBottom = toTikzPoint(x + geometry.bodyLeftX, y + geometry.bodyBottomY)
  const pFront = toTikzPoint(x + geometry.bodyRightX, y + geometry.bodyMidY)

  const bubbleCenter = toTikzPoint(
    x + geometry.bubbleCenterX,
    y + geometry.bubbleCenterY
  )
  const bubbleRadius = bubbleRadiusToTikz(geometry.bubbleRadius)

  const outStart = toTikzPoint(x + geometry.outputLineStartX, y + geometry.out.y)
  const outEnd = toTikzPoint(x + geometry.outputLineEndX, y + geometry.out.y)

  const center = toTikzPoint(
    x + geometry.centerX,
    y + geometry.centerY
  )

  const lines = [
    `\\draw ${point(inStart)} -- ${point(inEnd)};`,
    `\\draw ${point(pTop)} -- ${point(pBottom)} -- ${point(pFront)} -- cycle;`,
    `\\draw[fill=white] ${point(bubbleCenter)} circle (${bubbleRadius});`,
    `\\draw ${point(outStart)} -- ${point(outEnd)};`,
  ]

  if (rotation === 0) {
    return [`% INVERT ${node.id}`, ...lines].join('\n')
  }

  return [
    `% INVERT ${node.id}`,
    `\\begin{scope}[rotate around={${rotation}:${point(center)}}]`,
    ...lines,
    `\\end{scope}`,
  ].join('\n')
}

export function exportInlineInvertTikz(
  inlineInvert: InlineInvertTikzItem,
  bubbleRadius = 4
): string {
  const center = toTikzPoint(inlineInvert.point.x, inlineInvert.point.y)
  const radius = bubbleRadiusToTikz(bubbleRadius)

  return [
    `% INLINE INVERT ${inlineInvert.id}`,
    `\\draw[fill=white] ${point(center)} circle (${radius});`,
  ].join('\n')
}

export function exportInlineInvertsTikz(
  inlineInverts: InlineInvertTikzItem[],
  bubbleRadius = 4
): string {
  return inlineInverts
    .map((inlineInvert) => exportInlineInvertTikz(inlineInvert, bubbleRadius))
    .join('\n')
}